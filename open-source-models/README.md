# Open-Source Model Directory / 开源模型目录

[English](#english) | [中文](#中文)

A curated guide to the best open-source models across different capability domains. Updated regularly. Focused on models that are **free, production-ready, and genuinely useful** for vertical domain projects.

精选各能力域最佳开源模型指南。定期更新。聚焦于**免费、可生产部署、对垂直领域项目真正有用**的模型。

> **Last updated / 最后更新:** 2026-03

---

<a name="english"></a>

## General Reasoning / 通用推理

| Model | Provider | Params | License | Best For | Highlights |
|-------|----------|--------|---------|----------|------------|
| [DeepSeek-V3.2](https://huggingface.co/deepseek-ai) | DeepSeek | 685B MoE | MIT | Reasoning, agentic workflows | GPT-5 level on hard math; cheapest frontier API at $0.28/M tokens |
| [Qwen3.5](https://huggingface.co/Qwen) | Alibaba | 1T+ MoE | Apache 2.0 | General + multilingual | Beats GPT-4o on most benchmarks; 119 languages |
| [Llama 4 Maverick](https://huggingface.co/meta-llama) | Meta | 400B MoE (17B active) | Llama License | General tasks | Strong all-rounder, only 17B active per query |
| [Mistral Large 3](https://huggingface.co/mistralai) | Mistral AI | 675B MoE | Apache 2.0 | Enterprise | 92% of GPT-5.2 performance at ~15% cost |

## Coding / 代码

| Model | Provider | Params | License | Best For | Highlights |
|-------|----------|--------|---------|----------|------------|
| [GLM-4.7](https://huggingface.co/THUDM) | Zhipu AI | - | Open | Bug fixing, SWE-bench | 91.2% SWE-bench, top coding specialist |
| [Kimi K2.5](https://huggingface.co/moonshotai) | Moonshot AI | MoE | MIT | Code generation + math | #1 open-source for code gen under MIT |
| [DeepSeek-Coder-V3](https://huggingface.co/deepseek-ai) | DeepSeek | MoE | MIT | Full-stack coding | Strong on real-world codebases |
| [Qwen2.5-Coder-32B](https://huggingface.co/Qwen) | Alibaba | 32B | Apache 2.0 | Self-hostable coding | Best coding model you can run on 1 GPU |

## Math & Reasoning / 数学与推理

| Model | Provider | Params | License | Best For | Highlights |
|-------|----------|--------|---------|----------|------------|
| [Qwen3-Max (Thinking)](https://huggingface.co/Qwen) | Alibaba | Large | Apache 2.0 | Competition math | 97.8% MATH-500, surpasses DeepSeek |
| [DeepSeek-V3.2-Speciale](https://huggingface.co/deepseek-ai) | DeepSeek | MoE | MIT | Hard math (AIME/HMMT) | GPT-5-level on competition benchmarks |
| [Qwen-QwQ-32B](https://huggingface.co/Qwen) | Alibaba | 32B | Apache 2.0 | Reasoning chains | Deep thinking mode, self-hostable |

## Multimodal / Vision / 多模态与视觉

| Model | Provider | Params | License | Best For | Highlights |
|-------|----------|--------|---------|----------|------------|
| [GLM-4.6V](https://huggingface.co/THUDM) | Zhipu AI | - | Open | Visual agent, tool use | End-to-end vision-driven tool use, 128K context |
| [Qwen2.5-VL-32B](https://huggingface.co/Qwen) | Alibaba | 32B | Apache 2.0 | Visual agent, OCR | Structured data extraction from images |
| [InternVL3](https://huggingface.co/OpenGVLab) | Shanghai AI Lab | 78B | Apache 2.0 | Document understanding | Strong on charts, diagrams, documents |
| [Llama 4 Scout](https://huggingface.co/meta-llama) | Meta | 109B MoE | Llama License | Long multimodal context | 10M token context with vision |

## Edge & Mobile (≤7B) / 边缘与移动端

| Model | Provider | Params | License | Best For | Highlights |
|-------|----------|--------|---------|----------|------------|
| [Phi-4-mini](https://huggingface.co/microsoft) | Microsoft | 3.8B | MIT | Tool calling, structured output | Beats GPT-4o on math at 3.8B |
| [Gemma-3n-E2B](https://huggingface.co/google) | Google | 2B effective | Apache 2.0 | On-device multimodal | Text+image+audio+video, 0.75% phone battery |
| [Qwen3.5-0.8B](https://huggingface.co/Qwen) | Alibaba | 0.8B | Apache 2.0 | Ultra-lightweight agent | 262K context, thinking mode at 0.8B |
| [SmolLM3-3B](https://huggingface.co/HuggingFaceTB) | Hugging Face | 3B | Apache 2.0 | General edge tasks | Beats Llama-3.2-3B and Qwen2.5-3B |
| [Llama 3.2-3B](https://huggingface.co/meta-llama) | Meta | 3B | Llama License | General mobile | Proven, large ecosystem |

## Embedding & Retrieval / 嵌入与检索

| Model | Provider | Params | License | Best For | Highlights |
|-------|----------|--------|---------|----------|------------|
| [BGE-M3](https://huggingface.co/BAAI) | BAAI | 568M | MIT | Multilingual retrieval | Dense + sparse + colbert, 100+ languages |
| [GTE-Qwen2](https://huggingface.co/Alibaba-NLP) | Alibaba | 1.5B | Apache 2.0 | Semantic search | Top MTEB scores, long context |
| [Nomic-Embed-Text](https://huggingface.co/nomic-ai) | Nomic AI | 137M | Apache 2.0 | Lightweight embedding | 8K context, efficient |

## Speech & Audio / 语音与音频

| Model | Provider | Params | License | Best For | Highlights |
|-------|----------|--------|---------|----------|------------|
| [Whisper-Large-V3-Turbo](https://huggingface.co/openai) | OpenAI | 809M | MIT | Transcription | 99 languages, real-time capable |
| [CosyVoice2](https://huggingface.co/FunAudioLLM) | Alibaba | - | Apache 2.0 | TTS, voice cloning | Natural Chinese/English, streaming |
| [Fish Speech](https://huggingface.co/fishaudio) | Fish Audio | - | Apache 2.0 | Multilingual TTS | Zero-shot voice cloning |

---

<a name="中文"></a>

## 选型指南

### 按场景推荐

| 场景 | 推荐方案 | 理由 |
|------|----------|------|
| **智能客服** | Qwen3.5 + BGE-M3 | 多语言强，嵌入检索配套 |
| **代码助手** | GLM-4.7 或 Qwen2.5-Coder-32B | 前者最强，后者可单卡部署 |
| **文档分析** | InternVL3 或 GLM-4.6V | 图表理解能力突出 |
| **移动端 App** | Phi-4-mini 或 Gemma-3n | 4GB 可跑，多模态 |
| **RAG 系统** | DeepSeek-V3.2 + GTE-Qwen2 | 推理强 + 检索准 |
| **数学教育** | Qwen3-Max (Thinking) | 竞赛级数学推理 |
| **语音交互** | Whisper-V3-Turbo + CosyVoice2 | 识别 + 合成全链路 |
| **Agent 系统** | DeepSeek-V3.2 或 Qwen3.5 | 工具调用和长上下文 |

### 硬件要求速查

| 模型规模 | 最低显存 (量化后) | 适合硬件 |
|----------|-------------------|----------|
| 0.8B-3B | 2-4 GB | 手机, Raspberry Pi, Mac Mini |
| 7B-8B | 6-8 GB | RTX 3060, M1/M2 Mac |
| 14B-32B | 16-24 GB | RTX 4090, A5000 |
| 70B+ | 48-80 GB | A100, H100, 多卡 |
| MoE 400B+ | 80-160 GB | 多 A100/H100 |

---

## How to Add a Model / 如何添加模型

See [CONTRIBUTING.md](../CONTRIBUTING.md#model-entry-template) for the model entry template.

Key criteria:
- Must be **open-source or open-weight** with a clear license
- Must have **genuine capability advantage** in at least one domain
- Must be **practically usable** (has Hugging Face weights, runs on consumer or cloud hardware)
- No vaporware — model must be released and testable
