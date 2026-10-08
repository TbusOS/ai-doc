/* autoresearch scene "budget" model — why every run gets exactly 5 minutes.
 *
 * Three candidate changes race on one GPU: a smaller model (fast steps), the
 * default model, a bigger model (slow steps). The default model's 953 steps
 * in 5 minutes and its ≈ 0.9979 val_bpb are the program.md output example;
 * every other number here is illustrative (marked 示意 on the page).
 *   fixed time (the real design): one 5:00 clock, everyone stops at 5:00
 *   fixed steps (the reader's toggle): everyone runs 953 steps, so the small
 *     model is done at 3:00 and the big one at 9:00
 *   a slower machine (the reader's choice): a third of the steps in 5 minutes
 * Score model (illustrative): val_bpb = a + b / sqrt(steps), a lower floor and
 * a slower start for bigger models. Scores depend only on steps, so with fixed
 * steps they come out the same on any machine.
 * Stage clock = minutes since the start of the race. One absolute schedule. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.ExplainTimeline || global.ExplainTimeline);
  else root.BudgetModel = factory(root.ExplainTimeline);
})(this, function (T) {
  'use strict';

  var BUDGET_MIN = 5;        // prepare.py TIME_BUDGET = 300 s
  var TARGET_STEPS = 953;    // program.md output example: num_steps 953
  // steps per minute on "this machine": 953 steps take 3 / 5 / 9 minutes
  var CANDS = [
    { key: 'small', perMin: TARGET_STEPS / 3, a: 0.9845, b: 1.096 },
    { key: 'default', perMin: TARGET_STEPS / 5, a: 0.94, b: 1.787 },
    { key: 'big', perMin: TARGET_STEPS / 9, a: 0.90, b: 2.625 }
  ];
  var MACHINES = { 'this': 1, slow: 1 / 3 };
  var MAX_STEPS = CANDS[0].perMin * BUDGET_MIN;  // the most steps any lane can reach (small model, 5 min)

  var SEGMENTS = [
    { key: 'race', dur: 5.0 },
    { key: 'after', dur: 3.2 },
    { key: 'score', dur: 2.0 },
    { key: 'hour', dur: 2.6 },
    { key: 'outro', dur: 2.0 }
  ];
  var INTRO = 1.2;
  var SCHED = T.schedule(SEGMENTS, INTRO);
  var END = SCHED[SCHED.length - 1].end;
  var REVEAL_AT = 0.3;  // fraction of the score station where scores appear

  function duration() { return END; }
  function stops() { return [0].concat(SCHED.map(function (s) { return s.start; }), [END]); }

  function cand(key) { for (var i = 0; i < CANDS.length; i++) if (CANDS[i].key === key) return CANDS[i]; return null; }
  function bpb(key, steps) { var c = cand(key); return c.a + c.b / Math.sqrt(steps); }

  function optsOf(opts) {
    var machine = opts && MACHINES[opts.machine] ? opts.machine : 'this';
    return { fixedSteps: !!(opts && opts.fixedSteps), machine: machine, factor: MACHINES[machine] };
  }

  // minutes each candidate needs (fixed steps) or gets (fixed time)
  function finishMin(c, o) {
    return o.fixedSteps ? round6(TARGET_STEPS / (c.perMin * o.factor)) : BUDGET_MIN;
  }
  function round6(x) { return Math.round(x * 1e6) / 1e6; }

  function stateAt(t, opts) {
    var o = optsOf(opts);
    var fin = CANDS.map(function (c) { return finishMin(c, o); });
    var endMin = Math.max.apply(null, fin);
    var station = null, local = 0, clock = 0;
    if (t >= INTRO) {
      var at = T.locate(SCHED, t);
      station = at.item.key; local = at.local;
      if (station === 'race') clock = BUDGET_MIN * local;
      else if (station === 'after') clock = BUDGET_MIN + (endMin - BUDGET_MIN) * local;
      else clock = endMin;
    }
    var revealed = station === 'hour' || station === 'outro' || (station === 'score' && local >= REVEAL_AT);
    var lanes = CANDS.map(function (c, i) {
      var cap = o.fixedSteps ? TARGET_STEPS : c.perMin * o.factor * BUDGET_MIN;
      var steps = Math.min(cap, c.perMin * o.factor * clock);
      var done = clock >= fin[i] - 1e-9;
      if (done) steps = cap;
      return {
        key: c.key, steps: steps, cap: cap, done: done, finishMin: fin[i],
        progress: steps / MAX_STEPS,  // one step scale for every option: a slower machine draws shorter bars
        bpb: bpb(c.key, cap),
        perHour: 60 / fin[i]
      };
    });
    var winner = -1;
    if (revealed) {
      winner = 0;
      lanes.forEach(function (l, i) { if (l.bpb < lanes[winner].bpb) winner = i; });
    }
    return {
      phase: station ? (station === 'outro' ? 'outro' : 'run') : 'intro',
      station: station, local: local, clock: clock, endMin: endMin,
      fixedSteps: o.fixedSteps, machine: o.machine,
      lanes: lanes, revealed: revealed, winner: winner
    };
  }

  return { BUDGET_MIN: BUDGET_MIN, TARGET_STEPS: TARGET_STEPS, CANDS: CANDS, MACHINES: MACHINES, MAX_STEPS: MAX_STEPS,
           SCHED: SCHED, INTRO: INTRO, REVEAL_AT: REVEAL_AT,
           duration: duration, stops: stops, stateAt: stateAt, bpb: bpb };
});
