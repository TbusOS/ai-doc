const test = require('node:test');
const assert = require('node:assert');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/budget-model.js');

const STATIONS = ['race', 'after', 'score', 'hour', 'outro'];
const END = () => M.duration();
const bpbs = s => s.lanes.map(l => l.bpb.toFixed(3));
const steps = s => s.lanes.map(l => Math.floor(l.steps));

test('three candidates: smaller, default, bigger', () => {
  assert.deepEqual(M.CANDS.map(c => c.key), ['small', 'default', 'big']);
});

test('the default model makes 953 steps and scores ≈ 0.9979 in 5 minutes (program.md output example)', () => {
  assert.equal(M.TARGET_STEPS, 953);
  assert.ok(Math.abs(M.bpb('default', 953) - 0.9979) < 5e-4);
});

test('stops: 0, the start of every station, the end', () => {
  const st = M.stops();
  assert.equal(st[0], 0);
  assert.equal(st.length, STATIONS.length + 2);
  assert.ok(Math.abs(st[st.length - 1] - END()) < 1e-9);
});

test('every stop lands on the start of its station (local === 0)', () => {
  M.stops().slice(1, -1).forEach((t, i) => {
    for (const opts of [{}, { fixedSteps: true }, { machine: 'slow' }]) {
      const s = M.stateAt(t, opts);
      assert.equal(s.station, STATIONS[i], `stop ${i}`);
      assert.equal(s.local, 0, `stop ${i}`);
    }
  });
});

test('fixed time: one 5:00 clock, everyone stops at 5:00 with different step counts', () => {
  const st = M.stops();
  assert.equal(M.stateAt(st[1] + 2.5).clock, 2.5);
  const s = M.stateAt(END());
  assert.equal(s.clock, 5);
  assert.deepEqual(steps(s), [1588, 953, 529]);
  assert.deepEqual(s.lanes.map(l => l.finishMin), [5, 5, 5]);
  assert.deepEqual(bpbs(s), ['1.012', '0.998', '1.014']);
  assert.equal(s.winner, 1);
  assert.deepEqual(s.lanes.map(l => l.perHour), [12, 12, 12]);
});

test('fixed steps: all reach 953 steps, but the small one takes 3 minutes and the big one 9', () => {
  const s = M.stateAt(END(), { fixedSteps: true });
  assert.deepEqual(steps(s), [953, 953, 953]);
  assert.deepEqual(s.lanes.map(l => l.finishMin), [3, 5, 9]);
  assert.equal(s.clock, 9);
  assert.deepEqual(bpbs(s), ['1.020', '0.998', '0.985']);
  assert.equal(s.winner, 2);
  assert.deepEqual(s.lanes.map(l => +l.perHour.toFixed(2)), [20, 12, 6.67]);
});

test('fixed steps: the small lane finishes at 3:00 during the race', () => {
  const st = M.stops();
  const at3 = M.stateAt(st[1] + 3.0, { fixedSteps: true });
  assert.ok(Math.abs(at3.clock - 3) < 1e-9);
  assert.equal(at3.lanes[0].done, true);
  assert.equal(at3.lanes[2].done, false);
});

test('a slower machine: same 5 minutes, a third of the steps, a different winner', () => {
  const s = M.stateAt(END(), { machine: 'slow' });
  assert.deepEqual(steps(s), [529, 317, 176]);
  assert.deepEqual(bpbs(s), ['1.032', '1.040', '1.098']);
  assert.equal(s.winner, 0);
  assert.deepEqual(s.lanes.map(l => l.perHour), [12, 12, 12]);
});

test('a slower machine with fixed steps: 9 / 15 / 27 minutes, same scores as on the fast machine', () => {
  const s = M.stateAt(END(), { machine: 'slow', fixedSteps: true });
  assert.deepEqual(s.lanes.map(l => l.finishMin), [9, 15, 27]);
  assert.equal(s.clock, 27);
  assert.deepEqual(bpbs(s), bpbs(M.stateAt(END(), { fixedSteps: true })));
});

test('scores stay hidden until the score station', () => {
  const st = M.stops();
  assert.equal(M.stateAt(st[3] - 1e-6).revealed, false);
  assert.equal(M.stateAt(st[3] - 1e-6).winner, -1);
  assert.equal(M.stateAt(st[3] + 1.0).revealed, true);
});

test('the hour stop shows the hour view alone, with its caption', () => {
  const t = M.stops()[STATIONS.indexOf('hour') + 1];
  for (const opts of [{}, { fixedSteps: true }]) {
    const s = M.stateAt(t, opts);
    assert.equal(s.view.tracks, 0);
    assert.equal(s.view.hours, 1);
    assert.equal(s.view.caption, 'hour');
  }
});

test('race view and hour view never overlap, and the caption flips with the picture', () => {
  const st = M.stops(), a = st[STATIONS.indexOf('score') + 1], b = st[STATIONS.indexOf('outro') + 1];
  let sawHourCaptionBeforeStop = false;
  for (let k = 0; k < 400; k++) {  // up to, not including, the outro stop
    const t = a + (b - a) * k / 400, s = M.stateAt(t);
    assert.ok(!(s.view.tracks > 0 && s.view.hours > 0), `t ${t}: both views visible`);
    if (s.view.hours > 0) assert.equal(s.view.caption, 'hour', `t ${t}`);
    if (s.view.tracks > 0) assert.notEqual(s.view.caption, 'hour', `t ${t}`);
    if (s.station === 'score' && s.view.caption === 'hour') sawHourCaptionBeforeStop = true;
  }
  assert.ok(sawHourCaptionBeforeStop, 'the swap finishes before the hour stop');
});

test('the scores are on screen before the views swap', () => {
  const sc = M.SCHED.find(s => s.key === 'score');
  const s = M.stateAt(sc.start + M.REVEAL_AT * (sc.end - sc.start) + 1e-6);
  assert.equal(s.view.tracks, 1);
  assert.equal(s.revealed, true);
});

test('copy: one experiment at a time on the GPU, never "at the same time"', () => {
  const copy = JSON.stringify(require('../../explain-src/autoresearch/scenes/budget.json'));
  assert.ok(!/同时/.test(copy), 'program.md: each experiment runs on a single GPU, one after another');
  assert.ok(/独占/.test(copy), 'the lanes are each a 5-minute run with the GPU to itself');
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 15.9, 3.1, END(), 10.0];
  const o = { fixedSteps: true, machine: 'slow' };
  const a = ts.map(t => JSON.stringify(M.stateAt(t, o)));
  const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t, o))).reverse();
  assert.deepEqual(a, b);
});
