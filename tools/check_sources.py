#!/usr/bin/env python3
"""Check every claim in an explainer's zh.json against the source copies.

    python3 tools/check_sources.py explain-src/<slug>

Rules (spec §4.1):
  原文  quote must appear verbatim (whitespace-normalized) in sources/<source>
  解读  must carry a non-empty `basis` saying what it was inferred from
  示意  illustrative numbers; nothing to check
Exit 1 when any claim fails.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

TAGS = ("原文", "解读", "示意")


def _norm(s: str) -> str:
    return " ".join(s.split())


def _check_one(claim: dict, sources_dir: Path, cache: dict[str, str]) -> str | None:
    tag = claim.get("tag")
    if tag not in TAGS:
        return f"unknown tag {tag!r}"
    if tag == "解读":
        return None if (claim.get("basis") or "").strip() else "解读 without basis"
    if tag == "示意":
        return None
    quote, source = claim.get("quote"), claim.get("source")
    if not quote or not source:
        return "原文 needs both quote and source"
    path = (sources_dir / source).resolve()
    if sources_dir.resolve() not in path.parents or not path.is_file():
        return f"source file not found: {source}"
    if source not in cache:
        cache[source] = _norm(path.read_text(encoding="utf-8"))
    if _norm(quote) not in cache[source]:
        return f"quote not found in {source}"
    return None


def check_claims(data: dict, sources_dir: Path) -> list[str]:
    errors: list[str] = []
    cache: dict[str, str] = {}
    for scene in data.get("scenes", []):
        for claim in scene.get("claims", []):
            err = _check_one(claim, sources_dir, cache)
            if err:
                errors.append(f"{scene.get('id')}: {err}: {(claim.get('text') or '')[:30]}")
    return errors


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__)
        return 2
    root = Path(argv[1])
    data = json.loads((root / "zh.json").read_text(encoding="utf-8"))
    errors = check_claims(data, root / "sources")
    total = sum(len(s.get("claims", [])) for s in data.get("scenes", []))
    for e in errors:
        print(e)
    print(f"{total} claims checked, {len(errors)} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
