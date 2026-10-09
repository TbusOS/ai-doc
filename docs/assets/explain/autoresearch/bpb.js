/* autoresearch scene "what val_bpb is" — drawing.
 * State comes from BpbModel.stateAt(t, {skill}); this file only draws it.
 * Left: one sentence split into tokens (chip width ∝ bytes), a cross-entropy
 * bar above each token and one small cell per byte below it. Right: the formula
 *   val_bpb = Σ cross-entropy (nats) ÷ (ln2 × Σ bytes)
 * with one color per term — orange: cross-entropy (the bars), blue: bytes (the
 * cells), purple: ln2 (the one-bit lines). The term in focus lights up on both
 * sides at once; hovering or tapping a token or a term does the same.
 * Colors are CSS variables set via style=. Two layouts: landscape 1200×675 and
 * portrait 540×1080 (svg narrower than 780px). */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var M = window.BpbModel;
  var D = window.ExplainDraw;
  var tag = D.tag, fmt = D.fmt, Painter = D.Painter;

  var TERM = {
    loss: { ink: '--accent-ink', mark: '--accent' },
    bytes: { ink: '--info-ink', mark: '--info' },
    ln2: { ink: '--t-memory', mark: '--t-memory' }
  };

  // a card-colored outline behind small labels, so the one-bit lines never cut through them
  var HALO = ';paint-order:stroke;stroke:var(--card);stroke-width:5px;stroke-linejoin:round';

  var GEO = {
    landscape: {
      W: 1200, H: 675, minFont: 13,
      left: { x: 24, y: 24, w: 624, h: 566 },
      title: { x: 48, y: 64, size: 18 },
      barsLabel: { x: 48, y: 100, size: 17 },
      bars: { x0: 116, x1: 624, base: 440, perNat: 62, label: 15 },
      bitLabel: { x: 106, size: 15 },
      chip: { y: 452, h: 48, size: 20, gap: 3 },
      cell: { y: 508, h: 14 },
      count: { y: 546, size: 15 },
      hint: { x: 48, y: 576, size: 15 },
      right: { x: 668, y: 24, w: 508, h: 566 },
      f: { nameX: 690, cx: 1000, row1: 168, row2: 300, gap: 24, size: 27, numSize: 28,
           result: { x: 690, y: 432, size: 44, unit: 20 }, plain: { y: 512, size: 22 }, lower: { y: 552, size: 17 } }
    },
    portrait: {
      W: 540, H: 1080, minFont: 15,
      left: { x: 16, y: 16, w: 508, h: 560 },
      title: { x: 36, y: 52, size: 18 },
      barsLabel: { x: 36, y: 86, size: 17 },
      bars: { x0: 96, x1: 508, base: 404, perNat: 54, label: 15 },
      bitLabel: { x: 88, size: 15 },
      chip: { y: 414, h: 42, size: 16, gap: 3 },
      cell: { y: 464, h: 13 },
      count: { y: 500, size: 15 },
      hint: { x: 36, y: 552, size: 15 },
      right: { x: 16, y: 594, w: 508, h: 470 },
      f: { nameX: 34, cx: 330, row1: 680, row2: 800, gap: 22, size: 22, numSize: 24,
           result: { x: 34, y: 922, size: 40, unit: 18 }, plain: { y: 990, size: 20 }, lower: { y: 1030, size: 16 } }
    }
  };

  function layoutTokens(g, toks) {
    var B = g.bars, total = toks.reduce(function (a, x) { return a + x.bytes; }, 0);
    var unit = (B.x1 - B.x0) / total, x = B.x0;
    return toks.map(function (tk) {
      var w = tk.bytes * unit, r = { x: x, w: w, unit: unit, cx: x + w / 2 };
      x += w;
      return r;
    });
  }

  function pct(p) { var v = p * 100; return (v < 10 ? v.toFixed(1).replace(/\.0$/, '') : v.toFixed(0)) + '%'; }
  function short(p) { return String(parseFloat(p.toFixed(3))); }

  // what is lit: a term ('loss' | 'bytes' | 'ln2'), all three ('all'), or nothing
  function litTerm(s, active) {
    if (active && active.term) return active.term;
    if (active && active.tok !== undefined) return null;
    return s.focus;
  }
  function isLit(lit, key) { return lit === key || lit === 'all'; }

  /* ---------- left: tokens, bars, byte cells, one-bit lines ---------- */

  function drawLeft(g, P, s, copy, active) {
    var L = g.left, B = g.bars, C = g.chip, out = '', lab = copy.labels;
    var lit = litTerm(s, active), tokSel = active && active.tok !== undefined ? active.tok : null;
    out += tag('rect', { x: L.x, y: L.y, width: L.w, height: L.h, rx: 16, style: 'fill:var(--card);stroke:var(--line);stroke-width:1.5', 'data-box': 'bpb-left' });
    out += P.fit(g.title.x, g.title.y, lab.sentence, '--ink-2', g.title.size, '--font-hand', 400, L.w - 48, 'bpb-left');
    var pos = layoutTokens(g, s.tokens);
    var show = s.shown;

    // one dashed line per bit: ln2 nats apart
    if (s.bits > 0) {
      var o = s.bits * (isLit(lit, 'ln2') ? 1 : 0.45);
      for (var k = 1; k * Math.LN2 * B.perNat < B.base - (g.barsLabel.y + 20); k++) {
        var y = B.base - k * Math.LN2 * B.perNat;
        out += tag('line', { x1: B.x0, y1: y.toFixed(1), x2: B.x1, y2: y.toFixed(1),
          style: 'stroke:var(--t-memory);stroke-width:' + (isLit(lit, 'ln2') ? 2 : 1.5) + ';stroke-dasharray:7 6;opacity:' + o.toFixed(3) });
        out += tag('g', { style: 'opacity:' + o.toFixed(3) },
          P.text(g.bitLabel.x, y + 5, fmt(lab.bit, { n: k }), P.style('--t-memory', g.bitLabel.size, '--font-hand', 700) + HALO, { 'text-anchor': 'end', 'data-on': 'bpb-left' }));
      }
    }
    // bars label (orange, the numerator)
    out += P.fit(g.barsLabel.x, g.barsLabel.y, lab.bars, '--accent-ink', g.barsLabel.size, '--font-hand', 700, 240, 'bpb-left');
    out += tag('line', { x1: B.x0 - 4, y1: B.base, x2: B.x1, y2: B.base, style: 'stroke:var(--ink-3);stroke-width:1.5' });

    var dimBars = lit === 'bytes' ? 0.3 : lit === 'ln2' ? 0.55 : 1;
    s.tokens.forEach(function (tk, i) {
      var r = pos[i], appear = T.clamp(show - i, 0, 1);
      if (appear <= 0) return;
      var sel = tokSel === i;
      var group = '';
      // bar
      var h = tk.loss * B.perNat * s.risen[i];
      if (h > 0.5) {
        var bw = Math.max(8, r.w - 12);
        group += tag('rect', { x: (r.cx - bw / 2).toFixed(1), y: (B.base - h).toFixed(1), width: bw.toFixed(1), height: h.toFixed(1), rx: 4,
          'data-tok': i, style: 'fill:var(--accent);opacity:' + (sel ? 1 : dimBars * 0.85).toFixed(3) +
            (sel || (isLit(lit, 'loss') && s.active === i) ? ';stroke:var(--accent-ink);stroke-width:2.5' : '') });
        if (s.risen[i] >= 1) {
          var lt = tk.loss.toFixed(2), lw = P.width(lt, B.label), ly = B.base - h - 8;
          group += tag('rect', { x: (r.cx - lw / 2 - 4).toFixed(1), y: (ly - B.label * 0.86).toFixed(1), width: (lw + 8).toFixed(1), height: (B.label * 1.12).toFixed(1),
              rx: 4, style: 'fill:var(--card)' }) +
            tag('g', { style: 'opacity:' + (sel ? 1 : Math.max(dimBars, 0.5)).toFixed(3) },
              P.text(r.cx.toFixed(1), ly.toFixed(1), lt, P.style('--accent-ink', B.label, '--font-mono', 700), { 'text-anchor': 'middle', 'data-on': 'bpb-left' }));
        }
      }
      // token chip: leading space drawn as a small dot
      var cid = 'bpb-chip-' + i;
      group += tag('rect', { x: (r.x + C.gap / 2).toFixed(1), y: C.y, width: (r.w - C.gap).toFixed(1), height: C.h, rx: 8, 'data-tok': i, 'data-box': cid,
        style: 'fill:var(--card);stroke:var(' + (sel ? '--accent' : '--ink-3') + ');stroke-width:' + (sel ? 2.5 : 1.5) + ';cursor:pointer' });
      var word = tk.text.replace(/^ /, ''), lead = word.length < tk.text.length;
      var ww = P.width(word, C.size), tx = r.cx + (lead ? r.unit * 0.3 : 0);
      if (lead) group += tag('circle', { cx: (tx - ww / 2 - r.unit * 0.5).toFixed(1), cy: C.y + C.h * 0.6, r: 2.6, style: 'fill:var(--ink-3)', 'data-tok': i });
      group += P.fit(tx.toFixed(1), C.y + C.h * 0.66, word, '--ink', C.size, '--font-mono', 600, r.w - C.gap - (lead ? r.unit : 6), cid, 'middle');
      // byte cells, counted left to right during the bytes station
      var before = pos.slice(0, i).reduce(function (a, p, j) { return a + s.tokens[j].bytes; }, 0);
      for (var b = 0; b < tk.bytes; b++) {
        var counted = before + b < s.sumBytes;
        group += tag('rect', { x: (r.x + b * r.unit + 1.5).toFixed(1), y: g.cell.y, width: (r.unit - 3).toFixed(1), height: g.cell.h, rx: 2, 'data-tok': i,
          style: counted ? 'fill:var(--info);opacity:' + (isLit(lit, 'bytes') || sel ? 1 : 0.6) : 'fill:none;stroke:var(--line);stroke-width:1.2' });
      }
      if (before + tk.bytes <= s.sumBytes) {
        group += P.text(r.cx.toFixed(1), g.count.y, String(tk.bytes), P.style('--info-ink', g.count.size, '--font-mono', 700), { 'text-anchor': 'middle', 'data-on': 'bpb-left' });
      }
      out += tag('g', { style: 'opacity:' + appear.toFixed(3) + ';cursor:pointer', 'data-tok': i }, group);
    });
    out += P.fit(g.hint.x, g.hint.y, lab.hint, '--ink-2', g.hint.size, '--font-hand', 400, L.w - 48, 'bpb-left');
    return out;
  }

  /* ---------- right: the formula, symbols and numbers ---------- */

  // lay segments [{t, term?, ink, fam, size, weight}] centred on cx; returns svg + term boxes
  function row(P, cx, y, segs, gap, lit, id, onTerm) {
    var widths = segs.map(function (sg) { return P.width(sg.t, sg.size); });
    var total = widths.reduce(function (a, w) { return a + w; }, 0) + gap * (segs.length - 1);
    var x = cx - total / 2, out = '', marks = '';
    segs.forEach(function (sg, i) {
      var w = widths[i];
      if (sg.term) {
        var on = isLit(lit, sg.term);
        marks += tag('rect', { x: (x - 8).toFixed(1), y: (y - sg.size * 1.02).toFixed(1), width: (w + 16).toFixed(1), height: (sg.size * 1.4).toFixed(1), rx: 8,
          'data-term': sg.term, style: 'cursor:pointer;fill:var(' + TERM[sg.term].mark + ');opacity:' + (on ? 0.16 : 0) +
            (on && lit !== 'all' ? ';stroke:var(' + TERM[sg.term].mark + ');stroke-width:2;stroke-opacity:1' : '') });
        if (onTerm) onTerm(sg.term, x, w);
      }
      out += P.text(x.toFixed(1), y, sg.t, P.style(sg.ink, sg.size, sg.fam, sg.weight), sg.term ? { 'data-term': sg.term, 'data-on': id } : { 'data-on': id });
      x += w + gap;
    });
    return { svg: marks + out, width: total };
  }

  function fraction(P, cx, yMid, num, den, gap, lit, id) {
    var top = row(P, cx, yMid - 14, num, gap, lit, id);
    var bot = row(P, cx, yMid + 36, den, gap, lit, id);
    var w = Math.max(top.width, bot.width) + 28;
    return { svg: top.svg + tag('line', { x1: (cx - w / 2).toFixed(1), y1: yMid, x2: (cx + w / 2).toFixed(1), y2: yMid, style: 'stroke:var(--ink);stroke-width:2' }) + bot.svg, w: w };
  }

  function drawRight(g, P, s, copy, active) {
    var R = g.right, F = g.f, lab = copy.labels, out = '', id = 'bpb-formula';
    var lit = litTerm(s, active);
    out += tag('rect', { x: R.x, y: R.y, width: R.w, height: R.h, rx: 16, style: 'fill:var(--card);stroke:var(--line);stroke-width:1.5', 'data-box': id });
    var seg = function (t, term, fam, size, weight) {
      return { t: t, term: term, ink: term ? TERM[term].ink : '--ink', fam: fam || '--font-hand', size: size || F.size, weight: weight || 700 };
    };
    // row 1: symbols
    out += P.text(F.nameX, F.row1 + 10, lab.name + ' =', P.style('--ink', F.size, '--font-mono', 700), { 'data-on': id });
    var nameW = P.width(lab.name + ' =', F.size) + 16;
    var cx = F.nameX + nameW + (R.x + R.w - 20 - F.nameX - nameW) / 2;
    out += fraction(P, cx, F.row1, [seg(lab.num, 'loss')], [seg(lab.ln2, 'ln2', '--font-mono'), seg('×'), seg(lab.den, 'bytes')], F.gap * 0.6, lit, id).svg;
    // row 2: numbers, filled in as each term is counted
    var M2 = F.numSize, mono = '--font-mono';
    var natsTxt = s.sumNats > 0 ? s.sumNats.toFixed(2) : '?';
    var lnTxt = s.bits > 0 ? Math.LN2.toFixed(3) : '?';
    var byteTxt = s.sumBytes > 0 ? String(s.sumBytes) : '?';
    out += P.text(F.nameX + nameW - P.width('=', F.size) - 16, F.row2 + 10, '=', P.style('--ink', F.size, mono, 700), { 'data-on': id });
    out += fraction(P, cx, F.row2, [seg(natsTxt, 'loss', mono, M2)], [seg(lnTxt, 'ln2', mono, M2), seg('×', null, mono, M2), seg(byteTxt, 'bytes', mono, M2)], F.gap * 0.5, lit, id).svg;
    // result
    var Rs = F.result;
    if (s.bpb !== null) {
      var o = s.reveal.toFixed(3);
      out += tag('g', { style: 'opacity:' + o },
        P.text(Rs.x, Rs.y, '≈ ' + s.bpb.toFixed(3), P.style('--ink', Rs.size, mono, 700), { 'data-on': id }) +
        P.text(Rs.x + P.width('≈ ' + s.bpb.toFixed(3), Rs.size) + 14, Rs.y, lab.unit, P.style('--ink-2', Rs.unit, '--font-hand', 700), { 'data-on': id }) +
        P.fit(R.x + 22, F.plain.y, fmt(lab.plain, { bpb: s.bpb.toFixed(3) }), '--ink', F.plain.size, '--font-hand', 700, R.w - 44, id) +
        P.fit(R.x + 22, F.lower.y, lab.lower, '--ink-2', F.lower.size, '--font-hand', 700, R.w - 44, id));
    }
    return out;
  }

  function captionFor(s, copy, active) {
    var c = copy.captions, total = s.tokens.reduce(function (a, x) { return a + x.bytes; }, 0);
    if (active && active.tok !== undefined) {
      var tk = s.tokens[active.tok];
      return fmt(c.token, { tok: tk.text.replace(/^ /, ''), p: pct(tk.p), pp: short(tk.p), loss: tk.loss.toFixed(2), bytes: tk.bytes });
    }
    if (active && active.term) {
      var nats = s.tokens.reduce(function (a, x) { return a + x.loss; }, 0);
      return fmt(c['term_' + active.term], { nats: nats.toFixed(2), bytes: total });
    }
    if (s.station === 'bytes') return fmt(c.bytes, { bytes: total });
    if (s.station === 'result') return fmt(c.result, { bpb: s.bpb.toFixed(3) });
    return c[s.station];
  }

  window.Explain.register('bpb', function (svg, ctx) {
    var copy = ctx.copy;
    var opts = { skill: 0 };
    var mode = 'landscape';
    var hover = null, pinned = null;

    function pick(e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-tok],[data-term]') : null;
      if (!el) return null;
      if (el.hasAttribute('data-term')) return { term: el.getAttribute('data-term') };
      return { tok: +el.getAttribute('data-tok') };
    }
    function same(a, b) { return !!a && !!b && a.term === b.term && a.tok === b.tok; }
    function redraw() { if (ctx.redraw) ctx.redraw(); }

    svg.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var h = pick(e);
      if (!same(h, hover) && (h || hover)) { hover = h; redraw(); }
    });
    svg.addEventListener('pointerleave', function () { if (hover) { hover = null; redraw(); } });
    svg.addEventListener('click', function (e) {
      var h = pick(e);
      pinned = h && !same(h, pinned) ? h : null;
      redraw();
    });

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
        var active = hover || pinned;
        if (active && active.tok !== undefined && active.tok >= s.shown) active = null;
        svg.innerHTML = drawLeft(g, P, s, copy, active) + drawRight(g, P, s, copy, active);
        ctx.caption(captionFor(s, copy, active));
      }
    };
  });
})();
