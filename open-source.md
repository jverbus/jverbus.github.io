---
layout: page
title: Open Source
description: "Open source projects and related writing by James Verbus, including LinkedIn's isolation-forest library."
---

Highlights from my open source work, centered on `linkedin/isolation-forest`, the Spark/Scala implementation I built at LinkedIn and open sourced.

## isolation-forest

<div class="project-hero">
  <img class="project-logo" src="{{ site.baseurl }}/assets/images/isolation_forest.svg" alt="Isolation forest project diagram">
  <div class="project-hero-content">
    <p class="project-name">isolation-forest</p>
    <p class="project-metrics">
      <a href="https://github.com/linkedin/isolation-forest"><img src="https://img.shields.io/github/stars/linkedin/isolation-forest?style=flat-square&label=GitHub%20Stars" alt="GitHub stars for linkedin/isolation-forest"></a>
      <a href="https://github.com/linkedin/isolation-forest/network/members"><img src="https://img.shields.io/github/forks/linkedin/isolation-forest?style=flat-square&label=Forks" alt="GitHub forks for linkedin/isolation-forest"></a>
    </p>
  </div>
</div>

<div class="post-list" role="list">
  <article class="post-list-item" role="listitem">
    <p class="post-list-date">Core Project</p>
    <h3 class="post-list-title"><a href="https://github.com/linkedin/isolation-forest">GitHub: linkedin/isolation-forest</a></h3>
    <p class="post-list-description">I built and open sourced this distributed Scala/Spark isolation-forest implementation for large-scale unsupervised anomaly detection at LinkedIn.</p>
  </article>
  <article class="post-list-item" role="listitem">
    <p class="post-list-date">Artifacts</p>
    <h3 class="post-list-title"><a href="https://repo.maven.apache.org/maven2/com/linkedin/isolation-forest/">Maven Central: com.linkedin:isolation-forest</a></h3>
    <p class="post-list-description">Published artifacts for integrating the library into JVM-based data pipelines.</p>
  </article>
  <article class="post-list-item" role="listitem">
    <p class="post-list-date">Artifacts</p>
    <h3 class="post-list-title"><a href="https://pypi.org/project/isolation-forest-onnx/">PyPI: isolation-forest-onnx</a></h3>
    <p class="post-list-description">Python package for converting LinkedIn's isolation-forest model format into ONNX for portable inference.</p>
  </article>
</div>

## Related Posts

<div class="post-list" role="list">
  <article class="post-list-item" role="listitem">
    <p class="post-list-date">Sep 23, 2024</p>
    <h3 class="post-list-title"><a href="{{ site.baseurl }}{% link _posts/2024-09-23-announcing-onnx-support-in-isolation-forest.md %}">Announcing ONNX Support in Isolation Forest</a></h3>
    <p class="post-list-description">Details on ONNX export support and deployment options beyond Spark batch inference.</p>
  </article>
  <article class="post-list-item" role="listitem">
    <p class="post-list-date">Aug 13, 2019</p>
    <h3 class="post-list-title"><a href="{{ site.baseurl }}{% link _posts/2019-08-13-open-source-isolation-forest-spark-scala.md %}">Open Source: Spark/Scala Isolation Forest Library</a></h3>
    <p class="post-list-description">Original project announcement and context on anti-abuse production use cases.</p>
  </article>
</div>

## External Writing

<div class="post-list" role="list">
  <article class="post-list-item" role="listitem">
    <p class="post-list-date">LinkedIn Engineering</p>
    <h3 class="post-list-title"><a href="https://engineering.linkedin.com/blog/2019/isolation-forest">Open Sourcing Isolation Forest</a></h3>
    <p class="post-list-description">Engineering write-up on motivations, architecture, and applications.</p>
  </article>
  <article class="post-list-item" role="listitem">
    <p class="post-list-date">LinkedIn Pulse</p>
    <h3 class="post-list-title"><a href="https://www.linkedin.com/pulse/announcing-onnx-support-linkedins-open-source-isolation-james-verbus-paoqe/">Announcing ONNX Support in LinkedIn's Open-Source Isolation Forest Library</a></h3>
    <p class="post-list-description">Overview of ONNX model export and expanded serving patterns.</p>
  </article>
</div>

## Videos

<div class="post-list" role="list">
  <article class="post-list-item" role="listitem">
    <p class="post-list-date">2020</p>
    <h3 class="post-list-title"><a href="https://www.youtube.com/watch?v=sFRrFWYNAUI">Spark+AI Summit: Preventing Abuse Using Unsupervised Learning</a></h3>
    <p class="post-list-description">Detection of abusive activity on a large social network is an adversarial challenge with quickly evolving behavior patterns and imperfect ground truth labels. These characteristics limit the use of supervised learning techniques, but they can be overcome using unsupervised methods. To address these challenges, we created a Scala/Spark implementation of the isolation forest unsupervised outlier detection algorithm; we recently open sourced this library (<a href="https://github.com/linkedin/isolation-forest">github.com/linkedin/isolation-forest</a>).</p>
  </article>
  <article class="post-list-item" role="listitem">
    <p class="post-list-date">2019</p>
    <h3 class="post-list-title"><a href="https://atscaleconference.com/videos/fighting-abuse-scale-2019-preventing-abuse-using-unsupervised-learning/">Fighting Abuse @Scale: Preventing Abuse Using Unsupervised Learning</a></h3>
    <p class="post-list-description">Detection of abusive activity on a large social network is an adversarial challenge with quickly evolving behavior patterns and imperfect ground truth labels. These characteristics limit the use of supervised learning techniques, but they can be overcome using unsupervised methods. To address these challenges, we created a Scala/Spark implementation of the isolation forest unsupervised outlier detection algorithm; we recently open sourced this library (<a href="https://github.com/linkedin/isolation-forest">github.com/linkedin/isolation-forest</a>).</p>
  </article>
</div>
