#!/usr/bin/env python3
"""Validate generated Jekyll output.

Checks intended to run after `bundle exec jekyll build`:
- no sitemap URLs point at pages with `robots: noindex`
- Atom/RSS entries do not have blank summaries/descriptions
- source/tooling artifacts are not copied into `_site`
- local `href`/`src` links in generated HTML resolve inside `_site`
- local Open Graph images exist and match declared dimensions
"""

from __future__ import annotations

import argparse
import html
import re
import struct
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

LOCAL_HOSTS = {"jverbus.github.io"}
BLOCKED_ARTIFACTS = (
    "Gemfile",
    "Gemfile.lock",
    "Rakefile",
    "README.md",
    "scripts",
    "vendor",
    ".bundle",
)
SOF_MARKERS = {
    0xC0,
    0xC1,
    0xC2,
    0xC3,
    0xC5,
    0xC6,
    0xC7,
    0xC9,
    0xCA,
    0xCB,
    0xCD,
    0xCE,
    0xCF,
}


@dataclass
class OgImage:
    url: str
    width: str | None = None
    height: str | None = None


class GeneratedHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.local_refs: list[str] = []
        self.robots: list[str] = []
        self.og_images: list[OgImage] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_by_name = {name.lower(): value or "" for name, value in attrs}

        for attr_name in ("href", "src"):
            value = attrs_by_name.get(attr_name, "").strip()
            if value:
                self.local_refs.append(value)

        if tag.lower() != "meta":
            return

        content = attrs_by_name.get("content", "").strip()
        name = attrs_by_name.get("name", "").lower()
        prop = attrs_by_name.get("property", "").lower()

        if name == "robots":
            self.robots.append(content)
        elif prop in {"og:image", "og:image:secure_url"} and content:
            self.og_images.append(OgImage(url=content))
        elif prop == "og:image:width" and self.og_images:
            self.og_images[-1].width = content
        elif prop == "og:image:height" and self.og_images:
            self.og_images[-1].height = content


def rel(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def parse_html(path: Path) -> GeneratedHTMLParser:
    parser = GeneratedHTMLParser()
    parser.feed(path.read_text(encoding="utf-8", errors="ignore"))
    return parser


def is_noindex(parser: GeneratedHTMLParser) -> bool:
    return any(re.search(r"\bnoindex\b", robots.lower()) for robots in parser.robots)


def is_external_url(value: str, local_hosts: set[str]) -> bool:
    parts = urlsplit(html.unescape(value).strip())
    if parts.scheme in {"mailto", "tel", "javascript", "data"}:
        return True
    if parts.netloc and parts.netloc.lower() not in local_hosts:
        return True
    if parts.scheme and parts.scheme not in {"http", "https"}:
        return True
    if parts.scheme in {"http", "https"} and parts.netloc.lower() not in local_hosts:
        return True
    return False


def resolve_site_candidates(
    site_dir: Path,
    source_file: Path,
    raw_url: str,
    local_hosts: set[str],
) -> list[Path]:
    value = html.unescape(raw_url).strip()
    if not value or value.startswith("#") or is_external_url(value, local_hosts):
        return []

    parts = urlsplit(value)
    path = unquote(parts.path)
    if not path:
        return []

    if path.startswith("/"):
        target = site_dir / path.lstrip("/")
    else:
        target = source_file.parent / path

    site_root = site_dir.resolve()
    target = target.resolve()
    try:
        target.relative_to(site_root)
    except ValueError:
        return [target]

    if path.endswith("/"):
        return [target / "index.html"]

    if target.suffix:
        return [target]

    return [target, target / "index.html", target.with_suffix(".html")]


def first_existing_file(candidates: list[Path]) -> Path | None:
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


def image_dimensions(path: Path) -> tuple[int, int] | None:
    data = path.read_bytes()

    if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 24:
        return struct.unpack(">II", data[16:24])

    if not data.startswith(b"\xff\xd8"):
        return None

    i = 2
    while i < len(data):
        while i < len(data) and data[i] != 0xFF:
            i += 1
        while i < len(data) and data[i] == 0xFF:
            i += 1
        if i >= len(data):
            break

        marker = data[i]
        i += 1

        if marker == 0xD9 or 0xD0 <= marker <= 0xD7 or marker == 0x01:
            continue
        if i + 2 > len(data):
            break

        segment_length = int.from_bytes(data[i : i + 2], "big")
        if segment_length < 2:
            break

        segment_start = i + 2
        if marker in SOF_MARKERS and segment_start + 5 <= len(data):
            height = int.from_bytes(data[segment_start + 1 : segment_start + 3], "big")
            width = int.from_bytes(data[segment_start + 3 : segment_start + 5], "big")
            return width, height

        i += segment_length

    return None


def check_blocked_artifacts(site_dir: Path) -> list[str]:
    errors: list[str] = []
    for artifact in BLOCKED_ARTIFACTS:
        path = site_dir / artifact
        if path.exists():
            errors.append(f"{artifact} should not be present in generated output")
    return errors


def check_feed_entries(site_dir: Path) -> list[str]:
    errors: list[str] = []

    rss_path = site_dir / "rss.xml"
    if not rss_path.exists():
        errors.append("rss.xml is missing")
    else:
        root = ET.parse(rss_path).getroot()
        for index, item in enumerate(root.findall("./channel/item"), start=1):
            title = (item.findtext("title") or f"item {index}").strip()
            description = (item.findtext("description") or "").strip()
            if not description:
                errors.append(f"rss.xml: `{title}` has an empty description")

    atom_path = site_dir / "atom.xml"
    if not atom_path.exists():
        errors.append("atom.xml is missing")
    else:
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        root = ET.parse(atom_path).getroot()
        for index, entry in enumerate(root.findall("atom:entry", ns), start=1):
            title = (entry.findtext("atom:title", default=f"entry {index}", namespaces=ns) or "").strip()
            summary = (entry.findtext("atom:summary", default="", namespaces=ns) or "").strip()
            if not summary:
                errors.append(f"atom.xml: `{title}` has an empty summary")

    return errors


def sitemap_locs(sitemap_path: Path) -> list[str]:
    root = ET.parse(sitemap_path).getroot()
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locs = [loc.text.strip() for loc in root.findall(".//sm:loc", ns) if loc.text and loc.text.strip()]
    if locs:
        return locs
    return [loc.text.strip() for loc in root.findall(".//loc") if loc.text and loc.text.strip()]


def check_sitemap_noindex(site_dir: Path, local_hosts: set[str]) -> list[str]:
    errors: list[str] = []
    sitemap_path = site_dir / "sitemap.xml"
    if not sitemap_path.exists():
        return ["sitemap.xml is missing"]

    placeholder_source = site_dir / "index.html"
    for loc in sitemap_locs(sitemap_path):
        candidates = resolve_site_candidates(site_dir, placeholder_source, loc, local_hosts)
        page_path = first_existing_file([candidate for candidate in candidates if candidate.suffix == ".html"])
        if not page_path:
            continue

        parser = parse_html(page_path)
        if is_noindex(parser):
            errors.append(f"sitemap.xml includes noindex page: {loc}")

    return errors


def check_internal_links(site_dir: Path, local_hosts: set[str]) -> list[str]:
    errors: list[str] = []
    for html_path in sorted(site_dir.rglob("*.html")):
        parser = parse_html(html_path)
        for ref in parser.local_refs:
            candidates = resolve_site_candidates(site_dir, html_path, ref, local_hosts)
            if not candidates or first_existing_file(candidates):
                continue
            errors.append(f"{rel(html_path, site_dir)} references missing local URL: {ref}")
    return errors


def parse_positive_int(value: str | None) -> int | None:
    if value is None or not re.fullmatch(r"[1-9]\d*", value):
        return None
    return int(value)


def check_og_images(site_dir: Path, local_hosts: set[str]) -> list[str]:
    errors: list[str] = []
    for html_path in sorted(site_dir.rglob("*.html")):
        parser = parse_html(html_path)
        for og_image in parser.og_images:
            candidates = resolve_site_candidates(site_dir, html_path, og_image.url, local_hosts)
            if not candidates:
                continue

            image_path = first_existing_file(candidates)
            if not image_path:
                errors.append(f"{rel(html_path, site_dir)} has missing local og:image: {og_image.url}")
                continue

            declared_width = parse_positive_int(og_image.width)
            declared_height = parse_positive_int(og_image.height)
            if declared_width is None or declared_height is None:
                errors.append(f"{rel(html_path, site_dir)} local og:image is missing valid width/height")
                continue

            actual = image_dimensions(image_path)
            if actual is None:
                errors.append(f"{rel(html_path, site_dir)} local og:image dimensions could not be read: {og_image.url}")
                continue

            if actual != (declared_width, declared_height):
                errors.append(
                    f"{rel(html_path, site_dir)} local og:image dimensions mismatch for {og_image.url}: "
                    f"declared {declared_width}x{declared_height}, actual {actual[0]}x{actual[1]}"
                )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate generated Jekyll site output")
    parser.add_argument("site_dir", nargs="?", default="_site", help="Generated site directory (default: _site)")
    parser.add_argument(
        "--local-host",
        action="append",
        default=[],
        help="Host to treat as local when validating absolute URLs. Can be provided multiple times.",
    )
    args = parser.parse_args()

    site_dir = Path(args.site_dir)
    if not site_dir.exists():
        print(f"Site directory not found: {site_dir}", file=sys.stderr)
        return 1

    local_hosts = {host.lower() for host in LOCAL_HOSTS.union(args.local_host)}

    errors: list[str] = []
    errors.extend(check_blocked_artifacts(site_dir))
    errors.extend(check_feed_entries(site_dir))
    errors.extend(check_sitemap_noindex(site_dir, local_hosts))
    errors.extend(check_internal_links(site_dir, local_hosts))
    errors.extend(check_og_images(site_dir, local_hosts))

    if errors:
        print("Generated site validation failed:\n", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("Generated site validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
