/*
 * lux-demo.js — interactive D-D neutron scattering kinematics for the LUX
 * calibration post.
 *
 * Vanilla JS, no dependencies, no build step. Drag the two scatter vertices
 * of a double-scatter event inside a TPC outline; the beam direction and
 * the vertex-to-vertex line set the lab scattering angle of the first
 * interaction, and exact two-body elastic kinematics convert that angle
 * into the nuclear recoil energy — the energy scale of the calibration.
 *
 * Constants: 2.45 MeV D-D neutrons on natural xenon (A = 131.293), giving
 * the 74 keV kinematic endpoint discussed in the post.
 */
(function () {
  "use strict";

  var EN_KEV = 2450; // D-D neutron energy
  var M_NEUTRON = 1.008665; // u
  var M_XENON = 131.293; // u, natural xenon average
  var MU = M_NEUTRON / M_XENON;

  /* ---------------- kinematics core ---------------- */

  // Lab scattering angle (radians) -> nuclear recoil energy (keV).
  // Exact non-relativistic two-body elastic scattering: convert the lab
  // angle to the CM angle, then E_r = E_n * 2 mM/(m+M)^2 * (1 - cos CM).
  function recoilEnergy(thetaLab) {
    var cosL = Math.cos(thetaLab);
    var sinL = Math.sin(thetaLab);
    var cosCM =
      -MU * sinL * sinL + cosL * Math.sqrt(1 - MU * MU * sinL * sinL);
    var k = (2 * MU) / ((1 + MU) * (1 + MU));
    return EN_KEV * k * (1 - cosCM);
  }

  // Independent path for cross-checks: the scattered neutron's lab energy.
  function scatteredNeutronEnergy(thetaLab) {
    var A = 1 / MU;
    var cosL = Math.cos(thetaLab);
    var sinL = Math.sin(thetaLab);
    var root = (cosL + Math.sqrt(A * A - sinL * sinL)) / (1 + A);
    return EN_KEV * root * root;
  }

  // Lab scattering angle from the beam direction (+x) and two vertices.
  function scatteringAngle(v1, v2) {
    var dx = v2.x - v1.x;
    var dy = v2.y - v1.y;
    var len = Math.hypot(dx, dy);
    if (len === 0) return 0;
    return Math.acos(Math.max(-1, Math.min(1, dx / len)));
  }

  /* ---------------- demo widget ---------------- */

  function initDemo(root) {
    var tpcCanvas = root.querySelector('canvas[data-lux="tpc"]');
    var chartCanvas = root.querySelector('canvas[data-lux="chart"]');
    if (!tpcCanvas || !chartCanvas) return false;
    var tpcCtx = tpcCanvas.getContext("2d");
    var chartCtx = chartCanvas.getContext("2d");
    if (!tpcCtx || !chartCtx) return false;

    var BEAM_Y = 0.46; // beam height in detector coordinates [0,1]
    var MARGIN = 0.07; // vertex clamp margin inside the TPC
    var MIN_SEP = 0.05; // minimum vertex separation

    var DEFAULTS = {
      v1: { x: 0.32, y: BEAM_Y },
      v2: { x: 0.66, y: 0.62 }
    };

    var state = {
      v1: { x: DEFAULTS.v1.x, y: DEFAULTS.v1.y },
      v2: { x: DEFAULTS.v2.x, y: DEFAULTS.v2.y },
      pending: false
    };

    var colors = {};

    function refreshColors() {
      var cs = getComputedStyle(root);
      colors.text = cs.getPropertyValue("--text").trim() || "#111827";
      colors.muted = cs.getPropertyValue("--text-muted").trim() || "#4b5563";
      colors.border = cs.getPropertyValue("--border").trim() || "#e5e7eb";
      colors.surfaceMuted =
        cs.getPropertyValue("--surface-muted").trim() || "#f3f6fb";
      colors.accent = cs.getPropertyValue("--accent").trim() || "#1f6feb";
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

    /* ---- readouts ---- */

    var readoutEl = root.querySelector("[data-lux-readout]");
    var statusEl = root.querySelector("[data-lux-status]");

    function updateText() {
      var theta = scatteringAngle(state.v1, state.v2);
      var er = recoilEnergy(theta);
      var deg = (theta * 180) / Math.PI;
      if (readoutEl) {
        readoutEl.textContent =
          "θ = " + deg.toFixed(1) + "° · first recoil Eᵣ = " +
          (er < 10 ? er.toFixed(2) : er.toFixed(1)) +
          " keV · scattered neutron " + (EN_KEV - er).toFixed(0) + " keV";
      }
      if (statusEl) {
        var note;
        if (er < 1) {
          note = "Sub-keV recoil — the regime this calibration unlocked.";
        } else if (er < 10) {
          note = "Few-keV recoil — the heart of the WIMP-search region.";
        } else if (er > 65) {
          note = "Near the 74 keV kinematic endpoint — a full backscatter.";
        } else {
          note = "Mid-range nuclear recoil.";
        }
        statusEl.textContent = note;
      }
    }

    /* ---- detector view ---- */

    var SPACE_BG = "#0c1426";

    function toPx(p, canvas) {
      return [p.x * canvas.width, p.y * canvas.height];
    }

    function drawTpc() {
      var canvas = tpcCanvas;
      var ctx = tpcCtx;
      var w = canvas.width;
      var h = canvas.height;
      ctx.fillStyle = SPACE_BG;
      ctx.fillRect(0, 0, w, h);

      // liquid xenon volume
      var inset = 0.035 * w;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
      ctx.lineWidth = Math.max(1, w / 480);
      ctx.strokeRect(inset, inset, w - 2 * inset, h - 2 * inset);
      ctx.fillStyle = "rgba(96, 165, 250, 0.06)";
      ctx.fillRect(inset, inset, w - 2 * inset, h - 2 * inset);

      var p1 = toPx(state.v1, canvas);
      var p2 = toPx(state.v2, canvas);

      // incoming beam: dashed from the left wall to vertex 1
      ctx.beginPath();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = "rgba(253, 224, 71, 0.75)";
      ctx.lineWidth = Math.max(1.2, w / 420);
      ctx.moveTo(0, BEAM_Y * h);
      ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
      ctx.setLineDash([]);

      // scattered path: vertex 1 -> vertex 2, then a short fading tail
      ctx.beginPath();
      ctx.strokeStyle = "rgba(125, 211, 252, 0.9)";
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.stroke();
      var dx = p2[0] - p1[0];
      var dy = p2[1] - p1[1];
      var len = Math.hypot(dx, dy) || 1;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(125, 211, 252, 0.25)";
      ctx.moveTo(p2[0], p2[1]);
      ctx.lineTo(p2[0] + (dx / len) * 0.1 * w, p2[1] + (dy / len) * 0.1 * w);
      ctx.stroke();

      // scattering angle arc at vertex 1
      var theta = scatteringAngle(state.v1, state.v2);
      var sweep = Math.atan2(dy, dx); // signed screen angle of the new leg
      var arcR = Math.min(0.09 * w, len * 0.55);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(253, 224, 71, 0.9)";
      ctx.arc(p1[0], p1[1], arcR, 0, sweep, sweep < 0);
      ctx.stroke();
      var labelAngle = sweep / 2;
      ctx.fillStyle = "rgba(253, 224, 71, 0.95)";
      ctx.font = "600 " + Math.max(11, Math.round(w / 34)) + "px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "θ",
        p1[0] + Math.cos(labelAngle) * (arcR + 0.035 * w),
        p1[1] + Math.sin(labelAngle) * (arcR + 0.035 * w)
      );

      // vertices: scatter flashes with draggable handles
      [p1, p2].forEach(function (p, i) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(125, 211, 252, 0.25)";
        ctx.arc(p[0], p[1], Math.max(9, w / 38), 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "#fde68a";
        ctx.strokeStyle = "rgba(12, 20, 38, 0.9)";
        ctx.lineWidth = Math.max(1, w / 600);
        ctx.arc(p[0], p[1], Math.max(5, w / 80), 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(232, 240, 255, 0.9)";
        ctx.font = "600 " + Math.max(10, Math.round(w / 40)) + "px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(i === 0 ? "scatter 1" : "scatter 2",
          p[0] + 0.025 * w, p[1] - 0.02 * w);
      });
    }

    /* ---- kinematic curve ---- */

    var LOG_MIN = 0.1;
    var LOG_MAX = 100;

    function chartY(er, h) {
      var clamped = Math.max(LOG_MIN, Math.min(LOG_MAX, er));
      var f = Math.log10(clamped / LOG_MIN) / Math.log10(LOG_MAX / LOG_MIN);
      return h - f * h;
    }

    function drawChart() {
      var canvas = chartCanvas;
      var ctx = chartCtx;
      var w = canvas.width;
      var h = canvas.height;
      ctx.fillStyle = colors.surfaceMuted;
      ctx.fillRect(0, 0, w, h);

      // sub-keV band
      ctx.fillStyle = "rgba(96, 165, 250, 0.14)";
      ctx.fillRect(0, chartY(1, h), w, h - chartY(1, h));

      var fontPx = Math.max(10, Math.round(w / 42));
      ctx.font = "500 " + fontPx + "px Inter, sans-serif";

      // log gridlines
      [0.1, 1, 10, 100].forEach(function (level) {
        var y = chartY(level, h);
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        ctx.fillStyle = colors.muted;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(level + " keV", 6, y - 2);
      });

      // angle ticks
      ctx.fillStyle = colors.muted;
      ctx.textBaseline = "top";
      [[0, "0°", "left"], [90, "90°", "center"], [180, "180°", "right"]]
        .forEach(function (tick) {
          var x = (tick[0] / 180) * w;
          ctx.textAlign = tick[2];
          ctx.fillText(tick[1], x + (tick[0] === 0 ? 4 : tick[0] === 180 ? -4 : 0), 4);
        });

      // E_r(theta) curve
      ctx.beginPath();
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = Math.max(1.2, w / 480);
      var started = false;
      for (var i = 0; i <= 240; i++) {
        var th = (Math.PI * i) / 240;
        var er = recoilEnergy(th);
        if (er < LOG_MIN) continue;
        var x = (th / Math.PI) * w;
        var y = chartY(er, h);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // current event marker
      var theta = scatteringAngle(state.v1, state.v2);
      var erNow = recoilEnergy(theta);
      if (erNow >= LOG_MIN) {
        var mx = (theta / Math.PI) * w;
        var my = chartY(erNow, h);
        ctx.beginPath();
        ctx.fillStyle = "#fde68a";
        ctx.strokeStyle = "rgba(12, 20, 38, 0.9)";
        ctx.lineWidth = Math.max(1, w / 600);
        ctx.arc(mx, my, Math.max(4, w / 90), 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    }

    function render() {
      state.pending = false;
      fitCanvas(tpcCanvas);
      fitCanvas(chartCanvas);
      drawTpc();
      drawChart();
      updateText();
    }

    function schedule() {
      if (state.pending) return;
      state.pending = true;
      window.requestAnimationFrame(render);
    }

    /* ---- dragging ---- */

    function eventPoint(event) {
      var rect = tpcCanvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height
      };
    }

    function clampVertex(which, p) {
      var x = Math.max(MARGIN, Math.min(1 - MARGIN, p.x));
      var y = Math.max(MARGIN, Math.min(1 - MARGIN, p.y));
      if (which === "v1") {
        // first scatter sits on the beam line
        return { x: x, y: BEAM_Y };
      }
      return { x: x, y: y };
    }

    function farEnough(v1, v2) {
      return Math.hypot(v2.x - v1.x, v2.y - v1.y) >= MIN_SEP;
    }

    var dragging = null;

    tpcCanvas.addEventListener("pointerdown", function (event) {
      var p = eventPoint(event);
      var d1 = Math.hypot(p.x - state.v1.x, p.y - state.v1.y);
      var d2 = Math.hypot(p.x - state.v2.x, p.y - state.v2.y);
      var pick = d1 < d2 ? "v1" : "v2";
      if (Math.min(d1, d2) > 0.16) return;
      dragging = pick;
      tpcCanvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    tpcCanvas.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      var next = clampVertex(dragging, eventPoint(event));
      var other = dragging === "v1" ? state.v2 : state.v1;
      if (!farEnough(dragging === "v1" ? next : other,
        dragging === "v1" ? other : next)) {
        return;
      }
      state[dragging] = next;
      schedule();
    });

    var stopDrag = function () {
      dragging = null;
    };
    tpcCanvas.addEventListener("pointerup", stopDrag);
    tpcCanvas.addEventListener("pointercancel", stopDrag);

    var resetButton = root.querySelector('button[data-action="reset"]');
    if (resetButton) {
      resetButton.addEventListener("click", function () {
        state.v1 = { x: DEFAULTS.v1.x, y: DEFAULTS.v1.y };
        state.v2 = { x: DEFAULTS.v2.x, y: DEFAULTS.v2.y };
        schedule();
      });
    }

    /* ---- environment hooks ---- */

    refreshColors();
    if (window.matchMedia) {
      var scheme = window.matchMedia("(prefers-color-scheme: dark)");
      if (scheme.addEventListener) {
        scheme.addEventListener("change", function () {
          refreshColors();
          schedule();
        });
      }
    }
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) schedule();
    });
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(schedule).observe(root);
    } else {
      window.addEventListener("resize", schedule);
    }

    root.hidden = false;
    schedule();
    return true;
  }

  /* ---------------- exports / boot ---------------- */

  var api = {
    EN_KEV: EN_KEV,
    MU: MU,
    recoilEnergy: recoilEnergy,
    scatteredNeutronEnergy: scatteredNeutronEnergy,
    scatteringAngle: scatteringAngle
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof document !== "undefined") {
    var boot = function () {
      document.querySelectorAll("[data-lux-demo]").forEach(function (root) {
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
