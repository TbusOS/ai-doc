# The Bitter Lesson

> **原文链接:** [The Bitter Lesson (incompleteideas.net)](http://www.incompleteideas.net/IncIdeas/BitterLesson.html)
>
> **作者:** Rich Sutton
>
> **发表:** March 13, 2019 / 个人博客 incompleteideas.net
>
> **主题:** 70 年 AI 研究最重要的一个教训——**通用的、可以随算力扩展的方法最终胜过依赖人类领域知识的方法**。这篇 7 段话的短文是过去 10 年 AI 工程决策的北极星。

---

## 为什么要读这篇

Karpathy、Ilya Sutskever、Jared Kaplan 等人在大量演讲和文章里引用它。每一次 OpenAI、Anthropic、DeepMind 选择"增加算力和数据"而不是"手工设计特征"时，背后都是这条原则在起作用。

**工程师每周都要做的一个判断是：** 碰到新问题，我该再精心设计一个规则 / 启发式 / 专家系统，还是直接"加数据 + 加算力"？Bitter Lesson 给这个判断一个极简但可靠的默认答案。

---

## 原文翻译 / Full Translation

### Original

> The biggest lesson that can be read from 70 years of AI research is that **general methods that leverage computation are ultimately the most effective, and by a large margin**. The ultimate reason for this is Moore's law, or rather its generalization of continued exponentially falling cost per unit of computation. Most AI research has been conducted as if the computation available to the agent were constant (in which case leveraging human knowledge would be one of the only ways to improve performance) but, over a slightly longer time than a typical research project, massively more computation inevitably becomes available. Seeking an improvement that makes a difference in the shorter term, researchers seek to leverage their human knowledge of the domain, but **the only thing that matters in the long run is the leveraging of computation**. These two need not run counter to each other, but in practice they tend to. Time spent on one is time not spent on the other. There are psychological commitments to investment in one approach or the other. And the human-knowledge approach tends to complicate methods in ways that make them less suited to taking advantage of general methods leveraging computation. There were many examples of AI researchers' belated learning of this bitter lesson, and it is instructive to review some of the most prominent.

### 中文翻译

> 从 70 年 AI 研究中能读出的**最大教训**是：**利用算力的通用方法最终是最有效的，而且优势巨大**。根本原因是摩尔定律，或者说它的广义形式——每单位计算成本指数级下降的持续趋势。大多数 AI 研究的进行方式，都好像 agent 可用的算力是一个常量（如果真是常量，那么利用人类知识几乎就是唯一的改进途径）——但只要时间尺度比一个典型研究项目稍长一些，**远远更多的算力必然会变得可用**。研究者为了获得短期内有显著差异的改进，会试图利用他们对领域的人类知识，但**长期唯一重要的事情是利用算力**。这两条路径不必然对立，但实践中它们常常冲突：花在一个上的时间就是没花在另一个上的时间；对某一种路径存在心理上的投入承诺；而且人类知识方法倾向于把方法复杂化，使其更不适合利用算力扩展的通用方法。AI 研究者们姗姗来迟地学习这个 bitter lesson 有很多例子，回顾其中最显著的几个很有启发。

---

### 四个历史案例

Sutton 随后举了四个典型案例证明这个规律：

### 1. 计算机国际象棋 / Computer Chess

> In computer chess, the methods that defeated the world champion, Kasparov, in 1997, were based on massive, deep search. At the time, this was looked upon with dismay by the majority of computer-chess researchers who had pursued methods that leveraged human understanding of the special structure of chess. When a simpler, search-based approach with special hardware and software proved vastly more effective, these human-knowledge-based chess researchers were not good losers. They said that "brute force" search may have won this time, but it was not a general strategy, and anyway it was not how people played chess. These researchers wanted methods based on human input to win and were disappointed when they did not.

> 在计算机国际象棋中，1997 年击败世界冠军卡斯帕罗夫的方法是基于**大规模深度搜索**。当时，这被大多数计算机象棋研究者视为沮丧之事——他们追求的是利用人类对象棋特殊结构理解的方法。当一个更简单的、基于搜索的方法（配合特殊硬件和软件）被证明有效得多时，这些基于人类知识的象棋研究者不是好输家。他们说"暴力搜索"这次可能赢了，但它不是通用策略，而且不是人类下棋的方式。这些研究者希望基于人类输入的方法获胜，对结果感到失望。

### 2. 计算机围棋 / Computer Go

> A similar pattern of research progress was seen in computer Go, only delayed by a further 20 years. Enormous initial efforts went into avoiding search by taking advantage of human knowledge, or of the special features of the game, but all those efforts proved irrelevant, or worse, once search was applied effectively at scale. Also important was the use of learning by self play to learn a value function (as it was in many other games and even in chess, although learning did not play a big role in the 1997 program that first beat a world champion). Learning by self play, and learning in general, is like search in that it enables massive computation to be brought to bear.

> 计算机围棋出现了类似的研究进展模式，只是延迟了大约 20 年。巨大的初始努力投入在**通过利用人类知识或游戏特殊特征来避免搜索**上——但一旦搜索被有效地大规模应用，所有这些努力都被证明无关紧要，或者更糟。同样重要的是**通过自博弈来学习价值函数**（这在许多其他游戏甚至国际象棋中也是如此，尽管学习在 1997 年首次击败世界冠军的程序中并不起大作用）。自博弈学习，以及广义上的学习，和搜索一样——它让**大规模算力能被用上**。

### 3. 语音识别 / Speech Recognition

> In speech recognition, there was an early competition, sponsored by DARPA, in the 1970s. Entrants included a host of special methods that took advantage of human knowledge—knowledge of words, of phonemes, of the human vocal tract, etc. On the other side were newer methods that were more statistical in nature and did much more computation, based on hidden Markov models (HMMs). Again, the statistical methods won out over the human-knowledge-based methods. This led to a major change in all of natural language processing, gradually over decades, where statistics and computation came to dominate the field. The recent rise of deep learning in speech recognition is the most recent step in this consistent direction. Deep learning methods rely even less on human knowledge, and use even more computation, together with learning on huge training sets, to produce dramatically better speech recognition systems.

> 在语音识别中，1970 年代 DARPA 赞助过一次早期比赛。参赛者包括一群利用人类知识的特殊方法——关于词汇、音素、人类声道结构等的知识。另一边是更统计性、计算量更大的新方法，基于隐马尔可夫模型 (HMM)。**又一次，统计方法击败了基于人类知识的方法**。这导致整个自然语言处理领域几十年间的重大转变——统计和算力最终主导了这个领域。语音识别中深度学习的近期崛起是这个一致方向上最新的一步。**深度学习方法更少依赖人类知识，使用更多算力**，配合在巨大训练集上的学习，产生了显著更好的语音识别系统。

### 4. 计算机视觉 / Computer Vision

> In computer vision, there has been a similar pattern. Early methods conceived of vision as searching for edges, or generalized cylinders, or in terms of SIFT features. But today all this is discarded. Modern deep-learning neural networks use only the notions of convolution and certain kinds of invariances, and perform much better.

> 计算机视觉有类似模式。早期方法把视觉设想为搜索边缘、广义圆柱体，或基于 SIFT 特征。但今天所有这些都被抛弃。现代深度学习神经网络只使用**卷积和某些不变性**的概念，却表现好得多。

---

### 核心结论

### Original

> This is a big lesson. As a field, we still have not thoroughly learned it, as we are continuing to make the same kind of mistakes. To see this, and to effectively resist it, we have to understand the appeal of these mistakes. **We have to learn the bitter lesson that building in how we think we think does not work in the long run.** The bitter lesson is based on the historical observations that 1) AI researchers have often tried to build knowledge into their agents, 2) this always helps in the short term, and is personally satisfying to the researcher, but 3) in the long run it plateaus and even inhibits further progress, and 4) breakthrough progress eventually arrives by an opposing approach based on scaling computation by search and learning. The eventual success is tinged with bitterness, and often incompletely digested, because it is success over a favored, human-centric approach.

> One thing that should be learned from the bitter lesson is **the great power of general purpose methods**, of methods that continue to scale with increased computation even as the available computation becomes very great. The two methods that seem to scale arbitrarily in this way are **search** and **learning**.

> The second general point to be learned from the bitter lesson is that **the actual contents of minds are tremendously, irredeemably complex; we should stop trying to find simple ways to think about the contents of minds**, such as simple ways to think about space, objects, multiple agents, or symmetries. All these are part of the arbitrary, intrinsically-complex, outside world. They are not what should be built in, as their complexity is endless; instead we should build in only the meta-methods that can find and capture this arbitrary complexity. Essential to these methods is that they can find good approximations, but the search for them should be by our methods, not by us. We want AI agents that can discover like we can, not which contain what we have discovered. Building in our discoveries only makes it harder to see how the discovering process can be done.

### 中文翻译

> 这是一个大教训。作为一个领域，我们还没有彻底学会它——因为我们还在持续犯同类错误。要看清这一点并有效抵抗它，我们必须理解这些错误的吸引力。**我们必须学会一个苦涩的教训：把"我们以为我们怎么思考"内建进系统，长期来看是不起作用的**。Bitter lesson 基于以下历史观察：(1) AI 研究者经常尝试把知识内建到 agent 中，(2) 这在短期总有帮助，让研究者个人满足，但 (3) 长期来看会进入平台期甚至阻碍进一步进展，(4) 突破性进展最终由一种相反的方法到来——**基于搜索和学习对算力的扩展利用**。最终的成功带着苦涩，常常不能被完全消化，因为它是压倒了一种被偏爱的、以人类为中心的方法的成功。

> Bitter lesson 要教给我们的第一件事是**通用方法的巨大威力**——那些随着算力越来越大仍能继续扩展的方法。**看起来能够任意扩展的两种方法是：搜索 (search) 和学习 (learning)**。

> Bitter lesson 要教给我们的第二件事是**心智的实际内容是极其复杂、无可救赎地复杂的。我们应该停止试图用简单方式思考心智的内容**——比如用简单方式思考空间、对象、多 agent、对称性。所有这些都是任意、本质复杂的外部世界的一部分。它们不应该被内建进系统，因为它们的复杂性是无穷的。相反，我们应该只内建能**发现和捕获这种任意复杂性**的元方法 (meta-methods)。这些元方法的本质是它们能找到好的近似——但寻找这些近似的过程应该由方法本身完成，不该由我们完成。**我们想要能像我们一样发现的 AI agent，而不是内含我们已发现内容的 AI agent**。把我们的发现内建进去，只会让"发现的过程"变得更难理解。

---

## 工程师视角的关键启示 / Key Takeaways

### 1. 每一次"我来加一条规则"都要过一遍 Bitter Lesson 检验

每当你想在系统里加一条 if-else 规则、一个手写的 heuristic、一个领域特定的特征工程——问自己：

- **这条规则能随算力扩展吗？** 如果不能(通常不能)，它就是在**固化**你当前的理解，而你当前的理解几乎必然是不完整的。
- **如果我有 10 倍数据、10 倍算力，这条规则会自己被学出来吗？** 如果会，你就是在提前把答案告诉模型——短期有帮助，长期是技术债。
- **有没有一种更通用的机制能让系统自己发现这个规律？** 这才是 Sutton 说的 "meta-method"。

### 2. Scaling 不是蛮力，是一种设计哲学

很多人把 Bitter Lesson 误读为"只要堆算力就行"。Sutton 的实际主张是：**选择那些能从算力中受益的方法**。搜索和学习是两个能任意扩展的 meta-method。一个架构如果**无法从多 10 倍算力中显著受益**，那它就是死胡同——无论短期多漂亮。

**工程判断问题：** 你的方法对数据 / 算力翻倍的响应曲线是什么？

- 平的 → Bitter Lesson 警告你
- 对数上升 → 可以继续投入
- 接近线性 → 金矿，大力投入

### 3. 抗拒"我理解得更多"的诱惑

Bitter Lesson 最深的心理层面：**研究者投入时间精心设计某种方法，就会有心理承诺继续捍卫它**，即使数据说这不 scale。今天的 LLM 工程师面对同样的诱惑：

- "我们的 prompt 工程团队研究了半年，这套 prompt 模板比 few-shot 好 15%" → 下一代模型出来之后这 15% 可能归零
- "我们精心设计了 retrieval 管线的 15 个过滤规则" → 下一代 embedding 模型可能让所有过滤规则变得多余
- "我们的 agent 框架有一套精妙的 state machine 控制流" → 下一代模型的 tool-use 可能直接把 state machine 替代

**实操建议：** 给所有手工机制打上"Bitter Lesson 风险"标签——每 6 个月评估一次它是否还值得维护。模型能力上升的过程就是手工机制被吞噬的过程。

### 4. 和本仓库其他文章的关联

- [autoresearch](../self-improving-agents/autoresearch.md)——Karpathy 的这个实验直接是 Bitter Lesson 的工程化落地：**不手工设计架构改进，让 agent 搜索+学习自己发现**
- [SPIN](../self-improving-agents/spin.md)——自博弈学习配价值函数，是 Sutton 文中的第二个历史模式的复现
- [自我改进 Agent 系列](../self-improving-agents/)——几乎所有文章都在回答"如何让 meta-method 代替手工规则"
- [DeepSeek-R1](../training-techniques/deepseek-r1.md)——用 RL 而不是手工 COT 模板做推理训练，是 Bitter Lesson 在 2025 年最新一次印证

### 5. Bitter Lesson 不适用的地方（边界）

老实说一下边界——Sutton 的教训不是万能的：

- **短期工程项目** (6 个月内交付) 通常**不能**等 scaling 曲线，必须用人类知识"抄近路"
- **在物理/安全约束死硬的领域** (医疗、金融风控、法律合规) 手工规则是不可替代的(但这些规则应该是约束层，不是主导推理层)
- **数据稀缺的垂直领域** scaling 曲线可能上不去——但这反而应该促使你去**生产更多数据**，而不是回头写规则

**所以 Bitter Lesson 的现代版是：** "在任何 scaling 能上去的地方，让它上去；scaling 上不去的地方，去创造让它能上去的条件；只有在既不能 scale 也不能改造条件时，才退回手工规则。"

---

## 为什么是一篇"Tier-S"文章 / Why This Is Tier-S

- **篇幅极短(~800 词)但影响力极高：** 过去 10 年 AI 工程决策的北极星
- **作者是强化学习的奠基人之一：** Sutton 写过《Reinforcement Learning: An Introduction》，在 1984 年就开始研究 temporal difference，2024 年获 Turing 奖——他的"70 年"是亲历
- **被前沿实践者持续引用：** Karpathy 的演讲、Jared Kaplan 的 scaling laws、OpenAI 整个路线图都建立在这条原则上
- **直接落地：** 每个工程决策都能用它过一遍

这就是我们要的"Tier-S"质量——不是哲学底色，是**持续影响明天工程决策的简洁原理**。

---

## References / 参考

- **原文:** [The Bitter Lesson by Rich Sutton (2019)](http://www.incompleteideas.net/IncIdeas/BitterLesson.html)
- **作者著作:** [Reinforcement Learning: An Introduction (Sutton & Barto)](http://incompleteideas.net/book/the-book.html) — RL 领域的权威教材
- **相关讨论:**
  - [Jared Kaplan — Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)
  - [Karpathy: Software 2.0](../ai-thinking/software-2-0.md)(本仓库同目录)
- **本仓库相关:**
  - [autoresearch](../self-improving-agents/autoresearch.md) — Bitter Lesson 的工程实验化
  - [DeepSeek-R1](../training-techniques/deepseek-r1.md) — 2025 年最新一次 scaling 印证
  - [Karpathy Software 2.0](software-2-0.md) — 相邻的范式文章
