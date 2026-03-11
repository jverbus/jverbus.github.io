#!/usr/bin/env python3
"""Validate LinkedIn URLs in generated site HTML.

Why this exists:
- Lychee excludes LinkedIn domains due to bot-hostile responses (for example 999).
- That exclusion can hide obvious typos.

This script scans generated HTML for LinkedIn URLs and checks them with a
browser-like user-agent. It fails CI only for hard failures (404/410), while
keeping bot-blocking/temporary responses as warnings.
"""

from __future__ import annotations

import argparse
import html
import re
import sys
import time
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen

LINKEDIN_HOSTS = {"www.linkedin.com", "linkedin.com", "engineering.linkedin.com"}
HARD_FAIL_CODES = {404, 410}
RETRYABLE_CODES = {429, 500, 502, 503, 504}

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/123.0.0.0 Safari/537.36"
)


@dataclass
class CheckResult:
    url: str
    status: str  # ok|warn|fail
    code: int | None
    detail: str


class LinkCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.urls: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            if value is None:
                continue
            if name not in {"href", "src", "content"}:
                continue
            normalized = normalize_linkedin_url(value)
            if normalized:
                self.urls.add(normalized)


RAW_LINKEDIN_RE = re.compile(
    r"https?://(?:www\.)?linkedin\.com/[^\s\"'<>]+|"
    r"https?://engineering\.linkedin\.com/[^\s\"'<>]+"
)


def normalize_linkedin_url(raw: str) -> str | None:
    value = html.unescape(raw).strip()
    if not value:
        return None

    parts = urlsplit(value)
    if parts.scheme not in {"http", "https"} or not parts.netloc:
        return None

    host = parts.netloc.lower()
    if host not in LINKEDIN_HOSTS:
        return None

    path = parts.path or "/"
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, ""))


def discover_linkedin_urls(site_dir: Path) -> list[str]:
    urls: set[str] = set()

    for html_file in sorted(site_dir.rglob("*.html")):
        text = html_file.read_text(encoding="utf-8", errors="ignore")

        parser = LinkCollector()
        parser.feed(text)
        urls.update(parser.urls)

        for match in RAW_LINKEDIN_RE.findall(text):
            normalized = normalize_linkedin_url(match)
            if normalized:
                urls.add(normalized)

    return sorted(urls)


def check_url(url: str, timeout: int, retries: int, retry_wait: float) -> CheckResult:
    last_warn = "unknown error"

    for attempt in range(1, retries + 2):
        req = Request(
            url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
            },
            method="GET",
        )

        try:
            with urlopen(req, timeout=timeout) as resp:
                code = resp.getcode()
                final_url = resp.geturl()
                if code in HARD_FAIL_CODES:
                    return CheckResult(url=url, status="fail", code=code, detail=f"HTTP {code} ({final_url})")
                if 200 <= code < 400:
                    return CheckResult(url=url, status="ok", code=code, detail=f"HTTP {code} ({final_url})")
                return CheckResult(url=url, status="warn", code=code, detail=f"HTTP {code} ({final_url})")

        except HTTPError as exc:
            code = exc.code
            if code in HARD_FAIL_CODES:
                return CheckResult(url=url, status="fail", code=code, detail=f"HTTP {code}")

            last_warn = f"HTTP {code}"
            if code in RETRYABLE_CODES and attempt <= retries:
                time.sleep(retry_wait)
                continue

            return CheckResult(url=url, status="warn", code=code, detail=last_warn)

        except URLError as exc:
            last_warn = f"network error: {exc.reason}"
            if attempt <= retries:
                time.sleep(retry_wait)
                continue

    return CheckResult(url=url, status="warn", code=None, detail=last_warn)


def main() -> int:
    parser = argparse.ArgumentParser(description="Check LinkedIn URLs in generated HTML")
    parser.add_argument("site_dir", nargs="?", default="_site", help="Generated site directory (default: _site)")
    parser.add_argument("--timeout", type=int, default=20, help="Request timeout in seconds (default: 20)")
    parser.add_argument("--retries", type=int, default=2, help="Retry count for transient failures (default: 2)")
    parser.add_argument("--retry-wait", type=float, default=1.5, help="Seconds to wait between retries")
    args = parser.parse_args()

    site_dir = Path(args.site_dir)
    if not site_dir.exists():
        print(f"Site directory not found: {site_dir}", file=sys.stderr)
        return 1

    urls = discover_linkedin_urls(site_dir)
    if not urls:
        print("No LinkedIn URLs found in generated HTML.")
        return 0

    print(f"Checking {len(urls)} LinkedIn URL(s) with browser-like user-agent...")

    failures: list[CheckResult] = []
    warnings: list[CheckResult] = []

    for url in urls:
        result = check_url(url, timeout=args.timeout, retries=args.retries, retry_wait=args.retry_wait)
        if result.status == "ok":
            print(f"✅ {url} -> {result.detail}")
        elif result.status == "warn":
            print(f"⚠️  {url} -> {result.detail}")
            warnings.append(result)
        else:
            print(f"❌ {url} -> {result.detail}")
            failures.append(result)

    print("\nSummary:")
    print(f"- total: {len(urls)}")
    print(f"- hard failures (404/410): {len(failures)}")
    print(f"- warnings (blocked/transient): {len(warnings)}")

    if failures:
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
