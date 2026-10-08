/* autoresearch scene 4 model — the experiment loop as a pure function of time.
 *
 * ROWS are the four example rows from program.md "Logging results" (baseline,
 * keep, discard, crash). Each round walks seven stations in program.md order:
 * compare (the judgement inside steps 8–9), record in results.tsv (step 7 —
 * its status column needs the verdict), then the git action (steps 8–9):
 * advance only if val_bpb is lower, otherwise git reset.
 * All rounds share one absolute schedule, so stops() and stateAt() read the
 * same numbers and a step never lands at the tail of the previous station.
 * stateAt(t) never depends on earlier calls: scrubbing and GIF export give the
 * same frame as playing from the start. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.ExplainTimeline || global.ExplainTimeline);
  else root.LoopModel = factory(root.ExplainTimeline);
})(this, function (T) {
  'use strict';

  var ROWS = [
    { commit: 'a1b2c3d', bpb: 0.9979, mem: 44.0, status: 'keep', desc: 'baseline' },
    { commit: 'b2c3d4e', bpb: 0.9932, mem: 44.2, status: 'keep', desc: 'increase LR to 0.04' },
    { commit: 'c3d4e5f', bpb: 1.005, mem: 44.0, status: 'discard', desc: 'switch to GeLU activation' },
    { commit: 'd4e5f6g', bpb: 0, mem: 0.0, status: 'crash', desc: 'double model width (OOM)' }
  ];
  // round 1's peak VRAM is the program.md "Output format" example; later rounds
  // are back-computed from memory_gb × 1024 (marked 示意 on the page)
  var BASELINE_VRAM_MB = 45060.2;
  var STATIONS = ['edit', 'commit', 'train', 'read', 'decide', 'log', 'git'];
  var DURS = { edit: 1.0, commit: 0.5, train: 1.4, read: 0.7, decide: 1.0, log: 0.6, git: 1.0 };
  var INTRO = 1.0;
  var OUTRO = 2.0;
  var ROUND = STATIONS.reduce(function (a, k) { return a + DURS[k]; }, 0);
  var SEGMENTS = [];
  ROWS.forEach(function () { STATIONS.forEach(function (k) { SEGMENTS.push({ key: k, dur: DURS[k] }); }); });
  var SCHED = T.schedule(SEGMENTS, INTRO);
  var RUN_END = SCHED[SCHED.length - 1].end;

  function duration() { return RUN_END + OUTRO; }

  function stops() {
    return [0].concat(SCHED.map(function (s) { return s.start; }), [duration()]);
  }

  function empty() {
    return { phase: 'intro', round: -1, station: null, local: 0, nodes: [], head: -1,
             best: null, headBpb: null, rows: 0, readout: null, vram: null, verdict: null };
  }

  // program.md steps 8-9 (+ crash handling): which way does round i go?
  function verdictFor(i, best) {
    var row = ROWS[i];
    if (i === 0) return 'baseline';
    if (row.status === 'crash') return 'crash';
    return row.bpb < best ? 'keep' : 'discard';
  }

  // the git action (steps 8-9); without reset, every commit stays on the branch
  function applyGit(s, i, noReset) {
    var row = ROWS[i], node = s.nodes[i], v = s.verdict;
    if (v === 'baseline' || v === 'keep') {
      node.status = 'keep'; node.onBranch = true;
      s.head = i; s.best = row.bpb; s.headBpb = row.bpb;
      return;
    }
    node.status = v;  // 'discard' | 'crash'
    node.onBranch = !!noReset;
    if (!noReset) node.resetTo = s.head;  // git reset goes back to the HEAD of this moment
    if (noReset) { s.head = i; s.headBpb = v === 'crash' ? null : row.bpb; }
  }

  function addNode(s, i) {
    s.nodes.push({ commit: ROWS[i].commit, status: 'pending', onBranch: true, round: i });
  }

  function readouts(s, i) {
    var row = ROWS[i];
    if (row.status === 'crash') { s.readout = ''; s.vram = null; return; }
    s.readout = 'val_bpb: ' + row.bpb.toFixed(6);
    s.vram = 'peak_vram_mb: ' + (i === 0 ? BASELINE_VRAM_MB : row.mem * 1024).toFixed(1);
  }

  function stateAt(t, opts) {
    var noReset = !!(opts && opts.noReset);
    var s = empty();
    if (t < INTRO) return s;

    var full, at = null;
    if (t >= RUN_END) full = ROWS.length;
    else { at = T.locate(SCHED, t); full = Math.floor(at.index / STATIONS.length); }

    for (var i = 0; i < full; i++) {
      addNode(s, i);
      s.verdict = verdictFor(i, s.best);
      applyGit(s, i, noReset);
      s.rows = i + 1;
    }

    if (!at) {
      s.phase = 'outro'; s.round = ROWS.length - 1; s.verdict = null; s.readout = null; s.vram = null;
      s.local = T.progress(t, RUN_END, OUTRO);
      return s;
    }

    var r = full, idx = at.index % STATIONS.length, k = STATIONS[idx];
    s.phase = 'run'; s.round = r; s.station = k; s.local = at.local; s.verdict = null;
    s.readout = null; s.vram = null;
    if (idx >= 1) addNode(s, r);
    if (idx >= 3) readouts(s, r);
    if ((k === 'decide' && at.local >= 0.5) || idx >= 5) s.verdict = verdictFor(r, s.best);
    if ((k === 'log' && at.local >= 0.3) || idx >= 6) s.rows = r + 1;
    if (k === 'git' && at.local >= 0.3) applyGit(s, r, noReset);
    return s;
  }

  return { ROWS: ROWS, STATIONS: STATIONS, DURS: DURS, INTRO: INTRO, OUTRO: OUTRO, ROUND: ROUND,
           SCHED: SCHED, duration: duration, stops: stops, stateAt: stateAt, verdictFor: verdictFor };
});
