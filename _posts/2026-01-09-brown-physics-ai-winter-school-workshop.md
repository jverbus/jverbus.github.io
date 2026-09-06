---
layout: post
title: "Reinforcement Learning for Orbital Transfers at the 2026 AI Winter School (Brown University)"
date: 2026-01-09
last_modified_at: 2026-09-06
description: "Training PPO policies for orbital transfers and comparing their trajectories and delta-v with a Hohmann baseline."
og_image: "/assets/images/2026-ai-winter-school-banner.png"
og_image_alt: "2026 AI Winter School banner from the Brown University Department of Physics"
og_image_width: 1024
og_image_height: 530
math: true
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

I used a two-body transfer with a known analytic solution so we could compare learned policies with a baseline. This article is a workshop guide to training and inspecting policies, rather than a performance report. The [notebook](#code) contains the environment, training procedure, and saved example outputs for running that comparison.

## Control Problem

The notebook used nondimensional two-body dynamics: unit gravitational parameter, an initial circular orbit at radius 1, and a target circular orbit at radius 1.6. I call those radii <span class="math-inline"><math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>r</mi><mn>1</mn></msub></math></span> and <span class="math-inline"><math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>r</mi><mn>2</mn></msub></math></span> below. The model omitted drag, finite-duration thrust, J2 perturbations, third bodies, attitude dynamics, and mass depletion. Control was a tangential impulse applied once per simulation step.

Here the arrowed r denotes the spacecraft position vector; the plain r denotes its scalar radius. The state evolves under central gravity:

<div class="math-display" aria-label="Central gravity dynamics">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <semantics>
    <mtable columnalign="right center left" columnspacing="0.35em" rowspacing="0.35em">
      <mtr>
        <mtd>
          <mfrac>
            <mrow><mi>d</mi><mover accent="true"><mi>r</mi><mo>→</mo></mover></mrow>
            <mrow><mi>d</mi><mi>t</mi></mrow>
          </mfrac>
        </mtd>
        <mtd><mo>=</mo></mtd>
        <mtd><mover accent="true"><mi>v</mi><mo>→</mo></mover></mtd>
      </mtr>
      <mtr>
        <mtd>
          <mfrac>
            <mrow><mi>d</mi><mover accent="true"><mi>v</mi><mo>→</mo></mover></mrow>
            <mrow><mi>d</mi><mi>t</mi></mrow>
          </mfrac>
        </mtd>
        <mtd><mo>=</mo></mtd>
        <mtd>
          <mo>-</mo>
          <mfrac>
            <mrow><mi>μ</mi><mover accent="true"><mi>r</mi><mo>→</mo></mover></mrow>
            <msup><mi>r</mi><mn>3</mn></msup>
          </mfrac>
        </mtd>
      </mtr>
      <mtr>
        <mtd><mi>r</mi></mtd>
        <mtd><mo>=</mo></mtd>
        <mtd>
          <mrow><mo>|</mo><mover accent="true"><mi>r</mi><mo>→</mo></mover><mo>|</mo></mrow>
        </mtd>
      </mtr>
    </mtable>
    <annotation encoding="application/x-tex">\begin{aligned}\frac{d\vec{r}}{dt} &= \vec{v} \\ \frac{d\vec{v}}{dt} &= -\frac{\mu\vec{r}}{r^3} \\ r &= |\vec{r}|\end{aligned}</annotation>
  </semantics>
</math>
</div>

For a circular target orbit, the target specific energy and angular momentum are:

<div class="math-display" aria-label="Target specific energy and angular momentum">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <semantics>
    <mtable columnalign="right center left" columnspacing="0.35em" rowspacing="0.35em">
      <mtr>
        <mtd><msup><mi>E</mi><mo>*</mo></msup></mtd>
        <mtd><mo>=</mo></mtd>
        <mtd>
          <mo>-</mo>
          <mfrac>
            <mi>μ</mi>
            <mrow><mn>2</mn><msub><mi>r</mi><mn>2</mn></msub></mrow>
          </mfrac>
        </mtd>
      </mtr>
      <mtr>
        <mtd><msup><mi>L</mi><mo>*</mo></msup></mtd>
        <mtd><mo>=</mo></mtd>
        <mtd>
          <msqrt><mrow><mi>μ</mi><msub><mi>r</mi><mn>2</mn></msub></mrow></msqrt>
        </mtd>
      </mtr>
    </mtable>
    <annotation encoding="application/x-tex">\begin{aligned}E^* &= -\frac{\mu}{2r_2} \\ L^* &= \sqrt{\mu r_2}\end{aligned}</annotation>
  </semantics>
</math>
</div>

The RL environment did not need to know the absolute orbital angle. The observation vector used normalized radius, radial velocity, tangential velocity, angular-momentum error, energy error, and previous action. Removing angle makes the policy rotationally symmetric: the same local orbital state should produce the same control decision anywhere around the planet.

## Hohmann Benchmark

Before training PPO, the notebook computed the Hohmann transfer. For circular, coplanar orbits with two impulsive burns, the transfer semi-major axis is:

<div class="math-display" aria-label="Hohmann transfer semi-major axis">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <semantics>
    <mrow>
      <msub><mi>a</mi><mi>T</mi></msub>
      <mo>=</mo>
      <mfrac>
        <mrow><msub><mi>r</mi><mn>1</mn></msub><mo>+</mo><msub><mi>r</mi><mn>2</mn></msub></mrow>
        <mn>2</mn>
      </mfrac>
    </mrow>
    <annotation encoding="application/x-tex">a_T = \frac{r_1 + r_2}{2}</annotation>
  </semantics>
</math>
</div>

The two burns and transfer time are:

<div class="math-display" aria-label="Hohmann transfer burns and transfer time">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <semantics>
    <mtable columnalign="right center left" columnspacing="0.35em" rowspacing="0.42em">
      <mtr>
        <mtd><mrow><mi>Δ</mi><msub><mi>v</mi><mn>1</mn></msub></mrow></mtd>
        <mtd><mo>=</mo></mtd>
        <mtd>
          <msqrt>
            <mrow>
              <mi>μ</mi>
              <mo>(</mo>
              <mfrac><mn>2</mn><msub><mi>r</mi><mn>1</mn></msub></mfrac>
              <mo>-</mo>
              <mfrac><mn>1</mn><msub><mi>a</mi><mi>T</mi></msub></mfrac>
              <mo>)</mo>
            </mrow>
          </msqrt>
          <mo>-</mo>
          <msqrt><mfrac><mi>μ</mi><msub><mi>r</mi><mn>1</mn></msub></mfrac></msqrt>
        </mtd>
      </mtr>
      <mtr>
        <mtd><mrow><mi>Δ</mi><msub><mi>v</mi><mn>2</mn></msub></mrow></mtd>
        <mtd><mo>=</mo></mtd>
        <mtd>
          <msqrt><mfrac><mi>μ</mi><msub><mi>r</mi><mn>2</mn></msub></mfrac></msqrt>
          <mo>-</mo>
          <msqrt>
            <mrow>
              <mi>μ</mi>
              <mo>(</mo>
              <mfrac><mn>2</mn><msub><mi>r</mi><mn>2</mn></msub></mfrac>
              <mo>-</mo>
              <mfrac><mn>1</mn><msub><mi>a</mi><mi>T</mi></msub></mfrac>
              <mo>)</mo>
            </mrow>
          </msqrt>
        </mtd>
      </mtr>
      <mtr>
        <mtd><mi>T</mi></mtd>
        <mtd><mo>=</mo></mtd>
        <mtd>
          <mi>π</mi>
          <msqrt>
            <mfrac>
              <msubsup><mi>a</mi><mi>T</mi><mn>3</mn></msubsup>
              <mi>μ</mi>
            </mfrac>
          </msqrt>
        </mtd>
      </mtr>
    </mtable>
    <annotation encoding="application/x-tex">\begin{aligned}\Delta v_1 &= \sqrt{\mu\left(\frac{2}{r_1} - \frac{1}{a_T}\right)} - \sqrt{\frac{\mu}{r_1}} \\ \Delta v_2 &= \sqrt{\frac{\mu}{r_2}} - \sqrt{\mu\left(\frac{2}{r_2} - \frac{1}{a_T}\right)} \\ T &= \pi\sqrt{\frac{a_T^3}{\mu}}\end{aligned}</annotation>
  </semantics>
</math>
</div>

The policy comparison uses total Δv, circularization error, and burn history against this baseline.

<img src="{{ '/assets/images/rl-orbital-hohmann-trajectory.png' | relative_url }}" alt="Hohmann transfer trajectory: the transfer ellipse touching the inner start orbit and the outer target orbit" width="708" height="711" loading="lazy" decoding="async">

*The transfer ellipse touches the initial circular orbit at `r1` and the target orbit at `r2`.*

<img src="{{ '/assets/images/rl-orbital-hohmann-verification.png' | relative_url }}" alt="Verification plots for the simulated Hohmann transfer: radius versus time rising to the target, two thrust impulses showing the burn-coast-burn structure, and cumulative delta-v matching the ideal total" width="1411" height="911" loading="lazy" decoding="async">

*Radius history, the two impulses, and accumulated Δv for the simulated Hohmann transfer.*

The finite-timestep simulation does not land exactly on `r2`: the second burn fires on the first step at or after the computed transfer time. In the notebook's saved baseline, the final radius is 1.5999 against the theoretical 1.6000, with a timestep of 0.00050; total Δv agrees at the displayed precision of 0.2066. This residual precedes policy training and reflects the numerical implementation of the analytic plan.

{% include site/orbit-demo.html %}

## RL Formulation

The Gymnasium environment held the physics fixed and varied the control interface:

| Component | Implementation |
| --- | --- |
| **Observation** | Normalized `r`, `vr`, `vt`, target angular-momentum error, target energy error, previous action |
| **Discrete action** | `coast`, full prograde impulse, full retrograde impulse |
| **Continuous action** | throttle in `[-1, 1]`, mapped to a signed tangential Δv impulse |
| **Success criteria** | tolerances on <span class="math-inline"><math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo>&#x7c;</mo><mi>r</mi><mo>-</mo><msub><mi>r</mi><mn>2</mn></msub><mo>&#x7c;</mo></mrow></math></span>, <span class="math-inline"><math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo>&#x7c;</mo><msub><mi>v</mi><mi>r</mi></msub><mo>&#x7c;</mo></mrow></math></span>, and <span class="math-inline"><math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo>&#x7c;</mo><mi>L</mi><mo>-</mo><msup><mi>L</mi><mo>*</mo></msup><mo>&#x7c;</mo></mrow></math></span> |
| **Failure criteria** | crash/escape radius or episode timeout |

The dense reward used a combined energy/angular-momentum error:

<div class="math-display" aria-label="Energy and angular-momentum error">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <semantics>
    <mrow>
      <mi>err</mi>
      <mo>=</mo>
      <mfrac>
        <mrow><mo>|</mo><mi>E</mi><mo>-</mo><msup><mi>E</mi><mo>*</mo></msup><mo>|</mo></mrow>
        <mrow><mo>|</mo><msup><mi>E</mi><mo>*</mo></msup><mo>|</mo></mrow>
      </mfrac>
      <mo>+</mo>
      <mfrac>
        <mrow><mo>|</mo><mi>L</mi><mo>-</mo><msup><mi>L</mi><mo>*</mo></msup><mo>|</mo></mrow>
        <mrow><mo>|</mo><msup><mi>L</mi><mo>*</mo></msup><mo>|</mo></mrow>
      </mfrac>
    </mrow>
    <annotation encoding="application/x-tex">\mathrm{err} = \frac{|E - E^*|}{|E^*|} + \frac{|L - L^*|}{|L^*|}</annotation>
  </semantics>
</math>
</div>

with shaping approximately proportional to:

<div class="math-display" aria-label="Reward shaping term">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <semantics>
    <mrow>
      <msub><mi>err</mi><mtext>previous</mtext></msub>
      <mo>-</mo>
      <mi>γ</mi>
      <msub><mi>err</mi><mtext>current</mtext></msub>
    </mrow>
    <annotation encoding="application/x-tex">\mathrm{err}_{previous} - \gamma\,\mathrm{err}_{current}</annotation>
  </semantics>
</math>
</div>

Then the environment subtracted fuel and ignition/switching penalties, added a one-time success bonus on first entry into the tolerance region, and added a holding reward for staying there. PPO was trained with observation/reward normalization during training, frozen normalization statistics during evaluation, and deterministic policy rollout for diagnostics.

## Failure modes to inspect
{: #what-the-diagnostics-caught }

The notebook compared policies using trajectory, radius history, radial velocity, thrust impulses, cumulative Δv, number of burns or active-thrust steps, closest-to-target statistics, and the mission report against the Hohmann ideal.

When inspecting a run, check for these possible failure modes:

- **Discrete control:** small fixed impulses can reach the target with many prograde/retrograde corrections. The orbit may satisfy the tolerance band while wasting Δv.
- **Continuous control:** throttle control is more expressive, but it can learn micro-thrusting: almost continuous small corrections that keep the error low while hiding poor fuel efficiency.
- **Tolerance exploitation:** a policy that stops inside a loose tolerance band on an elliptical orbit has not met the same endpoint conditions as the Hohmann transfer. Its Δv is therefore not directly comparable to the ideal circular-to-circular transfer.
- **Final-state ambiguity:** final radius alone is misleading for eccentric orbits. Closest approach, radial-velocity history, angular momentum, and thrust history are needed to interpret what the policy actually learned.

## Experiment Loop

The final section exposes these parameters through `ModeConfig`:

- `dv_mag`: control authority per step
- `fuel_cost_penalty`: cost of using Δv
- `ignition_penalty`: cost of turning on or changing thrust
- `reward_shaping_scale`: strength of dense energy/angular-momentum shaping
- `training_timesteps`, `learning_rate`, and `ent_coef`: PPO optimization and exploration behavior

For each comparison, record the configuration, seed, training budget, and success tolerances, then:

```text
train a policy
inspect trajectory, thrust, and Δv
compare against Hohmann
explain the failure mode
change one parameter or design choice
rerun
```

The [saved notebook](https://github.com/jverbus/jverbus.github.io/blob/05561bf052e4e3639ec245c9cdbeee61e02fb585/assets/files/2026_01_09_James_Verbus_Brown_AI_Winter_School_RL_Orbital_Transfers.ipynb) includes discrete and continuous policy reports, but does not fix a training seed. Its final custom experiment also has a saved configuration printout that differs from the displayed setup. Those outputs illustrate the diagnostics; they do not supply a reproducible comparison of parameter choices.

## Materials

- <span id="workshop-recording" aria-hidden="true"></span>[Workshop Recording](https://www.youtube.com/watch?v=BdPzEhGc7Cw)
- <span id="slides" aria-hidden="true"></span>[Slides (PDF)]({{ '/assets/files/2026-01-09%20-%20James%20Verbus%20-%20Brown%20AI%20Winter%20School%20-%20Reinforcement%20Learning%20for%20Orbital%20Transfers.pdf' | relative_url }})
- <span id="code" aria-hidden="true"></span>[RL for Orbital Transfers Notebook]({{ '/assets/files/2026_01_09_James_Verbus_Brown_AI_Winter_School_RL_Orbital_Transfers.ipynb' | relative_url }})
- <span id="event-page" aria-hidden="true"></span>[2026 AI Winter School (Indico)](https://indico.physics.brown.edu/event/192/)
