/* autoresearch scene "three files, three roles" — drawing.
 * State comes from FilesModel.stateAt(t); this file only draws it.
 * Three cards (prepare.py, train.py, program.md), each with who may edit it,
 * a real code excerpt (copied verbatim, see scenes/files.json `code`) and
 * hand-written notes. Clicking a card pins it in focus until the animation
 * moves to another station. Colors are CSS variables set via style=; code boxes
 * use the --term-* colors (dark in both themes). Two layouts: landscape
 * 1200×675 and portrait 540×1080 (svg narrower than 780px). */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var M = window.FilesModel;
  var D = window.ExplainDraw;
  var tag = D.tag, fmt = D.fmt, Painter = D.Painter;

  var GEO = {
    landscape: {
      W: 1200, H: 675, minFont: 13,
      card: { x0: 24, dx: 392, y: 34, w: 368, h: 474, lift: 6 },
      icon: { dx: 44, dy: 50, r: 28 },
      name: { dx: 86, dy: 46, size: 24 },
      role: { dx: 86, dy: 78, size: 20 },
      desc: { dx: 20, dy: 120, size: 16 },
      code: { dx: 16, dy: 136, w: 336, lineH: 26, pad: 14, size: 15, lines: 6 },
      notes: { dx: 18, dy: 340, gap: 28, size: 17 },
      perms: { dx: 16, dy: 414, w: 162, h: 38, gap: 12, size: 16, stack: false },
      banner: { x: 24, y: 528, w: 1152, h: 74, size: 26 }
    },
    portrait: {
      W: 540, H: 1080, minFont: 15,
      card: { x0: 16, dy: 314, y: 14, w: 508, h: 300, lift: 4 },
      icon: { dx: 38, dy: 42, r: 25 },
      name: { dx: 76, dy: 40, size: 22 },
      role: { dx: 76, dy: 70, size: 18 },
      desc: null,
      code: { dx: 14, dy: 88, w: 480, lineH: 23, pad: 11, size: 15, lines: 6 },
      notes: { dx: 16, dy: 262, gap: 26, size: 16 },
      perms: { dx: 356, dy: 14, w: 138, h: 30, gap: 6, size: 15, stack: true },
      banner: { x: 16, y: 958, w: 508, h: 104, size: 21 }
    }
  };

  function cardBox(g, i, focused) {
    var C = g.card;
    var x = C.dx ? C.x0 + i * C.dx : C.x0;
    var y = C.dy ? C.y + i * C.dy : C.y;
    return { x: x, y: y - (focused ? C.lift : 0), w: C.w, h: C.h };
  }

  /* ---------- icons (line art in --ink, or --term-ink on a dark box) ---------- */

  function iconLock(cx, cy, r, ink) {
    var w = r * 0.9, h = r * 0.7;
    return tag('path', { d: 'M' + (cx - w * 0.32) + ' ' + (cy - h * 0.2) + ' v-' + (r * 0.28) + ' a' + (w * 0.32) + ' ' + (w * 0.32) + ' 0 0 1 ' + (w * 0.64) + ' 0 v' + (r * 0.28),
        style: 'fill:none;stroke:var(' + ink + ');stroke-width:2.6' }) +
      tag('rect', { x: cx - w / 2, y: cy - h * 0.2, width: w, height: h, rx: 4, style: 'fill:var(' + ink + ')' }) +
      tag('circle', { cx: cx, cy: cy + h * 0.12, r: r * 0.09, style: 'fill:var(--card)' });
  }

  function iconRobot(cx, cy, r, ink) {
    var w = r * 1.0, h = r * 0.78, x = cx - w / 2, y = cy - h / 2 + r * 0.12;
    return tag('line', { x1: cx, y1: y, x2: cx, y2: y - r * 0.26, style: 'stroke:var(' + ink + ');stroke-width:2' }) +
      tag('circle', { cx: cx, cy: y - r * 0.3, r: r * 0.09, style: 'fill:var(--accent)' }) +
      tag('rect', { x: x, y: y, width: w, height: h, rx: r * 0.2, style: 'fill:none;stroke:var(' + ink + ');stroke-width:2.4' }) +
      tag('circle', { cx: x + w * 0.32, cy: y + h * 0.45, r: r * 0.08, style: 'fill:var(' + ink + ')' }) +
      tag('circle', { cx: x + w * 0.68, cy: y + h * 0.45, r: r * 0.08, style: 'fill:var(' + ink + ')' }) +
      tag('path', { d: 'M' + (x + w * 0.34) + ' ' + (y + h * 0.72) + ' h' + (w * 0.32), style: 'stroke:var(' + ink + ');stroke-width:2;stroke-linecap:round' });
  }

  function iconPerson(cx, cy, r, ink) {
    return tag('circle', { cx: cx, cy: cy - r * 0.28, r: r * 0.3, style: 'fill:none;stroke:var(' + ink + ');stroke-width:2.4' }) +
      tag('path', { d: 'M' + (cx - r * 0.55) + ' ' + (cy + r * 0.62) + ' q 0 -' + (r * 0.62) + ' ' + (r * 0.55) + ' -' + (r * 0.62) + ' q ' + (r * 0.55) + ' 0 ' + (r * 0.55) + ' ' + (r * 0.62),
        style: 'fill:none;stroke:var(' + ink + ');stroke-width:2.4;stroke-linecap:round' });
  }

  var ICONS = { lock: iconLock, ai: iconRobot, human: iconPerson };

  /* ---------- one card ---------- */

  // who edits this file: a lock when nobody does; the human's sheet when it is not used
  function headIcon(card) {
    if (!card.used) return 'human';
    return card.editors.length ? card.editors[0] : 'lock';
  }

  function drawPerms(g, P, f, card, box, copy, usual) {
    var Pm = g.perms, out = '', perms = copy.perms;
    ['human', 'ai'].forEach(function (who, i) {
      var x = box.x + Pm.dx + (Pm.stack ? 0 : i * (Pm.w + Pm.gap));
      var y = box.y + Pm.dy + (Pm.stack ? i * (Pm.h + Pm.gap) : 0);
      var id = 'files-perm-' + f + '-' + who;
      var absent = usual && who === 'ai';  // the usual way has no AI at all
      var can = card.editors.indexOf(who) >= 0;
      var text = absent ? fmt(perms.absent, { who: perms[who] }) : fmt(can ? perms.edit : perms.none, { who: perms[who] });
      out += tag('rect', { x: x, y: y, width: Pm.w, height: Pm.h, rx: Pm.h / 2, 'data-box': id,
        style: can ? 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:2' :
          'fill:var(--card);stroke:var(--line);stroke-width:1.5' + (absent ? ';stroke-dasharray:5 4' : '') });
      out += ICONS[who](x + Pm.h * 0.55, y + Pm.h / 2, Pm.h * 0.36, can ? '--accent-ink' : '--ink-2');
      out += P.fit(x + Pm.h * 1.05, y + Pm.h / 2 + Pm.size * 0.36, text, can ? '--accent-ink' : '--ink-2', Pm.size, '--font-hand', can ? 700 : 400,
        Pm.w - Pm.h * 1.05 - 10, id);
    });
    return out;
  }

  // code keeps its leading spaces (white-space:pre); squeezed like P.fit when too long
  function codeText(P, x, y, str, color, size, weight, avail, id) {
    var extra = { 'data-fit': id, 'data-on': id };
    if (P.width(str, size) > avail) { extra.textLength = avail; extra.lengthAdjust = 'spacingAndGlyphs'; }
    return P.text(x, y, str, P.style(color, size, '--font-mono', weight) + ';white-space:pre', extra);
  }

  function codeLines(cardCopy) {
    var lines = [];
    cardCopy.code.forEach(function (b) { b.show.forEach(function (l) { lines.push(l); }); });
    return lines;
  }

  function drawCode(g, P, f, cardCopy, box, s, usual) {
    var Cd = g.code, out = '', id = 'files-code-' + f;
    var x = box.x + Cd.dx, y = box.y + Cd.dy, h = Cd.lines * Cd.lineH + 2 * Cd.pad;
    out += tag('rect', { x: x, y: y, width: Cd.w, height: h, rx: 10, style: 'fill:var(--term-bg)', 'data-box': id });
    var lines = codeLines(cardCopy), marks = {};
    (cardCopy.notes || []).forEach(function (n) { marks[n.line] = true; });
    var ed = cardCopy.edit;
    lines.forEach(function (line, i) {
      var ly = y + Cd.pad + Cd.lineH * (i + 0.72);
      if (marks[i]) {
        out += tag('rect', { x: x + 6, y: ly - Cd.lineH * 0.72, width: Cd.w - 12, height: Cd.lineH, rx: 5, style: 'fill:var(--accent);opacity:0.28' });
      }
      if (ed && ed.line === i && s.edit > 0) {
        out += drawEdit(g, P, line, ed, x + 14, ly, s.edit, id, usual);
        return;
      }
      out += codeText(P, x + 14, ly, line, '--term-ink', Cd.size, 400, Cd.w - 28, id);
    });
    return out;
  }

  // "WARMDOWN_RATIO = 0.5" → the old value is struck out, the new one typed after it
  function drawEdit(g, P, line, ed, x, y, e, boxId, usual) {
    var Cd = g.code, out = '';
    var prefix = line.slice(0, line.length - ed.from.length);
    var px = P.width(prefix, Cd.size), vw = P.width(ed.from, Cd.size);
    out += tag('rect', { x: x - 8, y: y - Cd.lineH * 0.72, width: Cd.w - 12, height: Cd.lineH, rx: 5, style: 'fill:var(--accent);opacity:0.28' });
    out += P.fit(x, y, prefix, '--term-ink', Cd.size, '--font-mono', 400, Cd.w - 28, boxId);
    var strike = T.clamp(e / 0.35, 0, 1);
    out += P.fit(x + px, y, ed.from, strike > 0.99 ? '--discard' : '--term-ink', Cd.size, '--font-mono', 400, vw + 2, boxId);
    if (strike > 0) {
      out += tag('line', { x1: x + px - 1, y1: y - Cd.size * 0.32, x2: (x + px - 1 + (vw + 2) * strike).toFixed(1), y2: y - Cd.size * 0.32,
        style: 'stroke:var(--term-err);stroke-width:2' });
    }
    var typed = Math.round(T.clamp((e - 0.45) / 0.4, 0, 1) * ed.to.length);
    var nx = x + px + vw + P.width(' ', Cd.size);
    if (typed > 0) out += P.fit(nx, y, ed.to.slice(0, typed), '--term-ok', Cd.size, '--font-mono', 700, P.width(ed.to, Cd.size) + 2, boxId);
    // the editor's cursor: a robot (autoresearch) or a person (the usual way)
    if (e < 1) {
      var cx = nx + P.width(ed.to.slice(0, typed), Cd.size) + 3;
      out += tag('rect', { x: cx.toFixed(1), y: y - Cd.size * 0.85, width: 2.5, height: Cd.size, style: 'fill:var(--term-ink)' });
      out += (usual ? iconPerson : iconRobot)(cx + 26, y - Cd.size * 0.3, 12, '--term-ink');
    }
    return out;
  }

  function drawNotes(g, P, f, cardCopy, box, s, usual) {
    var N = g.notes, out = '', id = 'files-card-' + f;
    var notes = (cardCopy.notes || []).map(function (n) { return n.text; });
    if (cardCopy.edit) {
      if (s.edit <= 0) return '';
      notes = [usual ? cardCopy.edit.note_usual : cardCopy.edit.note];
    }
    var appear = cardCopy.edit ? T.ease.out(T.clamp((s.edit - 0.6) / 0.4, 0, 1)) : 1;
    notes.forEach(function (text, i) {
      out += tag('g', { style: 'opacity:' + appear.toFixed(3) },
        P.fit(box.x + N.dx, box.y + N.dy + i * N.gap, '✎ ' + text, '--accent-ink', N.size, '--font-hand', 700, box.w - 2 * N.dx, id));
    });
    return out;
  }

  function drawCard(g, P, f, i, s, copy, pinned) {
    var cardCopy = copy.cards[f], card = s.cards[f], usual = s.mode === 'usual';
    var focused = pinned ? pinned === f : card.focus;
    var box = cardBox(g, i, focused), id = 'files-card-' + f, out = '';
    out += tag('rect', { x: box.x, y: box.y, width: box.w, height: box.h, rx: 16, 'data-box': id,
      style: 'fill:var(--card);stroke:var(' + (focused ? '--accent' : '--line') + ');stroke-width:' + (focused ? 3 : 1.5) });
    var I = g.icon;
    out += tag('circle', { cx: box.x + I.dx, cy: box.y + I.dy, r: I.r, style: 'fill:var(--paper-2);stroke:var(--line);stroke-width:1.5' });
    out += ICONS[headIcon(card)](box.x + I.dx, box.y + I.dy, I.r * 0.62, '--ink');
    out += P.fit(box.x + g.name.dx, box.y + g.name.dy, cardCopy.name, '--ink', g.name.size, '--font-mono', 700, box.w - g.name.dx - 16, id);
    out += P.fit(box.x + g.role.dx, box.y + g.role.dy, cardCopy.role, '--accent-ink', g.role.size, '--font-hand', 700,
      (g.perms.stack ? g.perms.dx : box.w) - g.role.dx - 12, id);
    if (g.desc) out += P.fit(box.x + g.desc.dx, box.y + g.desc.dy, cardCopy.desc, '--ink-2', g.desc.size, '--font-hand', 400, box.w - 2 * g.desc.dx, id);
    out += drawCode(g, P, f, cardCopy, box, s, usual);
    out += drawNotes(g, P, f, cardCopy, box, s, usual);
    out += drawPerms(g, P, f, card, box, copy, usual);
    // not introduced yet: a faint outline; not used (the usual way): faded under a stamp
    var dim = !card.lit ? 0.3 : card.used ? 1 : 0.4;
    var body = dim < 1 ? tag('g', { style: 'opacity:' + dim }, out) : out;
    if (card.lit && !card.used) {
      var cx = box.x + box.w / 2, cy = box.y + g.code.dy + g.code.lines * g.code.lineH / 2 + g.code.pad;
      body += tag('g', { transform: 'translate(' + cx + ' ' + cy + ') rotate(-10)' },
        tag('rect', { x: -84, y: -30, width: 168, height: 56, rx: 10, style: 'fill:var(--card);stroke:var(--discard);stroke-width:3', 'data-box': 'files-unused' }) +
        P.text(0, 11, cardCopy.unused, P.style('--ink-2', 28, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'files-unused' }));
    }
    return tag('g', { 'data-card': f, style: 'cursor:pointer;opacity:' + card.appear.toFixed(3) }, body);
  }

  function drawBanner(g, P, s, copy) {
    if (s.banner <= 0) return '';
    var B = g.banner, text = s.mode === 'usual' ? copy.banner.essence_usual : copy.banner.essence;
    var y = B.y + (1 - s.banner) * 16;
    var lines = g.W < 780 ? splitTwo(text) : [text];
    var out = tag('rect', { x: B.x, y: y, width: B.w, height: B.h, rx: 14, 'data-box': 'files-banner',
      style: 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:2' });
    lines.forEach(function (l, i) {
      var ly = y + B.h / 2 + B.size * 0.36 + (i - (lines.length - 1) / 2) * B.size * 1.45;
      out += P.fit(B.x + B.w / 2, ly, l, '--accent-ink', B.size, '--font-hand', 700, B.w - 32, 'files-banner', 'middle');
    });
    return tag('g', { style: 'opacity:' + s.banner.toFixed(3) }, out);
  }

  // portrait: break a sentence after its first full-width comma / full stop
  function splitTwo(text) {
    var m = text.search(/[，。：]/);
    if (m < 0 || m >= text.length - 1) return [text];
    return [text.slice(0, m + 1), text.slice(m + 1)];
  }

  function captionFor(s, copy, pinned) {
    var usual = s.mode === 'usual', key = pinned || s.focus;
    if (key) {
      var c = copy.cards[key];
      return usual && c.caption_usual ? c.caption_usual : c.caption;
    }
    if (s.station === 'intro') return copy.captions.intro;
    return usual ? copy.captions.essence_usual : copy.captions.essence;
  }

  window.Explain.register('files', function (svg, ctx) {
    var copy = ctx.copy;
    var opts = { usual: false };
    var mode = 'landscape';
    var pinned = null, pinnedStation = null, lastStation = null;

    svg.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-card]') : null;
      if (!el) return;
      var f = el.getAttribute('data-card');
      pinned = pinned === f ? null : f;
      pinnedStation = lastStation;
      if (ctx.redraw) ctx.redraw();
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
        if (pinned && s.station !== pinnedStation) pinned = null;  // the animation moved on
        lastStation = s.station;
        var pin = pinned && s.cards[pinned].lit ? pinned : null;
        var out = '';
        M.FILES.forEach(function (f, i) { out += drawCard(g, P, f, i, s, copy, pin); });
        svg.innerHTML = out + drawBanner(g, P, s, copy);
        ctx.caption(captionFor(s, copy, pin));
      }
    };
  });
})();
