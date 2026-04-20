# 论文漫画系列 · 设计稿

- **日期**：2026-04-21
- **状态**：待用户确认
- **目标仓库**：`/Users/sky/linux-kernel/ai-doc`（bilingual AI paper 知识库）

---

## 1. 目标

把仓库里 40+ 篇 AI 论文做成水墨风漫画系列，让技术门槛高的论文在保留核心原理的前提下，变得**有趣、好看、可传播**。

**不是做**论文摘要的插画版，**是做**"用漫画叙事重新讲一遍这篇论文"。

---

## 2. 核心决策（已确认）

| 维度 | 决策 | 为什么 |
|---|---|---|
| **叙事框架** | D · 拟人化世界观 | AI 概念全部拟人化为角色；每篇论文是这个世界观下的一集 |
| **视觉风格** | 纯水墨 · 井上雄彦式 | 水墨写意 + 漫画分镜；叙事能力最强 |
| **辅助镜头** | 宋元山水（开场大景）· 上海美影厂（余韵小景）| 井上为主，其他作点缀，不混搭到乱 |
| **格式策略** | 按论文气质选 ①-④ | 不强求统一；单图海报 / 短漫条 / 中篇 / 交互长文皆可 |
| **制作方式** | Tier 2：本地 ComfyUI（免费）| 零预算；用户不画、不修，全靠 Claude 驱动 |
| **发布载体** | 集成进现有 GitHub Pages 站 | 不另起新站 |
| **语言** | 跟现有站一致，中英双语 | 保持一致性 |

---

## 3. 格式选配表

| 论文类型 | 推荐格式 | 示例 |
|---|---|---|
| 哲学向 | ① 单幅海报 / ③ 中篇 | Bitter Lesson · Scaling Laws · First Principles |
| 架构/机制 | ② 短漫 / ③ 中篇 | Attention · MoE · Flash Attention |
| 工程细节密集 | ② 短漫 / ④ 交互长文 | LoRA · PEFT 系列 |
| 综述/趋势 | ④ 交互长文 | Anthropic agent patterns |
| 里程碑 | ③ 中篇 | GPT-3 · Chinchilla |

---

## 4. 世界观 · 人物设定（初稿）

每个核心 AI 概念是一个**角色**，穿梭在水墨山水里。

| 概念 | 角色 | 形象提示 |
|---|---|---|
| Attention | 情报员 | 戴斗笠的旅人，腰间挂多张地图，眼神锐利 |
| Gradient Descent | 流浪者 | 永远走下坡的行者，拄杖寻路 |
| Router (MoE) | 分拣吏 | 驿站门口的管事，分发文书给不同使者 |
| LoRA | 临时工 | 给大师当徒弟的年轻人，背着小包袱 |
| Scaling | 巨人 | 随数据量长大的山间巨人 |
| RLHF | 驯兽师 | 训鹰人，耐心反馈 |
| Memory | 藏书阁老者 | 守着一整山洞卷轴的老者 |

完整人物图谱在 pilot 之后迭代补全。

---

## 5. 视觉风格圣经

### 5.1 色板（固定）

```
底色：#f6f1e6（宣纸米白）
浓墨：#2c2c2c
中墨：#7a7a7a
淡墨：#b5b5b5
朱红：#b33a2a（仅用于印章、落款、极少的关键字）
淡黄：#e8e0cc（云雾、晕染）
```

### 5.2 构图语言（井上式 × AI 友好）

主动使用（AI 画得好）：
- 大片留白 + 角落一人
- 侧脸 / 背影 / 斗笠遮脸
- 枯笔飞白 · 溅墨 · 晕染过渡
- 远景人物（越小越稳）

主动回避（AI 会崩）：
- 正面五官特写（除非用 Kontext 参考图 + 多次生成挑一张）
- 精细手部特写
- 复杂机械
- 多人物密集场景

### 5.3 文字规范

- 中文：题画诗用繁体（复古感）；对白用简体
- 英文：用衬线字体（Playfair Display / Cormorant）
- 落款：朱红印章 + 简短篆字
- Qwen-Image 生成所有印章 / 题字 / 卷轴文字

---

## 6. 制作流水线（Tier 2 · 本地 ComfyUI）

### 6.1 硬件与环境（已验证）

- MacBook Air · Apple M3 · 24GB 统一内存
- 185GB 空余磁盘
- macOS 26.3 · Python 3.14.3 · Git 2.50

**约束**：Python 3.14 与 ComfyUI 依赖（PyTorch MPS）冲突，**必须**用 venv + Python 3.12 隔离。系统 Python 不动。

### 6.2 模型栈

| 模块 | 模型 | 大小 | 角色 |
|---|---|---|---|
| 主模型 | FLUX.1-dev GGUF Q8_0 | ~12 GB | 主画师，出水墨画面 |
| 文本编码 | T5-XXL FP8 | ~5 GB | 理解 prompt |
| 文本编码 | CLIP-L | ~250 MB | 短文本编码 |
| VAE | ae.safetensors | ~335 MB | 解码 |
| 风格 LoRA | Ink Wash Fusion v5.0（首选）· Chinese Ink Style Flux1.D（备选） | ~100 MB | 强化水墨气质 |
| 中文文字 | Qwen-Image 2.0（可选，后期装）| ~14 GB | 生成印章、题诗 |
| 角色一致性 | FLUX.1 Kontext-dev（后期装）| ~12 GB | 跨格角色一致 |

**首期总下载**：~18 GB。Qwen-Image 和 Kontext-dev 等 pilot 跑通再加。

### 6.3 Claude → ComfyUI 驱动路径

装 ComfyUI MCP 服务器：**首选 `artokun/comfyui-mcp`**（专门做成 Claude Code plugin，31 个工具，最完善）。Claude Code 通过 MCP 协议直接：
- 加载 workflow（JSON）
- 调参数（prompt / seed / LoRA 强度）
- 触发生成
- 读取输出图

**用户完全不用打开 ComfyUI 界面**。

### 6.4 单篇论文工作流

```
第 1 步  Claude 读论文 → 提炼核心概念 3-5 个
第 2 步  Claude 写分镜脚本（panel-by-panel），每格标注：
           - 构图（远/中/近景、角色位置）
           - 光影
           - 文字（对白 / 旁白 / 题字）
           - AI prompt
第 3 步  生成 1 张"角色圣经"图（首次创建主角时）
第 4 步  Claude 调 ComfyUI MCP，逐格生成
第 5 步  问题格用 inpaint 局部修
第 6 步  Qwen-Image 生成印章 / 题画诗
第 7 步  Claude 用 HTML + CSS 拼版（panels、对白框、留白）
第 8 步  输出到 docs/comics/<paper-id>.html
第 9 步  本地预览 → 用户确认 → push 到 GitHub Pages
```

---

## 7. Pilot 论文：Bitter Lesson

**路径**：`/Users/sky/linux-kernel/ai-doc/ai-thinking/bitter-lesson.md`

**为什么做第一篇**：
- 核心思想一句话（"算力 + 通用方法赢过精巧人类知识"）
- 哲学向，适合大景山水，不需要复杂角色一致性
- 视觉意象天然（潮水、大山、小人），全是水墨母题
- Sutton 原文像古代哲人语录，气质契合
- **格式**：① 单幅海报 + ② 短漫条（6-8 格）

**Pilot 成功标准**：
- [ ] 1 张主海报，尺寸 1920×1080，分辨率够清晰打印
- [ ] 1 组 6-8 格短漫条，竖屏，微信/Twitter 能直发
- [ ] 中英双语文字版本（对白 + 题字）
- [ ] 集成到 GitHub Pages，有独立链接
- [ ] 生成全过程可复现（保存所有 prompt、seed、workflow JSON）

---

## 8. 发布集成

### 8.1 目录结构

```
docs/
  comics/
    index.html           # 漫画总索引页
    bitter-lesson/
      index.html         # 这一篇的展示页
      cover.png          # 主海报
      strip-01..08.png   # 短漫各格
      assets/            # 字体、CSS
    _assets/
      ink-frame.css      # 通用水墨排版样式
      unified-viewer.js  # 通用漫画查看器
  ...（原有目录不动）
```

### 8.2 导航入口

在现有 `docs/zh/index.html` 和 `docs/en/index.html` 顶部加一个"漫画版"入口，跳转到 `/comics/`。

---

## 9. 非目标 / 已否决

- **不做**纯 AI 一键漫画工厂式的产出（质量不够）
- **不做**赛博朋克 / 吉卜力 / Mid-Century 等其他风格（已确认纯水墨）
- **不做**C+D 融合（已确认纯水墨）
- **不做**固定每篇长度（按气质选格式）
- **不要求**100% AI 生图——允许 Claude 用 HTML/CSS 补齐构图、排版、文字层
- **首期不做** Qwen-Image 和 Kontext 集成，pilot 跑通再加

---

## 10. 已知风险

| 风险 | 应对 |
|---|---|
| 纯 AI 达不到井上级人脸精度 | 分镜脚本主动避正面特写，用侧脸/背影/斗笠 |
| Python 3.14 与 ComfyUI 冲突 | 强制 venv + Python 3.12；先 `brew install python@3.12` 再建 venv |
| M3 首次生成慢（2-5 分钟/张） | 夜间批量，或后期租云 GPU |
| 水墨 LoRA 风格漂移 | 固定 LoRA 权重 + 固定 prompt 前缀；保存 workflow |
| 角色跨格不一致 | pilot 后加 FLUX.1 Kontext-dev + 角色参考图 |
| 40+ 篇规模太大 | 先做 5 篇旗舰证明质量，再按节奏铺量 |

---

## 11. 成功度量

**Pilot 阶段（Bitter Lesson）**：
- 产出 1 组海报 + 短漫（满足 §7 成功标准）
- 用户审美验收：达到"好看到愿意发朋友圈" 的主观门槛

**系列阶段（首季度）**：
- 5 篇精品（1 篇/周）
- 在 GitHub Pages 上线，Twitter / 微博至少各发 1 次

**长期**：
- 覆盖 40+ 篇仓库论文，形成品牌
- 英文圈接受度验证（看是否被 HackerNews / r/MachineLearning 讨论）

---

## 附录 · 下一步

本设计稿确认后，进入 `writing-plans` skill，产出实施计划：
1. ComfyUI 本地安装与验证
2. 模型下载清单与脚本
3. ComfyUI MCP 集成与测试
4. Pilot · Bitter Lesson 分镜脚本与生成
5. 排版模板 · GitHub Pages 集成
