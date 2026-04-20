#!/usr/bin/env python3
"""
Build script for AI Doc GitHub Pages.

Reads the README + article .md files from repo root, renders everything into
docs/ as static HTML styled with the Anthropic design system.

Run from repo root:
    python3 docs/scripts/build.py

Idempotent — safe to re-run after content updates.
"""

from __future__ import annotations

import html
import re
import shutil
from dataclasses import dataclass
from pathlib import Path

import markdown

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DOCS_DIR = REPO_ROOT / "docs"
ARTICLES_EN_DIR = DOCS_DIR / "en" / "articles"
ARTICLES_ZH_DIR = DOCS_DIR / "zh" / "articles"


@dataclass
class Paper:
    slug: str
    md_path: str
    title: str
    authors: str
    year: str
    en_highlight: str
    zh_highlight: str


@dataclass
class Category:
    key: str
    en_title: str
    zh_title: str
    en_tagline: str
    zh_tagline: str
    en_desc: str
    zh_desc: str
    badge_class: str
    accent_color: str
    papers: list[Paper]


CATEGORIES: list[Category] = [
    Category(
        key="inference-optimization",
        en_title="Inference Optimization",
        zh_title="推理优化",
        en_tagline="Running frontier models on constrained hardware",
        zh_tagline="在受限硬件上跑前沿模型",
        en_desc="Parameter offloading, sparsity, quantization, MoE caching — the engineering that makes large models fit where they otherwise wouldn't.",
        zh_desc="参数外存、稀疏加载、量化、MoE 缓存——让大模型跑在它本不该跑的硬件上所需的工程。",
        badge_class="badge-inference",
        accent_color="#6a9bcc",
        papers=[
            # Ordered by year of publication (earliest first).
            Paper(
                "flashattention",
                "inference-optimization/flashattention.md",
                "FlashAttention (v1/v2/v3)",
                "Tri Dao (Stanford / Together AI)",
                "2022–2024",
                "IO-aware exact attention kernel. 2–4× speedup, O(N) memory. The kernel everyone's LLM runs on today.",
                "IO-aware 精确 attention 内核。2–4× 加速、O(N) 内存。今天每个 LLM 的底层内核。",
            ),
            Paper(
                "llm-in-a-flash",
                "inference-optimization/llm-in-a-flash.md",
                "LLM in a Flash",
                "Alizadeh et al. (Apple)",
                "2023",
                "Flash memory parameter storage, sparsity-aware on-demand loading, 20–25× GPU speedup.",
                "Flash 存储参数、稀疏感知按需加载，GPU 加速 20–25 倍。",
            ),
            Paper(
                "fast-inference-moe-offloading",
                "inference-optimization/fast-inference-moe-offloading.md",
                "Fast Inference of MoE with Offloading",
                "Eliseev & Mazur",
                "2023",
                "MoE expert offloading to SSD/CPU, run Mixtral-8x7B on consumer hardware.",
                "MoE 专家 offload 到 SSD/CPU，消费级硬件跑 Mixtral-8x7B。",
            ),
            Paper(
                "turboquant",
                "inference-optimization/turboquant.md",
                "TurboQuant",
                "Google Research",
                "2025",
                "Data-oblivious vector quantization, KV cache to 3-bit with zero accuracy loss, 8× on H100.",
                "数据无关向量量化，KV Cache 压到 3 bit 无精度损失，H100 加速 8 倍。",
            ),
            Paper(
                "flashmoe",
                "inference-optimization/flashmoe.md",
                "FlashMoE",
                "Kim et al.",
                "2026",
                "ML-based cache replacement for MoE SSD offloading, 2.6× speedup on edge devices.",
                "ML 驱动缓存替换 + MoE SSD offload，边缘设备加速 2.6 倍。",
            ),
        ],
    ),
    Category(
        key="self-improving-agents",
        en_title="Self-Improving Agents",
        zh_title="自我改进 Agent",
        en_tagline="Agents that rewrite their own code, data, or skills",
        zh_tagline="Agent 改自己的代码、数据或 skill",
        en_desc="From self-play and test-time adaptation to executable subagents and autoresearch ratchets — how agents compound capability over time.",
        zh_desc="从自博弈、测试时适应到可执行子 agent、autoresearch 棘轮——agent 随时间复利累积能力的路径。",
        badge_class="badge-self",
        accent_color="#d97757",
        papers=[
            # Ordered by year of publication (earliest first).
            Paper(
                "reflexion",
                "self-improving-agents/reflexion.md",
                "Reflexion",
                "Shinn et al.",
                "2023",
                "Verbal reinforcement learning — agent writes language 'lessons' after failures, reads them before retry. HumanEval 80% → 91% without weight updates.",
                "用自然语言反馈替代梯度更新，HumanEval 从 80% 提到 91%，不改模型权重。",
            ),
            Paper(
                "spin",
                "self-improving-agents/spin.md",
                "SPIN",
                "Chen et al.",
                "2024",
                "Self-play fine-tuning, model vs previous self, no extra annotations needed.",
                "自博弈微调，模型 vs 上一版自己，无需额外标注。",
            ),
            Paper(
                "cherry-llm",
                "self-improving-agents/cherry-llm.md",
                "Cherry LLM",
                "Li et al.",
                "2024",
                "Self-guided data selection via IFD metric, 5% data outperforms full dataset.",
                "基于 IFD 指标的自引导数据选择，5% 数据胜过全量。",
            ),
            Paper(
                "rise",
                "self-improving-agents/rise.md",
                "RISE",
                "(see paper)",
                "2024",
                "Recursive introspection, multi-turn self-correction, +23.9% on GSM8K.",
                "递归自省，多轮自我修正，GSM8K 提升 23.9%。",
            ),
            Paper(
                "evolver",
                "self-improving-agents/evolver.md",
                "EvolveR",
                "(see paper)",
                "2025",
                "Experience-driven self-evolution, distill trajectories into abstract strategic principles.",
                "经验驱动自进化，交互轨迹蒸馏为抽象策略原则。",
            ),
            Paper(
                "self-improving-test-time",
                "self-improving-agents/self-improving-test-time.md",
                "Self-Improving at Test-Time",
                "Acikgoz et al.",
                "2025",
                "Detect weak spots → auto-generate data → LoRA at test time, +5.48% with 68× fewer samples.",
                "检测弱项→自动生成数据→测试时 LoRA，样本量减 68 倍仍提升 5.48%。",
            ),
            Paper(
                "metacognitive-learning",
                "self-improving-agents/metacognitive-learning.md",
                "Metacognitive Learning",
                "Liu & van der Schaar",
                "2025",
                "Framework: agents need self-assessment, learning planning, and evaluation to truly self-improve.",
                "框架：真正的自我改进需要自我评估、学习规划、效果评估三种元认知能力。",
            ),
            Paper(
                "agent-factory",
                "self-improving-agents/agent-factory.md",
                "AgentFactory",
                "Zhang et al.",
                "2026",
                "Preserves successful solutions as executable Python subagents, not text. Install→Self-Evolve→Deploy lifecycle, ~57% orchestration cost reduction.",
                "把成功解保存为可执行 Python 子 agent（而非文本），Install→Self-Evolve→Deploy 生命周期，编排成本降低 57%。",
            ),
            Paper(
                "autoresearch",
                "self-improving-agents/autoresearch.md",
                "autoresearch",
                "Karpathy",
                "2026",
                "Autonomous overnight ML research — agent edits train.py, runs 5-min experiments, keeps/reverts on val_bpb. program.md as lightweight skill.",
                "让 AI agent 通宵自主做 ML 研究——改 train.py、跑 5 分钟实验、按 val_bpb 保留或回滚；program.md 作为轻量级 skill。",
            ),
            Paper(
                "darwin-skill",
                "self-improving-agents/darwin-skill.md",
                "Darwin Skill · 达尔文",
                "Huashu",
                "2026",
                "Autoresearch ratchet applied to SKILL.md optimization — 8-dim rubric (structure + effectiveness), independent sub-agent scoring, git-revert on regression.",
                "把 autoresearch 的棘轮搬到 SKILL.md 优化——8 维评估（结构+实测）、独立子 agent 评分、退步自动回滚。",
            ),
        ],
    ),
    Category(
        key="agent-patterns",
        en_title="Agent Patterns",
        zh_title="Agent 设计模式",
        en_tagline="Production-ready blueprints for single-agent and multi-agent systems",
        zh_tagline="单 agent 与多 agent 系统的生产级蓝图",
        en_desc="The patterns that frontier labs use when they build real agents — from Anthropic's 5 workflow archetypes to ReAct's foundational loop.",
        zh_desc="前沿实验室真正构建 agent 时用的模式——从 Anthropic 5 个工作流原型到 ReAct 的基础循环。",
        badge_class="badge-agent",
        accent_color="#788c5d",
        papers=[
            # Ordered by year of publication (earliest first).
            Paper(
                "react",
                "agent-patterns/react.md",
                "ReAct: Synergizing Reasoning and Acting",
                "Yao et al. (Princeton / Google)",
                "2022",
                "The agent loop primitive — Thought + Action + Observation interleaved. Every modern agent framework is a ReAct variant.",
                "agent 循环的原语——Thought + Action + Observation 交织。现代 agent 框架都是 ReAct 的变体。",
            ),
            Paper(
                "anthropic-building-effective-agents",
                "agent-patterns/anthropic-building-effective-agents.md",
                "Building Effective Agents",
                "Anthropic Applied AI",
                "2024",
                "The 5 production agent patterns from Anthropic: prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer. Industry de-facto reference.",
                "Anthropic 提出的 5 大生产级 agent 工作流模式，2025 年之后的行业事实标准参考。",
            ),
            Paper(
                "anthropic-multi-agent-research",
                "agent-patterns/anthropic-multi-agent-research.md",
                "How We Built Our Multi-Agent Research System",
                "Anthropic Engineering",
                "2025",
                "Inside Claude Research — Opus lead + Sonnet workers, +90.2% quality vs single-agent, 15× token cost. Full engineering detail.",
                "Claude Research 背后架构：Opus lead + Sonnet workers，质量 +90.2%，Token 成本 15 倍，完整工程细节。",
            ),
            Paper(
                "coding-agents-landscape-2026",
                "agent-patterns/coding-agents-landscape-2026.md",
                "Coding Agents & Agent Factory Landscape 2026",
                "Landscape article",
                "2026",
                "Complete 2026 survey: papers, open-source runtimes, benchmarks, and recommended paths for multi-agent coding teams and agent-factory research.",
                "2026 完整生态综述：论文、开源运行时、基准、多 Agent 编码团队与 Agent 工厂研究的推荐路径。",
            ),
            Paper(
                "nuwa-skill",
                "agent-patterns/nuwa-skill.md",
                "Nuwa Skill · 女娲",
                "Huashu",
                "2026",
                "6-agent parallel research swarm distills a public figure's cognitive OS (mental models + decision heuristics + expression DNA) into a reusable SKILL.md.",
                "6 个并行 agent 蒸馏人物认知操作系统（心智模型+决策启发式+表达 DNA）为可运行 SKILL.md。",
            ),
            Paper(
                "harness-design-long-running-apps",
                "agent-patterns/harness-design-long-running-apps.md",
                "Harness Design for Long-Running Apps",
                "Prithvi Rajasekaran (Anthropic Labs)",
                "2026",
                "GAN-inspired Generator/Evaluator/Planner architecture for 6-hour autonomous coding. Functional DAW/game engine production — Solo 20min/$9 broken vs Full 6h/$200 working.",
                "受 GAN 启发的 Generator/Evaluator/Planner 三 agent 架构，跑 6 小时自主编码。Solo 20 分钟 $9 做不出来的东西，Full harness 6 小时 $200 完整可用。",
            ),
        ],
    ),
    Category(
        key="training-techniques",
        en_title="Training Techniques",
        zh_title="训练技术",
        en_tagline="Frontier training recipes — reasoning, alignment, and efficient fine-tuning",
        zh_tagline="前沿训练配方——推理、对齐、高效微调",
        en_desc="Open-source reproducible methods that moved the frontier: GRPO-based reasoning RL (DeepSeek-R1), RLHF replacement via DPO, parameter-efficient adaptation via LoRA.",
        zh_desc="推动前沿且可开源复现的训练方法：GRPO 推理 RL（DeepSeek-R1）、替代 RLHF 的 DPO、参数高效适配 LoRA。",
        badge_class="badge-training",
        accent_color="#a14238",
        papers=[
            # Ordered by year of publication (earliest first).
            Paper(
                "gan",
                "training-techniques/gan.md",
                "Generative Adversarial Networks",
                "Goodfellow et al.",
                "2014",
                "The adversarial training paradigm — Generator vs Discriminator. 70,000+ citations. Its 'independent evaluator' idea now powers RLHF, self-play, and 2026 agent harnesses.",
                "对抗训练开山之作——Generator vs Discriminator。被引 7 万+。"
                "\"独立评判\"思想在 RLHF、自博弈、2026 agent harness 里持续复活。",
            ),
            Paper(
                "scaling-laws",
                "training-techniques/scaling-laws.md",
                "Scaling Laws for Neural Language Models",
                "Kaplan et al. (OpenAI)",
                "2020",
                "Loss as a power law of params × data × compute — spans 7 orders of magnitude. Turned training budget from art into calculation. Enabled GPT-3/4 investment.",
                "把 Loss 拆成参数×数据×算力三变量的幂律，跨 7 个数量级成立。让训练预算从艺术变成可计算问题，GPT-3/4 的投资决定都建立在它之上。",
            ),
            Paper(
                "lora",
                "training-techniques/lora.md",
                "LoRA",
                "Edward Hu et al. (Microsoft)",
                "2021",
                "Low-rank adaptation — trains ~10,000× fewer parameters, no inference overhead, matches full fine-tune quality. The PEFT default.",
                "低秩适配微调：可训练参数减少万倍、推理无额外开销、效果持平全量微调。PEFT 事实标准。",
            ),
            Paper(
                "chinchilla",
                "training-techniques/chinchilla.md",
                "Chinchilla (Compute-Optimal LLMs)",
                "Hoffmann et al. (DeepMind)",
                "2022",
                "Overturned Kaplan: params and tokens should scale equally (not params faster). Chinchilla 70B/1.4T beats Gopher 280B/300B at the same compute. Rule of thumb: tokens ≈ 20× params.",
                "推翻 Kaplan：参数和数据应同比例扩展。Chinchilla 70B/1.4T 同算力打赢 Gopher 280B/300B。经验法则：tokens ≈ 参数量 × 20。",
            ),
            Paper(
                "dpo",
                "training-techniques/dpo.md",
                "Direct Preference Optimization",
                "Rafailov et al. (Stanford)",
                "2023",
                "Replaces RLHF's reward model + PPO with a single cross-entropy loss. The alignment method every major open model now uses.",
                "用一个交叉熵损失替代整套 RLHF（RM+PPO），2024 年之后主流开源模型对齐的事实标准。",
            ),
            Paper(
                "deepseek-r1",
                "training-techniques/deepseek-r1.md",
                "DeepSeek-R1",
                "DeepSeek-AI",
                "2025",
                "Pure-RL reasoning training via GRPO. o1-level open-source model (AIME 79.8%, MATH-500 97.3%). Reshaped the open vs closed balance.",
                "用 GRPO 做纯 RL 推理训练，达到 o1 级开源（AIME 79.8%、MATH-500 97.3%），重塑开源闭源格局。",
            ),
        ],
    ),
    Category(
        key="ai-thinking",
        en_title="Thinking Patterns",
        zh_title="思维范式",
        en_tagline="Mental models frontier engineers use to make AI and systems decisions",
        zh_tagline="前沿工程师做 AI 与系统决策时使用的思维工具",
        en_desc="Short, dense essays and case studies from frontier practitioners — the mental models actively driving modern engineering decisions. AI-specific paradigms sit alongside general engineering philosophy that applies to AI work.",
        zh_desc="前沿实践者的简短、高密度 essay 与案例研究——2026 年工程决策里仍被频繁引用的思维工具。AI 专属的范式与能直接应用于 AI 工程的通用工程哲学并列。",
        badge_class="badge-thinking",
        accent_color="#6b8e3c",
        papers=[
            # Ordered by year of publication (earliest first).
            Paper(
                "parnas-modules",
                "ai-thinking/parnas-modules.md",
                "Decomposing Systems into Modules",
                "David L. Parnas",
                "1972",
                "The original information-hiding paper. Module boundaries should hide design decisions that might change — not mirror execution flow. Every modern module system (OOP, Rust traits, Go interfaces, microservices) descends from this.",
                "信息隐藏的原始论文。模块边界应该沿着「会变化的设计决策」切，而不是「执行流程」。OOP、Rust trait、Go interface、微服务——全部是这篇的后代。",
            ),
            Paper(
                "hoare-emperors-old-clothes",
                "ai-thinking/hoare-emperors-old-clothes.md",
                "The Emperor's Old Clothes",
                "C.A.R. Hoare (Turing Award lecture)",
                "1980",
                "Hoare's Turing lecture. The 'billion-dollar mistake' (inventing null reference) + 'make it so simple there are obviously no deficiencies, not so complex there are no obvious deficiencies'. Shapes every modern language's Option/Result types.",
                "Hoare 的 Turing 奖讲座。坦诚承认他 1965 年发明 null 是「亿万美元错误」，并提出「简单到显然没有缺陷，而不是复杂到没有显然的缺陷」——塑造了现代所有语言的 Option/Result 类型。",
            ),
            Paper(
                "no-silver-bullet",
                "ai-thinking/no-silver-bullet.md",
                "No Silver Bullet",
                "Fred Brooks",
                "1986",
                "Essence vs accidental complexity. 'No single advance in technology or management will give a 10× improvement in a decade.' 40 years on, vindicated by LLM coding productivity data (~2× not 10×).",
                "Essence vs Accidental Complexity。「没有任何单一技术或管理方法能在 10 年内带来 10 倍产力提升」——40 年过去，LLM 编码产力数据（约 2 倍而非 10 倍）验证了这一论断。",
            ),
            Paper(
                "simple-made-easy",
                "ai-thinking/simple-made-easy.md",
                "Simple Made Easy",
                "Rich Hickey (Clojure)",
                "2011",
                "The 60-min Strange Loop talk that gave engineers a vocabulary — simple vs easy, complect vs decomplect. 15 years later, still the default framework for architecture review arguments.",
                "Strange Loop 60 分钟演讲，给程序员奠定了一套词汇：simple vs easy、complect vs decomplect。15 年后仍是架构 review 讨论的默认框架。",
            ),
            Paper(
                "nn-manifolds-topology",
                "ai-thinking/nn-manifolds-topology.md",
                "Neural Networks, Manifolds, and Topology",
                "Chris Olah",
                "2014",
                "The blog post that framed neural networks as geometric deformation of manifolds. Foundation of the 'embedding space / feature direction' vocabulary used in all modern LLM interpretability — and seed of Anthropic's mechanistic interpretability program.",
                "把神经网络重新解释为「流形的几何变形」的奠基博文。现代 LLM 可解释性使用的「embedding space / feature direction」词汇全部源于此，也是 Anthropic mechanistic interpretability 研究路线的种子。",
            ),
            Paper(
                "software-2-0",
                "ai-thinking/software-2-0.md",
                "Software 2.0",
                "Andrej Karpathy",
                "2017",
                "Reframes programming: neural network weights are source code. A 2017 prediction fully vindicated by the 2025 LLM era.",
                "范式重塑：神经网络权重就是源代码。2017 年的预言在 2025 年 LLM 时代完全兑现。",
            ),
            Paper(
                "bitter-lesson",
                "ai-thinking/bitter-lesson.md",
                "The Bitter Lesson",
                "Rich Sutton",
                "2019",
                "70 years of AI research in 800 words: general methods that leverage computation win. The North Star of modern AI engineering.",
                "70 年 AI 研究浓缩成 800 字：能从算力扩展中获益的通用方法最终胜出。现代 AI 工程的北极星。",
            ),
            Paper(
                "first-principles-engineering",
                "ai-thinking/first-principles-engineering.md",
                "First Principles in Engineering",
                "Case study · Musk / Kaplan / Chinchilla",
                "2024",
                "First-principles thinking as a repeatable operation — not a mindset. Three cross-domain cases: SpaceX rocket economics (30× cost gap), Tesla cell-to-pack (55% cost cut), AI scaling laws (budget → calculable result).",
                "把第一性原理做成可重复操作流程——不是态度。三个跨领域案例：SpaceX 火箭 30 倍成本差、Tesla 电池 55% 降本、AI Scaling Laws 把预算变成可计算问题。",
            ),
        ],
    ),
    Category(
        key="memory-systems",
        en_title="Memory Systems",
        zh_title="记忆系统",
        en_tagline="Persistent, evolving memory for long-lived AI",
        zh_tagline="让 AI 拥有持续演化的记忆",
        en_desc="From Ebbinghaus-inspired forgetting curves to LLM-maintained wikis — how agents remember, forget, and compound knowledge over time.",
        zh_desc="从艾宾浩斯遗忘曲线到 LLM 维护的 Wiki——agent 如何记住、遗忘、并随时间复利累积知识。",
        badge_class="badge-memory",
        accent_color="#141413",
        papers=[
            # Ordered by year of publication (earliest first).
            Paper(
                "memgpt",
                "memory-systems/memgpt.md",
                "MemGPT",
                "Packer et al. (Berkeley)",
                "2023",
                "LLM as OS, virtual context management, autonomous memory paging.",
                "LLM 作为操作系统，虚拟上下文管理，自主记忆分页。",
            ),
            Paper(
                "memorybank",
                "memory-systems/memorybank.md",
                "MemoryBank",
                "Zhong et al.",
                "2024",
                "Ebbinghaus forgetting curve for LLM memory, important memories reinforced, old ones fade.",
                "艾宾浩斯遗忘曲线管理 LLM 记忆，重要记忆强化，旧记忆淡化。",
            ),
            Paper(
                "long-term-memory-omne",
                "memory-systems/long-term-memory-omne.md",
                "LTM & OMNE",
                "TCCI",
                "2024",
                "Long-term memory for AI self-evolution, OMNE #1 on GAIA benchmark (40.53% vs GPT-4's 15%).",
                "长期记忆驱动 AI 自进化，OMNE 在 GAIA 基准第一名（40.53% vs GPT-4 的 15%）。",
            ),
            Paper(
                "evo-memory",
                "memory-systems/evo-memory.md",
                "Evo-Memory",
                "Google DeepMind",
                "2025",
                "Search→Synthesize→Evolve cycle, ReMem pipeline, 92% on BabyAI.",
                "Search→Synthesize→Evolve 循环，ReMem 管线，BabyAI 92%。",
            ),
            Paper(
                "llm-knowledge-bases",
                "memory-systems/llm-knowledge-bases.md",
                "LLM Knowledge Bases",
                "Karpathy",
                "2026",
                "LLM-maintained personal wiki as a RAG alternative — write-side synthesis, persistent compounding artifact.",
                "LLM 维护的个人 Wiki 作为 RAG 的替代——写入侧综合，持久累积的知识产物。",
            ),
        ],
    ),
]


OPEN_SOURCE_MODELS = {
    "en_title": "Open-Source Model Directory",
    "zh_title": "开源模型目录",
    "en_tagline": "Pick the right open-source model for your domain",
    "zh_tagline": "为你的领域选对开源模型",
    "en_desc": "Curated guide to the best open-source models across 12 capability domains — benchmark-verified, hardware-aware, license-annotated. Content is rendered from the live source-of-truth at open-source-models/README.md.",
    "zh_desc": "跨 12 个能力域的最佳开源模型精选指南——基于 benchmark 核验、标注硬件要求与许可证。内容直接渲染自 open-source-models/README.md（单一真相源）。",
    # Categories for the navigation/TOC — matches headings in the README source
    "categories_en": [
        "Frontier Reasoning", "Coding", "Math & Reasoning", "Multimodal / Vision",
        "Long Context", "Agent / Tool Use", "Edge & Mobile",
        "Embedding & Retrieval", "Speech-to-Text", "Text-to-Speech",
        "Image Generation", "Video Generation",
    ],
    "categories_zh": [
        "前沿推理", "代码", "数学与推理", "多模态与视觉",
        "长上下文", "Agent 与工具调用", "边缘与移动端",
        "嵌入与检索", "语音识别", "语音合成",
        "图像生成", "视频生成",
    ],
}


# ---------------------------------------------------------------------------
# HTML fragments
# ---------------------------------------------------------------------------


def page_shell(lang: str, title: str, body: str, extra_head: str = "", asset_prefix: str = "../") -> str:
    nav = render_nav(lang, asset_prefix)
    footer = render_footer(asset_prefix)
    return f"""<!doctype html>
<html lang="{lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{html.escape(title)}</title>
    <link rel="stylesheet" href="{asset_prefix}assets/fonts.css">
    <link rel="stylesheet" href="{asset_prefix}assets/anthropic.css">
    <link rel="stylesheet" href="{asset_prefix}assets/site.css">
    {extra_head}
  </head>
  <body>
    {nav}
    <main>
{body}
    </main>
    {footer}
  </body>
</html>
"""


def render_nav(lang: str, asset_prefix: str) -> str:
    """Top nav: Home · Topics ▾ (dropdown of 7 categories) · Models · lang toggle.

    Condensed after we crossed 5 categories—keeps primary bar at 4 items.
    """
    is_en = lang.startswith("en")
    home_label = "Home" if is_en else "首页"
    topics_label = "Topics" if is_en else "主题"
    models_label = "Models" if is_en else "开源模型"
    topics_sub = "Browse 6 research streams" if is_en else "浏览 6 条研究脉络"

    # Dropdown items — one per category, with color dot matching badge
    dot_color_map = {
        "inference-optimization": "var(--anth-blue)",
        "self-improving-agents": "var(--anth-orange)",
        "agent-patterns": "var(--anth-green)",
        "memory-systems": "var(--anth-text)",
        "training-techniques": "var(--anth-danger)",
        "ai-thinking": "#6b8e3c",
    }

    def paper_count(c: Category) -> str:
        return f"{len(c.papers)} papers" if is_en else f"{len(c.papers)} 篇"

    dropdown_items = "\n".join(
        f'          <a href="{asset_prefix}{lang}/{c.key}.html">'
        f'<span class="dot" style="background:{dot_color_map.get(c.key, "var(--anth-mid-gray)")};"></span>'
        f'<span><span class="label">{html.escape(c.en_title if is_en else c.zh_title)}</span><br>'
        f'<span class="sub">{paper_count(c)}</span></span></a>'
        for c in CATEGORIES
    )

    en_active = "active" if is_en else ""
    zh_active = "active" if not is_en else ""

    return f"""    <header class="anth-nav">
      <div class="anth-nav-inner">
        <a href="{asset_prefix}" class="site-brand" aria-label="AI Doc">AI Doc</a>
        <nav aria-label="Primary" style="display:flex; align-items:center; gap: var(--space-6);">
          <a href="{asset_prefix}{lang}/">{home_label}</a>
          <div class="nav-dropdown">
            <button type="button" aria-haspopup="true">{topics_label}</button>
            <div class="nav-dropdown-panel" role="menu">
              <p class="anth-caption" style="padding:0 var(--space-3); margin-bottom:var(--space-2);">{topics_sub}</p>
{dropdown_items}
            </div>
          </div>
          <a href="{asset_prefix}{lang}/open-source-models.html">{models_label}</a>
        </nav>
        <div class="lang-toggle">
          <a href="{asset_prefix}en/" class="{en_active}">EN</a>
          <a href="{asset_prefix}zh/" class="{zh_active}">中文</a>
        </div>
      </div>
    </header>
"""


def render_footer(asset_prefix: str) -> str:
    return f"""    <footer class="anth-footer">
      <div class="anth-footer-legal" style="justify-content:center; flex-wrap:wrap; gap:var(--space-4);">
        <span class="site-footer-brand">AI Doc</span>
        <span>MIT License · Anthropic design vocabulary</span>
        <span><a href="{asset_prefix}" style="color:inherit; text-decoration:underline;">Switch language</a></span>
      </div>
    </footer>
"""


def render_badge(category: Category, is_en: bool) -> str:
    label = category.en_title if is_en else category.zh_title
    return f'<span class="anth-badge {category.badge_class}">{html.escape(label)}</span>'


# ---------------------------------------------------------------------------
# Page renderers
# ---------------------------------------------------------------------------


def render_topic_svg_for_home(is_en: bool) -> str:
    """AI Engineering Stack — 4-layer pyramid showing where each topic sits.

    Layers (top → bottom):
      0. Paradigm (ai-thinking)          — what AI fundamentally is
      1. Model layer (training · inference)  — build & serve
      2. Behavior layer (self-improving · memory · agent-patterns) — how agents act
      3. Selection (open-source model directory) — what to pick

    Developers reading can locate "which layer is my current pain at?" and jump in.
    """
    labels = {
        "header": "The AI Engineering Stack" if is_en else "AI 工程栈",
        "sub_header": ("Jump to the layer where your problem lives"
                        if is_en else "按你当前遇到的问题所在层级直接跳入"),
        "caption": ("From paradigm to model selection — how the topics relate"
                    if is_en else "从范式到选型——各主题如何关联"),
    }

    # Color constants matching site palette
    C_BG = "#ffffff"
    C_STROKE = "#e8e6dc"
    C_TEXT = "#141413"
    C_TEXT_SEC = "#6b6a5f"
    C_BLUE = "#6a9bcc"
    C_ORANGE = "#d97757"
    C_GREEN = "#788c5d"
    C_DANGER = "#a14238"
    C_DARK = "#141413"
    C_GRAY = "#b0aea5"
    C_OLIVE = "#6b8e3c"

    def t(en: str, zh: str) -> str:
        return en if is_en else zh

    # Layer captions (left gutter)
    layer_labels = [
        t("L0 · PARADIGM", "L0 · 范式"),
        t("L1 · BUILD & SERVE", "L1 · 造与跑"),
        t("L2 · BEHAVIOR", "L2 · 行为"),
        t("L3 · SELECTION", "L3 · 选型"),
    ]

    return f"""<div class="stack-diagram">
  <svg viewBox="0 0 1080 560" role="img" aria-label="{labels['header']}">

    <!-- Header -->
    <text x="540" y="36" text-anchor="middle" font-family="Poppins, sans-serif"
          font-size="22" font-weight="600" fill="{C_TEXT}">{labels['header']}</text>
    <text x="540" y="62" text-anchor="middle" font-family="Lora, serif"
          font-size="14" font-style="italic" fill="{C_TEXT_SEC}">{labels['sub_header']}</text>

    <!-- Layer gutter labels -->
    <text x="30" y="130" font-family="Poppins, sans-serif" font-size="10" font-weight="600"
          fill="{C_TEXT_SEC}" letter-spacing="2">{layer_labels[0]}</text>
    <text x="30" y="230" font-family="Poppins, sans-serif" font-size="10" font-weight="600"
          fill="{C_TEXT_SEC}" letter-spacing="2">{layer_labels[1]}</text>
    <text x="30" y="360" font-family="Poppins, sans-serif" font-size="10" font-weight="600"
          fill="{C_TEXT_SEC}" letter-spacing="2">{layer_labels[2]}</text>
    <text x="30" y="500" font-family="Poppins, sans-serif" font-size="10" font-weight="600"
          fill="{C_TEXT_SEC}" letter-spacing="2">{layer_labels[3]}</text>

    <!-- L0: Thinking Patterns (single full-width block) -->
    <rect x="180" y="100" width="720" height="60" rx="14" fill="{C_OLIVE}"/>
    <text x="540" y="130" text-anchor="middle" font-family="Poppins, sans-serif"
          font-size="17" font-weight="600" fill="#ffffff">{t("Thinking Patterns", "思维范式")}</text>
    <text x="540" y="150" text-anchor="middle" font-family="Lora, serif"
          font-size="12" fill="#ffffff" opacity="0.9">
      {t("Sutton · Karpathy · the mental models", "Sutton · Karpathy · 工程师心智模型")}
    </text>

    <!-- L1: Training + Inference side by side -->
    <rect x="180" y="200" width="340" height="80" rx="14" fill="{C_DANGER}"/>
    <text x="350" y="235" text-anchor="middle" font-family="Poppins, sans-serif"
          font-size="17" font-weight="600" fill="#ffffff">{t("Training Techniques", "训练技术")}</text>
    <text x="350" y="256" text-anchor="middle" font-family="Lora, serif"
          font-size="12" fill="#ffffff" opacity="0.92">
      {t("DeepSeek-R1 · DPO · LoRA", "DeepSeek-R1 · DPO · LoRA")}
    </text>
    <text x="350" y="272" text-anchor="middle" font-family="Lora, serif"
          font-size="11" fill="#ffffff" opacity="0.85">
      {t("how the model learns", "模型如何学习")}
    </text>

    <rect x="560" y="200" width="340" height="80" rx="14" fill="{C_BLUE}"/>
    <text x="730" y="235" text-anchor="middle" font-family="Poppins, sans-serif"
          font-size="17" font-weight="600" fill="#ffffff">{t("Inference Optimization", "推理优化")}</text>
    <text x="730" y="256" text-anchor="middle" font-family="Lora, serif"
          font-size="12" fill="#ffffff" opacity="0.92">
      {t("FlashAttention · MoE offload · quantization", "FlashAttention · MoE offload · 量化")}
    </text>
    <text x="730" y="272" text-anchor="middle" font-family="Lora, serif"
          font-size="11" fill="#ffffff" opacity="0.85">
      {t("how the model runs", "模型如何运行")}
    </text>

    <!-- L2: 3 behavior streams -->
    <rect x="60" y="320" width="290" height="90" rx="14" fill="{C_ORANGE}"/>
    <text x="205" y="355" text-anchor="middle" font-family="Poppins, sans-serif"
          font-size="16" font-weight="600" fill="#ffffff">{t("Self-Improving Agents", "自我改进 Agent")}</text>
    <text x="205" y="377" text-anchor="middle" font-family="Lora, serif"
          font-size="12" fill="#ffffff" opacity="0.92">
      {t("SPIN · autoresearch · Darwin", "SPIN · autoresearch · 达尔文")}
    </text>
    <text x="205" y="394" text-anchor="middle" font-family="Lora, serif"
          font-size="11" fill="#ffffff" opacity="0.85">
      {t("agents that get better", "agent 持续改进")}
    </text>

    <rect x="395" y="320" width="290" height="90" rx="14" fill="{C_DARK}"/>
    <text x="540" y="355" text-anchor="middle" font-family="Poppins, sans-serif"
          font-size="16" font-weight="600" fill="#faf9f5">{t("Memory Systems", "记忆系统")}</text>
    <text x="540" y="377" text-anchor="middle" font-family="Lora, serif"
          font-size="12" fill="#faf9f5" opacity="0.88">
      {t("MemGPT · OMNE · Knowledge Bases", "MemGPT · OMNE · Knowledge Bases")}
    </text>
    <text x="540" y="394" text-anchor="middle" font-family="Lora, serif"
          font-size="11" fill="#faf9f5" opacity="0.8">
      {t("agents that remember", "agent 的记忆")}
    </text>

    <rect x="730" y="320" width="290" height="90" rx="14" fill="{C_GREEN}"/>
    <text x="875" y="355" text-anchor="middle" font-family="Poppins, sans-serif"
          font-size="16" font-weight="600" fill="#ffffff">{t("Agent Patterns", "Agent 设计模式")}</text>
    <text x="875" y="377" text-anchor="middle" font-family="Lora, serif"
          font-size="12" fill="#ffffff" opacity="0.92">
      {t("ReAct · Anthropic · orchestrator-workers", "ReAct · Anthropic · orchestrator-workers")}
    </text>
    <text x="875" y="394" text-anchor="middle" font-family="Lora, serif"
          font-size="11" fill="#ffffff" opacity="0.85">
      {t("how agents act", "agent 如何行动")}
    </text>

    <!-- L3: Selection layer -->
    <rect x="180" y="460" width="720" height="70" rx="14" fill="{C_GRAY}"/>
    <text x="540" y="495" text-anchor="middle" font-family="Poppins, sans-serif"
          font-size="17" font-weight="600" fill="{C_TEXT}">{t("Open-Source Model Directory", "开源模型目录")}</text>
    <text x="540" y="515" text-anchor="middle" font-family="Lora, serif"
          font-size="12" fill="{C_TEXT}" opacity="0.85">
      {t("60+ models · 12 categories · Last verified 2026-04", "60+ 模型 · 12 类别 · 核验于 2026-04")}
    </text>

    <!-- Subtle connecting flow lines -->
    <path d="M 540 160 L 540 200" stroke="{C_GRAY}" stroke-width="1" fill="none" opacity="0.4" stroke-dasharray="3 3"/>
    <path d="M 350 280 L 205 320" stroke="{C_GRAY}" stroke-width="1" fill="none" opacity="0.4" stroke-dasharray="3 3"/>
    <path d="M 540 280 L 540 320" stroke="{C_GRAY}" stroke-width="1" fill="none" opacity="0.4" stroke-dasharray="3 3"/>
    <path d="M 730 280 L 875 320" stroke="{C_GRAY}" stroke-width="1" fill="none" opacity="0.4" stroke-dasharray="3 3"/>
    <path d="M 540 410 L 540 460" stroke="{C_GRAY}" stroke-width="1" fill="none" opacity="0.4" stroke-dasharray="3 3"/>
  </svg>
  <p class="stack-caption">{labels['caption']}</p>
</div>"""


def render_home(lang: str) -> str:
    is_en = lang == "en"
    title = "AI Doc — Bilingual AI Paper Knowledge Base" if is_en else "AI Doc — AI 论文中英双语知识库"
    hero_kicker = "An open, curated knowledge base" if is_en else "一个开放、精选的知识库"
    hero_h1 = "AI research, translated and organized." if is_en else "AI 研究，翻译并有序整理。"
    hero_lead = (
        "Chinese paragraph-by-paragraph translations of high-quality AI papers and engineering articles, "
        "plus a curated open-source model directory for real project selection."
        if is_en
        else "高质量 AI 论文与工程文章的逐段中英对照翻译，外加一份可用于真实项目选型的开源模型精选目录。"
    )

    topics_h2 = "Browse by topic" if is_en else "按主题浏览"
    topics_sub = (
        "Six research streams. Every paper is a blueprint you can extract into your project."
        if is_en else
        "六条研究脉络。每篇都是可以抽取到你项目里的蓝图。"
    )
    models_h2 = "Open-source model directory" if is_en else "开源模型目录"
    models_sub = "Pick the right model for your domain in 60 seconds." if is_en else "60 秒选出适合你领域的模型。"
    models_label = "Open the directory" if is_en else "打开目录"

    topic_cards = "\n".join(
        f"""<a class="topic-card" href="{c.key}.html">
              <div style="display:flex; gap:var(--space-2); align-items:center; flex-wrap:wrap;">
                {render_badge(c, is_en)}
                <span class="topic-count">{len(c.papers)} papers</span>
              </div>
              <h3>{html.escape(c.en_title if is_en else c.zh_title)}</h3>
              <p class="topic-desc">{html.escape(c.en_desc if is_en else c.zh_desc)}</p>
              <p style="margin:0;"><span class="anth-link">{"Explore" if is_en else "进入"}</span></p>
            </a>"""
        for c in CATEGORIES
    )

    body = f"""      <section class="anth-hero" style="padding-block: var(--space-9);">
        <div class="anth-container">
          <span class="anth-badge">{hero_kicker}</span>
          <h1 style="margin-top:var(--space-4); max-width:820px; margin-left:auto; margin-right:auto;">{hero_h1}</h1>
          <p style="font-size:20px; line-height:1.55; color:var(--anth-text-secondary); max-width:680px; margin:var(--space-5) auto var(--space-6);">{hero_lead}</p>
          <p>
            <a class="anth-button" href="#topics">{"Browse topics" if is_en else "开始浏览"}</a>
            <a class="anth-button anth-button--ghost" href="open-source-models.html" style="margin-left:var(--space-3);">{models_label}</a>
          </p>
        </div>
      </section>

      <section class="anth-section">
        <div class="anth-container anth-container--wide">
          {render_topic_svg_for_home(is_en)}
        </div>
      </section>

      <section class="anth-section anth-section--subtle" id="topics">
        <div class="anth-container anth-container--wide">
          <div style="text-align:center; max-width:640px; margin:0 auto;">
            <h2>{topics_h2}</h2>
            <p style="color:var(--anth-text-secondary); margin-top:var(--space-3);">{topics_sub}</p>
          </div>
          <div class="topic-grid">
            {topic_cards}
          </div>
        </div>
      </section>

      <section class="anth-section">
        <div class="anth-container">
          <div style="text-align:center; max-width:640px; margin:0 auto;">
            <h2>{models_h2}</h2>
            <p style="color:var(--anth-text-secondary); margin-top:var(--space-3);">{models_sub}</p>
            <p style="margin-top:var(--space-5);"><a class="anth-button" href="open-source-models.html">{models_label}</a></p>
          </div>
        </div>
      </section>
"""

    return page_shell(lang, title, body, asset_prefix="../")


def render_category_page(lang: str, category: Category) -> str:
    is_en = lang == "en"
    title = f"{category.en_title if is_en else category.zh_title} — AI Doc"
    tagline = category.en_tagline if is_en else category.zh_tagline
    desc = category.en_desc if is_en else category.zh_desc

    papers_html = "\n".join(
        f"""<a class="paper-row" href="articles/{p.slug}.html">
              <span class="paper-year">{html.escape(p.year)}</span>
              <div>
                <div class="paper-meta">{html.escape(p.authors)}</div>
                <h3>{html.escape(p.title)}</h3>
                <p>{html.escape(p.en_highlight if is_en else p.zh_highlight)}</p>
              </div>
              <span class="paper-arrow">→</span>
            </a>"""
        for p in category.papers
    )

    body = f"""      <section class="anth-hero" style="padding-block: var(--space-9);">
        <div class="anth-container">
          {render_badge(category, is_en)}
          <h1 style="margin-top:var(--space-4); max-width:780px; margin-left:auto; margin-right:auto;">{html.escape(category.en_title if is_en else category.zh_title)}</h1>
          <p style="font-size:20px; line-height:1.55; color:var(--anth-text-secondary); max-width:640px; margin:var(--space-5) auto var(--space-4);">{html.escape(tagline)}</p>
          <p style="font-size:16px; line-height:1.6; color:var(--anth-text-secondary); max-width:640px; margin:0 auto;">{html.escape(desc)}</p>
        </div>
      </section>

      <section class="anth-section">
        <div class="anth-container anth-container--wide">
          <div class="paper-list">
            {papers_html}
          </div>
        </div>
      </section>
"""
    return page_shell(lang, title, body, asset_prefix="../")


def render_open_source_models_page(lang: str) -> str:
    """Render the full open-source-models/README.md as a rich Anthropic-styled page.

    The README is the single source of truth — this function just wraps it in a
    hero + TOC + article-body layout so content updates flow through to the site
    automatically.
    """
    is_en = lang == "en"
    title = (OPEN_SOURCE_MODELS["en_title"] if is_en else OPEN_SOURCE_MODELS["zh_title"]) + " — AI Doc"
    tagline = OPEN_SOURCE_MODELS["en_tagline"] if is_en else OPEN_SOURCE_MODELS["zh_tagline"]
    desc = OPEN_SOURCE_MODELS["en_desc"] if is_en else OPEN_SOURCE_MODELS["zh_desc"]

    # Load the README and render to HTML
    readme_path = REPO_ROOT / "open-source-models" / "README.md"
    readme_raw = readme_path.read_text(encoding="utf-8")
    # Drop the top heading + the EN/CN selector since the site page has its own hero
    readme_raw = re.sub(r"^# Open-Source Model Directory.*?\n", "", readme_raw)
    readme_raw = re.sub(r"^\[English\].*?\n", "", readme_raw, flags=re.MULTILINE)
    rendered = markdown.markdown(readme_raw, extensions=MD_EXTENSIONS, output_format="html5")

    # Build a table-of-contents strip from the category list.
    #
    # Important: python-markdown's `toc` extension slugs headings by stripping
    # non-ASCII — so `## 1. Frontier Reasoning / 前沿推理` becomes the anchor
    # `#1-frontier-reasoning`. The visible label can be in either language but
    # the href MUST always use the English slug to match those IDs.
    cats_en = OPEN_SOURCE_MODELS["categories_en"]
    cats_label = OPEN_SOURCE_MODELS["categories_en"] if is_en else OPEN_SOURCE_MODELS["categories_zh"]

    def slugify(s: str) -> str:
        """Mirror python-markdown toc's ASCII-only slug:
        lowercase, drop punctuation (&, /, ., etc), collapse whitespace+dashes."""
        s = s.lower()
        s = re.sub(r"[^\w\s-]", "", s, flags=re.ASCII)  # ASCII only, like python-markdown
        s = re.sub(r"[-\s]+", "-", s).strip("-")
        return s

    toc_items = "".join(
        f'<a href="#{i+1}-{slugify(en)}" class="anth-badge" '
        f'style="background:#ffffff; color:var(--anth-text); '
        f'border:1px solid var(--anth-light-gray); margin:var(--space-1); font-weight:500;">'
        f'{html.escape(label)}</a>'
        for i, (en, label) in enumerate(zip(cats_en, cats_label))
    )

    stats_label_cats = "Categories" if is_en else "类别"
    stats_label_models = "Models listed" if is_en else "模型条目"
    stats_label_verified = "Last verified" if is_en else "最后核验"
    stats_label_license = "License transparency" if is_en else "许可透明度"

    body = f"""      <section class="anth-hero" style="padding-block: var(--space-9);">
        <div class="anth-container">
          <span class="anth-badge badge-models">{"Directory · 目录" if is_en else "目录 · Directory"}</span>
          <h1 style="margin-top:var(--space-4); max-width:800px; margin-left:auto; margin-right:auto;">{html.escape(OPEN_SOURCE_MODELS["en_title"] if is_en else OPEN_SOURCE_MODELS["zh_title"])}</h1>
          <p style="font-family:var(--font-body); font-size:22px; line-height:1.5; color:var(--anth-text-secondary); max-width:640px; margin:var(--space-5) auto var(--space-4);">{html.escape(tagline)}</p>
          <p style="font-size:16px; line-height:1.6; color:var(--anth-text-secondary); max-width:680px; margin:0 auto var(--space-7);">{html.escape(desc)}</p>

          <div class="stat-grid" style="max-width:880px; margin:var(--space-7) auto 0;">
            <div class="stat">
              <div class="stat-number">12</div>
              <div class="stat-label">{stats_label_cats}</div>
            </div>
            <div class="stat">
              <div class="stat-number">60+</div>
              <div class="stat-label">{stats_label_models}</div>
            </div>
            <div class="stat">
              <div class="stat-number" style="font-size:28px;">2026-04-19</div>
              <div class="stat-label">{stats_label_verified}</div>
            </div>
            <div class="stat">
              <div class="stat-number" style="font-size:28px;">100%</div>
              <div class="stat-label">{stats_label_license}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="anth-section anth-section--subtle">
        <div class="anth-container anth-container--wide">
          <div style="text-align:center; max-width:820px; margin:0 auto;">
            <p class="anth-caption" style="letter-spacing:0.08em; text-transform:uppercase; font-family:var(--font-heading); font-weight:600;">{"Jump to category" if is_en else "快速跳转"}</p>
            <div style="margin-top:var(--space-4); display:flex; flex-wrap:wrap; justify-content:center; gap:var(--space-2);">
              {toc_items}
            </div>
          </div>
        </div>
      </section>

      <section class="anth-section">
        <div class="anth-container anth-container--wide">
          <article class="article-body" style="background:#ffffff; padding:var(--space-7) var(--space-7); border-radius:var(--radius-lg); box-shadow: var(--shadow-card);">
{rendered}
          </article>
        </div>
      </section>
"""
    return page_shell(lang, title, body, asset_prefix="../")


# ---------------------------------------------------------------------------
# Article rendering
# ---------------------------------------------------------------------------


MD_EXTENSIONS = [
    "extra",           # tables, fenced code, def lists
    "sane_lists",
    "toc",
    "admonition",
    "attr_list",
]


def render_article(lang: str, category: Category, paper: Paper, prev_next: tuple[Paper | None, Paper | None]) -> str:
    is_en = lang == "en"
    md_path = REPO_ROOT / paper.md_path
    raw = md_path.read_text(encoding="utf-8")

    # Markdown contains both EN and ZH paragraphs; render verbatim.
    body_html = markdown.markdown(raw, extensions=MD_EXTENSIONS, output_format="html5")

    prev_p, next_p = prev_next
    nav_labels = {
        "prev": "Previous" if is_en else "上一篇",
        "next": "Next" if is_en else "下一篇",
        "back": f"Back to {category.en_title}" if is_en else f"返回 {category.zh_title}",
        "read_github": "View source on GitHub" if is_en else "在 GitHub 查看原文",
    }

    nav_html = ""
    if prev_p or next_p:
        left = (
            f'<a href="{prev_p.slug}.html"><div class="nav-label">← {nav_labels["prev"]}</div><div class="nav-title">{html.escape(prev_p.title)}</div></a>'
            if prev_p
            else "<span></span>"
        )
        right = (
            f'<a class="nav-right" href="{next_p.slug}.html"><div class="nav-label">{nav_labels["next"]} →</div><div class="nav-title">{html.escape(next_p.title)}</div></a>'
            if next_p
            else "<span></span>"
        )
        nav_html = f'<div class="article-nav">{left}{right}</div>'

    body = f"""      <section class="anth-section">
        <div class="anth-container anth-container--narrow">
          <div class="article-meta-header">
            <a href="../{category.key}.html" class="anth-link anth-link--no-arrow" style="font-size:13px;">← {html.escape(nav_labels["back"])}</a>
          </div>

          <div style="display:flex; gap:var(--space-3); flex-wrap:wrap; align-items:center; margin-bottom:var(--space-5);">
            {render_badge(category, is_en)}
            <span class="anth-caption">{html.escape(paper.year)} · {html.escape(paper.authors)}</span>
          </div>

          <article class="article-body">
{body_html}
          </article>

          {nav_html}
        </div>
      </section>
"""
    title = f"{paper.title} — AI Doc"
    return page_shell(lang, title, body, asset_prefix="../../")


# ---------------------------------------------------------------------------
# Build orchestrator
# ---------------------------------------------------------------------------


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  wrote {path.relative_to(REPO_ROOT)}")


def build() -> None:
    print(f"Building AI Doc site under {DOCS_DIR}")

    for lang in ("en", "zh"):
        lang_dir = DOCS_DIR / lang
        # homepage
        write(lang_dir / "index.html", render_home(lang))
        # open-source models
        write(lang_dir / "open-source-models.html", render_open_source_models_page(lang))
        # category pages
        for category in CATEGORIES:
            write(lang_dir / f"{category.key}.html", render_category_page(lang, category))
            # articles
            papers = category.papers
            for i, paper in enumerate(papers):
                prev_p = papers[i - 1] if i > 0 else None
                next_p = papers[i + 1] if i < len(papers) - 1 else None
                html_out = render_article(lang, category, paper, (prev_p, next_p))
                write(lang_dir / "articles" / f"{paper.slug}.html", html_out)

    print("Build complete.")


if __name__ == "__main__":
    build()
