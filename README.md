# AI Doc

[English](#english) | [中文](#中文)

---

<a name="english"></a>

A curated, open-source knowledge base of high-quality AI papers, articles, and model references with Chinese translations. Built for engineers who train models, design AI systems, and ship products in vertical domains.

**Our goal:** Provide developers worldwide with proven thinking patterns, design approaches, and model selection guidance from cutting-edge AI research — not just theory, but actionable engineering insights you can use in your next project.

**How this repo works:** See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete rules, standards, article template, and model entry format. Anyone who clones this repo can contribute following those guidelines.

**📖 Read on the web:** Browse the articles in a styled reading experience at the bilingual GitHub Pages site — see [docs/](docs/) (landing page picks EN / 中文).

---

## Paper Index

### Inference Optimization

| Paper | Authors | Year | Highlights |
|-------|---------|------|------------|
| [FlashAttention](inference-optimization/flashattention.md) | Tri Dao (Stanford / Together AI) | 2022–2024 | IO-aware exact attention kernel. 2–4× speedup, O(N) memory. The kernel every LLM runs on today |
| [LLM in a Flash](inference-optimization/llm-in-a-flash.md) | Alizadeh et al. (Apple) | 2023 | Flash memory parameter storage, sparsity-aware on-demand loading, 20-25x GPU speedup |
| [Fast Inference of MoE with Offloading](inference-optimization/fast-inference-moe-offloading.md) | Eliseev & Mazur | 2023 | MoE expert offloading to SSD/CPU, run Mixtral-8x7B on consumer hardware |
| [TurboQuant](inference-optimization/turboquant.md) | Google Research | 2025 | Data-oblivious vector quantization, KV cache to 3-bit with zero accuracy loss, 8x on H100 |
| [FlashMoE](inference-optimization/flashmoe.md) | Kim et al. | 2026 | ML-based cache replacement for MoE SSD offloading, 2.6x speedup on edge devices |

### Self-Improving Agents

| Paper | Authors | Year | Highlights |
|-------|---------|------|------------|
| [Reflexion](self-improving-agents/reflexion.md) | Shinn et al. | 2023 | Verbal RL — agent writes language 'lessons' after failures, reads them before retry. HumanEval 80% → 91% without weight updates |
| [SPIN](self-improving-agents/spin.md) | Chen et al. | 2024 | Self-play fine-tuning, model vs previous self, no extra annotations needed |
| [Cherry LLM](self-improving-agents/cherry-llm.md) | Li et al. | 2024 | Self-guided data selection via IFD metric, 5% data outperforms full dataset |
| [RISE](self-improving-agents/rise.md) | (see paper) | 2024 | Recursive introspection, multi-turn self-correction, +23.9% on GSM8K |
| [EvolveR](self-improving-agents/evolver.md) | (see paper) | 2025 | Experience-driven self-evolution, distill trajectories into abstract strategic principles |
| [Self-Improving at Test-Time](self-improving-agents/self-improving-test-time.md) | Acikgoz et al. | 2025 | Detect weak spots → auto-generate data → LoRA at test time, +5.48% with 68x fewer samples |
| [Metacognitive Learning](self-improving-agents/metacognitive-learning.md) | Liu & van der Schaar | 2025 | Framework: agents need self-assessment, learning planning, and evaluation to truly self-improve |
| [AgentFactory](self-improving-agents/agent-factory.md) | Zhang et al. | 2026 | Preserves successful solutions as executable Python subagents, not text; Install→Self-Evolve→Deploy lifecycle, ~57% orchestration cost reduction |
| [autoresearch](self-improving-agents/autoresearch.md) | Karpathy | 2026 | Autonomous overnight ML research — agent edits train.py, runs 5-min experiments, keeps/reverts on val_bpb; program.md as lightweight skill |
| [Darwin Skill](self-improving-agents/darwin-skill.md) | Huashu | 2026 | Autoresearch ratchet applied to SKILL.md optimization — 8-dim rubric (structure + effectiveness), independent sub-agent scoring, git-revert on regression |

### Agent Patterns

| Paper | Authors | Year | Highlights |
|-------|---------|------|------------|
| [ReAct](agent-patterns/react.md) | Yao et al. (Princeton / Google) | 2022 | The agent loop primitive — Thought + Action + Observation interleaved. Every modern agent framework is a ReAct variant |
| [Building Effective Agents](agent-patterns/anthropic-building-effective-agents.md) | Anthropic Applied AI | 2024 | The 5 production agent patterns (prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer). Industry de-facto reference |
| [How We Built Our Multi-Agent Research System](agent-patterns/anthropic-multi-agent-research.md) | Anthropic Engineering | 2025 | Inside Claude Research: Opus-lead + Sonnet-workers, +90.2% quality vs single-agent, 15× token cost |
| [Coding Agents & Agent Factory Landscape 2026](agent-patterns/coding-agents-landscape-2026.md) | Landscape article | 2026 | 2026 survey: papers, OSS runtimes, benchmarks, recommended paths for multi-agent coding teams |
| [Nuwa Skill](agent-patterns/nuwa-skill.md) | Huashu | 2026 | 6-agent parallel research swarm distills a public figure's cognitive OS into a reusable SKILL.md |
| [Harness Design for Long-Running Apps](agent-patterns/harness-design-long-running-apps.md) | Prithvi Rajasekaran (Anthropic Labs) | 2026 | GAN-inspired Generator/Evaluator/Planner 3-agent architecture. 6h autonomous coding delivers working DAW/game engine where Solo harness fails |

### Training Techniques

| Paper | Authors | Year | Highlights |
|-------|---------|------|------------|
| [GAN (Generative Adversarial Networks)](training-techniques/gan.md) | Goodfellow et al. | 2014 | Adversarial training: Generator vs Discriminator. 70,000+ citations. Its "independent evaluator" idea now powers RLHF, self-play, and 2026 agent harnesses |
| [Scaling Laws for Neural LMs](training-techniques/scaling-laws.md) | Kaplan et al. (OpenAI) | 2020 | Loss as power law of params × data × compute — spans 7 orders of magnitude. Turned training budget from art into calculation, enabling GPT-3/4 investment |
| [LoRA](training-techniques/lora.md) | Edward Hu et al. (Microsoft) | 2021 | Low-rank adaptation — trains ~10,000× fewer parameters, no inference overhead, matches full fine-tune quality. The PEFT default |
| [Chinchilla (Compute-Optimal LLMs)](training-techniques/chinchilla.md) | Hoffmann et al. (DeepMind) | 2022 | Overturned Kaplan: params and tokens should scale equally. Chinchilla 70B/1.4T beats Gopher 280B/300B at same compute. Rule: tokens ≈ 20× params |
| [DPO (Direct Preference Optimization)](training-techniques/dpo.md) | Rafailov et al. (Stanford) | 2023 | Replaces RLHF's RM + PPO with a single cross-entropy loss. The alignment method every major open model uses |
| [DeepSeek-R1](training-techniques/deepseek-r1.md) | DeepSeek-AI | 2025 | Pure-RL reasoning training via GRPO. o1-level open model (AIME 79.8%, MATH-500 97.3%). Reshaped open-vs-closed balance |

### Thinking Patterns

| Paper | Authors | Year | Highlights |
|-------|---------|------|------------|
| [Decomposing Systems into Modules](ai-thinking/parnas-modules.md) | David L. Parnas | 1972 | The original information-hiding paper. Module boundaries should hide design decisions that might change — not mirror execution flow. Every modern module system descends from this |
| [The Emperor's Old Clothes](ai-thinking/hoare-emperors-old-clothes.md) | C.A.R. Hoare (Turing lecture) | 1980 | "Billion-dollar mistake" (null reference) + "make it so simple there are obviously no deficiencies". Shapes every modern language's Option/Result types |
| [No Silver Bullet](ai-thinking/no-silver-bullet.md) | Fred Brooks | 1986 | Essence vs accidental complexity. "No single advance will give a 10× improvement in a decade." 40 years on, vindicated by LLM coding productivity data (~2× not 10×) |
| [Simple Made Easy](ai-thinking/simple-made-easy.md) | Rich Hickey (Clojure) | 2011 | Gave engineers a vocabulary — simple vs easy, complect vs decomplect. Still the default framework for architecture review arguments 15 years later |
| [Neural Networks, Manifolds, and Topology](ai-thinking/nn-manifolds-topology.md) | Chris Olah | 2014 | The blog post that framed neural networks as geometric deformation of manifolds. Foundation of "embedding space / feature direction" vocabulary and Anthropic's mechanistic interpretability program |
| [Software 2.0](ai-thinking/software-2-0.md) | Andrej Karpathy | 2017 | Neural network weights are source code. A 2017 prediction fully vindicated by the 2025 LLM era |
| [The Bitter Lesson](ai-thinking/bitter-lesson.md) | Rich Sutton | 2019 | 70 years of AI research in 800 words: general methods that leverage computation win. North Star of modern AI engineering |
| [First Principles in Engineering](ai-thinking/first-principles-engineering.md) | Case study · Musk / Kaplan / Chinchilla | 2024 | Three cross-domain cases (SpaceX 30× cost gap, Tesla cell-to-pack 55% cut, AI Scaling Laws) showing first principles as a repeatable operation, not a mindset |

### Memory Systems

| Paper | Authors | Year | Highlights |
|-------|---------|------|------------|
| [MemGPT](memory-systems/memgpt.md) | Packer et al. (Berkeley) | 2023 | LLM as OS, virtual context management, autonomous memory paging |
| [MemoryBank](memory-systems/memorybank.md) | Zhong et al. | 2024 | Ebbinghaus forgetting curve for LLM memory, important memories reinforced, old ones fade |
| [LTM & OMNE](memory-systems/long-term-memory-omne.md) | TCCI | 2024 | Long-term memory for AI self-evolution, OMNE #1 on GAIA benchmark (40.53% vs GPT-4's 15%) |
| [Evo-Memory](memory-systems/evo-memory.md) | Google DeepMind | 2025 | Search→Synthesize→Evolve cycle, ReMem pipeline, 92% on BabyAI |
| [LLM Knowledge Bases](memory-systems/llm-knowledge-bases.md) | Karpathy | 2026 | LLM-maintained personal wiki as a RAG alternative — write-side synthesis, persistent compounding artifact |

---

## Open-Source Model Directory

A curated guide to the best open-source models by capability domain. For project selection, not exhaustive listing.

See **[open-source-models/README.md](open-source-models/README.md)** for the full directory.

| Domain | Top Picks | Why |
|--------|-----------|-----|
| Frontier Reasoning | GLM-5.1, DeepSeek-V3.2, Qwen3.5-397B-A17B | Top of 2026-04 open-weight leaderboards; agentic + long context |
| Coding | Kimi K2.5, GLM-5.1, GLM-4.7 | Kimi K2.5 leads SWE-bench Verified at 76.8%; GLM-4.7 runs on consumer GPU |
| Math | Step-3.5-Flash, DeepSeek-V3.2-Speciale, QwQ-32B | AIME 2025 97.3; QwQ-32B for self-host |
| Multimodal | Qwen3-VL-235B, GLM-4.6V, InternVL3-78B | Rivals Gemini-2.5-Pro; MMMU 72.2 SOTA open-source |
| Long Context | Llama 4 Scout (10M), MiniMax-Text-01 (4M), Qwen2.5-1M | Full codebase / book ingestion |
| Agent / Tool Use | GLM-4.5-Air, Qwen3-30B-A3B-Thinking, MiniMax-M2.7 | Agent-native, best tool calling |
| Edge (≤7B) | Phi-4-mini, Gemma 3 4B, Qwen3.5-0.8B | 4GB RAM; Qwen3.5-0.8B gets 262K ctx + thinking |
| Embedding | BGE-M3, Qwen3-Embedding-8B, Jina v3 | Multilingual RAG defaults + long-doc retrieval |
| ASR | Canary Qwen 2.5B, Parakeet RNNT, Whisper-V3-Turbo | 5.63% WER top-1; 99-language coverage |
| TTS | Fish Audio S2 Pro, CosyVoice2, IndexTTS-2 | Beats OpenAI/Google on Seed-TTS Eval; 150ms streaming |
| Image Gen | FLUX.2, SDXL (ecosystem), SD 3.5 | Photorealism + LoRA ecosystem |
| Video Gen | Wan 2.2, HunyuanVideo, Mochi 1 | First MoE T2V; Apache 2.0 commercial |

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

**📖 在网页上阅读：** 通过双语 GitHub Pages 站点以设计化阅读体验浏览全部文章 —— 见 [docs/](docs/)（首页可选择中文 / English）。

---

## 论文索引

### 推理优化 (Inference Optimization)

| 论文 | 作者 | 年份 | 亮点 |
|------|------|------|------|
| [FlashAttention](inference-optimization/flashattention.md) | Tri Dao（Stanford / Together AI） | 2022–2024 | IO-aware 精确 attention 内核。2–4× 加速、O(N) 内存。今天每个 LLM 的底层内核 |
| [LLM in a Flash](inference-optimization/llm-in-a-flash.md) | Alizadeh et al. (Apple) | 2023 | Flash memory 参数存储，稀疏感知按需加载，GPU 加速 20-25 倍 |
| [Fast Inference of MoE with Offloading](inference-optimization/fast-inference-moe-offloading.md) | Eliseev & Mazur | 2023 | MoE 专家 offload 到 SSD/CPU，消费级硬件跑 Mixtral-8x7B |
| [TurboQuant](inference-optimization/turboquant.md) | Google Research | 2025 | 数据无关向量量化，KV Cache 压缩至 3 bit 无精度损失，H100 加速 8 倍 |
| [FlashMoE](inference-optimization/flashmoe.md) | Kim et al. | 2026 | ML-based 缓存替换 + MoE SSD offload，边缘设备加速 2.6 倍 |

### 自我改进 Agent (Self-Improving Agents)

| 论文 | 作者 | 年份 | 亮点 |
|------|------|------|------|
| [Reflexion](self-improving-agents/reflexion.md) | Shinn et al. | 2023 | 语言强化学习——失败后写一段"lesson"存入记忆，下次尝试前读。HumanEval 从 80% 提到 91%，不改模型权重 |
| [SPIN](self-improving-agents/spin.md) | Chen et al. | 2024 | 自博弈微调，模型 vs 上一版自己，无需额外标注 |
| [Cherry LLM](self-improving-agents/cherry-llm.md) | Li et al. | 2024 | 基于 IFD 指标的自引导数据选择，5% 数据胜过全量数据集 |
| [RISE](self-improving-agents/rise.md) | (见论文) | 2024 | 递归自省，多轮自我修正，GSM8K 提升 23.9% |
| [EvolveR](self-improving-agents/evolver.md) | (见论文) | 2025 | 经验驱动自进化，将交互轨迹蒸馏为抽象策略原则 |
| [测试时自我改进](self-improving-agents/self-improving-test-time.md) | Acikgoz et al. | 2025 | 检测弱项→自动生成数据→测试时 LoRA，样本量减少 68 倍仍提升 5.48% |
| [元认知学习](self-improving-agents/metacognitive-learning.md) | Liu & van der Schaar | 2025 | 框架：真正的自我改进需要自我评估、学习规划和效果评估三种元认知能力 |
| [AgentFactory](self-improving-agents/agent-factory.md) | Zhang et al. | 2026 | 把成功解保存为可执行 Python 子 agent（而非文本），Install→Self-Evolve→Deploy 生命周期，编排成本降低 57% |
| [autoresearch](self-improving-agents/autoresearch.md) | Karpathy | 2026 | 让 AI agent 通宵自主做 ML 研究——改 train.py、跑 5 分钟实验、按 val_bpb 保留或回滚；program.md 作为轻量级 skill |
| [达尔文.skill](self-improving-agents/darwin-skill.md) | 花叔 | 2026 | 把 autoresearch 的棘轮搬到 SKILL.md 优化——8 维评估（结构+实测）、独立子 agent 评分、退步自动回滚 |

### Agent 设计模式 (Agent Patterns)

| 论文 | 作者 | 年份 | 亮点 |
|------|------|------|------|
| [ReAct](agent-patterns/react.md) | Yao et al.（Princeton / Google） | 2022 | Agent 循环的原语——Thought + Action + Observation 交织。现代所有 agent 框架都是 ReAct 变体 |
| [Building Effective Agents](agent-patterns/anthropic-building-effective-agents.md) | Anthropic Applied AI | 2024 | Anthropic 提出的 5 大生产级 agent 工作流模式（prompt chaining、routing、parallelization、orchestrator-workers、evaluator-optimizer）。行业事实标准参考 |
| [How We Built Our Multi-Agent Research System](agent-patterns/anthropic-multi-agent-research.md) | Anthropic Engineering | 2025 | Claude Research 模式背后架构：Opus lead + Sonnet workers，质量 +90.2%，Token 成本 15 倍，完整工程细节 |
| [编程 Agent 与 Agent 工厂生态综述 2026](agent-patterns/coding-agents-landscape-2026.md) | 生态综述 | 2026 | 2026 完整生态综述：论文、开源运行时、基准、以及多 Agent 编码团队与 Agent 工厂研究的推荐路径 |
| [女娲.skill](agent-patterns/nuwa-skill.md) | 花叔 | 2026 | 6 个并行 agent 蒸馏人物认知操作系统（心智模型+决策启发式+表达 DNA）为可运行 SKILL.md |
| [长任务 Harness 设计](agent-patterns/harness-design-long-running-apps.md) | Prithvi Rajasekaran（Anthropic Labs） | 2026 | 受 GAN 启发的 Generator/Evaluator/Planner 三 agent 架构。跑 6 小时自主编码交付可用 DAW / 游戏引擎，Solo harness 做不到 |

### 训练技术 (Training Techniques)

| 论文 | 作者 | 年份 | 亮点 |
|------|------|------|------|
| [GAN (生成对抗网络)](training-techniques/gan.md) | Goodfellow et al. | 2014 | 对抗训练开山之作：Generator vs Discriminator。被引 7 万+。"独立评判"思想在 RLHF、自博弈、2026 agent harness 里持续复活 |
| [Scaling Laws for Neural LMs](training-techniques/scaling-laws.md) | Kaplan et al.（OpenAI） | 2020 | 把 Loss 拆成参数×数据×算力三变量的幂律，跨 7 个数量级成立。让训练预算从艺术变成可计算问题，GPT-3/4 的投资决定都建立在它之上 |
| [LoRA](training-techniques/lora.md) | Edward Hu et al.（Microsoft） | 2021 | 低秩适配微调：可训练参数减少万倍、推理无额外开销、效果持平全量微调。PEFT 事实标准 |
| [Chinchilla (计算最优 LLM)](training-techniques/chinchilla.md) | Hoffmann et al.（DeepMind） | 2022 | 推翻 Kaplan：参数和数据应同比例扩展。Chinchilla 70B/1.4T 同算力打赢 Gopher 280B/300B。经验法则：tokens ≈ 参数 × 20 |
| [DPO (Direct Preference Optimization)](training-techniques/dpo.md) | Rafailov et al.（Stanford） | 2023 | 用一个交叉熵损失替代整套 RLHF（RM+PPO）。2024 年后主流开源模型对齐的事实标准 |
| [DeepSeek-R1](training-techniques/deepseek-r1.md) | DeepSeek-AI | 2025 | 用 GRPO 做纯 RL 推理训练，达到 o1 级开源（AIME 79.8%、MATH-500 97.3%），重塑开源闭源格局 |

### 思维范式 (Thinking Patterns)

| 论文 | 作者 | 年份 | 亮点 |
|------|------|------|------|
| [模块分解准则](ai-thinking/parnas-modules.md) | David L. Parnas | 1972 | 信息隐藏的原始论文：模块边界应该沿着"会变化的设计决策"切而非"执行流程"。现代所有模块系统（OOP、Rust trait、Go interface、微服务）都是这篇的后代 |
| [The Emperor's Old Clothes](ai-thinking/hoare-emperors-old-clothes.md) | C.A.R. Hoare（Turing 奖讲座） | 1980 | Hoare 的亿万美元错误（null reference）+ "简单到显然没有缺陷 vs 复杂到没有显然的缺陷"。塑造了现代所有语言的 Option/Result 类型 |
| [No Silver Bullet](ai-thinking/no-silver-bullet.md) | Fred Brooks | 1986 | Essence vs Accidental Complexity。"没有任何单一技术能在 10 年内带来 10 倍产力提升"——40 年过去，LLM 编码产力数据（约 2 倍而非 10 倍）验证了这一论断 |
| [Simple Made Easy](ai-thinking/simple-made-easy.md) | Rich Hickey（Clojure） | 2011 | Strange Loop 60 分钟演讲：simple vs easy、complect vs decomplect 的词汇奠基。15 年后仍是架构 review 讨论的默认框架 |
| [Neural Networks, Manifolds, and Topology](ai-thinking/nn-manifolds-topology.md) | Chris Olah | 2014 | 把神经网络重新解释为"流形几何变形"的奠基博文。现代 LLM 可解释性使用的"embedding space / feature direction"词汇源于此，也是 Anthropic mechanistic interpretability 研究路线的种子 |
| [Software 2.0](ai-thinking/software-2-0.md) | Andrej Karpathy | 2017 | 范式重塑：神经网络权重即源代码。2017 年的预言在 2025 年 LLM 时代完全兑现 |
| [The Bitter Lesson](ai-thinking/bitter-lesson.md) | Rich Sutton | 2019 | 70 年 AI 研究浓缩成 800 字：能从算力扩展中受益的通用方法最终胜出。现代 AI 工程的北极星 |
| [工程中的第一性原理](ai-thinking/first-principles-engineering.md) | 案例研究 · Musk / Kaplan / Chinchilla | 2024 | 把第一性原理做成可重复操作流程——三个跨领域案例（SpaceX 30 倍成本差、Tesla 电池 55% 降本、AI Scaling Laws）证明它不是态度，是工程方法 |

### 记忆系统 (Memory Systems)

| 论文 | 作者 | 年份 | 亮点 |
|------|------|------|------|
| [MemGPT](memory-systems/memgpt.md) | Packer et al. (Berkeley) | 2023 | LLM 作为操作系统，虚拟上下文管理，自主记忆分页 |
| [MemoryBank](memory-systems/memorybank.md) | Zhong et al. | 2024 | 艾宾浩斯遗忘曲线管理 LLM 记忆，重要记忆强化，旧记忆淡化 |
| [LTM & OMNE](memory-systems/long-term-memory-omne.md) | TCCI | 2024 | 长期记忆驱动 AI 自进化，OMNE 在 GAIA 基准第一名 (40.53% vs GPT-4 的 15%) |
| [Evo-Memory](memory-systems/evo-memory.md) | Google DeepMind | 2025 | Search→Synthesize→Evolve 循环，ReMem 管线，BabyAI 92% |
| [LLM Knowledge Bases](memory-systems/llm-knowledge-bases.md) | Karpathy | 2026 | LLM 维护的个人 Wiki 作为 RAG 的替代——写入侧综合，持久累积的知识产物 |

---

## 开源模型目录

按能力域精选的最佳开源模型指南。用于项目选型，非穷举列表。

详见 **[open-source-models/README.md](open-source-models/README.md)**。

| 领域 | 推荐模型 | 理由 |
|------|----------|------|
| 前沿推理 | GLM-5.1, DeepSeek-V3.2, Qwen3.5-397B-A17B | 2026-04 开源权重榜单顶尖；agent + 长上下文 |
| 代码 | Kimi K2.5, GLM-5.1, GLM-4.7 | Kimi K2.5 SWE-bench Verified 76.8% 居首；GLM-4.7 消费级显卡可跑 |
| 数学 | Step-3.5-Flash, DeepSeek-V3.2-Speciale, QwQ-32B | AIME 2025 97.3；QwQ-32B 自建可用 |
| 多模态 | Qwen3-VL-235B, GLM-4.6V, InternVL3-78B | 比肩 Gemini-2.5-Pro；MMMU 72.2 开源 SOTA |
| 长上下文 | Llama 4 Scout (10M), MiniMax-Text-01 (4M), Qwen2.5-1M | 整个代码库 / 一整本书一次喂 |
| Agent / 工具调用 | GLM-4.5-Air, Qwen3-30B-A3B-Thinking, MiniMax-M2.7 | Agent 原生设计，工具调用最优 |
| 边缘 (≤7B) | Phi-4-mini, Gemma 3 4B, Qwen3.5-0.8B | 4GB RAM；Qwen3.5-0.8B 含 262K 上下文 + 思考模式 |
| 嵌入 Embedding | BGE-M3, Qwen3-Embedding-8B, Jina v3 | 多语 RAG 默认选项 + 长文档检索 |
| 语音识别 ASR | Canary Qwen 2.5B, Parakeet RNNT, Whisper-V3-Turbo | 5.63% WER 居首；99 语言覆盖 |
| 语音合成 TTS | Fish Audio S2 Pro, CosyVoice2, IndexTTS-2 | Seed-TTS Eval 超越 OpenAI / Google；150ms 流式 |
| 图像生成 | FLUX.2, SDXL（生态）, SD 3.5 | 照片级 + LoRA 生态 |
| 视频生成 | Wan 2.2, HunyuanVideo, Mochi 1 | 首个开源 MoE T2V；Mochi Apache 2.0 商用自由 |

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
