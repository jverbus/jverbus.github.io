---
layout: post
title: "Reinforcement Learning for Orbital Transfers at the 2026 AI Winter School (Brown University)"
date: 2026-01-09
last_modified_at: 2026-09-19
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

I used a two-body transfer with a known analytic solution so we could compare learned policies with the Hohmann baseline. The [notebook](#code) contains the environment, training procedure, and example outputs.

## Control Problem

The notebook used nondimensional two-body dynamics: unit gravitational parameter, an initial circular orbit at radius 1, and a target circular orbit at radius 1.6. I call those radii <span class="math-inline"><math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>r</mi><mn>1</mn></msub></math></span> and <span class="math-inline"><math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>r</mi><mn>2</mn></msub></math></span> below. The model omitted drag, finite-duration thrust, J2 perturbations, third bodies, attitude dynamics, and mass depletion. Control was a tangential impulse applied once per simulation step.

Between impulses, the spacecraft position and velocity evolve under central gravity:

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

The observation vector contains normalized radius, radial velocity, tangential velocity, angular-momentum error, energy error, and the previous action. It omits the absolute orbital angle, so rotating an otherwise identical state does not change the policy input.

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

The comparisons use total Δv, circularization error, and burn history.

<img src="{{ '/assets/images/rl-orbital-hohmann-trajectory.png' | relative_url }}" alt="Hohmann transfer trajectory: the transfer ellipse touching the inner start orbit and the outer target orbit" width="708" height="711" loading="lazy" decoding="async">

*The transfer ellipse touches the initial circular orbit at `r1` and the target orbit at `r2`.*

<img src="{{ '/assets/images/rl-orbital-hohmann-verification.png' | relative_url }}" alt="Verification plots for the simulated Hohmann transfer: radius versus time rising to the target, two thrust impulses showing the burn-coast-burn structure, and cumulative delta-v matching the ideal total" width="1411" height="911" loading="lazy" decoding="async">

*Radius history, the two impulses, and accumulated Δv for the simulated Hohmann transfer.*

The second Hohmann burn is applied on the first simulation step at or after the analytic transfer time. With a timestep of 0.00050, the saved baseline ends at radius 1.5999 rather than 1.6000, and total Δv agrees with the analytic value to the displayed precision of 0.2066.

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

The reward also included fuel and ignition/switching penalties, a one-time bonus on first entry into the success region, and a reward for remaining there. PPO training used observation and reward normalization. Evaluation used frozen normalization statistics and deterministic policy actions.

## Failure modes to inspect
{: #what-the-diagnostics-caught }

For each policy, the notebook plots the trajectory, radius, radial velocity, thrust impulses, and cumulative Δv. Its mission report includes the burn count or active-thrust steps and closest-to-target statistics for comparison with the Hohmann transfer.

These diagnostics can reveal several failure modes:

- **Repeated corrections:** A discrete policy may reach the target through many small prograde and retrograde impulses, satisfying the orbit tolerances while using excessive Δv.
- **Continuous small impulses:** A continuous policy may keep orbital errors small by applying throttle almost continuously. The accumulated Δv reveals the cost of these corrections.
- **Loose success tolerances:** A policy can enter the success region while remaining on an elliptical orbit. Compare its Δv with the Hohmann transfer only after checking the final-orbit conditions.
- **Radius alone:** An eccentric orbit can cross the target radius without circularizing. Radial velocity, angular momentum, closest approach, and thrust history help distinguish these trajectories.

## Changing the training configuration
{: #experiment-loop }

The final section configures the following parameters through `ModeConfig`:

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

**Notebook note:** The [final custom experiment](https://github.com/jverbus/jverbus.github.io/blob/05561bf052e4e3639ec245c9cdbeee61e02fb585/assets/files/2026_01_09_James_Verbus_Brown_AI_Winter_School_RL_Orbital_Transfers.ipynb) has a saved configuration printout that differs from the settings in its setup cell. Rerun the experiment to regenerate consistent output, and set a training seed before comparing parameter choices. The saved discrete and continuous policy reports remain available as examples.

## Materials

- <span id="workshop-recording" aria-hidden="true"></span>[Workshop Recording](https://www.youtube.com/watch?v=BdPzEhGc7Cw)
- <span id="slides" aria-hidden="true"></span>[Slides (PDF)]({{ '/assets/files/2026-01-09%20-%20James%20Verbus%20-%20Brown%20AI%20Winter%20School%20-%20Reinforcement%20Learning%20for%20Orbital%20Transfers.pdf' | relative_url }})
- <span id="code" aria-hidden="true"></span>[RL for Orbital Transfers Notebook]({{ '/assets/files/2026_01_09_James_Verbus_Brown_AI_Winter_School_RL_Orbital_Transfers.ipynb' | relative_url }})
- <span id="event-page" aria-hidden="true"></span>[2026 AI Winter School (Indico)](https://indico.physics.brown.edu/event/192/)
