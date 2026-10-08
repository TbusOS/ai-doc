import html as h
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "docs" / "scripts"))
from explain_build import load_explainer, render_explain  # noqa: E402
from explain_render import render_annotated_scene  # noqa: E402


class RenderTest(unittest.TestCase):
    def setUp(self):
        self.data = load_explainer(ROOT / "explain-src/autoresearch")
        self.html = render_explain(self.data)

    def test_all_scene_copy_in_html(self):
        for sc in self.data["scenes"]:
            for key in ("title", "lead"):
                self.assertIn(h.escape(sc[key]), self.html)
            for p in sc.get("body", []):
                self.assertIn(h.escape(p), self.html)
            for c in sc.get("claims", []):
                self.assertIn(h.escape(c["text"]), self.html)
                if c["tag"] == "原文":
                    self.assertIn(h.escape(c["quote"]), self.html)

    def test_transcript_has_every_caption(self):
        # every scene has its own transcript; look in all of them
        blocks, start = [], self.html.find('class="stage-transcript"')
        while start != -1:
            blocks.append(self.html[start:self.html.index("</details>", start)])
            start = self.html.find('class="stage-transcript"', start + 1)
        block = "\n".join(blocks)
        for sc in self.data["scenes"]:
            texts = [st["caption"] for st in sc.get("stations", {}).values()]
            texts += list(sc.get("special", {}).values())
            texts += list(sc.get("verdicts", {}).values()) + list(sc.get("actions", {}).values())
            for t in texts:
                t = t.replace("{bpb}", "这轮的分数").replace("{best}", "目前最好的分数")
                self.assertIn(h.escape(t), block)

    def test_source_heading_does_not_overclaim(self):
        self.assertNotIn("每句话", self.html)

    def test_toggle_rendered_with_option(self):
        for sc in self.data["scenes"]:
            if sc.get("toggle"):
                self.assertIn(f'data-option="{sc["toggle"]["option"]}"', self.html)
                self.assertIn(h.escape(sc["toggle"]["label"]), self.html)

    def test_chapters_and_original_link(self):
        for ch in self.data["chapters"]:
            if ch.get("nav") is not False:  # the five questions are always listed in the nav
                self.assertIn(h.escape(ch["title"]), self.html)
        self.assertIn(self.data["paper"]["original_page"], self.html)

    def test_chapter_without_scene_is_disabled(self):
        used = {sc["chapter"] for sc in self.data["scenes"]}
        # chapters with nav: false (opening, limits, quiz) are not in the chapter nav
        empty = [ch for ch in self.data["chapters"] if ch.get("nav", True) and ch["id"] not in used]
        if empty:
            self.assertIn('aria-disabled="true"', self.html)

    def test_data_embedded_and_scripts_ordered(self):
        self.assertIn('id="explain-data"', self.html)
        i_t = self.html.index("timeline.js")
        i_e = self.html.index("engine.js")
        self.assertLess(i_t, i_e)
        for sc in self.data["scenes"]:
            if "widget" not in sc:  # static scenes (annotated, quiz) have no script
                continue
            # match the script path, not copy such as "data/progress.json"
            self.assertGreater(self.html.index(f"/{sc['widget']}.js\""), i_e)

    def test_no_script_closing_in_embedded_json(self):
        start = self.html.index('id="explain-data"')
        blob = self.html[start:self.html.index("</script>", start)]
        self.assertNotIn("</", blob)


if __name__ == "__main__":
    unittest.main()


class AnnotatedTest(unittest.TestCase):
    """program.md paragraph by paragraph: groups, inline code, highlighted key words."""

    def render(self, pairs):
        scene = {"id": "annotated", "type": "annotated", "title": "t", "lead": "l", "pairs": pairs}
        return render_annotated_scene(scene, "x.html", "src")

    def test_group_heading_once_per_group_in_order(self):
        html = self.render([
            {"quote": "a", "source": "program.md", "note": "n1", "group": "Setup", "group_zh": "准备"},
            {"quote": "b", "source": "program.md", "note": "n2", "group": "Setup", "group_zh": "准备"},
            {"quote": "c", "source": "program.md", "note": "n3", "group": "The experiment loop", "group_zh": "实验循环"},
        ])
        self.assertEqual(html.count('class="ann-group"'), 2)
        self.assertLess(html.index("## Setup"), html.index("## The experiment loop"))
        self.assertIn("准备", html)

    def test_backticks_become_code(self):
        html = self.render([{"quote": "Modify `train.py` now", "source": "p", "note": "n"}])
        self.assertIn("Modify <code>train.py</code> now", html)
        self.assertNotIn("`", html)

    def test_mark_highlights_first_match_only(self):
        html = self.render([{"quote": "fixed time, fixed size", "source": "p", "note": "n", "mark": "fixed"}])
        self.assertEqual(html.count("<mark>"), 1)
        self.assertIn("<mark>fixed</mark> time", html)

    def test_mark_inside_code(self):
        html = self.render([{"quote": "Modify `prepare.py`. It is read-only.", "source": "p", "note": "n", "mark": "read-only"}])
        self.assertIn("<mark>read-only</mark>", html)

    def test_mark_not_in_quote_fails_the_build(self):
        # a typo in "mark" must not silently drop the highlight
        with self.assertRaises(ValueError):
            self.render([{"quote": "abc", "source": "p", "note": "n", "mark": "xyz"}])

    def test_quote_is_escaped(self):
        html = self.render([{"quote": "a < b & c", "source": "p", "note": "n"}])
        self.assertIn("a &lt; b &amp; c", html)

