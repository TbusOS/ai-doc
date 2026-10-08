# 图解板块 · 第一阶段(样张)实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做出一张能判断视觉方向的样张:新视觉 + 新首页首屏 + autoresearch 图解页的场景 4(实验循环),
同时把后面阶段要用的地基(时间轴、场景引擎、出处检查、原文不变检查)一起打好。

**Architecture:** 静态站,Python 构建脚本把 `explain-src/<slug>/zh.json` 渲染成 HTML(文字在构建时写进页面)。
页面上的动画由一个小引擎驱动:每个场景提供 `stateAt(t)` 纯函数(模型)和 `draw(state)`(SVG 绘制),
引擎负责播放 / 单步 / 拖进度 / 视口外暂停 / 减少动态效果 / 导出用的 `__seek(t)`。

**Tech Stack:** Python 3.14 标准库 + `markdown`(已装);原生 JS(普通 `<script>`,不用 ES module,
因为检查脚本用 `file://` 打开页面,该方式下浏览器不加载 module);Node 25 `node --test`;
Python 测试用标准库 `unittest`(本机没装 pytest);Playwright 借用 sky-skills 的 `node_modules`。

**Spec:** `docs/superpowers/specs/2026-10-08-paper-explainers-design.md`

## Global Constraints

- 原文页(`docs/{en,zh}/articles/*.html` 的 `<article class="article-body">` 正文)本阶段**不许变**;样张首页放 `docs/sample/index.html`,不覆盖现有首页。
- 图解页地址:`docs/zh/explain/autoresearch.html`。
- 每条「原文」引用必须能在 `explain-src/autoresearch/sources/` 里逐字找到。
- 出处标记三种:`原文` / `解读` / `示意`;「解读」必须带 `basis` 字段写明从什么推的。
- 场景绘制代码里不写死颜色值,一律用 CSS 变量(深色模式要能用)。
- 颜色意思全站固定:保留 = `--keep`(绿),丢弃 = `--discard`(灰),崩溃 = `--crash`(红),重点 = `--accent`(橙)。
- 字体:标题 Bricolage Grotesque + Noto Sans SC;正文 Source Serif 4 + Noto Serif SC;批注 LXGW WenKai Screen(jsdelivr `lxgw-wenkai-screen-webfont@1.7.0/lxgwwenkaigbscreen.css`);代码 JetBrains Mono。
- `prefers-reduced-motion: reduce` 时显示最终帧,文字不缺。
- 文案过 `tech-writing-gate` 两张词表,`--strict` 0 命中。
- commit message 不加任何 Claude / Anthropic 署名。

## Review Focus

1. **手机 390px 宽**:舞台 SVG 等比缩小后,图里的字不能小于 9px —— 由 Task 9 的 `check_objective.mjs` O4 卡;舞台在窄屏改用竖排布局(Task 7)。
2. **不开 JS / 减少动态效果**:场景文字、出处、原句都要在 HTML 里 —— Task 6 的单元测试检查所有文案都出现在输出 HTML 里;Task 9 O5 再查一遍。
3. **深色模式**:绘制代码里写死的颜色在深底上看不见 —— Task 7 加一条 node 测试,扫描绘制文件里不许出现 `#rgb/#rrggbb` 字面量。
4. **拖进度条到中间再播放**:画面必须跟从头播到这里完全一样 —— Task 7 的模型测试检查 `stateAt(t)` 的结果跟调用顺序无关。
5. **场景滚出视口还在跑动画 / 多个场景同时播**:Task 5 引擎用 IntersectionObserver,视口外暂停;Task 9 手动核对。

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `tools/articles_text.py` | 从文章 HTML 抽正文纯文本 |
| `tools/check_articles_unchanged.py` | `snapshot` 存基线 / `check` 比对 |
| `tools/baselines/articles_text.json` | 基线(80 个页面) |
| `tools/check_sources.py` | 核对 zh.json 里的出处 |
| `tools/tests/test_*.py` | Python 单元测试 |
| `tools/tests/*.test.js` | JS 单元测试 |
| `explain-src/autoresearch/sources/` | karpathy/autoresearch `e6d79c1` 的 README.md / program.md / prepare.py 副本 + `SOURCE.txt` |
| `explain-src/autoresearch/zh.json` | 图解页全部文案和出处 |
| `docs/assets/theme.css` | 新视觉:颜色变量(浅 / 深)、字体、基础排版、页头页脚、卡片 |
| `docs/assets/explain/timeline.js` | 纯函数:clamp / 缓动 / 分段 / 排程 / 定位 / 跳转点 |
| `docs/assets/explain/engine.js` | DOM:挂载场景、控制条、视口暂停、减少动态效果、capture 模式、主题切换 |
| `docs/assets/explain/explain.css` | 图解页和舞台、控制条、出处卡样式 |
| `docs/assets/explain/autoresearch/loop-model.js` | 场景 4 模型:`stateAt(t, opts)` |
| `docs/assets/explain/autoresearch/loop.js` | 场景 4 绘制 |
| `docs/assets/home/stack.js` | 首页开场「AI 工程栈」动画 |
| `docs/scripts/site_v2.py` | 新页头 / 页脚 / `<head>` / 样张首页 |
| `docs/scripts/explain_build.py` | 从 zh.json 渲染图解页 |

偏离设计稿一处:设计稿 6.1 把场景代码放 `explain-src/<slug>/widgets/`,但它是运行时代码,必须发布,
放 `explain-src` 还得多一步拷贝。改为直接放 `docs/assets/explain/<slug>/`;`explain-src` 只放不发布的输入(文案、原文副本、插画工作流)。

---

### Task 1: 原文不变检查 + 基线

**Files:**
- Create: `tools/articles_text.py`, `tools/check_articles_unchanged.py`, `tools/tests/test_articles_text.py`, `tools/baselines/articles_text.json`

**Interfaces:**
- Produces: `extract_article_text(html: str) -> str`;CLI `python3 tools/check_articles_unchanged.py snapshot|check`,`check` 有差异时退出码 1 并打印页面名。

- [ ] **Step 1: 写失败测试** `tools/tests/test_articles_text.py`

```python
import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from articles_text import extract_article_text

PAGE = """<html><body><nav>导航</nav>
<article class="article-body"><h1>标题</h1><p>第一段 <em>强调</em></p>
<pre><code>x = 1</code></pre></article><footer>页脚</footer></body></html>"""

class ExtractTest(unittest.TestCase):
    def test_only_article_body(self):
        t = extract_article_text(PAGE)
        self.assertIn("标题", t); self.assertIn("强调", t); self.assertIn("x = 1", t)
        self.assertNotIn("导航", t); self.assertNotIn("页脚", t)

    def test_whitespace_normalized(self):
        a = extract_article_text('<article class="article-body"><p>a\n   b</p></article>')
        b = extract_article_text('<article class="article-body">\n<p>a b</p>\n</article>')
        self.assertEqual(a, b)

    def test_missing_article_raises(self):
        with self.assertRaises(ValueError):
            extract_article_text("<html><body>none</body></html>")

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 跑测试确认失败** — `python3 -m unittest discover -s tools/tests -p 'test_*.py' -v`,预期 `ModuleNotFoundError: articles_text`
- [ ] **Step 3: 实现** `tools/articles_text.py`:用 `html.parser.HTMLParser`,遇到 `<article class="article-body">` 开始收集文本,按嵌套深度遇到对应 `</article>` 结束;结果 `" ".join(text.split())`;没找到就 `raise ValueError`。
- [ ] **Step 4: 实现 CLI** `tools/check_articles_unchanged.py`:遍历 `docs/en/articles/*.html` 和 `docs/zh/articles/*.html`,key 为 `en/xxx.html`;`snapshot` 写 JSON(`sort_keys=True, ensure_ascii=False, indent=0`);`check` 逐个比对,打印差异页面和第一个不同字符附近 60 字,有差异退出 1;页面数量变化也算差异。
- [ ] **Step 5: 跑测试通过** + `python3 tools/check_articles_unchanged.py snapshot` + `python3 tools/check_articles_unchanged.py check`(预期 `80 pages unchanged`)
- [ ] **Step 6: 提交** `test: baseline check that original article text stays unchanged`

### Task 2: 原文副本 + 出处检查

**Files:**
- Create: `explain-src/autoresearch/sources/{README.md,program.md,prepare.py,SOURCE.txt}`, `tools/check_sources.py`, `tools/tests/test_check_sources.py`

**Interfaces:**
- Produces: `check_claims(data: dict, sources_dir: Path) -> list[str]`(返回错误列表,空 = 通过);CLI `python3 tools/check_sources.py explain-src/autoresearch` 有错退出 1。
- zh.json 里 claim 的格式(Task 6 依赖):`{"tag": "原文"|"解读"|"示意", "text": "大白话一句", "quote": "英文原句(原文必填)", "source": "program.md(原文必填)", "basis": "推断依据(解读必填)"}`;claim 出现在 `scenes[].claims[]`。

- [ ] **Step 1: 拷贝副本** — `cp ~/linux-kernel/github/autoresearch/{README.md,program.md,prepare.py} explain-src/autoresearch/sources/`;`SOURCE.txt` 写 `karpathy/autoresearch e6d79c1 (git -C ~/linux-kernel/github/autoresearch rev-parse --short HEAD)`
- [ ] **Step 2: 写失败测试**

```python
import sys, unittest, tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from check_sources import check_claims

class ClaimsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        (self.tmp / "program.md").write_text("If val_bpb improved (lower), you \"advance\" the branch,\nkeeping the git commit", encoding="utf-8")

    def data(self, claim):
        return {"scenes": [{"id": "s", "claims": [claim]}]}

    def test_quote_found_across_line_break(self):
        c = {"tag": "原文", "text": "变好就前进", "source": "program.md",
             "quote": "you \"advance\" the branch, keeping the git commit"}
        self.assertEqual(check_claims(self.data(c), self.tmp), [])

    def test_quote_missing(self):
        c = {"tag": "原文", "text": "x", "source": "program.md", "quote": "advance the trunk"}
        self.assertEqual(len(check_claims(self.data(c), self.tmp)), 1)

    def test_unknown_source_file(self):
        c = {"tag": "原文", "text": "x", "source": "nope.md", "quote": "a"}
        self.assertEqual(len(check_claims(self.data(c), self.tmp)), 1)

    def test_interpretation_needs_basis(self):
        self.assertEqual(len(check_claims(self.data({"tag": "解读", "text": "x"}), self.tmp)), 1)
        self.assertEqual(check_claims(self.data({"tag": "解读", "text": "x", "basis": "从 README 推"}), self.tmp), [])

    def test_bad_tag(self):
        self.assertEqual(len(check_claims(self.data({"tag": "猜的", "text": "x"}), self.tmp)), 1)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: 跑测试确认失败**
- [ ] **Step 4: 实现** — 比较前两边都做 `" ".join(s.split())`;错误信息格式 `"<scene id>: <原因>: <text 前 30 字>"`;CLI 读 `<dir>/zh.json` 和 `<dir>/sources/`,打印 `N claims checked, M errors`。
- [ ] **Step 5: 跑测试通过**
- [ ] **Step 6: 提交** `feat(tools): source-quote checker for explainer claims`

### Task 3: 时间轴纯函数

**Files:**
- Create: `docs/assets/explain/timeline.js`, `tools/tests/timeline.test.js`

**Interfaces:**
- Produces(浏览器 `window.ExplainTimeline`,Node `require`):
  - `clamp(x, lo, hi) -> number`
  - `ease.inOut(p)`, `ease.out(p)`(p ∈ [0,1])
  - `progress(t, start, dur) -> number`(0..1,dur=0 时 t≥start 返回 1)
  - `schedule(segments: {key, dur}[], offset=0) -> {key, start, end}[]`
  - `locate(sched, t) -> {index, item, local}`(local = 段内 0..1;t 超出两端时夹到首 / 末段)
  - `nextStop(stops: number[], t) -> number`,`prevStop(stops, t) -> number`(严格大于 / 小于 t,超出返回端点)

- [ ] **Step 1: 写失败测试**

```js
const test = require('node:test');
const assert = require('node:assert');
const T = require('../../docs/assets/explain/timeline.js');

test('clamp', () => { assert.equal(T.clamp(5, 0, 3), 3); assert.equal(T.clamp(-1, 0, 3), 0); });
test('progress', () => {
  assert.equal(T.progress(0, 1, 2), 0); assert.equal(T.progress(2, 1, 2), 0.5);
  assert.equal(T.progress(9, 1, 2), 1); assert.equal(T.progress(1, 1, 0), 1);
});
test('ease endpoints', () => {
  for (const f of [T.ease.inOut, T.ease.out]) { assert.equal(f(0), 0); assert.equal(f(1), 1); }
});
test('schedule + locate', () => {
  const s = T.schedule([{ key: 'a', dur: 1 }, { key: 'b', dur: 2 }], 0.5);
  assert.deepEqual(s.map(x => [x.key, x.start, x.end]), [['a', 0.5, 1.5], ['b', 1.5, 3.5]]);
  const l = T.locate(s, 2.5); assert.equal(l.item.key, 'b'); assert.equal(l.local, 0.5);
  assert.equal(T.locate(s, 0).index, 0); assert.equal(T.locate(s, 99).index, 1);
});
test('stops', () => {
  const st = [0, 1, 2.5, 4];
  assert.equal(T.nextStop(st, 1), 2.5); assert.equal(T.prevStop(st, 1), 0);
  assert.equal(T.nextStop(st, 4), 4); assert.equal(T.prevStop(st, 0), 0);
});
```

- [ ] **Step 2: 跑测试确认失败** — `node --test tools/tests/`
- [ ] **Step 3: 实现**(UMD 包装:`(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.ExplainTimeline = f(); })(this, function () { ... })`;`locate` 用二分查找)
- [ ] **Step 4: 跑测试通过**
- [ ] **Step 5: 提交** `feat(explain): pure timeline helpers`

### Task 4: 新视觉 `theme.css` + `explain.css`

**Files:**
- Create: `docs/assets/theme.css`, `docs/assets/explain/explain.css`

- [ ] **Step 1: 写 `theme.css`** — 至少包含:
  - `:root` 浅色变量:`--paper #f6efe2`、`--paper-2 #efe6d4`、`--card #fbf8f1`、`--ink #1e1a15`、`--ink-2 #574e43`、`--line #dccfb8`、`--keep #2e8a57`、`--discard #8f877c`、`--crash #c4423a`、`--accent #d9682a`、`--info #3a6db3`;主题色 `--t-inference #6a9bcc`、`--t-self #d97757`、`--t-agent #788c5d`、`--t-training #a14238`、`--t-thinking #6b8e3c`、`--t-memory #4a4a6a`
  - 深色:`@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {...} }` 和 `:root[data-theme="dark"] {...}` 两处同值:`--paper #11151d`、`--paper-2 #171c26`、`--card #1b212d`、`--ink #ece5d8`、`--ink-2 #b5ad9f`、`--line #2b3342`、`--keep #4cbb82`、`--discard #858c99`、`--crash #ee6b5f`、`--accent #f08a47`、`--info #74a0e3`
  - 字体变量 `--font-head / --font-body / --font-hand / --font-mono`(值见 Global Constraints)
  - 基础:`body { background: var(--paper); color: var(--ink); font-family: var(--font-body); }`,标题用 `--font-head`;页头 `.site-head`(sticky,半透明纸色 + 细底线)、页脚 `.site-foot`、主题切换按钮 `.theme-btn`、卡片 `.card`、标签 `.chip`、容器 `.wrap`(max 1160px,左右 20px 内边距)
  - `@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation: none !important; transition: none !important; } }`
- [ ] **Step 2: 写 `explain.css`** — 图解页:`.ex-hero`、五问导航 `.ex-chapters`(可横向滚动的 chip 列;未完成的 chip `aria-disabled` 灰显)、`.scene`、舞台 `.stage`(`aspect-ratio: 16/9`,圆角,`--card` 底,细边框)、控制条 `.stage-controls`(播放、上一步、下一步、进度 `input[type=range]`、倍速)、字幕行 `.stage-caption`(`--font-hand`,`aria-live=polite`)、开关 `.ex-toggle`、出处卡 `details.claim`(summary 里 `.tag-原文/.tag-解读/.tag-示意` 三种色块)、`body.capture` 模式(只显示目标舞台,固定 1200×675,隐藏其他一切)
- [ ] **Step 3: 提交** `feat(site): new theme tokens and explainer styles`

### Task 5: 场景引擎 `engine.js`

**Files:**
- Create: `docs/assets/explain/engine.js`

**Interfaces:**
- Consumes: `window.ExplainTimeline`
- Produces: `window.Explain.register(name, factory)`;`factory(root, ctx)` 返回 `{ duration: number, stops: number[], render(t: number): void, setOption?(key, value): void }`;
  `ctx = { copy: object (该场景在 zh.json 里的对象), data: object (整个 zh.json), caption(text): void }`。
  页面里每个 `<section class="scene" data-widget="<name>" data-scene="<id>">` 内有 `.stage-svg`(SVG 挂载点)和 `.stage-controls`。
  capture 模式:URL `?capture=<sceneId>` → `body.capture`,`window.__explain = { duration, seek(t) }`。
  全站数据:`<script type="application/json" id="explain-data">` 内嵌 zh.json。

- [ ] **Step 1: 实现** — 要点:
  - `DOMContentLoaded` 后读数据,对每个 `.scene[data-widget]` 找已注册的 factory 并挂载
  - 播放循环:`requestAnimationFrame`,`t += dt * speed`,到 `duration` 停住并把播放键变回 ▶
  - IntersectionObserver:可见比例 ≥ 0.5 且未播放过时自动播;离开视口暂停
  - `matchMedia('(prefers-reduced-motion: reduce)')` 为真:不自动播,直接 `render(duration)`;按钮仍可手动操作
  - 控制条:▶/❚❚(`aria-label` 切换)、上一步 / 下一步(`prevStop/nextStop`)、range(0..1000 映射到 0..duration)、倍速按钮循环 0.5/1/2
  - 键盘:舞台获得焦点时空格 = 播放 / 暂停,← / → = 上一步 / 下一步
  - 开关:`.ex-toggle input[type=checkbox][data-option]` 变化时调 `setOption(key, checked)` 然后重绘当前 t
  - 主题切换按钮 `.theme-btn`:在 auto → light → dark 间循环,写 `html[data-theme]`,`localStorage` 读写包 try/catch
  - capture 模式:只挂载目标场景,不自动播,暴露 `__explain`
- [ ] **Step 2: 提交** `feat(explain): scene engine with controls, viewport pause, reduced motion, capture mode`

(引擎的 DOM 行为在 Task 9 用真实浏览器验证;纯逻辑已在 Task 3 测过。)

### Task 6: 图解页构建 + 样张文案

**Files:**
- Create: `docs/scripts/site_v2.py`, `docs/scripts/explain_build.py`, `explain-src/autoresearch/zh.json`, `tools/tests/test_explain_build.py`

**Interfaces:**
- Produces: `site_v2.head(title, prefix, extra="") -> str`、`site_v2.header(prefix, active, lang="zh", alt=None) -> str`、`site_v2.footer(prefix) -> str`;
  `explain_build.render_explain(data: dict, prefix="../../") -> str`、`explain_build.build_all() -> list[Path]`(写 `docs/zh/explain/<slug>.html`)。
- zh.json 顶层:`slug, title, kicker, lead, reading_minutes, paper{title,author,date,repo,original_page}, chapters[{id,num,title}], scenes[{id, chapter, widget, title, lead, body[], stations{}, verdicts{}, toggle{option,label,tag,note}, claims[], original_anchor}]`

- [ ] **Step 1: 写失败测试** `tools/tests/test_explain_build.py`

```python
import sys, unittest, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "docs" / "scripts"))
from explain_build import render_explain

def walk_strings(o):
    if isinstance(o, str): yield o
    elif isinstance(o, dict):
        for v in o.values(): yield from walk_strings(v)
    elif isinstance(o, list):
        for v in o: yield from walk_strings(v)

class RenderTest(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / "explain-src/autoresearch/zh.json").read_text(encoding="utf-8"))
        self.html = render_explain(self.data)

    def test_all_scene_copy_in_html(self):
        import html as h
        for sc in self.data["scenes"]:
            for key in ("title", "lead"):
                self.assertIn(h.escape(sc[key]), self.html)
            for p in sc["body"]:
                self.assertIn(h.escape(p), self.html)
            for c in sc["claims"]:
                self.assertIn(h.escape(c["text"]), self.html)
                if c["tag"] == "原文":
                    self.assertIn(h.escape(c["quote"]), self.html)

    def test_chapters_and_original_link(self):
        for ch in self.data["chapters"]:
            self.assertIn(ch["title"], self.html)
        self.assertIn(self.data["paper"]["original_page"], self.html)

    def test_data_embedded_and_scripts_ordered(self):
        self.assertIn('id="explain-data"', self.html)
        i_t = self.html.index("timeline.js"); i_e = self.html.index("engine.js")
        self.assertLess(i_t, i_e)

    def test_no_script_closing_in_embedded_json(self):
        start = self.html.index('id="explain-data"')
        blob = self.html[start:self.html.index("</script>", start)]
        self.assertNotIn("</", blob)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 写 zh.json 样张内容** — 5 个 chapter(`what 一 这是什么 / without 二 没有它会怎样 / why 三 为什么这么设计 / where 四 用在什么场景 / how 五 机制细节`);只有一个 scene `loop`(chapter `why`),含:
  - `stations`:`edit / commit / train / read / decide / log` 六站的短标签和每站大白话字幕
  - `verdicts`:`baseline / keep / discard / crash` 的字幕;`toggle`:`{"option":"noReset","label":"去掉 git reset 会怎样","tag":"解读","note":"…"}`
  - `claims`(每条原文 quote 都从 `sources/program.md` 里逐字摘):循环第 8 步 advance、第 9 步 git reset、第一次跑基线、results.tsv 四行示例、crash 的处理、results.tsv 不提交;外加一条「解读」:没有 reset 时坏改动会留在分支上(basis:由第 8–9 步反推)
  - `original_anchor: "3-the-experimentation-loop"`
- [ ] **Step 3: 跑测试确认失败**(`explain_build` 不存在)
- [ ] **Step 4: 实现 `site_v2.py` + `explain_build.py`** — 页面结构:页头(AI Doc · 首页 / 主题 / 开源模型 · 「图解 | 原文」切换 · 主题按钮)→ hero(kicker、h1、lead、作者 / 日期 / 阅读时间、「读原文 →」)→ 五问导航(有场景的 chapter 是锚点,没有的 `aria-disabled="true"` 并显示「制作中」)→ 每个 chapter 一个 `<section>`,内含场景:章节号、h2、lead、body 段落、舞台(`<svg class="stage-svg" viewBox="0 0 1200 675" role="img" aria-label=标题>` + 字幕行 + 控制条)、开关、出处列表(`<details class="claim">`:summary = 标记色块 + 大白话;展开 = `<blockquote lang="en">` 原句 + 「出处:program.md」)、「对照原文 →」(`original_page#original_anchor`)→ 页脚;`<script type="application/json" id="explain-data">` 内嵌 `json.dumps(data, ensure_ascii=False).replace("</", "<\\/")`;脚本顺序 timeline.js → engine.js → 场景的 model → 场景的绘制文件。
- [ ] **Step 5: 跑测试通过** + `python3 docs/scripts/explain_build.py` 生成页面 + `python3 tools/check_sources.py explain-src/autoresearch`(0 errors)
- [ ] **Step 6: 提交** `feat(explain): explainer page builder and autoresearch sample copy`

### Task 7: 场景 4「实验循环 + git 只进不退」

**Files:**
- Create: `docs/assets/explain/autoresearch/loop-model.js`, `docs/assets/explain/autoresearch/loop.js`, `tools/tests/loop-model.test.js`, `tools/tests/no-hardcoded-colors.test.js`

**Interfaces:**
- Consumes: `ExplainTimeline`、`Explain.register`
- Produces: `LoopModel.ROWS`(program.md「Logging results」示例的 4 行:`a1b2c3d 0.997900 keep baseline` / `b2c3d4e 0.993200 keep increase LR to 0.04` / `c3d4e5f 1.005000 discard switch to GeLU activation` / `d4e5f6g 0 crash double model width (OOM)`)、
  `LoopModel.STATIONS = ['edit','commit','train','read','decide','log']`、`LoopModel.DURS = {edit:1.0, commit:0.5, train:1.4, read:0.7, decide:1.2, log:0.6}`、`LoopModel.INTRO = 1.0`、`LoopModel.OUTRO = 2.0`、
  `LoopModel.duration() -> number`(= 1.0 + 4×5.4 + 2.0 = 24.6)、`LoopModel.stops() -> number[]`(每站起点 + 结尾,共 4×6+1=25 个)、
  `LoopModel.stateAt(t, {noReset=false}) -> { phase: 'intro'|'run'|'outro', round, station, local, nodes: [{commit, status: 'pending'|'keep'|'discard'|'crash', onBranch: bool}], head: number (-1 = 无), best: number|null, headBpb: number|null, rows: number, readout: string|null, verdict: null|'baseline'|'keep'|'discard'|'crash' }`

- [ ] **Step 1: 写失败测试** `tools/tests/loop-model.test.js`

```js
const test = require('node:test');
const assert = require('node:assert');
global.ExplainTimeline = require('../../docs/assets/explain/timeline.js');
const M = require('../../docs/assets/explain/autoresearch/loop-model.js');

const endOfRound = r => M.INTRO + (r + 1) * 5.4 - 1e-6;

test('duration and stops', () => {
  assert.ok(Math.abs(M.duration() - 24.6) < 1e-9);
  assert.equal(M.stops().length, 25);
});
test('intro is empty', () => {
  const s = M.stateAt(0);
  assert.equal(s.phase, 'intro'); assert.equal(s.rows, 0); assert.equal(s.nodes.length, 0);
});
test('baseline kept', () => {
  const s = M.stateAt(endOfRound(0));
  assert.equal(s.nodes[0].status, 'keep'); assert.equal(s.head, 0); assert.equal(s.best, 0.9979); assert.equal(s.rows, 1);
});
test('discard resets head', () => {
  const s = M.stateAt(endOfRound(2));
  assert.equal(s.nodes[2].status, 'discard'); assert.equal(s.nodes[2].onBranch, false);
  assert.equal(s.head, 1); assert.equal(s.best, 0.9932); assert.equal(s.headBpb, 0.9932);
});
test('noReset keeps the bad commit on the branch', () => {
  const s = M.stateAt(endOfRound(2), { noReset: true });
  assert.equal(s.nodes[2].onBranch, true); assert.equal(s.head, 2); assert.equal(s.headBpb, 1.005);
  assert.equal(s.best, 0.9932);
});
test('crash shows empty grep and is not kept', () => {
  const mid = M.INTRO + 3 * 5.4 + 1.0 + 0.5 + 1.4 + 0.35; // round 3, read station
  assert.equal(M.stateAt(mid).readout, '');
  const s = M.stateAt(endOfRound(3));
  assert.equal(s.nodes[3].status, 'crash'); assert.equal(s.nodes[3].onBranch, false); assert.equal(s.head, 1);
});
test('end state', () => {
  const s = M.stateAt(M.duration());
  assert.equal(s.phase, 'outro'); assert.equal(s.rows, 4); assert.equal(s.best, 0.9932);
});
test('pure: order of calls does not matter', () => {
  const ts = [7.3, 0.2, 19.9, 3.1, 24.6, 12.0];
  const a = ts.map(t => JSON.stringify(M.stateAt(t)));
  const b = [...ts].reverse().map(t => JSON.stringify(M.stateAt(t))).reverse();
  assert.deepEqual(a, b);
});
```

`tools/tests/no-hardcoded-colors.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, '../../docs/assets/explain');
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') && files.push(p); } })(dir);
const homeStack = path.join(__dirname, '../../docs/assets/home/stack.js');
if (fs.existsSync(homeStack)) files.push(homeStack);
test('drawing code uses CSS variables, not hex colors', () => {
  for (const f of files) {
    const hits = fs.readFileSync(f, 'utf8').match(/['"`]#[0-9a-fA-F]{3,8}\b/g);
    assert.equal(hits, null, `${path.basename(f)}: ${hits}`);
  }
});
```

- [ ] **Step 2: 跑测试确认失败**
- [ ] **Step 3: 实现 `loop-model.js`** — 每轮的判定:轮 0 = baseline(keep);之后 `crash` 行 → crash;`bpb < best` → keep;否则 discard。`decide` 站的 `local ≥ 0.5` 时判定生效(节点变色、head 移动);`log` 站 `local ≥ 0.3` 时 `rows` 加一;`read` 站 `readout` = crash 时 `''`,否则 `'val_bpb: ' + bpb.toFixed(6)`;`commit` 站开始时新节点以 `pending` 出现。`noReset` 时 discard 节点 `onBranch=true` 且 head 移到它,`headBpb` = 该行 bpb;crash 在 `noReset` 下也不留(崩溃的代码跑不出分数,program.md 要求修或跳过)。
- [ ] **Step 4: 实现 `loop.js`**(宽屏布局,viewBox 1200×675):
  - 左半:六站环形路线(圆心 (300, 330),半径 200),每站一个圆角标签;当前站 `var(--accent)` 高亮,一个小圆点沿弧线从上一站移到当前站(`ease.inOut`)
  - 环中心:当前站的大图标区 —— `edit` 显示 `train.py` 卡片和本轮 desc;`train` 显示 5:00 倒计时环;`read` 显示终端一行 `grep "^val_bpb:" run.log` 和 readout;crash 时显示「(空)→ 崩溃了,看 `tail -n 50 run.log`」,不编造具体报错(program.md 只写了 `OOM`);`decide` 显示「0.993200 < 0.997900 ?」比较式和判定章
  - 右上:git 分支(y=150),分支名 `autoresearch/mar5`(program.md 示例标签),节点从左往右排,`keep` 实心 `var(--keep)`,`discard` 虚线 `var(--discard)` 并在判定后向下滑出 + 一条弯箭头回到 head 写 `git reset`,`crash` 红色 ×;HEAD 小旗
  - 右下:`results.tsv` 表格(等宽字体,表头 `commit val_bpb memory_gb status description`),行随 `rows` 出现,status 列按颜色
  - 右上角徽章:「当前最好 val_bpb」;`noReset` 时多一行「分支上代码的分数」,比最好差时用 `var(--crash)`
  - 字幕:每帧调用 `ctx.caption(text)`(站字幕或判定字幕),文案全来自 `ctx.copy`
  - 窄屏(容器宽 < 640px):换竖排 viewBox 675×1200 布局(环在上、分支和表格在下),字号按竖排重排,保证 390px 宽时最小字 ≥ 9px
  - 所有颜色用 `var(--…)`;SVG 文本用 `font-family: var(--font-hand)` 或 `var(--font-mono)`
- [ ] **Step 5: 跑全部 JS 测试通过** — `node --test tools/tests/`
- [ ] **Step 6: 浏览器里看一遍**(本地 `python3 -m http.server 8765 --directory docs`,Playwright 截 t = 0 / 3 / 9 / 15 / 21 / 24.6 六帧,宽屏 + 390 宽各一组),修到画面对
- [ ] **Step 7: 提交** `feat(explain): autoresearch scene 4 — experiment loop and git ratchet`

### Task 8: 样张首页首屏

**Files:**
- Create: `docs/assets/home/stack.js`;Modify: `docs/scripts/site_v2.py`(加 `render_home_sample()` 和 `build_sample()`,输出 `docs/sample/index.html`)

**Interfaces:**
- Consumes: `build.CATEGORIES`(`from build import CATEGORIES`,build.py 有 main 守卫,import 不会触发构建)、`ExplainTimeline`
- Produces: `docs/sample/index.html`

- [ ] **Step 1: 实现 `render_home_sample()`** — 页头;hero 左文右图:kicker「AI Doc · 论文图解」、h1「把 AI 论文讲到你能看懂」、lead「{N} 篇论文和工程文章的中英对照翻译,加上用动画和交互图讲原理的图解页。」(N 由 `sum(len(c.papers) for c in CATEGORIES)` 算,当前 40)、两个按钮(「看图解」→ `../zh/explain/autoresearch.html`,「按主题浏览」→ `#topics`);右侧 `<svg id="stack" viewBox="0 0 640 520">`,四层块的标题和篇数在 HTML/SVG 里静态写好(不开 JS 也能看),每块是 `<a href="../zh/<key>.html">`;下方「图解系列」一条:autoresearch 卡片(标题、一句话、「12 个场景 · 约 9 分钟」、「样张:目前只有场景 4」)
- [ ] **Step 2: 实现 `stack.js`** — 用 `ExplainTimeline` 排程:四层依次「描边画出(stroke-dashoffset 从全长到 0)→ 填色淡入 → 文字淡入」,总长约 3 秒;各层之间画连线;悬停块上浮 4px;reduced motion 时直接终态;颜色用主题色变量
- [ ] **Step 3: 生成** `python3 -c "import sys; sys.path.insert(0,'docs/scripts'); import site_v2; site_v2.build_sample()"`,浏览器截图看首屏(1440 宽、390 宽、深色各一张),修到满意
- [ ] **Step 4: 提交** `feat(site): sample homepage hero with animated topic stack`

### Task 9: 检查 + 交样张

- [ ] **Step 1: 全部单元测试** — `python3 -m unittest discover -s tools/tests -p 'test_*.py' -v` 和 `node --test tools/tests/`,全绿
- [ ] **Step 2: 出处检查** — `python3 tools/check_sources.py explain-src/autoresearch`,0 errors
- [ ] **Step 3: 原文不变** — `python3 tools/check_articles_unchanged.py check`,`80 pages unchanged`
- [ ] **Step 4: 客观缺陷检查** — `node ~/linux-kernel/github/sky-skills/skills/design-review/scripts/check_objective.mjs --themes=dark,light docs/sample/index.html docs/zh/explain/autoresearch.html`,退出码 0
- [ ] **Step 5: 词表检查** — 两张词表 `--strict` 扫 `explain-src/autoresearch/zh.json`、`docs/sample/index.html`、`docs/zh/explain/autoresearch.html`,0 命中
- [ ] **Step 6: 手动核对 Review Focus 第 5 条** — Playwright:场景播放中滚出视口,1 秒后读 range 值,再过 1 秒读,两次相同
- [ ] **Step 7: 截图** — 首页首屏(浅 / 深 / 390 宽)、场景 4 四个关键帧,发给 user
- [ ] **Step 8: 提交** `chore: phase-1 sample checks` 并更新当日 `_status`;**停下等 user 看样张**
