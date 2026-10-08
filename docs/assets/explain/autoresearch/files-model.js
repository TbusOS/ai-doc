/* autoresearch scene "three files, three roles" — model.
 *
 * README "How it works": prepare.py is not modified, train.py is edited by the
 * agent, program.md is edited by the human. The cards light up one per station
 * (prepare → train → program), then a last station states what the whole
 * thing is. During the train station a value in train.py changes from 0.5 to
 * 0.7 — the real kept change "warmdown 0.5→0.7" from the progress.png labels.
 * opts.usual switches to the usual way of doing research (README: "you're not
 * touching any of the Python files like you normally would as a researcher"):
 * the researcher edits train.py and program.md is not needed.
 * stateAt(t, opts) is pure and reads one absolute schedule. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root.ExplainTimeline || global.ExplainTimeline);
  else root.FilesModel = factory(root.ExplainTimeline);
})(this, function (T) {
  'use strict';

  var FILES = ['prepare', 'train', 'program'];
  var STATIONS = ['intro'].concat(FILES, ['essence']);
  var DURS = { intro: 1.6, prepare: 3.8, train: 4.6, program: 3.8, essence: 3.6 };
  var EDITORS = {
    autoresearch: { prepare: [], train: ['ai'], program: ['human'] },
    usual: { prepare: [], train: ['human'], program: [] }
  };
  var USED = {
    autoresearch: { prepare: true, train: true, program: true },
    usual: { prepare: true, train: true, program: false }
  };
  var EDIT_FROM = 0.35, EDIT_TO = 0.75;  // share of the train station spent typing the new value

  var SCHED = T.schedule(STATIONS.map(function (k) { return { key: k, dur: DURS[k] }; }), 0);
  var END = SCHED[SCHED.length - 1].end;

  function duration() { return END; }
  function stops() { return SCHED.map(function (s) { return s.start; }).concat([END]); }

  function stateAt(t, opts) {
    var mode = opts && opts.usual ? 'usual' : 'autoresearch';
    var at = T.locate(SCHED, T.clamp(t, 0, END));
    var k = at.item.key, local = at.local, idx = at.index;
    var s = { station: k, local: local, mode: mode, focus: FILES.indexOf(k) >= 0 ? k : null,
              edit: 0, banner: 0, cards: {} };

    FILES.forEach(function (f, i) {
      var appear = k === 'intro' ? T.ease.out(T.clamp((local - i * 0.2) / 0.45, 0, 1)) : 1;
      s.cards[f] = { appear: appear, lit: idx >= i + 1, focus: s.focus === f,
                     editors: EDITORS[mode][f].slice(), used: USED[mode][f] };
    });

    var trainIdx = STATIONS.indexOf('train');
    if (idx > trainIdx) s.edit = 1;
    else if (idx === trainIdx) s.edit = T.clamp((local - EDIT_FROM) / (EDIT_TO - EDIT_FROM), 0, 1);

    if (k === 'essence') s.banner = T.ease.out(T.clamp(local / 0.35, 0, 1));
    return s;
  }

  return { FILES: FILES, STATIONS: STATIONS, DURS: DURS, EDITORS: EDITORS, SCHED: SCHED,
           duration: duration, stops: stops, stateAt: stateAt };
});
