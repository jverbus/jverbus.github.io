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
  var DETECTOR_WIDTH = 4;
  var DETECTOR_HEIGHT = 3;
  var BEAM_Y = 1.38;

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

  // The model uses equal units on both axes. A shared, isotropic projection
  // preserves its angles even if the CSS box or device pixel ratio changes.
  function detectorViewport(width, height) {
    var scale = Math.min(width / DETECTOR_WIDTH, height / DETECTOR_HEIGHT);
    return {
      scale: scale,
      left: (width - DETECTOR_WIDTH * scale) / 2,
      top: (height - DETECTOR_HEIGHT * scale) / 2
    };
  }

  function detectorToCanvas(point, width, height) {
    var view = detectorViewport(width, height);
    return { x: view.left + point.x * view.scale, y: view.top + point.y * view.scale };
  }

  function canvasToDetector(point, width, height) {
    var view = detectorViewport(width, height);
    return { x: (point.x - view.left) / view.scale, y: (point.y - view.top) / view.scale };
  }

  function angleForRecoil(energy) {
    var low = 0;
    var high = Math.PI;
    for (var i = 0; i < 60; i++) {
      var middle = (low + high) / 2;
      if (recoilEnergy(middle) < energy) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }

  function geometryForAngle(theta) {
    return {
      v1: { x: DETECTOR_WIDTH / 2, y: BEAM_Y },
      v2: { x: DETECTOR_WIDTH / 2 + 1.1 * Math.cos(theta), y: BEAM_Y + 1.1 * Math.sin(theta) }
    };
  }

  /* ---------------- demo widget ---------------- */

  function initDemo(root) {
    var tpcCanvas = root.querySelector('canvas[data-lux="tpc"]');
    var chartCanvas = root.querySelector('canvas[data-lux="chart"]');
    if (!tpcCanvas || !chartCanvas) return false;
    var tpcCtx = tpcCanvas.getContext("2d");
    var chartCtx = chartCanvas.getContext("2d");
    if (!tpcCtx || !chartCtx) return false;

    var MARGIN = 0.22;
    var MIN_SEP = 0.15;
    var DEFAULTS = geometryForAngle(angleForRecoil(1));

    var state = {
      v1: { x: DEFAULTS.v1.x, y: DEFAULTS.v1.y },
      v2: { x: DEFAULTS.v2.x, y: DEFAULTS.v2.y },
      frame: null,
      animation: null,
      visible: true
    };
    var tpcSize;
    var chartSize;
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");

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

    function fitCanvas(canvas, ctx) {
      var width = canvas.clientWidth;
      var height = canvas.clientHeight;
      if (width === 0 || height === 0) return null;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = Math.round(width * dpr);
      var h = Math.round(height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.setTransform(w / width, 0, 0, h / height, 0, 0);
      return { width: width, height: height };
    }

    /* ---- readouts ---- */

    var energyEl = root.querySelector("[data-lux-energy-value]");
    var angleInput = root.querySelector("[data-lux-angle]");
    var statusEl = root.querySelector("[data-lux-status]");

    function energyText(er) {
      if (er > 0 && er < 0.005) return "<0.01 keV";
      return (er < 10 ? er.toFixed(2) : er.toFixed(1)) + " keV";
    }

    function announce(prefix) {
      if (!statusEl) return;
      var theta = scatteringAngle(state.v1, state.v2);
      statusEl.textContent = prefix + (theta * 180 / Math.PI).toFixed(1) +
        " degrees; first recoil " + energyText(recoilEnergy(theta)) + ".";
    }

    function updateText() {
      var theta = scatteringAngle(state.v1, state.v2);
      var er = recoilEnergy(theta);
      var deg = (theta * 180) / Math.PI;
      if (energyEl) energyEl.textContent = energyText(er);
      if (angleInput) {
        angleInput.value = deg.toFixed(1);
        angleInput.setAttribute("aria-valuetext", deg.toFixed(1) + " degrees; first recoil " + energyText(er));
      }
    }

    /* ---- detector view ---- */

    var SPACE_BG = "#0c1426";

    function toPx(p) {
      var pixel = detectorToCanvas(p, tpcSize.width, tpcSize.height);
      return [pixel.x, pixel.y];
    }

    function drawTpc() {
      var ctx = tpcCtx;
      var w = tpcSize.width;
      var h = tpcSize.height;
      ctx.fillStyle = SPACE_BG;
      ctx.fillRect(0, 0, w, h);

      // liquid xenon volume
      var view = detectorViewport(w, h);
      var inset = 0.12 * view.scale;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
      ctx.lineWidth = Math.max(1, w / 480);
      ctx.strokeRect(view.left + inset, view.top + inset,
        DETECTOR_WIDTH * view.scale - 2 * inset, DETECTOR_HEIGHT * view.scale - 2 * inset);
      ctx.fillStyle = "rgba(96, 165, 250, 0.06)";
      ctx.fillRect(view.left + inset, view.top + inset,
        DETECTOR_WIDTH * view.scale - 2 * inset, DETECTOR_HEIGHT * view.scale - 2 * inset);

      var p1 = toPx(state.v1);
      var p2 = toPx(state.v2);

      // incoming beam: dashed from the left wall to vertex 1
      ctx.beginPath();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = "rgba(253, 224, 71, 0.75)";
      ctx.lineWidth = Math.max(1.2, w / 420);
      ctx.moveTo(view.left, p1[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
      ctx.setLineDash([]);

      // The first-scatter direction is reconstructed from the two vertices.
      ctx.beginPath();
      ctx.strokeStyle = "rgba(125, 211, 252, 0.9)";
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.stroke();
      var dx = p2[0] - p1[0];
      var dy = p2[1] - p1[1];
      var len = Math.hypot(dx, dy) || 1;

      // scattering angle arc at vertex 1
      var sweep = Math.atan2(dy, dx); // signed screen angle of the new leg
      var arcR = Math.min(0.09 * w, len * 0.55);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(253, 224, 71, 0.9)";
      ctx.arc(p1[0], p1[1], arcR, 0, sweep, sweep < 0);
      ctx.stroke();

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
        ctx.font = "600 11px Inter, sans-serif";
        var labelLeft = p[0] > w - 28;
        var labelBelow = p[1] < 28;
        ctx.textAlign = labelLeft ? "right" : "left";
        ctx.textBaseline = labelBelow ? "top" : "bottom";
        ctx.fillText(String(i + 1),
          p[0] + (labelLeft ? -10 : 10), p[1] + (labelBelow ? 10 : -10));
      });

      if (state.animation) {
        var progress = Math.min(1, state.animation.elapsed / 1100);
        var incomingLength = p1[0] - view.left;
        var distance = progress * (incomingLength + len);
        var onIncoming = distance <= incomingLength;
        var fraction = Math.max(0, (distance - incomingLength) / len);
        var pulseX = onIncoming ? view.left + distance : p1[0] + dx * fraction;
        var pulseY = onIncoming ? p1[1] : p1[1] + dy * fraction;
        ctx.beginPath();
        ctx.fillStyle = "#ffffff";
        ctx.arc(pulseX, pulseY, 4, 0, 2 * Math.PI);
        ctx.fill();
        var flash = 1 - Math.abs(distance - incomingLength) / Math.max(20, w * 0.13);
        if (flash > 0) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(253, 230, 138, " + flash + ")";
          ctx.lineWidth = 2;
          ctx.arc(p1[0], p1[1], 9 + (1 - flash) * 12, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
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
      var ctx = chartCtx;
      var w = chartSize.width;
      var h = chartSize.height;
      var plot = { left: 40, top: 25, right: w - 16, bottom: h - 32 };
      var plotW = plot.right - plot.left;
      var plotH = plot.bottom - plot.top;
      function yFor(er) { return plot.top + chartY(er, plotH); }
      function xFor(theta) { return plot.left + theta / Math.PI * plotW; }
      ctx.fillStyle = colors.surfaceMuted;
      ctx.fillRect(0, 0, w, h);

      // sub-keV band
      ctx.fillStyle = "rgba(96, 165, 250, 0.14)";
      ctx.fillRect(plot.left, yFor(1), plotW, plot.bottom - yFor(1));

      ctx.font = "500 11px Inter, sans-serif";
      ctx.fillStyle = colors.muted;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("keV", 8, 5);

      // log gridlines
      [0.1, 1, 10, 100].forEach(function (level) {
        var y = yFor(level);
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(plot.left, y);
        ctx.lineTo(plot.right, y);
        ctx.stroke();
        ctx.fillStyle = colors.muted;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(String(level), plot.left - 8, y);
      });

      // angle ticks
      ctx.fillStyle = colors.muted;
      ctx.textBaseline = "top";
      [[0, "0°"], [90, "90°"], [180, "180°"]]
        .forEach(function (tick) {
          var x = xFor(tick[0] * Math.PI / 180);
          ctx.textAlign = "center";
          ctx.fillText(tick[1], x, plot.bottom + 9);
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
        var x = xFor(th);
        var y = yFor(er);
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
      var mx = xFor(theta);
      var my = yFor(erNow);
      ctx.beginPath();
      ctx.fillStyle = "#fde68a";
      ctx.strokeStyle = "rgba(12, 20, 38, 0.9)";
      ctx.lineWidth = 1.2;
      if (erNow < LOG_MIN) {
        ctx.moveTo(mx, my + 3);
        ctx.lineTo(mx - 5, my - 6);
        ctx.lineTo(mx + 5, my - 6);
        ctx.closePath();
      } else {
        ctx.arc(mx, my, 4.5, 0, 2 * Math.PI);
      }
      ctx.fill();
      ctx.stroke();
      if (erNow < LOG_MIN) {
        ctx.fillStyle = colors.text;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(erNow === 0 ? "0 keV" : "<0.1 keV", mx + 10, my - 5);
      }
    }

    function render(now) {
      state.frame = null;
      tpcSize = fitCanvas(tpcCanvas, tpcCtx);
      chartSize = fitCanvas(chartCanvas, chartCtx);
      if (!tpcSize || !chartSize) {
        state.animation = null;
        return;
      }
      if (state.animation) {
        state.animation.elapsed = now - state.animation.started;
        if (state.animation.elapsed >= 1100) state.animation = null;
      }
      drawTpc();
      drawChart();
      if (state.animation && state.visible && !document.hidden) schedule();
    }

    function schedule() {
      if (state.frame !== null) return;
      state.frame = window.requestAnimationFrame(render);
    }

    function stopAnimation() {
      state.animation = null;
      if (state.frame !== null) window.cancelAnimationFrame(state.frame);
      state.frame = null;
    }

    function chooseAngle(theta, replay) {
      stopAnimation();
      var geometry = geometryForAngle(theta);
      state.v1 = geometry.v1;
      state.v2 = geometry.v2;
      if (replay && state.visible && !document.hidden && !(reducedMotion && reducedMotion.matches)) {
        state.animation = { started: window.performance.now(), elapsed: 0 };
      }
      updateText();
      schedule();
    }

    /* ---- dragging ---- */

    function eventPoint(event) {
      var rect = tpcCanvas.getBoundingClientRect();
      return canvasToDetector({ x: event.clientX - rect.left - tpcCanvas.clientLeft,
        y: event.clientY - rect.top - tpcCanvas.clientTop }, tpcCanvas.clientWidth, tpcCanvas.clientHeight);
    }

    function clampVertex(which, p) {
      var x = Math.max(MARGIN, Math.min(DETECTOR_WIDTH - MARGIN, p.x));
      var y = Math.max(MARGIN, Math.min(DETECTOR_HEIGHT - MARGIN, p.y));
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
    var dragChanged = false;
    var activePointer = null;

    tpcCanvas.addEventListener("pointerdown", function (event) {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
      var p = eventPoint(event);
      var d1 = Math.hypot(p.x - state.v1.x, p.y - state.v1.y);
      var d2 = Math.hypot(p.x - state.v2.x, p.y - state.v2.y);
      var pick = d1 < d2 ? "v1" : "v2";
      var hitRadius = 26 / detectorViewport(tpcCanvas.clientWidth, tpcCanvas.clientHeight).scale;
      if (Math.min(d1, d2) > hitRadius) return;
      stopAnimation();
      schedule();
      dragging = pick;
      dragChanged = false;
      activePointer = event.pointerId;
      tpcCanvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    tpcCanvas.addEventListener("pointermove", function (event) {
      if (!dragging || event.pointerId !== activePointer) return;
      var next = clampVertex(dragging, eventPoint(event));
      var other = dragging === "v1" ? state.v2 : state.v1;
      if (!farEnough(dragging === "v1" ? next : other,
        dragging === "v1" ? other : next)) {
        return;
      }
      state[dragging] = next;
      dragChanged = true;
      updateText();
      schedule();
    });

    var stopDrag = function (event) {
      if (event && event.pointerId !== activePointer) return;
      if (dragChanged) announce("Geometry changed: ");
      dragging = null;
      activePointer = null;
      dragChanged = false;
    };
    tpcCanvas.addEventListener("pointerup", stopDrag);
    tpcCanvas.addEventListener("pointercancel", stopDrag);
    tpcCanvas.addEventListener("lostpointercapture", stopDrag);

    if (angleInput) {
      angleInput.addEventListener("input", function () {
        chooseAngle(Number(angleInput.value) * Math.PI / 180, false);
      });
      angleInput.addEventListener("change", function () { announce("Angle selected: "); });
    }

    var resetButton = root.querySelector('button[data-action="reset"]');
    if (resetButton) {
      resetButton.addEventListener("click", function () {
        chooseAngle(angleForRecoil(1), true);
        announce("Reset: ");
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
    if (reducedMotion && reducedMotion.addEventListener) {
      reducedMotion.addEventListener("change", function () {
        if (reducedMotion.matches) {
          stopAnimation();
          schedule();
        }
      });
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopAnimation();
      else schedule();
    });
    window.addEventListener("pagehide", function () {
      stopAnimation();
      stopDrag();
    });
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) schedule();
    });
    if (typeof IntersectionObserver !== "undefined") {
      new IntersectionObserver(function (entries) {
        state.visible = entries[0].isIntersecting;
        if (!state.visible) stopAnimation();
        else schedule();
      }).observe(root);
    }
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(schedule).observe(root);
    } else {
      window.addEventListener("resize", schedule);
    }

    root.hidden = false;
    updateText();
    schedule();
    return true;
  }

  /* ---------------- exports / boot ---------------- */

  var api = {
    EN_KEV: EN_KEV,
    MU: MU,
    DETECTOR_WIDTH: DETECTOR_WIDTH,
    DETECTOR_HEIGHT: DETECTOR_HEIGHT,
    recoilEnergy: recoilEnergy,
    scatteredNeutronEnergy: scatteredNeutronEnergy,
    scatteringAngle: scatteringAngle,
    detectorToCanvas: detectorToCanvas,
    canvasToDetector: canvasToDetector,
    geometryForAngle: geometryForAngle,
    angleForRecoil: angleForRecoil
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof document !== "undefined") {
    var boot = function () {
      document.querySelectorAll("[data-lux-demo]").forEach(function (root) {
        function initialize() {
          try {
            if (!initDemo(root)) root.hidden = true;
          } catch (error) {
            root.hidden = true;
          }
        }
        // Reserve the complete enhanced layout at boot. Revealing it only when
        // the zero-height anchor intersects lets browser scroll anchoring move
        // the newly inserted detector above the viewport.
        try {
          var tpc = root.querySelector('canvas[data-lux="tpc"]');
          var chart = root.querySelector('canvas[data-lux="chart"]');
          if (!tpc || !chart || !tpc.getContext("2d") || !chart.getContext("2d")) return;
        } catch (error) {
          return;
        }
        root.hidden = false;
        if (typeof IntersectionObserver !== "undefined") {
          var observer = new IntersectionObserver(function (entries) {
            if (!entries[0].isIntersecting) return;
            observer.disconnect();
            initialize();
          }, { rootMargin: "300px 0px" });
          observer.observe(root);
        } else {
          initialize();
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
