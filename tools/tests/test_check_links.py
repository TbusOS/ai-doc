"""check_links.py finds dead links; build.py points article links at what the site publishes."""
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT / "docs" / "scripts"))
import build  # noqa: E402
import check_links  # noqa: E402


class CheckLinksTest(unittest.TestCase):
    def site(self, pages: dict[str, str]) -> Path:
        d = Path(tempfile.mkdtemp()) / "docs"
        for name, body in pages.items():
            f = d / name
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_text(body, encoding="utf-8") if name.endswith(".html") else f.write_bytes(b"x")
        return d

    def test_good_links_pass(self):
        d = self.site({
            "zh/index.html": '<a href="articles/a.html#s2">a</a><img src="../assets/x.png" srcset="../assets/x.png 2x">'
                             '<a href="#top" id="top">top</a><a href="../">root</a><a href="https://example.com/">ext</a>',
            "zh/articles/a.html": '<h2 id="s2">two</h2>',
            "assets/x.png": "",
            "index.html": "",
        })
        broken, external = check_links.check(d)
        self.assertEqual(broken, [])
        self.assertEqual(external, 1)

    def test_each_kind_of_dead_link_is_reported(self):
        d = self.site({
            "zh/articles/a.html": '<img src="images/x1.png">'          # the 2026-10-09 bug: image not under docs/
                                  '<a href="react.md">r</a>'          # a link written for GitHub
                                  '<a href="b.html#nope">b</a>'       # missing anchor
                                  '<a href="../../../README.md">up</a>',  # outside docs/: not published
            "zh/articles/b.html": '<h2 id="yes">b</h2>',
        })
        broken, _ = check_links.check(d)
        text = "\n".join(broken)
        self.assertEqual(len(broken), 4, text)
        self.assertIn("images/x1.png -> no such file", text)
        self.assertIn("react.md -> no such file", text)
        self.assertIn('no id "nope"', text)
        self.assertIn("outside docs/", text)

    def test_local_previews_are_skipped(self):
        d = self.site({"zh/explain/x--draft.html": '<img src="gone.png">'})
        self.assertEqual(check_links.check(d)[0], [])


class SiteLinkTest(unittest.TestCase):
    def setUp(self):
        self.assets = Path(tempfile.mkdtemp())
        self.saved, build.ARTICLE_ASSETS = build.ARTICLE_ASSETS, self.assets

    def tearDown(self):
        build.ARTICLE_ASSETS = self.saved

    def md(self, rel):
        return ROOT / rel

    def test_link_to_another_article(self):
        f = self.md("agent-patterns/anthropic-building-effective-agents.md")
        self.assertEqual(build.site_link(f, "react.md"), "react.html")
        self.assertEqual(build.site_link(f, "../self-improving-agents/reflexion.md#x"), "reflexion.html#x")
        self.assertEqual(build.site_link(f, "react.md", in_articles=False), "articles/react.html")

    def test_image_is_copied_under_docs(self):
        f = self.md("inference-optimization/flashmoe.md")
        url = build.site_link(f, "images/flashmoe/x1.png")
        self.assertEqual(url, "../../assets/articles/inference-optimization/images/flashmoe/x1.png")
        copy = self.assets / "inference-optimization/images/flashmoe/x1.png"
        self.assertEqual(copy.read_bytes(), (ROOT / "inference-optimization/images/flashmoe/x1.png").read_bytes())

    def test_model_directory_and_topic(self):
        f = self.md("training-techniques/chinchilla.md")
        self.assertEqual(build.site_link(f, "../open-source-models/README.md#5-long-context--长上下文"),
                         "../open-source-models.html#5-long-context")
        self.assertEqual(build.site_link(f, "../self-improving-agents/"), "../self-improving-agents.html")

    def test_repo_file_not_on_the_site_goes_to_github(self):
        f = ROOT / "open-source-models" / "README.md"
        self.assertEqual(build.site_link(f, "../CONTRIBUTING.md#model-entry-template", in_articles=False),
                         "https://github.com/TbusOS/ai-doc/blob/main/CONTRIBUTING.md#model-entry-template")

    def test_other_links_unchanged(self):
        f = self.md("agent-patterns/react.md")
        for url in ("https://arxiv.org/abs/2210.03629", "#section", "mailto:a@b.c", "no-such-file.md"):
            self.assertEqual(build.site_link(f, url), url)

    def test_untouched_links_keep_their_bytes(self):
        f = self.md("agent-patterns/react.md")
        html_in = '<a href="https://x.org/?a=1&amp;b=\'2\'">x</a><a href="react.md">r</a>'
        out = build.site_links(f, html_in)
        self.assertIn('href="https://x.org/?a=1&amp;b=\'2\'"', out)
        self.assertIn('href="react.html"', out)


if __name__ == "__main__":
    unittest.main()
