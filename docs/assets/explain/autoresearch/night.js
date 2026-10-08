/* autoresearch scene "night" drawing — one night by hand vs. by autoresearch.
 * State comes from NightModel.stateAt(t, {hours}); this file only draws it.
 * Colors are CSS variables set via style=. Orange = an experiment on the GPU
 * (solid = training, pale = a person editing / reading); hatching = GPU idle.
 * Text on a card carries data-on="<box id>", text that must stay inside a card
 * carries data-fit. Landscape 1200×675, portrait 540×1080 (svg < 780px wide);
 * portrait text is never below 15px. */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var M = window.NightModel;
  var D = window.ExplainDraw;
  var tag = D.tag, lerp = D.lerp, fmt = D.fmt, Painter = D.Painter;

  var GEO = {
    landscape: {
      W: 1200, H: 675, minFont: 13,
      clock: { x: 40, y: 82, size: 46 },
      axis: { x0: 220, x1: 1040, every: 1, y: 446, size: 14 },
      sky: { low: 132, high: 52, moonR: 17 },
      zone: { top: 146, labelY: 172, bottom: 414, labelSize: 19 },
      human: { y: 190, h: 66, labelX: 40, labelY: 231, countX: 1066, countY: 238 },
      ai: { y: 304, h: 66, labelX: 40, labelY: 345, countX: 1066, countY: 352 },
      label: 23, count: 40, unit: 18,
      zzz: { x: 150, y: 196 },
      legend: { x: 34, y: 260, size: 15, stack: true },
      brackets: { y: 386, labelY: 405, size: 14 },
      callout: { w: 420, h: 80, y: 490, title: 22, sub: 17 },
      formula: { y: 548, size: 34, readmeY: 594, readme: 19 }
    },
    portrait: {
      W: 540, H: 1080, minFont: 15,
      clock: { x: 24, y: 84, size: 44 },
      axis: { x0: 24, x1: 516, every: 2, y: 776, size: 15 },
      sky: { low: 238, high: 120, moonR: 16 },
      zone: { top: 258, labelY: 288, bottom: 744, labelSize: 19 },
      human: { y: 346, h: 84, labelX: 24, labelY: 330, countX: 516, countY: 334, countAnchor: 'end' },
      ai: { y: 598, h: 84, labelX: 24, labelY: 582, countX: 516, countY: 586, countAnchor: 'end' },
      label: 23, count: 36, unit: 17,
      zzz: { x: 150, y: 318 },
      legend: { x: 24, y: 452, size: 15 },
      brackets: { y: 702, labelY: 726, size: 15 },
      callout: { w: 460, h: 90, y: 818, title: 23, sub: 18, left: 40, handY: 448 },
      formula: { y: 866, size: 28, readmeY: 914, readme: 19 }
    }
  };

  function xsOf(g) {
    var A = g.axis, k = (A.x1 - A.x0) / M.AXIS_END;
    return function (minute) { return A.x0 + k * minute; };
  }

  /* ---------- pieces ---------- */

  function drawSky(g, P, s, xs) {
    var S = g.sky, out = '';
    var wakeP = s.station === 'wake' ? T.ease.out(s.local / 0.5) : 0;
    if (s.minute > M.SLEEP_AT && s.station !== 'wake') {
      // stars, then the moon on an arc from bedtime to wake-up
      var stars = [[0.12, 0.35], [0.27, 0.8], [0.41, 0.2], [0.58, 0.65], [0.72, 0.3], [0.88, 0.75]];
      var x0 = xs(M.SLEEP_AT), x1 = xs(s.wake);
      stars.forEach(function (st) {
        var x = lerp(x0, x1, st[0]), y = lerp(S.high, S.low, st[1]) - 10;
        out += tag('path', { d: 'M' + x + ' ' + (y - 6) + ' L' + (x + 1.6) + ' ' + (y - 1.6) + ' L' + (x + 6) + ' ' + y + ' L' + (x + 1.6) + ' ' + (y + 1.6) +
          ' L' + x + ' ' + (y + 6) + ' L' + (x - 1.6) + ' ' + (y + 1.6) + ' L' + (x - 6) + ' ' + y + ' L' + (x - 1.6) + ' ' + (y - 1.6) + ' Z',
          style: 'fill:var(--ink-3);opacity:0.7' });
      });
      var f = T.clamp((s.minute - M.SLEEP_AT) / (s.wake - M.SLEEP_AT), 0, 1);
      var mx = lerp(x0, x1, f), my = S.low - (S.low - S.high) * Math.sin(Math.PI * f), r = S.moonR;
      out += tag('path', { d: 'M' + mx + ' ' + (my - r) + ' A' + r + ' ' + r + ' 0 1 0 ' + mx + ' ' + (my + r) +
        ' A' + (r * 0.55) + ' ' + r + ' 0 0 1 ' + mx + ' ' + (my - r) + ' Z',
        style: 'fill:var(--card);stroke:var(--ink-2);stroke-width:2' });
    }
    if (wakeP > 0) {
      var sx = xs(s.wake), sy = S.high + 18;
      var rays = '';
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4;
        rays += 'M' + (sx + 20 * Math.cos(a)) + ' ' + (sy + 20 * Math.sin(a)) + ' L' + (sx + 28 * Math.cos(a)) + ' ' + (sy + 28 * Math.sin(a)) + ' ';
      }
      out += tag('g', { style: 'opacity:' + wakeP.toFixed(3) },
        tag('circle', { cx: sx, cy: sy, r: 13, style: 'fill:var(--accent)' }) +
        tag('path', { d: rays, style: 'stroke:var(--accent);stroke-width:3;stroke-linecap:round' }));
    }
    return out;
  }

  function drawZone(g, P, s, copy, xs) {
    var Z = g.zone, out = '';
    var x0 = xs(M.SLEEP_AT), x1 = xs(s.wake);
    out += tag('rect', { x: x0, y: Z.top, width: x1 - x0, height: Z.bottom - Z.top, rx: 10,
      style: 'fill:var(--paper-2)', 'data-box': 'night-zone' });
    out += P.text(xs(M.SLEEP_AT / 2), Z.labelY, copy.labels.before, P.style('--ink-2', Z.labelSize), { 'text-anchor': 'middle', 'data-on': 'stage' });
    out += P.text((x0 + x1) / 2, Z.labelY, fmt(copy.labels.sleep, { h: s.hours }), P.style('--ink', Z.labelSize, '--font-hand', 700),
      { 'text-anchor': 'middle', 'data-on': 'night-zone' });
    // wake-up line: moves with the slider, even on the last frame
    out += tag('line', { x1: x1, y1: Z.top - 8, x2: x1, y2: Z.bottom + 6, style: 'stroke:var(--ink-2);stroke-width:2;stroke-dasharray:2 5' });
    var wakeW = P.width(copy.labels.wake, Z.labelSize), right = x1 + 8 + wakeW < g.W - 4;
    out += P.text(right ? x1 + 8 : x1 - 8, Z.labelY, copy.labels.wake, P.style('--ink-2', Z.labelSize),
      { 'text-anchor': right ? 'start' : 'end', 'data-on': right ? 'stage' : 'night-zone' });
    return out;
  }

  function lane(g, L) {
    var A = g.axis;
    return tag('rect', { x: A.x0, y: L.y, width: A.x1 - A.x0, height: L.h, rx: 8, style: 'fill:var(--card);stroke:var(--line);stroke-width:1.5' });
  }

  function seg(xs, L, a, b, upTo, style) {
    var end = Math.min(b, upTo);
    if (end <= a) return '';
    return tag('rect', { x: (xs(a) + 0.5).toFixed(2), y: L.y + 6, width: Math.max(0, xs(end) - xs(a) - 1).toFixed(2), height: L.h - 12, rx: 3, style: style });
  }

  var SOFT = 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:1';
  var SOLID = 'fill:var(--accent)';

  function drawHuman(g, P, s, copy, xs) {
    var L = g.human, out = lane(g, L);
    M.HUMAN.forEach(function (r) {
      var a = r.start, b = a + r.edit, c = b + r.train, d = c + r.read;
      out += seg(xs, L, a, b, s.minute, SOFT) + seg(xs, L, b, c, s.minute, SOLID) + seg(xs, L, c, d, s.minute, SOFT);
    });
    var upTo = Math.min(s.minute, s.wake);
    if (upTo > M.SLEEP_AT) {
      var x0 = xs(M.SLEEP_AT) + 1, x1 = xs(upTo) - 1;
      out += tag('rect', { x: x0, y: L.y + 6, width: Math.max(0, x1 - x0).toFixed(2), height: L.h - 12, rx: 3, style: 'fill:url(#night-hatch)' });
      if (x1 - x0 > 150) {
        var cx = (x0 + x1) / 2, w = P.width(copy.labels.idle, 20) + 24;
        out += tag('rect', { x: (cx - w / 2).toFixed(2), y: L.y + L.h / 2 - 17, width: w.toFixed(2), height: 34, rx: 17, style: 'fill:var(--card)', 'data-box': 'night-idle' });
        out += P.fit(cx, L.y + L.h / 2 + 7, copy.labels.idle, '--ink-2', 20, '--font-hand', 400, w - 16, 'night-idle', 'middle');
      }
    }
    return out;
  }

  function drawAI(g, P, s, xs) {
    var L = g.ai, out = lane(g, L);
    for (var i = 0; i < s.aiDone; i++) {
      var a = M.SLEEP_AT + i * M.RUN_MIN;
      out += seg(xs, L, a, a + M.RUN_MIN, Infinity, SOLID);
    }
    if (s.aiPartial > 0) {
      var b = M.SLEEP_AT + s.aiDone * M.RUN_MIN;
      out += seg(xs, L, b, b + M.RUN_MIN * s.aiPartial, Infinity, SOFT);
    }
    return out;
  }

  function drawLabels(g, P, s, copy) {
    var out = '', H = g.human, A = g.ai;
    out += P.text(H.labelX, H.labelY, copy.lanes.human, P.style('--ink', g.label, '--font-hand', 700), { 'data-on': 'stage' });
    out += P.text(A.labelX, A.labelY, copy.lanes.ai, P.style('--ink', g.label, '--font-mono', 600), { 'data-on': 'stage' });
    [[H, s.humanDone, '--ink'], [A, s.aiDone, '--accent-ink']].forEach(function (c) {
      var L = c[0], anchor = L.countAnchor || 'start';
      var num = String(c[1]), unitW = P.width(copy.labels.unit, g.unit) + 4;
      var nx = anchor === 'end' ? L.countX - unitW : L.countX;
      out += P.text(nx, L.countY, num, P.style(c[2], g.count, '--font-mono', 600), { 'text-anchor': anchor, 'data-on': 'stage' });
      var ux = anchor === 'end' ? L.countX : L.countX + P.width(num, g.count) + 4;
      out += P.text(ux, L.countY, copy.labels.unit, P.style('--ink-2', g.unit), { 'text-anchor': anchor, 'data-on': 'stage' });
    });
    // Zzz next to "你自己做" while asleep
    if (s.asleep) {
      var ph = (s.minute / 30) % 1, Zz = g.zzz;
      [['z', 15, 0], ['z', 18, 0.33], ['Z', 22, 0.66]].forEach(function (z, i) {
        var p = (ph + z[2]) % 1;
        out += P.text(Zz.x + i * 14, Zz.y - p * 26, z[0], P.style('--ink-2', z[1], '--font-hand', 700),
          { style: P.style('--ink-2', z[1], '--font-hand', 700) + ';opacity:' + (1 - Math.abs(p - 0.5) * 1.6).toFixed(3) });
      });
    }
    return out;
  }

  // what the two oranges mean; on its own card so the text has a known background
  function drawLegend(g, P, s, copy) {
    if (s.phase === 'intro') return '';
    if (g.callout.handY && s.station === 'evening' && s.local > 0.15) return '';  // portrait: the note sits here
    var Lg = g.legend, sz = P.size(Lg.size), items = [[SOFT, copy.labels.legend_soft], [SOLID, copy.labels.legend_solid]];
    var widths = items.map(function (it) { return 30 + P.width(it[1], Lg.size); });
    var w = Lg.stack ? Math.max.apply(null, widths) + 20 : widths[0] + widths[1] + 46;
    var h = Lg.stack ? 2 * (sz + 10) + 8 : sz + 18;
    var out = tag('rect', { x: Lg.x, y: Lg.y, width: w.toFixed(1), height: h, rx: 8, style: 'fill:var(--card);stroke:var(--line-soft)', 'data-box': 'night-legend' });
    var x = Lg.x + 10, y = Lg.y + sz + 8;
    items.forEach(function (it, i) {
      out += tag('rect', { x: x, y: y - sz + 3, width: 22, height: sz - 3, rx: 3, style: it[0] });
      out += P.fit(x + 30, y, it[1], '--ink-2', Lg.size, '--font-hand', 400, widths[i] - 30, 'night-legend');
      if (Lg.stack) y += sz + 10; else x += widths[i] + 26;
    });
    return out;
  }

  function drawBrackets(g, P, s, copy, xs) {
    var B = g.brackets, out = '';
    var full = Math.floor((Math.min(s.minute, s.wake) - M.SLEEP_AT) / 60 + 1e-9);
    for (var i = 0; i < full; i++) {
      var a = xs(M.SLEEP_AT + 60 * i) + 3, b = xs(M.SLEEP_AT + 60 * (i + 1)) - 3;
      out += tag('path', { d: 'M' + a + ' ' + (B.y - 6) + ' L' + a + ' ' + B.y + ' L' + b + ' ' + B.y + ' L' + b + ' ' + (B.y - 6),
        style: 'fill:none;stroke:var(--ink-3);stroke-width:1.5' });
      out += P.text((a + b) / 2, B.labelY, copy.labels.per_hour, P.style('--ink-2', B.size, '--font-mono', 600), { 'text-anchor': 'middle', 'data-on': 'night-zone' });
    }
    return out;
  }

  function drawAxis(g, P, s, xs) {
    var A = g.axis, out = '';
    for (var j = 0; j * 60 <= M.AXIS_END; j++) {
      var x = xs(j * 60);
      out += tag('line', { x1: x, y1: A.y - 22, x2: x, y2: A.y - 14, style: 'stroke:var(--ink-3);stroke-width:1.5' });
      if (j % A.every === 0) out += P.text(x, A.y, M.clockText(j * 60), P.style('--ink-2', A.size, '--font-mono'), { 'text-anchor': 'middle', 'data-on': 'stage' });
    }
    if (s.phase === 'run') {
      var cx = xs(s.minute);
      out += tag('line', { x1: cx, y1: g.zone.top - 6, x2: cx, y2: g.ai.y + g.ai.h + 6, style: 'stroke:var(--accent);stroke-width:2.5;stroke-dasharray:6 5' });
    }
    return out;
  }

  function drawClock(g, P, s) {
    var C = g.clock;
    return P.text(C.x, C.y, s.clock, P.style('--ink', C.size, '--font-mono', 600), { 'data-on': 'stage' });
  }

  // a note card under the lanes, with an arrow up to the block it explains
  function callout(g, P, xs, minute, fromY, title, sub, opacity, id, y) {
    var C = g.callout, left = C.left !== undefined ? C.left : Math.max(g.axis.x0 - 10, xs(minute) - 40);
    var bx = xs(minute), top = y || C.y;
    var inner = tag('path', { d: 'M' + bx + ' ' + fromY + ' L' + bx + ' ' + (top - 2), style: 'stroke:var(--accent);stroke-width:2', 'marker-end': 'url(#night-arrow)' });
    inner += tag('rect', { x: left, y: top, width: C.w, height: C.h, rx: 12, style: 'fill:var(--card);stroke:var(--accent);stroke-width:2', 'data-box': id });
    inner += P.fit(left + 18, top + C.h * 0.42, title, '--ink', C.title, '--font-hand', 700, C.w - 36, id);
    inner += P.fit(left + 18, top + C.h * 0.8, sub, '--ink-2', C.sub, '--font-hand', 400, C.w - 36, id);
    return tag('g', { style: 'opacity:' + T.clamp(opacity, 0, 1).toFixed(3) }, inner);
  }

  function drawBottom(g, P, s, copy, xs) {
    var out = '', L = copy.labels;
    if (s.station === 'evening' && s.local > 0.15) {
      // one run by hand: the arrow passes through the empty 21:00–22:00 part of the AI lane
      out += callout(g, P, xs, M.HUMAN[0].start + 15, g.human.y + g.human.h + 4, L.human_cell_title, L.human_cell_sub,
        T.ease.out((s.local - 0.15) / 0.3), 'night-hand', g.callout.handY);
    }
    if (s.station === 'first' || (s.station === 'night' && s.local < 0.25)) {
      var op = s.station === 'first' ? T.ease.out(s.local / 0.4) : 1 - s.local / 0.25;
      out += callout(g, P, xs, M.SLEEP_AT + M.RUN_MIN / 2, g.ai.y + g.ai.h + 4, L.cell_title, L.cell_sub, op, 'night-cell');
    }
    if (s.station === 'wake') {
      var F = g.formula, p = T.ease.out(s.local / 0.4), mid = g.W / 2;
      out += tag('g', { style: 'opacity:' + p.toFixed(3) },
        P.text(mid, F.y, fmt(copy.labels.formula, { h: s.hours, n: s.aiDone }), P.style('--accent-ink', F.size, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'stage' }) +
        P.text(mid, F.readmeY, copy.labels.readme, P.style('--ink-2', F.readme), { 'text-anchor': 'middle', 'data-on': 'stage' }));
    }
    return out;
  }

  function captionFor(s, copy) {
    var c = copy.captions;
    if (s.phase === 'intro') return c.intro;
    if (s.station === 'wake') return fmt(c.wake, { clock: s.clock, n: s.aiDone, h: s.hours });
    return c[s.station];
  }

  var DEFS = '<defs>' +
    '<pattern id="night-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
    '<line x1="0" y1="0" x2="0" y2="10" style="stroke:var(--line);stroke-width:4"/></pattern>' +
    '<marker id="night-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
    '<path d="M0 0 L10 5 L0 10 z" style="fill:var(--accent)"/></marker></defs>';

  window.Explain.register('night', function (svg, ctx) {
    var copy = ctx.copy;
    var opts = { hours: M.DEFAULT_HOURS };
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
        var g = GEO[mode], P = Painter(g), xs = xsOf(g);
        var s = M.stateAt(t, opts);
        svg.innerHTML = DEFS + drawSky(g, P, s, xs) + drawZone(g, P, s, copy, xs) + drawClock(g, P, s) +
          drawHuman(g, P, s, copy, xs) + drawAI(g, P, s, xs) + drawLabels(g, P, s, copy) +
          drawLegend(g, P, s, copy) + drawBrackets(g, P, s, copy, xs) + drawAxis(g, P, s, xs) +
          drawBottom(g, P, s, copy, xs);
        ctx.caption(captionFor(s, copy));
      }
    };
  });
})();
