"""Minimal PNG reader (8-bit RGB/RGBA, non-interlaced) using only zlib + numpy.

Used to read real data points out of figures in a paper or repo
(e.g. explain-src/autoresearch/sources/progress.png). No Pillow needed.
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

import numpy as np

SIG = b"\x89PNG\r\n\x1a\n"


def _paeth_row(raw: np.ndarray, prev: np.ndarray, bpp: int) -> np.ndarray:
    out = raw.astype(np.int32).copy()
    prev = prev.astype(np.int32)
    for i in range(len(out)):
        a = out[i - bpp] if i >= bpp else 0
        b = prev[i]
        c = prev[i - bpp] if i >= bpp else 0
        p = a + b - c
        pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
        pred = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
        out[i] = (out[i] + pred) & 0xFF
    return out.astype(np.uint8)


def read_png(path: str | Path) -> np.ndarray:
    """Return an (H, W, C) uint8 array; C is 3 or 4."""
    data = Path(path).read_bytes()
    if data[:8] != SIG:
        raise ValueError("not a PNG file")
    pos, idat, width = 8, b"", None
    while pos < len(data):
        length, kind = struct.unpack(">I4s", data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + length]
        if kind == b"IHDR":
            width, height, depth, ctype, _, _, interlace = struct.unpack(">IIBBBBB", body)
            if depth != 8 or ctype not in (2, 6) or interlace:
                raise ValueError(f"unsupported PNG (depth={depth}, color type={ctype}, interlace={interlace})")
            channels = 3 if ctype == 2 else 4
        elif kind == b"IDAT":
            idat += body
        elif kind == b"IEND":
            break
        pos += 12 + length
    if width is None:
        raise ValueError("PNG without IHDR")
    raw = np.frombuffer(zlib.decompress(idat), dtype=np.uint8)
    stride = width * channels
    rows = raw.reshape(height, stride + 1)
    out = np.zeros((height, stride), dtype=np.uint8)
    prev = np.zeros(stride, dtype=np.uint8)
    for y in range(height):
        ftype, line = rows[y, 0], rows[y, 1:]
        if ftype == 0:
            cur = line.copy()
        elif ftype == 1:  # Sub
            cur = line.astype(np.int32)
            for i in range(channels, stride):
                cur[i] = (cur[i] + cur[i - channels]) & 0xFF
            cur = cur.astype(np.uint8)
        elif ftype == 2:  # Up
            cur = ((line.astype(np.int32) + prev) & 0xFF).astype(np.uint8)
        elif ftype == 3:  # Average
            cur = line.astype(np.int32)
            p = prev.astype(np.int32)
            for i in range(stride):
                a = cur[i - channels] if i >= channels else 0
                cur[i] = (cur[i] + ((a + p[i]) >> 1)) & 0xFF
            cur = cur.astype(np.uint8)
        elif ftype == 4:
            cur = _paeth_row(line, prev, channels)
        else:
            raise ValueError(f"bad filter type {ftype} on row {y}")
        out[y] = cur
        prev = cur
    return out.reshape(height, width, channels)
