---
layout: page
title: Publications
description: "Selected papers, patents, and the Ph.D. thesis of James Verbus."
og_image: "/assets/images/social/2024-08-15-finding-ai-generated-faces-in-the-wild-1200x630.jpg"
og_image_alt: "Finding AI-Generated Faces in the Wild social preview image"
og_image_width: 1200
og_image_height: 630
last_modified_at: 2026-09-06
---

Selected papers, patents, and my Ph.D. thesis. For the full record (>30 papers, >10k citations), see [Google Scholar](https://scholar.google.com/citations?user=_ksEziAAAAAJ&sortby=pubdate).

{% for section in site.data.publications.sections %}
## {{ section.title }}

<div class="post-list publication-list" role="list">
  {% for item in section.items %}
    {% include site/card.html
      card_clickable='on'
      card_class='publication-list-item'
      date=item.date
      title=item.title
      url=item.url
      description=item.description
      summary=item.summary
      authors=item.authors
      venue=item.venue
      meta=item.meta
      links=item.links
    %}
  {% endfor %}
</div>
{% endfor %}
