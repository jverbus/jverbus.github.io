---
layout: page
title: Home
description: "Writing on AI/ML systems, agents, behavior modeling, and production systems in adversarial and uncertain environments."
og_image: "/assets/images/social/2025-08-07-berkeley-agentic-ai-summit-2025-1200x630.jpg"
og_image_alt: "Agentic AI Summit 2025 social preview image"
og_image_width: 1200
og_image_height: 630
last_modified_at: 2026-05-19
hide_title: true
---

<section class="home-hero">
  <p class="home-lede">Technical writing on AI/ML systems, agents, behavior modeling, and production systems in adversarial and uncertain environments.</p>
  <p class="home-lede">My background includes experimental physics and AI, including work on the LUX dark matter experiment and production systems for detecting fake accounts, hacked accounts, bots, automation, scraping, spam, and other abuse.</p>
</section>

<section class="home-section" aria-labelledby="latest-writing">
  <div class="section-heading">
    <p class="eyebrow">Latest</p>
    <h2 id="latest-writing">Writing</h2>
  </div>
  <div class="post-list" role="list">
    {% for post in site.posts limit:3 %}
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
  <p class="home-archive-link"><a href="{{ '/posts/' | relative_url }}">All writing</a></p>
</section>
