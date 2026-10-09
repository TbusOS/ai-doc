# 维护手册 / Maintenance

> How to pick this repo up on any machine and keep working: where the current
> state is written down, how to set up the tools, the daily commands, how
> illustrations and GIF / MP4 exports are made, how to publish, and what to
> write down before you stop. The manual is in Chinese; commands are universal.

这份手册让任何一台电脑 clone 下来就能接着做。**电脑上的 Claude Code 记忆不随仓库走**，
所以要紧的决定、进度、踩过的坑都写进仓库里的文档，不能只留在某台机器的记忆里。

---

## 0. 接手第一步：先看这几处

| 看什么 | 在哪 | 回答什么问题 |
|---|---|---|
| 进行中的方向和当前状态 | [`ROADMAP.md`](ROADMAP.md) | 现在做到哪、下一步做什么、在哪个分支 |
| 设计稿 | [`docs/superpowers/specs/`](docs/superpowers/specs/) | 为什么这样做、已经定下的决定 |
| 当前阶段的计划 | [`docs/superpowers/plans/`](docs/superpowers/plans/)(索引见 [`docs/superpowers/README.md`](docs/superpowers/README.md)) | 还剩哪些任务 |
| 做图解的完整流程和规矩 | [`.claude/skills/paper-explainer/SKILL.md`](.claude/skills/paper-explainer/SKILL.md) | 每一步怎么做、踩过哪些坑。Claude Code 在本仓库里会自动加载它 |
| 最近做了什么 | `git log --oneline -20` | 每个提交的说明里写了原因和实测数字 |

## 1. 分支

- `main`:GitHub Pages 的发布源(`main` 分支的 `/docs` 目录)。**合并进 `main`、推 `main` 之前要先问 user。**
- 功能分支:当前在做的是哪条,写在 `ROADMAP.md` 对应条目的「状态」里。功能分支随时可以推,方便换电脑接着做。

## 2. 新电脑搭环境

```bash
git clone git@github.com:TbusOS/ai-doc.git && cd ai-doc
git switch <ROADMAP 里写的功能分支>

# Python 3.14 + 固定版本的包。markdown 版本不同,原文页就会渲染得不一样
uv venv --python 3.14 .venv
uv pip install --python .venv/bin/python -r tools/requirements.txt
#   没有 uv:python3.14 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt

# Node 20 以上;浏览器测试和导出 GIF / MP4 要用 Playwright
(cd tools && npm install && npx playwright install chromium)

bash tools/check_all.sh        # 要看到 ALL CHECKS PASSED
```

**判断环境对不对,最快的办法**:跑完三个构建脚本后 `git status` 应该是干净的,
也就是本机生成的 HTML 跟仓库里逐字节一致。不一致多半是 Python 包的版本不对。

可选的两项,缺了 `check_all.sh` 会显示 `SKIP`(SKIP 不等于通过,交付前要在装齐的机器上跑一次):

| 检查 | 需要什么 |
|---|---|
| 页面客观缺陷(JS 报错、对比度、手机横向滚动、图里字太小) | clone [sky-skills](https://github.com/TbusOS/sky-skills) 到 `~/linux-kernel/github/sky-skills` 或 `~/claude-tools/sky-skills`,或者设环境变量 `SKY_SKILLS` |
| 中文文案的禁用词、自造简称 | 维护者本机的私有词表(tech-writing-gate),不在本仓库 |

出图还需要装好并登录 [Codex CLI](https://github.com/openai/codex),见第 5 节。

## 3. 常用命令

| 做什么 | 命令 |
|---|---|
| 生成全部页面 | `python3 docs/scripts/build.py && python3 docs/scripts/explain_build.py && python3 docs/scripts/home_v2.py` |
| 全部检查 | `bash tools/check_all.sh`(自己会找 `.venv`、`tools/node_modules`、sky-skills) |
| 只生成某几个场景的预览页 | `python3 docs/scripts/explain_build.py --slug autoresearch --only intro,loop --out autoresearch--x`(文件名带 `--`,不进 git) |
| 只测预览页 | `PAGE=docs/zh/explain/autoresearch--x.html node --test tools/tests/browser.test.mjs` |
| 核对「原文」引用 | `python3 tools/check_sources.py explain-src/autoresearch [--scene <id>]` |
| 中文标点 | `python3 tools/fix_cjk_punct.py --check <文案 json>`(只对文案跑,不能对代码跑) |
| 原文页正文没变 | `python3 tools/check_articles_unchanged.py check`;**有意改了原文**才跑 `snapshot` |
| 站内链接没断 | `python3 tools/check_links.py`(页面、图片、`#锚点`;指到 `docs/` 外面的也算断,Pages 只发布 `docs/`) |
| 本地看 | `python3 -m http.server 8080 --directory docs`,打开 `http://localhost:8080/zh/explain/autoresearch.html` |

## 4. 做一篇新图解(摘要;细则以 skill 为准)

1. 原始材料(论文、代码、作者的图)复制进 `explain-src/<slug>/sources/`,`SOURCE.txt` 写版本、日期、许可。
2. **先定这篇的设计风格**,每篇一种,写进设计稿。全站固定的只有读者认路要用的东西:
   出处标记、播放控制条、五问章节导航、减少动态效果 / 关掉 JS 时的表现、颜色的意思(绿 = 保留、灰 = 丢弃、红 = 崩溃、橙 = 重点)。
3. 按「技术解释五问」排场景;先做 1~2 个场景当样张,给 user 看过再做完。
4. 文案只写在 `explain-src/<slug>/zh.json` 和 `scenes/<id>.json`。关键说法进 `claims`,标「原文」(逐字引用,脚本核对)、「解读」(写明依据)或「示意」(假设的数字)。
5. 每个场景两个代码文件:`docs/assets/explain/<slug>/<widget>-model.js`(纯函数 `stateAt(t)`)和 `<widget>.js`(只管画),外加 `tools/tests/<widget>-model.test.js`。
6. `check_all.sh` 全过 → 找一个没参与制作的 reviewer 对照原文审文案 → 修完再跑一遍。
7. 自己当审美把关人:每个场景都截图看过浅色、深色、手机竖屏,不好看就改,检查脚本只查客观缺陷,不判好不好看。

## 5. 出图(插画)

```bash
mkdir -p /tmp/illo && cd /tmp/illo
codex exec -m gpt-6-astra -C /tmp/illo --skip-git-repo-check -s workspace-write \
  -i <画风参考图.png> [-i <同一套里已定稿的图.png>] \
  "The attached image is a STYLE REFERENCE only ... Use your image generation tool to create ONE ... Save the PNG ..."
```

- 画风靠参考图定,提示词里写明「只学画法,不抄内容」;同一套图再附上已定稿的第一张,保证前后一致。
- 图里不放任何文字,文字由网页叠加。
- 深色模式**另出一张夜间版**(附亮色版当构图参考)。把亮色图反相试过,夜空变成白天、屏幕变暗褐色,意思全反了。
- 网页要在图上叠东西时,量出那块区域的像素位置,写进记录里。
- 提示词原文、模型名、日期、参考图出处写进 `explain-src/<slug>/illustrations/<name>.md`(范例:`intro-night.md`);成品转 WebP(Pillow,质量 80)放 `docs/assets/explain/<slug>/`。
- GPT 出图不能按种子复现,所以记录里要写清楚是从哪几轮里挑的、为什么选这张。

## 6. 导出 GIF / MP4(给站外用)

```bash
node tools/export_scene.mjs --scenes intro,loop,vocab,progress --out <目录> [--theme dark] [--reel <目录>/reel.mp4]
python3 tools/check_exports.py <目录>      # GIF ≤ 4 MB、MP4 ≤ 15 MB、首尾帧不是空白、画面在动
```

导出是逐帧调用场景的 `seek(t)` 再截图,不是录屏,所以每次导出的结果都一样。ffmpeg 用 `tools/requirements.txt` 里 imageio-ffmpeg 自带的那个,不需要 root。

### 配音短片

```bash
.venv/bin/python tools/reel/build.py explain-src/autoresearch/reel.json   # 约 13 分钟,写到 reel.json 里的 out
python3 tools/check_exports.py docs/assets/explain/autoresearch/media/
```

- `reel.json`:每个镜头播场景的一段(`from` → `to`,场景里的秒数),讲解词没念完就停在最后一帧,镜头慢慢推近 5%。
  `t` 是字幕,`say` 是念出来的写法(`train.py` 念「train 点 py」,`bpb` 念「b p b」)。
  数字和说法只取场景字幕里已经核对过原文的那些。
- 配音用 edge-tts(微软的在线语音,要联网,走 `HTTPS_PROXY`),声音 `zh-CN-XiaoyiNeural`,语速 +10%。
  念过的句子缓存在 `tools/.tts-cache/`,改一句只重念那一句。
- 音乐和音效由 `tools/reel/sound.py` 用 numpy 合成,不用外部素材;音效的时刻由 `tools/reel/scene_events.mjs`
  从场景模型的状态变化算出来,所以跟画面对得上。
- 推近不会切掉图里的字:`record.mjs` 按场景量出所有文字占的范围,推近的倍数和中心都限制在让这块范围
  留在画面里(离边 12 像素);每帧截图前再查一次,有字被切就整次生成失败。
- 生成完脚本自己检查:时长与计划一致、响度约 -16 LUFS、峰值 ≤ -1 dBFS、说话时音乐至少压低 6 dB。
  好不好听脚本判断不了:换了声音、音乐或音效,要人听过再上线。
- 网站上的 `autoresearch-reel.mp4` 是配音版。`export_scene.mjs --reel` 出的是无声版,不要写到这个路径。

## 7. 发布到 GitHub Pages

1. 三个构建脚本都跑,生成的 HTML 一起提交;新图解要能从首页和对应原文页点进去。
2. 推公开仓库之前做脱敏扫描:用维护者本机的私有外发清单(不在本仓库)扫改动的文件和 commit message,
   再查有没有本机用户目录的绝对路径(macOS 和 Linux 两种写法)。都 0 命中才推。commit 里不加 AI 署名。
3. 合并 `main` 并推送前问 user。
4. 推完查 `gh api repos/TbusOS/ai-doc/pages/builds/latest` 的状态是 `built`,再打开线上页面
   (http://doc.tbusos.com/ai-doc/)看有没有报错。

## 8. 停手或换电脑之前

- 把 `ROADMAP.md` 对应条目的「状态」行改成现在的样子:日期、做到哪、在哪个分支、下一步。
- 计划里的勾选框跟实际一致。
- 提交并推送功能分支。没推的东西,别的电脑看不到。
- 这一轮新定的规矩写进 skill 或设计稿,新踩的坑写进 skill 的「踩过的坑」表和本手册第 9 节。

## 9. 踩过的环境坑

| 现象 | 原因 | 办法 |
|---|---|---|
| 原文页的配图和原文之间的互相链接,线上全是 404(2026-10-09 查出 84 张图 + 520 条链接) | 原文 Markdown 里的相对链接是按「在 GitHub 上看仓库」写的(`react.md`、`images/x1.png`);Pages 只发布 `docs/`,原文页又都放在同一个 `articles/` 目录 | 已处理:`build.py` 生成时用 `site_link()` 改写链接、把图片复制到 `docs/assets/articles/`;`tools/check_links.py` 把关,已进 `check_all.sh` |
| 构建后 42 个原文页全变了,原文不变检查失败 | 系统自带的 markdown 3.1.1 跟仓库用的 3.10.2 渲染结果不同 | 用 `.venv` 和 `tools/requirements.txt` 的固定版本 |
| 导出 MP4 时 ffmpeg 报 `Invalid argument` | 舞台是 1200×675,高是奇数,H.264 的 yuv420p 要求宽高都是偶数 | 导出脚本已裁掉最后一行像素 |
| 浏览器测试显示 SKIP | 找不到 Playwright | `cd tools && npm install && npx playwright install chromium` |
| 浏览器测试、导出、`check_objective` 全部 `page.goto: Timeout 30000ms` | 机器靠代理上外网,Playwright 启动的 Chromium 不读 `HTTPS_PROXY`,直连 Google Fonts 一直挂着;代理慢时一页也要 24–55 s(2026-10-09 实测) | 已处理:`tools/net.mjs` 把代理传给 Chromium,字体缓存在 `tools/.font-cache/`;sky-skills 那边是 `design-review/scripts/_net.mjs`,缓存在 `~/.cache/sky-skills/fonts`。第一次慢,之后不再下载 |
| 单元测试在场景多了以后才失败 | 旧测试按「只有一个场景」写:只看第一个文字版、在文案里搜到了 `progress.js` | 已改;新测试要按多场景写 |
| 深色模式下插画刺眼或意思反了 | 亮色插画直接放在深色页面上;反相会把夜空变成白天 | 另出夜间版,按主题切换 |
