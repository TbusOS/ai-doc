#!/usr/bin/env python3
"""Check exported GIF / MP4 files before they are used outside the site.

    python3 tools/check_exports.py <dir or files...>

For each file: size under the limit (GIF 4 MB, MP4 15 MB, from the design doc),
first and last frame not blank, and the picture actually moves (a broken
capture often gives the same frame over and over). Exit code 1 on any error.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageSequence, ImageStat

LIMITS = {".gif": 4 * 1024 * 1024, ".mp4": 15 * 1024 * 1024}
BLANK_STDDEV = 4.0   # a frame whose grey levels barely vary is treated as blank
MOVE_MEAN = 0.5      # mean absolute difference between first and middle frame


def find_ffmpeg() -> str | None:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return shutil.which("ffmpeg")


def _blank(im: Image.Image) -> bool:
    return ImageStat.Stat(im.convert("L")).stddev[0] < BLANK_STDDEV


def _moves(a: Image.Image, b: Image.Image) -> bool:
    diff = ImageChops.difference(a.convert("L"), b.convert("L"))
    return ImageStat.Stat(diff).mean[0] >= MOVE_MEAN


def _gif_frames(path: Path) -> list[Image.Image]:
    with Image.open(path) as im:
        return [f.convert("RGB") for f in ImageSequence.Iterator(im)]


def _mp4_frames(path: Path, ff: str) -> list[Image.Image]:
    """First, middle and last frame, decoded with ffmpeg."""
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([ff, "-loglevel", "error", "-i", str(path), "-vsync", "0",
                        str(Path(tmp) / "%05d.png")], check=True)
        files = sorted(Path(tmp).glob("*.png"))
        if not files:
            return []
        pick = [files[0], files[len(files) // 2], files[-1]]
        out = [Image.open(f).convert("RGB") for f in pick]
        for im in out:
            im.load()
        return out


def check_file(path: Path, limits: dict | None = None) -> list[str]:
    limits = limits or LIMITS
    ext = path.suffix.lower()
    if ext not in LIMITS:
        return [f"{path.name}: unsupported type {ext}"]
    errs = []
    size = path.stat().st_size
    if size > limits[ext]:
        errs.append(f"{path.name}: too large ({size / 1048576:.1f} MB > {limits[ext] / 1048576:.1f} MB)")
    if ext == ".gif":
        fr = _gif_frames(path)
        first, middle, last = fr[0], fr[len(fr) // 2], fr[-1]
    else:
        ff = find_ffmpeg()
        if not ff:
            return errs + [f"{path.name}: no ffmpeg to decode it"]
        fr = _mp4_frames(path, ff)
        if not fr:
            return errs + [f"{path.name}: no frames decoded"]
        first, middle, last = fr[0], fr[1], fr[2]
    if len(fr) < 2:
        errs.append(f"{path.name}: only {len(fr)} frame")
    if _blank(first):
        errs.append(f"{path.name}: first frame is blank")
    if _blank(last):
        errs.append(f"{path.name}: last frame is blank")
    if not (_moves(first, middle) or _moves(middle, last)):
        errs.append(f"{path.name}: picture does not move (first, middle and last frame look the same)")
    return errs


def main(argv: list[str]) -> int:
    paths: list[Path] = []
    for a in argv[1:]:
        p = Path(a)
        paths += sorted(x for x in p.iterdir() if x.suffix.lower() in LIMITS) if p.is_dir() else [p]
    if not paths:
        print("no GIF / MP4 files given")
        return 1
    bad = 0
    for p in paths:
        errs = check_file(p)
        print(f"  {'ok  ' if not errs else 'FAIL'}  {p.name}  {p.stat().st_size / 1048576:.2f} MB")
        for e in errs:
            print("        " + e)
        bad += bool(errs)
    print(f"{len(paths)} file(s) checked, {bad} failed")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
