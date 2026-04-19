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
                "flashmoe",
                "inference-optimization/flashmoe.md",
                "FlashMoE",
                "Kim et al.",
                "2026",
                "ML-based cache replacement for MoE SSD offloading, 2.6× speedup on edge devices.",
                "ML 驱动缓存替换 + MoE SSD offload，边缘设备加速 2.6 倍。",
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
                "spin",
                "self-improving-agents/spin.md",
                "SPIN",
                "Chen et al.",
                "2024",
                "Self-play fine-tuning, model vs previous self, no extra annotations needed.",
                "自博弈微调，模型 vs 上一版自己，无需额外标注。",
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
                "rise",
                "self-improving-agents/rise.md",
                "RISE",
                "(see paper)",
                "2024",
                "Recursive introspection, multi-turn self-correction, +23.9% on GSM8K.",
                "递归自省，多轮自我修正，GSM8K 提升 23.9%。",
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
        key="multi-agent-systems",
        en_title="Multi-Agent Systems",
        zh_title="多 Agent 系统",
        en_tagline="Orchestrating swarms that build, reason, and ship together",
        zh_tagline="编排协同构建、推理、交付的 agent 群体",
        en_desc="Landscape surveys and concrete case studies of agent-factory architectures, swarm research pipelines, and coordination patterns.",
        zh_desc="Agent 工厂架构、swarm 研究流水线、协作模式的综述与具体案例。",
        badge_class="badge-multi",
        accent_color="#788c5d",
        papers=[
            Paper(
                "coding-agents-landscape-2026",
                "multi-agent-systems/coding-agents-landscape-2026.md",
                "Coding Agents & Agent Factory Landscape 2026",
                "Landscape article",
                "2026",
                "Complete 2026 survey: papers, open-source runtimes, benchmarks, and recommended paths for multi-agent coding teams and agent-factory research.",
                "2026 完整生态综述：论文、开源运行时、基准、多 Agent 编码团队与 Agent 工厂研究的推荐路径。",
            ),
            Paper(
                "nuwa-skill",
                "multi-agent-systems/nuwa-skill.md",
                "Nuwa Skill · 女娲",
                "Huashu",
                "2026",
                "6-agent parallel research swarm distills a public figure's cognitive OS (mental models + decision heuristics + expression DNA) into a reusable SKILL.md.",
                "6 个并行 agent 蒸馏人物认知操作系统（心智模型+决策启发式+表达 DNA）为可运行 SKILL.md。",
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
                "evo-memory",
                "memory-systems/evo-memory.md",
                "Evo-Memory",
                "Google DeepMind",
                "2025",
                "Search→Synthesize→Evolve cycle, ReMem pipeline, 92% on BabyAI.",
                "Search→Synthesize→Evolve 循环，ReMem 管线，BabyAI 92%。",
            ),
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
                "long-term-memory-omne",
                "memory-systems/long-term-memory-omne.md",
                "LTM & OMNE",
                "TCCI",
                "2024",
                "Long-term memory for AI self-evolution, OMNE #1 on GAIA benchmark (40.53% vs GPT-4's 15%).",
                "长期记忆驱动 AI 自进化，OMNE 在 GAIA 基准第一名（40.53% vs GPT-4 的 15%）。",
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
    "en_desc": "A curated guide to the best open-source models by capability domain — for project selection, not exhaustive listing.",
    "zh_desc": "按能力域精选的最佳开源模型指南——用于项目选型，非穷举列表。",
    "rows": [
        ("General Reasoning", "通用推理", "DeepSeek-V3.2, Qwen3.5", "GPT-5 level reasoning, MIT/Apache", "GPT-5 级推理，MIT/Apache 许可"),
        ("Coding", "代码", "GLM-4.7, Kimi K2.5", "91%+ SWE-bench, real bug fixing", "SWE-bench 91%+，真实 bug 修复"),
        ("Math", "数学", "Qwen3-Max, DeepSeek-V3.2-Speciale", "97.8% MATH-500, AIME-level", "MATH-500 97.8%，AIME 级别"),
        ("Multimodal", "多模态", "GLM-4.6V, Qwen2.5-VL", "Native tool use, 128K context", "原生工具调用，128K 上下文"),
        ("Edge / Mobile", "边缘/移动", "Phi-4-mini, Gemma-3n, Qwen3.5-0.8B", "4GB RAM, mobile-ready", "4GB RAM 可用，移动端就绪"),
        ("Long Context", "长上下文", "Llama 4 Scout", "10M token context window", "1000 万 token 上下文"),
        ("Multilingual", "多语言", "Qwen3", "119 languages", "119 种语言"),
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
    """Top nav with category links + language toggle.

    asset_prefix is relative to the page being rendered.
    """
    is_en = lang.startswith("en")
    home_label = "Home" if is_en else "首页"
    about_label = "About" if is_en else "关于"

    # Links to same-language category pages
    cat_links = "\n".join(
        f'          <a href="{asset_prefix}{lang}/{c.key}.html">{html.escape(c.en_title if is_en else c.zh_title)}</a>'
        for c in CATEGORIES
    )

    models_label = "Models" if is_en else "开源模型"

    en_active = " active" if is_en else ""
    zh_active = " active" if not is_en else ""

    # language toggle: swap current page to other lang if it exists
    # For simplicity we link to the lang root index.
    return f"""    <header class="anth-nav">
      <div class="anth-nav-inner">
        <a href="{asset_prefix}" class="site-brand" aria-label="AI Doc">AI Doc</a>
        <nav aria-label="Primary" style="display:flex; align-items:center; gap: var(--space-5);">
          <a href="{asset_prefix}{lang}/">{home_label}</a>
{cat_links}
          <a href="{asset_prefix}{lang}/open-source-models.html">{models_label}</a>
        </nav>
        <div class="lang-toggle">
          <a href="{asset_prefix}en/" class="{en_active.strip()}">EN</a>
          <a href="{asset_prefix}zh/" class="{zh_active.strip()}">中文</a>
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
    """Architecture overview — shows 5 categories and their flow into Models."""
    labels = {
        "title": "Knowledge Architecture" if is_en else "知识架构",
        "caption": "Five research streams feed the open-source model directory" if is_en else "五条研究脉络汇入开源模型目录",
    }
    return f"""<div class="diagram-frame">
  <svg viewBox="0 0 1100 420" role="img" aria-label="{labels['title']}">
    <!-- Column headers -->
    <text x="140" y="40" text-anchor="middle" font-family="Poppins, sans-serif" font-size="13" font-weight="600" fill="#6b6a5f" letter-spacing="2">{"INPUTS" if is_en else "输入"}</text>
    <text x="550" y="40" text-anchor="middle" font-family="Poppins, sans-serif" font-size="13" font-weight="600" fill="#6b6a5f" letter-spacing="2">{"KNOWLEDGE STREAMS" if is_en else "知识脉络"}</text>
    <text x="960" y="40" text-anchor="middle" font-family="Poppins, sans-serif" font-size="13" font-weight="600" fill="#6b6a5f" letter-spacing="2">{"OUTPUTS" if is_en else "产出"}</text>

    <!-- Input: Papers -->
    <rect x="50" y="70" width="180" height="60" rx="12" fill="#ffffff" stroke="#e8e6dc" stroke-width="1.5"/>
    <text x="140" y="105" text-anchor="middle" font-family="Poppins, sans-serif" font-size="14" font-weight="600" fill="#141413">{"Papers" if is_en else "论文"}</text>

    <rect x="50" y="150" width="180" height="60" rx="12" fill="#ffffff" stroke="#e8e6dc" stroke-width="1.5"/>
    <text x="140" y="185" text-anchor="middle" font-family="Poppins, sans-serif" font-size="14" font-weight="600" fill="#141413">{"Engineering Blogs" if is_en else "工程博客"}</text>

    <rect x="50" y="230" width="180" height="60" rx="12" fill="#ffffff" stroke="#e8e6dc" stroke-width="1.5"/>
    <text x="140" y="265" text-anchor="middle" font-family="Poppins, sans-serif" font-size="14" font-weight="600" fill="#141413">{"OSS Repos" if is_en else "开源仓库"}</text>

    <!-- 5 Streams -->
    <rect x="440" y="55" width="220" height="52" rx="12" fill="#6a9bcc" opacity="0.88"/>
    <text x="550" y="86" text-anchor="middle" font-family="Poppins, sans-serif" font-size="14" font-weight="600" fill="#ffffff">{"Inference Optimization" if is_en else "推理优化"}</text>

    <rect x="440" y="117" width="220" height="52" rx="12" fill="#d97757" opacity="0.9"/>
    <text x="550" y="148" text-anchor="middle" font-family="Poppins, sans-serif" font-size="14" font-weight="600" fill="#ffffff">{"Self-Improving Agents" if is_en else "自我改进 Agent"}</text>

    <rect x="440" y="179" width="220" height="52" rx="12" fill="#788c5d" opacity="0.9"/>
    <text x="550" y="210" text-anchor="middle" font-family="Poppins, sans-serif" font-size="14" font-weight="600" fill="#ffffff">{"Multi-Agent Systems" if is_en else "多 Agent 系统"}</text>

    <rect x="440" y="241" width="220" height="52" rx="12" fill="#141413"/>
    <text x="550" y="272" text-anchor="middle" font-family="Poppins, sans-serif" font-size="14" font-weight="600" fill="#faf9f5">{"Memory Systems" if is_en else "记忆系统"}</text>

    <rect x="440" y="303" width="220" height="52" rx="12" fill="#b0aea5"/>
    <text x="550" y="334" text-anchor="middle" font-family="Poppins, sans-serif" font-size="14" font-weight="600" fill="#141413">{"Translations & Analysis" if is_en else "翻译与解读"}</text>

    <!-- Output -->
    <rect x="870" y="180" width="180" height="80" rx="14" fill="#d97757"/>
    <text x="960" y="212" text-anchor="middle" font-family="Poppins, sans-serif" font-size="15" font-weight="600" fill="#ffffff">{"Model Directory" if is_en else "模型目录"}</text>
    <text x="960" y="232" text-anchor="middle" font-family="Poppins, sans-serif" font-size="12" font-weight="500" fill="#ffffff" opacity="0.88">{"Project-ready selection" if is_en else "项目可用选型"}</text>

    <!-- Connector lines -->
    <path d="M 230 100 Q 335 100 440 100" stroke="#b0aea5" stroke-width="1.5" fill="none" stroke-dasharray="4 4"/>
    <path d="M 230 180 Q 335 180 440 180" stroke="#b0aea5" stroke-width="1.5" fill="none" stroke-dasharray="4 4"/>
    <path d="M 230 260 Q 335 260 440 260" stroke="#b0aea5" stroke-width="1.5" fill="none" stroke-dasharray="4 4"/>

    <path d="M 660 82 Q 760 82 860 200" stroke="#6a9bcc" stroke-width="1.5" fill="none" opacity="0.6"/>
    <path d="M 660 144 Q 760 144 860 205" stroke="#d97757" stroke-width="1.5" fill="none" opacity="0.6"/>
    <path d="M 660 206 Q 760 206 860 220" stroke="#788c5d" stroke-width="1.5" fill="none" opacity="0.6"/>
    <path d="M 660 268 Q 760 268 860 235" stroke="#141413" stroke-width="1.5" fill="none" opacity="0.5"/>
    <path d="M 660 330 Q 760 330 860 245" stroke="#b0aea5" stroke-width="1.5" fill="none" opacity="0.7"/>
  </svg>
  <p class="diagram-caption">{labels['caption']}</p>
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
    topics_sub = "Five research streams. Each one carefully selected." if is_en else "五条研究脉络，每一篇都是精选。"
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
    is_en = lang == "en"
    title = (OPEN_SOURCE_MODELS["en_title"] if is_en else OPEN_SOURCE_MODELS["zh_title"]) + " — AI Doc"
    desc = OPEN_SOURCE_MODELS["en_desc"] if is_en else OPEN_SOURCE_MODELS["zh_desc"]
    th_domain = "Domain" if is_en else "领域"
    th_picks = "Top picks" if is_en else "推荐"
    th_why = "Why" if is_en else "理由"

    rows = "\n".join(
        f"<tr><td><strong>{html.escape(en_d if is_en else zh_d)}</strong></td><td>{html.escape(picks)}</td><td>{html.escape(why_en if is_en else why_zh)}</td></tr>"
        for en_d, zh_d, picks, why_en, why_zh in OPEN_SOURCE_MODELS["rows"]
    )

    body = f"""      <section class="anth-hero" style="padding-block: var(--space-9);">
        <div class="anth-container">
          <span class="anth-badge badge-models">{"Directory" if is_en else "目录"}</span>
          <h1 style="margin-top:var(--space-4);">{html.escape(OPEN_SOURCE_MODELS["en_title"] if is_en else OPEN_SOURCE_MODELS["zh_title"])}</h1>
          <p style="font-size:20px; line-height:1.55; color:var(--anth-text-secondary); max-width:680px; margin:var(--space-5) auto;">{html.escape(desc)}</p>
        </div>
      </section>

      <section class="anth-section">
        <div class="anth-container anth-container--wide">
          <div class="article-body" style="background:#ffffff; padding:var(--space-6); border-radius:var(--radius-lg); box-shadow: var(--shadow-card);">
            <table>
              <thead>
                <tr><th>{th_domain}</th><th>{th_picks}</th><th>{th_why}</th></tr>
              </thead>
              <tbody>
                {rows}
              </tbody>
            </table>
          </div>
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
