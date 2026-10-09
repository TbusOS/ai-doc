const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/files-model.js');

const SRC = path.join(__dirname, '../../explain-src/autoresearch');
const norm = s => s.split(/\s+/).filter(Boolean).join(' ');
const startOf = k => M.SCHED[M.STATIONS.indexOf(k)].start;

test('stations: intro, the three files in order, then the one-line definition', () => {
  assert.deepEqual(M.STATIONS, ['intro', 'prepare', 'train', 'program', 'essence']);
  assert.deepEqual(M.FILES, ['prepare', 'train', 'program']);
});

test('stops: 0 first, duration last, each lands on the start of its station', () => {
  const st = M.stops();
  assert.equal(st[0], 0);
  assert.equal(st[st.length - 1], M.duration());
  assert.equal(st.length, M.STATIONS.length + 1);
  st.slice(0, -1).forEach((t, i) => {
    const s = M.stateAt(t);
    assert.equal(s.station, M.STATIONS[i], `stop ${i}`);
    assert.equal(s.local, 0, `stop ${i}`);
  });
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 13.9, 3.1, M.duration(), 9.05, 0];
  for (const o of [{}, { usual: true }]) {
    const a = ts.map(t => JSON.stringify(M.stateAt(t, o)));
    const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t, o))).reverse();
    assert.deepEqual(a, b);
  }
});

test('autoresearch: nobody edits prepare.py, only the AI edits train.py, only the human edits program.md', () => {
  const s = M.stateAt(M.duration());
  assert.deepEqual(s.cards.prepare.editors, []);
  assert.deepEqual(s.cards.train.editors, ['ai']);
  assert.deepEqual(s.cards.program.editors, ['human']);
  const byAi = M.FILES.filter(f => s.cards[f].editors.includes('ai'));
  const byHuman = M.FILES.filter(f => s.cards[f].editors.includes('human'));
  assert.deepEqual(byAi, ['train']);
  assert.deepEqual(byHuman, ['program']);
  assert.ok(M.FILES.every(f => s.cards[f].used));
});

test('the usual way: the researcher edits train.py, no AI, program.md is not needed', () => {
  const s = M.stateAt(M.duration(), { usual: true });
  assert.equal(s.mode, 'usual');
  assert.deepEqual(s.cards.prepare.editors, []);
  assert.deepEqual(s.cards.train.editors, ['human']);
  assert.deepEqual(s.cards.program.editors, []);
  assert.equal(s.cards.program.used, false);
  assert.ok(M.FILES.every(f => !s.cards[f].editors.includes('ai')));
});

test('each card lights up at its own station and stays lit; focus follows the station', () => {
  M.FILES.forEach((f, i) => {
    const s = M.stateAt(startOf(f) + 0.5);
    assert.equal(s.focus, f);
    M.FILES.forEach((g, j) => assert.equal(s.cards[g].lit, j <= i, `${f}: ${g}`));
  });
  const intro = M.stateAt(0.01);
  assert.ok(M.FILES.every(f => !intro.cards[f].lit));
  const end = M.stateAt(M.duration());
  assert.equal(end.focus, null);
  assert.ok(M.FILES.every(f => end.cards[f].lit && end.cards[f].appear === 1));
  assert.ok(end.banner > 0.99);
  assert.equal(M.stateAt(startOf('program') + 0.5).banner, 0);
});

test('the edit in train.py happens during the train station and then stays', () => {
  assert.equal(M.stateAt(startOf('prepare') + 1).edit, 0);
  assert.equal(M.stateAt(startOf('train')).edit, 0);
  const mid = M.stateAt(startOf('train') + 0.55 * M.DURS.train).edit;
  assert.ok(mid > 0 && mid < 1);
  assert.equal(M.stateAt(startOf('program')).edit, 1);
  assert.equal(M.stateAt(M.duration()).edit, 1);
});

test('every code line on the cards is copied verbatim from the source file', () => {
  const scene = JSON.parse(fs.readFileSync(path.join(SRC, 'scenes/files.json'), 'utf8'));
  let n = 0;
  for (const f of M.FILES) {
    const card = scene.cards[f];
    assert.ok(card && card.code && card.code.length, `card ${f} has code`);
    for (const block of card.code) {
      const src = norm(fs.readFileSync(path.join(SRC, 'sources', block.source), 'utf8'));
      assert.ok(src.includes(norm(block.quote)), `${f}: quote not in ${block.source}`);
      const shown = norm(block.show.join(' '));
      assert.ok(norm(block.quote).includes(shown), `${f}: shown text "${shown}" is not part of its quote`);
      n += block.show.length;
    }
  }
  assert.ok(n >= 12);
});

test('the train.py edit is the real kept change warmdown 0.5→0.7', () => {
  const scene = JSON.parse(fs.readFileSync(path.join(SRC, 'scenes/files.json'), 'utf8'));
  const ed = scene.cards.train.edit;
  assert.equal(ed.from, '0.5');
  assert.equal(ed.to, '0.7');
  const transcript = fs.readFileSync(path.join(SRC, 'sources/progress-transcript.md'), 'utf8');
  assert.ok(transcript.includes('warmdown 0.5→0.7'));
  const line = scene.cards.train.code.flatMap(b => b.show).find(l => l.startsWith('WARMDOWN_RATIO'));
  assert.equal(line, 'WARMDOWN_RATIO = 0.5');
});
