"""Regression tests for Castle page, metadata, feed and sitemap preservation.

Run: python3 scripts/editorial-review/test_check_castle.py
"""

from pathlib import Path
import tempfile
import unittest
import xml.etree.ElementTree as ET

from check_castle import ROUTE, Document, castle_entries, compare_page


CASTLE_URL = "https://jverbus.github.io" + ROUTE
OTHER_URL = "https://jverbus.github.io/2026/03/18/announcing-extended-isolation-forest-support/"
RSS = f"""<rss version="2.0"><channel><title>Site feed</title>
<item><title>Castle</title><link>{CASTLE_URL}</link>
<guid>{CASTLE_URL}</guid><description>Original Castle copy.</description>
<pubDate>Fri, 07 Oct 2016 00:00:00 +0000</pubDate></item>
<item><title>Another article</title><link>{OTHER_URL}</link>
<description>Other copy.</description><pubDate>Wed, 18 Mar 2026 00:00:00 +0000</pubDate></item>
</channel></rss>"""

PAGE = """<!DOCTYPE html><html><head><title>Castle</title>
<meta name="description" content="Original Castle description.">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f7f3ea">
<link rel="stylesheet" href="/assets/css/modern.css?v=loop54">
<script type="application/ld+json">{"headline":"Castle","datePublished":"2016-10-07"}</script>
</head><body><header>Videos</header><article class="unit-article layout-post">
<h1>Castle</h1><p>Original Castle copy.</p><pre><code>line one\n  line two</code></pre>
<img src="/castle.png" alt="Original figure"><aside>Original contact copy.</aside>
</article><footer>Old site tagline</footer></body></html>"""


class CastlePageTests(unittest.TestCase):
    def compare(self, after, allow_shared_ui=True):
        compare_page(Document(PAGE), Document(after), allow_shared_ui)

    def test_shared_ui_changes_are_allowed_only_in_explicit_mode(self):
        after = PAGE.replace('<body>', '<body class="academic">').replace(
            '<header>Videos</header>', '<header>Talks</header>').replace(
            'Old site tagline', 'Shared footer').replace('#f7f3ea', '#fcfcfa').replace(
            'loop54', 'loop57')
        self.compare(after)
        with self.assertRaisesRegex(AssertionError, 'Castle page changed'):
            self.compare(after, allow_shared_ui=False)

    def test_article_text_markup_code_and_credit_changes_are_rejected(self):
        for original, replacement in [
            ('Original Castle copy.', 'Rewritten Castle copy.'),
            ('<h1>Castle</h1>', '<h1>New title</h1>'),
            ('  line two', 'line two'),
            ('/castle.png', '/replacement.png'),
            ('Original figure', 'Changed figure credit'),
            ('Original contact copy.', 'Rewritten contact copy.'),
        ]:
            with self.subTest(original=original), self.assertRaisesRegex(
                    AssertionError, 'Castle article changed'):
                self.compare(PAGE.replace(original, replacement))

    def test_nonpresentation_metadata_changes_are_rejected(self):
        for original, replacement in [
            ('<title>Castle</title>', '<title>Different title</title>'),
            ('Original Castle description.', 'Changed description.'),
            ('2016-10-07', '2026-09-07'),
            ('/assets/css/modern.css', 'https://other.example/assets/css/modern.css'),
            ('(prefers-color-scheme: light)', '(prefers-color-scheme: dark)'),
        ]:
            with self.subTest(original=original), self.assertRaisesRegex(
                    AssertionError, 'Castle metadata changed'):
                self.compare(PAGE.replace(original, replacement))

    def test_required_article_and_head_cannot_be_removed(self):
        for original, replacement in [('layout-post', 'layout-page'), ('head>', 'missing-head>')]:
            with self.subTest(original=original), self.assertRaisesRegex(
                    AssertionError, 'Expected exactly one Castle'):
                self.compare(PAGE.replace(original, replacement))

    def test_metadata_elements_cannot_be_removed(self):
        with self.assertRaisesRegex(AssertionError, 'Castle metadata changed'):
            self.compare(PAGE.replace('<link rel="stylesheet" href="/assets/css/modern.css?v=loop54">', ''))


class CastleXmlTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.site = Path(self.tmp.name)

    def entries(self, filename, content):
        (self.site / filename).write_text(content)
        return castle_entries(self.site)

    def test_nested_rss_castle_item_is_selected(self):
        entries = self.entries("rss.xml", RSS)
        self.assertEqual(set(entries), {"rss.xml"})
        self.assertEqual(len(entries["rss.xml"]), 1)
        item = ET.fromstring(entries["rss.xml"][0])
        self.assertEqual(item.findtext("title"), "Castle")
        self.assertEqual(item.findtext("link"), CASTLE_URL)

    def test_rss_castle_title_description_url_and_date_changes_are_detected(self):
        before = self.entries("rss.xml", RSS)
        for field, replacement in {
            "title": "Changed Castle title",
            "description": "Changed Castle copy.",
            "link": "https://example.org/changed-castle/",
            "pubDate": "Sat, 08 Oct 2016 00:00:00 +0000",
        }.items():
            with self.subTest(field=field):
                root = ET.fromstring(RSS)
                root.find("channel/item/" + field).text = replacement
                after = self.entries("rss.xml", ET.tostring(root, encoding="unicode"))
                # The command-line checker rejects this same before/after comparison.
                self.assertNotEqual(before, after)

    def test_other_rss_item_and_channel_changes_are_ignored(self):
        before = self.entries("rss.xml", RSS)
        root = ET.fromstring(RSS)
        root.find("channel/title").text = "Updated site title"
        ET.SubElement(root.find("channel"), "lastBuildDate").text = "New build time"
        other = root.findall("channel/item")[1]
        for field in ["title", "description", "link", "pubDate"]:
            other.find(field).text = "Changed other article " + field
        after = self.entries("rss.xml", ET.tostring(root, encoding="unicode"))
        self.assertEqual(before, after)

    def test_atom_entry_selection_and_change_detection(self):
        atom = f"""<feed xmlns="http://www.w3.org/2005/Atom">
<entry><title>Castle</title><link href="{CASTLE_URL}"/>
<updated>2016-10-07T00:00:00Z</updated></entry>
<entry><title>Other</title><link href="{OTHER_URL}"/></entry></feed>"""
        before = self.entries("feed.xml", atom)
        self.assertEqual(len(before["feed.xml"]), 1)
        self.assertEqual(before, self.entries("feed.xml", atom.replace(">Other<", ">Updated other<")))
        self.assertNotEqual(before, self.entries("feed.xml", atom.replace(">Castle<", ">Changed Castle<")))

    def test_sitemap_url_selection_and_change_detection(self):
        sitemap = f"""<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>{CASTLE_URL}</loc><lastmod>2016-10-07</lastmod></url>
<url><loc>{OTHER_URL}</loc><lastmod>2026-03-18</lastmod></url></urlset>"""
        before = self.entries("sitemap.xml", sitemap)
        self.assertEqual(len(before["sitemap.xml"]), 1)
        self.assertEqual(before, self.entries("sitemap.xml", sitemap.replace("2026-03-18", "2026-09-06")))
        self.assertNotEqual(before, self.entries("sitemap.xml", sitemap.replace("2016-10-07", "2016-10-08")))


if __name__ == "__main__":
    unittest.main()
