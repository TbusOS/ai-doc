# 论文漫画 · Pilot 实施计划 — Bitter Lesson

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 装好本地 ComfyUI + FLUX.1-dev + 水墨 LoRA，通过 MCP 接入 Claude Code，然后产出 Pilot 论文 Bitter Lesson 的水墨漫画（1 张海报 + 6 格短漫），发布到 GitHub Pages。

**Architecture:** 本地 ComfyUI 跑 FLUX.1-dev GGUF **Q6_K**（9.5GB，适合 24GB M3 统一内存，留足系统和其他 app 余量）+ Ink Wash Fusion LoRA。Claude Code 通过 artokun/comfyui-mcp 驱动工作流生成每一格。HTML/CSS 由 Claude 直接写，Qwen-Image 集成推迟到 v2。

**Tech Stack:**
- Python 3.12（via Homebrew，隔离于系统 Python 3.14）
- ComfyUI（latest main）+ ComfyUI-Manager + ComfyUI-GGUF
- FLUX.1-dev GGUF **Q6_K** · T5-XXL FP8 · CLIP-L · ae.safetensors
- Ink Wash Fusion LoRA（Civitai）
- artokun/comfyui-mcp · Claude Code
- HTML/CSS 纯静态（no build step），嵌入现有 GitHub Pages

**Scope:** 仅 Pilot。大规模铺量 + Qwen-Image 集成 + FLUX.1 Kontext 角色一致性，另起 plan。

---

## 文件结构

```
~/ComfyUI/                                # ComfyUI 安装目录（独立于项目）
  venv/                                   # Python 3.12 虚拟环境
  models/
    unet/flux1-dev-Q6_K.gguf                # ~9.5 GB (Q6 量化，24GB Mac 友好)
    clip/t5xxl_fp8_e4m3fn.safetensors
    clip/clip_l.safetensors
    vae/ae.safetensors
    loras/ink-wash-fusion.safetensors
  custom_nodes/
    ComfyUI-Manager/
    ComfyUI-GGUF/
  workflows/
    paper-comic-base.json                 # 我们的基础水墨 workflow

/Users/sky/linux-kernel/ai-doc/           # 项目仓库
  tools/
    comic-pipeline/
      README.md                           # 制作流水线说明
      character-bible.md                  # 角色圣经（持续更新）
      workflows/                          # ComfyUI workflow JSON 副本
        paper-comic-base.json
    smoke-test.md                         # 出图 smoke test 记录
  docs/
    comics/
      index.html                          # 漫画总索引
      _assets/
        ink-frame.css                     # 通用水墨样式
        viewer.js                         # 通用查看器
      bitter-lesson/
        index.html                        # Pilot 作品页
        storyboard.md                     # 分镜脚本（含 prompt 原文）
        assets/
          cover.png                       # 主海报
          panel-01.png … panel-06.png
          thumb.png                       # 缩略图
  docs/zh/index.html                      # 已有，加"漫画"入口
  docs/en/index.html                      # 已有，加"漫画"入口
```

---

## Part A · ComfyUI 环境（Tasks 1-6）

### Task 1: 安装 Python 3.12（隔离于系统 3.14）

**Files:**
- 无（系统级安装）

**背景：** 系统当前 Python 是 3.14.3（Homebrew 默认），但 ComfyUI + PyTorch MPS 当前稳定支持 3.12。必须并存，不能替换。

- [ ] **Step 1: 检查是否已有 Python 3.12**

```bash
ls /opt/homebrew/bin/python3.12 2>/dev/null && echo "found" || echo "need install"
```

Expected: "need install"（首次）或 "found"（已装过）

- [ ] **Step 2: 安装 Python 3.12**

```bash
brew install python@3.12
```

Expected: 成功，或 "already installed"。装完验证：

```bash
/opt/homebrew/bin/python3.12 --version
```

Expected: `Python 3.12.x`

- [ ] **Step 3: 无需提交**（系统级变化，不入 git）

---

### Task 2: 克隆 ComfyUI + 创建 venv

**Files:**
- Create: `~/ComfyUI/`（git clone）
- Create: `~/ComfyUI/venv/`

- [ ] **Step 1: 克隆 ComfyUI**

```bash
cd ~ && git clone https://github.com/comfyanonymous/ComfyUI.git ~/ComfyUI
cd ~/ComfyUI && git log -1 --oneline
```

Expected: 看到最新 commit hash。

- [ ] **Step 2: 创建 venv（Python 3.12）**

```bash
cd ~/ComfyUI && /opt/homebrew/bin/python3.12 -m venv venv
source ~/ComfyUI/venv/bin/activate && python --version
```

Expected: `Python 3.12.x`

- [ ] **Step 3: 安装 PyTorch（MPS 版本）**

```bash
source ~/ComfyUI/venv/bin/activate
pip install --upgrade pip
pip install torch torchvision torchaudio
```

Expected: 无报错。

- [ ] **Step 4: 安装 ComfyUI 依赖**

```bash
source ~/ComfyUI/venv/bin/activate
cd ~/ComfyUI && pip install -r requirements.txt
```

Expected: 无报错，全部安装完成。

- [ ] **Step 5: 验证 MPS 可用**

```bash
source ~/ComfyUI/venv/bin/activate
python -c "import torch; print('MPS available:', torch.backends.mps.is_available())"
```

Expected: `MPS available: True`

- [ ] **Step 6: 无需提交**（ComfyUI 在仓库外）

---

### Task 3: 安装 ComfyUI-Manager + ComfyUI-GGUF 自定义节点

**Files:**
- Create: `~/ComfyUI/custom_nodes/ComfyUI-Manager/`
- Create: `~/ComfyUI/custom_nodes/ComfyUI-GGUF/`

**背景：** ComfyUI-Manager 是必备（装其他节点 / 模型），ComfyUI-GGUF 让我们能加载 FLUX 的 GGUF 量化版（大幅降低内存占用）。

- [ ] **Step 1: 安装 ComfyUI-Manager**

```bash
cd ~/ComfyUI/custom_nodes
git clone https://github.com/ltdrdata/ComfyUI-Manager.git
```

Expected: 克隆成功。

- [ ] **Step 2: 安装 ComfyUI-GGUF**

```bash
cd ~/ComfyUI/custom_nodes
git clone https://github.com/city96/ComfyUI-GGUF.git
source ~/ComfyUI/venv/bin/activate
pip install --upgrade gguf
```

Expected: 克隆成功，gguf 库装上。

- [ ] **Step 3: 无需提交**

---

### Task 4: 下载 FLUX.1-dev GGUF + 文本编码器 + VAE

**Files:**
- Create: `~/ComfyUI/models/unet/flux1-dev-Q6_K.gguf` (~9.5 GB)
- Create: `~/ComfyUI/models/clip/t5xxl_fp8_e4m3fn.safetensors` (~5 GB)
- Create: `~/ComfyUI/models/clip/clip_l.safetensors` (~250 MB)
- Create: `~/ComfyUI/models/vae/ae.safetensors` (~335 MB)

**背景：** 总下载 ~15 GB（Q6_K 比 Q8_0 省 2.5 GB）。网速 50Mbps 约 40 分钟。这一步体验不佳但不可省——所有画面靠这几个文件出。

**为什么选 Q6_K（而非 Q8_0）**：24GB M3 跑 Q8_0 会频繁 swap。Q6_K 模型权重 9.5GB + T5 5GB + 激活 3GB + ComfyUI + macOS ≈ 22GB，留 2GB 给浏览器。水墨画是写意风，Q6 和 Q8 质量差距我们用例里看不出来。

- [ ] **Step 1: 安装 huggingface-cli**

```bash
source ~/ComfyUI/venv/bin/activate
pip install -U "huggingface_hub[cli]"
```

Expected: 安装完成。

- [ ] **Step 2: 接受 FLUX.1-dev 模型协议**

> ⚠️ **需要用户动手一次**：访问 https://huggingface.co/black-forest-labs/FLUX.1-dev 在网页上点击同意 license（非商业用途）。然后在本地：

```bash
huggingface-cli login
# 粘贴 huggingface.co/settings/tokens 生成的 read token
```

Expected: `Login successful`

- [ ] **Step 3: 下载 FLUX.1-dev GGUF Q6_K**

```bash
cd ~/ComfyUI/models/unet
huggingface-cli download city96/FLUX.1-dev-gguf flux1-dev-Q6_K.gguf --local-dir . --local-dir-use-symlinks False
ls -lh flux1-dev-Q6_K.gguf
```

Expected: ~9.5 GB 文件存在。

- [ ] **Step 4: 下载 T5-XXL FP8**

```bash
cd ~/ComfyUI/models/clip
huggingface-cli download comfyanonymous/flux_text_encoders t5xxl_fp8_e4m3fn.safetensors --local-dir . --local-dir-use-symlinks False
ls -lh t5xxl_fp8_e4m3fn.safetensors
```

Expected: ~5 GB 文件存在。

- [ ] **Step 5: 下载 CLIP-L**

```bash
cd ~/ComfyUI/models/clip
huggingface-cli download comfyanonymous/flux_text_encoders clip_l.safetensors --local-dir . --local-dir-use-symlinks False
ls -lh clip_l.safetensors
```

Expected: ~250 MB 文件存在。

- [ ] **Step 6: 下载 VAE（ae.safetensors）**

```bash
cd ~/ComfyUI/models/vae
huggingface-cli download black-forest-labs/FLUX.1-schnell ae.safetensors --local-dir . --local-dir-use-symlinks False
ls -lh ae.safetensors
```

Expected: ~335 MB 文件存在。

- [ ] **Step 7: 无需提交**（模型在仓库外）

---

### Task 5: 下载 Ink Wash Fusion LoRA

**Files:**
- Create: `~/ComfyUI/models/loras/ink-wash-fusion.safetensors` (~150 MB)

**背景：** 水墨风格的核心。从 Civitai 下载。Civitai 需要登录，但 LoRA 本身可以直接 URL 下载（有时要 API key）。

- [ ] **Step 1: 手动下载 Ink Wash Fusion LoRA**

> 需要用户动手：访问 https://civitai.com/models/993138/ink-wash-fusion ，登录后下载 v5.0 Krea 版本的 .safetensors 文件。

放到：`~/ComfyUI/models/loras/ink-wash-fusion.safetensors`

- [ ] **Step 2: 验证文件**

```bash
ls -lh ~/ComfyUI/models/loras/ink-wash-fusion.safetensors
```

Expected: ~100-200 MB 文件存在。

- [ ] **Step 3: 无需提交**

---

### Task 6: 启动 ComfyUI + Smoke Test

**Files:**
- Create: `/Users/sky/linux-kernel/ai-doc/tools/comic-pipeline/smoke-test.md`

- [ ] **Step 1: 启动 ComfyUI（后台）**

```bash
source ~/ComfyUI/venv/bin/activate
cd ~/ComfyUI
python main.py --listen 127.0.0.1 --port 8188 &
sleep 10
curl -s http://127.0.0.1:8188/ -o /dev/null -w "%{http_code}\n"
```

Expected: `200`（ComfyUI 监听中）。浏览器打开 http://127.0.0.1:8188 可以看到 UI。

- [ ] **Step 2: 通过 UI 跑一次 FLUX GGUF 基础 workflow**

> 用户动作：浏览器打开 http://127.0.0.1:8188 ，拖入默认 FLUX 示例图，把 "Load Checkpoint" 节点改成 "Unet Loader (GGUF)" 指向 flux1-dev-Q6_K.gguf。Prompt 用：
>
> `ink wash painting, misty mountains, lone traveler with bamboo hat, calligraphic seal, Chinese Song dynasty style, masterpiece`

Expected：2-5 分钟内出一张水墨风景图。

- [ ] **Step 3: 记录结果**

创建 `tools/comic-pipeline/smoke-test.md` 记录：
- 生成时间（秒）
- 图像质量评价
- 内存峰值
- 第一张生成图路径（截图放进去）

```markdown
# Smoke Test — ComfyUI + FLUX GGUF

**日期**: 2026-04-21
**模型**: flux1-dev-Q6_K.gguf
**LoRA**: 暂未启用

## 结果
- 生成时间: <填> 秒
- 图像: [smoke-01.png](assets/smoke-01.png)
- 内存峰值: <填> GB
- 评价: <填>

## 下一步
- Task 7 加 Ink Wash LoRA 重测
```

- [ ] **Step 4: 提交 smoke-test 记录**

```bash
cd /Users/sky/linux-kernel/ai-doc
mkdir -p tools/comic-pipeline/assets
cp ~/ComfyUI/output/<第一张生成图> tools/comic-pipeline/assets/smoke-01.png
git add tools/comic-pipeline/
git commit -m "chore(comic): bootstrap ComfyUI smoke test"
```

---

## Part B · MCP 集成（Tasks 7-8）

### Task 7: 安装 artokun/comfyui-mcp Claude Code plugin

**Files:**
- Modify: Claude Code settings（MCP server 注册）

**背景：** 这一步装完后，Claude Code 可以直接在对话里调 ComfyUI，不用用户打开 UI。

- [ ] **Step 1: 查阅 artokun/comfyui-mcp 安装说明**

```bash
open https://github.com/artokun/comfyui-mcp
```

> 用户动作：按 README 完成。典型步骤：克隆仓库 → npm install → 在 Claude Code 设置里添加 MCP server。

- [ ] **Step 2: 配置 MCP server 指向本地 ComfyUI**

典型 `~/.claude/mcp_servers.json` 或 Claude Code settings.json 增加：

```json
{
  "mcpServers": {
    "comfyui": {
      "command": "node",
      "args": ["/path/to/comfyui-mcp/dist/index.js"],
      "env": {
        "COMFYUI_URL": "http://127.0.0.1:8188"
      }
    }
  }
}
```

- [ ] **Step 3: 重启 Claude Code 确认 MCP 工具可见**

Expected: Claude Code 在 ToolSearch 或 MCP 列表里看到 `comfyui` 相关工具。

- [ ] **Step 4: 无需提交**（settings 是本地配置）

---

### Task 8: MCP Smoke Test（Claude 直接出图）

**Files:**
- Create: `tools/comic-pipeline/smoke-test.md`（追加 §MCP 一节）

- [ ] **Step 1: 在 Claude Code 对话里直接请求生成**

用户在对话里说："用 MCP 生成一张水墨山水"。Claude 应该能调 `comfyui` MCP 工具，传 workflow JSON，拿到图。

- [ ] **Step 2: 把生成图存到 repo**

```bash
cd /Users/sky/linux-kernel/ai-doc
cp <mcp-输出路径> tools/comic-pipeline/assets/mcp-smoke-01.png
```

- [ ] **Step 3: 更新 smoke-test.md**

追加：
```markdown
## MCP 链路

- 调用方式: Claude Code → comfyui MCP → ComfyUI http://127.0.0.1:8188
- 端到端耗时: <填> 秒
- 图像: [mcp-smoke-01.png](assets/mcp-smoke-01.png)
- 评价: <填>
```

- [ ] **Step 4: 提交**

```bash
cd /Users/sky/linux-kernel/ai-doc
git add tools/comic-pipeline/
git commit -m "feat(comic): MCP smoke test — Claude → ComfyUI end-to-end"
```

---

## Part C · Pilot · Bitter Lesson（Tasks 9-14）

### Task 9: 提炼核心概念 + 写角色圣经 v1

**Files:**
- Create: `/Users/sky/linux-kernel/ai-doc/tools/comic-pipeline/character-bible.md`

- [ ] **Step 1: 读原文**

阅读 `ai-thinking/bitter-lesson.md`。Sutton 的 7 段论 + 4 个历史案例（象棋、围棋、语音、视觉）。

- [ ] **Step 2: 提炼 Bitter Lesson 的核心概念到 3-5 个可视觉化的意象**

```
概念 1 · 两条路
  - "人类知识之路"：精雕细琢的楼阁，好看但小
  - "算力之路"：宽阔但粗朴的大道，通向远方
概念 2 · 潮水与堤坝
  - 堤坝 = 手工设计的规则
  - 潮水 = 算力和数据
  - 堤坝总会被涨潮淹没
概念 3 · 象棋大师的叹息
  - 1997 年深蓝击败卡斯帕罗夫
  - 精巧派的落寞
概念 4 · 简单的胜利
  - 通用方法只用"卷积 + 不变性"就击败 SIFT 之类
概念 5 · 承认苦涩
  - 反复被打脸的研究者
```

- [ ] **Step 3: 写角色圣经 v1**

Create `tools/comic-pipeline/character-bible.md`:

```markdown
# 角色圣经 · v1

## 观察者 · 苦涩的智者（Bitter Lesson 叙述者原型）
- 原型: Richard Sutton 的化身，一位走过 70 年 AI 路的老学者
- 视觉: 白发、戴斗笠、拄拐杖、背一卷书
- 色: 浓墨袍 + 朱红披帛（极少）
- 位置: 常在山巅或高处远望
- 表情: 不显露，以背影或侧影为主
- 关键 prompt 片段:
  "elderly scholar in ink wash style, bamboo hat, long walking staff,
   back view, standing on mountain cliff, flowing robes,
   dramatic brush strokes, Sumi-e, sparse composition"

## 工匠派 · 精雕细琢者
- 原型: 追求"手工规则 / 启发式"的研究者
- 视觉: 年轻匠人，戴工匠帽，手持凿刀，雕一个小木楼
- 色: 灰墨为主，楼阁刻画精细
- 情绪: 认真，后期沮丧
- 出场: 概念 1 "两条路"、概念 3 "象棋大师的叹息"

## 潮水派 · 顺势者
- 原型: 拥抱"算力 + 数据"的研究者
- 视觉: 身影轻盈，不刻意露脸，跟着水流走
- 色: 极淡墨 + 留白
- 情绪: 淡然
- 出场: 概念 2 "潮水"

## 象征物（非角色）
- 潮水 = 真实海浪的写意笔触
- 堤坝 = 几何感的墨块（与人物的有机线条对比）
- 大山 = 贯穿始终的背景意象
- 卷轴 = 纪年标志
```

- [ ] **Step 4: 提交**

```bash
cd /Users/sky/linux-kernel/ai-doc
git add tools/comic-pipeline/character-bible.md
git commit -m "feat(comic): character bible v1 for Bitter Lesson pilot"
```

---

### Task 10: 写分镜脚本（storyboard）

**Files:**
- Create: `docs/comics/bitter-lesson/storyboard.md`

- [ ] **Step 1: 设计分镜结构**

1 封面 + 6 格短漫 = 7 张图。每张要：场景 / 视角 / 角色 / 对白或旁白 / AI prompt。

- [ ] **Step 2: 写完整 storyboard.md**

Create `docs/comics/bitter-lesson/storyboard.md`:

````markdown
# Bitter Lesson · Storyboard

**原论文**: [The Bitter Lesson (Sutton, 2019)](http://www.incompleteideas.net/IncIdeas/BitterLesson.html)
**格式**: ① 单幅海报 + ② 短漫条（6 格）
**作品集成路径**: docs/comics/bitter-lesson/index.html

## 共同风格 prompt（所有图共享前缀）

```
ink wash painting, Sumi-e style, Song dynasty landscape, 
flowing brush strokes, dry brush flying-white, sparse composition, 
vast negative space, muted colors (ink black, rice paper cream, 
single red seal accent), masterpiece, high quality
```

LoRA: `ink-wash-fusion` 权重 0.8

---

## 封面 · Cover

**主题**: "70 年，一个苦涩的教训"
**构图**: 大景——巨大远山占 70% 画面，中景一条河，近景左下角一个戴斗笠的老人背影眺望，右上留白题诗空间。
**视角**: 远景俯瞰
**文字**:
  - 主标题（右上，竖排繁体）: 苦澀之教訓
  - 副标题（左下竖排小字）: 七十載 AI 之路
  - 英文（底部横排）: The Bitter Lesson — Richard Sutton, 2019
  - 朱红印章（"苦"字）

**AI prompt**:
```
[共同风格] + grand mountain landscape, misty river winding through, 
lone elderly scholar with bamboo hat silhouetted at bottom-left, 
back view facing mountains, vast empty sky above for calligraphy, 
dramatic flying-white brush strokes on distant peaks, 
single drop of vermillion red in composition, aspect ratio 16:9
```

Seed: （首次生成时随机，记下来）

---

## Panel 1 · 两条路

**主题**: 开场——两条岔路从观察者脚下延伸
**构图**: 观察者背影近景（下方 1/3），前方地面分两条路：
  - 左路（工匠路）：蜿蜒精致，两旁有微缩的精美楼阁雕像
  - 右路（算力路）：宽阔粗犷，消失在远山云雾里
**旁白**（右侧竖排）: 路有二。

**AI prompt**:
```
[共同风格] + two diverging paths at viewer's feet, 
left path narrow and winding with tiny elaborate pavilion carvings along it, 
right path wide and rough fading into misty mountains, 
elderly scholar silhouette at bottom center foreground, back view, 
aspect ratio 3:4 (portrait for strip)
```

---

## Panel 2 · 工匠的小楼

**主题**: 工匠精雕细琢
**构图**: 中景——工匠跪坐，专注雕凿一座精美的微缩阁楼。阁楼精美绝伦，但只有小人大小。
**旁白**: 匠人刻得細，樓亦精——然，終只能盛一斛水。

**AI prompt**:
```
[共同风格] + young craftsman kneeling, carving intricate miniature pagoda, 
workbench with chisels, detailed rendering of the tiny pagoda, 
craftsman shown in side profile, focused expression, 
subtle irony in composition, aspect ratio 3:4
```

---

## Panel 3 · 潮水涌起

**主题**: 潮水淹没堤坝
**构图**: 大浪从右向左推进，浪尖带泡沫（飞白笔触）。左侧是一道几何墨块画的堤坝，被浪头淹没。浪里可见模糊的数字符号（0/1 若隐若现，淡墨）。
**旁白**: 然而潮水漲起。

**AI prompt**:
```
[共同风格] + massive ocean wave crashing left-to-right, 
geometric ink block representing a seawall being overtaken, 
foam and spray rendered with dry brush flying-white technique, 
faint binary numerals 0 and 1 within the water, ghostly, 
dramatic scale contrast, aspect ratio 3:4
```

---

## Panel 4 · 象棋大师的叹息

**主题**: 1997 深蓝胜卡斯帕罗夫（历史案例 1）
**构图**: 特写——一张象棋盘（西洋棋），一只手（机器侧，简洁金属）和一只手（人类侧，老人的手）悬停在棋子上方。人类的手微微颤抖（用细线表现）。背景留白极大，上方一滴朱红印章。
**旁白**: 一九九七，深藍勝，大師默然。

**AI prompt**:
```
[共同风格] + chess board close-up, minimalist, one metallic robotic hand 
and one elderly human hand hovering over pieces, 
human hand rendered with slight tremor line, 
vast empty background, single vermillion seal stamp top-right, 
aspect ratio 3:4
```

---

## Panel 5 · 简单者之胜

**主题**: 计算机视觉案例——卷积击败 SIFT
**构图**: 一根卷轴展开，上面只写两个字"卷"和"积"（书法）。旁边凌乱散落着许多旧工具（代表 SIFT / 手工特征），落满灰尘。
**旁白**: 卷積二字，足矣。舊器，盡棄。

**AI prompt**:
```
[共同风格] + ancient Chinese scroll unrolled, calligraphy of 
two large characters "卷" and "積" in bold brush, 
around it dusty abandoned tools symbolizing obsolete hand-crafted features, 
high contrast between the clean scroll and cluttered tools, 
aspect ratio 3:4
```

---

## Panel 6 · 观察者的叹息

**主题**: 收束——观察者在山顶，望着下方的一切
**构图**: 观察者完整入镜，站在山顶，背影。山下远景隐约可见前几格的元素（潮水、棋盘、卷轴）散落在山脚，缩得很小。上方留白，题一首收束诗。
**旁白**（上方竖排繁体诗）: 
  苦耶？甘耶？
  七十載，只一字：算。

**AI prompt**:
```
[共同风格] + elderly scholar silhouette standing on mountain summit, 
back view looking down at sprawling landscape below, 
small scattered symbolic elements visible in distant valley 
(wave, chessboard, scroll), huge empty sky above for poem calligraphy, 
vermillion seal bottom-right, aspect ratio 3:4
```

---

## 双语文字（HTML 页面用）

### 中文旁白（按顺序）
1. 路有二。
2. 匠人刻得細，樓亦精——然，終只能盛一斛水。
3. 然而潮水漲起。
4. 一九九七，深藍勝，大師默然。
5. 卷積二字，足矣。舊器，盡棄。
6. 苦耶？甘耶？七十載，只一字：算。

### English narration
1. Two paths diverge.
2. The craftsman carves with precision. Beautiful, but small.
3. Then the tide rises.
4. 1997: Deep Blue wins. The master falls silent.
5. "Convolution"—two characters suffice. The old tools, discarded.
6. Bitter? Sweet? Seventy years, one word: compute.
````

- [ ] **Step 3: 提交**

```bash
cd /Users/sky/linux-kernel/ai-doc
mkdir -p docs/comics/bitter-lesson
git add docs/comics/bitter-lesson/storyboard.md
git commit -m "feat(comic): storyboard for Bitter Lesson pilot"
```

---

### Task 11: 生成封面 + 6 格面板

**Files:**
- Create: `docs/comics/bitter-lesson/assets/cover.png`
- Create: `docs/comics/bitter-lesson/assets/panel-01.png` … `panel-06.png`

- [ ] **Step 1: 通过 MCP 生成封面（多次迭代）**

在 Claude Code 对话里请求：
> 用 comfyui MCP 按 storyboard.md 的"封面"部分生成 3-5 张候选，seed 分别记录，存到 `/tmp/cover-*.png`

- [ ] **Step 2: 挑选最好的一张，存为 cover.png**

```bash
cp /tmp/cover-<best>.png /Users/sky/linux-kernel/ai-doc/docs/comics/bitter-lesson/assets/cover.png
```

- [ ] **Step 3: 按 Panel 1-6 的 prompt，依次生成**

每个面板 2-3 张候选，挑一张。

- [ ] **Step 4: 检查文件完整**

```bash
ls -lh /Users/sky/linux-kernel/ai-doc/docs/comics/bitter-lesson/assets/
```

Expected: `cover.png` + `panel-01.png` ~ `panel-06.png`，各 1-5 MB。

- [ ] **Step 5: 把实际用过的 seed 和 prompt 小幅回填到 storyboard.md**（可复现）

- [ ] **Step 6: 提交**

```bash
cd /Users/sky/linux-kernel/ai-doc
git add docs/comics/bitter-lesson/assets/ docs/comics/bitter-lesson/storyboard.md
git commit -m "feat(comic): generate Bitter Lesson cover + 6 panels"
```

---

### Task 12: 写通用水墨样式（ink-frame.css）

**Files:**
- Create: `docs/comics/_assets/ink-frame.css`

- [ ] **Step 1: 写基础样式**

```css
/* docs/comics/_assets/ink-frame.css */

:root {
  --paper: #f6f1e6;
  --ink-deep: #2c2c2c;
  --ink-mid: #7a7a7a;
  --ink-light: #b5b5b5;
  --vermillion: #b33a2a;
  --mist: #e8e0cc;
}

body.comic-page {
  margin: 0;
  background: var(--paper);
  color: var(--ink-deep);
  font-family: "Noto Serif SC", "STKaiti", "PingFang SC", serif;
  line-height: 1.7;
}

.comic-page .cover {
  max-width: 1600px;
  margin: 0 auto;
  padding: 40px 24px 24px;
}

.comic-page .cover img {
  width: 100%;
  height: auto;
  display: block;
  box-shadow: 0 4px 24px rgba(0,0,0,.15);
}

.comic-page .title-cn {
  font-family: "STKaiti", "KaiTi", serif;
  font-size: 48px;
  letter-spacing: 8px;
  margin: 24px 0 8px;
}

.comic-page .title-en {
  font-family: "Playfair Display", "Georgia", serif;
  font-style: italic;
  font-size: 22px;
  color: var(--ink-mid);
  margin-bottom: 32px;
}

.comic-page .seal {
  display: inline-block;
  background: var(--vermillion);
  color: var(--paper);
  padding: 4px 10px;
  font-family: serif;
  font-weight: bold;
  border-radius: 2px;
  vertical-align: middle;
  margin: 0 8px;
}

.comic-page .strip {
  max-width: 720px;
  margin: 40px auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.comic-page .panel {
  background: var(--paper);
  border-bottom: 1px solid var(--ink-light);
  padding: 32px 16px;
}

.comic-page .panel img {
  width: 100%;
  height: auto;
  display: block;
  margin: 0 auto 16px;
  max-width: 600px;
}

.comic-page .narration-cn {
  font-size: 22px;
  line-height: 1.6;
  text-align: center;
  margin: 16px 0 8px;
  letter-spacing: 4px;
}

.comic-page .narration-en {
  font-size: 15px;
  color: var(--ink-mid);
  text-align: center;
  font-style: italic;
  font-family: "Playfair Display", "Georgia", serif;
}

.comic-page .credit {
  text-align: center;
  padding: 40px 16px 60px;
  color: var(--ink-mid);
  font-size: 14px;
}

.comic-page .credit a {
  color: var(--vermillion);
  text-decoration: none;
}
```

- [ ] **Step 2: 提交**

```bash
cd /Users/sky/linux-kernel/ai-doc
mkdir -p docs/comics/_assets
git add docs/comics/_assets/ink-frame.css
git commit -m "feat(comic): ink-frame.css base style"
```

---

### Task 13: 写 Pilot 作品页（index.html）

**Files:**
- Create: `docs/comics/bitter-lesson/index.html`

- [ ] **Step 1: 写完整 HTML**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>苦涩的教训 · The Bitter Lesson — 论文漫画</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="../_assets/ink-frame.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Playfair+Display:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
</head>
<body class="comic-page">

  <section class="cover">
    <img src="assets/cover.png" alt="封面 · 苦涩的教训">
    <h1 class="title-cn">苦澀之教訓 <span class="seal">苦</span></h1>
    <p class="title-en">The Bitter Lesson — after Richard Sutton, 2019</p>
  </section>

  <section class="strip">

    <div class="panel">
      <img src="assets/panel-01.png" alt="Panel 1 · 两条路">
      <p class="narration-cn">路有二。</p>
      <p class="narration-en">Two paths diverge.</p>
    </div>

    <div class="panel">
      <img src="assets/panel-02.png" alt="Panel 2 · 工匠的小楼">
      <p class="narration-cn">匠人刻得細，樓亦精——然，終只能盛一斛水。</p>
      <p class="narration-en">The craftsman carves with precision. Beautiful, but small.</p>
    </div>

    <div class="panel">
      <img src="assets/panel-03.png" alt="Panel 3 · 潮水涌起">
      <p class="narration-cn">然而潮水漲起。</p>
      <p class="narration-en">Then the tide rises.</p>
    </div>

    <div class="panel">
      <img src="assets/panel-04.png" alt="Panel 4 · 象棋大师的叹息">
      <p class="narration-cn">一九九七，深藍勝，大師默然。</p>
      <p class="narration-en">1997: Deep Blue wins. The master falls silent.</p>
    </div>

    <div class="panel">
      <img src="assets/panel-05.png" alt="Panel 5 · 简单者之胜">
      <p class="narration-cn">卷積二字，足矣。舊器，盡棄。</p>
      <p class="narration-en">"Convolution"—two characters suffice. The old tools, discarded.</p>
    </div>

    <div class="panel">
      <img src="assets/panel-06.png" alt="Panel 6 · 观察者的叹息">
      <p class="narration-cn">苦耶？甘耶？<br>七十載，只一字：算。</p>
      <p class="narration-en">Bitter? Sweet? Seventy years, one word: compute.</p>
    </div>

  </section>

  <footer class="credit">
    <p>原文 · <a href="http://www.incompleteideas.net/IncIdeas/BitterLesson.html" target="_blank">The Bitter Lesson</a> by Richard Sutton, 2019</p>
    <p>文本解读 · <a href="../../zh/ai-thinking.html#bitter-lesson">中文详解</a></p>
    <p>返回 · <a href="../">论文漫画集</a> · <a href="../../zh/">AI Doc</a></p>
  </footer>

</body>
</html>
```

- [ ] **Step 2: 本地预览**

```bash
cd /Users/sky/linux-kernel/ai-doc/docs
python3 -m http.server 8000 &
open http://localhost:8000/comics/bitter-lesson/
```

Expected: 页面正确显示封面 + 6 格，图文对齐。

- [ ] **Step 3: 用户审美验收**

> 用户检查：画面好看吗？节奏对吗？文字排版合适吗？有不对就回到 Task 11 重新生成个别格。

- [ ] **Step 4: 提交**

```bash
cd /Users/sky/linux-kernel/ai-doc
git add docs/comics/bitter-lesson/index.html
git commit -m "feat(comic): Bitter Lesson pilot page"
```

---

### Task 14: 写漫画集索引 + 加主站入口

**Files:**
- Create: `docs/comics/index.html`
- Modify: `docs/zh/index.html`（加漫画入口）
- Modify: `docs/en/index.html`（加漫画入口）

- [ ] **Step 1: 写 `docs/comics/index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>论文漫画集 · AI Paper Comics</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="_assets/ink-frame.css">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Playfair+Display:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
  <style>
    .hub { max-width: 1000px; margin: 60px auto; padding: 0 24px; }
    .hub h1 { font-family: "STKaiti", serif; font-size: 44px; letter-spacing: 6px; text-align: center; margin-bottom: 8px; }
    .hub .tagline { text-align: center; color: var(--ink-mid); font-style: italic; margin-bottom: 48px; }
    .hub .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .hub .item { background: var(--paper); border: 1px solid var(--ink-light); padding: 16px; text-decoration: none; color: var(--ink-deep); transition: transform .15s; }
    .hub .item:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,.1); }
    .hub .item img { width: 100%; height: auto; }
    .hub .item h3 { margin: 12px 0 4px; font-family: "STKaiti", serif; }
    .hub .item p { margin: 0; color: var(--ink-mid); font-size: 14px; }
  </style>
</head>
<body class="comic-page">
  <div class="hub">
    <h1>論文漫畫集</h1>
    <p class="tagline">AI Paper Comics — rendered in ink wash</p>

    <div class="grid">
      <a class="item" href="bitter-lesson/">
        <img src="bitter-lesson/assets/cover.png" alt="Bitter Lesson">
        <h3>苦澀之教訓</h3>
        <p>The Bitter Lesson · Sutton, 2019</p>
      </a>
      <!-- 后续论文的卡片在这里追加 -->
    </div>

    <p style="text-align:center; margin-top:60px;">
      <a href="../zh/" style="color:var(--vermillion)">← 返回 AI Doc 主站</a>
    </p>
  </div>
</body>
</html>
```

- [ ] **Step 2: 给 docs/zh/index.html 顶部导航加"漫画"入口**

找到原导航条，在适当位置插入：

```html
<a href="../comics/">漫画版</a>
```

- [ ] **Step 3: 给 docs/en/index.html 顶部导航加入口**

同理插入：

```html
<a href="../comics/">Comics</a>
```

- [ ] **Step 4: 本地预览确认**

```bash
cd /Users/sky/linux-kernel/ai-doc/docs
python3 -m http.server 8000 &
open http://localhost:8000/comics/
open http://localhost:8000/zh/
```

Expected: 漫画集索引页显示 Bitter Lesson 卡片。主站顶部有"漫画版"入口，可跳转。

- [ ] **Step 5: 用户 UI 验收**

> 用户打开两个页面，确认跳转正常、视觉和谐。

- [ ] **Step 6: 提交 + 推送**

```bash
cd /Users/sky/linux-kernel/ai-doc
git add docs/comics/index.html docs/zh/index.html docs/en/index.html
git commit -m "feat(comic): comic hub index + main site entry"
git push origin main
```

Expected: 推送成功。几分钟后 GitHub Pages 重建，`https://<username>.github.io/ai-doc/comics/bitter-lesson/` 可访问。

---

## Self-Review 清单（plan 写完自查）

- [x] Spec §1 目标 → Task 9-13 产出 Pilot 作品
- [x] Spec §2 核心决策（拟人化/水墨/格式/流水线）→ Task 9 character bible + Task 10 storyboard
- [x] Spec §3 格式选配表 → Task 10 选了 ①+② 组合
- [x] Spec §4 人物设定 → Task 9
- [x] Spec §5 色板/构图/文字规范 → Task 12 ink-frame.css + Task 10 prompt
- [x] Spec §6 流水线 → Part A+B（Tasks 1-8）
- [x] Spec §7 Pilot Bitter Lesson → Part C（Tasks 9-13）
- [x] Spec §8 发布集成 → Task 14
- [x] Spec §9 非目标：Qwen-Image + Kontext 推迟 → 本 plan 不包含 ✓
- [x] Spec §10 风险：Python 3.14 冲突 → Task 1 用 3.12 venv ✓
- [x] Spec §10 风险：AI 画人脸崩 → Task 10 分镜主动用背影/斗笠 ✓
- [x] 所有步骤有具体命令、文件路径、代码，无 TBD/TODO

**未覆盖但已知**：
- ComfyUI MCP 完整安装指南（artokun repo README 即可，不复制进来）
- Qwen-Image 集成（推迟到 v2 plan）
- 角色一致性精细化（推迟到 v2 plan）

---

## 完成 Pilot 后的下一步（留到 v2 plan）

1. Qwen-Image 集成 → 替换文字层（当前 HTML/CSS 伪造，v2 做真·毛笔书法入画）
2. FLUX.1 Kontext-dev → 跨篇论文角色一致性（老观察者、工匠派等反复出场）
3. 第 2-5 篇论文铺量（Scaling Laws, Chinchilla, First Principles, Attention）
4. 自动化脚本：从 `ai-thinking/*.md` 生成初版 storyboard 草稿
