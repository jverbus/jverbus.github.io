---
layout: page
title: Home
description: "AI systems for uncertain or adversarial environments, spanning abuse detection, behavior modeling, agents, anomaly detection, AI-generated media, and production-scale AI."
og_image: "/assets/images/social/2016-08-18-calibrating-the-lux-dark-matter-experiment-1200x630.jpg"
og_image_alt: "James Verbus with the LUX dark matter experiment"
og_image_width: 1200
og_image_height: 630
last_modified_at: 2026-06-09
hide_title: true
---

<section class="home-hero" id="about">
  <div class="home-hero-copy">
    <p class="eyebrow">AI systems under uncertainty</p>
    <h1>James Verbus</h1>
    <p class="home-lede">I build AI systems for uncertain or adversarial environments. My work spans abuse detection, behavior modeling, agents, anomaly detection, AI-generated media, and production-scale AI systems.</p>
    <p class="home-lede">Previously, I spent nearly a decade at LinkedIn building large-scale systems for anti-abuse, trust, and platform integrity.</p>
    <p class="home-lede">Before that, I earned my Ph.D. in Physics at Brown University on LUX, one of the world's most sensitive dark matter detectors. LUX searched for ultra-rare dark-matter interactions 4,850 feet underground, where a central challenge was separating faint candidate signals from background noise.</p>
    <p class="home-lede">That path still shapes my work: building AI systems that operate under uncertainty, reason from incomplete or noisy evidence, and remain robust in adversarial environments under strict performance constraints.</p>
    <p class="home-lede">My work includes open-source ML software, patents, publications, talks, and collaborations across academia and industry.</p>
  </div>
  <figure class="home-hero-photo">
    <img src="{{ '/assets/images/jverbus_lux_detector.jpg' | relative_url }}" alt="James Verbus working on the LUX dark matter detector" width="800" height="800" loading="eager" decoding="async">
    <figcaption>Working on detector hardware for the LUX, one of the world's most sensitive dark matter experiments.</figcaption>
  </figure>
  <div class="home-contact" id="contact" aria-label="Contact links">
    <ul class="contact-list">
      <li><a href="mailto:james.verbus@gmail.com">Email</a></li>
      <li><a href="https://github.com/jverbus">GitHub</a></li>
      <li><a href="https://x.com/JamesVerbus">X</a></li>
      <li><a href="https://scholar.google.com/citations?user=_ksEziAAAAAJ">Google Scholar</a></li>
    </ul>
  </div>
</section>

<section class="home-section" aria-labelledby="featured-work-heading">
  <div class="section-heading">
    <h2 id="featured-work-heading">Featured Work</h2>
  </div>
  <div class="post-list" role="list">
    {% include site/card.html
      card_clickable='on'
      date='Projects'
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

<section class="home-section" aria-labelledby="latest-writing-heading">
  <div class="section-heading">
    <h2 id="latest-writing-heading">Latest Writing</h2>
  </div>
  <div class="post-list" role="list">
    {% for post in site.posts limit:5 %}
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
  <p>Open-source and software work centered on `linkedin/isolation-forest`, a distributed Spark/Scala implementation for large-scale unsupervised anomaly detection.</p>
  <div class="post-list" role="list">
    {% for item in site.data.open_source.major_updates limit:3 %}
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
  <ul class="proof-strip" aria-label="Research highlights">
    <li><strong>30+</strong><span>papers</span></li>
    <li><strong>10k+</strong><span>citations</span></li>
    <li><strong>3</strong><span>patents</span></li>
  </ul>
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
