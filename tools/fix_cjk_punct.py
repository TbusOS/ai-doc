#!/usr/bin/env python3
"""Turn ASCII , : ; ( ) ? ! into full-width forms when they sit next to Chinese text.

    python3 tools/fix_cjk_punct.py <file>...        # rewrite in place
    python3 tools/fix_cjk_punct.py --check <file>... # exit 1 if anything would change

English sentences, commands and code have no CJK neighbours, so they stay as is.

Run it on copy data only (zh.json, Markdown). Never on source code: a tuple like
("首页", ...) has Chinese inside parentheses and would be turned into （...）.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

CJK = r"[㐀-鿿豈-﫿　-〿＀-￯「」『』]"
FULL = {",": "，", ":": "：", ";": "；", "?": "？", "!": "！"}


def fix(text: str) -> str:
    # , : ; ? ! with Chinese on the left (optionally a closing quote/bracket between)
    text = re.sub(rf"(?<={CJK})([,:;?!])(?!//)", lambda m: FULL[m.group(1)], text)
    # , with Chinese on the right, e.g. "4 轮,AI" stays ASCII but "baseline,看" -> fix
    text = re.sub(rf",(?={CJK})", "，", text)
    # : with Chinese on the right, e.g. "reset:变差" (but not "https://")
    text = re.sub(rf":(?!//)(?={CJK})", "：", text)
    # (...) whose content contains Chinese
    text = re.sub(rf"\(([^()\n]*{CJK}[^()\n]*)\)", r"（\1）", text)
    return text


def main(argv: list[str]) -> int:
    check = "--check" in argv
    files = [Path(a) for a in argv[1:] if a != "--check"]
    changed = []
    for f in files:
        old = f.read_text(encoding="utf-8")
        new = fix(old)
        if new != old:
            changed.append(f)
            if not check:
                f.write_text(new, encoding="utf-8")
    for f in changed:
        print(("would fix " if check else "fixed ") + str(f))
    return 1 if (check and changed) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
