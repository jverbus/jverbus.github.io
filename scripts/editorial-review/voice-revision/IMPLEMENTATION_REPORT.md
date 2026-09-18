# Thesis-grounded voice revision — September 17, 2026

Implemented all **166 enumerated edits** on local feature branch `voice-revision-2026-09-17`. Every ID is `edited`; none is `already_satisfied` or `not_applied`. The four VOICE-RULES replacements were the first source changes, including the later academic-redesign sentence about editorial holds. No merge, push, deployment, or publication was performed.

The complete per-ID disposition, reason, and final source location are in [DISPOSITIONS.md](DISPOSITIONS.md), with the same records in [dispositions.json](dispositions.json).

## Scope and source

- Starting HEAD exactly matched the reviewed commit, `bc3a93eaeebafa035c9b3073485c862376187a75`. There was no intervening source drift. The supplied root-level brief was untracked on arrival and remains a user-provided local file.
- Read the complete brief, its supplied thesis excerpts, and the current operating guide. Used the thesis's descriptions of procedures, causal explanations, measurements, and concrete uncertainties as the primary voice reference.
- Applied the specified replacements to the nine posts, home selected-work descriptions, project copy, talk descriptions, demo introductions/tooltips, and five JavaScript message changes. Deleted the targeted reviewer commentary outright. No replacement disclaimers or invented author admissions were added.
- Read all nine complete revised articles for flow; an independent final audit compared all 166 replacements/deletions with the brief. Paragraphs outside the enumerated changes remain intact.
- Kept the academic design, homepage biography, all post titles, original publication dates, routes, figures, scientific code/equations, benchmark values, collaborator credits, negative results, and AI-assistance disclosure. CSS, shared layout/head/footer/navigation, fonts, assets, notebooks, PDFs, dependencies, and demo algorithms are unchanged.
- Updated `last_modified_at` to `2026-09-17` for the nine edited posts and the home, Talks, and Isolation Forest pages whose visible content changed. No Castle metadata changed.
- LUX script version changed from 1 to 2; orbit from 4 to 5. IF's script version and the stylesheet version are unchanged. Exact source reconstruction verifies that the JavaScript changes contain only the five authorized message changes; conditions, constants, computations, and controllers remain intact.
- Added only `CODEX_VOICE_REVISION_BRIEF.md` to Jekyll's exclusions. The brief and all review records remain absent from `_site`.

## Coverage

| Group | Edited |
| --- | ---: |
| RULES | 4 |
| SEQ | 17 |
| LUX | 26 |
| IF19 | 14 |
| FACE23 | 8 |
| FACE24 | 11 |
| ONNX | 6 |
| RAG | 19 |
| RL | 12 |
| EIF | 23 |
| HOME | 3 |
| PROJECT | 5 |
| TALKS | 8 |
| DEMO | 10 |
| Total | 166 |

## Preservation and links

Before editing, saved the actual unchanged working tree's tracked source files and generated site to `/private/tmp/voice-revision-baseline-_ywx81eb`. The baseline directory contains `source/`, `rendered/`, `tracked_hashes.json`, `castle_hashes.json`, and the original generated-site validator output. [baseline.json](baseline.json) records the commit and Castle hashes.

Castle's source and seven local assets match the baseline by byte comparison and SHA-256. Its entire generated HTML is byte-identical, including head, shared UI, dates, article, contact copy, and post navigation. Both strict and shared-UI Castle checks pass, including all **20 Castle entries across 12 generated files** (cards, indexes, RSS, Atom, and sitemap). The Castle checker and its regression tests were not modified.

All **43 HTML routes** and **242 pre-existing IDs** remain; there are no duplicate IDs. Renamed headings use their old explicit IDs. The deleted ONNX section leaves `#why-onnx` before the converter section, and RAG retains `#practical-standard`. Existing renamed-heading references resolve.

Every distinct original external URL and local resource destination remains on its article. Links formerly attached to source commentary now attach to the relevant method or result. Two introductory forward links were removed with their explicitly targeted narration: SEQ-01's `#resources` and RAG-01's `#a-saved-corpus-coverage-example`. Both target IDs and all actual resources remain. ONNX's `https://onnx.ai/` link moved to the opening sentence. LUX's existing thesis landing-page URL now carries the visible section/page locator; no PDF page fragment was added to that landing page.

The historical September 6 preservation script encodes superseded wording holds, a superseded homepage, and its original revision date. It remains unchanged as a historical record. [check_preservation.py](check_preservation.py) adapts that check to this brief's exact file scope, four policy replacements, September 17 dates, current academic home, explicitly deleted forward links, and display-only JavaScript edits. It retains route, asset, source-code, rendered-code, MathML, metadata, sitemap, person-entity, and figure checks. It also compares demo controls/accessibility attributes and enforces the exact five JavaScript changes. No Castle or scientific preservation assertion was relaxed.

## Scientific source resolution and remaining questions

**The earlier LUX factor-seven sourcing note is resolved.** The supplied thesis excerpt in §9.3, printed p.228 / PDF p.252, explicitly states a sevenfold sensitivity improvement for a 7 GeV/c² WIMP; §9.7, printed p.245 / PDF p.269, repeats it. VOICE-LUX-22 adds the §9.3 locator to the result. This supersedes the unresolved numerical-source note in the September 6 implementation report. The revised article preserves the accompanying reconstruction/background improvements without adding a disclaimer about calibration's contribution. This resolution uses the excerpts supplied with the brief; it does not claim a new full-thesis audit.

The two terminology corrections also follow the supplied thesis passages: Qy counts electrons escaping recombination (§5.4, printed pp.138–139), and S2 is secondary scintillation from extracted electrons (§§2.3.1 and 2.3.1.3, printed pp.27 and 31).

Two existing evidence limits remain in their appropriate places:

- The RL notebook's final custom experiment has saved configuration output inconsistent with its setup cell, and parameter comparisons need a fixed training seed. The specified actionable notebook note remains immediately before Materials. The notebook was neither altered nor rerun.
- For the separate local EIF 61-check study, the full study script/configuration was not available in the prior review evidence. This limitation is recorded only in excluded review notes. The article retains the separate/local scope and saved 61-check result. No new statement was made about what the author did or did not record.

No new experiments, external library benchmarks, notebook training runs, measurements, or quantitative claims were introduced.

## Validation

| Check | Result |
| --- | --- |
| `bundle exec jekyll build --config _config.yml,_config.ci.yml` | Passed; no Bundler bypass required |
| `node scripts/test_if_demo.js` | 30 checks passed |
| `node scripts/test_orbit_demo.js` | 21 checks passed |
| `node scripts/test_lux_demo.js` | 12 checks passed |
| `python3 scripts/check_post_og.py` | Passed for all 10 posts |
| `python3 scripts/check_generated_site.py _site` | Passed; output byte-identical to unchanged baseline |
| `python3 scripts/editorial-review/test_check_castle.py` | 10 regression tests passed |
| `python3 scripts/editorial-review/check_castle.py /private/tmp/voice-revision-baseline-_ywx81eb --allow-shared-ui` | Passed |
| Same Castle check without `--allow-shared-ui` | Passed; complete page/head and all entries preserved |
| `python3 scripts/editorial-review/voice-revision/check_preservation.py /private/tmp/voice-revision-baseline-_ywx81eb` | Passed; 43 routes, 242 old IDs, all original resource destinations, figures, code/MathML, metadata and design preserved |
| Generated JSON-LD | All 32 blocks parsed; person entity references unchanged |
| Demo script placement | Each of the three demo scripts appears only on its own article |
| `git diff --check` | Passed |
| Review/brief exclusion | Confirmed absent from generated content |

Test output is saved in [test-results.txt](test-results.txt); generated-site output is in [site-validation.txt](site-validation.txt). No new validator warnings were introduced. Initial preservation-check adaptation caught the two intentionally removed forward links and decoded tooltip entity; the exceptions were narrowed to those exact authorized changes, then the full check passed.

## Rendering review

The in-app Browser returned no available browser. Used installed headless Chrome against a localhost server instead, at **1280×1000** and **390×1000**, in the environment's dark color scheme. [screenshots/rendering.json](screenshots/rendering.json) records 20 final captures, their visible text/layout measurements, and zero browser script exceptions.

Inspected the selected-work copy, both revised RAG tables, all three demo introductions, orbit's greedy and actual Hohmann-arrival messages, and LUX's 1–10 keV, below-1-keV, and near-74-keV messages. The LUX messages were reached by dragging the actual vertices. The EIF benchmark table retains its existing horizontal scrolling container on mobile; the document itself stays within the 390px viewport. Demo controls wrap, canvases render independently, and paragraphs remain legible. Early capture-position problems from smooth scrolling were corrected before retaining the final captures. No rendering defect required a design change.

All required local checks were run. Remote CI was not run because the branch was not pushed. External scientific experiments were not rerun, as required by the brief. This is an implemented draft for the owner's review, not a claim that the owner has approved the voice.
