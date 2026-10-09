# 图解板块 · 第三阶段(autoresearch 全部场景)实施计划

> **状态(2026-10-09)**:已完成。13 个动画场景 + 逐段批注 + 自测题都在 `docs/zh/explain/autoresearch.html`。
> 跟计划不同的地方:开场改用 GPT 出的 4 张铅笔插画(提示词记录在 `explain-src/autoresearch/illustrations/`),数据放进「屏幕放大」面板;
> neverstop 的卧室用同一套插画;时钟 23:00 → 06:00;引擎加了 `ctx.pause()` / `ctx.reduced`,控件初始值统一推给场景;
> 截取模式的字幕改到画面下方。独立 reviewer 报的问题按「必须修 / 应该修」修完后才合并。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Read `.claude/skills/paper-explainer/SKILL.md` first. Steps use checkbox (`- [x]`) syntax.

**Goal:** 补齐 autoresearch 图解页的全部场景(设计稿第 5 节 0–12 + 边界 + 自测),让页面完整可用。

**Architecture:** 先改公用部分(本计划 Task 1–4,主会话做),再由 4 个 agent 并行做场景(Task 5–8,每个 agent 只碰自己的文件),最后主会话合并、检查、送审(Task 9)。

**Spec:** `docs/superpowers/specs/2026-10-08-paper-explainers-design.md`(第 5 节分镜);流程和规矩:`.claude/skills/paper-explainer/SKILL.md`。

## Global Constraints

- 原文页正文一字不改;`bash tools/check_all.sh` 必须 `ALL CHECKS PASSED`。
- 每个场景的文案只写在 `explain-src/autoresearch/scenes/<id>.json`;字幕、标签、按钮文字全部从这里取。
- 标记三种:`原文`(quote + source,逐字核对)/ `解读`(basis)/ `示意`(假设数字)。代码片段、程序原文段落也走同样的核对(任何带 `quote` + `source` 的对象都会被核对)。
- 场景代码:`<widget>-model.js` 纯函数 `stateAt(t, opts)` + 一张绝对时间表;`<widget>.js` 用 `docs/assets/explain/draw.js` 的工具画图;颜色只用 CSS 变量;卡片上的字加 `data-on` / `data-fit`;竖排(svg 宽 < 780px)时字号 ≥ 15。
- 中文全角标点;不说满话;数字照抄原文精度。
- agent 不 commit、不改别人的文件、不改公用文件;只在自己的文件里工作,自测用 `--only` 生成的单独页面。

## 场景分配与设计

| id / widget | 章节 | agent | 讲什么 | 画面与交互 | 依据 |
|---|---|---|---|---|---|
| `intro` | 开场 | A | 人睡觉,AI 一轮轮做实验 | 窗外月亮沿弧线走(22:00→06:00),床上的人和 Zzz;桌上电脑屏幕显示「实验 #N」从 1 数到 83,旁边小图按 progress 数据画出逐级下降的最好分数线。夜景标「示意」,数字来自 progress.png | README「The idea」;progress-transcript.md 标题 |
| `files` | 一 | A | 三个文件三个角色 | 三张文件卡;单步依次点亮:prepare.py 加锁(人和 AI 都不能改)+ 真实代码片段;train.py 配 AI 图标(唯一能改)+ 片段;program.md 配人图标(人改)+ 片段;结尾一句本质定义 | program.md「CAN / CANNOT」、prepare.py 第 30–32 行、train.py 第 433–451 行 |
| `bpb` | 一 | A | val_bpb 怎么算 | 一句话切成几个 token(宽度 ∝ 字节数),每个 token 下面一根「猜错程度」柱子;右边彩色公式 `Σ交叉熵(nats) ÷ (ln2 × Σ字节数)`,三项三种颜色跟左边对应部件同色同时高亮;滑块「模型猜得更准」改变柱高,结果实时变 | prepare.py `evaluate_bpb` 文档串与代码;演示数字「示意」 |
| `night` | 二 | B | 人工做研究的一晚 vs autoresearch | 两条 22:00→06:00 时间轴:人工那条睡前 2 次实验(示意),睡着后 0;AI 那条每 5 分钟一格;滑块「睡几个小时」4–10,计数实时变(12 × 小时) | README:approx 12/hour、approx 100 while you sleep |
| `budget` | 三 | B | 为什么固定 5 分钟 | 三个候选(小模型 / 默认 / 大模型)同时起跑,同一个 5:00 时钟,进度条显示各自走了多少步;开关「改成固定步数」:三条都走到同样步数,但大模型用时 9 分钟、小模型 3 分钟,「每小时 12 次」失效;选项「换一台机器」显示最优候选可能不同 | README「Design choices」三条(原文);开关结论(解读);数字(示意) |
| `neverstop` | 三 | B | NEVER STOP | 一晚时间轴;开关「允许它问要不要继续」:第 1 轮后冒出气泡「要继续吗?」,人在睡觉,计数停在 1;关掉开关则跑满;最后列出 program.md 给的四个「想不出点子时」办法 | program.md「NEVER STOP」全文;次数(示意) |
| `vocab` | 三 | C | 为什么用 bpb 不用 loss | 选项:词表 8192 / 4096 / 1024 / 256;同一句话按不同粒度切开(示意),显示「每个 token 的 loss」和「每字节的比特数」两根读数;每 token 的 loss 随词表变小而下降,bpb 不动 | prepare.py 文档串;README「decreasing vocab_size … 256」;数字(示意) |
| `simplicity` | 三 | C | 简单优先 | 天平:左边放「分数改善」,右边放「代码复杂度」;四张卡依次上秤(program.md 的四个例子),天平倾斜并给出原文结论;选项可直接选某一张卡 | program.md「Simplicity criterion」 |
| `context` | 三 | C | 别让日志淹了自己 | 上下文容量条随实验次数增长;开关:`tee` 全输出 vs 重定向 + grep 两行;几轮后前者塞满(「开始忘事」),后者 100 轮后还很空 | program.md 第 4–6 步原文;容量数字(示意) |
| `progress` | 四 | D | 真实战绩回放 | 用 `data/progress.json` 画图:按序号逐个出现点,灰点丢弃、绿点保留,最好分数阶梯线;点击 / 悬停绿点显示卡片:原标签(原文)+ 对应 train.py 默认值(原文)+ 大白话(解读);特别标出「random seed 42→137」:只换随机种子也被记为变好,说明这么小的差距可能是噪声(解读) | progress-transcript.md;analysis.ipynb 过滤规则;train.py 默认值;读数误差 ±0.00003 |
| `where` | 四 | D | 还能套到哪 | 三个是 / 否开关:「5–10 分钟内能给出分数?」「分数没法钻空子?」「改坏了能退回?」→ 结论;几张例子卡(解读);README 原话:迭代 program.md 找「研究组织代码」、加更多 agent | README 首段;例子(解读) |
| `limits` | 边界 | D | 它做不到什么 | 一条起伏的地形线,小球每次只往旁边试一小步,停在附近的低谷,远处有更深的谷它看不到;旁边四张边界卡 | README「Platform support」、Design choices 的 downside(原文);局部搜索(解读) |
| `annotated` | 五 | 主会话 | program.md 逐段批注 | 静态:左原文段落(逐字),右大白话批注 | program.md 全文 |
| `quiz` | 自测 | 主会话 | 3 道题 | 静态:单选 + 解析;不开 JS 时解析用 `<details>` | — |

## Task 1:公用画图工具 `docs/assets/explain/draw.js`(主会话)
从 `loop.js` 抽出 `esc / tag / lerp / polar / fmt / Painter(g)`,`loop.js` 改用它;loop 的全部测试不变且通过。

## Task 2:引擎通用化(主会话)
- 场景控件:`toggle`(勾选)/ `slider`(`input[type=range]`,数值)/ `choice`(一组按钮,字符串),都调 `setOption(key, value)` 后重画。
- 同一时间只播一个场景;factory 抛错只影响自己(该场景显示文字版)。
- `ctx.redraw()`:场景自己的点击 / 悬停交互改了内部状态后调用。
- `window.Explain.mounted`:`[{id, stops, duration}]`,给浏览器测试用。
- 浏览器测试改成遍历页面上所有场景(拖进度、卡片内文字、对比度、360px 字号)。

## Task 3:构建与出处检查通用化(主会话)
- `zh.json` 只放页面信息、章节(加 `nav: false` 的开场 / 边界 / 自测)和 `scene_order`;每个场景一个 `scenes/<id>.json`;`data/*.json` 合并进页面数据的 `datasets`。
- 出处名、仓库链接从 `paper` 字段取,不写死。
- 文字版:场景自带 `transcript` 列表;没有就用 loop 那种由 stations 生成的方式。
- 静态场景类型 `annotated`、`quiz`。
- `check_sources.py`:递归核对任何带 `quote` + `source` 的对象;`--scene <id>` 只查一个。
- `explain_build.py --only <id,...> --out <name>`:给 agent 生成只含自己场景的预览页(放 `docs/zh/explain/`,文件名带 `--`,已加入 .gitignore)。

## Task 4:写 agent 简报并派出(主会话)

## Task 5–8:场景(agent A–D,并行)
每个场景:
- [x] 先写 `tools/tests/<widget>-model.test.js`(停靠点落在站开头、调用顺序无关、关键状态值),看它失败
- [x] 写 `<widget>-model.js` 让它通过
- [x] 写 `scenes/<id>.json`(文案、claims、transcript、控件),`python3 tools/check_sources.py explain-src/autoresearch --scene <id>` 0 errors
- [x] 写 `<widget>.js`;`python3 docs/scripts/explain_build.py --only <id> --out autoresearch--<id>` 生成预览页
- [x] `PAGE=docs/zh/explain/autoresearch--<id>.html node --test tools/tests/browser.test.mjs` 全过;截图看横屏 / 竖屏 / 深色各一张
- [x] `python3 tools/fix_cjk_punct.py --check` 与两张词表对场景 json 0 命中

## Task 9:合并与送审(主会话)
- [x] 全量构建,`bash tools/check_all.sh` 全过
- [x] 逐场景截图自查(浅 / 深 / 手机)
- [x] 独立 reviewer 审整个分支,修复后重跑检查
- [x] 更新 ROADMAP / docs/README / skill(新经验),合并 main、敏感词扫描、push、确认线上
