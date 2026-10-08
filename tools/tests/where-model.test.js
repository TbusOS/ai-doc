const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const WM = require('../../docs/assets/explain/autoresearch/where-model.js');

const SCENE = JSON.parse(fs.readFileSync(path.join(__dirname, '../../explain-src/autoresearch/scenes/where.json'), 'utf8'));
const M = WM.create(SCENE.examples.map(e => e.gates));
const YES = { fast: 'yes', honest: 'yes', undo: 'yes' };
const endOf = i => M.SCHED[i].end - 1e-6;

test('three gates, five examples, autoresearch itself first', () => {
  assert.deepEqual(M.GATE_KEYS, ['fast', 'honest', 'undo']);
  assert.equal(SCENE.gates.map(g => g.key).join(), M.GATE_KEYS.join());
  assert.equal(SCENE.examples.length, 5);
  assert.deepEqual(SCENE.examples[0].gates, [true, true, true]);
  assert.deepEqual(M.SCHED.map(s => s.key), ['example', 'example', 'example', 'example', 'example', 'readme', 'mine']);
});

test('first failing gate decides', () => {
  assert.deepEqual(M.verdictOf([true, true, true]), { pass: true, failAt: -1 });
  assert.deepEqual(M.verdictOf([true, false, true]), { pass: false, failAt: 1 });
  assert.deepEqual(M.verdictOf([false, false, false]), { pass: false, failAt: 0 });
});

test('each example ends where its first failing gate is, with a note for every gate it reached', () => {
  const want = [-1, -1, 1, 0, 2];
  SCENE.examples.forEach((ex, i) => {
    const s = M.stateAt(endOf(i), YES);
    assert.equal(s.phase, 'example');
    assert.equal(s.example, i);
    assert.equal(s.failAt, want[i], ex.title);
    assert.equal(s.verdict, want[i] < 0 ? 'pass' : 'fail', ex.title);
    assert.equal(s.pos, want[i] < 0 ? 4 : want[i] + 1, ex.title);  // stopped at the gate, or through to the loop
    s.gates.forEach((g, k) => {
      if (want[i] >= 0 && k > want[i]) assert.equal(g, 'skip', `${ex.title} gate ${k}`);
      else assert.equal(g, ex.gates[k] ? 'pass' : 'fail', `${ex.title} gate ${k}`);
      if (g !== 'skip') assert.ok(ex.notes[k], `${ex.title}: note for gate ${k}`);
    });
    if (want[i] >= 0) assert.ok(ex.fix, `${ex.title}: a fix for the failing gate`);
  });
});

test('the reader\'s own problem follows the three buttons', () => {
  const end = M.duration();
  assert.equal(M.stateAt(end, YES).verdict, 'pass');
  assert.equal(M.stateAt(end, { fast: 'yes', honest: 'no', undo: 'yes' }).failAt, 1);
  assert.equal(M.stateAt(end, { fast: 'no', honest: 'no', undo: 'no' }).failAt, 0);
  assert.equal(M.stateAt(end, { fast: 'yes', honest: 'yes', undo: 'no' }).failAt, 2);
  assert.equal(M.stateAt(end).verdict, 'pass');  // no options yet: buttons default to yes
  assert.equal(M.stateAt(end, YES).phase, 'mine');
});

test('a gate lights only after the card reaches it', () => {
  const st = M.SCHED[0].start;
  const before = M.stateAt(st + M.ARRIVE[0] - 0.05, YES);
  assert.deepEqual(before.gates, ['idle', 'idle', 'idle']);
  assert.ok(before.pos > 0 && before.pos < 1);
  const checking = M.stateAt(st + M.ARRIVE[0] + 0.1, YES);
  assert.equal(checking.gates[0], 'check');
  assert.equal(checking.pos, 1);
  const lit = M.stateAt(st + M.ARRIVE[0] + M.RESULT + 0.01, YES);
  assert.equal(lit.gates[0], 'pass');
  assert.equal(lit.verdict, null);
});

test('duration and stops', () => {
  const st = M.stops();
  assert.equal(st[0], 0);
  assert.equal(st.length, 1 + 7 + 1);
  assert.ok(Math.abs(st[st.length - 1] - M.duration()) < 1e-9);
  assert.ok(M.duration() > 25 && M.duration() < 50, `duration ${M.duration()}`);
});

test('every stop lands on the start of its station (local === 0)', () => {
  M.stops().slice(1, -1).forEach((t, i) => {
    const s = M.stateAt(t, YES);
    assert.equal(s.local, 0, `stop ${i}`);
    assert.equal(s.phase, M.SCHED[i].key, `stop ${i}`);
    if (s.phase === 'example') {
      assert.equal(s.example, i);
      assert.equal(s.pos, 0);
      assert.deepEqual(s.gates, ['idle', 'idle', 'idle']);
    }
  });
  assert.equal(M.stateAt(0, YES).phase, 'intro');
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 19.9, 3.1, M.duration(), 12.0, 28.4];
  const o = { fast: 'yes', honest: 'no', undo: 'yes' };
  const a = ts.map(t => JSON.stringify(M.stateAt(t, o)));
  const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t, o))).reverse();
  assert.deepEqual(a, b);
});
