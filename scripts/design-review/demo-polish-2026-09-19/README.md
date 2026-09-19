# Demo visual polish — September 19, 2026

This pass refines composition while preserving every existing visible string, control and interaction.

- IF/EIF: aligned captions above the maps, a lighter cursor, side-by-side square maps on mobile, and a deliberate two-by-two mobile button layout with a quieter Clear action.
- Orbit: a larger velocity-oriented spacecraft, subtle planet shading, paired controls, a primary Hohmann button and quieter playback controls. The rendered planet radius still matches the physical crash boundary.
- LUX: matching theme-aware diagram surfaces and a single control bar joining the energy output, angle slider and Reset. On mobile, this bar remains directly below the detector. The styled slider retains native keyboard behavior.
- Shared: consistent spacing, quieter disclosures and refined borders. No controls, numerical readouts, explanations or dependencies were added.

## Validation

All 103 Node checks pass (55 IF, 30 orbit, 18 LUX). All 66 Chrome checks pass, covering desktop/mobile light and dark, 320px layout, editing, keyboard and touch controls, reduced motion, completed transfers, offscreen animation, and no-JavaScript fallbacks. Browser exceptions: none. Mobile is Chrome emulation; physical iOS/Safari was not checked.

CI-config and production Jekyll builds, absolute URL validation, post social-image metadata, all 32 JSON-LD blocks and per-post script isolation pass. Generated-checker output is byte-identical to baseline; CSS braces balance and diff whitespace checks pass. Visible include text matches the previous revision exactly.

Castle's source, seven assets, complete rendered article/metadata and all 20 index/feed entries are unchanged. Desktop/mobile light/dark screenshot pairs match the unchanged baseline byte-for-byte.

## Screenshots

| Demo | Desktop | Mobile |
| --- | --- | --- |
| IF/EIF | [Light](screenshots/desktop-light-if.png) | [Light](screenshots/mobile-light-if.png), [320px](screenshots/narrow-if.png) |
| Orbit | [Light](screenshots/desktop-light-orbit.png), [dark](screenshots/desktop-dark-orbit.png) | [Light](screenshots/mobile-light-orbit.png) |
| LUX | [Light](screenshots/desktop-light-lux.png) | [Light](screenshots/mobile-light-lux.png), [dark](screenshots/mobile-dark-lux.png) |

The screenshots directory also contains completed flights, first-point feedback, endpoint geometry, Castle comparisons and a machine-readable browser report.

Reproduce by serving the current `_site` on `127.0.0.1:4195` and baseline `rendered/` on `127.0.0.1:4196`, then running `node scripts/design-review/demo-polish-2026-09-19/check-browser.cjs`. Set `CHROME_BINARY` if needed. Baseline commit: `9b69469`; local baseline: `/private/tmp/demo-polish-baseline-20260919/`. Review artifacts are excluded from the generated site. Remote CI and publication are checked separately.
