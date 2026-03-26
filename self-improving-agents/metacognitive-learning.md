# Truly Self-Improving Agents Require Intrinsic Metacognitive Learning

> **原文链接:** [arXiv:2506.05109](https://arxiv.org/abs/2506.05109)
> **作者:** Tennison Liu, Mihaela van der Schaar
> **发表:** ICML 2025
> **主题:** 元认知学习框架，真正的自我改进需要三种元认知能力

---

## Abstract

This position paper argues that current approaches to building self-improving AI agents are fundamentally limited because they rely on extrinsic improvement loops — human-designed procedures that tell the agent when, what, and how to learn. Truly self-improving agents, the authors contend, require intrinsic metacognitive learning: the ability to autonomously monitor their own cognitive processes, plan their own learning strategies, and evaluate the effectiveness of their own improvement efforts. Drawing on decades of cognitive science research on human metacognition, the paper proposes a formal framework built on three metacognitive abilities: Metacognitive Knowledge (self-assessment of strengths and weaknesses), Metacognitive Planning (deciding what and how to learn), and Metacognitive Evaluation (reflecting on whether learning was effective). The paper serves as a blueprint for the next generation of self-improving agents that can direct their own development rather than following pre-programmed improvement procedures.

## 摘要

这篇立场论文认为，当前构建自我改进 AI 智能体的方法存在根本性局限，因为它们依赖外在改进循环——由人类设计的程序，告诉智能体何时、学什么以及如何学习。作者主张，真正的自我改进智能体需要内在元认知学习：自主监控自身认知过程、规划自身学习策略以及评估自身改进效果的能力。论文借鉴了数十年来关于人类元认知的认知科学研究，提出了一个基于三种元认知能力的形式化框架：元认知知识（对优势和弱点的自我评估）、元认知规划（决定学什么和如何学）以及元认知评估（反思学习是否有效）。本文为下一代能够自主引导自身发展而非遵循预编程改进程序的自我改进智能体提供了蓝图。

---

## 1. Introduction / 引言

The field of self-improving AI has made remarkable progress in recent years. Models can now select their own training data, generate synthetic examples for self-training, play games against their own previous iterations, and even perform test-time adaptation. Yet despite these advances, a careful examination reveals a common thread: every current self-improvement method operates within a loop that was designed by humans.

近年来，自我改进 AI 领域取得了显著进展。模型现在可以选择自己的训练数据、生成用于自训练的合成示例、与自身先前的迭代进行博弈，甚至执行测试时适应。然而，尽管取得了这些进步，仔细审视后发现一个共同线索：每种当前的自我改进方法都在人类设计的循环内运作。

Consider a self-play method like SPIN: a human researcher decided that the improvement procedure should be "generate responses, compare with human data, train to distinguish, repeat." The model follows this loop but never questions whether this is the right loop to follow. It cannot decide to switch strategies, allocate more effort to a particular weakness, or evaluate whether the current improvement procedure is actually working. The improvement procedure is extrinsic — imposed from outside — rather than intrinsic — arising from the agent's own judgment.

以 SPIN 这样的自博弈方法为例：人类研究者决定了改进程序应该是"生成响应、与人类数据比较、训练以区分、重复"。模型遵循这个循环，但从不质疑这是否是应该遵循的正确循环。它无法决定切换策略、对特定弱点投入更多精力，或评估当前改进程序是否真正有效。改进程序是外在的——从外部施加的——而非内在的——源于智能体自身判断的。

This paper argues that this distinction between extrinsic and intrinsic self-improvement is not merely philosophical — it has concrete implications for the capabilities and limitations of self-improving systems. A system with only extrinsic improvement can never exceed the bounds of its pre-designed improvement loop. A system with intrinsic metacognitive learning can, in principle, discover novel improvement strategies that its designers never anticipated.

本文论证，外在与内在自我改进之间的区别不仅仅是哲学上的——它对自我改进系统的能力和限制有具体影响。仅具有外在改进的系统永远无法超越其预设改进循环的边界。而具有内在元认知学习的系统原则上可以发现其设计者从未预料到的新改进策略。

---

## 2. The Three Metacognitive Abilities / 三种元认知能力

Drawing on the foundational work of Flavell (1979) and subsequent research in cognitive science, the paper identifies three metacognitive abilities that are necessary for intrinsic self-improvement:

借鉴 Flavell（1979）的基础性工作及后续认知科学研究，论文确定了内在自我改进所需的三种元认知能力：

### 2.1 Metacognitive Knowledge / 元认知知识

Metacognitive Knowledge is the agent's understanding of its own cognitive strengths and weaknesses. A human student with good metacognitive knowledge knows which subjects they find easy, which they find difficult, what types of errors they commonly make, and what conditions affect their performance. Similarly, a self-improving agent needs a calibrated self-model — an internal representation of what it can and cannot do.

元认知知识是智能体对自身认知优势和弱点的理解。一个具有良好元认知知识的人类学生知道哪些学科容易、哪些困难、通常会犯什么类型的错误以及什么条件会影响表现。同样，自我改进的智能体需要一个校准的自我模型——对它能做什么和不能做什么的内部表示。

Current approaches approximate this ability in limited ways. Cherry LLM uses perplexity as a proxy for difficulty. Test-time adaptation methods use softmax scores to detect uncertainty. But these are narrow signals that capture only one dimension of self-knowledge. A truly metacognitive agent would maintain a rich, structured understanding of its capabilities: "I am strong at arithmetic but weak at word problems. I make sign errors when dealing with negative numbers. My performance degrades on long contexts."

当前方法以有限的方式近似这种能力。Cherry LLM 使用困惑度作为难度的代理。测试时适应方法使用 softmax 分数来检测不确定性。但这些是仅捕获自我知识一个维度的狭窄信号。一个真正具有元认知的智能体会维护对其能力的丰富、结构化理解："我擅长算术但在应用题上较弱。处理负数时我会犯符号错误。在长上下文上我的表现会下降。"

### 2.2 Metacognitive Planning / 元认知规划

Metacognitive Planning is the ability to decide what to learn and how to learn it. Given an assessment of strengths and weaknesses, a metacognitive learner formulates a learning plan: which skills to prioritize, what learning strategies to employ, how much effort to allocate to each area, and when to switch strategies if progress stalls.

元认知规划是决定学什么和如何学的能力。根据对优势和弱点的评估，元认知学习者制定学习计划：优先发展哪些技能、采用什么学习策略、为每个领域分配多少精力，以及在进展停滞时何时切换策略。

In current self-improving systems, the learning plan is entirely specified by the researcher. SPIN always trains to distinguish own outputs from human data. EvolveR always distills trajectories into principles and trains with GRPO. RISE always trains for multi-turn self-correction. None of these systems can decide, based on self-assessment, that a different learning strategy would be more effective for their current set of weaknesses.

在当前的自我改进系统中，学习计划完全由研究者指定。SPIN 总是训练以区分自身输出和人类数据。EvolveR 总是将轨迹蒸馏为原则并用 GRPO 训练。RISE 总是训练多轮自我修正。这些系统中没有一个能够基于自我评估来决定对其当前弱点集合来说不同的学习策略会更有效。

A metacognitive planner would be able to reason: "My math accuracy is low because I make computational errors, not because I misunderstand the problems. Therefore, I should focus on careful step-by-step computation rather than problem decomposition strategies." This kind of strategic self-directed learning is the hallmark of effective human learners and is absent from current AI systems.

一个元认知规划者能够推理："我的数学准确率低是因为我犯计算错误，而不是因为我误解了问题。因此，我应该专注于仔细的逐步计算，而不是问题分解策略。"这种战略性的自主学习是有效人类学习者的标志，而在当前的 AI 系统中是缺失的。

### 2.3 Metacognitive Evaluation / 元认知评估

Metacognitive Evaluation is the ability to reflect on whether a learning episode was effective and to adjust future learning strategies accordingly. After studying for an exam, a metacognitive student asks: "Did my study strategy work? Did I improve in the areas I targeted? Should I try a different approach next time?"

元认知评估是反思学习过程是否有效并相应调整未来学习策略的能力。在考试复习后，元认知学生会问："我的学习策略有效吗？我在目标领域有所提高吗？下次我应该尝试不同的方法吗？"

This feedback loop is critical for sustained improvement. Without metacognitive evaluation, an agent might persist with an ineffective learning strategy indefinitely, or abandon an effective one prematurely. Current self-improving systems have minimal evaluation capabilities — they track aggregate performance metrics but do not analyze the relationship between specific learning actions and specific outcomes.

这个反馈循环对于持续改进至关重要。没有元认知评估，智能体可能无限期地坚持无效的学习策略，或过早放弃有效的策略。当前的自我改进系统具有最少的评估能力——它们跟踪总体性能指标，但不分析具体学习行为与具体结果之间的关系。

---

## 3. The Extrinsic vs. Intrinsic Distinction / 外在与内在的区分

The paper formalizes the distinction between extrinsic and intrinsic self-improvement. An extrinsic self-improvement system has a fixed improvement procedure specified by the designer. The system can improve its task performance through this procedure, but it cannot modify the procedure itself. The procedure is a constant, not a variable.

论文形式化了外在与内在自我改进之间的区分。外在自我改进系统具有由设计者指定的固定改进程序。系统可以通过该程序提高其任务性能，但不能修改程序本身。该程序是常量，不是变量。

An intrinsic self-improvement system, by contrast, treats the improvement procedure as a learnable component. The system can modify its own learning strategy, allocate effort differently, try alternative improvement approaches, and evaluate the results. The improvement procedure is itself subject to optimization.

相比之下，内在自我改进系统将改进程序视为可学习的组件。系统可以修改自己的学习策略、不同地分配精力、尝试替代改进方法，并评估结果。改进程序本身也是优化的对象。

This distinction maps cleanly onto the three metacognitive abilities. Metacognitive Knowledge provides the self-assessment that guides learning decisions. Metacognitive Planning translates self-assessment into learning actions. Metacognitive Evaluation closes the loop by assessing whether those actions were effective. Together, these three abilities enable a system to optimize not just its task performance, but its learning process itself — learning to learn.

这一区分清晰地映射到三种元认知能力上。元认知知识提供指导学习决策的自我评估。元认知规划将自我评估转化为学习行动。元认知评估通过评估这些行动是否有效来闭合循环。这三种能力共同使系统不仅能优化其任务性能，还能优化其学习过程本身——学会学习。

---

## 4. Critique of Current Approaches / 对当前方法的批判

The paper systematically reviews existing self-improvement methods through the metacognitive lens:

论文通过元认知视角系统地审视了现有的自我改进方法：

**Data Selection Methods** (e.g., Cherry LLM) demonstrate rudimentary Metacognitive Knowledge — they can assess which data points are challenging. But they have no Metacognitive Planning (the selection criterion is fixed) and no Metacognitive Evaluation (they do not assess whether the selected data actually improved the model's weaknesses).

**数据选择方法**（如 Cherry LLM）展示了初步的元认知知识——它们可以评估哪些数据点具有挑战性。但它们没有元认知规划（选择标准是固定的）且没有元认知评估（它们不评估选择的数据是否实际改善了模型的弱点）。

**Self-Play Methods** (e.g., SPIN) have implicit self-knowledge (the model generates responses that reveal its distribution) but the improvement procedure is entirely fixed. The model cannot decide that self-play is not the right strategy for its current weaknesses.

**自博弈方法**（如 SPIN）具有隐式的自我知识（模型生成揭示其分布的响应），但改进程序完全固定。模型无法决定自博弈对其当前弱点不是正确的策略。

**Multi-Turn Self-Correction** (e.g., RISE) trains for a specific type of self-improvement (correcting previous attempts) but cannot generalize to other improvement strategies. The model cannot decide to seek external knowledge, decompose a problem differently, or abandon a line of reasoning entirely.

**多轮自我修正**（如 RISE）为特定类型的自我改进（修正先前尝试）进行训练，但无法泛化到其他改进策略。模型无法决定寻求外部知识、以不同方式分解问题或完全放弃某条推理路线。

**Test-Time Adaptation** (e.g., Self-Improving at Test-Time) shows the most metacognitive sophistication, with self-awareness (uncertainty detection), self-augmentation (planning how to learn), and some evaluation. However, the adaptation procedure is still human-designed, and the agent cannot modify it based on experience.

**测试时适应**（如测试时自我改进）展示了最多的元认知复杂性，具有自我感知（不确定性检测）、自我增强（规划如何学习）和一些评估。然而，适应程序仍然是人类设计的，智能体无法基于经验修改它。

---

## 5. A Formal Framework / 形式化框架

The paper proposes a formal framework for metacognitive learning in AI agents. The key components are:

论文为 AI 智能体中的元认知学习提出了一个形式化框架。关键组件包括：

**Self-Model M**: A representation of the agent's capabilities, maintained and updated through experience. The self-model captures task-specific performance estimates, error patterns, and capability boundaries.

**自我模型 M**：智能体能力的表示，通过经验维护和更新。自我模型捕获特定任务的性能估计、错误模式和能力边界。

**Learning Strategy Space S**: The set of available learning strategies (e.g., self-play, data selection, multi-turn refinement, seeking external feedback). A metacognitive planner selects from this space based on the self-model.

**学习策略空间 S**：可用学习策略的集合（如自博弈、数据选择、多轮精炼、寻求外部反馈）。元认知规划者基于自我模型从这个空间中选择。

**Evaluation Function E**: A function that assesses the effectiveness of a learning episode by comparing the self-model before and after learning. This drives strategy selection in future learning episodes.

**评估函数 E**：通过比较学习前后的自我模型来评估学习过程有效性的函数。这驱动未来学习过程中的策略选择。

The full metacognitive loop operates as follows: the agent uses its Self-Model to identify weaknesses, selects a Learning Strategy from the strategy space, executes a learning episode, uses the Evaluation Function to assess the outcome, and updates both the Self-Model and the strategy selection policy. This creates a nested optimization: the outer loop optimizes the learning process, while the inner loop optimizes task performance.

完整的元认知循环运作如下：智能体使用其自我模型识别弱点，从策略空间选择学习策略，执行学习过程，使用评估函数评估结果，并更新自我模型和策略选择策略。这创建了一个嵌套优化：外层循环优化学习过程，而内层循环优化任务性能。

---

## 6. Challenges and Open Problems / 挑战与开放问题

The paper identifies several fundamental challenges in implementing intrinsic metacognitive learning:

论文确定了实现内在元认知学习的几个根本性挑战：

**Calibration**: The self-model must be well-calibrated — the agent's assessment of its capabilities must accurately reflect its actual performance. Overconfident agents will fail to improve, while underconfident agents will waste resources on unnecessary learning. Achieving calibration is itself a difficult learning problem.

**校准**：自我模型必须是良好校准的——智能体对其能力的评估必须准确反映其实际性能。过度自信的智能体将无法改进，而信心不足的智能体将在不必要的学习上浪费资源。实现校准本身就是一个困难的学习问题。

**Strategy Discovery**: The learning strategy space must be rich enough to include effective strategies for diverse weaknesses. Ideally, the agent should be able to compose new strategies from primitive operations, rather than being limited to a fixed menu.

**策略发现**：学习策略空间必须足够丰富，以包含针对不同弱点的有效策略。理想情况下，智能体应该能够从基本操作中组合新策略，而不是局限于固定菜单。

**Stability**: A system that can modify its own learning procedure risks instability. Poorly directed self-modification could lead to degenerate learning loops, catastrophic forgetting, or reward hacking. Ensuring stable metacognitive learning is a critical safety consideration.

**稳定性**：能够修改自身学习程序的系统存在不稳定性风险。方向不当的自我修改可能导致退化的学习循环、灾难性遗忘或奖励黑客。确保稳定的元认知学习是一个关键的安全考虑。

---

## 7. Implications for the Field / 对该领域的影响

The metacognitive framework provides a unified lens for evaluating and comparing self-improvement methods. Rather than asking "does method X improve performance?", the framework encourages asking "which metacognitive abilities does method X exhibit, and which are missing?" This shifts the research agenda from inventing specific improvement techniques to building general metacognitive capabilities.

元认知框架提供了一个统一的视角来评估和比较自我改进方法。该框架不是问"方法 X 是否提高了性能？"，而是鼓励问"方法 X 展示了哪些元认知能力，缺少哪些？"这将研究议程从发明具体改进技术转向构建通用元认知能力。

The paper also draws important connections to AI safety. An agent with strong metacognitive abilities would be better able to assess its own reliability, flag situations where it is likely to fail, and avoid overconfident deployment in high-stakes scenarios. Conversely, metacognitive capabilities raise concerns about agents that could autonomously expand their own capabilities in unpredictable ways.

论文还与 AI 安全建立了重要联系。具有强大元认知能力的智能体能更好地评估自身可靠性、标记可能失败的情况，并避免在高风险场景中过度自信的部署。相反，元认知能力也引发了对智能体以不可预测方式自主扩展自身能力的担忧。

---

## 8. Conclusion / 结论

This position paper makes a compelling case that the next frontier in self-improving AI is not better improvement algorithms but better metacognition. Current methods, for all their sophistication, operate within fixed loops designed by human researchers. They cannot assess their own strengths and weaknesses in a nuanced way, cannot select among alternative learning strategies, and cannot evaluate whether their improvement efforts were effective. The three metacognitive abilities — Knowledge, Planning, and Evaluation — provide a principled framework for moving beyond these limitations. Implementing this framework is a grand challenge that will require advances in self-modeling, strategy learning, and stable self-modification. But the potential reward is transformative: AI agents that are not merely trained by humans but that genuinely direct their own intellectual development.

这篇立场论文令人信服地论证了，自我改进 AI 的下一个前沿不是更好的改进算法，而是更好的元认知。当前方法尽管复杂精密，但都在人类研究者设计的固定循环内运作。它们无法以细致入微的方式评估自身的优势和弱点，无法在替代学习策略之间选择，也无法评估其改进努力是否有效。三种元认知能力——知识、规划和评估——为超越这些限制提供了一个有原则的框架。实现这一框架是一个重大挑战，需要在自我建模、策略学习和稳定自我修改方面取得进展。但潜在回报是变革性的：AI 智能体不仅仅由人类训练，而是真正自主引导自身的智力发展。
