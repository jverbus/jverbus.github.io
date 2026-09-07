---
layout: page
title: Home
description: "James Verbus: AI and physics. Work on machine learning, anomaly detection, and the LUX dark matter experiment."
last_modified_at: 2026-09-07
hide_title: true
---

<section class="profile" id="about" aria-labelledby="profile-name">
  <div class="profile-copy">
    <h1 id="profile-name">James Verbus</h1>
    <p class="profile-field">AI and physics</p>
    <div class="profile-bio" id="throughline-heading">
      <p>At LinkedIn, most recently as a Senior Staff Machine Learning Engineer, I built detection systems for Trust and created the open-source <a href="{{ '/open-source/isolation-forest/' | relative_url }}">Spark/Scala isolation-forest library</a>.</p>
      <p>Before that, I earned my Ph.D. in physics at Brown, working on calibration of the <a href="{{ '/2016/08/18/calibrating-the-lux-dark-matter-experiment/' | relative_url }}">LUX dark matter detector</a>.</p>
    </div>
    <nav class="profile-links" id="contact" aria-label="Contact and profiles">
      <ul id="conversations-heading">
        <li><a href="mailto:james.verbus@gmail.com">Email</a></li>
        <li><a href="https://scholar.google.com/citations?user=_ksEziAAAAAJ">Google Scholar</a></li>
        <li><a href="https://github.com/jverbus">GitHub</a></li>
        <li><a href="https://www.linkedin.com/in/jamesverbus/">LinkedIn</a></li>
        <li><a href="https://orcid.org/0000-0002-5812-022X">ORCID</a></li>
        <li><a href="https://x.com/JamesVerbus">X</a></li>
      </ul>
    </nav>
  </div>
  <figure class="profile-photo">
    <img src="{{ '/assets/images/jverbus_lux_detector.jpg' | relative_url }}" srcset="{{ '/assets/images/jverbus_lux_detector-400.jpg' | relative_url }} 400w, {{ '/assets/images/jverbus_lux_detector.jpg' | relative_url }} 800w" sizes="(max-width: 760px) 160px, 232px" alt="James Verbus working on the LUX dark matter detector" width="800" height="800" loading="eager" decoding="async" fetchpriority="high">
    <figcaption>LUX dark matter detector, Sanford Underground Research Facility.</figcaption>
  </figure>
</section>

<section class="selected-work" id="start-here" aria-labelledby="start-here-heading">
  <h2 id="start-here-heading">Selected work</h2>
  <ul class="work-list">
    {% for work in site.data.home.selected_work %}
    <li{% if work.anchor %} id="{{ work.anchor }}"{% endif %}>
      <p class="work-meta">{{ work.area }}{% if work.year %}<span>{{ work.year }}</span>{% endif %}</p>
      <div class="work-copy">
        <h3><a href="{{ work.url | relative_url }}">{{ work.title }}</a></h3>
        <p>{{ work.description }}</p>
      </div>
    </li>
    {% endfor %}
  </ul>
</section>
