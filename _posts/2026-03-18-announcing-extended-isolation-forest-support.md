---
layout: post
title: "Extended Isolation Forest for Distributed Spark/Scala Anomaly Detection"
description: "Adding Extended Isolation Forest to the Spark/Scala library and comparing it with the reference implementation."
last_modified_at: 2026-09-17
og_image: "/assets/images/social/2026-03-18-announcing-extended-isolation-forest-support-1200x630.jpg"
og_image_alt: "Extended Isolation Forest for distributed Spark/Scala anomaly detection"
og_image_width: 1200
og_image_height: 630
categories: ["AI and Machine Learning"]
tags: [isolation forest, extended isolation forest, anomaly detection, outlier detection, Spark, Scala, open source]
related:
  - /2019/08/13/open-source-isolation-forest-spark-scala/
  - /2024/09/23/announcing-onnx-support-in-isolation-forest/
---

I added **Extended Isolation Forest (EIF)** to LinkedIn’s open-source Spark/Scala `isolation-forest` library. EIF uses the same path-length anomaly score as standard Isolation Forest, with random-hyperplane splits in place of single-feature splits.

<p>
  <a href="https://github.com/linkedin/isolation-forest" aria-label="Open isolation-forest on GitHub">
    <img src="{{ '/assets/images/isolation_forest.svg' | relative_url }}" alt="Isolation Forest logo" width="331" height="326" loading="lazy" decoding="async">
  </a>
</p>

I created and open-sourced the [Spark/Scala implementation](https://github.com/linkedin/isolation-forest) in 2019 for [abuse detection at LinkedIn](https://www.linkedin.com/blog/engineering/data-management/isolation-forest). The library supports distributed training and scoring, Spark ML pipelines, saved models, and ONNX export for standard Isolation Forest. EIF was merged in [PR #79](https://github.com/linkedin/isolation-forest/pull/79) on March 18, 2026 and released in `v4.1.0`.

Existing standard Isolation Forest APIs, Spark ML pipelines, saved-model loading, and ONNX export remain backward-compatible. The release also adds validation for empty ensembles, too-small `maxSamples` values, and feature vectors whose dimension differs from the training data.

## The Scoring Model

Standard Isolation Forest, introduced by [Liu, Ting, and Zhou in 2008](https://doi.org/10.1109/ICDM.2008.17), scores points by how quickly random trees isolate them. Points isolated by shorter paths receive higher anomaly scores; points that require longer paths receive lower scores.

The usual score is:

```text
s(x, psi) = 2^(-E[h(x)] / c(psi))
```

where `h(x)` is path length, `E[h(x)]` is the ensemble-average path length, `psi` is the subsample size, and `c(psi)` is the average unsuccessful-search path length used for normalization.

## The Axis-Aligned Bias Problem

Standard Isolation Forest builds each tree with axis-aligned splits: choose one feature, choose a split value inside that feature's observed range, and send the point left or right based on that coordinate.

Axis-aligned splits introduce directional structure into the score map. In two dimensions, similarly unusual points can receive different scores in rectangular bands around the data. These artifacts are particularly apparent for correlated features or distributions rotated relative to the coordinate axes.

## How EIF Changes the Split

Extended Isolation Forest, proposed by [Hariri, Carrasco Kind, and Brunner](https://doi.org/10.1109/TKDE.2019.2947676), replaces axis-aligned splits with random hyperplane splits. Each split samples a normal vector and a point in the node's bounding box. A point is routed by the sign of:

```text
(x - p) · n
```

where `x` is the scored point, `p` is the sampled point on the split plane, and `n` is the random normal vector.

The main parameter is `extensionLevel`, which controls how many coordinates participate in each hyperplane:

- **`extensionLevel = 0`**: one coordinate is non-zero, giving axis-aligned EIF behavior.
- **`extensionLevel = numFeatures - 1`**: all coordinates can be non-zero, giving fully extended hyperplanes.
- **Intermediate values**: provide a continuum between the two.

On a dataset with 10 features, `extensionLevel = 3` selects 4 non-zero coordinates for each split’s normal vector; `extensionLevel = 9` permits all 10.

When `maxFeatures` selects a subset of features for a tree, `extensionLevel` is defined within that subset. Its maximum value is one less than the number of features available to the tree.

At `extensionLevel = 0`, each EIF split uses one coordinate, but the implementation still follows the EIF reference algorithm. Standard IF retries when it selects a constant feature; the implementations also differ in intercept sampling and random-number consumption.

## Synthetic-data comparisons
{: #seeing-the-difference }

These library-generated heatmaps compare standard Isolation Forest (left) with fully extended EIF (right) on three synthetic datasets.

![Single blob heatmap: Standard Isolation Forest vs Extended Isolation Forest]({{ '/assets/images/single_blob_heatmap.svg' | relative_url }})

*Single blob: EIF produces more radial score contours where standard IF shows axis-aligned artifacts.*

![Two blobs heatmap: Standard Isolation Forest vs Extended Isolation Forest]({{ '/assets/images/two_blobs_heatmap.svg' | relative_url }})

*Two blobs: EIF produces fewer ghost-like score artifacts between and around the clusters.*

![Sinusoid heatmap: Standard Isolation Forest vs Extended Isolation Forest]({{ '/assets/images/sinusoid_heatmap.svg' | relative_url }})

*Sinusoid: EIF better tracks the non-axis-aligned data distribution.*

The low-score bands show where standard IF can under-score unusual points in these synthetic datasets.

{% include site/if-demo.html %}

## Benchmark Results

I benchmarked three configurations across 13 standard outlier-detection datasets:

- Standard Isolation Forest
- EIF with `extensionLevel = 0`
- Fully extended EIF

I compared the results against the original Liu et al. Isolation Forest paper and the reference Python EIF implementation from Hariri et al. All experiments used 100 trees, 256 samples per tree, and 10 trials with distinct random seeds.

In a [separate sweep on Ionosphere](https://github.com/linkedin/isolation-forest/pull/79), AUROC increased from about **0.86** at `extensionLevel = 0` to about **0.91** at full extension, with intermediate levels improving along the way.

Fully extended EIF improved Ionosphere and Satellite, had similar AUROC on Arrhythmia and Cardio, and performed worse on Mulcross and HTTP.

| Dataset | Dim | Standard IF AUROC | Standard IF AUPRC | Fully extended EIF AUROC | Fully extended EIF AUPRC |
|---|---:|---:|---:|---:|---:|
| Ionosphere | 33 | 0.84 | 0.80 | 0.91 | 0.88 |
| Satellite | 36 | 0.72 | 0.67 | 0.73 | 0.70 |
| Arrhythmia | 274 | 0.81 | 0.49 | 0.81 | 0.50 |
| Cardio | 21 | 0.93 | 0.57 | 0.93 | 0.54 |
| Mulcross | 4 | 0.99 | 0.85 | 0.94 | 0.44 |
| HTTP (KDDCUP99) | 3 | 0.9997 | 0.93 | 0.994 | 0.38 |

The [full benchmark table](https://github.com/linkedin/isolation-forest/blob/9de37cdcd0a1e8c9892f3ce9cfcd5da2f165cf3d/README.md#performance-and-benchmarks) includes AUROC, AUPRC, standard errors, and comparisons with Liu et al. and the reference Python EIF implementation at both extension endpoints.

## Implementation and validation
{: #validating-ai-produced-code-with-evidence }

Much of the implementation was AI-assisted. I compared the generated code with the EIF reference implementation using [heatmaps](#seeing-the-difference), [benchmark results](#benchmark-results), and edge-case tests. An early version retried degenerate splits to avoid empty partitions, while the reference implementation allowed zero-size leaves. The benchmark mismatch exposed this difference.

Spark 4.x save/load tests exposed another problem: the Avro-backed representation did not preserve the hyperplane weights at full double precision.

The checked-in tests cover training and scoring, parameter validation, persistence, and saved-model structure. They also exercise zero contamination, sparse hyperplane invariants, zero-size leaves, feature-dimension checks, and constant-feature cases.

I also ran a separate local edge-case study covering hyperparameter sweeps, contamination behavior, seed reproducibility, save/load equality, low-dimensional data, constant and all-constant features, and tiny datasets. All **61** checks passed; the saved output is linked in [PR #79](https://github.com/linkedin/isolation-forest/pull/79).

## Spark implementation
{: #implementation-highlights }

The new code implements hyperplane generation, storage, and node scoring within the existing Spark ML interfaces.

**Sparse hyperplane representation.** Each EIF split stores only the active coordinates of the random hyperplane: feature indices, weights, and offset. Dense normal vectors are not materialized. Model size and per-node scoring cost therefore scale with `extensionLevel + 1`, not with the full input dimensionality. With `extensionLevel = 3`, a node evaluates a four-term dot product.

**Spark ML integration.** EIF uses the same Spark ML `Estimator` / `Model` contract as standard Isolation Forest. It works in Spark ML `Pipeline`s and follows the same distributed model persistence pattern.

**Model persistence.** [Saved models](https://github.com/linkedin/isolation-forest/blob/9de37cdcd0a1e8c9892f3ce9cfcd5da2f165cf3d/isolation-forest/src/main/scala/com/linkedin/relevance/isolationforest/extended/ExtendedIsolationForestModelReadWrite.scala) store hyperplane weights as floats and offsets as doubles. [Scoring](https://github.com/linkedin/isolation-forest/blob/9de37cdcd0a1e8c9892f3ce9cfcd5da2f165cf3d/isolation-forest/src/main/scala/com/linkedin/relevance/isolationforest/extended/ExtendedUtils.scala) multiplies the float weights and feature values and accumulates the terms in a double. [Round-trip tests](https://github.com/linkedin/isolation-forest/blob/9de37cdcd0a1e8c9892f3ce9cfcd5da2f165cf3d/isolation-forest/src/test/scala/com/linkedin/relevance/isolationforest/extended/ExtendedIsolationForestModelWriteReadTest.scala) compare the saved and loaded tree parameters and predictions.

## Choosing between IF and EIF

Compare **standard Isolation Forest** with **EIF** on your data and tune `extensionLevel`. Full extension uses all features available to each tree; when every input feature is available, this corresponds to `extensionLevel = numFeatures - 1`. Intermediate levels may perform better. Use standard IF when ONNX export is required.

## Code and benchmarks
{: #getting-started }

<div id="resources" aria-hidden="true"></div>

The library’s artifacts are published to Maven Central.

- [isolation-forest repository](https://github.com/linkedin/isolation-forest)
- [Merged EIF PR #79](https://github.com/linkedin/isolation-forest/pull/79)
- [Benchmark details in the README](https://github.com/linkedin/isolation-forest#performance-and-benchmarks)
- [Synthetic benchmark scripts and reproduction instructions](https://github.com/linkedin/isolation-forest/blob/f64d7a7d7cab8ae89fadcf0f0384d1198ae23885/benchmarks/README.md)

## References

- F. T. Liu, K. M. Ting, and Z.-H. Zhou. "[Isolation Forest](https://doi.org/10.1109/ICDM.2008.17)." 2008 Eighth IEEE International Conference on Data Mining, 2008.
- S. Hariri, M. Carrasco Kind, and R. J. Brunner. "[Extended Isolation Forest](https://doi.org/10.1109/TKDE.2019.2947676)." IEEE Transactions on Knowledge and Data Engineering, 2021. Also available as [arXiv:1811.02141](https://arxiv.org/abs/1811.02141).
- S. Hariri. "[eif: Extended Isolation Forest for Anomaly Detection](https://github.com/sahandha/eif)."
- J. Verbus. "[isolation-forest](https://github.com/linkedin/isolation-forest)." Software, 2019. BSD-2-Clause.
