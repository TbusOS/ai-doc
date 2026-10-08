/* autoresearch scene 4 model — the experiment loop as a pure function of time.
 *
 * ROWS are the four example rows from program.md "Logging results" (baseline,
 * keep, discard, crash). Each round walks six stations; the keep / discard
 * decision follows program.md loop steps 8–9: advance only if val_bpb is lower.
 * stateAt(t) never depends on earlier calls, so scrubbing and GIF export give
 * the same frame as playing from the start. */
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
  var STATIONS = ['edit', 'commit', 'train', 'read', 'decide', 'log'];
  var DURS = { edit: 1.0, commit: 0.5, train: 1.4, read: 0.7, decide: 1.2, log: 0.6 };
  var INTRO = 1.0;
  var OUTRO = 2.0;
  var ROUND = STATIONS.reduce(function (a, k) { return a + DURS[k]; }, 0);
  var ROUND_SCHED = T.schedule(STATIONS.map(function (k) { return { key: k, dur: DURS[k] }; }), 0);

  function duration() { return INTRO + ROWS.length * ROUND + OUTRO; }

  function stops() {
    var out = [];
    for (var r = 0; r < ROWS.length; r++) {
      ROUND_SCHED.forEach(function (seg) { out.push(INTRO + r * ROUND + seg.start); });
    }
    out.push(duration());
    return out;
  }

  function empty() {
    return { phase: 'intro', round: -1, station: null, local: 0, nodes: [], head: -1,
             best: null, headBpb: null, rows: 0, readout: null, verdict: null };
  }

  // program.md steps 8-9 (+ crash handling): which way does round i go?
  function verdictFor(i, best) {
    var row = ROWS[i];
    if (i === 0) return 'baseline';
    if (row.status === 'crash') return 'crash';
    return row.bpb < best ? 'keep' : 'discard';
  }

  function decide(s, i, noReset) {
    var row = ROWS[i];
    var v = verdictFor(i, s.best);
    var node = s.nodes[i];
    s.verdict = v;
    if (v === 'baseline' || v === 'keep') {
      node.status = 'keep'; node.onBranch = true;
      s.head = i; s.best = row.bpb; s.headBpb = row.bpb;
    } else if (v === 'discard') {
      node.status = 'discard';
      node.onBranch = !!noReset;
      if (noReset) { s.head = i; s.headBpb = row.bpb; }
    } else {
      node.status = 'crash'; node.onBranch = false;
    }
  }

  function addNode(s, i) {
    s.nodes.push({ commit: ROWS[i].commit, status: 'pending', onBranch: true, round: i });
  }

  function readoutFor(i) {
    return ROWS[i].status === 'crash' ? '' : 'val_bpb: ' + ROWS[i].bpb.toFixed(6);
  }

  function stateAt(t, opts) {
    var noReset = !!(opts && opts.noReset);
    var s = empty();
    if (t < INTRO) return s;

    var runEnd = INTRO + ROWS.length * ROUND;
    var full = t >= runEnd ? ROWS.length : Math.floor((t - INTRO) / ROUND);
    for (var i = 0; i < full; i++) {
      addNode(s, i);
      decide(s, i, noReset);
      s.rows = i + 1;
    }

    if (t >= runEnd) {
      s.phase = 'outro'; s.round = ROWS.length - 1; s.verdict = null;
      s.local = T.progress(t, runEnd, OUTRO);
      return s;
    }

    var r = full;
    var at = T.locate(ROUND_SCHED, t - INTRO - r * ROUND);
    var k = at.item.key;
    s.phase = 'run'; s.round = r; s.station = k; s.local = at.local; s.verdict = null;
    var idx = STATIONS.indexOf(k);
    if (idx >= 1) addNode(s, r);
    if (idx >= 3) s.readout = readoutFor(r);
    if ((k === 'decide' && at.local >= 0.5) || idx >= 5) decide(s, r, noReset);
    if (k === 'log' && at.local >= 0.3) s.rows = r + 1;
    return s;
  }

  return { ROWS: ROWS, STATIONS: STATIONS, DURS: DURS, INTRO: INTRO, OUTRO: OUTRO, ROUND: ROUND,
           duration: duration, stops: stops, stateAt: stateAt, verdictFor: verdictFor };
});
