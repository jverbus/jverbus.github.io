---
layout: page
title: Home
description: "AI systems for uncertain or adversarial environments, spanning abuse detection, behavior modeling, agents, anomaly detection, AI-generated media, and production-scale AI."
og_image: "/assets/images/social/2016-08-18-calibrating-the-lux-dark-matter-experiment-1200x630.jpg"
og_image_alt: "James Verbus with the LUX dark matter experiment"
og_image_width: 1200
og_image_height: 630
last_modified_at: 2026-06-10
hide_title: true
---

<section class="home-hero" id="about">
  <div class="home-hero-copy">
    <h1>James Verbus</h1>
    <p class="home-lede">I build AI systems for uncertain or adversarial environments.</p>
    <p class="home-lede">After nearly a decade at LinkedIn where I was most recently as a Senior Staff Machine Learning Engineer building systems for anti-abuse, trust, and platform integrity, I chose to step away to work closer to the AI frontier.</p>
    <p class="home-lede">My background began in rare-event physics: I earned my Ph.D. at Brown on LUX, one of the world's most sensitive dark matter detectors searching for faint signals deep underground.</p>
    <p class="home-lede">These days I'm focused on agentic AI systems. For collaborations, talks, or hard problems worth comparing notes on, <a href="mailto:james.verbus@gmail.com">get in touch</a>.</p>
  </div>
  <figure class="home-hero-photo">
    <img src="{{ '/assets/images/jverbus_lux_detector.jpg' | relative_url }}" srcset="{{ '/assets/images/jverbus_lux_detector-400.jpg' | relative_url }} 400w, {{ '/assets/images/jverbus_lux_detector.jpg' | relative_url }} 800w" sizes="(max-width: 760px) calc(100vw - 2rem), 400px" alt="James Verbus working on the LUX dark matter detector" width="800" height="800" loading="eager" decoding="async" fetchpriority="high">
    <figcaption>Working on detector hardware for the LUX, one of the world's most sensitive dark matter experiments.</figcaption>
  </figure>
  <div class="home-contact" id="contact" aria-label="Contact links">
    <ul class="contact-list">
      <li><a href="mailto:james.verbus@gmail.com">{% include site/icons/email.svg %} Email</a></li>
      <li><a href="https://github.com/jverbus">{% include site/icons/github.svg %} GitHub</a></li>
      <li><a href="https://x.com/JamesVerbus">{% include site/icons/x.svg %} X</a></li>
      <li><a href="https://scholar.google.com/citations?user=_ksEziAAAAAJ">{% include site/icons/google-scholar.svg %} Google Scholar</a></li>
    </ul>
  </div>
  <ul class="proof-strip" aria-label="Research highlights">
    <li><a href="https://scholar.google.com/citations?user=_ksEziAAAAAJ"><strong>30+</strong> papers</a></li>
    <li><a href="https://scholar.google.com/citations?user=_ksEziAAAAAJ"><strong>10k+</strong> citations <span class="proof-source">(Google Scholar)</span></a></li>
    <li><a href="{{ '/publications/#patents' | relative_url }}"><strong>3</strong> patents</a></li>
  </ul>
</section>

<section class="home-section" aria-labelledby="featured-work-heading">
  <div class="section-heading">
    <h2 id="featured-work-heading">Featured Work</h2>
  </div>
  <div class="post-list" role="list">
    {% include site/card.html
      card_clickable='on'
      date='Open Source'
      title='Extended Isolation Forest for Distributed Spark/Scala Anomaly Detection'
      url='/2026/03/18/announcing-extended-isolation-forest-support/'
      description='Extended Isolation Forest support for linkedin/isolation-forest, with random hyperplane splits, validation plots, benchmarks, reference parity checks, and edge-case tests.'
    %}
    {% include site/card.html
      card_clickable='on'
      date='Research'
      title='Finding AI-Generated Faces in the Wild'
      url='/2024/08/15/finding-ai-generated-faces-in-the-wild/'
      description='Research and engineering work on detecting AI-generated profile images in real-world settings, including CVPR workshop publication and LinkedIn Engineering write-up.'
    %}
    {% include site/card.html
      card_clickable='on'
      date='Workshop'
      title='Reinforcement Learning for Orbital Transfers'
      url='/2026/01/09/brown-physics-ai-winter-school-workshop/'
      description='A hands-on Brown AI Winter School workshop connecting orbital mechanics, reinforcement learning, PPO agents, and practical model diagnostics.'
    %}
  </div>
</section>

<section class="home-section" aria-labelledby="recent-writing-heading">
  <div class="section-heading">
    <h2 id="recent-writing-heading">Recent Writing</h2>
  </div>
  <div class="post-list" role="list">
    {% assign featured_urls = "/2026/03/18/announcing-extended-isolation-forest-support/|/2026/01/09/brown-physics-ai-winter-school-workshop/|/2024/08/15/finding-ai-generated-faces-in-the-wild/" | split: "|" %}
    {% assign shown = 0 %}
    {% for post in site.posts %}
      {% if featured_urls contains post.url %}{% continue %}{% endif %}
      {% if shown >= 3 %}{% break %}{% endif %}
      {% assign shown = shown | plus: 1 %}
      {% assign post_card_date = post.date | date: "%b %-d, %Y" %}
      {% include site/card.html
        card_clickable='on'
        date=post_card_date
        title=post.title
        url=post.url
        description=post.description
      %}
    {% endfor %}
  </div>
  <p class="home-archive-link"><a href="{{ '/posts/' | relative_url }}">View all writing</a></p>
</section>

<section class="home-section" aria-labelledby="projects-heading">
  <div class="section-heading">
    <h2 id="projects-heading">Projects</h2>
  </div>
  <p>Open-source and software work centered on <code>linkedin/isolation-forest</code>, a distributed Spark/Scala implementation for large-scale unsupervised anomaly detection.</p>
  <div class="post-list" role="list">
    {% for item in site.data.open_source.core_items %}
      {% include site/card.html
        date=item.date
        title=item.title
        url=item.url
        description=item.description
      %}
    {% endfor %}
  </div>
  <p class="home-archive-link"><a href="{{ '/open-source/' | relative_url }}">View projects</a></p>
</section>

<section class="home-section" aria-labelledby="research-heading">
  <div class="section-heading">
    <h2 id="research-heading">Research / Publications</h2>
  </div>
  <div class="post-list publication-list" role="list">
    {% assign selected_publications_section = site.data.publications.sections | first %}
    {% assign selected_publications = selected_publications_section.items %}
    {% for item in selected_publications limit:2 %}
      {% include site/card.html
        card_clickable='on'
        card_class='publication-list-item'
        date=item.date
        title=item.title
        url=item.url
        authors=item.authors
        venue=item.venue
        links=item.links
      %}
    {% endfor %}
    {% assign patents_section = site.data.publications.sections | where: "title", "Patents" | first %}
    {% assign patent_items = patents_section.items | where: "title", "Deep Learning to Detect Abusive Sequences of User Activity in Online Network" %}
    {% assign item = patent_items | first %}
    {% include site/card.html
      card_clickable='on'
      card_class='publication-list-item'
      date=item.date
      title=item.title
      url=item.url
      authors=item.authors
      meta=item.meta
      links=item.links
    %}
  </div>
  <p class="home-archive-link"><a href="{{ '/publications/' | relative_url }}">View publications</a></p>
</section>

<section class="home-section" aria-labelledby="talks-heading">
  <div class="section-heading">
    <h2 id="talks-heading">Talks / Videos</h2>
  </div>
  <div class="post-list" role="list">
    {% assign selected_talks_section = site.data.videos.sections | first %}
    {% assign selected_talks = selected_talks_section.items %}
    {% for item in selected_talks limit:2 %}
      {% include site/card.html
        card_class='video-list-item'
        image=item.image
        image_alt=item.image_alt
        image_class='video-list-thumb'
        content_class='video-list-content'
        date=item.date
        title=item.title
        url=item.url
        link_target='_blank'
        link_rel='noopener'
        summary=item.summary
        venue=item.venue
        venue_label='Venue/Host:'
      %}
    {% endfor %}
  </div>
  <p class="home-archive-link"><a href="{{ '/videos/' | relative_url }}">View videos</a></p>
</section>
