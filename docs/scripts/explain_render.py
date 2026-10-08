"""HTML pieces of an explainer page: claims, controls, transcript, scenes.

Every piece of copy is written into the HTML here, so the page reads in full
without JavaScript. explain_build.py assembles the pieces into a page.
"""

from __future__ import annotations

from site_v2 import esc

TAG_CLASS = {"原文": "tag--orig", "解读": "tag--interp", "示意": "tag--illus"}


def render_claim(c: dict, source_label: str) -> str:
    tag = c["tag"]
    if tag == "原文":
        body = (
            f'<blockquote lang="en">{esc(c["quote"])}</blockquote>'
            f'<p class="claim-src">出处：{esc(c["source"])}（{esc(source_label)}）</p>'
        )
    elif tag == "解读":
        body = f'<p class="claim-src">依据：{esc(c["basis"])}</p>'
    else:
        body = '<p class="claim-src">演示用的假设数字，不是实验数据。</p>'
    return (
        f'<li><details class="claim"><summary><span class="tag {TAG_CLASS[tag]}">{tag}</span>'
        f'<span>{esc(c["text"])}</span></summary><div class="claim-body">{body}</div></details></li>'
    )


def _tag_chip(ctrl: dict) -> str:
    tag = ctrl.get("tag")
    return f'<span class="tag {TAG_CLASS[tag]}">{esc(tag)}</span> ' if tag else ""


def render_control(scene_id: str, ctrl: dict) -> str:
    kind, opt = ctrl["type"], ctrl["option"]
    cid = f"opt-{scene_id}-{opt}"
    note = f'<span class="toggle-note">{esc(ctrl["note"])}</span>' if ctrl.get("note") else ""
    if kind == "toggle":
        return (
            f'<div class="ex-toggle"><input type="checkbox" id="{cid}" data-option="{esc(opt)}">'
            f'<label for="{cid}">{_tag_chip(ctrl)}{esc(ctrl["label"])}{note}</label></div>'
        )
    if kind == "slider":
        unit = esc(ctrl.get("unit", ""))
        return (
            f'<div class="ex-slider"><label for="{cid}">{_tag_chip(ctrl)}{esc(ctrl["label"])}</label>'
            f'<input type="range" id="{cid}" data-option="{esc(opt)}" min="{ctrl["min"]}" max="{ctrl["max"]}" '
            f'step="{ctrl.get("step", 1)}" value="{ctrl["value"]}">'
            f'<output data-for="{esc(opt)}">{ctrl["value"]}</output><span class="unit">{unit}</span>{note}</div>'
        )
    if kind == "choice":
        buttons = "".join(
            f'<button type="button" data-option="{esc(opt)}" data-value="{esc(str(ch["value"]))}" '
            f'aria-pressed="{"true" if str(ch["value"]) == str(ctrl.get("value")) else "false"}">{esc(ch["label"])}</button>'
            for ch in ctrl["choices"]
        )
        return (
            f'<div class="ex-choice" role="group" aria-label="{esc(ctrl["label"])}">'
            f'<span class="choice-label">{_tag_chip(ctrl)}{esc(ctrl["label"])}</span>{buttons}{note}</div>'
        )
    raise ValueError(f"unknown control type {kind!r} in scene {scene_id}")


def scene_controls(scene: dict) -> list[dict]:
    if scene.get("controls"):
        return scene["controls"]
    if scene.get("toggle"):  # older single-toggle form
        return [dict(scene["toggle"], type="toggle")]
    return []


def _fill(template: str) -> str:
    return template.replace("{bpb}", "这轮的分数").replace("{best}", "目前最好的分数")


def transcript_items(scene: dict) -> list[str]:
    """Plain-text version of an animation: the scene's own `transcript`, or one built from `stations`."""
    if scene.get("transcript"):
        return [esc(t) for t in scene["transcript"]]
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
    return items


def render_transcript(scene: dict) -> str:
    items = transcript_items(scene)
    if not items:
        return ""
    lis = "".join(f"<li>{i}</li>" for i in items)
    return f'<details class="stage-transcript" open><summary>动画的文字版</summary><ol>{lis}</ol></details>'


def _scene_text(scene: dict) -> str:
    body = "".join(f"<p>{esc(p)}</p>" for p in scene.get("body", []))
    return (
        f'<div class="scene-text rise"><h2>{esc(scene["title"])}</h2>'
        f'<p class="lead">{esc(scene["lead"])}</p>{body}</div>'
    )


def _claims_block(scene: dict, source_label: str) -> str:
    if not scene.get("claims"):
        return ""
    claims = "".join(render_claim(c, source_label) for c in scene["claims"])
    return f'<p class="claims-title">这一节关键说法的出处（点开看原句）</p><ul class="claims">{claims}</ul>'


def _to_original(scene: dict, original_page: str) -> str:
    if not scene.get("original_anchor"):
        return ""
    return f'<a class="to-original" href="{esc(original_page)}#{esc(scene["original_anchor"])}">对照原文这一节 →</a>'


def render_widget_scene(scene: dict, original_page: str, source_label: str) -> str:
    controls = "".join(render_control(scene["id"], c) for c in scene_controls(scene))
    first_caption = scene.get("first_caption") or scene.get("special", {}).get("intro", "")
    return f"""<section class="scene" id="scene-{scene["id"]}" data-scene="{scene["id"]}" data-widget="{scene["widget"]}">
  {_scene_text(scene)}
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
  {controls}
  {_claims_block(scene, source_label)}
  {_to_original(scene, original_page)}
</section>
"""


def _inline_code(text: str) -> str:
    """Escape, then show `backtick` spans as <code> (the quote itself stays verbatim in the data)."""
    parts = esc(text).split("`")
    return "".join(f"<code>{part}</code>" if i % 2 else part for i, part in enumerate(parts))


def _annotated_quote(pair: dict) -> str:
    html = _inline_code(pair["quote"])
    mark = pair.get("mark")
    if mark:
        target = esc(mark)
        if target not in html:
            raise ValueError(f'annotated: mark "{mark}" not found in quote "{pair["quote"][:40]}"')
        html = html.replace(target, f"<mark>{target}</mark>", 1)
    return html


def render_annotated_scene(scene: dict, original_page: str, source_label: str) -> str:
    rows, group = [], None
    for p in scene["pairs"]:
        if p.get("group") and p["group"] != group:
            group = p["group"]
            zh = f' <span class="ann-group-zh">{esc(p["group_zh"])}</span>' if p.get("group_zh") else ""
            rows.append(f'<h3 class="ann-group"><span class="ann-md">## {esc(group)}</span>{zh}</h3>')
        rows.append(
            f'<div class="ann-row"><blockquote lang="en">{_annotated_quote(p)}</blockquote>'
            f'<p class="ann-note">{esc(p["note"])}</p></div>'
        )
    rows = "".join(rows)
    return f"""<section class="scene scene--static" id="scene-{scene["id"]}" data-scene="{scene["id"]}">
  {_scene_text(scene)}
  <div class="annotated">{rows}</div>
  {_claims_block(scene, source_label)}
  {_to_original(scene, original_page)}
</section>
"""


def render_quiz_scene(scene: dict, original_page: str, source_label: str) -> str:
    qs = []
    for qi, q in enumerate(scene["questions"]):
        name = f'{scene["id"]}-q{qi}'
        opts = "".join(
            f'<label class="quiz-opt"><input type="radio" name="{name}" value="{oi}"'
            f'{" data-correct" if oi == q["answer"] else ""}> <span>{esc(o)}</span></label>'
            for oi, o in enumerate(q["options"])
        )
        qs.append(
            f'<fieldset class="quiz-q"><legend>{qi + 1}. {esc(q["q"])}</legend>{opts}'
            f'<details class="quiz-explain"><summary>看答案</summary>'
            f'<p><b>{esc(q["options"][q["answer"]])}</b>。{esc(q["explain"])}</p></details></fieldset>'
        )
    return f"""<section class="scene scene--static" id="scene-{scene["id"]}" data-scene="{scene["id"]}">
  {_scene_text(scene)}
  <form class="quiz" onsubmit="return false">{"".join(qs)}</form>
</section>
"""


RENDERERS = {"annotated": render_annotated_scene, "quiz": render_quiz_scene}


def render_scene(scene: dict, original_page: str, source_label: str) -> str:
    return RENDERERS.get(scene.get("type"), render_widget_scene)(scene, original_page, source_label)
