/* autoresearch opening scene drawing — a hand-drawn bedroom at night: the
 * person sleeps, a small robot types at the computer, and a magnified view of
 * the screen counts experiments 1 → 83 next to a chart of the running best.
 * State comes from IntroModel.stateAt(t); this file only draws it.
 *
 * Layers:
 *   illustration  four pencil drawings (GPT, see explain-src/autoresearch/
 *                 illustrations/intro-night.md): night and morning, each in a
 *                 light and a dark version. CSS shows the pair for the current
 *                 theme; morning fades in at dawn. Nothing in them must be read.
 *   on the image  the tiny screen (experiment number, a pulse while busy),
 *                 the Zzz over the sleeper, the clock tag.
 *   zoom panel    "screen, magnified": counter, steps of the first runs, chart.
 * Every drawing has the screen at the same pixels (x 1295–1481, y 428–545 of
 * 1672×941, within 2 px), so one overlay fits all four.
 * Colors are CSS variables set via style=. The panel and the clock use the
 * --term-* colors, which stay dark in both themes. Two layouts: landscape
 * 1200×675 and portrait 540×900 (svg narrower than 780px). */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var M = window.IntroModel;
  var D = window.ExplainDraw;
  var tag = D.tag, lerp = D.lerp, fmt = D.fmt, Painter = D.Painter;

  // the drawings sit next to this script
  var here = (document.currentScript && document.currentScript.src) || '';
  function asset(name) { try { return new URL(name, here).href; } catch (e) { return name; } }
  var IMG = {
    night: { light: asset('intro-night.webp'), dark: asset('intro-night-dark.webp') },
    morning: { light: asset('intro-morning.webp'), dark: asset('intro-morning-dark.webp') }
  };
  var SRC_W = 1672, SRC_H = 941;
  var SCREEN = { x0: 1295, x1: 1481, y0: 429, y1: 545 };   // in drawing pixels
  var SLEEPER = { x: 318, y: 500 };                        // the sleeper's head, drawing pixels

  var GEO = {
    landscape: {
      W: 1200, H: 675, minFont: 13,
      img: { x: 0, y: 0, w: 1200, h: 675 },
      clock: { x: 24, y: 22, w: 122, h: 46, size: 22 },
      panel: { x: 752, y: 10, w: 436, h: 262, pad: 20, head: 24, kept: 17 },
      steps: { dy: 70, size: 19, dot: 5 },
      chart: { dy: 96, bottom: 20, label: 13, value: 14 },
      zoom: { x: 770, y: 292, size: 15 },
      mini: { size: 30 },
      doc: { w: 78, h: 100 },
      zzz: { dx: 52, dy: -34, rise: 96, drift: 44, sizes: [20, 26, 32] }
    },
    portrait: {
      W: 540, H: 900, minFont: 15,
      img: { x: 0, y: 0, w: 540, h: 304 },
      clock: { x: 12, y: 12, w: 104, h: 40, size: 20 },
      panel: { x: 16, y: 340, w: 508, h: 540, pad: 26, head: 28, kept: 19 },
      steps: { dy: 92, size: 22, dot: 6 },
      chart: { dy: 136, bottom: 30, label: 15, value: 16 },
      zoom: { x: 22, y: 328, size: 15 },
      mini: { size: 15 },
      doc: { w: 110, h: 140 },
      zzz: { dx: 22, dy: -14, rise: 60, drift: 26, sizes: [15, 18, 22] }
    }
  };

  function sx(g, x) { return g.img.x + x * g.img.w / SRC_W; }
  function sy(g, y) { return g.img.y + y * g.img.h / SRC_H; }
  function screenRect(g) {
    return { x: sx(g, SCREEN.x0), y: sy(g, SCREEN.y0), w: sx(g, SCREEN.x1) - sx(g, SCREEN.x0), h: sy(g, SCREEN.y1) - sy(g, SCREEN.y0) };
  }
  function panelRect(g) { return g.panel; }
  function chartRect(g) {
    var P = g.panel, C = g.chart;
    return { x: P.x + P.pad, y: P.y + C.dy, w: P.w - 2 * P.pad, h: P.h - C.dy - C.bottom, label: C.label, value: C.value };
  }

  /* ---------- the illustration ---------- */

  function drawIllustration(g, s) {
    var I = g.img, out = '';
    function img(href, cls, opacity) {
      return tag('image', { href: href, x: I.x, y: I.y, width: I.w, height: I.h, preserveAspectRatio: 'none',
        class: 'illo ' + cls, style: opacity < 1 ? 'opacity:' + opacity.toFixed(3) : undefined });
    }
    out += img(IMG.night.light, 'illo-light', 1) + img(IMG.night.dark, 'illo-dark', 1);
    if (s.dawn > 0.001) out += img(IMG.morning.light, 'illo-light', s.dawn) + img(IMG.morning.dark, 'illo-dark', s.dawn);
    return tag('g', { class: 'intro-illustration' }, out);
  }

  function drawZzz(g, P, s, t) {
    var Z = g.zzz, out = '';
    var alpha = s.station === 'handoff' ? T.clamp((s.local - 0.45) / 0.3, 0, 1) : s.station === 'morning' ? 1 - s.dawn : 1;
    if (alpha <= 0.01) return '';
    var hx = sx(g, SLEEPER.x), hy = sy(g, SLEEPER.y);
    Z.sizes.forEach(function (size, i) {
      var ph = (t * 0.42 + i / Z.sizes.length) % 1;
      var x = hx + Z.dx + Z.drift * ph, y = hy + Z.dy - Z.rise * ph;
      var o = Math.sin(Math.PI * ph) * alpha;
      out += P.text(x.toFixed(1), y.toFixed(1), 'Z', P.style('--ink-2', size, '--font-hand', 700) + ';opacity:' + o.toFixed(3));
    });
    return out;
  }

  // the small screen inside the drawing: a pulse while the agent works, the experiment number
  function drawMini(g, P, s, t) {
    var S = screenRect(g), Mi = g.mini, out = '';
    var fade = 1 - s.dawn;
    if (fade <= 0.01 || !s.screenOn) return '';
    // the screen is flat --illo-screen in every drawing: repaint it so the number has a known background
    out += tag('rect', { x: S.x.toFixed(1), y: S.y.toFixed(1), width: S.w.toFixed(1), height: S.h.toFixed(1),
      style: 'fill:var(--illo-screen);opacity:' + fade.toFixed(3), 'data-box': 'intro-mini' });
    out += tag('rect', { x: S.x.toFixed(1), y: S.y.toFixed(1), width: S.w.toFixed(1), height: S.h.toFixed(1),
      style: 'fill:var(--term-bg);opacity:' + ((0.04 + 0.05 * Math.abs(Math.sin(t * 3))) * fade).toFixed(3) });
    if (s.station === 'handoff') {  // reading program.md: a scan line runs down the screen
      var y = S.y + 6 + ((s.local / 0.5) % 1) * (S.h - 12);
      out += tag('rect', { x: (S.x + 8).toFixed(1), y: y.toFixed(1), width: (S.w - 16).toFixed(1), height: 4, rx: 2,
        style: 'fill:var(--term-bg);opacity:' + (0.55 * fade).toFixed(3) });
      return out;
    }
    var n = s.current || s.done;
    if (n) {
      out += tag('g', { style: 'opacity:' + fade.toFixed(3) },
        P.fit(S.x + S.w / 2, S.y + S.h / 2 + Mi.size * 0.36, '#' + n, '--term-bg', Mi.size, '--font-mono', 700, S.w - 12, 'intro-mini', 'middle'));
    }
    return out;
  }

  // the cone from the small screen to the magnified panel
  function drawZoom(g, P, s, copy) {
    var S = screenRect(g), Pn = panelRect(g), Z = g.zoom, out = '';
    var portrait = g.H > g.W;
    var a, b;
    if (portrait) { a = [Pn.x + Pn.w * 0.55, Pn.y]; b = [Pn.x + Pn.w, Pn.y]; }
    else { a = [Pn.x + 28, Pn.y + Pn.h]; b = [Pn.x + Pn.w - 28, Pn.y + Pn.h]; }
    var s0 = portrait ? [S.x, S.y + S.h] : [S.x, S.y], s1 = portrait ? [S.x + S.w, S.y + S.h] : [S.x + S.w, S.y];
    out += tag('path', { d: 'M' + a.join(' ') + ' L' + s0[0].toFixed(1) + ' ' + s0[1].toFixed(1) + ' L' + s1[0].toFixed(1) + ' ' + s1[1].toFixed(1) + ' L' + b.join(' ') + ' Z',
      style: 'fill:var(--accent);opacity:0.10' });
    out += tag('path', { d: 'M' + a.join(' ') + ' L' + s0[0].toFixed(1) + ' ' + s0[1].toFixed(1) + ' M' + b.join(' ') + ' L' + s1[0].toFixed(1) + ' ' + s1[1].toFixed(1),
      style: 'fill:none;stroke:var(--ink-2);stroke-width:1.5;stroke-dasharray:5 5;opacity:0.8' });
    out += tag('rect', { x: S.x.toFixed(1), y: S.y.toFixed(1), width: S.w.toFixed(1), height: S.h.toFixed(1), rx: 3,
      style: 'fill:none;stroke:var(--accent);stroke-width:2' });
    out += P.text(Z.x, Z.y, copy.labels.zoom, P.style('--ink-2', Z.size, '--font-hand', 700));
    return out;
  }

  /* ---------- the magnified screen ---------- */

  function hiddenAt(all, x) {
    for (var i = 0; i < all.length; i++) if (all[i].x === x) return false;
    return x <= all[all.length - 1].x;
  }

  function chartScale(C, all) {
    var base = all.length ? all[0].bpb : 1, best = base;
    all.forEach(function (p) { if (p.status === 'keep' && p.bpb < best) best = p.bpb; });
    var margin = (base - best) * 0.15 || 0.001;  // analysis.ipynb: ylim(best - margin, baseline + margin)
    var lo = best - margin, hi = base + margin, xmax = M.TOTAL - 1;
    return {
      x: function (x) { return C.x + (x / xmax) * C.w; },
      y: function (b) { return C.y + ((hi - b) / (hi - lo)) * C.h; }
    };
  }

  function drawChart(g, P, s, copy, all) {
    var C = chartRect(g), out = '', sc = chartScale(C, all);
    out += tag('path', { d: 'M' + C.x + ' ' + C.y + ' L' + C.x + ' ' + (C.y + C.h) + ' L' + (C.x + C.w) + ' ' + (C.y + C.h),
      style: 'fill:none;stroke:var(--term-ink);stroke-width:1.5;opacity:0.35' });
    out += P.fit(C.x + C.w, C.y + 6, copy.labels.chart, '--term-ink', C.label, '--font-hand', 400, C.w * 0.6, 'intro-screen', 'end');
    var vis = s.visible;
    for (var h = 0; h < s.done; h++) {
      if (vis.length && hiddenAt(all, h)) {
        var hx = sc.x(h);
        out += tag('path', { d: 'M' + (hx - 4).toFixed(1) + ' ' + (C.y + 2) + ' l4 -8 l4 8 z', style: 'fill:var(--discard)' });
      }
    }
    vis.forEach(function (p) {
      if (p.status === 'keep') return;
      out += tag('circle', { cx: sc.x(p.x).toFixed(1), cy: sc.y(p.bpb).toFixed(1), r: 3.4, style: 'fill:var(--discard)' });
    });
    // running best: a step line that only goes down (drawn "post", like analysis.ipynb)
    var line = M.bestLine(all, s.done);
    if (line.length) {
      var d = '', endX = Math.max(line[line.length - 1].x, s.done - 1);
      line.forEach(function (p, i) {
        var X = sc.x(p.x).toFixed(1), Y = sc.y(p.bpb).toFixed(1);
        d += i === 0 ? 'M' + X + ' ' + Y : ' V' + Y;
        var nx = i + 1 < line.length ? line[i + 1].x : endX;
        d += ' H' + sc.x(nx).toFixed(1);
      });
      out += tag('path', { d: d, style: 'fill:none;stroke:var(--term-ok);stroke-width:2.5;stroke-linejoin:round' });
    }
    vis.forEach(function (p) {
      if (p.status !== 'keep') return;
      out += tag('circle', { cx: sc.x(p.x).toFixed(1), cy: sc.y(p.bpb).toFixed(1), r: 5.5, style: 'fill:var(--term-ok);stroke:var(--term-bg);stroke-width:1.5' });
    });
    // the experiment that just finished
    var last = vis.length ? vis[vis.length - 1] : null;
    if (last && last.x === s.done - 1 && s.station !== 'morning') {
      out += tag('circle', { cx: sc.x(last.x).toFixed(1), cy: sc.y(last.bpb).toFixed(1), r: 10, style: 'fill:none;stroke:var(--accent);stroke-width:2' });
    }
    if (vis.length) {
      var b0 = all[0].bpb;
      out += P.fit(C.x + 14, sc.y(b0) - 10, b0.toFixed(4), '--term-ink', C.value, '--font-mono', 400, 120, 'intro-screen');
    }
    if (s.station === 'morning' && line.length > 1) {
      var ax = C.x + C.w - 6, y0 = sc.y(line[0].bpb), y1 = sc.y(line[line.length - 1].bpb) - 4;
      var grow = T.ease.out(T.clamp(s.local / 0.5, 0, 1));
      out += tag('path', { d: 'M' + ax + ' ' + y0.toFixed(1) + ' V' + lerp(y0, y1, grow).toFixed(1),
        style: 'fill:none;stroke:var(--accent);stroke-width:3;stroke-dasharray:6 5', 'marker-end': 'url(#intro-drop)' });
    }
    if (s.best !== null && line.length > 1 && s.station !== 'morning') {  // morning: the panel's second line says it
      var by = sc.y(s.best);
      out += P.fit(C.x + C.w - 14, Math.min(C.y + C.h - 6, by + 22), s.best.toFixed(4), '--term-ok', C.value, '--font-mono', 600, 120, 'intro-screen', 'end');
    }
    return out;
  }

  // handoff: the agent reads program.md (a sheet with a scan line)
  function drawReading(g, P, s, copy) {
    var Pn = panelRect(g), Dc = g.doc, out = '';
    var x = Pn.x + Pn.w / 2 - Dc.w / 2, y = Pn.y + Pn.h / 2 - Dc.h / 2 + 16;
    out += P.fit(Pn.x + Pn.pad, Pn.y + Pn.pad + Pn.head * 0.8, copy.labels.reading, '--term-ink', Pn.head * 0.7, '--font-mono', 400, Pn.w - 2 * Pn.pad, 'intro-screen');
    out += tag('rect', { x: x, y: y, width: Dc.w, height: Dc.h, rx: 6, style: 'fill:var(--term-ink)' });
    var rows = 7, gap = (Dc.h - 24) / rows;
    for (var i = 0; i < rows; i++) {
      out += tag('rect', { x: x + 12, y: (y + 14 + i * gap).toFixed(1), width: ((Dc.w - 24) * (i % 3 === 2 ? 0.55 : i === 0 ? 0.7 : 0.9)).toFixed(1), height: 5, rx: 2.5,
        style: 'fill:var(--term-bg);opacity:' + (i === 0 ? 0.9 : 0.45) });
    }
    var scan = y + 8 + ((s.local / 0.55) % 1) * (Dc.h - 20);
    out += tag('rect', { x: x - 6, y: scan.toFixed(1), width: Dc.w + 12, height: 12, rx: 4, style: 'fill:var(--accent);opacity:0.45' });
    return out;
  }

  // the first runs, one step at a time: the current step in large type, four dots for where we are
  function drawSteps(g, P, s, copy) {
    var Pn = panelRect(g), St = g.steps, out = '', y = Pn.y + St.dy;
    if (s.station === 'night') {
      return P.fit(Pn.x + Pn.pad, y, copy.labels.fast, '--term-ink', St.size, '--font-hand', 700, 220, 'intro-screen');
    }
    if (s.station !== 'first') return '';
    var steps = s.steps || M.STEPS, cur = steps.indexOf(s.step), k = s.step;
    var label = copy.labels.steps[k], color = '--accent';
    if (k === 'verdict' && s.verdict) {
      label = copy.labels.verdicts[s.verdict];
      color = s.verdict === 'keep' ? '--term-ok' : '--discard';
    }
    if (k === 'record') color = '--term-ok';
    steps.forEach(function (key, i) {
      var cx = Pn.x + Pn.pad + St.dot + i * St.dot * 3.4;
      out += tag('circle', { cx: cx.toFixed(1), cy: (y - St.size * 0.34).toFixed(1), r: St.dot,
        style: i < cur ? 'fill:var(--term-ink);opacity:0.55' : i === cur ? 'fill:var(--accent)' : 'fill:none;stroke:var(--term-ink);stroke-width:1.5;opacity:0.45' });
    });
    var tx = Pn.x + Pn.pad + St.dot * 3.4 * steps.length + St.dot;
    out += P.fit(tx, y, (cur + 1) + ' / ' + steps.length + '  ' + label, color, St.size, '--font-hand', 700, Pn.x + Pn.w - Pn.pad - tx, 'intro-screen');
    return out;
  }

  function drawPanel(g, P, s, copy, all) {
    var Pn = panelRect(g), out = '';
    out += tag('rect', { x: Pn.x, y: Pn.y, width: Pn.w, height: Pn.h, rx: 14,
      style: 'fill:var(--term-bg);stroke:var(--ink);stroke-width:2', 'data-box': 'intro-screen' });
    if (!s.screenOn) return out;
    if (s.station === 'handoff') return out + drawReading(g, P, s, copy);
    var hy = Pn.y + Pn.pad + Pn.head * 0.8;
    if (s.station === 'morning') {
      out += P.fit(Pn.x + Pn.pad, hy, fmt(copy.labels.summary, { total: M.TOTAL, kept: s.kept === null ? M.KEPT : s.kept }),
        '--term-ink', Pn.head, '--font-hand', 700, Pn.w - 2 * Pn.pad, 'intro-screen');
      var line = all.length ? M.bestLine(all, M.TOTAL) : [];
      if (line.length > 1) {
        out += P.fit(Pn.x + Pn.pad, Pn.y + g.steps.dy, fmt(copy.labels.best_from_to, { from: line[0].bpb.toFixed(4), to: line[line.length - 1].bpb.toFixed(4) }),
          '--term-ok', g.steps.size, '--font-hand', 700, Pn.w - 2 * Pn.pad, 'intro-screen');
      }
    } else {
      out += P.fit(Pn.x + Pn.pad, hy, fmt(copy.labels.exp, { n: s.current || s.done }), '--term-ink', Pn.head, '--font-hand', 700, Pn.w * 0.5, 'intro-screen');
      if (s.kept !== null) {
        out += P.fit(Pn.x + Pn.w - Pn.pad, hy, fmt(copy.labels.kept, { k: s.kept }), '--term-ok', Pn.kept, '--font-hand', 700, Pn.w * 0.4, 'intro-screen', 'end');
      }
    }
    out += drawSteps(g, P, s, copy);
    if (all.length) out += drawChart(g, P, s, copy, all);
    return out;
  }

  /* ---------- the clock tag ---------- */

  function drawClock(g, P, s, t) {
    var C = g.clock, out = '';
    var ring = s.station === 'morning' && s.wake < 0.98;
    var shake = ring ? Math.sin(t * 40) * 2.5 * (1 - s.wake) : 0;
    var x = C.x + shake;
    out += tag('rect', { x: x.toFixed(1), y: C.y, width: C.w, height: C.h, rx: 10, style: 'fill:var(--term-bg);stroke:var(--ink);stroke-width:2', 'data-box': 'intro-clock' });
    out += P.fit(x + C.w / 2, C.y + C.h / 2 + C.size * 0.36, s.clock, '--term-ink', C.size, '--font-mono', 600, C.w - 14, 'intro-clock', 'middle');
    if (ring) {  // 06:00: the alarm rings until the sleeper is up
      var o = (1 - s.wake).toFixed(3);
      [-1, 1].forEach(function (side) {
        var ex = side < 0 ? x - 8 : x + C.w + 8;
        out += tag('path', { d: 'M' + (ex + side * 2) + ' ' + (C.y + 6) + ' q ' + (side * 10) + ' 16 0 32 M' + (ex + side * 12) + ' ' + (C.y + 2) + ' q ' + (side * 12) + ' 20 0 40',
          style: 'fill:none;stroke:var(--accent);stroke-width:2.5;stroke-linecap:round;opacity:' + o });
      });
    }
    return out;
  }

  function captionFor(s, copy, all) {
    var c = copy.captions;
    if (s.station === 'handoff') return c.handoff;
    if (s.station === 'first') return c.first[s.current - 1];
    if (s.station === 'night') return s.local < 0.5 ? c.night : c.night_line;
    var line = all.length ? M.bestLine(all, M.TOTAL) : null;
    return fmt(c.morning, { total: M.TOTAL, kept: s.kept === null ? M.KEPT : s.kept,
      from: line ? line[0].bpb.toFixed(4) : '', to: line ? line[line.length - 1].bpb.toFixed(4) : '' });
  }

  var DEFS = '<defs>' +
    '<marker id="intro-drop" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">' +
      '<path d="M0 0 L10 5 L0 10 z" style="fill:var(--accent)"/></marker>' +
    '</defs>';

  window.Explain.register('intro', function (svg, ctx) {
    var copy = ctx.copy;
    var ds = ctx.data && ctx.data.datasets && ctx.data.datasets.progress;
    var all = ds && ds.points ? ds.points : [];
    var opts = { points: all.length ? all : null };
    var mode = 'landscape';

    return {
      duration: M.duration(),
      stops: M.stops(),
      layout: function (width) {
        mode = width > 0 && width < 780 ? 'portrait' : 'landscape';
        svg.setAttribute('viewBox', '0 0 ' + GEO[mode].W + ' ' + GEO[mode].H);
      },
      render: function (t) {
        var g = GEO[mode], P = Painter(g);
        var s = M.stateAt(t, opts);
        svg.innerHTML = DEFS + drawIllustration(g, s) + drawZoom(g, P, s, copy) + drawMini(g, P, s, t) +
          drawZzz(g, P, s, t) + drawClock(g, P, s, t) + drawPanel(g, P, s, copy, all);
        ctx.caption(captionFor(s, copy, all));
      }
    };
  });
})();
