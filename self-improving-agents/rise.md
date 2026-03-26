# Recursive Introspection: Teaching Language Model Agents How to Self-Improve

> **原文链接:** [arXiv:2407.18219](https://arxiv.org/abs/2407.18219)
> **作者:** (see paper)
> **发表:** NeurIPS 2024
> **主题:** 递归自省，教语言模型在多轮尝试中自我修正和改进

---

## Abstract

Current language models typically produce a single response to a given prompt, with no opportunity to reconsider or refine their answer. Recursive Introspection (RISE) addresses this limitation by teaching language models to improve their responses over multiple turns. The method frames single-turn problems as multi-turn Markov Decision Processes, where the model receives its own previous attempt as input and must produce an improved version. Training uses advantage-weighted regression to reinforce turns that lead to correct answers. RISE demonstrates significant improvements: Llama3-8B gains 8.2% accuracy on mathematical reasoning, while Mistral-7B achieves a remarkable 23.9% improvement on GSM8K. Unlike methods that rely on sampling multiple independent responses and selecting the best, RISE produces genuine sequential improvement — each turn builds upon and corrects the mistakes of the previous one.

## 摘要

当前的语言模型通常对给定提示只产生单个响应，没有重新考虑或精炼答案的机会。递归自省（RISE）通过教语言模型在多轮中改进其响应来解决这一限制。该方法将单轮问题构建为多轮马尔可夫决策过程，模型接收自己先前的尝试作为输入，必须产生改进版本。训练使用优势加权回归来强化导致正确答案的轮次。RISE 展示了显著的改进：Llama3-8B 在数学推理上提升了 8.2% 的准确率，而 Mistral-7B 在 GSM8K 上取得了 23.9% 的显著提升。与依赖采样多个独立响应并选择最佳的方法不同，RISE 产生真正的顺序改进——每一轮都建立在前一轮的基础上并纠正其错误。

---

## 1. Introduction / 引言

Human problem-solving is rarely a single-shot process. When we attempt a math problem, write an essay, or debug code, we routinely review our work, identify errors, and make corrections. This iterative refinement is a cornerstone of human intelligence. Yet most language model training and evaluation treats generation as a one-shot task: given an input, produce an output, and move on.

人类的问题解决很少是一次性的过程。当我们尝试数学题、写论文或调试代码时，我们通常会审查自己的工作、识别错误并进行修正。这种迭代精炼是人类智能的基石。然而，大多数语言模型的训练和评估将生成视为一次性任务：给定输入，产生输出，然后继续。

Recent work on self-correction has shown that simply prompting models to "try again" or "check your work" often fails — models tend to either repeat the same mistakes or introduce new errors. The reason is that models are not trained to improve upon their previous attempts. They are trained to generate good first attempts, and the skill of self-correction is fundamentally different from the skill of initial generation.

最近关于自我修正的研究表明，简单地提示模型"再试一次"或"检查你的工作"往往会失败——模型倾向于重复相同的错误或引入新的错误。原因在于模型没有被训练来改进其先前的尝试。它们被训练来生成好的初始尝试，而自我修正的技能与初始生成的技能根本不同。

RISE directly addresses this gap by explicitly training models for multi-turn self-improvement. The model learns not just to solve problems, but to recognize when its solution is wrong and produce a better one on the next attempt.

RISE 通过显式地训练模型进行多轮自我改进来直接解决这一差距。模型不仅学习解决问题，还学习识别其解答何时是错误的，并在下一次尝试中产生更好的解答。

---

## 2. Problem Formulation / 问题建模

RISE reformulates single-turn question-answering as a multi-turn MDP. Given a question q, the agent interacts over T turns. At each turn t, the agent observes its previous response (or an empty response for t=1) and produces a new response. The reward is binary: 1 if the response at any turn is correct, 0 otherwise. The optimal policy learns to allocate its "computation budget" across turns — producing a reasonable first attempt and then systematically refining it.

RISE 将单轮问答重新建模为多轮 MDP。给定问题 q，智能体进行 T 轮交互。在每一轮 t，智能体观察其先前的响应（第 1 轮时为空响应）并产生新的响应。奖励是二元的：如果任何轮次的响应正确则为 1，否则为 0。最优策略学习在各轮之间分配其"计算预算"——产生合理的初始尝试，然后系统地精炼它。

The state at turn t consists of the question q concatenated with all previous responses. The action is the new response. This formulation naturally captures the sequential nature of self-improvement: later turns have access to more information (all previous attempts) and can make more informed corrections.

轮次 t 的状态由问题 q 与所有先前响应的拼接组成。动作是新的响应。这种建模自然地捕捉了自我改进的顺序性质：后续轮次可以访问更多信息（所有先前的尝试），从而做出更有依据的修正。

---

## 3. Training Method / 训练方法

The training procedure has two main components: data collection and policy optimization.

训练过程有两个主要组成部分：数据收集和策略优化。

**Data Collection.** For each training question, the current model generates multiple rollouts across T turns. Each rollout produces a trajectory of T responses. These trajectories are evaluated: at each turn, the response is checked for correctness. The key insight is that the value of a response at turn t depends not just on whether it is correct, but on whether it enables improvement in subsequent turns.

**数据收集。** 对于每个训练问题，当前模型在 T 轮中生成多个展开轨迹。每个展开产生 T 个响应的轨迹。这些轨迹被评估：在每一轮，检查响应的正确性。关键洞察是，轮次 t 的响应价值不仅取决于它是否正确，还取决于它是否能促进后续轮次的改进。

**Advantage-Weighted Regression.** Rather than using standard policy gradient methods, RISE employs advantage-weighted regression (AWR). For each turn-level response, an advantage is computed by comparing the outcome of that response against the average outcome across all sampled responses at that turn. Responses with positive advantages (better than average) are upweighted in the training loss, while responses with negative advantages are downweighted. This approach is more stable than policy gradient methods and avoids the need for a separate critic network.

**优势加权回归。** RISE 不使用标准策略梯度方法，而是采用优势加权回归（AWR）。对于每个轮次级别的响应，通过将该响应的结果与该轮次所有采样响应的平均结果进行比较来计算优势值。具有正优势（优于平均）的响应在训练损失中被增加权重，而具有负优势的响应被减少权重。这种方法比策略梯度方法更稳定，且避免了对单独评论家网络的需求。

---

## 4. Distillation and Self-Distillation / 蒸馏与自蒸馏

RISE explores two variants of the training approach:

RISE 探索了训练方法的两种变体：

**Distillation (RISE-Distill).** A stronger model (such as GPT-4) generates the multi-turn improvement trajectories. The target model then learns to imitate these trajectories through supervised fine-tuning. This provides high-quality training data but requires access to a stronger model.

**蒸馏（RISE-Distill）。** 一个更强的模型（如 GPT-4）生成多轮改进轨迹。目标模型然后通过监督微调学习模仿这些轨迹。这提供了高质量的训练数据，但需要访问更强的模型。

**Self-Distillation (RISE-Self).** The model generates its own improvement trajectories and trains on the successful ones. This is a fully self-contained approach that requires no external model. The model learns from its own successful self-correction attempts, reinforcing the strategies that led to improvement.

**自蒸馏（RISE-Self）。** 模型生成自己的改进轨迹并在成功的轨迹上训练。这是一种完全自包含的方法，不需要外部模型。模型从自己成功的自我修正尝试中学习，强化了导致改进的策略。

Both variants produce significant improvements, with self-distillation being particularly notable because it demonstrates genuine self-improvement without external supervision.

两种变体都产生了显著的改进，其中自蒸馏尤为值得注意，因为它展示了无需外部监督的真正自我改进。

---

## 5. Experimental Results / 实验结果

The authors evaluate RISE on mathematical reasoning benchmarks, which provide clear correctness signals for each response. The primary metrics are accuracy at turn 1 (initial response quality) and accuracy improvement across subsequent turns (self-improvement capability).

作者在数学推理基准测试上评估 RISE，这些基准为每个响应提供了清晰的正确性信号。主要指标是轮次 1 的准确率（初始响应质量）和后续轮次的准确率提升（自我改进能力）。

On GSM8K, Mistral-7B with RISE achieves a 23.9% improvement in accuracy when given 5 turns compared to its single-turn performance. This is a substantial gain that demonstrates the model has learned genuine self-correction ability. Llama3-8B shows an 8.2% improvement on the same benchmark.

在 GSM8K 上，使用 RISE 的 Mistral-7B 在给予 5 轮的情况下，准确率比单轮性能提高了 23.9%。这是一个实质性的提升，证明模型已经学会了真正的自我修正能力。Llama3-8B 在相同基准上显示了 8.2% 的提升。

Importantly, the improvement is genuinely sequential: each turn builds upon the previous one, and the accuracy monotonically increases with the number of turns. This distinguishes RISE from best-of-N sampling, where multiple independent responses are generated and the best is selected. In best-of-N, there is no sequential improvement — each response is generated independently. RISE, by contrast, generates a chain of improving responses where each turn corrects specific mistakes from the previous one.

重要的是，这种改进是真正顺序性的：每一轮都建立在前一轮的基础上，准确率随轮次数单调增加。这将 RISE 与 best-of-N 采样区分开来，后者生成多个独立响应并选择最佳的。在 best-of-N 中，没有顺序改进——每个响应都是独立生成的。相比之下，RISE 生成一个改进响应链，每一轮都修正前一轮的特定错误。

---

## 6. Analysis of Self-Correction Behavior / 自我修正行为分析

Qualitative analysis reveals that RISE-trained models develop sophisticated self-correction strategies. When reviewing a previous attempt, the model learns to identify specific computational errors (e.g., arithmetic mistakes), logical errors (e.g., incorrect problem decomposition), and conceptual errors (e.g., misunderstanding the question). The correction in the next turn typically addresses the identified error while preserving the correct parts of the previous solution.

定性分析表明，经过 RISE 训练的模型发展出了复杂的自我修正策略。在审查先前的尝试时，模型学会了识别具体的计算错误（如算术错误）、逻辑错误（如不正确的问题分解）和概念错误（如误解问题）。下一轮的修正通常解决已识别的错误，同时保留先前解答的正确部分。

This behavior emerges from the training process without explicit instruction to "find and fix errors." The advantage-weighted regression naturally selects for trajectories where later turns correct earlier mistakes, and the model learns to generalize this correction pattern.

这种行为从训练过程中自然涌现，无需明确指示"查找并修复错误"。优势加权回归自然选择了后续轮次修正早期错误的轨迹，模型学会了泛化这种修正模式。

---

## 7. Comparison with Existing Self-Correction Methods / 与现有自我修正方法的比较

Several prior works have attempted to enable self-correction in language models. Prompting-based approaches add instructions like "review your answer" but consistently fail to produce reliable improvement, as the model lacks the trained capability to meaningfully evaluate and correct its output. External feedback approaches provide the model with signals from a verifier or critic model, which improves performance but requires an additional model at inference time.

此前多项工作尝试在语言模型中实现自我修正。基于提示的方法添加"审查你的答案"等指令，但始终无法产生可靠的改进，因为模型缺乏有意义地评估和修正其输出的训练能力。外部反馈方法为模型提供来自验证器或评论家模型的信号，这改进了性能但需要在推理时使用额外模型。

RISE is unique in that it trains the model itself to be both generator and self-corrector, without external feedback at inference time. The multi-turn MDP formulation provides a principled framework for this training, and the advantage-weighted regression ensures stable learning.

RISE 的独特之处在于它训练模型本身同时成为生成器和自我修正器，推理时不需要外部反馈。多轮 MDP 公式为这种训练提供了有原则的框架，优势加权回归确保了稳定的学习。

---

## 8. Limitations / 局限性

RISE requires a verifiable correctness signal for training (e.g., the answer to a math problem can be checked automatically). Extending the approach to open-ended generation tasks, where correctness is subjective, remains an open challenge. The multi-turn inference also increases computational cost linearly with the number of turns, trading compute for accuracy.

RISE 需要可验证的正确性信号用于训练（例如，数学题的答案可以自动检查）。将该方法扩展到开放式生成任务（其中正确性是主观的）仍然是一个开放性挑战。多轮推理也使计算成本随轮次数线性增加，以计算量换取准确率。

---

## 9. Conclusion / 结论

RISE demonstrates that language models can be trained for genuine sequential self-improvement. By framing self-correction as a multi-turn MDP and training with advantage-weighted regression, the method produces models that reliably improve their responses over multiple attempts. The results are significant: double-digit accuracy improvements on mathematical reasoning benchmarks, achieved through true iterative refinement rather than parallel sampling. RISE opens the door to language models that, like humans, can review, reflect, and revise their work — a crucial capability for deploying AI systems in domains that demand high reliability.

RISE 证明了语言模型可以被训练实现真正的顺序自我改进。通过将自我修正构建为多轮 MDP 并使用优势加权回归进行训练，该方法产生的模型能够在多次尝试中可靠地改进其响应。结果是显著的：在数学推理基准上取得两位数的准确率提升，通过真正的迭代精炼而非并行采样实现。RISE 为语言模型打开了一扇门，使其像人类一样能够审查、反思和修改自己的工作——这是在要求高可靠性的领域部署 AI 系统的关键能力。
