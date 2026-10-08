import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from fix_cjk_punct import fix


class FixTest(unittest.TestCase):
    def test_comma_colon_after_chinese(self):
        self.assertEqual(fix("讲清楚,每句话"), "讲清楚，每句话")
        self.assertEqual(fix("变好了:保留"), "变好了：保留")

    def test_english_untouched(self):
        s = 'If val_bpb improved (lower), you "advance" the branch: done'
        self.assertEqual(fix(s), s)

    def test_url_and_command_untouched(self):
        self.assertEqual(fix("仓库 https://github.com/x"), "仓库 https://github.com/x")
        self.assertEqual(fix("uv run train.py > run.log 2>&1"), "uv run train.py > run.log 2>&1")

    def test_parens_with_chinese(self):
        self.assertEqual(fix("(只记录,不提交)"), "（只记录，不提交）")
        self.assertEqual(fix("double model width (OOM)"), "double model width (OOM)")

    def test_colon_before_chinese(self):
        self.assertEqual(fix("没有 reset:变差"), "没有 reset：变差")
        self.assertEqual(fix("https://例子.cn"), "https://例子.cn")

    def test_template_placeholder_kept(self):
        self.assertEqual(fix("{bpb} 比 {best} 低,变好了"), "{bpb} 比 {best} 低，变好了")


if __name__ == "__main__":
    unittest.main()
