---
layout: post
title: "From Demos to Deployment: Insights from Berkeley’s Agentic AI Summit 2025"
description: "Agentic AI is graduating from cool demos to real‑world deployment. Hardware gains, open standards, rigorous evals, and secure governance are paving the way for billions of reliable, low‑cost digital assistants."
category: AI and Machine Learning
tags: [Generative AI, UC Berkeley, AI, Agents]
---
{% include JB/setup %}

> **Author’s Note:** This is a repost of my original post [here](https://www.linkedin.com/pulse/from-demos-deployment-insights-berkeleys-agentic-ai-summit-verbus-k1aie/?trackingId=lZ36KGNFSCu5V6BVTVbr2w%3D%3D).
> The summit website with the full agenda and sessions are available [here](https://rdi.berkeley.edu/events/agentic-ai-summit).

On Saturday (August 2nd, 2025) I attended UC Berkeley’s Agentic AI Summit, where researchers, founders, and operators mapped the road ahead for agentic systems. Below are my key takeaways (using AI to help distill them) from every main‑stage talk and panel. (Views are my own, not those of the summit, the speakers, or my employer.)

TL;DR: Agentic AI is moving beyond demos toward the infrastructure, standards, and reliability required for production. Continued gains in hardware efficiency, open connectors, built-in evaluation, and secure governance will enable billions of low‑cost, task‑oriented agents. In one early deployment, a case study shows that a green‑field function can achieve a 10x productivity boost, foreshadowing orgs built around supervising fleets of digital co‑workers rather than executing every step themselves.

## Opening

- **Dawn Song – Opening Remarks:** Agentic AI is emerging as the next computing paradigm; Berkeley RDI is rallying a global community to accelerate research, education, and startup formation across the full agent stack.

## Session 1: Building Infrastructure for Agents

- **Bill Dally – “Hardware for AI Agents”:** Over 10 years, training FLOPs jumped 10 million‑fold and single‑GPU inference throughput increased 1,000x, yet only 3x came from process improvements, compared to ~32x from low‑precision formats, ~12.5x from complex instructions, and ~2x from sparsity.
- **Ramine Roane – “Architecting the Future of Agentic AI at Scale”:** Billions of agents will span cloud, edge, and personal devices, demanding an open, heterogeneous compute fabric that balances throughput, latency, and power.
- **Chuan Li – “Building AI Infrastructure as If Agents Were Human”:** Treat agents like digital workers: provide dependable compute, fast data access, clear evaluation loops and an economic model so they can collaborate efficiently at scale.
- **Jared Quincy Davis – “Ember: The Inference‑Time Scaling Architectures Framework”:** Ember turns ensembles and routing of multiple LLMs into an optimization problem, letting developers build cost‑efficient “networks of models” with minimal code.
- **Panel – “Building Infrastructure for Agents”:** Open, programmable hardware‑software stacks are required for billions of low‑latency agents; custom accelerators may assist, but software portability is important.

## Session 2: Frameworks & Stacks for Agentic Systems

- **Ion Stoica – Keynote:** Reliability is the gating factor for production agents; explicit specs, continuous tests, and rich observability must follow every prototype.
- **Matei Zaharia – “Reflective Optimization with GEPA & DSPy”:** Self‑reflective prompt optimization delivers large capability gains, up to ~80 % of the gap compared to fine tuning on some tasks.
- **Sherwin Wu – “The Year of Agents™”:** Model quality is “good enough” for many use cases; scaling now depends on standardized tool connectors, simpler authoring workflows, and token‑cost reductions.
- **Chi Wang – “Visionary Stacks for Agentic Systems”:** The next leap combines multimodal interfaces, code‑writing abilities, and modular multi‑agent orchestration so assistants can learn continuously and act across devices.
- **Jerry Liu – “Context Engineering and MCP for Document Workflows”:** Precise context and tool injection are vital; the Model‑Context‑Protocol (MCP) makes any data store or API hot‑pluggable at run time.
- **Matt White – “No Agents Without Standards”:** Open standards, including for security and observability, must mature together or enterprise adoption will stall; the Linux Foundation aims to be the neutral steward.
- **Brad Axen – “Goose: An Open‑Source, Local AI Agent”:** Goose keeps data on device yet taps frontier models via swappable MCP plugins, balancing privacy with capability.
- **Panel – “Frameworks & Stacks for Agentic Systems”:** Future stacks need open connectors, automated prompt/workflow tuning, built-in tracing, and long‑horizon memory to graduate agents from demos to dependable tools.

## Session 3: Foundations of Agents

- **Dawn Song – “Towards Building Safe and Secure Agentic AI”:** Security and safety evaluation must precede deployment; defense‑in‑depth, least privilege, and open red‑team platforms are top research priorities.
- **Ed Chi – “Google Gemini Era: Bringing AI to Universal Assistant and the Real World”:** A single multimodal agent that fuses pattern recognition with tool‑based reasoning is within reach but requires robust workflows, personalization, and search‑grade retrieval.
- **Jakub Pachocki – “Automating Discovery”:** Frontier models match experts on structured tasks yet still lack the creative “last insight”; enabling genuine discovery is OpenAI’s next frontier.
- **Sergey Levine – “Multi-Turn Reinforcement Learning for LLM Agents”:** Offline RL on human dialogs, paired with the LLM’s latent world model, enables goal‑conditioned planning without simulators.
- **Panel – "Foundations of Agents":** Speakers emphasized rigorous guardrails and evaluation pipelines and noted a trend where medium‑size models inherit frontier capabilities within a few generations—hinting at powerful on‑device agents soon.

## Session 4: Next‑Generation Enterprise Agents

- **Burak Gokturk – “AI Trends and the Moment for Agentic Systems”:** Enterprises need flexible platforms that mix models with retrieval and tool calling because model rankings shift too quickly for single‑model bets.
- **Arvind Jain – “Transforming to an AI‑Native Enterprise”:** AI transformation starts by up‑skilling employees and then re‑architecting processes on a secure, horizontal platform that enforces consistent governance.
- **May Habib – “From Execution to Supervision: Scaling Productivity with Agents”:** An early agent case study showed one team operating at ~10% of prior head count in a green‑field area, suggesting 10x productivity when agents own the work loop and humans supervise via sandboxing, traceability, and delegated authority—foreshadowing AI‑native firms where agents may even hire people.
- **Richard Socher – “Search APIs for Accurate Answers and Agents”:** The search layer now caps agent quality; real‑time, citation‑rich APIs let smaller agents outperform larger rivals on some benchmarks.
- **Panel – "Next‑Generation Enterprise Agents":** Reliability, deep evaluation, and disciplined data/tool handling will decide which enterprise agents graduate from pilots to mission‑critical systems.

## Session 5: Agents Transforming Industries

- **Michele Catasta – “The Breakout Year of Coding Agents”:** Bigger RL‑tuned models plus minimal scaffolding pushed coding agents from seconds to ~30 minutes of autonomous work (doubling every seven months); smarter context handling is the next bottleneck.
- **Karthik Narasimhan – “Reliable AI Agents for Tomorrow’s World”:** Predictability and alignment matter more than raw capability; agents must self‑monitor and cross‑check to earn user trust.
- **Adarsh Hiremath – “Future of Work in an AI Economy”:** Expert feedback and rigorous evaluation—not extra GPUs—will fuel the next wave; platforms that match domain specialists to training loops are emerging.
- **Snehal Antani – “Building Scalable AI Companies”:** Their “AI hacker” converts recon data into a cyber‑terrain graph and routes each reasoning query to the lowest‑cost model that meets latency and accuracy SLAs, showing scalability depends on precision prompting, dynamic model routing, and domain‑realistic benchmarks—not ever‑larger monoliths.
- **Panel – "Agents Transforming Industries":** Across coding, talent pipelines, and operations, workflow‑level metrics and human‑in‑the‑loop guardrails remain mandatory until agents prove repeatable reliability.
- **Vinod Khosla – Fireside Chat:** Vinod argues that resource‑light, high‑risk exploration can out‑innovate big labs, warns that guilds and politics—not algorithms—will set adoption speed, and urges entrepreneurs to chase improbable ideas as AI approaches 80% of tasks in 80% of jobs.
