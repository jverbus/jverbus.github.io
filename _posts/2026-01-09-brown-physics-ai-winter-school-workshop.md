---
layout: post
title: "Reinforcement Learning for Orbital Transfers at the 2026 AI Winter School (Brown University)"
date: 2026-01-09
last_modified_at: 2026-06-10
description: "Hands-on workshop using reinforcement learning (PPO) to solve a simplified orbital transfer problem. Environment design, reward shaping, and training RL agents for space mechanics."
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
  - /2016/08/18/calibrating-the-lux-dark-matter-experiment/
  - /2026/03/18/announcing-extended-isolation-forest-support/
---

<img src="{{ '/assets/images/2026-ai-winter-school-banner.png' | relative_url }}" alt="2026 AI Winter School banner — Brown University Department of Physics, Center for the Fundamental Physics of the Universe, January 6–9, 2026" width="1024" height="530" loading="eager" decoding="async" fetchpriority="high">

I recently gave a 2.5-hour, hands-on workshop on using reinforcement learning (RL) to solve a simplified orbital transfer problem at the **2026 AI Winter School**, hosted by the **Center for the Fundamental Physics of the Universe at Brown University**.

The goal of the workshop was educational: use a familiar physics problem with a known analytic solution as a sandbox for understanding the practical RL workflow. We started with the classic **Hohmann transfer** as a baseline, then built a small **2D, two-body orbital simulator** and trained PPO (**Proximal Policy Optimization**) agents to learn transfer policies in simulation.

The setup was intentionally simple: circular orbit transfer, normalized two-body gravity, no drag, no J2 perturbation, no third body, and tangential per-step Δv impulses. That kept the notebook compact enough to inspect directly while still producing meaningful orbital behavior.

## From Physics Problem to RL Problem

A key part of the workshop was turning the orbital-transfer problem into an RL environment:

- **Observation:** radius, radial velocity, tangential velocity, target energy error, target angular-momentum error, and previous action.
- **Action:** either discrete control (`coast`, `prograde`, `retrograde`) or continuous-valued tangential impulse control.
- **Reward:** dense shaping based on energy/angular-momentum error, plus costs for using Δv, ignition/action changes, crashing, and failing to reach the target region.
- **Diagnostics:** trajectory plots, radius and radial-velocity histories, thrust impulse histories, and cumulative \|Δv\|.

## Analytic Ground Truth: The Hohmann Transfer

Before letting RL control anything, we computed the analytic Hohmann transfer and executed it with the same physics integrator the agents would use. In the idealized circular, coplanar, two-body case, the transfer has a clean burn-coast-burn structure:

1. **Burn 1 at r₁:** raise apoapsis to r₂
2. **Coast** for half an ellipse
3. **Burn 2 at r₂:** circularize

From the analytic solution we computed Δv₁, Δv₂, the transfer time, and the total Δv, then simulated those burns directly.

<img src="{{ '/assets/images/rl-orbital-hohmann-trajectory.png' | relative_url }}" alt="Hohmann transfer trajectory: the transfer ellipse touching the inner start orbit and the outer target orbit" width="708" height="711" loading="lazy" decoding="async">

The verification plots made the baseline easy to check: the trajectory should be an ellipse touching r₁ and r₂, the radius-vs-time curve should rise cleanly from r₁ and settle at r₂ after the second burn, and the cumulative Δv should match the theoretical total.

<img src="{{ '/assets/images/rl-orbital-hohmann-verification.png' | relative_url }}" alt="Verification plots for the simulated Hohmann transfer: radius versus time rising to the target, two thrust impulses showing the burn-coast-burn structure, and cumulative delta-v matching the ideal total" width="1411" height="911" loading="lazy" decoding="async">

One teaching detail surfaced immediately: even the "analytic" solution does not land exactly on r₂ in a discrete simulator, because burn 2 fires on the first timestep at or after the computed transfer time. With a finite timestep, that introduces a small timing error. That mismatch was a useful moment to separate modeling error from algorithm error, and discretization effects from continuous-time theory — the total Δv still matches theory even when the final radius is slightly off.

That gave us an interpretable yardstick for the learned policies, rather than treating the RL agent as a black box.

## What the Thrust Histories Revealed

The most useful lesson was that reaching the target orbit is not the same as learning a good transfer.

Some learned policies reached the target region but kept applying small corrective impulses. The trajectory plot looked reasonable, but the thrust history told a different story: the policy had learned to trim the orbit rather than execute a clean transfer. That gave us a concrete way to discuss reward shaping, action-space design, chatter, overcorrection, and the difference between endpoint success and efficient control.

The discrete controller was crude but readable: it had to stitch together the transfer from small prograde and retrograde impulses. The continuous controller had more expressive control, but that flexibility did not automatically produce cleaner behavior. In some runs, it reached the target region and then kept correcting.

Those failure modes were the point of the demo. The plots made the learned behavior visible.

## Hands-on Experiment

The final section of the notebook let participants modify the training configuration and rerun experiments. They could adjust parameters such as maximum per-step impulse, control-effort cost, ignition penalty, shaping scale, training steps, entropy coefficient, and learning rate.

The point was not to produce a perfect mission optimizer in one afternoon. It was to practice the applied RL loop:

```text
train a policy
inspect what it did
explain the behavior
change the environment or reward
try again
```

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
