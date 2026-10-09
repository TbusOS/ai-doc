const test = require('node:test');
const assert = require('node:assert');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/bpb-model.js');

const close = (a, b, eps = 1e-12) => Math.abs(a - b) < eps;
const startOf = k => M.SCHED[M.STATIONS.indexOf(k)].start;

// A line-by-line port of prepare.py evaluate_bpb for one batch:
//   nbytes = token_bytes[y_flat]; mask = nbytes > 0
//   total_nats += (loss_flat * mask).sum(); total_bytes += nbytes.sum()
//   return total_nats / (math.log(2) * total_bytes)
function evaluateBpbPy(lossFlat, nbytes) {
  let totalNats = 0, totalBytes = 0;
  const mask = nbytes.map(b => (b > 0 ? 1 : 0));
  totalNats += lossFlat.reduce((a, l, i) => a + l * mask[i], 0);
  totalBytes += nbytes.reduce((a, b) => a + b, 0);
  return totalNats / (Math.log(2) * totalBytes);
}

test('stations follow the formula: sentence, Σ cross-entropy, Σ bytes, ln2, result', () => {
  assert.deepEqual(M.STATIONS, ['sentence', 'loss', 'bytes', 'ln2', 'result']);
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
  for (const o of [{}, { skill: 7 }]) {
    const a = ts.map(t => JSON.stringify(M.stateAt(t, o)));
    const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t, o))).reverse();
    assert.deepEqual(a, b);
  }
});

test('byte length is the UTF-8 length, as prepare.py builds token_bytes', () => {
  assert.equal(M.bytesOf('The'), 3);
  assert.equal(M.bytesOf(' model'), 6);
  assert.equal(M.bytesOf('你好'), 6);
  assert.equal(M.bytesOf('é'), 2);
  assert.equal(M.bytesOf('\u{1F600}'), 4);
  assert.deepEqual(M.TOKENS.map(t => M.bytesOf(t.text)), [3, 6, 7, 6, 4, 6]);
});

test('evaluateBpb is prepare.py evaluate_bpb: zero-byte (special) tokens drop out of both sums', () => {
  assert.ok(close(M.evaluateBpb([2, 5, 1], [3, 0, 1]), 3 / (Math.log(2) * 4)));
  assert.ok(close(M.evaluateBpb([2, 5, 1], [3, 0, 1]), evaluateBpbPy([2, 5, 1], [3, 0, 1])));
  assert.ok(close(M.evaluateBpb([Math.LN2], [1]), 1));  // ln2 nats on one byte = 1 bit per byte
});

test('the scene result equals evaluate_bpb on the drawn tokens, for every slider position', () => {
  for (let k = 0; k <= 10; k++) {
    const toks = M.tokensAt(k);
    toks.forEach(tk => assert.ok(close(tk.loss, -Math.log(tk.p))));
    const want = evaluateBpbPy(toks.map(tk => tk.loss), toks.map(tk => tk.bytes));
    assert.ok(close(M.bpbAt(k), want), `skill ${k}`);
    const end = M.stateAt(M.duration(), { skill: k });
    assert.ok(close(end.bpb, want), `skill ${k} end state`);
    assert.ok(close(end.sumNats, toks.reduce((a, tk) => a + tk.loss, 0)));
    assert.equal(end.sumBytes, 32);
  }
});

test('pinned demo numbers: 18.238 nats over 32 bytes ≈ 0.8223 bits per byte', () => {
  const toks = M.tokensAt(0);
  assert.deepEqual(toks.map(tk => tk.p), [0.05, 0.01, 0.03, 0.08, 0.2, 0.05]);
  assert.ok(Math.abs(toks.reduce((a, tk) => a + tk.loss, 0) - 18.238359) < 1e-6);
  assert.ok(Math.abs(M.bpbAt(0) - 0.822262) < 1e-6);
  assert.ok(Math.abs(M.bpbAt(10) - 0.328905) < 1e-6);
});

test('guessing better lowers every bar and the score; the byte count never moves', () => {
  let prev = Infinity;
  for (let k = 0; k <= 10; k++) {
    const toks = M.tokensAt(k);
    assert.equal(toks.reduce((a, tk) => a + tk.bytes, 0), 32);
    if (k > 0) M.tokensAt(k - 1).forEach((was, i) => assert.ok(toks[i].p > was.p && toks[i].loss < was.loss));
    assert.ok(M.bpbAt(k) < prev);
    prev = M.bpbAt(k);
  }
});

test('the sums count up during their own station only', () => {
  const s0 = M.stateAt(startOf('loss'));
  assert.equal(s0.sumNats, 0);
  assert.equal(s0.sumBytes, 0);
  let prev = 0;
  const L = M.SCHED[M.STATIONS.indexOf('loss')];
  for (let t = L.start; t < L.end; t += 0.05) {
    const s = M.stateAt(t);
    assert.ok(s.sumNats >= prev - 1e-12);
    assert.equal(s.sumBytes, 0);
    prev = s.sumNats;
  }
  const b = M.stateAt(startOf('bytes'));
  assert.ok(close(b.sumNats, M.tokensAt(0).reduce((a, tk) => a + tk.loss, 0)));
  assert.equal(b.sumBytes, 0);
  const mid = M.stateAt(startOf('bytes') + 0.5 * M.DURS.bytes);
  assert.ok(mid.sumBytes > 0 && mid.sumBytes < 32 && Number.isInteger(mid.sumBytes));
  assert.equal(M.stateAt(startOf('ln2')).sumBytes, 32);
  assert.equal(M.stateAt(startOf('ln2')).bpb, null);
  assert.ok(close(M.stateAt(startOf('result')).bpb, M.bpbAt(0)));
});

test('each formula term is highlighted at its own station', () => {
  assert.equal(M.stateAt(startOf('sentence') + 0.3).focus, null);
  assert.equal(M.stateAt(startOf('loss') + 0.3).focus, 'loss');
  assert.equal(M.stateAt(startOf('bytes') + 0.3).focus, 'bytes');
  assert.equal(M.stateAt(startOf('ln2') + 0.3).focus, 'ln2');
  assert.equal(M.stateAt(startOf('result') + 0.3).focus, 'all');
});

test('slider is clamped to 0–10', () => {
  assert.ok(close(M.bpbAt(-3), M.bpbAt(0)));
  assert.ok(close(M.bpbAt(42), M.bpbAt(10)));
});
