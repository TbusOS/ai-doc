/* autoresearch opening scene drawing — a night room, a sleeper, a computer
 * counting experiments 1 → 83 next to a chart of the running best score.
 * State comes from IntroModel.stateAt(t); this file only draws it.
 *
 * Layers:
 *   drawBackdrop()  the room and the night: window, sky, moon, stars, dawn,
 *                   bed, sleeper, Zzz, nightstand, desk. One <g class="intro-backdrop">
 *                   so it can later be swapped for an illustration; nothing in it
 *                   carries data or text that must be read.
 *   foreground      monitor + screen (counter, steps, chart) and the alarm clock.
 * Colors are CSS variables set via style=. The sky, the screen and the clock face
 * use the --term-* colors, which stay dark in both themes. Two layouts:
 * landscape 1200×675 and portrait 540×1080 (svg narrower than 780px). */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var M = window.IntroModel;
  var D = window.ExplainDraw;
  var tag = D.tag, lerp = D.lerp, fmt = D.fmt, Painter = D.Painter;

  var GEO = {
    landscape: {
      W: 1200, H: 675, minFont: 13,
      sky: { x: 74, y: 40, w: 380, h: 290 },
      floorY: 604,
      bed: { x: 40, top: 512, w: 452 },
      stand: { x: 508, y: 530, w: 92, h: 74 },
      clock: { x: 514, y: 480, w: 80, h: 46, size: 20 },
      desk: { x: 640, y: 516, w: 530, legH: 74 },
      mug: { x: 1084, y: 486 },
      monitor: { x: 652, y: 66, w: 506, h: 390, bezel: 14, standH: 60 },
      head: { y: 132, size: 32, kept: 19, icon: 34 },
      steps: { y: 152, h: 34, size: 16, gap: 22 },
      chart: { x: 704, y: 222, w: 414, h: 196, label: 15, value: 15 },
      doc: { w: 150, h: 190, size: 16 },
      zzz: { dx: 40, dy: -24, rise: 120, drift: 70, sizes: [20, 26, 32] }
    },
    portrait: {
      W: 540, H: 1080, minFont: 15,
      sky: { x: 40, y: 28, w: 460, h: 206 },
      floorY: null,
      bed: { x: 24, top: 398, w: 392 },
      stand: { x: 428, y: 412, w: 88, h: 62 },
      clock: { x: 432, y: 364, w: 80, h: 42, size: 18 },
      desk: { x: 24, y: 958, w: 492, legH: 80 },
      mug: { x: 448, y: 928 },
      monitor: { x: 24, y: 488, w: 492, h: 420, bezel: 14, standH: 50 },
      head: { y: 550, size: 30, kept: 18, icon: 32 },
      steps: { y: 570, h: 36, size: 15, gap: 16 },
      chart: { x: 66, y: 640, w: 418, h: 230, label: 15, value: 16 },
      doc: { w: 150, h: 190, size: 16 },
      zzz: { dx: 40, dy: -24, rise: 92, drift: 60, sizes: [18, 22, 28] }
    }
  };

  // fixed star field, as fractions of the sky
  var STARS = [[0.1, 0.16], [0.27, 0.34], [0.42, 0.12], [0.6, 0.26], [0.74, 0.1], [0.88, 0.32],
               [0.18, 0.58], [0.52, 0.46], [0.83, 0.56], [0.34, 0.74], [0.66, 0.7]];

  /* ---------- backdrop: room and night (replaceable by an illustration) ---------- */

  function drawSky(g, s, t) {
    var K = g.sky, out = '';
    out += tag('rect', { x: K.x, y: K.y, width: K.w, height: K.h, style: 'fill:var(--term-bg)' });
    // morning: the sky warms from the horizon up
    if (s.dawn > 0) {
      out += tag('rect', { x: K.x, y: K.y, width: K.w, height: K.h, style: 'fill:var(--info);opacity:' + (0.35 * s.dawn).toFixed(3) });
      out += tag('rect', { x: K.x, y: K.y, width: K.w, height: K.h, style: 'fill:url(#intro-dawn);opacity:' + s.dawn.toFixed(3) });
      var sunY = K.y + K.h + 34 - 120 * s.dawn;
      out += tag('circle', { cx: K.x + K.w * 0.3, cy: sunY.toFixed(1), r: 30, style: 'fill:var(--accent)' });
    }
    var starAlpha = 1 - s.dawn;
    if (starAlpha > 0.01) {
      STARS.forEach(function (p, i) {
        var tw = 0.45 + 0.45 * Math.abs(Math.sin(t * 1.3 + i * 1.7));
        out += tag('circle', { cx: (K.x + p[0] * K.w).toFixed(1), cy: (K.y + p[1] * K.h).toFixed(1), r: i % 3 ? 1.8 : 2.6,
          style: 'fill:var(--term-ink);opacity:' + (tw * starAlpha).toFixed(3) });
      });
    }
    // the moon walks a low arc across the window, 22:00 → 06:00
    var night = s.progress, a = Math.PI * (1 - night);
    var mx = K.x + K.w / 2 + (K.w / 2 - 54) * Math.cos(a);
    var my = K.y + K.h - 40 - (K.h - 100) * Math.sin(a);
    var R = 24;
    out += tag('path', { d: 'M' + mx.toFixed(1) + ' ' + (my - R).toFixed(1) +
      ' A' + R + ' ' + R + ' 0 1 0 ' + mx.toFixed(1) + ' ' + (my + R).toFixed(1) +
      ' A' + (R * 0.62).toFixed(1) + ' ' + R + ' 0 1 1 ' + mx.toFixed(1) + ' ' + (my - R).toFixed(1) + ' Z',
      style: 'fill:var(--term-ink);opacity:' + (1 - 0.8 * s.dawn).toFixed(3) });
    return tag('g', { 'clip-path': 'url(#intro-sky-clip)' }, out);
  }

  function drawWindow(g) {
    var K = g.sky, m = 10;
    return tag('rect', { x: K.x - m, y: K.y - m, width: K.w + 2 * m, height: K.h + 2 * m, rx: 6,
        style: 'fill:none;stroke:var(--ink);stroke-width:3' }) +
      tag('line', { x1: K.x + K.w / 2, y1: K.y, x2: K.x + K.w / 2, y2: K.y + K.h, style: 'stroke:var(--card);stroke-width:5' }) +
      tag('line', { x1: K.x, y1: K.y + K.h * 0.46, x2: K.x + K.w, y2: K.y + K.h * 0.46, style: 'stroke:var(--card);stroke-width:5' }) +
      tag('rect', { x: K.x - 26, y: K.y + K.h + m, width: K.w + 52, height: 12, rx: 4, style: 'fill:var(--paper-2);stroke:var(--ink);stroke-width:2' });
  }

  function drawBed(g) {
    var B = g.bed, out = '', right = B.x + B.w;
    out += tag('rect', { x: B.x, y: B.top - 72, width: 22, height: 166, rx: 6, style: 'fill:var(--card);stroke:var(--ink);stroke-width:2' });
    out += tag('rect', { x: B.x + 22, y: B.top + 4, width: B.w - 22, height: 46, rx: 8, style: 'fill:var(--card);stroke:var(--ink);stroke-width:2' });
    out += tag('rect', { x: B.x + 32, y: B.top + 50, width: 12, height: 34, rx: 3, style: 'fill:var(--ink)' });
    out += tag('rect', { x: right - 22, y: B.top + 50, width: 12, height: 34, rx: 3, style: 'fill:var(--ink)' });
    out += tag('ellipse', { cx: B.x + 78, cy: B.top - 6, rx: 44, ry: 16, style: 'fill:var(--card);stroke:var(--ink);stroke-width:2' });
    return out;
  }

  // pose: 1 = lying asleep, 0 = sitting up awake
  function drawSleeper(g, s, t, pose) {
    var B = g.bed, out = '', right = B.x + B.w;
    var hx = B.x + 84 + 26 * (1 - pose), hy = B.top - 24 - 50 * (1 - pose);
    // blanket over the body
    var bx = B.x + 108;
    out += tag('path', { d: 'M' + bx + ' ' + (B.top + 14) + ' C' + (bx + 18) + ' ' + (B.top - 44) + ' ' + (bx + 160) + ' ' + (B.top - 48) + ' ' +
      (bx + 190) + ' ' + (B.top - 30) + ' S' + (right - 40) + ' ' + (B.top - 22) + ' ' + (right - 6) + ' ' + (B.top - 2) +
      ' L' + (right - 6) + ' ' + (B.top + 14) + ' Z', style: 'fill:var(--paper-2);stroke:var(--ink);stroke-width:2' });
    out += tag('path', { d: 'M' + (bx + 40) + ' ' + (B.top - 12) + ' q 60 -14 120 -6 M' + (bx + 70) + ' ' + (B.top + 4) + ' q 70 -10 140 -2',
      style: 'fill:none;stroke:var(--line);stroke-width:2;stroke-dasharray:6 6' });
    // body when sitting up, arms stretched over the head
    if (pose < 1) {
      var o = (1 - pose).toFixed(3), lift = 22 * (1 - pose);
      out += tag('path', { d: 'M' + (hx - 26) + ' ' + (B.top - 6) + ' C' + (hx - 30) + ' ' + (hy + 40) + ' ' + (hx - 20) + ' ' + (hy + 22) + ' ' + hx + ' ' + (hy + 22) +
        ' C' + (hx + 20) + ' ' + (hy + 22) + ' ' + (hx + 30) + ' ' + (hy + 40) + ' ' + (hx + 26) + ' ' + (B.top - 6) + ' Z',
        style: 'fill:var(--card);stroke:var(--ink);stroke-width:2;opacity:' + o });
      out += tag('path', { d: 'M' + (hx - 18) + ' ' + (hy + 32) + ' Q' + (hx - 36) + ' ' + (hy + 10) + ' ' + (hx - 30) + ' ' + (hy - 4 - lift) +
        ' M' + (hx + 18) + ' ' + (hy + 32) + ' Q' + (hx + 36) + ' ' + (hy + 10) + ' ' + (hx + 30) + ' ' + (hy - 4 - lift),
        style: 'fill:none;stroke:var(--ink);stroke-width:3.5;stroke-linecap:round;opacity:' + o });
    }
    out += tag('circle', { cx: hx.toFixed(1), cy: hy.toFixed(1), r: 22, style: 'fill:var(--card);stroke:var(--ink);stroke-width:2' });
    out += tag('path', { d: 'M' + (hx - 20) + ' ' + (hy - 6) + ' Q' + hx + ' ' + (hy - 30) + ' ' + (hx + 20) + ' ' + (hy - 8),
      style: 'fill:none;stroke:var(--ink);stroke-width:5;stroke-linecap:round' });
    if (pose > 0.5) {  // closed eyes
      out += tag('path', { d: 'M' + (hx - 11) + ' ' + (hy + 3) + ' q 4 4 8 0 M' + (hx + 4) + ' ' + (hy + 3) + ' q 4 4 8 0',
        style: 'fill:none;stroke:var(--ink);stroke-width:2;stroke-linecap:round' });
    } else {
      out += tag('circle', { cx: hx - 7, cy: hy + 2, r: 2.6, style: 'fill:var(--ink)' }) +
        tag('circle', { cx: hx + 8, cy: hy + 2, r: 2.6, style: 'fill:var(--ink)' }) +
        tag('path', { d: 'M' + (hx - 5) + ' ' + (hy + 11) + ' q 6 4 12 0', style: 'fill:none;stroke:var(--ink);stroke-width:2;stroke-linecap:round' });
    }
    return { svg: out, hx: hx, hy: hy };
  }

  function drawZzz(g, P, s, t, head, pose) {
    var Z = g.zzz, out = '';
    var alpha = pose * (s.station === 'handoff' ? T.clamp((s.local - 0.5) / 0.3, 0, 1) : 1);
    if (alpha <= 0.01) return '';
    Z.sizes.forEach(function (size, i) {
      var ph = (t * 0.42 + i / Z.sizes.length) % 1;
      var x = head.hx + Z.dx + Z.drift * ph, y = head.hy + Z.dy - Z.rise * ph;
      var o = Math.sin(Math.PI * ph) * alpha;
      out += P.text(x.toFixed(1), y.toFixed(1), 'Z', P.style('--ink-2', size, '--font-hand', 700) + ';opacity:' + o.toFixed(3));
    });
    return out;
  }

  function drawFurniture(g) {
    var out = '', N = g.stand, Dk = g.desk;
    if (g.floorY) out += tag('line', { x1: 20, y1: g.floorY, x2: g.W - 20, y2: g.floorY, style: 'stroke:var(--line);stroke-width:2' });
    out += tag('rect', { x: N.x, y: N.y, width: N.w, height: N.h, rx: 6, style: 'fill:var(--card);stroke:var(--ink);stroke-width:2' });
    out += tag('line', { x1: N.x + 10, y1: N.y + N.h / 2, x2: N.x + N.w - 10, y2: N.y + N.h / 2, style: 'stroke:var(--line);stroke-width:2' });
    out += tag('circle', { cx: N.x + N.w / 2, cy: N.y + N.h * 0.3, r: 3, style: 'fill:var(--ink-3)' });
    out += tag('rect', { x: Dk.x, y: Dk.y, width: Dk.w, height: 14, rx: 4, style: 'fill:var(--paper-2);stroke:var(--ink);stroke-width:2' });
    out += tag('rect', { x: Dk.x + 16, y: Dk.y + 14, width: 12, height: Dk.legH, rx: 3, style: 'fill:var(--ink)' });
    out += tag('rect', { x: Dk.x + Dk.w - 28, y: Dk.y + 14, width: 12, height: Dk.legH, rx: 3, style: 'fill:var(--ink)' });
    return out;
  }

  function drawMug(g, t) {
    var U = g.mug, out = '';
    out += tag('path', { d: 'M' + (U.x + 26) + ' ' + (U.y + 8) + ' q 14 0 14 10 q 0 10 -14 10', style: 'fill:none;stroke:var(--ink);stroke-width:2.5' });
    out += tag('rect', { x: U.x, y: U.y, width: 28, height: 30, rx: 5, style: 'fill:var(--card);stroke:var(--ink);stroke-width:2' });
    [0, 1].forEach(function (i) {
      var w = Math.sin(t * 2.2 + i * 2) * 3;
      out += tag('path', { d: 'M' + (U.x + 9 + i * 10) + ' ' + (U.y - 6) + ' q ' + (5 + w) + ' -8 0 -16 q ' + (-5 - w) + ' -8 0 -16',
        style: 'fill:none;stroke:var(--ink-3);stroke-width:2;stroke-linecap:round;opacity:0.7' });
    });
    return out;
  }

  function drawBackdrop(g, P, s, t) {
    var pose = s.station === 'morning' ? 1 - s.wake : 1;
    if (s.station === 'handoff') pose = T.ease.inOut(T.clamp(s.local / 0.5, 0, 1));
    var sleeper = drawSleeper(g, s, t, pose);
    return tag('g', { class: 'intro-backdrop' },
      drawSky(g, s, t) + drawWindow(g) + drawFurniture(g) + drawMug(g, t) + drawBed(g) + sleeper.svg + drawZzz(g, P, s, t, sleeper, pose));
  }

  /* ---------- foreground: computer and alarm clock ---------- */

  function screenRect(g) {
    var Mo = g.monitor;
    return { x: Mo.x + Mo.bezel, y: Mo.y + Mo.bezel, w: Mo.w - 2 * Mo.bezel, h: Mo.h - 2 * Mo.bezel };
  }

  function drawMonitor(g) {
    var Mo = g.monitor, S = screenRect(g), out = '';
    var cx = Mo.x + Mo.w / 2, by = Mo.y + Mo.h;
    out += tag('path', { d: 'M' + (cx - 22) + ' ' + by + ' L' + (cx + 22) + ' ' + by + ' L' + (cx + 32) + ' ' + (by + Mo.standH) +
      ' L' + (cx - 32) + ' ' + (by + Mo.standH) + ' Z', style: 'fill:var(--card);stroke:var(--ink);stroke-width:2' });
    out += tag('rect', { x: Mo.x, y: Mo.y, width: Mo.w, height: Mo.h, rx: 16, style: 'fill:var(--card);stroke:var(--ink);stroke-width:3' });
    out += tag('rect', { x: S.x, y: S.y, width: S.w, height: S.h, rx: 8, style: 'fill:var(--term-bg)', 'data-box': 'intro-screen' });
    return out;
  }

  function hiddenAt(all, x) {
    for (var i = 0; i < all.length; i++) if (all[i].x === x) return false;
    return x <= all[all.length - 1].x;
  }

  function chartScale(g, all) {
    var C = g.chart;
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
    var C = g.chart, out = '', sc = chartScale(g, all);
    out += tag('path', { d: 'M' + C.x + ' ' + C.y + ' L' + C.x + ' ' + (C.y + C.h) + ' L' + (C.x + C.w) + ' ' + (C.y + C.h),
      style: 'fill:none;stroke:var(--term-ink);stroke-width:1.5;opacity:0.35' });
    out += P.fit(C.x + C.w, C.y + 6, copy.labels.chart, '--term-ink', C.label, '--font-hand', 400, C.w * 0.6, 'intro-screen', 'end');
    var vis = s.visible;
    for (var h = 0; h < s.done; h++) {
      if (s.visible.length && hiddenAt(all, h)) {
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
      var ax = C.x + C.w + 14, y0 = sc.y(line[0].bpb), y1 = sc.y(line[line.length - 1].bpb) - 4;
      var grow = T.ease.out(T.clamp(s.local / 0.5, 0, 1));
      out += tag('path', { d: 'M' + ax + ' ' + y0.toFixed(1) + ' V' + lerp(y0, y1, grow).toFixed(1),
        style: 'fill:none;stroke:var(--accent);stroke-width:3;stroke-dasharray:6 5', 'marker-end': 'url(#intro-drop)' });
    }
    if (s.best !== null && line.length > 1) {
      var by = sc.y(s.best);
      out += P.fit(C.x + C.w, Math.min(C.y + C.h - 6, by + 22), s.best.toFixed(4), '--term-ok', C.value, '--font-mono', 600, 120, 'intro-screen', 'end');
    }
    return out;
  }

  // a small robot head: the AI doing the work
  function drawRobot(x, y, size, t, busy) {
    var w = size, h = size * 0.78, out = '';
    out += tag('line', { x1: x + w / 2, y1: y, x2: x + w / 2, y2: y - size * 0.24, style: 'stroke:var(--term-ink);stroke-width:2' });
    out += tag('circle', { cx: x + w / 2, cy: y - size * 0.28, r: size * 0.08,
      style: 'fill:var(--accent);opacity:' + (busy ? (0.55 + 0.45 * Math.abs(Math.sin(t * 5))).toFixed(3) : 1) });
    out += tag('rect', { x: x, y: y, width: w, height: h, rx: size * 0.2, style: 'fill:none;stroke:var(--term-ink);stroke-width:2.2' });
    var blink = busy && (t * 0.7) % 1 > 0.92 ? 0.2 : 1;
    out += tag('ellipse', { cx: x + w * 0.32, cy: y + h * 0.45, rx: size * 0.07, ry: size * 0.07 * blink, style: 'fill:var(--term-ink)' });
    out += tag('ellipse', { cx: x + w * 0.68, cy: y + h * 0.45, rx: size * 0.07, ry: size * 0.07 * blink, style: 'fill:var(--term-ink)' });
    out += tag('path', { d: 'M' + (x + w * 0.34) + ' ' + (y + h * 0.72) + ' h' + (w * 0.32), style: 'stroke:var(--term-ink);stroke-width:2;stroke-linecap:round' });
    return out;
  }

  // handoff: the agent reads program.md (a sheet with a scan line)
  function drawReading(g, P, s, copy, t) {
    var S = screenRect(g), Dc = g.doc, H = g.head, out = '';
    var x = S.x + S.w / 2 - Dc.w / 2, y = S.y + (S.h - Dc.h) / 2 + 26;
    out += drawRobot(S.x + 22, H.y - H.icon * 0.78, H.icon, t, true);
    out += P.fit(S.x + 34 + H.icon, H.y, copy.labels.reading, '--term-ink', H.size * 0.62, '--font-mono', 400, S.w - H.icon - 60, 'intro-screen');
    out += tag('rect', { x: x, y: y, width: Dc.w, height: Dc.h, rx: 6, style: 'fill:var(--term-ink)' });
    for (var i = 0; i < 8; i++) {
      out += tag('rect', { x: x + 16, y: y + 22 + i * 20, width: (Dc.w - 32) * (i % 3 === 2 ? 0.55 : i === 0 ? 0.7 : 0.9), height: 6, rx: 3,
        style: 'fill:var(--term-bg);opacity:' + (i === 0 ? 0.9 : 0.45) });
    }
    var scan = y + 12 + ((s.local / 0.55) % 1) * (Dc.h - 24);
    out += tag('rect', { x: x - 6, y: scan.toFixed(1), width: Dc.w + 12, height: 14, rx: 4, style: 'fill:var(--accent);opacity:0.45' });
    return out;
  }

  function drawSteps(g, P, s, copy) {
    var S = screenRect(g), St = g.steps, out = '';
    if (s.station === 'night') {
      return P.fit(S.x + 20, St.y + St.h * 0.7, copy.labels.fast, '--term-ink', St.size + 2, '--font-hand', 700, 200, 'intro-screen');
    }
    if (s.station !== 'first') return '';
    var n = M.STEPS.length, avail = S.w - 40 - (n - 1) * St.gap, w = avail / n;
    var cur = M.STEPS.indexOf(s.step);
    M.STEPS.forEach(function (k, i) {
      var x = S.x + 20 + i * (w + St.gap), id = 'intro-step-' + i;
      var label = copy.labels.steps[k], color = '--term-ink';
      if (k === 'verdict' && s.verdict) {
        label = copy.labels.verdicts[s.verdict];
        color = s.verdict === 'keep' ? '--term-ok' : '--discard';
      }
      var on = i === cur;
      out += tag('rect', { x: x.toFixed(1), y: St.y, width: w.toFixed(1), height: St.h, rx: St.h / 2,
        style: on ? 'fill:var(--term-bg);stroke:var(--accent);stroke-width:2.5' : 'fill:var(--term-bg);stroke:var(--term-ink);stroke-width:1;stroke-opacity:0.3',
        'data-box': id });
      out += P.fit(x + w / 2, St.y + St.h * 0.68, label, i <= cur ? color : '--term-ink', St.size, '--font-hand', on ? 700 : 400, w - 12, id, 'middle');
      if (i < n - 1) {
        out += tag('path', { d: 'M' + (x + w + 5).toFixed(1) + ' ' + (St.y + St.h / 2) + ' h' + (St.gap - 10),
          style: 'stroke:var(--term-ink);stroke-width:1.5;opacity:0.5', 'marker-end': 'url(#intro-arrow)' });
      }
    });
    return out;
  }

  function drawScreen(g, P, s, copy, all, t) {
    var S = screenRect(g), H = g.head, out = '';
    if (!s.screenOn) return '';
    if (s.station === 'handoff') return drawReading(g, P, s, copy, t);
    var tx = S.x + 34 + H.icon;
    out += drawRobot(S.x + 22, H.y - H.icon * 0.78, H.icon, t, s.station !== 'morning');
    if (s.station === 'morning') {
      out += P.fit(tx, H.y, fmt(copy.labels.summary, { total: M.TOTAL, kept: s.kept === null ? M.KEPT : s.kept }),
        '--term-ink', H.size, '--font-hand', 700, S.x + S.w - 22 - tx, 'intro-screen');
    } else {
      out += P.fit(tx, H.y, fmt(copy.labels.exp, { n: s.current || s.done }), '--term-ink', H.size, '--font-hand', 700, S.w * 0.45, 'intro-screen');
      if (s.kept !== null) {
        out += P.fit(S.x + S.w - 22, H.y, fmt(copy.labels.kept, { k: s.kept }), '--term-ok', H.kept, '--font-hand', 700, S.w * 0.35, 'intro-screen', 'end');
      }
    }
    out += drawSteps(g, P, s, copy);
    if (all.length) out += drawChart(g, P, s, copy, all);
    return out;
  }

  function drawClock(g, P, s, t) {
    var C = g.clock, out = '';
    out += tag('rect', { x: C.x + 8, y: C.y + C.h - 2, width: 8, height: 8, rx: 2, style: 'fill:var(--ink)' });
    out += tag('rect', { x: C.x + C.w - 16, y: C.y + C.h - 2, width: 8, height: 8, rx: 2, style: 'fill:var(--ink)' });
    out += tag('rect', { x: C.x, y: C.y, width: C.w, height: C.h, rx: 10, style: 'fill:var(--term-bg);stroke:var(--ink);stroke-width:2', 'data-box': 'intro-clock' });
    out += P.fit(C.x + C.w / 2, C.y + C.h / 2 + C.size * 0.36, s.clock, '--term-ink', C.size, '--font-mono', 600, C.w - 12, 'intro-clock', 'middle');
    // 06:00: the alarm rings until the sleeper is up
    if (s.station === 'morning' && s.wake < 0.98) {
      var shake = Math.sin(t * 40) * 3, o = (1 - s.wake).toFixed(3);
      [-1, 1].forEach(function (side) {
        var x = side < 0 ? C.x - 8 : C.x + C.w + 8;
        out += tag('path', { d: 'M' + (x + side * 2 + shake) + ' ' + (C.y + 6) + ' q ' + (side * 10) + ' 16 0 32 M' + (x + side * 12 + shake) + ' ' + (C.y + 2) + ' q ' + (side * 12) + ' 20 0 40',
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
    '<clipPath id="intro-sky-clip"><rect id="intro-sky-shape"/></clipPath>' +
    '<linearGradient id="intro-dawn" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0.35" style="stop-color:var(--accent);stop-opacity:0"/>' +
      '<stop offset="1" style="stop-color:var(--accent);stop-opacity:0.8"/></linearGradient>' +
    '<marker id="intro-drop" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">' +
      '<path d="M0 0 L10 5 L0 10 z" style="fill:var(--accent)"/></marker>' +
    '<marker id="intro-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">' +
      '<path d="M0 0 L10 5 L0 10 z" style="fill:var(--term-ink)"/></marker>' +
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
        var g = GEO[mode], P = Painter(g), K = g.sky;
        var s = M.stateAt(t, opts);
        var defs = DEFS.replace('<rect id="intro-sky-shape"/>',
          tag('rect', { x: K.x, y: K.y, width: K.w, height: K.h }));
        svg.innerHTML = defs + drawBackdrop(g, P, s, t) + drawMonitor(g) + drawScreen(g, P, s, copy, all, t) + drawClock(g, P, s, t);
        ctx.caption(captionFor(s, copy, all));
      }
    };
  });
})();
