---
layout: page
title: Projects
description: "Open-source projects by James Verbus, including LinkedIn's distributed Spark/Scala isolation-forest library for anomaly detection."
last_modified_at: 2026-06-23
---

Open-source projects and supporting artifacts. Start with the distributed Spark/Scala isolation-forest library I built at LinkedIn for large-scale anomaly detection.

<div class="post-list" role="list">
  {% for item in site.data.projects.items %}
    {% include site/card.html
      card_clickable='on'
      card_class='project-list-item'
      image=item.image
      image_alt=item.image_alt
      image_class='project-list-thumb'
      content_class='project-list-content'
      image_width=item.image_width
      image_height=item.image_height
      date=item.label
      title=item.title
      url=item.url
      description=item.description
    %}
  {% endfor %}
</div>
