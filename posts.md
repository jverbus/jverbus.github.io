---
layout: page
title: Writing
permalink: /posts/
description: "Writing by James Verbus on AI/ML systems, agents, behavior modeling, evaluation, anomaly detection, and production systems."
og_image: "/assets/images/social/2025-08-07-berkeley-agentic-ai-summit-2025-1200x630.jpg"
og_image_alt: "Agentic AI Summit 2025 social preview image"
og_image_width: 1200
og_image_height: 630
last_modified_at: 2026-06-10
---

<p class="home-intro">Notes on AI/ML systems, agents, behavior modeling, evaluation, anomaly detection, and production systems.</p>

<div class="post-list" role="list">
  {% for post in site.posts %}
    {% assign post_card_date = post.date | date: "%b %-d, %Y" %}
    {% include site/card.html
      card_clickable='on'
      date=post_card_date
      title=post.title
      url=post.url
      description=post.description
    %}
  {% endfor %}
</div>
