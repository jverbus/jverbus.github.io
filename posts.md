---
layout: page
title: Writing
permalink: /posts/
description: "Writing by James Verbus on AI systems, measurement, and reliability under uncertainty: agents, evaluation, anomaly detection, and adversarial ML."
last_modified_at: 2026-06-12
---

<p class="home-intro">Notes on AI systems, measurement, and reliability under uncertainty: agents, evaluation, anomaly detection, and adversarial ML.</p>

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
