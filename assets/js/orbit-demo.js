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
  var R2 = 1.6;
  var DT = 0.004;
  var CRASH_RADIUS = 0.2;
  var ESCAPE_RADIUS = 2.5;
  var TARGET_TOL = 0.02; // the complete coast orbit must fit the radius band
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

  function orbitBounds(s) {
    var el = orbitElements(s);
    var rv = s.x * s.vx + s.y * s.vy;
    var factor = el.v * el.v - 1 / el.r;
    return {
      near: el.energy < 0 ? el.a * (1 - el.e) : el.h * el.h / (1 + el.e),
      far: el.energy < 0 ? el.a * (1 + el.e) : Infinity,
      angle: el.e < 1e-8 ? 0 : Math.atan2(factor * s.y - rv * s.vy, factor * s.x - rv * s.vx),
      a: el.a,
      e: el.e
    };
  }

  function inTargetOrbit(s, target) {
    var bounds = orbitBounds(s);
    return bounds.near >= target * (1 - TARGET_TOL) &&
      bounds.far <= target * (1 + TARGET_TOL);
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
  // then damps eccentricity near the apsides. It reaches the target with
  // more impulses and delta-v than the two-burn transfer.
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
        if (inTargetOrbit(s, r2)) {
          arrivedAt = s.t;
          break;
        }
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
    if (!orbitCanvas) return false;
    var mapCtx = orbitCanvas.getContext("2d");
    if (!mapCtx) return false;

    var plan = hohmann(R1, R2);
    var reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var sim = {
      state: makeState(R1),
      running: false,
      ended: false, // crashed or escaped
      arrived: false,
      stage: null,
      stageUntil: 0,
      lastBurnTime: -Infinity,
      trail: [],
      stepCount: 0,
      autopilot: null, // {burnTime} when waiting for burn 2
      greedy: null // {nextControl} while the greedy controller is engaged
    };

    var inView = false;
    var clearBurnHolds = [];
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

    /* ---- flight and status ---- */

    function recordStep() {
      sim.stepCount++;
      if (sim.stepCount % 5 === 0) {
        sim.trail.push([sim.state.x, sim.state.y]);
        if (sim.trail.length > 700) sim.trail.shift();
      }
    }

    function recordBurn(dir, magnitude) {
      applyImpulse(sim.state, dir, magnitude);
      sim.lastBurnTime = sim.state.t;
    }

    function burn(dir) {
      if (sim.ended) return;
      sim.autopilot = null;
      sim.greedy = null;
      recordBurn(dir, IMPULSE);
      sim.stage = "manual-burn";
      sim.stageUntil = sim.state.t + 0.7;
      setStatus(dir > 0 ? "Speeding up" : "Slowing down");
      checkEvents();
      if (!sim.running) setRunning(true);
      draw();
    }

    var statusEl = root.querySelector("[data-orbit-status]");
    var pauseButton = root.querySelector('button[data-action="pause"]');

    function setStatus(text) {
      if (statusEl && statusEl.textContent !== text) statusEl.textContent = text;
    }

    function updateStage() {
      if (sim.stage && sim.state.t >= sim.stageUntil) {
        sim.stage = null;
        setStatus(sim.arrived ? "Target orbit reached" : "Coasting");
      }
    }

    function checkEvents() {
      var el = orbitElements(sim.state);
      if (el.r < CRASH_RADIUS) {
        sim.ended = true;
        setRunning(false);
        setStatus("Crashed — try Reset");
        return;
      }
      if (el.energy >= 0 && el.r > ESCAPE_RADIUS) {
        sim.ended = true;
        setRunning(false);
        setStatus("Escaped — try Reset");
        return;
      }
      var arrivedNow = inTargetOrbit(sim.state, R2);
      if (!sim.arrived && arrivedNow) {
        sim.arrived = true;
        sim.greedy = null;
        if (sim.stage !== "second-burn") {
          sim.stage = null;
          setStatus("Target orbit reached");
        }
      } else if (sim.arrived && !arrivedNow) {
        sim.arrived = false;
        setStatus("Steer back toward the blue orbit");
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

      var mapScale = canvas.width / (2 * VIEW_RADIUS);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(96, 165, 250, 0.2)";
      ctx.lineWidth = 2 * R2 * TARGET_TOL * mapScale;
      ctx.arc(canvas.width / 2, canvas.height / 2, R2 * mapScale, 0, 2 * Math.PI);
      ctx.stroke();
      drawCircle(ctx, canvas, R2, "rgba(96, 165, 250, 0.8)");
      ctx.fillStyle = "#93c5fd";
      ctx.font = Math.max(12, canvas.width / 30) + "px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Target orbit", canvas.width / 2, canvas.height / 2 - R2 * mapScale - canvas.width / 35);

      // Osculating coast orbit: the path with no further burns.
      var bounds = orbitBounds(sim.state);
      if (isFinite(sim.lastBurnTime) && isFinite(bounds.far)) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(110, 231, 183, 0.35)";
        ctx.lineWidth = Math.max(1, canvas.width / 600);
        ctx.setLineDash([6, 4]);
        for (var n = 0; n <= 160; n++) {
          var anomaly = 2 * Math.PI * n / 160;
          var radius = bounds.a * (1 - bounds.e * bounds.e) / (1 + bounds.e * Math.cos(anomaly));
          var point = worldToMap(radius * Math.cos(anomaly + bounds.angle), radius * Math.sin(anomaly + bounds.angle), canvas);
          if (n === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // planet
      var c = worldToMap(0, 0, canvas);
      ctx.beginPath();
      ctx.fillStyle = "#7ea4d8";
      ctx.arc(c[0], c[1], CRASH_RADIUS * mapScale, 0, 2 * Math.PI);
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
      var burnAge = sim.state.t - sim.lastBurnTime;
      if (!reduceMotion && burnAge < 0.45) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(253, 230, 138, " + (1 - burnAge / 0.45) + ")";
        ctx.lineWidth = Math.max(1.5, canvas.width / 250);
        ctx.arc(sp[0], sp[1], (7 + burnAge * 25) * canvas.width / 400, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.fillStyle = "#fde68a";
      ctx.strokeStyle = "rgba(12, 20, 38, 0.9)";
      ctx.lineWidth = Math.max(1, canvas.width / 800);
      ctx.arc(sp[0], sp[1], Math.max(3, canvas.width / 170), 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    function draw() {
      fitCanvas(orbitCanvas);
      drawMap();
    }

    /* ---- main loop ---- */

    var rafId = null;
    var lastFrame = null;
    var carry = 0;

    function frame(now) {
      rafId = null;
      if (lastFrame === null) lastFrame = now;
      var real = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      if (sim.running && !sim.ended) {
        carry += real * SIM_SPEED * (sim.greedy ? 4 : 1);
        while (carry >= DT && sim.running && !sim.ended) {
          step(sim.state, DT);
          recordStep();
          if (sim.autopilot && sim.state.t >= sim.autopilot.burnTime) {
            recordBurn(1, plan.dv2);
            sim.autopilot = null;
            sim.stage = "second-burn";
            sim.stageUntil = sim.state.t + 0.9;
            setStatus("Second burn");
          }
          if (sim.greedy && sim.state.t >= sim.greedy.nextControl) {
            sim.greedy.nextControl = sim.state.t + GREEDY_DT;
            var greedyDir = greedyDecision(sim.state, R2);
            if (greedyDir !== 0) {
              recordBurn(greedyDir, GREEDY_IMPULSE);
            }
          }
          carry -= DT;
          checkEvents();
          if (!sim.ended) updateStage();
        }
      }
      draw();
      if (sim.running && !sim.ended && inView && !document.hidden) startLoop(false);
    }

    function startLoop(resetClock) {
      if (rafId === null && sim.running && !sim.ended && inView && !document.hidden) {
        if (resetClock !== false) lastFrame = null;
        rafId = window.requestAnimationFrame(frame);
      }
    }

    function stopLoop() {
      clearBurnHolds.forEach(function (clear) { clear(); });
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastFrame = null;
    }

    function setRunning(running) {
      sim.running = running;
      if (pauseButton) {
        pauseButton.textContent = running ? "Pause" : "Resume";
        pauseButton.setAttribute("aria-pressed", running ? "false" : "true");
      }
      if (running) startLoop();
      else stopLoop();
    }

    function reset(message) {
      clearBurnHolds.forEach(function (clear) { clear(); });
      sim.state = makeState(R1);
      sim.stage = null;
      sim.stageUntil = 0;
      sim.lastBurnTime = -Infinity;
      sim.trail = [];
      sim.stepCount = 0;
      sim.ended = false;
      sim.arrived = false;
      sim.autopilot = null;
      sim.greedy = null;
      carry = 0;
      setRunning(!reduceMotion);
      setStatus(message || "Ready to fly");
      draw();
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
      clearBurnHolds.push(clear);
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
      window.addEventListener("pointerup", clear);
      window.addEventListener("blur", clear);
      document.addEventListener("visibilitychange", clear);
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
        draw();
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
        reset("First burn");
        sim.stage = "first-burn";
        sim.stageUntil = 0.7;
        recordBurn(1, plan.dv1);
        sim.autopilot = { burnTime: plan.time };
        setRunning(true);
        draw();
      });
    }

    var greedyButton = root.querySelector('button[data-action="greedy"]');
    if (greedyButton) {
      greedyButton.addEventListener("click", function () {
        reset("Greedy · 4× playback");
        sim.greedy = { nextControl: 0 };
        setRunning(true);
        draw();
      });
    }

    /* ---- environment hooks ---- */

    if (window.matchMedia) {
      var scheme = window.matchMedia("(prefers-color-scheme: dark)");
      if (scheme.addEventListener) {
        scheme.addEventListener("change", draw);
      }
      var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (motion.addEventListener) motion.addEventListener("change", function (event) {
        reduceMotion = event.matches;
        if (reduceMotion) setRunning(false);
        draw();
      });
    }
    window.addEventListener("resize", draw);
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) { draw(); startLoop(); }
    });
    window.addEventListener("pagehide", stopLoop);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopLoop();
      else { draw(); startLoop(); }
    });

    root.hidden = false;
    reset();

    // Run the loop only while the demo is near the viewport.
    if (typeof IntersectionObserver !== "undefined") {
      var io = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            inView = entries[i].isIntersecting;
            if (inView) { draw(); startLoop(); }
            else stopLoop();
          }
        },
        { rootMargin: "200px 0px" }
      );
      io.observe(root);
    } else {
      inView = true;
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
    orbitBounds: orbitBounds,
    inTargetOrbit: inTargetOrbit,
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
