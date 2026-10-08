/* autoresearch "limits" model — the loop as a ball that only rolls downhill.
 *
 * Every possible train.py is a point on an illustrative terrain (示意): height =
 * val_bpb, lower is better. Each round the ball (the code on the branch) tries
 * one small step to each side and moves only if a try is lower (program.md steps
 * 8–9: keep only an improvement). So it stops in the valley nearest to where it
 * started; a deeper valley behind a hill stays out of reach, because getting
 * there means getting worse first. Every start takes the same number of rounds,
 * so the schedule does not depend on the reader's choice.
 * Stations: ROUNDS rounds, reveal (the reader sees the whole terrain), three
 * more boundary cards, outro. stateAt(t, opts) is pure. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.ExplainTimeline || global.ExplainTimeline);
  else root.LimitsModel = factory(root.ExplainTimeline);
})(this, function (T) {
  'use strict';

  // terrain keypoints [index, height]; cosine interpolation keeps it monotonic between them
  var KEYS = [[0, 0.60], [5, 0.44], [8, 0.62], [12, 0.32], [18, 0.82], [24, 0.10], [28, 0.52]];
  var N = 29;
  var VALLEYS = [5, 12, 24];
  var STARTS = { here: 16, left: 1, far: 20 };
  var ROUNDS = 5;               // 4 moves + the round where both sides are higher
  var INTRO = 2.2, ROUND = 1.7, REVEAL = 4.6, CARD = 4.0, OUTRO = 3.2;
  var TRY_IN = 0.3, JUDGE = 0.55, MOVE_FROM = 0.8, MOVE_DUR = 0.55;

  var H = [];
  (function build() {
    for (var i = 0; i < N; i++) {
      for (var k = 0; k + 1 < KEYS.length; k++) {
        var a = KEYS[k], b = KEYS[k + 1];
        if (i >= a[0] && i <= b[0]) {
          var u = (i - a[0]) / (b[0] - a[0]);
          H.push(Math.round((a[1] + (b[1] - a[1]) * (1 - Math.cos(Math.PI * u)) / 2) * 1e6) / 1e6);
          break;
        }
      }
    }
  })();

  // smooth height between grid points (for drawing the terrain and the sliding ball)
  function heightAt(x) {
    for (var k = 0; k + 1 < KEYS.length; k++) {
      var a = KEYS[k], b = KEYS[k + 1];
      if (x >= a[0] && x <= b[0]) {
        var u = (x - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * (1 - Math.cos(Math.PI * u)) / 2;
      }
    }
    return x < 0 ? KEYS[0][1] : KEYS[KEYS.length - 1][1];
  }

  function neighbours(i) {
    var out = [];
    if (i - 1 >= 0) out.push(i - 1);
    if (i + 1 < N) out.push(i + 1);
    return out;
  }

  // one round from position i: the lower of the two tries, if it is lower than i
  function step(i) {
    var best = i;
    neighbours(i).forEach(function (j) { if (H[j] < H[best]) best = j; });
    return best;
  }

  function path(start) {
    var i = STARTS[start] !== undefined ? STARTS[start] : STARTS.here, out = [i];
    for (var r = 0; r < ROUNDS; r++) { var j = step(i); if (j === i) break; out.push(j); i = j; }
    return out;
  }

  var segs = [];
  for (var r = 0; r < ROUNDS; r++) segs.push({ key: 'round', dur: ROUND });
  segs.push({ key: 'reveal', dur: REVEAL });
  for (var c = 0; c < 3; c++) segs.push({ key: 'card', dur: CARD });
  segs.push({ key: 'outro', dur: OUTRO });
  var SCHED = T.schedule(segs, INTRO);
  var END = SCHED[SCHED.length - 1].end;

  function triesAt(i, judged) {
    return neighbours(i).map(function (j) { return { i: j, lower: H[j] < H[i], judged: judged }; });
  }

  function stateAt(t, opts) {
    var start = opts && STARTS[opts.start] !== undefined ? opts.start : 'here';
    var p = path(start), last = p[p.length - 1];
    var s = { start: start, phase: 'intro', round: -1, local: T.progress(t, 0, INTRO), ball: p[0], from: p[0], to: p[0],
              tries: [], tryIn: 0, judged: false, stuck: false, history: [], fog: 1, card: 0, cardsShown: 1 };
    if (t < INTRO) return s;
    var at = T.locate(SCHED, t), seg = at.item;
    s.phase = seg.key; s.local = at.local;
    var r = seg.key === 'round' ? at.index : ROUNDS;
    // finished rounds leave marks: every try, kept (moved there) or not
    for (var k = 0; k < Math.min(r, ROUNDS); k++) {
      var cur = p[Math.min(k, p.length - 1)], nxt = step(cur);
      triesAt(cur, true).forEach(function (tr) { s.history.push({ i: tr.i, kept: tr.i === nxt && nxt !== cur }); });
    }
    if (seg.key === 'round') {
      var el = t - seg.start, from = p[Math.min(r, p.length - 1)], to = step(from);
      s.round = r; s.from = from; s.to = to;
      s.tryIn = T.clamp(el / TRY_IN, 0, 1);
      s.judged = el >= JUDGE;
      s.tries = triesAt(from, s.judged);
      s.stuck = s.judged && to === from;
      var m = T.clamp((el - MOVE_FROM) / MOVE_DUR, 0, 1);
      s.ball = m <= 0 ? from : m >= 1 ? to : from + (to - from) * T.ease.inOut(m);
      return s;
    }
    s.ball = last; s.from = last; s.to = last;
    s.tries = triesAt(last, true); s.tryIn = 1; s.judged = true; s.stuck = true;
    s.round = ROUNDS - 1;
    if (seg.key === 'reveal') s.fog = 1 - T.ease.inOut(T.clamp(at.local / 0.35, 0, 1));
    else s.fog = 0;
    if (seg.key === 'card') { var ci = at.index - ROUNDS; s.card = ci; s.cardsShown = ci + 1; }
    if (seg.key === 'outro') { s.card = -1; s.cardsShown = 4; }
    return s;
  }

  return {
    N: N, H: H, VALLEYS: VALLEYS, STARTS: STARTS, ROUNDS: ROUNDS, JUDGE: JUDGE, SCHED: SCHED,
    heightAt: heightAt, path: path, step: step,
    duration: function () { return END; },
    stops: function () { return [0].concat(SCHED.map(function (x) { return x.start; }), [END]); },
    stateAt: stateAt
  };
});
