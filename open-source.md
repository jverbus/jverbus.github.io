---
layout: page
title: Projects
description: "Projects by James Verbus supporting AI systems, measurement, and reliability under uncertainty, including LinkedIn's open-source isolation-forest library."
last_modified_at: 2026-06-12
---

Projects I build and maintain. Select a project for details, major updates, and related writing and talks.

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
