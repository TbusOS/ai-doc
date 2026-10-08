# intro-night — 开场插画

- 用在:场景 `intro`(开场)的背景
- 成品:`docs/assets/explain/autoresearch/intro-night.webp`(1672×941,WebP 质量 80,105 KB)
- 出处标记:**示意**。小机器人是比喻,真实的 AI 是电脑里跑的程序。
- 生成:2026-10-09,Codex CLI 0.159.2,`codex exec -m gpt-6-astra`,调用 Codex 自带的出图工具
- 深色模式用另一张:`docs/assets/explain/autoresearch/intro-night-dark.webp`(同尺寸),由下面「夜间版」提示词生成,附亮色版当构图参考。
- 早上(场景最后一站)渐变到早晨版:`intro-morning.webp`(亮色)、`intro-morning-dark.webp`(深色),提示词见文末。
- 屏幕位置(原图像素):四张图都在 x 1295–1481、y 428–545 之内,彼此差不超过 2 像素;亮色版底色约 `#FEB359`。网页在这块上面叠动画。

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
| 夜间版 | 以 3b 为构图参考,关灯、深色纸、屏幕是唯一光源 | 用于深色模式。试过把亮色版直接反相:夜空变成白天的浅蓝、头发变白、屏幕变暗褐色,意思全反了,弃用 |

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

## 提示词(夜间版,原文;附图 = 3b 成品)

```
The attached image is the light version of an illustration. Use your image generation tool to create its NIGHT / DARK-MODE version: the exact same drawing, same composition, same objects in the same positions and sizes (bed, sleeping person, bedside table and lamp, rug and slippers, window with curtains, desk, chair, small robot typing, monitor, plant). Only the lighting and palette change:
- The room lights are off. Background becomes a deep navy-ink paper (around #141a26) with the same subtle pencil texture.
- Lines become soft light-grey chalk / pencil lines.
- The monitor screen keeps exactly the same position and size and stays a flat, evenly lit warm-orange rectangle with nothing drawn on it; it is the main light source and casts a soft warm glow on the robot, the desk and the nearby wall.
- Through the window: deep-blue night sky, a pale crescent moon and stars; faint cool moonlight on the bed.
- The sleeping person and robot keep their friendly faces; furniture in muted dark wood tones; plant leaves dark green.
- Top band of the image (about 18 %) stays plain dark paper.
- Absolutely no text, letters, digits, logos, UI or watermark.
Save the PNG in the current directory as intro-dark.png and reply with only its path and pixel size.
```

## 提示词(早晨版,原文)

亮色版附图:画风参考图 + 3b 成品;深色版附图:夜间版成品。两张共用下面这段要求:

```
- Same composition, same objects in the same positions and sizes: bed, bedside table and lamp (off), rug and slippers, window with curtains, desk, chair, robot, monitor, plant.
- It is now early morning. Through the window: a pale morning sky with a soft sunrise (warm yellow and pink near the horizon), no moon, no stars.
- The person is now sitting up in bed, arms stretched up in a big yawn-stretch, sleepy happy face; blanket around the waist.
- The small robot is still on the chair but has turned its head and upper body toward the person and raises one hand in a small friendly wave.
- The monitor screen keeps EXACTLY the same position and size and stays a flat, evenly lit warm-orange rectangle with nothing drawn on it.
- Keep the top band of the image (about 18 %) plain.
- Absolutely no text, letters, digits, logos, UI or watermark anywhere.
```

亮色版开头:`Attached image 1 is the STYLE REFERENCE (drawing technique only). Attached image 2 is the NIGHT version of this illustration; draw its MORNING version in exactly the same pencil style, warm cream paper, light coloured-pencil fills.`

深色版开头:`The attached image is the dark-mode NIGHT version of an illustration (deep navy-ink paper, soft light-grey chalk/pencil lines). Draw its DAWN version in exactly the same dark-mode style and palette: the room is still dim, but the first light of dawn comes through the window and falls softly into the room.`
