---
layout: page
title: Publications
description: "Publications by James Verbus including AI/ML research papers on deepfake detection, anomaly detection, and physics research on dark matter experiments."
---

For a complete publication list (>30 papers, >10k citations), see [Google Scholar](https://scholar.google.com/citations?user=_ksEziAAAAAJ&sortby=pubdate). Selected publications below.

{% for section in site.data.publications.sections %}
## {{ section.title }}

<div class="post-list" role="list">
  {% for item in section.items %}
    {% include site/card.html
      date=item.date
      title=item.title
      url=item.url
      description=item.description
    %}
  {% endfor %}
</div>
{% endfor %}
