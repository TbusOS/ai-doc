/* autoresearch opening scene model — one night, 83 experiments.
 *
 * Four stations on one absolute schedule:
 *   handoff  23:00, the human starts the agent and goes to bed
 *   first    experiments 1–3 slowly, one step at a time (edit → train → compare → verdict)
 *   night    experiments 4–83 fast-forwarded
 *   morning  06:00, the human wakes up to the log
 * 83 and 15 are the numbers in the progress.png title; the verdict of each
 * experiment and the running-best line come from data/progress.json (read off
 * that figure). Experiment n is point x = n - 1; an index missing from the
 * points was not drawn because it scored worse than baseline + 0.0005
 * (analysis.ipynb), so it was discarded. The clock (23:00 → 06:00) is
 * illustrative: it advances with the experiment count. 7 hours keeps README's
 * pace (approx 12 experiments/hour): 83 / 7 ≈ 11.9.
 * stateAt(t, {points}) is pure: same t, same frame, whatever was called before. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.ExplainTimeline || global.ExplainTimeline);
  else root.IntroModel = factory(root.ExplainTimeline);
})(this, function (T) {
  'use strict';

  var TOTAL = 83, KEPT = 15;              // progress.png title
  var FIRST = 3;                          // experiments shown one step at a time
  var STEPS = ['edit', 'train', 'compare', 'verdict'];
  // run 1 is the baseline: "run the training script as is" (program.md), nothing to edit or compare
  var BASE_STEPS = ['asis', 'train', 'record'];
  var STATIONS = ['handoff', 'first', 'night', 'morning'];
  var DURS = { handoff: 2.4, first: 5.4, night: 8.0, morning: 3.6 };
  var FIRST_SLOT = DURS.first / FIRST;
  var NIGHT_MIN = 7 * 60;                 // 23:00 → 06:00, illustrative (≈ 12 an hour, as in README)
  var START_MIN = 23 * 60;

  var SCHED = T.schedule(STATIONS.map(function (k) { return { key: k, dur: DURS[k] }; }), 0);
  var END = SCHED[SCHED.length - 1].end;

  function duration() { return END; }
  function stops() { return SCHED.map(function (s) { return s.start; }).concat([END]); }

  function pointAt(points, x) {
    for (var i = 0; i < points.length; i++) if (points[i].x === x) return points[i];
    return null;
  }

  // verdict of experiment n (1-based); not drawn in progress.png = worse than the cut-off = discarded
  function statusOf(n, points) {
    if (!points) return null;
    var p = pointAt(points, n - 1);
    return p ? p.status : 'discard';
  }

  // running best over the first `done` experiments: one entry per kept improvement
  function bestLine(points, done) {
    var out = [];
    points.forEach(function (p) {
      if (p.x >= done || p.status !== 'keep') return;
      if (!out.length || p.bpb < out[out.length - 1].bpb) out.push({ x: p.x, bpb: p.bpb });
    });
    return out;
  }

  function clockText(minutes) {
    var m = (START_MIN + Math.floor(minutes + 1e-9)) % (24 * 60);
    return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2);
  }

  function stateAt(t, opts) {
    var points = opts && opts.points ? opts.points : null;
    var at = T.locate(SCHED, T.clamp(t, 0, END));
    var k = at.item.key, local = at.local;
    var s = { station: k, local: local, done: 0, current: null, steps: null, step: null, verdict: null,
              progress: 0, minutes: 0, clock: '', screenOn: true, dawn: 0, wake: 0,
              visible: [], kept: null, best: null };

    if (k === 'handoff') {
      s.screenOn = local >= 0.3;
    } else if (k === 'first') {
      var slot = Math.min(FIRST - 1, Math.floor(local * FIRST + 1e-9));
      var frac = T.clamp(local * FIRST - slot, 0, 1);
      var steps = slot === 0 ? BASE_STEPS : STEPS;
      var step = Math.min(steps.length - 1, Math.floor(frac * steps.length + 1e-9));
      s.done = slot;
      s.current = slot + 1;
      s.steps = steps;
      s.step = steps[step];
      s.verdict = s.step === 'verdict' || s.step === 'record' ? statusOf(s.current, points) : null;
      s.progress = (slot + frac) / TOTAL;
    } else if (k === 'night') {
      var x = local * (TOTAL - FIRST);
      var whole = Math.min(TOTAL - FIRST, Math.floor(x + 1e-9));
      s.done = FIRST + whole;
      s.current = s.done < TOTAL ? s.done + 1 : null;
      s.progress = (FIRST + x) / TOTAL;
    } else {
      s.done = TOTAL;
      s.progress = 1;
      s.dawn = T.ease.inOut(T.clamp(local / 0.7, 0, 1));
      s.wake = T.ease.out(T.clamp((local - 0.25) / 0.5, 0, 1));
    }
    s.minutes = s.progress * NIGHT_MIN;
    s.clock = clockText(s.minutes);

    if (points) {
      s.visible = points.filter(function (p) { return p.x < s.done; });
      s.kept = s.visible.filter(function (p) { return p.status === 'keep'; }).length;
      var line = bestLine(points, s.done);
      s.best = line.length ? line[line.length - 1].bpb : null;
    }
    return s;
  }

  return { TOTAL: TOTAL, KEPT: KEPT, FIRST: FIRST, STEPS: STEPS, BASE_STEPS: BASE_STEPS, STATIONS: STATIONS, DURS: DURS,
           FIRST_SLOT: FIRST_SLOT, NIGHT_MIN: NIGHT_MIN, SCHED: SCHED, duration: duration, stops: stops,
           stateAt: stateAt, statusOf: statusOf, bestLine: bestLine, clockText: clockText };
});
