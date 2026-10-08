"""Extract the plain text of an article body from a rendered article page.

Used by check_articles_unchanged.py to prove the site redesign never alters
the original translated text.
"""

from __future__ import annotations

from html.parser import HTMLParser


class _ArticleText(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.depth = 0  # >0 while inside <article class="article-body">
        self.found = False
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "article":
            return
        if self.depth:
            self.depth += 1
            return
        classes = (dict(attrs).get("class") or "").split()
        if "article-body" in classes and not self.found:
            self.depth = 1
            self.found = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "article" and self.depth:
            self.depth -= 1

    def handle_data(self, data: str) -> None:
        if self.depth:
            self.parts.append(data)


def extract_article_text(page_html: str) -> str:
    parser = _ArticleText()
    parser.feed(page_html)
    parser.close()
    if not parser.found:
        raise ValueError('no <article class="article-body"> in page')
    return " ".join(" ".join(parser.parts).split())
