/* autoresearch scene "simplicity" drawing — a balance with program.md's four examples.
 * State comes from SimplicityModel.stateAt(t, opts); this file only draws it.
 * Left pan: the val_bpb improvement; right pan: the complexity cost. Deleted
 * code is a balloon tied to the right pan. The beam angle comes from the
 * model, so the tilt always follows program.md's conclusion (tested there).
 * Colors are CSS variables via style=; text on a card has data-on, text that
 * must stay inside a card has data-fit. Landscape 1200×675, portrait 540×1080
 * (svg narrower than 780px, text ≥ 15px). Clicking a deck card presses the
 * matching "card" button under the stage, so the two always agree. */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var M = window.SimplicityModel;
  var D = window.ExplainDraw;
  var tag = D.tag, lerp = D.lerp, fmt = D.fmt, Painter = D.Painter;

  var GEO = {
    landscape: {
      W: 1200, H: 675, minFont: 13,
      head: { x: 40, y: 50, size: 27, quoteY: 84, quoteSize: 16, lineH: 23, maxW: 760 },
      scale: { cx: 420, cy: 318, half: 270, hang: 92, panW: 190, baseY: 560, post: 18 },
      rule: { y: 612 },
      stamp: { x: 420, y: 214 },
      deck: { x: 846, y: 82, w: 324, h: 124, gap: 14, cols: 1, title: { x: 846, y: 60 }, titleSize: 19, lineSize: 16 },
      hint: { x: 1008, y: 654 }
    },
    portrait: {
      W: 540, H: 1080, minFont: 15,
      head: { x: 24, y: 42, size: 24, quoteY: 74, quoteSize: 15, lineH: 22, maxW: 492 },
      scale: { cx: 270, cy: 360, half: 180, hang: 84, panW: 140, baseY: 580, post: 16 },
      rule: { y: 628 },
      stamp: { x: 270, y: 262 },
      deck: { x: 24, y: 690, w: 238, h: 168, gap: 16, cols: 2, title: { x: 24, y: 670 }, titleSize: 18, lineSize: 15 },
      hint: { x: 270, y: 1064 }
    }
  };
  var TWEEN_MS = 650;

  function wrap(P, str, size, maxW) {
    var words = String(str).split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      var next = cur ? cur + ' ' + w : w;
      if (cur && P.width(next, size) > maxW) { lines.push(cur); cur = w; } else cur = next;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function tipCurve(q) { q = T.clamp(q, 0, 1); return 1 - Math.pow(1 - q, 3) * Math.cos(2.5 * Math.PI * q); }

  /* ---------- header: the card on the scale, verbatim ---------- */

  function drawHead(g, P, s, copy, idx, alpha) {
    var H = g.head, L = copy.labels, out = '';
    if (idx < 0) {
      if (s.phase === 'outro') {
        out += P.text(H.x, H.y, L.motto_zh, P.style('--ink', H.size, '--font-hand', 700));
        out += P.text(H.x, H.quoteY, L.motto_en, P.style('--ink-2', H.quoteSize, '--font-mono', 600));
      } else {
        out += P.text(H.x, H.y, L.rule, P.style('--ink', H.size, '--font-hand', 700));
      }
      return out;
    }
    var c = copy.cards[idx], num = '①②③④'.charAt(idx);
    out += P.text(H.x, H.y, num + ' ' + c.title, P.style('--ink', H.size, '--font-hand', 700));
    var lines = wrap(P, c.example, H.quoteSize, H.maxW), y = H.quoteY;
    lines.forEach(function (l) { out += P.text(H.x, y, l, P.style('--ink-2', H.quoteSize, '--font-mono')); y += H.lineH; });
    var says = L.says + c.says_zh + '（' + c.says_en + '）';
    out += P.text(H.x, y + 4, says, P.style(M.CARDS[idx].says === 'keep' ? '--keep-ink' : '--ink', H.quoteSize + 2, '--font-hand', 700));
    return tag('g', { style: 'opacity:' + alpha.toFixed(3) }, out);
  }

  /* ---------- the balance ---------- */

  function ends(S, angle) {
    var r = angle * Math.PI / 180, dx = S.half * Math.cos(r), dy = S.half * Math.sin(r);
    return { l: [S.cx - dx, S.cy - dy], r: [S.cx + dx, S.cy + dy] };
  }

  function drawFrame(g, P, s, copy) {
    var S = g.scale, out = '';
    // stand: post + base
    out += tag('path', { d: 'M' + (S.cx - 70) + ' ' + S.baseY + ' L' + (S.cx + 70) + ' ' + S.baseY + ' L' + (S.cx + 40) + ' ' + (S.baseY - 22) + ' L' + (S.cx - 40) + ' ' + (S.baseY - 22) + ' Z',
      style: 'fill:var(--paper-2);stroke:var(--ink-2);stroke-width:2;stroke-linejoin:round' });
    out += tag('rect', { x: S.cx - S.post / 2, y: S.cy, width: S.post, height: S.baseY - 22 - S.cy, rx: 4, style: 'fill:var(--paper-2);stroke:var(--ink-2);stroke-width:2' });
    // level marks
    out += tag('line', { x1: S.cx - S.half - 40, y1: S.cy, x2: S.cx - S.half + 10, y2: S.cy, style: 'stroke:var(--line);stroke-width:1.5;stroke-dasharray:4 5' });
    out += tag('line', { x1: S.cx + S.half - 10, y1: S.cy, x2: S.cx + S.half + 40, y2: S.cy, style: 'stroke:var(--line);stroke-width:1.5;stroke-dasharray:4 5' });
    return out;
  }

  function drawBeamAndPans(g, P, s, copy, angle, weights) {
    var S = g.scale, L = copy.labels, out = '', e = ends(S, angle);
    // beam
    out += tag('g', { transform: 'rotate(' + angle.toFixed(3) + ' ' + S.cx + ' ' + S.cy + ')' },
      tag('rect', { x: S.cx - S.half - 8, y: S.cy - 7, width: 2 * S.half + 16, height: 14, rx: 7, style: 'fill:var(--ink-2)' }) +
      tag('path', { d: 'M' + (S.cx - 14) + ' ' + (S.cy - 26) + ' L' + (S.cx + 14) + ' ' + (S.cy - 26) + ' L' + S.cx + ' ' + (S.cy - 6) + ' Z', style: 'fill:var(--accent)' }));
    out += tag('circle', { cx: S.cx, cy: S.cy, r: 9, style: 'fill:var(--card);stroke:var(--ink);stroke-width:3' });
    // pans hang straight down from the beam ends
    [['l', L.gain_pan, 0], ['r', L.cost_pan, 1]].forEach(function (side) {
      var p = e[side[0]], py = p[1] + S.hang, half = S.panW / 2;
      out += tag('line', { x1: p[0], y1: p[1], x2: p[0] - half + 10, y2: py, style: 'stroke:var(--ink-2);stroke-width:1.5' });
      out += tag('line', { x1: p[0], y1: p[1], x2: p[0] + half - 10, y2: py, style: 'stroke:var(--ink-2);stroke-width:1.5' });
      out += tag('path', { d: 'M' + (p[0] - half) + ' ' + py + ' Q' + p[0] + ' ' + (py + 30) + ' ' + (p[0] + half) + ' ' + py + ' Z',
        style: 'fill:var(--paper-2);stroke:var(--ink-2);stroke-width:2' });
      out += P.text(p[0], py + 44, side[1], P.style('--ink-2', 18, '--font-hand', 700), { 'text-anchor': 'middle' });
      out += weights(side[2], p[0], py);
    });
    return out;
  }

  // the weights of card idx; drop = 0..1 landing, lift = 0..1 leaving;
  // offPan: the cost side is lifted off the pan and not weighed (score only)
  function weightsOf(g, P, copy, idx, drop, lift, offPan) {
    var c = M.CARDS[idx], cc = copy.cards[idx], S = g.scale;
    return function (side, x, py) {
      var ghost = offPan && side === 1;
      var dy = -(1 - drop) * 140 - lift * 70 - (ghost ? 46 : 0), op = Math.min(drop, 1 - lift) * (ghost ? 0.35 : 1);
      if (op <= 0) return '';
      var o = '', id = 'w' + side, top = py + dy;
      if (side === 0) {
        if (c.gain > 0) {
          var w = Math.min(S.panW - 40, 104), h = 44;
          o += tag('rect', { x: x - w / 2, y: top - h, width: w, height: h, rx: 8, 'data-box': id, style: 'fill:var(--card);stroke:var(--keep);stroke-width:3' });
          o += P.fit(x, top - h / 2 + 6, cc.gain_label, '--keep-ink', 17, '--font-hand', 700, w - 12, id, 'middle');
        } else {
          o += tag('rect', { x: x - 22, y: top - 6, width: 44, height: 6, rx: 3, style: 'fill:var(--keep)' });
          o += P.text(x, top - 16, cc.gain_label, P.style('--keep-ink', 20, '--font-mono', 700), { 'text-anchor': 'middle' });
        }
      } else if (c.cost > 0) {
        var bw = S.panW - 20, bh = 64;
        o += tag('rect', { x: x - bw / 2, y: top - bh, width: bw, height: bh, rx: 6, 'data-box': id, style: 'fill:var(--paper-2);stroke:var(--ink);stroke-width:2.5' });
        // scribbles: messy code
        for (var k = 0; k < 3; k++) {
          var sy = top - bh + 12 + k * 7;
          o += tag('path', { d: 'M' + (x - bw / 2 + 10) + ' ' + sy + ' q8 -6 16 0 t16 0 t16 0', style: 'fill:none;stroke:var(--ink-3);stroke-width:1.5' });
        }
        o += P.fit(x, top - 14, cc.cost_label, '--ink', 16, '--font-hand', 700, bw - 14, id, 'middle');
      } else {
        // balloon: negative cost, tied to the pan, pulls it up
        var r = c.cost < -2 ? 54 : 46, by = top - 120 - r;
        o += tag('path', { d: 'M' + x + ' ' + (top - 2) + ' q-10 -30 0 -60 t0 ' + (-(120 - 60 - r * 0.0)).toFixed(0), style: 'fill:none;stroke:var(--ink-2);stroke-width:1.5' });
        o += tag('ellipse', { cx: x, cy: by, rx: r, ry: r * 1.15, 'data-box': id, style: 'fill:var(--card);stroke:var(--keep);stroke-width:3' });
        o += tag('path', { d: 'M' + (x - 6) + ' ' + (by + r * 1.15) + ' l6 8 l6 -8 z', style: 'fill:var(--keep)' });
        o += P.fit(x, by + 6, cc.cost_label, '--keep-ink', 17, '--font-hand', 700, r * 1.6, id, 'middle');
      }
      return tag('g', { style: 'opacity:' + op.toFixed(3) }, o);
    };
  }

  function drawStamp(g, P, s, copy) {
    if (s.stamp <= 0 || s.card < 0 || !s.verdict) return '';
    var St = copy.stamps, Z = g.stamp, sp = s.stamp, keep = s.verdict === 'keep';
    var level = Math.abs(M.tiltFor(M.CARDS[s.card], s.scoreOnly)) < 1e-9;
    var txt = keep ? St.keep : level ? St.reset : St.reject;
    var out = tag('g', { transform: 'translate(' + Z.x + ' ' + Z.y + ') rotate(-7) scale(' + (1.6 - 0.6 * sp).toFixed(3) + ')', style: 'opacity:' + sp.toFixed(3) },
      tag('rect', { x: -78, y: -28, width: 156, height: 52, rx: 9, 'data-box': 'stamp', style: 'fill:var(--card);stroke:var(' + (keep ? '--keep' : '--discard') + ');stroke-width:3' }) +
      P.text(0, 10, txt, P.style(keep ? '--keep-ink' : '--ink-2', 26, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'stamp' }));
    if (s.agrees === false) {
      out += tag('g', { style: 'opacity:' + sp.toFixed(3) },
        tag('rect', { x: Z.x - 92, y: Z.y + 34, width: 184, height: 34, rx: 8, 'data-box': 'wrong', style: 'fill:var(--card);stroke:var(--crash);stroke-width:2' }) +
        P.fit(Z.x, Z.y + 57, St.wrong, '--crash-ink', 18, '--font-hand', 700, 172, 'wrong', 'middle'));
    }
    return out;
  }

  function drawRule(g, P, s, copy) {
    var L = copy.labels, S = g.scale, out = '';
    var txt = s.scoreOnly ? L.not_weighed : L.keep_side + '　·　' + L.reject_side;
    out += P.text(S.cx, g.rule.y, txt, P.style(s.scoreOnly ? '--crash-ink' : '--ink-2', 17, '--font-hand', s.scoreOnly ? 700 : 400), { 'text-anchor': 'middle' });
    return out;
  }

  /* ---------- deck of the four examples ---------- */

  function drawDeck(g, P, s, copy) {
    var Dk = g.deck, L = copy.labels, out = '';
    out += P.text(Dk.title.x, Dk.title.y, L.deck_title, P.style('--ink-2', 17, '--font-hand', 700));
    copy.cards.forEach(function (c, i) {
      var col = i % Dk.cols, row = Math.floor(i / Dk.cols);
      var x = Dk.x + col * (Dk.w + Dk.gap), y = Dk.y + row * (Dk.h + Dk.gap), id = 'deck-' + i;
      var on = s.card === i;
      var inner = tag('rect', { x: x, y: y, width: Dk.w, height: Dk.h, rx: 12, 'data-box': id,
        style: 'fill:var(--card);stroke:var(' + (on ? '--accent' : '--line') + ');stroke-width:' + (on ? 3 : 1.5) });
      inner += P.fit(x + 14, y + 32, '①②③④'.charAt(i) + ' ' + c.title, '--ink', Dk.titleSize, '--font-hand', 700, Dk.w - 28, id);
      var lh = Dk.lineSize + 8;
      inner += P.fit(x + 14, y + 32 + lh + 4, L.gain_pan + '：' + c.gain_label, '--ink-2', Dk.lineSize, '--font-hand', 400, Dk.w - 28, id);
      inner += P.fit(x + 14, y + 32 + 2 * lh + 4, L.cost_pan + '：' + c.cost_label, '--ink-2', Dk.lineSize, '--font-hand', 400, Dk.w - 28, id);
      if (s.done[i]) {
        var v = M.weighs(M.CARDS[i], s.scoreOnly), keep = v === 'keep';
        var level = Math.abs(M.tiltFor(M.CARDS[i], s.scoreOnly)) < 1e-9;
        var badge = keep ? copy.stamps.keep : level ? copy.stamps.reset : copy.stamps.reject;
        inner += P.fit(x + 14, y + Dk.h - 14, badge, keep ? '--keep-ink' : '--ink-2', Dk.lineSize + 1, '--font-hand', 700, Dk.w * 0.4, id);
        if (v !== M.CARDS[i].says) {
          inner += P.fit(x + Dk.w - 14, y + Dk.h - 14, copy.stamps.wrong, '--crash-ink', Dk.lineSize, '--font-hand', 700, Dk.w * 0.55, id, 'end');
        }
      }
      out += tag('g', { 'data-pick': String(i + 1), style: 'cursor:pointer' }, inner);
    });
    if (s.phase === 'outro' || s.picked) {
      out += P.text(g.hint.x, g.hint.y, L.pick_hint, P.style('--ink-2', 15, '--font-hand'), { 'text-anchor': 'middle' });
    }
    return out;
  }

  function captionFor(s, copy) {
    var C = copy.captions, so = s.scoreOnly;
    if (s.phase === 'intro') return C.intro;
    if (s.phase === 'outro' && !s.picked) return so ? C.outro_score_only : C.outro;
    var idx = s.card;
    if (idx < 0) return C.intro;
    if (s.station === 'weigh' && !(s.picked && s.slot > 0)) return (so ? C.weigh_score_only : C.weigh)[idx];
    return (so ? C.verdict_score_only : C.verdict)[idx];
  }

  window.Explain.register('simplicity', function (svg, ctx) {
    var copy = ctx.copy;
    var opts = { card: 'all', scoreOnly: false };
    (copy.controls || []).forEach(function (c) { if (c.value !== undefined) opts[c.option] = c.value; });
    var mode = 'landscape';
    var lastAngle = 0, tween = null;
    var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    function now() { return window.performance ? performance.now() : Date.now(); }
    function animate() {
      if (!tween || !ctx.redraw) return;
      ctx.redraw();
      if (now() - tween.t0 < TWEEN_MS) window.requestAnimationFrame(animate);
      else { tween = null; ctx.redraw(); }
    }

    svg.addEventListener('click', function (e) {
      var hit = e.target.closest && e.target.closest('[data-pick]');
      if (!hit) return;
      var v = hit.getAttribute('data-pick'), sec = svg.closest('.scene');
      var btn = sec && sec.querySelector('button[data-option="card"][data-value="' + v + '"]');
      if (btn) btn.click();
      else { opts.card = v; if (ctx.redraw) ctx.redraw(); }
    });

    return {
      duration: M.duration(),
      stops: M.stops(),
      setOption: function (key, value) {
        if (String(value) !== String(opts[key]) && !reduced) {
          tween = { from: lastAngle, t0: now(), drop: key === 'card' };
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
        var angle = s.angle, drop = s.place;
        if (tween) {
          var q = (now() - tween.t0) / TWEEN_MS;
          angle = lerp(tween.from, s.angle, tipCurve(q));
          if (tween.drop && s.card >= 0 && s.place >= 1) drop = T.ease.out(T.clamp(q / 0.4, 0, 1));
        }
        lastAngle = angle;
        var weights = s.card >= 0 ? weightsOf(g, P, copy, s.card, drop, s.leave, s.scoreOnly) : function () { return ''; };
        var headIdx = s.card, headAlpha = 1 - s.leave;
        svg.innerHTML = drawHead(g, P, s, copy, headIdx, headAlpha) + drawFrame(g, P, s, copy) +
          drawBeamAndPans(g, P, s, copy, angle, weights) + drawStamp(g, P, s, copy) + drawRule(g, P, s, copy) +
          drawDeck(g, P, s, copy);
        ctx.caption(captionFor(s, copy));
      }
    };
  });
})();
