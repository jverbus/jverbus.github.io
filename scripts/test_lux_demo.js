#!/usr/bin/env node
/*
 * Numeric checks for assets/js/lux-demo.js (D-D scattering kinematics).
 * Run: node scripts/test_lux_demo.js
 *
 * The central check is independence: recoilEnergy() converts the lab angle
 * through the CM frame, while scatteredNeutronEnergy() is a separate
 * closed-form lab-frame derivation. Energy conservation requires
 * E_r(theta) + E_n'(theta) = E_n for every angle; agreement to 1e-9 means
 * both derivations would have to be wrong in exactly the same way.
 */
"use strict";

const lux = require("../assets/js/lux-demo.js");

let failures = 0;
function check(name, condition, detail) {
  if (condition) {
    console.log("PASS  " + name + (detail ? "  [" + detail + "]" : ""));
  } else {
    failures += 1;
    console.error("FAIL  " + name + (detail ? "  [" + detail + "]" : ""));
  }
}

/* ---- energy conservation across the two independent derivations ---- */

{
  let maxErr = 0;
  for (let i = 0; i <= 180; i++) {
    const th = (Math.PI * i) / 180;
    const sum = lux.recoilEnergy(th) + lux.scatteredNeutronEnergy(th);
    maxErr = Math.max(maxErr, Math.abs(sum - lux.EN_KEV) / lux.EN_KEV);
  }
  check("E_r + E_n' = E_n at every degree (rel err < 1e-9)", maxErr < 1e-9,
    maxErr.toExponential(2));
}

/* ---- endpoints ---- */

{
  check("forward scattering deposits nothing", lux.recoilEnergy(0) === 0);
  const endpoint = lux.recoilEnergy(Math.PI);
  check("backscatter endpoint matches the published ~74 keV",
    endpoint > 73.5 && endpoint < 74.5, endpoint.toFixed(2) + " keV");
  // 4 mM/(m+M)^2 at theta = pi, computed independently
  const frac = (4 * lux.MU) / ((1 + lux.MU) * (1 + lux.MU));
  check("endpoint equals E_n * 4mM/(m+M)^2",
    Math.abs(endpoint - lux.EN_KEV * frac) < 1e-9);
}

/* ---- monotonicity and the calibration's energy reach ---- */

{
  let monotonic = true;
  let prev = -1;
  for (let i = 0; i <= 360; i++) {
    const er = lux.recoilEnergy((Math.PI * i) / 360);
    if (er < prev) monotonic = false;
    prev = er;
  }
  check("recoil energy monotonic in scattering angle", monotonic);

  const at8 = lux.recoilEnergy((8 * Math.PI) / 180);
  check("small angles reach below the 0.7 keV analysis threshold",
    at8 < 0.7, "E_r(8°) = " + at8.toFixed(3) + " keV");
  const at13 = lux.recoilEnergy((13.3 * Math.PI) / 180);
  check("~13° gives ~1 keV (sub-keV boundary)",
    at13 > 0.85 && at13 < 1.15, "E_r(13.3°) = " + at13.toFixed(3) + " keV");
}

/* ---- vertex geometry -> angle ---- */

{
  const deg = (v1, v2) =>
    (lux.scatteringAngle(v1, v2) * 180) / Math.PI;
  check("forward geometry gives 0°",
    Math.abs(deg({ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 })) < 1e-12);
  check("perpendicular geometry gives 90°",
    Math.abs(deg({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.9 }) - 90) < 1e-12);
  check("diagonal geometry gives 45°",
    Math.abs(deg({ x: 0.3, y: 0.5 }, { x: 0.5, y: 0.7 }) - 45) < 1e-9);
  check("backward geometry gives 180°",
    Math.abs(deg({ x: 0.8, y: 0.5 }, { x: 0.2, y: 0.5 }) - 180) < 1e-12);
  check("angle ignores up/down mirror (magnitude only)",
    Math.abs(deg({ x: 0.5, y: 0.5 }, { x: 0.7, y: 0.3 }) -
      deg({ x: 0.5, y: 0.5 }, { x: 0.7, y: 0.7 })) < 1e-12);
}

console.log(failures === 0 ? "\nAll checks passed." : "\n" + failures + " FAILURES");
process.exit(failures === 0 ? 0 : 1);
