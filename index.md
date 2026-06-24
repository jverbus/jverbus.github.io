---
layout: page
title: Home
description: "AI systems for messy, adversarial environments: bot and automation detection, anomaly detection, sequence modeling, synthetic media, and AI productivity."
last_modified_at: 2026-06-24
hide_title: true
---

<section class="home-hero" id="about">
  <div class="home-hero-grid">
    <div class="home-hero-copy">
      <p class="home-eyebrow">Adversarial AI · Automation detection · Synthetic media</p>
      <h1>James Verbus</h1>
      <p class="home-lede home-lede-primary">I build and evaluate AI systems for messy, adversarial environments.</p>
      <p class="home-lede">Recent work spans bot and automation detection, anomaly detection, sequence modeling, synthetic media, and AI productivity.</p>
      <div class="home-hero-actions" aria-label="Primary links">
        <a class="cta-button" href="{{ '/posts/' | relative_url }}">Read the work</a>
        <a class="secondary-button" href="#start-here">Start here</a>
      </div>
    </div>

    <div class="home-hero-media">
      <figure class="home-hero-photo">
        <img src="{{ '/assets/images/jverbus_lux_detector.jpg' | relative_url }}" srcset="{{ '/assets/images/jverbus_lux_detector-400.jpg' | relative_url }} 400w, {{ '/assets/images/jverbus_lux_detector.jpg' | relative_url }} 800w" sizes="(max-width: 760px) calc(100vw - 2rem), 420px" alt="James Verbus working on the LUX dark matter detector" width="800" height="800" loading="eager" decoding="async" fetchpriority="high">
        <figcaption>[01] LUX hardware - dark matter detection, SURF, South Dakota.</figcaption>
      </figure>

      <div class="home-contact" id="contact" aria-label="Contact links">
        <ul class="contact-list">
          <li><a href="mailto:james.verbus@gmail.com">{% include site/icons/email.svg %} Email</a></li>
          <li><a href="https://github.com/jverbus">{% include site/icons/github.svg %} GitHub</a></li>
          <li><a href="https://www.linkedin.com/in/jamesverbus/">{% include site/icons/linkedin.svg %} LinkedIn</a></li>
          <li><a href="https://x.com/JamesVerbus">{% include site/icons/x.svg %} X</a></li>
          <li><a href="https://scholar.google.com/citations?user=_ksEziAAAAAJ">{% include site/icons/google-scholar.svg %} Google Scholar</a></li>
          <li><a href="https://orcid.org/0000-0002-5812-022X">{% include site/icons/orcid.svg %} ORCID</a></li>
        </ul>
      </div>
    </div>
  </div>

  <ul class="proof-grid" aria-label="Career highlights">
    <li><a href="{{ '/2021/09/02/using-deep-learning-to-detect-abusive-sequences-of-member-activity/' | relative_url }}"><strong>10 yrs</strong><span>LinkedIn Trust AI</span></a></li>
    <li><a href="https://scholar.google.com/citations?user=_ksEziAAAAAJ"><strong>30+</strong><span>papers</span></a></li>
    <li><a href="https://scholar.google.com/citations?user=_ksEziAAAAAJ"><strong>10k+</strong><span>citations</span></a></li>
    <li><a href="{{ '/publications/#patents' | relative_url }}"><strong>3</strong><span>patents</span></a></li>
    <li><a href="https://github.com/linkedin/isolation-forest"><strong>250+</strong><span>GitHub stars</span></a></li>
  </ul>

  <nav class="home-route-grid" aria-label="Primary work areas">
    <a class="home-route-card" href="{{ '/posts/' | relative_url }}">
      <span class="home-route-kicker">Detection Systems</span>
      <strong>Bot and automation detection, anomaly detection, and validation in adversarial settings.</strong>
      <span>Read field notes and technical case studies.</span>
    </a>
    <a class="home-route-card" href="{{ '/publications/' | relative_url }}">
      <span class="home-route-kicker">Research</span>
      <strong>Synthetic media detection, sequence modeling, and low-signal physics measurement.</strong>
      <span>Browse papers, patents, posters, and engineering writeups.</span>
    </a>
    <a class="home-route-card" href="{{ '/videos/' | relative_url }}">
      <span class="home-route-kicker">Talks / Projects</span>
      <strong>Hands-on AI workshops, open-source anomaly detection, and AI productivity tools.</strong>
      <span>Watch talks or try interactive demos.</span>
    </a>
  </nav>

</section>

<section class="home-section home-start" id="start-here" aria-labelledby="start-here-heading">
  <div class="section-heading">
    <p class="section-kicker">Start here</p>
    <h2 id="start-here-heading">Representative work</h2>
  </div>
  <div class="home-start-grid" role="list">
    <article class="home-start-card" role="listitem">
      <p class="home-start-label">Technical case study</p>
      <h3><a href="{{ '/2026/03/18/announcing-extended-isolation-forest-support/' | relative_url }}">Extended Isolation Forest for Spark/Scala anomaly detection</a></h3>
      <p>Distributed anomaly detection with random hyperplane splits, validation plots, benchmarks, and reference parity checks.</p>
    </article>
    <article class="home-start-card" role="listitem">
      <p class="home-start-label">Research</p>
      <h3><a href="{{ '/2024/08/15/finding-ai-generated-faces-in-the-wild/' | relative_url }}">Finding AI-generated faces in the wild</a></h3>
      <p>CVPR workshop research and a LinkedIn Engineering writeup on synthetic profile-image detection at platform scale.</p>
    </article>
    <article class="home-start-card" role="listitem">
      <p class="home-start-label">Workshop</p>
      <h3><a href="{{ '/2026/01/09/brown-physics-ai-winter-school-workshop/' | relative_url }}">Reinforcement learning for orbital transfers</a></h3>
      <p>A Brown AI Winter School workshop on orbital mechanics, PPO agents, and practical model diagnostics.</p>
    </article>
    <article class="home-start-card" role="listitem">
      <p class="home-start-label">Open source</p>
      <h3><a href="{{ '/open-source/isolation-forest/' | relative_url }}">LinkedIn's isolation-forest library</a></h3>
      <p>Distributed Spark/Scala anomaly detection with Extended Isolation Forest and ONNX support.</p>
    </article>
  </div>
</section>

<section class="home-section home-throughline" aria-labelledby="throughline-heading">
  <div class="section-heading">
    <p class="section-kicker">Background</p>
    <h2 id="throughline-heading">Detection work across trust, AI, and physics</h2>
  </div>
  <div class="home-throughline-copy">
    <p>At LinkedIn, most recently as a Senior Staff Machine Learning Engineer, I built production systems for Trust: bot and automation detection, deep models over member-activity sequences, unsupervised anomaly detection at scale, and detection of AI-generated profile images. I also created and open-sourced LinkedIn's isolation-forest library and led AI productivity work for Trust engineering teams.</p>
    <p>Before LinkedIn, I earned my Ph.D. in physics at Brown working on <a href="{{ '/2016/08/18/calibrating-the-lux-dark-matter-experiment/' | relative_url }}">LUX</a>, one of the world's most sensitive dark-matter detectors. The common thread is practical measurement: extracting weak signals from noisy data, checking uncertainty, and making systems useful when ground truth is incomplete.</p>
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
    {% assign llm_talk = selected_talks_section.items | where: "date", "2025" | first %}
    {% include site/card.html
      card_class='video-list-item'
      image=llm_talk.image
      image_alt=llm_talk.image_alt
      image_class='video-list-thumb'
      content_class='video-list-content'
      date=llm_talk.date
      title=llm_talk.title
      url=llm_talk.url
      link_target='_blank'
      link_rel='noopener'
      summary=llm_talk.summary
      venue=llm_talk.venue
      links=llm_talk.links
    %}
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
      links=sxsw_panel.links
    %}
    {% assign abuse_talk = selected_talks_section.items | where: "date", "2019" | first %}
    {% include site/card.html
      card_class='video-list-item'
      image=abuse_talk.image
      image_alt=abuse_talk.image_alt
      image_class='video-list-thumb'
      content_class='video-list-content'
      date=abuse_talk.date
      title=abuse_talk.title
      url=abuse_talk.url
      link_target='_blank'
      link_rel='noopener'
      summary=abuse_talk.summary
      venue=abuse_talk.venue
      links=abuse_talk.links
    %}
  </div>
  <p class="home-archive-link"><a href="{{ '/videos/' | relative_url }}">View videos</a></p>
</section>

<section class="home-section" aria-labelledby="conversations-heading">
  <div class="section-heading">
    <h2 id="conversations-heading">Contact</h2>
  </div>
  <p>I like hearing from people working on AI systems, detection, synthetic media, sequence modeling, physics, or AI productivity. Email is the easiest way to reach me.</p>
  <p><a class="cta-button" href="mailto:james.verbus@gmail.com">Email me</a></p>
</section>
