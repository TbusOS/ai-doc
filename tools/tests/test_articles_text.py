import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from articles_text import extract_article_text

PAGE = """<html><body><nav>导航</nav>
<article class="article-body"><h1>标题</h1><p>第一段 <em>强调</em></p>
<pre><code>x = 1</code></pre></article><footer>页脚</footer></body></html>"""


class ExtractTest(unittest.TestCase):
    def test_only_article_body(self):
        t = extract_article_text(PAGE)
        self.assertIn("标题", t)
        self.assertIn("强调", t)
        self.assertIn("x = 1", t)
        self.assertNotIn("导航", t)
        self.assertNotIn("页脚", t)

    def test_whitespace_normalized(self):
        a = extract_article_text('<article class="article-body"><p>a\n   b</p></article>')
        b = extract_article_text('<article class="article-body">\n<p>a b</p>\n</article>')
        self.assertEqual(a, b)

    def test_nested_article_does_not_end_early(self):
        t = extract_article_text(
            '<article class="article-body"><article>inner</article><p>after</p></article><p>outside</p>'
        )
        self.assertIn("after", t)
        self.assertNotIn("outside", t)

    def test_missing_article_raises(self):
        with self.assertRaises(ValueError):
            extract_article_text("<html><body>none</body></html>")


if __name__ == "__main__":
    unittest.main()
