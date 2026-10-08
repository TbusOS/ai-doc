const test = require('node:test');
const assert = require('node:assert');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/context-model.js');

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg || ''} ${a} != ${b}`);
const seg = key => M.SCHED.find(s => s.key === key);
const endOf = key => seg(key).end - 1e-6;
const TEE = { tee: true };

test('duration and stops', () => {
  const st = M.stops();
  assert.equal(st[0], 0);
  close(st[st.length - 1], M.duration());
  assert.deepEqual(M.SCHED.map(s => s.key), ['r1', 'r2', 'r3', 'ff', 'outro']);
});

test('every stop lands on the start of its station (no float drift)', () => {
  M.stops().slice(1, -1).forEach((t, i) => {
    const s = M.stateAt(t);
    assert.equal(s.phase, M.SCHED[i].key, `stop ${i}`);
    assert.equal(s.local, 0, `stop ${i}`);
  });
});

test('intro: only the rules read at setup sit in the context', () => {
  const s = M.stateAt(0.5);
  assert.equal(s.round, 0);
  close(s.raw, M.RULES);
  assert.equal(s.full, false);
});

test('redirect + grep: each round adds only the two grep lines', () => {
  close(M.stateAt(endOf('r1')).raw, M.RULES + M.GREP);
  close(M.stateAt(endOf('r3')).raw, M.RULES + 3 * M.GREP);
  const mid = M.stateAt(seg('r2').start + 0.5 * (seg('r2').end - seg('r2').start));
  assert.equal(mid.sub, 'stream');
  close(mid.raw, M.RULES + M.GREP);  // the training output goes to run.log, not the context
});

test('grep pulls two lines from run.log; with tee there is no grep step', () => {
  const t = seg('r1').start + 0.8 * (seg('r1').end - seg('r1').start);
  const r = M.stateAt(t);
  assert.equal(r.sub, 'grep');
  assert.deepEqual(r.lines, ['val_bpb: 0.997900', 'peak_vram_mb: 45060.2']);
  assert.equal(M.stateAt(t, TEE).lines, null);
});

test('tee: the whole output pours into the context and it fills up during round 3', () => {
  const e2 = M.stateAt(endOf('r2'), TEE);
  close(e2.raw, M.RULES + 2 * M.TEE_ROUND);
  assert.equal(e2.full, false);
  const e3 = M.stateAt(endOf('r3'), TEE);
  close(e3.raw, M.RULES + 3 * M.TEE_ROUND);
  assert.equal(e3.full, true);
  assert.equal(e3.rulesGone, true);
  close(e3.used, M.CAP);
});

test('tee: the rules are the first thing pushed out', () => {
  const r3 = seg('r3');
  let sawPartial = false;
  for (let k = 0; k <= 60; k++) {
    const s = M.stateAt(r3.start + (r3.end - r3.start) * k / 60, TEE);
    close(s.dropped, Math.max(0, s.raw - M.CAP));
    if (s.dropped > 0 && s.dropped < M.RULES) { sawPartial = true; assert.equal(s.rulesGone, false); }
  }
  assert.ok(sawPartial);
});

test('after 100 rounds redirect + grep still leaves most of the context free', () => {
  const s = M.stateAt(M.duration());
  assert.equal(s.round, 100);
  close(s.raw, M.RULES + 100 * M.GREP);
  assert.ok(s.used <= 0.2 * M.CAP);
  assert.equal(s.full, false);
  const t = M.stateAt(M.duration(), TEE);
  assert.equal(t.round, 100);
  assert.equal(t.full, true);
});

test('visible blocks never exceed the capacity and start where the dropped part ends', () => {
  for (const o of [{}, TEE]) {
    for (let k = 0; k <= 100; k++) {
      const s = M.stateAt(M.duration() * k / 100, o);
      const vis = s.blocks.reduce((a, b) => a + (Math.min(b.end, s.raw) - Math.max(b.start, s.dropped)), 0);
      close(vis, s.used, `k ${k}`);
      assert.ok(s.used <= M.CAP + 1e-9);
    }
  }
});

test('the round counter only goes up', () => {
  let last = -1;
  for (let k = 0; k <= 200; k++) {
    const r = M.stateAt(M.duration() * k / 200).round;
    assert.ok(r >= last);
    last = r;
  }
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 13.9, 3.1, M.duration(), 5.0, 11.2];
  for (const o of [{}, TEE]) {
    const a = ts.map(t => JSON.stringify(M.stateAt(t, o)));
    const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t, o))).reverse();
    assert.deepEqual(a, b);
  }
});
