#!/usr/bin/env python3
"""Sample homepage for the 2026-10 redesign (phase 1).

    python3 docs/scripts/home_v2.py      # writes docs/sample/index.html

The live homepage (docs/{en,zh}/index.html) stays untouched until the sample
is approved; phase 2 replaces it.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build import CATEGORIES  # noqa: E402  (build.py has a main guard)
from site_v2 import esc, footer, head, header  # noqa: E402

REPO = Path(__file__).resolve().parent.parent.parent
OUT = REPO / "docs" / "sample" / "index.html"
PREFIX = "../"

TOPIC_VAR = {
    "inference-optimization": "--t-inference",
    "self-improving-agents": "--t-self",
    "agent-patterns": "--t-agent",
    "training-techniques": "--t-training",
    "ai-thinking": "--t-thinking",
    "memory-systems": "--t-memory",
}

# Layers of the "AI engineering stack" map: (layer label, [category keys or "models"])
STACK = [
    ("L0 范式", ["ai-thinking"]),
    ("L1 造与跑", ["training-techniques", "inference-optimization"]),
    ("L2 行为", ["agent-patterns", "memory-systems", "self-improving-agents"]),
    ("L3 选型", ["models"]),
]
EXPLAINED = {"self-improving-agents"}  # categories that already have an explainer


def _cat(key: str):
    return next(c for c in CATEGORIES if c.key == key)


def stack_svg() -> str:
    x0, x1, top, row_h, gap = 96, 632, 24, 84, 40
    parts = []
    for li, (label, keys) in enumerate(STACK):
        y = top + li * (row_h + gap)
        parts.append(
            f'<text class="stack-layer" x="0" y="{y + row_h / 2 + 6}" '
            f'style="fill:var(--ink-2);font-family:var(--font-hand);font-size:17px">{esc(label)}</text>'
        )
        if li:
            parts.append(
                f'<line class="stack-link" x1="{(x0 + x1) / 2}" y1="{y - gap + 4}" x2="{(x0 + x1) / 2}" y2="{y - 4}" '
                'style="stroke:var(--ink-3);stroke-width:2;stroke-dasharray:4 6"/>'
            )
        n = len(keys)
        w = (x1 - x0 - (n - 1) * 12) / n
        for ki, key in enumerate(keys):
            bx = x0 + ki * (w + 12)
            if key == "models":
                color, title, count, href = "--ink-2", "开源模型选型", "按场景挑模型", f"{PREFIX}zh/open-source-models.html"
            else:
                c = _cat(key)
                color, title, count, href = TOPIC_VAR[key], c.zh_title, f"{len(c.papers)} 篇", f"{PREFIX}zh/{key}.html"
            size = 20 if n == 3 else 22
            badge = ""
            if key in EXPLAINED:
                badge = (
                    f'<g class="stack-badge"><rect x="{bx + w - 66}" y="{y - 12}" width="60" height="24" rx="12" '
                    'style="fill:var(--accent)"/>'
                    f'<text x="{bx + w - 36}" y="{y + 5}" text-anchor="middle" '
                    'style="fill:var(--paper);font-family:var(--font-hand);font-size:16px">有图解</text></g>'
                )
            parts.append(
                f'<a href="{href}" class="stack-block" style="--c:var({color})">'
                f'<rect class="stack-fill" x="{bx}" y="{y}" width="{w}" height="{row_h}" rx="14" '
                f'style="fill:color-mix(in srgb, var({color}) 13%, var(--card))"/>'
                f'<rect class="stack-edge" x="{bx}" y="{y}" width="{w}" height="{row_h}" rx="14" pathLength="1" '
                f'style="fill:none;stroke:var({color});stroke-width:2.5"/>'
                f'<text class="stack-text" x="{bx + w / 2}" y="{y + 38}" text-anchor="middle" '
                f'style="fill:var(--ink);font-family:var(--font-head);font-weight:750;font-size:{size}px">{esc(title)}</text>'
                f'<text class="stack-text" x="{bx + w / 2}" y="{y + 64}" text-anchor="middle" '
                f'style="fill:var(--ink-2);font-family:var(--font-hand);font-size:17px">{esc(count)}</text>'
                f"{badge}</a>"
            )
    return (
        '<svg id="stack" class="stack-svg" viewBox="0 0 640 520" role="img" '
        'aria-label="AI 工程栈：从思维范式到训练与推理、agent 行为，再到开源模型选型，点击任一层进入对应主题">'
        + "".join(parts)
        + "</svg>"
    )


def explainer_card() -> str:
    mini = (
        '<svg class="mini" viewBox="0 0 160 160" aria-hidden="true">'
        '<circle cx="80" cy="80" r="56" style="fill:none;stroke:var(--line);stroke-width:3;stroke-dasharray:5 6"/>'
        '<path d="M80 24 A56 56 0 1 1 31.5 108" style="fill:none;stroke:var(--accent);stroke-width:5;stroke-linecap:round"/>'
        + "".join(
            f'<circle cx="{80 + 56 * x:.1f}" cy="{80 + 56 * y:.1f}" r="9" style="fill:var(--card);stroke:var(--ink);stroke-width:2.5"/>'
            for x, y in [(0, -1), (0.866, -0.5), (0.866, 0.5), (0, 1), (-0.866, 0.5), (-0.866, -0.5)]
        )
        + '<circle cx="80" cy="80" r="22" style="fill:var(--keep)"/>'
        '<path d="M70 80 l7 7 l13 -15" style="fill:none;stroke:var(--card);stroke-width:4;stroke-linecap:round;stroke-linejoin:round"/>'
        "</svg>"
    )
    return f"""<a class="ex-card card rise" href="{PREFIX}zh/explain/autoresearch.html">
  {mini}
  <div>
    <span class="kicker">自我改进 Agent · Karpathy · 2026</span>
    <h3>autoresearch：睡一觉，AI 替你跑完约 100 次实验</h3>
    <p class="muted">实验循环、为什么固定 5 分钟、为什么用 bpb 不用 loss……12 个场景讲清它每个设计为什么这样做。</p>
    <div class="ex-card-meta"><span class="chip">12 个场景 · 已完成 1 个</span><span class="chip">约 9 分钟</span></div>
  </div>
</a>"""


def topic_cards() -> str:
    cards = []
    for c in CATEGORIES:
        mark = '<span class="chip chip--accent">有图解</span>' if c.key in EXPLAINED else ""
        cards.append(
            f'<a class="topic card rise" href="{PREFIX}zh/{c.key}.html" style="--c:var({TOPIC_VAR[c.key]})">'
            f'<span class="topic-bar"></span><h3>{esc(c.zh_title)}</h3>'
            f'<p class="muted">{esc(c.zh_tagline)}</p>'
            f'<div class="topic-meta"><span>{len(c.papers)} 篇</span>{mark}</div></a>'
        )
    return "".join(cards)


def render_home_sample() -> str:
    total = sum(len(c.papers) for c in CATEGORIES)
    extra = f'<link rel="stylesheet" href="{PREFIX}assets/home/home.css">\n'
    return (
        head("AI Doc · 把 AI 论文讲到你能看懂", PREFIX, f"{total} 篇 AI 论文与工程文章的中英对照翻译，加上讲原理的图解页。", extra)
        + "<body>\n"
        + header(PREFIX, active="home")
        + f"""<main>
<section class="home-hero">
  <div class="wrap hero-grid">
    <div class="hero-text">
      <span class="kicker">AI Doc · 论文翻译 + 图解</span>
      <h1>把 AI 论文讲到你能<span class="hl">看懂<svg class="hl-line" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M4 14 C 50 4, 120 20, 196 8" style="fill:none;stroke:var(--accent);stroke-width:5;stroke-linecap:round"/></svg></span></h1>
      <p class="lead">{total} 篇论文和工程文章的逐段中英对照翻译。新增「图解」：用动画、交互图和彩色公式把原理讲清楚，关键说法都标出处。</p>
      <div class="hero-actions">
        <a class="btn btn--primary" href="{PREFIX}zh/explain/autoresearch.html">看图解：autoresearch →</a>
        <a class="btn" href="#topics">按主题浏览</a>
      </div>
      <p class="hero-stats"><b>{total}</b> 篇原文 · <b>{len(CATEGORIES)}</b> 个主题 · <b>1</b> 篇图解（样张）</p>
    </div>
    <div class="hero-art grid-paper">
      <p class="art-note">AI 工程栈 · 按你卡住的那一层直接跳进去</p>
      {stack_svg()}
    </div>
  </div>
</section>

<section class="home-section">
  <div class="wrap">
    <div class="section-head rise"><h2>图解系列</h2><p class="muted">先看懂原理，再读原文。</p></div>
    <div class="ex-row">
      {explainer_card()}
      <div class="ex-next rise"><span class="hand">下一篇图解（计划中）</span><p class="muted">挑一篇数学多的论文（DPO 或 FlashAttention），用彩色公式把推导拆开讲。</p></div>
    </div>
  </div>
</section>

<section class="home-section" id="topics">
  <div class="wrap">
    <div class="section-head rise"><h2>按主题读原文</h2><p class="muted">逐段中英对照，原文一字不改。</p></div>
    <div class="topic-grid">{topic_cards()}</div>
  </div>
</section>
</main>
"""
        + footer(PREFIX)
        + f'<script src="{PREFIX}assets/explain/timeline.js"></script>\n'
        + f'<script src="{PREFIX}assets/explain/engine.js"></script>\n'
        + f'<script src="{PREFIX}assets/home/stack.js"></script>\n'
        + "</body>\n</html>\n"
    )


def build_sample() -> Path:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(render_home_sample(), encoding="utf-8")
    print(f"  wrote {OUT.relative_to(REPO)}")
    return OUT


if __name__ == "__main__":
    build_sample()
