# LoRA: Low-Rank Adaptation of Large Language Models

> **原文链接:** [arXiv:2106.09685](https://arxiv.org/abs/2106.09685)
>
> **作者:** Edward J. Hu, Yelong Shen, Phillip Wallis, Zeyuan Allen-Zhu, Yuanzhi Li, Shean Wang, Lu Wang, Weizhu Chen（Microsoft）
>
> **发表:** ICLR 2022 / 2021-06 arXiv 首发
>
> **代码:** [github.com/microsoft/LoRA](https://github.com/microsoft/LoRA) · [HuggingFace PEFT](https://github.com/huggingface/peft)
>
> **主题:** 大模型参数高效微调（PEFT）的**事实标准**。冻结主干模型，只在每个 linear 层旁边训练一对小矩阵 A、B，模型规模降低 **~10,000×**，存储成本降低 **~3×**，训练速度提升，质量**几乎无损**。

---

## 为什么这篇重要 / Why This Matters

没有 LoRA，就没有今天蓬勃的"微调生态"。

- Hugging Face 上有 **数万个** LoRA 适配器共享
- Stable Diffusion 的 LoRA 生态让创作者能轻松分享 style LoRA、character LoRA
- 企业内部微调都基于 LoRA/QLoRA —— 改一次 7B 模型的成本从几万刀降到几百刀
- 消费级显卡（RTX 3090/4090）能微调 13B 甚至 70B 模型——全靠 LoRA + 量化

这是过去 5 年 AI 工程**最实用**的一篇论文——每个做 LLM 应用的人都直接或间接在用它。

---

## 1. 核心洞察 / The Core Insight

### 1.1 全量微调的问题

对 GPT-3 175B 做全量微调：

- 需要存 175B × 4 bytes = **700 GB** 的梯度 + 同样大小的优化器状态
- 每个任务都要存一份完整的 175B 参数
- 训练需要多张 A100 / H100

**完全不可扩展**——你不可能给每个客户 / 每个小任务都存一份 175B。

### 1.2 经验观察：full fine-tune 的权重变化是低秩的

作者观察到：**在下游任务上微调时，权重矩阵的变化 ΔW 通常具有很低的"内在秩"**（intrinsic rank）。

这意味着 ΔW 可以被分解为：

$$
\Delta W = B \cdot A
$$

其中 A 是 `d × r`、B 是 `r × d`，**r ≪ d**（比如 d = 4096, r = 8）。这样 ΔW 的参数量从 **d² 个**降到 **2 × d × r 个**，对 d=4096 和 r=8 来说是 **~512×** 减少。

### 1.3 LoRA 的做法

**冻结原始权重 W₀**，在每个 linear 层旁边加一对可训练小矩阵 A 和 B：

```
输入 x
  │
  ├───▶ W₀ x     (冻结的主路径)
  └───▶ B·A·x    (可训练的低秩旁路)
              │
              ▼
          输出 = W₀·x + B·A·x
```

训练时只更新 A 和 B，推理时可以 **merge 回 W₀**（W₀ + BA 还原成一个普通 linear），**不增加推理延迟**。

### 1.4 关键超参数 r

- **r = 1 到 64** 都能用；常见选择：**4, 8, 16**
- 任务越简单、数据越少，r 可以越小
- r = 8 通常是 good default，和 full fine-tune 的 gap 很小

---

## 2. 关键结果 / Key Results

### GPT-3 175B on RoBERTa benchmarks

| 方法 | 可训练参数 | WikiSQL | MNLI | 存储成本 |
|---|---|---|---|---|
| **Full fine-tune** | 175,255M | 73.8 | 89.5 | 700 GB |
| Adapter (Houlsby et al.) | 40.1M | 73.2 | 91.5 | 1.2 GB |
| Prefix tuning | 3.2M | 63.1 | 87.4 | 0.2 GB |
| **LoRA (r=8)** | **4.7M** | **73.4** | **91.7** | **0.3 GB** |

**LoRA 用了 ~37,000× 更少的参数，效果和全量微调持平或更好**。

### LoRA 的三大优势

1. **参数高效**：只训练 0.01–1% 的参数
2. **存储高效**：每个 adapter 几十 MB 就够，可以为每个客户/每个任务存一份
3. **无推理延迟**：训练后 merge 回主权重，推理时和原模型一样快

---

## 3. 为什么 "低秩假设" 成立 / Why the Low-Rank Assumption Works

这是一个**经验观察**，不是理论证明——但有几个直觉：

### 3.1 预训练已经学到通用表示

大模型在预训练阶段已经学到了语言的通用结构。**下游任务只需要在这个通用表示上做"轻微调整"**。

这种轻微调整自然是低秩的：你不是在重新学语言，只是在激活一些已有通路、抑制另一些。

### 3.2 与 Anthropic / 机制可解释性的关联

Anthropic 等机构的机制可解释性研究后来证实：
- 模型权重里存在大量**稀疏、低秩的"电路"**
- 每个电路负责一种具体能力（e.g., 识别 syntax 模式、检索事实）
- 微调本质是"激活/抑制/重组"这些电路——自然是低秩操作

这给了 LoRA 的低秩假设一个理论底色。

---

## 4. 生态与扩展 / Ecosystem and Extensions

### 4.1 QLoRA (2023) — 量化 + LoRA

[QLoRA](https://arxiv.org/abs/2305.14314) (Tim Dettmers et al.) 把 LoRA 推到了极致：

- 主干模型**量化到 4-bit**，冻结
- LoRA adapter 仍是 fp16 / bf16
- **单张 RTX 3090 (24GB) 微调 33B 模型**；单张 A100 80GB 微调 65B

这是 2023 年**消费级硬件微调大模型的钥匙**。每个做 LLM 的人都该知道 QLoRA。

### 4.2 LoRA 的变种

| 变种 | 特点 | 用途 |
|---|---|---|
| **DoRA** (Liu et al. 2024) | 分解权重的方向和大小 | 更接近 full fine-tune 效果 |
| **LongLoRA** | 专门优化长上下文微调 | 在有限 GPU 上做 100K+ 上下文 |
| **X-LoRA** | 在推理时动态混合多个 LoRA | 一个模型适应多种任务 |
| **Tied LoRA / VeRA** | 跨层参数共享 | 极致参数效率，LoRA 再压 10× |

### 4.3 应用场景

- **Diffusion models**：Stable Diffusion 的 LoRA 生态（character / style LoRAs）
- **LLM 客户化**：每个企业客户一个 LoRA，共享主干
- **多任务服务**：一个 7B 主干 + N 个 LoRA，根据请求路由到不同 LoRA
- **RLHF/DPO 训练**：只用 LoRA 就能做偏好学习（降低 RLHF 成本）

---

## 5. 工程师视角的关键启示 / Key Takeaways

### 5.1 一切微调先试 LoRA

**2025 年工程默认：**
- 想微调 LLM → LoRA 或 QLoRA 优先
- 内存不够 → 加大量化 / 减小 r / 减小 batch
- LoRA 效果不够 → **才**考虑全量微调（通常用不到）

### 5.2 超参数的实用建议

```
r: 8 是 good default
   小任务（classification）：r=4 够
   大任务（domain adaptation）：r=16-32
   
lora_alpha: 一般设成 r 的 1-2 倍（scaling factor）
            alpha/r 太大会过拟合

target_modules: 
   对 LLaMA/Mistral 类：["q_proj", "v_proj"] 最经济
   追求极致效果：加上 "k_proj", "o_proj"
   非常追求效果：再加 "gate_proj", "up_proj", "down_proj"
```

### 5.3 LoRA merge vs 动态加载

- **Merge 模式（W = W₀ + BA）**：推理无开销，但每个 LoRA 都需要一份完整模型拷贝
- **动态加载（x → W₀x + BAx）**：一个主干 + 多个 LoRA 共享，切换客户/任务零开销，推理有约 5–10% 开销

**建议：** 单任务生产用 merge；多客户 / A-B test / 快速迭代用动态加载。

### 5.4 HuggingFace PEFT 是事实标准

```python
from peft import LoraConfig, get_peft_model

config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=["q_proj", "v_proj"],
    task_type="CAUSAL_LM",
)

model = get_peft_model(base_model, config)
# 现在 model 里只有 LoRA 参数可训练，其他冻结
model.print_trainable_parameters()
# Output: trainable params: 4,194,304 || all params: 6,742,609,920 || trainable%: 0.0622
```

这 4 行代码今天已经成为每个 LLM 工程师的**肌肉记忆**。

---

## 6. 与本仓库其他文章的关联 / Relation to Other Papers

| 文章 | 关系 |
|---|---|
| [DPO](dpo.md) | DPO 训练常结合 LoRA 使用——LoRA 降微调成本，DPO 降对齐成本，两者互补 |
| [DeepSeek-R1](deepseek-r1.md) | R1 的复现工作大量使用 LoRA 进行 RL 训练的基础微调 |
| [Cherry LLM](../self-improving-agents/cherry-llm.md) | IFD 选高质量数据 + LoRA 微调 = 高效微调栈 |
| [Self-Improving at Test-Time](../self-improving-agents/self-improving-test-time.md) | 在测试时用 LoRA 做 on-the-fly adaptation |
| [FlashAttention](../inference-optimization/flashattention.md) | 一起构成高效训练栈：LoRA 降参数，FlashAttention 降内存/时间 |

---

## 为什么是 Tier-S / Why This Is Tier-S

- **被整个生态采纳**：PyTorch、HuggingFace、Diffusers、社区微调工具全部内置
- **直接降低了 AI 民主化的门槛**：没有 LoRA，家庭工作室 / 小团队微调大模型是不现实的
- **思想可迁移**：低秩适配思想被扩展到 RLHF (LoRA-RLHF)、continual learning、multi-task 等
- **作者是前沿实践者**：Microsoft 团队，论文也在做 Phi-4 等实际产品

---

## References / 参考

- **论文:** [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)
- **代码:**
  - 原始: [microsoft/LoRA](https://github.com/microsoft/LoRA)
  - 生产首选: [huggingface/peft](https://github.com/huggingface/peft) — 含所有 PEFT 方法
- **相关论文:**
  - [QLoRA: Efficient Finetuning of Quantized LLMs (Dettmers et al. 2023)](https://arxiv.org/abs/2305.14314)
  - [DoRA: Weight-Decomposed Low-Rank Adaptation](https://arxiv.org/abs/2402.09353)
  - [LongLoRA (Chen et al. 2023)](https://arxiv.org/abs/2309.12307)
- **本仓库相关:**
  - [DPO](dpo.md)
  - [DeepSeek-R1](deepseek-r1.md)
  - [FlashAttention](../inference-optimization/flashattention.md)
  - [Cherry LLM](../self-improving-agents/cherry-llm.md)
