/* autoresearch "limits" drawing — four boundaries.
 * Left: an illustrative terrain (示意). The green ball is the code on the branch;
 * each round it tries one small step to each side and moves only to a lower one,
 * so it settles in the nearest valley. Then the fog lifts for the reader: a deeper
 * valley sits behind a hill the ball would have to climb first. The next three
 * stations swap the terrain for a small picture of each remaining boundary.
 * Right (below in portrait): the four boundary cards, lit one at a time.
 * Colors are CSS variables via style=; text on a card carries data-on / data-fit. */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var D = window.ExplainDraw;
  var tag = D.tag, fmt = D.fmt, lerp = D.lerp, Painter = D.Painter;

  var GEO = {
    landscape: {
      W: 1200, H: 675, minFont: 13,
      head: { x: 40, y: 50, size: 22 },
      plot: { l: 74, r: 704, t: 120, b: 590, hMin: 0, hMax: 0.95 },
      axis: { size: 15, yTitleX: 40, xTitleY: 630 },
      ball: 12, ghost: 10, labelGap: [26, 52],
      area: { x: 40, y: 86, w: 680, h: 540 },
      cards: { x: 744, y: 40, w: 432, h: 140, gap: 12, cols: 1, title: 22, body: 17, lh: 25, pad: 20 }
    },
    portrait: {
      W: 540, H: 1080, minFont: 15,
      head: { x: 24, y: 44, size: 21 },
      plot: { l: 50, r: 516, t: 120, b: 540, hMin: 0, hMax: 0.95 },
      axis: { size: 15, yTitleX: 22, xTitleY: 580 },
      ball: 10, ghost: 8, labelGap: [26, 50],
      area: { x: 20, y: 80, w: 500, h: 500 },
      cards: { x: 16, y: 610, w: 246, h: 222, gap: 16, cols: 2, title: 19, body: 16, lh: 23, pad: 16 }
    }
  };

  var CLOSERS = '，。：；、）」』！？,.:;)';
  var OPENERS = '（「『(';

  // greedy line wrap by estimated width; Latin words stay whole, CJK breaks anywhere;
  // a line never starts with closing punctuation nor ends with an opening one
  function wrap(P, str, size, avail) {
    var words = [], buf = '';
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch.charCodeAt(0) > 0x2e80) { if (buf) words.push(buf); words.push(ch); buf = ''; }
      else if (ch === ' ') { if (buf) words.push(buf); words.push(' '); buf = ''; }
      else buf += ch;
    }
    if (buf) words.push(buf);
    var lines = [], cur = '';
    words.forEach(function (w) {
      if (cur && P.width(cur + w, size) > avail) {
        if (CLOSERS.indexOf(w) >= 0 && cur.length > 1) { lines.push(cur.slice(0, -1)); cur = cur.slice(-1) + w; return; }
        if (OPENERS.indexOf(cur.slice(-1)) >= 0 && cur.length > 1) { lines.push(cur.slice(0, -1)); cur = cur.slice(-1) + w; return; }
        lines.push(cur.replace(/ +$/, ''));
        cur = w === ' ' ? '' : w;
      } else cur += w;
    });
    if (cur) lines.push(cur.replace(/ +$/, ''));
    return lines;
  }

  function X(g, M, i) { var p = g.plot; return p.l + i / (M.N - 1) * (p.r - p.l); }
  function Y(g, h) { var p = g.plot; return p.b - (h - p.hMin) / (p.hMax - p.hMin) * (p.b - p.t); }

  /* ---------- terrain ---------- */

  function terrainPath(g, M) {
    var d = '';
    for (var x = 0; x <= M.N - 1 + 1e-9; x += 0.25) {
      d += (d ? ' L' : 'M') + X(g, M, x).toFixed(1) + ' ' + Y(g, M.heightAt(x)).toFixed(1);
    }
    return d;
  }

  function drawTerrain(g, P, M, s, copy) {
    var p = g.plot, L = copy.labels, out = '', fog = s.fog;
    var line = terrainPath(g, M);
    out += tag('path', { d: line + ' L' + p.r + ' ' + p.b + ' L' + p.l + ' ' + p.b + ' Z',
      style: 'fill:var(--paper-2);opacity:' + lerp(0.9, 0.35, fog).toFixed(3) });
    out += tag('path', { d: line, style: 'fill:none;stroke:var(--ink-3);stroke-width:' + lerp(3, 2, fog).toFixed(2) +
      ';opacity:' + lerp(1, 0.45, fog).toFixed(3) + (fog > 0.5 ? ';stroke-dasharray:3 7' : '') });
    out += tag('line', { x1: p.l, y1: p.b, x2: p.r, y2: p.b, style: 'stroke:var(--ink-3);stroke-width:1.5' });
    out += tag('line', { x1: p.l, y1: p.t - 10, x2: p.l, y2: p.b, style: 'stroke:var(--ink-3);stroke-width:1.5' });
    var ym = (p.t + p.b) / 2;
    out += P.text(g.axis.yTitleX, ym, L.axis_y, P.style('--ink-2', g.axis.size), { 'text-anchor': 'middle', transform: 'rotate(-90 ' + g.axis.yTitleX + ' ' + ym + ')' });
    out += P.text(p.r, g.axis.xTitleY, L.axis_x, P.style('--ink-2', g.axis.size), { 'text-anchor': 'end' });
    if (fog > 0.5) out += P.text(p.r, g.head.y, L.fog, P.style('--ink-2', 16), { 'text-anchor': 'end', 'data-on': 'stage' });
    return out;
  }

  function onGround(g, M, x, r) { return [X(g, M, x), Y(g, M.heightAt(x)) - r - 2]; }

  function drawHistory(g, M, s) {
    var out = '';
    s.history.forEach(function (h) {
      var q = onGround(g, M, h.i, 5);
      out += h.kept
        ? tag('circle', { cx: q[0].toFixed(1), cy: q[1].toFixed(1), r: 5, style: 'fill:var(--keep);opacity:0.6' })
        : tag('circle', { cx: q[0].toFixed(1), cy: q[1].toFixed(1), r: 5, style: 'fill:none;stroke:var(--discard);stroke-width:2;opacity:0.8' });
    });
    return out;
  }

  function drawTries(g, P, M, s, copy) {
    if (!s.tries.length || s.phase !== 'round') return '';
    var out = '', L = copy.labels, moving = s.ball !== s.from;
    s.tries.forEach(function (tr, k) {
      if (moving && tr.lower) return;  // the ball is sliding into this spot
      var q = onGround(g, M, tr.i, g.ghost), a = s.tryIn;
      var style = !tr.judged ? 'fill:var(--card);stroke:var(--accent);stroke-width:2.5;stroke-dasharray:4 3'
        : tr.lower ? 'fill:var(--card);stroke:var(--keep);stroke-width:3' : 'fill:var(--card);stroke:var(--discard);stroke-width:2.5';
      out += tag('circle', { cx: q[0].toFixed(1), cy: q[1].toFixed(1), r: g.ghost, style: style + ';opacity:' + a.toFixed(3) });
      if (tr.judged) {
        var ly = q[1] - g.ghost - g.labelGap[k % 2];
        out += P.text(q[0], ly, tr.lower ? L.lower + ' ✓' : L.higher + ' ✗', P.style(tr.lower ? '--keep-ink' : '--ink-2', 15, '--font-hand', 700),
          { 'text-anchor': 'middle', 'data-on': 'stage' });
      }
    });
    return out;
  }

  function drawBall(g, P, M, s, copy) {
    var q = onGround(g, M, s.ball, g.ball), out = '';
    out += tag('circle', { cx: q[0].toFixed(1), cy: q[1].toFixed(1), r: g.ball, style: 'fill:var(--keep);stroke:var(--card);stroke-width:3' });
    var L = copy.labels;
    if (s.phase === 'intro' || (s.phase === 'round' && s.round === 0 && !s.judged)) {
      out += P.text(q[0], q[1] - g.ball - 16, L.ball, P.style('--keep-ink', 16, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'stage' });
    } else if (s.stuck && s.phase !== 'round') {
      out += P.text(q[0], q[1] + g.ball + 34, L.here_mark, P.style('--keep-ink', 16, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'stage' });
    }
    return out;
  }

  // the reader now sees the whole terrain: the deeper valley, and the hill in between
  function drawReveal(g, P, M, s, copy) {
    var L = copy.labels, deep = M.VALLEYS[2], a = 1 - s.fog, out = '';
    if (a <= 0) return '';
    var dq = [X(g, M, deep), Y(g, M.H[deep])];
    out += P.text(dq[0], dq[1] + (s.ball === deep ? 62 : 30), L.deep, P.style('--accent-ink', 17, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'stage' });
    if (s.ball === deep) return tag('g', { style: 'opacity:' + a.toFixed(3) }, out);
    var lo = Math.min(s.ball, deep), hi = Math.max(s.ball, deep), peak = lo, top = 0;
    for (var i = lo; i <= hi; i++) if (M.H[i] > top) { top = M.H[i]; peak = i; }
    var b = onGround(g, M, s.ball, g.ball + 8), e = onGround(g, M, deep, 14), topY = Y(g, top) - 34, px = X(g, M, peak);
    var draw = s.phase === 'reveal' ? T.clamp((s.local - 0.3) / 0.35, 0, 1) : 1;
    var d = 'M' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) +
      ' C' + b[0].toFixed(1) + ' ' + topY.toFixed(1) + ' ' + (px - 60).toFixed(1) + ' ' + topY.toFixed(1) + ' ' + px.toFixed(1) + ' ' + topY.toFixed(1) +
      ' S' + e[0].toFixed(1) + ' ' + topY.toFixed(1) + ' ' + e[0].toFixed(1) + ' ' + e[1].toFixed(1);
    out += tag('path', { d: d, pathLength: 100, 'marker-end': draw >= 1 ? 'url(#limits-arrow)' : undefined,
      style: 'fill:none;stroke:var(--accent);stroke-width:2.5;stroke-dasharray:' + (100 * draw).toFixed(1) + ' 100' });
    if (draw >= 1) out += P.text(px, topY - 14, L.hill, P.style('--accent-ink', 17, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'stage' });
    return tag('g', { style: 'opacity:' + a.toFixed(3) }, out);
  }

  /* ---------- the three other boundaries ---------- */

  function drawTime(g, P, copy, p) {
    var A = g.area, L = copy.labels, out = '';
    var l = A.x + 50, r = A.x + A.w - 20, t = A.y + 40, b = A.y + A.h - 70, tMax = 12, cut = 5;
    var x = function (m) { return l + m / tMax * (r - l); };
    var y = function (v) { return b - (v - 0.35) / 0.65 * (b - t); };  // lower score = lower on screen, as on the terrain
    var curveA = function (m) { return 0.55 + 0.35 * Math.exp(-m / 1.5); };
    var curveB = function (m) { return 0.40 + 0.6 * Math.exp(-m / 5); };
    out += tag('line', { x1: l, y1: b, x2: r, y2: b, style: 'stroke:var(--ink-3);stroke-width:1.5' });
    out += tag('line', { x1: l, y1: t - 10, x2: l, y2: b, style: 'stroke:var(--ink-3);stroke-width:1.5' });
    out += P.text(r, b + 32, L.time_axis_x, P.style('--ink-2', 15), { 'text-anchor': 'end' });
    out += P.text(l - 14, t - 18, L.time_axis_y + '（越低越好）', P.style('--ink-2', 15));
    var grow = T.clamp(p / 0.35, 0, 1), later = T.clamp((p - 0.5) / 0.3, 0, 1);
    function curve(f, from, to) {
      var d = '';
      for (var m = from; m <= to + 1e-9; m += 0.1) d += (d ? ' L' : 'M') + x(m).toFixed(1) + ' ' + y(f(m)).toFixed(1);
      return d;
    }
    var upTo = cut * grow;
    if (upTo > 0.05) {
      out += tag('path', { d: curve(curveA, 0, upTo), style: 'fill:none;stroke:var(--keep);stroke-width:4;stroke-linecap:round' });
      out += tag('path', { d: curve(curveB, 0, upTo), style: 'fill:none;stroke:var(--discard);stroke-width:4;stroke-linecap:round' });
    }
    if (later > 0) {
      var to = cut + (tMax - cut) * later;
      out += tag('path', { d: curve(curveA, cut, to), style: 'fill:none;stroke:var(--keep);stroke-width:3;stroke-dasharray:6 6;opacity:0.7' });
      out += tag('path', { d: curve(curveB, cut, to), style: 'fill:none;stroke:var(--discard);stroke-width:3;stroke-dasharray:6 6;opacity:0.9' });
    }
    if (grow >= 1) {
      out += tag('line', { x1: x(cut), y1: t - 10, x2: x(cut), y2: b, style: 'stroke:var(--accent);stroke-width:2.5;stroke-dasharray:8 6' });
      out += P.text(x(cut), b + 32, L.time_cut, P.style('--accent-ink', 16, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'stage' });
      out += tag('circle', { cx: x(cut), cy: y(curveA(cut)), r: 7, style: 'fill:var(--keep);stroke:var(--card);stroke-width:2' });
      out += tag('circle', { cx: x(cut), cy: y(curveB(cut)), r: 7, style: 'fill:var(--discard);stroke:var(--card);stroke-width:2' });
      out += P.text(x(1.0), y(curveA(1.0)) + 34, L.time_a, P.style('--keep-ink', 17, '--font-hand', 700), { 'data-on': 'stage' });
      out += P.text(x(1.4), y(curveB(1.4)) - 16, L.time_b, P.style('--ink-2', 17, '--font-hand', 700), { 'data-on': 'stage' });
      out += P.text(x(cut) + 12, y(curveB(cut)) - 18, L.time_keep, P.style('--keep-ink', 16, '--font-hand', 700), { 'data-on': 'stage' });
    }
    if (later >= 1) {
      out += P.text(r, y(curveB(tMax)) + 36, L.time_later, P.style('--ink-2', 16, '--font-hand', 700), { 'text-anchor': 'end', 'data-on': 'stage' });
    }
    return out;
  }

  function clock(cx, cy, r) {
    return tag('circle', { cx: cx, cy: cy, r: r, style: 'fill:var(--card);stroke:var(--ink);stroke-width:2.5' }) +
      tag('path', { d: 'M' + cx + ' ' + cy + ' v' + (-r * 0.62) + ' M' + cx + ' ' + cy + ' h' + (r * 0.45), style: 'stroke:var(--ink);stroke-width:2.5;stroke-linecap:round' });
  }

  function drawMachine(g, P, copy, p) {
    var A = g.area, L = copy.labels, out = '', narrow = A.w < 600;
    var rows = [[L.machine_fast, 1, L.machine_steps_fast, L.machine_steps_note], [L.machine_slow, 0.38, L.machine_steps_slow, '']];
    var fill = T.ease.inOut(T.clamp(p / 0.5, 0, 1));
    out += P.text(A.x + 10, A.y + 44, L.machine_clock, P.style('--ink', 24, '--font-hand', 700));
    rows.forEach(function (row, i) {
      var y0 = A.y + 130 + i * (narrow ? 150 : 175), bx = A.x + (narrow ? 76 : 100), bw = A.w - (narrow ? 96 : 130);
      out += clock(A.x + 36, y0 + 30, 27);
      out += P.text(bx, y0 + 6, row[0], P.style('--ink', 21, '--font-hand', 700));
      out += tag('rect', { x: bx, y: y0 + 20, width: bw, height: 32, rx: 16, style: 'fill:var(--paper-2)' });
      var w = bw * row[1] * fill;
      if (w > 1) out += tag('rect', { x: bx, y: y0 + 20, width: w.toFixed(1), height: 32, rx: 16, style: 'fill:var(--keep);opacity:' + (i ? 0.55 : 0.9) });
      if (fill >= 1) {
        out += P.text(bx, y0 + 84, row[2], P.style(i ? '--ink-2' : '--ink', 20, i ? '--font-hand' : '--font-mono', 700), { 'data-on': 'stage' });
        if (row[3]) out += P.text(bx + P.width(row[2], 20) + 14, y0 + 84, '（' + row[3] + '）', P.style('--ink-2', 16), { 'data-on': 'stage' });
      }
    });
    if (p > 0.6) {
      var lines = wrap(P, L.machine_result, 21, A.w - 20);
      lines.forEach(function (l, i) {
        out += P.text(A.x + 10, A.y + A.h - 60 + i * 30, l, P.style('--accent-ink', 21, '--font-hand', 700), { 'data-on': 'stage' });
      });
    }
    return out;
  }

  function drawGpu(g, P, copy, p) {
    var A = g.area, L = copy.labels, out = '', narrow = A.w < 600;
    var bw = narrow ? 300 : 380, bh = narrow ? 150 : 170, bx = A.x + (A.w - bw) / 2, by = A.y + 40;
    out += tag('rect', { x: bx, y: by, width: bw, height: bh, rx: 14, style: 'fill:var(--paper-2);stroke:var(--ink);stroke-width:2.5' });
    [0.3, 0.7].forEach(function (f) {
      var cx = bx + bw * f, cy = by + bh / 2, r = bh * 0.3;
      out += tag('circle', { cx: cx, cy: cy, r: r, style: 'fill:var(--card);stroke:var(--ink-3);stroke-width:2' });
      for (var k = 0; k < 6; k++) {
        var a = k * 60 + p * 360;
        var e = D.polar(cx, cy, r * 0.85, a);
        out += tag('line', { x1: cx, y1: cy, x2: e[0].toFixed(1), y2: e[1].toFixed(1), style: 'stroke:var(--ink-3);stroke-width:3;stroke-linecap:round' });
      }
    });
    out += tag('rect', { x: bx + 30, y: by + bh, width: bw - 60, height: 12, style: 'fill:var(--ink-3)' });
    out += P.text(bx + bw / 2, by + bh + 52, L.gpu_card, P.style('--ink', 22, '--font-mono', 700), { 'text-anchor': 'middle', 'data-on': 'stage' });
    out += P.text(bx + bw / 2, by + bh + 82, L.gpu_tested, P.style('--ink-2', 16), { 'text-anchor': 'middle', 'data-on': 'stage' });
    if (p > 0.35) {
      var names = L.gpu_fork_names, n = names.length, fw = narrow ? 130 : 150, gap = narrow ? 22 : 40;
      var total = n * fw + (n - 1) * gap, fx = A.x + (A.w - total) / 2, fy = by + bh + 150;
      out += P.text(A.x + A.w / 2, fy - 16, L.gpu_forks, P.style('--ink-2', 17, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'stage' });
      names.forEach(function (nm, i) {
        var a = T.clamp((p - 0.35 - i * 0.1) / 0.15, 0, 1);
        var x = fx + i * (fw + gap), id = 'fork' + i;
        out += tag('g', { style: 'opacity:' + a.toFixed(3) },
          tag('rect', { x: x, y: fy, width: fw, height: 52, rx: 10, 'data-box': id, style: 'fill:var(--card);stroke:var(--ink-3);stroke-width:2;stroke-dasharray:6 5' }) +
          P.fit(x + fw / 2, fy + 33, nm, '--ink', 18, '--font-mono', 600, fw - 20, id, 'middle'));
      });
    }
    return out;
  }

  /* ---------- boundary cards ---------- */

  function drawCards(g, P, s, copy, cardAppear) {
    var C = g.cards, out = '', L = copy.labels;
    copy.cards.forEach(function (card, i) {
      var col = i % C.cols, row = Math.floor(i / C.cols);
      var x = C.x + col * (C.w + C.gap), y = C.y + row * (C.h + C.gap), id = 'bcard' + i;
      var shown = i < s.cardsShown, lit = i === s.card;
      if (!shown) {
        out += tag('rect', { x: x, y: y, width: C.w, height: C.h, rx: 14, style: 'fill:none;stroke:var(--line);stroke-width:1.5;stroke-dasharray:6 6' });
        out += P.text(x + C.pad, y + C.pad + C.title, L.card_num[i], P.style('--ink-2', C.title, '--font-hand', 700));
        return;
      }
      var a = i === s.cardsShown - 1 ? cardAppear : 1, inner = '';
      inner += tag('rect', { x: x, y: y, width: C.w, height: C.h, rx: 14, 'data-box': id,
        style: lit ? 'fill:var(--card);stroke:var(--accent);stroke-width:3' : 'fill:var(--card);stroke:var(--line);stroke-width:1.5' });
      var head = L.card_num[i] + ' ' + card.title, ty = y + C.pad + C.title;
      var tl = wrap(P, head, C.title, C.w - 2 * C.pad);
      tl.forEach(function (l, j) { inner += P.fit(x + C.pad, ty + j * (C.title + 6), l, lit ? '--accent-ink' : '--ink', C.title, '--font-hand', 700, C.w - 2 * C.pad, id); });
      var by = ty + (tl.length - 1) * (C.title + 6) + C.lh + 6;
      wrap(P, card.body, C.body, C.w - 2 * C.pad).forEach(function (l, j) {
        inner += P.fit(x + C.pad, by + j * C.lh, l, '--ink-2', C.body, '--font-hand', 400, C.w - 2 * C.pad, id);
      });
      out += tag('g', { style: 'opacity:' + a.toFixed(3) }, inner);
    });
    return out;
  }

  function captionFor(M, s, copy) {
    var C = copy.captions;
    if (s.phase === 'intro') return C.intro;
    if (s.phase === 'round') {
      var n = s.round + 1;
      if (!s.judged) return fmt(C.try, { n: n });
      if (s.stuck) return fmt(C.stuck, { n: n });
      return fmt(s.to < s.from ? C.move_left : C.move_right, { n: n });
    }
    if (s.phase === 'reveal') return s.start === 'far' ? C.reveal_far : s.start === 'left' ? C.reveal_left : C.reveal;
    if (s.phase === 'card') return C['card' + s.card];
    return C.outro;
  }

  var DEFS = '<defs><marker id="limits-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
    '<path d="M0 0 L10 5 L0 10 z" style="fill:var(--accent)"/></marker></defs>';

  window.Explain.register('limits', function (svg, ctx) {
    var copy = ctx.copy, M = window.LimitsModel;
    var opts = { start: 'here' };
    copy.controls.forEach(function (c) { opts[c.option] = c.value; });
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
        var g = GEO[mode], P = Painter(g), s = M.stateAt(t, opts), L = copy.labels, out = DEFS;
        var head = s.phase === 'round' ? (s.stuck ? fmt(L.round, { n: s.round + 1 }) + ' · ' + L.stuck : fmt(L.round, { n: s.round + 1 })) : '';
        if (head) out += P.text(g.head.x, g.head.y, head, P.style('--accent-ink', g.head.size, '--font-hand', 700), { 'data-on': 'stage' });
        if (s.phase === 'card') {
          var draw = [drawTime, drawMachine, drawGpu][s.card - 1];
          out += draw(g, P, copy, s.local);
        } else {
          out += drawTerrain(g, P, M, s, copy) + drawHistory(g, M, s) + drawReveal(g, P, M, s, copy) + drawTries(g, P, M, s, copy) + drawBall(g, P, M, s, copy);
        }
        var appear = s.phase === 'card' ? T.ease.out(T.clamp(s.local / 0.2, 0, 1)) : 1;
        out += drawCards(g, P, s, copy, appear);
        svg.innerHTML = out.replace(/font-family:var\(--font-mono\)/g, 'font-family:var(--font-mono);font-variant-ligatures:none');
        ctx.caption(captionFor(M, s, copy));
      }
    };
  });
})();
