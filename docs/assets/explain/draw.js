/* Shared SVG drawing helpers for explainer scenes (window.ExplainDraw).
 * Colors are CSS variables set via style= (SVG presentation attributes do not
 * accept var()). Painter(g) knows the layout's minimum font size, so portrait
 * layouts can never set text too small for a phone. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ExplainDraw = factory();
})(this, function () {
  'use strict';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function tag(name, attrs, inner) {
    var a = '';
    for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) a += ' ' + k + '="' + attrs[k] + '"';
    return '<' + name + a + (inner === undefined ? '/>' : '>' + inner + '</' + name + '>');
  }

  function lerp(a, b, p) { return a + (b - a) * p; }

  function polar(cx, cy, R, deg) {
    var r = deg * Math.PI / 180;
    return [cx + R * Math.cos(r), cy + R * Math.sin(r)];
  }

  // "{bpb} 比 {best} 低" + {bpb: '0.99'} -> "0.99 比  低" (missing keys become empty)
  function fmt(template, vars) {
    return String(template).replace(/\{(\w+)\}/g, function (_, k) { return vars[k] !== undefined ? vars[k] : ''; });
  }

  /* Line breaking for Chinese text mixed with English, numbers and code.
   * wrap(text, maxWidth, measure) -> lines; measure(str) gives the drawn width (e.g. Painter.width).
   * - each Chinese character is its own piece; an English word, number or code run (anything up to
   *   the next space or Chinese character, like "token", "0.0005", "train.py") is never split,
   *   unless it alone is wider than the line;
   * - a line never starts with closing punctuation (，。、；：？！）」』…) nor ends with an opening
   *   one (（「『…): the break moves back to the nearest place that allows it; when the line has
   *   no such place, the closing punctuation hangs past the edge instead;
   * - the last line is not left with one or two characters when a piece of the line above can
   *   move down and still fit. */
  var CLOSE = '，。、；：？！）」』”’》〉】％,.;:!?)]}%';
  var OPEN = '（「『“‘《〈【([{';

  function wrapPieces(text) {
    var out = [], buf = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === ' ' || ch.charCodeAt(0) > 0x2e80) { if (buf) out.push(buf); buf = ''; out.push(ch); }
      else buf += ch;
    }
    if (buf) out.push(buf);
    return out;
  }

  function wrap(text, maxWidth, measure) {
    text = String(text === undefined || text === null ? '' : text);
    var pc = [];
    wrapPieces(text).forEach(function (p) {
      if (p.length > 1 && measure(p) > maxWidth) pc.push.apply(pc, p.split(''));
      else pc.push(p);
    });
    function line(a, b) { return pc.slice(a, b).join('').replace(/^ +| +$/g, ''); }
    function canBreak(i) {  // may a line start at piece i?
      var prev = pc[i - 1], next = pc[i];
      return CLOSE.indexOf(next.charAt(0)) < 0 && OPEN.indexOf(prev.charAt(prev.length - 1)) < 0;
    }
    // greedy: fill each line, then step the break back to the nearest allowed place
    var starts = [0];
    for (var i = 0; i < pc.length; i++) {
      var s = starts[starts.length - 1];
      while (i > s && measure(line(s, i + 1)) > maxWidth) {
        var b = i;
        while (b > s && !canBreak(b)) b--;
        if (b === s) {
          // no allowed place on this line: closing punctuation hangs past the edge,
          // anything else breaks right here
          if (CLOSE.indexOf(pc[i].charAt(0)) >= 0) break;
          b = i;
        }
        starts.push(b);
        s = b;
      }
    }
    // a last line of one or two characters takes pieces from the line above while they fit
    var n = starts.length;
    var core = function (str) { return str.replace(/[\s，。、；：？！）」』”’》〉】（「『“‘《〈【,.;:!?()\[\]{}✓✗·—–-]/g, ''); };
    if (n >= 2 && core(line(starts[n - 1], pc.length)).length <= 2) {
      for (var j = starts[n - 1] - 1; j > starts[n - 2]; j--) {
        if (measure(line(j, pc.length)) > maxWidth) break;
        if (!canBreak(j)) continue;
        if (!core(line(starts[n - 2], j))) break;
        starts[n - 1] = j;
        if (core(line(j, pc.length)).length >= 3) break;
      }
    }
    var lines = [];
    for (var k = 0; k < starts.length; k++) {
      var l = line(starts[k], k + 1 < starts.length ? starts[k + 1] : pc.length);
      if (l) lines.push(l);
    }
    return lines;
  }

  // g = layout object with at least { minFont }
  function Painter(g) {
    var P = {};
    P.size = function (n) { return Math.max(n, g.minFont || 0); };
    P.style = function (color, size, fam, weight) {
      return 'fill:var(' + color + ');font-size:' + P.size(size) + 'px;font-family:var(' + (fam || '--font-hand') + ')' +
        (weight ? ';font-weight:' + weight : '');
    };
    P.text = function (x, y, str, style, extra) {
      var attrs = { x: x, y: y, style: style };
      for (var k in extra || {}) attrs[k] = extra[k];
      return tag('text', attrs, esc(str));
    };
    // estimated advance width: Latin ~0.6em (exact for the mono font), CJK 1em
    P.width = function (str, size) {
      var w = 0;
      for (var i = 0; i < String(str).length; i++) w += (String(str).charCodeAt(i) > 0x2e80 ? 1 : 0.6);
      return w * P.size(size);
    };
    // wrap(): lines of `str` at this font size that fit `avail`
    P.wrap = function (str, size, avail) {
      return wrap(str, avail, function (s) { return P.width(s, size); });
    };
    // text that must stay inside box `id` (data-box="id"): squeezed with textLength when too long
    P.fit = function (x, y, str, color, size, fam, weight, avail, id, anchor) {
      var extra = { 'data-fit': id, 'data-on': id };
      if (anchor) extra['text-anchor'] = anchor;
      if (P.width(str, size) > avail) { extra.textLength = avail; extra.lengthAdjust = 'spacingAndGlyphs'; }
      return P.text(x, y, str, P.style(color, size, fam, weight), extra);
    };
    return P;
  }

  return { esc: esc, tag: tag, lerp: lerp, polar: polar, fmt: fmt, wrap: wrap, Painter: Painter };
});
