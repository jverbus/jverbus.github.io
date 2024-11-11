---
layout: post
title: "Announcing ONNX Support in Isolation Forest"
description: ""
category: AI and Machine Learning
tags: [LinkedIn, machine learning, isolation forest, ONNX, open source]
---
{% include JB/setup %}

![Neutron generator outside of the LUX water tank]({{ site.url }}/assets/images/isolation_forest_onnx.png){: style="width:90%; display: block; margin-left: 0;" }

I'm excited to announce that we've added an ONNX converter to our open-source isolation forest library on GitHub!

ONNX model format export capability is now available: [GitHub - LinkedIn Isolation Forest](https://github.com/linkedin/isolation-forest)

In 2019, LinkedIn open-sourced its distributed Scala/Spark implementation of the isolation forest algorithm, a type of unsupervised outlier detection. First proposed by [Liu et al. in 2008](https://doi.org/10.1109/ICDM.2008.17), isolation forest is a powerful algorithm that isolates anomalies using a randomized binary tree structure. You can read more about its technical background and applications in an earlier [LinkedIn engineering blog post](https://www.linkedin.com/blog/engineering/data-management/isolation-forest?lipi=urn%3Ali%3Apage%3Ad_flagship3_pulse_read%3BgSQiQ1SSSKGSjYRLyCMwRQ%3D%3D).

Since its release, our library has been widely adopted by developers, data scientists, and engineers. Previously, our library used a custom format for model persistence, which limited its flexibility and confined it to offline batch inference in Spark. This created challenges for developers needing to deploy isolation forest models in environments beyond Spark, such as streaming or edge applications.

You can learn more [here](https://www.linkedin.com/pulse/announcing-onnx-support-linkedins-open-source-isolation-james-verbus-paoqe/).

## Resources

### Blogs

- [Announcing ONNX Support in LinkedIn’s Open-Source Isolation Forest Library](https://www.linkedin.com/pulse/announcing-onnx-support-linkedins-open-source-isolation-james-verbus-paoqe/)
- [Detecting and preventing abuse on LinkedIn using isolation forests](https://www.linkedin.com/blog/engineering/data-management/isolation-forest)
- [Open Source: Spark/Scala Isolation Forest Library]({{ site.baseurl }}{% link _posts/2019-08-13-open-source-isolation-forest-spark-scala.md %})

### GitHub

- [isolation forest](https://github.com/linkedin/isolation-forest)
