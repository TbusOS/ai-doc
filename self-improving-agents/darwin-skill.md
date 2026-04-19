# 达尔文.skill (Darwin Skill): Training Your Skills Like You Train Your Models

> **原文仓库:** [github.com/alchaincyf/darwin-skill](https://github.com/alchaincyf/darwin-skill)
>
> **作者:** 花叔 (Huashu / alchaincyf)
>
> **发表:** 2026 / GitHub + skills.sh 生态
>
> **灵感来源:** [Karpathy autoresearch](autoresearch.md)（本仓库已收录）
>
> **主题:** 把 autoresearch 的自主实验循环从"训练模型"搬到"优化 Skill"——一个只能向前转的棘轮，用双重评估（结构 + 实测）+ git revert 保证分数单调上升

---

## 核心命题 / The Core Claim

> **"像训练模型一样优化你的 Agent Skills。"**
> *"Train your Skills like you train your models."*

Claude Code、Codex、Trae、CodeBuddy 等 2026 年主流编码 agent 都支持 `SKILL.md` 格式。当你只有 10 个 Skill 时手动维护没问题；**当你有 60+ 个 Skill 时，你需要一个系统**。

传统的 Skill 审查是**纯结构性的**——检查格式、步骤编号、路径是否可达。但一个**格式完美的 Skill 跑出来的效果可能很差**。达尔文.skill 的主张：同时评估**结构质量**和**实际效果**，只保留真正有改进的修改。

---

## 1. 从 autoresearch 到 Darwin：一次精确的范式迁移

达尔文.skill 是 Karpathy autoresearch 思想的**直接同构映射**。花叔在 README 里给出了清晰的对应关系：

| autoresearch | 达尔文.skill | 映射原因 |
|:---|:---|:---|
| `program.md` | Darwin 的 SKILL.md | 定义评估标准和约束规则 |
| `train.py` | 每个待优化的 SKILL.md | 被优化的单一可编辑资产 |
| `val_bpb` | 8 维加权总分（满分 100） | 可量化的优化目标 |
| `git ratchet`（keep/reset） | `keep` / `revert` 机制 | 只保留有改进的 commit |
| test set | `test-prompts.json` | 验证改进是否真的有效 |
| **全自主运行** | **人在回路** | Skill 的好坏比 loss 更微妙，需要人的判断 |

注意最后一行：这**不是**全自主循环。autoresearch 在 program.md 里明确写着"NEVER STOP"——人类睡觉时 agent 独立跑 100 次实验。Darwin 则刻意插入"人在回路"检查点。为什么？因为：

- **训练 loss 是一个连续、客观、与任务解耦的标量**——机器可以完全信任它
- **Skill 质量是一个离散、带品味、依赖具体场景的判断**——机器只能给出信号，最终决策必须人类给

这是一次有意识的范式偏移：**保留 autoresearch 的棘轮结构，但把最顶层的终止判断还给人类**。

---

## 2. 五条核心原则 / Five Core Principles

| # | 原则 | 说明 |
|:---|:---|:---|
| 01 | **单一可编辑资产** | 每次只改一个 SKILL.md，变量可控，改进可归因 |
| 02 | **双重评估** | 结构评分（静态分析）+ 效果验证（跑测试看输出） |
| 03 | **棘轮机制** | 只保留改进，自动回滚退步，分数只升不降 |
| 04 | **独立评分** | 评分用子 agent，避免"自己改自己评"的偏差 |
| 05 | **人在回路** | 每个 Skill 优化完后暂停，用户确认再继续下一个 |

原则 04 **独立评分**是这个系统里最容易被低估的工程细节——它防止了一整类失败模式：如果让同一个 agent 既改 SKILL.md 又评分，它会**系统性地给自己打高分**（本质上是一种 model-driven reward hacking）。Darwin 要求 spawn 一个**没看过改动过程的新子 agent**去评分，评分独立性是棘轮正确性的前提。

---

## 3. 8 维度评估 Rubric / The 8-Dimension Rubric

总分 100。**结构维度 60 分**靠静态分析，**效果维度 40 分**必须实测。

### 结构维度（60 分）

| # | 维度 | 权重 | 评分标准 |
|---|------|------|---------|
| 1 | Frontmatter 质量 | 8 | name 规范、description 包含做什么+何时用+触发词、≤1024 字符 |
| 2 | 工作流清晰度 | 15 | 步骤明确可执行、有序号、每步有明确输入/输出 |
| 3 | 边界条件覆盖 | 10 | 处理异常情况、有 fallback 路径、错误恢复 |
| 4 | 检查点设计 | 7 | 关键决策前有用户确认、防止自主失控 |
| 5 | 指令具体性 | 15 | 不模糊、有具体参数/格式/示例、可直接执行 |
| 6 | 资源整合度 | 5 | references / scripts / assets 引用正确、路径可达 |

### 效果维度（40 分）

| # | 维度 | 权重 | 评分标准 |
|---|------|------|---------|
| 7 | 整体架构 | 15 | 结构层次清晰、不冗余不遗漏 |
| 8 | **实测表现** | **25** | **用测试 prompt 跑一遍，输出质量是否符合 skill 宣称的能力** |

**维度 8 权重 25 是整个 rubric 里最大的一项**——Skill 写得再漂亮，跑出来效果不好就是零。这是 Darwin 对"纯结构审查"的最大反驳。

### 实测表现怎么打分

1. 为每个 skill 设计 2-3 个**典型用户 prompt**（happy path，不是边缘 case）
2. 用子 agent 各执行一遍：**一个带 skill 跑，一个不带 skill 跑（baseline）**
3. 对比：
   - 输出是否完成了用户意图？
   - 相比 baseline，质量提升明显吗？
   - 有没有 skill 引入的负面影响（过度冗余、跑偏、格式奇怪）？

如果无法跑子 agent（时间/资源限制），可以退化为**"干跑验证"**（dry_run）——读完 skill 后模拟一个典型 prompt 的执行思路，判断流程是否合理。但要在 `results.tsv` 中明确标注 `dry_run`。**哪怕是模拟推演，也比完全不看效果好**。

---

## 4. 优化循环：5 个阶段 / The Optimization Lifecycle

系统在每个阶段内自主运行，但**在阶段之间暂停等待人类确认**。

### Phase 0: 初始化

创建 `auto-optimize/YYYYMMDD-HHMM` 分支，初始化 `results.tsv`。

### Phase 0.5: 测试 Prompt 设计

为每个 skill 设计 2-3 个测试 prompt，**展示给用户确认后再进入评估**。

> *测试 prompt 的质量决定了优化方向是否正确。*

这是一个**精巧的优先级排序**：测试集定义得糟糕会让整个棘轮朝错误方向转，所以测试集定义必须先人类确认。这也是 Darwin 与 autoresearch 的一个重要不同——autoresearch 用 `val_bpb` 这种通用指标，Darwin 需要 per-skill 定制测试集。

### Phase 1: 基线评估（Baseline）

- 主 agent 对维度 1-7 打分
- **spawn 独立子 agent** 对每个测试 prompt 做 with_skill / baseline 对比，打维度 8 分
- 汇总加权总分，记录到 `results.tsv`
- 展示评分卡（按分数从低到高排序）
- **暂停等用户确认**

### Phase 2: 优化循环（核心逻辑）

用户确认后，按基线分从低到高排序，**先优化最弱的**。

```
for each skill:
  round = 0
  while round < MAX_ROUNDS (默认 3):
    1. 找出得分最低的维度
    2. 针对该维度生成 1 个具体改进方案
    3. 编辑 SKILL.md → git commit
    4. 子 agent 独立重新评分（关键！不能自己评自己）
    5. if 新总分 > 旧总分: keep，更新基线
       else: git revert HEAD（不用 reset --hard），记录 revert 到 tsv，break
    6. 日志

  # 每个 skill 完成后的人类检查点
  展示 diff + 分数变化 + 测试 prompt 输出对比
  等用户确认 OK 再继续下一个 skill
```

两个关键细节：

1. **每轮只改一个维度** — 避免多个变更导致无法归因（这是对 autoresearch "single file, one change at a time" 的进一步细化）
2. **用 `git revert` 而非 `git reset --hard`** — 保留失败尝试的历史，而不是擦除它。这让后续的 `results.tsv` 成为一份有信号价值的实验日志

### Phase 2.5: 探索性重写（可选）

当 hill-climbing 连续在 2 个 skill 上 round 1 就 break（涨不动），系统会**提议**一次探索性重写：

```
1. 选一个瓶颈 skill
2. git stash 保存当前最优版本
3. 从头重写 SKILL.md（不是微调，是重组结构）
4. 重新评估
5. if 重写版 > stash 版: 采用；else: git stash pop 恢复
```

这是对**局部最优陷阱**的工程回应——hill-climbing 永远会卡在局部最优里，只有"先拆后建"才可能跳出。但因为重写成本高且不确定，**必须征得用户同意才执行**。

### Phase 3: 汇总报告

打印优化 skills 数、总实验数、保留/回滚次数、全量分数变化对比表。

---

## 5. 棘轮机制：为什么分数只能上升 / The Ratchet

![棘轮示意](https://raw.githubusercontent.com/alchaincyf/darwin-skill/master/assets/chart-ratchet.png)

每一轮要么改进 Skill（保留 commit），要么干净地回滚（revert commit）。**有效基线始终锁定在历史最高分**，后续改进从最高分继续——不会随时间积累局部退化。

这个机制的深层价值不在于"分数会上升"，而在于**"分数不会下降"**。一个没有棘轮的优化系统在足够多轮之后会漂移；有棘轮之后，最坏情况也是"保持不变"。**把系统的最坏情况锁死，比追求平均情况更重要**——这是花叔直接从 autoresearch 学到的工程品味。

---

## 6. 约束规则 / Hard Constraints

1. **不改变 skill 的核心功能和用途** — 只优化"怎么写"和"怎么执行"，不改"做什么"
2. **不引入新依赖** — 不添加原本没有的 scripts / references 文件
3. **每轮只改一个维度** — 避免归因混乱
4. **文件大小 ≤ 原始的 150%** — 防止"优化 = 堆砌"的退化
5. **用 git revert 而非 reset --hard** — 保留实验历史
6. **评分独立性** — 效果维度必须用子 agent 或至少干跑验证，不能在同一上下文里"改完直接评"

约束 4（大小上限）是一个容易被忽视但很关键的护栏：**没有这个约束，模型的默认优化方向是"越写越多"**——因为 rubric 鼓励"具体性"和"边界条件覆盖"，最简单的提分方式是塞更多文本进去。强制上限迫使模型做真正的重组而不是累加。

---

## 7. 与 autoresearch 的深层差异 / Subtle Differences From autoresearch

表面看 Darwin 只是把 autoresearch 的 schema 映射到了 Skill 优化场景，但实际有几处**非平凡的差异**，理解这些差异才能理解什么能从 autoresearch 借鉴、什么不能：

| 维度 | autoresearch | Darwin | 为什么不同 |
|---|---|---|---|
| 目标 | 单一标量 val_bpb | 8 维加权总分 | Skill 质量是多维度现象，强行压成单标量会丢信息 |
| 评估主体 | 训练脚本本身 | **独立子 agent** | 防止"自己评自己"的 reward hacking |
| 循环边界 | "NEVER STOP"全自主 | 阶段间人在回路 | 品味判断无法完全机器化 |
| 测试集 | 固定的 validation split | **每 skill 定制的 test-prompts.json** | 通用数据集无法定义 skill-specific 质量 |
| 回滚机制 | `git reset` 擦除 | **`git revert`** 保留失败 | Darwin 把失败实验也当作产出 |
| 探索策略 | 连续 hill-climbing | hill-climbing + 周期性"探索性重写" | 显式处理局部最优 |

这些差异不是疏忽，而是**清醒的场景适配**。autoresearch 在"训练 GPT"这个收敛的、有明确标量指标的场景下可以全自主；Darwin 在"优化 Skill"这个发散的、多维的、品味敏感的场景下必须保留人类判断。

**最深的启示：autoresearch 不是一个模板，是一个参数化的抽象。要用好它，你得精准地识别你的场景哪些参数和 autoresearch 一样，哪些必须改**。

---

## 8. 与本仓库的关联 / Relation to This Repo

达尔文.skill 在本仓库的自进化 agent 坐标系里和 autoresearch 是一对"同根异花"：

- **[autoresearch](autoresearch.md)** 是骨架：棘轮 + 单一资产 + 可量化指标 + git-as-notebook
- **达尔文.skill** 是**骨架的第一个成功移植** —— 证明这套机制可以从 LLM 训练迁移到任何有明确评估循环的元任务

它也和 **[AgentFactory](agent-factory.md)** 有共同底色：两者都主张"**可优化的 agent 资产应该是代码/Markdown 这种可执行、可 diff、可回滚的形式**"，而不是散文式的反思。AgentFactory 把**子 agent** 作为该资产，Darwin 把 **Skill 本身**作为该资产。

**可以组合：** Darwin 可以被用来优化 AgentFactory 生成的子 agent——把 AgentFactory 的产物作为 Darwin 的输入，形成一个两级系统（一级生成 + 一级优化）。这会是 2026 年自进化 agent 生态里一个自然的方向。

---

## 9. 工程师视角的关键启示 / Key Takeaways

1. **棘轮是元模式，不是具体实现。** autoresearch 的棘轮 = Darwin 的棘轮 = 任何"有评估 + 有版本控制 + 只保留改进"的系统。这个模式可以移植到 prompt 优化、Dockerfile 精简、CI 流水线缩时、配置文件重构等任意领域。
2. **评估独立性是棘轮的第二条腿。** 没有它，棘轮会因 reward hacking 失效。Darwin 用 spawn 子 agent 的方式保证评分独立性——这是任何自主优化系统都要处理的问题。
3. **单标量 vs 多维度是一个真实的权衡。** Darwin 选多维度是因为品味难以被压进单标量；autoresearch 选单标量是因为训练场景允许。选错会让你的系统要么丢信息，要么不可比较。
4. **"人在回路"不是退让，是清醒。** 当判断标准本身依赖品味时，强行去掉人类只会产生一个漂亮但跑偏的系统。Darwin 显式地把"人在回路"写进了流程，而不是作为异常情况处理。
5. **测试集是输入不是产出。** Phase 0.5 把测试 prompt 设计提前到评估之前并要求用户确认——这是对"先定义成功再去优化"这条基本工程纪律的具体落实。
6. **文件大小约束防退化。** rubric 鼓励"更具体"很容易被解读成"更长"。显式的大小上限强迫模型做真正的重组。这个护栏的设计思路可以推广到任何"容易通过膨胀来刷指标"的系统。
7. **用 git revert 不用 reset --hard。** 保留失败实验的历史，把 results.tsv 变成有价值的诊断日志。这是从 autoresearch 继承的最具体也最被低估的工程决策。

---

## References / 参考

- **仓库:** [github.com/alchaincyf/darwin-skill](https://github.com/alchaincyf/darwin-skill)
- **作者:** 花叔（Twitter: [@AlchainHust](https://x.com/AlchainHust)）
- **安装:** `npx skills add alchaincyf/darwin-skill`
- **直接灵感:** [Karpathy autoresearch](https://github.com/karpathy/autoresearch) ([本仓库解读](autoresearch.md))
- **姊妹项目:** [女娲.skill (nuwa-skill)](../multi-agent-systems/nuwa-skill.md)（同作者，女娲造 skill，达尔文让 skill 进化）
- **生态:** [skills.sh](https://skills.sh) — 2026 年跨 agent 工具的 Skill 标准
- **本仓库相关:**
  - [autoresearch](autoresearch.md) — 本项目的直接灵感
  - [AgentFactory](agent-factory.md) — 经验=可执行代码的另一条路径
  - [Metacognitive Learning](metacognitive-learning.md) — 自我评估作为自改进的前提
