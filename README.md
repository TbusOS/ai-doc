# AI Doc

[English](#english) | [中文](#中文)

---

<a name="english"></a>

A curated, open-source knowledge base of high-quality AI papers and articles with Chinese translations. Focused on design patterns, frameworks, algorithms, and engineering approaches that can be directly applied to model training, inference optimization, and real-world AI system design.

**Our goal:** Provide developers worldwide with proven thinking patterns and design approaches from cutting-edge AI research — not just theory, but actionable engineering insights.

## Paper Index

### Inference Optimization

| Paper | Authors | Year | Highlights |
|-------|---------|------|------------|
| [LLM in a Flash](inference-optimization/llm-in-a-flash.md) | Alizadeh et al. (Apple) | 2023 | Flash memory parameter storage, sparsity-aware on-demand loading, 20-25x GPU speedup |
| [Fast Inference of MoE with Offloading](inference-optimization/fast-inference-moe-offloading.md) | Eliseev & Mazur | 2023 | MoE expert offloading to SSD/CPU, run Mixtral-8x7B on consumer hardware |
| [FlashMoE](inference-optimization/flashmoe.md) | Kim et al. | 2026 | ML-based cache replacement for MoE SSD offloading, 2.6x speedup on edge devices |
| [TurboQuant](inference-optimization/turboquant.md) | Google Research | 2025 | Data-oblivious vector quantization, KV cache to 3-bit with zero accuracy loss, 8x on H100 |

## How to Use This Repo

Each article contains:
- **Original link** — direct link to the paper/article
- **English original** — key sections preserved
- **Chinese translation** — paragraph-by-paragraph bilingual format

Browse by topic folder, or use the index above to find papers by area.

## Contributing

We welcome contributions! To add a paper:
1. Fork this repo
2. Create a file under the appropriate topic folder (e.g., `inference-optimization/`)
3. Follow the [article template](CONTRIBUTING.md#article-template)
4. Update this README index
5. Submit a PR

## Recommended Resources

Where to find high-quality AI papers and articles worth reading:

### Primary Sources (Papers & Research Blogs)

| Source | Focus | Why It's Good |
|--------|-------|---------------|
| [arXiv cs.LG / cs.CL](https://arxiv.org/list/cs.LG/recent) | All AI research | First-hand, latest papers |
| [Google Research Blog](https://research.google/blog/) | Systems, quantization, training | Production-proven, engineering-grade |
| [Meta AI Research](https://ai.meta.com/research/) | LLaMA, open-source models | Open-source architecture and training |
| [Apple ML Research](https://machinelearning.apple.com/) | On-device, edge inference | Compression and deployment |
| [Hugging Face Papers](https://huggingface.co/papers) | Community-voted daily picks | Quick daily screening |
| [Hugging Face Blog](https://huggingface.co/blog) | Practical guides, PEFT, quantization | Implementation-oriented |

### Curated & In-Depth Analysis

| Source | Focus | Why It's Good |
|--------|-------|---------------|
| [Papers With Code](https://paperswithcode.com/) | Papers + code + benchmarks | Ensures the approach has working code |
| [Distill.pub](https://distill.pub/) | Visual deep-dives | Best for understanding complex designs |
| [Lilian Weng's Blog](https://lilianweng.github.io/) | Systematic surveys (OpenAI researcher) | Connects an entire field's approaches |
| [The Gradient](https://thegradient.pub/) | Long-form analysis | Architecture thinking and industry trends |
| [Chip Huyen's Blog](https://huyenchip.com/blog/) | MLOps, system design | Real-world deployment patterns |

### Community (Real-Time Signal)

| Source | What You Get |
|--------|-------------|
| [r/MachineLearning](https://reddit.com/r/MachineLearning) | Peer discussion on what actually matters |
| [Hacker News](https://news.ycombinator.com/) | Engineering community signal (TurboQuant went viral here) |
| [Twitter/X AI](https://x.com/) | Follow researchers: @kaboroAI, @_jasonwei, @ylaborit |

### Chinese Sources (中文资源)

| Source | Focus |
|--------|-------|
| [机器之心 Synced](https://www.jiqizhixin.com/) | Most comprehensive CN paper coverage |
| [量子位 QbitAI](https://www.qbitai.com/) | Industry-focused perspective |
| [知乎 AI Topics](https://www.zhihu.com/topic/19813032) | In-depth technical discussions |

---

<a name="中文"></a>

## 中文说明

AI 领域优质论文与文章的中英双语知识库。聚焦可直接应用于模型训练、推理优化和实际 AI 系统设计的设计模式、框架、算法和工程方法。

**目标：** 为全球开发者提供来自前沿 AI 研究的经过验证的思维模式和设计方法 — 不仅是理论，更是可落地的工程洞察。

## 论文索引

### 推理优化 (Inference Optimization)

| 论文 | 作者 | 年份 | 亮点 |
|------|------|------|------|
| [LLM in a Flash](inference-optimization/llm-in-a-flash.md) | Alizadeh et al. (Apple) | 2023 | Flash memory 参数存储，稀疏感知按需加载，GPU 加速 20-25 倍 |
| [Fast Inference of MoE with Offloading](inference-optimization/fast-inference-moe-offloading.md) | Eliseev & Mazur | 2023 | MoE 专家 offload 到 SSD/CPU，消费级硬件跑 Mixtral-8x7B |
| [FlashMoE](inference-optimization/flashmoe.md) | Kim et al. | 2026 | ML-based 缓存替换 + MoE SSD offload，边缘设备加速 2.6 倍 |
| [TurboQuant](inference-optimization/turboquant.md) | Google Research | 2025 | 数据无关向量量化，KV Cache 压缩至 3 bit 无精度损失，H100 加速 8 倍 |

## 如何使用

每篇文章包含：
- **原文链接** — 论文/文章直达链接
- **英文原文** — 保留关键章节
- **中文翻译** — 逐段双语对照

按主题文件夹浏览，或通过上方索引按方向查找论文。

## 参与贡献

欢迎贡献！添加论文步骤：
1. Fork 本仓库
2. 在对应主题文件夹下创建文件（如 `inference-optimization/`）
3. 按照 [文章模板](CONTRIBUTING.md#文章模板) 格式撰写
4. 更新本 README 索引
5. 提交 PR

## 推荐资源

详见上方 [Recommended Resources](#recommended-resources) 部分。

## License

MIT
