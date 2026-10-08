const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const PM = require('../../docs/assets/explain/autoresearch/progress-model.js');

const ROOT = path.join(__dirname, '../../explain-src/autoresearch');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/progress.json'), 'utf8'));
const SCENE = JSON.parse(fs.readFileSync(path.join(ROOT, 'scenes/progress.json'), 'utf8'));
const TRANSCRIPT = fs.readFileSync(path.join(ROOT, 'sources/progress-transcript.md'), 'utf8');
const SEED_X = SCENE.cards.find(c => c.seed).x;
const M = PM.create(DATA, { seedX: SEED_X });

const keepInData = DATA.points.filter(p => p.status === 'keep').length;
const discardInData = DATA.points.filter(p => p.status === 'discard').length;

test('the data is the progress.png reading: 15 green dots, as in the figure title', () => {
  assert.equal(keepInData, 15);
  assert.equal(keepInData, DATA.kept_in_title);
  assert.equal(M.KEPT.length, keepInData);
  assert.equal(M.POINTS.length, DATA.points.length);
});

test('green dots drawn at the end = kept rows in progress.json', () => {
  const end = M.stateAt(M.duration());
  const vis = M.visible(end);
  assert.equal(vis.filter(p => p.status === 'keep').length, keepInData);
  assert.equal(vis.filter(p => p.status === 'discard').length, discardInData);
  assert.equal(end.kept, keepInData);
  assert.equal(end.discarded, discardInData);
});

test('the figure was filtered: fewer grey dots than 83 - 15', () => {
  assert.equal(M.NOT_KEPT, 83 - 15);
  assert.equal(M.GREY_DRAWN, 62);
  assert.ok(M.GREY_DRAWN < M.NOT_KEPT);
  assert.equal(M.NOT_KEPT - M.GREY_DRAWN, M.HIDDEN.length);  // the 6 empty x positions
  assert.deepEqual(M.HIDDEN, [1, 15, 20, 41, 62, 70]);
  // analysis.ipynb draws only val_bpb <= baseline + 0.0005
  assert.ok(Math.abs(M.CUT - (0.99789 + 0.0005)) < 1e-12);
  M.POINTS.forEach(p => assert.ok(p.bpb <= M.CUT + M.ERROR, `x=${p.x}`));
});

test('one card per kept dot, same order as the labels in the figure', () => {
  assert.deepEqual(SCENE.cards.map(c => c.x), M.KEPT.map(k => k.x));
  let at = -1;
  SCENE.cards.forEach(c => {
    const i = TRANSCRIPT.indexOf(c.label.quote, at + 1);
    assert.ok(i > at, `label out of order or missing: ${c.label.quote}`);
    at = i;
  });
  assert.equal(SCENE.cards.find(c => c.seed).label.quote, 'random seed 42→137');
});

test('running best and drops (from the readings)', () => {
  assert.equal(M.KEPT[0].drop, null);
  assert.equal(M.BASELINE, 0.99789);
  assert.equal(M.stateAt(M.duration()).best, 0.97728);
  assert.ok(Math.abs(M.SEED_DROP - 0.00043) < 1e-9);
  // kept improvements smaller than "only the random seed changed"
  assert.deepEqual(M.SMALLER_THAN_SEED.map(k => k.x), [39, 65, 67]);
});

test('duration and stops', () => {
  const st = M.stops();
  assert.equal(st[0], 0);
  assert.ok(Math.abs(st[st.length - 1] - M.duration()) < 1e-9);
  assert.equal(st.length, 1 + 15 + 3 + 1);  // start, 15 kept dots, seed / filter / outro, end
  for (let i = 1; i < st.length; i++) assert.ok(st[i] > st[i - 1]);
  assert.ok(M.duration() > 30 && M.duration() < 60, `duration ${M.duration()}`);
});

test('every stop lands on the start of its station (local === 0)', () => {
  const st = M.stops().slice(1, -1);
  st.forEach((t, i) => {
    const s = M.stateAt(t);
    assert.equal(s.local, 0, `stop ${i}`);
    if (i < 15) {
      assert.equal(s.phase, 'keep', `stop ${i}`);
      assert.equal(s.focus, i, `stop ${i}`);
      assert.equal(s.cursor, M.KEPT[i].x, `stop ${i}`);
      assert.equal(s.kept, i + 1, `stop ${i}: the dot of this stop is already drawn`);
    } else {
      assert.equal(s.phase, ['seed', 'filter', 'outro'][i - 15], `stop ${i}`);
    }
  });
});

test('intro draws nothing; the seed station spotlights the seed dot', () => {
  const a = M.stateAt(0);
  assert.equal(a.phase, 'intro');
  assert.equal(M.visible(a).length, 0);
  assert.equal(a.focus, -1);
  const s = M.stateAt(M.stops()[16] + 0.5);
  assert.equal(s.phase, 'seed');
  assert.equal(M.KEPT[s.focus].x, SEED_X);
});

test('between two kept dots the cursor sweeps and grey dots appear in order', () => {
  const t = M.stops()[5] + M.HOLD + 4.5 * M.PER_X;  // kept #14, after the hold, 4.5 x-units on
  const s = M.stateAt(t);
  assert.equal(s.phase, 'keep');
  assert.ok(Math.abs(s.cursor - 18.5) < 1e-9);
  assert.deepEqual(M.visible(s).slice(-3).map(p => p.x), [16, 17, 18]);
  assert.equal(s.focus, 4);
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 19.9, 3.1, M.duration(), 12.0, 33.3];
  const a = ts.map(t => JSON.stringify(M.stateAt(t)));
  const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t))).reverse();
  assert.deepEqual(a, b);
});
