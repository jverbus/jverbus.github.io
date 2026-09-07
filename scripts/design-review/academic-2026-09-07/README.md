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
| Selected work | `_data/home.yml` lists the isolation-forest library (ML Engineering, 2019–2026), generated-face detection (AI Research, 2024), activity-sequence detection (AI Engineering, 2021) and LUX calibration (Physics, 2016). All entries have dates, with concise provenance or resource links in the main column. |
| Navigation | Writing, Projects, Publications and Talks are text links. All four remain visible on mobile without JavaScript. `/videos/` remains the Talks URL. |
| Typography | Existing vendored Source Serif 4 and Inter, with aligned headings, comfortable reading text and subdued metadata. No new fonts or dependencies. |
| Collections and posts | Open lists replace raised cards. Article headers, links, contact controls and footers use the quieter presentation. Tables, figures, equations, code and demos retain their substance and functionality. |
| Castle | Uses the same academic UI as every other article. Its source, front matter, assets, complete rendered article, content metadata and index/feed entries remain unchanged. |

The styles are scoped to `.academic`, which the shared template adds to every page,
including Castle. All pages use stylesheet version `loop57`, the shared navigation and
global footer, and the same light/dark theme colors. The existing stylesheet structure
is retained. Homepage structured data uses the new home description.

The ML Engineering entry links to the top-level `/open-source/isolation-forest/` project
page. “EIF update” and “Code” remain secondary links. The displayed 2019–2026 range covers
the documented 2019 open-source release and the 2026 EIF update; the title describes the
whole library. Its summary emphasizes distributed unsupervised machine learning.

This design implements the later approved homepage/footer changes. The prior editorial
review's other optional holds remain unchanged: publication counts, interview copy, and
the protected face/LUX passages. Post sources and publication/talk data were not edited.

## Finishing review of commit 1619449

| Finding | Implementation |
| --- | --- |
| 1. Provenance and face-detection wording | The library title links to its project page, with “EIF update” and “Code” links below. Added “CVPR Workshop on Media Forensics,” “LinkedIn Engineering,” and “Brown University · LUX” below the other descriptions. The venue and engineering source are present in `_data/publications.yml`; Brown/LUX is established in the biography and thesis record. The faces description specifies deep learning for detecting generated faces, retaining GAN/diffusion coverage and generators withheld from training. The underlying article is unchanged. |
| 2. Recognizable linked titles | Selected-work and collection titles use the existing blue at rest, a darker/lighter accent on hover, and the existing visible focus outline. This also applies to Castle's entry. |
| 3. Readable supporting text | Work and collection descriptions are 1rem (16px at the default root size), including Castle's entry; context, dates and categories remain smaller. The mobile photo caption is 0.8rem. Testing found that it extended beyond the viewport at 320px with 200% root text sizing; the photo row now wraps the caption below the image when needed. |
| 4. Archive continuation | One ordinary “All writing →” link follows the four selected works and leads to `/posts/`. |
| 5. Direct biography | The opening now begins “I was a Senior Staff Machine Learning Engineer at LinkedIn, where I built AI systems to detect bots and abusive automated activity.” The library follows in its own sentence; the Brown/LUX paragraph and existing links remain. |
| Homepage ML emphasis | Changed “Software” to “ML Engineering,” restored the top-level library link, and revised the first three summaries to identify unsupervised machine learning, deep learning for generated-face detection, and learned request embeddings for scraper detection. The LUX entry is unchanged in both source data and rendered markup. |
| Rendering and interaction review | Checked Chrome, Firefox and WebKit, including narrow widths, both themes, keyboard focus, enlarged text and the technical pages. Native Safari automation was unavailable; details below. |
| Castle and scope | No Castle source, assets, content metadata, article copy or entry markup changed. No post source, collaborator credit, publication data, technical example or AI-assistance disclosure changed. The name, field label, photograph, four-work selection, fonts and palette are retained. |

## Castle UI clarification

James clarified that Castle's **text** must remain unchanged while its **UI** must match
the rest of the site. Removed the visual exceptions in the shared default template, head,
navigation, global footer and stylesheet. Castle now has the same article typography,
spacing, colors and controls; its collection entry uses the same blue title and 16px
description as the other entries. No change was made to the Castle post file.

The complete rendered article remains identical, including the title, dates, description,
body, figures, code, contact wording and post navigation. The article date/contact-copy
exceptions remain in the shared post templates to preserve that text. In the head, only
the browser theme colors and stylesheet cache version change; title, description,
canonical/OG data and structured data remain identical.

`AGENTS.md` now reflects this distinction. The preservation checker has an explicit
`--allow-shared-ui` mode that compares the entire article, content metadata, source/asset
hashes and card/feed/index entries. It allows only theme-color values and the CSS cache
version in the head. Its default whole-page comparison remains available for historical
checks; ten regression tests cover both modes and the protected content.

## Preservation and validation

Baseline: actual unchanged working tree at `15f0eb3c880b352b005f48dedbd001197f0d250c`,
built with `_config.yml,_config.ci.yml`, saved outside the repository at
`/private/tmp/academic-redesign-20260907/`. The snapshot contains 185 tracked source files,
their hashes, the complete generated site, and Castle's source/asset manifest.

The finishing pass has a second immutable baseline at
`1619449eee8c3fd9c1c189746684f30ebb94c188`, saved at
`/private/tmp/academic-refinement-20260907/`: 197 tracked source files and their actual
hashes, the complete unchanged CI-config build, and Castle's source/asset manifest.
That pass changed `index.md`, `_data/home.yml`, the shared stylesheet and its cache
version, alongside these excluded review artifacts.

The subsequent Castle UI correction uses an unchanged-tree baseline at
`b73e65aad7958cb2fbebb9f5b785c942883368d7`, saved at `/private/tmp/castle-ui-20260907/`:
200 tracked source files and hashes, the complete generated site, and Castle's manifest.

The homepage ML-copy update uses the unchanged build at
`339fd90bef4a6e9c39699f30daa213d0adfab68e`, saved at `/private/tmp/home-ml-20260907/`.
Only the first three selected-work entries change. LUX's data and rendered entry, the
rest of the homepage, and all 42 other HTML pages match this baseline. No template, CSS,
post source, asset or other site data changed. Homepage screenshots are refreshed.

- CI-config build and production build both succeed. The production validator also passes
  with `--require-absolute-site-urls`.
- `check_generated_site.py` output is byte-identical to the baseline. All 43 HTML routes
  remain; the homepage retains its old section fragment IDs.
- `check_post_og.py`: all 10 posts pass. All 32 JSON-LD blocks parse.
- Demo tests: 30 isolation-forest, 21 orbital-transfer and 12 LUX checks pass (63 total).
- `check_castle.py --allow-shared-ui`: source, seven local assets, the complete article,
  content metadata and 20 entries across 12 files match. All ten checker regression tests
  pass, including rejection of article text, code whitespace, image, title, description
  and date changes. The old whole-page and screenshot equality requirement is superseded
  by James's instruction to share the UI.
- Castle's article styles, navigation and global footer match the shared presentation
  used by LUX in Chrome, Firefox and WebKit at desktop/mobile sizes in both themes.
  Its Writing entry uses the same title color and description size as other entries.
- All ten complete rendered article subtrees match the baseline, including their headers,
  body copy, figures, equations, code, collaborator credits and AI-assistance disclosures.
  All 42 non-homepage HTML pages are unchanged from the homepage ML-copy baseline.
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
- Castle additionally passes checks for keyboard navigation, visible navigation without
  JavaScript at 320/760/768px, and 200% root text sizing in all three engines.
- The ML-copy update has 13 refreshed homepage views across Chrome, Firefox and WebKit,
  covering desktop/mobile and both themes, plus Firefox at 320px with enlarged text.
  No overflow or missing images was found.
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

[Castle desktop](castle-desktop.png) · [Castle mobile](castle-mobile.png) ·
[Castle desktop, dark mode](castle-desktop-dark.png) · [Castle mobile, dark mode](castle-mobile-dark.png)

![New desktop homepage](home-after-desktop.png)
