# MemoryBank: Enhancing Large Language Models with Long-Term Memory

> **原文链接:** [arXiv:2305.10250](https://arxiv.org/abs/2305.10250)
> **作者:** Wanjun Zhong, Lianghong Guo, Qiqi Gao, He Ye, Yanlin Wang
> **发表:** AAAI 2024
> **主题:** 基于艾宾浩斯遗忘曲线的 LLM 长期记忆系统

---

## Abstract

Large Language Models (LLMs) have demonstrated remarkable capabilities in natural language understanding and generation, yet they fundamentally lack the ability to retain information across sessions. MemoryBank addresses this limitation by equipping LLMs with an explicit long-term memory mechanism. The system provides three core functions: memory storage, memory retrieval, and a memory intensity update mechanism inspired by the Ebbinghaus Forgetting Curve. By modeling how humans naturally forget and reinforce memories over time, MemoryBank enables LLMs to maintain persistent, evolving knowledge about users and past interactions. The authors apply MemoryBank to build SiliconFriend, a long-term AI companion chatbot that can remember user preferences, track emotional states, and adapt its personality over extended conversations.

## 摘要

大型语言模型（LLM）在自然语言理解与生成方面展现出卓越的能力，但其根本性的缺陷在于无法跨会话保留信息。MemoryBank 通过为 LLM 配备显式的长期记忆机制来解决这一局限。该系统提供三大核心功能：记忆存储、记忆检索以及基于艾宾浩斯遗忘曲线的记忆强度更新机制。通过模拟人类自然遗忘和强化记忆的过程，MemoryBank 使 LLM 能够维持关于用户和过往交互的持久且不断演化的知识。作者将 MemoryBank 应用于构建 SiliconFriend——一个能够记住用户偏好、追踪情绪状态并在长期对话中调整自身个性的长期 AI 伴侣聊天机器人。

---

## 1. Introduction / 引言

Current LLMs operate in a stateless fashion: each conversation begins from scratch, with no recollection of prior interactions. This is fundamentally at odds with how human relationships develop, where shared history and accumulated understanding form the basis of meaningful communication. A human friend remembers your birthday, knows your preferences, and recalls that you were stressed about a job interview last week. Current AI systems cannot do any of this.

MemoryBank proposes a solution by introducing an external memory system that works alongside the LLM. Rather than modifying the model's parameters, MemoryBank operates as a middleware layer that intercepts conversations, extracts meaningful information, stores it in a structured memory bank, and retrieves relevant memories when needed. The key innovation is the memory intensity update mechanism, which uses the Ebbinghaus Forgetting Curve to naturally decay unimportant memories while reinforcing frequently accessed or emotionally significant ones.

当前的 LLM 以无状态方式运行：每次对话都从零开始，对之前的交互毫无记忆。这与人类关系的发展方式根本矛盾——在人际交往中，共同的历史和积累的理解构成了有意义沟通的基础。一个人类朋友会记住你的生日，了解你的偏好，还记得你上周因求职面试而倍感压力。当前的 AI 系统无法做到这些。

MemoryBank 通过引入一个与 LLM 协同工作的外部记忆系统来解决这一问题。它不修改模型参数，而是作为中间件层运行——拦截对话、提取有意义的信息、将其存储在结构化的记忆库中，并在需要时检索相关记忆。其关键创新在于记忆强度更新机制，该机制利用艾宾浩斯遗忘曲线使不重要的记忆自然衰减，同时强化频繁访问或情感上重要的记忆。

---

## 2. Architecture / 系统架构

MemoryBank's architecture consists of three tightly integrated components that work together to simulate human-like memory processes.

**Memory Storage** is the foundation of the system. After each conversation, MemoryBank processes the dialogue and stores three types of information: (1) daily conversation summaries that capture the key events and topics discussed, (2) user personality assessments that build a profile of the user's traits, interests, and communication style over time, and (3) emotional state tracking that monitors the user's mood across sessions. This multi-faceted storage approach ensures that the system captures not just factual information but also the emotional and psychological dimensions of interactions.

**Memory Retrieval** leverages vector encoding to efficiently find relevant memories. When a new conversation begins, the system encodes the current context and performs similarity search against the stored memory vectors. This allows MemoryBank to surface contextually appropriate memories without requiring exact keyword matches, enabling more natural and fluid recall.

**Memory Intensity Update** is the most novel component. Each stored memory is assigned a strength value that evolves over time according to the Ebbinghaus Forgetting Curve. The forgetting function follows an exponential decay model, where memory strength decreases as time passes since the last access. However, memories that are accessed frequently or marked as important receive strength boosts, counteracting the natural decay. This creates a dynamic system where important and recent memories remain vivid while trivial details gradually fade — closely mirroring how human memory actually works.

MemoryBank 的架构由三个紧密集成的组件构成，它们协同工作以模拟类人的记忆过程。

**记忆存储**是系统的基础。每次对话结束后，MemoryBank 处理对话内容并存储三类信息：（1）每日对话摘要，捕捉讨论的关键事件和话题；（2）用户人格评估，随时间构建用户的性格特征、兴趣和沟通风格画像；（3）情绪状态追踪，跨会话监测用户的情绪变化。这种多维度的存储方式确保系统不仅捕获事实信息，还涵盖交互的情感和心理维度。

**记忆检索**利用向量编码来高效查找相关记忆。当新对话开始时，系统对当前上下文进行编码，并对存储的记忆向量执行相似性搜索。这使 MemoryBank 能够在不需要精确关键词匹配的情况下呈现上下文相关的记忆，实现更加自然和流畅的回忆。

**记忆强度更新**是最具创新性的组件。每条存储的记忆都被分配一个强度值，该值随时间按照艾宾浩斯遗忘曲线演化。遗忘函数遵循指数衰减模型，记忆强度随最后一次访问后的时间推移而降低。然而，被频繁访问或标记为重要的记忆会获得强度提升，以抵消自然衰减。这创造了一个动态系统，其中重要的和近期的记忆保持鲜明，而琐碎的细节逐渐消退——这与人类记忆的实际运作方式高度吻合。

---

## 3. Ebbinghaus Forgetting Curve / 艾宾浩斯遗忘曲线

The Ebbinghaus Forgetting Curve, first described by Hermann Ebbinghaus in 1885, is a well-established psychological model that describes how memory retention declines exponentially over time. The core formula used in MemoryBank models memory strength as:

```
R = e^(-t/S)
```

Where `R` is the retention rate, `t` is the time elapsed since the memory was last reinforced, and `S` is the stability factor that depends on the importance and frequency of the memory. A higher stability factor means the memory decays more slowly.

In MemoryBank's implementation, the stability factor is determined by multiple signals: the emotional intensity of the original conversation, the number of times the memory has been retrieved, the relevance of the memory to the user's core personality traits, and explicit importance markers. This multi-signal approach allows the system to make nuanced decisions about which memories to preserve and which to let fade.

When memory strength drops below a configurable threshold, the memory is not immediately deleted but is instead moved to a low-priority archive. This mirrors how human long-term memory works: we do not truly "forget" most experiences, but they become increasingly difficult to retrieve without strong contextual cues.

艾宾浩斯遗忘曲线由赫尔曼·艾宾浩斯于 1885 年首次描述，是一个成熟的心理学模型，描述了记忆保留率如何随时间呈指数级下降。MemoryBank 中使用的核心公式将记忆强度建模为：

```
R = e^(-t/S)
```

其中 `R` 是记忆保留率，`t` 是自上次强化记忆以来经过的时间，`S` 是稳定性因子，取决于记忆的重要性和访问频率。稳定性因子越高，记忆衰减越慢。

在 MemoryBank 的实现中，稳定性因子由多个信号决定：原始对话的情感强度、记忆被检索的次数、记忆与用户核心人格特征的相关性以及显式的重要性标记。这种多信号方法使系统能够对保留哪些记忆、让哪些记忆消退做出细致的判断。

当记忆强度降至可配置阈值以下时，该记忆不会被立即删除，而是被移至低优先级归档区。这模拟了人类长期记忆的工作方式：我们并非真正"忘记"大多数经历，只是在缺乏强烈上下文线索的情况下，这些经历变得越来越难以检索。

---

## 4. SiliconFriend Application / SiliconFriend 应用

To demonstrate MemoryBank's practical value, the authors built SiliconFriend, an AI companion chatbot designed for long-term emotional support and companionship. SiliconFriend goes beyond typical chatbots by maintaining a persistent understanding of the user that deepens over time.

The chatbot was fine-tuned using psychological dialogue data, which gave it the ability to provide empathetic responses, recognize emotional patterns, and offer appropriate support based on the user's mental state. Combined with MemoryBank's long-term memory, SiliconFriend can reference past conversations naturally, notice changes in the user's emotional trajectory, and adapt its communication style to match the user's preferences.

For example, if a user mentioned feeling anxious about an upcoming presentation two weeks ago, SiliconFriend can proactively ask how the presentation went in a subsequent conversation. If the user consistently shows signs of stress on Monday mornings, the system can learn this pattern and offer encouragement at the right time.

The evaluation showed that SiliconFriend with MemoryBank significantly outperformed baseline models without memory in terms of user engagement, conversation coherence across sessions, and perceived empathy. Users reported feeling that the AI genuinely "knew" them after extended use.

为展示 MemoryBank 的实际价值，作者构建了 SiliconFriend，一个专为长期情感支持和陪伴设计的 AI 伴侣聊天机器人。SiliconFriend 超越了典型聊天机器人的范畴，通过维持对用户持续深化的理解来实现差异化。

该聊天机器人使用心理学对话数据进行微调，使其具备提供共情回应、识别情绪模式以及根据用户心理状态提供适当支持的能力。结合 MemoryBank 的长期记忆，SiliconFriend 能够自然地引用过去的对话，注意到用户情绪轨迹的变化，并调整其沟通风格以匹配用户的偏好。

例如，如果用户两周前提到对即将到来的演讲感到焦虑，SiliconFriend 可以在后续对话中主动询问演讲进展如何。如果用户在周一早晨持续表现出压力迹象，系统可以学习这一模式并在适当时机提供鼓励。

评估结果表明，配备 MemoryBank 的 SiliconFriend 在用户参与度、跨会话对话连贯性和感知共情能力方面显著优于无记忆的基线模型。用户反馈称，经过长时间使用后，他们感觉 AI 真正"了解"了自己。

---

## 5. Evaluation and Results / 评估与结果

The authors evaluated MemoryBank across multiple dimensions. Quantitative metrics included memory retrieval accuracy, conversation coherence scores, and user satisfaction ratings. Qualitative evaluation involved human judges assessing the naturalness of memory-augmented responses.

Key findings include: (1) the forgetting curve mechanism effectively prioritized important memories, with high-importance memories retaining over 90% strength after one week while low-importance memories decayed to below 30%; (2) vector-based retrieval achieved high accuracy in surfacing contextually relevant memories; and (3) the combination of personality tracking and emotional state monitoring enabled significantly more personalized interactions compared to simple conversation history approaches.

The work also revealed limitations. The system's performance depends heavily on the quality of the summarization component, and errors in initial memory encoding can propagate through subsequent interactions. Additionally, the forgetting curve parameters require careful tuning for different application domains.

作者从多个维度评估了 MemoryBank。定量指标包括记忆检索准确率、对话连贯性评分和用户满意度评级。定性评估由人类评审员评估记忆增强回应的自然程度。

关键发现包括：（1）遗忘曲线机制有效地对重要记忆进行了优先排序，高重要性记忆在一周后保持超过 90% 的强度，而低重要性记忆衰减至 30% 以下；（2）基于向量的检索在呈现上下文相关记忆方面实现了高准确率；（3）人格追踪与情绪状态监测的结合，相比简单的对话历史方法，显著提升了交互的个性化程度。

该研究也揭示了局限性。系统性能高度依赖摘要组件的质量，初始记忆编码中的错误可能在后续交互中传播。此外，遗忘曲线参数需要针对不同应用领域进行仔细调优。

---

## 6. Significance and Future Directions / 意义与未来方向

MemoryBank represents an important step toward AI systems that can form lasting relationships with users. By grounding the memory mechanism in established psychological principles, the system achieves a balance between remembering too much (which would be computationally expensive and potentially creepy) and too little (which would prevent meaningful long-term interaction).

The Ebbinghaus Forgetting Curve approach is particularly elegant because it requires no manual curation of memories. The system self-organizes over time, with important memories naturally rising to the top and irrelevant ones fading away. This mirrors the effortless nature of human memory management and avoids the need for explicit "remember this" or "forget that" commands.

Future directions include integrating MemoryBank with multimodal models to store visual and auditory memories, extending the framework to support multi-user scenarios where the AI maintains separate memory banks for different individuals, and exploring how the forgetting curve parameters could be personalized based on individual user behavior patterns.

MemoryBank 代表了朝向能够与用户建立持久关系的 AI 系统迈出的重要一步。通过将记忆机制建立在成熟的心理学原理之上，该系统在记住过多（计算成本高且可能令人不安）和记住过少（无法实现有意义的长期交互）之间取得了平衡。

艾宾浩斯遗忘曲线方法尤为优雅，因为它不需要对记忆进行人工管理。系统随时间自组织，重要记忆自然上浮到顶部，无关记忆逐渐消退。这反映了人类记忆管理的自然特性，避免了对显式"记住这个"或"忘记那个"命令的需求。

未来方向包括：将 MemoryBank 与多模态模型集成以存储视觉和听觉记忆，扩展框架以支持 AI 为不同个体维护独立记忆库的多用户场景，以及探索如何根据个体用户的行为模式来个性化遗忘曲线参数。

---

## 7. Comparison with Other Memory Systems / 与其他记忆系统的对比

MemoryBank distinguishes itself from other memory-augmented LLM systems in several important ways. Unlike MemGPT, which focuses on virtual context management through OS-inspired paging mechanisms, MemoryBank centers its design on psychologically grounded memory dynamics. Where MemGPT treats memory as an engineering problem of fitting information into limited space, MemoryBank treats it as a cognitive modeling problem of determining what should be remembered and how strongly.

Compared to simple RAG (Retrieval-Augmented Generation) approaches, MemoryBank adds the critical dimension of temporal dynamics. In a standard RAG system, all stored information is treated equally — a fact stored yesterday has the same retrieval priority as one stored a year ago, assuming equal relevance scores. MemoryBank's forgetting curve introduces a natural temporal bias that favors recent and frequently reinforced information, which better matches the patterns of human conversation where recent context is typically more relevant.

The personality and emotion tracking components further differentiate MemoryBank from purely factual memory systems. Most memory-augmented LLMs focus exclusively on storing and retrieving factual information. MemoryBank recognizes that effective long-term interaction requires understanding the user as a whole person, including their emotional patterns, communication preferences, and personality traits. This holistic approach enables a qualitatively different kind of AI-human relationship.

MemoryBank 在几个重要方面与其他记忆增强型 LLM 系统有所区别。与 MemGPT 通过受操作系统启发的页面调度机制专注于虚拟上下文管理不同，MemoryBank 将其设计核心放在基于心理学的记忆动态上。MemGPT 将记忆视为一个将信息装入有限空间的工程问题，而 MemoryBank 将其视为一个确定应该记住什么以及记忆强度如何变化的认知建模问题。

与简单的 RAG（检索增强生成）方法相比，MemoryBank 增加了时间动态这一关键维度。在标准 RAG 系统中，所有存储的信息被同等对待——假设相关性分数相同，昨天存储的事实与一年前存储的事实具有相同的检索优先级。MemoryBank 的遗忘曲线引入了一种自然的时间偏向，偏好近期和频繁强化的信息，这更符合人类对话的模式，其中近期上下文通常更为相关。

人格和情绪追踪组件进一步将 MemoryBank 与纯事实性记忆系统区分开来。大多数记忆增强型 LLM 仅专注于存储和检索事实信息。MemoryBank 认识到有效的长期交互需要将用户作为完整的个体来理解，包括其情绪模式、沟通偏好和人格特征。这种整体性方法使得一种质的不同的 AI-人类关系成为可能。

---

## 8. Technical Implementation Details / 技术实现细节

The implementation of MemoryBank involves several technical components that work together seamlessly. The memory encoding pipeline uses a pre-trained sentence transformer model to convert conversation segments into dense vector representations. These vectors are stored in a vector database that supports efficient approximate nearest neighbor search, enabling fast retrieval even as the memory store grows to contain thousands of entries.

The summarization component uses the LLM itself to generate concise summaries of each conversation session. These summaries are stored alongside the raw conversation data, providing two levels of granularity for memory retrieval. For broad context queries, the system searches against summaries; for specific detail queries, it searches against individual conversation turns.

The personality assessment module maintains a running profile of the user that is updated after each interaction. Rather than overwriting previous assessments, the system maintains a time-stamped history of personality observations, allowing it to track how the user's interests, communication style, and emotional baseline evolve over time. This temporal dimension adds richness to the personality model that static profiles cannot capture.

Memory consolidation runs as a background process between sessions. During consolidation, the system reviews recent memories, updates strength values according to the forgetting curve, merges related memories into more comprehensive summaries, and archives memories that have fallen below the retention threshold. This process ensures that the memory store remains compact and high-quality rather than growing unboundedly.

MemoryBank 的实现涉及多个技术组件，它们无缝协同工作。记忆编码管线使用预训练的句子转换模型将对话片段转换为稠密向量表示。这些向量存储在支持高效近似最近邻搜索的向量数据库中，即使记忆存储增长到包含数千条记录，也能实现快速检索。

摘要组件使用 LLM 本身来生成每次对话会话的简洁摘要。这些摘要与原始对话数据一起存储，为记忆检索提供两个粒度层次。对于广泛的上下文查询，系统搜索摘要；对于具体的细节查询，系统搜索单条对话轮次。

人格评估模块维护一个用户画像，在每次交互后更新。系统不是覆盖先前的评估，而是维护一个带时间戳的人格观察历史，使其能够追踪用户的兴趣、沟通风格和情绪基线如何随时间演变。这种时间维度为人格模型增添了静态画像无法捕捉的丰富性。

记忆整合作为会话间的后台进程运行。在整合过程中，系统回顾近期记忆、根据遗忘曲线更新强度值、将相关记忆合并为更全面的摘要，并归档已降至保留阈值以下的记忆。这一过程确保记忆存储保持紧凑和高质量，而非无限制地增长。
