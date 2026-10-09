const test = require('node:test');
const assert = require('node:assert');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/limits-model.js');

const endOfRounds = () => M.SCHED[M.ROUNDS - 1].end - 1e-6;

test('the terrain (示意): a near valley, a hill, a deeper valley beyond it', () => {
  const h = M.H;
  assert.equal(h.length, M.N);
  const [shallow, near, deep] = M.VALLEYS;
  assert.ok(h[deep] < h[near] && h[near] < h[shallow]);
  // between the near valley and the deep one the terrain climbs above the near valley first
  const between = h.slice(near + 1, deep);
  assert.ok(Math.max(...between) > h[near] + 0.3);
  M.VALLEYS.forEach(v => assert.ok(h[v - 1] > h[v] && h[v + 1] > h[v], `valley ${v}`));
});

test('the ball only ever moves downhill (only a lower score is kept)', () => {
  for (const start of Object.keys(M.STARTS)) {
    const path = M.path(start);
    for (let i = 1; i < path.length; i++) assert.ok(M.H[path[i]] < M.H[path[i - 1]], `${start} step ${i}`);
  }
});

test('each start stops in its nearest valley after the same number of rounds', () => {
  const want = { here: M.VALLEYS[1], left: M.VALLEYS[0], far: M.VALLEYS[2] };
  for (const start of Object.keys(M.STARTS)) {
    const path = M.path(start);
    assert.equal(path.length - 1, M.ROUNDS - 1, `${start}: moves`);
    const s = M.stateAt(endOfRounds(), { start });
    assert.equal(s.ball, want[start], start);
    assert.equal(s.stuck, true, start);
    assert.ok(s.tries.every(tr => !tr.lower), `${start}: both neighbours are higher at the end`);
  }
});

test('the default start ("here") cannot reach the deep valley', () => {
  const s = M.stateAt(M.duration());
  assert.equal(s.ball, M.VALLEYS[1]);
  assert.ok(M.H[s.ball] > M.H[M.VALLEYS[2]]);
});

test('a round: two small tries, judged, then the ball slides to the lower one', () => {
  const r0 = M.SCHED[0].start;
  const a = M.stateAt(r0 + 0.2, { start: 'here' });
  assert.equal(a.phase, 'round');
  assert.deepEqual(a.tries.map(tr => tr.i), [M.STARTS.here - 1, M.STARTS.here + 1]);
  assert.equal(a.judged, false);
  const b = M.stateAt(r0 + M.JUDGE + 0.01, { start: 'here' });
  assert.equal(b.judged, true);
  assert.deepEqual(b.tries.map(tr => tr.lower), [true, false]);
  assert.equal(b.ball, M.STARTS.here);
  const c = M.stateAt(M.SCHED[0].end - 1e-6, { start: 'here' });
  assert.equal(c.ball, M.STARTS.here - 1);
});

test('stations: rounds, reveal, three boundary cards, outro', () => {
  assert.deepEqual(M.SCHED.map(s => s.key), ['round', 'round', 'round', 'round', 'round', 'reveal', 'card', 'card', 'card', 'outro']);
  const st = M.stops();
  assert.equal(st[0], 0);
  assert.equal(st.length, 1 + M.SCHED.length + 1);
  assert.ok(Math.abs(st[st.length - 1] - M.duration()) < 1e-9);
  assert.ok(M.duration() > 20 && M.duration() < 45, `duration ${M.duration()}`);
});

test('every stop lands on the start of its station (local === 0)', () => {
  M.stops().slice(1, -1).forEach((t, i) => {
    const s = M.stateAt(t, { start: 'here' });
    assert.equal(s.local, 0, `stop ${i}`);
    assert.equal(s.phase, M.SCHED[i].key, `stop ${i}`);
    if (s.phase === 'round') assert.equal(s.round, i);
  });
});

test('boundary cards light up one by one', () => {
  const at = k => M.stateAt(M.SCHED[k].start + 0.5);
  assert.equal(at(0).card, 0);           // the terrain is boundary 1
  assert.equal(at(5).card, 0);           // reveal
  assert.equal(at(6).card, 1);
  assert.equal(at(8).card, 3);
  assert.equal(at(8).cardsShown, 4);
  assert.equal(M.stateAt(M.duration()).card, -1);
  assert.equal(M.stateAt(M.duration()).cardsShown, 4);
  assert.ok(at(5).fog < 1 && M.stateAt(M.SCHED[4].start).fog === 1);
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 19.9, 3.1, M.duration(), 12.0, 14.4];
  const a = ts.map(t => JSON.stringify(M.stateAt(t, { start: 'far' })));
  const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t, { start: 'far' }))).reverse();
  assert.deepEqual(a, b);
});

const copy = require('../../explain-src/autoresearch/scenes/limits.json');

test('copy: only cards 3 and 4 are written in the original; card 2 is our reading', () => {
  assert.ok(!copy.body.some(p => /后三条/.test(p)), 'card 2 is tagged 解读, README only says "in that time budget"');
  assert.equal(copy.cards[1].tag, '解读');
  assert.ok(copy.body.some(p => /第三、四条/.test(p) && /第二条是我们/.test(p)));
});

test('copy: card 1 does not say "a little at a time" (program.md asks for radical changes too)', () => {
  const all = JSON.stringify(copy);
  assert.ok(!/只改一点|附近小步试/.test(all), 'program.md: try more radical architectural changes');
  assert.ok(/马上变好/.test(copy.cards[0].title));
});

test('copy: README lists forks for macOS, Windows and AMD; it does not say Windows needs one', () => {
  assert.ok(!/要用社区/.test(JSON.stringify(copy)));
  assert.ok(/README 列了 macOS、Windows、AMD/.test(copy.cards[3].body));
});
