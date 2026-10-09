const test = require('node:test');
const assert = require('node:assert');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/neverstop-model.js');

const STATIONS = ['first', 'ask', 'night', 'idea1', 'idea2', 'idea3', 'idea4', 'wake'];
const stopOf = key => M.stops()[STATIONS.indexOf(key) + 1];
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

test('clock: 22:00 start, 22:05 first run done, 22:10, ideas from 02:00, 06:00 wake', () => {
  const st = M.stops();
  assert.equal(M.stateAt(st[1]).clock, '22:00');
  assert.equal(M.stateAt(st[2]).clock, '22:05');
  assert.equal(M.stateAt(st[3]).clock, '22:10');
  assert.equal(M.stateAt(stopOf('idea1')).clock, '02:00');
  assert.equal(M.stateAt(stopOf('wake')).clock, '06:00');
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
  assert.equal(M.stateAt(stopOf('idea1') - 1e-6).ideas, 0);
  assert.equal(M.stateAt(stopOf('idea1')).ideas, 1);
  assert.equal(M.stateAt(stopOf('idea3')).ideas, 3);
  assert.equal(M.stateAt(stopOf('wake') - 1e-6).ideas, 4);
  assert.equal(M.IDEAS, 4);
});

test('the cards come during the night, while the person sleeps and the runs keep counting', () => {
  let last = M.stateAt(stopOf('idea1') - 1e-6).done;
  for (const k of [1, 2, 3, 4]) {
    const a = M.stateAt(stopOf('idea' + k)), b = M.stateAt(stopOf('idea' + k) + 0.5);
    for (const s of [a, b]) {
      assert.equal(s.awake, false, `idea${k}`);
      assert.ok(s.minute < M.NIGHT_MIN, `idea${k} before 06:00`);
      assert.equal(s.phase, 'run', `idea${k}: the night is still running`);
    }
    assert.ok(b.done > last, `idea${k}: runs keep counting`);
    last = b.done;
  }
});

test('waking up at 06:00 closes the scene: 96 runs on the screen, the cards put away', () => {
  const s = M.stateAt(stopOf('wake'));
  assert.equal(s.awake, true);
  assert.equal(s.done, 96);
  assert.equal(s.ideas, 0);
  assert.equal(M.stateAt(M.duration()).station, 'wake');
});

test('allowed to ask: it is waiting, so the idea stations keep showing the wait', () => {
  for (const k of [1, 2, 3, 4]) {
    const s = M.stateAt(stopOf('idea' + k) + 0.3, ASK);
    assert.equal(s.asking, true);
    assert.equal(s.done, 1);
    assert.equal(s.ideas, 0);
  }
});

test('the person is asleep all night and awake at 06:00', () => {
  assert.equal(M.stateAt(stopOf('night') + 1).awake, false);
  assert.equal(M.stateAt(stopOf('idea4') + 0.5).awake, false);
  assert.equal(M.stateAt(stopOf('wake')).awake, true);
});

test('copy: the text version tells the ideas before the wake-up, and no left / right', () => {
  const copy = require('../../explain-src/autoresearch/scenes/neverstop.json');
  const tr = copy.transcript.join('\n');
  assert.ok(tr.indexOf('没点子') >= 0 && tr.indexOf('没点子') < tr.indexOf('06:00 醒来'));
  assert.ok(!/左边|右边/.test(copy.stage_label));
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 15.9, 3.1, M.duration(), 12.4];
  const a = ts.map(t => JSON.stringify(M.stateAt(t, ASK)));
  const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t, ASK))).reverse();
  assert.deepEqual(a, b);
});
