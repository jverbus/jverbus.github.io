This repository contains my personal website and blog, built with plain Jekyll layouts/includes and licensed under the [MIT License](LICENSE).

## Social card images (Open Graph / Twitter)

Posts can define a custom social preview image in front matter:

```yaml
og_image: "/assets/images/example.png"
og_image_width: 1200
og_image_height: 630
og_image_alt: "Optional accessible description"
```

If omitted, the site-level `default_og_image` fallback in `_config.yml` is used.

## CI checks

GitHub Actions runs:
- `Jekyll Build` on pull requests and pushes to `master`
  - includes a guardrail check: every post in `_posts` must define `og_image`, `og_image_width`, and `og_image_height`, and local `og_image` files must exist
  - validates generated `_site` output for sitemap/noindex conflicts, empty feed summaries, leaked build artifacts, local link targets, and local Open Graph image dimensions
- `Link Check` (Lychee) against generated `_site/**/*.html` pages

Lychee is configured via `.github/lychee.toml`.

## Legacy URL redirects

When an old external permalink breaks (for example, historical paths with spaces), preserve SEO by adding a static redirect page at the legacy path.

Recommended legacy redirect page pattern:
- `rel="canonical"` pointing at the current canonical URL
- `meta name="robots" content="noindex,follow"`
- immediate redirect (`meta refresh` + `location.replace(...)`)

Example we added:
- legacy path: `/data science projects/2016/10/07/insight-castle-compromised-account-detection/`
- canonical path: `/2016/10/07/insight-castle-compromised-account-detection/`

This is the minimal-risk GitHub Pages approach when server-side 301 rules are not available.
