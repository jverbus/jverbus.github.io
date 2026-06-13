# jverbus.github.io

Personal website and blog of [James Verbus](https://jverbus.github.io/) — writing on AI systems,
measurement, and reliability under uncertainty. Built with plain Jekyll (no theme), a single
hand-maintained stylesheet, and zero JavaScript dependencies. MIT licensed ([LICENSE](LICENSE)).

## Architecture

- **Jekyll 3.x**, GitHub Pages-compatible: layouts in `_layouts/`, components in `_includes/site/`,
  structured content in `_data/` (nav, publications, videos, projects).
- **One stylesheet**: `assets/css/modern.css` — design tokens at the top, component styles in the
  middle, responsive/`prefers-*`/print blocks at the bottom. Cache-busted via a `?v=loopN` query in
  `_includes/site/head.html`.
- **Two-voice typography**: running prose is set in Source Serif 4, UI chrome (nav, cards, chips,
  buttons, captions) in Inter. Both fonts are vendored in `assets/fonts/` with metric-matched
  fallback faces so the swap causes no layout shift.
- **SEO**: canonical URLs, per-page meta descriptions, Open Graph/Twitter cards with per-post
  social images, JSON-LD (`BlogPosting`, `BreadcrumbList`, `WebSite`, `VideoObject`, and a
  consolidated `Person` entity at `/#person`), sitemap, and `noindex` on thin index pages.

## Interactive demos

Three posts embed dependency-free canvas demos, each with a Node-testable physics/algorithm core
that runs in CI:

| Demo | Post | Core | Tests |
|---|---|---|---|
| Isolation Forest vs Extended Isolation Forest | [EIF announcement](https://jverbus.github.io/2026/03/18/announcing-extended-isolation-forest-support/#try-it-live) | `assets/js/if-demo.js` | `scripts/test_if_demo.js` |
| Orbital transfer vs the Hohmann benchmark | [RL workshop](https://jverbus.github.io/2026/01/09/brown-physics-ai-winter-school-workshop/#fly-it-live) | `assets/js/orbit-demo.js` | `scripts/test_orbit_demo.js` |
| D-D neutron scattering kinematics | [LUX calibration](https://jverbus.github.io/2016/08/18/calibrating-the-lux-dark-matter-experiment/#kinematics-live) | `assets/js/lux-demo.js` | `scripts/test_lux_demo.js` |

All demos are progressive enhancements: the markup ships hidden and is revealed by JavaScript, so
the posts read identically without it. The shared pattern is documented in [AGENTS.md](AGENTS.md).

## Local development

```bash
bundle install
bundle exec jekyll serve            # http://localhost:4000
```

Validation, exactly as CI runs it:

```bash
node scripts/test_if_demo.js        # demo algorithm checks
node scripts/test_orbit_demo.js
node scripts/test_lux_demo.js
python3 scripts/check_post_og.py    # post social-image guardrails
bundle exec jekyll build --config _config.yml,_config.ci.yml
python3 scripts/check_generated_site.py _site
```

## Writing a post

Front matter conventions (the first three are enforced by CI):

```yaml
og_image: "/assets/images/social/example-1200x630.jpg"
og_image_width: 1200
og_image_height: 630
description: "Meta description, also used as the post lede."
categories: ["AI and Machine Learning"]
tags: [example, tags]
related:                            # hand-curated; same-category fallback if omitted
  - /2026/03/18/announcing-extended-isolation-forest-support/
last_modified_at: 2026-06-13       # feeds article:modified_time and the sitemap
```

## CI

GitHub Actions runs on every pull request and push to `master`:

- **Jekyll Build** — demo test suites, post OG-image guardrails, site build, and generated-output
  validation (sitemap/noindex conflicts, local link targets, OG image dimensions, leaked artifacts).
- **Link Check** — Lychee against the generated `_site/**/*.html` (config in `.github/lychee.toml`).

## Legacy URL redirects

When an old external permalink breaks, preserve SEO with a static redirect page at the legacy
path: `rel="canonical"` to the current URL, `meta name="robots" content="noindex,follow"`, and an
immediate redirect (`meta refresh` + `location.replace`). See `about-redirect.html` for the
pattern. This is the minimal-risk approach when server-side 301s are unavailable on GitHub Pages.
