# Training Compute-Optimal Large Language Models (Chinchilla)

> **原文链接:** [arXiv:2203.15556](https://arxiv.org/abs/2203.15556)
>
> **作者:** Jordan Hoffmann, Sebastian Borgeaud, Arthur Mensch, Elena Buchatskaya, Trevor Cai, Eliza Rutherford, Diego de Las Casas, Lisa Anne Hendricks, Johannes Welbl, Aidan Clark, Tom Hennigan, Eric Noland, Katie Millican, George van den Driessche, Bogdan Damoc, Aurelia Guy, Simon Osindero, Karen Simonyan, Erich Elsen, Jack W. Rae, Oriol Vinyals, Laurent Sifre（DeepMind）
>
> **发表:** 2022-03-29
>
> **主题:** **推翻了 [Kaplan Scaling Laws](scaling-laws.md) 的数据分配结论**——用**同算力预算**做三种不同的 N/D 配比实验,发现**Kaplan 严重低估了数据的重要性**。新结论:**模型参数量 N 和训练 tokens D 应该同比例增长**(不是 Kaplan 说的 N 增长更快)。直接导致 Llama / Mistral / DeepSeek 的训练配方——**小模型用大量数据训,性能碾压"大模型少量数据"**。

---

## 为什么这篇重要 / Why This Matters

Chinchilla 是 **frontier lab 彼此对抗修正** 的经典案例:

- 2020 年:OpenAI 的 Kaplan Scaling Laws 说"参数量增长速度 ≫ 数据量增长速度"
- 2020-2022 年:整个行业按这个建议训练——**GPT-3 (175B / 300B tokens)、Gopher (280B / 300B tokens)** 全是"大模型 + 相对少量数据"
- 2022 年:DeepMind **做了一堆重复实验**,发现 Kaplan **错了**——**模型严重 undertrained**
- 2022 年:DeepMind 训了 **Chinchilla (70B / 1.4T tokens)**,**用 1/4 参数 + 4.7x 数据,在几乎所有 benchmark 超过 Gopher 280B**

这不仅是一个实验结果——**是一次对整个行业训练配方的推翻**。2022 年之后,没有任何 serious lab 再按 Kaplan 配方训模型。

---

## 1. 核心实验 / The Key Experiment

### 1.1 三种方法独立测量最优分配

DeepMind 做了**三种独立方法**估算"给定算力预算 C,最优的 N 和 D 分别是多少":

**方法 1 — Fix model, vary D:** 固定几个模型大小,在每个大小上训练到多种 D,找到 loss-C 曲线的最优点。

**方法 2 — IsoFLOPs:** 对每个 FLOPs 预算,训练不同 N 的模型(自然对应不同 D),找 loss 最低的那个。

**方法 3 — Parametric fit:** 直接拟合 L(N, D) 的函数形式(更灵活的 Kaplan 变种),从中提取最优 N(C) 和 D(C)。

**三种方法给出同一个结论**:

$$
N_{\text{opt}} \propto C^{0.50}, \quad D_{\text{opt}} \propto C^{0.50}
$$

**对比 Kaplan:** Kaplan 说 N 占 0.73、D 占 0.27。Chinchilla 说 **N 和 D 各占 0.50——完全平等**。

这意味着:**算力翻 10 倍,参数量和数据量都该翻 ~3.16 倍**,而不是 Kaplan 说的"参数 5.4x,数据 1.9x"。

### 1.2 Chinchilla 模型本身

为了**验证**新配方,DeepMind 训了:

- **Chinchilla 70B,1.4 trillion tokens**
- 用的算力**和 Gopher 280B 一样**(4× 数据补偿了 1/4 参数)

结果:**Chinchilla 在几乎所有 benchmark 上都击败 Gopher**。

| Benchmark | Gopher 280B | Chinchilla 70B | 胜方 |
|---|---|---|---|
| MMLU | 60.0 | **67.6** | Chinchilla (+7.6) |
| BIG-bench | 54.4 | **65.1** | Chinchilla (+10.7) |
| TriviaQA | 52.8 | **64.6** | Chinchilla (+11.8) |
| HellaSwag | 79.2 | **80.8** | Chinchilla (+1.6) |
| Reading Comprehension | 71.6 | **77.2** | Chinchilla (+5.6) |

**更小、更便宜推理、更强。** 同算力预算下,"小模型 + 多数据"完胜"大模型 + 少数据"。

---

## 2. 为什么 Kaplan 错了 / Why Kaplan Was Wrong

Chinchilla 论文礼貌地指出 Kaplan 的几个问题:

### 2.1 Kaplan 没用常数 LR 实验

Kaplan 的所有实验用**固定学习率 schedule**,但不同 N 需要不同的 LR。Chinchilla 指出这导致 Kaplan 的大模型**没训到最优**,让大模型看起来"过拟合",所以 Kaplan 得出"数据不够重要"的结论。

**Chinchilla 的做法:** 对每个 N 分别 tune LR 至最优。这是一个**方法论级别的修正**。

### 2.2 Kaplan 把所有模型训到相同的 step 数

按"token 数"对比才公平——**大模型和小模型训到相同 step 时,大模型消费的 token 多得多**。

### 2.3 Kaplan 拟合范围太小

Kaplan 的实验主要在 10M - 10B 参数。Chinchilla 把范围扩到 **70M - 16B**,用了 **3 个独立方法交叉验证**,给了远更坚实的结论。

---

## 3. 修正后的训练公式 / The New Rule of Thumb

Chinchilla 给了一条极简易记的规则:

> **For every doubling of model size, you should also double the number of training tokens.**
>
> **模型翻倍时,训练 tokens 也该翻倍。**

更精确地:**tokens ≈ 20 × 参数量**(Chinchilla-optimal)。

举例:

| 模型大小 | Kaplan 建议 tokens | **Chinchilla 建议 tokens** | 实际行业做法 2024+ |
|---|---|---|---|
| 7B | ~50B | **~140B** | Llama 3.1 7B: **~15T**(过量训练) |
| 70B | ~200B | **~1.4T** | Llama 3.1 70B: **~15T**(过量训练) |
| 400B | ~500B | **~8T** | Llama 3.1 405B: **~15T** |

**2024 年后的新趋势:** 甚至**突破** Chinchilla——**故意过量训练 (over-training)**,牺牲一些训练效率换推理时更低的模型大小(推理成本主导长期经济)。Llama 3 的 15T tokens 就是这个原因。

---

## 4. 工程视角:Chinchilla 之后行业怎么变 / What Changed After Chinchilla

### 4.1 Llama 家族(Meta)

Llama 1 (2023):7B 用 1T tokens—— 明确按 Chinchilla 调整(甚至略超)。

Llama 2 (2023):7B 用 2T tokens——进一步过量。

Llama 3 (2024):8B 用 15T tokens——**远超 Chinchilla optimal**,因为 Meta 认可推理成本比训练成本重要。

### 4.2 Mistral / Mixtral

Mistral 7B (2023):也用 Chinchilla 以上的数据量训。**"小模型 + 大数据"** 成为开源主流。

### 4.3 DeepSeek

DeepSeek-V3 685B MoE(37B 激活)也遵循修正后的 scaling——更大的数据、更高比例的数据-参数比。

### 4.4 Google / GPT

Google 的 Gemini 系列、OpenAI 的 GPT-4、Claude 3 系列 —— 全部被认为按 Chinchilla 风格训练。

**2022 年之后,行业主流 = Chinchilla ratio + 推理优化驱动的过量训练**。Kaplan 的原始公式仅剩历史意义。

---

## 5. 关键启示 / Key Takeaways

### 5.1 "常识"能被实证推翻——定期验证你的假设

Kaplan 的结论**被行业接受了 2 年,直到 Chinchilla 推翻**。

**对任何工程师的启示:** 你依赖的"行业共识"可能**错了**,且没人重新测试。每 1-2 年,对你最关键的假设做一次**重做实验**。

Chinchilla 的核心贡献不是公式本身——是**愿意花几百万美金重做别人已经"验证"过的事**。

### 5.2 Small-data bias 很隐蔽

Kaplan 误认为"数据不重要"——因为他的大模型没充分训。这是**训练实验设计中最隐蔽的坑**:**没训到收敛的 N 会让你误以为 N 太大**。

**做 scaling law 实验时必须:**
- 对每个 N 单独 tune 超参数(尤其 LR、warmup)
- 训练到**真正收敛**,不是定 step 数就停
- 用多种独立方法交叉验证(Chinchilla 用了 3 种)

### 5.3 "算力预算"的意思变了

Kaplan 时代:算力预算 = **训练 FLOPs**
Chinchilla 之后:算力预算 = **训练 FLOPs + 期望推理总量**

如果你预期模型会被推理 10 亿次,**过量训练小模型是正确的**(每次推理省下的 FLOPs 累积起来远超训练多出的成本)。这是 Llama 3 15T tokens 背后的经济学。

**实操:** 先估算"我这个模型会被推理多少次",这个数字决定你应该在 Chinchilla optimal 还是过量训练。

### 5.4 N = D × 20 是个好记的默认值

做快速估算时:
- 7B 模型 → ~140B tokens
- 70B 模型 → ~1.4T tokens
- 700B 模型 → ~14T tokens

**如果你的模型训练数据远少于这个,几乎肯定 undertrained**。

### 5.5 方法论 > 具体数字

**Chinchilla 公式会再被下一篇推翻**——2025 年的 [DeepSeek-R1](deepseek-r1.md) 和多模态模型已经指出在 reasoning 任务下 data ratio 应该不同。

但 Chinchilla **的方法论(多方法交叉、正确调超参、充分训练)是永恒的**。做任何 scaling 相关实验都该学它。

---

## 6. 和本仓库其他文章的关联 / Relation to Other Papers

| 文章 | 关系 |
|---|---|
| **[Kaplan Scaling Laws](scaling-laws.md)** | **必读前置** — Chinchilla 是对 Kaplan 的直接修正 |
| [DeepSeek-R1](deepseek-r1.md) | R1 的训练配方是 Chinchilla 之上+reasoning-specific 调整 |
| [LoRA](lora.md) | LoRA 降微调成本,但**预训练仍由 Chinchilla 决定**大小 |
| [Bitter Lesson](../ai-thinking/bitter-lesson.md) | Chinchilla 强化了 Bitter Lesson——**"data scaling"作为 general method 更重要** |
| [First Principles in Engineering](../ai-thinking/first-principles-engineering.md) | Chinchilla 是第一性原理驱动的**前人论断被实证推翻**的范例 |
| [开源模型目录](../open-source-models/README.md) | 列表里每个 2022+ 的模型都在用 Chinchilla 风格训练 |

---

## 为什么是 Tier-S / Why This Is Tier-S

- **改变了整个行业的训练配方** — 从 Kaplan 时代转到 Chinchilla 时代
- **第一性原理的**对抗修正**典范** — 同一个问题,更严格的实验设计得出相反结论
- **立即可用的公式** — N = D × 20 是每个训 LLM 的人每天用的规则
- **方法论教育价值高** — 展示了"别轻信行业共识,重做实验"的工程品质
- **作者是 DeepMind frontier 团队** — Jordan Hoffmann / Sebastian Borgeaud 等,都是 Gemini 核心贡献者

---

## References / 参考

- **论文:** [Training Compute-Optimal Large Language Models (arXiv:2203.15556)](https://arxiv.org/abs/2203.15556)
- **前置论文:** [Scaling Laws for Neural Language Models (Kaplan et al. 2020)](scaling-laws.md)
- **相关论文:**
  - [Gopher: Scaling Language Models (Rae et al. 2021)](https://arxiv.org/abs/2112.11446) — Chinchilla 对照的旧 DeepMind 模型
  - [LLaMA (Touvron et al. 2023)](https://arxiv.org/abs/2302.13971) — 第一个明确按 Chinchilla 训练的开源模型
  - [LLaMA 3 technical report](https://arxiv.org/abs/2407.21783) — 过量训练的现代实证
- **本仓库相关:**
  - [Kaplan Scaling Laws](scaling-laws.md) · [DeepSeek-R1](deepseek-r1.md) · [LoRA](lora.md)
  - [Bitter Lesson](../ai-thinking/bitter-lesson.md) · [First Principles in Engineering](../ai-thinking/first-principles-engineering.md)
