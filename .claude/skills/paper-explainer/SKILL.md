---
name: paper-explainer
description: Use when working in the ai-doc repo on a paper's illustrated explainer (图解 / 大白话 / 动画讲论文 / 交互图 / 彩色公式), adding or translating a paper, changing anything under docs/ that GitHub Pages publishes (样式 / 首页 / 主题页 / 原文页), or merging and pushing site changes.
---

# 论文图解与 GitHub Pages

## 目标

把论文里难懂的原理和数学讲清楚，让读者再去读原文时能看懂。图解是读原文前的引路，**不替代原文**。
两条底线：现有中英对照原文一字不改；图解里没有一句话跟原文矛盾。

设计稿：`docs/superpowers/specs/2026-10-08-paper-explainers-design.md`。构建与检查命令：`docs/README.md`。

## 流程（每一步做完才进下一步）

1. **先读原文，再定场景。** 原始材料（论文 LaTeX / PDF、仓库代码、作者给的图）复制进 `explain-src/<slug>/sources/`，`SOURCE.txt` 写版本、日期、许可。图里的文字要引用，就手工转录成 `sources/*-transcript.md`。
2. **按五问排场景**，顺序不能乱：这是什么 → 没有它会怎样 → 为什么这么设计（每个设计配「去掉它会怎样」开关）→ 用在什么场景 → 机制细节。前面放开场，后面放边界和自测 3 题。篇幅不够时砍第五问，不砍前四问。
3. **先定这篇的设计风格，再挑表现方式。** 每篇论文一种风格，不套上一篇的做法（user 2026-10-09）。
   - 先问：这篇论文讲的东西，什么样的画面最像它？例：讲实验循环的 autoresearch 用暖纸底白板手绘；
     讲 GPU 显存搬运的论文可以像工程蓝图；讲概率分布的可以像教科书插图。[以上后两例是建议，不是定稿]
   - 可以换：舞台配色、图里的字体、画法、动画方式。不能换（读者跨页认路靠它）：出处标记、播放控制条、
     五问章节导航、减少动态效果 / 关掉 JS 时的行为、颜色的意思（绿 = 保留、灰 = 丢弃、红 = 崩溃、橙 = 重点）。
   - 风格写进设计稿，第 4 步的样张就是拿来确认风格的。
   - 白板手绘（srt-whiteboard-animation）只是借鉴过的一种，不是默认。

   然后**按论文内容挑表现方式**，不是每种都用：

   | 论文讲的是 | 用 |
   |---|---|
   | 取舍、「不这样会怎样」 | 交互图（滑块、开关） |
   | 数学 | 彩色公式：公式每一项一个颜色，跟图里的部件联动 |
   | 算法流程 | 分步动画（可单步、可拖进度） |
   | 实验结果 | 真实数据回放：从论文的表格或图里读数，标明误差 |
   | 比喻、开场 | 插画（代码画的 SVG，或 Codex 出图：`codex exec -m gpt-6-astra -i <参考图>`，画风靠参考图定），图里不放文字；提示词原文存 `explain-src/<slug>/illustrations/` |

4. **新论文先做样张**：公用部分 + 1~2 个核心场景，停下给 user 看，确认后再做完。
5. **全部做完后跑 `bash tools/check_all.sh`**，必须输出 `ALL CHECKS PASSED`。出现 `SKIP` 要说明是哪项、为什么跳过，不能当成通过。
6. **请一个没参与写代码的 reviewer 审整个分支**。重点审文案跟原文是否一致。必须修的、应该修的都修掉，每个修复先写一条能复现问题的测试，然后重跑第 5 步。
7. **才交给 user。** 合并和 push 前看下面「发布」一节。

## 文案规则

- 文案只写在 `explain-src/<slug>/zh.json`，构建时写进 HTML，不开 JS 也能读到。动画里不写死任何句子。
- 每个关键说法都要放进 `claims`，标三种之一：
  - `原文`：带 `quote` 和 `source`，`check_sources.py` 会去原文副本里逐字核对；
  - `解读`：带 `basis`，写明从什么推出来的；
  - `示意`：演示用的假设数字。
- 字幕、开关说明、标题里的说法也要能对上某条 claim，或者跟原文不矛盾。审查时逐句对照原文看。
- 数字照抄原文的精度。原文写 "about 100" 就写「约 100」。
- 中文用全角标点，跑 `python3 tools/fix_cjk_punct.py --check`。这个脚本只能对文案数据跑，不能对代码跑。
- 不说满话：写「关键说法都标出处」，不写「每句话都标出处」。

## 场景代码怎么写

每个场景两个文件，放在 `docs/assets/explain/<slug>/`：

- `<场景>-model.js`：纯函数 `stateAt(t, opts)`，不读也不改外部状态。所有轮次共用**一张绝对时间表**（`ExplainTimeline.schedule`），`stops()` 和 `stateAt()` 都从这张表取数。测试要写到：每个停靠点落在对应那一站的开头，以及调用顺序不影响结果。
- `<场景>.js`：只负责画图，调 `Explain.register(name, factory)`，factory 返回 `{duration, stops, render(t), setOption?, layout?}`。具体写法：
  - 颜色只用 `style="fill:var(--…)"`。SVG 属性里写 `var()` 不生效，写死的十六进制颜色在深色模式下会看不见；
  - 放在卡片上的字加 `data-on="<卡片 id>"`，必须待在卡片里的字加 `data-fit`；
  - 带颜色的文字用 `--keep-ink` / `--crash-ink` 这类专门给文字用的变量；
  - 窄于 780px 时改竖排布局，竖排时图里的字不小于 15px。

完整范例：`docs/assets/explain/autoresearch/loop-model.js` + `loop.js` 及其测试。

## 发布（GitHub Pages：`main` 分支的 `/docs`，地址 http://doc.tbusos.com/ai-doc/）

- 三个构建脚本都要跑：`build.py`、`explain_build.py`、`home_v2.py`，生成的 HTML 一起提交。
- 新图解要从现有页面能点进去：首页、对应原文页。
- 改了原文的 `.md` 是有意改动：先单独提交原文修正，再跑 `python3 tools/check_articles_unchanged.py snapshot` 更新基线。
- push 到公开仓库前跑敏感词扫描：用私有的外发脱敏清单（不放在本仓库）扫改动的文件和 commit message，再查有没有本机用户目录的绝对路径（macOS 和 Linux 两种写法），都要 0 命中。commit 里不加 AI 署名。
- 推送后查 `gh api repos/TbusOS/ai-doc/pages/builds/latest` 的状态是 `built`，再实际打开线上页面看有没有报错。

## 踩过的坑

| 现象 | 原因 | 预防 |
|---|---|---|
| 拖进度条画面不动 | handler 先 `pause()`，重绘时把滑块值改回去了，之后读到的是旧值 | 先读滑块的值再暂停；浏览器测试里真的去拖 |
| 单步时有几站跳过去了 | 停靠点和状态函数各算一遍时间，浮点误差不一致 | 共用一张绝对时间表 |
| 文案说「跟基线比」，动画比的是当前版本 | 写文案时没对照原文第 9 步 | 字幕逐句对照原文 |
| 自动播放从不触发 | 观察的是整个场景区块，它比窗口还高，露出比例到不了 50% | 观察舞台本身 |
| 检查报对比度不足 | 测量时页面还在平滑滚动，文字淡入到一半 | 不开 `scroll-behavior: smooth` |
| 深色模式下终端里的字看不清 | 终端底色用了 `--ink`，深色模式下它是浅色 | 终端用专门的 `--term-*` 变量 |
| 标点脚本把代码弄坏了 | 对 `.py` 跑了替换，把元组括号换成了全角 | 只对文案数据跑 |
