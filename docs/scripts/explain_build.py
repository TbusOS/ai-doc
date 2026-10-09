#!/usr/bin/env python3
"""Render explainer pages from explain-src/<slug>/.

    python3 docs/scripts/explain_build.py                        # every explainer -> docs/zh/explain/<slug>.html
    python3 docs/scripts/explain_build.py --slug autoresearch --only intro,files --out autoresearch--a
                                                                 # preview page with only some scenes

explain-src/<slug>/
  zh.json            page info, chapters, scene_order
  scenes/<id>.json   one file per scene: copy, claims, controls, transcript
  data/*.json        datasets, embedded as data["datasets"][<file stem>]
  sources/           verbatim copies of the originals (checked by tools/check_sources.py)

All copy is written into the HTML at build time, so the page reads in full
without JavaScript. Animation code lives in docs/assets/explain/ and reads the
same data, embedded as <script type="application/json" id="explain-data">.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from explain_render import render_scene  # noqa: E402
from site_v2 import esc, footer, head, header  # noqa: E402

REPO = Path(__file__).resolve().parent.parent.parent
SRC = REPO / "explain-src"
OUT = REPO / "docs" / "zh" / "explain"


def load_explainer(src_dir: Path) -> dict:
    data = json.loads((src_dir / "zh.json").read_text(encoding="utf-8"))
    if "scene_order" in data:
        scenes, missing = [], []
        for sid in data["scene_order"]:
            f = src_dir / "scenes" / f"{sid}.json"
            if f.exists():
                scenes.append(json.loads(f.read_text(encoding="utf-8")))
            else:
                missing.append(sid)
        data["scenes"] = scenes
        data["missing_scenes"] = missing
    data["datasets"] = {
        f.stem: json.loads(f.read_text(encoding="utf-8")) for f in sorted((src_dir / "data").glob("*.json"))
    }
    return data


def render_chapter_nav(data: dict) -> str:
    used = {sc["chapter"] for sc in data["scenes"]}
    items = []
    for ch in data["chapters"]:
        if ch.get("nav") is False:
            continue
        inner = f'<span class="num">{esc(ch["num"])}</span>{esc(ch["title"])}'
        if ch["id"] in used:
            items.append(f'<li><a href="#ch-{ch["id"]}">{inner}</a></li>')
        else:
            items.append(f'<li><span aria-disabled="true">{inner} <small>制作中</small></span></li>')
    return f'<ol class="ex-chapters" aria-label="五个问题">{"".join(items)}</ol>'


def _chapter_head(ch: dict) -> str:
    if ch.get("num"):
        return (
            f'<div class="chapter-head"><span class="chapter-num">{esc(ch["num"])}</span>'
            f'<span class="chapter-title">{esc(ch["title"])}</span></div>'
        )
    if ch.get("title"):
        return f'<div class="chapter-head"><span class="chapter-title">{esc(ch["title"])}</span></div>'
    return ""


def render_explain(data: dict, prefix: str = "../../") -> str:
    paper = data["paper"]
    original = paper["original_page"]
    source_label = paper.get("source_label", f'{paper["title"]} 原文')
    chapters_html = []
    for ch in data["chapters"]:
        scenes = [sc for sc in data["scenes"] if sc["chapter"] == ch["id"]]
        if not scenes:
            continue
        chapters_html.append(
            f'<section class="chapter chapter--{esc(ch["id"])}" id="ch-{ch["id"]}"><div class="wrap">'
            + _chapter_head(ch)
            + "".join(render_scene(sc, original, source_label) for sc in scenes)
            + "</div></section>"
        )
    note = f'<p class="note">{esc(data["sample_note"])}</p>' if data.get("sample_note") else ""
    widgets = []
    for sc in data["scenes"]:
        if sc.get("widget") and sc["widget"] not in widgets:
            widgets.append(sc["widget"])
    widget_scripts = "".join(
        f'<script src="{prefix}assets/explain/{data["slug"]}/{w}-model.js"></script>\n'
        f'<script src="{prefix}assets/explain/{data["slug"]}/{w}.js"></script>\n'
        for w in widgets
    )
    needs_quiz = any(sc.get("type") == "quiz" for sc in data["scenes"])
    blob = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c")
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
      <a href="{esc(paper["repo"])}">{esc(paper.get("repo_label", "原始仓库"))} →</a>
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
        + (f'<script src="{prefix}assets/explain/quiz.js"></script>\n' if needs_quiz else "")
        + widget_scripts
        + "</body>\n</html>\n"
    )


def build(slug: str, only: list[str] | None = None, out_name: str | None = None) -> Path:
    data = load_explainer(SRC / slug)
    if only:
        data["scenes"] = [sc for sc in data["scenes"] if sc["id"] in only]
    out = OUT / f"{out_name or slug}.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render_explain(data), encoding="utf-8")
    missing = data.get("missing_scenes")
    print(f"  wrote {out.relative_to(REPO)}" + (f"  (missing scenes: {', '.join(missing)})" if missing else ""))
    return out


def build_all() -> list[Path]:
    return [build(src.parent.name) for src in sorted(SRC.glob("*/zh.json"))]


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--slug")
    ap.add_argument("--only", help="comma-separated scene ids")
    ap.add_argument("--out", help="output file name without .html (preview pages: <slug>--<tag>)")
    args = ap.parse_args(argv)
    if not args.slug:
        build_all()
        return 0
    build(args.slug, args.only.split(",") if args.only else None, args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
