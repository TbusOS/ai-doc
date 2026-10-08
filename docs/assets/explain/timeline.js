/* Explainer timeline helpers — pure functions, no DOM.
 * Every scene animation is a function of time t (seconds), so the page can
 * scrub to any t and the GIF exporter can capture exact frames.
 * Loaded as a classic script (window.ExplainTimeline) and by node tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ExplainTimeline = factory();
})(this, function () {
  'use strict';

  function clamp(x, lo, hi) {
    return x < lo ? lo : x > hi ? hi : x;
  }

  var ease = {
    inOut: function (p) {
      p = clamp(p, 0, 1);
      return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    },
    out: function (p) {
      p = clamp(p, 0, 1);
      return 1 - Math.pow(1 - p, 3);
    }
  };

  // 0..1 progress of t through [start, start + dur]
  function progress(t, start, dur) {
    if (dur <= 0) return t >= start ? 1 : 0;
    return clamp((t - start) / dur, 0, 1);
  }

  // [{key, dur}] -> [{key, start, end}] laid end to end from offset
  function schedule(segments, offset) {
    var at = offset || 0;
    return segments.map(function (s) {
      var item = { key: s.key, start: at, end: at + s.dur };
      at = item.end;
      return item;
    });
  }

  // which segment holds t; t outside the schedule clamps to first / last
  function locate(sched, t) {
    var lo = 0, hi = sched.length - 1;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (sched[mid].start <= t) lo = mid; else hi = mid - 1;
    }
    var item = sched[lo];
    return { index: lo, item: item, local: progress(t, item.start, item.end - item.start) };
  }

  function nextStop(stops, t) {
    for (var i = 0; i < stops.length; i++) if (stops[i] > t + 1e-9) return stops[i];
    return stops[stops.length - 1];
  }

  function prevStop(stops, t) {
    for (var i = stops.length - 1; i >= 0; i--) if (stops[i] < t - 1e-9) return stops[i];
    return stops[0];
  }

  return { clamp: clamp, ease: ease, progress: progress, schedule: schedule,
           locate: locate, nextStop: nextStop, prevStop: prevStop };
});
