/* autoresearch scene 10 drawing — progress.png replayed dot by dot.
 * State comes from ProgressModel (data: datasets.progress); this file only draws.
 * Reader interaction: hover or tap a dot. A green dot opens its card (label from
 * the figure, the train.py line it changed, a plain-words note); a grey dot shows
 * a one-line tip. A tap pauses the scene and pins the card until time moves (play / scrub / step).
 * Colors are CSS variables via style=; text on a card carries data-on / data-fit.
 * Landscape 1200×675, portrait 540×1080 (svg narrower than 780px). */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var D = window.ExplainDraw;
  var tag = D.tag, fmt = D.fmt, Painter = D.Painter;

  var GEO = {
    landscape: {
      W: 1200, H: 675, minFont: 13,
      head: { x: 40, y: 48, size: 26, subX: 186, subSize: 18, hintX: 770, hintSize: 16 },
      legend: { x: 40, y: 86, size: 15, gap: 110 },
      plot: { l: 100, r: 770, t: 116, b: 588, xMin: -2, xMax: 84, yMin: 0.974, yMax: 1.001 },
      ticks: { size: 13, xLabelY: 610, yLabelX: 92, titleX: 770, titleY: 640, yTitleX: 30 },
      dot: { grey: 5, keep: 8, hit: 16 },
      panel: { x: 800, y: 64, w: 376, h: 584, pad: 22 },
      card: { head: 22, score: 16, sec: 14, label: 16, code: 15, plain: 17, plainLH: 27, labelLH: 22, codeLH: 22 },
      bars: { size: 13 }, waffle: { cols: 12 }
    },
    portrait: {
      W: 540, H: 1080, minFont: 15,
      head: { x: 24, y: 44, size: 24, subX: 24, subY: 74, subSize: 16, hintX: 516, hintSize: 15 },
      legend: { x: 24, y: 108, size: 15, gap: 100 },
      plot: { l: 84, r: 520, t: 140, b: 560, xMin: -2, xMax: 84, yMin: 0.974, yMax: 1.001 },
      ticks: { size: 15, xLabelY: 586, yLabelX: 76, titleX: 520, titleY: 614, yTitleX: 16 },
      dot: { grey: 4, keep: 6.5, hit: 20 },
      panel: { x: 16, y: 636, w: 508, h: 428, pad: 20 },
      card: { head: 21, score: 16, sec: 15, label: 15, code: 15, plain: 17, plainLH: 26, labelLH: 21, codeLH: 21 },
      bars: { size: 15 }, waffle: { cols: 21 }
    }
  };

  function sx(g, x) { var p = g.plot; return p.l + (x - p.xMin) / (p.xMax - p.xMin) * (p.r - p.l); }
  function sy(g, v) { var p = g.plot; return p.b - (v - p.yMin) / (p.yMax - p.yMin) * (p.b - p.t); }

  function chip(P, x, y, text, kind, size) {
    var w = P.width(text, size) + 14, h = size + 8;
    var color = kind === 'quote' ? '--info' : '--accent';
    var ink = kind === 'quote' ? '--info-ink' : '--accent-ink';
    return tag('rect', { x: x, y: y - h + 5, width: w, height: h, rx: 6, style: 'fill:none;stroke:var(' + color + ');stroke-width:1.2' }) +
      P.text(x + 7, y, text, P.style(ink, size, '--font-head', 700), { 'data-on': 'panel' });
  }

  /* ---------- chart ---------- */

  function drawAxes(g, P, copy) {
    var p = g.plot, k = g.ticks, out = '';
    [0.975, 0.98, 0.985, 0.99, 0.995, 1.0].forEach(function (v) {
      var y = sy(g, v);
      out += tag('line', { x1: p.l, y1: y, x2: p.r, y2: y, style: 'stroke:var(--line-soft);stroke-width:1' });
      out += P.text(k.yLabelX, y + 5, v.toFixed(3), P.style('--ink-2', k.size, '--font-mono'), { 'text-anchor': 'end' });
    });
    [0, 20, 40, 60, 80].forEach(function (v) {
      var x = sx(g, v);
      out += tag('line', { x1: x, y1: p.b, x2: x, y2: p.b + 6, style: 'stroke:var(--ink-3);stroke-width:1.5' });
      out += P.text(x, k.xLabelY, String(v), P.style('--ink-2', k.size, '--font-mono'), { 'text-anchor': 'middle' });
    });
    out += tag('line', { x1: p.l, y1: p.b, x2: p.r, y2: p.b, style: 'stroke:var(--ink-3);stroke-width:1.5' });
    out += tag('line', { x1: p.l, y1: p.t, x2: p.l, y2: p.b, style: 'stroke:var(--ink-3);stroke-width:1.5' });
    out += P.text(k.titleX, k.titleY, copy.labels.axis_x, P.style('--ink-2', 15), { 'text-anchor': 'end' });
    var ym = (p.t + p.b) / 2;
    out += P.text(k.yTitleX, ym, copy.labels.axis_y, P.style('--ink-2', 15), { 'text-anchor': 'middle', transform: 'rotate(-90 ' + k.yTitleX + ' ' + ym + ')' });
    return out;
  }

  function drawLegend(g, P, copy) {
    var L = g.legend, out = '', x = L.x, y = L.y;
    out += tag('circle', { cx: x + 6, cy: y - 5, r: g.dot.grey + 1, style: 'fill:var(--discard);opacity:0.55' });
    out += P.text(x + 18, y, copy.labels.legend_discard, P.style('--ink-2', L.size));
    x += L.gap * 0.75;
    out += tag('circle', { cx: x + 6, cy: y - 5, r: g.dot.keep - 1, style: 'fill:var(--keep);stroke:var(--card);stroke-width:2' });
    out += P.text(x + 20, y, copy.labels.legend_keep, P.style('--ink-2', L.size));
    x += L.gap * 0.75;
    out += tag('line', { x1: x, y1: y - 5, x2: x + 26, y2: y - 5, style: 'stroke:var(--keep);stroke-width:3' });
    out += P.text(x + 34, y, copy.labels.legend_best, P.style('--ink-2', L.size));
    return out;
  }

  function drawBestLine(g, M, s) {
    var kept = M.KEPT.filter(function (k) { return k.x <= s.cursor + 1e-9; });
    if (!kept.length) return '';
    var best = kept[0].bpb, d = 'M' + sx(g, kept[0].x).toFixed(1) + ' ' + sy(g, best).toFixed(1);
    for (var i = 1; i < kept.length; i++) {
      d += ' H' + sx(g, kept[i].x).toFixed(1);
      best = Math.min(best, kept[i].bpb);
      d += ' V' + sy(g, best).toFixed(1);
    }
    d += ' H' + sx(g, s.cursor).toFixed(1);
    return tag('path', { d: d, style: 'fill:none;stroke:var(--keep);stroke-width:3;stroke-linejoin:round;opacity:0.8' });
  }

  function drawDots(g, M, s, ui) {
    var out = '', keeps = '';
    M.visible(s).forEach(function (p) {
      var x = sx(g, p.x), y = sy(g, p.bpb);
      if (p.status === 'keep') {
        keeps += tag('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: g.dot.keep, 'data-dot': 'keep',
          style: 'fill:var(--keep);stroke:var(--card);stroke-width:2' });
      } else {
        out += tag('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: g.dot.grey, 'data-dot': 'discard',
          style: 'fill:var(--discard);opacity:' + (ui.dimGrey ? 0.3 : 0.55) });
      }
      // a fresh dot leaves a fading ring for 1.5 x-units behind the cursor
      var age = s.cursor - p.x;
      if (s.phase === 'keep' && age < 1.5 && age >= 0) {
        var a = T.clamp(age / 1.5, 0, 1);
        out += tag('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: ((p.status === 'keep' ? g.dot.keep : g.dot.grey) + 3 + 10 * a).toFixed(1),
          style: 'fill:none;stroke:var(' + (p.status === 'keep' ? '--keep' : '--discard') + ');stroke-width:2;opacity:' + (0.8 * (1 - a)).toFixed(3) });
      }
    });
    return out + keeps;
  }

  function ring(g, x, bpb, color, r) {
    return tag('circle', { cx: sx(g, x).toFixed(1), cy: sy(g, bpb).toFixed(1), r: r, style: 'fill:none;stroke:var(' + color + ');stroke-width:3' });
  }

  function drawCursor(g, s) {
    if (s.phase !== 'keep') return '';
    var x = sx(g, s.cursor).toFixed(1);
    return tag('line', { x1: x, y1: g.plot.t, x2: x, y2: g.plot.b, style: 'stroke:var(--ink-3);stroke-width:1.5;stroke-dasharray:4 6' });
  }

  function drawFilterOverlay(g, P, M, s, copy) {
    var p = g.plot, yc = sy(g, M.CUT), a = T.ease.out(T.clamp(s.local / 0.3, 0, 1)), out = '';
    out += tag('rect', { x: p.l, y: p.t - 8, width: p.r - p.l, height: Math.max(0, yc - p.t + 8),
      style: 'fill:var(--paper-2);opacity:' + (0.85 * a).toFixed(3) });
    out += tag('line', { x1: p.l, y1: yc, x2: p.l + (p.r - p.l) * a, y2: yc, style: 'stroke:var(--accent);stroke-width:2;stroke-dasharray:8 6' });
    if (a > 0.5) {
      var cw = P.width(copy.labels.cut, 15) + 12;
      out += tag('rect', { x: p.r - cw - 2, y: yc - 27, width: cw, height: 24, rx: 6, 'data-box': 'cutlabel', style: 'fill:var(--card)' });
      out += P.fit(p.r - 8, yc - 9, copy.labels.cut, '--accent-ink', 15, '--font-hand', 700, cw - 12, 'cutlabel', 'end');
      out += P.text(p.l + 8, yc - 8, copy.labels.cut_above, P.style('--ink-2', 14), { 'data-on': 'stage' });
    }
    var b = T.clamp((s.local - 0.3) / 0.3, 0, 1);
    if (b > 0) {
      M.HIDDEN.forEach(function (hx) {
        var x = sx(g, hx);
        out += tag('line', { x1: x, y1: p.b, x2: x, y2: yc + 4, style: 'stroke:var(--accent);stroke-width:1.5;stroke-dasharray:2 5;opacity:' + b.toFixed(3) });
        out += tag('path', { d: 'M' + (x - 5) + ' ' + (yc + 2) + ' l5 -9 l5 9', style: 'fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round;opacity:' + b.toFixed(3) });
        out += tag('circle', { cx: x, cy: p.b, r: 4.5, style: 'fill:var(--card);stroke:var(--accent);stroke-width:2;opacity:' + b.toFixed(3) });
      });
    }
    return out;
  }

  /* ---------- side panel ---------- */

  function panelBox(g) {
    var Q = g.panel;
    return tag('rect', { x: Q.x, y: Q.y, width: Q.w, height: Q.h, rx: 14, 'data-box': 'panel',
      style: 'fill:var(--card);stroke:var(--line);stroke-width:1.5' });
  }

  function lines(P, x, y, arr, color, size, lh, fam, weight, avail) {
    var out = '';
    arr.forEach(function (l, i) { out += P.fit(x, y + i * lh, l, color, size, fam, weight, avail, 'panel'); });
    return out;
  }

  function drawCard(g, P, M, copy, k, card) {
    var Q = g.panel, C = g.card, L = copy.labels, x = Q.x + Q.pad, avail = Q.w - 2 * Q.pad, y = Q.y + Q.pad, out = panelBox(g);
    var kept = M.KEPT[k];
    out += P.fit(x, y + C.head, fmt(L.card_head, { x: kept.x }), '--keep-ink', C.head, '--font-hand', 700, avail, 'panel');
    y += C.head + 12;
    out += P.fit(x, y + C.score + 4, fmt(L.card_score, { bpb: kept.bpb.toFixed(5) }), '--ink', C.score, '--font-mono', 600, avail, 'panel');
    y += C.score + 10;
    out += P.fit(x, y + C.score + 6, kept.drop === null ? L.card_base : fmt(L.card_drop, { drop: kept.drop.toFixed(4) }), '--ink-2', C.score, '--font-hand', 400, avail, 'panel');
    y += C.score + 22;
    out += tag('line', { x1: x, y1: y, x2: x + avail, y2: y, style: 'stroke:var(--line);stroke-width:1;stroke-dasharray:3 5' });

    y += 28;
    out += P.text(x, y, L.card_label, P.style('--ink-2', C.sec), { 'data-on': 'panel' });
    out += chip(P, x + P.width(L.card_label, C.sec) + 10, y, L.tag_quote, 'quote', 13);
    var lab = P.wrap(card.label.quote, C.label, avail);
    out += lines(P, x, y + C.labelLH + 2, lab, '--ink', C.label, C.labelLH, '--font-mono', 600, avail);
    y += C.labelLH * lab.length + 4;
    if (card.truncated) { y += C.labelLH - 2; out += P.fit(x, y, '↑ ' + L.card_truncated, '--accent-ink', 14, '--font-hand', 400, avail, 'panel'); }

    y += 34;
    // an earlier kept run already changed this line: the code shown is the default, say so
    var codeHead = card.after != null ? fmt(L.card_code_after, { x: card.after }) : L.card_code;
    out += P.text(x, y, codeHead, P.style('--ink-2', C.sec), { 'data-on': 'panel' });
    out += chip(P, x + P.width(codeHead, C.sec) + 10, y, L.tag_quote, 'quote', 13);
    var code = card.code.length ? card.code.map(function (c) { return c.quote; }) : [L.card_nocode];
    var ch = code.length * C.codeLH + 14;
    out += tag('rect', { x: x, y: y + 10, width: avail, height: ch, rx: 8, 'data-box': 'code', style: 'fill:var(--paper-2)' });
    code.forEach(function (c, i) {
      out += P.fit(x + 12, y + 10 + 7 + (i + 0.75) * C.codeLH, c, card.code.length ? '--ink' : '--ink-2', C.code,
        card.code.length ? '--font-mono' : '--font-hand', 400, avail - 24, 'code');
    });
    y += 10 + ch;

    y += 34;
    out += P.text(x, y, L.card_plain, P.style('--ink-2', C.sec), { 'data-on': 'panel' });
    out += chip(P, x + P.width(L.card_plain, C.sec) + 10, y, L.tag_interp, 'interp', 13);
    out += lines(P, x, y + C.plainLH + 2, P.wrap(card.plain, C.plain, avail), '--ink', C.plain, C.plainLH, '--font-hand', 400, avail);
    return out;
  }

  function drawIntroPanel(g, P, copy) {
    var Q = g.panel, L = copy.labels, x = Q.x + Q.pad, avail = Q.w - 2 * Q.pad, out = panelBox(g), y = Q.y + Q.pad + 26;
    var rows = [
      ['discard', L.legend_discard, copy.intro_rows[0]],
      ['keep', L.legend_keep, copy.intro_rows[1]],
      ['best', L.legend_best, copy.intro_rows[2]]
    ];
    out += P.fit(x, y, copy.intro_title, '--ink', 21, '--font-hand', 700, avail, 'panel');
    y += 52;
    rows.forEach(function (r) {
      if (r[0] === 'discard') out += tag('circle', { cx: x + 12, cy: y - 6, r: 8, style: 'fill:var(--discard);opacity:0.55' });
      else if (r[0] === 'keep') out += tag('circle', { cx: x + 12, cy: y - 6, r: 11, style: 'fill:var(--keep);stroke:var(--card);stroke-width:2' });
      else out += tag('line', { x1: x, y1: y - 6, x2: x + 26, y2: y - 6, style: 'stroke:var(--keep);stroke-width:4' });
      out += P.fit(x + 40, y, r[1], '--ink', 19, '--font-hand', 700, avail - 40, 'panel');
      var w = P.wrap(r[2], 16, avail - 40);
      out += lines(P, x + 40, y + 26, w, '--ink-2', 16, 24, '--font-hand', 400, avail - 40);
      y += 26 + w.length * 24 + 26;
    });
    out += P.fit(x, Q.y + Q.h - Q.pad - 4, '→ ' + L.hint, '--accent-ink', 16, '--font-hand', 700, avail, 'panel');
    return out;
  }

  function drawSeedPanel(g, P, M, copy, s) {
    var Q = g.panel, L = copy.labels, x = Q.x + Q.pad, avail = Q.w - 2 * Q.pad, out = panelBox(g), sz = g.bars.size;
    out += P.fit(x, Q.y + Q.pad + 24, L.seed_title, '--ink', 20, '--font-hand', 700, avail - 60, 'panel');
    out += chip(P, x + Math.min(avail - 60, P.width(L.seed_title, 20)) + 10, Q.y + Q.pad + 22, L.tag_interp, 'interp', 13);
    var bars = M.KEPT.slice(1), n = bars.length;
    var base = Q.y + Q.h - Q.pad - 34, top = Q.y + Q.pad + 96, cap = 0.003, H = base - top;
    var step = avail / n, bw = Math.min(18, step * 0.62);
    var grow = T.ease.out(T.clamp(s.local / 0.3, 0, 1));
    var mark = T.clamp((s.local - 0.3) / 0.25, 0, 1);
    var smaller = {};
    M.SMALLER_THAN_SEED.forEach(function (k) { smaller[k.x] = true; });
    bars.forEach(function (k, i) {
      var cx = x + step * (i + 0.5), clipped = k.drop > cap;
      var h = Math.min(k.drop, cap) / cap * H * grow;
      var isSeed = k.x === M.KEPT[M.SEED].x, hot = mark > 0 && (isSeed || smaller[k.x]);
      out += tag('rect', { x: (cx - bw / 2).toFixed(1), y: (base - h).toFixed(1), width: bw.toFixed(1), height: h.toFixed(1), rx: 3,
        style: hot ? (isSeed ? 'fill:var(--accent)' : 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:2') : 'fill:var(--keep);opacity:0.85' });
      out += P.text(cx, base + sz + 8, String(k.x), P.style(hot ? '--accent-ink' : '--ink-2', sz, '--font-mono', hot ? 700 : 400),
        { 'text-anchor': 'middle', 'data-on': 'panel' });
      if (clipped && grow > 0.9) {
        // the first drop is far taller than the rest: cut the bar and print its value
        var by = base - h + 14;
        out += tag('path', { d: 'M' + (cx - bw / 2 - 3) + ' ' + (by + 4) + ' l' + (bw + 6) + ' -6 M' + (cx - bw / 2 - 3) + ' ' + (by + 11) + ' l' + (bw + 6) + ' -6',
          style: 'stroke:var(--card);stroke-width:3' });
        out += P.text(x, top - 12, fmt(L.seed_clip, { v: k.drop.toFixed(4) }), P.style('--ink-2', sz, '--font-mono'), { 'data-on': 'panel' });
      }
    });
    out += tag('line', { x1: x, y1: base, x2: x + avail, y2: base, style: 'stroke:var(--ink-3);stroke-width:1.5' });
    if (mark > 0) {
      var ly = base - M.SEED_DROP / cap * H;
      out += tag('line', { x1: x, y1: ly, x2: x + avail * mark, y2: ly, style: 'stroke:var(--accent);stroke-width:2;stroke-dasharray:7 5' });
      // labels sit over the short bars on the right, clear of the tall ones
      var lx = x + avail, tallest = 0;
      bars.forEach(function (k, i) { if (x + step * (i + 1) > lx - 200) tallest = Math.max(tallest, Math.min(k.drop, cap)); });
      var lyTop = Math.min(ly, base - tallest / cap * H) - 14;
      if (lyTop < ly - 30) out += tag('line', { x1: lx, y1: lyTop + 8, x2: lx, y2: ly, style: 'stroke:var(--accent);stroke-width:1.5;stroke-dasharray:2 4' });
      out += P.fit(lx, lyTop - 28, fmt(L.seed_line, { seed: M.SEED_DROP.toFixed(4) }), '--accent-ink', 17, '--font-hand', 700, avail, 'panel', 'end');
      out += P.fit(lx, lyTop, fmt(L.seed_note, { n: M.SMALLER_THAN_SEED.length }), '--accent-ink', 17, '--font-hand', 400, avail, 'panel', 'end');
    }
    out += P.text(x + avail, base + 2 * sz + 16, copy.labels.axis_x, P.style('--ink-2', sz), { 'text-anchor': 'end', 'data-on': 'panel' });
    return out;
  }

  function drawFilterPanel(g, P, M, copy, s) {
    var Q = g.panel, L = copy.labels, x = Q.x + Q.pad, avail = Q.w - 2 * Q.pad, out = panelBox(g), y = Q.y + Q.pad + 24;
    var vars = { total: M.TOTAL, kept: M.KEPT.length, notkept: M.NOT_KEPT, grey: M.GREY_DRAWN, hidden: M.HIDDEN.length, err: M.ERROR.toFixed(5) };
    var show = function (from) { return T.clamp((s.local - from) / 0.12, 0, 1) > 0; };
    out += P.fit(x, y, L.filter_title, '--ink', 21, '--font-hand', 700, avail, 'panel');
    y += 46;
    out += P.fit(x, y, fmt(L.filter_notkept, vars), '--ink', 19, '--font-hand', 400, avail, 'panel');
    y += 34;
    if (show(0.1)) {
      out += tag('circle', { cx: x + 8, cy: y - 6, r: 6, style: 'fill:var(--discard);opacity:0.55' });
      out += P.fit(x + 22, y, fmt(L.filter_grey, vars), '--ink', 19, '--font-hand', 400, avail - 22, 'panel');
    }
    y += 34;
    if (show(0.3)) {
      out += P.fit(x, y, fmt(L.filter_hidden, vars), '--accent-ink', 19, '--font-hand', 700, avail - 60, 'panel');
      out += chip(P, x + Math.min(avail - 60, P.width(fmt(L.filter_hidden, vars), 19)) + 10, y - 2, L.tag_interp, 'interp', 13);
    }
    y += 44;
    var rules = [[L.filter_crash, copy.filter_code[0].quote], [L.filter_rule, copy.filter_code[1].quote]];
    rules.forEach(function (r, i) {
      if (!show(0.45 + i * 0.15)) return;
      out += P.fit(x, y, r[0], '--ink-2', 16, '--font-hand', 400, avail - 60, 'panel');
      out += chip(P, x + Math.min(avail - 60, P.width(r[0], 16)) + 10, y, L.tag_quote, 'quote', 13);
      out += tag('rect', { x: x, y: y + 10, width: avail, height: 34, rx: 8, 'data-box': 'code', style: 'fill:var(--paper-2)' });
      out += P.fit(x + 12, y + 33, r[1], '--ink', 15, '--font-mono', 400, avail - 24, 'code');
      y += 74;
    });
    if (show(0.75)) out += P.fit(x, Q.y + Q.h - Q.pad - 4, fmt(L.filter_error, vars), '--ink-2', 16, '--font-hand', 400, avail, 'panel');
    return out;
  }

  function drawOutroPanel(g, P, M, copy, s) {
    var Q = g.panel, L = copy.labels, x = Q.x + Q.pad, avail = Q.w - 2 * Q.pad, out = panelBox(g);
    var vars = { total: M.TOTAL, kept: M.KEPT.length, first: M.BASELINE.toFixed(4), last: s.best.toFixed(4) };
    var y = Q.y + Q.pad + 34;
    out += P.fit(x, y, fmt(L.outro_total, vars), '--ink', 32, '--font-hand', 700, avail, 'panel');
    out += P.fit(x + avail, y, fmt(L.outro_kept, vars), '--keep-ink', 26, '--font-hand', 700, avail, 'panel', 'end');
    // one cell per x position of the figure: green kept, grey discarded, dashed = not drawn
    var cols = g.waffle.cols, cell = avail / cols, r = cell * 0.36, gy = y + 26;
    var byX = {};
    M.POINTS.forEach(function (p) { byX[p.x] = p.status; });
    var a = T.ease.out(T.clamp(s.local / 0.5, 0, 1)), n = M.LAST_X + 1;
    for (var i = 0; i < n; i++) {
      if (i > a * n) break;
      var cx = x + cell * (i % cols + 0.5), cy = gy + cell * (Math.floor(i / cols) + 0.5), st = byX[i];
      out += tag('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: (st === 'keep' ? r * 1.15 : r).toFixed(1),
        style: st === 'keep' ? 'fill:var(--keep)' : st === 'discard' ? 'fill:var(--discard);opacity:0.55' :
          'fill:none;stroke:var(--accent);stroke-width:1.5;stroke-dasharray:3 3' });
    }
    y = gy + cell * Math.ceil(n / cols) + 24;
    out += P.fit(x, y, L.outro_legend, '--ink-2', 15, '--font-hand', 400, avail, 'panel');
    y += 52;
    out += P.fit(x, y, fmt(L.outro_scores, vars), '--ink', 26, '--font-mono', 600, avail, 'panel');
    out += P.fit(x, y + 30, L.outro_note, '--ink-2', 16, '--font-hand', 400, avail, 'panel');
    return out;
  }

  function drawTip(g, P, copy, p) {
    var L = copy.labels, x = sx(g, p.x), y = sy(g, p.bpb);
    var text = fmt(L.tip, { x: p.x, status: p.status === 'keep' ? L.tip_keep : L.tip_discard, bpb: p.bpb.toFixed(5) });
    var size = 15, w = P.width(text, size) + 22, h = P.size(size) + 16;
    var bx = Math.min(Math.max(g.plot.l, x - w / 2), g.plot.r - w), by = y - h - 14;
    if (by < g.plot.t - 20) by = y + 14;
    return tag('rect', { x: bx.toFixed(1), y: by.toFixed(1), width: w.toFixed(1), height: h, rx: 8, 'data-box': 'tip',
      style: 'fill:var(--card);stroke:var(--ink-3);stroke-width:1.5' }) +
      P.fit(bx + 11, by + h - 11, text, '--ink', size, '--font-mono', 400, w - 22, 'tip');
  }

  /* ---------- captions ---------- */

  function captionFor(M, s, copy, cards) {
    var C = copy.captions;
    if (s.phase === 'intro') return C.intro;
    if (s.phase === 'keep') {
      var k = M.KEPT[s.focus];
      if (s.hold) {
        if (s.focus === 0) return fmt(C.baseline, { bpb: k.bpb.toFixed(5) });
        return fmt(C.keep, { x: k.x, short: cards[s.focus].short, drop: k.drop.toFixed(4) });
      }
      return fmt(C.sweep, { x: Math.floor(s.cursor + 1e-9), k: s.kept, d: s.discarded });
    }
    if (s.phase === 'seed') return fmt(C.seed, { seed: M.SEED_DROP.toFixed(4), n: M.SMALLER_THAN_SEED.length });
    if (s.phase === 'filter') {
      return fmt(C.filter, { shown: M.POINTS.length, notkept: M.NOT_KEPT, grey: M.GREY_DRAWN, hidden: M.HIDDEN.length });
    }
    return fmt(C.outro, { total: M.TOTAL, kept: M.KEPT.length, first: M.BASELINE.toFixed(4), last: s.best.toFixed(4) });
  }

  window.Explain.register('progress', function (svg, ctx) {
    var copy = ctx.copy;
    var cards = copy.cards;
    var seedCard = cards.filter(function (c) { return c.seed; })[0];
    var M = window.ProgressModel.create(ctx.data.datasets.progress, { seedX: seedCard ? seedCard.x : null });
    var mode = 'landscape';
    var ui = { hover: null, pick: null, pickT: null, lastT: 0 };

    function cardIndexOf(p) {
      for (var i = 0; i < M.KEPT.length; i++) if (M.KEPT[i].x === p.x) return i;
      return -1;
    }

    // nearest drawn dot to a pointer event, in svg units
    function hitTest(ev) {
      var m = svg.getScreenCTM();
      if (!m) return null;
      var pt = svg.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      var q = pt.matrixTransform(m.inverse()), g = GEO[mode];
      var s = M.stateAt(ui.lastT), best = null, bestD = g.dot.hit;
      M.visible(s).forEach(function (p) {
        var d = Math.hypot(sx(g, p.x) - q.x, sy(g, p.bpb) - q.y) - (p.status === 'keep' ? 4 : 0);  // green dots win ties
        if (d < bestD) { bestD = d; best = p; }
      });
      return best;
    }

    svg.addEventListener('pointermove', function (ev) {
      if (ev.pointerType === 'touch') return;
      var p = hitTest(ev);
      if (p !== ui.hover) { ui.hover = p; ctx.redraw(); }
    });
    svg.addEventListener('pointerleave', function () { if (ui.hover) { ui.hover = null; ctx.redraw(); } });
    svg.addEventListener('click', function (ev) {
      var p = hitTest(ev);
      ui.pick = p && p !== ui.pick ? p : null;
      ui.pickT = ui.lastT;
      // a pick while playing pauses: the next frame would move t and drop the card
      // (on a touch screen there is no hover to keep it up)
      if (ui.pick) ctx.pause();
      ctx.redraw();
    });

    return {
      duration: M.duration(),
      stops: M.stops(),
      layout: function (width) {
        mode = width > 0 && width < 780 ? 'portrait' : 'landscape';
        svg.setAttribute('viewBox', '0 0 ' + GEO[mode].W + ' ' + GEO[mode].H);
      },
      render: function (t) {
        if (t !== ui.lastT && ui.pickT !== null && t !== ui.pickT) { ui.pick = null; ui.pickT = null; }
        ui.lastT = t;
        var g = GEO[mode], P = Painter(g), s = M.stateAt(t);
        var L = copy.labels;
        var shown = M.visible(s);
        var isShown = function (p) { return p && shown.indexOf(p) >= 0; };
        var hover = isShown(ui.hover) ? ui.hover : null, pick = isShown(ui.pick) ? ui.pick : null;
        var reader = hover || pick;
        var readerCard = reader && reader.status === 'keep' ? cardIndexOf(reader) : -1;

        var out = '';
        out += P.text(g.head.x, g.head.y, s.phase === 'intro' ? '—' : fmt(L.counter, { x: Math.floor(s.cursor + 1e-9) }),
          P.style('--ink', g.head.size, '--font-mono', 600));
        out += P.text(g.head.subX, g.head.subY || g.head.y, fmt(L.counter_sub, { k: s.kept, d: s.discarded }), P.style('--ink-2', g.head.subSize));
        out += P.text(g.head.hintX, g.head.y, L.hint, P.style('--accent-ink', g.head.hintSize, '--font-hand', 700), { 'text-anchor': 'end', 'data-on': 'stage' });
        out += drawLegend(g, P, copy) + drawAxes(g, P, copy);
        if (s.phase === 'filter') out += drawFilterOverlay(g, P, M, s, copy);
        out += drawCursor(g, s) + drawBestLine(g, M, s) + drawDots(g, M, s, { dimGrey: s.phase === 'seed' });

        // spotlight rings: the card's dot (orange = the one being explained)
        var focusIdx = readerCard >= 0 ? readerCard : (s.phase === 'keep' ? s.focus : -1);
        if (s.phase === 'seed' && readerCard < 0) {
          M.SMALLER_THAN_SEED.forEach(function (k) { out += ring(g, k.x, k.bpb, '--accent', g.dot.keep + 5); });
          out += ring(g, M.KEPT[M.SEED].x, M.KEPT[M.SEED].bpb, '--accent', g.dot.keep + 9);
        }
        if (focusIdx >= 0) {
          var fk = M.KEPT[focusIdx];
          out += ring(g, fk.x, fk.bpb, '--accent', g.dot.keep + 6);
          if (mode === 'landscape') {
            out += tag('line', { x1: (sx(g, fk.x) + g.dot.keep + 6).toFixed(1), y1: sy(g, fk.bpb).toFixed(1), x2: g.panel.x, y2: g.panel.y + 40,
              style: 'stroke:var(--accent);stroke-width:1.5;stroke-dasharray:3 5' });
          }
        }

        if (readerCard >= 0) out += drawCard(g, P, M, copy, readerCard, cards[readerCard]);
        else if (s.phase === 'intro') out += drawIntroPanel(g, P, copy);
        else if (s.phase === 'keep') out += drawCard(g, P, M, copy, s.focus, cards[s.focus]);
        else if (s.phase === 'seed') out += drawSeedPanel(g, P, M, copy, s);
        else if (s.phase === 'filter') out += drawFilterPanel(g, P, M, copy, s);
        else out += drawOutroPanel(g, P, M, copy, s);

        if (reader && reader.status !== 'keep') out += ring(g, reader.x, reader.bpb, '--ink-2', g.dot.grey + 5) + drawTip(g, P, copy, reader);
        // code is shown as typed: no font ligatures (JetBrains Mono would draw <= as one glyph)
        svg.innerHTML = out.replace(/font-family:var\(--font-mono\)/g, 'font-family:var(--font-mono);font-variant-ligatures:none');
        ctx.caption(captionFor(M, s, copy, cards));
      }
    };
  });
})();
