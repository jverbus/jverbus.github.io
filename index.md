---
layout: page
title: Posts
description: "Personal website of James Verbus - Senior Staff Software Engineer at LinkedIn working on AI for Trust. Writing about machine learning, anomaly detection, and AI safety."
---
{% include JB/setup %}

## Start Here

<p class="home-intro">If you’re new here, these are the best entry points.</p>

<div class="start-here-grid" role="list">
  <article class="start-here-card" role="listitem">
    <p class="start-here-kicker">Best post</p>
    <h3 class="start-here-title"><a href="/2024/08/15/finding-ai-generated-faces-in-the-wild/">Finding AI-Generated Faces in the Wild</a></h3>
    <p class="start-here-description">A practical look at deepfake profile detection, what worked, and what still fails in production settings.</p>
  </article>
  <article class="start-here-card" role="listitem">
    <p class="start-here-kicker">Best talk</p>
    <h3 class="start-here-title"><a href="/videos/">Talks & Workshops</a></h3>
    <p class="start-here-description">Curated talks on trust & safety, anomaly detection, and applied AI from recent conferences and workshops.</p>
  </article>
  <article class="start-here-card" role="listitem">
    <p class="start-here-kicker">Best repo</p>
    <h3 class="start-here-title"><a href="/open-source/">LinkedIn Isolation Forest</a></h3>
    <p class="start-here-description">Open-source Spark/Scala anomaly detection at scale, including ONNX support and production notes.</p>
  </article>
</div>

## Latest Writing

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
