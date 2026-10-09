# AI Doc — GitHub Pages site

Bilingual (EN/中文) static site for the [AI Doc](../README.md) knowledge base,
rendered in the Anthropic design vocabulary (warm cream background, Poppins + Lora
typography, orange accent, editorial grids, hand-drawn SVG diagrams).

Live site when enabled: `https://<your-user>.github.io/<repo-name>/`

## Structure

```
docs/
├── index.html                 # Landing page with EN / 中文 picker
├── en/                        # English entry point
│   ├── index.html             # Topic overview + architecture diagram
│   ├── <category>.html        # One per topic (5 total)
│   ├── open-source-models.html
│   └── articles/<slug>.html   # Rendered from repo-root .md files
├── zh/                        # Mirror of en/ in Chinese chrome
├── assets/
│   ├── fonts.css              # Google Fonts (Poppins + Lora + JetBrains Mono)
│   ├── anthropic.css          # Anthropic design system (from sky-skills)
│   └── site.css               # Site-specific additions
├── scripts/
│   └── build.py               # Regenerates all HTML from .md + manifest
└── .nojekyll                  # Tells GitHub Pages to serve files as-is
```

## Illustrated explainers

Papers explained with animations, interactive diagrams and source-tagged
plain-language copy (each key statement is marked 原文 / 解读 / 示意, and every
原文 quote is checked against a verbatim copy of the source). Done so far:
**autoresearch** (`docs/zh/explain/autoresearch.html`): 13 animated scenes,
a program.md walk-through and a 3-question quiz. Each paper gets its own
visual style. Design: `docs/superpowers/specs/2026-10-08-paper-explainers-design.md`;
how to make one: `.claude/skills/paper-explainer/SKILL.md`; setup and daily
commands: [`MAINTENANCE.md`](../MAINTENANCE.md).

```
explain-src/<slug>/zh.json            # page copy: title, chapters, scene order
explain-src/<slug>/scenes/<id>.json   # one scene's copy, controls, transcript and claims
explain-src/<slug>/sources/           # verbatim copies of the original files the claims quote
explain-src/<slug>/data/              # numbers read off the paper's figures (with error)
explain-src/<slug>/illustrations/     # prompts, model and date for every generated drawing
docs/assets/theme.css                 # theme (light + dark)
docs/assets/explain/                  # scene engine (timeline.js, engine.js, draw.js, explain.css)
docs/assets/explain/<slug>/           # per-scene code: <id>-model.js (pure stateAt(t)) + <id>.js, drawings
docs/scripts/explain_build.py         # json -> docs/zh/explain/<slug>.html
docs/scripts/home_v2.py               # new homepage preview -> docs/sample/index.html
tools/export_scene.mjs                # scenes -> GIF / MP4 for use outside the site
tools/net.mjs                         # headless Chromium behind a proxy: proxy + web-font cache (tools/.font-cache)
explain-src/<slug>/reel.json          # narrated reel: shots, narration (subtitle + what is read aloud)
tools/reel/                           # narrated reel builder: edge-tts voice, music and effects made in numpy (build.py)
```

Build and check everything: `bash tools/check_all.sh` (must end with
`ALL CHECKS PASSED`; a SKIP is not a pass).

## Rebuild after content changes

Whenever you add or update an article:

```bash
# from repo root
python3 docs/scripts/build.py
```

The script:

1. Reads the manifest at the top of `build.py` (`CATEGORIES` list) — update this
   when adding a new paper.
2. Reads each referenced `.md` file under the repo root.
3. Converts Markdown → styled HTML using `python-markdown`.
4. Writes category index pages, article pages, landing, and models directory
   pages for both languages.

Requires once — a Python environment with the pinned packages (another
markdown version renders the original pages differently) and, for browser
tests and exports, Playwright under `tools/`. Full setup on a new machine:
[`MAINTENANCE.md`](../MAINTENANCE.md) §2.

## Quality gates

Before publishing, run the Anthropic-design structural verifier that ships with
the `anthropic-design` skill:

```bash
find docs -name "*.html" | xargs python3 \
  ~/linux-kernel/github/sky-skills/skills/anthropic-design/scripts/verify.py
```

A clean pass (`anthropic-design verify: OK — N file(s) passed`) means:

- No `[placeholder]` / `[hero]` / `[abstract illustration]` literals left in.
- `.anth-container` base class always paired with `--wide` / `--narrow` modifiers.
- Every `anth-*` class referenced actually exists in `anthropic.css` (no ghost classes).
- `<svg>` tags balanced, doctype + viewport present.

## Preview locally

```bash
# from repo root
python3 -m http.server 8080 --directory docs
# open http://localhost:8080
```

## Publishing on GitHub Pages

1. Push to GitHub.
2. Repo settings → **Pages** → **Source: Deploy from a branch**.
3. Branch: `main` (or whichever you use), folder: `/docs`.
4. The `.nojekyll` file at `docs/.nojekyll` disables Jekyll processing so the
   static HTML is served as-is.

## Adding a new paper

1. Write the article `.md` under the correct topic folder at repo root
   (e.g. `self-improving-agents/my-new-paper.md`), following the bilingual
   format used by existing entries.
2. Update the top-level `README.md` tables (EN + 中文).
3. Open `docs/scripts/build.py`, find the matching `Category`, and append a
   `Paper(slug="...", md_path="...", ...)` entry.
4. Run `python3 docs/scripts/build.py`.
5. Run the verifier from the Quality gates section.
6. Commit the updated `docs/` directory along with the new `.md`.

## Design system

The page chrome, components, colors, typography, spacing, and diagram style all
come from the `anthropic-design` skill at
`~/linux-kernel/github/sky-skills/skills/anthropic-design`. Key references:

- `references/design-tokens.md` — all CSS variables
- `references/layout-patterns.md` — container selection table
- `references/components.md` — 28 component patterns
- `references/dos-and-donts.md` — publish-time checklist

Site-specific additions (topic cards, paper rows, language toggle, article body
typography) live in `docs/assets/site.css` as minimal layers above the base.
