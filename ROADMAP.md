# Roadmap

[English](#english) | [中文](#中文)

This file tracks non-obvious work-in-progress directions for this repo beyond the paper/model index itself. Anyone cloning this repo (or any future Claude session loading it) should find pending initiatives here.

For per-initiative details, see **`docs/superpowers/specs/`** (design docs) and **`docs/superpowers/plans/`** (implementation plans).

---

<a name="english"></a>

## Active Initiatives

### 1. Paper Comic Series — ink-wash style (pending hardware)

Turn 40+ papers in this repo into a series of comics in pure Chinese ink-wash style (井上雄彦 / Vagabond-inspired composition language), treating each abstract AI concept as an anthropomorphized character — Attention as a bamboo-hatted scout, Gradient as a downhill wanderer, Router as a postmaster, and so on.

- **Design doc:** [`docs/superpowers/specs/2026-04-21-paper-comic-design.md`](docs/superpowers/specs/2026-04-21-paper-comic-design.md)
- **Pilot plan:** [`docs/superpowers/plans/2026-04-21-paper-comic-pilot.md`](docs/superpowers/plans/2026-04-21-paper-comic-pilot.md)
- **Pilot paper:** [Bitter Lesson](ai-thinking/bitter-lesson.md)
- **Status:** Design + plan complete (2026-04-21). **Execution paused** — current 24GB M3 is too tight to run FLUX.1-dev at decent quality alongside Qwen-Image 2.0 and FLUX.1 Kontext-dev simultaneously. Resuming when a 64GB Mac lands.
- **What's locked:** narrative (anthropomorphized), style (pure ink-wash Inoue-style), format (per-paper choice of poster / strip / long-form / interactive), pipeline (local ComfyUI + FLUX GGUF + Ink Wash Fusion LoRA, driven by Claude Code via MCP).
- **Output location when shipped:** `docs/comics/`

### 2. Illustrated paper explainers + site redesign (in progress)

Explain the principles and the math of each paper with animations, interactive diagrams and colour-coded formulas, so a newcomer can understand it before reading the original. Every statement is tagged as original text, our interpretation, or an illustrative number, and original quotes are checked against copies of the source files. The original translations stay unchanged.

- **Design doc:** [`docs/superpowers/specs/2026-10-08-paper-explainers-design.md`](docs/superpowers/specs/2026-10-08-paper-explainers-design.md)
- **Phase 1 plan (done):** [`docs/superpowers/plans/2026-10-08-explainers-phase1-sample.md`](docs/superpowers/plans/2026-10-08-explainers-phase1-sample.md)
- **Status (2026-10-09):** phase 1 shipped — new theme, homepage preview at `docs/sample/`, autoresearch explainer with scene 4 (the experiment loop). Next: phase 2 moves all 40 papers to the new theme; phase 3 completes the 12 autoresearch scenes; phase 4 illustrations (ComfyUI); phase 5 GIF / MP4 export.
- **Relation to the comic series:** comics tell a story; explainers explain the mechanism. Both can share a local ComfyUI setup.

---

<a name="中文"></a>

## 进行中的方向

### 1. 论文漫画系列 · 水墨风（硬件待到位）

把仓库里的 40+ 篇论文做成水墨风漫画系列。风格定位：纯水墨 · 井上雄彦《浪客行》式构图语言。把每个抽象 AI 概念拟人化为一个角色——Attention 是戴斗笠的情报员、Gradient 是总走下坡的流浪者、Router 是驿站分拣吏 ……

- **设计稿**：[`docs/superpowers/specs/2026-04-21-paper-comic-design.md`](docs/superpowers/specs/2026-04-21-paper-comic-design.md)
- **Pilot 实施计划**：[`docs/superpowers/plans/2026-04-21-paper-comic-pilot.md`](docs/superpowers/plans/2026-04-21-paper-comic-pilot.md)
- **Pilot 论文**：[The Bitter Lesson](ai-thinking/bitter-lesson.md)
- **状态**：设计稿 + 实施计划已完成（2026-04-21）。**暂停执行** —— 当前 24GB M3 MacBook Air 跑 FLUX.1-dev 并同时常驻 Qwen-Image 2.0 和 FLUX.1 Kontext-dev 太紧。等 64GB Mac 到货后恢复。
- **已锁定**：叙事（拟人化世界观）、视觉（纯水墨 · 井上式）、格式（按论文气质选海报 / 短漫 / 中篇 / 交互长文）、流水线（本地 ComfyUI + FLUX GGUF + Ink Wash Fusion LoRA，Claude Code 通过 MCP 驱动）。
- **产物路径（开工后）**：`docs/comics/`

### 2. 论文图解 + 站点改版（进行中）

用动画、交互图和彩色公式把每篇论文的原理和数学讲清楚，让没有相关背景的读者先看懂，再去读原文。每句话标明是「原文」「解读」还是「示意」，原文引用由脚本逐字核对原文副本。现有中英对照原文一字不改。

- **设计稿**：[`docs/superpowers/specs/2026-10-08-paper-explainers-design.md`](docs/superpowers/specs/2026-10-08-paper-explainers-design.md)
- **第一阶段计划（已完成）**：[`docs/superpowers/plans/2026-10-08-explainers-phase1-sample.md`](docs/superpowers/plans/2026-10-08-explainers-phase1-sample.md)
- **状态（2026-10-09）**：第一阶段已上线：新视觉、`docs/sample/` 新首页预览、autoresearch 图解页的场景 4（实验循环）。接下来：第二阶段 40 篇原文换新视觉；第三阶段补齐 autoresearch 12 个场景；第四阶段插画（ComfyUI）；第五阶段导出 GIF / MP4。
- **跟漫画系列的关系**：漫画是讲故事，图解是讲原理；本地 ComfyUI 可以共用。
