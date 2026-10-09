/* autoresearch scene "vocab" drawing — a sentence, scissors, beads and two meters.
 * State comes from VocabModel.stateAt(t, opts); this file only draws it.
 * Beads sit on their bytes and never move: the scissors only change how many
 * pieces share them. Left meter = beads per token (loss), right meter = beads
 * per byte (bpb), same scale in bits, so the left bar visibly falls onto the
 * right one when every byte is its own token.
 * Colors are CSS variables via style=; text on a card has data-on, text that
 * must stay inside a card has data-fit. Landscape 1200×675, portrait 540×1080
 * (svg narrower than 780px, text ≥ 15px). Clicking a ruler mark presses the
 * matching "vocab" button under the stage, so the two always agree. */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var M = window.VocabModel;
  var D = window.ExplainDraw;
  var tag = D.tag, lerp = D.lerp, fmt = D.fmt, Painter = D.Painter;

  var GEO = {
    landscape: {
      W: 1200, H: 675, minFont: 13,
      header: { x: 40, y: 54, size: 28 },
      legend: { x: 776, y: 112, size: 15, anchor: 'end' },
      rows: [{ from: 0, to: 32, x0: 40, base: 240 }], cell: 23, letter: 21,
      bitsDY: 36, rulerDY: 58, rulerLabelDY: 84, rulerLabelRow: 0, scissorsDY: 100,
      formula: { x: 40, rows: [404, 464], colB: 250, colC: 560, size: 21, two: false },
      judge: { x: 40, y: 512, w: 736, h: 128 },
      meters: { cx: [900, 1060], w: 64, top: 118, bottom: 560, nameY: 596, nameGap: 24 },
      marks: { size: 14, bpbLabelX: 1102 }
    },
    portrait: {
      W: 540, H: 1080, minFont: 15,
      header: { x: 24, y: 44, size: 24 },
      legend: { x: 24, y: 84, size: 15, anchor: 'start' },
      rows: [{ from: 0, to: 16, x0: 30, base: 214 }, { from: 16, to: 32, x0: 30, base: 380 }], cell: 30, letter: 24,
      bitsDY: 34, rulerDY: 56, rulerLabelDY: 82, rulerLabelRow: 1, scissorsDY: 88,
      formula: { x: 24, rows: [520, 596], size: 18, two: true, right: 516 },
      judge: { x: 24, y: 958, w: 492, h: 110 },
      meters: { cx: [170, 380], w: 58, top: 676, bottom: 880, nameY: 910, nameGap: 22 },
      marks: { size: 15, bpbLabelX: 418 }
    }
  };
  var MAX_BITS = 6;
  var TWEEN_MS = 480;

  function f3(x) { return x.toFixed(3); }
  // "= 5.000" when the three decimals are exact, "≈ 0.938" when they are rounded
  function eq(x) { return Math.abs(x * 1000 - Math.round(x * 1000)) < 1e-9 ? '= ' : '≈ '; }

  /* ---------- geometry helpers ---------- */

  function rowOf(g, b) {
    for (var i = 0; i < g.rows.length; i++) if (b >= g.rows[i].from && b < g.rows[i].to) return g.rows[i];
    return g.rows[g.rows.length - 1];
  }
  function byteX(g, b) { var r = rowOf(g, Math.min(b, 31)); return r.x0 + (b - r.from) * g.cell; }
  // one piece per layout row the token covers (before the cut at byte 16 a token can span both rows)
  function segmentsOf(g, tok) {
    var out = [], a = tok.start, end = tok.start + tok.len;
    while (a < end) {
      var r = rowOf(g, a), b = Math.min(end, r.to);
      out.push({ x: r.x0 + (a - r.from) * g.cell, w: (b - a) * g.cell, row: r, from: a, to: b });
      a = b;
    }
    return out;
  }

  /* ---------- pieces ---------- */

  function drawHeader(g, P, s, copy) {
    var L = copy.labels, H = g.header, n = s.tokens.length, txt;
    if (s.phase === 'intro') txt = fmt(L.header_intro, { bytes: M.BYTES });
    else if (s.phase === 'cut' || s.target === M.BASE) txt = fmt(L.header_cut, { v: M.BASE, n: n });
    else txt = fmt(L.header_recut, { from: M.BASE, v: s.target, n: n });
    var G = g.legend, lw = P.width(copy.labels.bead_legend, G.size);
    var bx = G.anchor === 'end' ? G.x - lw - 12 : G.x + 6;
    var tx = G.anchor === 'end' ? G.x : G.x + 18;
    return P.text(H.x, H.y, txt, P.style('--ink', H.size, '--font-hand', 700)) +
      tag('circle', { cx: bx, cy: G.y - 5, r: 5.5, style: 'fill:var(--accent)' }) +
      P.text(tx, G.y, copy.labels.bead_legend, P.style('--ink-2', G.size), { 'text-anchor': G.anchor });
  }

  function drawScissors(x, y, snip) {
    var a = 10 + 14 * snip;  // blade opening, degrees
    var r = a * Math.PI / 180, L = 26;
    var b1 = [x + L * Math.sin(r), y + L * Math.cos(r)], b2 = [x - L * Math.sin(r), y + L * Math.cos(r)];
    return tag('g', { 'aria-hidden': 'true' },
      tag('line', { x1: x, y1: y, x2: b1[0].toFixed(1), y2: b1[1].toFixed(1), style: 'stroke:var(--accent);stroke-width:3;stroke-linecap:round' }) +
      tag('line', { x1: x, y1: y, x2: b2[0].toFixed(1), y2: b2[1].toFixed(1), style: 'stroke:var(--accent);stroke-width:3;stroke-linecap:round' }) +
      tag('circle', { cx: (x + 8 * Math.sin(r) + 5).toFixed(1), cy: (y - 12).toFixed(1), r: 6, style: 'fill:none;stroke:var(--ink);stroke-width:2.5' }) +
      tag('circle', { cx: (x - 8 * Math.sin(r) - 5).toFixed(1), cy: (y - 12).toFixed(1), r: 6, style: 'fill:none;stroke:var(--ink);stroke-width:2.5' }));
  }

  function drawRibbon(g, P, s, copy) {
    var out = '', cell = g.cell;
    // chips: one per token
    s.tokens.forEach(function (tok, i) {
      segmentsOf(g, tok).forEach(function (sp, j) {
        var base = sp.row.base, id = 'chip-' + i + '-' + j;
        out += tag('rect', { x: (sp.x + 2).toFixed(1), y: base - 82, width: Math.max(4, sp.w - 4), height: 96, rx: 9, 'data-box': id,
          style: 'fill:var(' + (i % 2 ? '--paper-2' : '--card') + ');stroke:var(--ink-3);stroke-width:1.5' });
        for (var b = sp.from; b < sp.to; b++) {
          var ch = M.TEXT[b] === ' ' ? '·' : M.TEXT[b];
          out += P.text(byteX(g, b) + cell / 2, base, ch, P.style(M.TEXT[b] === ' ' ? '--ink-2' : '--ink', g.letter, '--font-mono', 600),
            { 'text-anchor': 'middle', 'data-on': id });
        }
        if (j === 0 && s.phase !== 'intro') {
          out += P.text(sp.x + sp.w / 2, base + g.bitsDY, String(tok.bits), P.style('--accent-ink', 16, '--font-hand', 700), { 'text-anchor': 'middle' });
        }
      });
    });
    // beads: they sit on their bytes and never move
    var drop = s.phase === 'intro' ? s.local : 1;
    for (var b2 = 0; b2 < M.BYTES; b2++) {
      var r = rowOf(g, b2), cx = byteX(g, b2) + cell / 2;
      for (var k = 0; k < M.BITS[b2]; k++) {
        var appear = T.ease.out(T.clamp((drop - b2 / M.BYTES * 0.6 - k * 0.04) / 0.25, 0, 1));
        if (appear <= 0) continue;
        var cy = r.base - 34 - k * 14 - (1 - appear) * 40;
        out += tag('circle', { cx: cx, cy: cy.toFixed(1), r: 5.5, style: 'fill:var(--accent);opacity:' + appear.toFixed(3) });
      }
    }
    // fresh cuts flash where the scissors just passed
    if (s.scissors !== null) {
      s.cuts.forEach(function (c) {
        var age = s.scissors - c;
        if (age < 0 || age > 3) return;
        var x = byteX(g, c), r2 = rowOf(g, Math.min(c, 31));
        if (c === r2.from && c > 0) return;
        out += tag('line', { x1: x, y1: r2.base - 92, x2: x, y2: r2.base + 20,
          style: 'stroke:var(--accent);stroke-width:2.5;stroke-dasharray:5 4;opacity:' + (1 - age / 3).toFixed(3) });
      });
      var sb = Math.min(s.scissors, 31.999), sr = rowOf(g, sb);
      out += drawScissors(byteX(g, sb), sr.base - g.scissorsDY, 0.5 + 0.5 * Math.sin(s.scissors * 2.2));
    }
    // byte ruler under every row, label under one row
    g.rows.forEach(function (r3, ri) {
      var y = r3.base + g.rulerDY, x1 = r3.x0, x2 = r3.x0 + (r3.to - r3.from) * cell;
      out += tag('line', { x1: x1, y1: y, x2: x2, y2: y, style: 'stroke:var(--ink-2);stroke-width:1.5' });
      for (var b3 = r3.from; b3 <= r3.to; b3++) {
        var tx = r3.x0 + (b3 - r3.from) * cell;
        out += tag('line', { x1: tx, y1: y - 5, x2: tx, y2: y + 5, style: 'stroke:var(--ink-2);stroke-width:1.2' });
      }
      if (ri === g.rulerLabelRow) {
        out += P.text((x1 + x2) / 2, r3.base + g.rulerLabelDY, fmt(copy.labels.bytes_ruler, { bytes: M.BYTES }),
          P.style('--ink-2', 17, '--font-hand'), { 'text-anchor': 'middle' });
      }
    });
    return out;
  }

  function drawFormula(g, P, s, copy, shownLoss) {
    var F = g.formula, L = copy.labels, out = '';
    var have = s.loss !== null && s.rise >= 1;
    var rows = [
      { name: L.loss_name, expr: fmt(L.loss_formula, { bits: M.TOTAL_BITS, n: s.tokens.length }),
        val: have ? eq(shownLoss) + f3(shownLoss) : '', moving: s.phase === 'recut' },
      { name: L.bpb_name + ' ' + L.bpb_short, expr: fmt(L.bpb_formula, { bits: M.TOTAL_BITS, bytes: M.BYTES }),
        val: have ? eq(s.bpb) + f3(s.bpb) : '', moving: false }
    ];
    rows.forEach(function (r, i) {
      var y = F.rows[i], show = s.phase !== 'intro';
      if (F.two) {
        out += P.text(F.x, y, r.name, P.style('--ink', F.size, '--font-hand', 700));
        if (r.val) out += P.text(F.right, y, r.val, P.style(i ? '--accent-ink' : '--ink', 22, '--font-mono', 700), { 'text-anchor': 'end' });
        if (show) out += P.text(F.x, y + 30, r.expr, P.style(r.moving ? '--accent-ink' : '--ink-2', F.size, '--font-hand'));
        return;
      }
      out += P.text(F.x, y, r.name, P.style('--ink', F.size, '--font-hand', 700));
      if (show) out += P.text(F.colB, y, r.expr, P.style(r.moving ? '--accent-ink' : '--ink-2', F.size, '--font-hand'));
      if (r.val) out += P.text(F.colC, y, r.val, P.style(i ? '--accent-ink' : '--ink', 24, '--font-mono', 700));
    });
    return out;
  }

  function meterY(g, v) { var Mt = g.meters; return Mt.bottom - (v / MAX_BITS) * (Mt.bottom - Mt.top); }

  function drawMeters(g, P, s, copy, shownLoss) {
    var Mt = g.meters, L = copy.labels, out = '', hw = Mt.w / 2;
    var vals = [s.loss === null ? 0 : shownLoss * s.rise, s.bpb === null ? 0 : s.bpb * s.rise];
    var fills = ['--ink-2', '--accent'];
    Mt.cx.forEach(function (cx, i) {
      out += tag('rect', { x: cx - hw, y: Mt.top, width: Mt.w, height: Mt.bottom - Mt.top, rx: 10,
        style: 'fill:var(--paper-2);stroke:var(--line);stroke-width:1.5' });
      var y = meterY(g, vals[i]);
      if (vals[i] > 0) {
        out += tag('rect', { x: cx - hw + 6, y: y.toFixed(1), width: Mt.w - 12, height: (Mt.bottom - y - 6).toFixed(1), rx: 6,
          style: 'fill:var(' + fills[i] + ')' });
        if (s.rise >= 1) {
          out += P.text(cx, y - 12, f3(i ? s.bpb : shownLoss), P.style(i ? '--accent-ink' : '--ink', 22, '--font-mono', 700), { 'text-anchor': 'middle' });
        }
      }
    });
    // names under the meters (two lines each)
    var names = [[L.loss_name.split(' 的 ')[0], '的 ' + (L.loss_name.split(' 的 ')[1] || '')], [L.bpb_name, L.bpb_short]];
    Mt.cx.forEach(function (cx, i) {
      out += P.text(cx, Mt.nameY, names[i][0], P.style('--ink', 18, '--font-hand', 700), { 'text-anchor': 'middle' });
      out += P.text(cx, Mt.nameY + Mt.nameGap, names[i][1], P.style('--ink-2', 17, '--font-hand'), { 'text-anchor': 'middle' });
    });
    // ruler marks: where each vocabulary puts the loss; all of them put bpb at one place
    var lx = Mt.cx[0] - hw, bx = Mt.cx[1] + hw;
    s.marks.forEach(function (v) {
      var y = meterY(g, M.lossPerToken(v)), on = v === s.target && s.phase !== 'cut';
      out += tag('g', { 'data-pick': v, style: 'cursor:pointer' },
        tag('rect', { x: lx - 64, y: y - 15, width: 70, height: 30, style: 'fill:transparent' }) +
        tag('line', { x1: lx - 6, y1: y, x2: lx + 10, y2: y, style: 'stroke:var(' + (on ? '--accent' : '--ink-2') + ');stroke-width:2.5' }) +
        P.text(lx - 10, y + 5, String(v), P.style(on ? '--accent-ink' : '--ink-2', g.marks.size, '--font-mono', on ? 700 : 400), { 'text-anchor': 'end' }));
    });
    if (s.marks.length) {
      var by = meterY(g, M.bpbFor(M.BASE));
      out += tag('line', { x1: bx - 10, y1: by, x2: bx + 6, y2: by, style: 'stroke:var(--accent);stroke-width:2.5' });
      if (s.phase === 'outro') {
        var half = L.all_here.length > 4 ? [L.all_here.slice(0, 4), L.all_here.slice(4)] : [L.all_here, ''];
        out += P.text(g.marks.bpbLabelX, by - 6, half[0], P.style('--accent-ink', 15, '--font-hand', 700));
        if (half[1]) out += P.text(g.marks.bpbLabelX, by + 14, half[1], P.style('--accent-ink', 15, '--font-hand', 700));
      }
    }
    if (s.phase === 'outro') {
      out += P.text(Mt.cx[0], Mt.top - 14, L.pick_hint, P.style('--ink-2', 15, '--font-hand'), { 'text-anchor': 'middle' });
    }
    // baseline ghost: where the 8192 loss sat
    if (s.baseLoss !== null && s.phase !== 'cut') {
      var gy = meterY(g, s.baseLoss);
      out += tag('line', { x1: Mt.cx[0] - hw, y1: gy, x2: Mt.cx[0] + hw, y2: gy, style: 'stroke:var(--ink);stroke-width:1.5;stroke-dasharray:4 4' });
    }
    return out;
  }

  function drawJudge(g, P, s, copy) {
    if (s.phase !== 'judge' && s.phase !== 'outro') return '';
    var J = g.judge, L = copy.labels, St = copy.stamps, out = '';
    var a = s.phase === 'outro' ? 1 : T.ease.out(T.clamp(s.local / 0.2, 0, 1));
    var byLoss = s.judgeBy === 'loss';
    out += tag('rect', { x: J.x, y: J.y, width: J.w, height: J.h, rx: 12, 'data-box': 'judge',
      style: 'fill:var(--card);stroke:var(--ink-3);stroke-width:1.5' });
    var pad = 18, title = L.judge_title + ' · ' + (byLoss ? L.judge_by_loss : L.judge_by_bpb);
    out += P.fit(J.x + pad, J.y + 34, title, '--ink', 19, '--font-hand', 700, J.w - 2 * pad, 'judge');
    var from = byLoss ? s.baseLoss : s.baseBpb, to = byLoss ? s.loss : s.bpb;
    out += P.fit(J.x + pad, J.y + 74, f3(from) + ' → ' + f3(to), '--ink', 22, '--font-mono', 600, J.w * 0.5, 'judge');
    if (s.verdict) {
      var better = s.verdict === 'better';
      var sp = s.stamp;
      var sx = J.x + J.w - 110, sy = J.y + 66;
      out += tag('g', { transform: 'translate(' + sx + ' ' + sy + ') rotate(-6) scale(' + (1.5 - 0.5 * sp).toFixed(3) + ')', style: 'opacity:' + sp.toFixed(3) },
        tag('rect', { x: -70, y: -26, width: 140, height: 48, rx: 8, style: 'fill:none;stroke:var(' + (better ? '--keep' : '--discard') + ');stroke-width:3' }) +
        P.text(0, 9, better ? St.better : St.same, P.style(better ? '--keep-ink' : '--ink-2', 24, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'judge' }));
      if (better) {
        out += tag('g', { style: 'opacity:' + sp.toFixed(3) },
          P.text(J.x + pad, J.y + J.h - 18, St.warn, P.style('--crash-ink', 18, '--font-hand', 700), { 'data-on': 'judge' }));
      }
    }
    return tag('g', { style: 'opacity:' + a.toFixed(3) }, out);
  }

  function captionFor(s, copy) {
    var C = copy.captions;
    var vars = { v: s.target, n: M.tokensFor(s.target).length, loss: f3(M.lossPerToken(s.target)), bpb: f3(M.bpbFor(s.target)),
                 base_loss: f3(M.lossPerToken(M.BASE)), base_bpb: f3(M.bpbFor(M.BASE)) };
    if (s.phase === 'intro') return C.intro;
    if (s.phase === 'cut') return C.cut;
    if (s.phase === 'recut') return s.target === M.BASE ? C.recut_same : fmt(C.recut, vars);
    if (s.phase === 'judge') return s.target === M.BASE ? C.judge_same : fmt(s.judgeBy === 'loss' ? C.judge_loss : C.judge_bpb, vars);
    return s.judgeBy === 'loss' ? C.outro_loss : C.outro;
  }

  window.Explain.register('vocab', function (svg, ctx) {
    var copy = ctx.copy;
    var opts = { vocab: '256', byLoss: false };
    (copy.controls || []).forEach(function (c) { if (c.value !== undefined) opts[c.option] = c.value; });
    var mode = 'landscape';
    var lastLoss = null, tween = null;

    function now() { return window.performance ? performance.now() : Date.now(); }
    function animate() {
      if (!tween || !ctx.redraw) return;
      ctx.redraw();
      if (now() - tween.t0 < TWEEN_MS) window.requestAnimationFrame(animate);
      else { tween = null; ctx.redraw(); }
    }

    // a click on a ruler mark presses the matching button, so the buttons stay in sync
    svg.addEventListener('click', function (e) {
      var hit = e.target.closest && e.target.closest('[data-pick]');
      if (!hit) return;
      var v = hit.getAttribute('data-pick'), sec = svg.closest('.scene');
      var btn = sec && sec.querySelector('button[data-option="vocab"][data-value="' + v + '"]');
      if (btn) btn.click();
      else { opts.vocab = v; if (ctx.redraw) ctx.redraw(); }
    });

    return {
      duration: M.duration(),
      stops: M.stops(),
      setOption: function (key, value) {
        if (key === 'vocab' && String(value) !== String(opts.vocab) && lastLoss !== null && !ctx.reduced) {
          tween = { from: lastLoss, t0: now() };
          window.requestAnimationFrame(animate);
        }
        opts[key] = value;
      },
      layout: function (width) {
        mode = width > 0 && width < 780 ? 'portrait' : 'landscape';
        svg.setAttribute('viewBox', '0 0 ' + GEO[mode].W + ' ' + GEO[mode].H);
      },
      render: function (t) {
        var g = GEO[mode], P = Painter(g);
        var s = M.stateAt(t, opts);
        var shown = s.loss;
        if (tween && s.loss !== null) shown = lerp(tween.from, s.loss, T.ease.inOut(T.clamp((now() - tween.t0) / TWEEN_MS, 0, 1)));
        lastLoss = shown;
        svg.innerHTML = drawHeader(g, P, s, copy) + drawRibbon(g, P, s, copy) + drawFormula(g, P, s, copy, shown) +
          drawMeters(g, P, s, copy, shown) + drawJudge(g, P, s, copy);
        ctx.caption(captionFor(s, copy));
      }
    };
  });
})();
