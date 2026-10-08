# intro-night — 开场插画

- 用在:场景 `intro`(开场)的背景
- 成品:`docs/assets/explain/autoresearch/intro-night.webp`(1672×941,WebP 质量 80,105 KB)
- 出处标记:**示意**。小机器人是比喻,真实的 AI 是电脑里跑的程序。
- 生成:2026-10-09,Codex CLI 0.159.2,`codex exec -m gpt-6-astra`,调用 Codex 自带的出图工具
- 屏幕位置(原图像素):x 1295–1481,y 429–545;屏幕底色约 `#FEB359`。网页在这块上面叠动画。

## 参考图

1. 画风参考:[srt-whiteboard-animation](https://github.com/geeklee/srt-whiteboard-animation)(MIT)
   commit `696a724` 的 `examples/scene-01-monkey-mountain.png`。只学画法,不用内容。
2. 构图参考:同一提示词上一轮的草稿(不入库)。

## 怎么选出来的

| 轮次 | 改了什么 | 结果 |
|---|---|---|
| 1 | 不给参考图 | 线条干净但偏冷,像图标 |
| 2 | 加画风参考图 | 铅笔质感对了;被子是蓝色,跟窗外的夜抢眼 |
| 3a | 被子改米白,屏幕留成纯色 | 好,但「谁在干活」要靠读者自己想 |
| 3b(选用) | 3a + 书桌前一个小机器人在敲键盘 | 一眼看懂「人睡了,有个东西在替他干活」 |

GPT 出图不能按种子复现;要重做时用下面的提示词 + 两张参考图,结果会相近但不会一模一样。

## 提示词(3b,原文)

```
Attached image 1 is the STYLE REFERENCE (drawing technique only: soft graphite pencil lines with slight texture, warm cream paper, sparse coloured-pencil fills, friendly rounded figures, lots of empty paper). Attached image 2 is the previous draft of THIS illustration; keep its composition and room layout. Do not copy any content from image 1.

Use your image generation tool to create ONE wide 16:9 illustration:
- A bedroom at night. Left third: a person asleep in a bed, peaceful face; the blanket is cream / very light warm grey (NOT blue). A small bedside lamp, switched off.
- Centre top: a window with curtains; through it a deep-blue night sky, crescent moon, a few stars. This window is the ONLY cool / blue area in the picture.
- Right side: a desk with one desktop monitor facing the viewer almost straight on; its screen is a flat, evenly lit warm-orange rectangle with NOTHING drawn on it (the web page will draw on top of it later). A small potted plant with green leaves. A few short pencil marks around the monitor suggest it is busy.
- Keep the top band of the image (about 18 %) as plain empty paper.
- Colour budget: cream paper, graphite lines, blue only in the window, orange only on the screen, a little green on the plant, light wood tones for furniture.
- Absolutely no text, letters, digits, logos, UI or watermark anywhere.
- On the desk chair sits a small, round, friendly robot (about the size of a child, simple dome head, two dot eyes, no mouth text), seen from a three-quarter back view, typing on the keyboard with both hands while looking at the screen. It is drawn in the same pencil style, light grey with a touch of orange where the screen light falls on it.
Save the PNG in the current directory as intro-v3b.png and reply with only its path and pixel size.
```
