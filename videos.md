---
layout: page
title: Videos
description: "Video presentations, panels, and workshop recordings by James Verbus."
og_image: "/assets/images/social/2026-01-09-brown-physics-ai-winter-school-workshop-1200x630.jpg"
og_image_alt: "Brown AI Winter School reinforcement learning workshop social preview image"
og_image_width: 1200
og_image_height: 630
last_modified_at: 2026-04-28
---

Talks, panels, and workshop recordings. Newest first.

{% for section in site.data.videos.sections %}
## {{ section.title }}

<div class="post-list" role="list">
  {% for item in section.items %}
    {% include site/card.html
      card_class=section.card_class
      image=item.image
      image_alt=item.image_alt
      image_width=item.image_width
      image_height=item.image_height
      image_class=section.image_class
      content_class=section.content_class
      date=item.date
      title=item.title
      url=item.url
      link_target=section.link_target
      link_rel=section.link_rel
      description=item.description
    %}
  {% endfor %}
</div>
{% endfor %}
