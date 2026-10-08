const test = require('node:test');
const assert = require('node:assert');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/vocab-model.js');

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg || ''} ${a} != ${b}`);
const startOf = key => M.SCHED.find(s => s.key === key).start;

test('every cut spells the same sentence and covers all 32 bytes', () => {
  for (const v of M.VOCABS) {
    const toks = M.tokensFor(v);
    assert.equal(toks.map(t => t.text).join(''), M.TEXT, `vocab ${v}`);
    assert.equal(toks.reduce((a, t) => a + t.len, 0), 32, `vocab ${v}`);
  }
  assert.equal(Buffer.byteLength(M.TEXT, 'utf8'), 32);
});

test('a smaller vocabulary only adds cuts (BPE merges are a subset)', () => {
  for (let i = 1; i < M.VOCABS.length; i++) {
    const big = M.cutsFor(M.VOCABS[i - 1]), small = M.cutsFor(M.VOCABS[i]);
    big.forEach(c => assert.ok(small.includes(c), `${M.VOCABS[i]} keeps cut ${c}`));
    assert.ok(small.length > big.length);
  }
  assert.equal(M.tokensFor(256).length, 32);
});

test('the total surprise of the sentence is 30 bits however it is cut', () => {
  assert.equal(M.BITS.length, 32);
  assert.equal(M.BITS.reduce((a, b) => a + b, 0), 30);
  for (const v of M.VOCABS) assert.equal(M.tokensFor(v).reduce((a, t) => a + t.bits, 0), 30, `vocab ${v}`);
});

test('loss per token follows the vocabulary down: 30 bits / token count', () => {
  const want = { 8192: 5, 4096: 3.75, 1024: 2.5, 256: 0.9375 };
  for (const v of M.VOCABS) close(M.lossPerToken(v), want[v], `vocab ${v}`);
  for (let i = 1; i < M.VOCABS.length; i++) assert.ok(M.lossPerToken(M.VOCABS[i]) < M.lossPerToken(M.VOCABS[i - 1]));
});

test('bits per byte does not move: total bits / total bytes, as evaluate_bpb sums them', () => {
  for (const v of M.VOCABS) close(M.bpbFor(v), 30 / 32, `vocab ${v}`);
});

test('the two readings are tied: loss per token = bpb x bytes per token', () => {
  for (const v of M.VOCABS) close(M.lossPerToken(v), M.bpbFor(v) * (32 / M.tokensFor(v).length), `vocab ${v}`);
});

test('in nats (what the training code reports) the 8192 loss is 30 ln2 / 6', () => {
  close(M.lossNats(8192), 30 * Math.LN2 / 6);
  close(M.lossNats(8192) / Math.LN2, M.lossPerToken(8192));
});

test('duration and stops', () => {
  const st = M.stops();
  assert.equal(st[0], 0);
  close(st[st.length - 1], M.duration());
  assert.deepEqual(M.SCHED.map(s => s.key), ['cut', 'recut', 'judge', 'outro']);
  assert.equal(st.length, M.SCHED.length + 2);
});

test('every stop lands on the start of its station (no float drift)', () => {
  M.stops().slice(1, -1).forEach((t, i) => {
    const s = M.stateAt(t);
    assert.equal(s.phase, M.SCHED[i].key, `stop ${i}`);
    assert.equal(s.local, 0, `stop ${i}`);
  });
});

test('intro: the sentence is not cut yet and the meters are empty', () => {
  const s = M.stateAt(0.3);
  assert.equal(s.phase, 'intro');
  assert.equal(s.tokens.length, 1);
  assert.equal(s.loss, null);
  assert.equal(s.bpb, null);
});

test('after the first cut: vocab 8192, 6 tokens, loss 5, bpb 0.9375', () => {
  const s = M.stateAt(startOf('recut') - 1e-6);
  assert.equal(s.vocab, 8192);
  assert.equal(s.tokens.length, 6);
  close(s.loss, 5);
  close(s.bpb, 0.9375);
  close(s.baseLoss, 5);
});

test('during the recut every frame is self-consistent: loss x tokens = 30, bpb fixed', () => {
  const a = startOf('recut'), b = startOf('judge');
  for (const v of ['4096', '1024', '256']) {
    for (let k = 0; k <= 40; k++) {
      const s = M.stateAt(a + (b - a) * k / 40, { vocab: v });
      close(s.loss * s.tokens.length, 30, `vocab ${v} k ${k}`);
      close(s.bpb, 0.9375, `vocab ${v} k ${k}`);
    }
  }
});

test('the recut ends on the chosen vocabulary (default 256)', () => {
  const t = startOf('judge');
  assert.equal(M.stateAt(t).tokens.length, 32);
  assert.equal(M.stateAt(t, { vocab: '1024' }).tokens.length, 12);
  assert.equal(M.stateAt(t, { vocab: 4096 }).tokens.length, 8);
  assert.equal(M.stateAt(t, { vocab: '8192' }).tokens.length, 6);
});

test('judge: by bpb a vocabulary change is a tie; by loss it looks like progress', () => {
  const t = startOf('judge') + 0.9 * (startOf('outro') - startOf('judge'));
  assert.equal(M.stateAt(t).verdict, 'same');
  assert.equal(M.stateAt(t, { byLoss: true }).verdict, 'better');
  assert.equal(M.stateAt(t, { byLoss: true, vocab: '8192' }).verdict, 'same');
  assert.equal(M.stateAt(t, { vocab: '1024' }).verdict, 'same');
});

test('outro shows the ruler marks of all four vocabularies', () => {
  const s = M.stateAt(M.duration());
  assert.equal(s.phase, 'outro');
  assert.deepEqual(s.marks, [8192, 4096, 1024, 256]);
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 9.9, 3.1, M.duration(), 5.0, 11.2];
  const o = { vocab: '1024', byLoss: true };
  const a = ts.map(t => JSON.stringify(M.stateAt(t, o)));
  const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t, o))).reverse();
  assert.deepEqual(a, b);
});
