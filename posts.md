---
layout: page
title: Writing
permalink: /posts/
description: "Writing by James Verbus on bot and automation detection, anomaly detection, sequence modeling, synthetic media, AI productivity, and physics."
last_modified_at: 2026-06-23
---

<p class="home-intro">Field notes, case studies, and workshop writeups on detection systems, anomaly detection, sequence modeling, synthetic media, AI productivity, and physics.</p>

{% assign posts_by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
{% for year_group in posts_by_year %}
<h2 class="post-year-heading" id="writing-{{ year_group.name }}">{{ year_group.name }}</h2>
<div class="post-list" role="list" aria-labelledby="writing-{{ year_group.name }}">
  {% for post in year_group.items %}
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
{% endfor %}
