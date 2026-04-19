# Building Effective Agents (Anthropic)

> **原文链接:** [Anthropic Engineering Blog — Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
>
> **Mirror:** [resources.anthropic.com/building-effective-agents](https://resources.anthropic.com/building-effective-agents)
>
> **作者:** Erik Schluntz、Barry Zhang（Anthropic 应用 AI 团队）
>
> **发表:** 2024-12-19
>
> **主题:** Anthropic 基于**真实生产 agent 部署经验**总结出的 5 个 agent 工作流模式 + 对"何时用 workflow vs 何时用 agent"的清晰划分。这是 **agent 工程的事实标准参考**——2025 年后绝大多数讨论"agent 该怎么设计"的文章都在直接引用或改编这 5 个 pattern。

---

## 为什么这篇重要 / Why This Matters

2024 年 agent 生态的核心问题：**怎么设计一个能上生产的 agent？**

- LangChain 推了无数框架但没有定义"什么时候用什么模式"
- Twitter 上各种 agent demo 看着惊艳但一到生产就崩
- "autonomous agent" 被滥用——很多号称 agent 的东西其实是脚本

Anthropic 这篇文章**第一次权威地**回答了：

1. 什么是 workflow，什么是 agent，两者区别是什么
2. 常见 agent 架构有哪些 pattern（给名字）
3. 什么情况下你不需要 agent，普通 LLM 调用就够
4. 在生产里什么 pattern 最可靠

**这是 2024-2025 agent 设计**的指南针**——连 OpenAI、Google 后来发布的 agent 工程指南都在模仿这套分类**。

---

## 1. 核心定义 / Workflow vs Agent

Anthropic 把两个常混用的概念分清楚：

| 术语 | 定义 | 控制流 |
|---|---|---|
| **Workflow** | LLM 和工具按**预定义路径**被编排 | 确定性 — 代码决定路径 |
| **Agent** | LLM **动态决定**自己的过程和工具使用 | 非确定性 — LLM 决定路径 |

**实操判断：** 如果你的流程图可以提前画出来（prompt A → tool B → prompt C → 返回），那是 workflow；如果 LLM 要在运行时决定"下一步该做什么"，那是 agent。

**Anthropic 的关键建议：**

> *"Start with simple prompts, optimize them with comprehensive evaluation, and add multi-step agentic systems only when simpler solutions fall short."*
>
> *从简单 prompt 开始，用全面的评估优化它们。只有当简单方案不够用时，才加入多步 agentic 系统。*

这是**贯穿全文的核心哲学：复杂性是最后手段，不是起点**。

---

## 2. 五大 Workflow 模式 / The 5 Workflow Patterns

Anthropic 把 agent 工程的可靠性主要放在**workflow** 模式上。这 5 个 pattern 覆盖了 ~80% 的生产用例：

### 2.1 Prompt Chaining（提示链）

```
LLM Call 1  →  LLM Call 2  →  LLM Call 3  →  Output
    ↓              ↓              ↓
  (可能还有 gate，失败就 stop)
```

**什么时候用：** 任务可以干净地拆成一系列确定的子步骤。

**典型案例：**
- 生成 outline → 检查 outline 质量（gate） → 按 outline 写正文 → 翻译成其他语言
- 先做事实抽取 → 再做情感分类（两步都需要 LLM 但职责不同）

**关键设计：**
- 每一步输出有明确 schema
- 中间加 **gate**（用 if 或一个 LLM 判断）在前置条件不满足时提前退出
- 每一步独立可 evaluate

### 2.2 Routing（路由）

```
Input  →  Classifier LLM  →  [Route A | Route B | Route C]
                                    ↓
                            专门化的 LLM / 工具
```

**什么时候用：** 不同类型的 input 需要走完全不同的处理路径，且分类可靠。

**典型案例：**
- 客服：普通问题 → Haiku；复杂问题 → Opus；退款请求 → 人工工单
- 代码任务：bug 修复 → 诊断路径；新功能 → 规划路径；重构 → 结构分析路径

**关键设计：**
- 分类本身要可靠（分错路比不路由更糟）
- 每条 route 的 prompt 高度专门化
- 保留 "fallback route"

### 2.3 Parallelization（并行化）

```
Input  ─┬─▶  LLM Call 1  ─┐
        ├─▶  LLM Call 2  ─┤  →  Aggregator  →  Output
        └─▶  LLM Call 3  ─┘
```

有两种子模式：

- **Sectioning**（分片）：任务独立切分后并行，结果拼接。例：一次处理 10 页 PDF 的 OCR
- **Voting**（投票）：同一任务多次并行，结果聚合。例：3 次 LLM 判断 → 多数决，提升可靠性

**什么时候用：**
- 子任务独立（sectioning）
- 需要更高置信度（voting）
- 需要多视角（让一个 LLM 扮演多角色，再汇总）

**典型案例：** 代码审查：一个 agent 查安全，一个查性能，一个查风格，一个查可读性——最后合并建议。

### 2.4 Orchestrator-Workers（编排器-工人）

```
              ┌─▶ Worker 1 ─┐
Orchestrator ─┼─▶ Worker 2 ─┼─▶ Orchestrator (synthesize) → Output
              └─▶ Worker 3 ─┘
```

**和 Parallelization 的区别：** Workers 的数量和任务**由 Orchestrator 在运行时动态决定**，不是预设的 N 个。

**典型案例：**
- 深度研究：Orchestrator 看问题后决定"我需要搜 4 个主题"，动态派 4 个 worker
- 复杂代码修改：Orchestrator 决定"要改 5 个文件"，派 5 个 worker 分别编辑

**关键设计：**
- Orchestrator prompt 要明确"决定要派多少 worker、每个干什么"
- Workers 应独立，不互相依赖
- Synthesis 步骤要处理冲突的 worker 输出

**这是 [Anthropic 多 agent 研究系统](anthropic-multi-agent-research.md)的核心模式**。

### 2.5 Evaluator-Optimizer（评估-优化循环）

```
Generator LLM  →  Output  →  Evaluator LLM  →  (pass? → output | fail? → 反馈 → Generator)
                                                                               ↑____________________|
```

**什么时候用：**
- 有清晰的评估标准
- 迭代式改进能带来明显提升
- 可以承受多次 LLM 调用

**典型案例：**
- 文学翻译：翻译 → 母语人士视角评估 → 提出改进 → 重译
- 复杂搜索：搜索结果 → 判断是否回答了问题 → 如果不够则再搜 → ...

**这是 [Reflexion](../self-improving-agents/reflexion.md)、[Darwin Skill](../self-improving-agents/darwin-skill.md) 的思想源头**。

---

## 3. 真正的 Agent / True Agents

Anthropic 对"agent"的使用**极其谨慎**。只有在以下情况才推荐用 agent（而非 workflow）：

- 任务**开放式**，无法预先规划步骤
- 无法可靠预测需要哪些工具、多少步
- 错误可控，有回退机制

**agent 基本循环：**

```
while not done:
    1. 看当前环境/任务状态
    2. 决定下一个 action（tool call / 响应）
    3. 执行 action
    4. 观察结果
```

**Anthropic 强调的 agent 关键注意事项：**

- **工具设计**比 prompt 调优重要（见 Anthropic 另一篇文章 [Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)）
- **Stopping condition** 必须明确（max iterations、达成目标、超时）
- **Sandbox** — agent 能做的事要限制（工具权限、文件访问范围）
- **Observability** — 记录每一步 thought/action/observation，失败时可回溯

---

## 4. Anthropic 的三条核心准则 / The Three Core Principles

文章里反复强调的三条：

### 4.1 Keep it Simple（保持简单）

**Anthropic 原话：**
> *"Start simple. Add complexity only when needed."*

在生产中，**简单的 pipeline 几乎总是比复杂的 agent 可靠**。Anthropic 举的反例：有团队用复杂的 multi-agent 架构处理一个能用 "routing + 2 个专门 prompt" 搞定的问题，结果调试几周、成本高 10 倍。

### 4.2 Make Agents Observable（让 agent 可观测）

每一步都要能被审计：

- 所有 LLM call 的 input/output 记录
- 所有 tool call 的参数和返回
- 每一步的推理（thought）
- 每一步的决策原因（为什么选了 tool X）

**没有 observability 的 agent 是黑盒——失败时你不知道为什么**。

### 4.3 Test Agent-Computer Interfaces（测试工具接口）

工具描述（tool schema）是 agent 和环境的界面。**大部分 agent 失败不是 LLM 能力问题，是工具描述不清晰**。

Anthropic 推荐：
- 像写 API 文档一样写 tool description（含参数含义、返回格式、错误场景）
- 让另一个 LLM 只读 tool description 尝试用它——看看它能否正确使用
- 记录工具误用的案例，回头改 tool description

---

## 5. 工程师视角的关键启示 / Key Takeaways

### 5.1 选对 pattern 比选对框架重要

LangGraph、AutoGen、CrewAI、LangChain 都能实现这 5 个 pattern。**先定 pattern，再选框架**——不要被"这个框架功能最多"骗到。

### 5.2 Parallelization + Voting 是提升可靠性的最简方法

如果你的 LLM 输出不稳定，上 Voting 比花时间调 prompt 往往 ROI 更高：

```
3 次并行 LLM 调用 + 多数决 = 显著降低随机失败率
```

典型情景：LLM 做结构化数据提取，单次 85% 准确，3-投票后 97%。

### 5.3 Orchestrator-Workers 是"大任务拆解"的标准模式

你看到 **Claude Code / Cursor / Windsurf** 等编码 agent、Anthropic Research 模式、OpenAI Deep Research——全部是 orchestrator-workers 的变种。

**这个 pattern 你必须掌握。**

### 5.4 Evaluator-Optimizer 适合质量敏感任务

写代码、写文章、设计 UI——这些任务的"好"有清晰判据但单次 LLM 容易达不到。evaluator 循环几乎总能显著提升质量。成本换质量的权衡。

### 5.5 不需要 agent 的场景

Anthropic 明确列出"不要用 agent"的场景：

- 任务能被预设 workflow 覆盖
- 延迟敏感（agent 循环慢）
- 成本敏感（agent token 消耗是 workflow 的 5-15×）
- 错误成本高（agent 犯错后果严重）

**默认是 workflow，agent 是最后选项。**

---

## 6. 和本仓库其他文章的关联 / Relation to Other Papers

| 文章 | 关系 |
|---|---|
| [ReAct](react.md) | ReAct 是"agent 循环"的原始实现；Anthropic 把它归为"True Agent"类别 |
| [Anthropic Multi-Agent Research System](anthropic-multi-agent-research.md) | 本文 5 个 pattern 在真实系统中的组合应用——orchestrator-workers + parallelization |
| [Reflexion](../self-improving-agents/reflexion.md) | Evaluator-Optimizer pattern 的具体实现 |
| [AgentFactory](../self-improving-agents/agent-factory.md) | 把"多 Orchestrator-Worker trajectory 蒸馏为子 agent"——本文 pattern 的演化 |
| [Coding Agents Landscape 2026](coding-agents-landscape-2026.md) | 编码 agent 生态在 2026 全面对接本文的 pattern 语言 |
| [Darwin Skill](../self-improving-agents/darwin-skill.md) | Evaluator-Optimizer 在 skill 优化的具体落地 |

---

## 为什么是 Tier-S / Why This Is Tier-S

- **行业共享语言**：2025 年以后几乎所有 agent 设计讨论都在用 Anthropic 的术语（orchestrator-workers, evaluator-optimizer, workflow vs agent）
- **基于真实生产经验**：Anthropic 应用 AI 团队在为 Coinbase、Intercom、Thomson Reuters 等公司部署 agent，这些 pattern 是从真实事故学到的
- **可直接抄入项目**：每个 pattern 都是具体架构图 + 何时用 + 何时不用，没有废话
- **反过度设计**：旗帜鲜明地反对"万事用 agent"的风气，给工程师理性的复杂度边界

---

## References / 参考

- **原文:** [Anthropic — Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- **Anthropic 相关文章:**
  - [Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents) — tool 设计指南
  - [Advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use) — 2025 年工具使用进阶
- **延伸阅读:**
  - [Simon Willison 读后笔记](https://simonwillison.net/2024/Dec/20/building-effective-agents/)
  - [HuggingFace smolagents 对本文 pattern 的实现](https://huggingface.co/blog/Sri-Vigneshwar-DJ/building-effective-agents-with-anthropics-best-pra)
- **本仓库相关:**
  - [Anthropic Multi-Agent Research System](anthropic-multi-agent-research.md)
  - [ReAct](react.md) · [Reflexion](../self-improving-agents/reflexion.md)
  - [Darwin Skill](../self-improving-agents/darwin-skill.md) · [AgentFactory](../self-improving-agents/agent-factory.md)
