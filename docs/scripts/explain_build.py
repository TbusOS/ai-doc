#!/usr/bin/env python3
"""Render explainer pages from explain-src/<slug>/zh.json.

    python3 docs/scripts/explain_build.py        # writes docs/zh/explain/<slug>.html

All copy is written into the HTML at build time, so the page reads in full
without JavaScript. The animation code lives in docs/assets/explain/ and reads
the same zh.json, embedded as <script type="application/json" id="explain-data">.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from site_v2 import esc, footer, head, header  # noqa: E402

REPO = Path(__file__).resolve().parent.parent.parent
SRC = REPO / "explain-src"
OUT = REPO / "docs" / "zh" / "explain"

TAG_CLASS = {"原文": "tag--orig", "解读": "tag--interp", "示意": "tag--illus"}


def render_claim(c: dict) -> str:
    tag = c["tag"]
    if tag == "原文":
        body = (
            f'<blockquote lang="en">{esc(c["quote"])}</blockquote>'
            f'<p class="claim-src">出处：{esc(c["source"])}（karpathy/autoresearch 原文）</p>'
        )
    elif tag == "解读":
        body = f'<p class="claim-src">依据：{esc(c["basis"])}</p>'
    else:
        body = '<p class="claim-src">演示用的假设数字，不是实验数据。</p>'
    return (
        f'<li><details class="claim"><summary><span class="tag {TAG_CLASS[tag]}">{tag}</span>'
        f'<span>{esc(c["text"])}</span></summary><div class="claim-body">{body}</div></details></li>'
    )


def render_toggle(scene: dict) -> str:
    t = scene.get("toggle")
    if not t:
        return ""
    box_id = f'opt-{scene["id"]}-{t["option"]}'
    return (
        f'<div class="ex-toggle"><input type="checkbox" id="{box_id}" data-option="{esc(t["option"])}">'
        f'<label for="{box_id}"><span class="tag {TAG_CLASS[t["tag"]]}">{esc(t["tag"])}</span> {esc(t["label"])}'
        f'<span class="toggle-note">{esc(t["note"])}</span></label></div>'
    )


def _fill(template: str) -> str:
    return template.replace("{bpb}", "这轮的分数").replace("{best}", "目前最好的分数")


def render_transcript(scene: dict) -> str:
    """Text version of the animation: shown when JS is off, and for screen readers."""
    items = []
    special = scene.get("special", {})
    if special.get("intro"):
        items.append(esc(special["intro"]))
    for key, st in scene.get("stations", {}).items():
        line = f'<b>{esc(st["label"])}</b>：{esc(st["caption"])}'
        if key == "edit" and special.get("edit_baseline"):
            line += f'<br>第一轮：{esc(special["edit_baseline"])}'
        if key == "read" and special.get("read_crash"):
            line += f'<br>崩溃时：{esc(special["read_crash"])}'
        if key == "decide":
            line += "".join(f"<br>{esc(_fill(v))}" for v in scene.get("verdicts", {}).values())
        if key == "git":
            line += "".join(f"<br>{esc(_fill(v))}" for v in scene.get("actions", {}).values())
        items.append(line)
    for key in ("outro", "outro_noreset"):
        if special.get(key):
            items.append(esc(special[key]))
    if not items:
        return ""
    lis = "".join(f"<li>{i}</li>" for i in items)
    return f'<details class="stage-transcript" open><summary>动画的文字版</summary><ol>{lis}</ol></details>'


def render_scene(scene: dict, original_page: str) -> str:
    body = "".join(f"<p>{esc(p)}</p>" for p in scene["body"])
    claims = "".join(render_claim(c) for c in scene["claims"])
    first_caption = scene.get("special", {}).get("intro", "")
    return f"""<section class="scene" id="scene-{scene["id"]}" data-scene="{scene["id"]}" data-widget="{scene["widget"]}">
  <div class="scene-text rise">
    <h2>{esc(scene["title"])}</h2>
    <p class="lead">{esc(scene["lead"])}</p>
    {body}
  </div>
  <figure class="stage grid-paper">
    <svg class="stage-svg" viewBox="0 0 1200 675" role="img" aria-label="{esc(scene["stage_label"])}"></svg>
    <figcaption class="stage-caption" aria-live="polite">{esc(first_caption)}</figcaption>
  </figure>
  {render_transcript(scene)}
  <div class="stage-controls" role="group" aria-label="动画控制">
    <button class="play" type="button" aria-label="播放">▶</button>
    <button class="prev" type="button" aria-label="上一步">‹ 上一步</button>
    <button class="next" type="button" aria-label="下一步">下一步 ›</button>
    <input class="scrub" type="range" min="0" max="1000" value="0" aria-label="进度">
    <button class="speed" type="button" aria-label="播放速度">1×</button>
    <span class="clock" aria-hidden="true"></span>
  </div>
  {render_toggle(scene)}
  <p class="claims-title">这一节关键说法的出处（点开看原句）</p>
  <ul class="claims">{claims}</ul>
  <a class="to-original" href="{esc(original_page)}#{esc(scene["original_anchor"])}">对照原文这一节 →</a>
</section>
"""


def render_chapter_nav(data: dict) -> str:
    used = {sc["chapter"] for sc in data["scenes"]}
    items = []
    for ch in data["chapters"]:
        inner = f'<span class="num">{esc(ch["num"])}</span>{esc(ch["title"])}'
        if ch["id"] in used:
            items.append(f'<li><a href="#ch-{ch["id"]}">{inner}</a></li>')
        else:
            items.append(f'<li><span aria-disabled="true">{inner} <small>制作中</small></span></li>')
    return f'<ol class="ex-chapters" aria-label="五个问题">{"".join(items)}</ol>'


def render_explain(data: dict, prefix: str = "../../") -> str:
    paper = data["paper"]
    original = paper["original_page"]
    chapters_html = []
    for ch in data["chapters"]:
        scenes = [sc for sc in data["scenes"] if sc["chapter"] == ch["id"]]
        if not scenes:
            continue
        chapters_html.append(
            f'<section class="chapter" id="ch-{ch["id"]}"><div class="wrap">'
            f'<div class="chapter-head"><span class="chapter-num">{esc(ch["num"])}</span>'
            f'<span class="chapter-title">{esc(ch["title"])}</span></div>'
            + "".join(render_scene(sc, original) for sc in scenes)
            + "</div></section>"
        )
    note = f'<p class="note">{esc(data["sample_note"])}</p>' if data.get("sample_note") else ""
    widgets = sorted({sc["widget"] for sc in data["scenes"]})
    widget_scripts = "".join(
        f'<script src="{prefix}assets/explain/{data["slug"]}/{w}-model.js"></script>\n'
        f'<script src="{prefix}assets/explain/{data["slug"]}/{w}.js"></script>\n'
        for w in widgets
    )
    blob = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    extra_css = f'<link rel="stylesheet" href="{prefix}assets/explain/explain.css">\n'
    title = f'{data["title"]} · {paper["title"]} 图解 — AI Doc'
    return (
        head(title, prefix, data["lead"], extra_css)
        + "<body>\n"
        + header(prefix, view={"explain": f'{data["slug"]}.html', "original": original, "current": "explain"})
        + f"""<main>
<section class="ex-hero">
  <div class="wrap">
    <span class="kicker">{esc(data["kicker"])}</span>
    <h1>{esc(data["title"])}</h1>
    <p class="lead">{esc(data["lead"])}</p>
    <div class="ex-meta">
      <span>{esc(paper["title"])} · {esc(paper["author"])} · {esc(paper["date"])}</span>
      <span>约 {data["reading_minutes"]} 分钟</span>
      <a href="{esc(original)}">读原文 →</a>
      <a href="{esc(paper["repo"])}">GitHub 仓库 →</a>
    </div>
    {note}
    {render_chapter_nav(data)}
  </div>
</section>
{"".join(chapters_html)}
</main>
"""
        + footer(prefix)
        + f'<script type="application/json" id="explain-data">{blob}</script>\n'
        + f'<script src="{prefix}assets/explain/timeline.js"></script>\n'
        + f'<script src="{prefix}assets/explain/engine.js"></script>\n'
        + f'<script src="{prefix}assets/explain/draw.js"></script>\n'
        + widget_scripts
        + "</body>\n</html>\n"
    )


def build_all() -> list[Path]:
    written = []
    for src in sorted(SRC.glob("*/zh.json")):
        data = json.loads(src.read_text(encoding="utf-8"))
        out = OUT / f'{data["slug"]}.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render_explain(data), encoding="utf-8")
        written.append(out)
        print(f"  wrote {out.relative_to(REPO)}")
    return written


if __name__ == "__main__":
    build_all()
