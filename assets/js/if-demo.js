/*
 * if-demo.js — interactive Isolation Forest vs Extended Isolation Forest demo.
 *
 * Vanilla JS, no dependencies, no build step. Trains both models in the
 * browser on a shared 2-D dataset and renders anomaly-score heatmaps.
 *
 * Algorithm follows Liu, Ting, Zhou (2008) for standard IF and Hariri,
 * Carrasco Kind, Brunner (2021) for EIF (fully extended in 2-D): random
 * hyperplane splits, zero-size leaves allowed, scores s = 2^(-E[h]/c(psi))
 * with the standard average-path-length correction.
 */
(function () {
  "use strict";

  var EULER_GAMMA = 0.5772156649015329;
  var SUBSAMPLE = 256;
  var MAX_POINTS = 1200;
  var GRID_W = 128;
  var GRID_H = 96;
  // Display gamma < 1 stretches the dark (low-score) end of the ramp,
  // where the axis-aligned banding artifacts live.
  var DISPLAY_GAMMA = 0.8;

  /* ---------------- random numbers ---------------- */

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randNormal(rng) {
    var u = 0;
    var v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* ---------------- isolation forest core ---------------- */

  // Average unsuccessful-search path length in a binary search tree of n
  // points; c(1) = 0 and c(2) = 1 exactly, harmonic approximation above.
  function cFactor(n) {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    return 2 * (Math.log(n - 1) + EULER_GAMMA) - (2 * (n - 1)) / n;
  }

  function sampleIndices(n, k, rng) {
    var idx = new Array(n);
    for (var i = 0; i < n; i++) idx[i] = i;
    var m = Math.min(k, n);
    for (var j = 0; j < m; j++) {
      var r = j + Math.floor(rng() * (n - j));
      var tmp = idx[j];
      idx[j] = idx[r];
      idx[r] = tmp;
    }
    idx.length = m;
    return idx;
  }

  function buildNode(xs, ys, indices, depth, maxDepth, rng, extended) {
    var size = indices.length;
    if (depth >= maxDepth || size <= 1) {
      return { leaf: true, adjust: cFactor(size) };
    }

    var minX = Infinity;
    var maxX = -Infinity;
    var minY = Infinity;
    var maxY = -Infinity;
    for (var i = 0; i < size; i++) {
      var x = xs[indices[i]];
      var y = ys[indices[i]];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    if (minX === maxX && minY === maxY) {
      return { leaf: true, adjust: cFactor(size) };
    }

    var left = [];
    var right = [];
    var node;
    if (!extended) {
      // Standard IF: a random non-constant axis, threshold inside its range.
      var dim;
      if (minX === maxX) dim = 1;
      else if (minY === maxY) dim = 0;
      else dim = rng() < 0.5 ? 0 : 1;
      var lo = dim === 0 ? minX : minY;
      var hi = dim === 0 ? maxX : maxY;
      var q = lo + rng() * (hi - lo);
      for (var a = 0; a < size; a++) {
        var va = dim === 0 ? xs[indices[a]] : ys[indices[a]];
        (va < q ? left : right).push(indices[a]);
      }
      node = { leaf: false, dim: dim, q: q };
    } else {
      // EIF: random hyperplane through a point in the node's bounding box.
      // Zero-size children are allowed, matching the reference semantics.
      var n1 = randNormal(rng);
      var n2 = randNormal(rng);
      var px = minX + rng() * (maxX - minX);
      var py = minY + rng() * (maxY - minY);
      for (var b = 0; b < size; b++) {
        var dot =
          (xs[indices[b]] - px) * n1 + (ys[indices[b]] - py) * n2;
        (dot <= 0 ? left : right).push(indices[b]);
      }
      node = { leaf: false, dim: null, n1: n1, n2: n2, px: px, py: py };
    }

    node.left = buildNode(xs, ys, left, depth + 1, maxDepth, rng, extended);
    node.right = buildNode(xs, ys, right, depth + 1, maxDepth, rng, extended);
    return node;
  }

  // Flatten a built tree into one Float64Array for fast traversal.
  // Node stride 7: [tag, a, b, c, d, left, right] where tag 0 = leaf
  // (a = path-length adjustment), tag 1 = axis split (a = dim, b = q),
  // tag 2 = hyperplane (a = n1, b = n2, c = px, d = py).
  function flattenTree(root) {
    var nodes = [];
    function emit(node) {
      var base = nodes.length;
      nodes.length = base + 7;
      if (node.leaf) {
        nodes[base] = 0;
        nodes[base + 1] = node.adjust;
        nodes[base + 2] = 0;
        nodes[base + 3] = 0;
        nodes[base + 4] = 0;
        nodes[base + 5] = 0;
        nodes[base + 6] = 0;
      } else if (node.dim !== null) {
        nodes[base] = 1;
        nodes[base + 1] = node.dim;
        nodes[base + 2] = node.q;
        nodes[base + 3] = 0;
        nodes[base + 4] = 0;
        nodes[base + 5] = emit(node.left);
        nodes[base + 6] = emit(node.right);
      } else {
        nodes[base] = 2;
        nodes[base + 1] = node.n1;
        nodes[base + 2] = node.n2;
        nodes[base + 3] = node.px;
        nodes[base + 4] = node.py;
        nodes[base + 5] = emit(node.left);
        nodes[base + 6] = emit(node.right);
      }
      return base;
    }
    emit(root);
    return Float64Array.from(nodes);
  }

  function flatPathLength(arr, x, y) {
    var i = 0;
    var depth = 0;
    for (;;) {
      var tag = arr[i];
      if (tag === 0) return depth + arr[i + 1];
      if (tag === 1) {
        i =
          ((arr[i + 1] === 0 ? x : y) < arr[i + 2]
            ? arr[i + 5]
            : arr[i + 6]) | 0;
      } else {
        i =
          ((x - arr[i + 3]) * arr[i + 1] + (y - arr[i + 4]) * arr[i + 2] <= 0
            ? arr[i + 5]
            : arr[i + 6]) | 0;
      }
      depth++;
    }
  }

  function buildForest(xs, ys, opts) {
    var n = xs.length;
    var numTrees = opts.trees;
    var extended = !!opts.extended;
    var rng = mulberry32(opts.seed);
    var sub = Math.min(SUBSAMPLE, n);
    var maxDepth = Math.max(1, Math.ceil(Math.log(sub) / Math.LN2));
    var trees = new Array(numTrees);
    for (var t = 0; t < numTrees; t++) {
      var idx = sampleIndices(n, sub, rng);
      trees[t] = flattenTree(
        buildNode(xs, ys, idx, 0, maxDepth, rng, extended)
      );
    }
    var cNorm = cFactor(sub);
    return {
      trees: trees,
      cNorm: cNorm,
      score: function (x, y) {
        var sum = 0;
        for (var i = 0; i < numTrees; i++) {
          sum += flatPathLength(trees[i], x, y);
        }
        return Math.pow(2, -(sum / numTrees) / cNorm);
      }
    };
  }

  // Grid scoring iterates one tree at a time so each ~20 KB flattened tree
  // stays hot in cache across the whole grid, instead of cycling the full
  // ensemble through cache at every cell.
  function scoreGrid(forest, gw, gh) {
    var trees = forest.trees;
    var sums = new Float64Array(gw * gh);
    for (var t = 0; t < trees.length; t++) {
      var arr = trees[t];
      var k = 0;
      for (var j = 0; j < gh; j++) {
        var y = (j + 0.5) / gh;
        for (var i = 0; i < gw; i++) {
          sums[k++] += flatPathLength(arr, (i + 0.5) / gw, y);
        }
      }
    }
    var out = new Float64Array(gw * gh);
    var invTrees = 1 / trees.length;
    var invC = 1 / forest.cNorm;
    for (var m = 0; m < sums.length; m++) {
      out[m] = Math.pow(2, -(sums[m] * invTrees) * invC);
    }
    return out;
  }

  // Robust shared color range: a 2-98 percentile stretch over both score
  // grids. Clipping the extreme tails spends the color ramp on the score
  // structure instead of on a handful of extreme cells, and sharing one
  // range across panels keeps the IF vs EIF comparison honest.
  function computeColorRange(gridA, gridB) {
    var sample = [];
    var i;
    for (i = 0; i < gridA.length; i += 3) sample.push(gridA[i]);
    for (i = 0; i < gridB.length; i += 3) sample.push(gridB[i]);
    sample.sort(function (a, b) {
      return a - b;
    });
    var lo = sample[Math.floor(0.02 * (sample.length - 1))];
    var hi = sample[Math.ceil(0.98 * (sample.length - 1))];
    if (hi - lo < 0.02) {
      var mid = (hi + lo) / 2;
      lo = mid - 0.01;
      hi = mid + 0.01;
    }
    return [lo, hi];
  }

  /* ---------------- preset datasets ---------------- */

  function clamp01(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  function makePreset(name, seed) {
    var rng = mulberry32(seed);
    var xs = [];
    var ys = [];
    var i;
    if (name === "two-blobs") {
      var centers = [
        [0.24, 0.74],
        [0.76, 0.26]
      ];
      for (var c = 0; c < 2; c++) {
        for (i = 0; i < 128; i++) {
          xs.push(clamp01(centers[c][0] + 0.055 * randNormal(rng), 0.03, 0.97));
          ys.push(clamp01(centers[c][1] + 0.055 * randNormal(rng), 0.03, 0.97));
        }
      }
    } else if (name === "sinusoid") {
      for (i = 0; i < 256; i++) {
        var u = rng();
        var x = 0.06 + 0.88 * u;
        var y = 0.5 + 0.23 * Math.sin(2 * Math.PI * 1.2 * u);
        xs.push(x);
        ys.push(clamp01(y + 0.03 * randNormal(rng), 0.03, 0.97));
      }
    } else {
      // single blob
      for (i = 0; i < 256; i++) {
        xs.push(clamp01(0.5 + 0.065 * randNormal(rng), 0.03, 0.97));
        ys.push(clamp01(0.5 + 0.065 * randNormal(rng), 0.03, 0.97));
      }
    }
    return { xs: xs, ys: ys };
  }

  /* ---------------- colormap (viridis) ---------------- */

  var VIRIDIS = [
    [68, 1, 84],
    [59, 82, 139],
    [33, 145, 140],
    [94, 201, 98],
    [253, 231, 37]
  ];

  function buildLut() {
    var lut = new Uint8ClampedArray(256 * 3);
    for (var i = 0; i < 256; i++) {
      var t = (i / 255) * (VIRIDIS.length - 1);
      var k = Math.min(VIRIDIS.length - 2, Math.floor(t));
      var f = t - k;
      for (var ch = 0; ch < 3; ch++) {
        lut[i * 3 + ch] = VIRIDIS[k][ch] + f * (VIRIDIS[k + 1][ch] - VIRIDIS[k][ch]);
      }
    }
    return lut;
  }

  /* ---------------- demo widget ---------------- */

  function initDemo(root) {
    var canvases = root.querySelectorAll("canvas[data-panel]");
    if (canvases.length !== 2) return false;
    var ifCanvas = root.querySelector('canvas[data-panel="if"]');
    var eifCanvas = root.querySelector('canvas[data-panel="eif"]');
    var ifCtx = ifCanvas.getContext("2d");
    var eifCtx = eifCanvas.getContext("2d");
    if (!ifCtx || !eifCtx) return false;

    var lut = buildLut();
    var off = document.createElement("canvas");
    var offCtx = off.getContext("2d");
    var image = null;

    function setGridSize(gw, gh) {
      if (off.width !== gw || off.height !== gh) {
        off.width = gw;
        off.height = gh;
        image = offCtx.createImageData(gw, gh);
      } else if (!image) {
        image = offCtx.createImageData(gw, gh);
      }
    }

    var baseSeed = parseInt(root.getAttribute("data-seed"), 10) || 20260318;
    var state = {
      xs: [],
      ys: [],
      trees: 100,
      forestSeed: baseSeed,
      pending: false,
      coarse: false
    };

    var started = false;

    function loadPreset(name) {
      started = true;
      var data = makePreset(name, baseSeed + 7);
      state.xs = data.xs;
      state.ys = data.ys;
      schedule();
    }

    function styleColor(prop, fallback) {
      var v = getComputedStyle(root).getPropertyValue(prop).trim();
      return v || fallback;
    }


    function fitCanvas(canvas) {
      var rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = Math.round(rect.width * dpr);
      var h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    function paintPanel(ctx, canvas, grid, lo, hi) {
      var range = Math.max(1e-6, hi - lo);
      var px = image.data;
      for (var i = 0; i < grid.length; i++) {
        var t = Math.max(0, Math.min(1, (grid[i] - lo) / range));
        t = Math.pow(t, DISPLAY_GAMMA);
        var k = 3 * Math.max(0, Math.min(255, Math.round(t * 255)));
        px[i * 4] = lut[k];
        px[i * 4 + 1] = lut[k + 1];
        px[i * 4 + 2] = lut[k + 2];
        px[i * 4 + 3] = 255;
      }
      offCtx.putImageData(image, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);

      // training points: light fill with dark ring reads on every ramp color
      var r = Math.max(2, canvas.width / 320);
      ctx.lineWidth = Math.max(1, r * 0.55);
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.strokeStyle = "rgba(15, 23, 42, 0.75)";
      for (var p = 0; p < state.xs.length; p++) {
        ctx.beginPath();
        ctx.arc(
          state.xs[p] * canvas.width,
          state.ys[p] * canvas.height,
          r,
          0,
          2 * Math.PI
        );
        ctx.fill();
        ctx.stroke();
      }
    }

    function paintEmpty(ctx, canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = styleColor("--surface-muted", "#f3f6fb");
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = styleColor("--text-muted", "#4b5563");
      var fontPx = Math.max(12, Math.round(canvas.width / 34));
      ctx.font = "500 " + fontPx + "px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "Click or tap to add points",
        canvas.width / 2,
        canvas.height / 2
      );
    }

    function render() {
      state.pending = false;
      fitCanvas(ifCanvas);
      fitCanvas(eifCanvas);
      if (state.xs.length < 2) {
        paintEmpty(ifCtx, ifCanvas);
        paintEmpty(eifCtx, eifCanvas);
        return;
      }
      var ifForest = buildForest(state.xs, state.ys, {
        trees: state.trees,
        extended: false,
        seed: state.forestSeed
      });
      var eifForest = buildForest(state.xs, state.ys, {
        trees: state.trees,
        extended: true,
        seed: state.forestSeed + 1
      });
      // half-resolution while dragging keeps the spray interaction fluid;
      // a full-resolution pass lands on pointer release
      var gw = state.coarse ? GRID_W / 2 : GRID_W;
      var gh = state.coarse ? GRID_H / 2 : GRID_H;
      setGridSize(gw, gh);
      var gridIf = scoreGrid(ifForest, gw, gh);
      var gridEif = scoreGrid(eifForest, gw, gh);

      var range = computeColorRange(gridIf, gridEif);
      paintPanel(ifCtx, ifCanvas, gridIf, range[0], range[1]);
      paintPanel(eifCtx, eifCanvas, gridEif, range[0], range[1]);
    }

    function schedule() {
      if (state.pending) return;
      state.pending = true;
      window.requestAnimationFrame(render);
    }

    /* ---- pointer interaction ---- */

    function eventCoords(canvas, event) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height
      };
    }

    function addPoint(x, y) {
      if (state.xs.length >= MAX_POINTS) return;
      state.xs.push(clamp01(x, 0, 1));
      state.ys.push(clamp01(y, 0, 1));
      schedule();
    }

    function erasePoints(x, y) {
      var radius = 0.04;
      var keptX = [];
      var keptY = [];
      for (var i = 0; i < state.xs.length; i++) {
        var dx = state.xs[i] - x;
        var dy = state.ys[i] - y;
        if (dx * dx + dy * dy > radius * radius) {
          keptX.push(state.xs[i]);
          keptY.push(state.ys[i]);
        }
      }
      state.xs = keptX;
      state.ys = keptY;
      schedule();
    }

    function bindPointer(canvas) {
      var drawing = false;
      var lastX = -1;
      var lastY = -1;
      canvas.addEventListener("pointerdown", function (event) {
        var pos = eventCoords(canvas, event);
        if (event.shiftKey) {
          erasePoints(pos.x, pos.y);
          return;
        }
        drawing = true;
        lastX = pos.x;
        lastY = pos.y;
        addPoint(pos.x, pos.y);
        if (event.pointerType !== "touch") {
          canvas.setPointerCapture(event.pointerId);
          event.preventDefault();
        }
      });
      canvas.addEventListener("pointermove", function (event) {
        if (!drawing || event.pointerType === "touch") return;
        var pos = eventCoords(canvas, event);
        var dx = pos.x - lastX;
        var dy = pos.y - lastY;
        if (dx * dx + dy * dy < 0.0004) return;
        lastX = pos.x;
        lastY = pos.y;
        state.coarse = true;
        addPoint(pos.x, pos.y);
      });
      var stop = function () {
        drawing = false;
        if (state.coarse) {
          state.coarse = false;
          schedule();
        }
      };
      canvas.addEventListener("pointerup", stop);
      canvas.addEventListener("pointercancel", stop);
    }

    bindPointer(ifCanvas);
    bindPointer(eifCanvas);

    /* ---- controls ---- */

    var presetButtons = root.querySelectorAll("button[data-preset]");
    presetButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        presetButtons.forEach(function (other) {
          other.classList.toggle("is-active", other === button);
        });
        loadPreset(button.getAttribute("data-preset"));
      });
    });

    var rerollButton = root.querySelector('button[data-action="reroll"]');
    if (rerollButton) {
      rerollButton.addEventListener("click", function () {
        state.forestSeed = (state.forestSeed * 1664525 + 1013904223) >>> 0;
        schedule();
      });
    }

    var clearButton = root.querySelector('button[data-action="clear"]');
    if (clearButton) {
      clearButton.addEventListener("click", function () {
        state.xs = [];
        state.ys = [];
        schedule();
      });
    }

    var slider = root.querySelector('input[type="range"]');
    var sliderOut = root.querySelector("output");
    if (slider) {
      slider.addEventListener("input", function () {
        state.trees = parseInt(slider.value, 10) || 100;
        if (sliderOut) sliderOut.textContent = String(state.trees);
        state.coarse = true;
        schedule();
      });
      slider.addEventListener("change", function () {
        state.coarse = false;
        schedule();
      });
    }

    /* ---- environment hooks ---- */

    if (typeof ResizeObserver !== "undefined") {
      var observer = new ResizeObserver(schedule);
      observer.observe(root);
    } else {
      window.addEventListener("resize", schedule);
    }
    if (window.matchMedia) {
      var scheme = window.matchMedia("(prefers-color-scheme: dark)");
      if (scheme.addEventListener) {
        scheme.addEventListener("change", schedule);
      }
    }

    root.hidden = false;

    // Defer the first (most expensive) train + paint until the demo is
    // near the viewport, so it costs nothing on initial page load.
    if (typeof IntersectionObserver !== "undefined") {
      var io = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              io.disconnect();
              if (!started) loadPreset("blob");
              return;
            }
          }
        },
        { rootMargin: "600px 0px" }
      );
      io.observe(root);
    } else {
      loadPreset("blob");
    }
    return true;
  }

  /* ---------------- exports / boot ---------------- */

  var api = {
    mulberry32: mulberry32,
    randNormal: randNormal,
    cFactor: cFactor,
    buildForest: buildForest,
    scoreGrid: scoreGrid,
    computeColorRange: computeColorRange,
    makePreset: makePreset,
    SUBSAMPLE: SUBSAMPLE
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof document !== "undefined") {
    var boot = function () {
      document.querySelectorAll("[data-if-demo]").forEach(function (root) {
        try {
          initDemo(root);
        } catch (error) {
          root.hidden = true;
        }
      });
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }
})();
