---
layout: post
title: "Open Source: Spark/Scala Isolation Forest Library"
description: "Why we built a distributed Isolation Forest implementation for detecting unusual account activity at LinkedIn."
last_modified_at: 2026-09-06
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

## Why Unsupervised Learning Fits Anti-Abuse

Three properties of the abuse domain make unsupervised methods attractive.

First, labels are scarce. New abuse vectors arrive with few or no ground truth labels, which makes training a supervised model impractical and even evaluation difficult. Second, signal per account is thin. An individual abusive account may do very little until the moment it acts, and low-volume abuse hides inside ordinary browsing; confidence often requires noticing many accounts behaving the same way. Third, the domain is adversarial. Attackers adapt to whatever defenses ship, so labels collected today may describe yesterday's attack. Outlier detection can surface unusual attacker behavior when the chosen features separate it from organic behavior. Training without labels does not remove the difficulties of evaluation or adversarial change.

## How Isolation Forests Work

The algorithm, introduced by [Liu, Ting, and Zhou in 2008](https://doi.org/10.1109/ICDM.2008.17), builds an ensemble of randomly grown binary trees. Each tree takes a sample of training data and, at every node, picks a random feature and a random split value between that feature's minimum and maximum, recursing until points sit alone in leaf nodes (a height limit keeps trees shallow in practice).

The trick is what isolation costs. Outliers, being few and unusual, get separated quickly and end up with short paths from root to leaf. Inliers, packed into dense regions, take many more splits. In a toy two-dimensional example from one of my talks, isolating a point inside the main cluster took 11 random splits; isolating an outlying point took 5. An instance's outlier score is derived from its average path length across the ensemble, and averaging over many random trees keeps the variance of that estimate down.

<img src="{{ '/assets/images/isolation-forest-tree.png' | relative_url }}" alt="Diagram of an isolation tree where an outlier reaches a leaf in few splits near the root while an inlier requires a much deeper path" width="1024" height="611" loading="lazy" decoding="async">

*An example isolation tree. Outliers reach leaf nodes in a few splits; inliers take longer paths to isolate. (Figure from my LinkedIn Engineering blog post.)*

Isolation Forest does not require a parametric data-distribution model or a nearest-neighbor distance metric. Its sampled trees can be trained and scored independently, which fits the distributed implementation below.

## The Library

The implementation is Scala on Spark, with distributed training and scoring. It inherits from the Estimator and Model base classes in Spark ML, so it integrates with existing Spark ML pipelines, and trained models persist to and load from HDFS. Artifacts are published to [Maven Central](https://repo.maven.apache.org/maven2/com/linkedin/isolation-forest/); the README includes the [dependency configuration](https://github.com/linkedin/isolation-forest/blob/9de37cdcd0a1e8c9892f3ce9cfcd5da2f165cf3d/README.md#add-an-isolation-forest-dependency-to-your-project).

This example configuration trains and scores through Spark ML. The [contamination parameter](https://github.com/linkedin/isolation-forest/blob/9de37cdcd0a1e8c9892f3ce9cfcd5da2f165cf3d/README.md#model-parameters) sets the fraction used to determine the outlier-label threshold; it does not change the trained trees or anomaly scores. The value `0.1` below is an example, not measured abuse prevalence or a recommended threshold for every application.

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

## Catching Automation in the Wild

The application I pioneered this for at LinkedIn was automation detection. Plotting every active member's daily score against activity volume showed a sparse high-score region above the dense bulk of accounts. Reviewing accounts in that region revealed a cluster using automation tools.

<img src="{{ '/assets/images/isolation-forest-normal-day.jpg' | relative_url }}" alt="Scatter plot of isolation forest score versus number of user actions for all active members on a normal day, with a highlighted cluster of real members using automation tools" width="1280" height="720" loading="lazy" decoding="async">

*A normal day: every active member, plotted by isolation forest score against activity volume. The highlighted cluster is real members using automation tools with similar behavior. (Slide from my Spark + AI Summit 2020 talk.)*

The reviewed accounts had repeated activity patterns: one fired bursts of about thirty actions at a constant rate, paused, then repeated; another ran smaller, more frequent bursts adding up to similar volume.

<img src="{{ '/assets/images/isolation-forest-automation-bursts.jpg' | relative_url }}" alt="Two time series of automated user actions showing repeated bursts of roughly thirty actions at a constant rate" width="1280" height="720" loading="lazy" decoding="async">

*Two accounts from the highlighted cluster: repeated bursts of roughly thirty actions at a constant rate. (Slide from my Spark + AI Summit 2020 talk.)*

On an attack day, a tight cluster of fake accounts appeared with very high and nearly identical scores, consistent with coordinated automation, even though activity volumes varied by an order of magnitude across the cluster.

<img src="{{ '/assets/images/isolation-forest-attack-day-highlighted.jpg' | relative_url }}" alt="Scatter plot from a fake account attack day with the fake account cluster highlighted in red at very high isolation forest score above the normal population" width="1276" height="720" loading="lazy" decoding="async">

*Attack day: a coordinated fake account attack appears as a tight cluster, highlighted in red, at very high score, even though its activity volumes overlap the normal population below. (Slide from my Fighting Abuse @Scale 2019 talk.)*

Individual accounts kept their activity modest, only tens of actions over the whole day, with randomized delays between requests. In this attack, the learned score separated the cluster even though its activity volume overlapped that of other accounts.

<img src="{{ '/assets/images/isolation-forest-attack-accounts.jpg' | relative_url }}" alt="Two time series of automated user actions from attack accounts showing low daily volumes accumulated with randomized timing between requests" width="1280" height="720" loading="lazy" decoding="async">

*Two accounts from the attack cluster: low daily volumes with randomized timing between requests, and still cleanly separated by score. (Slide from my Spark + AI Summit 2020 talk.)*

## Beyond Automation Detection

Possible applications include flagging unusual login activity for account-takeover review or monitoring shifts in an ML system's feature distributions. These are potential uses, separate from the LinkedIn cases above; the [original discussion](https://www.linkedin.com/blog/engineering/data-management/isolation-forest) lists others.

## Since Then

**Update (2026):** the library gained [ONNX export]({{ '/2024/09/23/announcing-onnx-support-in-isolation-forest/' | relative_url }}) in 2024, so standard models trained in Spark can be scored with a compatible ONNX runtime, and [Extended Isolation Forest]({{ '/2026/03/18/announcing-extended-isolation-forest-support/' | relative_url }}) support in 2026, which replaces axis-aligned splits with random hyperplanes (EIF models are not yet ONNX-convertible). The repository also ships benchmarks against the results reported in the original Liu et al. paper and a reference Python implementation, with scripts to reproduce them.

## Resources

- <span id="blogs" aria-hidden="true"></span>[Detecting and preventing abuse on LinkedIn using isolation forests (LinkedIn Engineering)](https://engineering.linkedin.com/blog/2019/isolation-forest)
- <span id="github" aria-hidden="true"></span>[linkedin/isolation-forest](https://github.com/linkedin/isolation-forest)
- <span id="videos" aria-hidden="true"></span>[Preventing Abuse Using Unsupervised Learning](https://www.youtube.com/watch?v=sFRrFWYNAUI)
- [FIGHTING ABUSE @SCALE 2019: PREVENTING ABUSE USING UNSUPERVISED LEARNING](https://atscaleconference.com/videos/fighting-abuse-scale-2019-preventing-abuse-using-unsupervised-learning/)
