# Scaling Laws for Neural Language Models

> **原文链接:** [arXiv:2001.08361](https://arxiv.org/abs/2001.08361)
>
> **作者:** Jared Kaplan, Sam McCandlish, Tom Henighan, Tom B. Brown, Benjamin Chess, Rewon Child, Scott Gray, Alec Radford, Jeffrey Wu, Dario Amodei（OpenAI）
>
> **发表:** 2020-01-23
>
> **主题:** 用**第一性原理**把 LLM 性能拆成三个可独立测量的变量——**模型参数量 N、数据量 D、算力 C**——并推出三条幂律,把"怎么花训练预算"从**玄学变成可计算的问题**。没有这篇就没有 GPT-3/4/5 的投入决定。

---

## 为什么这篇重要 / Why This Matters

2020 年前大模型训练的核心问题是**黑箱决策**:给你 1000 张 V100 和 1 个月,要不要堆参数?加数据?多训几个 epoch?全靠试错和直觉。

Kaplan 这篇用**纯经验主义第一性分析**把性能预测变成了可计算问题:

> **Loss = f(N, D, C)**——只取决于参数量、数据量、算力,和具体架构选择**几乎无关**。

这是一个惊人且深远的结论:

- 如果 loss 只和 N/D/C 有关,你就可以**在小模型上跑实验,外推到大模型**
- 你可以**精确算出 1 亿美金预算该怎么分**(多少给参数、多少给数据、多少给训练步数)
- 你可以**预先知道"下一代模型"的性能**,不用等它训完
- OpenAI 的 GPT-3(2020 6 月)、GPT-4(2023)就是基于这套方法**提前知道能 work** 才决定投入的

**这是深度学习从"手艺"过渡到"工程"的一个分水岭**。没有 Scaling Laws,frontier lab 不敢做几亿美金级别的 bet。

---

## 1. 三条核心幂律 / The Three Power Laws

Kaplan 的核心贡献是三条**幂律关系(power laws)**:

### 1.1 Loss vs 模型参数量 N

保持数据 D 和训练步数充足:

$$
L(N) = \left(\frac{N_c}{N}\right)^{\alpha_N}
$$

其中 N 是非嵌入参数量(non-embedding),α_N ≈ 0.076。

**这意味着:** 每把参数量放大 10 倍,loss 减少一个固定百分比(大约 17%)。这个规律**跨越 7 个数量级**成立——从 ~10^3 参数到 ~10^10 参数。

### 1.2 Loss vs 数据量 D

保持参数 N 足够大、训练充分:

$$
L(D) = \left(\frac{D_c}{D}\right)^{\alpha_D}
$$

α_D ≈ 0.095。同样的幂律,跨越 6 个数量级。

### 1.3 Loss vs 算力 C (最优分配)

在**最优分配 N 和 D** 的前提下:

$$
L(C) = \left(\frac{C_c}{C}\right)^{\alpha_C}
$$

α_C ≈ 0.050。

**关键推论:** 给你 10 倍算力,**不是把算力全砸给 N、也不是全砸给 D**——有一个**最优配比**让 loss 最低。

---

## 2. 第一性原理的体现 / First-Principles Analysis

Kaplan 这篇**之所以被视为"第一性原理驱动"的典范**,是因为:

### 2.1 拆解到最基本的变量

他没有研究"某个特定架构怎么训"——而是**把变量拆到最底层**:

- N(模型参数量)—— 代表**表达能力**
- D(训练数据量)—— 代表**学习到的信息量**
- C(算力)—— 代表**优化过程的深度**

这三个是独立可测的物理量。所有其他因素(架构细节、超参、优化器、数据集构成)都是**二阶效应**。

### 2.2 架构无关性

论文惊人的一个发现:**Transformer 架构里,宽度 vs 深度 vs 注意力头数的具体选择几乎不影响 loss**——只要参数总量 N 一样。

这极大地简化了训练决策——**你不用在 50 种架构组合里 grid search,只用专注一个数:N**。

### 2.3 用小模型预测大模型

三条幂律拟合后,你可以:

1. 用 0.1B 参数训练 + 测 loss
2. 用 1B 参数训练 + 测 loss
3. **外推**到 100B、1T 参数会什么 loss——**精度在 1% 以内**

这就是 OpenAI 能在 GPT-3(175B)训练前**提前知道它会比 GPT-2 强多少**的原因。

### 2.4 数据量 vs 参数量的分配

论文给了具体公式:

$$
N_{\text{opt}} \propto C^{0.73}, \quad D_{\text{opt}} \propto C^{0.27}
$$

**解读:** 算力增加 10 倍,最优参数量增加 ~5.4 倍、最优数据量增加 ~1.9 倍。

**这是 GPT-3 175B + 300B tokens 配比的理论依据**——比 GPT-2(1.5B)参数大 100 倍,数据只大 5 倍,完全符合 Kaplan 公式。

---

## 3. 关键图表 / Key Findings

### 图 1:三条幂律的跨 7 数量级对齐

Kaplan 原论文最著名的一张图是 **N、D、C 各自的 loss 曲线在 log-log 坐标下完美呈直线**——这就是"幂律"的视觉签名。

三条线跨越 **7 个数量级**都保持线性(R² > 0.99)——这种规律性在深度学习里**极其罕见**,过往大多数现象只在 2-3 个数量级内成立。

### 图 2:训练曲线的 collapse

不同大小模型的训练 loss 曲线,经过恰当归一化后**坍缩成同一条曲线**——证明这些是**单一规律在不同参数下的显现**,不是独立的现象。

### 图 3:最优预算分配

给定总算力 C,画出"应该训多大模型"的曲线——这张图是过去 5 年 OpenAI / DeepMind / Anthropic 决定训练规模的**操作手册**。

---

## 4. 工程师视角的关键启示 / Key Takeaways

### 4.1 训练预算不是"多多益善",是可计算的配比

有了 Scaling Laws,你面对一个训练任务应该这样想:

1. 估算你的总算力预算 C
2. 查 Kaplan 公式得出最优 N 和 D
3. 训练

**不要**凭直觉"加参数"或"加数据"。每一边都有**最优点**,过了就边际效益递减。

### 4.2 小模型实验 → 大模型决策

做任何训练决策(换优化器、换数据集、换架构)时,**先在 100M 参数级别跑**,测出 loss 曲线,然后用 Scaling Law 外推。外推精度通常 3-5% 以内。

**这让"要不要花 100 万美金训这个"从赌博变成工程预算计算**。

### 4.3 架构细节是二阶的

2020 年以后,做新架构如果 claim "比 Transformer 好",**必须做 scaling law 对比**——只证明"在 1B 参数下好"没用,要证明"随 N 增大,Loss 曲线比 Transformer 更陡(更快下降)"。

**大多数号称"超越 Transformer"的新架构都在这一步现原形**——它们在小规模上 work,在 10B+ 规模上 scaling exponent 还不如 Transformer。

### 4.4 Loss 不是最终目标,但非常有用的代理

Kaplan 的 loss 预测不等于下游任务性能。GSM8K、MMLU、coding 这些具体能力和 loss 是**强相关**的,但不是**确定性**的。

2024 年后的实践:**用 Kaplan 预测训练 loss + 用小规模 eval 预测下游能力,两者结合做预算决策**。

### 4.5 Kaplan 的计算会被 Chinchilla 修正

2022 年 DeepMind 的 [Chinchilla 论文](chinchilla.md) 指出 Kaplan 的数据配比**低估了数据的重要性**。2025 年的主流做法是 **Chinchilla 配比,不是 Kaplan 配比**。

但 Kaplan 的**方法论**(用幂律拟合 + 外推)**依然是正确的**——只是系数被重新校准。**读 Chinchilla 的前提是先读懂 Kaplan**。

---

## 5. 对 AI 行业的改变 / How This Changed the Industry

### 2020 前 vs 2020 后

| 维度 | 2020 前 | 2020 后 |
|---|---|---|
| 训练规模决策 | 直觉 + 勉强够就行 | **Scaling Law 外推计算** |
| 新架构验证 | 单点性能对比 | **Scaling exponent 对比** |
| 投资决定 | "感觉会 work" | **预算 → 预期 loss → 预期能力** |
| 研究优先级 | 架构创新 | **数据质量 + 算力效率**(因为 scaling law 说 architecture 是二阶) |

### 对其他 frontier lab 的影响

- **Anthropic** 成立(2021)直接建立在 scaling laws 之上——Dario Amodei 是 Kaplan 论文作者之一
- **Chinchilla (2022)** 直接回应并修正
- **Llama 系列** 的 175B、70B、8B 配比都参考了这个框架
- **DeepSeek-V3** 的 685B MoE + 37B 激活的 trade-off 也依据 scaling law 推演

---

## 6. 和本仓库其他文章的关联 / Relation to Other Papers

| 文章 | 关系 |
|---|---|
| **[Chinchilla](chinchilla.md)** | **直接后续** — 修正 Kaplan 的数据配比,必读对照 |
| [Sutton — Bitter Lesson](../ai-thinking/bitter-lesson.md) | Sutton 说"scaling 胜出",Kaplan 说"**该怎么 scale**"——互补 |
| [Karpathy — Software 2.0](../ai-thinking/software-2-0.md) | Kaplan 告诉你 Software 2.0 的**训练投资回报曲线**长什么样 |
| [First Principles in Engineering](../ai-thinking/first-principles-engineering.md) | Scaling Laws 是 AI 工程里**第一性原理**最成功的案例 |
| [LoRA](lora.md) | LoRA 节约 finetuning 成本,但**基础模型预训练仍由 Scaling Law 决定** |
| [DeepSeek-R1](deepseek-r1.md) | R1 的训练配方也受 Kaplan-Chinchilla 曲线影响 |
| [开源模型目录](../open-source-models/README.md) | GLM-5、Qwen3.5、Llama 4 的参数/数据比都在 Kaplan-Chinchilla 框架内 |

---

## 为什么是 Tier-S / Why This Is Tier-S

- **改变了整个行业的投资决策方式** — 从直觉到公式
- **是第一性原理分析的教科书案例** — 拆到最基础变量,找出规律
- **可验证可外推** — 跨 7 数量级成立
- **作者后续影响:** Dario Amodei 创立 Anthropic、Kaplan 去 Anthropic,这套方法论内化为前沿 lab 的标准决策框架
- **直接可用** — 任何做大模型训练的团队都能套这套方法算自己的预算

---

## References / 参考

- **论文:** [Scaling Laws for Neural Language Models (arXiv:2001.08361)](https://arxiv.org/abs/2001.08361)
- **作者:**
  - Jared Kaplan — 现在 Anthropic 联合创始人
  - Dario Amodei — Anthropic CEO
- **关键后续论文:**
  - [Chinchilla — Training Compute-Optimal Large Language Models (Hoffmann et al. 2022)](https://arxiv.org/abs/2203.15556) —— 修正 Kaplan
  - [GPT-3 paper (Brown et al. 2020)](https://arxiv.org/abs/2005.14165) —— 直接应用 Kaplan 结论的第一个 frontier 模型
  - [Kaplan's follow-up: Scaling Laws for Autoregressive Generative Modeling (2020)](https://arxiv.org/abs/2010.14701)
- **本仓库相关:**
  - [Chinchilla](chinchilla.md) · [LoRA](lora.md) · [DPO](dpo.md) · [DeepSeek-R1](deepseek-r1.md)
  - [Bitter Lesson](../ai-thinking/bitter-lesson.md) · [First Principles in Engineering](../ai-thinking/first-principles-engineering.md)
