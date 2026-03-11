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
- `Link Check` (Lychee) against generated `_site/**/*.html` pages

Lychee is configured via `.github/lychee.toml`.
