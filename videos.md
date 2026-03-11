---
layout: page
title: Videos
description: "Video presentations, panels, and workshop recordings by James Verbus."
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
