const test = require('node:test');
const assert = require('node:assert');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/loop-model.js');

const ROUND = 6.2;
const startOf = (r, k) => M.INTRO + r * ROUND + M.STATIONS.slice(0, M.STATIONS.indexOf(k)).reduce((a, s) => a + M.DURS[s], 0);
const endOfRound = r => M.INTRO + (r + 1) * ROUND - 1e-6;

test('rows are the program.md example', () => {
  assert.deepEqual(M.ROWS.map(r => [r.commit, r.status]), [
    ['a1b2c3d', 'keep'], ['b2c3d4e', 'keep'], ['c3d4e5f', 'discard'], ['d4e5f6g', 'crash']
  ]);
});

test('seven stations in program.md order: compare, record (step 7), then git (steps 8-9)', () => {
  assert.deepEqual(M.STATIONS, ['edit', 'commit', 'train', 'read', 'decide', 'log', 'git']);
});

test('duration and stops', () => {
  assert.ok(Math.abs(M.duration() - 27.8) < 1e-9);
  const st = M.stops();
  assert.equal(st.length, 30);
  assert.equal(st[0], 0);
  assert.ok(Math.abs(st[st.length - 1] - M.duration()) < 1e-9);
});

test('every station stop lands on the start of that station (no float drift)', () => {
  const st = M.stops().slice(1, 29);
  st.forEach((t, i) => {
    const s = M.stateAt(t);
    assert.equal(s.station, M.STATIONS[i % 7], `stop ${i}`);
    assert.equal(s.round, Math.floor(i / 7), `stop ${i}`);
    assert.equal(s.local, 0, `stop ${i}`);
  });
});

test('intro is empty', () => {
  const s = M.stateAt(0);
  assert.equal(s.phase, 'intro');
  assert.equal(s.rows, 0);
  assert.equal(s.nodes.length, 0);
  assert.equal(s.head, -1);
});

test('commit station adds a pending node', () => {
  const s = M.stateAt(startOf(0, 'commit') + 0.25);
  assert.equal(s.station, 'commit');
  assert.equal(s.nodes.length, 1);
  assert.equal(s.nodes[0].status, 'pending');
});

test('verdict is known at decide, recorded at log, applied to git only at the git station', () => {
  const atLog = M.stateAt(startOf(1, 'log') + 0.5);
  assert.equal(atLog.verdict, 'keep');
  assert.equal(atLog.rows, 2);
  assert.equal(atLog.nodes[1].status, 'pending');
  assert.equal(atLog.best, 0.9979);
  assert.equal(atLog.head, 0);
  const atGit = M.stateAt(startOf(1, 'git') + 0.6);
  assert.equal(atGit.nodes[1].status, 'keep');
  assert.equal(atGit.head, 1);
  assert.equal(atGit.best, 0.9932);
});

test('baseline kept', () => {
  const s = M.stateAt(endOfRound(0));
  assert.equal(s.verdict, 'baseline');
  assert.equal(s.nodes[0].status, 'keep');
  assert.equal(s.head, 0);
  assert.equal(s.best, 0.9979);
  assert.equal(s.rows, 1);
});

test('equal score is discarded (program.md step 9: equal or worse)', () => {
  assert.equal(M.verdictFor(1, 0.9932), 'discard');
});

test('discard resets head', () => {
  const s = M.stateAt(endOfRound(2));
  assert.equal(s.verdict, 'discard');
  assert.equal(s.nodes[2].status, 'discard');
  assert.equal(s.nodes[2].onBranch, false);
  assert.equal(s.head, 1);
  assert.equal(s.best, 0.9932);
  assert.equal(s.headBpb, 0.9932);
  assert.equal(s.nodes[2].resetTo, 1);
});

test('noReset keeps the bad commit on the branch', () => {
  const s = M.stateAt(endOfRound(2), { noReset: true });
  assert.equal(s.nodes[2].onBranch, true);
  assert.equal(s.head, 2);
  assert.equal(s.headBpb, 1.005);
  assert.equal(s.best, 0.9932);
});

test('noReset also keeps the crashed commit on the branch', () => {
  const s = M.stateAt(endOfRound(3), { noReset: true });
  assert.equal(s.nodes[3].status, 'crash');
  assert.equal(s.nodes[3].onBranch, true);
  assert.equal(s.head, 3);
});

test('crash shows empty grep and is not kept', () => {
  const r = M.stateAt(startOf(3, 'read') + 0.35);
  assert.equal(r.station, 'read');
  assert.equal(r.readout, '');
  assert.equal(r.vram, null);
  const s = M.stateAt(endOfRound(3));
  assert.equal(s.nodes[3].status, 'crash');
  assert.equal(s.nodes[3].onBranch, false);
  assert.equal(s.head, 1);
});

test('readout shows score and peak VRAM; round 1 VRAM is the program.md output example', () => {
  const b = M.stateAt(startOf(0, 'read') + 0.35);
  assert.equal(b.readout, 'val_bpb: 0.997900');
  assert.equal(b.vram, 'peak_vram_mb: 45060.2');
  const k = M.stateAt(startOf(1, 'read') + 0.35);
  assert.equal(k.readout, 'val_bpb: 0.993200');
  assert.equal(k.vram, 'peak_vram_mb: 45260.8');
});

test('end state', () => {
  const s = M.stateAt(M.duration());
  assert.equal(s.phase, 'outro');
  assert.equal(s.rows, 4);
  assert.equal(s.best, 0.9932);
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 19.9, 3.1, 27.8, 12.0];
  const a = ts.map(t => JSON.stringify(M.stateAt(t)));
  const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t))).reverse();
  assert.deepEqual(a, b);
});
