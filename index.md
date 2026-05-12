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
    <a class="button" href="{{ '/publications/' | relative_url }}">View publications</a>
    <a class="button" href="{{ '/about/' | relative_url }}">About</a>
  </div>
  <div class="home-proof-grid" role="list" aria-label="Selected work">
    <a class="proof-link" role="listitem" href="{{ '/open-source/' | relative_url }}">
      <span>Open Source</span>
      <strong>Built LinkedIn's Spark/Scala isolation-forest library.</strong>
    </a>
    <a class="proof-link" role="listitem" href="{{ '/publications/' | relative_url }}">
      <span>Research</span>
      <strong>Selected AI/ML and physics publications with 10k+ citations.</strong>
    </a>
    <a class="proof-link" role="listitem" href="{{ '/videos/' | relative_url }}">
      <span>Talks</span>
      <strong>Workshops and conference sessions on applied AI systems.</strong>
    </a>
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
</section>

<section class="home-section" aria-labelledby="explore-site">
  <div class="section-heading">
    <p class="eyebrow">Explore</p>
    <h2 id="explore-site">Technical work</h2>
  </div>

  <div class="feature-grid" role="list">
    <article class="feature-card" role="listitem">
      <h3><a href="{{ '/publications/' | relative_url }}">Publications</a></h3>
      <p>Peer-reviewed papers, patents, and technical writing across academia and industry.</p>
    </article>
    <article class="feature-card" role="listitem">
      <h3><a href="{{ '/open-source/' | relative_url }}">Open Source</a></h3>
      <p>Public code, libraries, and project work including large-scale anomaly detection tooling.</p>
    </article>
    <article class="feature-card" role="listitem">
      <h3><a href="{{ '/videos/' | relative_url }}">Videos</a></h3>
      <p>Talk recordings, workshops, and conference presentations on AI and applied systems.</p>
    </article>
  </div>
</section>
