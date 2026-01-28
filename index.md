---
layout: page
title: James Verbus
description: "Personal website of James Verbus - Senior Staff Software Engineer at LinkedIn working on AI for Trust. Writing about machine learning, anomaly detection, and AI safety."
---
{% include JB/setup %}

## Posts

<ul class="posts">
  {% for post in site.posts %}
    <li><span>{{ post.date | date_to_string }}</span> &raquo; <a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a></li>
  {% endfor %}
</ul>

