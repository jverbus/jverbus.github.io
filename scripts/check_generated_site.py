#!/usr/bin/env python3
"""Validate generated Jekyll output.

Checks intended to run after `bundle exec jekyll build`:
- substantive HTML pages are indexable, self-canonical, and present in the sitemap
- intentional noindex pages and legacy redirects stay out of the sitemap
- production canonicals and sitemap URLs use the configured HTTPS origin
- Atom/RSS entries do not have blank summaries/descriptions
- source/tooling artifacts are not copied into `_site`
- local `href`/`src` links in generated HTML resolve inside `_site`
- substantive pages are reachable through ordinary HTML links
- internal links do not point through legacy redirects
- local Open Graph images exist and match declared dimensions
"""

from __future__ import annotations

import argparse
import html
import re
import struct
import sys
import xml.etree.ElementTree as ET
from collections import deque
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit

SITE_ORIGIN = "https://jverbus.github.io"
LOCAL_HOSTS = {urlsplit(SITE_ORIGIN).netloc}
REQUIRED_INDEXABLE_PATHS = {
    "/",
    "/open-source/",
    "/open-source/isolation-forest/",
    "/posts/",
    "/publications/",
    "/videos/",
}
INTENTIONAL_NOINDEX_PATHS = {
    "/404.html",
    "/archive/",
    "/categories/",
    "/tags/",
}
LEGACY_REDIRECTS = {
    "/about/": "/",
    "/about.html": "/",
    "/archive.html": "/posts/",
    "/categories.html": "/categories/",
    "/publications.html": "/publications/",
    "/tags.html": "/tags/",
    "/2025/08/07/berkeley-agentic-ai-summit-2025/": "/posts/",
    "/ai%20and%20machine%20learning/2016/10/07/insight-castle-compromised-account-detection.html": (
        "/2016/10/07/insight-castle-compromised-account-detection/"
    ),
    "/ai%20and%20machine%20learning/2019/08/13/open-source-isolation-forest-spark-scala.html": (
        "/2019/08/13/open-source-isolation-forest-spark-scala/"
    ),
    "/ai%20and%20machine%20learning/2021/09/02/using-deep-learning-to-detect-abusive-sequences-of-member-activity.html": (
        "/2021/09/02/using-deep-learning-to-detect-abusive-sequences-of-member-activity/"
    ),
    "/ai%20and%20machine%20learning/2023/06/20/detecting-ai-generated-profile-photos.html": (
        "/2023/06/20/detecting-ai-generated-profile-photos/"
    ),
    "/ai%20and%20machine%20learning/2024/08/15/finding-ai-generated-faces-in-the-wild.html": (
        "/2024/08/15/finding-ai-generated-faces-in-the-wild/"
    ),
    "/ai%20and%20machine%20learning/2024/09/23/announcing-onnx-support-in-isolation-forest.html": (
        "/2024/09/23/announcing-onnx-support-in-isolation-forest/"
    ),
    "/ai%20and%20machine%20learning/2025/02/10/brown-physics-ai-winter-school-workshop.html": (
        "/2025/02/10/brown-physics-ai-winter-school-workshop/"
    ),
    "/ai%20and%20machine%20learning/2025/08/07/berkeley-agentic-ai-summit-2025.html": "/posts/",
    "/ai%20and%20machine%20learning/2026/01/09/brown-physics-ai-winter-school-workshop.html": (
        "/2026/01/09/brown-physics-ai-winter-school-workshop/"
    ),
    "/data%20science%20projects/2016/10/07/insight-castle-compromised-account-detection.html": (
        "/2016/10/07/insight-castle-compromised-account-detection/"
    ),
    "/data%20science%20projects/2019/08/13/open-source-isolation-forest-spark-scala.html": (
        "/2019/08/13/open-source-isolation-forest-spark-scala/"
    ),
    "/data%20science%20projects/2021/09/02/using-deep-learning-to-detect-abusive-sequences-of-member-activity.html": (
        "/2021/09/02/using-deep-learning-to-detect-abusive-sequences-of-member-activity/"
    ),
    "/data%20science%20projects/2016/10/07/insight-castle-compromised-account-detection/": (
        "/2016/10/07/insight-castle-compromised-account-detection/"
    ),
    "/ph.d.%20thesis/2016/08/18/calibrating-the-lux-dark-matter-experiment.html": (
        "/2016/08/18/calibrating-the-lux-dark-matter-experiment/"
    ),
    "/ph.d.%20thesis%20work/2016/08/18/calibrating-the-lux-dark-matter-experiment.html": (
        "/2016/08/18/calibrating-the-lux-dark-matter-experiment/"
    ),
}
NON_PAGE_HTML_PATHS = {"/googlec15fb936e51d8bcb.html"}
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
        self.anchor_refs: list[str] = []
        self.canonicals: list[str] = []
        self.refreshes: list[str] = []
        self.robots: list[str] = []
        self.ids: set[str] = set()
        self.og_images: list[OgImage] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_by_name = {name.lower(): value or "" for name, value in attrs}

        tag_name = tag.lower()

        for attr_name in ("href", "src"):
            value = attrs_by_name.get(attr_name, "").strip()
            if value:
                self.local_refs.append(value)

        element_id = attrs_by_name.get("id", "").strip()
        if element_id:
            self.ids.add(element_id)
        if tag_name == "a":
            anchor_name = attrs_by_name.get("name", "").strip()
            if anchor_name:
                self.ids.add(anchor_name)
            href = attrs_by_name.get("href", "").strip()
            if href:
                self.anchor_refs.append(href)

        if tag_name == "link":
            rel_tokens = {token.lower() for token in attrs_by_name.get("rel", "").split()}
            href = attrs_by_name.get("href", "").strip()
            if "canonical" in rel_tokens and href:
                self.canonicals.append(href)

        if tag_name != "meta":
            return

        content = attrs_by_name.get("content", "").strip()
        name = attrs_by_name.get("name", "").lower()
        prop = attrs_by_name.get("property", "").lower()
        http_equiv = attrs_by_name.get("http-equiv", "").lower()

        if name in {"robots", "googlebot"}:
            self.robots.append(content)
        elif http_equiv == "refresh" and content:
            self.refreshes.append(content)
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


def robots_tokens(parser: GeneratedHTMLParser) -> set[str]:
    return {
        token
        for directive in parser.robots
        for token in re.split(r"[\s,]+", directive.lower())
        if token
    }


def is_noindex(parser: GeneratedHTMLParser) -> bool:
    return bool(robots_tokens(parser).intersection({"noindex", "none"}))


def is_nofollow(parser: GeneratedHTMLParser) -> bool:
    return bool(robots_tokens(parser).intersection({"nofollow", "none"}))


def normalize_url_path(path: str) -> str:
    return quote(unquote(path or "/"), safe="/")


def html_route(path: Path, site_dir: Path) -> str:
    relative = path.resolve().relative_to(site_dir.resolve()).as_posix()
    if relative == "index.html":
        route = "/"
    elif relative.endswith("/index.html"):
        route = f"/{relative[:-len('index.html')]}"
    else:
        route = f"/{relative}"
    return quote(route, safe="/")


def html_inventory(site_dir: Path) -> tuple[dict[str, Path], list[str]]:
    pages: dict[str, Path] = {}
    errors: list[str] = []
    for path in sorted(site_dir.rglob("*.html")):
        route = html_route(path, site_dir)
        if route in pages:
            errors.append(
                f"generated HTML routes collide at {route}: {rel(pages[route], site_dir)} and {rel(path, site_dir)}"
            )
        else:
            pages[route] = path
    return pages, errors


def validate_site_url(
    value: str,
    *,
    context: str,
    require_absolute: bool,
) -> tuple[str | None, list[str]]:
    errors: list[str] = []
    parts = urlsplit(html.unescape(value).strip())
    expected = urlsplit(SITE_ORIGIN)
    is_absolute = bool(parts.scheme or parts.netloc)

    if is_absolute:
        if parts.scheme.lower() != expected.scheme or parts.netloc.lower() != expected.netloc:
            errors.append(f"{context} must use {SITE_ORIGIN}: {value}")
        if not parts.path:
            errors.append(f"{context} must include the homepage trailing slash: {value}")
    elif require_absolute:
        errors.append(f"{context} must be an absolute {SITE_ORIGIN} URL: {value}")
    elif not parts.path.startswith("/"):
        errors.append(f"{context} must be root-relative or use {SITE_ORIGIN}: {value}")

    if parts.query:
        errors.append(f"{context} must not contain a query string: {value}")
    if parts.fragment:
        errors.append(f"{context} must not contain a fragment: {value}")

    return normalize_url_path(parts.path), errors


def refresh_target(value: str) -> str | None:
    match = re.fullmatch(r"\s*0(?:\.0+)?\s*;\s*url\s*=\s*(.+?)\s*", value, flags=re.IGNORECASE)
    if not match:
        return None
    return match.group(1).strip().strip("\"'")


def is_within(path: Path, root: Path) -> bool:
    try:
        path.resolve().relative_to(root.resolve())
        return True
    except ValueError:
        return False


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


def check_exact_site_url(
    values: list[str],
    *,
    expected_path: str,
    context: str,
    require_absolute: bool,
) -> list[str]:
    errors: list[str] = []
    if len(values) != 1:
        return [f"{context} must appear exactly once (found {len(values)})"]

    actual_path, url_errors = validate_site_url(
        values[0],
        context=context,
        require_absolute=require_absolute,
    )
    errors.extend(url_errors)
    if actual_path is not None and actual_path != expected_path:
        errors.append(f"{context} points to {actual_path}, expected {expected_path}")
    return errors


def check_following_noindex(parser: GeneratedHTMLParser, route: str) -> list[str]:
    errors: list[str] = []
    tokens = robots_tokens(parser)
    if not is_noindex(parser):
        errors.append(f"{route} must have a noindex robots directive")
    if is_nofollow(parser) or "follow" not in tokens:
        errors.append(f"{route} must use noindex, follow")
    return errors


def check_indexability(site_dir: Path, require_absolute: bool) -> list[str]:
    pages, errors = html_inventory(site_dir)
    known_exclusions = INTENTIONAL_NOINDEX_PATHS.union(LEGACY_REDIRECTS).union(NON_PAGE_HTML_PATHS)
    expected_indexable = set(pages).difference(known_exclusions)

    for route in sorted(REQUIRED_INDEXABLE_PATHS.difference(expected_indexable)):
        errors.append(f"required indexable page is missing: {route}")
    for route in sorted(known_exclusions.difference(pages)):
        errors.append(f"classified generated page is missing: {route}")

    sitemap_path = site_dir / "sitemap.xml"
    sitemap_paths: set[str] = set()
    if not sitemap_path.exists():
        errors.append("sitemap.xml is missing")
    else:
        try:
            locs = sitemap_locs(sitemap_path)
        except ET.ParseError as exc:
            errors.append(f"sitemap.xml is not valid XML: {exc}")
            locs = []

        for loc in locs:
            route, url_errors = validate_site_url(
                loc,
                context="sitemap.xml loc",
                require_absolute=require_absolute,
            )
            errors.extend(url_errors)
            if route is None:
                continue
            if route in sitemap_paths:
                errors.append(f"sitemap.xml contains duplicate URL: {route}")
            sitemap_paths.add(route)

    for route in sorted(expected_indexable.difference(sitemap_paths)):
        errors.append(f"sitemap.xml is missing indexable page: {route}")
    for route in sorted(sitemap_paths.difference(expected_indexable)):
        errors.append(f"sitemap.xml contains excluded or nonexistent page: {route}")

    parsed_pages = {route: parse_html(path) for route, path in pages.items() if route not in NON_PAGE_HTML_PATHS}
    for route, parser in parsed_pages.items():
        if route in LEGACY_REDIRECTS:
            target = LEGACY_REDIRECTS[route]
            errors.extend(check_following_noindex(parser, route))
            errors.extend(
                check_exact_site_url(
                    parser.canonicals,
                    expected_path=target,
                    context=f"{route} canonical",
                    require_absolute=require_absolute,
                )
            )

            if len(parser.refreshes) != 1:
                errors.append(f"{route} must have exactly one meta refresh (found {len(parser.refreshes)})")
            else:
                refresh_url = refresh_target(parser.refreshes[0])
                if refresh_url is None:
                    errors.append(f"{route} has an invalid meta refresh: {parser.refreshes[0]}")
                else:
                    errors.extend(
                        check_exact_site_url(
                            [refresh_url],
                            expected_path=target,
                            context=f"{route} meta refresh",
                            require_absolute=require_absolute,
                        )
                    )

            fallback_paths: set[str] = set()
            for ref in parser.anchor_refs:
                if is_external_url(ref, LOCAL_HOSTS):
                    continue
                fallback_path, fallback_errors = validate_site_url(
                    ref,
                    context=f"{route} fallback link",
                    require_absolute=False,
                )
                if fallback_path is not None and not fallback_errors:
                    fallback_paths.add(fallback_path)
            if target not in fallback_paths:
                errors.append(f"{route} must link directly to its redirect destination {target}")
            continue

        expected_canonical = route
        errors.extend(
            check_exact_site_url(
                parser.canonicals,
                expected_path=expected_canonical,
                context=f"{route} canonical",
                require_absolute=require_absolute,
            )
        )

        if route in INTENTIONAL_NOINDEX_PATHS:
            errors.extend(check_following_noindex(parser, route))
        else:
            if not parser.robots:
                errors.append(f"{route} is missing a robots directive")
            if is_noindex(parser):
                errors.append(f"indexable page has noindex: {route}")
            if is_nofollow(parser):
                errors.append(f"indexable page has nofollow: {route}")

    for route, target in sorted(LEGACY_REDIRECTS.items()):
        if target not in pages:
            errors.append(f"{route} redirects to missing generated page: {target}")
        elif target in LEGACY_REDIRECTS:
            errors.append(f"{route} creates a redirect chain through {target}")

    return errors


def check_internal_links(site_dir: Path, local_hosts: set[str]) -> list[str]:
    errors: list[str] = []
    _, inventory_errors = html_inventory(site_dir)
    errors.extend(inventory_errors)
    parsed_by_path: dict[Path, GeneratedHTMLParser] = {}

    for html_path in sorted(site_dir.rglob("*.html")):
        parser = parse_html(html_path)
        parsed_by_path[html_path.resolve()] = parser
        for ref in parser.local_refs:
            candidates = resolve_site_candidates(site_dir, html_path, ref, local_hosts)
            if not candidates:
                continue
            if any(not is_within(candidate, site_dir) for candidate in candidates):
                errors.append(f"{rel(html_path, site_dir)} references URL outside generated site: {ref}")
                continue
            if not first_existing_file(candidates):
                errors.append(f"{rel(html_path, site_dir)} references missing local URL: {ref}")

        for ref in parser.anchor_refs:
            value = html.unescape(ref).strip()
            if not value or is_external_url(value, local_hosts):
                continue
            parts = urlsplit(value)
            candidates = resolve_site_candidates(site_dir, html_path, value, local_hosts)
            target_path = html_path if not parts.path else first_existing_file(candidates)
            if not target_path or target_path.suffix != ".html":
                continue

            target_route = html_route(target_path, site_dir)
            if target_route in LEGACY_REDIRECTS:
                errors.append(
                    f"{rel(html_path, site_dir)} links through legacy redirect {ref}; "
                    f"link directly to {LEGACY_REDIRECTS[target_route]}"
                )

            fragment = unquote(parts.fragment)
            if fragment:
                target_parser = parsed_by_path.get(target_path.resolve())
                if target_parser is None:
                    target_parser = parse_html(target_path)
                    parsed_by_path[target_path.resolve()] = target_parser
                if fragment not in target_parser.ids:
                    errors.append(
                        f"{rel(html_path, site_dir)} references missing fragment #{fragment} in "
                        f"{rel(target_path, site_dir)}"
                    )
    return errors


def check_indexable_reachability(site_dir: Path, local_hosts: set[str]) -> list[str]:
    pages, errors = html_inventory(site_dir)
    excluded = INTENTIONAL_NOINDEX_PATHS.union(LEGACY_REDIRECTS).union(NON_PAGE_HTML_PATHS)
    indexable = set(pages).difference(excluded)
    if "/" not in indexable:
        return errors + ["homepage is missing from the indexable page graph"]

    graph: dict[str, set[str]] = {route: set() for route in indexable}
    for route in sorted(indexable):
        parser = parse_html(pages[route])
        for ref in parser.anchor_refs:
            candidates = resolve_site_candidates(site_dir, pages[route], ref, local_hosts)
            target_path = first_existing_file(candidates)
            if not target_path or not is_within(target_path, site_dir) or target_path.suffix != ".html":
                continue
            target_route = html_route(target_path, site_dir)
            if target_route in indexable:
                graph[route].add(target_route)

    reachable = {"/"}
    queue = deque(["/"])
    while queue:
        route = queue.popleft()
        for target in graph[route].difference(reachable):
            reachable.add(target)
            queue.append(target)

    for route in sorted(indexable.difference(reachable)):
        errors.append(f"indexable page is not reachable from / through HTML links: {route}")
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
    parser.add_argument(
        "--require-absolute-site-urls",
        action="store_true",
        help=f"Require canonical and sitemap URLs to use {SITE_ORIGIN} (for deploy builds).",
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
    errors.extend(check_indexability(site_dir, args.require_absolute_site_urls))
    errors.extend(check_internal_links(site_dir, local_hosts))
    errors.extend(check_indexable_reachability(site_dir, local_hosts))
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
