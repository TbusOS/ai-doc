/* autoresearch scene "neverstop" model — program.md "NEVER STOP".
 *
 * One night, 22:00 -> 06:00, one run every 5 minutes (illustrative: 96 runs).
 * With the reader's toggle `allowAsk` the agent stops after run 1 to ask
 * "should I keep going?"; the human is asleep, nobody answers, the count stays
 * at 1 until morning. Without it (the real rule) the agent may think of asking,
 * strikes the question out and keeps going. Four stations in the second half
 * of the night (02:00 -> 06:00) show the four things program.md tells it to do
 * when it runs out of ideas -- at any time in the loop, so they sit inside the
 * night, with the person asleep and the runs still counting, not after waking.
 * With allowAsk on the agent is still waiting there, so no cards show.
 * Stage clock = minutes since 22:00. One absolute schedule. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.ExplainTimeline || global.ExplainTimeline);
  else root.NeverStopModel = factory(root.ExplainTimeline);
})(this, function (T) {
  'use strict';

  var RUN_MIN = 5;
  var NIGHT_MIN = 8 * 60;      // 22:00 -> 06:00
  var START_CLOCK = 22 * 60;
  var IDEAS = 4;
  var IDEAS_AT = 4 * 60;                          // 02:00: the cards fill the second half of the night
  var IDEA_MIN = (NIGHT_MIN - IDEAS_AT) / IDEAS;  // one hour of runs under each card

  var SEGMENTS = [
    { key: 'first', dur: 1.8 },
    { key: 'ask', dur: 1.8 },
    { key: 'night', dur: 5.0 },   // 22:10 -> 02:00, about 46 stage minutes a second
    { key: 'idea1', dur: 1.3 },   // the same pace: 60 minutes in 1.3 s
    { key: 'idea2', dur: 1.3 },
    { key: 'idea3', dur: 1.3 },
    { key: 'idea4', dur: 1.3 },
    { key: 'wake', dur: 2.2 }
  ];
  var INTRO = 1.2;
  var SCHED = T.schedule(SEGMENTS, INTRO);
  var END = SCHED[SCHED.length - 1].end;

  function duration() { return END; }
  function stops() { return [0].concat(SCHED.map(function (s) { return s.start; }), [END]); }

  function clockText(minute) {
    var m = Math.floor(START_CLOCK + minute + 1e-9) % (24 * 60);
    return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2);
  }

  function stateAt(t, opts) {
    var allowAsk = !!(opts && opts.allowAsk);
    var station = null, local = 0, minute = 0;
    if (t >= INTRO) {
      var at = T.locate(SCHED, t);
      station = at.item.key; local = at.local;
      if (station === 'first') minute = RUN_MIN * local;
      else if (station === 'ask') minute = RUN_MIN + RUN_MIN * local;
      else if (station === 'night') minute = 2 * RUN_MIN + (IDEAS_AT - 2 * RUN_MIN) * local;
      else if (station.indexOf('idea') === 0) minute = IDEAS_AT + IDEA_MIN * (+station.slice(4) - 1 + local);
      else minute = NIGHT_MIN;
    }
    var free = Math.floor(minute / RUN_MIN + 1e-9);
    var asking = allowAsk && minute >= RUN_MIN - 1e-9;
    var done = allowAsk ? Math.min(1, free) : free;
    var partial = 0;
    if (!asking && minute < NIGHT_MIN) partial = minute / RUN_MIN - free;
    var bubble = null;
    if (asking) bubble = 'ask';
    else if (station === 'ask') bubble = 'struck';
    var isIdea = !!station && station.indexOf('idea') === 0;
    // card k appears at the start of station ideak; a waiting agent has no use for them
    var ideas = isIdea && !allowAsk ? +station.slice(4) : 0;
    return {
      phase: station ? (station === 'wake' ? 'outro' : 'run') : 'intro',
      station: station, local: local, allowAsk: allowAsk,
      minute: minute, clock: clockText(minute),
      done: done, partial: partial, total: NIGHT_MIN / RUN_MIN,
      asking: asking, waitMin: asking ? minute - RUN_MIN : 0,
      bubble: bubble,
      awake: station === 'wake',
      ideas: ideas
    };
  }

  return { RUN_MIN: RUN_MIN, NIGHT_MIN: NIGHT_MIN, IDEAS: IDEAS, IDEAS_AT: IDEAS_AT, SCHED: SCHED, INTRO: INTRO,
           duration: duration, stops: stops, stateAt: stateAt, clockText: clockText };
});
