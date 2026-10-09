#!/usr/bin/env python3
"""Read the data points out of autoresearch's progress.png.

    python3 tools/digitize_progress.py   # writes explain-src/autoresearch/data/progress.json

How the figure was drawn (sources/analysis.ipynb): kept runs are green dots
(#2ecc71, black edge), discarded runs are light grey dots (#cccccc, alpha 0.5),
crashes are not drawn, and only runs with val_bpb <= baseline + 0.0005 are drawn.
x is the index among non-crashed runs. Pixel -> data uses the grid lines, which
sit on the tick values (y: 1.000 ... 0.975 every 0.005, x: 0 ... 80 every 20).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pngread import read_png  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
FIG = REPO / "explain-src/autoresearch/sources/progress.png"
OUT = REPO / "explain-src/autoresearch/data/progress.json"

GRID_RGB, KEEP_RGB = 241, (46, 204, 113)
Y_TICKS = [1.000, 0.995, 0.990, 0.985, 0.980, 0.975]
X_TICKS = [0, 20, 40, 60, 80]


def _components(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    ys, xs = np.nonzero(mask)
    todo = set(zip(ys.tolist(), xs.tolist()))
    out = []
    while todo:
        seed = todo.pop()
        stack, comp = [seed], [seed]
        while stack:
            y, x = stack.pop()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    q = (y + dy, x + dx)
                    if q in todo:
                        todo.remove(q)
                        stack.append(q)
                        comp.append(q)
        out.append(comp)
    return out


def _bbox_center(comp) -> tuple[float, float]:
    ys = [p[0] for p in comp]
    xs = [p[1] for p in comp]
    return (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2


def _runs(idx: np.ndarray) -> list[float]:
    groups, cur = [], [int(idx[0])]
    for v in idx[1:]:
        if v - cur[-1] <= 1:
            cur.append(int(v))
        else:
            groups.append(cur)
            cur = [int(v)]
    groups.append(cur)
    return [sum(g) / len(g) for g in groups]


def digitize(path: Path) -> dict:
    img = read_png(path)[:, :, :3].astype(int)
    h, w, _ = img.shape
    dark = img.sum(2) < 150
    cols = np.where(dark.sum(0) > h * 0.5)[0]
    rows = np.where(dark.sum(1) > w * 0.6)[0]
    left, right, top, bottom = cols.min() + 2, cols.max() - 2, rows.min() + 2, rows.max() - 2

    inside = np.zeros((h, w), bool)
    inside[top:bottom, left:right] = True
    grid = (np.abs(img - GRID_RGB).max(2) <= 1) & inside
    gy = _runs(np.where(grid.sum(1) > (right - left) * 0.3)[0])
    gx = _runs(np.where(grid.sum(0) > (bottom - top) * 0.3)[0])
    if len(gy) != len(Y_TICKS) or len(gx) != len(X_TICKS):
        raise ValueError(f"grid lines not found as expected: rows={gy} cols={gx}")
    ky, by = np.polyfit(gy, Y_TICKS, 1)
    kx, bx = np.polyfit(gx, X_TICKS, 1)

    # the legend sits in the top-right corner and repeats both markers
    legend = np.zeros((h, w), bool)
    legend[top:top + int(0.09 * h), right - int(0.09 * w):right] = True
    area = inside & ~legend

    keep_mask = (np.abs(img - KEEP_RGB).max(2) <= 12) & area
    kept = [_bbox_center(c) for c in _components(keep_mask) if len(c) > 40]

    neutral = (img.max(2) - img.min(2)) <= 2
    grey_mask = neutral & (img[:, :, 0] >= 205) & (img[:, :, 0] <= 236) & area
    # grey fragments of one dot (cut by the step line or a label) share the same x index
    by_x: dict[int, list] = {}
    for comp in _components(grey_mask):
        if len(comp) < 12:
            continue
        cx, _ = _bbox_center(comp)
        by_x.setdefault(round(kx * cx + bx), []).extend(comp)

    points = [{"x": round(kx * cx + bx), "bpb": round(ky * cy + by, 5), "status": "keep"} for cx, cy in kept]
    kept_x = {p["x"] for p in points}
    for x, pixels in by_x.items():
        if x in kept_x:
            continue
        _, cy = _bbox_center(pixels)
        points.append({"x": x, "bpb": round(ky * cy + by, 5), "status": "discard"})
    points.sort(key=lambda p: p["x"])

    xs = [p["x"] for p in points]
    if len(xs) != len(set(xs)):
        raise ValueError("two points share one experiment index")
    hidden = sorted(set(range(max(xs) + 1)) - set(xs))
    return {
        "source": "explain-src/autoresearch/sources/progress.png (karpathy/autoresearch e6d79c1)",
        "method": "tools/digitize_progress.py: colour masks + grid-line calibration",
        "error": round(abs(ky) * 1.0, 5),  # one pixel in val_bpb units
        "total_in_title": 83,
        "kept_in_title": 15,
        "hidden": hidden,
        "points": points,
    }


def main() -> int:
    data = digitize(FIG)
    kept = sum(p["status"] == "keep" for p in data["points"])
    if kept != data["kept_in_title"]:
        print(f"found {kept} kept points, title says {data['kept_in_title']}")
        return 1
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(data['points'])} points ({kept} kept), hidden {data['hidden']}, ±{data['error']} → {OUT.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
