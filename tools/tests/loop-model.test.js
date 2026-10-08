const test = require('node:test');
const assert = require('node:assert');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/loop-model.js');

const ROUND = 5.4;
const endOfRound = r => M.INTRO + (r + 1) * ROUND - 1e-6;

test('rows are the program.md example', () => {
  assert.deepEqual(M.ROWS.map(r => [r.commit, r.status]), [
    ['a1b2c3d', 'keep'], ['b2c3d4e', 'keep'], ['c3d4e5f', 'discard'], ['d4e5f6g', 'crash']
  ]);
});

test('duration and stops', () => {
  assert.ok(Math.abs(M.duration() - 24.6) < 1e-9);
  assert.equal(M.stops().length, 25);
  assert.equal(M.stops()[0], M.INTRO);
});

test('intro is empty', () => {
  const s = M.stateAt(0);
  assert.equal(s.phase, 'intro');
  assert.equal(s.rows, 0);
  assert.equal(s.nodes.length, 0);
  assert.equal(s.head, -1);
});

test('commit station adds a pending node', () => {
  const s = M.stateAt(M.INTRO + 1.0 + 0.25);
  assert.equal(s.station, 'commit');
  assert.equal(s.nodes.length, 1);
  assert.equal(s.nodes[0].status, 'pending');
});

test('baseline kept', () => {
  const s = M.stateAt(endOfRound(0));
  assert.equal(s.verdict, 'baseline');
  assert.equal(s.nodes[0].status, 'keep');
  assert.equal(s.head, 0);
  assert.equal(s.best, 0.9979);
  assert.equal(s.rows, 1);
});

test('keep advances head and best', () => {
  const s = M.stateAt(endOfRound(1));
  assert.equal(s.verdict, 'keep');
  assert.equal(s.head, 1);
  assert.equal(s.best, 0.9932);
});

test('discard resets head', () => {
  const s = M.stateAt(endOfRound(2));
  assert.equal(s.verdict, 'discard');
  assert.equal(s.nodes[2].status, 'discard');
  assert.equal(s.nodes[2].onBranch, false);
  assert.equal(s.head, 1);
  assert.equal(s.best, 0.9932);
  assert.equal(s.headBpb, 0.9932);
});

test('noReset keeps the bad commit on the branch', () => {
  const s = M.stateAt(endOfRound(2), { noReset: true });
  assert.equal(s.nodes[2].onBranch, true);
  assert.equal(s.head, 2);
  assert.equal(s.headBpb, 1.005);
  assert.equal(s.best, 0.9932);
});

test('crash shows empty grep and is not kept', () => {
  const mid = M.INTRO + 3 * ROUND + 1.0 + 0.5 + 1.4 + 0.35;
  const r = M.stateAt(mid);
  assert.equal(r.station, 'read');
  assert.equal(r.readout, '');
  const s = M.stateAt(endOfRound(3));
  assert.equal(s.nodes[3].status, 'crash');
  assert.equal(s.nodes[3].onBranch, false);
  assert.equal(s.head, 1);
});

test('readout shows the score for a normal run', () => {
  const mid = M.INTRO + 1 * ROUND + 1.0 + 0.5 + 1.4 + 0.35;
  assert.equal(M.stateAt(mid).readout, 'val_bpb: 0.993200');
});

test('end state', () => {
  const s = M.stateAt(M.duration());
  assert.equal(s.phase, 'outro');
  assert.equal(s.rows, 4);
  assert.equal(s.best, 0.9932);
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 19.9, 3.1, 24.6, 12.0];
  const a = ts.map(t => JSON.stringify(M.stateAt(t)));
  const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t))).reverse();
  assert.deepEqual(a, b);
});
