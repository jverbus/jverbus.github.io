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

/* ---- Hohmann closed form vs hand-derived values for r1=1, r2=1.6 ---- */

{
  const plan = orbit.hohmann(1, 1.6);
  // Independent derivation: a_t = 1.3
  // dv1 = sqrt(2 - 1/1.3) - 1                = 0.10940...
  // dv2 = sqrt(1/1.6) - sqrt(2/1.6 - 1/1.3) = 0.09719...
  const dv1 = Math.sqrt(2 - 1 / 1.3) - 1;
  const dv2 = Math.sqrt(1 / 1.6) - Math.sqrt(2 / 1.6 - 1 / 1.3);
  const tT = Math.PI * Math.sqrt(1.3 ** 3);
  check("Hohmann dv1 matches hand calc", Math.abs(plan.dv1 - dv1) < 1e-12,
    plan.dv1.toFixed(6));
  check("Hohmann dv2 matches hand calc", Math.abs(plan.dv2 - dv2) < 1e-12,
    plan.dv2.toFixed(6));
  check("Hohmann transfer time matches hand calc",
    Math.abs(plan.time - tT) < 1e-12, plan.time.toFixed(6));
  check("Hohmann total in expected range",
    plan.total > 0.206 && plan.total < 0.207, plan.total.toFixed(6));
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
  const el = orbit.orbitElements(orbit.makeState(1.6));
  check("circular elements: a = r, e = 0",
    Math.abs(el.a - 1.6) < 1e-12 && el.e < 1e-7,
    "a " + el.a.toFixed(6) + ", e " + el.e.toExponential(1));
}

/* ---- discrete Hohmann execution (the demo's autopilot) ---- */

{
  const result = orbit.simulateHohmann(1, 1.6, orbit.DT);
  const el = result.elements;
  check("autopilot circularizes near r2 (|a-1.6| < 0.5%)",
    Math.abs(el.a - 1.6) / 1.6 < 0.005, "a " + el.a.toFixed(4));
  check("autopilot eccentricity small (e < 0.01)", el.e < 0.01,
    "e " + el.e.toFixed(5));
  check("autopilot delta-v equals analytic total exactly",
    Math.abs(result.totalDv - result.plan.total) < 1e-12,
    result.totalDv.toFixed(6));
  check("timing quirk: residual eccentricity nonzero but tiny",
    el.e > 0 && el.e < 0.01, el.e.toExponential(2));
  check("autopilot meets the demo's success thresholds",
    orbit.inTargetOrbit(result.state, 1.6));
}

/* ---- greedy controller: reaches the target, wastefully ---- */

{
  const plan = orbit.hohmann(1, 1.6);
  const g = orbit.simulateGreedy(1, 1.6, orbit.DT);
  const el = g.elements;
  check("greedy reaches a coast orbit wholly inside the displayed target band",
    orbit.inTargetOrbit(g.state, 1.6),
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

/* ---- predicted apsides agree with the transfer and numerical coast ---- */

{
  const s = orbit.makeState(1);
  orbit.applyImpulse(s, 1, orbit.hohmann(1, 1.6).dv1);
  const b = orbit.orbitBounds(s);
  check("predicted transfer apsides are the two circular-orbit radii",
    Math.abs(b.near - 1) < 1e-12 && Math.abs(b.far - 1.6) < 1e-12);
  const theta = Math.PI / 3;
  const rotated = { x: Math.cos(theta), y: Math.sin(theta),
    vx: -s.vy * Math.sin(theta), vy: s.vy * Math.cos(theta), t: 0 };
  const rb = orbit.orbitBounds(rotated);
  check("predicted periapsis direction rotates with the physical state",
    Math.abs(rb.angle - theta) < 1e-12 && Math.abs(rb.far - b.far) < 1e-12);
  const smallE = 0.0004;
  const nearRadius = 1.6 * (1 - smallE);
  const nearSpeed = Math.sqrt(2 / nearRadius - 1 / 1.6);
  const nearlyCircular = { x: nearRadius * Math.cos(theta), y: nearRadius * Math.sin(theta),
    vx: -nearSpeed * Math.sin(theta), vy: nearSpeed * Math.cos(theta), t: 0 };
  check("small but resolved eccentricity keeps its physical apsis direction",
    Math.abs(orbit.orbitBounds(nearlyCircular).angle - theta) < 1e-10);
  let near = Infinity;
  let far = 0;
  const period = 2 * Math.PI * Math.sqrt(b.a ** 3);
  while (s.t < period) {
    orbit.step(s, orbit.DT);
    const radius = Math.hypot(s.x, s.y);
    near = Math.min(near, radius);
    far = Math.max(far, radius);
  }
  check("numerical coast reaches the predicted near and far radii",
    Math.abs(near - b.near) < 2e-5 && Math.abs(far - b.far) < 2e-5,
    near.toFixed(6) + "–" + far.toFixed(6));
}

/* ---- success means a full thrust-free coast stays inside the shown band ---- */

for (const [name, result] of [
  ["Hohmann", orbit.simulateHohmann(1, 1.6, orbit.DT)],
  ["Greedy", orbit.simulateGreedy(1, 1.6, orbit.DT)]
]) {
  const s = { ...result.state };
  const a = orbit.orbitElements(s).a;
  const end = s.t + 4 * Math.PI * Math.sqrt(a ** 3);
  let near = Infinity;
  let far = 0;
  while (s.t < end) {
    orbit.step(s, orbit.DT);
    const radius = Math.hypot(s.x, s.y);
    near = Math.min(near, radius);
    far = Math.max(far, radius);
  }
  check(name + " stays in the visible ±2% radius band for two coast orbits",
    near >= 1.568 && far <= 1.632,
    near.toFixed(6) + "–" + far.toFixed(6));
}

{
  // This orbit passed the old separate a/e checks but leaves the drawn band.
  const a = 1.5788651159010214;
  const e = 0.02119984837046591;
  const r = a * (1 - e);
  const s = { x: r, y: 0, vx: 0, vy: Math.sqrt(2 / r - 1 / a), t: 0 };
  check("old nominal success with out-of-band periapsis is rejected",
    Math.abs(a - 1.6) / 1.6 < 0.02 && e < 0.025 && !orbit.inTargetOrbit(s, 1.6));
  const target = orbit.makeState(1.6);
  orbit.applyImpulse(target, 1, 0.04);
  const departed = !orbit.inTargetOrbit(target, 1.6);
  orbit.applyImpulse(target, -1, 0.04);
  check("manual departure and corrective burn can leave and reenter success",
    departed && orbit.inTargetOrbit(target, 1.6));
  const escaped = orbit.makeState(1);
  orbit.applyImpulse(escaped, 1, 0.5);
  check("unbound orbit has no finite far point and cannot complete",
    orbit.orbitBounds(escaped).far === Infinity && !orbit.inTargetOrbit(escaped, 1.6));
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
