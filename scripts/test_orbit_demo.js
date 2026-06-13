#!/usr/bin/env node
/*
 * Numeric checks for assets/js/orbit-demo.js (the in-browser two-body sim).
 * Run: node scripts/test_orbit_demo.js
 *
 * Designed to fail if the physics is wrong, not just if it crashes:
 *  - Hohmann delta-v and transfer time match independent hand-derived values
 *  - the symplectic integrator conserves energy and angular momentum over
 *    many orbits with no secular drift
 *  - a circular orbit stays circular and returns to its starting point
 *    after one analytic period
 *  - executing the analytic plan in the discrete simulator circularizes at
 *    the target radius, with total delta-v exactly equal to the plan and a
 *    small nonzero timing error (the teaching detail from the post)
 *  - retrograde burns lower the orbit into the planet (crash path works)
 */
"use strict";

const orbit = require("../assets/js/orbit-demo.js");

let failures = 0;
function check(name, condition, detail) {
  if (condition) {
    console.log("PASS  " + name + (detail ? "  [" + detail + "]" : ""));
  } else {
    failures += 1;
    console.error("FAIL  " + name + (detail ? "  [" + detail + "]" : ""));
  }
}

/* ---- Hohmann closed form vs hand-derived values for r1=1, r2=1.8 ---- */

{
  const plan = orbit.hohmann(1, 1.8);
  // Independent derivation: a_t = 1.4
  // dv1 = sqrt(2 - 1/1.4) - 1            = 0.13393...
  // dv2 = sqrt(1/1.8) - sqrt(2/1.8 - 1/1.4) = 0.11545...
  const dv1 = Math.sqrt(2 - 1 / 1.4) - 1;
  const dv2 = Math.sqrt(1 / 1.8) - Math.sqrt(2 / 1.8 - 1 / 1.4);
  const tT = Math.PI * Math.sqrt(1.4 ** 3);
  check("Hohmann dv1 matches hand calc", Math.abs(plan.dv1 - dv1) < 1e-12,
    plan.dv1.toFixed(6));
  check("Hohmann dv2 matches hand calc", Math.abs(plan.dv2 - dv2) < 1e-12,
    plan.dv2.toFixed(6));
  check("Hohmann transfer time matches hand calc",
    Math.abs(plan.time - tT) < 1e-12, plan.time.toFixed(6));
  check("Hohmann total in expected range",
    plan.total > 0.249 && plan.total < 0.25, plan.total.toFixed(6));
}

/* ---- conservation over 20 orbits of an eccentric orbit ---- */

{
  const s = orbit.makeState(1);
  orbit.applyImpulse(s, 1, 0.08); // mildly eccentric
  const el0 = orbit.orbitElements(s);
  const period = 2 * Math.PI * Math.sqrt(el0.a ** 3);
  let maxE = 0;
  let maxH = 0;
  const horizon = 20 * period;
  while (s.t < horizon) {
    orbit.step(s, orbit.DT);
    const el = orbit.orbitElements(s);
    maxE = Math.max(maxE, Math.abs((el.energy - el0.energy) / el0.energy));
    maxH = Math.max(maxH, Math.abs((el.h - el0.h) / el0.h));
  }
  check("energy conserved over 20 orbits (rel err < 1e-4)", maxE < 1e-4,
    maxE.toExponential(2));
  check("angular momentum conserved over 20 orbits (rel err < 1e-9)",
    maxH < 1e-9, maxH.toExponential(2));
}

/* ---- circular orbit stays circular and is periodic ---- */

{
  const s = orbit.makeState(1);
  const period = 2 * Math.PI;
  let maxDev = 0;
  while (s.t < period) {
    orbit.step(s, orbit.DT);
    maxDev = Math.max(maxDev, Math.abs(Math.hypot(s.x, s.y) - 1));
  }
  check("circular orbit radius deviation < 1e-5", maxDev < 1e-5,
    maxDev.toExponential(2));
  // s.t overshoots the period by < DT; position error ~ v * dt at worst
  const closure = Math.hypot(s.x - 1, s.y - 0);
  check("orbit closes after one period (< 2*DT)", closure < 2 * orbit.DT,
    closure.toExponential(2));
}

/* ---- elements of a circular orbit ---- */

{
  const el = orbit.orbitElements(orbit.makeState(1.8));
  check("circular elements: a = r, e = 0",
    Math.abs(el.a - 1.8) < 1e-12 && el.e < 1e-7,
    "a " + el.a.toFixed(6) + ", e " + el.e.toExponential(1));
}

/* ---- discrete Hohmann execution (the demo's autopilot) ---- */

{
  const result = orbit.simulateHohmann(1, 1.8, orbit.DT);
  const el = result.elements;
  check("autopilot circularizes near r2 (|a-1.8| < 0.5%)",
    Math.abs(el.a - 1.8) / 1.8 < 0.005, "a " + el.a.toFixed(4));
  check("autopilot eccentricity small (e < 0.01)", el.e < 0.01,
    "e " + el.e.toFixed(5));
  check("autopilot delta-v equals analytic total exactly",
    Math.abs(result.totalDv - result.plan.total) < 1e-12,
    result.totalDv.toFixed(6));
  check("timing quirk: residual eccentricity nonzero but tiny",
    el.e > 0 && el.e < 0.01, el.e.toExponential(2));
  check("autopilot meets the demo's success thresholds",
    Math.abs(el.a - 1.8) / 1.8 < 0.02 && el.e < 0.025);
}

/* ---- greedy controller: reaches the target, wastefully ---- */

{
  const plan = orbit.hohmann(1, 1.8);
  const g = orbit.simulateGreedy(1, 1.8, orbit.DT);
  const el = g.elements;
  check("greedy reaches the success band (|a-1.8|/1.8 < 2%, e < 0.025)",
    Math.abs(el.a - 1.8) / 1.8 < 0.02 && el.e < 0.025,
    "a " + el.a.toFixed(4) + ", e " + el.e.toFixed(4));
  check("greedy arrives within the demo's patience (t < 150)",
    g.arrivedAt !== null && g.arrivedAt < 150,
    "arrived t " + (g.arrivedAt === null ? "never" : g.arrivedAt.toFixed(1)));
  check("greedy costs more delta-v than Hohmann",
    g.totalDv > plan.total,
    "greedy " + g.totalDv.toFixed(4) + " vs Hohmann " + plan.total.toFixed(4));
  check("greedy chatters (>= 15 burns vs Hohmann's 2)",
    g.burnCount >= 15, g.burnCount + " burns");
  check("greedy delta-v bookkeeping exact",
    Math.abs(g.totalDv - g.burnCount * orbit.GREEDY_IMPULSE) < 1e-12);
}

/* ---- retrograde burns crash into the planet ---- */

{
  const s = orbit.makeState(1);
  orbit.applyImpulse(s, -1, 0.45); // strong retrograde: periapsis well inside
  let crashed = false;
  while (s.t < 10) {
    orbit.step(s, orbit.DT);
    if (Math.hypot(s.x, s.y) < 0.2) {
      crashed = true;
      break;
    }
  }
  check("strong retrograde burn reaches crash radius", crashed);
}

/* ---- impulse bookkeeping ---- */

{
  const s = orbit.makeState(1);
  const v0 = Math.hypot(s.vx, s.vy);
  orbit.applyImpulse(s, 1, 0.02);
  const v1 = Math.hypot(s.vx, s.vy);
  check("prograde impulse adds exactly its magnitude to speed",
    Math.abs(v1 - v0 - 0.02) < 1e-12, (v1 - v0).toFixed(6));
}

console.log(failures === 0 ? "\nAll checks passed." : "\n" + failures + " FAILURES");
process.exit(failures === 0 ? 0 : 1);
