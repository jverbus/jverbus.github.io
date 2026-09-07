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
- The September 2026 redesign is scoped to `.academic`, added in `site/default.html` to
  every page, including Castle. Its tokens follow `:root`; its component rules precede the
  existing media blocks. Keep new styles in this scope and bump the shared stylesheet
  version. Castle uses the same UI, navigation and global footer as the rest of the site;
  its article content remains protected. Do not add a visual opt-out to its source.

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

## Editorial review

- The September 2026 editorial scope is the nine posts dated 2016-08-18, 2019-08-13,
  2021-09-02, 2023-06-20, 2024-08-15, 2024-09-23, 2025-02-10, 2026-01-09, and 2026-03-18;
  their supporting home/Writing/project/publication/video/archive copy and data; post
  header/contact and demo explanations; and these guardrails/review records. Linked papers,
  notebooks, slides, assets, demo algorithms, and other repositories are read-only evidence.
- **Castle is excluded from editorial changes, directly and indirectly.** Preserve its
  source, front matter, local assets, complete rendered article (including title, dates,
  contact copy and post navigation), content metadata, and its own card/feed/index entries.
  James clarified that its UI must match the rest of the site: shared styling, navigation,
  global footer, browser theme colors and stylesheet cache version may change. Before shared
  edits, save an actual unchanged-tree build and source/asset hashes outside the repository.
  Compare after shared changes and at completion with `check_castle.py --allow-shared-ui`;
  this mode still compares the complete article and metadata, allowing only theme colors
  and the CSS cache version in the head. Default mode retains the historical whole-page
  check. DOM comparison may ignore only inter-element formatting whitespace. Never edit
  Castle's source to implement a shared UI change.
- Write from the specific problem, mechanism, observation, or limitation. Consolidate repeated
  explanations, keeping technical substance, equations, MathML, code, numbers, units, datasets,
  failures, figures, credits, AI-assistance disclosures, formal titles, distinct resource links,
  publication dates, URLs, and old section/demo anchors. Date actual revisions. Distinguish
  original results, later explanations/experiments, saved examples, and future possibilities;
  date any newly reproduced output and retain its environment. Do not invent historical runs,
  personal contributions, anecdotes, citations, tolerances, or outcomes.
- Attach precise section/figure/table locators to quantitative claims when verified, and use
  immutable code/test links for implementation behavior. Keep photo/collaboration credit and
  experimental qualifiers. A missing source calls for a conservative scope or an unresolved
  question in the excluded review report, not an invented counterclaim or a public TODO.
  Shorter copy must not turn benchmark agreement into universal correctness, weak labels into
  independent production metrics, similarity into common control, or possible uses into shipped
  deployments. Compare voice with the original engineering articles and physics methods paper;
  Castle may be read as a reference but never included in task-generating style searches.
- Review these 17 pattern families in context, using an explicit eligible-file allowlist:
  (1) point-is-not/point-is framing; (2) goal-is-not/goal-is framing; (3) result-is-not/result-is
  framing; (4) not-because/but-because; (5) that/this-matters transitions; (6) importance or
  worth-making-explicit announcements; (7) duplicate takeaway endings; (8) cumulative balanced
  two-part cadence; (9) repeated rather-than alternatives; (10) abstract common-thread biography;
  (11) colon-led inventories/noun piles; (12) gives-me-confidence conclusions; (13) especially-
  important framing; (14) filler practical; (15) filler useful; (16) repeated evidence/grounding/
  validation/robustness commentary; (17) generic contact invitations. Keep necessary technical
  contrasts, meaningful lists, the request/language analogy, and natural short sentences.
  Record edited, retained-for-reason, or absent; do not chase zero matches, deletion percentages,
  or AI-detector scores. These are editorial judgments, not authorship proofs.
- Preserve the seven optional holds: homepage metrics and common-thread sentence, global
  tagline/footer, AI Innovators interview summary, publication/citation counts, the face article's
  vivid pipeline paragraph, and the LUX/LZ transition. Also retain "the generative landscape did
  not hold still" and "mostly slips through" while qualifying their surrounding claims.
- Complete safe authorized edits without another approval conversation. Report the draft and
  evidence limits for James's eventual review; do not claim his approval of its voice. Keep the
  per-finding and pattern review in `scripts/editorial-review/`, excluded from generated content.

## Academic redesign (September 7, 2026)

- James approved an academic visual redesign with `AI and physics` below his name. The home
  page contains a short biography, the existing LUX photograph and caption, four selected works,
  and text navigation/contact links. Full writing, project, publication and talk collections
  remain on their existing URLs. Selected home entries live in `_data/home.yml`.
- This later authorization replaces the editorial pass's homepage metrics/common-thread and
  visible footer holds. All other editorial holds remain. James's subsequent clarification
  keeps Castle's text protected while applying the same UI as the rest of the site. The new
  home description supplies its own structured data. Do not reintroduce removed sections,
  metrics or Castle styling exceptions to satisfy historical editorial-only checks.
- Save an actual baseline build before shared edits. Run `check_castle.py BASELINE_DIR
  --allow-shared-ui` against it, and check Castle's shared design in light/dark and
  desktop/mobile when changing CSS. Preserve post sources, figures, code, math, credits and
  AI-assistance disclosures.
- Review screenshots and validation notes belong in `scripts/design-review/`, excluded from
  Jekyll output. The four mobile navigation links stay visible without JavaScript.
