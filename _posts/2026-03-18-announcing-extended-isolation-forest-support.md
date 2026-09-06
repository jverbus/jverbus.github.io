---
layout: post
title: "Extended Isolation Forest for Distributed Spark/Scala Anomaly Detection"
description: "Adding Extended Isolation Forest to the Spark/Scala library and comparing it with the reference implementation."
last_modified_at: 2026-09-06
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

I added **Extended Isolation Forest (EIF)** to LinkedIn's open-source Spark/Scala `isolation-forest` library. EIF keeps the same isolation-score idea as standard Isolation Forest, but changes the split geometry: instead of partitioning one feature at a time, it partitions with random hyperplanes.

<p>
  <a href="https://github.com/linkedin/isolation-forest" aria-label="Open isolation-forest on GitHub">
    <img src="{{ '/assets/images/isolation_forest.svg' | relative_url }}" alt="Isolation Forest logo" width="331" height="326" loading="lazy" decoding="async">
  </a>
</p>

I originally created and open-sourced this Spark/Scala implementation in 2019. The [original engineering article](https://www.linkedin.com/blog/engineering/data-management/isolation-forest) describes its production use across several abuse-detection areas at LinkedIn. The library supports distributed training and scoring, Spark ML pipeline integration, model persistence, and ONNX export for standard Isolation Forest. EIF landed in [PR #79](https://github.com/linkedin/isolation-forest/pull/79) on March 18, 2026, was introduced in `v4.1.0`, and is available in the [`isolation-forest` repository](https://github.com/linkedin/isolation-forest).

The change is additive. Existing standard Isolation Forest APIs, Spark ML pipelines, saved-model loading, and standard-IF ONNX export behavior remain backward-compatible. The release also tightens validation for edge cases such as empty ensembles, too-small `maxSamples` values, and feature vectors whose dimension does not match the model's training dimension.

## The Scoring Model

Standard Isolation Forest, introduced by [Liu, Ting, and Zhou in 2008](https://doi.org/10.1109/ICDM.2008.17), scores points by how quickly random trees isolate them. Points isolated by shorter paths receive higher anomaly scores; points that require longer paths receive lower scores.

The usual score is:

```text
s(x, psi) = 2^(-E[h(x)] / c(psi))
```

where `h(x)` is path length, `E[h(x)]` is the ensemble-average path length, `psi` is the subsample size, and `c(psi)` is the average unsuccessful-search path length used for normalization.

## The Axis-Aligned Bias Problem

Standard Isolation Forest builds each tree with axis-aligned splits: choose one feature, choose a split value inside that feature's observed range, and send the point left or right based on that coordinate.

That works well in many settings, but it gives the score map a directional bias. In two dimensions, the artifacts are visible as rectangular bands and ghost-like regions where similarly unusual points receive inconsistent scores. The problem is most obvious when features are correlated or when the data distribution is rotated relative to the coordinate axes.

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

Concretely, on a 10-feature dataset, `extensionLevel = 3` means each split uses 4 non-zero coordinates in its hyperplane normal vector. `extensionLevel = 9` means each split can use all 10 features.

In the implementation, the valid range is based on the resolved feature subspace for each tree. If `maxFeatures` restricts each tree to a subset of features, `extensionLevel` is interpreted relative to that subspace rather than the original input dimensionality.

`extensionLevel = 0` is close to standard Isolation Forest, but is not identical. Standard IF retries when it samples a constant feature; EIF follows the reference EIF split semantics, which matters when comparing it with the original Python and C++ implementations.

## Seeing the Difference

These library-generated heatmaps compare standard Isolation Forest (left) with fully extended EIF (right) on three synthetic datasets.

![Single blob heatmap: Standard Isolation Forest vs Extended Isolation Forest]({{ '/assets/images/single_blob_heatmap.svg' | relative_url }})

*Single blob: EIF produces more radial score contours where standard IF shows axis-aligned artifacts.*

![Two blobs heatmap: Standard Isolation Forest vs Extended Isolation Forest]({{ '/assets/images/two_blobs_heatmap.svg' | relative_url }})

*Two blobs: EIF produces fewer ghost-like score artifacts between and around the clusters.*

![Sinusoid heatmap: Standard Isolation Forest vs Extended Isolation Forest]({{ '/assets/images/sinusoid_heatmap.svg' | relative_url }})

*Sinusoid: EIF better tracks the non-axis-aligned data distribution.*

The low-score bands show where standard IF can under-score unusual points. These plots check the expected qualitative geometry; they do not establish performance on other datasets.

{% include site/if-demo.html %}

## Benchmark Results

I benchmarked three configurations across 13 standard outlier-detection datasets:

- Standard Isolation Forest
- EIF with `extensionLevel = 0`
- Fully extended EIF

I compared the results against the original Liu et al. Isolation Forest paper and the reference Python EIF implementation from Hariri et al. All experiments used 100 trees, 256 samples per tree, and 10 trials with distinct random seeds.

These benchmarks compare the standard IF, axis-aligned EIF, and fully extended EIF endpoints against published and reference results. They do not sweep every `extensionLevel`.

I have not yet systematically benchmarked intermediate extension levels across all 13 datasets, but I did run a targeted sweep on Ionosphere. The [saved study output in PR #79](https://github.com/linkedin/isolation-forest/pull/79) reports AUROC increasing from about **0.86** at `extensionLevel = 0` to about **0.91** at full extension, with intermediate values improving along the way.

EIF improved some datasets and reduced performance on others; the table shows both. Fully extended EIF improved Ionosphere and Satellite, had similar AUROC on Arrhythmia and Cardio, and performed worse on Mulcross and HTTP. These endpoint comparisons do not isolate dimensionality or axis alignment as the cause of the differences.

| Dataset | Dim | Standard IF AUROC | Standard IF AUPRC | Fully extended EIF AUROC | Fully extended EIF AUPRC |
|---|---:|---:|---:|---:|---:|
| Ionosphere | 33 | 0.84 | 0.80 | 0.91 | 0.88 |
| Satellite | 36 | 0.72 | 0.67 | 0.73 | 0.70 |
| Arrhythmia | 274 | 0.81 | 0.49 | 0.81 | 0.50 |
| Cardio | 21 | 0.93 | 0.57 | 0.93 | 0.54 |
| Mulcross | 4 | 0.99 | 0.85 | 0.94 | 0.44 |
| HTTP (KDDCUP99) | 3 | 0.9997 | 0.93 | 0.994 | 0.38 |

The [full benchmark table](https://github.com/linkedin/isolation-forest/blob/9de37cdcd0a1e8c9892f3ce9cfcd5da2f165cf3d/README.md#performance-and-benchmarks) includes AUROC/AUPRC, standard errors, comparisons with Liu et al., and comparisons with the reference Python EIF implementation at both extension endpoints. Agreement on these datasets is one check on the implementation, alongside the edge-case tests below.

## Validating AI-Produced Code With Evidence

An early implementation retried degenerate splits to avoid empty partitions. Benchmark mismatches exposed the difference from the EIF reference implementation, which allows zero-size leaves. Much of this implementation was AI-assisted; I used the [heatmaps](#seeing-the-difference), [reference comparisons](#benchmark-results), and edge-case tests to investigate generated code, then reviewed the code paths behind mismatches.

Another example was persistence. Spark 4.x save/load validation exposed a precision mismatch in the Avro-backed model representation: hyperplane weights did not round-trip at full double precision.

A third example was `extensionLevel = 0`. It produces axis-aligned EIF splits, but it is not identical to standard Isolation Forest. The split direction is similar, but retry behavior, intercept sampling, and random-number consumption differ. The benchmark and edge-case comparisons made that distinction visible.

The checked-in tests covered the parts that visual inspection cannot: training and scoring, parameter validation, persistence, zero contamination, saved-model structure, sparse hyperplane invariants, zero-size leaves, feature-dimension validation, and constant-feature edge cases.

I also ran a separate local edge-case study outside the checked-in test suite and main benchmark table. It covered hyperparameter sweeps, contamination behavior, seed reproducibility, save/load equality, low-dimensional data, constant-feature data, all-constant data, and tiny datasets. The [saved output in PR #79](https://github.com/linkedin/isolation-forest/pull/79) reports **61 / 61** checks passed. That output records the study result; reproducing the full study also requires its script and complete configuration.

## Implementation Highlights

The EIF implementation keeps the public Spark ML surface aligned with standard Isolation Forest, while isolating the new behavior to split generation, split representation, and node scoring.

**Sparse hyperplane representation.** Each EIF split stores only the active coordinates of the random hyperplane: feature indices, weights, and offset. Dense normal vectors are not materialized. Model size and per-node scoring cost therefore scale with `extensionLevel + 1`, not with the full input dimensionality. With `extensionLevel = 3`, a node evaluates a four-term dot product.

**Spark ML integration.** EIF uses the same Spark ML `Estimator` / `Model` contract as standard Isolation Forest. It works in Spark ML `Pipeline`s and follows the same distributed model persistence pattern.

**Persistence across Spark versions.** The [persisted schema](https://github.com/linkedin/isolation-forest/blob/9de37cdcd0a1e8c9892f3ce9cfcd5da2f165cf3d/isolation-forest/src/main/scala/com/linkedin/relevance/isolationforest/extended/ExtendedIsolationForestModelReadWrite.scala) stores hyperplane weights as floats and offsets as doubles. [Scoring](https://github.com/linkedin/isolation-forest/blob/9de37cdcd0a1e8c9892f3ce9cfcd5da2f165cf3d/isolation-forest/src/main/scala/com/linkedin/relevance/isolationforest/extended/ExtendedUtils.scala) multiplies float weights and feature values and accumulates the terms in a double. The [round-trip tests](https://github.com/linkedin/isolation-forest/blob/9de37cdcd0a1e8c9892f3ce9cfcd5da2f165cf3d/isolation-forest/src/test/scala/com/linkedin/relevance/isolationforest/extended/ExtendedIsolationForestModelWriteReadTest.scala) compare saved and loaded tree parameters and predictions on their test data. These checks do not establish a general bound on quantization error for arbitrary inputs.

## Choosing between IF and EIF

Compare **standard Isolation Forest** and **EIF** on your data, and tune `extensionLevel` when using EIF. Correlated features or axis-aligned score artifacts are reasons to try EIF; full extension (`extensionLevel = numFeatures - 1`) is a reference point, and intermediate levels may perform better. Use standard IF when ONNX export is required.

## Code and benchmarks
{: #getting-started }

<div id="resources" aria-hidden="true"></div>

The library's artifacts are published to Maven Central. Documentation, examples, and reproduction instructions are linked below.

- [isolation-forest repository](https://github.com/linkedin/isolation-forest)
- [Merged EIF PR #79](https://github.com/linkedin/isolation-forest/pull/79)
- [Benchmark details in the README](https://github.com/linkedin/isolation-forest#performance-and-benchmarks)
- [Synthetic benchmark scripts and reproduction instructions](https://github.com/linkedin/isolation-forest/blob/f64d7a7d7cab8ae89fadcf0f0384d1198ae23885/benchmarks/README.md)

## References

- F. T. Liu, K. M. Ting, and Z.-H. Zhou. "[Isolation Forest](https://doi.org/10.1109/ICDM.2008.17)." 2008 Eighth IEEE International Conference on Data Mining, 2008.
- S. Hariri, M. Carrasco Kind, and R. J. Brunner. "[Extended Isolation Forest](https://doi.org/10.1109/TKDE.2019.2947676)." IEEE Transactions on Knowledge and Data Engineering, 2021. Also available as [arXiv:1811.02141](https://arxiv.org/abs/1811.02141).
- S. Hariri. "[eif: Extended Isolation Forest for Anomaly Detection](https://github.com/sahandha/eif)."
- J. Verbus. "[isolation-forest](https://github.com/linkedin/isolation-forest)." Software, 2019. BSD-2-Clause.
