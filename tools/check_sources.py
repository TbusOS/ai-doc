#!/usr/bin/env python3
"""Check every quote and claim of an explainer against the source copies.

    python3 tools/check_sources.py explain-src/<slug>               # all scenes
    python3 tools/check_sources.py explain-src/<slug> --scene <id>  # one scene

Rules (spec §4.1):
  any object with a `quote`  the quote must appear verbatim (whitespace-normalized)
                             in sources/<source>; `source` may come from an
                             enclosing object (e.g. a scene of program.md pairs)
  tag 原文                    needs quote and source
  tag 解读                    needs a non-empty `basis` saying what it was inferred from
  tag 示意                    illustrative numbers; nothing to check
Exit 1 when anything fails.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "docs" / "scripts"))

TAGS = ("原文", "解读", "示意")


def _norm(s: str) -> str:
    return " ".join(s.split())


class _Sources:
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        self.cache: dict[str, str | None] = {}

    def text(self, name: str) -> str | None:
        if name not in self.cache:
            path = (self.root / name).resolve()
            ok = self.root in path.parents and path.is_file()
            self.cache[name] = _norm(path.read_text(encoding="utf-8")) if ok else None
        return self.cache[name]


def _check_obj(obj: dict, source: str | None, src: _Sources) -> str | None:
    tag = obj.get("tag")
    if tag is not None and tag not in TAGS:
        return f"unknown tag {tag!r}"
    if tag == "解读":
        return None if (obj.get("basis") or "").strip() else "解读 without basis"
    if tag == "示意":
        return None
    if tag == "原文" and not (obj.get("quote") and source):
        return "原文 needs both quote and source"
    if "quote" not in obj:
        return None
    if not source:
        return "quote without a source"
    text = src.text(source)
    if text is None:
        return f"source file not found: {source}"
    if _norm(obj["quote"]) not in text:
        return f"quote not found in {source}"
    return None


def _walk(node, source: str | None, src: _Sources, where: str, errors: list[str]) -> int:
    count = 0
    if isinstance(node, dict):
        source = node.get("source", source)
        if "quote" in node or "tag" in node:
            count += 1
            err = _check_obj(node, source, src)
            if err:
                label = node.get("text") or node.get("quote") or ""
                errors.append(f"{where}: {err}: {str(label)[:40]}")
        for v in node.values():
            count += _walk(v, source, src, where, errors)
    elif isinstance(node, list):
        for v in node:
            count += _walk(v, source, src, where, errors)
    return count


def check_claims(data: dict, sources_dir: Path, counter: list[int] | None = None) -> list[str]:
    errors: list[str] = []
    src = _Sources(sources_dir)
    total = 0
    for scene in data.get("scenes", []):
        total += _walk(scene, None, src, str(scene.get("id")), errors)
    if counter is not None:
        counter.append(total)
    return errors


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("explainer_dir")
    ap.add_argument("--scene")
    args = ap.parse_args(argv)
    from explain_build import load_explainer

    root = Path(args.explainer_dir)
    data = load_explainer(root)
    if args.scene:
        data["scenes"] = [s for s in data["scenes"] if s.get("id") == args.scene]
        if not data["scenes"]:
            print(f"no scene {args.scene!r} in {root}")
            return 1
    counter: list[int] = []
    errors = check_claims(data, root / "sources", counter)
    for e in errors:
        print(e)
    print(f"{counter[0]} quotes and claims checked, {len(errors)} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
