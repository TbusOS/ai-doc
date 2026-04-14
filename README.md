# AI Doc

[English](#english) | [中文](#中文)

---

<a name="english"></a>

A curated, open-source knowledge base of high-quality AI papers, articles, and model references with Chinese translations. Built for engineers who train models, design AI systems, and ship products in vertical domains.

**Our goal:** Provide developers worldwide with proven thinking patterns, design approaches, and model selection guidance from cutting-edge AI research — not just theory, but actionable engineering insights you can use in your next project.

**How this repo works:** See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete rules, standards, article template, and model entry format. Anyone who clones this repo can contribute following those guidelines.

---

## Paper Index

### Inference Optimization

| Paper | Authors | Year | Highlights |
|-------|---------|------|------------|
| [LLM in a Flash](inference-optimization/llm-in-a-flash.md) | Alizadeh et al. (Apple) | 2023 | Flash memory parameter storage, sparsity-aware on-demand loading, 20-25x GPU speedup |
| [Fast Inference of MoE with Offloading](inference-optimization/fast-inference-moe-offloading.md) | Eliseev & Mazur | 2023 | MoE expert offloading to SSD/CPU, run Mixtral-8x7B on consumer hardware |
| [FlashMoE](inference-optimization/flashmoe.md) | Kim et al. | 2026 | ML-based cache replacement for MoE SSD offloading, 2.6x speedup on edge devices |
| [TurboQuant](inference-optimization/turboquant.md) | Google Research | 2025 | Data-oblivious vector quantization, KV cache to 3-bit with zero accuracy loss, 8x on H100 |

### Self-Improving Agents

| Paper | Authors | Year | Highlights |
|-------|---------|------|------------|
| [Cherry LLM](self-improving-agents/cherry-llm.md) | Li et al. | 2024 | Self-guided data selection via IFD metric, 5% data outperforms full dataset |
| [SPIN](self-improving-agents/spin.md) | Chen et al. | 2024 | Self-play fine-tuning, model vs previous self, no extra annotations needed |
| [EvolveR](self-improving-agents/evolver.md) | (see paper) | 2025 | Experience-driven self-evolution, distill trajectories into abstract strategic principles |
| [RISE](self-improving-agents/rise.md) | (see paper) | 2024 | Recursive introspection, multi-turn self-correction, +23.9% on GSM8K |
| [Self-Improving at Test-Time](self-improving-agents/self-improving-test-time.md) | Acikgoz et al. | 2025 | Detect weak spots → auto-generate data → LoRA at test time, +5.48% with 68x fewer samples |
| [Metacognitive Learning](self-improving-agents/metacognitive-learning.md) | Liu & van der Schaar | 2025 | Framework: agents need self-assessment, learning planning, and evaluation to truly self-improve |
| [AgentFactory](self-improving-agents/agent-factory.md) | Zhang et al. | 2026 | Preserves successful solutions as executable Python subagents, not text; Install→Self-Evolve→Deploy lifecycle, ~57% orchestration cost reduction |

### Multi-Agent Systems

| Paper | Authors | Year | Highlights |
|-------|---------|------|------------|
| [Coding Agents & Agent Factory Landscape 2026](multi-agent-systems/coding-agents-landscape-2026.md) | Landscape article | 2026 | Complete 2026 survey: papers, open-source runtimes, benchmarks, and recommended paths for multi-agent coding teams and agent-factory research |

### Memory Systems

| Paper | Authors | Year | Highlights |
|-------|---------|------|------------|
| [MemoryBank](memory-systems/memorybank.md) | Zhong et al. | 2024 | Ebbinghaus forgetting curve for LLM memory, important memories reinforced, old ones fade |
| [Evo-Memory](memory-systems/evo-memory.md) | Google DeepMind | 2025 | Search→Synthesize→Evolve cycle, ReMem pipeline, 92% on BabyAI |
| [MemGPT](memory-systems/memgpt.md) | Packer et al. (Berkeley) | 2023 | LLM as OS, virtual context management, autonomous memory paging |
| [LTM & OMNE](memory-systems/long-term-memory-omne.md) | TCCI | 2024 | Long-term memory for AI self-evolution, OMNE #1 on GAIA benchmark (40.53% vs GPT-4's 15%) |
| [LLM Knowledge Bases](memory-systems/llm-knowledge-bases.md) | Karpathy | 2026 | LLM-maintained personal wiki as a RAG alternative — write-side synthesis, persistent compounding artifact |

---

## Open-Source Model Directory

A curated guide to the best open-source models by capability domain. For project selection, not exhaustive listing.

See **[open-source-models/README.md](open-source-models/README.md)** for the full directory.

| Domain | Top Picks | Why |
|--------|-----------|-----|
| General Reasoning | DeepSeek-V3.2, Qwen3.5 | GPT-5 level reasoning, MIT/Apache license |
| Coding | GLM-4.7, Kimi K2.5 | 91%+ SWE-bench, real bug fixing |
| Math | Qwen3-Max, DeepSeek-V3.2-Speciale | 97.8% MATH-500, AIME-level |
| Multimodal/Vision | GLM-4.6V, Qwen2.5-VL | Native tool use, 128K context |
| Edge/Mobile (≤3B) | Phi-4-mini, Gemma-3n, Qwen3.5-0.8B | 4GB RAM, mobile-ready |
| Long Context | Llama 4 Scout | 10M token context window |
| Multilingual | Qwen3 | 119 languages |

---

## How to Use This Repo

Each article contains:
- **Original link** — direct link to the paper/article
- **English original** — key sections preserved
- **Chinese translation** — paragraph-by-paragraph bilingual format

Each model entry contains:
- **Model name, provider, and license**
- **Parameter count and hardware requirements**
- **Best-for scenarios and benchmark highlights**
- **Download links (Hugging Face / official)**

Browse by topic folder, or use the index above.

## Contributing

We welcome contributions from anyone! Full rules and templates are in **[CONTRIBUTING.md](CONTRIBUTING.md)**.

Quick start:
1. Fork this repo
2. Add a paper or model entry following the templates
3. Update this README index (both EN and CN tables)
4. Submit a PR

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
| [Hacker News](https://news.ycombinator.com/) | Engineering community signal |
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

AI 领域优质论文、文章与模型的中英双语知识库。为训练模型、设计 AI 系统、垂直领域项目落地的工程师而建。

**目标：** 为全球开发者提供来自前沿 AI 研究的经过验证的思维模式、设计方法和模型选型指南 — 不仅是理论，更是你下一个项目可以直接用的工程洞察。

**仓库规则：** 完整的收录标准、文章模板、模型条目格式见 [CONTRIBUTING.md](CONTRIBUTING.md)。任何人 clone 此仓库后都可以按照规则参与贡献。

---

## 论文索引

### 推理优化 (Inference Optimization)

| 论文 | 作者 | 年份 | 亮点 |
|------|------|------|------|
| [LLM in a Flash](inference-optimization/llm-in-a-flash.md) | Alizadeh et al. (Apple) | 2023 | Flash memory 参数存储，稀疏感知按需加载，GPU 加速 20-25 倍 |
| [Fast Inference of MoE with Offloading](inference-optimization/fast-inference-moe-offloading.md) | Eliseev & Mazur | 2023 | MoE 专家 offload 到 SSD/CPU，消费级硬件跑 Mixtral-8x7B |
| [FlashMoE](inference-optimization/flashmoe.md) | Kim et al. | 2026 | ML-based 缓存替换 + MoE SSD offload，边缘设备加速 2.6 倍 |
| [TurboQuant](inference-optimization/turboquant.md) | Google Research | 2025 | 数据无关向量量化，KV Cache 压缩至 3 bit 无精度损失，H100 加速 8 倍 |

### 自我改进 Agent (Self-Improving Agents)

| 论文 | 作者 | 年份 | 亮点 |
|------|------|------|------|
| [Cherry LLM](self-improving-agents/cherry-llm.md) | Li et al. | 2024 | 基于 IFD 指标的自引导数据选择，5% 数据胜过全量数据集 |
| [SPIN](self-improving-agents/spin.md) | Chen et al. | 2024 | 自博弈微调，模型 vs 上一版自己，无需额外标注 |
| [EvolveR](self-improving-agents/evolver.md) | (见论文) | 2025 | 经验驱动自进化，将交互轨迹蒸馏为抽象策略原则 |
| [RISE](self-improving-agents/rise.md) | (见论文) | 2024 | 递归自省，多轮自我修正，GSM8K 提升 23.9% |
| [测试时自我改进](self-improving-agents/self-improving-test-time.md) | Acikgoz et al. | 2025 | 检测弱项→自动生成数据→测试时 LoRA，样本量减少 68 倍仍提升 5.48% |
| [元认知学习](self-improving-agents/metacognitive-learning.md) | Liu & van der Schaar | 2025 | 框架：真正的自我改进需要自我评估、学习规划和效果评估三种元认知能力 |
| [AgentFactory](self-improving-agents/agent-factory.md) | Zhang et al. | 2026 | 把成功解保存为可执行 Python 子 agent（而非文本），Install→Self-Evolve→Deploy 生命周期，编排成本降低 57% |

### 多 Agent 系统 (Multi-Agent Systems)

| 论文 | 作者 | 年份 | 亮点 |
|------|------|------|------|
| [编程 Agent 与 Agent 工厂生态综述 2026](multi-agent-systems/coding-agents-landscape-2026.md) | 生态综述 | 2026 | 2026 完整生态综述：论文、开源运行时、基准、以及多 Agent 编码团队与 Agent 工厂研究的推荐路径 |

### 记忆系统 (Memory Systems)

| 论文 | 作者 | 年份 | 亮点 |
|------|------|------|------|
| [MemoryBank](memory-systems/memorybank.md) | Zhong et al. | 2024 | 艾宾浩斯遗忘曲线管理 LLM 记忆，重要记忆强化，旧记忆淡化 |
| [Evo-Memory](memory-systems/evo-memory.md) | Google DeepMind | 2025 | Search→Synthesize→Evolve 循环，ReMem 管线，BabyAI 92% |
| [MemGPT](memory-systems/memgpt.md) | Packer et al. (Berkeley) | 2023 | LLM 作为操作系统，虚拟上下文管理，自主记忆分页 |
| [LTM & OMNE](memory-systems/long-term-memory-omne.md) | TCCI | 2024 | 长期记忆驱动 AI 自进化，OMNE 在 GAIA 基准第一名 (40.53% vs GPT-4 的 15%) |
| [LLM Knowledge Bases](memory-systems/llm-knowledge-bases.md) | Karpathy | 2026 | LLM 维护的个人 Wiki 作为 RAG 的替代——写入侧综合，持久累积的知识产物 |

---

## 开源模型目录

按能力域精选的最佳开源模型指南。用于项目选型，非穷举列表。

详见 **[open-source-models/README.md](open-source-models/README.md)**。

| 领域 | 推荐模型 | 理由 |
|------|----------|------|
| 通用推理 | DeepSeek-V3.2, Qwen3.5 | GPT-5 级推理能力，MIT/Apache 许可 |
| 代码 | GLM-4.7, Kimi K2.5 | SWE-bench 91%+，真实 bug 修复 |
| 数学 | Qwen3-Max, DeepSeek-V3.2-Speciale | MATH-500 97.8%，AIME 级别 |
| 多模态/视觉 | GLM-4.6V, Qwen2.5-VL | 原生工具调用，128K 上下文 |
| 边缘/移动 (≤3B) | Phi-4-mini, Gemma-3n, Qwen3.5-0.8B | 4GB RAM 可用，移动端就绪 |
| 长上下文 | Llama 4 Scout | 1000 万 token 上下文窗口 |
| 多语言 | Qwen3 | 119 种语言 |

## 如何使用

每篇文章包含：
- **原文链接** — 论文/文章直达链接
- **英文原文** — 保留关键章节
- **中文翻译** — 逐段双语对照

每个模型条目包含：
- **模型名称、提供方和许可证**
- **参数量和硬件要求**
- **最佳使用场景和基准亮点**
- **下载链接 (Hugging Face / 官方)**

按主题文件夹浏览，或通过上方索引按方向查找。

## 参与贡献

欢迎任何人贡献！完整规则和模板见 **[CONTRIBUTING.md](CONTRIBUTING.md)**。

## 推荐资源

详见上方 [Recommended Resources](#recommended-resources) 部分。

## License

MIT
