# Demo simplification — September 19, 2026

The previous pass added too many readouts, controls and explanations. This revision makes the visual interaction the main content again.

- Orbit: one canvas, six plain controls and a short status. Near/far labels, numerical readouts, phase text, history charts and completed-flight table are removed. The target and faint coast prediction remain.
- IF/EIF: four buttons and two maps. Click/tap adds points directly; linked cursors remain. Visible scores, coordinates, tree slider, retrain and editing modes are removed. The color key uses words.
- LUX: one recoil-energy readout, the angle slider and Reset. The detector/curve remain; presets, separate angle readout and repeated instructions are removed.

Each demo has a short introduction and a small closed model disclosure. The physics, algorithms, touch-scroll protection, keyboard operation, reduced-motion behavior and no-JavaScript fallback remain.

## Validation

- 103 Node checks pass (55 IF, 30 orbit, 18 LUX), including physical invariants and coast stability.
- All 57 local Chrome checks pass: desktop/mobile light and dark, narrow layouts, controls, keyboard editing, native touch pan/tap, orbit completion, offscreen pause/resume and no-JavaScript fallback. No browser exceptions.
- Both CI-config and production Jekyll builds pass, including absolute production URL validation, post OG metadata, all 32 JSON-LD blocks and script isolation.
- Generated-site checker output matches the unchanged baseline. Castle source, seven assets, complete article/metadata and all index/feed entries are preserved; desktop/mobile screenshots match in both themes.
- CSS braces balance; diff whitespace checks pass. Mobile uses Chrome emulation; physical iOS/Safari was not checked.

## Review images

| Demo | Desktop | Mobile |
| --- | --- | --- |
| IF/EIF | [Light](screenshots/desktop-light-if.png) | [Light](screenshots/mobile-light-if.png) |
| Orbit | [Default](screenshots/desktop-light-orbit.png), [completed Hohmann](screenshots/orbit-hohmann.png) | [Light](screenshots/mobile-light-orbit.png) |
| LUX | [Light](screenshots/desktop-light-lux.png) | [Light](screenshots/mobile-light-lux.png) |

Dark, narrow, endpoint and Castle comparison images are in `screenshots/`, alongside the browser report.

To reproduce: serve the current `_site` on `127.0.0.1:4185` and the unchanged baseline's `rendered/` on `127.0.0.1:4186`, then run `node scripts/design-review/demo-simplification-2026-09-19/check-browser.cjs`. Set `CHROME_BINARY` if needed. Baseline commit: `c64114a`; local baseline directory: `/private/tmp/demo-simple-baseline-20260919/`. These review files are excluded from generated site content. Remote CI and publication are verified separately.
