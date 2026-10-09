/* autoresearch scene "budget" drawing — three 5-minute runs side by side on one clock.
 * Each lane is one run with the GPU to itself (program.md runs one experiment
 * at a time); they are drawn side by side only to compare them.
 * State comes from BudgetModel.stateAt(t, {fixedSteps, machine}); this file
 * only draws it. Tracks share one absolute step scale (0 .. MAX_STEPS), so a
 * slower machine draws shorter bars and the fixed-steps finish line sits at
 * the same place in every option. In the "hour" station each track turns into
 * one hour filled with that candidate's runs; s.view says which of the two
 * pictures is on screen and which caption goes with it. Colors are CSS variables:
 * orange = training, green = best score, red = over the 5-minute budget.
 * Landscape 1200×675, portrait 540×1080 (svg < 780px wide, text ≥ 15px). */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var M = window.BudgetModel;
  var D = window.ExplainDraw;
  var tag = D.tag, lerp = D.lerp, fmt = D.fmt, polar = D.polar, Painter = D.Painter;

  var GEO = {
    landscape: {
      W: 1200, H: 675, minFont: 13,
      watch: { cx: 112, cy: 122, r: 62, label: 40, time: 28 },
      ff: { x: 196, y: 186, anchor: 'start' },
      title: { x: 300, y: 70, size: 27, wrap: false },
      machine: { x: 300, y: 112, size: 18 },
      head: { y: 200, size: 17 },
      score: { x: 1180, headY: 200 },
      lanes: [222, 344, 466],
      lane: {
        name: { x: 40, dy: 44, size: 26 }, note: { dy: 72, size: 16 }, icon: { x: 262, dy: 64 },
        track: { x0: 300, x1: 900, dy: 24, h: 40 },
        steps: { size: 17 },
        status: { x: 918, dy: 50, size: 18, anchor: 'start' },
        val: { dy: 52, size: 24 }, badge: { dy: 86, beside: false }
      },
      axisY: 560,
      bottom: { x: 600, y: 622, size: 25 }
    },
    portrait: {
      W: 540, H: 1080, minFont: 15,
      watch: { cx: 104, cy: 132, r: 58, label: 48, time: 26 },
      ff: { x: 104, y: 230, anchor: 'middle' },
      title: { x: 196, y: 108, size: 21, wrap: true, gap: 30 },
      machine: { x: 196, y: 186, size: 17 },
      head: { y: 268, size: 16 },
      score: { x: 516, headY: 268 },
      lanes: [286, 494, 702],
      lane: {
        name: { x: 24, dy: 30, size: 24 }, note: { dy: 58, size: 16 }, icon: { x: 236, dy: 54 },
        track: { x0: 24, x1: 516, dy: 76, h: 40 },
        steps: { size: 17 },
        status: { x: 516, dy: 150, size: 18, anchor: 'end' },
        val: { dy: 30, size: 22 }, badge: { dy: 30, beside: true }
      },
      axisY: 900,
      bottom: { x: 270, y: 966, size: 22 }
    }
  };

  function mmss(min) {
    var sec = Math.round(min * 60);
    return Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2);
  }
  function aboutN(n) { return String(Math.round(n)); }  // runs per hour, shown as 约 n 次

  /* ---------- pieces ---------- */

  function drawWatch(g, P, s, copy) {
    var Wt = g.watch, out = '';
    out += P.text(Wt.cx, Wt.cy - Wt.r - 18, copy.labels.clock, P.style('--ink-2', 17), { 'text-anchor': 'middle', 'data-on': 'stage' });
    out += tag('circle', { cx: Wt.cx, cy: Wt.cy, r: Wt.r, style: 'fill:var(--card);stroke:var(--line);stroke-width:10', 'data-box': 'watch' });
    var f = T.clamp(s.clock / M.BUDGET_MIN, 0, 1);
    if (f > 0.001) {
      var a0 = polar(Wt.cx, Wt.cy, Wt.r, -90), a1 = polar(Wt.cx, Wt.cy, Wt.r, -90 + 359.9 * f);
      out += tag('path', { d: 'M' + a0[0] + ' ' + a0[1] + ' A' + Wt.r + ' ' + Wt.r + ' 0 ' + (f > 0.5 ? 1 : 0) + ' 1 ' + a1[0].toFixed(2) + ' ' + a1[1].toFixed(2),
        style: 'fill:none;stroke:var(--accent);stroke-width:10;stroke-linecap:round' });
    }
    var over = s.clock - M.BUDGET_MIN;
    out += P.text(Wt.cx, Wt.cy + (over > 1e-6 ? 2 : 10), mmss(s.clock), P.style('--ink', Wt.time, '--font-mono', 600), { 'text-anchor': 'middle', 'data-on': 'watch' });
    if (over > 1e-6) {
      out += P.text(Wt.cx, Wt.cy + 28, fmt(copy.labels.over, { m: mmss(over) }), P.style('--crash-ink', 15, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'watch' });
    }
    if (s.station === 'after' && s.fixedSteps) {
      var F = g.ff, x = F.anchor === 'middle' ? F.x - 34 : F.x;
      out += tag('path', { d: 'M' + x + ' ' + (F.y - 14) + ' l12 7 l-12 7 z M' + (x + 12) + ' ' + (F.y - 14) + ' l12 7 l-12 7 z', style: 'fill:var(--accent)' });
      out += P.text(x + 30, F.y - 1, copy.labels.fast_forward, P.style('--accent-ink', 17, '--font-hand', 700), { 'data-on': 'stage' });
    }
    return out;
  }

  function drawTitle(g, P, s, copy) {
    var Ti = g.title, M2 = g.machine, out = '';
    var text = s.fixedSteps ? copy.labels.compare_steps : copy.labels.compare_time;
    var lines = Ti.wrap ? text.split('，') : [text];
    lines.forEach(function (l, i) {
      out += P.text(Ti.x, Ti.y + i * (Ti.gap || 0), l, P.style('--ink', Ti.size, '--font-hand', 700), { 'data-on': 'stage' });
    });
    var mt = s.machine === 'slow' ? copy.labels.machine_slow : copy.labels.machine_this;
    out += P.text(M2.x, M2.y, mt, P.style(s.machine === 'slow' ? '--accent-ink' : '--ink-2', M2.size, '--font-hand', 700), { 'data-on': 'stage' });
    // the "illustrative numbers" chip, drawn like the page's 示意 tag
    var cx = M2.x + P.width(mt, M2.size) + 14, cw = P.width(copy.labels.illus, 15) + 16;
    out += tag('rect', { x: cx, y: M2.y - 17, width: cw.toFixed(1), height: 24, rx: 6,
      style: 'fill:var(--card);stroke:var(--ink-3);stroke-width:1.2;stroke-dasharray:4 3', 'data-box': 'budget-illus' });
    out += P.fit(cx + 8, M2.y, copy.labels.illus, '--ink-2', 15, '--font-hand', 400, cw - 16, 'budget-illus');
    return out;
  }

  function sizeIcon(x, y, i) {
    var n = i + 2, sq = 9, gap = 3, out = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      out += tag('rect', { x: x - (n - c) * (sq + gap), y: y - (n - r) * (sq + gap), width: sq, height: sq, rx: 2, style: 'fill:var(--ink-3);opacity:0.55' });
    }
    return out;
  }

  function trackX(g, steps) {
    var Tr = g.lane.track;
    return Tr.x0 + (Tr.x1 - Tr.x0) * T.clamp(steps / M.MAX_STEPS, 0, 1);
  }

  function drawLaneHeads(g, P, s, copy) {
    var L = g.lane, out = '';
    s.lanes.forEach(function (ln, i) {
      var top = g.lanes[i], c = copy.cands[ln.key];
      out += P.text(L.name.x, top + L.name.dy, c.name, P.style('--ink', L.name.size, '--font-hand', 700), { 'data-on': 'stage' });
      out += P.text(L.name.x, top + L.note.dy, c.note, P.style('--ink-2', L.note.size), { 'data-on': 'stage' });
      out += sizeIcon(L.icon.x, top + L.icon.dy, i);
    });
    return out;
  }

  // race view: steps along one absolute scale
  function drawTracks(g, P, s, copy, opacity) {
    if (opacity <= 0) return '';
    var L = g.lane, Tr = L.track, out = '';
    out += P.text(Tr.x0, g.head.y, copy.labels.steps_title, P.style('--ink-2', g.head.size), { 'data-on': 'stage' });
    s.lanes.forEach(function (ln, i) {
      var top = g.lanes[i], y = top + Tr.dy;
      var trackId = 'budget-track-' + i, fillId = 'budget-fill-' + i;
      out += tag('rect', { x: Tr.x0, y: y, width: Tr.x1 - Tr.x0, height: Tr.h, rx: Tr.h / 2, style: 'fill:var(--card);stroke:var(--line);stroke-width:1.5', 'data-box': trackId });
      var x = trackX(g, ln.steps);
      if (x > Tr.x0 + 1) {
        out += tag('rect', { x: Tr.x0, y: y, width: (x - Tr.x0).toFixed(2), height: Tr.h, rx: Tr.h / 2, style: 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5', 'data-box': fillId });
      }
      // step count rides with the runner: inside the bar, or just right of it while the bar is short
      if (s.phase !== 'intro') {
        var label = fmt(copy.labels.steps, { n: Math.floor(ln.steps + 1e-6) }), lw = P.width(label, L.steps.size);
        var inside = x - Tr.x0 > lw + 34, ty = y + Tr.h / 2 + L.steps.size * 0.36;
        out += inside
          ? P.fit(x - 20, ty, label, '--ink', L.steps.size, '--font-mono', 600, lw + 2, fillId, 'end')
          : P.fit(x + 20, ty, label, '--ink', L.steps.size, '--font-mono', 600, lw + 2, trackId);
        out += tag('circle', { cx: x.toFixed(2), cy: y + Tr.h / 2, r: 13, style: 'fill:var(--accent);stroke:var(--card);stroke-width:3' });
      }
      out += drawStatus(g, P, s, ln, top, copy);
    });
    if (s.fixedSteps) {
      var fx = trackX(g, M.TARGET_STEPS), y0 = g.lanes[0] + Tr.dy - 14, y1 = g.lanes[2] + Tr.dy + Tr.h + 14;
      out += tag('line', { x1: fx, y1: y0, x2: fx, y2: y1, style: 'stroke:var(--ink);stroke-width:3;stroke-dasharray:6 4' });
      var flag = '';
      for (var r = 0; r < 2; r++) for (var c = 0; c < 3; c++) {
        flag += tag('rect', { x: fx + c * 7, y: y0 - 16 + r * 7, width: 7, height: 7, style: 'fill:var(' + ((r + c) % 2 ? '--card' : '--ink') + ')' });
      }
      out += tag('rect', { x: fx, y: y0 - 16, width: 21, height: 14, style: 'fill:none;stroke:var(--ink);stroke-width:1' }) + flag;
      out += P.text(fx + 28, y0 - 4, copy.labels.finish, P.style('--ink', 17, '--font-hand', 700), { 'data-on': 'stage' });
    }
    return tag('g', { style: 'opacity:' + opacity.toFixed(3) }, out);
  }

  function drawStatus(g, P, s, ln, top, copy) {
    var St = g.lane.status, y = top + St.dy, sz = St.size;
    if (s.phase === 'intro' || !ln.done) {
      if (s.fixedSteps && s.station === 'after' && !ln.done) {
        return P.text(St.x, y, copy.labels.running, P.style('--ink-2', sz), { 'text-anchor': St.anchor, 'data-on': 'stage' });
      }
      return '';
    }
    if (!s.fixedSteps) {
      return P.text(St.x, y, copy.labels.stop, P.style('--accent-ink', sz + 2, '--font-hand', 700), { 'text-anchor': St.anchor, 'data-on': 'stage' });
    }
    var over = ln.finishMin > M.BUDGET_MIN + 1e-6;
    return P.text(St.x, y, fmt(copy.labels.done_at, { m: mmss(ln.finishMin) }), P.style(over ? '--crash-ink' : '--ink', sz, '--font-hand', 700),
      { 'text-anchor': St.anchor, 'data-on': 'stage' });
  }

  // hour view: each track becomes one hour, filled with that candidate's runs
  function drawHours(g, P, s, copy, opacity) {
    if (opacity <= 0) return '';
    var L = g.lane, Tr = L.track, out = '', k = (Tr.x1 - Tr.x0) / 60;
    out += P.text(Tr.x0, g.head.y, copy.labels.hour_title, P.style('--ink-2', g.head.size), { 'data-on': 'stage' });
    s.lanes.forEach(function (ln, i) {
      var top = g.lanes[i], y = top + Tr.dy;
      out += tag('rect', { x: Tr.x0, y: y, width: Tr.x1 - Tr.x0, height: Tr.h, rx: 8, style: 'fill:var(--card);stroke:var(--line);stroke-width:1.5' });
      for (var m = 0; m < 60 - 1e-6; m += ln.finishMin) {
        var w = Math.min(ln.finishMin, 60 - m) * k;
        out += tag('rect', { x: (Tr.x0 + m * k + 1).toFixed(2), y: y + 5, width: Math.max(0, w - 2).toFixed(2), height: Tr.h - 10, rx: 3,
          style: 'fill:var(--accent)' + (60 - m < ln.finishMin - 1e-6 ? ';opacity:0.45' : '') });
      }
      var St = L.status, over = ln.finishMin > M.BUDGET_MIN + 1e-6, under = ln.finishMin < M.BUDGET_MIN - 1e-6;
      var txt = fmt(copy.labels.per_hour, { n: aboutN(ln.perHour) });
      out += P.text(St.x, top + St.dy, txt, P.style(over || under ? '--crash-ink' : '--ink', St.size + 2, '--font-hand', 700),
        { 'text-anchor': St.anchor, 'data-on': 'stage' });
    });
    var ay = g.axisY;
    out += P.text(Tr.x0, ay, '0', P.style('--ink-2', 15, '--font-mono'), { 'data-on': 'stage' });
    out += P.text(Tr.x1, ay, copy.labels.hour_end, P.style('--ink-2', 15, '--font-mono'), { 'text-anchor': 'end', 'data-on': 'stage' });
    var B = g.bottom;
    if (!s.fixedSteps) {
      out += P.text(B.x, B.y, copy.labels.hour_ok, P.style('--keep-ink', B.size, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'stage' });
    } else {
      var a = copy.labels.hour_broken, b = copy.labels.hour_broken_note;
      var wa = P.width(a, B.size), wb = P.width(b, B.size), x0 = B.x - (wa + 14 + wb) / 2;
      out += P.text(x0, B.y, a, P.style('--ink-2', B.size, '--font-hand', 700), { 'data-on': 'stage' });
      out += tag('line', { x1: x0 - 4, y1: B.y - B.size * 0.32, x2: x0 + wa + 4, y2: B.y - B.size * 0.32, style: 'stroke:var(--crash);stroke-width:3' });
      out += P.text(x0 + wa + 14, B.y, b, P.style('--crash-ink', B.size, '--font-hand', 700), { 'data-on': 'stage' });
    }
    return tag('g', { style: 'opacity:' + opacity.toFixed(3) }, out);
  }

  function drawScores(g, P, s, copy) {
    var Sc = g.score, L = g.lane, out = '';
    var head = copy.labels.score + ' · ' + copy.labels.lower;
    out += P.text(Sc.x, Sc.headY, head, P.style('--ink-2', 16), { 'text-anchor': 'end', 'data-on': 'stage' });
    if (!s.revealed) return out;
    var p = s.station === 'score' ? T.ease.out((s.local - M.REVEAL_AT) / 0.25) : 1;
    var pb = s.station === 'score' ? T.ease.out((s.local - 0.5) / 0.2) : 1;
    s.lanes.forEach(function (ln, i) {
      var top = g.lanes[i], win = i === s.winner, val = ln.bpb.toFixed(3);
      var vs = P.style(win ? '--keep-ink' : '--ink-2', L.val.size, '--font-mono', win ? 700 : 400);
      out += tag('g', { style: 'opacity:' + p.toFixed(3) }, P.text(Sc.x, top + L.val.dy, val, vs, { 'text-anchor': 'end', 'data-on': 'stage' }));
      if (win && pb > 0) {
        var bw = P.width(copy.labels.best, 17) + 18, bx, by;
        if (L.badge.beside) { bx = Sc.x - P.width(val, L.val.size) - 12 - bw; by = top + L.badge.dy - 19; }
        else { bx = Sc.x - bw; by = top + L.badge.dy - 19; }
        out += tag('g', { style: 'opacity:' + pb.toFixed(3) },
          tag('rect', { x: bx.toFixed(1), y: by, width: bw.toFixed(1), height: 26, rx: 13, style: 'fill:none;stroke:var(--keep);stroke-width:2' }) +
          P.text(bx + bw / 2, by + 19, copy.labels.best, P.style('--keep-ink', 17, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'stage' }));
      }
    });
    return out;
  }

  function captionFor(s, copy) {
    var c = copy.captions, names = s.lanes.map(function (l) { return copy.cands[l.key].name; });
    if (s.phase === 'intro') return c.intro;
    var fin = s.lanes.map(function (l) { return l.finishMin; });
    var fastest = Math.min.apply(null, fin), slowest = Math.max.apply(null, fin);
    var st = s.view.caption, steps = s.fixedSteps;
    if (st === 'race') return steps ? c.race_steps : c.race_time;
    if (st === 'after') return steps ? fmt(c.after_steps, { m: slowest }) : c.after_time;
    if (st === 'score') {
      if (!s.revealed) return steps ? fmt(c.after_steps, { m: slowest }) : c.after_time;
      var w = s.winner;
      return steps ? fmt(c.score_steps, { winner: names[w], m: fin[w], f: fastest })
                   : fmt(c.score_time, { winner: names[w] });
    }
    if (st === 'hour') {
      if (!steps) return c.hour_time;
      return fmt(c.hour_steps, { a: aboutN(s.lanes[0].perHour), c: aboutN(s.lanes[2].perHour) });
    }
    if (steps) return s.machine === 'slow' ? fmt(c.outro_steps_slow, { f: fastest, m: slowest }) : c.outro_steps;
    return s.machine === 'slow' ? c.outro_time_slow : c.outro_time;
  }

  window.Explain.register('budget', function (svg, ctx) {
    var copy = ctx.copy;
    var opts = { fixedSteps: false, machine: 'this' };
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
        svg.innerHTML = drawWatch(g, P, s, copy) + drawTitle(g, P, s, copy) + drawLaneHeads(g, P, s, copy) +
          drawTracks(g, P, s, copy, s.view.tracks) + drawHours(g, P, s, copy, s.view.hours) + drawScores(g, P, s, copy);
        ctx.caption(captionFor(s, copy));
      }
    };
  });
})();
