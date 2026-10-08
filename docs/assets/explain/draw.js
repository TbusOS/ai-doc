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
    // text that must stay inside box `id` (data-box="id"): squeezed with textLength when too long
    P.fit = function (x, y, str, color, size, fam, weight, avail, id, anchor) {
      var extra = { 'data-fit': id, 'data-on': id };
      if (anchor) extra['text-anchor'] = anchor;
      if (P.width(str, size) > avail) { extra.textLength = avail; extra.lengthAdjust = 'spacingAndGlyphs'; }
      return P.text(x, y, str, P.style(color, size, fam, weight), extra);
    };
    return P;
  }

  return { esc: esc, tag: tag, lerp: lerp, polar: polar, fmt: fmt, Painter: Painter };
});
