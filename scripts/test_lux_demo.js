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

/* ---- plotted geometry uses the same physical angle at every aspect ratio ---- */

{
  const v1 = { x: 1.28, y: 1.38 };
  const v2 = { x: 2.64, y: 1.86 };
  // Independent regression value: the former normalized-square calculation
  // gave 25.20 degrees while the 4:3 picture showed 19.44 degrees.
  const expected = Math.atan2(0.48, 1.36);
  check("4:3 detector coordinates give the visible 19.44 degree angle",
    Math.abs(lux.scatteringAngle(v1, v2) - expected) < 1e-12);

  let maxAngleError = 0;
  let maxRoundTripError = 0;
  for (const [width, height] of [[400, 300], [800, 600], [307, 230], [600, 300], [300, 600]]) {
    for (const degrees of [0, 0.1, 8, 13.3, 45, 90, 135, 179.9, 180]) {
      const theta = degrees * Math.PI / 180;
      const geometry = lux.geometryForAngle(theta);
      const p1 = lux.detectorToCanvas(geometry.v1, width, height);
      const p2 = lux.detectorToCanvas(geometry.v2, width, height);
      // atan2 from rendered points is independent of the model's acos route.
      const visibleAngle = Math.abs(Math.atan2(p2.y - p1.y, p2.x - p1.x));
      maxAngleError = Math.max(maxAngleError, Math.abs(visibleAngle - theta));
      const recovered = lux.canvasToDetector(p2, width, height);
      maxRoundTripError = Math.max(maxRoundTripError,
        Math.hypot(recovered.x - geometry.v2.x, recovered.y - geometry.v2.y));
    }
  }
  check("visible angle is invariant under aspect ratio and resolution changes",
    maxAngleError < 1e-12, maxAngleError.toExponential(2));
  check("pointer inverse recovers detector geometry after resizing and letterboxing",
    maxRoundTripError < 1e-12, maxRoundTripError.toExponential(2));
}

/* ---- native angle control spans the full physical range within the volume ---- */

{
  let contained = true;
  let accurate = true;
  for (let degrees = 0; degrees <= 180; degrees += 0.5) {
    const theta = degrees * Math.PI / 180;
    const { v1, v2 } = lux.geometryForAngle(theta);
    contained = contained && [v1, v2].every(p =>
      p.x > 0 && p.x < lux.DETECTOR_WIDTH && p.y > 0 && p.y < lux.DETECTOR_HEIGHT);
    accurate = accurate && Math.abs(lux.scatteringAngle(v1, v2) - theta) < 1e-12;
  }
  check("all slider angles keep both scatters inside the detector", contained);
  check("slider geometry reproduces every requested angle including 0 and 180 degrees", accurate);

  let maxEnergyError = 0;
  for (const energy of [0, 0.001, 0.1, 0.366, 1, 10, 65, lux.recoilEnergy(Math.PI)]) {
    const theta = lux.angleForRecoil(energy);
    // Check the inverse via the independent outgoing-neutron energy formula.
    const independentRecoil = lux.EN_KEV - lux.scatteredNeutronEnergy(theta);
    maxEnergyError = Math.max(maxEnergyError, Math.abs(independentRecoil - energy));
  }
  check("recoil-energy inversion agrees with independent neutron energy loss",
    maxEnergyError < 1e-9, maxEnergyError.toExponential(2) + " keV");
}

console.log(failures === 0 ? "\nAll checks passed." : "\n" + failures + " FAILURES");
process.exit(failures === 0 ? 0 : 1);
