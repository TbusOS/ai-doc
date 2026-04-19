# FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness

> **原文链接:**
> - v1: [arXiv:2205.14135](https://arxiv.org/abs/2205.14135)
> - v2: [arXiv:2307.08691](https://arxiv.org/abs/2307.08691)
> - v3: [arXiv:2407.08608](https://arxiv.org/abs/2407.08608)
>
> **作者:** Tri Dao（斯坦福 / Together AI），Dan Fu，Christopher Ré 等
>
> **发表:** NeurIPS 2022 / 2023 (v2) / 2024 (v3)
>
> **代码:** [github.com/Dao-AILab/flash-attention](https://github.com/Dao-AILab/flash-attention)
>
> **主题:** 今天几乎所有大模型训练和推理都在用的 attention 内核。通过 **IO-awareness**（关心 GPU 内存层级的数据移动，而不是 FLOPs 数量）把标准 attention 加速 **2-4×**、内存从 **O(N²) 降到 O(N)**，并且是**精确**计算（不是近似）。

---

## 为什么这篇重要 / Why This Matters

在 FlashAttention 之前，人们对"attention 很慢"的解释是"它是 O(N²) 计算"。于是过去 5 年大量工作在做**近似 attention**——Performer、Linformer、Longformer、Reformer……牺牲精度换速度。

Tri Dao 的 FlashAttention 打破这个叙事：**attention 慢不是因为 FLOPs，是因为 GPU 内存带宽**。只要把算法重组让数据少在 HBM（高带宽内存，即显存）和 SRAM（片上缓存）之间搬运，就能**同时拿到速度和精度**。

这是 2022 年之后 Transformer 训练成本能持续下降的关键因素之一——没有 FlashAttention，今天 100K-1M 的长上下文模型根本跑不起来。

---

## 1. 核心洞察 / The Core Insight

### 1.1 GPU 内存层级

现代 GPU 有两层核心存储：

| 层级 | 容量 | 带宽 |
|---|---|---|
| **HBM**（High Bandwidth Memory，显存） | A100: 40-80 GB | ~1.5-2 TB/s |
| **SRAM**（On-chip，片上） | A100: 20 MB 分散在 SM | ~20 TB/s（快 10×+） |

**数据必须先从 HBM 搬到 SRAM 才能被 CUDA core 计算**。这个搬运是瓶颈——不是 FLOPs。

### 1.2 标准 Attention 为什么慢

标准 attention 的计算图：

```
Q, K, V  (都在 HBM)
    │
    ├─────▶ S = Q @ K^T      (写回 HBM, N×N 大矩阵)
    ├─────▶ P = softmax(S)   (HBM ↔ SRAM 再来一次, N×N)
    └─────▶ O = P @ V        (再搬一次, 再写回 HBM)
```

**问题：**
- 中间矩阵 S、P 都是 **N×N**，对 N=8K 就是 64M 元素 × 2 字节 = 128MB，每次搬运都是带宽杀手
- 每一步都**先写回 HBM 再读回**，因为 N×N 太大塞不进 SRAM

### 1.3 FlashAttention 怎么做

**核心 trick：tile 化 + online softmax**

```
把 Q/K/V 分块，每次只把一小块 Q_i, K_j, V_j 搬进 SRAM
    │
    ├─▶ 在 SRAM 内计算 S_ij = Q_i @ K_j^T
    ├─▶ 在 SRAM 内累积 softmax 分子和归一化项
    └─▶ 累积 O_i += P_ij @ V_j
    
完成后只把 O（小矩阵，N×d）写回 HBM。
**中间 N×N 的 S 和 P 从不落盘到 HBM**。
```

- **内存：O(N) 不是 O(N²)**——因为 N×N 从不物化
- **速度：快 2-4×**——因为 HBM↔SRAM 的搬运次数大幅减少
- **精度：完全精确**——数学上等价于标准 attention

这个算法的难点是 **online softmax**——需要在只看到部分块的情况下维护正确的全局 softmax 归一化。用了一个巧妙的数值稳定 trick（逐块累积 max 和 sum，最后一次性除以）。

---

## 2. 三个版本的演化 / Version Evolution

### FlashAttention v1 (2022)

- 首次引入 IO-aware 的 attention 内核
- **训练速度**比 PyTorch 标准 attention **快 ~2-3×**（GPT-2 on A100）
- 内存降至 O(N)，让 1 万 token 训练在单卡变得可行

### FlashAttention v2 (2023)

v1 的 CUDA kernel 并行度不够高。v2 大改：

- **减少 non-matmul FLOPs**（softmax 相关操作）
- **增加并行维度**（原来只在 batch 和 head 维度并行，v2 加了序列维度）
- **更好的 warp-level 调度**

结果：**再快 1.5-2×**，即相对标准 attention **快 3-5×**。从 A100 利用率 ~25% 提到 **~72%**。

### FlashAttention v3 (2024)

专门为 NVIDIA H100 的 Hopper 架构优化：

- 利用 **TMA**（Tensor Memory Accelerator）做异步数据搬运
- 利用 **WGMMA**（Warp-group Matrix Multiply-Accumulate）指令
- 利用 **FP8**（H100 原生 8-bit 浮点）
- **速度比 v2 再快 1.5-2×**——H100 上相对标准 attention **快 10-16×**
- FP8 版本**吞吐量接近 1.2 PFLOPS**

---

## 3. 工程师视角的影响 / Engineering Impact

### 3.1 大模型训练 / 推理必备

**今天几乎所有**主流 LLM 训练框架都用 FlashAttention：

- PyTorch 2.0+ 的 `scaled_dot_product_attention` — 默认调用 FlashAttention
- HuggingFace Transformers — `attn_implementation="flash_attention_2"`
- vLLM / TGI / SGLang — 推理时默认调用
- Megatron-LM / DeepSpeed — 训练内置

如果你在做大模型工程**没有启用 FlashAttention，就是把钱在烧**。

### 3.2 长上下文变得可能

FlashAttention 的 O(N) 内存是长上下文训练/推理的**前提**。

- 没有 FlashAttention：A100 上训练 2K 上下文的 GPT 类模型就已经吃紧
- 有 FlashAttention：同样 A100 能训 8K-16K 上下文
- 加上分布式 + Ring Attention：突破到 128K - 1M（Llama 4 Scout 10M 就是在这个基础上做的）

### 3.3 PyTorch 原生集成

PyTorch 2.x 以后只要这么写：

```python
import torch.nn.functional as F

output = F.scaled_dot_product_attention(Q, K, V)
# PyTorch 自动选后端：FlashAttention-2 / FlashAttention-3 / memory-efficient / math
```

`scaled_dot_product_attention` 会根据硬件自动选最优 kernel。**这是现在写新 transformer 代码的默认方式**——不要再手写 `softmax(Q @ K.T / sqrt(d)) @ V`，那是 2022 年前的代码。

### 3.4 推理侧延伸

FlashAttention 在推理侧衍生出几个关键优化：

- **PagedAttention**（vLLM）：把 KV cache 分页管理，允许批次动态变化
- **FlashInfer**（用于 sglang / TGI）：针对推理优化的专用 kernel
- **Ring Attention**：分布式长上下文 attention

这些都建立在 FlashAttention 的 tile 化 + IO-awareness 思想上。

---

## 4. 最小代码示例 / Minimal Example

安装：

```bash
pip install flash-attn --no-build-isolation
```

使用：

```python
from flash_attn import flash_attn_func

# Q, K, V shape: [batch, seqlen, num_heads, head_dim]
# dtype: fp16 or bf16 (fp32 不支持)
output = flash_attn_func(Q, K, V, causal=True)
```

或者直接用 PyTorch 2.x：

```python
import torch.nn.functional as F
output = F.scaled_dot_product_attention(Q, K, V, is_causal=True)
# PyTorch 会自动选 FlashAttention 后端
```

**常见坑：**
- Q/K/V 必须是 fp16 或 bf16，fp32 不支持
- Sequence length 不必是 2 的幂次（这是 v2 以后支持的）
- Head dim 支持 ≤128（v3 支持 ≤256）

---

## 5. 与本仓库其他文章的关联 / Relation to Other Papers

| 文章 | 关系 |
|---|---|
| [LLM in a Flash](llm-in-a-flash.md) | 都是 IO-aware 思维的工程实现——FlashAttention 是 GPU SRAM/HBM 层面，Apple 这篇是 RAM/Flash 层面 |
| [TurboQuant](turboquant.md) | 都在压缩 attention 的开销；FlashAttention 改 attention 算法，TurboQuant 改 KV cache 表示 |
| [Fast Inference of MoE with Offloading](fast-inference-moe-offloading.md) | IO-aware 思维的另一应用：专家权重也遵循内存层级 |
| [FlashMoE](flashmoe.md) | Flash 思想从 attention 扩展到 MoE 路由 |
| [Long Context Models (Llama 4 Scout 等)](../open-source-models/README.md#5-long-context--长上下文) | 10M 上下文直接建立在 FlashAttention 的 O(N) 内存上 |

---

## 为什么是 Tier-S / Why This Is Tier-S

- **改变了 Transformer 经济学**——没有 FlashAttention 就没有今天的长上下文 + 大规模训练的可行性
- **被前沿实践全面采纳**——PyTorch、HuggingFace、vLLM、Megatron 全部默认用它
- **思想可复用**——"IO-awareness 比 FLOP-counting 更重要"这个原则被应用到 KV cache、MoE、稀疏 attention 等各种地方
- **作者是前沿做的人**：Tri Dao 是 Together AI 联合创始人、Mamba 作者之一——不是只写论文的理论家

---

## References / 参考

- **论文:**
  - [FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness (v1)](https://arxiv.org/abs/2205.14135)
  - [FlashAttention-2: Faster Attention with Better Parallelism (v2)](https://arxiv.org/abs/2307.08691)
  - [FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision (v3)](https://arxiv.org/abs/2407.08608)
- **代码:** [github.com/Dao-AILab/flash-attention](https://github.com/Dao-AILab/flash-attention)
- **作者:**
  - Tri Dao ([@tri_dao on X](https://x.com/tri_dao)) — Together AI 联合创始人，Mamba 共作
  - Christopher Ré — Stanford HazyResearch 实验室
- **Tri Dao 的 PyTorch 集成博客:** [PyTorch Blog — FlashAttention in PyTorch 2.0](https://pytorch.org/blog/accelerated-pytorch-2/)
- **本仓库相关:**
  - [LLM in a Flash](llm-in-a-flash.md) / [TurboQuant](turboquant.md) / [FlashMoE](flashmoe.md)
  - [长上下文模型目录](../open-source-models/README.md#5-long-context--长上下文)
