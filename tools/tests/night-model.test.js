const test = require('node:test');
const assert = require('node:assert');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/night-model.js');

const STATIONS = ['evening', 'first', 'night', 'wake'];

test('README: approx 12 experiments per hour, one every 5 minutes', () => {
  assert.equal(M.PER_HOUR, 12);
  assert.equal(M.RUN_MIN, 5);
});

test('stops: 0, the start of every station, the end', () => {
  const st = M.stops();
  assert.equal(st[0], 0);
  assert.equal(st.length, STATIONS.length + 2);
  assert.ok(Math.abs(st[st.length - 1] - M.duration()) < 1e-9);
});

test('every stop lands on the start of its station (local === 0)', () => {
  const st = M.stops().slice(1, -1);
  st.forEach((t, i) => {
    const s = M.stateAt(t);
    assert.equal(s.station, STATIONS[i], `stop ${i}`);
    assert.equal(s.local, 0, `stop ${i}`);
  });
});

test('clock: 21:00 evening, 22:00 asleep, 22:05 after the first run, wake = 22:00 + hours', () => {
  const st = M.stops();
  assert.equal(M.stateAt(st[1]).clock, '21:00');
  assert.equal(M.stateAt(st[2]).clock, '22:00');
  assert.equal(M.stateAt(st[3]).clock, '22:05');
  assert.equal(M.stateAt(M.duration()).clock, '06:00');
  assert.equal(M.stateAt(M.duration(), { hours: 10 }).clock, '08:00');
  assert.equal(M.stateAt(M.duration(), { hours: 4 }).clock, '02:00');
});

test('the human does 2 runs before bed (illustrative) and none while asleep', () => {
  const st = M.stops();
  assert.equal(M.stateAt(st[1]).humanDone, 0);
  assert.equal(M.stateAt(st[2]).humanDone, 2);
  assert.equal(M.stateAt(M.duration()).humanDone, 2);
  assert.equal(M.stateAt(st[2]).asleep, true);
  assert.equal(M.stateAt(st[1] + 0.5).asleep, false);
});

test('the first AI run is done at 22:05', () => {
  const st = M.stops();
  assert.equal(M.stateAt(st[2]).aiDone, 0);
  assert.equal(M.stateAt(st[3]).aiDone, 1);
});

test('morning count is 12 × hours for every slider value', () => {
  for (let h = 4; h <= 10; h++) {
    const s = M.stateAt(M.duration(), { hours: h });
    assert.equal(s.aiDone, 12 * h, `${h} h`);
    assert.equal(s.total, 12 * h, `${h} h`);
    assert.equal(s.humanDone, 2, `${h} h`);
  }
});

test('default sleep is 8 hours: 96 runs, the "approx 100" of README', () => {
  const s = M.stateAt(M.duration());
  assert.equal(s.hours, 8);
  assert.equal(s.aiDone, 96);
});

test('slider values outside 4–10 are clamped', () => {
  assert.equal(M.stateAt(M.duration(), { hours: 2 }).hours, 4);
  assert.equal(M.stateAt(M.duration(), { hours: 14 }).hours, 10);
});

test('the AI never runs faster than 12 an hour', () => {
  for (let t = 0; t <= M.duration(); t += 0.05) {
    const s = M.stateAt(t);
    const hoursAsleep = Math.max(0, s.minute - M.SLEEP_AT) / 60;
    assert.ok(s.aiDone <= 12 * hoursAsleep + 1e-9, `t=${t.toFixed(2)}`);
  }
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 13.9, 3.1, M.duration(), 5.0];
  const a = ts.map(t => JSON.stringify(M.stateAt(t, { hours: 6 })));
  const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t, { hours: 6 }))).reverse();
  assert.deepEqual(a, b);
});
