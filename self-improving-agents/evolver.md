# EvolveR: Self-Evolving LLM Agents through an Experience-Driven Lifecycle

> **原文链接:** [arXiv:2510.16079](https://arxiv.org/abs/2510.16079)
> **作者:** (see paper)
> **发表:** 2025
> **主题:** 经验驱动的自进化 Agent，将交互轨迹蒸馏为抽象策略原则

---

## Abstract

EvolveR introduces a closed-loop framework for building self-evolving language model agents that continuously improve through experience. Unlike retrieval-augmented approaches that store and retrieve raw interaction traces, EvolveR distills past experiences into abstract strategic principles — compact, generalizable rules that guide future behavior. The system operates through three tightly coupled stages: Online Interaction, where the agent engages with tasks and collects trajectories; Offline Self-Distillation, where successful trajectories are compressed into reusable principles; and Policy Evolution, where the agent's base policy is updated using reinforcement learning guided by these principles. A key finding is that at the 3B parameter scale, self-distilled principles outperform guidance from larger teacher models, suggesting that experience-driven self-improvement can be more effective than knowledge transfer from stronger systems.

## 摘要

EvolveR 引入了一个闭环框架，用于构建通过经验持续改进的自进化语言模型智能体。与存储和检索原始交互轨迹的检索增强方法不同，EvolveR 将过去的经验蒸馏为抽象策略原则——紧凑、可泛化的规则，用于指导未来行为。该系统通过三个紧密耦合的阶段运作：在线交互阶段，智能体参与任务并收集轨迹；离线自蒸馏阶段，成功的轨迹被压缩为可重用的原则；以及策略进化阶段，智能体的基础策略使用由这些原则引导的强化学习进行更新。一个关键发现是，在 30 亿参数规模下，自蒸馏的原则优于来自更大教师模型的指导，这表明经验驱动的自我改进可能比从更强系统进行知识迁移更为有效。

---

## 1. Introduction / 引言

Current LLM agents face a fundamental limitation: they do not learn from their operational experience. An agent that answers thousands of questions or completes hundreds of tasks processes each interaction in isolation, with no mechanism to accumulate wisdom from past successes and failures. While retrieval-augmented generation (RAG) allows agents to store and recall past interactions, raw trajectory retrieval is noisy, context-heavy, and scales poorly.

当前的 LLM 智能体面临一个根本性限制：它们不从操作经验中学习。一个回答了数千个问题或完成了数百项任务的智能体，每次交互都是孤立处理的，没有从过去的成功和失败中积累智慧的机制。虽然检索增强生成（RAG）允许智能体存储和回忆过去的交互，但原始轨迹检索存在噪声大、上下文重、可扩展性差的问题。

EvolveR addresses this gap by proposing an experience-driven lifecycle for LLM agents. The central metaphor is biological evolution: just as organisms adapt to their environment through accumulated experience encoded in genes, EvolveR agents distill interaction experience into strategic principles that evolve the agent's behavioral policy. The result is an agent that genuinely improves over time, not just by seeing more data, but by understanding what strategies work and encoding them into its decision-making process.

EvolveR 通过提出 LLM 智能体的经验驱动生命周期来弥补这一差距。其核心隐喻是生物进化：正如有机体通过编码在基因中的积累经验来适应环境，EvolveR 智能体将交互经验蒸馏为策略原则，从而进化智能体的行为策略。结果是一个随时间真正改进的智能体——不仅仅是通过看到更多数据，而是通过理解哪些策略有效并将其编码到决策过程中。

---

## 2. System Architecture / 系统架构

The EvolveR framework consists of three interconnected stages that form a continuous improvement loop:

EvolveR 框架由三个相互连接的阶段组成，形成一个持续改进循环：

**Stage 1: Online Interaction.** The agent operates in its target environment, processing tasks using three available actions: search_experience (retrieve relevant principles from the experience library), search_knowledge (query external knowledge sources), and answer (produce a final response). Each interaction generates a trajectory — a sequence of actions, observations, and outcomes. Trajectories are tagged with success or failure signals based on task outcomes.

**第一阶段：在线交互。** 智能体在其目标环境中运作，使用三种可用动作处理任务：search_experience（从经验库中检索相关原则）、search_knowledge（查询外部知识源）和 answer（生成最终响应）。每次交互都会生成一条轨迹——一系列动作、观察和结果。轨迹根据任务结果被标记为成功或失败信号。

**Stage 2: Offline Self-Distillation.** Successful trajectories are processed through a distillation pipeline that extracts abstract strategic principles. Rather than storing "for question X, the answer was Y," the system extracts generalizable insights like "when facing multi-step arithmetic problems, decompose into single operations before computing." Each principle is associated with a quality score and usage statistics.

**第二阶段：离线自蒸馏。** 成功的轨迹通过蒸馏管道处理，提取抽象策略原则。系统不是存储"对于问题 X，答案是 Y"，而是提取可泛化的洞察，如"面对多步算术问题时，先分解为单步运算再计算"。每条原则都关联有质量评分和使用统计。

**Stage 3: Policy Evolution.** The agent's base language model is fine-tuned using Group Relative Policy Optimization (GRPO) with a composite reward function that combines task outcome rewards with format compliance rewards. The distilled principles are incorporated into the training prompts, guiding the model toward strategies that have proven effective in past interactions.

**第三阶段：策略进化。** 智能体的基础语言模型使用群组相对策略优化（GRPO）进行微调，采用结合任务结果奖励和格式合规奖励的复合奖励函数。蒸馏出的原则被整合到训练提示中，引导模型采用在过去交互中证明有效的策略。

---

## 3. The Distillation Process / 蒸馏过程

The distillation of trajectories into principles is the core innovation of EvolveR. The process works as follows:

将轨迹蒸馏为原则是 EvolveR 的核心创新。该过程如下：

First, successful trajectories are collected and clustered by task type and strategy pattern. The agent itself (or a dedicated summarization component) analyzes each trajectory to extract the key strategic decisions that led to success. These are formulated as natural language principles — concise rules that capture the essence of effective behavior.

首先，收集成功的轨迹并按任务类型和策略模式进行聚类。智能体本身（或专用的摘要组件）分析每条轨迹，提取导致成功的关键策略决策。这些被表述为自然语言原则——捕捉有效行为本质的简洁规则。

Second, semantic deduplication is applied to merge principles that express the same strategy in different words. This prevents the experience library from growing unboundedly and ensures that principles remain diverse and non-redundant.

其次，应用语义去重来合并用不同词语表达相同策略的原则。这防止了经验库无限增长，并确保原则保持多样性和非冗余性。

Third, each principle receives a quality score based on its track record. The scoring formula is s(p) = (c_succ + 1) / (c_use + 2), where c_succ is the number of times the principle was used in a successful interaction and c_use is the total number of times it was used. This Laplace-smoothed success rate naturally balances exploitation of proven principles with exploration of new ones. Principles with consistently low scores are eventually pruned from the library.

第三，每条原则根据其使用记录获得质量评分。评分公式为 s(p) = (c_succ + 1) / (c_use + 2)，其中 c_succ 是原则在成功交互中被使用的次数，c_use 是其被使用的总次数。这个拉普拉斯平滑的成功率自然地平衡了利用已验证原则与探索新原则之间的关系。持续低分的原则最终会从库中被修剪。

---

## 4. GRPO and Composite Rewards / GRPO 与复合奖励

EvolveR uses Group Relative Policy Optimization (GRPO) for policy evolution. GRPO is a variant of policy gradient methods that computes advantages relative to a group of sampled responses, rather than requiring a separate value network. For each prompt, multiple responses are sampled, scored by the reward function, and the policy is updated to increase the probability of higher-reward responses.

EvolveR 使用群组相对策略优化（GRPO）进行策略进化。GRPO 是策略梯度方法的一种变体，它相对于一组采样响应计算优势值，而不需要单独的价值网络。对于每个提示，采样多个响应，由奖励函数评分，然后更新策略以增加更高奖励响应的概率。

The reward function is composite, combining two signals. The outcome reward measures whether the agent produced a correct final answer. The format reward ensures that the agent follows the expected action protocol (proper use of search_experience, search_knowledge, and answer actions). This dual objective prevents the agent from learning shortcuts that produce correct answers through degenerate action sequences.

奖励函数是复合的，结合了两个信号。结果奖励衡量智能体是否产生了正确的最终答案。格式奖励确保智能体遵循预期的动作协议（正确使用 search_experience、search_knowledge 和 answer 动作）。这种双重目标防止智能体学习通过退化的动作序列产生正确答案的捷径。

---

## 5. Key Experimental Findings / 关键实验发现

The most surprising result is the performance of self-distillation at small scale. When using a 3B parameter model, principles distilled by the model itself lead to better downstream performance than principles provided by a larger teacher model (such as a 70B model or GPT-4). This suggests that self-generated principles are better calibrated to the model's own capabilities and reasoning patterns.

最令人惊讶的结果是小规模下自蒸馏的性能。当使用 30 亿参数的模型时，模型自身蒸馏的原则比由更大教师模型（如 700 亿参数模型或 GPT-4）提供的原则能带来更好的下游性能。这表明自生成的原则更好地校准了模型自身的能力和推理模式。

The experience library grows organically during training, with principles being added, updated, and pruned based on their effectiveness. The quality scoring mechanism ensures that the library converges toward a set of genuinely useful strategies. Analysis of the final principle libraries reveals interpretable, domain-specific strategies that align with expert intuitions about effective problem-solving approaches.

经验库在训练过程中有机增长，原则根据其有效性被添加、更新和修剪。质量评分机制确保库收敛到一组真正有用的策略。对最终原则库的分析揭示了可解释的、领域特定的策略，这些策略与专家关于有效问题解决方法的直觉一致。

The closed-loop nature of the system produces compounding improvements: better principles lead to better interactions, which generate better trajectories, which distill into even better principles. This virtuous cycle is the essence of self-evolution.

系统的闭环特性产生了复合改进：更好的原则带来更好的交互，产生更好的轨迹，蒸馏出更好的原则。这种良性循环是自进化的本质。

---

## 6. Comparison with RAG-Based Approaches / 与基于 RAG 方法的比较

Traditional experience-augmented agents store raw interaction traces and retrieve them at inference time. EvolveR improves upon this in several ways. First, abstract principles consume far less context than raw trajectories, allowing the agent to leverage more experience within its context window. Second, principles generalize across tasks, while raw traces are often too specific to transfer. Third, the quality scoring mechanism automatically curates the experience library, while RAG approaches typically require manual curation or heuristic filtering.

传统的经验增强智能体存储原始交互轨迹并在推理时检索。EvolveR 在多个方面进行了改进。首先，抽象原则比原始轨迹消耗更少的上下文，使智能体能在其上下文窗口内利用更多经验。其次，原则可以跨任务泛化，而原始轨迹通常过于具体而难以迁移。第三，质量评分机制自动策展经验库，而 RAG 方法通常需要人工策展或启发式过滤。

---

## 7. Limitations / 局限性

EvolveR requires a reliable success signal to identify successful trajectories for distillation. In domains where success is ambiguous or delayed, the distillation process may be less effective. Additionally, the GRPO training step requires significant computational resources, making the full lifecycle more expensive than pure inference-time methods. The quality of distilled principles depends on the model's ability to self-reflect accurately, which may be limited for smaller models.

EvolveR 需要可靠的成功信号来识别用于蒸馏的成功轨迹。在成功信号模糊或延迟的领域，蒸馏过程可能效果较差。此外，GRPO 训练步骤需要大量计算资源，使完整生命周期比纯推理时方法更昂贵。蒸馏原则的质量取决于模型准确自我反思的能力，这对于较小的模型可能有限。

---

## 8. Conclusion / 结论

EvolveR presents a compelling vision for self-evolving LLM agents. By distilling interaction experience into abstract strategic principles and using those principles to guide policy evolution, the framework creates a genuine learning loop that improves agent performance over time. The finding that self-distillation outperforms teacher-model guidance at small scale is particularly significant, as it suggests that the most valuable knowledge for an agent is knowledge about its own effective strategies — a form of self-awareness that cannot be easily transferred from external sources. EvolveR points toward a future where deployed agents accumulate operational wisdom and continuously refine their behavior, much like human experts who improve through practice and reflection.

EvolveR 为自进化 LLM 智能体提出了一个引人注目的愿景。通过将交互经验蒸馏为抽象策略原则，并使用这些原则指导策略进化，该框架创建了一个真正的学习循环，随时间推移改进智能体性能。自蒸馏在小规模下优于教师模型指导这一发现尤为重要，因为它表明对智能体最有价值的知识是关于其自身有效策略的知识——一种无法从外部来源轻易迁移的自我意识形式。EvolveR 指向一个未来，在那里部署的智能体积累操作智慧并持续精炼其行为，就像通过实践和反思不断提升的人类专家一样。
