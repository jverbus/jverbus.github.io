"""Compare Castle against an immutable pre-edit working-tree build.

Usage: python3 scripts/editorial-review/check_castle.py BASELINE_DIR [SITE_DIR] [--allow-shared-ui]
Only whitespace-only HTML text nodes outside pre/code/script/style are ignored.
The shared-UI mode permits page chrome and styling changes while preserving the complete
article subtree, metadata (except theme colors and the CSS cache version), and entries.
"""

import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET


ROUTE = "/2016/10/07/insight-castle-compromised-account-detection/"
VOID = set("area base br col embed hr img input link meta param source track wbr".split())
LITERAL = {"pre", "code", "script", "style"}


class Node:
    def __init__(self, tag, attrs=(), parent=None):
        self.tag, self.attrs, self.parent = tag, attrs, parent
        self.children = []

    def normalized(self, literal=False):
        literal = literal or self.tag in LITERAL
        children = []
        for child in self.children:
            if isinstance(child, Node):
                children.append(child.normalized(literal))
            elif literal or child.strip():
                children.append(child)
        return [self.tag, self.attrs, children]


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=False)
        self.root = Node("document")
        self.current = self.root
        self.nodes = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.current)
        self.current.children.append(node)
        self.nodes.append(node)
        if tag not in VOID:
            self.current = node

    def handle_endtag(self, tag):
        node = self.current
        while node.parent is not None:
            if node.tag == tag:
                self.current = node.parent
                return
            node = node.parent

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_data(self, data):
        self.current.children.append(data)

    def handle_entityref(self, name):
        self.handle_data("&" + name + ";")

    def handle_charref(self, name):
        self.handle_data("&#" + name + ";")

    def handle_comment(self, data):
        self.current.children.append(Node("comment", [("text", data)]))

    def handle_decl(self, decl):
        self.current.children.append(Node("declaration", [("text", decl)]))


def content_and_metadata(doc):
    articles = [n for n in doc.nodes if n.tag == "article" and
                "layout-post" in dict(n.attrs).get("class", "").split()]
    assert len(articles) == 1, "Expected exactly one Castle article"
    heads = [n for n in doc.nodes if n.tag == "head"]
    assert len(heads) == 1, "Expected exactly one Castle head"
    metadata = heads[0].normalized()
    for node in metadata[2]:
        if not isinstance(node, list):
            continue
        tag, attributes, _ = node
        attrs = dict(attributes)
        if tag == "meta" and attrs.get("name") == "theme-color":
            node[1] = [(key, "SHARED_THEME_COLOR" if key == "content" else value)
                       for key, value in attributes]
        elif (tag == "link" and "stylesheet" in attrs.get("rel", "").split() and
              urlsplit(attrs.get("href", "")).path == "/assets/css/modern.css"):
            node[1] = [(key, re.sub(r"([?&]v=)loop\d+(?=&|$)", r"\1SHARED_CSS_VERSION", value)
                       if key == "href" else value) for key, value in attributes]
    return articles[0].normalized(), metadata


def compare_page(old, new, allow_shared_ui=False):
    if allow_shared_ui:
        old_article, old_metadata = content_and_metadata(old)
        new_article, new_metadata = content_and_metadata(new)
        assert old_article == new_article, "Castle article changed"
        assert old_metadata == new_metadata, "Castle metadata changed"
    else:
        assert old.root.normalized() == new.root.normalized(), "Castle page changed"
        assert [n.normalized() for n in old.nodes if n.tag == "head"] == [
            n.normalized() for n in new.nodes if n.tag == "head"
        ], "Castle head metadata changed"


def castle_entries(site):
    entries = {}
    for path in sorted(site.rglob("*.html")):
        relative = str(path.relative_to(site))
        if relative == ROUTE.strip("/") + "/index.html":
            continue
        doc = Document(path.read_text())
        selected = []
        for node in doc.nodes:
            if node.tag != "a" or not dict(node.attrs).get("href", "").endswith(ROUTE):
                continue
            entry = node
            parent = node.parent
            while parent is not None:
                classes = dict(parent.attrs).get("class", "").split()
                if parent.tag == "li" or "post-list-item" in classes:
                    entry = parent
                    break
                parent = parent.parent
            if entry not in selected:
                selected.append(entry)
        if selected:
            entries[relative] = [n.normalized() for n in selected]
    for path in sorted(site.rglob("*.xml")):
        root = ET.parse(path).getroot()
        selected = []
        # RSS nests items inside channel; Atom entries and sitemap URLs are direct children.
        for node in root.iter():
            if node.tag.split("}")[-1] not in {"entry", "item", "url"}:
                continue
            if any((n.text or "").strip().endswith(ROUTE) or
                   n.attrib.get("href", "").endswith(ROUTE) for n in node.iter()):
                selected.append(ET.tostring(node, encoding="unicode"))
        if selected:
            entries[str(path.relative_to(site))] = selected
    return entries


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("baseline", type=Path)
    parser.add_argument("site", type=Path, nargs="?", default=Path("_site"))
    parser.add_argument("--allow-shared-ui", action="store_true",
                        help="Allow shared presentation changes; preserve article, metadata and entries")
    args = parser.parse_args()
    baseline, site = args.baseline, args.site
    hashes = json.loads((baseline / "castle_hashes.json").read_text())
    for path, expected in hashes.items():
        subprocess.run(["cmp", str(baseline / "source" / path), path], check=True)
        assert hashlib.sha256(Path(path).read_bytes()).hexdigest() == expected, path
    page = ROUTE.strip("/") + "/index.html"
    old = Document((baseline / "rendered" / page).read_text())
    new = Document((site / page).read_text())
    compare_page(old, new, args.allow_shared_ui)
    before, after = castle_entries(baseline / "rendered"), castle_entries(site)
    assert before == after, "Castle card/feed/index entries changed"
    scope = "complete article and metadata" if args.allow_shared_ui else "complete page/head"
    print(f"Castle preserved: source, {len(hashes) - 1} local assets, {scope}, "
          f"{sum(map(len, before.values()))} entries in {len(before)} files.")


if __name__ == "__main__":
    main()
