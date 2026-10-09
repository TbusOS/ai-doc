/* autoresearch scene "vocab" model — why the score is bits per byte, not loss per token.
 *
 * One illustrative sentence (32 ASCII bytes) and an illustrative "surprise"
 * for each byte (BITS, 30 bits in total). A tokenizer only decides where the
 * cuts go; the surprise stays on its bytes. So, as prepare.py evaluate_bpb
 * sums them:
 *   loss per token  = total bits / number of tokens   -> moves with the vocabulary
 *   bits per byte   = total bits / number of bytes    -> does not
 * Smaller vocabularies only add cuts (BPE merges of a smaller vocabulary are a
 * subset), so the scissors never have to glue anything back.
 * All numbers here are illustrative (marked 示意 on the page); only the two
 * definitions come from the source.
 * stateAt(t, opts) is pure; every station shares one absolute schedule. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.ExplainTimeline || global.ExplainTimeline);
  else root.VocabModel = factory(root.ExplainTimeline);
})(this, function (T) {
  'use strict';

  var TEXT = 'the agent trains while you sleep';
  var BYTES = TEXT.length;  // ASCII: one character = one byte
  // illustrative surprise per byte: word starts are hard to guess, word ends easy
  var BITS = [
    3, 1, 0,                 // the
    1, 3, 2, 1, 0, 0,        // " agent"
    1, 2, 1, 1, 0, 0, 1,     // " trains"
    1, 2, 1, 0, 0, 0,        // " while"
    0, 2, 1, 0,              // " you"
    1, 2, 1, 1, 0, 1         // " sleep"
  ];
  var TOTAL_BITS = BITS.reduce(function (a, b) { return a + b; }, 0);
  var VOCABS = [8192, 4096, 1024, 256];
  var PIECES = {
    8192: ['the', ' agent', ' trains', ' while', ' you', ' sleep'],
    4096: ['the', ' agent', ' tr', 'ains', ' while', ' you', ' sle', 'ep'],
    1024: ['the', ' ag', 'ent', ' tr', 'ain', 's', ' wh', 'ile', ' you', ' s', 'le', 'ep'],
    256: TEXT.split('')
  };
  var BASE = 8192;

  function cutsFor(v) {
    var out = [], at = 0, p = PIECES[v];
    for (var i = 0; i < p.length - 1; i++) { at += p[i].length; out.push(at); }
    return out;
  }

  function tokensFromCuts(cuts) {
    var edges = [0].concat(cuts.slice().sort(function (a, b) { return a - b; }), [BYTES]);
    var out = [];
    for (var i = 0; i < edges.length - 1; i++) {
      var a = edges[i], b = edges[i + 1], bits = 0;
      for (var k = a; k < b; k++) bits += BITS[k];
      out.push({ text: TEXT.slice(a, b), start: a, len: b - a, bits: bits });
    }
    return out;
  }

  function tokensFor(v) { return tokensFromCuts(cutsFor(v)); }
  function lossOf(tokens) { return TOTAL_BITS / tokens.length; }
  function bpbOf(tokens) {
    var bits = 0, bytes = 0;
    tokens.forEach(function (t) { bits += t.bits; bytes += t.len; });
    return bits / bytes;
  }
  function lossPerToken(v) { return lossOf(tokensFor(v)); }
  function bpbFor(v) { return bpbOf(tokensFor(v)); }
  // training code reports cross-entropy in nats; bits = nats / ln 2
  function lossNats(v) { return lossPerToken(v) * Math.LN2; }

  var INTRO = 1.8;
  var SEGMENTS = [
    { key: 'cut', dur: 3.0 },
    { key: 'recut', dur: 3.4 },
    { key: 'judge', dur: 2.8 },
    { key: 'outro', dur: 2.6 }
  ];
  var SCHED = T.schedule(SEGMENTS, INTRO);
  var SCISSORS = { cut: 0.55, recut: 0.72 };  // share of the station the scissors take
  var RISE = 0.3;                             // meters fill after the first cut
  var STAMP_AT = 0.3;                         // judge: when the stamp lands

  function duration() { return SCHED[SCHED.length - 1].end; }
  function stops() { return [0].concat(SCHED.map(function (s) { return s.start; }), [duration()]); }

  function targetOf(opts) {
    var v = opts && opts.vocab !== undefined && opts.vocab !== null ? +opts.vocab : 256;
    return PIECES[v] ? v : 256;
  }

  function uniq(list) { return list.filter(function (v, i) { return list.indexOf(v) === i; }); }

  function stateAt(t, opts) {
    var target = targetOf(opts), byLoss = !!(opts && opts.byLoss);
    var s = { phase: 'intro', local: 0, vocab: null, from: null, target: target, cuts: [], scissors: null,
              tokens: tokensFromCuts([]), loss: null, bpb: null, rise: 0, baseLoss: null, baseBpb: null,
              marks: [], verdict: null, stamp: 0, judgeBy: byLoss ? 'loss' : 'bpb' };
    if (t < INTRO) { s.local = T.progress(t, 0, INTRO); return s; }

    var at = T.locate(SCHED, t), k = at.item.key, p = at.local;
    s.phase = k; s.local = p;
    var baseCuts = cutsFor(BASE);

    if (k === 'cut') {
      var x = BYTES * T.ease.inOut(p / SCISSORS.cut);
      s.vocab = BASE;
      s.cuts = baseCuts.filter(function (c) { return c <= x; });
      s.scissors = p < SCISSORS.cut ? x : null;
      s.tokens = tokensFromCuts(s.cuts);
      if (p >= SCISSORS.cut) {
        s.loss = lossOf(s.tokens); s.bpb = bpbOf(s.tokens);
        s.rise = T.ease.out((p - SCISSORS.cut) / RISE);
        if (s.rise >= 1) { s.baseLoss = s.loss; s.baseBpb = s.bpb; s.marks = [BASE]; }
      }
      return s;
    }

    // from here on the first cut is done: the 8192 readings are the baseline
    s.baseLoss = lossPerToken(BASE); s.baseBpb = bpbFor(BASE); s.rise = 1;
    s.from = BASE; s.vocab = target;

    if (k === 'recut') {
      var x2 = BYTES * T.ease.inOut(p / SCISSORS.recut);
      var extra = cutsFor(target).filter(function (c) { return baseCuts.indexOf(c) < 0 && c <= x2; });
      s.cuts = baseCuts.concat(extra).sort(function (a, b) { return a - b; });
      s.scissors = p < SCISSORS.recut ? x2 : null;
      s.tokens = tokensFromCuts(s.cuts);
      s.loss = lossOf(s.tokens); s.bpb = bpbOf(s.tokens);
      s.marks = p >= SCISSORS.recut ? uniq([BASE, target]) : [BASE];
      return s;
    }

    s.cuts = cutsFor(target);
    s.tokens = tokensFor(target);
    s.loss = lossOf(s.tokens); s.bpb = bpbOf(s.tokens);
    s.marks = k === 'outro' ? VOCABS.slice() : uniq([BASE, target]);
    if (k === 'outro' || p >= STAMP_AT) {
      var now = byLoss ? s.loss : s.bpb, base = byLoss ? s.baseLoss : s.baseBpb;
      s.verdict = now < base - 1e-12 ? 'better' : now > base + 1e-12 ? 'worse' : 'same';
      s.stamp = k === 'outro' ? 1 : T.ease.out((p - STAMP_AT) / 0.25);
    }
    return s;
  }

  return { TEXT: TEXT, BYTES: BYTES, BITS: BITS, TOTAL_BITS: TOTAL_BITS, VOCABS: VOCABS, PIECES: PIECES, BASE: BASE,
           SCISSORS: SCISSORS, SCHED: SCHED, INTRO: INTRO, cutsFor: cutsFor, tokensFor: tokensFor,
           tokensFromCuts: tokensFromCuts, lossPerToken: lossPerToken, bpbFor: bpbFor, lossNats: lossNats,
           duration: duration, stops: stops, stateAt: stateAt };
});
