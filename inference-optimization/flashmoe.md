# FlashMoE: Reducing SSD I/O Bottlenecks via ML-Based Cache Replacement for Mixture-of-Experts Inference on Edge Devices

> **原文链接:** [arXiv:2601.17063](https://arxiv.org/abs/2601.17063)
>
> **作者:** Byeongju Kim, Jungwan Lee, Donghyeon Han, Hoi-Jun Yoo, Sangyeob Kim
>
> **发表:** 2026
>
> **主题:** MoE 专家权重 SSD Offload + ML-based 缓存替换策略，边缘设备推理优化

---

## Abstract

Mixture-of-Experts (MoE) models have gained attention for efficiently scaling large language models through sparse activation patterns that enable partial model execution. However, deploying these models on resource-limited edge devices remains challenging due to their enormous parameter counts. Recent MoE models grow to hundreds of gigabytes, making RAM-offloading solutions impractical. FlashMoE addresses this by offloading inactive MoE experts to SSD storage and introduces a lightweight ML-based caching strategy that adaptively combines recency and frequency signals to maximize expert reuse, significantly reducing storage I/O. On real hardware, FlashMoE achieves up to 51% improvement in cache hit rates versus traditional policies like LRU and LFU, and a 2.6x speedup relative to competing MoE inference systems.

## 摘要

混合专家 (MoE) 模型因通过稀疏激活模式实现大语言模型的高效扩展而受到关注，这种模式允许模型的部分执行。然而，由于其巨大的参数量，在资源有限的边缘设备上部署这些模型仍然充满挑战。近期的 MoE 模型增长到数百 GB，使得基于 RAM 的 offloading 方案变得不切实际。FlashMoE 通过将不活跃的 MoE 专家 offload 到 SSD 存储来解决这一问题，并引入了一种轻量级的基于 ML 的缓存策略，自适应地结合时近性和频率信号以最大化专家复用，显著减少存储 I/O。在实际硬件上，FlashMoE 相比 LRU 和 LFU 等传统策略实现了高达 51% 的缓存命中率提升，以及相对于竞争 MoE 推理系统 2.6 倍的加速。

---

## 1. Introduction / 引言

As MoE models continue to scale, their parameter counts now reach hundreds of gigabytes. While previous approaches like Fiddler and DAOP rely on DRAM-based offloading, this becomes impractical on devices with only 16-64GB RAM. FlashMoE proposes moving expert weights to SSD storage, which offers much larger capacity at the cost of higher access latency. The key challenge then becomes minimizing SSD I/O through intelligent caching.

随着 MoE 模型持续扩展，其参数量现已达到数百 GB。虽然 Fiddler 和 DAOP 等先前方法依赖基于 DRAM 的 offloading，但在仅有 16-64GB RAM 的设备上这变得不切实际。FlashMoE 提出将专家权重移至 SSD 存储，SSD 以更高的访问延迟为代价提供更大的容量。关键挑战随之变为通过智能缓存最小化 SSD I/O。

---

## 2. Key Technical Contributions / 核心技术贡献

### 2.1 Model Decomposition / 模型分解

Experts and non-expert components are stored separately. Experts are subdivided by layer and unit as individual PyTorch files, enabling fine-grained on-demand loading. Non-expert components (attention layers, embeddings) remain in DRAM.

专家和非专家组件分开存储。专家按层和单元细分为单独的 PyTorch 文件，实现细粒度的按需加载。非专家组件（注意力层、嵌入层）保留在 DRAM 中。

### 2.2 ML-Based Cache Replacement Policy / 基于 ML 的缓存替换策略

Rather than relying on traditional LRU/LFU heuristics, FlashMoE trains a lightweight feedforward neural network to approximate Belady's optimal replacement algorithm (which requires future knowledge).

FlashMoE 没有依赖传统的 LRU/LFU 启发式方法，而是训练了一个轻量级前馈神经网络来近似 Belady 最优替换算法（该算法需要未来知识）。

**Input features / 输入特征:**

- **Recency (时近性):** `1/r_t` — inverse of time since last access (距上次访问的时间的倒数)
- **Frequency (频率):** `f_t/max(f)` — normalized access frequency (归一化访问频率)

**Training details / 训练细节:**

- Dataset: TriviaQA (512 samples, 512 tokens) / 数据集: TriviaQA（512 个样本，512 个 token）
- Architecture: 3-layer FFN, hidden size 128 / 架构: 3 层前馈网络，隐藏层大小 128
- Loss: MSE / 损失函数: MSE
- Optimizer: AdamW, learning rate 1e-3 / 优化器: AdamW，学习率 1e-3

### 2.3 System Architecture / 系统架构

**Initialization / 初始化:**

Only non-expert components are loaded into memory initially, reducing load time by ~6.8x versus Fiddler/DAOP.

仅在初始化时加载非专家组件到内存，相比 Fiddler/DAOP 将加载时间减少约 6.8 倍。

**Prefill Stage / 预填充阶段:**

Identifies routed experts across token batches, loading each required expert once per iteration from SSD. This batch-aware loading avoids redundant reads.

识别 token 批次中被路由的专家，每次迭代从 SSD 加载每个所需专家一次。这种批次感知的加载方式避免了冗余读取。

**Decoding Stage / 解码阶段:**

Expert loading accounts for over 70% of total decoding time, motivating the sophisticated cache policy. The ML-based cache predicts which experts are least likely to be reused and evicts them first.

专家加载占总解码时间的 70% 以上，这推动了复杂缓存策略的开发。基于 ML 的缓存预测哪些专家最不可能被复用，并优先驱逐它们。

---

## 3. Experiments / 实验

### 3.1 Hardware Setup / 硬件配置

- CPU: AMD Ryzen 9 9600X
- GPU: NVIDIA RTX 5070 Ti
- SSD: SK Hynix P51 NVMe (7.4 GB/s)
- RAM: 16GB DDR5

### 3.2 Cache Hit Rate Results / 缓存命中率结果

| Model | vs LRU | vs LFU | vs ARC | vs LeCaR |
|-------|--------|--------|--------|----------|
| OLMoE-1B-7B | +21% | +51% | +28% | +21% |

### 3.3 Inference Speed / 推理速度

| Metric | Result |
|--------|--------|
| Speedup vs LRU | 22% faster (OLMoE-1B-7B) |
| Speedup vs existing MoE systems | 2.6x |
| Initial loading vs llama.cpp | 4x faster |
| Initial loading vs Fiddler/DAOP | 4.1x faster |

---

## 4. Key Insights / 核心洞察

**"Experts exhibit temporal locality and routing-specific reuse patterns."**

**"专家展现出时间局部性和路由特定的复用模式。"**

This observation is fundamental to FlashMoE's approach. Unlike traditional cache replacement where access patterns may be random, MoE expert routing follows learnable patterns that can be captured by a lightweight neural network. By combining recency and frequency signals through ML rather than fixed heuristics, the system adapts to the specific access patterns of different models and input distributions.

这一观察是 FlashMoE 方法的基础。与传统缓存替换中访问模式可能是随机的不同，MoE 专家路由遵循可学习的模式，这些模式可以被轻量级神经网络捕获。通过 ML 而非固定启发式方法结合时近性和频率信号，系统能够适应不同模型和输入分布的特定访问模式。

---

## 5. Conclusion / 结论

FlashMoE demonstrates that SSD-based expert offloading with ML-optimized caching is a viable path for deploying large MoE models on edge devices. By replacing traditional cache heuristics with a lightweight learned policy, the system achieves significant improvements in both cache hit rates and inference speed. The approach is particularly relevant as MoE models continue to grow beyond what DRAM-only solutions can handle, making SSD offloading an increasingly important technique in the inference optimization toolkit.

FlashMoE 证明了基于 SSD 的专家 offloading 结合 ML 优化的缓存是在边缘设备上部署大型 MoE 模型的可行路径。通过用轻量级学习策略替换传统缓存启发式方法，系统在缓存命中率和推理速度方面都实现了显著提升。随着 MoE 模型持续增长超出仅靠 DRAM 方案能处理的范围，这种方法在推理优化工具包中变得越来越重要。
