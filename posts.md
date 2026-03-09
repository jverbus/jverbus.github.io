---
layout: page
title: Posts
permalink: /posts/
description: "Writing by James Verbus on machine learning, anomaly detection, AI safety, and trust & safety engineering."
---
{% include JB/setup %}

## Latest Writing

<p class="home-intro">Notes on machine learning, trust and safety, anomaly detection, and applied AI research.</p>

<div class="post-list" role="list">
  {% for post in site.posts limit:8 %}
    <article class="post-list-item" role="listitem">
      <p class="post-list-date">{{ post.date | date: "%b %-d, %Y" }}</p>
      <h3 class="post-list-title"><a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a></h3>
      {% if post.description %}
      <p class="post-list-description">{{ post.description }}</p>
      {% endif %}
    </article>
  {% endfor %}
</div>

<p class="home-archive-link"><a href="/archive/">View all posts</a></p>
