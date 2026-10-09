# 第三阶段 · 场景 agent 共同简报

你负责 autoresearch 图解页的几个场景(见派你时给的 id 列表)。先读:
`.claude/skills/paper-explainer/SKILL.md` → 计划 `docs/superpowers/plans/2026-10-09-explainers-phase3-scenes.md` 的场景表(你那几行就是设计,照做;有更好的画法可以改,但讲的内容和依据不能变)→ 范例 `explain-src/autoresearch/scenes/loop.json`、`docs/assets/explain/autoresearch/loop-model.js` / `loop.js`、`tools/tests/loop-model.test.js`。

## 只能碰这些文件

- `explain-src/autoresearch/scenes/<id>.json`
- `docs/assets/explain/autoresearch/<widget>-model.js`、`<widget>.js`(widget 名 = 场景 id)
- `tools/tests/<widget>-model.test.js`

不改公用文件(engine / draw / build / css / 别的场景 / zh.json)。公用部分缺东西,在最终报告里写清楚缺什么,由主会话补。**不 commit。**

## 每个场景的步骤

1. 先读依据:`explain-src/autoresearch/sources/` 里对应的原文(README.md / program.md / prepare.py / train.py / analysis.ipynb / progress-transcript.md)、`data/progress.json`。所有引用都要从这里逐字复制。
2. 写 `tools/tests/<widget>-model.test.js`,至少测三件事:每个停靠点落在对应那一站的开头(`local === 0`)、调用顺序不影响结果、这个场景的关键数值(例如 12 × 小时、bpb 的计算结果)。跑 `node --test tools/tests/<widget>-model.test.js`,先看它失败。
3. 写 `<widget>-model.js`:UMD 包装(参照 loop-model.js),纯函数 `stateAt(t, opts)`,一张绝对时间表,`stops()` 第一个是 0、最后一个是总时长。测试通过。
4. 写 `scenes/<id>.json`。字段参照 loop.json,常用的有:
   - `id / chapter / widget / title / lead / body[] / stage_label / first_caption / original_anchor`
   - `controls[]`:`{type: toggle|slider|choice, option, label, tag?, basis?, note?, min/max/step/value, choices[{value,label}]}`
   - `transcript[]`:动画的文字版,每条一句,把动画里会出现的字幕全部覆盖
   - `claims[]`
   - 场景自己用的文案:标签、字幕模板等,随你命名,绘制代码从 `ctx.copy` 里读
   - 原文页锚点见 `docs/zh/articles/autoresearch.html` 里的 id
5. 写 `<widget>.js`:
   - 用 `window.ExplainDraw` 的 `Painter / tag / fmt / polar / lerp`,用 `Explain.register('<widget>', factory)` 注册;
   - 横排 1200×675、竖排 540×1080(svg 宽 < 780px 时用竖排),两种布局都要有,竖排 `minFont: 15`;
   - 字幕每帧用 `ctx.caption(...)` 设置;
   - 场景内的点击、悬停交互改完内部状态后调 `ctx.redraw()`;控件变化走 `setOption(key, value)`;
   - 卡片和终端上的字加 `data-on` / `data-fit`,卡片矩形加 `data-box`。
6. 自查:
   - `python3 docs/scripts/explain_build.py --slug autoresearch --only <你的 id,逗号分隔> --out autoresearch--<你的字母>`
   - `PAGE=docs/zh/explain/autoresearch--<字母>.html node --test tools/tests/browser.test.mjs` 全过;
   - `python3 tools/check_sources.py explain-src/autoresearch --scene <id>` 0 errors;
   - `python3 tools/fix_cjk_punct.py --check explain-src/autoresearch/scenes/<id>.json` 退出码 0;
   - 两张词表:`python3 ~/.claude/skills/tech-writing-gate/scripts/check_buzzwords.py --strict <json>`,以及同一个命令加 `--rules ~/.claude/skills/tech-writing-gate/scripts/jargon.tsv`,都要 0 命中。
7. 截图看效果:Playwright 的入口文件由环境变量 `$PLAYWRIGHT` 给出(sky-skills 的 `node_modules/playwright/index.mjs`),本地起 `python3 -m http.server <端口> --directory docs`,或直接用 file://;横排、竖排、深色各看几帧,修到满意。截图放到仓库外的临时目录,不放进仓库。

## 最终报告(中文)

- 每个场景:做了什么、用了哪些原文依据、哪些地方标了「解读」或「示意」、截图路径;
- 跑过的命令和结果;
- 公用部分缺了什么、哪里拿不准。
