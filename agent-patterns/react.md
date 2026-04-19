# ReAct: Synergizing Reasoning and Acting in Language Models

> **原文链接:** [arXiv:2210.03629](https://arxiv.org/abs/2210.03629) / [项目页](https://react-lm.github.io/)
>
> **作者:** Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, Yuan Cao
>
> **发表:** ICLR 2023 / 2022-10 arXiv 首发
>
> **代码:** [github.com/ysymyth/ReAct](https://github.com/ysymyth/ReAct)
>
> **主题:** LLM agent 的**原型设计模式**——把 reasoning (CoT 思考) 和 acting (工具调用) 交织在一个循环里。2023 年之后几乎所有 agent 框架(LangChain、AutoGPT、Claude/GPT agent 模式)都是 ReAct 的变体。

---

## 核心命题 / The Core Claim

在 ReAct 之前，LLM 处理复杂任务有两条主流路径，各有致命缺陷：

| 方法 | 优势 | 缺陷 |
|---|---|---|
| **Chain-of-Thought (CoT)** — 只思考不行动 | 多步推理能力强 | **幻觉严重**——内部推理无法用外部事实纠正 |
| **Act-only** — 只工具调用不思考 | 能访问外部信息 | **无法做长链推理**——每次工具调用都是孤立的 |

ReAct 的洞察：**两者应该交织，不是二选一**。一个 agent 步骤里同时产出 `Thought`（推理）+ `Action`（工具）+ `Observation`（反馈），循环推进。

---

## 1. 算法 / The Algorithm

ReAct 的核心是一个交织循环。每一步 agent 产生三段结构化输出：

```
Thought:  <关于下一步该做什么的推理>
Action:   <工具调用，例如 Search["Apple Park"]>
Observation: <工具返回的结果>
```

循环直到 Thought 判断任务完成，产出最终答案。

### 一个具体例子（论文 Figure 1）

任务：*Aside from the Apple Remote, what other device can control the program Apple Remote was originally designed to interact with?*

**仅 CoT（幻觉）:**
```
Thought: Apple Remote was designed for Apple TV. Other devices are iPhone and iPad.
(错误：答案听起来合理但没有验证事实)
```

**仅 Act（无推理）:**
```
Action: Search["Apple Remote"]
Observation: [返回一大段 Apple Remote 百科内容]
→ 无法从这段原始信息中推断出"最初控制的程序"+"其他可以控制的设备"两层关系
```

**ReAct（交织）:**
```
Thought 1: 我需要先搜 Apple Remote 找出它最初是为什么设计的
Action 1:  Search["Apple Remote"]
Observation 1: 主要设计用来控制 Front Row 媒体中心程序

Thought 2: 现在搜 Front Row，找出还能用什么控制它
Action 2:  Search["Front Row"]
Observation 2: Front Row 可以用键盘功能键或苹果 Remote 控制

Thought 3: 所以答案是键盘功能键
Action 3:  Finish[keyboard function keys]
```

---

## 2. 为什么交织有效 / Why Interleaving Wins

ReAct 工作的原因不是"它用了更多 token"——而是**思考和行动互相校准**：

- **Thought → Action** 让推理**具体化为可验证的步骤**（每个 thought 都必须转化为可执行的 action）
- **Observation → Thought** 让后续推理**锚定在外部事实上**（不能自己编）
- **Action → Thought** 让"发现新事实时能动态更新计划"（纯 CoT 做不到：推理是一次性的）

论文里用三个任务验证：
- **HotPotQA / FEVER**（知识问答）——ReAct 把幻觉率显著降低
- **ALFWorld / WebShop**（决策制定）——ReAct 在 ALFWorld 上比模仿学习+RL 基线的绝对胜率高 **34%**（62% vs 28%）

**关键数字（论文 Table 1, 2）:**

| 方法 | HotPotQA EM | ALFWorld 成功率 |
|---|---|---|
| Standard prompting | 28.7 | — |
| Chain-of-Thought | 29.4 | 10 |
| Act-only | 25.7 | 45 |
| **ReAct** | **35.1** | **71** |

ReAct 比任一单独方法都明显更强，而且在 ALFWorld 上的优势**特别大**——这验证了"需要长链推理 + 外部信息交互"的任务最能受益于交织。

---

## 3. 工程视角：ReAct 的三层价值

### 3.1 作为**提示词模式**（最原始形态）

只改 prompt，不改模型，就能让任何 instruction-tuned LLM 变成简易 agent：

```
你是一个 agent。对每一步产出：
Thought: <你对下一步的推理>
Action: <工具调用 或 Finish[答案]>

可用工具：
- Search[query]：搜索
- Lookup[keyword]：在上次搜索结果里查找
- Finish[answer]：输出最终答案并结束

任务：<用户问题>
```

Agent 框架运行：
1. 让模型产出一条 `Thought + Action`
2. 执行 Action，把结果作为 `Observation` 追加到上下文
3. 回到第 1 步

**这就是 LangChain、AutoGPT、Claude/GPT agent 模式的基础结构**。

### 3.2 作为**agent 架构原语**

ReAct 给出了 agent 系统设计的最小词汇表：

| 原语 | 作用 |
|---|---|
| **Thought** | 推理 / 规划 / 元认知 |
| **Action** | 与外部世界交互（工具、API、文件系统） |
| **Observation** | 工具返回的环境反馈 |
| **State** | 到目前为止所有 Thought/Action/Observation 的累积上下文 |
| **Termination** | Finish 动作（或 max step 护栏） |

今天所有复杂 agent 架构都可以被分解成这些原语的组合变种：
- **Reflexion** = ReAct + 自我反思 step
- **Tree of Thoughts** = ReAct 带分支搜索
- **Plan-and-Execute** = ReAct 但 Plan 提前、Act 后置
- **Anthropic orchestrator-workers** = 外层 ReAct（planner） + 内层 ReAct（workers）

### 3.3 作为**评估框架**

ReAct 论文的另一个贡献：它**同时在知识问答和决策任务上**做评估，避免了"agent 框架只在 toy task 上看起来好"的陷阱。

**设计新 agent 时的 ReAct 启示：**
- **评估集必须跨任务类型** — 只在知识问答上 work 的 agent 不算 agent
- **Baseline 必须包括 CoT 和 Act-only** — 否则你不知道交织本身的贡献
- **记录 trajectory 长度** — ReAct 平均用 **6-7 步**完成 HotPotQA，太短说明没做工具调用，太长说明在兜圈子

---

## 4. 与 Reflexion / 现代 agent 的关系

ReAct 是 2022 年的工作，到 2025 年已经是每个 agent 系统的**基础循环**。但工程实践里衍生了几个重要模式：

### ReAct 的局限

- **没有反思机制**：步步走，走错没法纠正——只能重试整个任务
- **没有长期记忆**：trajectory 靠上下文窗口，超过就断
- **没有层级规划**：所有步骤都是扁平的，处理复杂任务时 trajectory 膨胀

### 后续工作的解决方案

| 衍生工作 | 补了什么 |
|---|---|
| **[Reflexion](../self-improving-agents/reflexion.md)** | 失败后写 "lesson" 进入长期记忆，下次重试时先读 lesson |
| **Tree of Thoughts** | 在 Thought 处分支，搜索多条路径，回溯错路径 |
| **Plan-and-Execute** | 先一次规划所有 sub-task，再分别 ReAct 执行 |
| **[Anthropic Building Effective Agents](anthropic-building-effective-agents.md)** | 把 ReAct 做成 orchestrator-workers 架构的内层循环 |
| **[AgentFactory](../self-improving-agents/agent-factory.md)** | 成功的 ReAct trajectory 蒸馏为可复用 Python 子 agent |

理解 ReAct 是理解所有这些后续工作的前提。

---

## 5. 工程师视角的关键启示 / Key Takeaways

### 1. **"Think step by step"配合"能调工具"就是一个可用 agent**

今天做个简易 agent，不需要 LangGraph 或者其他框架——一个 while 循环、一个工具注册表、一个 ReAct 格式 prompt 就够。保持最小化能让你真正理解失败模式出在哪里。

### 2. Trajectory **是** agent 的源代码

ReAct 让你看到 agent 的推理痕迹。在生产中：

- **记录所有 trajectory 到日志**——这是 debug 的第一资源
- **失败的 trajectory 比成功的更宝贵**——它告诉你 prompt / 工具 / 护栏哪里需要加强
- **trajectory 可以做 evals**——定义"理想 trajectory 形状"，对比实际产出是否匹配

### 3. **工具设计比 prompt 设计重要**

ReAct 里的工具描述直接决定 agent 的行为质量。一个常见错误：工具太少（agent 卡住）或太多（agent 选错）。**5-10 个明确命名、边界清晰的工具** 通常是最优点。

### 4. **Max step 是必须的护栏**

没有 max step，agent 会进入"反复搜索、反复反思、永不 Finish" 的死循环。ReAct 原论文用 max step = 7 就够处理 HotPotQA。**现代系统建议 max step = 20-50 + 超时**。

### 5. **"Thought"**不只是 CoT——是审计口子

生产系统里 Thought 行的真正价值不是推理质量，而是**可审计性**：

- 任务失败时，从 Thought 字段能看到 agent 在哪步开始偏
- 人类可以在 Thought 里注入修正指令（human-in-the-loop）
- 合规审查可以基于 Thought 内容做政策检查

---

## 6. 复现最小代码 / Minimal Reproduction

一个可运行的最小 ReAct loop（伪码，任何 LLM API 都能跑）：

```python
def react_loop(task, tools, llm, max_steps=10):
    context = f"Task: {task}\n"
    for step in range(max_steps):
        # 让 LLM 产出 Thought + Action
        response = llm.generate(
            context + "Produce a Thought followed by an Action.\n"
            + "Available tools: " + tool_list(tools)
        )
        thought, action, args = parse(response)
        context += f"Thought: {thought}\nAction: {action}[{args}]\n"

        # 终止
        if action == "Finish":
            return args

        # 执行工具
        observation = tools[action](args)
        context += f"Observation: {observation}\n"

    return "Max steps reached"
```

这 15 行代码是现代所有 agent 框架的内核。

---

## References / 参考

- **论文:** [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- **项目页(含可交互 demo):** [react-lm.github.io](https://react-lm.github.io/)
- **代码:** [github.com/ysymyth/ReAct](https://github.com/ysymyth/ReAct)
- **作者后续工作:**
  - [Tree of Thoughts](https://arxiv.org/abs/2305.10601) — Yao 同一作者的分支搜索扩展
  - [Reflexion](https://arxiv.org/abs/2303.11366) — 互补的反思扩展
- **本仓库相关:**
  - [Reflexion](../self-improving-agents/reflexion.md) — ReAct 的反思增强版
  - [Anthropic Building Effective Agents](anthropic-building-effective-agents.md) — ReAct 在生产 agent 架构里的角色
  - [AgentFactory](../self-improving-agents/agent-factory.md) — 把 ReAct trajectory 固化为可复用代码
  - [Coding Agents Landscape 2026](coding-agents-landscape-2026.md) — ReAct 在编码 agent 生态的演化
