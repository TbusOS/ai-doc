import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

try:
    from PIL import Image
except ImportError:  # the checker needs Pillow; tools/requirements.txt pins it
    Image = None

import check_exports  # noqa: E402


def frames(colors, size=(40, 24)):
    return [Image.new("RGB", size, c) for c in colors]


def striped(size=(40, 24), shift=0):
    im = Image.new("RGB", size, (245, 235, 215))
    for x in range(0, size[0], 8):
        for y in range(size[1]):
            im.putpixel(((x + shift) % size[0], y), (40, 40, 40))
    return im


@unittest.skipIf(Image is None, "Pillow not installed")
class GifChecks(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.dir)

    def save_gif(self, name, ims):
        p = self.dir / name
        ims[0].save(p, save_all=True, append_images=ims[1:], duration=100, loop=0)
        return p

    def test_moving_gif_passes(self):
        p = self.save_gif("ok.gif", [striped(shift=s) for s in (0, 2, 4, 6)])
        self.assertEqual(check_exports.check_file(p), [])

    def test_blank_first_frame_fails(self):
        p = self.save_gif("blank.gif", frames([(250, 250, 250)]) + [striped(shift=2), striped(shift=4)])
        self.assertTrue(any("blank" in e for e in check_exports.check_file(p)))

    def test_still_gif_fails(self):
        p = self.save_gif("still.gif", [striped()] * 3)
        self.assertTrue(any("does not move" in e for e in check_exports.check_file(p)))

    def test_size_limit(self):
        p = self.save_gif("big.gif", [striped(shift=s) for s in (0, 2, 4)])
        errs = check_exports.check_file(p, limits={".gif": 10})
        self.assertTrue(any("too large" in e for e in errs))

    def test_unknown_extension_is_reported(self):
        p = self.dir / "x.webm"
        p.write_bytes(b"0")
        self.assertTrue(any("unsupported" in e for e in check_exports.check_file(p)))


@unittest.skipIf(Image is None, "Pillow not installed")
class Mp4Checks(unittest.TestCase):
    def setUp(self):
        self.ff = check_exports.find_ffmpeg()
        if not self.ff:
            self.skipTest("no ffmpeg")
        self.dir = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.dir)

    def make_mp4(self, ims):
        for i, im in enumerate(ims):
            im.save(self.dir / f"{i:03d}.png")
        out = self.dir / "clip.mp4"
        subprocess.run([self.ff, "-loglevel", "error", "-y", "-framerate", "5", "-i", str(self.dir / "%03d.png"),
                        "-c:v", "libx264", "-pix_fmt", "yuv420p", str(out)], check=True)
        return out

    def test_moving_mp4_passes(self):
        p = self.make_mp4([striped(shift=s) for s in range(0, 16, 2)])
        self.assertEqual(check_exports.check_file(p), [])

    def test_still_mp4_fails(self):
        p = self.make_mp4([striped()] * 8)
        self.assertTrue(any("does not move" in e for e in check_exports.check_file(p)))


if __name__ == "__main__":
    unittest.main()
