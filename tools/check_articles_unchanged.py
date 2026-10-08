#!/usr/bin/env python3
"""Prove the redesign never changes the original translated article text.

    python3 tools/check_articles_unchanged.py snapshot   # write the baseline
    python3 tools/check_articles_unchanged.py check      # exit 1 on any difference

Compares the plain text of <article class="article-body"> in
docs/{en,zh}/articles/*.html against tools/baselines/articles_text.json.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from articles_text import extract_article_text

REPO = Path(__file__).resolve().parent.parent
BASELINE = REPO / "tools" / "baselines" / "articles_text.json"


def collect() -> dict[str, str]:
    pages: dict[str, str] = {}
    for lang in ("en", "zh"):
        for path in sorted((REPO / "docs" / lang / "articles").glob("*.html")):
            pages[f"{lang}/{path.name}"] = extract_article_text(path.read_text(encoding="utf-8"))
    return pages


def first_diff(a: str, b: str) -> int:
    for i, (x, y) in enumerate(zip(a, b)):
        if x != y:
            return i
    return min(len(a), len(b))


def check() -> int:
    if not BASELINE.exists():
        print(f"no baseline at {BASELINE.relative_to(REPO)}; run snapshot first")
        return 1
    old = json.loads(BASELINE.read_text(encoding="utf-8"))
    new = collect()
    problems = []
    for key in sorted(set(old) | set(new)):
        if key not in new:
            problems.append(f"{key}: missing now")
        elif key not in old:
            problems.append(f"{key}: not in baseline")
        elif old[key] != new[key]:
            i = first_diff(old[key], new[key])
            problems.append(
                f"{key}: differs at char {i}\n    was: …{old[key][max(0, i - 30):i + 30]}…\n    now: …{new[key][max(0, i - 30):i + 30]}…"
            )
    for p in problems:
        print(p)
    if problems:
        print(f"{len(problems)} page(s) changed")
        return 1
    print(f"{len(new)} pages unchanged")
    return 0


def snapshot() -> int:
    pages = collect()
    BASELINE.parent.mkdir(parents=True, exist_ok=True)
    BASELINE.write_text(json.dumps(pages, ensure_ascii=False, sort_keys=True, indent=0) + "\n", encoding="utf-8")
    print(f"baseline written: {len(pages)} pages → {BASELINE.relative_to(REPO)}")
    return 0


def main(argv: list[str]) -> int:
    if len(argv) != 2 or argv[1] not in ("snapshot", "check"):
        print(__doc__)
        return 2
    return snapshot() if argv[1] == "snapshot" else check()


if __name__ == "__main__":
    sys.exit(main(sys.argv))
