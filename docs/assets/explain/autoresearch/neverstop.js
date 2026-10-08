/* autoresearch scene "neverstop" drawing — a bedroom, a screen, one night.
 * State comes from NeverStopModel.stateAt(t, {allowAsk}); this file only draws
 * it. The sticky note on the screen is program.md's rule: with it, the agent
 * strikes its own question out and keeps going; with the reader's toggle on,
 * the question waits all night and the count stays at 1. The last four
 * stations list program.md's four things to try when out of ideas.
 * Colors are CSS variables: orange = a run on the GPU, hatching = waiting,
 * red = the cost of waiting. Landscape 1200×675, portrait 540×1080 (svg <
 * 780px wide, text ≥ 15px). */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var M = window.NeverStopModel;
  var D = window.ExplainDraw;
  var tag = D.tag, lerp = D.lerp, fmt = D.fmt, Painter = D.Painter;

  var GEO = {
    landscape: {
      W: 1200, H: 675, minFont: 13,
      room: { x: 30, y: 30, w: 450, h: 404 },
      win: { x: 64, y: 58, w: 170, h: 132 },
      clock: { x: 284, y: 78, w: 168, h: 66, size: 36 },
      bed: { x: 52, y: 340, w: 400, h: 58, head: 88 },
      person: { lie: [122, 314], sit: [120, 268], r: 22 },
      zzz: { x: 168, y: 270 },
      mon: { x: 520, y: 34, w: 650, h: 404, pad: 18, stand: 40 },
      note: { x: 1046, y: 18, w: 132, h: 48 },
      count: { x: 570, y: 250, size: 96, unit: 30 },
      title: { y: 104, size: 17 },
      bar: { y: 306, w: 300, h: 14 },
      bubble: { x: 838, y: 122, w: 300, h: 136, cn: 36, en: 15, tail: 'left' },
      ideas: { y: 106, top: 124, h: 62, gap: 8, cn: 22, en: 14, size: 23 },
      line: { x0: 80, x1: 1120, y: 512, h: 48, label: 14, every: 2, top: 496 }
    },
    portrait: {
      W: 540, H: 1080, minFont: 15,
      room: { x: 16, y: 20, w: 508, h: 316 },
      win: { x: 40, y: 44, w: 150, h: 112 },
      clock: { x: 330, y: 58, w: 170, h: 64, size: 34 },
      bed: { x: 40, y: 250, w: 460, h: 52, head: 80 },
      person: { lie: [110, 226], sit: [108, 188], r: 21 },
      zzz: { x: 156, y: 184 },
      mon: { x: 16, y: 352, w: 508, h: 450, pad: 14, stand: 34 },
      note: { x: 384, y: 330, w: 136, h: 50 },
      count: { x: 52, y: 560, size: 96, unit: 30 },
      title: { y: 420, size: 17 },
      bar: { y: 620, w: 300, h: 14 },
      bubble: { x: 216, y: 452, w: 278, h: 112, cn: 32, en: 15, tail: 'left' },
      ideas: { y: 418, top: 436, h: 80, gap: 8, cn: 21, en: 15, size: 21, stack: true },
      line: { x0: 24, x1: 516, y: 914, h: 46, label: 15, every: 2, top: 896 }
    }
  };

  function hm(minute, copy) {
    var h = Math.floor(minute / 60), m = Math.round(minute % 60);
    return h > 0 ? fmt(copy.labels.hours, { h: h, m: m }) : fmt(copy.labels.minutes, { m: m });
  }

  /* ---------- bedroom ---------- */

  function drawRoom(g, P, s) {
    var R = g.room, Wn = g.win, out = '';
    var dawn = s.awake ? 1 : 0;
    out += tag('rect', { x: R.x, y: R.y, width: R.w, height: R.h, rx: 18, style: 'fill:var(--paper-2);stroke:var(--line);stroke-width:1.5' });
    // window: night sky with a moon crossing it, or the sun at dawn
    out += tag('rect', { x: Wn.x, y: Wn.y, width: Wn.w, height: Wn.h, rx: 6, style: 'fill:var(' + (dawn ? '--accent-soft' : '--card') + ');stroke:var(--ink-2);stroke-width:3' });
    if (!dawn) {
      var f = T.clamp(s.minute / M.NIGHT_MIN, 0, 1), r = 13;
      var mx = lerp(Wn.x + 26, Wn.x + Wn.w - 26, f), my = Wn.y + Wn.h * 0.62 - Math.sin(Math.PI * f) * Wn.h * 0.32;
      out += tag('path', { d: 'M' + mx.toFixed(1) + ' ' + (my - r).toFixed(1) + ' A' + r + ' ' + r + ' 0 1 0 ' + mx.toFixed(1) + ' ' + (my + r).toFixed(1) +
        ' A' + (r * 0.55) + ' ' + r + ' 0 0 1 ' + mx.toFixed(1) + ' ' + (my - r).toFixed(1) + ' Z', style: 'fill:var(--paper-2);stroke:var(--ink-2);stroke-width:2' });
    } else {
      out += tag('circle', { cx: Wn.x + Wn.w * 0.7, cy: Wn.y + Wn.h * 0.72, r: 18, style: 'fill:var(--accent)' });
    }
    out += tag('path', { d: 'M' + (Wn.x + Wn.w / 2) + ' ' + Wn.y + ' L' + (Wn.x + Wn.w / 2) + ' ' + (Wn.y + Wn.h) +
      ' M' + Wn.x + ' ' + (Wn.y + Wn.h / 2) + ' L' + (Wn.x + Wn.w) + ' ' + (Wn.y + Wn.h / 2), style: 'stroke:var(--ink-2);stroke-width:2.5' });
    // bedside clock
    var C = g.clock;
    out += tag('rect', { x: C.x, y: C.y, width: C.w, height: C.h, rx: 10, style: 'fill:var(--term-bg)', 'data-box': 'ns-clock' });
    out += P.fit(C.x + C.w / 2, C.y + C.h / 2 + C.size * 0.36, s.clock, '--term-ok', C.size, '--font-mono', 600, C.w - 20, 'ns-clock', 'middle');
    out += tag('rect', { x: C.x + 14, y: C.y + C.h, width: 10, height: 8, style: 'fill:var(--ink-3)' }) +
      tag('rect', { x: C.x + C.w - 24, y: C.y + C.h, width: 10, height: 8, style: 'fill:var(--ink-3)' });
    out += drawBed(g, P, s);
    return out;
  }

  function drawBed(g, P, s) {
    var B = g.bed, Pe = g.person, out = '';
    out += tag('rect', { x: B.x, y: B.y - B.head + B.h, width: 22, height: B.head, rx: 6, style: 'fill:var(--card);stroke:var(--ink-2);stroke-width:2.5' });
    out += tag('rect', { x: B.x, y: B.y, width: B.w, height: B.h, rx: 10, style: 'fill:var(--card);stroke:var(--ink-2);stroke-width:2.5' });
    out += tag('rect', { x: B.x + 30, y: B.y + B.h, width: 12, height: 16, style: 'fill:var(--ink-3)' }) +
      tag('rect', { x: B.x + B.w - 42, y: B.y + B.h, width: 12, height: 16, style: 'fill:var(--ink-3)' });
    out += tag('ellipse', { cx: B.x + 66, cy: B.y - 8, rx: 40, ry: 15, style: 'fill:var(--card);stroke:var(--ink-3);stroke-width:2' });
    var p = s.awake ? Pe.sit : Pe.lie, r = Pe.r;
    if (s.awake) {
      // sitting up: a torso from the shoulders down to the mattress
      var x = p[0], y = p[1] + r + 2;
      out += tag('path', { d: 'M' + (x - 22) + ' ' + (B.y + 4) + ' C' + (x - 24) + ' ' + (y + 12) + ' ' + (x - 14) + ' ' + y + ' ' + x + ' ' + y +
        ' C' + (x + 14) + ' ' + y + ' ' + (x + 24) + ' ' + (y + 12) + ' ' + (x + 22) + ' ' + (B.y + 4) + ' Z',
        style: 'fill:var(--card);stroke:var(--ink-2);stroke-width:2.5' });
    }
    out += tag('circle', { cx: p[0], cy: p[1], r: r, style: 'fill:var(--card);stroke:var(--ink-2);stroke-width:2.5' });
    if (s.awake) {
      out += tag('circle', { cx: p[0] + 6, cy: p[1] - 3, r: 2.6, style: 'fill:var(--ink)' }) + tag('circle', { cx: p[0] + 14, cy: p[1] - 3, r: 2.6, style: 'fill:var(--ink)' });
    } else {
      out += tag('path', { d: 'M' + (p[0] + 2) + ' ' + (p[1] - 2) + ' q4 4 8 0 M' + (p[0] + 12) + ' ' + (p[1] - 2) + ' q4 4 8 0',
        style: 'fill:none;stroke:var(--ink);stroke-width:2;stroke-linecap:round' });
    }
    // blanket
    var bx = B.x + (s.awake ? 150 : 120);
    out += tag('path', { d: 'M' + bx + ' ' + (B.y + 6) + ' C' + (bx + 30) + ' ' + (B.y - 40) + ' ' + (B.x + B.w - 60) + ' ' + (B.y - 34) + ' ' + (B.x + B.w - 8) + ' ' + (B.y + 6) + ' Z',
      style: 'fill:var(--line);stroke:var(--ink-2);stroke-width:2.5' });
    if (!s.awake && s.phase !== 'intro') {
      var Zz = g.zzz, ph = (s.minute / 25) % 1;
      [['z', 17, 0], ['z', 21, 0.33], ['Z', 26, 0.66]].forEach(function (z, i) {
        var q = (ph + z[2]) % 1;
        out += P.text(Zz.x + i * 17, Zz.y - q * 30, z[0], P.style('--ink-2', z[1], '--font-hand', 700) + ';opacity:' + (1 - Math.abs(q - 0.5) * 1.6).toFixed(3));
      });
    }
    return out;
  }

  /* ---------- screen ---------- */

  function screenBox(g) {
    var Mo = g.mon;
    return { x: Mo.x + Mo.pad, y: Mo.y + Mo.pad, w: Mo.w - 2 * Mo.pad, h: Mo.h - 2 * Mo.pad };
  }

  function drawMonitor(g, P, s, copy) {
    var Mo = g.mon, Sc = screenBox(g), out = '';
    var cx = Mo.x + Mo.w / 2;
    out += tag('path', { d: 'M' + (cx - 40) + ' ' + (Mo.y + Mo.h) + ' L' + (cx + 40) + ' ' + (Mo.y + Mo.h) + ' L' + (cx + 60) + ' ' + (Mo.y + Mo.h + Mo.stand) +
      ' L' + (cx - 60) + ' ' + (Mo.y + Mo.h + Mo.stand) + ' Z', style: 'fill:var(--line);stroke:var(--ink-3);stroke-width:1.5' });
    out += tag('rect', { x: Mo.x, y: Mo.y, width: Mo.w, height: Mo.h, rx: 16, style: 'fill:var(--card);stroke:var(--ink-2);stroke-width:3' });
    out += tag('rect', { x: Sc.x, y: Sc.y, width: Sc.w, height: Sc.h, rx: 8, style: 'fill:var(--term-bg)', 'data-box': 'ns-screen' });
    out += s.ideas > 0 ? drawIdeas(g, P, s, copy, Sc) : drawCounter(g, P, s, copy, Sc);
    out += drawNote(g, P, s, copy);
    return out;
  }

  function drawCounter(g, P, s, copy, Sc) {
    var C = g.count, Ti = g.title, Ba = g.bar, L = copy.labels, out = '', x = C.x;
    out += P.fit(x, Ti.y, L.screen, '--term-ink', Ti.size, '--font-mono', 400, Sc.w - 60, 'ns-screen');
    if (s.phase === 'intro') return out;
    var num = String(s.done);
    out += P.text(x, C.y, num, P.style('--term-ok', C.size, '--font-mono', 600), { 'data-on': 'ns-screen' });
    out += P.text(x + P.width(num, C.size) + 10, C.y, L.unit, P.style('--term-ink', C.unit), { 'data-on': 'ns-screen' });
    if (s.asking) {
      var dots = '...'.slice(0, 1 + Math.floor((s.minute / 6) % 3));
      out += P.text(x, Ba.y + 12, L.waiting + dots, P.style('--term-err', 22, '--font-hand', 700), { 'data-on': 'ns-screen' });
      if (s.waitMin >= 1) out += P.text(x, Ba.y + 46, fmt(L.waited, { d: hm(s.waitMin, copy) }), P.style('--term-ink', 18), { 'data-on': 'ns-screen' });
    } else if (s.partial > 0 || s.station === 'first') {
      out += P.text(x, Ba.y - 8, L.running, P.style('--term-ink', 18), { 'data-on': 'ns-screen' });
      out += tag('rect', { x: x, y: Ba.y, width: Ba.w, height: Ba.h, rx: Ba.h / 2, style: 'fill:none;stroke:var(--term-ink);stroke-width:1.5;opacity:0.6' });
      out += tag('rect', { x: x, y: Ba.y, width: (Ba.w * s.partial).toFixed(1), height: Ba.h, rx: Ba.h / 2, style: 'fill:var(--term-ok)' });
    }
    out += drawBubble(g, P, s, copy);
    return out;
  }

  function drawBubble(g, P, s, copy) {
    if (!s.bubble) return '';
    var Bu = g.bubble, out = '', ask = copy.ask;
    var struck = s.bubble === 'struck';
    var pop = s.station === 'ask' ? T.ease.out(s.local / 0.2) : 1;
    var fade = struck ? 1 - T.clamp((s.local - 0.85) / 0.15, 0, 1) : 1;
    var stroke = struck ? 'stroke:var(--discard);stroke-width:2.5;stroke-dasharray:7 5' : 'stroke:var(--accent);stroke-width:3';
    // a short tail toward the bedroom; a card-colored patch hides the border where it joins
    var tail, patch;
    if (Bu.tail === 'left') {
      var by = Bu.y + Bu.h * 0.68;
      tail = 'M' + Bu.x + ' ' + (by - 14) + ' L' + (Bu.x - 42) + ' ' + (by + 26) + ' L' + Bu.x + ' ' + (by + 10) + ' Z';
      patch = { x: Bu.x - 1, y: by - 12, width: 6, height: 20 };
    } else {
      var tx0 = Bu.x + 70;
      tail = 'M' + tx0 + ' ' + Bu.y + ' L' + (tx0 + 6) + ' ' + (Bu.y - 40) + ' L' + (tx0 + 30) + ' ' + Bu.y + ' Z';
      patch = { x: tx0 + 2, y: Bu.y - 1, width: 26, height: 6 };
    }
    out += tag('path', { d: tail, style: 'fill:var(--card);' + stroke });
    out += tag('rect', { x: Bu.x, y: Bu.y, width: Bu.w, height: Bu.h, rx: 18, style: 'fill:var(--card);' + stroke, 'data-box': 'ns-bubble' });
    out += tag('rect', Object.assign({ style: 'fill:var(--card)' }, patch));
    out += P.fit(Bu.x + 22, Bu.y + Bu.h * 0.45, ask.cn, struck ? '--ink-2' : '--ink', Bu.cn, '--font-hand', 700, Bu.w - 44, 'ns-bubble');
    out += P.fit(Bu.x + 22, Bu.y + Bu.h * 0.78, '"' + ask.quote + '"', '--ink-2', Bu.en, '--font-mono', 400, Bu.w - 44, 'ns-bubble');
    if (struck) {
      var sp = T.clamp((s.local - 0.3) / 0.2, 0, 1), sw = P.width(ask.cn, Bu.cn) + 10, sy = Bu.y + Bu.h * 0.45 - Bu.cn * 0.32;
      if (sp > 0) out += tag('line', { x1: Bu.x + 16, y1: sy, x2: Bu.x + 16 + sw * sp, y2: sy, style: 'stroke:var(--crash);stroke-width:4;stroke-linecap:round' });
    }
    return tag('g', { transform: 'translate(' + (Bu.x + Bu.w / 2) + ' ' + (Bu.y + Bu.h / 2) + ') scale(' + (0.6 + 0.4 * pop).toFixed(3) + ') translate(' + (-(Bu.x + Bu.w / 2)) + ' ' + (-(Bu.y + Bu.h / 2)) + ')',
      style: 'opacity:' + (pop * fade).toFixed(3) }, out);
  }

  // program.md's rule, taped to the screen; the toggle peels it off
  function drawNote(g, P, s, copy) {
    var N = g.note, off = s.allowAsk, out = '';
    var glow = s.bubble === 'struck' ? T.ease.out(T.clamp((s.local - 0.45) / 0.2, 0, 1)) * (1 - T.clamp((s.local - 0.85) / 0.15, 0, 1)) : 0;
    var sc = 1 + 0.12 * glow;
    out += tag('rect', { x: N.x, y: N.y, width: N.w, height: N.h, rx: 4,
      style: off ? 'fill:var(--card);stroke:var(--discard);stroke-width:2;stroke-dasharray:5 4' : 'fill:var(--card);stroke:var(--accent);stroke-width:' + (2.5 + 2 * glow).toFixed(2),
      'data-box': 'ns-note' });
    out += P.fit(N.x + N.w / 2, N.y + N.h / 2 + 6, copy.labels.stamp, off ? '--ink-2' : '--accent-ink', 17, '--font-mono', 700, N.w - 16, 'ns-note', 'middle');
    if (off) out += tag('line', { x1: N.x + 6, y1: N.y + N.h / 2, x2: N.x + N.w - 6, y2: N.y + N.h / 2, style: 'stroke:var(--crash);stroke-width:3' });
    var cx = N.x + N.w / 2, cy = N.y + N.h / 2;
    return tag('g', { transform: 'rotate(4 ' + cx + ' ' + cy + ') translate(' + cx + ' ' + cy + ') scale(' + sc.toFixed(3) + ') translate(' + (-cx) + ' ' + (-cy) + ')' }, out);
  }

  function drawIdeas(g, P, s, copy, Sc) {
    var I = g.ideas, out = '', x = Sc.x + 18, w = Sc.w - 36;
    out += P.fit(x, I.y, copy.labels.ideas_title, '--term-ink', I.size, '--font-hand', 700, w, 'ns-screen');
    copy.ideas.forEach(function (idea, k) {
      if (k >= s.ideas) return;
      var p = k === s.ideas - 1 && s.station === 'idea' + (k + 1) ? T.ease.out(s.local / 0.5) : 1;
      var y = I.top + k * (I.h + I.gap), id = 'ns-idea-' + k;
      var inner = tag('rect', { x: x, y: y, width: w, height: I.h, rx: 10, style: 'fill:var(--card)', 'data-box': id });
      inner += P.fit(x + 16, y + I.h * (I.stack ? 0.4 : 0.46), (k + 1) + '. ' + idea.cn, '--ink', I.cn, '--font-hand', 700, w - 32, id);
      inner += P.fit(x + 16, y + I.h * (I.stack ? 0.8 : 0.84), idea.quote, '--ink-2', I.en, '--font-mono', 400, w - 32, id);
      out += tag('g', { transform: 'translate(' + ((1 - p) * 24).toFixed(2) + ' 0)', style: 'opacity:' + p.toFixed(3) }, inner);
    });
    return out;
  }

  /* ---------- timeline ---------- */

  function drawLine(g, P, s, copy) {
    var L = g.line, out = '', k = (L.x1 - L.x0) / M.NIGHT_MIN;
    var xs = function (m) { return L.x0 + k * m; };
    out += tag('rect', { x: L.x0, y: L.y, width: L.x1 - L.x0, height: L.h, rx: 8, style: 'fill:var(--card);stroke:var(--line);stroke-width:1.5' });
    for (var i = 0; i < s.done; i++) {
      out += tag('rect', { x: (xs(i * M.RUN_MIN) + 0.5).toFixed(2), y: L.y + 6, width: Math.max(0.5, k * M.RUN_MIN - 1).toFixed(2), height: L.h - 12, rx: 2, style: 'fill:var(--accent)' });
    }
    if (s.partial > 0) {
      out += tag('rect', { x: (xs(s.done * M.RUN_MIN) + 0.5).toFixed(2), y: L.y + 6, width: (k * M.RUN_MIN * s.partial).toFixed(2), height: L.h - 12, rx: 2,
        style: 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:1' });
    }
    if (s.asking && s.waitMin > 0) {
      var a = xs(M.RUN_MIN) + 1, b = xs(M.RUN_MIN + s.waitMin) - 1;
      out += tag('rect', { x: a.toFixed(2), y: L.y + 6, width: Math.max(0, b - a).toFixed(2), height: L.h - 12, rx: 3, style: 'fill:url(#ns-hatch)' });
      var lab = copy.labels.wait_bar, lw = P.width(lab, 17) + 22;
      if (b - a > lw + 20) {
        var cx = (a + b) / 2;
        out += tag('rect', { x: (cx - lw / 2).toFixed(2), y: L.y + L.h / 2 - 15, width: lw.toFixed(2), height: 30, rx: 15, style: 'fill:var(--card)', 'data-box': 'ns-wait' });
        out += P.fit(cx, L.y + L.h / 2 + 6, lab, '--crash-ink', 17, '--font-hand', 700, lw - 14, 'ns-wait', 'middle');
      }
    }
    if (s.phase === 'run') {
      var cxx = xs(s.minute);
      out += tag('line', { x1: cxx, y1: L.y - 8, x2: cxx, y2: L.y + L.h + 8, style: 'stroke:var(--accent);stroke-width:2.5;stroke-dasharray:5 4' });
    }
    for (var hr = 0; hr * 60 <= M.NIGHT_MIN; hr += L.every) {
      out += P.text(xs(hr * 60), L.y + L.h + 26, M.clockText(hr * 60), P.style('--ink-2', L.label, '--font-mono'), { 'text-anchor': 'middle', 'data-on': 'stage' });
    }
    // run count above the line, and the 示意 chip
    var cnt = fmt(copy.labels.night_runs, { n: s.done });
    out += P.text(L.x1, L.top, cnt, P.style(s.allowAsk && s.asking ? '--crash-ink' : '--accent-ink', 21, '--font-hand', 700), { 'text-anchor': 'end', 'data-on': 'stage' });
    var cw = P.width(copy.labels.illus, 15) + 16;
    out += tag('rect', { x: L.x0, y: L.top - 18, width: cw.toFixed(1), height: 24, rx: 6, style: 'fill:var(--card);stroke:var(--ink-3);stroke-width:1.2;stroke-dasharray:4 3', 'data-box': 'ns-illus' });
    out += P.fit(L.x0 + 8, L.top - 1, copy.labels.illus, '--ink-2', 15, '--font-hand', 400, cw - 16, 'ns-illus');
    return out;
  }

  function captionFor(s, copy) {
    var c = copy.captions;
    if (s.phase === 'intro') return c.intro;
    var st = s.station, ask = s.allowAsk;
    if (st === 'first') return c.first;
    if (st === 'ask') return ask ? c.ask_allow : c.ask_never;
    if (st === 'night') return ask ? c.night_allow : c.night_never;
    if (st === 'wake') return ask ? c.wake_allow : fmt(c.wake_never, { n: s.done });
    var k = s.ideas;
    return fmt(c.idea, { k: k, cn: copy.ideas[k - 1].cn });
  }

  var DEFS = '<defs><pattern id="ns-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
    '<line x1="0" y1="0" x2="0" y2="10" style="stroke:var(--line);stroke-width:4"/></pattern></defs>';

  window.Explain.register('neverstop', function (svg, ctx) {
    var copy = ctx.copy;
    var opts = { allowAsk: false };
    var mode = 'landscape';
    return {
      duration: M.duration(),
      stops: M.stops(),
      setOption: function (key, value) { opts[key] = value; },
      layout: function (width) {
        mode = width > 0 && width < 780 ? 'portrait' : 'landscape';
        svg.setAttribute('viewBox', '0 0 ' + GEO[mode].W + ' ' + GEO[mode].H);
      },
      render: function (t) {
        var g = GEO[mode], P = Painter(g);
        var s = M.stateAt(t, opts);
        var dim = s.ideas > 0 ? 0.4 : 1;  // the idea list is an aside: the room steps back
        svg.innerHTML = DEFS + tag('g', { style: 'opacity:' + dim }, drawRoom(g, P, s)) + drawMonitor(g, P, s, copy) + drawLine(g, P, s, copy);
        ctx.caption(captionFor(s, copy));
      }
    };
  });
})();
