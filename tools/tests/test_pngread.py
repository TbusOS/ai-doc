import struct, sys, tempfile, unittest, zlib
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from pngread import read_png


def chunk(kind, body):
    return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body) & 0xFFFFFFFF)


def encode(img, filters):
    """Write an RGB PNG using the given per-row filter types (encoder side of each filter)."""
    h, w, _ = img.shape
    stride, bpp = w * 3, 3
    raw = b""
    prev = np.zeros(stride, dtype=np.int32)
    for y in range(h):
        cur = img[y].reshape(-1).astype(np.int32)
        f = filters[y % len(filters)]
        if f == 0:
            enc = cur
        elif f == 1:
            enc = cur - np.concatenate([np.zeros(bpp, np.int32), cur[:-bpp]])
        elif f == 2:
            enc = cur - prev
        elif f == 3:
            left = np.concatenate([np.zeros(bpp, np.int32), cur[:-bpp]])
            enc = cur - ((left + prev) >> 1)
        else:
            enc = cur.copy()
            for i in range(stride):
                a = cur[i - bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i - bpp] if i >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                enc[i] = cur[i] - (a if pa <= pb and pa <= pc else b if pb <= pc else c)
        raw += bytes([f]) + bytes((enc & 0xFF).astype(np.uint8))
        prev = cur
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")


class PngTest(unittest.TestCase):
    def test_all_filter_types_round_trip(self):
        rng = np.random.default_rng(1)
        img = rng.integers(0, 256, size=(10, 7, 3), dtype=np.uint8)
        f = Path(tempfile.mkdtemp()) / "t.png"
        f.write_bytes(encode(img, [0, 1, 2, 3, 4]))
        np.testing.assert_array_equal(read_png(f), img)

    def test_rejects_non_png(self):
        f = Path(tempfile.mkdtemp()) / "x.png"
        f.write_bytes(b"not a png")
        with self.assertRaises(ValueError):
            read_png(f)


if __name__ == "__main__":
    unittest.main()
