---
layout: post
title: "Open Source: Spark/Scala Isolation Forest Library"
description: "Announcement and resources for LinkedIn's open-source Scala/Spark isolation-forest library for large-scale unsupervised anomaly detection."
last_modified_at: 2026-06-10
og_image: "/assets/images/social/2019-08-13-open-source-isolation-forest-spark-scala-1200x630.jpg"
og_image_alt: "Open Source: Spark/Scala Isolation Forest Library"
og_image_width: 1200
og_image_height: 630
categories: ["AI and Machine Learning"]
tags: [LinkedIn, isolation forest, outlier detection, unsupervised learning, machine learning, Spark, Scala]
---

I'm happy to announce that my Scala/Spark implementation of isolation forests, an algorithm for unsupervised outlier detection, was open sourced today. It is the implementation the LinkedIn Anti-Abuse AI team relies on in production to find abusive activity, and this post covers why the algorithm fits the anti-abuse problem, how it works, and what the library gives you.

## Why Unsupervised Learning Fits Anti-Abuse

Three properties of the abuse domain make unsupervised methods attractive.

First, labels are scarce. New abuse vectors arrive with few or no ground truth labels, which makes training a supervised model impractical and even evaluation difficult. Second, signal per account is thin. An individual abusive account may do very little until the moment it acts, and low-volume abuse hides inside ordinary browsing; confidence often requires noticing many accounts behaving the same way. Third, the domain is adversarial. Attackers adapt to whatever defenses ship, so labels collected today may describe yesterday's attack. Outlier detection sidesteps much of this: if attacker behavior lands anywhere unusual in feature space relative to organic users, it can be caught without labels.

## How Isolation Forests Work

The algorithm, introduced by [Liu, Ting, and Zhou in 2008](https://doi.org/10.1109/ICDM.2008.17), builds an ensemble of randomly grown binary trees. Each tree takes a sample of training data and, at every node, picks a random feature and a random split value between that feature's minimum and maximum, recursing until points sit alone in leaf nodes (a height limit keeps trees shallow in practice).

The trick is what isolation costs. Outliers, being few and unusual, get separated quickly and end up with short paths from root to leaf. Inliers, packed into dense regions, take many more splits. In a toy two-dimensional example from one of my talks, isolating a point inside the main cluster took 11 random splits; isolating an outlying point took 5. An instance's outlier score is derived from its average path length across the ensemble, and averaging over many random trees keeps the variance of that estimate down.

<img src="{{ '/assets/images/isolation-forest-tree.png' | relative_url }}" alt="Diagram of an isolation tree where an outlier reaches a leaf in few splits near the root while an inlier requires a much deeper path" width="1024" height="611" loading="lazy" decoding="async">

*An example isolation tree. Outliers reach leaf nodes in a few splits; inliers take longer paths to isolate. (Figure from my LinkedIn Engineering blog post.)*

The technique has practical advantages beyond accuracy. Benchmark studies rate it among the strongest outlier detection methods, and it holds up as feature counts grow. Its computational and memory costs are low enough to train and score large volumes of data nearly interactively. It makes fewer assumptions than the alternatives: nothing parametric about the data distribution, and no distance metric of the kind nearest-neighbor methods require. And it is increasingly widely used, with active academic research extending the algorithm and growing industry adoption, especially in trust and anti-abuse.

## The Library

The implementation is Scala on Spark, with distributed training and scoring. It inherits from the Estimator and Model base classes in Spark ML, so it drops into existing Spark ML pipelines, and trained models persist to and load from HDFS. Artifacts are published to [Maven Central](https://repo.maven.apache.org/maven2/com/linkedin/isolation-forest/), so using it is a dependency declaration away.

Training and scoring look like standard Spark ML:

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

The application I pioneered this for at LinkedIn is automation detection. Score every active member on a day and plot the isolation forest score against activity volume, and the picture is immediately useful: the organic population forms a dense bulk, and the sparse high-score region is where automation lives.

One high-scoring cluster turned out, on inspection, to be real members using automation tools, all behaving similarly. Their activity traces made the call easy to trust: one account fired bursts of about thirty actions at a constant rate, paused, then repeated; another ran smaller, more frequent bursts adding up to similar volume. Nothing about that rhythm looks like a person browsing.

The more striking case was an attack day. A tight, dark cluster of fake accounts appeared with very high and nearly identical scores, the signature of one actor driving every account with the same script, even though activity volumes varied by an order of magnitude across the cluster. On the volume axis those accounts overlapped substantially with the normal population. Two accounts pulled from the cluster showed how modest the activity could be: thirty to sixty actions in the day, with randomized delays between requests to blend in. Defenses keyed on volume would have had little to work with. The score axis separated them cleanly anyway, because automated behavior sits far from organic behavior in feature space, and that is exactly what the model isolates.

## Beyond Automation Detection

The same machinery transfers to any problem where unusual is suspicious: surfacing sophisticated fake accounts and advanced persistent threats for human review when no labels exist, insider threat and network intrusion detection, account takeover detection from unusual login and post-login activity, alerting on time series such as payment fraud, flagging anomalous feature distributions as an ML health assurance layer, and even spotting underperforming machines in a data center from their resource usage.

## Since Then

**Update (2026):** the library has kept growing. It gained [ONNX export]({{ '/2024/09/23/announcing-onnx-support-in-isolation-forest/' | relative_url }}) in 2024, so standard models trained in Spark can score anywhere an ONNX runtime runs, and [Extended Isolation Forest]({{ '/2026/03/18/announcing-extended-isolation-forest-support/' | relative_url }}) support in 2026, which replaces axis-aligned splits with random hyperplanes (EIF models are not yet ONNX-convertible). The repository now also ships benchmarks against the results reported in the original Liu et al. paper and a reference Python implementation, with scripts to reproduce them.

## Resources

### Blogs

- [Detecting and preventing abuse on LinkedIn using isolation forests (LinkedIn Engineering)](https://engineering.linkedin.com/blog/2019/isolation-forest)

### GitHub

- [linkedin/isolation-forest](https://github.com/linkedin/isolation-forest)

### Videos

- [Preventing Abuse Using Unsupervised Learning](https://www.youtube.com/watch?v=sFRrFWYNAUI)
- [FIGHTING ABUSE @SCALE 2019: PREVENTING ABUSE USING UNSUPERVISED LEARNING](https://atscaleconference.com/videos/fighting-abuse-scale-2019-preventing-abuse-using-unsupervised-learning/)
