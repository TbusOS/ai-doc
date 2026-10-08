"""Shared chrome for the 2026-10 redesign: <head>, header, footer.

`prefix` is the relative path from the page to docs/ (e.g. "../../" for
docs/zh/explain/x.html). Phase 1 only uses these for the explainer page and
the sample homepage; phase 2 moves every page over.
"""

from __future__ import annotations

import html

FONTS_GOOGLE = (
    "https://fonts.googleapis.com/css2?"
    "family=Bricolage+Grotesque:opsz,wght@12..96,400..800"
    "&family=Noto+Sans+SC:wght@500;700;900"
    "&family=Noto+Serif+SC:wght@400;600"
    "&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..650;1,8..60,400"
    "&family=JetBrains+Mono:wght@400;600"
    "&display=swap"
)
FONTS_HAND = "https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-webfont@1.7.0/lxgwwenkaigbscreen.css"

# Runs before first paint: marks JS as available (CSS hides the stage without it)
# and applies a saved dark/light choice so it does not flash.
EARLY_THEME = (
    "<script>document.documentElement.classList.add('js');"
    "try{var m=localStorage.getItem('aidoc-theme');"
    "if(m&&m!=='auto')document.documentElement.setAttribute('data-theme',m)}catch(e){}</script>"
)

LOGO_SVG = (
    '<svg viewBox="0 0 32 32" aria-hidden="true">'
    '<rect x="2" y="2" width="28" height="28" rx="8" style="fill:var(--ink)"/>'
    '<path d="M9 22 L14.5 9 L20 22 M11.3 17 H17.7" style="fill:none;stroke:var(--paper)" stroke-width="2.6" '
    'stroke-linecap="round" stroke-linejoin="round"/>'
    '<circle cx="23" cy="21.5" r="2.6" style="fill:var(--accent)"/></svg>'
)


CURRENT = ' aria-current="page"'


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def head(title: str, prefix: str, description: str = "", extra: str = "") -> str:
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
{EARLY_THEME}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS_GOOGLE}">
<link rel="stylesheet" href="{FONTS_HAND}">
<link rel="stylesheet" href="{prefix}assets/theme.css">
{extra}</head>
"""


def header(prefix: str, active: str = "", view: dict | None = None) -> str:
    """view = {"explain": url, "original": url, "current": "explain"|"original"} adds the 图解/原文 switch."""
    links = [
        ("home", "首页", f"{prefix}zh/index.html"),
        ("topics", "主题", f"{prefix}zh/index.html#topics"),
        ("models", "开源模型", f"{prefix}zh/open-source-models.html"),
    ]
    nav = "".join(
        f'<a href="{href}"{CURRENT if key == active else ""}>{label}</a>' for key, label, href in links
    )
    switch = ""
    if view:
        cur = view["current"]
        switch = (
            '<nav class="view-switch" aria-label="视图">'
            f'<a href="{view["explain"]}"{CURRENT if cur == "explain" else ""}>图解</a>'
            f'<a href="{view["original"]}"{CURRENT if cur == "original" else ""}>原文</a>'
            "</nav>"
        )
    return f"""<header class="site-head">
  <div class="wrap">
    <a class="logo" href="{prefix}zh/index.html">{LOGO_SVG}<span>AI Doc</span></a>
    <nav class="site-nav" aria-label="主导航">{nav}</nav>
    <div class="head-tools">
      {switch}
      <button class="theme-btn" type="button" aria-label="切换主题">◐</button>
    </div>
  </div>
</header>
"""


def footer(prefix: str) -> str:
    return f"""<footer class="site-foot">
  <div class="wrap">
    <span>AI Doc · AI 论文与工程文章的中英对照翻译和图解</span>
    <span><a href="https://github.com/TbusOS/ai-doc">GitHub</a> · <a href="{prefix}en/index.html">English</a></span>
  </div>
</footer>
"""
