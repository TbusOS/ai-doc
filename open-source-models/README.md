# Open-Source Model Directory / 开源模型目录

[English](#english) | [中文](#中文)

A curated, **living** guide to the best open-source models across capability domains. Updated from live research on public leaderboards, benchmarks, and Hugging Face releases. Focused on models that are **free, production-ready, and genuinely useful** for vertical domain projects.

精选各能力域最佳开源模型指南——**动态维护**，基于公开排行榜、benchmark 和 Hugging Face 发布实时研究。聚焦于**免费、可生产部署、对垂直领域项目真正有用**的模型。

> **Last verified / 最后核验:** 2026-04-19
> **Methodology / 方法:** Cross-referenced BenchLM.ai, Onyx open-weight leaderboard, HF Open ASR Leaderboard, MTEB, SWE-bench Verified / Pro, Seed-TTS Eval, Artificial Analysis, bentoml.com guides. See [Sources](#sources--参考来源) at bottom.

---

<a name="english"></a>

## 1. Frontier Reasoning / 前沿推理 {#1-frontier-reasoning}

For agentic workflows, multi-step planning, and general-purpose high-quality reasoning.

| Model | Provider | Params | License | Best For | Highlights (2026-04) |
|-------|----------|--------|---------|----------|----------------------|
| [**GLM-5.1**](https://huggingface.co/THUDM) | Zhipu AI | MoE (undisclosed active) | Open weight | Agentic engineering, long-horizon SWE | **#1 on BenchLM.ai open-weight leaderboard (84 overall)** — purpose-built for agent loops |
| [**GLM-5 (Reasoning)**](https://huggingface.co/THUDM) | Zhipu AI | MoE | Open weight | Multi-step reasoning | Leaderboard top at 85 overall; reasoning-tuned variant |
| [**Qwen3.5-397B-A17B**](https://huggingface.co/Qwen) | Alibaba | 397B MoE · 17B active | Apache 2.0 | Multimodal reasoning, ultra-long ctx | Flagship MoE, 81 on leaderboard; 119 languages |
| [**DeepSeek-V3.2**](https://huggingface.co/deepseek-ai) | DeepSeek | 685B MoE | MIT | General reasoning + tool use | Very cheap inference (~$0.28/M tokens on hosted APIs); 73.1% SWE-bench |
| [**DeepSeek-V3.2-Speciale**](https://huggingface.co/deepseek-ai) | DeepSeek | 685B MoE | MIT | Hard math/competition reasoning | **Surpasses GPT-5 and reaches Gemini-3.0-Pro-level on AIME / HMMT 2025** |
| [**Llama 4 Maverick**](https://huggingface.co/meta-llama) | Meta | 400B MoE · 17B active | Llama 4 License | General purpose + 1M ctx | Strong all-rounder with cheap per-token cost (17B active) |
| [**MiniMax-M2.7**](https://huggingface.co/MiniMaxAI) | MiniMax | Large MoE | Open weight | Agentic workflows | Actively refines its own agent system — agent-native design |
| [**Gemma 4 26B**](https://huggingface.co/google) | Google | 26B dense | Gemma License | Consumer-hardware reasoning | **Only Western model in top 5**; 85 t/s on M3 Max / RTX 4090 |

---

## 2. Coding / 代码 {#2-coding}

Bug fixing, feature implementation, SWE-bench. Ranked by SWE-bench Verified.

| Model | Provider | Params | License | SWE-bench | Highlights |
|-------|----------|--------|---------|-----------|------------|
| [**Kimi K2.5**](https://huggingface.co/moonshotai) | Moonshot AI | MoE | MIT* | **76.8%** | **#1 open-source on SWE-bench Verified** (Jan 2026 release). *Commercial restriction at 100M+ MAU |
| [**GLM-5.1**](https://huggingface.co/THUDM) | Zhipu AI | MoE | Open weight | leads SWE-bench Pro | Best on SWE-bench Pro + Terminal Bench (full agentic SWE) |
| [**GLM-4.7**](https://huggingface.co/THUDM) | Zhipu AI | — | Open weight | 73.8% | **Runs on consumer hardware** (single RTX 4090 quantized); 94.2 HumanEval |
| [**DeepSeek-V3.2**](https://huggingface.co/deepseek-ai) | DeepSeek | 685B MoE | MIT | 73.1% | More consistent than GLM-4.7 across direct comparisons |
| [**Qwen3-Coder-480B-A35B**](https://huggingface.co/Qwen) | Alibaba | 480B MoE · 35B active | Apache 2.0 | 70.6% | Qwen's flagship coder; strong on repo-scale edits |
| [**Qwen3-Coder-30B-A3B**](https://huggingface.co/Qwen) | Alibaba | 30B MoE · 3B active | Apache 2.0 | ~65% | **Best self-hostable coder** — runs on 24GB VRAM |
| [**Qwen2.5-Coder-32B**](https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct) | Alibaba | 32B dense | Apache 2.0 | ~56% | Mature option, largest LoRA ecosystem |

---

## 3. Math & Reasoning / 数学与推理 {#3-math-reasoning}

Competition math (AIME, HMMT), chain-of-thought, self-correction.

| Model | Provider | Params | License | Best For | Highlights |
|-------|----------|--------|---------|----------|------------|
| [**Step-3.5-Flash**](https://huggingface.co/stepfun-ai) | StepFun | 196B | Open weight | AIME/HMMT | **AIME 2025: 97.3** — tied for highest on full leaderboard at modest size |
| [**GLM-4.7 (Reasoning)**](https://huggingface.co/THUDM) | Zhipu AI | — | Open weight | Competition math | AIME 2025: 97.3; strong open-weight competitor |
| [**DeepSeek-V3.2-Speciale**](https://huggingface.co/deepseek-ai) | DeepSeek | 685B MoE | MIT | Proof-style math | GPT-5-level on AIME/HMMT; HMMT-specialized variant |
| [**DeepSeek-R1**](https://huggingface.co/deepseek-ai/DeepSeek-R1) | DeepSeek | 671B MoE | MIT | o1-level reasoning | Classic R1 still competitive; long thinking chains |
| [**Qwen3 235B (Thinking)**](https://huggingface.co/Qwen) | Alibaba | 235B dense | Apache 2.0 | All-round reasoning | AIME 2025: 92.3; `/think` mode |
| [**QwQ-32B**](https://huggingface.co/Qwen/QwQ-32B) | Alibaba | 32B dense | Apache 2.0 | **Self-hostable reasoning** | Rivals DeepSeek-R1 / o1-mini at 32B; ~48GB for BF16 |
| [**DeepSeek-Math-V2**](https://huggingface.co/deepseek-ai) | DeepSeek | 671B MoE | MIT | Formal math, proofs | Proof generation, Lean integration |
| [**GLM-Z1-9B**](https://huggingface.co/THUDM/GLM-Z1-9B-0414) | Zhipu | 9B | Open weight | Lightweight math | Runs on single RTX 3090; punches well above weight |

---

## 4. Multimodal / Vision / 多模态与视觉 {#4-multimodal-vision}

Vision-language models (VLMs): image understanding, document / chart parsing, visual agents.

| Model | Provider | Params | License | Best For | Highlights |
|-------|----------|--------|---------|----------|------------|
| [**Qwen3-VL-235B-A22B**](https://huggingface.co/Qwen/Qwen3-VL-235B-A22B-Instruct) | Alibaba | 235B MoE · 22B active | Apache 2.0 | **Frontier VLM** | **Rivals Gemini-2.5-Pro / GPT-5** on multimodal benchmarks |
| [**GLM-4.6V**](https://huggingface.co/THUDM) | Zhipu AI | — | Open weight | Visual agent, tool use | End-to-end visual tool use, 128K context |
| [**GLM-4.5V**](https://huggingface.co/THUDM) | Zhipu AI | — | Open weight | Everyday VLM | Smaller but strong agentic abilities |
| [**InternVL3-78B**](https://huggingface.co/OpenGVLab) | Shanghai AI Lab | 78B | Apache 2.0 | Document, chart, 3D vision | **MMMU: 72.2 — SOTA among open-source** |
| [**Qwen2.5-VL-32B**](https://huggingface.co/Qwen/Qwen2.5-VL-32B-Instruct) | Alibaba | 32B | Apache 2.0 | OCR, structured extraction | Fits single A100 80GB |
| [**Qwen2.5-VL-7B**](https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct) | Alibaba | 7B | Apache 2.0 | Self-host VLM | Runs on 16GB VRAM |

---

## 5. Long Context / 长上下文 {#5-long-context}

When you need to ingest full books, codebases, or document archives in one shot.

| Model | Provider | Context | License | Notes |
|-------|----------|---------|---------|-------|
| [**Llama 4 Scout**](https://huggingface.co/meta-llama) | Meta | **10M tokens** | Llama 4 License | 109B MoE · 17B active. Industry-leading context; handles entire codebases |
| [**MiniMax-Text-01**](https://huggingface.co/MiniMaxAI) | MiniMax | 4M tokens | Open weight | Between standard and Scout extreme |
| [**Qwen2.5-1M**](https://huggingface.co/Qwen) | Alibaba | 1M tokens | Apache 2.0 | 7B/14B variants; proven stability at 1M |
| [**Llama 4 Maverick**](https://huggingface.co/meta-llama) | Meta | 1M tokens | Llama 4 License | 400B MoE · 17B active |
| [**Qwen3.5-397B-A17B**](https://huggingface.co/Qwen) | Alibaba | ≥1M | Apache 2.0 | Flagship, multimodal + long ctx |
| [**Qwen3.5-0.8B**](https://huggingface.co/Qwen) | Alibaba | **262K** | Apache 2.0 | Long ctx at edge device scale |

---

## 6. Agent / Tool Use / Agent 与工具调用 {#6-agent-tool-use}

Optimized for function calling, multi-tool orchestration, browser use.

| Model | Provider | Params | License | Highlights |
|-------|----------|--------|---------|------------|
| [**GLM-4.5-Air**](https://huggingface.co/THUDM) | Zhipu AI | — | Open weight | **Purpose-built for agent workflows** — optimized tool use + web browsing |
| [**Qwen3-30B-A3B-Thinking-2507**](https://huggingface.co/Qwen) | Alibaba | 30B MoE · 3B active | Apache 2.0 | Complex reasoning agents with `/think` mode |
| [**Qwen3-Coder-30B-A3B**](https://huggingface.co/Qwen) | Alibaba | 30B MoE | Apache 2.0 | Agentic **coding** workflows (IDE-level) |
| [**MiniMax-M2.7**](https://huggingface.co/MiniMaxAI) | MiniMax | MoE | Open weight | Self-refines its own agent system |
| [**Hermes-4 70B**](https://huggingface.co/NousResearch) | Nous Research | 70B | Llama License | Best open tool-calling on Llama base |
| [**xLAM-2 (series)**](https://huggingface.co/Salesforce) | Salesforce | 8B–70B | CC-BY-NC | Function-calling specialist; APIGen-trained |

---

## 7. Edge & Mobile (≤7B) / 边缘与移动端 {#7-edge-mobile}

Under 7B params, runs on phones / laptops / Jetson-class hardware.

| Model | Provider | Params | License | Best For | Highlights |
|-------|----------|--------|---------|----------|------------|
| [**Phi-4-mini**](https://huggingface.co/microsoft/Phi-4-mini-instruct) | Microsoft | 3.8B | MIT | Tool calling, structured | Reasoning on par with 7–9B models |
| [**Gemma 3 4B**](https://huggingface.co/google/gemma-3-4b-it) | Google | 4B | Gemma License | Apple M-series / Snapdragon | 20-30 t/s at 4-bit; audio + video input |
| [**Gemma 3 2B**](https://huggingface.co/google) | Google | 2B | Gemma License | Ultra-lightweight | For truly tiny devices |
| [**Qwen3.5-0.8B**](https://huggingface.co/Qwen) | Alibaba | 0.8B | Apache 2.0 | Multilingual micro-agent | **262K context + thinking** at 0.8B |
| [**SmolLM3-3B**](https://huggingface.co/HuggingFaceTB) | Hugging Face | 3B | Apache 2.0 | General edge | Beats Llama-3.2-3B and Qwen2.5-3B |
| [**Llama 3.2-3B**](https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct) | Meta | 3B | Llama License | Mobile | Proven, enormous ecosystem |
| [**Llama 3.2-1B**](https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct) | Meta | 1B | Llama License | Tiny fallback | 4GB RAM at 4-bit |

---

## 8. Embedding & Retrieval / 嵌入与检索 {#8-embedding-retrieval}

Semantic search, RAG retrieval. Ranked for production RAG.

| Model | Provider | Params | License | Best For | Highlights |
|-------|----------|--------|---------|----------|------------|
| [**BGE-M3**](https://huggingface.co/BAAI/bge-m3) | BAAI | 568M | MIT | **Multilingual RAG default** | Dense + sparse + ColBERT in one model; 100+ languages |
| [**Qwen3-Embedding-8B**](https://huggingface.co/Qwen) | Alibaba | 8B | Apache 2.0 | Top MTEB | Leads MTEB-multilingual open-source category |
| [**Nomic Embed Text v2**](https://huggingface.co/nomic-ai) | Nomic AI | MoE | Apache 2.0 | Multilingual retrieval | **First MoE embedding model**; 100 languages |
| [**gte-multilingual-base**](https://huggingface.co/Alibaba-NLP/gte-multilingual-base) | Alibaba | 305M | Apache 2.0 | Balanced quality/size | Strong multilingual; efficient |
| [**Jina Embeddings v3**](https://huggingface.co/jinaai/jina-embeddings-v3) | Jina AI | 570M | CC-BY-NC 4.0 | Long documents | **8192 ctx + late chunking** |
| [**mxbai-embed-large-v1**](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1) | Mixedbread | 335M | Apache 2.0 | English MRL | Matryoshka Representation Learning |
| [**nomic-embed-text-v1.5**](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) | Nomic AI | 137M | Apache 2.0 | Tiny embedder | 8K context; efficient CPU inference |

---

## 9. Speech-to-Text (ASR) / 语音识别 {#9-speech-to-text}

Transcription, captioning, voice-interface STT.

| Model | Provider | Params | License | Best For | Highlights |
|-------|----------|--------|---------|----------|------------|
| [**NVIDIA Canary Qwen 2.5B**](https://huggingface.co/nvidia/canary-qwen-2.5b) | NVIDIA | 2.5B | CC-BY 4.0 | English + Q&A | **#1 on HF Open ASR Leaderboard** — 5.63% WER; dual transcribe/analyze |
| [**NVIDIA Parakeet RNNT 1.1B**](https://huggingface.co/nvidia/parakeet-rnnt-1.1b) | NVIDIA | 1.1B | CC-BY 4.0 | English streaming | **LibriSpeech 1.8% WER** — lowest of any open model |
| [**Whisper Large V3 Turbo**](https://huggingface.co/openai/whisper-large-v3-turbo) | OpenAI | 809M | MIT | **99 languages** | Best multilingual; real-time capable |
| [**IBM Granite Speech 3.3**](https://huggingface.co/ibm-granite/granite-speech-3.3-8b) | IBM | 8B | Apache 2.0 | Enterprise | ~5.85% WER; commercial-friendly license |
| [**Qwen3-ASR**](https://huggingface.co/Qwen) | Alibaba | 1.7B / 0.6B | Apache 2.0 | Multilingual + dialects | **52 languages & dialects**; Jan 2026 |
| [**Distil-Whisper**](https://huggingface.co/distil-whisper) | HF / Whisper | — | MIT | Streaming | Low-latency distilled Whisper |

---

## 10. Text-to-Speech (TTS) & Voice Cloning / 语音合成与克隆 {#10-text-to-speech}

| Model | Provider | Params | License | Best For | Highlights |
|-------|----------|--------|---------|----------|------------|
| [**Fish Audio S2 Pro**](https://huggingface.co/fishaudio) | Fish Audio | — | Apache 2.0 | Multilingual + cloning | **Beats Google/OpenAI on Seed-TTS Eval**; 80+ languages zero-shot |
| [**Fish Speech V1.5**](https://huggingface.co/fishaudio/fish-speech-1.5) | Fish Audio | — | Apache 2.0 | Proven multilingual | Stable previous generation, huge ecosystem |
| [**CosyVoice2-0.5B**](https://huggingface.co/FunAudioLLM/CosyVoice2-0.5B) | Alibaba | 0.5B | Apache 2.0 | **Streaming** | **150ms latency** for real-time voice UX |
| [**IndexTTS-2**](https://huggingface.co/IndexTeam) | Bilibili Index | — | Apache 2.0 | Video dubbing | SOTA zero-shot; precise duration & emotion control |
| [**Kokoro-82M**](https://huggingface.co/hexgrad/Kokoro-82M) | hexgrad | 82M | Apache 2.0 | Efficiency | **MOS 4.2 at 82M** — best quality/size ratio |

---

## 11. Image Generation / 图像生成 {#11-image-generation}

| Model | Provider | License | Best For | Highlights |
|-------|----------|---------|----------|------------|
| [**FLUX.2 [dev]**](https://huggingface.co/black-forest-labs) | Black Forest Labs | FLUX-1 Dev Non-Commercial | Photorealism + text rendering | **Production-grade** (Nov 2025); best text-in-image of open models |
| [**FLUX.1 [dev]**](https://huggingface.co/black-forest-labs/FLUX.1-dev) | Black Forest Labs | FLUX-1 Dev | Photorealism | Still the go-to for photoreal single images |
| [**Stable Diffusion 3.5 Large**](https://huggingface.co/stabilityai/stable-diffusion-3.5-large) | Stability AI | Stability Non-Commercial | Quality improvement over SDXL | Quality leap over SDXL |
| [**SDXL**](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0) | Stability AI | CreativeML Open RAIL++-M | **LoRA ecosystem, custom fine-tunes** | Battle-tested since 2023; huge community |
| [**HiDream**](https://huggingface.co/HiDream-ai) | HiDream.ai | Open weight | High-res output | Strong on anime / illustration |

---

## 12. Video Generation / 视频生成 {#12-video-generation}

| Model | Provider | Params | License | Best For | Highlights |
|-------|----------|--------|---------|----------|------------|
| [**Wan 2.2 T2V-A14B**](https://huggingface.co/Wan-AI) | Alibaba | 14B active MoE | Apache 2.0 | T2V 480P/720P 5s | **First open-source MoE video model**; cinematic quality |
| [**HunyuanVideo**](https://huggingface.co/tencent/HunyuanVideo) | Tencent | 13B | Tencent License | Professional T2V | **Beats Runway Gen-3** on benchmarks; mature ecosystem |
| [**Mochi 1**](https://huggingface.co/genmo/mochi-1-preview) | Genmo | — | Apache 2.0 | Best T2V quality/license | Apache 2.0 gives full commercial freedom |
| [**CogVideoX-5B**](https://huggingface.co/THUDM/CogVideoX-5b) | Zhipu | 5B | Apache 2.0 | **Image-to-Video** | Best I2V; runs on 1× 3090 |
| [**LTX-Video**](https://huggingface.co/Lightricks/LTX-Video) | Lightricks | — | OpenRAIL | Real-time | First DiT-based real-time video model |

---

<a name="中文"></a>

## 选型速查 / Quick Selection

### 按场景推荐 / By Scenario

| 场景 Scenario | 推荐方案 Recommendation | 为什么 Why |
|---|---|---|
| **智能客服 Customer Support** | Qwen3.5 + BGE-M3 | 多语言 + 成熟的嵌入检索 |
| **代码助手 (云端) Coding (Cloud)** | GLM-5.1 或 Kimi K2.5 | SWE-bench 顶级开源模型 |
| **代码助手 (自建) Coding (Self-host)** | GLM-4.7 或 Qwen3-Coder-30B-A3B | 可在消费级显卡跑 |
| **文档/图表 Document & Chart** | InternVL3-78B 或 Qwen3-VL-235B | MMMU 顶级，表格/图表强 |
| **移动端 App Mobile** | Phi-4-mini 或 Gemma 3 4B | 4GB RAM 可跑；M-系列友好 |
| **RAG 系统 RAG** | DeepSeek-V3.2 + BGE-M3 | 推理 + 检索双强，价格极低 |
| **数学教育 Math Tutor** | QwQ-32B 或 Step-3.5-Flash | 32B 自建 / 196B 顶尖 |
| **语音交互 Voice UX** | Whisper-V3-Turbo + CosyVoice2 | 99 语言识别 + 150ms 合成 |
| **语音转录企业 Enterprise ASR** | Canary Qwen 2.5B (英文) 或 IBM Granite Speech 3.3 | 低 WER + 商用许可 |
| **Agent 系统 Agent** | GLM-4.5-Air 或 MiniMax-M2.7 | 工具调用 + 长任务 |
| **超长上下文 Long Context** | Llama 4 Scout (10M) 或 Qwen2.5-1M | 整个代码库一次喂 |
| **文生图 T2I** | FLUX.2 [dev] (质量) 或 SDXL (生态) | 需要二次微调选 SDXL |
| **文生视频 T2V** | Wan 2.2 (质量) 或 Mochi 1 (许可宽松) | 商用选 Mochi |

### 硬件要求速查 / Hardware Quick Reference

| 模型规模 Scale | 最低显存 (4-bit 量化) | 适合硬件 Hardware |
|----------|-----|----------|
| **0.8B – 3B** | 2 – 4 GB | 手机 · Raspberry Pi · Mac Mini · 树莓派 |
| **7B – 8B** | 6 – 8 GB | RTX 3060 · M1/M2/M3 Mac · GTX 1080 |
| **14B – 32B** | 16 – 24 GB | RTX 4090 · A5000 · M3/M4 Max (64GB) |
| **70B dense** | 40 – 48 GB | A6000 · 2×4090 · M3 Ultra (128GB) |
| **MoE 30B-A3B** | 16 – 24 GB (总权重 ~60GB 但活跃 3B) | RTX 4090 (权重需快速存储) |
| **MoE 400B-A17B** | 80 – 160 GB 显存或 512 GB 统一内存 | 多卡 A100/H100 · M3 Ultra (512GB) |
| **MoE 600B+** | 8× H100 80GB 或等价 | 企业级部署 |

---

## 重要变更记录 / Changelog

- **2026-04-19** — Full rewrite: added GLM-5/5.1, Kimi K2.5, Step-3.5-Flash, Qwen3-VL-235B, Wan 2.2, FLUX.2, Canary Qwen 2.5B, Qwen3-ASR, Fish Audio S2 Pro, Hermes-4. Added two new categories: **Agent/Tool Use** and **Video Generation**. Removed stale entries (Qwen-QwQ-32B renamed to QwQ-32B, etc.).
- **2026-03** — Initial version with 7 categories.

---

## How to Add a Model / 如何添加模型

See [CONTRIBUTING.md](../CONTRIBUTING.md#model-entry-template) for the full template.

Hard criteria:

- Must be **open-source or open-weight** with a clear license (commercial-use status noted if restricted)
- Must have **verifiable benchmark** or well-documented real-world capability
- Must be **practically usable** (weights on HF, runs on consumer or affordable cloud hardware)
- Must be **not vaporware** — released and downloadable at time of listing
- Include a **Last verified** date in the row; readers must know the nutrient freshness

---

<a name="sources--参考来源"></a>

## Sources / 参考来源

Cross-referenced at the 2026-04-19 verification pass:

- [BenchLM.ai Open-Weight Leaderboard](https://benchlm.ai/blog/posts/best-open-source-llm) — real-time rankings
- [Onyx Open-Source LLM Leaderboard 2026](https://onyx.app/open-llm-leaderboard)
- [HF Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard)
- [Artificial Analysis open-weight comparison](https://artificialanalysis.ai/)
- [bentoml.com — Best Open-Source LLMs in 2026](https://www.bentoml.com/blog/navigating-the-world-of-open-source-large-language-models)
- [bentoml.com — Best Open-Source Embedding Models](https://www.bentoml.com/blog/a-guide-to-open-source-embedding-models)
- [bentoml.com — Best Open-Source Small Language Models](https://www.bentoml.com/blog/the-best-open-source-small-language-models)
- [bentoml.com — Multimodal VLMs in 2026](https://www.bentoml.com/blog/multimodal-ai-a-guide-to-open-source-vision-language-models)
- [bentoml.com — Open-Source TTS Models](https://bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models)
- [SiliconFlow — LLM for Agent Workflow](https://www.siliconflow.com/articles/en/best-open-source-LLM-for-Agent-Workflow)
- [SiliconFlow — Best Open-Source Coding LLMs](https://www.siliconflow.com/articles/en/best-open-source-LLMs-for-coding)
- [Northflank — Best STT 2026](https://northflank.com/blog/best-open-source-speech-to-text-stt-model-in-2026-benchmarks)
- [Wavespeed — Best Open Source Image Models 2026](https://wavespeed.ai/landing/models/best-open-source-image-models-2026)
- [Hyperstack — Best Open-Source Video Generation Models](https://www.hyperstack.cloud/blog/case-study/best-open-source-video-generation-models)
- [SWE-rebench Leaderboard](https://swe-rebench.com)
- [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard)

Last tool-verified at 2026-04-19 (Hong Kong / Beijing timezone). Model benchmarks and releases move weekly — re-verify before any critical production selection.
