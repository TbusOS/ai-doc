const test = require('node:test');
const assert = require('node:assert');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/night-model.js');

const STATIONS = ['evening', 'first', 'night', 'wake'];

test('README: approx 12 experiments per hour, one every 5 minutes', () => {
  assert.equal(M.PER_HOUR, 12);
  assert.equal(M.RUN_MIN, 5);
});

test('stops: 0, the start of every station, the end', () => {
  const st = M.stops();
  assert.equal(st[0], 0);
  assert.equal(st.length, STATIONS.length + 2);
  assert.ok(Math.abs(st[st.length - 1] - M.duration()) < 1e-9);
});

test('every stop lands on the start of its station (local === 0)', () => {
  const st = M.stops().slice(1, -1);
  st.forEach((t, i) => {
    const s = M.stateAt(t);
    assert.equal(s.station, STATIONS[i], `stop ${i}`);
    assert.equal(s.local, 0, `stop ${i}`);
  });
});

test('clock: 21:00 evening, 22:00 asleep, 22:05 after the first run, wake = 22:00 + hours', () => {
  const st = M.stops();
  assert.equal(M.stateAt(st[1]).clock, '21:00');
  assert.equal(M.stateAt(st[2]).clock, '22:00');
  assert.equal(M.stateAt(st[3]).clock, '22:05');
  assert.equal(M.stateAt(M.duration()).clock, '06:00');
  assert.equal(M.stateAt(M.duration(), { hours: 10 }).clock, '08:00');
  assert.equal(M.stateAt(M.duration(), { hours: 4 }).clock, '02:00');
});

test('the human does 2 runs before bed (illustrative) and none while asleep', () => {
  const st = M.stops();
  assert.equal(M.stateAt(st[1]).humanDone, 0);
  assert.equal(M.stateAt(st[2]).humanDone, 2);
  assert.equal(M.stateAt(M.duration()).humanDone, 2);
  assert.equal(M.stateAt(st[2]).asleep, true);
  assert.equal(M.stateAt(st[1] + 0.5).asleep, false);
});

test('the first AI run is done at 22:05', () => {
  const st = M.stops();
  assert.equal(M.stateAt(st[2]).aiDone, 0);
  assert.equal(M.stateAt(st[3]).aiDone, 1);
});

test('morning count is 12 × hours for every slider value', () => {
  for (let h = 4; h <= 10; h++) {
    const s = M.stateAt(M.duration(), { hours: h });
    assert.equal(s.aiDone, 12 * h, `${h} h`);
    assert.equal(s.total, 12 * h, `${h} h`);
    assert.equal(s.humanDone, 2, `${h} h`);
  }
});

test('default sleep is 8 hours: 96 runs, the "approx 100" of README', () => {
  const s = M.stateAt(M.duration());
  assert.equal(s.hours, 8);
  assert.equal(s.aiDone, 96);
});

test('slider values outside 4–10 are clamped', () => {
  assert.equal(M.stateAt(M.duration(), { hours: 2 }).hours, 4);
  assert.equal(M.stateAt(M.duration(), { hours: 14 }).hours, 10);
});

test('the AI never runs faster than 12 an hour', () => {
  for (let t = 0; t <= M.duration(); t += 0.05) {
    const s = M.stateAt(t);
    const hoursAsleep = Math.max(0, s.minute - M.SLEEP_AT) / 60;
    assert.ok(s.aiDone <= 12 * hoursAsleep + 1e-9, `t=${t.toFixed(2)}`);
  }
});

test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 13.9, 3.1, M.duration(), 5.0];
  const a = ts.map(t => JSON.stringify(M.stateAt(t, { hours: 6 })));
  const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t, { hours: 6 }))).reverse();
  assert.deepEqual(a, b);
});

test('copy: a run that did not pay off is "丢掉", as everywhere else on the page', () => {
  const copy = require('../../explain-src/autoresearch/scenes/night.json');
  assert.ok(!/撤掉/.test(JSON.stringify(copy)));
  assert.ok(/丢掉/.test(copy.labels.cell_sub));
});

// Draw the scene in node (the drawing only writes an SVG string) and check that the
// sleeping zZz never touches the "睡 h 小时" label, for every slider value and both layouts.
test('drawing: the zZz stays clear of the "睡 h 小时" label (4 to 10 hours, both layouts)', () => {
  const copy = require('../../explain-src/autoresearch/scenes/night.json');
  let factory = null;
  global.window = {
    ExplainTimeline: global.ExplainTimeline, NightModel: M,
    ExplainDraw: require('../../docs/assets/explain/draw.js'),
    Explain: { register: (name, f) => { factory = f; } }
  };
  delete require.cache[require.resolve('../../docs/assets/explain/autoresearch/night.js')];
  require('../../docs/assets/explain/autoresearch/night.js');
  const svg = { innerHTML: '', setAttribute() {} };
  const w = factory(svg, { copy, caption() {} });
  // rough text box: CJK 1 em wide, Latin 0.6 em; glyphs from 0.85 em above the baseline to 0.15 em below
  const box = (x, y, str, size, anchor) => {
    let wd = 0;
    for (const ch of str) wd += (ch.charCodeAt(0) > 0x2e80 ? 1 : 0.6) * size;
    const x0 = anchor === 'middle' ? x - wd / 2 : anchor === 'end' ? x - wd : x;
    return { x0, x1: x0 + wd, y0: y - 0.85 * size, y1: y + 0.15 * size };
  };
  const texts = html => [...html.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)" style="[^"]*font-size:(\d+)px[^"]*"([^>]*)>([^<]*)<\/text>/g)]
    .map(m => ({ x: +m[1], y: +m[2], size: +m[3], anchor: (m[4].match(/text-anchor="(\w+)"/) || [])[1], str: m[5] }));
  for (const width of [400, 1200]) {
    w.layout(width);
    for (let h = 4; h <= 10; h++) {
      w.setOption('hours', h);
      const label = copy.labels.sleep.replace('{h}', h);
      const a = M.SCHED.find(s => s.key === 'first').start, b = M.SCHED.find(s => s.key === 'night').end;
      for (let k = 0; k < 60; k++) {
        w.render(a + (b - a) * k / 60);
        const all = texts(svg.innerHTML);
        const lab = all.find(t => t.str === label);
        assert.ok(lab, `label ${label}`);
        const L = box(lab.x, lab.y, lab.str, lab.size, lab.anchor);
        for (const z of all.filter(t => t.str === 'z' || t.str === 'Z')) {
          const Z = box(z.x, z.y, z.str, z.size, z.anchor);
          const hit = Z.x0 < L.x1 && Z.x1 > L.x0 && Z.y0 < L.y1 && Z.y1 > L.y0;
          assert.ok(!hit, `${width}px, ${h} h, frame ${k}: ${z.str} at (${z.x}, ${z.y}) overlaps "${label}"`);
        }
      }
    }
  }
  delete global.window;
});
