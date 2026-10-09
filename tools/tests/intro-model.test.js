const test = require('node:test');
const assert = require('node:assert');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/intro-model.js');
const progress = require('../../explain-src/autoresearch/data/progress.json');

const opts = { points: progress.points };
const startOf = k => M.SCHED[M.STATIONS.indexOf(k)].start;

test('83 experiments and 15 kept: the numbers in the progress.png title', () => {
  assert.equal(M.TOTAL, 83);
  assert.equal(M.KEPT, 15);
  assert.equal(M.TOTAL, progress.total_in_title);
  assert.equal(M.KEPT, progress.kept_in_title);
});

test('stops: 0 first, duration last, one per station', () => {
  const st = M.stops();
  assert.equal(st[0], 0);
  assert.equal(st[st.length - 1], M.duration());
  assert.equal(st.length, M.STATIONS.length + 1);
});

test('every stop lands on the start of its station (local === 0)', () => {
  M.stops().slice(0, -1).forEach((t, i) => {
    const s = M.stateAt(t, opts);
    assert.equal(s.station, M.STATIONS[i], `stop ${i}`);
    assert.equal(s.local, 0, `stop ${i}`);
  });
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 13.9, 3.1, M.duration(), 9.05, 0];
  const a = ts.map(t => JSON.stringify(M.stateAt(t, opts)));
  const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t, opts))).reverse();
  assert.deepEqual(a, b);
});

test('the night starts at 23:00 with nothing run yet', () => {
  const s = M.stateAt(0, opts);
  assert.equal(s.clock, '23:00');
  assert.equal(s.done, 0);
  assert.equal(s.current, null);
  assert.equal(s.kept, 0);
  assert.equal(s.best, null);
});

test('06:00: all 83 experiments done, 15 kept, best reading 0.97728', () => {
  for (const t of [startOf('morning'), M.duration()]) {
    const s = M.stateAt(t, opts);
    assert.equal(s.clock, '06:00');
    assert.equal(s.done, 83);
    assert.equal(s.kept, 15);
    assert.equal(s.best, 0.97728);
    assert.equal(s.visible.length, progress.points.length);
  }
  assert.ok(M.stateAt(M.duration(), opts).wake > 0.99);
});

test('the illustrative clock keeps README pace: about 12 experiments an hour', () => {
  // README: "approx 12 experiments/hour"; 83 experiments over the night
  const perHour = M.TOTAL / (M.NIGHT_MIN / 60);
  assert.ok(perHour > 11 && perHour < 13, `${perHour.toFixed(1)} per hour`);
});

test('experiments count up one at a time and the clock never runs backwards', () => {
  let prev = 0, prevMin = 0;
  for (let t = 0; t <= M.duration() + 1e-9; t += 0.01) {
    const s = M.stateAt(t, opts);
    assert.ok(s.done >= prev && s.done - prev <= 1, `t=${t.toFixed(2)} done ${prev} -> ${s.done}`);
    assert.ok(s.minutes >= prevMin - 1e-9, `t=${t.toFixed(2)} clock went back`);
    prev = s.done; prevMin = s.minutes;
  }
});

test('the first three experiments play slowly, with their real verdicts', () => {
  const at = (n, step) => {
    const k = M.STEPS.indexOf(step);
    return M.stateAt(startOf('first') + (n - 1) * M.FIRST_SLOT + (k + 0.5) / M.STEPS.length * M.FIRST_SLOT, opts);
  };
  assert.deepEqual(M.STEPS, ['edit', 'train', 'compare', 'verdict']);
  const e1 = at(1, 'edit');
  assert.equal(e1.current, 1);
  assert.equal(e1.done, 0);
  assert.equal(e1.verdict, null);
  // #1 baseline kept, #2 not drawn in progress.png (worse than the cut-off) so discarded, #3 kept
  assert.deepEqual([1, 2, 3].map(n => at(n, 'verdict').verdict), ['keep', 'discard', 'keep']);
  assert.equal(M.statusOf(2, progress.points), 'discard');
  assert.ok(progress.hidden.includes(1));
});

test('only finished experiments are drawn', () => {
  const night = M.SCHED[M.STATIONS.indexOf('night')];
  for (const f of [0.1, 0.5, 0.9]) {
    const s = M.stateAt(night.start + f * (night.end - night.start), opts);
    assert.ok(s.visible.length > 0);
    assert.ok(s.visible.every(p => p.x < s.done));
    assert.equal(s.visible.length, progress.points.filter(p => p.x < s.done).length);
  }
});

test('running best only steps down, from the baseline to the best kept reading', () => {
  const line = M.bestLine(progress.points, 83);
  assert.equal(line[0].x, 0);
  assert.equal(line[0].bpb, 0.99789);
  for (let i = 1; i < line.length; i++) assert.ok(line[i].bpb < line[i - 1].bpb);
  assert.equal(line[line.length - 1].bpb, 0.97728);
  assert.equal(line.length, 15);
  assert.equal(M.bestLine(progress.points, 3).length, 2);
});

test('without data the model still runs (counts and clock only)', () => {
  const s = M.stateAt(M.duration());
  assert.equal(s.done, 83);
  assert.equal(s.kept, null);
  assert.equal(s.best, null);
});

test('the baseline run changes nothing and compares with nothing', () => {
  // program.md: "Your very first run should always be to establish the baseline, so you will
  // run the training script as is." Run 1 must never show "edit code" or "compare".
  const first = M.SCHED.find(x => x.key === 'first');
  const seen = new Set();
  for (let i = 0; i <= 200; i++) {
    const t = first.start + (first.end - first.start) * i / 200 - 1e-9;
    const s = M.stateAt(Math.max(first.start, t), opts);
    if (s.station === 'first' && s.current === 1) seen.add(s.step);
  }
  assert.deepEqual([...seen].sort(), ['asis', 'record', 'train'].sort());
  // later runs keep the four steps
  const s2 = M.stateAt(first.start + (first.end - first.start) * 0.4, opts);
  assert.equal(s2.current, 2);
  assert.ok(M.STEPS.includes(s2.step));
});

