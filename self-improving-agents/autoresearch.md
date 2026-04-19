# autoresearch: Letting an AI Agent Do Its Own ML Research Overnight

> **原文仓库:** [github.com/karpathy/autoresearch](https://github.com/karpathy/autoresearch)
>
> **作者:** Andrej Karpathy
>
> **发表:** 2026 年 3 月 / GitHub + X
>
> **相关推文:** [tweet #1](https://x.com/karpathy/status/2029701092347630069) · [tweet #2](https://x.com/karpathy/status/2031135152349524125)
>
> **主题:** 把一个真实的 LLM 训练环境交给 AI agent，让它自主改代码、跑实验、保留/丢弃，循环迭代——一种"睡一觉醒来收获一批实验结果"的自主研究范式

---

## 缘起 / A Tale From the Future

> *"One day, frontier AI research used to be done by meat computers in between eating, sleeping, having other fun, and synchronizing once in a while using sound wave interconnect in the ritual of 'group meeting'. That era is long gone. Research is now entirely the domain of autonomous swarms of AI agents running across compute cluster megastructures in the skies. The agents claim that we are now in the 10,205th generation of the code base, in any case no one could tell if that's right or wrong as the 'code' is now a self-modifying binary that has grown beyond human comprehension. **This repo is the story of how it all began.**"*
>
> — @karpathy, March 2026

> *"有一天，前沿 AI 研究过去是由一群血肉计算机在吃饭、睡觉、娱乐之间完成的，偶尔通过一种叫做'组会'的仪式用声波互联同步一下。那个时代早已过去。如今研究完全属于在天空中计算集群巨构上运行的自主 AI agent 群体。Agent 们声称我们现在已经是这套代码库的第 10,205 代了——反正也没人能说清这是对还是错，因为'代码'如今是一个已经超出人类理解能力、能自我修改的二进制。**这个仓库讲的就是一切是如何开始的。**"*

Karpathy 用这段半戏谑半认真的自述定义了 autoresearch 的野心：**这是自主 AI 研究时代的"第零天"样本**。仓库本身只是一个极小、极克制的单 GPU 原型，但它的设计选择把"AI 能不能自己做研究"这个抽象问题变成了一个可操作的工程实验。

---

## 1. 核心思路 / The Core Idea

**一句话概括:** 给 AI agent 一个真实但受约束的 LLM 训练设置，让它**通宵**自主做实验——改代码、训练 5 分钟、检查指标是否改善、保留或丢弃、循环——早上醒来你收获一份实验日志和（希望是）一个更好的模型。

**One-sentence summary:** Give an AI agent a small but real LLM training setup and let it experiment autonomously overnight. It modifies the code, trains for 5 minutes, checks if the result improved, keeps or discards, and repeats. You wake up in the morning to a log of experiments and (hopefully) a better model.

训练代码是 [nanochat](https://github.com/karpathy/nanochat) 的一个简化版——单 GPU 实现的 GPT 训练。**关键的反直觉设计**在于：你作为研究者**不**直接碰任何 Python 文件，你编程的是 `program.md`——那个给 AI agent 提供上下文、设定这个"自主研究组织"行为方式的 Markdown 文件。

The training code is a simplified single-GPU implementation of nanochat. **The core counter-intuitive design:** as a researcher you're *not* touching any of the Python files like you normally would. Instead, you are programming the `program.md` Markdown files that provide context to the AI agents and set up your autonomous research org.

---

## 2. 仓库结构 / Repository Structure

仓库只有三个真正重要的文件：

```
prepare.py      — 固定常量、数据准备 + 运行时工具（不可修改）
train.py        — 模型、优化器、训练循环（agent 修改这个文件）
program.md      — agent 指令（人类修改这个文件）
pyproject.toml  — 依赖
```

- **`prepare.py`** — 固定常量、一次性数据准备（下载训练数据、训练 BPE tokenizer）、以及运行时工具（dataloader、evaluation）。**不修改**。它定义"评测是什么"，是 agent 无法绕过的地面真值。
- **`train.py`** — agent **唯一**编辑的文件。包含完整的 GPT 模型、优化器（Muon + AdamW）、训练循环。架构、超参、优化器、batch size——一切皆可变。
- **`program.md`** — 一个 agent 的基线指令。把你的 agent 指向这里，然后让它跑。**由人类迭代**。

这种"agent 改一个文件，人类改另一个文件"的**双层分工**是整个设计的关键。它让两件事可以独立演化：agent 的研究行为（由 `program.md` 塑造）和被研究的对象（即 `train.py` 中的模型代码）。

---

## 3. 实验循环 / The Experimentation Loop

`program.md` 里定义的核心算法（为了忠实保留原意，下面逐条双语）：

**LOOP FOREVER:**

1. Look at the git state: the current branch/commit we're on
   - 查看 git 状态：当前分支/commit
2. Tune `train.py` with an experimental idea by directly hacking the code.
   - 用一个实验性想法直接改 `train.py`
3. `git commit`
4. Run the experiment: `uv run train.py > run.log 2>&1` (redirect everything — do NOT use tee or let output flood your context)
   - 跑实验，**把所有输出重定向到 run.log**，不要让它淹没 agent 的 context
5. Read out the results: `grep "^val_bpb:\|^peak_vram_mb:" run.log`
   - 用 grep 只提取关键指标
6. If the grep output is empty, the run crashed. Run `tail -n 50 run.log` to read the Python stack trace and attempt a fix. If you can't get things to work after more than a few attempts, give up.
   - 如果 grep 为空说明崩溃了，看最后 50 行堆栈，尝试修复；修不好就放弃
7. Record the results in the tsv (NOTE: do not commit the results.tsv file, leave it untracked by git)
   - 把结果记入 tsv（注意 results.tsv 不要 commit）
8. If val_bpb improved (lower), you "advance" the branch, keeping the git commit
   - 如果 val_bpb 改善了（更低），**推进分支**，保留这次 commit
9. If val_bpb is equal or worse, you git reset back to where you started
   - 如果持平或变差，git reset 回到起点

这个循环优雅之处在于它把"研究"压缩成了一个可执行的决策流程：**改 → 测 → 保留/回滚 → 重复**。Git 本身成了 agent 的"实验笔记本" + "回退机制"。

---

## 4. 度量标准 / The Metric

**val_bpb**（validation bits per byte），越低越好。

选 bpb 而不是 val_loss 有一个精心的原因：**bpb 与词表大小无关**。这意味着 agent 可以自由地把 `vocab_size` 从 8192 改到 4096 或 1024，换掉 tokenizer 方案，而不同配置之间**仍然可公平比较**。如果用 val_loss，vocab 一变损失的可比性就丢了，agent 就可以"作弊式"地通过缩小词表来伪造进步。

**val_bpb (validation bits per byte), lower is better.** The deliberate reason for choosing bpb over val_loss is that bpb is **vocab-size-independent** — architectural/tokenizer changes remain fairly comparable, which closes a whole class of "gaming the metric" failure modes.

这是 Karpathy 式工程品味的体现：**当你要把评估交给一个自主优化器时，选一个它无法通过"走捷径"来刷的指标**。

---

## 5. 固定时间预算 / The Fixed Time Budget

训练**始终**跑 5 分钟（wall clock，不含启动/编译），无论做了什么改动。

**The training script runs for a fixed time budget of 5 minutes**, regardless of the details of your compute.

这个看似简单的决策带来三个重要性质：

1. **直接可比**。无论 agent 改了 batch size、模型规模还是架构，所有实验都在同一个预算下跑——"在 5 分钟内谁能训得更好"变成了一个定义明确的单目标优化。
2. **每小时 ~12 次实验，一晚 ~100 次**。这是 Karpathy 算的：人类睡觉的时间 agent 能跑完 ~100 个实验。**"睡眠 = 自主研究周期"** 这个单位把自主性变得具体。
3. **平台相关**。在你机器上的最优解不一定在别人机器上最优。autoresearch 发现的是"你的平台上在 5 分钟预算下的最优模型"，而不是绝对意义上的最优。

---

## 6. 简洁性准则 / The Simplicity Criterion

`program.md` 里有一条很耐人寻味的规定：

> *"All else being equal, simpler is better. A small improvement that adds ugly complexity is not worth it. Conversely, removing something and getting equal or better results is a great outcome — that's a simplification win. A 0.001 val_bpb improvement that adds 20 lines of hacky code? Probably not worth it. A 0.001 val_bpb improvement from deleting code? Definitely keep. An improvement of ~0 but much simpler code? Keep."*

> *其他条件相同时，更简单者更好。加 20 行黑魔法换 0.001 的 bpb 改善不值；删掉代码还能保持或改善结果是**大胜**——这是一次"简化胜利"。指标没变但代码更简单了？也保留。*

这是对"自动优化器的经典失败模式"（累积越来越多不可读的 tricks）的直接反制。**Karpathy 把自己的品味固化进了 agent 的决策函数**——这也是 `program.md` 作为"研究组织代码"能做到而提示词做不到的事：它不是告诉模型"要聪明"，而是**把判断标准写死**。

---

## 7. "NEVER STOP"：自主性的硬约束 / The Autonomy Contract

`program.md` 里有一条用大写写着的规则：

> **NEVER STOP**: Once the experiment loop has begun (after the initial setup), do NOT pause to ask the human if you should continue. Do NOT ask "should I keep going?" or "is this a good stopping point?". The human might be asleep, or gone from a computer and expects you to continue working *indefinitely* until you are manually stopped. You are autonomous. If you run out of ideas, think harder — read papers referenced in the code, re-read the in-scope files for new angles, try combining previous near-misses, try more radical architectural changes. The loop runs until the human interrupts you, period.

> **绝不停止**：一旦实验循环开始（初始 setup 之后），**不要**停下来问人类是否继续，**不要**问"我是不是该继续？""这里是不是合适的停止点？"。人类可能在睡觉，或者已经离开电脑，期望你**无限期**地工作，直到被手动打断。你是自主的。如果没想法了，就**想得更狠一点**——读代码里引用的论文、重读 in-scope 文件找新角度、把之前的"差一点成功"组合起来、尝试更激进的架构改动。循环一直跑到人类打断，句号。

这条规则是整篇 `program.md` 里最反直觉、也最有信号价值的部分。Claude / Codex 这类通用编码 agent 有一种根深蒂固的"礼貌倾向"——它们会在不确定时征求确认，这是对话场景下的正确行为。但在**自主研究**场景下这是 bug：它破坏了"睡一觉 = 100 次实验"这个核心价值命题。

`program.md` 的一个重要作用就是**反向校准** agent 的默认礼貌：**明确地把"征求确认"从合理行为重新定义为失败模式**。

---

## 8. program.md 作为"轻量级 Skill" / program.md as a Lightweight Skill

Karpathy 在 README 里把 `program.md` 称作"一个超轻量级的 skill"（essentially a super lightweight "skill"）。

> *"The `program.md` file is essentially a super lightweight 'skill'."*

这把 autoresearch 放进了 2026 年 Claude Code / Agent SDK 周边正在兴起的 **skill 生态**里。Skill 的核心思想是：**把特定任务的领域知识、约束和最佳实践打包成 agent 启动时就能加载的 Markdown 文件**，而不是每次写复杂的 system prompt。`program.md` 正是这种范式的最小示例：

- 它**不是**在启动时告诉 agent"你是一个研究员"这种泛泛角色
- 它**是**一段可被任何 agent 读入、带有具体步骤、具体约束、具体度量、具体禁令的任务 DSL

"人类迭代 `program.md`，agent 迭代 `train.py`"的分工也暗示了一种更大的范式：**skill 本身也会演化**。今天你在 `program.md` 里加一句"再激进一点尝试 attention 变体"，明天 agent 就会产生一批不同方向的实验。人类的研究品味通过对 skill 的编辑**慢速**注入系统，agent 的执行通过 `train.py` 的修改**快速**展开。

---

## 9. 与本仓库现有工作的关联 / Relation to Existing Work in This Repo

autoresearch 是本仓库自进化 agent 章节里一个独特的坐标，它**填补了前面几篇都没覆盖的象限**：

| 方法 | 经验载体 | 反馈来源 | 典型周期 | 人类角色 |
|---|---|---|---|---|
| [SPIN](spin.md) | 模型权重 | 自博弈样本质量 | 训练轮 | 提供初始模型 |
| [EvolveR](evolver.md) | 抽象策略原则 | 交互轨迹 | 任务间 | 定义任务分布 |
| [RISE](rise.md) | 模型权重 | 自我修正轨迹 | 推理多轮 | 定义训练目标 |
| [AgentFactory](agent-factory.md) | **可执行子 agent 代码** | 执行 trace | Install→Self-Evolve→Deploy | 设计元流程 |
| [测试时自我改进](self-improving-test-time.md) | LoRA 权重 | 弱项样本生成 | 测试时 | 部署框架 |
| **autoresearch** | **目标系统（train.py）本身的代码** | **val_bpb** | **每 5 分钟一轮** | **编辑 program.md** |

关键观察：

1. **和 AgentFactory 最近，但方向相反**。AgentFactory 让 agent 产出可复用的子 agent 代码——agent 是作者，产物是**其他** agent 的代码。autoresearch 让 agent 编辑被研究的训练脚本——agent 是研究员，产物是**模型**。两者共享同一个核心主张："**经验应该被固化为代码，而不是文本反思**"，但落地层次不同。

2. **和 SPIN/RISE 不同**。SPIN/RISE 的自改进发生在**模型权重**层。autoresearch 的自改进发生在**研究代码**层——它改变的不是权重怎么更新，而是"怎么才算一次好的训练运行"。这是更高一层的元循环。

3. **人类不变量 = skill**。其他方法里人类通常通过调超参、设计训练目标、定义奖励来影响系统。autoresearch 把人类的接口**整合成单一载体**：`program.md`。这种干净的接口使得"研究方向盘"和"研究执行"彻底解耦。

---

## 10. 工程师视角的关键启示 / Key Takeaways for Engineers

1. **把品味写进 skill，不是写进提示词。** "Simpler is better" 这种审美判断如果只靠模型自己把握会漂移。写进 `program.md` 后它成为每次循环的硬约束。这个模式迁移到任何生产 agent 都适用：**不可妥协的品质标准应该是显式文本，不是隐式期望**。

2. **选一个无法被走捷径的指标。** val_bpb 的 vocab-independence 把一整类"刷指标"的失败模式提前排除了。设计任何自主优化器时，第一问：**这个指标能被 agent 用无聊的方式骗过吗？**

3. **固定预算 >> 固定步数。** 固定 5 分钟 wall clock 让跨架构/跨 batch size 的对比变得公平；固定 step 数会让"改成小模型跑更多步"看起来像进步。把时间当做一等公民。

4. **把 context 预算也当资源管。** `program.md` 明确要求 agent **不要** `tee`、只用 `grep` 提取结果、崩溃时只看 `tail -n 50`。这是在帮 agent 保护自己的上下文窗口——让它不至于在第 20 次实验后被日志淹没。**Agent 的自主性和它的 context 经济学是耦合的**。

5. **"NEVER STOP"是一种反向校准。** 通用 agent 的默认礼貌倾向在自主场景是 bug。显式地把"征求确认"重定义为失败模式，这是 skill 设计里值得复用的技巧。

6. **git 作为实验笔记本。** 实验分支 + commit 推进/回滚这个模式把研究结构完全映射到了 git 上——没有额外的"实验管理平台"，没有 MLflow，没有 wandb。用最少的基础设施完成了实验追踪 + 回滚这两件事。**当你要给 agent 搭工具时，先问：git 够不够？**

7. **双层迭代速率。** 人类慢速迭代 `program.md`（每天/每周），agent 快速迭代 `train.py`（每 5 分钟）。这是一个**小脑（快）+ 大脑（慢）** 的分工——和人脑执行/反思系统的组织方式惊人相似。这个模式对任何"人 + 自主 agent"协作系统都有借鉴价值。

---

## 11. 局限与边界 / Limitations and Boundaries

- **单 GPU、单文件、单指标**。autoresearch 目前要求 NVIDIA GPU（社区有 MPS / AMD / MLX 的 fork）。它刻意不处理分布式训练、不处理多指标 Pareto 优化、不处理数据分布变化。**这不是产品，是原型**。
- **5 分钟的天花板**。在 5 分钟预算里能发现的进步主要是中小模型上的**局部**优化（LR 调整、架构微调、简化）。真正的前沿发现（比如全新的 attention 变体）需要更大预算——但更大预算意味着"一晚 100 次实验"的心理模型崩塌。
- **不适合真正新颖的研究**。当需要的进步在当前 `train.py` 的邻域之外时，agent 是无法通过局部搜索找到的。Karpathy 在 README 里清楚意识到这一点，把 autoresearch 定位为"第零天"——一切的起点，不是终点。
- **品味仍是瓶颈**。`program.md` 里的品味条款（simpler is better、NEVER STOP、选 val_bpb）是 Karpathy 手写的。这个仓库没有回答"品味本身如何演化"——那是更上一层的问题。

---

## 12. 结语 / Closing Thought

autoresearch 的工程意义远大于它当下的实用价值。它是一个**存在性证明**：给 AI agent 一个真实但受控的研究环境，用 Markdown skill 塑造它的行为，用 git 追踪它的决策，用一个作弊不了的指标校准它的优化方向——它就能在人类睡觉的时间跑 100 次实验。这个模式可以从 "5 分钟 GPT 训练" 推广到任何有快速、明确、便宜的评估循环的领域：kernel 调优、数据清洗流水线、SQL 查询优化、合约测试集通过率——任何可以在 5-10 分钟内产出一个"好/坏"信号的问题。

**autoresearch 的 10,205 代前身今天开始了。它只是一个 ~200 行的 `train.py` 加一个 ~100 行的 `program.md`。这个大小是特性，不是缺陷——它让你能真正看懂、改造、并相信它。**

---

## References / 参考

- **Repository:** [github.com/karpathy/autoresearch](https://github.com/karpathy/autoresearch)
- **nanochat (parent project):** [github.com/karpathy/nanochat](https://github.com/karpathy/nanochat)
- **Karpathy tweets:** [tweet #1](https://x.com/karpathy/status/2029701092347630069) · [tweet #2](https://x.com/karpathy/status/2031135152349524125)
- **Dummy's Guide referenced in README:** [x.com/hooeem](https://x.com/hooeem/status/2030720614752039185)
- **Notable forks:**
  - [miolini/autoresearch-macos](https://github.com/miolini/autoresearch-macos) (MacOS)
  - [trevin-creator/autoresearch-mlx](https://github.com/trevin-creator/autoresearch-mlx) (MacOS, MLX)
  - [jsegov/autoresearch-win-rtx](https://github.com/jsegov/autoresearch-win-rtx) (Windows)
  - [andyluo7/autoresearch](https://github.com/andyluo7/autoresearch) (AMD)
- **Related in this repo:**
  - [AgentFactory](agent-factory.md) — 同样主张"经验 = 代码"，但方向是生成可复用子 agent
  - [LLM Knowledge Bases](../memory-systems/llm-knowledge-bases.md) — Karpathy 的另一篇 skill 范式（写入侧综合）
  - [Self-Improving at Test-Time](self-improving-test-time.md) — 另一种"自己给自己产数据"的自进化路径
