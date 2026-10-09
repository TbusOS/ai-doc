// Sound cues of a scene, in scene seconds, read off the scene's own model.
//   node tools/reel/scene_events.mjs intro loop budget vocab   -> JSON { scene: [[t, cue], ...] }
//
// Every scene is a pure function stateAt(t); stepping it at 1/200 s and watching a few
// fields change gives the moments a sound belongs to (an edit starts, a run is kept, the
// 5-minute clock runs out, the scissors cut). Cues are names; tools/reel/sound.py turns them
// into sound. Controls stay at their defaults, as on the page and in capture mode.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
global.ExplainTimeline = require(join(root, 'docs/assets/explain/timeline.js'));
const model = id => require(join(root, `docs/assets/explain/autoresearch/${id}-model.js`));
const DT = 1 / 200;
// options the scene passes to its model on the page (intro.js: the points of data/progress.json)
const points = JSON.parse(readFileSync(join(root, 'explain-src/autoresearch/data/progress.json'), 'utf8')).points;
const OPTS = { intro: { points } };

// one function per scene: (previous state, state) -> cue names
const RULES = {
  intro(a, b) {
    const out = [];
    if (b.station === 'first' && b.step !== a.step) {
      if (b.step === 'edit') out.push('typing');
      if (b.step === 'train' || b.step === 'asis') out.push('whir');
      if (b.step === 'compare') out.push('tick');
      if (b.step === 'record') out.push('soft');
      if (b.step === 'verdict') out.push(b.verdict === 'keep' ? 'keep' : 'discard');
    }
    if (b.station === 'night' && b.kept > a.kept) out.push('pop');
    if (b.station === 'morning' && a.station !== 'morning') out.push('birds', 'sunrise');
    return out;
  },
  loop(a, b) {
    const out = [];
    if (b.station !== a.station && b.station) {
      out.push({ edit: 'typing', commit: 'click', train: 'whir', read: 'swish', log: 'pen', git: null, decide: null }[b.station]);
    }
    if (b.verdict && b.verdict !== a.verdict) out.push({ baseline: 'soft', keep: 'keep', discard: 'discard', crash: 'crash' }[b.verdict]);
    if (b.station === 'git' && a.station !== 'git') out.push(b.verdict === 'keep' || b.verdict === 'baseline' ? 'advance' : 'rewind');
    return out.filter(Boolean);
  },
  budget(a, b) {
    const out = [];
    if (b.station === 'race' && a.station !== 'race') out.push('start');
    if (b.station === 'after' && a.station !== 'after') out.push('bell');
    if (b.revealed && !a.revealed) out.push('keep');
    if (b.station === 'hour' && a.station !== 'hour') out.push('whoosh');
    return out;
  },
  vocab(a, b) {
    const out = [];
    for (let i = (a.cuts || []).length; i < (b.cuts || []).length; i++) out.push('snip');
    if (b.verdict && b.verdict !== a.verdict) out.push('balance');
    return out;
  },
};

function eventsOf(id) {
  const M = model(id);
  const rule = RULES[id];
  if (!rule) return [];
  const ev = [];
  const opts = OPTS[id] || {};
  let prev = M.stateAt(0, opts);
  for (let i = 1; i * DT <= M.duration() + 1e-9; i++) {
    const t = i * DT, s = M.stateAt(t, opts);
    for (const cue of rule(prev, s)) ev.push([+t.toFixed(3), cue]);
    prev = s;
  }
  return ev;
}

const ids = process.argv.slice(2);
const out = Object.fromEntries(ids.map(id => [id, eventsOf(id)]));
process.stdout.write(JSON.stringify(out));
