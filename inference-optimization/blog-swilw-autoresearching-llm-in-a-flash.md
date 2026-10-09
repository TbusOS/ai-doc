# Autoresearching Apple's "LLM in a Flash" to run Qwen 397B locally

> **原文链接:** [simonwillison.net/2026/Mar/18/llm-in-a-flash/](https://simonwillison.net/2026/Mar/18/llm-in-a-flash/)
>
> **作者:** Simon Willison（转述 Dan Woods 的实验）
>
> **发表:** 2026-03-18（Link Blog 短评）
>
> **主题:** 用 Karpathy 的 autoresearch 方法论 + Apple "LLM in a Flash" 论文，在 48GB MacBook 上本地跑 **Qwen3.5-397B-A17B**
>
> **类型:** 博客笔记（非论文）— 文件名前缀 `blog-` 与 paper 笔记区分

---

## 关联的正式论文（已有独立笔记）

- [LLM in a Flash: Efficient Large Language Model Inference with Limited Memory](./llm-in-a-flash.md) — Apple ACL 2024
- [Fast Inference of Mixture-of-Experts Language Models with Offloading](./fast-inference-moe-offloading.md) — NeurIPS 2023
- [FlashMoE](./flashmoe.md) — 2026

## 关联开源产物

- [danveloper/flash-moe](https://github.com/danveloper/flash-moe) — Dan Woods 的实现（MLX + Objective-C + Metal），含 Claude Opus 4.6 主撰的 [PDF 研究报告](https://github.com/danveloper/flash-moe/blob/main/paper/flash_moe.pdf)

---

## Original / 原文

**[Autoresearching Apple's "LLM in a Flash" to run Qwen 397B locally](https://twitter.com/danveloper/status/2034353876753592372)**. Here's a fascinating piece of research by Dan Woods, who managed to get a custom version of [Qwen3.5-397B-A17B](https://huggingface.co/Qwen/Qwen3.5-397B-A17B/tree/main) running at 5.5+ tokens/second on a 48GB MacBook Pro M3 Max despite that model taking up 209GB (120GB quantized) on disk.

Qwen3.5-397B-A17B is a Mixture-of-Experts (MoE) model, which means that each token only needs to run against a subset of the overall model weights. These expert weights can be streamed into memory from SSD, saving them from all needing to be held in RAM at the same time.

Dan used techniques described in Apple's 2023 paper [LLM in a flash: Efficient Large Language Model Inference with Limited Memory](https://arxiv.org/abs/2312.11514):

> This paper tackles the challenge of efficiently running LLMs that exceed the available DRAM capacity by storing the model parameters in flash memory, but bringing them on demand to DRAM. Our method involves constructing an inference cost model that takes into account the characteristics of flash memory, guiding us to optimize in two critical areas: reducing the volume of data transferred from flash and reading data in larger, more contiguous chunks.

He fed the paper to Claude Code and used a variant of Andrej Karpathy's [autoresearch pattern](https://simonwillison.net/2026/Mar/13/liquid/) to have Claude run 90 experiments and produce MLX Objective-C and Metal code that ran the model as efficiently as possible.

[danveloper/flash-moe](https://github.com/danveloper/flash-moe) has the resulting code plus [a PDF paper](https://github.com/danveloper/flash-moe/blob/main/paper/flash_moe.pdf) mostly written by Claude Opus 4.6 describing the experiment in full.

The final model has the experts quantized to 2-bit, but the non-expert parts of the model such as the embedding table and routing matrices are kept at their original precision, adding up to 5.5GB which stays resident in memory while the model is running.

Qwen 3.5 usually runs 10 experts per token, but this setup dropped that to 4 while claiming that the biggest quality drop-off occurred at 3.

It's not clear to me how much the quality of the model results are affected. Claude claimed that "Output quality at 2-bit is indistinguishable from 4-bit for these evaluations", but the description of the evaluations it ran is quite thin.

**Update**: Dan's [latest version](https://twitter.com/danveloper/status/2034686509748462022) upgrades to 4-bit quantization of the experts (209GB on disk, 4.36 tokens/second) after finding that the 2-bit version broke tool calling while 4-bit handles that well.

---

## 中文翻译

**[Autoresearching Apple 的 "LLM in a Flash" 在本地跑 Qwen 397B](https://twitter.com/danveloper/status/2034353876753592372)**。Dan Woods 做了一项引人入胜的研究：把定制版 [Qwen3.5-397B-A17B](https://huggingface.co/Qwen/Qwen3.5-397B-A17B/tree/main) 在 48GB 内存的 MacBook Pro M3 Max 上跑到了 **5.5 tokens/s 以上**，而该模型磁盘占用高达 **209GB（量化后 120GB）**。

Qwen3.5-397B-A17B 是一个 Mixture-of-Experts (MoE) 模型，意味着每个 token 只需激活整个模型权重中的一小部分。未激活的专家权重可以按需从 **SSD 流式加载**到内存，无需把所有权重同时常驻 RAM。

Dan 采用了 Apple 2023 年论文 [LLM in a Flash: Efficient Large Language Model Inference with Limited Memory](https://arxiv.org/abs/2312.11514) 的技术：

> 本文解决了运行超出可用 DRAM 容量的 LLM 这一挑战 —— 将模型参数存储在 flash memory 中，按需加载到 DRAM。我们的方法构建了一个考虑 flash memory 特性的推理成本模型，引导我们在两个关键领域进行优化：减少从 flash 传输的数据量，以及以更大、更连续的块读取数据。

他把论文喂给 Claude Code，采用 Andrej Karpathy 的 [autoresearch 方法论](https://simonwillison.net/2026/Mar/13/liquid/) 的变体，让 Claude 跑了 **90 轮实验**，产出了 MLX Objective-C + Metal 代码，把模型以尽可能高效的方式跑起来。

[danveloper/flash-moe](https://github.com/danveloper/flash-moe) 提供了最终代码，以及一份 [PDF 研究报告](https://github.com/danveloper/flash-moe/blob/main/paper/flash_moe.pdf)（主要由 Claude Opus 4.6 撰写）完整描述了实验过程。

最终模型中，**专家部分量化到 2-bit**，而非专家部分（embedding 表、路由矩阵）保留原始精度，总共 **5.5 GB 常驻内存**。

Qwen 3.5 通常每 token 激活 10 个专家，这套设置把数字降到 4 个；作者声称在降到 3 个时质量下降才明显。

Simon 注：模型输出质量受多大影响其实不清楚。Claude 声称"2-bit 的输出质量在这些评测下与 4-bit 无法区分"，但评测描述相当单薄。

**更新**：Dan 的 [最新版本](https://twitter.com/danveloper/status/2034686509748462022) 把专家量化升级到 4-bit（209GB 磁盘，4.36 tokens/s），原因是 2-bit 版本破坏了 tool calling，而 4-bit 能正常工作。

---

## Key Numbers / 关键数据摘要

| 指标 | 2-bit 版 | 4-bit 版（最新） |
|---|---|---|
| 模型 | Qwen3.5-397B-A17B（MoE） | 同 |
| 硬件 | MacBook Pro M3 Max 48GB | 同 |
| 磁盘占用 | 120GB | **209GB** |
| 常驻内存 | **5.5 GB**（非专家部分） | — |
| 每 token 激活专家数 | 4（标准 10，降到 3 时质量明显下降） | 同 |
| 吞吐 | **5.5+ tokens/s** | **4.36 tokens/s** |
| Tool calling | ❌ 失效 | ✅ 正常 |
| 实验次数 | 90 轮 autoresearch | 同 |

## 这篇博客值得看的理由

1. **把两篇论文的价值连起来**：Karpathy 的 autoresearch（方法论） + Apple 的 LLM in a Flash（算法）→ 真实硬件上跑 397B 模型
2. **公开可复现的 MoE + SSD offload + 极端量化** 落地案例（MLX + Metal 源码全开源）
3. **Q2 vs Q4 的 tool-calling 观察**：量化过猛会损坏 function calling 能力，这对任何要做 Agent 的部署都是直接教训

## 参考

- Dan Woods 的 Tweet（原始宣布）: https://twitter.com/danveloper/status/2034353876753592372
- Dan Woods 的更新 Tweet（4-bit 修 tool calling）: https://twitter.com/danveloper/status/2034686509748462022
- Karpathy autoresearch 原项目: https://github.com/karpathy/autoresearch
- 本地抓取时间: 2026-04-17 from simonwillison.net
