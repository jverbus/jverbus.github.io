---
layout: page
title: Publications
description: "Publications by James Verbus including AI/ML research papers on deepfake detection, anomaly detection, and physics research on dark matter experiments."
og_image: "/assets/images/social/2024-08-15-finding-ai-generated-faces-in-the-wild-1200x630.jpg"
og_image_alt: "Finding AI-Generated Faces in the Wild social preview image"
og_image_width: 1200
og_image_height: 630
last_modified_at: 2026-04-28
---

For a complete publication list (>30 papers, >10k citations), see [Google Scholar](https://scholar.google.com/citations?user=_ksEziAAAAAJ&sortby=pubdate). Selected publications below.

{% for section in site.data.publications.sections %}
## {{ section.title }}

<div class="post-list" role="list">
  {% for item in section.items %}
    {% include site/card.html
      card_clickable='on'
      date=item.date
      title=item.title
      url=item.url
      description=item.description
    %}
  {% endfor %}
</div>
{% endfor %}
