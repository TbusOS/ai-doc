/* autoresearch scene 10 model — replay of progress.png, dot by dot.
 *
 * The data is explain-src/autoresearch/data/progress.json: the dots read out of
 * karpathy's progress.png (±0.00003). x is the figure's "Experiment #", which
 * analysis.ipynb counts among non-crashed runs; the figure skips crashes and
 * runs more than 0.0005 worse than the baseline, so 6 x positions are empty.
 *
 * Timeline (one absolute schedule): intro, then one station per kept dot — the
 * sweep stops on the dot for HOLD seconds, then moves on at PER_X seconds per
 * x unit — then three stations: the random-seed spotlight, the filter note,
 * and the outro. stateAt(t) is pure: scrubbing gives the frame playing would. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.ExplainTimeline || global.ExplainTimeline);
  else root.ProgressModel = factory(root.ExplainTimeline);
})(this, function (T) {
  'use strict';

  var INTRO = 2.2;
  var HOLD = 1.1;      // pause on each kept dot
  var PER_X = 0.11;    // sweep speed between kept dots
  var TAIL = { seed: 5.5, filter: 5.5, outro: 3.5 };
  var CUT_ABOVE_BASELINE = 0.0005;  // analysis.ipynb: val_bpb <= baseline_bpb + 0.0005

  function round5(v) { return Math.round(v * 1e5) / 1e5; }

  function create(data, opts) {
    var seedX = opts && opts.seedX;
    var POINTS = data.points.slice().sort(function (a, b) { return a.x - b.x; })
      .map(function (p) { return { x: p.x, bpb: p.bpb, status: p.status }; });
    var KEPT = [];
    var best = null;
    POINTS.forEach(function (p) {
      if (p.status !== 'keep') return;
      KEPT.push({ x: p.x, bpb: p.bpb, drop: best === null ? null : round5(best - p.bpb) });
      best = best === null ? p.bpb : Math.min(best, p.bpb);
    });
    var LAST_X = POINTS[POINTS.length - 1].x;
    var BASELINE = KEPT[0].bpb;
    var seedIdx = -1;
    KEPT.forEach(function (k, i) { if (k.x === seedX) seedIdx = i; });
    var SEED_DROP = seedIdx >= 0 ? KEPT[seedIdx].drop : null;
    var SMALLER = KEPT.filter(function (k, i) { return i > 0 && i !== seedIdx && SEED_DROP !== null && k.drop < SEED_DROP; });

    var segs = KEPT.map(function (k, i) {
      var next = i + 1 < KEPT.length ? KEPT[i + 1].x : LAST_X;
      return { key: 'keep', dur: HOLD + (next - k.x) * PER_X };
    });
    ['seed', 'filter', 'outro'].forEach(function (k) { segs.push({ key: k, dur: TAIL[k] }); });
    var SCHED = T.schedule(segs, INTRO);
    var END = SCHED[SCHED.length - 1].end;

    function duration() { return END; }
    function stops() { return [0].concat(SCHED.map(function (s) { return s.start; }), [END]); }

    function counts(s) {
      s.kept = 0; s.discarded = 0; s.best = null;
      POINTS.forEach(function (p) {
        if (p.x > s.cursor + 1e-9) return;
        if (p.status === 'keep') { s.kept++; s.best = s.best === null ? p.bpb : Math.min(s.best, p.bpb); }
        else s.discarded++;
      });
      return s;
    }

    function stateAt(t) {
      if (t < INTRO) {
        return counts({ phase: 'intro', cursor: -1, focus: -1, local: T.progress(t, 0, INTRO), hold: false });
      }
      var at = T.locate(SCHED, t), seg = at.item, s;
      if (seg.key === 'keep') {
        var i = at.index, k = KEPT[i];
        var next = i + 1 < KEPT.length ? KEPT[i + 1].x : LAST_X;
        var el = t - seg.start;
        var cursor = el <= HOLD ? k.x : Math.min(next, k.x + (el - HOLD) / PER_X);
        s = { phase: 'keep', cursor: cursor, focus: i, local: at.local, hold: el < HOLD };
      } else {
        s = { phase: seg.key, cursor: LAST_X, focus: seg.key === 'seed' ? seedIdx : -1, local: at.local, hold: false };
      }
      return counts(s);
    }

    function visible(s) {
      return POINTS.filter(function (p) { return p.x <= s.cursor + 1e-9; });
    }

    return {
      POINTS: POINTS, KEPT: KEPT, LAST_X: LAST_X, BASELINE: BASELINE,
      CUT: BASELINE + CUT_ABOVE_BASELINE, ERROR: data.error, HIDDEN: data.hidden.slice(),
      NOT_KEPT: data.total_in_title - data.kept_in_title,
      GREY_DRAWN: POINTS.filter(function (p) { return p.status !== 'keep'; }).length,
      TOTAL: data.total_in_title, SEED: seedIdx, SEED_DROP: SEED_DROP, SMALLER_THAN_SEED: SMALLER,
      INTRO: INTRO, HOLD: HOLD, PER_X: PER_X, SCHED: SCHED,
      duration: duration, stops: stops, stateAt: stateAt, visible: visible
    };
  }

  return { create: create };
});
