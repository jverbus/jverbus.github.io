---
layout: post
title: "Reinforcement Learning for Orbital Transfers at the 2026 AI Winter School (Brown University)"
description: ""
category: AI and Machine Learning
tags: [Reinforcement Learning, PPO, Brown University, AI, physics, orbital mechanics, astrodynamics]
---
{% include JB/setup %}

I recently gave a 2.5-hour, hands-on workshop on using reinforcement learning (RL) to solve a simplified orbital transfer problem at the 2026 AI Winter School, hosted by the Center for the Fundamental Physics of the Universe at Brown University.

We used the classic **Hohmann transfer** as an analytic baseline, then built a small **2D, two-body** simulator and trained **PPO** agents (both discrete and continuous thrust control) to learn transfer policies in simulation. Along the way, we focused on practical workflow: **environment design**, **reward shaping**, debugging training runs, and interpreting failure modes.

## Workshop Recording

- [Workshop Recording](https://www.youtube.com/watch?v=BdPzEhGc7Cw)

## Slides

- [Slides (PDF)]({{ site.url }}/assets/files/2026-01-09%20-%20James%20Verbus%20-%20Brown%20AI%20Winter%20School%20-%20Reinforcement%20Learning%20for%20Orbital%20Transfers.pdf)

## Code (Jupyter Notebook)

- [RL for Orbital Transfers Notebook]({{ site.url }}/assets/files/2026_01_09_James_Verbus_Brown_AI_Winter_School_RL_Orbital_Transfers.ipynb)

## Event Page

For the full schedule and recordings across all modules:

- [2026 AI Winter School (Indico)](https://indico.physics.brown.edu/event/192/)