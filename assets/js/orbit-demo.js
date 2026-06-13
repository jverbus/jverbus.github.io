/*
 * orbit-demo.js — interactive orbital-transfer demo for the RL workshop post.
 *
 * Vanilla JS, no dependencies, no build step. A normalized 2-D two-body
 * simulator (mu = 1) with tangential impulse control: start on a circular
 * orbit at r1, reach a circular orbit at r2 using as little delta-v as
 * possible. The analytic Hohmann transfer is the benchmark, exactly as in
 * the workshop notebook.
 *
 * Physics: velocity-Verlet (symplectic) integration with a fixed timestep,
 * so energy and angular momentum are conserved to high accuracy during
 * coasts; impulses change velocity instantaneously between steps.
 */
(function () {
  "use strict";

  var R1 = 1;
  var R2 = 1.8;
  var DT = 0.004;
  var CRASH_RADIUS = 0.2;
  var ESCAPE_RADIUS = 2.5;
  var TARGET_A_TOL = 0.02; // |a - r2| / r2 for success
  var TARGET_E_TOL = 0.025; // eccentricity for success
  var IMPULSE = 0.02; // delta-v per burn tick
  var SIM_SPEED = 1.4; // simulation time units per real second
  // Controller burns must be small enough to land inside the deadbands
  // they steer toward, or the controller bang-bangs across them forever.
  var GREEDY_IMPULSE = 0.004;
  var GREEDY_DT = 0.15; // time between controller decisions

  /* ---------------- physics core ---------------- */

  function accel(x, y) {
    var r2 = x * x + y * y;
    var inv = -1 / (r2 * Math.sqrt(r2));
    return [x * inv, y * inv];
  }

  // One velocity-Verlet step, mutating the state in place.
  function step(s, dt) {
    var a0 = accel(s.x, s.y);
    s.x += s.vx * dt + 0.5 * a0[0] * dt * dt;
    s.y += s.vy * dt + 0.5 * a0[1] * dt * dt;
    var a1 = accel(s.x, s.y);
    s.vx += 0.5 * (a0[0] + a1[0]) * dt;
    s.vy += 0.5 * (a0[1] + a1[1]) * dt;
    s.t += dt;
  }

  function makeState(r) {
    return { x: r, y: 0, vx: 0, vy: Math.sqrt(1 / r), t: 0 };
  }

  // Instantaneous tangential impulse: dir = +1 prograde, -1 retrograde.
  function applyImpulse(s, dir, mag) {
    var v = Math.hypot(s.vx, s.vy);
    if (v === 0) return 0;
    s.vx += (dir * mag * s.vx) / v;
    s.vy += (dir * mag * s.vy) / v;
    return mag;
  }

  function orbitElements(s) {
    var r = Math.hypot(s.x, s.y);
    var v2 = s.vx * s.vx + s.vy * s.vy;
    var energy = v2 / 2 - 1 / r;
    var h = s.x * s.vy - s.y * s.vx;
    var e2 = 1 + 2 * energy * h * h;
    return {
      r: r,
      v: Math.sqrt(v2),
      energy: energy,
      h: h,
      a: energy < 0 ? -1 / (2 * energy) : Infinity,
      e: Math.sqrt(Math.max(0, e2))
    };
  }

  // Closed-form Hohmann transfer between circular orbits (mu = 1).
  function hohmann(r1, r2) {
    var a = (r1 + r2) / 2;
    var dv1 = Math.sqrt(2 / r1 - 1 / a) - Math.sqrt(1 / r1);
    var dv2 = Math.sqrt(1 / r2) - Math.sqrt(2 / r2 - 1 / a);
    return {
      dv1: dv1,
      dv2: dv2,
      total: dv1 + dv2,
      time: Math.PI * Math.sqrt(a * a * a)
    };
  }

  // Execute the analytic plan in the discrete simulator: burn 1 at t = 0,
  // burn 2 on the first step at or after the computed transfer time —
  // reproducing the one-timestep timing quirk discussed in the post.
  function simulateHohmann(r1, r2, dt) {
    var s = makeState(r1);
    var plan = hohmann(r1, r2);
    var used = applyImpulse(s, 1, plan.dv1);
    var burned2 = false;
    var horizon = plan.time + 3;
    while (s.t < horizon) {
      step(s, dt);
      if (!burned2 && s.t >= plan.time) {
        used += applyImpulse(s, 1, plan.dv2);
        burned2 = true;
      }
    }
    var el = orbitElements(s);
    return { state: s, elements: el, totalDv: used, plan: plan };
  }

  // A deliberately myopic feedback controller — the "trims the orbit"
  // failure mode from the post. It chases the target semi-major axis with
  // burns at whatever phase it happens to be in (energetically wasteful),
  // then damps eccentricity near the apsides. It reaches the target; the
  // thrust history shows the price.
  function greedyDecision(s, r2) {
    var el = orbitElements(s);
    var da = (r2 - el.a) / r2;
    // climb (or descend) with burns gated to the half of the orbit where
    // they also keep eccentricity bounded
    if (da > 0.01) return el.r >= el.a ? 1 : 0;
    if (da < -0.01) return el.r <= el.a ? -1 : 0;
    // trim eccentricity only near the apsides, where tangential burns
    // actually move e instead of just perturbing a
    if (el.e > 0.015 && Math.abs(el.r - el.a) > 0.5 * el.a * el.e) {
      return el.r > el.a ? 1 : -1;
    }
    return 0;
  }

  function simulateGreedy(r1, r2, dt) {
    var s = makeState(r1);
    var used = 0;
    var burnCount = 0;
    var nextControl = 0;
    var arrivedAt = null;
    var horizon = 200;
    while (s.t < horizon) {
      step(s, dt);
      if (s.t >= nextControl) {
        nextControl = s.t + GREEDY_DT;
        var dir = greedyDecision(s, r2);
        if (dir !== 0) {
          used += applyImpulse(s, dir, GREEDY_IMPULSE);
          burnCount++;
        }
        var el = orbitElements(s);
        if (
          arrivedAt === null &&
          Math.abs(el.a - r2) / r2 < 0.02 &&
          el.e < 0.025
        ) {
          arrivedAt = s.t;
        }
        if (arrivedAt !== null && dir === 0) break; // converged and quiet
      }
    }
    return {
      state: s,
      elements: orbitElements(s),
      totalDv: used,
      burnCount: burnCount,
      arrivedAt: arrivedAt
    };
  }

  /* ---------------- demo widget ---------------- */

  function initDemo(root) {
    var orbitCanvas = root.querySelector('canvas[data-orbit="map"]');
    var radiusCanvas = root.querySelector('canvas[data-orbit="radius"]');
    var thrustCanvas = root.querySelector('canvas[data-orbit="thrust"]');
    if (!orbitCanvas || !radiusCanvas || !thrustCanvas) return false;
    var mapCtx = orbitCanvas.getContext("2d");
    var radCtx = radiusCanvas.getContext("2d");
    var thrCtx = thrustCanvas.getContext("2d");
    if (!mapCtx || !radCtx || !thrCtx) return false;

    var plan = hohmann(R1, R2);
    var reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var sim = {
      state: makeState(R1),
      running: false,
      ended: false, // crashed or escaped
      arrived: false,
      dvUsed: 0,
      trail: [],
      radii: [], // {t, r} decimated history
      burns: [], // {t, dv} signed
      stepCount: 0,
      flying: false, // first manual burn fired
      autopilot: null, // {burnTime} when waiting for burn 2
      greedy: null // {nextControl} while the greedy controller is engaged
    };

    var CHART_WINDOW = 45; // time units shown in the strip charts
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

    /* ---- recording ---- */

    function recordStep() {
      sim.stepCount++;
      if (sim.stepCount % 5 === 0) {
        var el = orbitElements(sim.state);
        sim.radii.push({ t: sim.state.t, r: el.r });
        sim.trail.push([sim.state.x, sim.state.y]);
        if (sim.trail.length > 700) sim.trail.shift();
        var cutoff = sim.state.t - CHART_WINDOW;
        while (sim.radii.length && sim.radii[0].t < cutoff) sim.radii.shift();
        while (sim.burns.length && sim.burns[0].t < cutoff) sim.burns.shift();
      }
    }

    function burn(dir) {
      if (sim.ended) return;
      if (sim.autopilot || sim.greedy) {
        sim.autopilot = null;
        sim.greedy = null;
        sim.flying = true;
        setStatus("Controller cancelled — you have the controls.");
      } else if (!sim.flying) {
        sim.flying = true;
        setStatus("In flight — circularize inside the shaded target band.");
      }
      sim.dvUsed += applyImpulse(sim.state, dir, IMPULSE);
      sim.burns.push({ t: sim.state.t, dv: dir * IMPULSE });
      if (!sim.running) setRunning(true);
    }

    /* ---- status / readouts ---- */

    var statusEl = root.querySelector("[data-orbit-status]");
    var readoutEl = root.querySelector("[data-orbit-readout]");
    var pauseButton = root.querySelector('button[data-action="pause"]');

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text;
    }

    function fmt(x, digits) {
      return Number(x).toFixed(digits === undefined ? 3 : digits);
    }

    function updateReadout() {
      if (!readoutEl) return;
      var el = orbitElements(sim.state);
      readoutEl.textContent =
        "t " + fmt(sim.state.t, 1) +
        " · r " + fmt(el.r, 2) +
        " · v " + fmt(el.v, 2) +
        " · Δv " + fmt(sim.dvUsed) +
        " (Hohmann " + fmt(plan.total) + ")";
    }

    function checkEvents() {
      var el = orbitElements(sim.state);
      if (el.r < CRASH_RADIUS) {
        sim.ended = true;
        setRunning(false);
        setStatus("Crashed into the planet — press Reset to try again.");
        return;
      }
      if (el.energy >= 0 && el.r > ESCAPE_RADIUS) {
        sim.ended = true;
        setRunning(false);
        setStatus("Escape trajectory — press Reset to try again.");
        return;
      }
      if (
        !sim.arrived &&
        Math.abs(el.a - R2) / R2 < TARGET_A_TOL &&
        el.e < TARGET_E_TOL
      ) {
        sim.arrived = true;
        var efficiency = (100 * plan.total) / Math.max(sim.dvUsed, plan.total);
        setStatus(
          "Target orbit reached with Δv " + fmt(sim.dvUsed) +
          " — Hohmann needs " + fmt(plan.total) +
          " (" + fmt(efficiency, 0) + "% efficiency)."
        );
      }
    }

    /* ---- drawing ---- */

    var SPACE_BG = "#0c1426";
    var VIEW_RADIUS = 2.35;

    function worldToMap(x, y, canvas) {
      var scale = canvas.width / (2 * VIEW_RADIUS);
      return [canvas.width / 2 + x * scale, canvas.height / 2 - y * scale];
    }

    function drawCircle(ctx, canvas, r, stroke, dash) {
      var scale = canvas.width / (2 * VIEW_RADIUS);
      ctx.beginPath();
      ctx.setLineDash(dash || []);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = Math.max(1, canvas.width / 640);
      ctx.arc(canvas.width / 2, canvas.height / 2, r * scale, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function drawMap() {
      var canvas = orbitCanvas;
      var ctx = mapCtx;
      ctx.fillStyle = SPACE_BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawCircle(ctx, canvas, R1, "rgba(148, 163, 184, 0.55)", [4, 4]);
      drawCircle(ctx, canvas, R2, "rgba(96, 165, 250, 0.8)", [4, 4]);

      // analytic Hohmann half-ellipse, periapsis anchored at (R1, 0)
      var aT = (R1 + R2) / 2;
      var eT = (R2 - R1) / (R2 + R1);
      ctx.beginPath();
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = "rgba(253, 224, 71, 0.55)";
      for (var i = 0; i <= 90; i++) {
        var th = (Math.PI * i) / 90;
        var rr = (aT * (1 - eT * eT)) / (1 + eT * Math.cos(th));
        var p = worldToMap(rr * Math.cos(th), rr * Math.sin(th), canvas);
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // planet
      var c = worldToMap(0, 0, canvas);
      ctx.beginPath();
      ctx.fillStyle = "#7ea4d8";
      ctx.arc(c[0], c[1], (0.1 * canvas.width) / (2 * VIEW_RADIUS), 0, 2 * Math.PI);
      ctx.fill();

      // trail
      if (sim.trail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(125, 211, 252, 0.5)";
        ctx.lineWidth = Math.max(1, canvas.width / 640);
        for (var j = 0; j < sim.trail.length; j++) {
          var q = worldToMap(sim.trail[j][0], sim.trail[j][1], canvas);
          if (j === 0) ctx.moveTo(q[0], q[1]);
          else ctx.lineTo(q[0], q[1]);
        }
        ctx.stroke();
      }

      // ship
      var sp = worldToMap(sim.state.x, sim.state.y, canvas);
      ctx.beginPath();
      ctx.fillStyle = "#fde68a";
      ctx.strokeStyle = "rgba(12, 20, 38, 0.9)";
      ctx.lineWidth = Math.max(1, canvas.width / 800);
      ctx.arc(sp[0], sp[1], Math.max(3, canvas.width / 170), 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    function chartFrame(ctx, canvas) {
      ctx.fillStyle = colors.surfaceMuted;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function chartX(t, t0, t1, canvas) {
      return ((t - t0) / (t1 - t0)) * canvas.width;
    }

    function drawRadiusChart() {
      var canvas = radiusCanvas;
      var ctx = radCtx;
      chartFrame(ctx, canvas);
      var t1 = Math.max(sim.state.t, CHART_WINDOW);
      var t0 = t1 - CHART_WINDOW;
      var rMax = 2.4;
      var yOf = function (r) {
        return canvas.height - (r / rMax) * canvas.height;
      };

      // target band r2 +/- 2%
      ctx.fillStyle = "rgba(96, 165, 250, 0.18)";
      ctx.fillRect(
        0,
        yOf(R2 * 1.02),
        canvas.width,
        yOf(R2 * 0.98) - yOf(R2 * 1.02)
      );
      // start radius guide
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, yOf(R1));
      ctx.lineTo(canvas.width, yOf(R1));
      ctx.stroke();

      if (sim.radii.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = Math.max(1.2, canvas.width / 480);
        for (var i = 0; i < sim.radii.length; i++) {
          var pt = sim.radii[i];
          var x = chartX(pt.t, t0, t1, canvas);
          var y = yOf(Math.min(pt.r, rMax));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    function drawThrustChart() {
      var canvas = thrustCanvas;
      var ctx = thrCtx;
      chartFrame(ctx, canvas);
      var t1 = Math.max(sim.state.t, CHART_WINDOW);
      var t0 = t1 - CHART_WINDOW;
      var mid = canvas.height / 2;

      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(canvas.width, mid);
      ctx.stroke();

      var stemScale = (canvas.height / 2 - 6) / IMPULSE;
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = Math.max(1.2, canvas.width / 480);
      for (var i = 0; i < sim.burns.length; i++) {
        var b = sim.burns[i];
        var x = chartX(b.t, t0, t1, canvas);
        ctx.beginPath();
        ctx.moveTo(x, mid);
        ctx.lineTo(x, mid - b.dv * stemScale);
        ctx.stroke();
      }
    }

    function draw() {
      fitCanvas(orbitCanvas);
      fitCanvas(radiusCanvas);
      fitCanvas(thrustCanvas);
      drawMap();
      drawRadiusChart();
      drawThrustChart();
      updateReadout();
    }

    /* ---- main loop ---- */

    var rafId = null;
    var lastFrame = null;
    var carry = 0;

    function frame(now) {
      rafId = window.requestAnimationFrame(frame);
      if (lastFrame === null) lastFrame = now;
      var real = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      if (sim.running && !sim.ended) {
        carry += real * SIM_SPEED;
        while (carry >= DT) {
          step(sim.state, DT);
          recordStep();
          if (sim.autopilot && sim.state.t >= sim.autopilot.burnTime) {
            sim.dvUsed += applyImpulse(sim.state, 1, plan.dv2);
            sim.burns.push({ t: sim.state.t, dv: plan.dv2 });
            sim.autopilot = null;
            setStatus("Autopilot: burn 2 fired — circularizing at the target.");
          }
          if (sim.greedy && sim.state.t >= sim.greedy.nextControl) {
            sim.greedy.nextControl = sim.state.t + GREEDY_DT;
            var greedyDir = greedyDecision(sim.state, R2);
            if (greedyDir !== 0) {
              sim.dvUsed += applyImpulse(sim.state, greedyDir, GREEDY_IMPULSE);
              sim.burns.push({
                t: sim.state.t,
                dv: greedyDir * GREEDY_IMPULSE
              });
            } else if (sim.arrived) {
              sim.greedy = null; // converged and quiet
            }
          }
          carry -= DT;
        }
        checkEvents();
      }
      draw();
    }

    function startLoop() {
      if (rafId === null) {
        lastFrame = null;
        rafId = window.requestAnimationFrame(frame);
      }
    }

    function stopLoop() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function setRunning(running) {
      sim.running = running;
      if (pauseButton) {
        pauseButton.textContent = running ? "Pause" : "Resume";
        pauseButton.setAttribute("aria-pressed", running ? "false" : "true");
      }
    }

    function reset(message) {
      sim.state = makeState(R1);
      sim.dvUsed = 0;
      sim.trail = [];
      sim.radii = [];
      sim.burns = [];
      sim.stepCount = 0;
      sim.ended = false;
      sim.arrived = false;
      sim.flying = false;
      sim.autopilot = null;
      sim.greedy = null;
      carry = 0;
      setRunning(!reduceMotion);
      setStatus(message ||
        "Coasting on the start orbit — fire prograde to raise it.");
    }

    /* ---- controls ---- */

    function bindBurnButton(button, dir) {
      if (!button) return;
      var timer = null;
      var clear = function () {
        if (timer !== null) {
          window.clearInterval(timer);
          timer = null;
        }
      };
      button.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        burn(dir);
        clear();
        timer = window.setInterval(function () {
          burn(dir);
        }, 70);
      });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (type) {
        button.addEventListener(type, clear);
      });
      // keyboard activation (Enter/Space) fires click without pointer events
      button.addEventListener("click", function (event) {
        if (event.detail === 0) burn(dir);
      });
    }

    bindBurnButton(root.querySelector('button[data-action="prograde"]'), 1);
    bindBurnButton(root.querySelector('button[data-action="retrograde"]'), -1);

    if (pauseButton) {
      pauseButton.addEventListener("click", function () {
        if (sim.ended) return;
        setRunning(!sim.running);
      });
    }

    var resetButton = root.querySelector('button[data-action="reset"]');
    if (resetButton) {
      resetButton.addEventListener("click", function () {
        reset();
      });
    }

    var hohmannButton = root.querySelector('button[data-action="hohmann"]');
    if (hohmannButton) {
      hohmannButton.addEventListener("click", function () {
        reset("Autopilot: burn 1 fired; coasting half an ellipse to the target…");
        sim.dvUsed += applyImpulse(sim.state, 1, plan.dv1);
        sim.burns.push({ t: 0, dv: plan.dv1 });
        sim.autopilot = { burnTime: plan.time };
        setRunning(true);
      });
    }

    var greedyButton = root.querySelector('button[data-action="greedy"]');
    if (greedyButton) {
      greedyButton.addEventListener("click", function () {
        reset("Greedy controller engaged — it gets there. Watch the thrust history.");
        sim.greedy = { nextControl: 0 };
        setRunning(true);
      });
    }

    root.addEventListener("keydown", function (event) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        burn(1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        burn(-1);
      }
    });

    /* ---- environment hooks ---- */

    refreshColors();
    if (window.matchMedia) {
      var scheme = window.matchMedia("(prefers-color-scheme: dark)");
      if (scheme.addEventListener) {
        scheme.addEventListener("change", refreshColors);
      }
    }
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) draw();
    });

    root.hidden = false;
    reset();

    // Run the loop only while the demo is near the viewport.
    if (typeof IntersectionObserver !== "undefined") {
      var io = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) startLoop();
            else stopLoop();
          }
        },
        { rootMargin: "200px 0px" }
      );
      io.observe(root);
    } else {
      startLoop();
    }
    return true;
  }

  /* ---------------- exports / boot ---------------- */

  var api = {
    R1: R1,
    R2: R2,
    DT: DT,
    accel: accel,
    step: step,
    makeState: makeState,
    applyImpulse: applyImpulse,
    orbitElements: orbitElements,
    hohmann: hohmann,
    simulateHohmann: simulateHohmann,
    greedyDecision: greedyDecision,
    simulateGreedy: simulateGreedy,
    GREEDY_IMPULSE: GREEDY_IMPULSE,
    GREEDY_DT: GREEDY_DT
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof document !== "undefined") {
    var boot = function () {
      document.querySelectorAll("[data-orbit-demo]").forEach(function (root) {
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
