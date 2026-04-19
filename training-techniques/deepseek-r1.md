# DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning

> **原文链接:**
> - 技术报告: [arXiv:2501.12948](https://arxiv.org/abs/2501.12948)
> - GitHub: [deepseek-ai/DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-R1)
> - HuggingFace: [deepseek-ai/DeepSeek-R1](https://huggingface.co/deepseek-ai/DeepSeek-R1)
>
> **作者:** DeepSeek-AI 团队
>
> **发表:** 2025-01-20
>
> **许可:** MIT（模型权重 + 蒸馏模型均开源）
>
> **主题:** 震撼全球 AI 界的开源推理模型。用纯 RL（**无需 SFT 冷启动**）把一个预训练模型直接训出 o1 级推理能力。AIME 2024 达到 79.8%、MATH-500 达到 97.3%。关键算法 **GRPO** 是 RLHF/DPO 之后的重要进展。

---

## 为什么这篇重要 / Why This Matters

2024 年底 OpenAI 发布 o1，行业震惊——**test-time thinking**（测试时长思考）似乎是一种新能力，怎么复现不知道。各家大厂和学术界试了各种模仿方法，效果都不尽如人意。

**2025 年 1 月 DeepSeek 直接开源 R1**，附带完整技术报告 + 权重 + 蒸馏模型——并且：

1. 证明**纯 RL** 不需要 SFT 也能涌现推理能力（R1-Zero 版本）
2. 算力**显著低于** o1 训练预算
3. 蒸馏出的小模型（Qwen-32B-distilled）**击败 o1-mini**
4. **MIT 许可，完全开源**

这篇论文的发布导致了 AI 股市震荡、Meta 启动 Llama 4 回应、整个推理模型训练方法公开化。是 LLM 时代**开源追上甚至超越闭源前沿的标志性事件**。

---

## 1. 关键贡献 / Key Contributions

R1 的技术贡献可以总结成三条：

### 1.1 GRPO: 去 critic 的强化学习

传统 RLHF 用 **PPO**——需要一个 critic（value network）估计状态价值，显存翻倍、训练复杂。

R1 用 **Group Relative Policy Optimization (GRPO)**——**不需要 critic**：

```
对每个 prompt，同时采样 G 个回答（G 通常 = 64）
对这 G 个回答打分（用 reward function）
以这 G 个回答的平均 reward 作为 baseline
梯度 = (reward_i - mean_reward) * log_prob_i
```

**优势：**
- 不需要 value network，显存节省 ~2×
- 天然的方差减少（group baseline）
- 适合可验证任务（reward 是 deterministic 的，比如"答案对不对"）

### 1.2 R1-Zero: 纯 RL 训练（不需要 SFT 冷启动）

大多数人相信"RL 必须从一个 SFT 好的 checkpoint 开始"。R1-Zero 证明**不是**：

- 直接从 base model (DeepSeek-V3 base) 开始
- 用 GRPO + 可验证 reward（数学答案对错、代码 pass/fail）
- 不做任何 SFT

**结果：模型自己涌现出 chain-of-thought、反思、验证步骤**。

报告里的经典图示："aha moment" — 训练中某个步骤，模型突然开始在数学题中间说 *"Wait, let me reconsider..."* 然后自我修正。这不是训练数据里教的，是 RL 中涌现的。

### 1.3 R1: SFT 冷启动 + 多阶段 RL

R1-Zero 有一个问题：语言不流畅、输出可读性差、有时中英文混用。R1（生产版本）通过以下流程解决：

```
1. 少量高质量 reasoning SFT 数据（~1000 样本）做冷启动
2. 第一轮 RL：用 GRPO + reasoning reward 训练
3. Rejection sampling：从 RL 模型采样，筛选高质量输出
4. SFT on 筛选数据（加入通用任务 SFT）
5. 第二轮 RL：加入人类偏好 reward（安全、有用）
```

**四阶段 pipeline** 让 R1 既保留 R1-Zero 的推理能力，又修复了语言问题。

---

## 2. 关键数字 / Key Benchmarks

R1 完整版（671B MoE · 37B 激活）对比 o1：

| Benchmark | DeepSeek-R1 | OpenAI o1-1217 | OpenAI o1-mini |
|---|---|---|---|
| **AIME 2024 (Pass@1)** | **79.8%** | 79.2% | 63.6% |
| **MATH-500 (Pass@1)** | **97.3%** | 96.4% | 90.0% |
| **Codeforces (percentile)** | 96.3% | 96.6% | 93.4% |
| **GPQA Diamond (Pass@1)** | 71.5% | 75.7% | 60.0% |
| **MMLU** | 90.8% | 91.8% | 85.2% |

**R1 在数学上略超 o1，在其他 benchmark 上打平或略输**。这是开源模型**第一次全面追平 o1 水平**。

### 蒸馏模型（更便宜但仍强）

| 蒸馏模型 | AIME 2024 | MATH-500 | 基础模型 |
|---|---|---|---|
| DeepSeek-R1-Distill-Qwen-1.5B | 28.9% | 83.9% | Qwen2.5-Math-1.5B |
| DeepSeek-R1-Distill-Qwen-7B | 55.5% | 92.8% | Qwen2.5-Math-7B |
| DeepSeek-R1-Distill-Qwen-14B | 69.7% | 93.9% | Qwen2.5-14B |
| **DeepSeek-R1-Distill-Qwen-32B** | **72.6%** | **94.3%** | Qwen2.5-32B |
| DeepSeek-R1-Distill-Llama-70B | 70.0% | 94.5% | Llama-3.3-70B |

**Qwen-32B 蒸馏版 AIME 72.6% 超过 o1-mini 的 63.6%**——一张 A100 80GB 跑得动的模型击败 OpenAI 的付费 API。

---

## 3. GRPO 的数学细节 / GRPO Mathematics

GRPO 的损失函数：

$$
\mathcal{L}_{\text{GRPO}} = \mathbb{E}_{x, \{y_i\}_{i=1}^G \sim \pi_\theta} \left[ \frac{1}{G} \sum_{i=1}^G \min\left(\rho_i A_i, \text{clip}(\rho_i, 1-\epsilon, 1+\epsilon) A_i\right) - \beta \cdot \text{KL}(\pi_\theta \| \pi_{\text{ref}}) \right]
$$

其中：

- $\rho_i = \frac{\pi_\theta(y_i|x)}{\pi_{\text{old}}(y_i|x)}$ — importance ratio（和 PPO 一样）
- $A_i = \frac{r_i - \text{mean}(r_1, ..., r_G)}{\text{std}(r_1, ..., r_G)}$ — **group-normalized advantage**（关键创新）
- clip 项防止 policy 更新过激
- KL 项保持和参考模型的距离

**核心 trick：** $A_i$ 用 group mean 和 std 归一化，而不是用 critic。这消除了 PPO 最复杂的那一半。

---

## 4. "Aha Moment" — 推理能力如何涌现 / Emergence of Reasoning

技术报告里最有名的是 Table 3 展示的"aha moment"。以下是一个数学题训练过程中的真实输出：

### R1-Zero 训练步骤 ~1000 的输出：

```
问题：若 x² + ax + b = 0 有两个不同的正整数根，求 a 和 b 的可能值...

Response: Let me compute x = ... We get x = 3 and x = 5. 
Therefore a = -(3+5) = -8 and b = 3·5 = 15.

Wait. Let me re-examine this carefully to make sure I am correct.
Actually, I need to verify: for x = 3, we have 9 - 24 + 15 = 0. ✓
For x = 5, we have 25 - 40 + 15 = 0. ✓
So the answer is a = -8, b = 15.
```

**那句 "Wait. Let me re-examine this carefully..." 不是训练数据里教的**——是 RL 过程中模型发现"在 final answer 之前插入一次自检能显著提升 reward"而自行涌现的行为。

这验证了 Sutton [Bitter Lesson](../ai-thinking/bitter-lesson.md) 的核心论点：**只要给对搜索/学习信号，通用算法会自己发现最优 meta-skill，不需要人类教**。

---

## 5. 训练栈全貌 / Training Stack Overview

```
DeepSeek-V3 base（已预训练）
    │
    ├── 路径 A：R1-Zero
    │     GRPO + 可验证 reward 直接 RL
    │     └─ 涌现推理能力
    │         但语言流畅度差
    │
    └── 路径 B：R1（生产版本）
          1. Cold-start SFT（~1k 高质量 reasoning 样本）
          2. GRPO reasoning RL
          3. Rejection sampling → 再 SFT（加通用任务）
          4. 第二轮 RL（加人类偏好 reward）
          └─ 保留推理 + 修复语言
```

并且对所有 6 个尺寸（1.5B/7B/14B/32B/Llama-70B）做**蒸馏**——用 R1 的 output 作为 SFT 数据训练小模型。蒸馏小模型不做 RL，单 SFT 就能继承大模型的推理能力。

---

## 6. 工程师视角的关键启示 / Key Takeaways

### 6.1 RL 不再是大厂专利

GRPO 把 RL 训练门槛降低了一个数量级：

- 不需要 critic → 显存砍半
- 用可验证 reward → 不需要 human labeling
- 开源参考实现（`verl`、`OpenRLHF` 等）

**2025 年的 trend：** RL 微调从"OpenAI/Anthropic 特权"变成"每个中型团队都能做的事"。

### 6.2 可验证 reward 改变训练思路

R1 成功的前提是 reward 可验证：

- 数学题：答案对错可自动判断
- 代码题：跑 unit test 就知道 pass/fail
- 特定格式任务：regex 匹配输出

**对工程师的启示：** 如果你的任务能设计出可验证 reward，考虑 GRPO 微调；如果不能，考虑 DPO。

### 6.3 蒸馏是 R1 最被低估的贡献

R1 最实用的产品不是 671B 主模型，而是**蒸馏小模型**：

- Qwen-32B-Distill 能在一张 A100 跑
- Qwen-7B-Distill 能在 RTX 4090 跑
- Qwen-1.5B-Distill 能在手机跑

**"大模型做 RL，小模型做蒸馏"** 成为 2025 年新范式。

### 6.4 开源重塑行业

R1 发布后：

- 学术界有了可复现的 o1 级参考
- 中小公司可以基于 R1 做垂直领域微调（法律推理、金融推理、医学推理）
- 闭源模型（o1, Claude Opus）失去技术护城河，只剩产品/工程护城河
- 各大厂加速发布 reasoning 模型（Gemini 2.0 Thinking, GPT-5 Pro, Qwen3-Thinking）

**开源 > 闭源** 这一趋势在 R1 之后几乎不可逆。

### 6.5 实操：用 R1 栈训练你自己的 reasoning 模型

```
1. 选一个开源基础模型（Qwen2.5-Math 或 Llama-3.1）
2. 用 R1 技术报告的 cold-start 配方：1k 高质量 reasoning 样本 SFT
3. 用 verl 或 OpenRLHF 跑 GRPO
4. reward 函数：数学题答案对错 + 格式合规性
5. 训练 1-3 天（单机 8×A100）
```

这套流程已经被 2025 年多个开源复现项目验证（TinyZero、SimpleRL、open-r1 等）。

---

## 7. 与本仓库其他文章的关联 / Relation to Other Papers

| 文章 | 关系 |
|---|---|
| [DPO](dpo.md) | DPO 处理对齐（偏好），GRPO 处理推理（可验证 reward）。**DPO + GRPO 是 2025 年对齐 + 推理的双基础** |
| [LoRA](lora.md) | R1 的多个开源复现用 LoRA + GRPO，降低训练成本到单卡可跑 |
| [autoresearch](../self-improving-agents/autoresearch.md) | Karpathy 的 autoresearch 本质是在 train.py 上应用 R1 的思想：可验证目标（val_bpb）+ 迭代改进 |
| [Bitter Lesson](../ai-thinking/bitter-lesson.md) | R1 是 Bitter Lesson 2025 年最大的印证：不教模型 chain-of-thought，让它自己涌现 |
| [Self-Improving at Test-Time](../self-improving-agents/self-improving-test-time.md) | R1 把 test-time thinking 能力内化；两者互补 |

---

## 为什么是 Tier-S / Why This Is Tier-S

- **开源重塑行业的标志性事件**：R1 之后整个 AI 行业格局变化
- **技术贡献实在**：GRPO 不是营销，是可复现的有效算法
- **完全透明**：权重 + 技术报告 + 数据配方全开源，MIT 许可
- **立即可用**：HuggingFace 上直接跑，或用 API（DeepSeek $0.55/M tokens）
- **持续引发浪潮**：Qwen3、Kimi K2、GLM-5 等后续开源前沿模型都在借鉴 R1 配方

---

## References / 参考

- **技术报告:** [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948)
- **GitHub:** [deepseek-ai/DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-R1)
- **HuggingFace:** [deepseek-ai/DeepSeek-R1](https://huggingface.co/deepseek-ai/DeepSeek-R1)
- **蒸馏系列:**
  - [DeepSeek-R1-Distill-Qwen-32B](https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B)
  - [DeepSeek-R1-Distill-Llama-70B](https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B)
- **开源复现项目:**
  - [Hugging Face open-r1](https://github.com/huggingface/open-r1) — 官方追 R1 复现
  - [SimpleRL](https://github.com/hkust-nlp/simpleRL-reason) — 小规模 R1 风格训练
  - [verl](https://github.com/volcengine/verl) — 字节跳动开源的 RL 训练框架，支持 GRPO
- **相关论文:**
  - [DeepSeek-V3 技术报告](https://github.com/deepseek-ai/DeepSeek-V3) — R1 的 base model
  - [DeepSeekMath (GRPO 最早提出)](https://arxiv.org/abs/2402.03300)
- **本仓库相关:**
  - [DPO](dpo.md) · [LoRA](lora.md)
  - [autoresearch](../self-improving-agents/autoresearch.md) · [Bitter Lesson](../ai-thinking/bitter-lesson.md)
  - [开源模型目录](../open-source-models/README.md)
