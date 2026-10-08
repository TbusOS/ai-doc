/* autoresearch scene "what val_bpb is" — model.
 *
 * prepare.py evaluate_bpb: sum the per-token cross-entropy (nats) over target
 * tokens with byte length > 0, sum the target byte lengths, then
 *   val_bpb = total_nats / (ln 2 × total_bytes).
 * evaluateBpb() is that computation, token for token. The sentence, its token
 * split and the probabilities are illustrative (marked 示意 on the page).
 * Byte lengths are UTF-8 lengths, as prepare.py builds its token_bytes table.
 * The slider "skill" (0–10) raises every probability: p = p0^(1 − 0.06·skill),
 * so each cross-entropy −ln p shrinks by 6 % per step and the bytes stay put.
 * Stations: sentence → Σ cross-entropy → Σ bytes → ln2 → result; each term of
 * the formula is in focus during its own station.
 * stateAt(t, {skill}) is pure and reads one absolute schedule. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.ExplainTimeline || global.ExplainTimeline);
  else root.BpbModel = factory(root.ExplainTimeline);
})(this, function (T) {
  'use strict';

  var TOKENS = [
    { text: 'The', p0: 0.05 },
    { text: ' model', p0: 0.01 },
    { text: ' learns', p0: 0.03 },
    { text: ' while', p0: 0.08 },
    { text: ' you', p0: 0.2 },
    { text: ' sleep', p0: 0.05 }
  ];
  var SKILL_MAX = 10, SKILL_STEP = 0.06;
  var STATIONS = ['sentence', 'loss', 'bytes', 'ln2', 'result'];
  var DURS = { sentence: 2.0, loss: 4.8, bytes: 3.6, ln2: 3.2, result: 3.6 };
  var FOCUS = { sentence: null, loss: 'loss', bytes: 'bytes', ln2: 'ln2', result: 'all' };

  var SCHED = T.schedule(STATIONS.map(function (k) { return { key: k, dur: DURS[k] }; }), 0);
  var END = SCHED[SCHED.length - 1].end;

  function duration() { return END; }
  function stops() { return SCHED.map(function (s) { return s.start; }).concat([END]); }

  // len(token_str.encode("utf-8"))
  function bytesOf(str) {
    var n = 0;
    for (var i = 0; i < str.length; i++) {
      var c = str.codePointAt(i);
      if (c > 0xffff) i++;
      n += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
    }
    return n;
  }

  // prepare.py evaluate_bpb, one batch: special tokens (0 bytes) leave both sums
  function evaluateBpb(losses, nbytes) {
    var totalNats = 0, totalBytes = 0;
    for (var i = 0; i < losses.length; i++) {
      if (nbytes[i] > 0) totalNats += losses[i];
      totalBytes += nbytes[i];
    }
    return totalNats / (Math.log(2) * totalBytes);
  }

  function clampSkill(k) { return T.clamp(+k || 0, 0, SKILL_MAX); }

  function tokensAt(skill) {
    var e = 1 - SKILL_STEP * clampSkill(skill);
    return TOKENS.map(function (tk) {
      var p = e === 1 ? tk.p0 : Math.pow(tk.p0, e);
      return { text: tk.text, bytes: bytesOf(tk.text), p: p, loss: -Math.log(p) };
    });
  }

  function bpbAt(skill) {
    var toks = tokensAt(skill);
    return evaluateBpb(toks.map(function (x) { return x.loss; }), toks.map(function (x) { return x.bytes; }));
  }

  function stateAt(t, opts) {
    var skill = clampSkill(opts && opts.skill);
    var toks = tokensAt(skill);
    var n = toks.length;
    var totalBytes = toks.reduce(function (a, x) { return a + x.bytes; }, 0);
    var at = T.locate(SCHED, T.clamp(t, 0, END));
    var k = at.item.key, local = at.local, idx = at.index;
    var s = { station: k, local: local, skill: skill, focus: FOCUS[k], tokens: toks,
              shown: 0, risen: [], active: null, sumNats: 0, sumBytes: 0, bits: 0, bpb: null, reveal: 0 };

    // sentence: chips slide in one by one
    s.shown = k === 'sentence' ? T.ease.out(T.clamp(local / 0.7, 0, 1)) * n : n;

    // loss: bars rise one after another, the sum follows
    var lossIdx = STATIONS.indexOf('loss');
    toks.forEach(function (x, i) {
      var r = 0;
      if (idx > lossIdx) r = 1;
      else if (idx === lossIdx) r = T.ease.out(T.clamp((local * 1.15 - i / n) * n, 0, 1));
      s.risen.push(r);
      s.sumNats += r === 1 ? x.loss : 0;
    });
    if (k === 'loss') {
      for (var i = 0; i < n; i++) if (s.risen[i] < 1) { s.active = i; break; }
      if (s.active === null) s.active = n - 1;
    }

    // bytes: counted one byte at a time, left to right
    var bytesIdx = STATIONS.indexOf('bytes');
    if (idx > bytesIdx) s.sumBytes = totalBytes;
    else if (idx === bytesIdx) s.sumBytes = Math.floor(T.clamp(local / 0.8, 0, 1) * totalBytes + 1e-9);

    // ln2: one dashed line per bit fades in
    var lnIdx = STATIONS.indexOf('ln2');
    if (idx > lnIdx) s.bits = 1;
    else if (idx === lnIdx) s.bits = T.ease.out(T.clamp(local / 0.5, 0, 1));

    if (k === 'result') {
      s.bpb = evaluateBpb(toks.map(function (x) { return x.loss; }), toks.map(function (x) { return x.bytes; }));
      s.reveal = T.ease.out(T.clamp(local / 0.35, 0, 1));
    }
    return s;
  }

  return { TOKENS: TOKENS, SKILL_MAX: SKILL_MAX, STATIONS: STATIONS, DURS: DURS, SCHED: SCHED,
           duration: duration, stops: stops, stateAt: stateAt, bytesOf: bytesOf,
           evaluateBpb: evaluateBpb, tokensAt: tokensAt, bpbAt: bpbAt };
});
