/* autoresearch scene "context" model — don't let the training log flood the agent's context.
 *
 * program.md steps 4–5: run `uv run train.py > run.log 2>&1` (everything goes
 * to a file, "do NOT use tee"), then grep two lines out of run.log. With tee
 * the whole output would also land in the agent's context.
 * The context is a bar of CAP cells; the rules read at setup take RULES cells.
 * Each round adds either the whole output (TEE_ROUND) or the two grep lines
 * (GREP). When the bar overflows, the oldest content is pushed out first.
 * All sizes are illustrative (示意); only the commands come from program.md.
 * Three rounds are shown one by one, then a fast-forward to round 100.
 * stateAt(t, opts) is pure; every station shares one absolute schedule. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.ExplainTimeline || global.ExplainTimeline);
  else root.ContextModel = factory(root.ExplainTimeline);
})(this, function (T) {
  'use strict';

  var CAP = 100, RULES = 10, TEE_ROUND = 35, GREP = 0.1;
  var ROUNDS = 100, DETAILED = 3;
  // round 1 is the program.md output example; rounds 2–3 use the results.tsv
  // example scores, with peak VRAM back-computed from memory_gb × 1024 (示意)
  var READOUTS = [
    ['val_bpb: 0.997900', 'peak_vram_mb: 45060.2'],
    ['val_bpb: 0.993200', 'peak_vram_mb: 45260.8'],
    ['val_bpb: 1.005000', 'peak_vram_mb: 45056.0']
  ];
  // shares of a shown round
  var SUB = { cmd: 0.12, stream: 0.62, grep: 0.86 };
  var LAND = 0.74;  // grep lines reach the context

  var INTRO = 1.8;
  var SEGMENTS = [
    { key: 'r1', dur: 3.4 },
    { key: 'r2', dur: 2.8 },
    { key: 'r3', dur: 3.4 },
    { key: 'ff', dur: 3.6 },
    { key: 'outro', dur: 2.8 }
  ];
  var SCHED = T.schedule(SEGMENTS, INTRO);

  function duration() { return SCHED[SCHED.length - 1].end; }
  function stops() { return [0].concat(SCHED.map(function (s) { return s.start; }), [duration()]); }

  function perRound(tee) { return tee ? TEE_ROUND : GREP; }

  // content laid end to end: rules, then one block per round; keep only what is still visible
  function blocksFor(tee, rounds, raw, dropped) {
    var out = [];
    if (RULES > dropped) out.push({ kind: 'rules', start: 0, end: RULES });
    if (rounds <= 0) return out;
    if (!tee) {
      out.push({ kind: 'grep', start: RULES, end: raw, rounds: Math.ceil(rounds - 1e-9) });
      return out;
    }
    var per = TEE_ROUND, first = Math.max(1, Math.floor((dropped - RULES) / per) + 1);
    for (var k = first; k < rounds + 1 - 1e-9; k++) {
      var a = RULES + (k - 1) * per, b = Math.min(RULES + k * per, raw);
      if (b > dropped && b > a) out.push({ kind: 'log', round: k, start: a, end: b });
    }
    return out;
  }

  function finish(s) {
    s.used = Math.min(s.raw, CAP);
    s.dropped = Math.max(0, s.raw - CAP);
    s.full = s.raw > CAP + 1e-9;
    s.rulesGone = s.dropped >= RULES - 1e-9;
    s.blocks = blocksFor(s.tee, s.rounds, s.raw, s.dropped);
    return s;
  }

  function stateAt(t, opts) {
    var tee = !!(opts && opts.tee), per = perRound(tee);
    var s = { phase: 'intro', local: 0, round: 0, rounds: 0, sub: null, subLocal: 0, tee: tee,
              raw: RULES, stream: 0, land: 0, lines: null };
    if (t < INTRO) { s.local = T.progress(t, 0, INTRO); return finish(s); }

    var at = T.locate(SCHED, t), k = at.item.key, p = at.local;
    s.phase = k; s.local = p;

    if (k === 'ff' || k === 'outro') {
      var n = k === 'outro' ? ROUNDS : DETAILED + (ROUNDS - DETAILED) * T.ease.inOut(p);
      s.rounds = n;
      s.round = k === 'outro' || p >= 1 ? ROUNDS : Math.floor(n + 1e-9);
      s.raw = RULES + n * per;
      return finish(s);
    }

    var r = +k.slice(1);  // 1..3
    s.round = r;
    s.rounds = r - 1;
    s.raw = RULES + (r - 1) * per;
    s.sub = p < SUB.cmd ? 'cmd' : p < SUB.stream ? 'stream' : p < SUB.grep ? 'grep' : 'settle';
    var lo = { cmd: 0, stream: SUB.cmd, grep: SUB.stream, settle: SUB.grep }[s.sub];
    var hi = { cmd: SUB.cmd, stream: SUB.stream, grep: SUB.grep, settle: 1 }[s.sub];
    s.subLocal = (p - lo) / (hi - lo);
    s.stream = T.clamp((p - SUB.cmd) / (SUB.stream - SUB.cmd), 0, 1);
    if (tee) {
      s.raw += TEE_ROUND * s.stream;
      if (s.stream > 0) s.rounds = r - 1 + s.stream;
    } else if (p >= SUB.stream) {
      s.lines = READOUTS[r - 1];
      s.land = T.clamp((p - SUB.stream) / (LAND - SUB.stream), 0, 1);
      if (p >= LAND) { s.raw += GREP; s.rounds = r; }
    }
    return finish(s);
  }

  return { CAP: CAP, RULES: RULES, TEE_ROUND: TEE_ROUND, GREP: GREP, ROUNDS: ROUNDS, DETAILED: DETAILED,
           READOUTS: READOUTS, SUB: SUB, LAND: LAND, SCHED: SCHED, INTRO: INTRO,
           duration: duration, stops: stops, stateAt: stateAt };
});
