/* autoresearch scene 11 model — which problems fit the loop: three gates.
 *
 * A problem card walks left to right through three gates (scores in 5–10
 * minutes / the score cannot be gamed / a bad change can be undone) and stops
 * at the first gate it fails. Stations: five examples (autoresearch itself
 * first), karpathy's two directions from the README, then the reader's own
 * problem, answered with the three yes / no buttons (opts.fast / honest / undo).
 * One absolute schedule; stateAt(t, opts) is pure. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.ExplainTimeline || global.ExplainTimeline);
  else root.WhereModel = factory(root.ExplainTimeline);
})(this, function (T) {
  'use strict';

  var GATE_KEYS = ['fast', 'honest', 'undo'];
  var INTRO = 2.4;
  var EX = 4.6;                 // one example walking through the gates
  var README = 6.0;
  var ARRIVE = [0.6, 1.55, 2.5];  // seconds into a station when the card reaches gate g
  var RESULT = 0.35;            // the gate lamp settles this long after arrival
  var LEAVE = 0.5;              // the card leaves a passed gate this long after arrival
  var END_ARRIVE = 3.45;        // the card reaches the loop after the last gate
  var VERDICT_LAG = 0.25;

  function verdictOf(gates) {
    for (var g = 0; g < gates.length; g++) if (!gates[g]) return { pass: false, failAt: g };
    return { pass: true, failAt: -1 };
  }

  function mineGates(opts) {
    return GATE_KEYS.map(function (k) { return !(opts && opts[k] === 'no'); });
  }

  // card position: 0 = start, g + 1 = waiting in front of gate g, 4 = at the loop
  function walk(el, v) {
    var stopAt = v.pass ? 3 : v.failAt;  // last waypoint index it reaches (3 = the loop)
    var marks = ARRIVE.concat([END_ARRIVE]);
    if (el < marks[0]) return T.ease.inOut(el / marks[0]);
    for (var g = 0; g < 3; g++) {
      if (g === stopAt) return g + 1;
      var leave = marks[g] + LEAVE;
      if (el < leave) return g + 1;
      if (el < marks[g + 1]) return g + 1 + T.ease.inOut((el - leave) / (marks[g + 1] - leave));
    }
    return 4;
  }

  function check(el, gates) {
    var v = verdictOf(gates);
    var s = { pos: walk(el, v), gates: [], ages: [], verdict: null, failAt: -1, verdictAge: -1 };
    for (var g = 0; g < 3; g++) {
      s.ages.push(-1);  // seconds since this gate's lamp settled
      if (!v.pass && g > v.failAt) { s.gates.push(el >= ARRIVE[v.failAt] + RESULT ? 'skip' : 'idle'); continue; }
      if (el < ARRIVE[g]) s.gates.push('idle');
      else if (el < ARRIVE[g] + RESULT) s.gates.push('check');
      else { s.gates.push(gates[g] ? 'pass' : 'fail'); s.ages[g] = el - ARRIVE[g] - RESULT; }
    }
    var at = v.pass ? END_ARRIVE : ARRIVE[v.failAt] + RESULT;
    if (el >= at + VERDICT_LAG) { s.verdict = v.pass ? 'pass' : 'fail'; s.failAt = v.failAt; s.verdictAge = el - at - VERDICT_LAG; }
    return s;
  }

  function create(examples) {
    var segs = examples.map(function () { return { key: 'example', dur: EX }; });
    segs.push({ key: 'readme', dur: README }, { key: 'mine', dur: EX });
    var SCHED = T.schedule(segs, INTRO);
    var END = SCHED[SCHED.length - 1].end;

    function stateAt(t, opts) {
      if (t < INTRO) {
        return { phase: 'intro', example: -1, local: T.progress(t, 0, INTRO), pos: 0, gates: ['idle', 'idle', 'idle'], ages: [-1, -1, -1], verdict: null, failAt: -1, verdictAge: -1 };
      }
      var at = T.locate(SCHED, t), seg = at.item, el = Math.min(t, END) - seg.start;
      var s;
      if (seg.key === 'readme') s = { pos: 0, gates: ['idle', 'idle', 'idle'], ages: [-1, -1, -1], verdict: null, failAt: -1, verdictAge: -1 };
      else s = check(el, seg.key === 'mine' ? mineGates(opts) : examples[at.index]);
      s.phase = seg.key;
      s.example = seg.key === 'example' ? at.index : -1;
      s.local = at.local;
      return s;
    }

    return {
      GATE_KEYS: GATE_KEYS, SCHED: SCHED, ARRIVE: ARRIVE, RESULT: RESULT, INTRO: INTRO,
      duration: function () { return END; },
      stops: function () { return [0].concat(SCHED.map(function (s) { return s.start; }), [END]); },
      stateAt: stateAt, verdictOf: verdictOf, mineGates: mineGates
    };
  }

  return { create: create, verdictOf: verdictOf };
});
