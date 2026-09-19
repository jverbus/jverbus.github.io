# Interactive demo improvements — September 18, 2026

The three demos now put their main comparison or physical result beside the interaction.
The implementation keeps vanilla JavaScript, the existing shared stylesheet, per-panel
canvas state, static fragment anchors and hidden no-JavaScript fallbacks.

## Changes

| Demo | Interaction and presentation | Corrections |
| --- | --- | --- |
| Isolation Forest / EIF | Opens on two clusters with a linked probe in an empty corner; exact numerical scores, keyboard inspection and explicit Inspect/Add/Erase tools. Shared color endpoints are labeled. | The first point is visible after Clear. A touch pan does not edit data. Models, score grids and panel rasters are cached; resize, theme changes and inspection reuse them. Interrupted editing gestures are canceled. |
| Orbital transfer | Shows the predicted coast orbit, near/far points, a burn cue, transfer phases and completed-flight comparisons that survive Reset. Greedy playback runs at an explicitly labeled 4× speed. | Both Hohmann impulses fit the labeled chart. Histories retain the start of the flight. Success uses the same radius band as the display, with departure/reentry handled after manual burns. The visible planet matches the collision radius. Paused/offscreen/hidden loops and held burns stop. |
| LUX scattering | Adds an angle slider, Sub-keV/1 keV/Maximum examples and a single illustrative neutron traversal. Angle and recoil energy sit immediately below the detector, before the chart on mobile. | Drawing and physics share isotropic coordinates. Plot margins preserve labels and endpoint markers; zero and below-range energies stay represented. Positive energies below the readout precision are distinguished from zero. Layout is reserved before lazy drawing so fragment navigation stays in place. |

Model details remain available in native disclosure elements below each visualization.
The orbit notes preserve the distinction between velocity-directed browser impulses and
the notebook's orbital-tangent actions. LUX uses the average natural-xenon mass and labels
the animated travel time as illustrative. The IF notes describe the estimated shared
percentile scale and widening for nearly equal scores.

The existing algorithms, article URLs, resource links and article bodies are retained.
Only the orbital post's revision date changes, to September 18; the other two already
carry that date. Stylesheet cache is `loop58`; scripts are IF `v8`, orbit `v7`, LUX `v5`.

## Local validation

- All 99 Node checks pass: 51 IF, 30 orbit and 18 LUX.
- IF tests exercise the actual widget handlers using a dependency-free DOM stub, including
  touch cancellation, keyboard editing, cache reuse, blur/pagehide cleanup and bfcache repaint.
- Orbit tests compare analytic and simulated transfers and independently coast each completed
  strategy for two full orbits. Hohmann remains within radius 1.599291–1.600717 and Greedy
  within 1.570515–1.618854, inside the displayed 1.568–1.632 band.
- LUX tests compare energy loss through independent formulas, verify displayed angle and
  pointer projection across aspect ratios/resolutions, and check the entire slider range.
- The Jekyll build with `_config.yml,_config.ci.yml`, OG metadata validator and generated-site
  validator pass. Generated-site checker output is byte-identical to the baseline.
- The production build also passes generated-site validation with absolute site URLs required.
- All 32 JSON-LD blocks parse. Each demo script loads on exactly its own post. Review files
  stay excluded from generated content. CSS braces balance and `git diff --check` passes.

All 60 Chrome browser checks pass. They cover desktop 1280px and emulated mobile 390px in light/dark themes,
plus 320px layouts. They exercise keyboard probe movement, first-point feedback, LUX
presets and zero energy, the native angle slider, one-shot animation and interruption,
Hohmann → Greedy → manual results, departure/reentry, paused/offscreen behavior, native
touch pan versus tap, sticky mobile score readout, reduced motion and no-JavaScript anchors.
The browser reports no JavaScript exceptions or horizontal page overflow.

These are desktop Chrome and emulated touch/mobile checks, not physical iOS or native Safari
coverage. Core physics/algorithm tests run in CI; the browser harness is a separate local check.
Remote CI results belong to the pull request and are not inferred from the local checks.

## Castle preservation

An actual unchanged-tree build at `3d4f116` and tracked source/asset hashes were saved before
editing at `/private/tmp/demo-improvements-baseline-20260918/`. Running
`scripts/editorial-review/check_castle.py BASELINE _site --allow-shared-ui` confirms that
Castle's source, seven local assets, complete rendered article, content metadata and
20 entries in 12 files remain unchanged. Only the permitted shared CSS cache version
changes in its head. Desktop/mobile screenshots match the baseline byte-for-byte in
both themes; native browser scrollbars are hidden for deterministic capture.

## Screenshots

| Demo | Desktop | Mobile | Dark |
| --- | --- | --- | --- |
| IF / EIF | [Linked probe](screenshots/desktop-light-if.png) | [Controls and maps](screenshots/mobile-light-if.png), [readout while inspecting EIF](screenshots/mobile-if-linked-readout.png) | [Desktop](screenshots/desktop-dark-if.png) |
| Orbit | [Completed comparisons](screenshots/orbit-comparison.png), [Hohmann](screenshots/orbit-hohmann.png) | [Controls](screenshots/mobile-light-orbit.png), [320px comparison table](screenshots/narrow-orbit-comparison.png) | [Desktop](screenshots/desktop-dark-orbit.png) |
| LUX | [1 keV](screenshots/desktop-light-lux.png), [maximum](screenshots/lux-maximum.png), [zero](screenshots/lux-zero-energy.png) | [Detector and energy](screenshots/mobile-light-lux.png) | [Desktop](screenshots/desktop-dark-lux.png) |

Castle baseline/current image pairs and the machine-readable browser report are in
`screenshots/` as well.

## Reproduce the browser check

Build the edited site, serve `_site` on `127.0.0.1:4175`, and serve the saved baseline's
`rendered/` directory on `127.0.0.1:4176`. From the repository root, run:

```sh
node scripts/design-review/demo-improvements-2026-09-18/check-browser.cjs
```

The harness uses Node built-ins and Chrome's debugging pipe. Set `CHROME_BINARY` if Chrome
is installed somewhere other than the macOS default. `--extra` runs only the animation,
touch and lifecycle checks. The baseline itself is outside the repository; the screenshots
and notes are excluded review artifacts, not site content.
