# Direct Preference Optimization: Your Language Model is Secretly a Reward Model

> **原文链接:** [arXiv:2305.18290](https://arxiv.org/abs/2305.18290)
>
> **作者:** Rafael Rafailov, Archit Sharma, Eric Mitchell, Stefano Ermon, Christopher D. Manning, Chelsea Finn（Stanford）
>
> **发表:** NeurIPS 2023（Outstanding Paper Award）
>
> **代码:** [github.com/eric-mitchell/direct-preference-optimization](https://github.com/eric-mitchell/direct-preference-optimization)
>
> **主题:** 用**一个简单的交叉熵损失**替代 RLHF 的整套流程——**不需要训练 reward model，不需要 PPO，不需要 RL 基础设施**。直接用偏好数据微调 LLM。2024 年起成为事实新标准，Llama 3、Mistral、Qwen 等主流模型都用 DPO 或其变种做对齐。

---

## 为什么这篇重要 / Why This Matters

2023 年前做对齐的标准流程（RLHF）是这样的：

```
步骤 1：从偏好数据训练一个 reward model（RM）——需要大量工程
步骤 2：用 RM 打分，通过 PPO 强化学习微调 LLM——需要 RL 基础设施、调参极难
步骤 3：跑 KL-penalty 稳定训练——引入新的超参数
```

这套流程**只有 OpenAI / Anthropic / Meta 等大公司才玩得起**。学术界和中小公司几乎无法做 RLHF。

DPO 的贡献是：**把这整套流程压缩成一个单一的监督损失函数**。同样的偏好数据，用 DPO 训练：

- **不需要 RM**
- **不需要 PPO 或任何 RL**
- **只需要一个普通的 Transformer 训练循环**
- **效果通常和 RLHF 持平甚至更好**

这是**RLHF 民主化**的转折点——之后 Mistral / Qwen / Llama / DeepSeek 全部切到 DPO 或其变种。

---

## 1. 核心数学推导 / The Core Derivation

### 1.1 RLHF 目标

RLHF 想优化的目标是：

$$
\max_{\pi_\theta} \mathbb{E}_{x \sim D, y \sim \pi_\theta(\cdot|x)} [r(x, y)] - \beta \cdot \text{KL}(\pi_\theta(\cdot|x) \| \pi_{\text{ref}}(\cdot|x))
$$

用中文说：**让模型 πθ 产出的 reward 尽量高，同时不要离参考模型 π_ref 太远**。

### 1.2 关键洞察：最优策略有闭式解

上面那个目标函数的**最优解**有闭式形式：

$$
\pi^*(y|x) = \frac{1}{Z(x)} \pi_{\text{ref}}(y|x) \exp\left(\frac{1}{\beta} r(x, y)\right)
$$

把它反推出 reward：

$$
r(x, y) = \beta \log \frac{\pi^*(y|x)}{\pi_{\text{ref}}(y|x)} + \beta \log Z(x)
$$

**这意味着：你的模型的 log-ratio 本身就是一个 reward model**——训练 LLM 的同时就在训练一个隐式的 reward model。

### 1.3 用到偏好数据上

偏好数据 `(x, y_w, y_l)` 表示"在 prompt x 下，y_w 比 y_l 更好"。用 Bradley-Terry 模型建模：

$$
P(y_w \succ y_l) = \sigma(r(x, y_w) - r(x, y_l))
$$

把 r 用上面的式子代入（Z(x) 项相消），得到 **DPO loss**：

$$
L_{\text{DPO}} = -\log \sigma\left(\beta \log \frac{\pi_\theta(y_w|x)}{\pi_{\text{ref}}(y_w|x)} - \beta \log \frac{\pi_\theta(y_l|x)}{\pi_{\text{ref}}(y_l|x)}\right)
$$

**这就是全部了**——一个 sigmoid + log-ratio 差。用标准 SGD / AdamW 训练。

---

## 2. DPO Loss 直观理解 / Intuitive Understanding

抛开数学，DPO 在做什么？

```
目标：让偏好答案 y_w 的概率相对参考模型 提升
      让非偏好答案 y_l 的概率相对参考模型 下降
```

具体看 loss 里的两个项：

| 项 | 含义 |
|---|---|
| $\log \pi_\theta(y_w\|x) - \log \pi_{\text{ref}}(y_w\|x)$ | 偏好答案相对参考模型的 log-odds 变化，**希望它变大（正）** |
| $\log \pi_\theta(y_l\|x) - \log \pi_{\text{ref}}(y_l\|x)$ | 非偏好答案相对参考模型的 log-odds 变化，**希望它变小（负）** |

**β 的作用**：控制 KL divergence 约束的强度。β 大 → 更保守，不要偏离参考模型；β 小 → 更激进，追求拟合偏好。典型 β = 0.1-0.5。

---

## 3. 训练流程 / The Training Recipe

和 RLHF 的巨大差别：

| 阶段 | RLHF | DPO |
|---|---|---|
| **预训练** | 一样 | 一样 |
| **SFT（监督微调）** | 一样 | 一样 |
| **偏好数据收集** | 一样 | 一样 |
| **对齐阶段** | 训 RM + PPO | **一个训练循环** |
| **需要的基础设施** | RL trainer、PPO、多 model rollout | 标准 `Trainer.train()` |
| **显存占用** | πθ + π_ref + RM + Value Network（4 个模型） | πθ + π_ref（2 个模型） |
| **训练稳定性** | 很难调 | 和 SFT 一样稳 |
| **超参数** | 很多（PPO clip、value loss coef、...） | 少（β, lr） |

**最简 DPO 训练代码（HuggingFace TRL 库）：**

```python
from trl import DPOTrainer, DPOConfig
from datasets import load_dataset

dataset = load_dataset("anthropic/hh-rlhf")

trainer = DPOTrainer(
    model=my_sft_model,        # 已经 SFT 过的模型
    ref_model=my_ref_model,    # 通常就是 SFT 模型的拷贝（冻结）
    args=DPOConfig(
        beta=0.1,
        learning_rate=5e-7,
        per_device_train_batch_size=4,
    ),
    train_dataset=dataset["train"],
    tokenizer=tokenizer,
)

trainer.train()
```

**和训练 SFT 一样简单**——唯一的不同是数据格式变成 `(prompt, chosen, rejected)` 三元组。

---

## 4. 关键结果 / Key Results

### TL;DR: IMDB 生成可控性任务

| 方法 | Reward vs KL |
|---|---|
| SFT | baseline |
| PPO-based RLHF | achieves frontier |
| **DPO** | **achieves same frontier** |

### AlpacaEval 2.0 (LLM-as-judge)

2024 年之后主流开源对齐模型：

| 模型 | 对齐方法 |
|---|---|
| Llama 3 70B Instruct | DPO |
| Mistral 7B Instruct v0.2 | DPO |
| Qwen2.5 Instruct series | DPO + SimPO |
| Zephyr 7B β | DPO (HuggingFace 示范) |
| Tulu 2 | DPO |

**DPO 已经是开源模型对齐的默认选项**。

---

## 5. DPO 的变种生态 / DPO Variants Ecosystem

DPO 原始版本开启了一个"简化 RLHF"的研究浪潮。重要变种：

| 变种 | 核心改动 | 适用场景 |
|---|---|---|
| **IPO** (Identity Preference Optimization) | 修正 DPO 的过拟合问题 | 高噪声偏好数据 |
| **KTO** (Kahneman-Tversky Optimization) | 不需要偏好对，只需要 "好/坏" 二元标签 | 数据便宜，但一次只能标一条 |
| **SimPO** (2024) | 去掉 reference model，用 length-normalized reward | 省显存，效果常更好 |
| **ORPO** (2024) | 把 SFT 和对齐合并成一步 | 极简训练 pipeline |
| **DPO-Positive** | 只用正样本的变种 | 没有"差答案"对比的场景 |

**2025 年工程实践：** 标准起点是 DPO 或 SimPO。KTO 在某些生产任务（客服质量标注）上更实用。

---

## 6. 工程师视角的关键启示 / Key Takeaways

### 6.1 对齐现在是小公司也能做的事

DPO 之前：对齐 = 大厂特权
DPO 之后：任何一个能做 SFT 的团队都能做 DPO

**2025 年的对齐基准栈：**
```
SFT (高质量数据 + LoRA)
    ↓
DPO 或 KTO / SimPO (偏好数据)
    ↓
（可选）RLVR / GRPO (可验证任务，如数学、代码)
```

### 6.2 偏好数据的质量决定效果

DPO 把工程难点从**算法**转移到了**数据**：

- 偏好对的**差别要明显**（`y_w` 显著优于 `y_l`），否则 DPO 学不到信号
- **标注一致性**比**标注量大**重要
- 数据里要有**多样化的"坏答案"类型**（safety 问题、事实错误、逻辑错误、语气问题各种）

### 6.3 β 的调试直觉

- β 过大（e.g., 1.0）→ 模型几乎不变——你在训练"安慰剂"
- β 过小（e.g., 0.01）→ 模型剧烈偏离参考，产生 reward hacking 行为
- **起始 β = 0.1-0.3**，根据 eval 调整

### 6.4 LoRA + DPO 是消费级硬件对齐栈

QLoRA + DPO = 单张 A100（或 RTX 4090）上对齐 7B-13B 模型。TRL 库内置支持：

```python
trainer = DPOTrainer(
    model=model,
    args=DPOConfig(...),
    peft_config=LoraConfig(r=16, ...),  # LoRA 开启
    train_dataset=preference_data,
)
```

这是今天大部分开源对齐项目的默认栈。

### 6.5 DPO 不能解决 reasoning 类任务

DPO 的偏好学习本质是"让偏好答案概率变高"——**对需要分步推理、可验证结果的任务效果有限**。2024-2025 年针对这类任务的做法是 **GRPO**（DeepSeek-R1 用的）或 **PPO + 可验证 reward**（参考 DeepSeek-R1 文章）。

---

## 7. 与本仓库其他文章的关联 / Relation to Other Papers

| 文章 | 关系 |
|---|---|
| [DeepSeek-R1](deepseek-r1.md) | R1 用 GRPO（DPO 的 RL 版本）训练 reasoning；DPO 处理对齐、GRPO 处理 reasoning |
| [LoRA](lora.md) | LoRA + DPO 是消费级微调对齐的黄金组合 |
| [SPIN](../self-improving-agents/spin.md) | 都是"不需要大量人工标注的训练方法"，SPIN 是自博弈，DPO 是偏好对比 |
| [Cherry LLM](../self-improving-agents/cherry-llm.md) | 可以用 Cherry IFD 选高质量 SFT 数据，再用 DPO 做对齐，整套 pipeline 极小 |
| [Metacognitive Learning](../self-improving-agents/metacognitive-learning.md) | DPO 是 self-improvement 的一块基础能力 |

---

## 为什么是 Tier-S / Why This Is Tier-S

- **改变了整个行业的对齐实践**：2023 年后主流开源模型全部切到 DPO
- **数学优雅 + 工程简洁**：论文本身只有几页，但思想完整闭合
- **民主化了大模型对齐**：RLHF 曾经是大厂专利，DPO 让每个中小团队都能做
- **持续衍生新范式**：IPO/KTO/SimPO/ORPO/GRPO 都是 DPO 思想的变种

---

## References / 参考

- **论文:** [Direct Preference Optimization: Your Language Model is Secretly a Reward Model](https://arxiv.org/abs/2305.18290)
- **代码:**
  - 原始: [eric-mitchell/direct-preference-optimization](https://github.com/eric-mitchell/direct-preference-optimization)
  - 生产: [huggingface/trl](https://github.com/huggingface/trl) — 包括 DPO / KTO / SimPO / ORPO 等全系列
- **相关论文:**
  - [KTO: Model Alignment as Prospect Theoretic Optimization](https://arxiv.org/abs/2402.01306)
  - [SimPO: Simple Preference Optimization with a Reference-Free Reward](https://arxiv.org/abs/2405.14734)
  - [ORPO: Monolithic Preference Optimization without Reference Model](https://arxiv.org/abs/2403.07691)
- **作者:**
  - Rafael Rafailov ([@rm_rafailov on X](https://x.com/rm_rafailov))
  - Chelsea Finn ([@chelseabfinn on X](https://x.com/chelseabfinn)) — Stanford IRIS lab
- **本仓库相关:**
  - [DeepSeek-R1](deepseek-r1.md)
  - [LoRA](lora.md)
  - [SPIN](../self-improving-agents/spin.md)
