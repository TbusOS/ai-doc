# Contributing Guide / 贡献指南

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## Mission / 使命

This repo exists to provide engineers worldwide with a curated collection of AI design patterns, thinking frameworks, and model selection guidance. Every entry should help someone build a better AI system.

## What This Repo Contains

1. **Paper translations** — Bilingual (EN/CN) articles on AI design patterns, algorithms, and engineering approaches
2. **Open-source model directory** — Curated guide to the best models by capability domain
3. **Resource guide** — Where to find high-quality AI papers and articles

---

## Paper Contributions

### What We're Looking For

- Papers with **novel design patterns or thinking approaches**
- Production-proven optimization techniques (inference, training, deployment)
- Architecture designs that **solve real engineering problems**
- Framework comparisons with practical trade-off analysis
- Papers that provide **actionable insights**, not just benchmark numbers

### What We're NOT Looking For

- Pure benchmark papers without design insight
- Incremental improvements without new thinking patterns
- Marketing content or product announcements
- Papers without code or reproducibility

### Article Template

Each article MUST follow this structure:

```markdown
# Paper Title

> **原文链接:** [arXiv:XXXX.XXXXX](https://arxiv.org/abs/XXXX.XXXXX)
>
> **作者:** Author names
>
> **发表:** Year / Venue
>
> **主题:** One-line Chinese description

---

## Abstract

[English original text]

## 摘要

[Chinese translation]

---

## 1. Section Title / 章节标题

[English original paragraph]

[Chinese translation paragraph]

---

(Repeat for all major sections: Introduction, Method, Experiments, Results, Conclusion)
```

**Requirements:**
- Original paper link MUST be included
- Bilingual: English original + Chinese translation, paragraph by paragraph
- Figures: download to `images/[paper-name]/` folder, include with bilingual captions
- Organize under the correct topic folder (e.g., `inference-optimization/`, `self-improving-agents/`)

### Topic Folders

| Folder | Scope |
|--------|-------|
| `inference-optimization/` | Model compression, quantization, offloading, KV cache, serving |
| `self-improving-agents/` | Self-play, self-correction, data filtering, test-time improvement |
| `memory-systems/` | Long-term memory, context management, forgetting curves, experience reuse |
| `training-optimization/` | Training efficiency, data selection, fine-tuning methods |
| `model-architecture/` | Transformer variants, MoE, attention mechanisms |
| `open-source-models/` | Model capability reviews and comparisons |

If no matching folder exists, create one with a clear English name.

---

## Model Contributions

### Model Entry Template

When adding a model to `open-source-models/README.md`:

```markdown
| [Model Name](huggingface-link) | Provider | Params | License | Best For | One-line highlight |
```

### Model Entry Criteria

A model MUST meet ALL of these:
- **Open-source or open-weight** with a clear license (MIT, Apache 2.0, Llama License, etc.)
- **Released and downloadable** — no announcements, no waitlists
- **Genuine capability advantage** in at least one domain (show benchmark or real-world evidence)
- **Practically runnable** on consumer or cloud hardware

A model should NOT be added if:
- It's a minor variant of an existing entry without meaningful improvement
- It has no English or Chinese documentation
- Its license restricts commercial use without clear disclosure

---

## Submission Process

### For Papers

1. Fork this repo
2. Create your article in the appropriate topic folder
3. Download and include figures locally in `images/[paper-name]/`
4. Update `README.md` — add your paper to **BOTH** the English and Chinese index tables
5. Submit a PR with:
   - Why this paper is worth reading (1-2 sentences)
   - Which topic folder you placed it in

### For Models

1. Fork this repo
2. Add the model entry to `open-source-models/README.md` in the correct category table
3. If the model fits a new category, add the category with a clear English name
4. Update `README.md` model summary table if the model is a top pick for its domain
5. Submit a PR

### PR Review Checklist

Maintainers will check:
- [ ] Article follows the bilingual template exactly
- [ ] Original link is valid and accessible
- [ ] Translation is accurate and natural (not machine-translated garbage)
- [ ] Figures are downloaded locally (not hotlinked from external sites)
- [ ] README index is updated in both EN and CN sections
- [ ] The content provides genuine engineering value

---

<a name="中文"></a>

## 使命

本仓库旨在为全球工程师提供精选的 AI 设计模式、思维框架和模型选型指南。每一条收录都应该帮助人更好地构建 AI 系统。

## 仓库内容

1. **论文翻译** — AI 设计模式、算法、工程方法的中英双语文章
2. **开源模型目录** — 按能力域精选的最佳模型指南
3. **资源导航** — 在哪里找到值得阅读的高质量 AI 论文和文章

---

## 论文贡献

### 我们在寻找什么

- 具有**新颖设计模式或思维方式**的论文
- 经过生产验证的优化技术（推理、训练、部署）
- 解决**真实工程问题**的架构设计
- 具有实际权衡分析的框架对比
- 提供**可落地洞察**的论文，而非纯跑分

### 我们不收录什么

- 没有设计洞察的纯跑分论文
- 没有新思维模式的增量改进
- 营销内容或产品公告
- 没有代码或无法复现的论文

### 文章模板

每篇文章**必须**遵循以下结构（见上方英文模板）：

核心要求：
- **必须**包含原文链接
- 中英双语：英文原文 + 中文翻译，逐段对照
- 图表：下载到 `images/[论文名]/` 文件夹，配双语图注
- 归入正确的主题文件夹

### 主题文件夹

| 文件夹 | 范围 |
|--------|------|
| `inference-optimization/` | 模型压缩、量化、offload、KV cache、推理服务 |
| `self-improving-agents/` | 自博弈、自我修正、数据过滤、测试时改进 |
| `memory-systems/` | 长期记忆、上下文管理、遗忘曲线、经验复用 |
| `training-optimization/` | 训练效率、数据选择、微调方法 |
| `model-architecture/` | Transformer 变体、MoE、注意力机制 |
| `open-source-models/` | 模型能力评测与对比 |

若无匹配文件夹，用清晰的英文名新建。

---

## 模型贡献

### 模型条目标准

模型**必须**满足以下全部条件：
- **开源或开放权重**，有明确许可证
- **已发布可下载** — 不接受预告、等待名单
- 在至少一个领域有**真实能力优势**
- 在消费级或云端硬件上**可实际运行**

---

## 提交流程

1. Fork 本仓库
2. 按模板创建文章或添加模型条目
3. 更新 `README.md` — **必须同时更新**英文和中文索引表
4. 提交 PR，简述为什么值得收录
