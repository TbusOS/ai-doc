const test = require('node:test');
const assert = require('node:assert');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/simplicity-model.js');

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg || ''} ${a} != ${b}`);
const at = (slot, station) => M.SCHED.find(s => s.key === station && s.slot === slot);

test('four cards in program.md order, each with the conclusion program.md gives', () => {
  assert.deepEqual(M.CARDS.map(c => [c.id, c.says]), [
    ['ugly', 'reject'], ['hacky', 'reject'], ['delete', 'keep'], ['simpler', 'keep']
  ]);
});

test('the scale tips the way program.md concludes: benefit side down = keep, cost side down = not worth it', () => {
  M.CARDS.forEach(c => {
    assert.equal(M.weighs(c), c.says, c.id);
    // SVG rotate: positive = clockwise = right (cost) pan goes down
    if (c.says === 'keep') assert.ok(M.tiltFor(c) < 0, c.id);
    else assert.ok(M.tiltFor(c) > 0, c.id);
  });
});

test('deleting code is a negative cost (it lifts the cost pan)', () => {
  assert.ok(M.CARDS[2].cost < 0);
  assert.ok(M.CARDS[3].cost < 0);
  assert.equal(M.CARDS[3].gain, 0);  // "an improvement of ~0"
});

test('duration and stops', () => {
  const st = M.stops();
  assert.equal(st[0], 0);
  close(st[st.length - 1], M.duration());
  assert.equal(M.SCHED.length, 4 * 2 + 1);
  assert.equal(st.length, M.SCHED.length + 2);
});

test('every stop lands on the start of its station (no float drift)', () => {
  M.stops().slice(1, -1).forEach((t, i) => {
    const s = M.stateAt(t);
    assert.equal(s.station, M.SCHED[i].key, `stop ${i}`);
    assert.equal(s.local, 0, `stop ${i}`);
  });
});

test('intro: empty scale, level beam', () => {
  const s = M.stateAt(0.2);
  assert.equal(s.phase, 'intro');
  assert.equal(s.card, -1);
  assert.equal(s.angle, 0);
});

test('tour: each card is on the scale in its own slot and has settled by its verdict', () => {
  M.CARDS.forEach((c, i) => {
    const v = M.stateAt(at(i, 'verdict').start);
    assert.equal(v.card, i);
    close(v.angle, M.tiltFor(c), c.id);
    const w = M.stateAt(at(i, 'weigh').start + 0.05);
    assert.equal(w.card, i);
  });
});

test('verdict stamp shows during the verdict station and badges collect on the deck', () => {
  const v = M.stateAt(at(1, 'verdict').start + 0.8);
  assert.ok(v.stamp > 0);
  assert.deepEqual(v.done, [true, true, false, false]);
  const end = M.stateAt(M.duration());
  assert.equal(end.phase, 'outro');
  assert.deepEqual(end.done, [true, true, true, true]);
});

test('picking a card puts that card on the scale for the whole run', () => {
  const s = M.stateAt(at(2, 'weigh').start + 0.4, { card: '4' });
  assert.equal(s.card, 3);
  close(s.angle, M.tiltFor(M.CARDS[3]));
  const end = M.stateAt(M.duration(), { card: '1' });
  assert.equal(end.card, 0);
  close(end.angle, M.tiltFor(M.CARDS[0]));
  assert.deepEqual(end.done, [true, false, false, false]);
  assert.equal(end.picked, true);
});

test('a picked card is still weighed in slot 1, so play shows it landing', () => {
  const s = M.stateAt(at(0, 'weigh').start + 0.01, { card: '3' });
  assert.equal(s.card, 2);
  assert.ok(Math.abs(s.angle) < Math.abs(M.tiltFor(M.CARDS[2])));
});

test('without the simplicity criterion (score only) cards 1, 2 flip to keep and card 4 to reset', () => {
  const so = M.CARDS.map(c => M.weighs(c, true));
  assert.deepEqual(so, ['keep', 'keep', 'keep', 'reject']);
  assert.ok(M.tiltFor(M.CARDS[0], true) < 0);
  assert.equal(M.tiltFor(M.CARDS[3], true), 0);  // ~0 improvement: level beam, equal -> git reset
  const v = M.stateAt(at(0, 'verdict').start + 0.5, { scoreOnly: true });
  assert.equal(v.verdict, 'keep');
  assert.equal(v.agrees, false);
  const v3 = M.stateAt(at(2, 'verdict').start + 0.5, { scoreOnly: true });
  assert.equal(v3.agrees, true);
  const d = M.stateAt(at(0, 'verdict').start + 0.5);
  assert.equal(d.verdict, 'reject');
  assert.equal(d.agrees, true);
});

test('stage card text is the verbatim program.md quote', () => {
  const copy = require('../../explain-src/autoresearch/scenes/simplicity.json');
  assert.equal(copy.cards.length, M.CARDS.length);
  copy.cards.forEach((c, i) => {
    assert.equal(c.example + ' ' + c.says_en, c.quote, `card ${i + 1}`);
    assert.equal(c.source, 'program.md');
  });
});

test('badges say what program.md says: card 2 is only "probably" not worth it', () => {
  assert.deepEqual(M.CARDS.map(c => M.badgeOf(c)), ['reject', 'probably', 'keep', 'keep']);
  assert.deepEqual(M.CARDS.map(c => M.badgeOf(c, true)), ['keep', 'keep', 'keep', 'reset']);
  const copy = require('../../explain-src/autoresearch/scenes/simplicity.json');
  for (const k of ['reject', 'probably', 'keep', 'reset']) assert.ok(copy.stamps[k], k);
  assert.equal(copy.stamps[M.badgeOf(M.CARDS[1])], copy.cards[1].says_zh);  // 大概不值 (Probably not worth it)
});

test('copy: card 1 is the general rule, not one of "four examples"; score-only says it treats ≈0 as equal', () => {
  const copy = require('../../explain-src/autoresearch/scenes/simplicity.json');
  assert.ok(!/四个例子/.test(JSON.stringify(copy)));
  const toggle = copy.controls.find(c => c.option === 'scoreOnly');
  assert.ok(/≈0/.test(toggle.note) && /持平/.test(toggle.note) && /假设/.test(toggle.note), toggle.note);
});

test('copy: the cards are not "on the right" (they sit under the scale on a phone)', () => {
  const copy = require('../../explain-src/autoresearch/scenes/simplicity.json');
  assert.ok(!/右边的卡片/.test(JSON.stringify(copy.controls)));
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 13.9, 3.1, M.duration(), 5.0, 11.2];
  for (const o of [{}, { card: '2' }]) {
    const a = ts.map(t => JSON.stringify(M.stateAt(t, o)));
    const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t, o))).reverse();
    assert.deepEqual(a, b);
  }
});
