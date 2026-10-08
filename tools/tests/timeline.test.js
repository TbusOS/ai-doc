const test = require('node:test');
const assert = require('node:assert');
const T = require('../../docs/assets/explain/timeline.js');

test('clamp', () => {
  assert.equal(T.clamp(5, 0, 3), 3);
  assert.equal(T.clamp(-1, 0, 3), 0);
  assert.equal(T.clamp(2, 0, 3), 2);
});

test('progress', () => {
  assert.equal(T.progress(0, 1, 2), 0);
  assert.equal(T.progress(2, 1, 2), 0.5);
  assert.equal(T.progress(9, 1, 2), 1);
  assert.equal(T.progress(1, 1, 0), 1);
  assert.equal(T.progress(0.5, 1, 0), 0);
});

test('ease endpoints and monotonic midpoint', () => {
  for (const f of [T.ease.inOut, T.ease.out]) {
    assert.equal(f(0), 0);
    assert.equal(f(1), 1);
    assert.ok(f(0.5) > 0 && f(0.5) < 1);
  }
});

test('schedule + locate', () => {
  const s = T.schedule([{ key: 'a', dur: 1 }, { key: 'b', dur: 2 }], 0.5);
  assert.deepEqual(s.map(x => [x.key, x.start, x.end]), [['a', 0.5, 1.5], ['b', 1.5, 3.5]]);
  const l = T.locate(s, 2.5);
  assert.equal(l.item.key, 'b');
  assert.equal(l.local, 0.5);
  assert.equal(T.locate(s, 0).index, 0);
  assert.equal(T.locate(s, 0).local, 0);
  assert.equal(T.locate(s, 99).index, 1);
  assert.equal(T.locate(s, 99).local, 1);
  assert.equal(T.locate(s, 1.5).item.key, 'b');
});

test('stops', () => {
  const st = [0, 1, 2.5, 4];
  assert.equal(T.nextStop(st, 1), 2.5);
  assert.equal(T.prevStop(st, 1), 0);
  assert.equal(T.nextStop(st, 4), 4);
  assert.equal(T.prevStop(st, 0), 0);
  assert.equal(T.nextStop(st, 1.2), 2.5);
  assert.equal(T.prevStop(st, 1.2), 1);
});
