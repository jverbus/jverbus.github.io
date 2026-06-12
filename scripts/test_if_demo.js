#!/usr/bin/env node
/*
 * Numeric checks for assets/js/if-demo.js (the in-browser isolation forest).
 * Run: node scripts/test_if_demo.js
 *
 * These assertions are designed to fail if the algorithm is wrong, not just
 * if it crashes:
 *  - c(n) average path-length constants match the published formula
 *  - scores are deterministic for a fixed seed and bounded in (0, 1)
 *  - outliers score far above inliers for both IF and EIF
 *  - on an isotropic blob, points on a ring equidistant from the center
 *    should score equally; standard IF shows axis-aligned artifacts (higher
 *    angular variance), EIF should be measurably more rotation-invariant
 *  - on a rotated (diagonal) elongated blob, EIF separates on/off-axis
 *    probes at equal Mahalanobis-style distance better than standard IF
 */
"use strict";

const demo = require("../assets/js/if-demo.js");

let failures = 0;
function check(name, condition, detail) {
  if (condition) {
    console.log("PASS  " + name + (detail ? "  [" + detail + "]" : ""));
  } else {
    failures += 1;
    console.error("FAIL  " + name + (detail ? "  [" + detail + "]" : ""));
  }
}

/* ---- c(n) constants ---- */

const c256 =
  2 * (Math.log(255) + 0.5772156649015329) - (2 * 255) / 256;
check("c(0) = 0", demo.cFactor(0) === 0);
check("c(1) = 0", demo.cFactor(1) === 0);
check("c(2) = 1", demo.cFactor(2) === 1);
check(
  "c(256) matches formula",
  Math.abs(demo.cFactor(256) - c256) < 1e-12,
  demo.cFactor(256).toFixed(5)
);
check("c monotone: c(64) < c(128) < c(256)",
  demo.cFactor(64) < demo.cFactor(128) && demo.cFactor(128) < demo.cFactor(256));

/* ---- shared fixtures ---- */

const blob = demo.makePreset("blob", 12345);

function forests(seed, extended) {
  return demo.buildForest(blob.xs, blob.ys, {
    trees: 100,
    extended: extended,
    seed: seed
  });
}

/* ---- determinism ---- */

{
  const a = forests(42, true);
  const b = forests(42, true);
  let same = true;
  for (let i = 0; i < 50; i++) {
    const x = i / 50;
    if (a.score(x, 0.3) !== b.score(x, 0.3)) same = false;
  }
  check("EIF scores deterministic for fixed seed", same);
  const c = forests(43, true);
  let different = false;
  for (let i = 0; i < 50; i++) {
    const x = i / 50;
    if (Math.abs(a.score(x, 0.3) - c.score(x, 0.3)) > 1e-9) different = true;
  }
  check("different seed changes the forest", different);
}

/* ---- score bounds and inlier/outlier separation ---- */

for (const extended of [false, true]) {
  const label = extended ? "EIF" : "IF";
  const f = forests(7, extended);
  let inBounds = true;
  for (let i = 0; i <= 20; i++) {
    for (let j = 0; j <= 20; j++) {
      const s = f.score(i / 20, j / 20);
      if (!(s > 0 && s < 1)) inBounds = false;
    }
  }
  check(label + " scores in (0, 1)", inBounds);

  const inlier = f.score(0.5, 0.5);
  const outlier = f.score(0.97, 0.03);
  check(
    label + " outlier scores far above inlier",
    outlier > inlier + 0.15,
    "inlier " + inlier.toFixed(3) + " vs outlier " + outlier.toFixed(3)
  );
  check(label + " outlier above 0.5 threshold", outlier > 0.5,
    outlier.toFixed(3));
}

/* ---- rotation invariance on a ring (the axis-bias artifact test) ---- */

{
  const ANGLES = 72;
  const RADIUS = 0.35;
  const SEEDS = [11, 22, 33, 44, 55];
  const angularStd = { if: [], eif: [] };

  for (const seed of SEEDS) {
    for (const extended of [false, true]) {
      const f = demo.buildForest(blob.xs, blob.ys, {
        trees: 200,
        extended: extended,
        seed: seed
      });
      const scores = [];
      for (let a = 0; a < ANGLES; a++) {
        const th = (2 * Math.PI * a) / ANGLES;
        scores.push(
          f.score(0.5 + RADIUS * Math.cos(th), 0.5 + RADIUS * Math.sin(th))
        );
      }
      const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
      const variance =
        scores.reduce((s, v) => s + (v - mean) * (v - mean), 0) /
        scores.length;
      angularStd[extended ? "eif" : "if"].push(Math.sqrt(variance));
    }
  }

  const avg = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const ifStd = avg(angularStd.if);
  const eifStd = avg(angularStd.eif);
  check(
    "EIF ring scores more rotation-invariant than IF",
    eifStd < ifStd * 0.8,
    "IF angular std " + ifStd.toFixed(4) + " vs EIF " + eifStd.toFixed(4)
  );
}

/* ---- diagonal blob: EIF should track non-axis-aligned structure ---- */

{
  // Elongated blob rotated 45 degrees. Probe two points at the same
  // distance from the center: one along the blob's long axis (should look
  // normal) and one perpendicular to it (should look anomalous). EIF should
  // separate them more cleanly than axis-biased standard IF.
  const rng = demo.mulberry32(99);
  const xs = [];
  const ys = [];
  for (let i = 0; i < 256; i++) {
    const along = 0.22 * demo.randNormal(rng);
    const across = 0.025 * demo.randNormal(rng);
    xs.push(0.5 + (along - across) * Math.SQRT1_2);
    ys.push(0.5 + (along + across) * Math.SQRT1_2);
  }
  const D = 0.18;
  const onAxis = [0.5 + D * Math.SQRT1_2, 0.5 + D * Math.SQRT1_2];
  const offAxis = [0.5 + D * Math.SQRT1_2, 0.5 - D * Math.SQRT1_2];

  const gaps = { if: [], eif: [] };
  for (const seed of [3, 14, 15, 92, 65]) {
    for (const extended of [false, true]) {
      const f = demo.buildForest(xs, ys, {
        trees: 200,
        extended: extended,
        seed: seed
      });
      const gap =
        f.score(offAxis[0], offAxis[1]) - f.score(onAxis[0], onAxis[1]);
      gaps[extended ? "eif" : "if"].push(gap);
    }
  }
  const avg = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const ifGap = avg(gaps.if);
  const eifGap = avg(gaps.eif);
  check(
    "diagonal blob: both models score off-axis probe higher",
    ifGap > 0 && eifGap > 0,
    "IF gap " + ifGap.toFixed(4) + ", EIF gap " + eifGap.toFixed(4)
  );
  check(
    "diagonal blob: EIF separates on/off-axis better than IF",
    eifGap > ifGap,
    "IF gap " + ifGap.toFixed(4) + " vs EIF gap " + eifGap.toFixed(4)
  );
}

/* ---- two-blobs ghost regions (the post's centerpiece claim) ---- */

{
  // With blobs at (0.32, 0.64) and (0.68, 0.36), the axis-aligned ghost
  // regions sit at the other two corners of that rectangle. Those points
  // are >= 4 sigma from both blobs and genuinely anomalous, but standard
  // IF under-scores them because each lies inside the low-score bands cast
  // along both blobs' axes. EIF should score them noticeably higher.
  const data = demo.makePreset("two-blobs", 12345);
  const ghosts = [
    [0.32, 0.36],
    [0.68, 0.64]
  ];
  const diffs = [];
  for (const seed of [101, 202, 303, 404, 505]) {
    let ifScore = 0;
    let eifScore = 0;
    for (const extended of [false, true]) {
      const f = demo.buildForest(data.xs, data.ys, {
        trees: 200,
        extended: extended,
        seed: seed
      });
      const mean =
        (f.score(ghosts[0][0], ghosts[0][1]) +
          f.score(ghosts[1][0], ghosts[1][1])) / 2;
      if (extended) eifScore = mean;
      else ifScore = mean;
    }
    diffs.push(eifScore - ifScore);
  }
  const meanDiff = diffs.reduce((s, v) => s + v, 0) / diffs.length;
  check(
    "two-blobs: EIF scores ghost regions higher than IF",
    meanDiff > 0.02,
    "mean EIF-IF ghost gap " + meanDiff.toFixed(4)
  );
}

/* ---- grid scorer agrees with the per-point scorer ---- */

{
  const f = forests(17, true);
  const gw = 16;
  const gh = 12;
  const grid = demo.scoreGrid(f, gw, gh);
  let maxDiff = 0;
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const direct = f.score((i + 0.5) / gw, (j + 0.5) / gh);
      maxDiff = Math.max(maxDiff, Math.abs(grid[j * gw + i] - direct));
    }
  }
  check("scoreGrid matches forest.score exactly", maxDiff < 1e-12,
    "max diff " + maxDiff.toExponential(2));
}

/* ---- presets sane ---- */

for (const name of ["blob", "two-blobs", "sinusoid"]) {
  const data = demo.makePreset(name, 1);
  const inRange = data.xs.every((v) => v >= 0 && v <= 1) &&
    data.ys.every((v) => v >= 0 && v <= 1);
  check("preset '" + name + "' has 256 in-range points",
    data.xs.length === 256 && data.ys.length === 256 && inRange);
}

/* ---- timing sanity (interactive budget) ---- */

{
  const t0 = process.hrtime.bigint();
  const fIf = forests(5, false);
  const fEif = forests(6, true);
  demo.scoreGrid(fIf, 128, 96);
  demo.scoreGrid(fEif, 128, 96);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  check("full retrain + 2x grid scoring under 250 ms", ms < 250,
    ms.toFixed(1) + " ms");
}

console.log(failures === 0 ? "\nAll checks passed." : "\n" + failures + " FAILURES");
process.exit(failures === 0 ? 0 : 1);
