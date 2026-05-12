---
layout: page
title: Home
description: "Writing and projects on AI, machine learning, and Trust."
og_image: "/assets/images/social/2025-08-07-berkeley-agentic-ai-summit-2025-1200x630.jpg"
og_image_alt: "Agentic AI Summit 2025 social preview image"
og_image_width: 1200
og_image_height: 630
last_modified_at: 2026-04-28
hide_title: true
---

<section class="home-hero" aria-labelledby="home-title">
  <p class="eyebrow">James Verbus</p>
  <h1 id="home-title">AI/ML engineering for trust, safety, and applied research.</h1>
  <p class="home-lede">Senior Staff Software Engineer at LinkedIn working on large-scale AI systems for platform integrity, developer productivity, anomaly detection, and applied machine learning.</p>
  <div class="home-actions" role="group" aria-label="Primary links">
    <a class="button button-primary" href="{{ '/posts/' | relative_url }}">Read writing</a>
    <a class="button" href="{{ '/about/' | relative_url }}">About</a>
  </div>
</section>

<section class="home-section" aria-labelledby="latest-writing">
  <div class="section-heading">
    <p class="eyebrow">Latest</p>
    <h2 id="latest-writing">Writing</h2>
  </div>
  <div class="post-list editorial-list" role="list">
    {% for post in site.posts limit:3 %}
      <article class="post-list-item" role="listitem">
        <p class="post-list-date">{{ post.date | date: "%b %-d, %Y" }}</p>
        <h3 class="post-list-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        {% if post.description %}
        <p class="post-list-description">{{ post.description }}</p>
        {% endif %}
      </article>
    {% endfor %}
  </div>
  <p class="home-archive-link"><a href="{{ '/posts/' | relative_url }}">All writing</a></p>
  <p class="home-secondary-links">
    <span>Explore more:</span>
    <a href="{{ '/publications/' | relative_url }}">Publications</a>
    <a href="{{ '/open-source/' | relative_url }}">Open Source</a>
    <a href="{{ '/videos/' | relative_url }}">Videos</a>
  </p>
</section>
