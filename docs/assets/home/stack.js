/* Homepage hero: the "AI engineering stack" map draws itself layer by layer,
 * and the hand-drawn underline under 看懂 follows. Without JS, or with reduced
 * motion, the static SVG already shows the final picture. */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  if (!T) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var svg = document.getElementById('stack');
  if (!svg) return;

  var blocks = Array.prototype.slice.call(svg.querySelectorAll('.stack-block'));
  var ys = [];
  blocks.forEach(function (b) {
    var y = +b.querySelector('.stack-fill').getAttribute('y');
    if (ys.indexOf(y) < 0) ys.push(y);
  });
  ys.sort(function (a, b) { return a - b; });

  var LAYER_GAP = 0.5, DRAW = 0.7, START = 0.25;
  var items = blocks.map(function (b, i) {
    var layer = ys.indexOf(+b.querySelector('.stack-fill').getAttribute('y'));
    return {
      start: START + layer * LAYER_GAP + (i % 3) * 0.08,
      edge: b.querySelector('.stack-edge'),
      fill: b.querySelector('.stack-fill'),
      texts: b.querySelectorAll('.stack-text'),
      badge: b.querySelector('.stack-badge')
    };
  });
  var labels = svg.querySelectorAll('.stack-layer');
  var links = svg.querySelectorAll('.stack-link');
  var underline = document.querySelector('.hl-line path');
  var END = START + (ys.length - 1) * LAYER_GAP + DRAW + 0.9;

  function frame(t) {
    items.forEach(function (it) {
      var p = T.ease.inOut(T.progress(t, it.start, DRAW));
      it.edge.style.strokeDasharray = '1';
      it.edge.style.strokeDashoffset = String(1 - p);
      it.fill.style.opacity = String(T.ease.out(T.progress(t, it.start + DRAW * 0.6, 0.4)));
      var q = String(T.ease.out(T.progress(t, it.start + DRAW * 0.7, 0.35)));
      Array.prototype.forEach.call(it.texts, function (el) { el.style.opacity = q; });
      if (it.badge) {
        var b = T.ease.out(T.progress(t, END - 0.5, 0.4));
        it.badge.style.opacity = String(b);
      }
    });
    Array.prototype.forEach.call(labels, function (el, i) {
      el.style.opacity = String(T.progress(t, START + i * LAYER_GAP, 0.4));
    });
    Array.prototype.forEach.call(links, function (el, i) {
      el.style.opacity = String(T.progress(t, START + (i + 1) * LAYER_GAP - 0.2, 0.3));
    });
    if (underline) {
      underline.style.strokeDasharray = '1';
      underline.style.strokeDashoffset = String(1 - T.ease.inOut(T.progress(t, 0.5, 0.8)));
    }
  }

  frame(0);
  var t0 = null;
  function tick(now) {
    if (t0 === null) t0 = now;
    var t = (now - t0) / 1000;
    frame(t);
    if (t < END) window.requestAnimationFrame(tick);
  }
  window.requestAnimationFrame(tick);
})();
