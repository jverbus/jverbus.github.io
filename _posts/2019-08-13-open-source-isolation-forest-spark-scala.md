---
layout: post
title: "Open Source: Spark/Scala Isolation Forest Library"
description: "Why we built a distributed Isolation Forest implementation for detecting unusual account activity at LinkedIn."
last_modified_at: 2026-09-18
og_image: "/assets/images/social/2019-08-13-open-source-isolation-forest-spark-scala-1200x630.jpg"
og_image_alt: "Open Source: Spark/Scala Isolation Forest Library"
og_image_width: 1200
og_image_height: 630
categories: ["AI and Machine Learning"]
tags: [LinkedIn, isolation forest, outlier detection, unsupervised learning, machine learning, Spark, Scala]
related:
  - /2026/03/18/announcing-extended-isolation-forest-support/
  - /2024/09/23/announcing-onnx-support-in-isolation-forest/
  - /2021/09/02/using-deep-learning-to-detect-abusive-sequences-of-member-activity/
---

I open-sourced this Scala/Spark implementation of isolation forests in 2019. The LinkedIn Anti-Abuse AI team used it in production to find unusual account activity for investigation.

## Why we used unsupervised learning
{: #why-unsupervised-learning-fits-anti-abuse }

New forms of abuse often arrive with few or no labeled examples. Supervised training and evaluation are therefore difficult, while attackers continue to change their behavior in response to defenses.

The activity of an individual abusive account can also resemble ordinary browsing. Low-volume attacks may be easier to identify by examining groups of accounts with similar behavior. Isolation Forest provides a way to find unusual activity when the selected features separate it from normal use.

## How Isolation Forests Work

The Isolation Forest algorithm, introduced by [Liu, Ting, and Zhou in 2008](https://doi.org/10.1109/ICDM.2008.17), builds an ensemble of random binary trees. Each tree is trained on a subsample. At each node, a feature and a split value within its observed range are selected at random. Splitting continues until a point is isolated or the height limit is reached.

Outliers typically require fewer random splits to isolate than points in dense regions of the feature space. In a two-dimensional example from one of my talks, isolating an inlier took 11 splits, while isolating an outlier took 5. The anomaly score is derived from the mean path length across the ensemble. Averaging over many random trees reduces the sampling variance of that estimate.

<img src="{{ '/assets/images/isolation-forest-tree.png' | relative_url }}" alt="Diagram of an isolation tree where an outlier reaches a leaf in few splits near the root while an inlier requires a much deeper path" width="1024" height="611" loading="lazy" decoding="async">

*An example isolation tree. The outlier reaches a leaf after fewer splits than the inlier. (Figure from my LinkedIn Engineering blog post.)*

Isolation Forest does not require a parametric model of the data distribution or a nearest-neighbor distance metric. The sampled trees can be trained and scored independently.

## The Library

The implementation is Scala on Spark, with distributed training and scoring. It inherits from the Estimator and Model base classes in Spark ML, so it integrates with existing Spark ML pipelines, and trained models persist to and load from HDFS. Artifacts are published to [Maven Central](https://repo.maven.apache.org/maven2/com/linkedin/isolation-forest/); the README includes the [dependency configuration](https://github.com/linkedin/isolation-forest/blob/9de37cdcd0a1e8c9892f3ce9cfcd5da2f165cf3d/README.md#add-an-isolation-forest-dependency-to-your-project).

The following example trains and scores a model through Spark ML. The [contamination parameter](https://github.com/linkedin/isolation-forest/blob/9de37cdcd0a1e8c9892f3ce9cfcd5da2f165cf3d/README.md#model-parameters) is set to `0.1` and controls the fraction used to determine the outlier-label threshold. It does not change the fitted trees or anomaly scores.

```scala
import com.linkedin.relevance.isolationforest._

val isolationForest = new IsolationForest()
  .setNumEstimators(100)
  .setMaxSamples(256)
  .setFeaturesCol("features")
  .setScoreCol("outlierScore")
  .setPredictionCol("predictedLabel")
  .setContamination(0.1)
  .setContaminationError(0.001)

val isolationForestModel = isolationForest.fit(data)
val dataWithScores = isolationForestModel.transform(data)
```

## Automation detection at LinkedIn
{: #catching-automation-in-the-wild }

I first used the library for automation detection at LinkedIn. Plotting each active member’s daily score against activity volume revealed a sparse region above the main population. Review of accounts in that region identified a group using automation tools.

<img src="{{ '/assets/images/isolation-forest-normal-day.jpg' | relative_url }}" alt="Scatter plot of isolation forest score versus number of user actions for all active members on a normal day, with a highlighted cluster of real members using automation tools" width="1280" height="720" loading="lazy" decoding="async">

*A normal day: every active member, plotted by isolation forest score against activity volume. The highlighted cluster is real members using automation tools with similar behavior. (Slide from my Spark + AI Summit 2020 talk.)*

The reviewed accounts had repeated activity patterns: one fired bursts of about thirty actions at a constant rate, paused, then repeated; another ran smaller, more frequent bursts adding up to similar volume.

<img src="{{ '/assets/images/isolation-forest-automation-bursts.jpg' | relative_url }}" alt="Two time series of automated user actions showing repeated bursts of roughly thirty actions at a constant rate" width="1280" height="720" loading="lazy" decoding="async">

*Repeated bursts of activity in two accounts from the highlighted cluster. (Slide from my Spark + AI Summit 2020 talk.)*

On an attack day, a tight cluster of fake accounts appeared with very high and nearly identical scores, consistent with coordinated automation, even though activity volumes varied by an order of magnitude across the cluster.

<img src="{{ '/assets/images/isolation-forest-attack-day-highlighted.jpg' | relative_url }}" alt="Scatter plot from a fake account attack day with the fake account cluster highlighted in red at very high isolation forest score above the normal population" width="1276" height="720" loading="lazy" decoding="async">

*Attack day: a coordinated fake account attack appears as a tight cluster, highlighted in red, at very high score, even though its activity volumes overlap the normal population below. (Slide from my Fighting Abuse @Scale 2019 talk.)*

Individual accounts kept their activity modest, only tens of actions over the whole day, with randomized delays between requests. In this attack, the learned score separated the cluster even though its activity volume overlapped that of other accounts.

<img src="{{ '/assets/images/isolation-forest-attack-accounts.jpg' | relative_url }}" alt="Two time series of automated user actions from attack accounts showing low daily volumes accumulated with randomized timing between requests" width="1280" height="720" loading="lazy" decoding="async">

*Two accounts from the attack cluster, with low daily activity volumes and randomized delays between requests. (Slide from my Spark + AI Summit 2020 talk.)*

## Beyond Automation Detection

[Other possible applications](https://www.linkedin.com/blog/engineering/data-management/isolation-forest) include identifying unusual login activity for account-takeover investigation and monitoring changes in an ML system’s feature distributions.

## Since Then

**Update (2026):** The library added [ONNX export]({{ '/2024/09/23/announcing-onnx-support-in-isolation-forest/' | relative_url }}) in 2024, allowing standard Isolation Forest models trained in Spark to be scored with a compatible ONNX runtime. [Extended Isolation Forest]({{ '/2026/03/18/announcing-extended-isolation-forest-support/' | relative_url }}) support followed in 2026, adding random-hyperplane splits; EIF models are not supported by the ONNX converter.

The repository includes benchmarks against results from the original Liu et al. paper and a reference Python implementation, with scripts for reproducing the comparisons.

## Resources

- <span id="blogs" aria-hidden="true"></span>[Detecting and preventing abuse on LinkedIn using isolation forests (LinkedIn Engineering)](https://engineering.linkedin.com/blog/2019/isolation-forest)
- <span id="github" aria-hidden="true"></span>[linkedin/isolation-forest](https://github.com/linkedin/isolation-forest)
- <span id="videos" aria-hidden="true"></span>[Preventing Abuse Using Unsupervised Learning](https://www.youtube.com/watch?v=sFRrFWYNAUI)
- [FIGHTING ABUSE @SCALE 2019: PREVENTING ABUSE USING UNSUPERVISED LEARNING](https://atscaleconference.com/videos/fighting-abuse-scale-2019-preventing-abuse-using-unsupervised-learning/)
