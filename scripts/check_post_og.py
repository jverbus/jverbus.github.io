#!/usr/bin/env python3
"""Validate required social metadata for Jekyll posts.

Rules enforced for each file in `_posts/*.md`:
- Front matter must include non-empty `description`, `og_image`, and `og_image_alt`
- Optional `og_image_width` / `og_image_height` values must be positive integers
- If `og_image` is a local path (not http/https), the referenced file must exist
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "_posts"

REQUIRED_NONEMPTY_FIELDS = ("description", "og_image", "og_image_alt")
OPTIONAL_NUMERIC_FIELDS = ("og_image_width", "og_image_height")


def parse_front_matter(text: str) -> str | None:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None

    end = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end = i
            break

    if end is None:
        return None

    return "\n".join(lines[1:end])


def get_field(front_matter: str, key: str) -> str | None:
    # Capture simple one-line YAML key/value entries.
    m = re.search(rf"^{re.escape(key)}:\s*(.+?)\s*$", front_matter, flags=re.MULTILINE)
    if not m:
        return None
    value = m.group(1).strip()
    # strip wrapping single/double quotes
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        value = value[1:-1].strip()
    return value


def validate_post(post_path: Path) -> list[str]:
    text = post_path.read_text(encoding="utf-8")
    front_matter = parse_front_matter(text)
    rel = post_path.relative_to(ROOT)

    if front_matter is None:
        return [f"{rel}: missing/invalid front matter"]

    errors: list[str] = []
    values: dict[str, str] = {}

    for field in REQUIRED_NONEMPTY_FIELDS:
        value = get_field(front_matter, field)
        if value is None:
            errors.append(f"{rel}: missing `{field}`")
            continue
        if not value:
            errors.append(f"{rel}: `{field}` cannot be blank")
            continue
        values[field] = value

    if errors:
        return errors

    for field in OPTIONAL_NUMERIC_FIELDS:
        raw = get_field(front_matter, field)
        if raw is None:
            continue
        if not re.fullmatch(r"\d+", raw):
            errors.append(f"{rel}: `{field}` must be a positive integer (got: {raw})")
            continue
        if int(raw) <= 0:
            errors.append(f"{rel}: `{field}` must be > 0 (got: {raw})")

    # File existence validation for local images
    og_image = values["og_image"]
    if not (og_image.startswith("http://") or og_image.startswith("https://")):
        local_path = ROOT / og_image.lstrip("/")
        if not local_path.exists():
            errors.append(f"{rel}: `og_image` references missing file: {og_image}")

    return errors


def main() -> int:
    if not POSTS_DIR.exists():
        print("_posts directory not found", file=sys.stderr)
        return 1

    posts = sorted(POSTS_DIR.glob("*.md"))
    if not posts:
        print("No posts found in _posts")
        return 0

    all_errors: list[str] = []
    for post in posts:
        all_errors.extend(validate_post(post))

    if all_errors:
        print("OG metadata validation failed:\n", file=sys.stderr)
        for err in all_errors:
            print(f"- {err}", file=sys.stderr)
        return 1

    print(f"OG metadata validation passed for {len(posts)} post(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
