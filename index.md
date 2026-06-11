---
layout: page
title: Home
description: "AI systems, measurement, and reliability under uncertainty: agents, evaluation, anomaly detection, and adversarial ML."
last_modified_at: 2026-06-12
hide_title: true
---

<section class="home-hero" id="about">
  <h1>James Verbus</h1>
  <div class="home-hero-side">
    <figure class="home-hero-photo">
      <img src="{{ '/assets/images/jverbus_lux_detector.jpg' | relative_url }}" srcset="{{ '/assets/images/jverbus_lux_detector-400.jpg' | relative_url }} 400w, {{ '/assets/images/jverbus_lux_detector.jpg' | relative_url }} 800w" sizes="(max-width: 760px) calc(100vw - 2rem), 400px" alt="James Verbus working on the LUX dark matter detector" width="800" height="800" loading="eager" decoding="async" fetchpriority="high">
      <figcaption>Working on detector hardware for the LUX, one of the world's most sensitive dark matter experiments.</figcaption>
    </figure>
    <ul class="proof-strip" aria-label="Career highlights">
      <li><a href="https://scholar.google.com/citations?user=_ksEziAAAAAJ"><strong>30+</strong> papers</a></li>
      <li><a href="https://scholar.google.com/citations?user=_ksEziAAAAAJ"><strong>10k+</strong> citations</a></li>
      <li><a href="{{ '/publications/#patents' | relative_url }}"><strong>3</strong> patents</a></li>
      <li><a href="https://github.com/linkedin/isolation-forest"><strong>250+</strong> GitHub stars</a></li>
    </ul>
  </div>
  <div class="home-hero-copy">
    <p class="home-lede">I build AI systems for uncertain and adversarial environments: systems where measurement is hard, feedback is noisy, and getting the right answer requires more than an evaluation score.</p>
    <p class="home-lede">After nearly a decade at LinkedIn, most recently as a Senior Staff Machine Learning Engineer focused on anti-abuse, trust, and platform integrity, I chose to leave to focus full-time on frontier AI systems: agents, simulation, evaluation, measurement, and research workflows.</p>
    <p class="home-lede">Before LinkedIn, I earned my Ph.D. in physics at Brown working on <a href="{{ '/2016/08/18/calibrating-the-lux-dark-matter-experiment/' | relative_url }}">LUX</a>, one of the world's most sensitive dark-matter detectors. Across physics, platform integrity, and AI, the through-line has been the same: extract weak signals, measure what matters, understand uncertainty, and build systems that remain reliable when the ground truth is difficult to see.</p>
  </div>
  <div class="home-contact" id="contact" aria-label="Contact links">
    <ul class="contact-list">
      <li><a href="mailto:james.verbus@gmail.com">{% include site/icons/email.svg %} Email</a></li>
      <li><a href="https://github.com/jverbus">{% include site/icons/github.svg %} GitHub</a></li>
      <li><a href="https://www.linkedin.com/in/jamesverbus/">{% include site/icons/linkedin.svg %} LinkedIn</a></li>
      <li><a href="https://x.com/JamesVerbus">{% include site/icons/x.svg %} X</a></li>
      <li><a href="https://scholar.google.com/citations?user=_ksEziAAAAAJ">{% include site/icons/google-scholar.svg %} Google Scholar</a></li>
    </ul>
  </div>
</section>

<section class="home-section" aria-labelledby="featured-writing-heading">
  <div class="section-heading">
    <h2 id="featured-writing-heading">Featured Writing</h2>
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
    {% include site/card.html
      card_clickable='on'
      date='Ph.D. Thesis'
      title='Calibrating the LUX Dark Matter Experiment'
      url='/2016/08/18/calibrating-the-lux-dark-matter-experiment/'
      description='An absolute calibration of sub-keV nuclear recoils in the LUX detector using neutron scattering kinematics, improving low-mass WIMP sensitivity sevenfold.'
    %}
  </div>
  <p class="home-archive-link"><a href="{{ '/posts/' | relative_url }}">View all writing</a></p>
</section>

<section class="home-section" aria-labelledby="projects-heading">
  <div class="section-heading">
    <h2 id="projects-heading">Projects</h2>
  </div>
  <div class="post-list" role="list">
    {% for item in site.data.projects.items limit:1 %}
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
        links=item.links
      %}
    {% endfor %}
    {% assign panels_section = site.data.videos.sections | where: "title", "Panels" | first %}
    {% assign sxsw_panel = panels_section.items | first %}
    {% include site/card.html
      card_class='video-list-item'
      image=sxsw_panel.image
      image_alt=sxsw_panel.image_alt
      image_class='video-list-thumb'
      content_class='video-list-content'
      date=sxsw_panel.date
      title=sxsw_panel.title
      url=sxsw_panel.url
      link_target='_blank'
      link_rel='noopener'
      summary=sxsw_panel.summary
      venue=sxsw_panel.venue
      venue_label='Venue/Host:'
      links=sxsw_panel.links
    %}
  </div>
  <p class="home-archive-link"><a href="{{ '/videos/' | relative_url }}">View videos</a></p>
</section>

<section class="home-section" aria-labelledby="conversations-heading">
  <div class="section-heading">
    <h2 id="conversations-heading">Open to Conversations</h2>
  </div>
  <p>I enjoy comparing notes with people building or studying AI systems. I'm especially interested in the intersection of physics and AI, from world models to reinforcement learning and simulation, and in measurement, adversarial problems, and security. If that overlaps with what you're working on, I'd be glad to hear from you.</p>
  <p><a class="cta-button" href="mailto:james.verbus@gmail.com">Start a conversation</a></p>
</section>
