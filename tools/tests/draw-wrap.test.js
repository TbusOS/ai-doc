// ExplainDraw.wrap(text, maxWidth, measure): line breaking for Chinese text with English words,
// numbers and code mixed in. The scenes measure with Painter.width (CJK 1em, Latin 0.6em);
// here one em = 1, so maxWidth is "how many Chinese characters fit on a line".
const test = require('node:test');
const assert = require('node:assert');
const D = require('../../docs/assets/explain/draw.js');

const measure = s => { let w = 0; for (const ch of String(s)) w += ch.charCodeAt(0) > 0x2e80 ? 1 : 0.6; return w; };
const wrap = (text, max) => D.wrap(text, max, measure);

const CLOSERS = '，。、；：？！）」』”’》〉】';
const OPENERS = '（「『“‘《〈【';
const latin = ch => /[A-Za-z0-9_]/.test(ch || '');

// texts from the scenes (progress cards, where notes, limits cards) and a few made-up ones
const SAMPLES = [
  '再缩到八分之一，也就是 256 个 token。',
  '✓ 打分代码在 prepare.py，AI 改不了',
  '每更新一次参数要看的 token 数，从约 52 万减到约 26 万。5 分钟里能更新更多次（标签里写着 more steps）。',
  'RoPE 用一组快慢不同的旋转标记每个词的位置。base 从 10000 调到 50000，大部分旋转变慢了。',
  '各层轮流用两种注意力：S 只看最近一段，L 看全部上文。SSSL 改成 SSSSL，只看最近一段的层更多了。',
  '修法：把测试列为不许改，最好再用文件权限真正锁住',
  'README 列了 macOS、Windows、AMD 的社区分支。',
  '找出让研究进展最快的「研究组织代码」',
  'halve total batch 524K→262K (more steps)',
  '分数从 0.9979 降到 0.9773（读数，误差约 ±0.00003）。',
];

function eachCase(fn) {
  for (const text of SAMPLES) for (let max = 6; max <= 24; max += 0.5) fn(text, max, wrap(text, max));
}

test('wrap exists and keeps short text on one line', () => {
  assert.equal(typeof D.wrap, 'function');
  assert.deepEqual(wrap('三关都过', 10), ['三关都过']);
  assert.deepEqual(wrap('', 10), []);
});

test('"256 个 token。" keeps token whole (the #39 card showed "toke / n")', () => {
  const text = '再缩到八分之一，也就是 256 个 token。';
  for (let max = 8; max <= 20; max += 0.5) {
    const lines = wrap(text, max);
    assert.ok(lines.some(l => l.includes('token。')), `max ${max}: ${lines.join(' | ')}`);
    assert.ok(lines.some(l => /(^|\s)256(\s|$)/.test(l)), `max ${max}: ${lines.join(' | ')}`);
  }
});

test('no text is lost: the lines put together give the text back (spaces at breaks dropped)', () => {
  eachCase((text, max, lines) => assert.equal(lines.join('').replace(/ /g, ''), text.replace(/ /g, ''), `max ${max}`));
});

test('every line fits when no single word is wider than the line', () => {
  // closing punctuation may hang past the edge, but only when the line had no other place to break
  const hang = new RegExp('[' + CLOSERS + ']+$');
  eachCase((text, max, lines) => {
    const words = text.split(/[\s⺀-￿]+/).filter(Boolean);
    if (words.some(w => measure(w) > max)) return;
    lines.forEach(l => assert.ok(measure(l.replace(hang, '')) <= max + 1e-9, `max ${max}: "${l}" is ${measure(l)}`));
  });
  for (let max = 8; max <= 24; max += 0.5) {  // the widths the scenes use: nothing hangs
    for (const text of SAMPLES) wrap(text, max).forEach(l => assert.ok(measure(l) <= max + 1e-9, `max ${max}: "${l}"`));
  }
});

test('English words and numbers are never split across lines', () => {
  eachCase((text, max, lines) => {
    for (let i = 1; i < lines.length; i++) {
      const a = lines[i - 1], b = lines[i];
      const joined = a + b;
      // a break between two Latin characters is fine only where the text had a space
      if (latin(a[a.length - 1]) && latin(b[0])) assert.ok(text.includes(a.slice(-1) + ' ' + b[0]) && !text.includes(joined), `max ${max}: "${a}" | "${b}"`);
    }
  });
});

test('closing punctuation never starts a line, opening punctuation never ends one', () => {
  eachCase((text, max, lines) => {
    lines.forEach((l, i) => {
      if (i > 0) assert.ok(!CLOSERS.includes(l[0]), `max ${max}: line starts with ${l[0]}: ${lines.join(' | ')}`);
      if (i < lines.length - 1) assert.ok(!OPENERS.includes(l[l.length - 1]), `max ${max}: line ends with ${l[l.length - 1]}: ${lines.join(' | ')}`);
    });
  });
});

test('the last line is not left with one or two characters when it can be avoided', () => {
  // where's note wrapped as "…AI 改不" / "了"
  const core = s => s.replace(/[\s，。、；：？！）」』”’》〉】（「『“‘《〈【,.;:!?()✓✗]/g, '');
  eachCase((text, max, lines) => {
    if (lines.length < 2) return;
    assert.ok(core(lines[lines.length - 1]).length >= 3, `max ${max}: ${lines.join(' | ')}`);
  });
  assert.deepEqual(wrap('✓ 打分代码在 prepare.py，AI 改不了', 14.5).slice(-1)[0].includes('改不了'), true);
});

test('a word wider than the line is cut by characters rather than overflowing', () => {
  const lines = wrap('见 abcdefghijklmnopqrstuvwxyz 这一行', 6);
  lines.forEach(l => assert.ok(measure(l) <= 6 + 1e-9, l));
  assert.equal(lines.join('').replace(/ /g, ''), '见abcdefghijklmnopqrstuvwxyz这一行');
});
