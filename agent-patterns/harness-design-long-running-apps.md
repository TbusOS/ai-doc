# Harness Design for Long-Running Application Development (Anthropic)

> **原文链接:** [Anthropic Engineering — Harness Design for Long-Running Application Development](https://www.anthropic.com/engineering/harness-design-long-running-apps)
>
> **作者:** Prithvi Rajasekaran（Anthropic Labs）
>
> **发表:** 2026-03-24
>
> **主题:** 把**生成对抗网络（GAN）的 generator-discriminator 结构**搬到 agent 架构——用一个独立的 **Evaluator Agent** 去监督 **Generator Agent** 的输出。在复杂长时任务（前端设计、全栈应用开发）上显著提升 Claude 的可靠性。一个运行 **6 小时、耗费 $200** 的 harness 跑出可用游戏引擎；同一任务单 agent 跑 20 分钟、$9 产出**根本不能用的结果**。

---

## 为什么这篇重要 / Why This Matters

2025 年之后所有主流 agent 系统面对同一道墙：**长任务**。Agent 能修 bug、能写脚本、能做 5 分钟的代码改动，但让它自主写一个完整的 DAW（数字音频工作站）或者游戏引擎——6 小时不间断编码——几乎必然崩。

问题根源：**agent 在自评时会骗自己**。它调用一次 test、tests 过了就宣告完成，完全忽略实际产品是不是真的能用。这类失败在 5 分钟任务里不明显，在 6 小时任务里会指数级累积成灾难。

Anthropic 这篇文章展示的是**第一次把长任务 harness 做对**的工程配方——**核心思想直接来自 GAN**：generator 想糊弄自己的时候，派一个独立的 discriminator 站对面，拿 Playwright 去真实测试产品能不能用。

**读这篇文章的价值：** 它告诉你当 vanilla agent 吃力时，怎么设计 scaffold（脚手架/harness）让它扩展到长任务。这个方法论对**所有有评估循环的 agent 应用**（编码、设计、研究、数据分析）直接适用。

---

## 1. 核心架构 / The Core Architecture

**受 GAN 启发的三 agent 结构：**

```
     ┌──────────────┐
     │   Planner    │   输入 1-4 句 prompt
     │              │   输出完整产品规格（16 features × 10 sprints）
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐   ┌──────────────┐
     │  Generator   │◀─▶│  Evaluator   │
     │              │   │              │
     │  实现代码     │   │  用 Playwright │
     │  self-commit │   │  MCP 真实测试 │
     └──────────────┘   └──────────────┘
            │
            ▼
       交付的应用
```

### 1.1 三个角色的明确分工

**Planner Agent:**
- 把用户的 1-4 句 prompt 扩展成详细的**产品规格**
- 强调 high-level 技术设计，不纠结实现细节
- 把 AI 能力集成到规格中（例子中游戏引擎规格包含"AI 辅助精灵生成"）
- 典型输出：**16 个 features × 10 sprints**

**Generator Agent:**
- 按 sprint 实现 features（v1）或持续开发（v2）
- **self-evaluates before handoff** — 先自己测，再把代码交给 Evaluator
- 用 git 版本控制
- 对 evaluator 反馈做响应

**Evaluator Agent:**
- 用 **Playwright MCP** 做**真实功能测试**（不是单元测试，是真的浏览器操作）
- 对照 objective criteria + discovered bugs 打分
- 在实现之前协商 **Sprint Contract**（"做完的定义"）

### 1.2 为什么这是 GAN 的 agent-level 复刻

| GAN 元素 | Harness 对应 |
|---|---|
| Generator（生成器） | Generator Agent — 写代码 |
| Discriminator（判别器） | Evaluator Agent — 检测 "是真的能用还是糊弄过去" |
| 对抗训练 | Generator 在 Evaluator 反馈下迭代改进 |
| 避免 mode collapse | Evaluator 标准明确，防止 Generator 退化为"交付 fake 成品" |

**最核心的原则（GAN 与 harness 都遵守）：generator 不能评价自己**。让它自评它就会撒谎。必须放一个**独立的、只关心 "produkt 是不是真的好" 的评判者**在对面。

---

## 2. 前端设计的"可测量性"突破 / Making Subjective Quality Gradable

前端设计质量一直被认为是**主观的、不可打分的**。Anthropic 把它解构成 4 个**可测量维度**：

| 维度 | 含义 | 反例 |
|---|---|---|
| **Design Quality** | 是否有 coherent 视觉身份 vs. 零散部件拼贴 | 字体、间距、配色各做各的 |
| **Originality** | 定制决策 vs. 模板默认 / 通用 AI 模式 | 一看就是 shadcn 默认主题的 SaaS 站 |
| **Craft** | typography、spacing、color、contrast 的执行力 | 字号未成层级、间距跳变、对比度不合规 |
| **Functionality** | usability 与美学解耦 | 好看但按钮找不到 |

### 2.1 案例：Dutch Art Museum Website

初始版本：基础暗色主题 landing page——AI 生成的平庸默认输出。

**迭代 10 轮后：**
> *"a 3D room with checkered floor rendered in CSS perspective, artwork hung on walls in free-form positions"*
>
> *"一个 CSS perspective 渲染的 3D 房间，棋盘地板，艺术品以自由位置挂在墙上"*

**关键洞察：** 有 Evaluator 反馈后，Generator 会做出**创造性跳跃**——它开始尝试 novel design 而不是 AI 模板默认。这在单 agent 模式下几乎不会发生。

---

## 3. 真实数据：Solo vs Full Harness 对比 / Solo vs Full Harness

### Retro Game Maker 应用

Anthropic 用**同一个 prompt** 分别跑两种架构：

| 维度 | Solo Harness | Full Harness |
|---|---|---|
| **时间** | 20 分钟 | 6 小时 |
| **成本** | $9 | $200 |
| **结果** | **完全破损**（entity/input wiring 失败） | 完整可用游戏 + 精灵动画 + 行为模板 + 音效 + AI 辅助生成 + 可分享导出 |

**质量差距"一眼就能看出"。** 20× 成本换来的不是"更好一点"，而是"**从不能用到能用**"的质变。

### DAW（数字音频工作站）

V2 harness 的完整耗时分解（用 prompt: *"Build a fully featured DAW in the browser using Web Audio API"*）：

| 阶段 | 时间 | 成本 |
|---|---|---|
| Planner | 4.7 min | $0.46 |
| Build (Round 1) | 2h 7min | $71.08 |
| QA (Round 1) | 8.8 min | $3.24 |
| Build (Round 2) | 1h 2min | $36.89 |
| QA (Round 2) | 6.8 min | $3.09 |
| Build (Round 3) | 10.9 min | $5.88 |
| QA (Round 3) | 9.6 min | $4.06 |
| **总计** | **3h 50min** | **$124.70** |

Evaluator 在 sprint 中捕获 27+ 条具体问题——**clip dragging bug、route ordering error、frame reordering**——这些都是 Generator 自评**必然会错过**的细节。

---

## 4. Harness 设计的踩坑与关键经验 / Key Pitfalls and Lessons

### 4.1 "Context Anxiety"（上下文焦虑）

**现象：** 模型接近它**以为**是 context limit 的位置时，会**过早宣告任务完成**——即使离真的 limit 还远。

> *"Models exhibiting premature task completion as they approach what they believe is their context limit."*

**解决方案：Context Reset（重置），不是 Compaction（压缩）**

| 方案 | 机制 | 问题 |
|---|---|---|
| **Compaction** | 原地压缩历史 conversation 成摘要 | 细节丢失、agent 仍感受到"接近边界"的焦虑 |
| **Reset** | **完全清空 context**，用**结构化 handoff 文档**传递状态 | Agent 重新进入"清爽"状态，没有焦虑 |

**Reset 比 Compaction 的威力：** 它把"长对话"变成了"一系列短对话 + 文档 handoff"——每一次都是清醒的起点。

**有意思的是：** Sonnet 4.5 下 reset 是 essential 的；**Opus 4.6 原生解决了这个问题**，reset 不再必要。随着模型进化，一些 scaffold 变得多余。

### 4.2 Sprint Contract（冲刺契约）

在 Generator 开始实现之前，Generator 和 Evaluator **先协商"做完是什么样的"**——把 high-level spec 桥接到**可测试的产出**。

**工程意义：**
- 避免 Generator 做出 Evaluator 拒绝的东西
- 避免 Evaluator 事后抬高标准（moving the goalposts）
- 每个 sprint 开始前双方都清楚"达标线"在哪里

这是 GAN 所没有的——GAN 的 Generator 和 Discriminator 是对抗关系；**Harness 的 Generator 和 Evaluator 是协作关系**，先谈清楚规则再开干。

### 4.3 Evaluator 的校准是最难的部分

**典型失败：** Evaluator 会**自信地表扬 generator 的工作——即使质量明显平庸**。

> *"They tend to respond by confidently praising the work—even when quality is obviously mediocre."*

**解决方案：** 迭代更新 Evaluator 的 prompt，基于"evaluator 的判断和实际期望差多远"的日志做针对性修正。

**工程教训：** **Evaluator 的 prompt 比 Generator 的 prompt 更需要精调**。如果 Evaluator 松散，整个 harness 就是一个漂亮的 theater——Generator 照常在自 congratulate。

### 4.4 "模型进化会吞噬 scaffold"

Anthropic 直白地指出：

> *"As models continue to improve...the scaffold surrounding the model matters less over time."*

Opus 4.6 发布后：
- **Sprint decomposition** 不再必要
- **Per-sprint evaluation** 简化为**单次 final pass**
- **Context resets** 被原生解决

**但：**
> *"The space of interesting harness combinations doesn't shrink as models improve. Instead, it moves."*
>
> *Harness 的有趣组合空间不会随模型进化而收缩——它在移动。*

**Translation for engineers:** 每出一代新模型，**你当前 harness 里哪些是 load-bearing（承重墙）、哪些是冗余**都要重新审视。不要迷恋你精心搭的 scaffold——它可能一周后就被 native capability 吃掉。

---

## 5. 工程师视角的关键启示 / Key Takeaways

### 5.1 长任务 agent 的铁律：generator 不能评价自己

这不是"good practice"，是**生死线**。如果你的 agent 任务超过 30 分钟，你**必须**有一个独立于 generator 的 evaluator——代码跑着 Playwright 实测、用 user-facing criteria 打分，不是 generator 自己读自己的 log。

### 5.2 Harness 成本是非线性的——但结果也是

20 分钟 $9 的 Solo 和 6 小时 $200 的 Full：**20× 成本差**。但 Solo 的结果是 "broken"（零价值），Full 是 "functional"（高价值）。**这个数学实际是 $9/0 vs $200/functional_product——前者无意义，不是便宜**。

**产品判断：** 如果你的用户愿意为 "functional" 付 $10+，就用 full harness；如果他们只是要 demo，Solo 够。不要混用。

### 5.3 Reset > Compaction

长任务上下文策略，**首选 reset + 结构化 handoff，不是 compaction**。这是一个反直觉的发现——大多数人本能地去"压缩"，但**压缩保留了 anxiety**，reset 清除了 anxiety。

### 5.4 Sprint Contract：预先谈标准

让 evaluator 和 generator 在**实现前**就 "done 是什么样"的问题达成一致。这防止两种失败：
- Generator 做出 evaluator 拒绝的东西（白做）
- Evaluator 事后抬高标准（打脸）

### 5.5 Evaluator 校准比 Generator 更重要

训练/调优资源先投 Evaluator。Generator 在 Evaluator 反馈下会自动收敛；但如果 Evaluator 本身松散，Generator 再聪明也往松散的方向靠。

### 5.6 Harness 不是永恒的——每代模型都要重审

Anthropic 明确说了：每一次 model upgrade **触发 load-bearing components 的重新审视**。你在 Sonnet 4.5 时代精心做的 sprint decomposition，Opus 4.6 时代可能直接多余。**不要把 harness 当护城河**——它是**当前能力下的脚手架**。

---

## 6. 与本仓库其他文章的关联 / Relation to Other Papers

| 文章 | 关系 |
|---|---|
| [GAN (原始论文)](../training-techniques/gan.md) | **直接灵感源头**。Harness 是 GAN 思想在 agent 层的投射：generator + discriminator 的分工结构 |
| [Anthropic Building Effective Agents](anthropic-building-effective-agents.md) | 本文是其中"Evaluator-Optimizer pattern"的**长任务扩展版**——从 5 分钟 loop 到 6 小时 loop |
| [Anthropic Multi-Agent Research](anthropic-multi-agent-research.md) | 互为姊妹篇：Research 是 "orchestrator-workers"、Harness 是 "generator-evaluator" |
| [Reflexion](../self-improving-agents/reflexion.md) | Verbal RL 的核心也是独立反馈——Reflexion 在单任务内，Harness 在长任务跨 sprint |
| [Darwin Skill](../self-improving-agents/darwin-skill.md) | Darwin 棘轮 = Harness 思想在 skill 优化的应用 |
| [AgentFactory](../self-improving-agents/agent-factory.md) | Harness 跑出的成功 sprint 可以被 AgentFactory 蒸馏为可复用子 agent |
| [autoresearch](../self-improving-agents/autoresearch.md) | autoresearch 的"val_bpb ratchet"就是 Harness 的极简单 agent 版本 |

---

## 为什么是 Tier-S / Why This Is Tier-S

- **frontier lab 一手工程细节**——真实运行时间、成本、失败案例都公开
- **概念清晰**：Generator/Evaluator/Planner 三角分工 + Sprint Contract + Context Reset vs Compaction
- **立即可用**：任何做长任务 agent 应用的团队都能直接套这套架构
- **有实验数据**：Solo vs Full 对比是可测量的价值证明
- **和 GAN 形成了美丽的 full-circle**——2014 年 Goodfellow 的生成-判别对抗结构，12 年后在 agent 架构层复活

---

## References / 参考

- **原文:** [Harness Design for Long-Running Application Development (Anthropic Engineering, 2026-03-24)](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **作者:** Prithvi Rajasekaran ([Anthropic Labs](https://www.anthropic.com/))
- **Anthropic 相关文章:**
  - [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
  - [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering)
  - [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering)
- **代码 / 工具:**
  - [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) — 本文 harness 基于此
  - [Playwright MCP](https://github.com/microsoft/playwright-mcp) — Evaluator 用的真实浏览器测试工具
  - [Anthropic Frontend Design Skill](https://github.com/anthropics/claude-code)
- **本仓库相关:**
  - [GAN](../training-techniques/gan.md) — 直接灵感源
  - [Building Effective Agents](anthropic-building-effective-agents.md)
  - [Multi-Agent Research System](anthropic-multi-agent-research.md)
  - [Reflexion](../self-improving-agents/reflexion.md) · [Darwin Skill](../self-improving-agents/darwin-skill.md)
