"""Regression test on the real figure: the numbers we publish must match what the figure shows."""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
from digitize_progress import digitize  # noqa: E402

FIG = ROOT / "explain-src/autoresearch/sources/progress.png"


class DigitizeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d = digitize(FIG)

    def test_fifteen_kept_like_the_title(self):
        self.assertEqual(sum(p["status"] == "keep" for p in self.d["points"]), 15)

    def test_one_point_per_experiment_index(self):
        xs = [p["x"] for p in self.d["points"]]
        self.assertEqual(len(xs), len(set(xs)))
        self.assertEqual(len(xs), 77)
        self.assertEqual(self.d["hidden"], [1, 15, 20, 41, 62, 70])

    def test_kept_scores_only_go_down(self):
        kept = [p["bpb"] for p in self.d["points"] if p["status"] == "keep"]
        self.assertEqual(kept, sorted(kept, reverse=True))

    def test_baseline_and_best_values(self):
        kept = [p for p in self.d["points"] if p["status"] == "keep"]
        self.assertAlmostEqual(kept[0]["bpb"], 0.9979, delta=0.00005)
        self.assertEqual(kept[0]["x"], 0)
        self.assertAlmostEqual(kept[-1]["bpb"], 0.9773, delta=0.00005)
        self.assertEqual(kept[-1]["x"], 74)

    def test_discarded_points_are_not_better_than_running_best(self):
        best = None
        for p in self.d["points"]:
            if p["status"] == "keep":
                best = p["bpb"]
            else:
                self.assertGreaterEqual(p["bpb"] + self.d["error"], best, p)


if __name__ == "__main__":
    unittest.main()
