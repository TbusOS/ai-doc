/* autoresearch scene "context" drawing — terminal, run.log, and the context bar.
 * State comes from ContextModel.stateAt(t, opts); this file only draws it.
 * The terminal is what the agent sees. With `> run.log 2>&1` the training
 * output flows only into the file and grep brings two lines back; with tee a
 * T-shaped branch pours the whole output into the context bar, which fills
 * and pushes its oldest content (the rules) out of the left end.
 * Colors are CSS variables via style=; text on a card has data-on, text that
 * must stay inside a card has data-fit. Landscape 1200×675, portrait 540×1080
 * (svg narrower than 780px, text ≥ 15px). */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var M = window.ContextModel;
  var D = window.ExplainDraw;
  var tag = D.tag, lerp = D.lerp, fmt = D.fmt, Painter = D.Painter;

  var GEO = {
    landscape: {
      W: 1200, H: 675, minFont: 13,
      head: { x: 40, y: 50, size: 28 },
      term: { x: 40, y: 72, w: 640, h: 150, font: 16, lineH: 28, pad: 16, lines: 4 },
      src: { x: 40, y: 262, w: 210, h: 52 },
      pipeY: 288, teeX: 560, file: { x: 860, y: 240, w: 150, h: 104 },
      bar: { x: 40, y: 494, w: 1120, h: 58, titleY: 580 },
      drop: { y: 630 },
      legend: { x: 600, y: 646, gap: 190, size: 15 }
    },
    portrait: {
      W: 540, H: 1080, minFont: 15,
      head: { x: 24, y: 44, size: 26 },
      term: { x: 24, y: 66, w: 492, h: 200, font: 15, lineH: 30, pad: 14, lines: 5 },
      src: { x: 24, y: 322, w: 190, h: 52 },
      pipeY: 348, teeX: 268, file: { x: 372, y: 298, w: 144, h: 104 },
      bar: { x: 24, y: 690, w: 492, h: 72, titleY: 792, capInLegend: true },
      drop: { y: 856 },
      legend: { x: 24, y: 918, gap: 38, size: 16, vertical: true }
    }
  };

  // 10 -> "10", 10.1 -> "10.1": the grep lines are small but not zero
  function cells(n) { var r = Math.round(n * 10) / 10; return r % 1 === 0 ? r.toFixed(0) : r.toFixed(1); }

  /* ---------- header + terminal (what the agent sees) ---------- */

  function drawHead(g, P, s, copy) {
    var H = g.head, L = copy.labels;
    if (s.round <= 0) return '';  // before round 1: the bar's own title says what it is
    var txt = fmt(L.round, { n: s.round });
    return P.text(H.x, H.y, txt, P.style('--ink', H.size, '--font-hand', 700)) +
      P.text(H.x + P.width(txt, H.size) + 12, H.y, L.of_total, P.style('--ink-2', 18, '--font-mono'));
  }

  function progressLine(copy, pos) {
    var step = Math.min(953, Math.max(1, Math.round(953 * pos)));
    return fmt(copy.labels.progress, {
      step: ('0000' + step).slice(-5), pct: (100 * step / 953).toFixed(1), loss: (4.6 - 1.4 * pos).toFixed(6)
    });
  }

  function drawTerm(g, P, s, copy) {
    var Tm = g.term, C = copy.commands, out = '', avail = Tm.w - 2 * Tm.pad;
    out += tag('rect', { x: Tm.x, y: Tm.y, width: Tm.w, height: Tm.h, rx: 10, 'data-box': 'term', style: 'fill:var(--term-bg)' });
    var lines = [];
    var cmd = s.tee ? C.tee : C.redirect;
    var shown = s.phase === 'intro' ? null : s.phase === 'ff' || s.phase === 'outro' ? 'done' : s.sub;
    if (!shown) lines.push(['$ ▍', '--term-ink']);
    else {
      lines.push(['$ ' + cmd, '--term-ink']);
      if (s.tee && (shown === 'stream' || shown === 'grep' || shown === 'settle' || shown === 'done')) {
        // the flood: every progress line comes back to the agent
        var pos = shown === 'stream' ? s.stream : 1;
        for (var k = Tm.lines - 2; k >= 0; k--) lines.push([progressLine(copy, Math.max(0, pos - k * 0.004)), '--term-ink']);
      } else if (!s.tee && (shown === 'grep' || shown === 'settle' || shown === 'done')) {
        lines.push(['$ ' + C.grep, '--term-ink']);
        // ff / outro: no readout, the shown values belong to rounds 1-3 only
        var got = s.lines;
        if (got && (shown !== 'grep' || s.land > 0.05)) { lines.push([got[0], '--term-ok']); lines.push([got[1], '--term-ok']); }
      } else if (shown === 'stream' || shown === 'cmd') {
        lines.push(['▍', '--term-ink']);
      }
    }
    lines.slice(0, Tm.lines).forEach(function (l, i) {
      out += P.fit(Tm.x + Tm.pad, Tm.y + Tm.pad + 18 + i * Tm.lineH, l[0], l[1], Tm.font, '--font-mono', i === 0 ? 600 : 400, avail, 'term');
    });
    return out;
  }

  /* ---------- output plumbing ---------- */

  function strip(at, op) {
    return tag('g', { style: 'opacity:' + op.toFixed(3) },
      tag('rect', { x: (at[0] - 16).toFixed(1), y: (at[1] - 7).toFixed(1), width: 32, height: 14, rx: 3, style: 'fill:var(--term-bg)' }) +
      tag('rect', { x: (at[0] - 10).toFixed(1), y: (at[1] - 1.5).toFixed(1), width: 20, height: 3, rx: 1.5, style: 'fill:var(--term-ink)' }));
  }

  function filePath(F) {
    var fold = 22;
    return 'M' + F.x + ' ' + F.y + ' h' + (F.w - fold) + ' l' + fold + ' ' + fold + ' v' + (F.h - fold) + ' h' + (-F.w) + ' z';
  }

  function drawPlumbing(g, P, s, copy) {
    var L = copy.labels, S = g.src, F = g.file, B = g.bar, out = '', y = g.pipeY;
    var flowing = s.sub === 'stream' || s.phase === 'ff';
    // source
    out += tag('rect', { x: S.x, y: S.y, width: S.w, height: S.h, rx: 10, 'data-box': 'src', style: 'fill:var(--card);stroke:var(--ink-2);stroke-width:2' });
    out += P.fit(S.x + S.w / 2, S.y + S.h / 2 + 7, L.output, '--ink', 18, '--font-hand', 700, S.w - 20, 'src', 'middle');
    // main pipe to run.log
    var pipe = 'stroke:var(--line);stroke-width:14;stroke-linecap:round';
    out += tag('line', { x1: S.x + S.w, y1: y, x2: F.x, y2: y, style: pipe });
    if (s.tee) out += tag('path', { d: 'M' + g.teeX + ' ' + y + ' V' + (B.y - 6), style: pipe + ';fill:none' });
    if (flowing) {
      var flow = 'stroke:var(--accent);stroke-width:3;stroke-dasharray:10 12;stroke-dashoffset:' + (-(s.phase === 'ff' ? s.local * 400 : s.stream * 300)).toFixed(1);
      out += tag('line', { x1: S.x + S.w, y1: y, x2: F.x, y2: y, style: flow });
      if (s.tee) out += tag('path', { d: 'M' + g.teeX + ' ' + y + ' V' + (B.y - 6), style: flow + ';fill:none' });
    }
    // labels on the pipes
    if (!s.tee) out += P.text((S.x + S.w + F.x) / 2, y - 18, L.to_file, P.style('--ink-2', 16, '--font-hand'), { 'text-anchor': 'middle' });
    if (s.tee) out += P.text(g.teeX + 26, (y + B.y) / 2 + 30, L.to_ai, P.style('--crash-ink', 17, '--font-hand', 700));
    // run.log
    out += tag('path', { d: filePath(F), 'data-box': 'file', style: 'fill:var(--card);stroke:var(--ink-2);stroke-width:2;stroke-linejoin:round' });
    var fill = s.phase === 'intro' ? 0 : s.sub === 'cmd' ? 0 : s.sub === 'stream' ? s.stream : 1;
    for (var k = 0; k < 5; k++) {
      var wfrac = T.clamp(fill * 5 - k, 0, 1);
      if (wfrac > 0) out += tag('rect', { x: F.x + 14, y: F.y + 40 + k * 11, width: ((F.w - 28) * wfrac).toFixed(1), height: 5, rx: 2, style: 'fill:var(--ink-3)' });
    }
    out += P.fit(F.x + 14, F.y + 26, L.file, '--ink', 17, '--font-mono', 700, F.w - 40, 'file');
    // output lines travelling along the pipe (and down the tee branch); the terminal shows their text
    if (s.sub === 'stream') {
      var gap = 56, shift = s.stream * 900;
      var run = function (len, at) {
        var o = '';
        for (var d = shift % gap; d < len; d += gap) {
          var fade = Math.min(1, d / 24, (len - d) / 24);
          if (fade > 0) o += strip(at(d), fade);
        }
        return o;
      };
      out += run(F.x - (S.x + S.w), function (d) { return [S.x + S.w + d, y]; });
      if (s.tee) out += run(B.y - 6 - y, function (d) { return [g.teeX, y + d]; });
    }
    // grep: two lines come back from run.log into the context
    if (!s.tee && s.lines && s.sub === 'grep') {
      var gx = barX(g, s.raw), from = [F.x + F.w / 2, F.y + F.h], to = [gx, B.y - 4];
      out += tag('path', { d: 'M' + from[0] + ' ' + from[1] + ' C' + from[0] + ' ' + (from[1] + 80) + ' ' + (to[0] + 60) + ' ' + (to[1] - 90) + ' ' + to[0] + ' ' + to[1],
        style: 'fill:none;stroke:var(--keep);stroke-width:2.5;stroke-dasharray:6 6' });
      var q = T.ease.inOut(s.land), px = lerp(from[0], to[0], q), py = lerp(from[1] + 20, to[1] - 34, q);
      if (s.land < 1) {
        out += tag('rect', { x: px - 112, y: py - 20, width: 224, height: 44, rx: 6, style: 'fill:var(--term-bg)' });
        out += P.text(px, py - 2, s.lines[0], P.style('--term-ok', 13, '--font-mono'), { 'text-anchor': 'middle' });
        out += P.text(px, py + 16, s.lines[1], P.style('--term-ok', 13, '--font-mono'), { 'text-anchor': 'middle' });
      }
    }
    return out;
  }

  /* ---------- the context bar ---------- */

  function barX(g, pos) { var B = g.bar; return B.x + (pos - 0) * (B.w / M.CAP); }

  function drawBar(g, P, s, copy) {
    var B = g.bar, L = copy.labels, out = '', k = B.w / M.CAP;
    out += P.text(B.x, B.titleY, L.context, P.style('--ink', 20, '--font-hand', 700));
    // the title row sits under the bar: the tee branch and the grep lines enter from the top
    // portrait: the row is too narrow for the capacity note, so it moves to the legend
    if (!B.capInLegend) out += P.text(B.x + P.width(L.context, 20) + 12, B.titleY, L.cap, P.style('--ink-2', 16, '--font-hand'));
    out += P.text(B.x + B.w, B.titleY, s.full ? L.full : fmt(L.used, { n: cells(s.used) }),
      P.style(s.full ? '--crash-ink' : '--ink', 19, '--font-hand', 700), { 'text-anchor': 'end' });
    out += tag('rect', { x: B.x, y: B.y, width: B.w, height: B.h, rx: 8, style: 'fill:var(--card)' });
    // blocks, shifted left by what has been pushed out, clipped to the bar
    var inner = '';
    s.blocks.forEach(function (b) {
      var a = Math.max(b.start, s.dropped), e = Math.min(b.end, s.raw);
      var x = B.x + (b.start - s.dropped) * k, w = (b.end - b.start) * k;
      var vx = B.x + (a - s.dropped) * k, vw = (e - a) * k;
      if (vw <= 0.01) return;
      var id = 'blk-' + b.kind + (b.round || '');
      if (b.kind === 'rules') {
        inner += tag('rect', { x: x.toFixed(2), y: B.y + 4, width: Math.max(0, w - 2).toFixed(2), height: B.h - 8, rx: 5, 'data-box': id, style: 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:2' });
        if (vw > 44) inner += P.fit(x + w / 2, B.y + B.h / 2 + 6, L.rules, '--accent-ink', 16, '--font-hand', 700, w - 10, id, 'middle');
      } else if (b.kind === 'log') {
        inner += tag('rect', { x: x.toFixed(2), y: B.y + 4, width: Math.max(0, (b.end - b.start) * k - 2).toFixed(2), height: B.h - 8, rx: 5, 'data-box': id, style: 'fill:var(--paper-2);stroke:var(--ink-3);stroke-width:1.5' });
        for (var r = 0; r < 3; r++) {
          inner += tag('line', { x1: (x + 6).toFixed(1), y1: B.y + 14 + r * ((B.h - 28) / 2), x2: (x + w - 8).toFixed(1), y2: B.y + 14 + r * ((B.h - 28) / 2), style: 'stroke:var(--ink-3);stroke-width:2;stroke-dasharray:3 3;opacity:0.6' });
        }
        if (vw > 96 && w > 96) inner += P.fit(x + w / 2, B.y + B.h / 2 + 6, fmt(L.log_block, { n: b.round }), '--ink', 15, '--font-hand', 700, w - 14, id, 'middle');
      } else {
        inner += tag('rect', { x: x.toFixed(2), y: B.y + 4, width: Math.max(2, w - 1).toFixed(2), height: B.h - 8, rx: 3, 'data-box': id, style: 'fill:var(--keep)' });
      }
    });
    out += tag('g', { 'clip-path': 'url(#ctx-clip)' }, inner);
    out += tag('rect', { x: B.x, y: B.y, width: B.w, height: B.h, rx: 8, style: 'fill:none;stroke:var(' + (s.full ? '--crash' : '--ink-2') + ');stroke-width:' + (s.full ? 3 : 2) });
    // bubbles: what this round added
    var ex = barX(g, s.used);
    if (!s.tee && s.lines && s.land >= 1 && s.sub) {
      out += P.text(ex + 8, B.y - 10, L.plus_lines, P.style('--keep-ink', 17, '--font-hand', 700));
    }
    if (s.tee && s.sub === 'stream' && !s.full) {
      out += P.text(Math.min(ex, B.x + B.w - 60) - 8, B.y - 10, L.plus_tee, P.style('--crash-ink', 17, '--font-hand', 700), { 'text-anchor': 'end' });
    }
    return out;
  }

  function drawDropped(g, P, s, copy) {
    if (s.dropped <= 0) return '';
    var B = g.bar, L = copy.labels, y = g.drop.y, f = T.clamp(s.dropped / M.RULES, 0, 1);
    var w = M.RULES * (B.w / M.CAP);
    var out = tag('g', { transform: 'translate(' + B.x + ' ' + (y - 34 + 14 * f).toFixed(1) + ') rotate(' + (-6 * f).toFixed(2) + ')', style: 'opacity:' + (0.35 + 0.65 * f).toFixed(3) },
      tag('rect', { x: 0, y: 0, width: w - 2, height: 30, rx: 5, style: 'fill:none;stroke:var(--crash);stroke-width:2;stroke-dasharray:5 4' }) +
      tag('line', { x1: 4, y1: 4, x2: w - 6, y2: 26, style: 'stroke:var(--crash);stroke-width:2' }));
    var txt = s.dropped > M.RULES + 1 ? L.dropped_more : L.dropped_rules;
    out += P.text(B.x + w + 14, y, txt, P.style('--crash-ink', 18, '--font-hand', 700));
    return out;
  }

  function drawLegend(g, P, s, copy) {
    var Lg = g.legend, L = copy.labels, out = '';
    var items = [['--accent-soft', '--accent', L.legend_rules], ['--paper-2', '--ink-3', L.legend_log], ['--keep', '--keep', L.legend_grep]];
    if (g.bar.capInLegend) items.unshift(['--card', '--ink-2', L.cap]);
    items.forEach(function (it, i) {
      var x = Lg.vertical ? Lg.x : Lg.x + i * Lg.gap, y = Lg.vertical ? Lg.y + i * Lg.gap : Lg.y;
      out += tag('rect', { x: x, y: y - 13, width: 22, height: 16, rx: 3, style: 'fill:var(' + it[0] + ');stroke:var(' + it[1] + ');stroke-width:1.5' });
      out += P.text(x + 30, y, it[2], P.style('--ink-2', Lg.size, '--font-hand'));
    });
    return out;
  }

  function captionFor(s, copy) {
    var C = copy.captions;
    if (s.phase === 'intro') return C.intro;
    if (s.phase === 'ff') return C.ff;
    if (s.phase === 'outro') return s.tee ? C.outro_tee : C.outro;
    if (s.tee) {
      if (s.full) return C.full_tee;
      if (s.sub === 'cmd') return fmt(C.cmd_tee, { n: s.round });
      if (s.sub === 'stream') return C.stream_tee;
      return fmt(C.settle_tee, { n: cells(s.used) });
    }
    if (s.sub === 'cmd') return fmt(C.cmd, { n: s.round });
    if (s.sub === 'stream') return C.stream;
    return C.grep;
  }

  window.Explain.register('context', function (svg, ctx) {
    var copy = ctx.copy;
    var opts = { tee: false };
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
        var g = GEO[mode], P = Painter(g), B = g.bar;
        var s = M.stateAt(t, opts);
        var defs = '<defs><clipPath id="ctx-clip"><rect x="' + B.x + '" y="' + B.y + '" width="' + B.w + '" height="' + B.h + '" rx="8"/></clipPath></defs>';
        svg.innerHTML = defs + drawHead(g, P, s, copy) + drawTerm(g, P, s, copy) + drawPlumbing(g, P, s, copy) +
          drawBar(g, P, s, copy) + drawDropped(g, P, s, copy) + drawLegend(g, P, s, copy);
        ctx.caption(captionFor(s, copy));
      }
    };
  });
})();
