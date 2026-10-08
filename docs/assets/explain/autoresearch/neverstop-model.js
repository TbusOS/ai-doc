/* autoresearch scene "neverstop" model — program.md "NEVER STOP".
 *
 * One night, 22:00 -> 06:00, one run every 5 minutes (illustrative: 96 runs).
 * With the reader's toggle `allowAsk` the agent stops after run 1 to ask
 * "should I keep going?"; the human is asleep, nobody answers, the count stays
 * at 1 until morning. Without it (the real rule) the agent may think of asking,
 * strikes the question out and keeps going. The last four stations show the
 * four things program.md tells it to do when it runs out of ideas.
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

  var SEGMENTS = [
    { key: 'first', dur: 1.8 },
    { key: 'ask', dur: 1.8 },
    { key: 'night', dur: 5.0 },
    { key: 'wake', dur: 2.2 },
    { key: 'idea1', dur: 1.0 },
    { key: 'idea2', dur: 1.0 },
    { key: 'idea3', dur: 1.0 },
    { key: 'idea4', dur: 1.0 }
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
      else if (station === 'night') minute = 2 * RUN_MIN + (NIGHT_MIN - 2 * RUN_MIN) * local;
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
    var ideas = isIdea ? +station.slice(4) : 0;  // card k appears at the start of station ideak
    return {
      phase: station ? (isIdea || station === 'wake' ? 'outro' : 'run') : 'intro',
      station: station, local: local, allowAsk: allowAsk,
      minute: minute, clock: clockText(minute),
      done: done, partial: partial, total: NIGHT_MIN / RUN_MIN,
      asking: asking, waitMin: asking ? minute - RUN_MIN : 0,
      bubble: bubble,
      awake: station === 'wake' || isIdea,
      ideas: ideas
    };
  }

  return { RUN_MIN: RUN_MIN, NIGHT_MIN: NIGHT_MIN, IDEAS: IDEAS, SCHED: SCHED, INTRO: INTRO,
           duration: duration, stops: stops, stateAt: stateAt, clockText: clockText };
});
