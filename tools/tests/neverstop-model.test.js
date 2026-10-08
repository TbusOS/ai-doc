const test = require('node:test');
const assert = require('node:assert');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/neverstop-model.js');

const STATIONS = ['first', 'ask', 'night', 'wake', 'idea1', 'idea2', 'idea3', 'idea4'];
const ASK = { allowAsk: true };

test('stops: 0, the start of every station, the end', () => {
  const st = M.stops();
  assert.equal(st[0], 0);
  assert.equal(st.length, STATIONS.length + 2);
  assert.ok(Math.abs(st[st.length - 1] - M.duration()) < 1e-9);
});

test('every stop lands on the start of its station (local === 0)', () => {
  M.stops().slice(1, -1).forEach((t, i) => {
    for (const opts of [{}, ASK]) {
      const s = M.stateAt(t, opts);
      assert.equal(s.station, STATIONS[i], `stop ${i}`);
      assert.equal(s.local, 0, `stop ${i}`);
    }
  });
});

test('clock: 22:00 start, 22:05 first run done, 22:10, 06:00 wake', () => {
  const st = M.stops();
  assert.equal(M.stateAt(st[1]).clock, '22:00');
  assert.equal(M.stateAt(st[2]).clock, '22:05');
  assert.equal(M.stateAt(st[3]).clock, '22:10');
  assert.equal(M.stateAt(st[4]).clock, '06:00');
  assert.equal(M.stateAt(M.duration()).clock, '06:00');
});

test('NEVER STOP: one run every 5 minutes, 96 by 06:00 (illustrative)', () => {
  assert.equal(M.stateAt(M.stops()[2]).done, 1);
  assert.equal(M.stateAt(M.stops()[3]).done, 2);
  assert.equal(M.stateAt(M.duration()).done, 96);
  assert.equal(M.stateAt(M.duration()).total, 96);
});

test('allowed to ask: it asks after run 1, nobody answers, the count stays at 1', () => {
  const s = M.stateAt(M.duration(), ASK);
  assert.equal(s.done, 1);
  assert.equal(s.asking, true);
  assert.equal(s.waitMin, 475);  // 22:05 -> 06:00
  assert.equal(M.stateAt(M.stops()[2] - 1e-6, ASK).asking, false);
});

test('bubble: a real question when allowed to ask, a struck-out one only at the ask station otherwise', () => {
  const st = M.stops();
  assert.equal(M.stateAt(st[2] + 0.5, ASK).bubble, 'ask');
  assert.equal(M.stateAt(st[3] + 2, ASK).bubble, 'ask');
  assert.equal(M.stateAt(st[2] + 0.5).bubble, 'struck');
  assert.equal(M.stateAt(st[3] + 2).bubble, null);
  assert.equal(M.stateAt(st[1] + 0.5).bubble, null);
});

test('the four "out of ideas" cards appear one per station', () => {
  const st = M.stops();
  assert.equal(M.stateAt(st[4]).ideas, 0);
  assert.equal(M.stateAt(st[5]).ideas, 1);
  assert.equal(M.stateAt(st[7]).ideas, 3);
  assert.equal(M.stateAt(M.duration()).ideas, 4);
  assert.equal(M.IDEAS, 4);
});

test('the person is asleep all night and awake at 06:00', () => {
  const st = M.stops();
  assert.equal(M.stateAt(st[3] + 1).awake, false);
  assert.equal(M.stateAt(st[4]).awake, true);
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 15.9, 3.1, M.duration(), 12.4];
  const a = ts.map(t => JSON.stringify(M.stateAt(t, ASK)));
  const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t, ASK))).reverse();
  assert.deepEqual(a, b);
});
