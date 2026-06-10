---
layout: post
title: "Reinforcement Learning for Orbital Transfers at the 2026 AI Winter School (Brown University)"
date: 2026-01-09
last_modified_at: 2026-06-10
description: "Hands-on workshop using reinforcement learning (PPO) to solve a simplified orbital transfer problem. Environment design, reward shaping, and training RL agents for space mechanics."
og_image: "/assets/images/social/2026-01-09-brown-physics-ai-winter-school-workshop-1200x630.jpg"
og_image_alt: "Reinforcement Learning for Orbital Transfers at the 2026 AI Winter School"
og_image_width: 1200
og_image_height: 630
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
---

I recently gave a 2.5-hour, hands-on workshop on using reinforcement learning (RL) to solve a simplified orbital transfer problem at the **2026 AI Winter School**, hosted by the **Center for the Fundamental Physics of the Universe at Brown University**.

The goal of the workshop was educational: use a familiar physics problem with a known analytic solution as a sandbox for understanding the practical RL workflow. We started with the classic **Hohmann transfer** as a baseline, then built a small **2D, two-body orbital simulator** and trained PPO (**Proximal Policy Optimization**) agents to learn transfer policies in simulation.

The setup was intentionally simple: circular orbit transfer, normalized two-body gravity, no drag, no J2 perturbation, no third body, and tangential per-step Δv impulses. That kept the notebook compact enough to inspect directly while still producing meaningful orbital behavior.

## From Physics Problem to RL Problem

A key part of the workshop was turning the orbital-transfer problem into an RL environment:

- **Observation:** radius, radial velocity, tangential velocity, target energy error, target angular-momentum error, and previous action.
- **Action:** either discrete control (`coast`, `prograde`, `retrograde`) or continuous-valued tangential impulse control.
- **Reward:** dense shaping based on energy/angular-momentum error, plus costs for using Δv, ignition/action changes, crashing, and failing to reach the target region.
- **Diagnostics:** trajectory plots, radius and radial-velocity histories, thrust impulse histories, and cumulative |Δv|.

The Hohmann transfer gave us a useful reference point. In the idealized circular, coplanar, two-body case, the transfer has a clean burn-coast-burn structure. That made it easy to compare the learned policies against something interpretable, rather than treating the RL agent as a black box.

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
