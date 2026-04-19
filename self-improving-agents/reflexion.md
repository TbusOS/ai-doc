# Reflexion: Language Agents with Verbal Reinforcement Learning

> **原文链接:** [arXiv:2303.11366](https://arxiv.org/abs/2303.11366)
>
> **作者:** Noah Shinn, Federico Cassano, Edward Berman, Ashwin Gopinath, Karthik Narasimhan, Shunyu Yao
>
> **发表:** NeurIPS 2023 / 2023-03 arXiv 首发
>
> **代码:** [github.com/noahshinn/reflexion](https://github.com/noahshinn/reflexion)
>
> **主题:** 给 agent 一种**不用更新权重的强化学习**——失败后让 LLM 自己写一段"lesson"存进记忆，下次尝试时先读 lesson 再行动。在 HumanEval 编码任务上把 GPT-4 从 80% 推到 **91%**。

---

## 核心命题 / The Core Claim

传统 RL 通过**更新权重**来让 agent 从失败中学习，但这对大模型来说**不现实**：

- 权重几百 GB，update 一次很贵
- 单个任务的 reward 信号太稀疏
- 微调会污染其他能力（通才变专才）

Reflexion 的洞察：**用自然语言反馈代替梯度更新**。让 LLM 自己写 "我上次为什么失败 / 下次该怎么做" 的**口头反思**，作为下次 trial 的上下文。整个"学习"过程不改任何权重。

这是 RL 的一种极简形式——**verbal reinforcement learning**。

---

## 1. 三个角色的循环 / The Three-Actor Architecture

Reflexion 把 agent 分成三个独立的 LLM 角色：

```
┌────────────┐   action    ┌──────────┐   reward
│   Actor    │──────────▶  │ Environment │──────────┐
└────────────┘             └──────────┘            │
      ▲                                             │
      │ trajectory + reflection                     ▼
┌────────────┐   feedback   ┌──────────────┐
│ Memory     │◀─────────────│  Evaluator   │
│(语言反思)   │              │ (打分/评判)   │
└────────────┘              └──────────────┘
      ▲                              │
      │                              ▼
      │          ┌────────────────────────┐
      └──────────│  Self-Reflection       │
                 │(把 reward+trajectory   │
                 │ 变成下次的 "lesson")    │
                 └────────────────────────┘
```

1. **Actor** — 产生 trajectory（基于 ReAct 范式）
2. **Evaluator** — 给 trajectory 打分（任务特定：编程看 unit test 结果，游戏看胜负）
3. **Self-Reflection** — 看 trajectory + score，写一段**自然语言反思**存入 Memory
4. **下一轮 Actor 开始前**，从 Memory 里读出历史反思作为上下文

---

## 2. Self-Reflection 的样例

### 编程任务：HumanEval / LeetCode

第一次尝试失败的 trajectory 一般长这样：

```
写代码解题 → 提交 → Evaluator 跑测试用例 → 报错 "AssertionError on input [3, 1, 4]"
```

**Reflexion step：** 把 trajectory + 错误信息喂给 LLM，让它自己写：

```
反思：我的代码假设输入已排序，但测试用例里输入是乱序的。
关键错误：在第 12 行直接对 nums[0] 做比较而没有先调用 sorted()。
下次尝试要点：
1. 先排序输入
2. 检查边界情况：空列表、单元素列表
3. 返回前再跑一遍测试用例验证逻辑
```

下一轮 Actor 尝试时，这段反思直接作为 prompt 的一部分——**相当于 agent 给未来的自己留了一张 post-it 便签**。

### 决策任务：ALFWorld

假设 Actor 在家庭环境里失败（找不到物品）：

```
反思：我在找 pillow 时一直打开卧室的抽屉，但上次观察到 pillow 通常在 bed 或 couch 上。
下次应该先检查 "on the bed" 和 "on the couch" 这两个位置，再考虑柜子和抽屉。
```

---

## 3. 关键数字 / Key Results

### HumanEval 编码任务

| 方法 | Pass@1 |
|---|---|
| GPT-4 baseline | 80.1% |
| GPT-4 + Reflexion | **91.0%** |

**+11 个百分点的提升**——不改模型权重，只加一个反思循环。

### HotPotQA 知识问答

| 方法 | EM |
|---|---|
| ReAct | 27% |
| ReAct + Reflexion (4 trials) | **51%** |

### AlfWorld 决策任务

| 方法 | 成功率 |
|---|---|
| ReAct | 55% |
| ReAct + Reflexion | **91%** (经过若干次反思迭代) |

---

## 4. 为什么 Verbal RL 有效 / Why Verbal RL Works

### 4.1 信用分配（Credit Assignment）用自然语言处理

传统 RL 最难的一件事：**是轨迹里哪一步导致了最终失败？** 梯度算法通过 backprop 做信用分配，但对稀疏 reward 极其低效。

Reflexion 把这件事丢给了 LLM：**"你看这段 trajectory 和结果，告诉我是哪一步错了"**——LLM 的语言理解能力天然擅长做这种归因。

### 4.2 Episodic memory 比 parametric memory 更敏捷

权重更新是**参数化记忆**——learn 慢、rigid、可能污染其他能力。
Reflexion 的反思是**情景记忆**（episodic memory）——instant、可读、可删、可重组。

对 LLM agent 来说，情景记忆通常更符合需求：**你希望 agent 记住"上次这个客户说他对延时敏感"，而不是修改整个模型的权重**。

### 4.3 Reward 信号不需要可微

传统 RL 需要 reward 函数可微或至少可评估。Reflexion 的 Evaluator 可以是**任意黑盒**——unit test、游戏引擎、人类评分、另一个 LLM 的 judge——只要能产出反馈，就能生成反思。

---

## 5. 工程视角 / Engineering Perspective

### 5.1 最小实现（伪码）

```python
def reflexion_agent(task, max_trials=3):
    memory = []  # 存历次反思
    for trial in range(max_trials):
        # Actor 用 memory 作为上下文产生 trajectory
        trajectory = actor.run(
            task=task,
            context="Previous reflections:\n" + "\n".join(memory)
        )

        # Evaluator 打分
        score, feedback = evaluator.evaluate(trajectory)

        if score == PASS:
            return trajectory  # 成功

        # 失败：生成反思
        reflection = llm.generate(
            f"Task: {task}\n"
            f"Trajectory: {trajectory}\n"
            f"Evaluator feedback: {feedback}\n"
            f"Write a short reflection on what went wrong and "
            f"what to try differently next time."
        )
        memory.append(reflection)

    return "Failed after max trials"
```

整个 "learning" 过程就在 `memory.append` 这一行——**没有模型更新，没有优化器，没有 GPU 训练**。

### 5.2 什么情况适合 Reflexion

**适合：**
- Evaluator 信号**快、便宜、可靠**（unit test、compiler、确定性游戏）
- 同类型任务会重复遇到
- 任务可以被拆成"尝试→评估→反思→再尝试"的循环

**不适合：**
- Evaluator 信号稀疏或不可靠（人类主观打分、多方意见分歧）
- 单次任务（无重试机会）
- 任务之间完全不相关（反思无法泛化）

### 5.3 反思质量决定一切

Reflexion 最大的失败模式不是"反思没效果"，而是**反思写得太笼统**：

❌ 差的反思：*"我应该更仔细地思考"*
❌ 差的反思：*"下次要考虑所有边界情况"*
✅ 好的反思：*"输入中包含负数时我的 dp 公式没处理，第 14 行的 `dp[i] = max(dp[i-1] + nums[i], nums[i])` 会在负数连续时给出错误的累积和。下次先跑 `if len(nums) == 1: return nums[0]`，再对负数做特殊处理。"*

**实操建议：** 给 self-reflection prompt 加约束——**"列出具体的第几行/第几步出错，给出具体可执行的下一步"**。

### 5.4 Memory 管理是进阶话题

反思会越积越多。Reflexion 原论文用**最近 3 条**，但生产系统需要：

- **按语义检索**（当前任务相关的反思优先）
- **失败率加权**（反复失败的 lesson 保留更久）
- **定期蒸馏**（N 条分散的反思 → 1 条综合 lesson）

这和 [MemoryBank](../memory-systems/memorybank.md) / [Evo-Memory](../memory-systems/evo-memory.md) 的思路直接相关。

---

## 6. 和本仓库其他文章的关联 / Relation to Other Papers

| 论文 | 关系 |
|---|---|
| [ReAct](../agent-patterns/react.md) | Reflexion 的 Actor 就是 ReAct 循环 |
| [AgentFactory](agent-factory.md) | AgentFactory 把"成功 trajectory 保存为可执行代码"；Reflexion 把"失败 trajectory 保存为语言反思"——两种互补的经验载体 |
| [MemoryBank](../memory-systems/memorybank.md) | Reflexion 的反思池就是一种 memory；MemoryBank 讨论如何管理这种记忆池 |
| [RISE](rise.md) | 都是"失败后自我修正"，但 RISE 更聚焦单次推理内的递归，Reflexion 聚焦 trial 之间的记忆 |
| [EvolveR](evolver.md) | EvolveR 把反思进一步蒸馏为**抽象策略原则**——Reflexion 的下一层 |

---

## 7. 2025 年后的演化 / Evolution in 2025

Reflexion 开启的"verbal RL"思想在 2025 年已经是 agent 系统的标配组件：

- **Claude Code / Codex** 类 agent：每次 task 失败后 LLM 自动总结 "lesson.md"，下次读入
- **[autoresearch](autoresearch.md)**：Karpathy 的版本——Agent 跑实验，val_bpb 回退后"反思为什么这个改动没用"
- **OpenAI o1/GPT-5** 的 test-time thinking：内化了反思机制，不需要外部 loop
- **LangGraph 的 self-correcting chains**：Reflexion 作为内置原语

---

## 为什么是 Tier-S / Why This Is Tier-S

- **把 RL 从"研究者专利"变成"应用工程师默认工具"**
- **概念极简但效果显著**：HumanEval +11 个百分点是在不改模型的前提下获得的
- **作者有强项目影响力**：Shunyu Yao 也是 ReAct 的一作
- **直接落地**：任何有 evaluator 的 task 都能套 Reflexion，不需要任何特殊基础设施

---

## References / 参考

- **论文:** [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366)
- **代码:** [github.com/noahshinn/reflexion](https://github.com/noahshinn/reflexion)
- **作者:**
  - Noah Shinn ([@noahshinn024 on X](https://x.com/noahshinn024))
  - Shunyu Yao ([@ShunyuYao10 on X](https://x.com/ShunyuYao10)) — ReAct 一作
- **本仓库相关:**
  - [ReAct](../agent-patterns/react.md) — Reflexion 的基础循环
  - [AgentFactory](agent-factory.md) — 互补的经验保存范式
  - [autoresearch](autoresearch.md) — 2026 年的 verbal RL 应用
  - [MemoryBank](../memory-systems/memorybank.md) — 管理反思记忆的方法论
