---
layout: page
title: Projects
description: "Projects by James Verbus, including LinkedIn's open-source isolation-forest library for distributed Spark/Scala anomaly detection."
og_image: "/assets/images/social/2026-03-18-announcing-extended-isolation-forest-support-1200x630.jpg"
og_image_alt: "Extended Isolation Forest support for the open-source isolation-forest library"
og_image_width: 1200
og_image_height: 630
last_modified_at: 2026-06-11
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
