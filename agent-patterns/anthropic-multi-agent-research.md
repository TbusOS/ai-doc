# How We Built Our Multi-Agent Research System (Anthropic)

> **原文链接:** [Anthropic Engineering — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
>
> **作者:** Anthropic Applied AI 工程团队
>
> **发表:** 2025-06-13
>
> **主题:** Claude 的 Research 模式（开启后 Claude 会并行派多个 agent 去搜索综合答案）背后的**完整工程细节**：架构、prompt 设计、工具优化、评估、容错、token 经济学。这是 2025 年最有价值的**生产级 multi-agent 案例研究**。

---

## 为什么这篇重要 / Why This Matters

Claude.ai 的 **Research 模式**是一个典型的用户可见的多 agent 应用：

- 用户问"帮我研究 X"
- Claude 派出多个并行 subagent 各查不同角度
- 综合返回一份结构化报告

这在 UI 上看只是"Research"按钮，但背后是一个**复杂的生产 multi-agent 系统**。Anthropic 把这套系统的**工程细节全部公开**——包括失败案例、踩过的坑、真实性能数据。

**这是为数不多能让你看到"frontier lab 是怎么真正做 multi-agent"的一手材料**。2025 年构建任何 multi-agent 产品都应该先读它。

---

## 1. 架构总览 / Architecture Overview

```
用户 query
    │
    ▼
┌──────────────────────┐
│   Lead Agent (Opus)   │  ← 规划、协调、最终综合
│   主思考 + 工具派遣    │
└──────────┬───────────┘
           │ dispatch
           │
    ┌──────┼──────┬──────┐
    ▼      ▼      ▼      ▼
┌────┐ ┌────┐ ┌────┐ ┌────┐
│Sub │ │Sub │ │Sub │ │Sub │  ← 并行 subagent (Sonnet)
│ 1  │ │ 2  │ │ 3  │ │ N  │    各自独立查一个子方向
└────┘ └────┘ └────┘ └────┘
    │      │      │      │
    └──────┴──────┴──────┘
           │
           ▼
    Lead Agent 综合报告
           │
           ▼
         用户
```

**关键配置：**
- **Lead Agent = Claude Opus 4**（最强推理，负责规划+综合）
- **Subagents = Claude Sonnet 4**（速度+成本平衡，负责并行搜索）
- Subagents 数量由 Lead Agent 运行时决定（通常 3-10 个）
- 每个 Subagent 有独立的上下文、工具、目标

**这就是 [Building Effective Agents](anthropic-building-effective-agents.md) 里 Orchestrator-Workers pattern 的最复杂商用级实现。**

---

## 2. 关键工程决策 / Key Engineering Decisions

### 2.1 为什么 Opus 做 lead、Sonnet 做 sub

看起来违反直觉："更重要的规划任务用更贵的模型"但 Anthropic 的测试显示：

- **Lead agent 的质量决定整体**——它决定派多少 worker、每个查什么、最后怎么综合。Lead 出错意味着整个 research 偏题
- **Subagents 干的是"搜索 + 摘要"**——用 Opus 浪费，用 Sonnet 够用且快
- Opus-lead + Sonnet-workers 的组合**比 Opus-only 强 90.2%**（Anthropic 内部 research eval）

**工程启示：** 在多 agent 系统里，**lead 和 worker 应该用不同级别的模型**，而不是同一个。

### 2.2 Subagent 任务描述必须极其明确

Anthropic 强调：**subagent 失败的 #1 原因是任务描述不清**。他们总结每个 subagent 任务必须包含：

1. **Objective** — 这个 subagent 的目标是什么
2. **Output format** — 返回什么结构的结果
3. **Tools and sources guidance** — 用哪些工具，优先哪些来源
4. **Clear boundaries** — 明确**不要**做什么（避免 subagent 之间重复工作）

**原话：**
> *"Without detailed task descriptions, agents duplicate work, leave gaps, or fail to find necessary information."*

### 2.3 搜索策略：broad → narrow

Anthropic 发现初期 subagent 倾向于**一上来就深入**（很窄的搜索词），结果**错过主题的侧面**。

他们 prompt 引导的策略是：

```
1. Start with short, broad queries to understand the landscape
2. Evaluate what's available
3. Progressively narrow focus on the most valuable angles
```

这是 **human researcher 的自然节奏**——先 scan 概貌，再 deep dive。把这个节奏教给 agent 显著改善了结果质量。

### 2.4 Tool 描述的"自动优化 agent"

这是文章里最有创意的细节：**Anthropic 做了一个 tool-testing agent**。

流程：

```
1. 给一个 MCP 工具（可能描述有瑕疵）
2. 让 agent 尝试用这个工具
3. agent 总结使用中的困惑点
4. agent 改写 tool description
5. 验证改写后的 description 能否让未来的 agent 正确使用
```

**结果：优化后的 tool description 让后续 agent 完成任务时间减少 40%**。

**工程启示：**
- 工具描述不是"写一次就完了"的静态文本，是可以**通过 A/B 迭代优化**的资产
- 让 agent 帮你测试你写的 tool——这是 meta-level 的自改进

---

## 3. 评估方法 / How They Evaluated

Multi-agent 系统的评估比单 agent 难得多——没有单一"正确答案"。Anthropic 的做法：

### 3.1 LLM-as-judge

- 用 Claude Opus 作为裁判
- 给 judge 看原始 query + 最终综合报告
- judge 按多个维度打分：completeness、accuracy、citation 质量、结构

**关键：** Judge 和被评价的 agent 用不同版本或 prompt，避免"自评偏差"。

### 3.2 Internal research eval set

- 构造了一批**真实研究场景 prompt**（不是简单 FAQ）
- 每个场景有**人类专家的参考答案**作为 ground truth
- 多 agent 系统在这套 eval 上 **比单 agent Opus 强 90.2%**

### 3.3 Failure mode catalog

- 系统性收集失败案例：跑偏、重复工作、信息不完整、hallucination、token 爆炸
- 每种 failure mode 都有对应的修复（prompt 调整、工具改进、架构修改）

---

## 4. Token 经济学 / The Token Economics

**Multi-agent 系统消耗 ~15× 单 agent 的 tokens**。这意味着：

- 如果一次 chat 是 $0.05，multi-agent research 一次是 $0.75
- 15× 开销**只在任务价值 > 15× 成本时划算**

Anthropic 明确划界：
> *"This makes them best suited for tasks where the value of the outcome outweighs the expense."*
>
> *Multi-agent 最适合价值显著超过成本的任务。*

**适合 multi-agent 的任务特征：**
- 需要综合多个来源（单 agent 上下文装不下）
- 允许等待时间（不是实时交互）
- 结果有持久价值（不是一次性咨询）
- 用户明确为更高质量付费（Claude Research 就是 Pro 用户专享）

**不适合的：** 简单 FAQ、闲聊、实时翻译、高频重复请求——用 workflow 或单 agent。

---

## 5. 真实踩过的坑 / What Didn't Work

Anthropic 诚实分享的失败/次优案例：

### 5.1 让 subagent 互相"看到" 彼此的进度

直觉上"subagent 协作"应该更强。实际：让 subagent 看到彼此工作，它们会互相模仿，**反而降低搜索多样性**。

**教训：** Subagents 保持**独立**，只让 Lead 来综合冲突。

### 5.2 Subagent 数量动态优化

"Lead agent 运行时决定派多少 subagent"——听起来聪明，但 lead 经常派太多（8+）导致 token 爆炸，或派太少（2-3）导致覆盖不全。

**解决：** Prompt 里加硬约束："根据任务复杂度派 3-7 个 subagent"，而不是完全自由决定。

### 5.3 引用（citation）的处理

初期 subagent 输出摘要但丢掉来源，Lead 综合时无法交还引用给用户。

**解决：** Subagent 被强制要求**逐条带 source URL**。Lead 综合时保留所有 citation。这也是你在 Claude Research 里看到每段都有超链接的原因。

---

## 6. 工程师视角的关键启示 / Key Takeaways

### 6.1 Multi-agent 是 "90% 提升 + 15× 成本" 的权衡

把这个数字记在心里：**90% quality vs 15× cost**。任何人跟你说 multi-agent 是"免费升级"都是没做过生产。

### 6.2 Lead/worker 用不同模型

- Lead 用最强（Opus / GPT-5 / Gemini Pro）
- Worker 用均衡（Sonnet / GPT-4o / Gemini Flash）
- **不要两层都用最强模型**——成本炸 + 没有 Sonnet 的速度优势

### 6.3 Subagent prompt 四要素

用 Anthropic 总结的四要素 audit 你的 subagent prompt：

- [ ] Objective 明确
- [ ] Output format 明确（schema 或模板）
- [ ] Tools/sources guidance 明确
- [ ] Boundaries 明确（不要做什么）

### 6.4 Tool description 是可优化的资产

- 让另一个 agent **测试**你的 tool description
- 收集**误用**案例 → 改进 description
- 每次 model upgrade 后**重测**（新模型可能对旧描述有不同解读）

### 6.5 Observability 比算法重要

Anthropic 整个系统的质量提升**主要来自 observability**——记录每一步、分析 failure mode、迭代 prompt/tool。**没有 observability 你根本不知道该改什么**。

### 6.6 从单 agent 开始，必要时再 multi

文章结尾的警告：
> *"The additional complexity and cost of multi-agent systems is only justified when tasks are sufficiently valuable and complex."*

**默认路径：** single agent + workflow → 不够用再加 evaluator → 仍不够再上 multi-agent orchestrator-workers。不要一开始就上最复杂的。

---

## 7. 和本仓库其他文章的关联 / Relation to Other Papers

| 文章 | 关系 |
|---|---|
| [Anthropic Building Effective Agents](anthropic-building-effective-agents.md) | 本文是那 5 个 pattern 的真实生产落地 |
| [Nuwa Skill](nuwa-skill.md) | 女娲也是 6-agent swarm，是本文思想的民间实现 |
| [Coding Agents Landscape 2026](coding-agents-landscape-2026.md) | 编码 agent 生态也大量采用 orchestrator-workers |
| [AgentFactory](../self-improving-agents/agent-factory.md) | AgentFactory 可以把成功的 research trajectory 固化为子 agent，降低后续 token 成本 |
| [MemGPT](../memory-systems/memgpt.md) / [LLM Knowledge Bases](../memory-systems/llm-knowledge-bases.md) | Multi-agent research 产生的知识如何持久化？这两篇给答案 |

---

## 为什么是 Tier-S / Why This Is Tier-S

- **frontier lab 一手工程经验**——这种级别的内部细节公开很罕见
- **数字硬核**：90.2% 质量提升 + 15× 成本 + 40% tool description 优化——都是真实测量
- **涵盖全栈**：架构、prompt、工具、评估、token 经济、失败模式——一篇文章能学到的深度超过大多数 10 篇
- **立即可套用**：每一条工程决策都可以直接映射到你自己的 multi-agent 系统

---

## References / 参考

- **原文:** [How we built our multi-agent research system (Anthropic Engineering)](https://www.anthropic.com/engineering/multi-agent-research-system)
- **相关资源:**
  - [Anthropic Engineering Blog 总页](https://www.anthropic.com/engineering)
  - [Simon Willison 读后分析](https://simonwillison.net/2025/Jun/14/multi-agent-research-system/)
  - [Anthropic 多 agent 系统概览 (Constellation Research 评论)](https://www.constellationr.com/blog-news/insights/anthropics-multi-agent-system-overview-must-read-cios)
- **本仓库相关:**
  - [Anthropic Building Effective Agents](anthropic-building-effective-agents.md) — 理论基础
  - [Nuwa Skill](nuwa-skill.md) — 社区实现
  - [Coding Agents Landscape 2026](coding-agents-landscape-2026.md)
  - [AgentFactory](../self-improving-agents/agent-factory.md)
