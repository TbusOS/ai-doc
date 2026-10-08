/* autoresearch scene "night" model — one night, done by hand vs. by autoresearch.
 *
 * Time on the stage is minutes since 21:00. The human lane does two runs by
 * hand in the hour before bed (illustrative), then sleeps: nothing runs. The
 * autoresearch lane starts at 22:00 and finishes one run every 5 minutes —
 * README "approx 12 experiments/hour", so the morning count is 12 × hours.
 * `hours` (the reader's slider, 4–10) only moves the wake-up time; every
 * station keeps its place on one absolute schedule, so stops() and stateAt()
 * read the same numbers and stateAt(t) never depends on earlier calls. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.ExplainTimeline || global.ExplainTimeline);
  else root.NightModel = factory(root.ExplainTimeline);
})(this, function (T) {
  'use strict';

  var PER_HOUR = 12;         // README: approx 12 experiments/hour
  var RUN_MIN = 60 / PER_HOUR;
  var START_CLOCK = 21 * 60; // the stage starts at 21:00
  var SLEEP_AT = 60;         // 22:00, minutes after 21:00
  var AXIS_END = 11 * 60;    // 08:00: room for the longest sleep (10 h)
  var DEFAULT_HOURS = 8;
  var MIN_HOURS = 4, MAX_HOURS = 10;
  // two runs by hand before bed (illustrative): edit, train 5 min, read the result
  var HUMAN = [
    { start: 0, edit: 15, train: 5, read: 10 },
    { start: 30, edit: 15, train: 5, read: 10 }
  ];

  var SEGMENTS = [
    { key: 'evening', dur: 3.0 },
    { key: 'first', dur: 1.6 },
    { key: 'night', dur: 6.0 },
    { key: 'wake', dur: 2.4 }
  ];
  var INTRO = 1.2;
  var SCHED = T.schedule(SEGMENTS, INTRO);
  var END = SCHED[SCHED.length - 1].end;

  function duration() { return END; }
  function stops() { return [0].concat(SCHED.map(function (s) { return s.start; }), [END]); }

  function hoursOf(opts) {
    var h = opts && opts.hours !== undefined ? +opts.hours : DEFAULT_HOURS;
    if (!(h === h)) h = DEFAULT_HOURS;  // NaN
    return Math.round(T.clamp(h, MIN_HOURS, MAX_HOURS));
  }

  function clockText(minute) {
    var m = Math.floor(START_CLOCK + minute + 1e-9) % (24 * 60);
    return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2);
  }

  function humanRun(run, minute) {
    var into = minute - run.start, total = run.edit + run.train + run.read;
    return {
      started: into > 0,
      done: into >= total - 1e-9,
      p: T.clamp(into / total, 0, 1)
    };
  }

  function stateAt(t, opts) {
    var hours = hoursOf(opts);
    var wake = SLEEP_AT + hours * 60;
    var station = null, local = 0, minute = 0;
    if (t >= INTRO) {
      var at = T.locate(SCHED, t);
      station = at.item.key; local = at.local;
      if (station === 'evening') minute = SLEEP_AT * local;
      else if (station === 'first') minute = SLEEP_AT + RUN_MIN * local;
      else if (station === 'night') minute = SLEEP_AT + RUN_MIN + (wake - SLEEP_AT - RUN_MIN) * local;
      else minute = wake;
    }
    var human = HUMAN.map(function (r) { return humanRun(r, minute); });
    var awakeMin = Math.max(0, Math.min(minute, wake) - SLEEP_AT);
    var aiDone = Math.floor(awakeMin / RUN_MIN + 1e-9);
    return {
      phase: station ? (station === 'wake' ? 'outro' : 'run') : 'intro',
      station: station, local: local, hours: hours,
      minute: minute, clock: clockText(minute), wake: wake,
      asleep: minute >= SLEEP_AT && station !== 'wake',
      human: human,
      humanDone: human.filter(function (r) { return r.done; }).length,
      aiDone: aiDone,
      aiPartial: minute > SLEEP_AT && minute < wake ? awakeMin / RUN_MIN - aiDone : 0,
      total: PER_HOUR * hours
    };
  }

  return { PER_HOUR: PER_HOUR, RUN_MIN: RUN_MIN, SLEEP_AT: SLEEP_AT, AXIS_END: AXIS_END, START_CLOCK: START_CLOCK,
           DEFAULT_HOURS: DEFAULT_HOURS, HUMAN: HUMAN, SCHED: SCHED, INTRO: INTRO,
           duration: duration, stops: stops, stateAt: stateAt, clockText: clockText, hoursOf: hoursOf };
});
