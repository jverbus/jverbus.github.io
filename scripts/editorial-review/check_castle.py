"""Compare Castle against an immutable pre-edit working-tree build.

Usage: python3 scripts/editorial-review/check_castle.py BASELINE_DIR [SITE_DIR]
Only whitespace-only HTML text nodes outside pre/code/script/style are ignored.
"""

import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
import sys
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
        for node in root:
            if node.tag.split("}")[-1] not in {"entry", "item", "url"}:
                continue
            if any((n.text or "").strip().endswith(ROUTE) or
                   n.attrib.get("href", "").endswith(ROUTE) for n in node.iter()):
                selected.append(ET.tostring(node, encoding="unicode"))
        if selected:
            entries[str(path.relative_to(site))] = selected
    return entries


def main():
    baseline = Path(sys.argv[1])
    site = Path(sys.argv[2] if len(sys.argv) > 2 else "_site")
    hashes = json.loads((baseline / "castle_hashes.json").read_text())
    for path, expected in hashes.items():
        subprocess.run(["cmp", str(baseline / "source" / path), path], check=True)
        assert hashlib.sha256(Path(path).read_bytes()).hexdigest() == expected, path
    page = ROUTE.strip("/") + "/index.html"
    old = Document((baseline / "rendered" / page).read_text())
    new = Document((site / page).read_text())
    assert old.root.normalized() == new.root.normalized(), "Castle page changed"
    assert [n.normalized() for n in old.nodes if n.tag == "head"] == [
        n.normalized() for n in new.nodes if n.tag == "head"
    ], "Castle head metadata changed"
    before, after = castle_entries(baseline / "rendered"), castle_entries(site)
    assert before == after, "Castle card/feed/index entries changed"
    print(f"Castle preserved: source, {len(hashes) - 1} local assets, complete page/head, "
          f"{sum(map(len, before.values()))} entries in {len(before)} files.")


if __name__ == "__main__":
    main()
