# Academic redesign — September 7, 2026

The homepage introduces James Verbus with **AI and physics**, a short biography, the
existing LUX photograph and caption, and four selected works. The full writing, project,
publication and talk collections remain available through text navigation. The palette
uses near-white, charcoal and blue, with a graphite dark mode.

## Implementation

| Area | Result |
| --- | --- |
| Identity | Name as the main heading, with “AI and physics” directly below it. Biography emphasizes AI for detecting bots and abusive automated activity, followed by the open-source library and Brown/LUX background. |
| Homepage | Replaces the slogan, metric strip, route cards, repeated collection previews and contact button with an introduction and four work entries. Existing home fragment targets remain available. |
| Selected work | `_data/home.yml` lists the 2026 Extended Isolation Forest article, generated-face detection (AI Research, 2024), activity-sequence detection (AI Engineering, 2021) and LUX calibration (Physics, 2016). All entries have a year, with concise provenance or library links in the main column. |
| Navigation | Writing, Projects, Publications and Talks are text links. All four remain visible on mobile without JavaScript. `/videos/` remains the Talks URL. |
| Typography | Existing vendored Source Serif 4 and Inter, with aligned headings, comfortable reading text and subdued metadata. No new fonts or dependencies. |
| Collections and posts | Open lists replace raised cards. Article headers, links, contact controls and footers use the quieter presentation. Tables, figures, equations, code and demos retain their substance and functionality. |
| Castle | Existing source, assets, rendered page/head and its own index/feed entries are preserved. The shared URL exception keeps its original navigation, footer, theme metadata and `loop54` stylesheet URL. |

The new styles are scoped to `.academic`, which is added outside Castle's source.
The original CSS rules remain intact in the same stylesheet; this intentional additive
approach preserves Castle's appearance. Other pages use `loop56`. Homepage structured
data uses the new home description. The old configuration tagline remains available for
Castle's original footer.

The selected software entry points to the 2026 EIF article to show recent development.
That article links to the original 2019 work; the biography and selected entry link directly
to the library's project page, and the entry also links to its GitHub repository. Its
displayed 2026 date belongs to the featured article, not to the library's creation.

This design implements the later approved homepage/footer changes. The prior editorial
review's other optional holds remain unchanged: publication counts, interview copy, and
the protected face/LUX passages. Post sources and publication/talk data were not edited.

## Finishing review of commit 1619449

| Finding | Implementation |
| --- | --- |
| 1. Provenance and face-detection wording | Added “Library project” and “Code” links to the EIF entry. Added “CVPR Workshop on Media Forensics,” “LinkedIn Engineering,” and “Brown University · LUX” below the other descriptions. The venue and engineering source are present in `_data/publications.yml`; Brown/LUX is established in the biography and thesis record. The faces description now reads “Evaluating AI-generated-face detection on GAN and diffusion images, including generators withheld from training.” The underlying article is unchanged. |
| 2. Recognizable linked titles | Selected-work and collection titles use the existing blue at rest, a darker/lighter accent on hover, and the existing visible focus outline. Castle's own collection entry retains its previous colors through an exact-URL CSS exception. |
| 3. Readable supporting text | Work and collection descriptions are 1rem (16px at the default root size); context, dates and categories remain smaller. Castle's description retains 0.92rem through a shared CSS exception. The mobile photo caption is 0.8rem. Testing found that it extended beyond the viewport at 320px with 200% root text sizing; the photo row now wraps the caption below the image when needed. |
| 4. Archive continuation | One ordinary “All writing →” link follows the four selected works and leads to `/posts/`. |
| 5. Direct biography | The opening now begins “I was a Senior Staff Machine Learning Engineer at LinkedIn, where I built AI systems to detect bots and abusive automated activity.” The library follows in its own sentence; the Brown/LUX paragraph and existing links remain. |
| Rendering and interaction review | Checked Chrome, Firefox and WebKit, including narrow widths, both themes, keyboard focus, enlarged text and the technical pages. Native Safari automation was unavailable; details below. |
| Castle and scope | No Castle source, assets, metadata, copy or entry markup changed. No post source, collaborator credit, publication data, technical example or AI-assistance disclosure changed. The name, field label, photograph, four-work selection, fonts and palette are retained. |

## Preservation and validation

Baseline: actual unchanged working tree at `15f0eb3c880b352b005f48dedbd001197f0d250c`,
built with `_config.yml,_config.ci.yml`, saved outside the repository at
`/private/tmp/academic-redesign-20260907/`. The snapshot contains 185 tracked source files,
their hashes, the complete generated site, and Castle's source/asset manifest.

The finishing pass has a second immutable baseline at
`1619449eee8c3fd9c1c189746684f30ebb94c188`, saved at
`/private/tmp/academic-refinement-20260907/`: 197 tracked source files and their actual
hashes, the complete unchanged CI-config build, and Castle's source/asset manifest.
Only `index.md`, `_data/home.yml`, the shared stylesheet and its cache version change in
this pass, alongside these excluded review artifacts.

- CI-config build and production build both succeed. The production validator also passes
  with `--require-absolute-site-urls`.
- `check_generated_site.py` output is byte-identical to the baseline. All 43 HTML routes
  remain; the homepage retains its old section fragment IDs.
- `check_post_og.py`: all 10 posts pass. All 32 JSON-LD blocks parse.
- Demo tests: 30 isolation-forest, 21 orbital-transfer and 12 LUX checks pass (63 total).
- `check_castle.py`: source, seven local assets, complete page/head and 20 entries across
  12 files match. The preservation checker's five regression tests pass.
- The final Castle comparison uses the same browser navigation sequence as the baseline:
  all 184 elements have identical computed styles in desktop/mobile and light/dark modes,
  and all four corresponding viewport screenshots are byte-identical.
- Castle's Writing entry also has identical computed styles before and after the finishing
  pass, at rest and on hover, in Chrome, Firefox and WebKit across both sizes and themes.
- All ten complete rendered article subtrees match the baseline, including their headers,
  body copy, figures, equations, code, collaborator credits and AI-assistance disclosures.
  All 42 non-homepage HTML bodies are unchanged from the finishing-pass baseline.
- Browser review: Chrome 152 covers nine pages at desktop 1440×1080 and mobile 390×844,
  in light and dark modes (36 combinations). Firefox 155 and Playwright WebKit 26.6 each
  cover the homepage, Writing, Publications, Projects, Talks, EIF, LUX and orbital-transfer
  articles at the same sizes and themes (32 combinations each). No overflowing prose,
  missing images or broken local fragments; all three demos render with nonempty canvases.
- All three engines pass homepage/Writing checks at 320/760/768px with 100% and 200% root
  text sizing. This tests enlarged text, not browser zoom or a physical phone. Each engine
  also checks the blue title/hover states and visible keyboard focus on all four work
  titles, both software links and “All writing.” Chrome/Firefox use Tab; WebKit uses
  [macOS's Option-Tab link-navigation shortcut](https://support.apple.com/en-euro/guide/safari/cpsh003/mac).
- Seventeen additional checks cover visible navigation without JavaScript at 320/760/768
  pixels, hidden demo fallbacks, keyboard skip/navigation focus, light/dark text contrast,
  and white print output while the system is in dark mode.
  The lowest measured contrast among the homepage text styles is 5.49:1.
- CSS braces balance; `git diff --check` passes. Screenshots and this report are under
  `scripts/`, excluded from the generated site.

The in-app browser was unavailable. The checks used isolated local Chrome and temporary
Playwright Firefox/WebKit browsers; no browser tooling was added to the site's dependencies.
Native Safari 26.6 refused a WebDriver session because “Allow remote automation” is off.
Its settings were left unchanged. WebKit coverage is not a claim of testing the Safari
application, physical iOS devices or every browser/OS combination.

## Screenshots

The “before” images show the original first viewport. The new homepage images show the
complete page; all were captured from local builds using the same viewport sizes.

| | Desktop | Mobile |
| --- | --- | --- |
| Before | [Original homepage](home-before-desktop.png) | [Original homepage](home-before-mobile.png) |
| After | [New homepage](home-after-desktop.png) | [New homepage](home-after-mobile.png) |
| Dark mode | [New homepage](home-dark-desktop.png) | [New homepage](home-dark-mobile.png) |

[Writing](writing-desktop.png) · [Publications](publications-desktop.png) ·
[LUX article](lux-desktop.png) · [LUX demo on mobile in dark mode](lux-mobile-dark.png)

[Firefox mobile](home-firefox-mobile.png) · [WebKit mobile, dark mode](home-webkit-mobile-dark.png) ·
[Firefox at 320px with enlarged text](home-firefox-320-enlarged.png)

![New desktop homepage](home-after-desktop.png)
