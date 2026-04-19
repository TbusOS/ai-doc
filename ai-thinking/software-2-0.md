# Software 2.0

> **原文链接:** [Software 2.0 (Medium)](https://karpathy.medium.com/software-2-0-a64152b37c35)
>
> **作者:** Andrej Karpathy（时任 Tesla AI Director）
>
> **发表:** November 11, 2017 / Medium 个人博客
>
> **主题:** 重新定义"编程"——软件 1.0 是人类写显式指令的 Python/C++，软件 2.0 是**神经网络权重**本身作为程序。2017 年的这篇预言在 2025 年的 LLM 时代完全兑现。

---

## 为什么要读这篇

2017 年 Karpathy 看到的东西，2024 年才被大多数人意识到：**我们正在从"人类写代码"的范式过渡到"人类定义目标 + 数据 + 架构 → 优化器写代码"的范式**。大模型时代这个预言完全实现——Claude、GPT、Cursor 里每一行"代码"都是 Software 2.0 的产物。

这篇文章是理解"为什么 LLM 改变了软件工程本身"的**思维起点**。读懂它你就知道为什么"写好 prompt"、"管好 evals"、"调好微调数据"变成了新一代的编程核心技能——它们才是 Software 2.0 的源代码。

---

## 核心论点 / The Core Thesis

### Software 1.0 vs Software 2.0

Karpathy 在文章里用了一张著名的对比：

| 维度 | Software 1.0 | Software 2.0 |
|---|---|---|
| **代码** | Python / C++ 等显式指令 | 神经网络权重 |
| **程序员做什么** | 写每一行逻辑 | 选架构、选数据、定义 loss、管训练循环 |
| **程序怎么形成** | 编译源代码 | 优化器在数据上搜索 |
| **可执行代码** | CPU / GPU 运行的指令流 | GPU 上的一堆矩阵乘法 |
| **调试方法** | 断点、单步、print | 看训练曲线、看失败样本、改数据 |
| **版本控制** | git 管源码 | git 管模型权重、数据集、超参 |

---

## 原文精要节选 + 翻译

### 核心段落 1 — 什么是 Software 2.0

> *"Sometimes people refer to neural networks as just 'another tool in your machine learning toolbox'. They have some pros and cons, they work here or there, and sometimes you can use them to win Kaggle competitions. Unfortunately, this interpretation completely misses the forest for the trees. **Neural networks are not just another classifier, they represent the beginning of a fundamental shift in how we write software**. They are Software 2.0."*

> *"有时候人们把神经网络称为'机器学习工具箱里的另一件工具'——有优点有缺点，这里能用那里能用，偶尔能赢个 Kaggle。不幸的是，这种解读完全是**只见树木不见森林**。**神经网络不只是另一种分类器，它们代表了我们写软件方式的根本性转变的开端**。它们就是 Software 2.0。"*

### 核心段落 2 — 为什么权重是代码

> *"The 'classical stack' of Software 1.0 is what we're all familiar with—it is written in languages such as Python, C++, etc. It consists of explicit instructions to the computer written by a programmer. By writing each line of code, the programmer identifies a specific point in program space with some desirable behavior. In contrast, Software 2.0 is written in **much more abstract, human unfriendly language, such as the weights of a neural network**. No human is involved in writing this code because there are a lot of weights (typical networks might have millions), and coding directly in weights is kind of hard (I tried)."*

> *"Software 1.0 的'经典栈'我们都熟——用 Python、C++ 等语言写，由程序员写下对计算机的显式指令。程序员每写一行代码，就在程序空间中确定一个具有期望行为的点。相比之下，Software 2.0 是用**一种远更抽象、对人类远更不友好的语言写成的——神经网络的权重**。没有人类参与写这种代码，因为权重数量巨大(典型网络有上百万个)，而且直接写权重非常困难(我试过)。"*

### 核心段落 3 — 新范式下人类做什么

> *"Instead, our approach is to specify some goal on the behavior of a desirable program (e.g., 'satisfy a dataset of input output pairs of examples', or 'win a game of Go'), write a rough skeleton of the code (i.e. a neural net architecture) that identifies a subset of program space to search, and use the computational resources at our disposal to search this space for a program that works. In the specific case of neural networks, we restrict the search to a continuous subset of the program space where the search process can be made (somewhat surprisingly) efficient with backpropagation and stochastic gradient descent."*

> *"我们的新方法是：**指定理想程序的行为目标**(比如"满足一个输入输出样例数据集"、"赢一盘围棋")，**写一个代码骨架**(即神经网络架构)确定要搜索的程序空间子集，**用我们手上的算力在这个空间里搜索一个能 work 的程序**。在神经网络这个特例里，我们把搜索限制在程序空间的一个**连续子集**内，在那里搜索过程可以(有点令人惊讶地)通过反向传播和随机梯度下降变得高效。"*

### 核心段落 4 — Software 2.0 的优势

Karpathy 列了 Software 2.0 相对于 1.0 的几个优势：

1. **Computationally homogeneous** — 2.0 程序就是一堆矩阵乘法，硬件可以极度优化(GPU/TPU)
2. **Simple to bake into silicon** — 神经网络可以硬编码到专用芯片
3. **Constant running time** — 每次前向传播算力消耗固定，易于 capacity planning
4. **Constant memory use** — 同上
5. **Highly portable** — 权重能跨硬件迁移
6. **Very agile** — 改数据重训比重写代码快
7. **Modules can meld into an optimal whole** — 端到端优化
8. **It is better than you** — "在很多领域里神经网络已经比人类写的代码好"(2017 年这句预言现在看是大多数领域已发生)

### 核心段落 5 — 预言未来

> *"I also want to temper this view a little bit since Software 2.0 is not going to replace 1.0 (indeed, a large amount of 1.0 infrastructure is needed for training and inference of 2.0 code), but it is going to take over increasingly large portions of what Software 1.0 is responsible for today. And whenever I see or hear a rerun of arguments along the lines of 'developers will be replaced by AI', I now tune them out because while some new paradigms will emerge, **it's not about replacement; Software 2.0 is a shift in how we program, not a shift in who programs**."*

> *"我也想稍微缓和这个观点——Software 2.0 不会取代 1.0(事实上大量 1.0 基础设施是训练和推理 2.0 代码所必需的)。**但它会逐步接管越来越多今天由 Software 1.0 承担的部分**。每次我听到'开发者将被 AI 取代'类的论调，我现在就自动屏蔽——因为虽然新范式会出现，**这不是替代问题；Software 2.0 是我们编程方式的转变，不是谁来编程的转变**。"*

---

## 2017 → 2025 兑现回顾

Karpathy 2017 年写这篇文章时，他列举的 Software 2.0 接管的领域有：视觉识别、语音识别、语音合成、机器翻译、游戏(围棋/Atari)、机器人控制、数据库。

**2025 年回头看：**

| Karpathy 预测的接管领域 | 2025 年现状 |
|---|---|
| 视觉识别 | ✅ 完全接管，传统 CV pipeline 基本淘汰 |
| 语音识别 | ✅ Whisper / Canary 完全接管 |
| 语音合成 | ✅ CosyVoice / Fish Audio 超越规则合成 |
| 机器翻译 | ✅ Transformer 完全接管 |
| 游戏 AI | ✅ AlphaZero 范式通用化 |
| 机器人控制 | ⏳ 正在接管(RT-2、π0 等) |
| 数据库 | ⏳ 部分(学习索引)，传统 B-tree 仍主流 |

**Karpathy 没预测但 2025 年发生的更大的事：**
- **编程本身** — LLM 用 Software 2.0 范式训练的模型来写 Software 1.0 的代码。Cursor / Copilot / Claude Code 这些工具的底层都是 Software 2.0，表层产出仍是 Software 1.0
- **Agent 架构** — 整个 agent loop 是 Software 1.0 的脚手架 + Software 2.0 的大脑，这个"1.0 + 2.0 混合"的架构是 Karpathy 没细说但 2025 年成为主流的形态
- **Prompt engineering 成为"边界编程"** — 在 Software 2.0 和用户之间的边界上，prompt 变成了一种新的源代码

---

## 工程师视角的关键启示 / Key Takeaways

### 1. 把"数据 + 评估"当 source code 管

Software 2.0 的源代码不是 Python，是**训练数据 + 评估集**。这意味着：

- **数据集应该进 git** (或 DVC) — 和代码一样版本化
- **评估集 (evals) 是单元测试的 2.0 版本** — 每次训完模型都跑
- **数据质量工程 > 模型架构工程** — 改数据往往比改架构收益大得多
- **prompt 模板和 few-shot 示例是 source code** — 应该 code review、应该版本化、应该有测试

### 2. 调试范式完全换血

| Software 1.0 调试 | Software 2.0 调试 |
|---|---|
| 断点、单步 | 看失败样本的 activation / attention |
| print log | 训练曲线 + loss 分布 |
| 单测 | eval benchmark + behavioral test |
| 修 bug = 改一行代码 | 修 bug = 加样本 / 换损失 / 换架构 |
| git blame | 数据血缘 + 训练 run 追溯 |

**工程实操：** 如果你在维护一个 LLM 应用，问自己——**我们的调试流程还停留在 Software 1.0 时代吗？** 如果团队还在用"改 if-else 的心态"改 prompt，说明还没切换到 2.0 思维。

### 3. 架构选择 = 选搜索空间

Karpathy 文里最精妙的一句：**"写神经网络架构就是确定要搜索的程序空间子集"**。这意味着：

- 选 CNN = 搜索"平移不变的程序"
- 选 Transformer = 搜索"序列上的注意力程序"
- 选 MoE = 搜索"条件计算程序"
- 选 SSM (Mamba) = 搜索"循环状态程序"

**做架构决策时的问题：** 我的问题的程序空间是什么形状？我选的架构能不能覆盖这个形状？不能覆盖的部分我是加归纳偏置(bias)还是加数据？

### 4. "Software 2.0 + 1.0 混合"是主流形态

2025 年的成熟 AI 系统几乎全是混合：

- **外层 1.0 脚手架：** agent loop、tool registry、error handling、rate limiting、缓存、回退逻辑
- **内核 2.0 大脑：** LLM 决策
- **数据侧 2.0：** 训练数据管线、eval 集
- **控制面 1.0：** 部署、监控、A/B 测试

理解两者边界对系统设计至关重要——2.0 擅长处理模糊、泛化、语义；1.0 擅长处理确定性、安全、可审计。**新手常犯的错是让 2.0 做 1.0 的事(比如让 LLM 做精确数值计算)或让 1.0 做 2.0 的事(比如用大量 if-else 模仿语义理解)**。

### 5. "It is better than you" 这句话的工程意义

Karpathy 列优势的第 8 条。2017 年是预言，2025 年是现实：**在越来越多的任务上，训练出来的模型比任何人类手工代码都好**。这意味着：

- 如果你的 business logic 是"分类 / 提取 / 翻译 / 生成"，默认考虑 2.0 解法
- 如果你的 business logic 是"规则驱动 / 安全关键 / 需要审计"，默认考虑 1.0 解法
- 混合架构的关键是**清晰的边界**——哪些部分交给 2.0，哪些部分锁在 1.0

---

## 和本仓库其他文章的关联 / Connections

- **[Sutton — Bitter Lesson](bitter-lesson.md)** — 兄弟文章。Sutton 告诉你"为什么"scaling 最终胜出，Karpathy 告诉你"这意味着软件工程怎么变"
- **[Karpathy — autoresearch](../self-improving-agents/autoresearch.md)** — Software 2.0 思想在 2026 年的具体实验：让 agent 做 Software 2.0 的研究员
- **[AgentFactory](../self-improving-agents/agent-factory.md)** — 主张"经验 = 代码"，是 Software 2.0 思维扩展到"子 agent 生产"层面
- **[DeepSeek-R1](../training-techniques/deepseek-r1.md)** — 把 Software 2.0 的"数据 + 目标 → 优化器搜索"精确应用到推理能力上

---

## 为什么是一篇 "Tier-S" 文章 / Why This Is Tier-S

- **预言级别的思想工作** — 2017 年写，2025 年兑现
- **作者是前沿实践者** — Karpathy 在 OpenAI、Tesla、独立研究都在用这个框架做设计决策
- **直接改变工程师的世界观** — 读懂它，你就知道为什么要把评估集版本化、为什么数据管线比架构重要、为什么"AI 时代的程序员"和 2015 年的程序员做的是不同的事
- **简短但密度极高** — 原文 ~2500 词，但每一段都能独立成为一个工程决策的出发点

---

## References / 参考

- **原文:** [Software 2.0 by Andrej Karpathy (2017)](https://karpathy.medium.com/software-2-0-a64152b37c35)
- **作者:**
  - [Karpathy 个人网站](https://karpathy.ai)
  - [@karpathy on X](https://x.com/karpathy)
  - [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html) — 配套理解 Software 2.0 实操的最佳教程
- **相关思想:**
  - [Sutton — The Bitter Lesson](bitter-lesson.md)(本仓库同目录)
  - [Chris Olah — Neural Networks, Types, and Functional Programming](http://colah.github.io/posts/2015-09-NN-Types-FP/)
- **本仓库相关:**
  - [autoresearch](../self-improving-agents/autoresearch.md)
  - [AgentFactory](../self-improving-agents/agent-factory.md)
  - [LLM Knowledge Bases](../memory-systems/llm-knowledge-bases.md)
