#!/usr/bin/env python3
"""Check that every link inside the site points at something that is published.

    python3 tools/check_links.py [docs dir]       # default: docs/

For every page under docs/ (local explainer previews docs/zh/explain/*--*.html
are skipped, they are git-ignored): each href / src / srcset / poster that
points inside the site must name a file under docs/ (GitHub Pages publishes
only docs/, so a file elsewhere in the repo is a 404 online even though it
exists on disk), and a #fragment must match an id or <a name> on the target page.
Links to other sites are not fetched; they are only counted.
Exit code 1 when anything is broken.
"""

from __future__ import annotations

import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

REPO = Path(__file__).resolve().parent.parent
URL_ATTRS = {"href", "src", "poster"}


class _Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.urls: list[tuple[int, str]] = []
        self.ids: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        line = self.getpos()[0]
        for k, v in attrs:
            if v is None:
                continue
            if k == "id" or (tag == "a" and k == "name"):
                self.ids.add(v)
            elif k in URL_ATTRS:
                self.urls.append((line, v))
            elif k == "srcset":
                self.urls += [(line, part.strip().split()[0]) for part in v.split(",") if part.strip()]

    handle_startendtag = handle_starttag


def parse(path: Path) -> _Page:
    p = _Page()
    p.feed(path.read_text(encoding="utf-8"))
    return p


def pages(docs: Path) -> list[Path]:
    return sorted(p for p in docs.rglob("*.html") if not (p.parent.name == "explain" and "--" in p.name))


def check(docs: Path) -> tuple[list[str], int]:
    docs = docs.resolve()
    parsed: dict[Path, _Page] = {}

    def page(p: Path) -> _Page:
        if p not in parsed:
            parsed[p] = parse(p)
        return parsed[p]

    broken, external = [], 0
    for src in pages(docs):
        for line, url in page(src).urls:
            u = urlsplit(url)
            if u.scheme or url.startswith("//"):
                external += u.scheme in ("http", "https") or url.startswith("//")
                continue
            where = f"{src.relative_to(docs)}:{line}"
            target = src if not u.path else (src.parent / unquote(u.path)).resolve()
            if u.path.endswith("/") or target.is_dir():
                target = target / "index.html"
            if docs not in target.parents and target != docs:
                broken.append(f"{where}: {url} -> outside docs/, not published")
            elif not target.is_file():
                broken.append(f"{where}: {url} -> no such file")
            elif u.fragment and target.suffix == ".html" and unquote(u.fragment) not in page(target).ids:
                broken.append(f"{where}: {url} -> no id \"{unquote(u.fragment)}\" on that page")
    return broken, external


def main(argv: list[str]) -> int:
    docs = Path(argv[1]) if len(argv) > 1 else REPO / "docs"
    broken, external = check(docs)
    n = len(pages(docs))
    for b in broken:
        print("  " + b)
    print(f"{n} pages, {len(broken)} broken links, {external} links to other sites (not checked)")
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
