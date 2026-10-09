/* autoresearch scene "simplicity" model — program.md "Simplicity criterion" on a balance.
 *
 * Left pan: the val_bpb improvement (gain). Right pan: the complexity cost.
 * Deleting code is a negative cost (a balloon that lifts the cost pan). The
 * heavier side goes down; the four cards are program.md's own words (one
 * general rule, then three examples), in program.md order, and each one must tip the way program.md concludes
 * (tests check it). Weights are illustrative (示意): only the direction is
 * taken from the source.
 * opts.card: 'all' (tour, default) or '1'..'4' (that card on the scale for the
 * whole run; it is still weighed in slot 1 so play shows it landing).
 * stateAt(t, opts) is pure; every station shares one absolute schedule. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.ExplainTimeline || global.ExplainTimeline);
  else root.SimplicityModel = factory(root.ExplainTimeline);
})(this, function (T) {
  'use strict';

  // gain / cost in illustrative units; `says` is program.md's conclusion
  var CARDS = [
    { id: 'ugly', gain: 1, cost: 3, says: 'reject' },     // "A small improvement that adds ugly complexity is not worth it."
    { id: 'hacky', gain: 1, cost: 3, says: 'reject', hedged: true },  // "...adds 20 lines of hacky code? Probably not worth it."
    { id: 'delete', gain: 1, cost: -2, says: 'keep' },    // "...improvement from deleting code? Definitely keep."
    { id: 'simpler', gain: 0, cost: -3, says: 'keep' }    // "An improvement of ~0 but much simpler code? Keep."
  ];
  var MAX_TILT = 12;  // degrees
  var DEG_PER_UNIT = 4;

  // scoreOnly = the simplicity criterion removed: the cost pan is not weighed,
  // and an improvement of ~0 is "equal" -> git reset (loop step 9)
  function net(c, scoreOnly) { return scoreOnly ? c.gain : c.gain - c.cost; }
  function weighs(c, scoreOnly) { return net(c, scoreOnly) > 0 ? 'keep' : 'reject'; }
  // SVG rotate(): positive = clockwise = the right (cost) pan goes down
  function tiltFor(c, scoreOnly) { return T.clamp(-net(c, scoreOnly) * DEG_PER_UNIT, -MAX_TILT, MAX_TILT); }
  // the word on the stamp and the deck badge: keep, reset (level beam: equal -> git reset), or
  // reject; program.md hedges card 2 ("Probably not worth it"), so its badge is hedged too
  function badgeOf(c, scoreOnly) {
    if (weighs(c, scoreOnly) === 'keep') return 'keep';
    if (Math.abs(tiltFor(c, scoreOnly)) < 1e-9) return 'reset';
    return c.hedged ? 'probably' : 'reject';
  }

  var INTRO = 1.8;
  var DROP = 0.38;    // weigh station: the weights land, then the beam tips
  var STAMP_AT = 0.1; // verdict station: the stamp lands
  var EXIT = 0.8;     // verdict station (tour only): the card leaves, the beam levels
  var SEGMENTS = [];
  CARDS.forEach(function (_, i) {
    SEGMENTS.push({ key: 'weigh', slot: i, dur: 2.4 });
    SEGMENTS.push({ key: 'verdict', slot: i, dur: 2.6 });
  });
  SEGMENTS.push({ key: 'outro', slot: -1, dur: 2.8 });
  var SCHED = T.schedule(SEGMENTS, INTRO);
  SCHED.forEach(function (s, i) { s.slot = SEGMENTS[i].slot; });

  function duration() { return SCHED[SCHED.length - 1].end; }
  function stops() { return [0].concat(SCHED.map(function (s) { return s.start; }), [duration()]); }

  // tip with a damped wobble that lands exactly on the target at q = 1
  function tip(target, q) {
    q = T.clamp(q, 0, 1);
    return target * (1 - Math.pow(1 - q, 3) * Math.cos(2.5 * Math.PI * q));
  }

  function pickOf(opts) {
    var c = opts && opts.card;
    var i = c === undefined || c === null || c === 'all' ? -1 : (+c) - 1;
    return i >= 0 && i < CARDS.length ? i : -1;
  }

  function none() { return CARDS.map(function () { return false; }); }

  function judged(s, idx) {
    s.verdict = weighs(CARDS[idx], s.scoreOnly);
    s.agrees = s.verdict === CARDS[idx].says;
    return s;
  }

  function stateAt(t, opts) {
    var pick = pickOf(opts), so = !!(opts && opts.scoreOnly);
    var s = { phase: 'intro', station: null, slot: -1, local: 0, card: -1, place: 0, angle: 0,
              leave: 0, stamp: 0, done: none(), picked: pick >= 0, scoreOnly: so,
              verdict: null, agrees: null };
    if (t < INTRO) { s.local = T.progress(t, 0, INTRO); return s; }

    var at = T.locate(SCHED, t), item = at.item, p = at.local;
    s.station = item.key; s.slot = item.slot; s.local = p;
    s.phase = item.key === 'outro' ? 'outro' : 'card';

    if (pick >= 0) {
      // a picked card: weighed in slot 1, then it stays on the scale
      s.card = pick;
      if (item.slot === 0) return station(s, item.key, p, pick, false);
      s.place = 1; s.angle = tiltFor(CARDS[pick], so); s.stamp = 1; s.done[pick] = true;
      return judged(s, pick);
    }
    if (item.key === 'outro') {
      CARDS.forEach(function (_, i) { s.done[i] = true; });
      return s;  // every card is back in the deck; the beam is level
    }
    for (var i = 0; i < item.slot; i++) s.done[i] = true;
    s.card = item.slot;
    return station(s, item.key, p, item.slot, true);
  }

  function station(s, key, p, idx, tour) {
    var tilt = tiltFor(CARDS[idx], s.scoreOnly);
    if (key === 'weigh') {
      s.place = T.ease.out(p / DROP);
      s.angle = p < DROP ? 0 : tip(tilt, (p - DROP) / (1 - DROP));
      return s;
    }
    s.place = 1; s.angle = tilt;
    s.stamp = T.ease.out((p - STAMP_AT) / 0.25);
    if (p >= STAMP_AT) s.done[idx] = true;
    if (tour && p >= EXIT) {
      s.leave = T.ease.inOut((p - EXIT) / (1 - EXIT));
      s.angle = tilt * (1 - s.leave);
      s.stamp *= 1 - s.leave;
    }
    return judged(s, idx);
  }

  return { CARDS: CARDS, SCHED: SCHED, INTRO: INTRO, MAX_TILT: MAX_TILT, weighs: weighs, tiltFor: tiltFor, badgeOf: badgeOf,
           duration: duration, stops: stops, stateAt: stateAt };
});
