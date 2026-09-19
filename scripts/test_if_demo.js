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
  // With blobs at (0.24, 0.74) and (0.76, 0.26), the axis-aligned ghost
  // regions sit at the other two corners of that rectangle. Those points
  // are many sigma from both blobs and genuinely anomalous, but standard
  // IF under-scores them because each lies inside the low-score bands cast
  // along both blobs' axes. EIF should score them noticeably higher.
  const data = demo.makePreset("two-blobs", 12345);
  const ghosts = [
    [0.24, 0.26],
    [0.76, 0.74]
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

/* ---- the two panels must receive genuinely different grids ---- */

{
  // Regression guard for the mobile bug where both panels displayed the
  // same heatmap: the grids handed to the painter must differ. (The
  // display-layer fix is per-panel offscreen canvases; this pins the
  // data layer so any future "panels look identical" report points at
  // rendering, not scoring.)
  const seed = 20260318;
  const data = demo.makePreset("blob", seed + 7);
  const fIf = demo.buildForest(data.xs, data.ys,
    { trees: 100, extended: false, seed: seed });
  const fEif = demo.buildForest(data.xs, data.ys,
    { trees: 100, extended: true, seed: seed + 1 });
  const a = demo.scoreGrid(fIf, 64, 48);
  const b = demo.scoreGrid(fEif, 64, 48);
  let meanDiff = 0;
  for (let i = 0; i < a.length; i++) meanDiff += Math.abs(a[i] - b[i]);
  meanDiff /= a.length;
  check("IF and EIF panel grids differ", meanDiff > 0.01,
    "mean |IF-EIF| " + meanDiff.toFixed(4));
}

/* ---- robust color range increases contrast over min/max ---- */

{
  const f = forests(17, false);
  const g = forests(18, true);
  const a = demo.scoreGrid(f, 64, 48);
  const b = demo.scoreGrid(g, 64, 48);
  const [lo, hi] = demo.computeColorRange(a, b);
  let min = Infinity;
  let max = -Infinity;
  for (const grid of [a, b]) {
    for (const v of grid) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  check("color range ordered and within score bounds",
    lo < hi && lo >= min && hi <= max,
    lo.toFixed(3) + " .. " + hi.toFixed(3));
  check("percentile stretch narrower than raw min/max",
    hi - lo < max - min,
    "stretched " + (hi - lo).toFixed(3) + " vs raw " + (max - min).toFixed(3));
}

/* ---- single-tree forest (slider minimum) stays well-behaved ---- */

{
  for (const extended of [false, true]) {
    const f = demo.buildForest(blob.xs, blob.ys, {
      trees: 1,
      extended: extended,
      seed: 9
    });
    let ok = true;
    for (let i = 0; i <= 10; i++) {
      for (let j = 0; j <= 10; j++) {
        const s = f.score(i / 10, j / 10);
        if (!(s > 0 && s < 1)) ok = false;
      }
    }
    check((extended ? "EIF" : "IF") + " with a single tree scores in (0, 1)", ok);
  }
}

/* ---- presets sane ---- */

for (const name of ["blob", "two-blobs", "sinusoid"]) {
  const data = demo.makePreset(name, 1);
  const inRange = data.xs.every((v) => v >= 0 && v <= 1) &&
    data.ys.every((v) => v >= 0 && v <= 1);
  check("preset '" + name + "' has 256 in-range points",
    data.xs.length === 256 && data.ys.length === 256 && inRange);

  // preset chips resample: a new seed must give a genuinely new draw,
  // and the same seed must reproduce the same draw
  const again = demo.makePreset(name, 1);
  const fresh = demo.makePreset(name, 2);
  const identical = data.xs.every((v, i) => v === again.xs[i]) &&
    data.ys.every((v, i) => v === again.ys[i]);
  const changed = data.xs.some((v, i) => v !== fresh.xs[i]);
  check("preset '" + name + "' reproducible per seed, fresh per reseed",
    identical && changed);
}

/* ---- timing sanity ---- */

{
  // Generous bound: ~95 ms warm on a dev machine; the point is to catch an
  // accidental complexity regression, not to benchmark slow CI runners.
  const t0 = process.hrtime.bigint();
  const fIf = forests(5, false);
  const fEif = forests(6, true);
  demo.scoreGrid(fIf, 128, 96);
  demo.scoreGrid(fEif, 128, 96);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  check("full retrain + 2x grid scoring under 500 ms", ms < 500,
    ms.toFixed(1) + " ms");
}

/* ---- cached comparison: inspecting is independent of training ---- */

{
  const seed = 20260318;
  const data = demo.makePreset("two-blobs", seed + 7);
  const model = demo.createComparison({ trees: 100, seed });
  model.setData(data.xs, data.ys);
  const grid = model.grid(16, 12);
  const marked = model.score(0.24, 0.26);
  check("opening marked empty corner exposes IF ghost region",
    marked[1] > marked[0] + 0.02,
    "IF " + marked[0].toFixed(3) + " vs EIF " + marked[1].toFixed(3));
  for (let i = 0; i < 20; i++) model.score(i / 20, 0.6);
  model.setTrees(100);
  model.setSeed(seed);
  check("probe reads and unchanged options reuse the scored grid",
    model.grid(16, 12) === grid);
  model.grid(8, 6);
  check("coarse preview preserves the cached full-resolution grid",
    model.grid(16, 12) === grid);
  model.setSeed(seed + 5);
  const rerolled = model.grid(16, 12);
  check("new seed invalidates the grid and changes scores",
    rerolled !== grid && rerolled.ifScores.some((s, i) => s !== grid.ifScores[i]));
  model.setTrees(20);
  const fewer = model.grid(16, 12);
  check("tree count invalidates both cached maps",
    fewer !== rerolled && fewer.eifScores.some((s, i) => s !== rerolled.eifScores[i]));
  model.setData([0.3], [0.4]);
  check("a one-point dataset has no misleading score or stale heatmap",
    model.grid(16, 12) === null && model.score(0.3, 0.4) === null);
  model.setData([0.3, 0.7], [0.4, 0.6]);
  check("adding the second point produces finite scores",
    model.score(0.5, 0.5).every(Number.isFinite));
}

/* ---- real widget event handlers, with a small dependency-free DOM stub ---- */

{
  const fs = require("fs");
  const path = require("path");
  const vm = require("vm");
  class Element {
    constructor(attrs = {}) {
      this.attrs = attrs;
      this.events = {};
      this.textContent = "";
      this.classList = { toggle() {} };
    }
    addEventListener(name, fn) { (this.events[name] ||= []).push(fn); }
    getAttribute(name) { return this.attrs[name] || null; }
    setAttribute(name, value) { this.attrs[name] = value; }
    emit(name, extra = {}) {
      const event = { button: 0, pointerId: 1, pointerType: "mouse", clientX: 80,
        clientY: 60, shiftKey: false, preventDefault() {}, ...extra };
      for (const fn of this.events[name] || []) fn(event);
    }
    focus() {}
    setPointerCapture() {}
  }
  let rasterWrites = 0;
  class Canvas extends Element {
    constructor() {
      super();
      this.width = 320;
      this.height = 240;
      this.context = {
        arcs: [], labels: [],
        createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData() { rasterWrites++; },
        clearRect() { this.arcs = []; this.labels = []; },
        arc(x, y, radius) { this.arcs.push({ x, y, radius }); },
        fillText(text) { this.labels.push(text); },
        beginPath() {}, moveTo() {}, lineTo() {}, fill() {}, stroke() {},
        fillRect() {}, drawImage() {}
      };
    }
    getContext() { return this.context; }
    getBoundingClientRect() { return { left: 0, top: 0, width: 320, height: 240 }; }
  }
  const left = new Canvas();
  const right = new Canvas();
  const slider = new Element();
  slider.value = "5";
  const presets = ["blob", "two-blobs", "sinusoid"].map((name) =>
    new Element({ "data-preset": name, "aria-pressed": String(name === "two-blobs") }));
  const tools = ["inspect", "add", "erase"].map((name) =>
    new Element({ "data-tool": name, "aria-pressed": String(name === "inspect") }));
  const nodes = {
    'canvas[data-panel="if"]': left, 'canvas[data-panel="eif"]': right,
    'input[type="range"]': slider,
    'button[data-action="clear"]': new Element(),
    'button[data-action="reroll"]': new Element()
  };
  for (const name of ["score-if", "score-eif", "probe-context", "scale-low", "scale-high",
    "if-announcement", "tree-count"]) nodes["[data-" + name + "]"] = new Element();
  const root = new Element({ "data-seed": "20260318" });
  root.hidden = true;
  root.querySelector = (selector) => nodes[selector] || null;
  root.querySelectorAll = (selector) => selector === "button[data-preset]" ? presets : tools;
  const timers = new Map();
  let nextTimer = 0;
  const frames = [];
  const browser = new Element();
  browser.devicePixelRatio = 1;
  browser.requestAnimationFrame = (callback) => frames.push(callback);
  browser.setTimeout = (callback) => { timers.set(++nextTimer, callback); return nextTimer; };
  browser.clearTimeout = (id) => timers.delete(id);
  function flush() {
    let turns = 0;
    while ((timers.size || frames.length) && turns++ < 20) {
      const scheduled = [...timers.values()];
      timers.clear();
      scheduled.forEach((callback) => callback());
      frames.splice(0).forEach((callback) => callback());
    }
    if (turns >= 20) throw new Error("Widget did not settle");
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../assets/js/if-demo.js"), "utf8"), {
    window: browser,
    document: { readyState: "complete", querySelectorAll: () => [root],
      createElement: () => new Canvas() },
    getComputedStyle: () => ({ getPropertyValue: () => "" })
  });
  // Exercise the actual slider handlers while keeping UI regression checks fast.
  slider.emit("input");
  slider.emit("change");
  flush();
  check("widget opens with a numeric shared scale", !root.hidden &&
    Number(nodes["[data-scale-high]"].textContent) > Number(nodes["[data-scale-low]"].textContent));
  const openingWrites = rasterWrites;
  left.emit("pointermove", { clientX: 160, clientY: 120 });
  flush();
  const linkedLeft = left.context.arcs.filter((arc) => arc.radius === 7);
  const linkedRight = right.context.arcs.filter((arc) => arc.radius === 7);
  check("inspection moves a linked marker on both panels without repainting heatmap pixels",
    rasterWrites === openingWrites && linkedLeft[0].x === 160 && linkedRight[0].x === 160 &&
    linkedLeft[0].y === 120 && linkedRight[0].y === 120);
  browser.emit("resize");
  flush();
  check("resize reuses the heatmap raster", rasterWrites === openingWrites);
  browser.emit("pageshow", { persisted: true });
  flush();
  check("back-forward restoration repaints both possibly evicted panel bitmaps",
    rasterWrites === openingWrites + 2);
  nodes['button[data-action="clear"]'].emit("click");
  flush();
  tools[1].emit("click");
  check("selected editing tool is exposed to assistive technology",
    tools[1].getAttribute("aria-pressed") === "true" &&
    tools[0].getAttribute("aria-pressed") === "false");
  left.emit("pointerdown", { pointerType: "touch" });
  flush();
  check("touch-down alone does not edit data",
    left.context.arcs.filter((arc) => arc.radius === 2).length === 0);
  left.emit("pointermove", { pointerType: "touch", clientY: 110 });
  left.emit("pointercancel", { pointerType: "touch" });
  flush();
  check("touch page-scroll cancellation does not add a point",
    left.context.arcs.filter((arc) => arc.radius === 2).length === 0);
  left.emit("pointerdown", { pointerType: "touch" });
  left.emit("pointerup", { pointerType: "touch" });
  flush();
  check("completed touch tap visibly paints the first point and requests one more",
    left.context.arcs.filter((arc) => arc.radius === 2).length === 1 &&
    left.context.labels.includes("Add one more point to train") &&
    nodes["[data-score-if]"].textContent === "\u2014");
  left.emit("keydown", { key: "ArrowRight" });
  left.emit("keydown", { key: "Enter" });
  flush();
  check("keyboard can place the second point and start training",
    left.context.arcs.filter((arc) => arc.radius === 2).length === 2 &&
    Number.isFinite(Number(nodes["[data-score-if]"].textContent)));
  tools[0].emit("click");
  left.emit("pointerdown", { pointerType: "touch", clientX: 240 });
  left.emit("pointerup", { pointerType: "touch", clientX: 240 });
  flush();
  check("Inspect touch tap does not change training points",
    left.context.arcs.filter((arc) => arc.radius === 2).length === 2);
  tools[2].emit("click");
  left.emit("pointerdown", { pointerType: "touch" });
  left.emit("pointerup", { pointerType: "touch" });
  flush();
  check("touch Erase removes points without a modifier key",
    left.context.arcs.filter((arc) => arc.radius === 2).length === 0 &&
    nodes["[data-score-if]"].textContent === "\u2014");
  left.emit("keydown", { key: "ArrowRight" });
  flush();
  check("keyboard probe stays visible on an empty map before placing a point",
    left.context.arcs.some((arc) => arc.radius === 7 && Math.abs(arc.x - 83.2) < 1e-9));
  tools[1].emit("click");
  left.emit("pointerdown");
  flush();
  browser.emit("blur");
  left.emit("pointermove", { clientX: 240, clientY: 180, buttons: 0 });
  flush();
  check("window blur ends Add gesture before an unpressed pointer returns",
    left.context.arcs.filter((arc) => arc.radius === 2).length === 1);
  left.emit("pointerdown", { clientX: 240, clientY: 180 });
  flush();
  browser.emit("pagehide");
  left.emit("pointermove", { clientX: 160, clientY: 120, buttons: 0 });
  flush();
  check("pagehide ends Add gesture even without pointerup or pointercancel",
    left.context.arcs.filter((arc) => arc.radius === 2).length === 2);
}

console.log(failures === 0 ? "\nAll checks passed." : "\n" + failures + " FAILURES");
process.exit(failures === 0 ? 0 : 1);
