---
layout: page
title: Open Source
description: "Open source projects and related writing by James Verbus, including LinkedIn's isolation-forest library."
og_image: "/assets/images/social/2019-08-13-open-source-isolation-forest-spark-scala-1200x630.jpg"
og_image_alt: "Isolation forest open source project social preview image"
og_image_width: 1200
og_image_height: 630
last_modified_at: 2026-04-28
---

Highlights from my open source work, centered on `linkedin/isolation-forest`, the Spark/Scala implementation I built at LinkedIn and open sourced.

## isolation-forest

<div class="project-hero">
  <img class="project-logo" src="{{ '/assets/images/isolation_forest.svg' | relative_url }}" alt="Isolation forest project diagram" width="331" height="326" loading="lazy" decoding="async">
  <div class="project-hero-content">
    <p class="project-name">isolation-forest</p>
    <p class="project-metrics">
      <a href="https://github.com/linkedin/isolation-forest"><img src="https://img.shields.io/github/stars/linkedin/isolation-forest?style=flat-square&label=GitHub%20Stars" alt="GitHub stars for linkedin/isolation-forest"></a>
      <a href="https://github.com/linkedin/isolation-forest/network/members"><img src="https://img.shields.io/github/forks/linkedin/isolation-forest?style=flat-square&label=Forks" alt="GitHub forks for linkedin/isolation-forest"></a>
    </p>
  </div>
</div>

<div class="post-list" role="list">
  {% for item in site.data.open_source.core_items %}
    {% include site/card.html
      date=item.date
      title=item.title
      url=item.url
      description=item.description
    %}
  {% endfor %}
</div>

## Related Posts

<div class="post-list" role="list">
  {% for item in site.data.open_source.related_posts %}
    {% include site/card.html
      date=item.date
      title=item.title
      url=item.url
      description=item.description
    %}
  {% endfor %}
</div>

## External Writing

<div class="post-list" role="list">
  {% for item in site.data.open_source.external_writing %}
    {% include site/card.html
      date=item.date
      title=item.title
      url=item.url
      description=item.description
    %}
  {% endfor %}
</div>

## Videos

<div class="post-list" role="list">
  {% for item in site.data.open_source.video_links %}
    {% include site/card.html
      date=item.date
      title=item.title
      url=item.url
      description=item.description
    %}
  {% endfor %}
</div>
