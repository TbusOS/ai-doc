# Multi-Agent Coding Systems & Agent Factory Landscape (2026)

> **主题:** 2026 年编程领域多 Agent 团队与 Agent 工厂研究生态综述
>
> **Type:** Landscape article / 生态综述（非单篇论文翻译）
>
> **Last updated:** 2026-04
>
> **Scope:** Papers, open-source frameworks, benchmarks, and design paradigms for LLM-based multi-agent systems in software engineering and for "agent factory" (agents-that-design-agents) research.

---

## Why This Matters / 为什么这个方向重要

In 2024 the dominant design pattern was a **single agent with a loop** — one LLM, a few tools, a ReAct-style scratchpad. By 2026 two paradigms have clearly pulled ahead: (1) **multi-agent teams** where specialized roles collaborate on software engineering, and (2) **agent factories** where a meta-process automatically designs, optimizes, or even writes the agents themselves. Both paradigms attack the same bottleneck — *a single agent running in a single loop cannot keep up with the structure of real software work*.

2024 年占主导的设计模式是**单 agent + 循环**——一个 LLM、几个工具、一条 ReAct 式的暂存区。到了 2026 年，两种范式明显领先：（1）**多 Agent 团队**——由专业化角色在软件工程任务上协作；（2）**Agent 工厂**——由一个元过程自动设计、优化、甚至亲自编写这些 agent。两种范式攻击的是同一个瓶颈——**单 agent 在单循环里运行，跟不上真实软件工作的结构**。

This landscape article covers the papers, open-source projects, benchmarks, and design paradigms that matter if you are building such a system today. It is intended as a reading guide, not a replacement for reading the primary sources.

本文覆盖了今天如果你要构建这类系统、值得阅读的论文、开源项目、基准和设计范式。它是一份**阅读导览**，不是对一手资料的替代。

---

## 1. The Two Paradigms / 两种范式

### 1.1 Multi-Agent Teams for Software Engineering / 软件工程的多 Agent 团队

The first paradigm treats agent design as a *team composition* problem. The designer decides what roles to create (product manager, architect, coder, tester, reviewer), how they talk to each other, and what artifacts they pass between each other. The representative early works are **MetaGPT** (encoding SOPs into agent protocols) and **ChatDev** (a conversational software company based on the waterfall model). The 2026 evolution of this line, visible in papers like **Agyn** and **MAS-Orchestra**, is to treat orchestration itself as a learned component — optimized via RL rather than hand-designed.

第一种范式把 agent 设计视为一个**团队组成**问题。设计者决定要创建哪些角色（产品经理、架构师、程序员、测试、评审）、它们之间如何对话、以及在角色之间传递什么产物。早期代表作是 **MetaGPT**（把 SOP 编码进 agent 协议）和 **ChatDev**（基于瀑布模型的对话式软件公司）。这条线 2026 年的演化——从 **Agyn** 和 **MAS-Orchestra** 等论文可以看出——是把编排本身视为一个**可学习的组件**，用 RL 来优化而不是人工设计。

### 1.2 Agent Factories: Agents That Design Agents / Agent 工厂：设计 Agent 的 Agent

The second paradigm treats the *agent system* itself as a first-class object that can be searched, optimized, and reused. Instead of asking "what should this agent do," it asks "what agent should we build, and how do we improve it automatically." Representative works include **AFlow** (ICLR 2025 Oral), which uses MCTS to search over code-represented workflows; **ADAS**, where a meta-agent literally writes new agent code; and the 2026 frontier work **AgentFactory**, which crystallizes successful solutions into reusable Python subagents. This paradigm is younger but evolving fast, and it is where the most mathematically interesting work is happening.

第二种范式把 **agent 系统**本身视为一个可搜索、可优化、可复用的一等对象。它问的不是"这个 agent 应该做什么"，而是"我们应该构建什么样的 agent，以及如何自动地改进它"。代表作包括 **AFlow**（ICLR 2025 Oral），它用 MCTS 在"代码表示的 workflow 空间"中搜索；**ADAS**，其中一个 meta-agent 字面意义上地**编写**新的 agent 代码；以及 2026 年的前沿工作 **AgentFactory**，它把成功的解决方案固化为可复用的 Python 子 agent。这条线更年轻但演进很快，也是数学上最有意思的工作所在的地方。

### 1.3 Where They Meet / 两者的交汇

The two paradigms are not mutually exclusive. A mature production system in 2026 typically has a hand-designed team composition at the top (because humans still understand software workflows better than LLMs) and an automated optimization layer at the bottom (because tuning individual prompts and tools by hand is no longer cost-effective). **OpenHands** is the clearest example of this synthesis — its Software Agent SDK (MLSys 2026) provides the team scaffold, while the community runs workflow optimization on top of it.

两种范式并不互斥。2026 年一个成熟的生产系统通常在顶层使用**人工设计的团队组成**（因为人类对软件工作流的理解仍然比 LLM 好），在底层使用**自动优化层**（因为手工调单个提示词和工具已不再划算）。**OpenHands** 是这种融合最清晰的例子——它的 Software Agent SDK（MLSys 2026）提供团队骨架，社区在其上运行 workflow 优化。

---

## 2. Essential Papers / 核心论文

### 2.1 Agent Factory Line / Agent 工厂线

| Paper / 论文 | arXiv | Year | Core Contribution / 核心贡献 |
|---|---|---|---|
| **AgentFactory** | [2603.18000](https://arxiv.org/abs/2603.18000) | 2026-03 | Preserves successful solutions as executable Python subagents; Install→Self-Evolve→Deploy lifecycle. 把成功解保存为可执行 Python 子 agent，三阶段生命周期。 |
| **AFlow** | [2410.10762](https://arxiv.org/abs/2410.10762) | ICLR 2025 Oral | MCTS search over code-represented workflow space; 80.3% average across 6 benchmarks. 在代码表示的 workflow 空间上做 MCTS 搜索。 |
| **A2Flow** | [2511.20693](https://arxiv.org/html/2511.20693) | 2025-11 | Automatic extraction of abstract operators — no hand-designed operator library. 自动抽取抽象算子，不需要手工算子库。 |
| **ADAS** | [2408.08435](https://arxiv.org/abs/2408.08435) | 2024 | Meta-agent writes new agent code in a general programming language. Meta-agent 用通用编程语言编写新 agent 代码。 |
| **DebFlow** | [2503.23781](https://arxiv.org/html/2503.23781) | 2025 | Agent creation via multi-agent debate. 通过多 agent 辩论创建 agent。 |
| **AgentEvolver** | [2511.10395](https://arxiv.org/abs/2511.10395) | 2025-11 | Efficiency-focused self-evolving agent system. 侧重效率的自演化 agent 系统。 |
| **Agent0** | [2511.16043](https://arxiv.org/html/2511.16043v1) | 2025-11 | Self-evolving from zero data via tool-integrated reasoning. 通过工具集成推理，从零数据自演化。 |

### 2.2 Multi-Agent Software Engineering Line / 多 Agent 软件工程线

| Paper / 论文 | arXiv | Year | Core Contribution / 核心贡献 |
|---|---|---|---|
| **OpenHands Software Agent SDK** | [2511.03690](https://arxiv.org/html/2511.03690v1) | MLSys 2026 | Production-grade composable SDK; 72% on SWE-bench Verified with Claude Sonnet 4.5. 生产级可组合 SDK，配 Sonnet 4.5 在 SWE-bench Verified 达 72%。 |
| **SWE-agent** | [2405.15793](https://arxiv.org/abs/2405.15793) | NeurIPS 2024 | Agent-Computer Interface (ACI) — tools redesigned for LLM ergonomics. 为 LLM 的人机工效重新设计的工具接口。 |
| **MetaGPT** | [2308.00352](https://arxiv.org/abs/2308.00352) | ICLR 2024 Oral | Encodes Standard Operating Procedures into agent protocols. 把 SOP 编码进 agent 协议。 |
| **Agyn** | [2602.01465](http://arxiv.org/abs/2602.01465v2) | 2026 | Team-based autonomous SE: coordination/research/implementation/review roles. 团队式自治软件工程：协调/调研/实现/评审四角色。 |
| **SEMAG** | [2603.15707](https://arxiv.org/html/2603.15707) | 2026 | Self-evolutionary multi-agent code gen; adaptive to task difficulty. 自演化多 agent 代码生成，对任务难度自适应。 |
| **MAS-Orchestra** | [2601.14652](http://arxiv.org/abs/2601.14652v2) | 2026 | Multi-agent orchestration as RL problem. 把多 agent 编排建模为 RL 问题。 |
| **AgentCoder** | [2312.13010](https://arxiv.org/abs/2312.13010) | 2023 | Programmer / Test Designer / Test Executor 3-role iteration. 程序员/测试设计师/测试执行器三角色迭代。 |
| **SolAgent** | [2601.23009](https://arxiv.org/abs/2601.23009) | 2026-01 | Solidity-specific multi-agent — 64.4% Pass@1 vs ~25% baseline. Solidity 智能合约专用多 agent。 |

### 2.3 Surveys / 综述

| Survey / 综述 | arXiv | Why Read / 为什么读 |
|---|---|---|
| **A Comprehensive Survey of Self-Evolving AI Agents** | [2508.07407](https://arxiv.org/abs/2508.07407) | The unified framework — System Inputs / Agent System / Environment / Optimisers — is the best mental model I've seen for this area. 统一框架是这个领域最好的心智模型。 |
| **Self-Evolving Agents: What, When, How, Where** | [2507.21046](https://arxiv.org/abs/2507.21046) | Taxonomy across agent components (model/memory/tools/architecture) and stages. 按组件和阶段的分类学。 |
| **Code Generation with LLM-based Agents** | [2508.00083](https://arxiv.org/html/2508.00083v1) | Directly targeting the coding agent subfield. 直接针对代码 agent 这个子领域。 |
| **LLM-Based Agentic Systems for SE** | [2601.09822](https://arxiv.org/abs/2601.09822v2) | Full software lifecycle coverage. 覆盖完整软件生命周期。 |
| **LLM Agent: Methodology, Applications, Challenges** | [2503.21460](https://arxiv.org/abs/2503.21460) | General-purpose methodology survey. 通用方法论综述。 |

---

## 3. Open-Source Projects Worth Your Time / 值得投入时间的开源项目

### 3.1 Coding Agent Runtimes / 编程 Agent 运行时

| Project / 项目 | Positioning / 定位 | SWE-bench V. / 基准 | Status / 状态 |
|---|---|---|---|
| **[OpenHands](https://github.com/All-Hands-AI/OpenHands)** | Most complete open coding agent platform. 最完整的开源编程 agent 平台。 | 72% (with Sonnet 4.5) | Very active / 极活跃 |
| **[SWE-agent](https://github.com/SWE-agent/SWE-agent)** | Reference implementation of ACI design. ACI 设计的参考实现。 | Foundational | Active / 活跃 |
| **[Aider](https://github.com/Aider-AI/aider)** | Strong repo-map + git integration — good component inspiration for multi-agent systems. repo-map + git 集成，多 agent 系统的组件灵感来源。 | — | Very active / 极活跃 |

### 3.2 Multi-Agent Orchestration SDKs / 多 Agent 编排 SDK

The four production-grade frameworks that have "won" the 2026 market:

2026 年市场上胜出的四个生产级框架：

- **[LangGraph](https://docs.langchain.com)** (v1.0 GA, Oct 2025) — The production-maturity leader. Built-in checkpointing, time-travel, LangSmith observability. Best when you need durable, inspectable workflows. 生产成熟度第一，自带 checkpoint 和时间旅行。
- **[Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview)** — Renamed from Claude Code SDK. Deepest MCP integration, in-process server, lifecycle hooks. Best if you are already in the Anthropic ecosystem. MCP 集成最深，Anthropic 生态首选。
- **[OpenAI Agents SDK](https://openai.com)** — Replaces the experimental Swarm. Simplest API, works with 100+ non-OpenAI models. Best for quick prototyping. 取代 Swarm 的正式 SDK，API 最简洁。
- **[CrewAI](https://github.com/crewAIInc/crewAI)** — 48k+ stars. role/task/crew abstraction with the largest community. Best for role-based team prototyping. 社区最大的多 agent 编排框架，role/task/crew 抽象清晰。

### 3.3 Agent Factory / Self-Evolving Projects / Agent 工厂与自演化项目

- **[AgentFactory](https://github.com/zzatpku/AgentFactory)** — Reference implementation of the arxiv 2603.18000 paper. Small (~44 stars) but the paradigm is important. 论文 2603.18000 的官方实现，虽小但范式重要。
- **[EvoAgentX](https://github.com/EvoAgentX/EvoAgentX)** — A framework for building a *self-evolving ecosystem* of agents. Actively maintained. 自演化 agent 生态的框架，活跃维护。
- **[AFlow](https://github.com/FoundationAgents/AFlow)** — Official AFlow implementation. Good starting point for workflow-search experiments. AFlow 官方实现，workflow 搜索实验的起点。

### 3.4 Curated Reading Lists / 精选阅读列表

- **[VoltAgent/awesome-ai-agent-papers](https://github.com/VoltAgent/awesome-ai-agent-papers)** — Curated 2026 agent papers, updated frequently. 2026 年 agent 论文精选，更新频繁。
- **[EvoAgentX/Awesome-Self-Evolving-Agents](https://github.com/EvoAgentX/Awesome-Self-Evolving-Agents)** — Companion list to the self-evolving agents survey. 自演化 agent 综述的配套列表。
- **[codefuse-ai/Awesome-Code-LLM](https://github.com/codefuse-ai/Awesome-Code-LLM)** — Comprehensive code-LLM ecosystem list (TMLR). 完整的 code-LLM 生态列表。

---

## 4. Benchmarks: What the 2026 Leaderboards Say / 2026 年基准现状

As of April 2026, SWE-bench Verified (500 human-filtered real GitHub issues) is the de facto standard for coding agents. The current top of the leaderboard:

截至 2026 年 4 月，SWE-bench Verified（500 个经过人工筛选的真实 GitHub issue）是编程 agent 的事实标准。当前榜单头部：

| Rank | System | Score | Open? |
|---|---|---|---|
| 1 | Claude Opus 4.5 | 80.9% | Closed |
| 2 | Claude Opus 4.6 | 80.8% | Closed |
| 3 | Gemini 3.1 Pro | 80.6% | Closed |
| 4 | MiniMax M2.5 | 80.2% | Closed |
| 5 | GPT-5.2 | 80.0% | Closed |
| — | Sonar Foundation Agent | 79.2% | Closed |
| — | **OpenHands + Sonnet 4.5** | **72%** | **Open** ⭐ |

On the harder **SWE-bench Pro**, GPT-5.3-Codex leads at 56.8%, with GPT-5.2-Codex at 56.4%. On Scale AI's SEAL standardized leaderboard, Claude Opus 4.5 leads at 45.9% — the large gap between raw leaderboards and standardized scaffolds illustrates how much of "agent performance" is really *harness* performance.

在更难的 **SWE-bench Pro** 上，GPT-5.3-Codex 以 56.8% 领先，GPT-5.2-Codex 为 56.4%。在 Scale AI 的 SEAL 标准化榜单上，Claude Opus 4.5 以 45.9% 领先——原始榜单与标准化 scaffold 之间的巨大差距说明："agent 性能"很大一部分其实是 **harness 性能**。

**Key takeaway.** The open-source frontier (OpenHands at 72%) trails the closed-source frontier by about 8 percentage points. That gap is smaller than it was a year ago, and it is mostly explained by model quality, not by agent design.

**关键启示。** 开源前沿（OpenHands 72%）落后闭源前沿约 8 个百分点。这个差距比一年前小了，而且主要可以用**模型质量**解释，而不是 agent 设计。

---

## 5. Recommended Learning Paths / 推荐学习路径

### 5.1 If You Are Building a Multi-Agent Coding Team / 如果你在构建多 Agent 编码团队

1. **Stand up OpenHands** as your base runtime. Don't reinvent the runtime — its Software Agent SDK (arxiv 2511.03690) already solved sandboxing, file ops, and browser integration. 用 OpenHands 作为底座运行时。
2. **Read the SWE-agent paper** to internalize the Agent-Computer Interface (ACI) concept. This is the single highest-leverage design idea in the field. 读 SWE-agent 论文吃透 ACI 概念。
3. **Study MetaGPT and Agyn** for role composition patterns. Don't copy them wholesale — copy the decomposition discipline. 学 MetaGPT 和 Agyn 的角色组成模式。
4. **Pick one orchestration SDK** (LangGraph for durability, Claude Agent SDK for MCP, CrewAI for speed of prototyping). 选一个编排 SDK。

### 5.2 If You Are Building an Agent Factory / 如果你在构建 Agent 工厂

1. **Read the Comprehensive Survey of Self-Evolving AI Agents (2508.07407)** first. The 4-component framework (System Inputs / Agent System / Environment / Optimisers) is the right mental model. 先读综述 2508.07407。
2. **Run AFlow** on a small domain to feel what workflow search actually looks like. AFlow 的 MCTS 很直观。
3. **Read the AgentFactory paper and run its code.** The "experience is code, not text" bet is the most important recent shift. 读 AgentFactory 论文并跑通代码。
4. **Watch AgentEvolver, Agent0, A2Flow.** These are the 2025-11+ frontier. 跟踪 2025-11 之后的前沿。

### 5.3 If You Only Have 3 Hours / 如果只有 3 小时

Read, in order: (a) the abstract and §3 of **AgentFactory**, (b) the ACI section of **SWE-agent**, (c) the "unified framework" section of the **self-evolving agents survey (2508.07407)**. These three will tell you more than any single 50-page textbook.

按顺序读：（a）**AgentFactory** 的摘要和第 3 节；（b）**SWE-agent** 讨论 ACI 的章节；（c）**自演化 agent 综述 2508.07407** 的统一框架章节。这三段比任何单本 50 页教材都更有价值。

---

## 6. Key Insights / 关键洞察

1. **The unit of accumulated experience is shifting from text to code.** This is the single most important trend of 2025-2026. Text reflections are ambiguous, don't compose, and compete for attention; code is precise, composable, and portable. AgentFactory is the cleanest articulation of this shift, but the same principle shows up in ADAS, DebFlow, AFlow, and OpenHands's SDK.
1. **累积经验的单位正从文本转向代码。** 这是 2025-2026 最重要的趋势。文本反思模糊、不可组合、争夺注意力；代码精确、可组合、可移植。AgentFactory 是最清晰的表达，但相同原则也出现在 ADAS、DebFlow、AFlow 和 OpenHands SDK 中。

2. **Harness quality dominates model quality at the frontier.** The gap between OpenHands (72%) and the closed-source frontier (80%+) is small and shrinking. Most of the lift in the last 18 months came from ACI design, workspace management, and tool ergonomics — not from bigger models.
2. **在前沿位置，harness 质量主导模型质量。** OpenHands（72%）与闭源前沿（80%+）之间的差距很小而且在缩小。过去 18 个月的大部分提升来自 ACI 设计、工作区管理和工具人机工效——不是更大的模型。

3. **Orchestration is becoming a learned component.** Papers like MAS-Orchestra and AFlow show that orchestration no longer needs to be hand-written. You can search, optimize, or RL-train it. Teams still designing their orchestration by hand in 2026 are leaving value on the table.
3. **编排正在成为一个可学习的组件。** MAS-Orchestra 和 AFlow 这样的论文表明编排不再需要手写。你可以搜索它、优化它、或用 RL 训练它。2026 年还在手工设计编排的团队是在浪费价值。

4. **The compounding curve is real but lagged.** AgentFactory's experimental result — comparable cost on Batch 1, 57% savings on Batch 2 — captures a general truth: self-evolving systems pay an upfront cost and recoup it later. This means they are the right choice for long-lived, structured task streams, and the wrong choice for one-off tasks.
4. **复利曲线是真实的，但有滞后。** AgentFactory 的实验结果——Batch 1 成本相当，Batch 2 节省 57%——反映了一个普遍的真理：自演化系统前期付出成本，后期收回。这意味着它们适合长周期、结构化的任务流，不适合一次性任务。

5. **Open-source has caught up enough to be the starting point.** In 2024 you might reasonably have started from a closed product and reverse-engineered it. In 2026, starting from OpenHands or Claude Agent SDK and customizing is strictly better — you get the runtime, the benchmarks, and the update cadence.
5. **开源已经追上到足以作为起点。** 2024 年你可能合理地从闭源产品开始并逆向。2026 年，从 OpenHands 或 Claude Agent SDK 开始并定制是严格更优的——你同时拿到运行时、基准和更新节奏。

---

## References / 参考资料

All papers and repositories cited in this article are linked inline above. For continuous tracking of new work in this space, the three best feeds are:

本文引用的所有论文和仓库均在正文中以内联链接提供。持续跟踪这个领域新工作的三个最佳订阅源是：

- [VoltAgent/awesome-ai-agent-papers](https://github.com/VoltAgent/awesome-ai-agent-papers) — Agent 论文持续更新
- [EvoAgentX/Awesome-Self-Evolving-Agents](https://github.com/EvoAgentX/Awesome-Self-Evolving-Agents) — 自演化 agent 专题
- [SWE-bench Leaderboard](http://www.swebench.com/) — 编程 agent 基准实况
