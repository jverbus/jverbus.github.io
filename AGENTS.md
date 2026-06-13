# AGENTS.md — operating guide for coding agents

This is the personal website/blog of James Verbus: Jekyll 3.x, GitHub Pages, one stylesheet,
zero JS dependencies, no build step. The bar for changes is high: this site presents as
designed-by-hand, and every claim on it is backed by a shipped artifact. Match that standard.

## Commands

```bash
# Build (production parity; _config.ci.yml relativizes URLs for link validation)
bundle exec jekyll build --config _config.yml,_config.ci.yml

# Demo algorithm/physics tests (these run in CI; all must pass)
node scripts/test_if_demo.js
node scripts/test_orbit_demo.js
node scripts/test_lux_demo.js

# Site validators (also run in CI)
python3 scripts/check_post_og.py          # post front-matter guardrails
python3 scripts/check_generated_site.py _site
```

If `bundle exec` fails on a bundler-version mismatch (the lockfile pins an old bundler),
`JEKYLL_NO_BUNDLER_REQUIRE=true jekyll build ...` bypasses Bundler at build time.

## Verification workflow (do this for every change)

1. Run the relevant test suites and validators above; the build must be clean.
2. For template/CSS changes, diff `check_generated_site.py` output against a baseline build of
   the unchanged tree — the checker must be byte-identical unless the change explains it.
3. Cheap sanity for CSS edits: opening and closing brace counts in `assets/css/modern.css`
   must match.
4. Grep the built `_site/` output to confirm your change actually landed where intended and
   nowhere else (e.g., a demo script must load only on its own post).

There is a baseline of pre-existing checker behavior; never introduce NEW warnings.

## Hard conventions

### CSS (`assets/css/modern.css` — the only stylesheet)
- Design tokens at the top (`:root` custom properties); component styles in the middle; the
  `max-width: 760px`, `prefers-reduced-motion`, `print`, `prefers-contrast`, and
  `prefers-color-scheme: dark` blocks at the bottom. New component styles go before the media
  blocks; their dark/mobile/print overrides go inside the existing blocks.
- **Every CSS change requires bumping the cache-bust** `?v=loopN` in `_includes/site/head.html`.
- Pill-shaped controls must appear in the `:focus-visible { border-radius: 999px }` exception
  list (the global focus rule sets 6px corners).
- No inline styles, no new dependencies, no frameworks.

### Typography (two voices)
- Running prose = Source Serif 4; UI chrome = Inter. Serif is applied via **direct-child
  selectors** (`.layout-post .entry-content > p`, etc.), so interactive components and cards
  stay in Inter automatically as long as their content is wrapped in a container element.
- New fonts must be vendored in `assets/fonts/` (with license file) and given a metric-matched
  fallback `@font-face` so the swap causes no layout shift.

### Interactive demos (the established pattern — follow it exactly)
Each demo is one vanilla-JS IIFE in `assets/js/<name>-demo.js` plus an include in
`_includes/site/<name>-demo.html`:
- **Node-testable core**: pure algorithm/physics functions exported via
  `if (typeof module !== "undefined") module.exports = api;` with a falsifiable test suite in
  `scripts/test_<name>_demo.js`, wired into `.github/workflows/jekyll-build.yml`. Tests assert
  physics/math invariants (conservation laws, closed-form parity, independent derivations),
  not just absence of crashes.
- **Progressive enhancement**: the root div ships `hidden` with a `data-*-demo` attribute; JS
  reveals it. No-JS readers must see the post exactly as it was before the demo existed.
- **Static deep-link anchor**: an empty `<div id="...">` OUTSIDE the hidden container, so
  fragment links work regardless of script timing.
- **Per-component rendering state**: never share a mutable offscreen canvas between panels
  (iOS WebKit's deferred compositing will show the same frame in both — this was a real bug).
- Lazy init/animation via `IntersectionObserver`; animation loops stop off-screen; repaint on
  `pageshow` (back/forward cache); dark-mode via `matchMedia` listener with colors read from
  CSS custom properties; `prefers-reduced-motion` users start paused.
- Buttons use the shared `.demo-btn` class; the demo script gets its own `?v=N` cache-bust in
  the include, bumped on every script change.
- Controller/impulse tuning lesson: discrete control steps must be smaller than the deadbands
  they steer into, or the controller bang-bangs forever. Tests catch this; keep them.

### Posts and content
- Permalinks are `/:year/:month/:day/:title/` — never change a published URL without a
  redirect page (see README "Legacy URL redirects").
- Required front matter (CI-enforced): `og_image`, `og_image_width`, `og_image_height`.
  Conventions: `description`, `categories`, `tags`, hand-curated `related:` URLs (three),
  `last_modified_at` when edited.
- Thin index pages (tags, categories, archive) are `robots: noindex, follow` + `sitemap: false`.
- The copy rule: **no aspirational claims** — every statement on the home page must be backed
  by a shipped artifact. Past-tense-neutral phrasing over announcements.

### SEO / structured data (`_includes/site/head.html`)
- All JSON-LD person references point at the `@id` `https://jverbus.github.io/#person` —
  preserve this entity linking in any schema work.
- JSON-LD on built pages must parse as valid JSON; validate by extracting and `json.loads`-ing
  the script blocks from `_site` output.

## Git workflow

- Develop on a feature branch (never commit directly to `master`), push the branch, and let
  the owner review and merge. Demos especially: the owner eyeballs rendering before merge
  (CI has no browser; canvas output is verified by review + the Node test suites).
- Merges to `master` are fast-forward when possible. CI must be green.

## Gotchas

- `_config.ci.yml` sets `url: ""` — canonical/OG URLs in local builds are relative by design.
  Building with the CI config ALONE (without `_config.yml`) breaks permalinks; always pass
  both: `--config _config.yml,_config.ci.yml`.
- `scripts/` is excluded from the Jekyll build; `assets/files/` is excluded from the sitemap.
- The reading-time figure on posts is computed from word count at build time; demo include
  text slightly affects it. That is accepted.
- Touch interactions: drag-surface canvases use `touch-action: none`; tap-only canvases use
  `pan-y` so the page still scrolls.
