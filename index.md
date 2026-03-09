---
layout: page
title: Home
description: "Home page for James Verbus: Senior Staff Software Engineer at LinkedIn, writing about AI for Trust, machine learning, and anomaly detection."
---
{% include JB/setup %}

<p class="home-intro">Senior Staff Software Engineer at LinkedIn working on AI for Trust, anomaly detection, and applied machine learning.</p>

## Explore

<div class="post-list" role="list">
  <article class="post-list-item" role="listitem">
    <h3 class="post-list-title"><a href="/posts/">Posts</a></h3>
    <p class="post-list-description">Long-form writing on machine learning, trust and safety, anomaly detection, and applied AI systems.</p>
  </article>
  <article class="post-list-item" role="listitem">
    <h3 class="post-list-title"><a href="/publications/">Publications</a></h3>
    <p class="post-list-description">Peer-reviewed papers, patents, and technical writing across academia and industry.</p>
  </article>
  <article class="post-list-item" role="listitem">
    <h3 class="post-list-title"><a href="/open-source/">Open Source</a></h3>
    <p class="post-list-description">Public code, libraries, and project work including anomaly detection tooling.</p>
  </article>
  <article class="post-list-item" role="listitem">
    <h3 class="post-list-title"><a href="/videos/">Videos</a></h3>
    <p class="post-list-description">Talk recordings, workshops, and conference presentations.</p>
  </article>
  <article class="post-list-item" role="listitem">
    <h3 class="post-list-title"><a href="/about/">About</a></h3>
    <p class="post-list-description">Background, current work, and ways to connect.</p>
  </article>
</div>

## Latest Posts

<div class="post-list" role="list">
  {% for post in site.posts limit:5 %}
    <article class="post-list-item" role="listitem">
      <p class="post-list-date">{{ post.date | date: "%b %-d, %Y" }}</p>
      <h3 class="post-list-title"><a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a></h3>
      {% if post.description %}
      <p class="post-list-description">{{ post.description }}</p>
      {% endif %}
    </article>
  {% endfor %}
</div>

<p class="home-archive-link"><a href="/posts/">Browse all posts</a></p>
