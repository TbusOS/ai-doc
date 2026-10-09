/* autoresearch scene 11 drawing — three gates a problem must pass to fit the loop.
 * Top-down view of a road: each gate is two posts and a barrier arm. A passed
 * gate swings its arm open (green); a failed gate keeps it shut (grey ✗) and is
 * circled in orange — that is where the problem gets stuck. The last station is
 * the reader's own problem, answered with the three yes / no buttons; pressing a
 * button pauses the scene and shows that result until the reader plays or scrubs.
 * Colors are CSS variables via style=; text on a card carries data-on / data-fit.
 * Landscape 1200×675 (road left to right), portrait 540×1080 (road top to bottom). */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var D = window.ExplainDraw;
  var tag = D.tag, fmt = D.fmt, lerp = D.lerp, Painter = D.Painter;

  var GEO = {
    landscape: {
      W: 1200, H: 675, minFont: 13, dir: 'h',
      head: { x: 40, round: 46, title: 90, what: 124, titleSize: 30, whatSize: 19 },
      road: { a: 30, b: 1070, c: 330, half: 74 },          // along-axis from a to b, centre line c
      gates: [370, 640, 910], start: 110, end: 1010, loop: { at: 1122, r: 32 },
      stopBack: 128, card: { w: 112, h: 56, size: 21 },
      lamp: -112,                                         // lamp offset across the road (above)
      label: { across: 128, size: 21, note: 17, lh: 25, width: 248 },
      stamp: { x: 640, y: 596, size: 28 }, fix: { x: 640, y: 648, size: 18, width: 760 },
      readme: [{ x: 60, y: 160, w: 520, h: 420 }, { x: 620, y: 160, w: 520, h: 420 }]
    },
    portrait: {
      W: 540, H: 1080, minFont: 15, dir: 'v',
      head: { x: 24, round: 40, title: 78, what: 108, titleSize: 26, whatSize: 17 },
      road: { a: 140, b: 900, c: 120, half: 58 },
      gates: [330, 540, 750], start: 196, end: 880, loop: { at: 965, r: 30 },
      stopBack: 104, card: { w: 104, h: 46, size: 18 },
      lamp: 88,
      label: { across: 198, size: 18, note: 16, lh: 22, width: 204 },
      stamp: { x: 368, y: 952, size: 24 }, fix: { x: 368, y: 1004, size: 16, width: 300 },
      readme: [{ x: 20, y: 140, w: 500, h: 420 }, { x: 20, y: 590, w: 500, h: 420 }]
    }
  };

  // map (along, across) road coordinates to svg x, y
  function pt(g, along, across) {
    return g.dir === 'h' ? [along, g.road.c + across] : [g.road.c + across, along];
  }

  /* ---------- pieces ---------- */

  function drawRoad(g) {
    var R = g.road, a = pt(g, R.a, -R.half), b = pt(g, R.b, R.half), out = '';
    var x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]);
    out += tag('rect', { x: x, y: y, width: Math.abs(b[0] - a[0]), height: Math.abs(b[1] - a[1]), rx: 16, style: 'fill:var(--paper-2);opacity:0.75' });
    var c1 = pt(g, R.a + 20, 0), c2 = pt(g, R.b - 10, 0);
    out += tag('line', { x1: c1[0], y1: c1[1], x2: c2[0], y2: c2[1], style: 'stroke:var(--line);stroke-width:3;stroke-dasharray:14 12' });
    return out;
  }

  function drawLoop(g, P, copy, glow) {
    var L = g.loop, c = pt(g, L.at, 0), r = L.r, out = '';
    var a0 = -60 * Math.PI / 180, a1 = 250 * Math.PI / 180;
    var p0 = [c[0] + r * Math.cos(a0), c[1] + r * Math.sin(a0)], p1 = [c[0] + r * Math.cos(a1), c[1] + r * Math.sin(a1)];
    var color = glow > 0 ? '--keep' : '--ink-3';
    out += tag('circle', { cx: c[0], cy: c[1], r: r + 10, style: 'fill:var(--card);stroke:var(' + color + ');stroke-width:' + (glow > 0 ? 3 : 1.5) });
    out += tag('path', { d: 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' A' + r + ' ' + r + ' 0 1 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1),
      style: 'fill:none;stroke:var(' + color + ');stroke-width:4;stroke-linecap:round', 'marker-end': 'url(#where-arrow' + (glow > 0 ? '-keep' : '') + ')' });
    var lab = copy.labels.loop, lp = [c[0], c[1] + r + (g.dir === 'h' ? 40 : 36)];
    out += P.text(lp[0], lp[1], lab, P.style(glow > 0 ? '--keep-ink' : '--ink-2', 16, '--font-hand', 700),
      { 'text-anchor': 'middle', 'data-on': 'stage' });
    return out;
  }

  // one gate: two posts across the road, a barrier arm, a lamp, its label and the note
  function drawGate(g, P, copy, k, state, age, note, hot, t) {
    var R = g.road, along = g.gates[k], out = '';
    var postA = pt(g, along, -R.half - 4), postB = pt(g, along, R.half + 4);
    // arm: hinged at post A; shut = across the road, open = swung along the road
    var open = state === 'pass' ? T.ease.inOut(T.clamp(age / 0.3, 0, 1)) : 0;
    var ang = g.dir === 'h' ? lerp(90, 0, open) : lerp(0, 90, open);
    var len = 2 * R.half + 2;
    var rad = ang * Math.PI / 180, tip = [postA[0] + len * Math.cos(rad), postA[1] + len * Math.sin(rad)];
    var armColor = state === 'pass' ? '--keep' : state === 'fail' ? '--discard' : state === 'check' ? '--accent' : '--ink-3';
    if (hot) {
      var mid = pt(g, along, 0);
      out += tag('circle', { cx: mid[0], cy: mid[1], r: R.half + 30, style: 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:2.5;stroke-dasharray:8 6' });
    }
    out += tag('line', { x1: postA[0], y1: postA[1], x2: tip[0].toFixed(1), y2: tip[1].toFixed(1),
      style: 'stroke:var(' + armColor + ');stroke-width:' + (state === 'fail' ? 9 : 7) + ';stroke-linecap:round' + (state === 'idle' || state === 'skip' ? ';stroke-dasharray:10 8' : '') });
    if (state === 'fail') {
      var m2 = pt(g, along, 0);
      out += tag('circle', { cx: m2[0], cy: m2[1], r: 17, style: 'fill:var(--card);stroke:var(--discard);stroke-width:3' });
      out += tag('path', { d: 'M' + (m2[0] - 7) + ' ' + (m2[1] - 7) + ' l14 14 M' + (m2[0] + 7) + ' ' + (m2[1] - 7) + ' l-14 14', style: 'stroke:var(--ink-2);stroke-width:3;stroke-linecap:round' });
    }
    [postA, postB].forEach(function (p) {
      out += tag('rect', { x: p[0] - 10, y: p[1] - 10, width: 20, height: 20, rx: 4, style: 'fill:var(--ink);stroke:var(--card);stroke-width:2' });
    });
    // lamp: above the road in landscape, in front of the label in portrait
    var lampFill = state === 'pass' ? '--keep' : state === 'fail' ? '--discard' : state === 'check' ? '--accent' : '--paper-2';
    var pulse = state === 'check' ? 4 * Math.abs(Math.sin(t * 9)) : 0;
    if (g.dir === 'h') {
      var lp = pt(g, along, g.lamp);
      out += tag('circle', { cx: lp[0], cy: lp[1], r: (17 + pulse).toFixed(1), style: 'fill:var(' + lampFill + ');stroke:var(--ink-3);stroke-width:1.5' });
      if (state === 'pass') out += tag('path', { d: 'M' + (lp[0] - 7) + ' ' + lp[1] + ' l5 6 l9 -12', style: 'fill:none;stroke:var(--card);stroke-width:3;stroke-linecap:round;stroke-linejoin:round' });
    }
    // label + note
    var G = copy.gates[k], L = g.label;
    var lx, ly, anchor;
    if (g.dir === 'h') { lx = along; ly = R.c + L.across; anchor = 'middle'; }
    else { lx = R.c + L.across - 14; ly = along - 16; anchor = 'start'; }
    var lab = G.num + ' ' + G.label;
    if (g.dir === 'v') {
      out += tag('circle', { cx: lx - 22, cy: ly - 7, r: (11 + pulse * 0.7).toFixed(1), style: 'fill:var(' + lampFill + ');stroke:var(--ink-3);stroke-width:1.5' });
    }
    out += P.text(lx, ly, lab, P.style(hot ? '--accent-ink' : '--ink', L.size, '--font-hand', 700), { 'text-anchor': anchor, 'data-on': 'stage' });
    if (note && (state === 'pass' || state === 'fail')) {
      var mark = state === 'pass' ? '✓ ' : '✗ ';
      var lines = P.wrap(mark + note, L.note, L.width);
      var box = 'note' + k, top = ly + 12, h = lines.length * L.lh + 12;
      var bx = anchor === 'middle' ? lx - L.width / 2 - 8 : lx - 8;
      out += tag('rect', { x: bx, y: top, width: L.width + 16, height: h, rx: 8, 'data-box': box,
        style: state === 'fail' ? 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5' : 'fill:none' });
      lines.forEach(function (l, i) {
        out += P.fit(lx, top + 6 + (i + 0.8) * L.lh, l, state === 'pass' ? '--keep-ink' : '--ink', L.note, '--font-hand', 400, L.width, box, anchor === 'middle' ? 'middle' : null);
      });
    }
    return out;
  }

  // the card waits in front of each gate while its lamp checks, then drives through
  function cardAlong(g, pos) {
    var stops = [g.start].concat(g.gates.map(function (a) { return a - g.stopBack; }), [g.end]);
    var i = Math.min(3, Math.floor(pos));
    return lerp(stops[i], stops[i + 1], pos - i);
  }

  function drawCard(g, P, label, along, ring) {
    var c = pt(g, along, 0), C = g.card, out = '';
    var x = c[0] - C.w / 2, y = c[1] - C.h / 2;
    out += tag('rect', { x: x + 3, y: y + 5, width: C.w, height: C.h, rx: 12, style: 'fill:var(--ink);opacity:0.12' });
    out += tag('rect', { x: x, y: y, width: C.w, height: C.h, rx: 12, 'data-box': 'card',
      style: 'fill:var(--card);stroke:var(' + ring + ');stroke-width:2.5' });
    out += P.fit(c[0], c[1] + C.size * 0.36, label, '--ink', C.size, '--font-hand', 700, C.w - 16, 'card', 'middle');
    return out;
  }

  function drawStamp(g, P, copy, text, pass, fix, p) {
    var S = g.stamp, F = g.fix, out = '';
    var sc = 1.5 - 0.5 * T.ease.out(p), op = T.clamp(p * 2, 0, 1);
    var w = P.width(text, S.size) + 40, color = pass ? '--keep' : '--accent', ink = pass ? '--keep-ink' : '--accent-ink';
    out += tag('g', { transform: 'translate(' + S.x + ' ' + S.y + ') rotate(-4) scale(' + sc.toFixed(3) + ')', style: 'opacity:' + op.toFixed(3) },
      tag('rect', { x: -w / 2, y: -S.size - 6, width: w, height: S.size + 24, rx: 10, 'data-box': 'stamp', style: 'fill:var(--card);stroke:var(' + color + ');stroke-width:3' }) +
      P.text(0, 2, text, P.style(ink, S.size, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'stamp' }));
    if (fix) {
      var lines = P.wrap(fix, F.size, F.width);
      lines.forEach(function (l, i) {
        out += P.text(F.x, F.y + i * (F.size + 8), l, P.style('--ink-2', F.size), { 'text-anchor': 'middle', 'data-on': 'stage' });
      });
    }
    return out;
  }

  function drawHead(g, P, round, title, what) {
    var H = g.head, out = '';
    out += P.text(H.x, H.round, round, P.style('--accent-ink', 17, '--font-hand', 700), { 'data-on': 'stage' });
    out += P.text(H.x, H.title, title, P.style('--ink', H.titleSize, '--font-hand', 700));
    if (what) out += P.text(H.x, H.what, what, P.style('--ink-2', H.whatSize));
    return out;
  }

  /* ---------- README: two directions ---------- */

  function loopIcon(cx, cy, r, color, marker) {
    var a0 = -60 * Math.PI / 180, a1 = 250 * Math.PI / 180;
    return tag('path', { d: 'M' + (cx + r * Math.cos(a0)).toFixed(1) + ' ' + (cy + r * Math.sin(a0)).toFixed(1) + ' A' + r + ' ' + r + ' 0 1 1 ' +
      (cx + r * Math.cos(a1)).toFixed(1) + ' ' + (cy + r * Math.sin(a1)).toFixed(1),
      style: 'fill:none;stroke:var(' + color + ');stroke-width:4;stroke-linecap:round', 'marker-end': 'url(#' + marker + ')' });
  }

  function docIcon(P, x, y, name, id) {
    return tag('path', { d: 'M' + x + ' ' + y + ' h46 l14 14 v56 h-60 z', style: 'fill:var(--card);stroke:var(--ink);stroke-width:2;stroke-linejoin:round' }) +
      tag('path', { d: 'M' + (x + 10) + ' ' + (y + 28) + ' h38 M' + (x + 10) + ' ' + (y + 40) + ' h30 M' + (x + 10) + ' ' + (y + 52) + ' h36', style: 'stroke:var(--line);stroke-width:4;stroke-linecap:round' }) +
      P.text(x + 30, y + 92, name, P.style('--ink', 15, '--font-mono', 600), { 'text-anchor': 'middle', 'data-on': id });
  }

  function drawReadme(g, P, copy, p) {
    var Rm = copy.readme, out = '';
    Rm.items.forEach(function (it, i) {
      var B = g.readme[i], a = T.ease.out(T.clamp((p - 0.08 - i * 0.22) / 0.25, 0, 1));
      if (a <= 0) return;
      var id = 'readme' + i, inner = '';
      inner += tag('rect', { x: B.x, y: B.y, width: B.w, height: B.h, rx: 16, 'data-box': id, style: 'fill:var(--card);stroke:var(--line);stroke-width:1.5' });
      inner += P.fit(B.x + 24, B.y + 44, (i === 0 ? '① ' : '② ') + it.head, '--ink', 24, '--font-hand', 700, B.w - 48, id);
      P.wrap(it.body, 18, B.w - 48).forEach(function (l, j) {
        inner += P.fit(B.x + 24, B.y + 78 + j * 26, l, '--ink-2', 18, '--font-hand', 400, B.w - 48, id);
      });
      var cx = B.x + B.w / 2, cy = B.y + B.h / 2 + 50;
      if (i === 0) {
        // the human's loop around program.md wraps the AI's loop around train.py
        inner += loopIcon(cx, cy, 118, '--accent', 'where-arrow-accent');
        inner += loopIcon(cx, cy, 52, '--keep', 'where-arrow-keep');
        inner += docIcon(P, cx - 168, cy - 132, 'program.md', id);
        inner += P.fit(cx - 138, cy + 106, Rm.human, '--accent-ink', 17, '--font-hand', 700, 180, id, 'middle');
        inner += P.fit(cx, cy + 6, Rm.ai, '--keep-ink', 15, '--font-hand', 700, 96, id, 'middle');
      } else {
        inner += docIcon(P, cx - 30, B.y + 112, 'program.md', id);
        [-150, 0, 150].forEach(function (dx, j) {
          var b = T.ease.out(T.clamp((p - 0.45 - j * 0.1) / 0.2, 0, 1));
          if (b <= 0) return;
          var lx = cx + dx, ly = cy + 70;
          inner += tag('line', { x1: cx, y1: B.y + 214, x2: lx, y2: ly - 46, style: 'stroke:var(--line);stroke-width:2;stroke-dasharray:4 5;opacity:' + b.toFixed(3) });
          inner += tag('g', { style: 'opacity:' + b.toFixed(3) }, loopIcon(lx, ly, 36, '--keep', 'where-arrow-keep') +
            P.text(lx, ly + 6, 'AI', P.style('--keep-ink', 17, '--font-mono', 700), { 'text-anchor': 'middle', 'data-on': id }));
        });
      }
      out += tag('g', { style: 'opacity:' + a.toFixed(3) }, inner);
    });
    return out;
  }

  var DEFS = '<defs>' + ['', '-keep', '-accent'].map(function (k) {
    var c = k === '-keep' ? '--keep' : k === '-accent' ? '--accent' : '--ink-3';
    return '<marker id="where-arrow' + k + '" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">' +
      '<path d="M0 0 L10 5 L0 10 z" style="fill:var(' + c + ')"/></marker>';
  }).join('') + '</defs>';

  window.Explain.register('where', function (svg, ctx) {
    var copy = ctx.copy;
    var M = window.WhereModel.create(copy.examples.map(function (e) { return e.gates; }));
    var opts = {};
    copy.controls.forEach(function (c) { opts[c.option] = c.value; });
    var mode = 'landscape';
    var ui = { lastT: 0, mine: false, mineT: null, started: false };

    function scenario(s) {
      if (s.phase === 'mine') {
        var gates = M.mineGates(opts), Mi = copy.mine;
        return {
          round: copy.labels.round_mine, short: Mi.short, title: Mi.title, what: Mi.what, gates: gates,
          notes: gates.map(function (ok, k) { return ok ? Mi.yes_notes[k] : Mi.no_notes[k]; }),
          verdict: s.failAt >= 0 ? fmt(Mi.verdict_fail, { n: s.failAt + 1 }) : Mi.verdict_pass,
          fix: s.failAt >= 0 ? Mi.fixes[s.failAt] : null
        };
      }
      var ex = copy.examples[Math.max(0, s.example)];
      return {
        round: s.example === 0 ? copy.labels.round_self : fmt(copy.labels.round, { n: s.example }),
        short: ex.short, title: ex.title, what: ex.what, gates: ex.gates, notes: ex.notes, verdict: ex.verdict, fix: ex.fix || null
      };
    }

    function captionFor(s, sc) {
      var C = copy.captions;
      if (s.phase === 'intro') return C.intro;
      if (s.phase === 'readme') return C.readme;
      if (s.phase === 'mine') {
        if (!s.verdict) return C.mine_walk;
        return s.failAt >= 0 ? fmt(C.mine_fail, { n: s.failAt + 1, fix: sc.fix }) : C.mine_pass;
      }
      if (!s.verdict) return fmt(C.walk, sc);
      return sc.fix ? fmt(C.verdict_fix, sc) : fmt(C.verdict, sc);
    }

    return {
      duration: M.duration(),
      stops: M.stops(),
      setOption: function (key, value) {
        opts[key] = value;
        if (!ui.started) return;  // the engine telling the buttons' starting values, not a reader's answer
        // show the reader's problem right away, and pause: the next frame of a playing scene
        // would move t and wipe it out. It stays until the reader plays or scrubs again.
        ui.mine = true; ui.mineT = ui.lastT;
        ctx.pause();
      },
      layout: function (width) {
        mode = width > 0 && width < 780 ? 'portrait' : 'landscape';
        svg.setAttribute('viewBox', '0 0 ' + GEO[mode].W + ' ' + GEO[mode].H);
      },
      render: function (t) {
        if (ui.mine && t !== ui.mineT) ui.mine = false;
        ui.lastT = t; ui.started = true;
        var g = GEO[mode], P = Painter(g);
        var s = ui.mine ? M.stateAt(M.duration(), opts) : M.stateAt(t, opts);
        var out = DEFS;

        if (s.phase === 'readme') {
          var fade = 1 - T.clamp(s.local / 0.08, 0, 1);
          out += drawHead(g, P, '', copy.readme.title, '');
          if (fade > 0) out += tag('g', { style: 'opacity:' + fade.toFixed(3) }, drawRoad(g));
          out += drawReadme(g, P, copy, s.local);
          svg.innerHTML = out;
          ctx.caption(captionFor(s, null));
          return;
        }

        var sc = s.phase === 'intro' ? null : scenario(s);
        var v = sc ? M.verdictOf(sc.gates) : { pass: false, failAt: -1 };
        if (sc) out += drawHead(g, P, sc.round, sc.title, sc.what);
        else out += drawHead(g, P, '', copy.title.split('：')[1] || copy.title, '');
        out += drawRoad(g);
        out += drawLoop(g, P, copy, s.verdict === 'pass' ? 1 : 0);
        copy.gates.forEach(function (G, k) {
          var st = s.gates[k], hot = s.verdict === 'fail' && s.failAt === k;
          out += drawGate(g, P, copy, k, st, s.ages[k], sc ? sc.notes[k] : null, hot, t);
        });
        var ring = s.verdict === 'pass' ? '--keep' : s.verdict === 'fail' ? '--accent' : '--ink';
        out += drawCard(g, P, sc ? sc.short : copy.labels.start, cardAlong(g, s.pos), ring);
        if (s.verdict) {
          var p = T.clamp(s.verdictAge / 0.35, 0, 1);
          out += drawStamp(g, P, copy, v.pass ? copy.labels.stamp_pass : fmt(copy.labels.stamp_fail, { n: v.failAt + 1 }), v.pass, sc.fix, p);
        }
        svg.innerHTML = out;
        ctx.caption(captionFor(s, sc));
      }
    };
  });
})();
