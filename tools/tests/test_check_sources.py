import sys, unittest, tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from check_sources import check_claims


class ClaimsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        (self.tmp / "program.md").write_text(
            'If val_bpb improved (lower), you "advance" the branch,\nkeeping the git commit', encoding="utf-8"
        )

    def data(self, claim):
        return {"scenes": [{"id": "s", "claims": [claim]}]}

    def test_quote_found_across_line_break(self):
        c = {"tag": "原文", "text": "变好就前进", "source": "program.md",
             "quote": 'you "advance" the branch, keeping the git commit'}
        self.assertEqual(check_claims(self.data(c), self.tmp), [])

    def test_quote_missing(self):
        c = {"tag": "原文", "text": "x", "source": "program.md", "quote": "advance the trunk"}
        self.assertEqual(len(check_claims(self.data(c), self.tmp)), 1)

    def test_original_without_quote(self):
        c = {"tag": "原文", "text": "x", "source": "program.md"}
        self.assertEqual(len(check_claims(self.data(c), self.tmp)), 1)

    def test_unknown_source_file(self):
        c = {"tag": "原文", "text": "x", "source": "nope.md", "quote": "a"}
        self.assertEqual(len(check_claims(self.data(c), self.tmp)), 1)

    def test_source_path_cannot_escape_dir(self):
        c = {"tag": "原文", "text": "x", "source": "../program.md", "quote": "a"}
        self.assertEqual(len(check_claims(self.data(c), self.tmp)), 1)

    def test_interpretation_needs_basis(self):
        self.assertEqual(len(check_claims(self.data({"tag": "解读", "text": "x"}), self.tmp)), 1)
        self.assertEqual(check_claims(self.data({"tag": "解读", "text": "x", "basis": "从 README 推"}), self.tmp), [])

    def test_illustrative_ok(self):
        self.assertEqual(check_claims(self.data({"tag": "示意", "text": "数字是假设的"}), self.tmp), [])

    def test_nested_quotes_are_checked_with_inherited_source(self):
        scene = {"id": "s", "source": "program.md", "pairs": [{"quote": "advance the trunk", "note": "x"}]}
        self.assertEqual(len(check_claims({"scenes": [scene]}, self.tmp)), 1)
        scene["pairs"][0]["quote"] = 'you "advance" the branch'
        self.assertEqual(check_claims({"scenes": [scene]}, self.tmp), [])

    def test_snippet_without_any_source_fails(self):
        scene = {"id": "s", "snippets": [{"quote": "x"}]}
        self.assertEqual(len(check_claims({"scenes": [scene]}, self.tmp)), 1)

    def test_bad_tag(self):
        self.assertEqual(len(check_claims(self.data({"tag": "猜的", "text": "x"}), self.tmp)), 1)


if __name__ == "__main__":
    unittest.main()
