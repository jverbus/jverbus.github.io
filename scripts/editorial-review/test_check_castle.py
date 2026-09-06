"""Regression tests for Castle-specific feed and sitemap preservation.

Run: python3 scripts/editorial-review/test_check_castle.py
"""

from pathlib import Path
import tempfile
import unittest
import xml.etree.ElementTree as ET

from check_castle import ROUTE, castle_entries


CASTLE_URL = "https://jverbus.github.io" + ROUTE
OTHER_URL = "https://jverbus.github.io/2026/03/18/announcing-extended-isolation-forest-support/"
RSS = f"""<rss version="2.0"><channel><title>Site feed</title>
<item><title>Castle</title><link>{CASTLE_URL}</link>
<guid>{CASTLE_URL}</guid><description>Original Castle copy.</description>
<pubDate>Fri, 07 Oct 2016 00:00:00 +0000</pubDate></item>
<item><title>Another article</title><link>{OTHER_URL}</link>
<description>Other copy.</description><pubDate>Wed, 18 Mar 2026 00:00:00 +0000</pubDate></item>
</channel></rss>"""


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
