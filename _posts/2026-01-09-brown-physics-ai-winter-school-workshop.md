---
layout: post
title: "Reinforcement Learning for Orbital Transfers at the 2026 AI Winter School (Brown University)"
date: 2026-01-09
last_modified_at: 2026-06-24
description: "Hands-on workshop framing orbital transfer as a controlled two-body dynamics problem: Hohmann benchmark, Gymnasium environment, PPO policies, reward shaping, and diagnostics for chatter and delta-v efficiency."
og_image: "/assets/images/2026-ai-winter-school-banner.png"
og_image_alt: "2026 AI Winter School banner from the Brown University Department of Physics"
og_image_width: 1024
og_image_height: 530
categories:
  - AI and Machine Learning
tags:
  - Reinforcement Learning
  - PPO
  - Brown University
  - AI
  - Physics
  - Orbital Mechanics
  - Astrodynamics
related:
  - /2025/02/10/brown-physics-ai-winter-school-workshop/
---

<img src="{{ '/assets/images/2026-ai-winter-school-banner.png' | relative_url }}" alt="2026 AI Winter School banner — Brown University Department of Physics, Center for the Fundamental Physics of the Universe, January 6–9, 2026" width="1024" height="530" loading="eager" decoding="async" fetchpriority="high">

At the 2026 AI Winter School, hosted by the Center for the Fundamental Physics of the Universe at Brown University, I led a 2.5-hour hands-on workshop on reinforcement learning for orbital transfers.

The workshop was not about claiming that RL is the right way to solve a textbook astrodynamics problem. The point was to use a problem with known mechanics and a known analytic solution as a controlled environment for learning the applied RL workflow: define the state, action, reward, and diagnostics; train a policy; compare it against ground truth; then explain the failure modes.

## Control Problem

The notebook used nondimensional two-body dynamics. The gravitational parameter was set to `μ = 1`, the spacecraft started on a circular orbit at `r1 = 1`, and the target was a larger circular orbit at `r2 = 1.6`. The model omitted drag, finite-duration thrust, J2 perturbations, third bodies, attitude dynamics, and mass depletion. Control was a tangential impulse applied once per simulation step.

The state evolves under central gravity:

```text
dx/dt = v
dv/dt = -μ x / |x|^3
```

That stripped-down model is still useful because the relevant orbital invariants are visible. For a circular target orbit, the target specific energy and angular momentum are known:

```text
E* = -μ / (2 r2)
L* = sqrt(μ r2)
```

The RL environment did not need to know the absolute orbital angle. The observation vector used normalized radius, radial velocity, tangential velocity, angular-momentum error, energy error, and previous action. Removing angle makes the policy rotationally symmetric: the same local orbital state should produce the same control decision anywhere around the planet.

## Hohmann Benchmark

Before training PPO, the notebook computed the Hohmann transfer. For circular, coplanar orbits with two impulsive burns, the transfer semi-major axis is:

```text
aT = (r1 + r2) / 2
```

The two burns and transfer time are:

```text
Δv1 = sqrt(μ(2/r1 - 1/aT)) - sqrt(μ/r1)
Δv2 = sqrt(μ/r2) - sqrt(μ(2/r2 - 1/aT))
T   = π sqrt(aT^3 / μ)
```

That closed-form solution gave the workshop a real yardstick: not just "did the agent reach the target," but how much Δv it spent, how many burns it used, whether it circularized, and whether the trajectory matched the expected burn-coast-burn structure.

<img src="{{ '/assets/images/rl-orbital-hohmann-trajectory.png' | relative_url }}" alt="Hohmann transfer trajectory: the transfer ellipse touching the inner start orbit and the outer target orbit" width="708" height="711" loading="lazy" decoding="async">

The verification plots made the baseline concrete: the trajectory should be an ellipse touching `r1` and `r2`, the radius history should rise from the inner orbit to the outer orbit after the second burn, and cumulative Δv should match the analytic total.

<img src="{{ '/assets/images/rl-orbital-hohmann-verification.png' | relative_url }}" alt="Verification plots for the simulated Hohmann transfer: radius versus time rising to the target, two thrust impulses showing the burn-coast-burn structure, and cumulative delta-v matching the ideal total" width="1411" height="911" loading="lazy" decoding="async">

One useful teaching detail appeared immediately: even the analytic plan does not land exactly on `r2` in a finite-timestep simulator if the second burn fires on the first step at or after the computed transfer time. The total Δv still matches theory, but the final orbit has a small residual timing error. That separates continuous-time theory, numerical integration, and policy behavior before RL enters the discussion.

{% include site/orbit-demo.html %}

## RL Formulation

The Gymnasium environment held the physics fixed and varied the control interface:

| Component | Implementation |
| --- | --- |
| **Observation** | Normalized `r`, `vr`, `vt`, target angular-momentum error, target energy error, previous action |
| **Discrete action** | `coast`, full prograde impulse, full retrograde impulse |
| **Continuous action** | throttle in `[-1, 1]`, mapped to a signed tangential Δv impulse |
| **Success criteria** | tolerances on `|r - r2|`, `|vr|`, and `|L - L*|` |
| **Failure criteria** | crash/escape radius or episode timeout |

The dense reward used a combined energy/angular-momentum error:

```text
err = |E - E*| / |E*| + |L - L*| / |L*|
```

with shaping approximately proportional to:

```text
err_previous - γ err_current
```

Then the environment subtracted fuel and ignition/switching penalties, added a one-time success bonus on first entry into the tolerance region, and added a holding reward for staying there. PPO was trained with observation/reward normalization during training, frozen normalization statistics during evaluation, and deterministic policy rollout for diagnostics.

## What the Diagnostics Caught

The important lesson was that endpoint success is too weak a metric. A policy can enter the success region and still be a poor transfer.

The notebook compared policies using trajectory, radius history, radial velocity, thrust impulses, cumulative Δv, number of burns or active-thrust steps, closest-to-target statistics, and the mission report against the Hohmann ideal.

The failure modes were instructive:

- **Discrete control:** small fixed impulses can reach the target, but often with many prograde/retrograde corrections. The orbit may satisfy the tolerance band while wasting Δv.
- **Continuous control:** throttle control is more expressive, but it can learn micro-thrusting: almost continuous small corrections that keep the error low while hiding poor fuel efficiency.
- **Tolerance exploitation:** a policy can appear to "beat" the ideal by stopping inside loose tolerances on a slightly elliptical orbit. That is not a better transfer; it is a reminder that the metric defines the game.
- **Final-state ambiguity:** final radius alone is misleading for eccentric orbits. Closest approach, radial-velocity history, angular momentum, and thrust history are needed to interpret what the policy actually learned.

## Experiment Loop

The final notebook section let participants edit a `ModeConfig` and rerun training. The knobs were not decorative; each one changes the control problem:

- `dv_mag`: control authority per step
- `fuel_cost_penalty`: cost of using Δv
- `ignition_penalty`: cost of turning on or changing thrust
- `reward_shaping_scale`: strength of dense energy/angular-momentum shaping
- `training_timesteps`, `learning_rate`, and `ent_coef`: PPO optimization and exploration behavior

The practical standard was:

```text
train a policy
inspect trajectory, thrust, and Δv
compare against Hohmann
explain the failure mode
change one parameter or design choice
rerun
```

That loop is the point of using RL in a problem with analytic ground truth. The goal is not to celebrate a learned policy for reaching the target. The goal is to make the policy's behavior legible enough that failures are evidence for the next experiment.

## Materials

### Workshop Recording

[Workshop Recording](https://www.youtube.com/watch?v=BdPzEhGc7Cw)

### Slides

[Slides (PDF)]({{ '/assets/files/2026-01-09%20-%20James%20Verbus%20-%20Brown%20AI%20Winter%20School%20-%20Reinforcement%20Learning%20for%20Orbital%20Transfers.pdf' | relative_url }})

### Code

[RL for Orbital Transfers Notebook]({{ '/assets/files/2026_01_09_James_Verbus_Brown_AI_Winter_School_RL_Orbital_Transfers.ipynb' | relative_url }})

### Event Page

For the full schedule and recordings across all modules:

[2026 AI Winter School (Indico)](https://indico.physics.brown.edu/event/192/)
