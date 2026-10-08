"""The live (old-style) pages must link to the new explainer pages until phase 2 replaces them."""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "docs" / "scripts"))
import build  # noqa: E402


def find(slug):
    for c in build.CATEGORIES:
        for i, p in enumerate(c.papers):
            if p.slug == slug:
                return c, p, (c.papers[i - 1] if i else None, c.papers[i + 1] if i + 1 < len(c.papers) else None)
    raise KeyError(slug)


class EntryLinkTest(unittest.TestCase):
    def test_home_links_to_explainer_and_sample(self):
        zh = build.render_home("zh")
        self.assertIn('href="explain/autoresearch.html"', zh)
        self.assertIn('href="../sample/index.html"', zh)
        en = build.render_home("en")
        self.assertIn('href="../zh/explain/autoresearch.html"', en)

    def test_article_with_explainer_links_to_it(self):
        c, p, nav = find("autoresearch")
        self.assertIn('href="../explain/autoresearch.html"', build.render_article("zh", c, p, nav))
        self.assertIn('href="../../zh/explain/autoresearch.html"', build.render_article("en", c, p, nav))

    def test_article_without_explainer_has_no_link(self):
        c, p, nav = find("lora")
        self.assertNotIn("explain/", build.render_article("zh", c, p, nav))


if __name__ == "__main__":
    unittest.main()
