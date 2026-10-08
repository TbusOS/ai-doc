import html as h
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "docs" / "scripts"))
from explain_build import render_explain  # noqa: E402


class RenderTest(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / "explain-src/autoresearch/zh.json").read_text(encoding="utf-8"))
        self.html = render_explain(self.data)

    def test_all_scene_copy_in_html(self):
        for sc in self.data["scenes"]:
            for key in ("title", "lead"):
                self.assertIn(h.escape(sc[key]), self.html)
            for p in sc["body"]:
                self.assertIn(h.escape(p), self.html)
            for c in sc["claims"]:
                self.assertIn(h.escape(c["text"]), self.html)
                if c["tag"] == "原文":
                    self.assertIn(h.escape(c["quote"]), self.html)

    def test_transcript_has_every_caption(self):
        start = self.html.index('class="stage-transcript"')
        block = self.html[start:self.html.index("</details>", start)]
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
            self.assertIn(h.escape(ch["title"]), self.html)
        self.assertIn(self.data["paper"]["original_page"], self.html)

    def test_chapter_without_scene_is_disabled(self):
        used = {sc["chapter"] for sc in self.data["scenes"]}
        empty = [ch for ch in self.data["chapters"] if ch["id"] not in used]
        if empty:
            self.assertIn('aria-disabled="true"', self.html)

    def test_data_embedded_and_scripts_ordered(self):
        self.assertIn('id="explain-data"', self.html)
        i_t = self.html.index("timeline.js")
        i_e = self.html.index("engine.js")
        self.assertLess(i_t, i_e)
        for sc in self.data["scenes"]:
            self.assertGreater(self.html.index(f"{sc['widget']}.js"), i_e)

    def test_no_script_closing_in_embedded_json(self):
        start = self.html.index('id="explain-data"')
        blob = self.html[start:self.html.index("</script>", start)]
        self.assertNotIn("</", blob)


if __name__ == "__main__":
    unittest.main()
