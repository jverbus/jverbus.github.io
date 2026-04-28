---
layout: page
title: Posts
permalink: /posts/
description: "Writing by James Verbus on machine learning, anomaly detection, AI safety, and trust & safety engineering."
og_image: "/assets/images/social/2025-08-07-berkeley-agentic-ai-summit-2025-1200x630.jpg"
og_image_alt: "Agentic AI Summit 2025 social preview image"
og_image_width: 1200
og_image_height: 630
last_modified_at: 2026-04-28
---

<p class="home-intro">Notes on machine learning, trust and safety, anomaly detection, and applied AI research.</p>

## Latest Writing

<div class="post-list" role="list">
  {% for post in site.posts limit:8 %}
    <article class="post-list-item" role="listitem">
      <p class="post-list-date">{{ post.date | date: "%b %-d, %Y" }}</p>
      <h3 class="post-list-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
      {% if post.description %}
      <p class="post-list-description">{{ post.description }}</p>
      {% endif %}
    </article>
  {% endfor %}
</div>

<p class="home-archive-link"><a href="{{ '/archive/' | relative_url }}">View all posts</a></p>
