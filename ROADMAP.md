# Roadmap

[English](#english) | [中文](#中文)

This file tracks non-obvious work-in-progress directions for this repo beyond the paper/model index itself. Anyone cloning this repo (or any future Claude session loading it) should find pending initiatives here.

For per-initiative details, see **`docs/superpowers/specs/`** (design docs) and **`docs/superpowers/plans/`** (implementation plans).

---

<a name="english"></a>

## Active Initiatives

### 1. Paper Comic Series — ink-wash style (queued after autoresearch)

Turn 40+ papers in this repo into a series of comics in pure Chinese ink-wash style (井上雄彦 / Vagabond-inspired composition language), treating each abstract AI concept as an anthropomorphized character — Attention as a bamboo-hatted scout, Gradient as a downhill wanderer, Router as a postmaster, and so on.

- **Design doc:** [`docs/superpowers/specs/2026-04-21-paper-comic-design.md`](docs/superpowers/specs/2026-04-21-paper-comic-design.md)
- **Pilot plan:** [`docs/superpowers/plans/2026-04-21-paper-comic-pilot.md`](docs/superpowers/plans/2026-04-21-paper-comic-pilot.md)
- **Pilot paper:** [Bitter Lesson](ai-thinking/bitter-lesson.md)
- **Status:** Design + plan complete (2026-04-21). Paused at first because a 24GB M3 was too tight for the local ComfyUI + FLUX setup. **2026-10-09: no longer blocked on hardware** — images will come from GPT (Codex image generation) with style-reference images, the way the explainer illustrations are made; the ComfyUI parts of the pilot plan are retired. Starts after the autoresearch explainer is done.
- **What's locked:** narrative (anthropomorphized), style (pure ink-wash Inoue-style), format (per-paper choice of poster / strip / long-form / interactive), pipeline (local ComfyUI + FLUX GGUF + Ink Wash Fusion LoRA, driven by Claude Code via MCP).
- **Output location when shipped:** `docs/comics/`

### 2. Illustrated paper explainers + site redesign (in progress)

Explain the principles and the math of each paper with animations, interactive diagrams and colour-coded formulas, so a newcomer can understand it before reading the original. Every statement is tagged as original text, our interpretation, or an illustrative number, and original quotes are checked against copies of the source files. The original translations stay unchanged.

- **Design doc:** [`docs/superpowers/specs/2026-10-08-paper-explainers-design.md`](docs/superpowers/specs/2026-10-08-paper-explainers-design.md)
- **Phase 1 plan (done):** [`docs/superpowers/plans/2026-10-08-explainers-phase1-sample.md`](docs/superpowers/plans/2026-10-08-explainers-phase1-sample.md)
- **Status (2026-10-09):** phase 1 shipped — new theme, homepage preview at `docs/sample/`, autoresearch explainer with scene 4 (the experiment loop). In progress on branch `feat/explainer-skill-and-scenes`: phase 3 (all autoresearch scenes), then phase 4 illustrations and phase 5 GIF / MP4 export for autoresearch. Phase 2 (all 40+ papers on the new theme) comes after autoresearch is complete.
- **One style per paper (2026-10-09):** each paper gets its own visual style chosen from its content; only the reader's landmarks stay fixed across pages (source tags, player controls, chapter nav, reduced-motion behaviour, colour meanings). The whiteboard sketch look of autoresearch is one style, not the template.
- **Illustrations:** generated with Codex image generation (gpt-6-astra) plus a style-reference image; prompts are stored next to the explainer source. No local open-model setup for now.
- **Relation to the comic series:** comics tell a story; explainers explain the mechanism.

---

<a name="中文"></a>

## 进行中的方向

### 1. 论文漫画系列 · 水墨风（排在 autoresearch 之后）

把仓库里的 40+ 篇论文做成水墨风漫画系列。风格定位：纯水墨 · 井上雄彦《浪客行》式构图语言。把每个抽象 AI 概念拟人化为一个角色——Attention 是戴斗笠的情报员、Gradient 是总走下坡的流浪者、Router 是驿站分拣吏 ……

- **设计稿**：[`docs/superpowers/specs/2026-04-21-paper-comic-design.md`](docs/superpowers/specs/2026-04-21-paper-comic-design.md)
- **Pilot 实施计划**：[`docs/superpowers/plans/2026-04-21-paper-comic-pilot.md`](docs/superpowers/plans/2026-04-21-paper-comic-pilot.md)
- **Pilot 论文**：[The Bitter Lesson](ai-thinking/bitter-lesson.md)
- **状态**：设计稿 + 实施计划已完成（2026-04-21）。当初暂停是因为 24GB M3 跑本地 ComfyUI + FLUX 太紧。**2026-10-09 起不再等硬件**：改用 GPT（Codex 出图）加参考图定画风，跟图解插画同一种做法；Pilot 计划里 ComfyUI 那部分停用。autoresearch 图解做完后开工。
- **已锁定**：叙事（拟人化世界观）、视觉（纯水墨 · 井上式）、格式（按论文气质选海报 / 短漫 / 中篇 / 交互长文）、出图流程（本地 ComfyUI + FLUX GGUF + Ink Wash Fusion LoRA，Claude Code 通过 MCP 驱动）。
- **产物路径（开工后）**：`docs/comics/`

### 2. 论文图解 + 站点改版（进行中）

用动画、交互图和彩色公式把每篇论文的原理和数学讲清楚，让没有相关背景的读者先看懂，再去读原文。每句话标明是「原文」「解读」还是「示意」，原文引用由脚本逐字核对原文副本。现有中英对照原文一字不改。

- **设计稿**：[`docs/superpowers/specs/2026-10-08-paper-explainers-design.md`](docs/superpowers/specs/2026-10-08-paper-explainers-design.md)
- **第一阶段计划（已完成）**：[`docs/superpowers/plans/2026-10-08-explainers-phase1-sample.md`](docs/superpowers/plans/2026-10-08-explainers-phase1-sample.md)
- **状态（2026-10-09）**：第一阶段已上线：新视觉、`docs/sample/` 新首页预览、autoresearch 图解页的场景 4（实验循环）。分支 `feat/explainer-skill-and-scenes` 上正在做：第三阶段补齐 autoresearch 全部场景，然后是 autoresearch 的第四阶段插画、第五阶段导出 GIF / MP4。第二阶段（40 多篇原文换新视觉）排在 autoresearch 做完之后。
- **每篇论文一种风格（2026-10-09 定）**：按论文内容定这篇的视觉风格；全站只固定读者跨页认路要靠的东西（出处标记、播放控制条、章节导航、减少动态效果时的表现、颜色的意思）。autoresearch 的白板手绘只是其中一种，不是模板。
- **插画**：用 Codex 出图（gpt-6-astra），附一张参考图定画风；提示词原文跟图解源文件放在一起。暂不在本地部署开源模型。
- **跟漫画系列的关系**：漫画是讲故事，图解是讲原理。
