# TurboQuant: Online Vector Quantization with Near-optimal Distortion Rate

> **原文链接:** [arXiv:2504.19874](https://arxiv.org/abs/2504.19874)
>
> **Google Research 博客:** [TurboQuant: Redefining AI efficiency with extreme compression](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/)
>
> **作者:** Google Research
>
> **发表:** ICLR 2026
>
> **主题:** 数据无关的向量量化算法，实现 KV Cache 极致压缩，无精度损失

---

## Abstract

TurboQuant is a data-oblivious vector quantization algorithm that achieves near-optimal distortion rates for both mean-squared error (MSE) and inner product objectives. The method works by randomly rotating input vectors, inducing a concentrated Beta distribution on coordinates, and leveraging the near-independence property of distinct coordinates in high dimensions to apply optimal scalar quantizers per coordinate. TurboQuant requires no data-specific tuning or calibrations, making it suitable for online settings like streaming KV cache quantization. It compresses the KV cache to just 3 bits without training or fine-tuning and without compromising model accuracy, while achieving up to 8x performance boost on NVIDIA H100 GPUs.

## 摘要

TurboQuant 是一种数据无关的向量量化算法，在均方误差 (MSE) 和内积两种目标下均实现了接近最优的失真率。该方法通过对输入向量进行随机旋转，在坐标上诱导出集中的 Beta 分布，并利用高维空间中不同坐标的近独立性质，对每个坐标应用最优标量量化器。TurboQuant 不需要任何数据特定的调优或校准，使其适用于流式 KV cache 量化等在线场景。它将 KV cache 压缩到仅 3 bit，无需训练或微调且不损失模型精度，同时在 NVIDIA H100 GPU 上实现高达 8 倍的性能提升。

---

## 1. Introduction / 引言

As large language models scale up, the key-value (KV) cache becomes a critical memory bottleneck during inference. The KV cache stores attention keys and values from previous tokens, growing linearly with sequence length and consuming substantial GPU memory. Traditional quantization methods either require data-dependent calibration (making them unsuitable for online/streaming scenarios) or sacrifice accuracy at aggressive compression rates.

随着大语言模型的扩展，键值 (KV) cache 在推理过程中成为关键的内存瓶颈。KV cache 存储来自先前 token 的注意力键和值，随序列长度线性增长，消耗大量 GPU 内存。传统量化方法要么需要数据依赖的校准（使其不适用于在线/流式场景），要么在激进压缩率下牺牲精度。

TurboQuant addresses this gap by providing a theoretically grounded, data-oblivious quantization algorithm that operates near information-theoretic lower bounds while requiring zero preprocessing time.

TurboQuant 通过提供一种理论上有保证的、数据无关的量化算法来填补这一空白，该算法在接近信息论下界的水平运行，同时不需要预处理时间。

---

## 2. Core Methodology / 核心方法

![Figure 1: Error distribution of TurboQuant for Inner Product Estimation](images/turboquant/x1.png)
![](images/turboquant/x2.png)

*图 1：TurboQuant_prod 和 TurboQuant_mse 的内积估计误差分布*

### 2.1 Two-Stage Approach / 两阶段方法

TurboQuant operates in two complementary stages:

TurboQuant 分两个互补阶段运行：

#### Stage 1: PolarQuant (MSE Optimization) / 阶段一：PolarQuant（MSE 优化）

The algorithm randomly rotates input vectors, converting Cartesian coordinates into a polar representation (radius and angle). This rotation induces a Beta distribution on coordinates, and in high dimensions, distinct coordinates become nearly independent. This key insight allows decomposing the d-dimensional quantization problem into d independent scalar quantization problems.

该算法对输入向量进行随机旋转，将笛卡尔坐标转换为极坐标表示（半径和角度）。这种旋转在坐标上诱导出 Beta 分布，在高维空间中，不同坐标变得近乎独立。这一核心洞察使得 d 维量化问题可以分解为 d 个独立的标量量化问题。

Optimal scalar quantizers (Lloyd-Max) are then applied per coordinate, eliminating the memory overhead that traditional methods must carry.

随后对每个坐标应用最优标量量化器 (Lloyd-Max)，消除了传统方法必须承载的内存开销。

#### Stage 2: QJL (Inner Product Correction) / 阶段二：QJL（内积校正）

MSE-optimal quantizers introduce bias for inner product estimation (approximately 2/π at 1-bit). To correct this, TurboQuant applies a Quantized Johnson-Lindenstrauss (QJL) transform to the residuals, compressing each value to a sign bit (+1 or -1). This creates zero memory overhead while achieving unbiased inner product estimates through strategic estimation that balances high-precision queries with low-precision data.

MSE 最优量化器在内积估计中引入偏差（1-bit 时约为 2/π）。为了校正这一点，TurboQuant 对残差应用量化 Johnson-Lindenstrauss (QJL) 变换，将每个值压缩为一个符号位（+1 或 -1）。这在零内存开销的情况下，通过平衡高精度查询和低精度数据的策略性估计，实现了无偏内积估计。

![Figure 2: Variance of inner-product error comparison](images/turboquant/x3.png)
![](images/turboquant/x4.png)

*图 2：TurboQuant_prod 的内积误差方差保持恒定，而 TurboQuant_mse 的方差随平均内积增加。比特宽度 b=2。*

### 2.2 The Near-Independence Property / 近独立性质

The theoretical foundation of TurboQuant rests on the observation that after random rotation, coordinates of high-dimensional vectors become nearly independent. This justifies treating each coordinate independently for quantization, dramatically simplifying computation while maintaining theoretical guarantees.

TurboQuant 的理论基础建立在以下观察之上：经过随机旋转后，高维向量的坐标变得近乎独立。这证明了对每个坐标独立进行量化的合理性，在保持理论保证的同时大幅简化了计算。

---

## 3. Theoretical Bounds / 理论界

![Figure 3: Comparison of inner-product error and MSE against theoretical bounds](images/turboquant/x5.png)
![](images/turboquant/x6.png)

*图 3：不同比特率下内积误差和 MSE 与理论界的对比*

TurboQuant achieves provably near-optimal distortion rates:

TurboQuant 实现了可证明的近最优失真率：

| Metric | Bound |
|--------|-------|
| MSE distortion | ≤ (√3π/2) · (1/4^b) |
| Inner product distortion | ≤ (√3π² · ‖y‖²/d) · (1/4^b) |
| Optimality gap | Within ~2.7x of information-theoretic lower bound |

Where b is the number of bits per coordinate. The information-theoretic lower bounds prove TurboQuant operates within a constant factor of optimal.

其中 b 是每个坐标的比特数。信息论下界证明 TurboQuant 在最优值的常数倍范围内运行。

---

## 4. Experiments / 实验

### 4.1 KV Cache Compression / KV Cache 压缩

| Configuration | Result |
|---------------|--------|
| 3.5 bits/channel | Absolute quality neutrality (完全无质量损失) |
| 3 bits/channel | No accuracy compromise (无精度损失) |
| 2.5 bits/channel | Marginal quality degradation (轻微质量下降) |
| Compression ratio | Up to 6x KV cache reduction (KV cache 缩减 6 倍) |
| H100 GPU speedup | Up to 8x vs 32-bit unquantized (相比 32-bit 未量化加速 8 倍) |

### 4.2 Long-Context Benchmarks / 长上下文基准测试

![Figure 4: Needle-In-A-Haystack test on Llama-3.1-8B-Instruct](images/turboquant/x7.png)
![](images/turboquant/x8.png)
![](images/turboquant/x9.png)
![](images/turboquant/x10.png)
![](images/turboquant/x11.png)
![](images/turboquant/x12.png)

*图 4：Llama-3.1-8B-Instruct 在大海捞针测试上的评估，对比多种压缩方法*

Perfect downstream results across:
- **LongBench** — long-context understanding tasks
- **Needle In A Haystack** — perfect retrieval at 4x compression on Llama-3.1-8B
- **RULER** — long-range dependency evaluation
- **L-Eval** — long-document evaluation

在以下基准上实现完美的下游结果：
- **LongBench** — 长上下文理解任务
- **大海捞针 (Needle In A Haystack)** — 在 Llama-3.1-8B 上 4 倍压缩下完美检索
- **RULER** — 长距离依赖评估
- **L-Eval** — 长文档评估

### 4.3 Vector Search / 向量搜索

![Figure 5a: Recall comparison on GloVe (d=200)](images/turboquant/x13.png)

*图 5a：GloVe 数据集 (d=200) 上的召回率对比*

![Figure 5b: Recall comparison on OpenAI3 (d=1536)](images/turboquant/x14.png)

*图 5b：OpenAI3 数据集 (d=1536) 上的召回率对比*

![Figure 5c: Recall comparison on OpenAI3 (d=3072)](images/turboquant/x15.png)

*图 5c：OpenAI3 数据集 (d=3072) 上的召回率对比*

TurboQuant outperforms Product Quantization (PQ) with zero indexing time on nearest neighbor search tasks, while PQ requires expensive data-dependent codebook construction. It also achieves superior 1@k recall ratios versus state-of-the-art methods including PQ and RabbiQ.

TurboQuant 在最近邻搜索任务中以零索引时间超越了乘积量化 (PQ)，而 PQ 需要昂贵的数据依赖码本构建。它还在 1@k 召回率上优于包括 PQ 和 RabbiQ 在内的最先进方法。

---

## 5. Advantages Over Existing Methods / 相对现有方法的优势

| Feature | TurboQuant | Traditional Methods |
|---------|------------|---------------------|
| Data dependency | Data-oblivious (数据无关) | Requires calibration data (需要校准数据) |
| Preprocessing time | Zero (零) | Significant (显著) |
| Online/streaming support | Native (原生支持) | Limited (有限) |
| Theoretical guarantees | Provably near-optimal (可证明近最优) | Heuristic (启发式) |
| Training required | None (无需) | Often required (通常需要) |

---

## 6. Applications / 应用场景

- **KV Cache compression for LLMs** — solving memory bottlenecks in models like Gemini during long-context inference (解决 Gemini 等模型在长上下文推理中的内存瓶颈)
- **Semantic search at scale** — enabling vector search with minimal memory overhead (以最小内存开销实现大规模语义搜索)
- **Edge deployment** — aggressive compression enables running larger models on constrained devices (激进压缩使受限设备上运行更大模型成为可能)

---

## 7. Conclusion / 结论

TurboQuant represents a fundamental advance in vector quantization by combining theoretical rigor with practical efficiency. Its data-oblivious nature makes it uniquely suited for online inference scenarios where data arrives sequentially (such as KV cache quantization during autoregressive generation). By achieving near-information-theoretic-optimal compression with zero preprocessing cost, TurboQuant eliminates the traditional trade-off between compression quality and computational overhead. The algorithm's adoption across community implementations (Triton, MLX, llama.cpp) demonstrates its practical impact beyond the theoretical contributions.

TurboQuant 代表了向量量化的根本性进步，将理论严谨性与实际效率相结合。其数据无关的特性使其特别适用于数据顺序到达的在线推理场景（如自回归生成过程中的 KV cache 量化）。通过以零预处理成本实现接近信息论最优的压缩，TurboQuant 消除了压缩质量与计算开销之间的传统权衡。该算法在社区实现（Triton、MLX、llama.cpp）中的广泛采用，证明了其超越理论贡献的实际影响力。
