---
layout: post
title: "Adding Extended Isolation Forest to the Spark/Scala Isolation Forest Library I Created"
description: "Extended Isolation Forest support for the open-source Spark/Scala isolation-forest library I created, including random hyperplane splits, benchmarks, synthetic plots, and validation evidence."
last_modified_at: 2026-03-18
og_image: "/assets/images/social/2026-03-18-announcing-extended-isolation-forest-support-1200x630.jpg"
og_image_alt: "Adding Extended Isolation Forest to the open-source isolation-forest library"
og_image_width: 1200
og_image_height: 630
categories: ["AI and Machine Learning"]
tags: [isolation forest, extended isolation forest, anomaly detection, outlier detection, Spark, Scala, open source]
---

I've added **Extended Isolation Forest (EIF)** to the open-source `isolation-forest` library I created. EIF replaces axis-aligned splits with random hyperplane splits, reducing score artifacts that standard Isolation Forest can produce and improving anomaly detection in cases where axis-aligned bias is a real limitation.

<p>
  <a href="https://github.com/linkedin/isolation-forest" aria-label="Open isolation-forest on GitHub">
    <img class="project-logo" src="{{ '/assets/images/isolation_forest.svg' | relative_url }}" alt="Isolation Forest logo" width="331" height="326" loading="lazy" decoding="async">
  </a>
</p>

I originally created and open-sourced this Spark/Scala implementation in 2019. It is used widely in production and supports distributed training and scoring, Spark ML pipeline integration, model persistence, and ONNX export for standard Isolation Forest. EIF landed in [PR #79](https://github.com/linkedin/isolation-forest/pull/79) on March 18, 2026, was introduced in `v4.1.0`, and is now available in the [`isolation-forest` repository](https://github.com/linkedin/isolation-forest).

EIF is additive: existing standard Isolation Forest APIs, typical Spark ML pipelines, saved-model loading, and standard-IF ONNX export behavior remain backward-compatible. The release also tightens validation for invalid edge cases, such as empty ensembles, too-small `maxSamples` values, and feature vectors whose dimension does not match the model's known training dimension.

## The axis-aligned bias problem

Standard Isolation Forest, introduced by [Liu, Ting, and Zhou in 2008](https://doi.org/10.1109/ICDM.2008.17), builds an ensemble of random binary trees. At each node, the algorithm selects one feature and a random split value to partition the data. Because every split is aligned with a single feature axis, the algorithm has a directional bias.

In practice, that bias shows up as score-map artifacts: axis-aligned splits can create rectangular bands and ghost-like regions where areas that are similarly far from the training data receive inconsistent anomaly scores.

The practical consequence is unreliable scoring. The score contours can reflect partition geometry rather than the data distribution, assign inconsistent scores to similarly unusual points, and under-score anomalies that fall in ghost-like low-score regions.

This matters most when features are correlated or when the geometry of the data does not line up neatly with individual coordinate axes, which is common in real-world datasets.

## How Extended Isolation Forest works

Extended Isolation Forest, proposed by [Hariri, Carrasco Kind, and Brunner](https://doi.org/10.1109/TKDE.2019.2947676), generalizes standard Isolation Forest by replacing axis-aligned splits with **random hyperplane splits**.

Instead of choosing one feature and one threshold, each split is defined by a random normal vector and an offset that together specify a hyperplane. A point is sent left or right depending on which side of that hyperplane it falls.

The key parameter is `extensionLevel`, which controls how many coordinates participate in each hyperplane:

- **`extensionLevel = 0`**: one coordinate is non-zero, giving axis-aligned EIF behavior.
- **`extensionLevel = numFeatures - 1`**: all coordinates can be non-zero, giving fully extended hyperplanes.
- **Intermediate values**: provide a continuum between the two.

Concretely, on a 10-feature dataset, `extensionLevel = 3` means each split uses 4 non-zero coordinates in its hyperplane normal vector. `extensionLevel = 9` means each split can use all 10 features.

In the implementation, the valid range is based on the resolved feature subspace for each tree. If `maxFeatures` restricts each tree to a subset of features, `extensionLevel` is interpreted relative to that subspace rather than the original input dimensionality.

One detail is worth making explicit: `extensionLevel = 0` is intentionally close to standard Isolation Forest, but it is not identical. Standard IF retries when it samples a constant feature; EIF follows the reference EIF split semantics, which matters for parity with the original Python and C++ implementations.

## Seeing the difference

The effect is especially easy to see in two dimensions. The following heatmaps, generated with the library, show outlier scores across the feature space for three synthetic datasets.

In each case, Standard Isolation Forest on the left shows cross-shaped artifacts along the feature axes, while Extended Isolation Forest on the right produces smoother, less axis-biased contours.

![Single blob heatmap: Standard Isolation Forest vs Extended Isolation Forest]({{ '/assets/images/single_blob_heatmap.svg' | relative_url }}){: style="width:100%; display:block; margin-left:0;" }

*Single blob: EIF produces more radial score contours where standard IF shows axis-aligned artifacts.*

![Two blobs heatmap: Standard Isolation Forest vs Extended Isolation Forest]({{ '/assets/images/two_blobs_heatmap.svg' | relative_url }}){: style="width:100%; display:block; margin-left:0;" }

*Two blobs: EIF produces fewer ghost-like score artifacts between and around the clusters.*

![Sinusoid heatmap: Standard Isolation Forest vs Extended Isolation Forest]({{ '/assets/images/sinusoid_heatmap.svg' | relative_url }}){: style="width:100%; display:block; margin-left:0;" }

*Sinusoid: EIF better tracks the non-axis-aligned data distribution.*

These artifacts are not just cosmetic. They correspond to regions where a model can assign inconsistent anomaly scores, including under-scoring unusual points that happen to fall in ghost-like low-score regions.

The plots also served as validation artifacts. If the EIF implementation still produced the same cross-shaped artifacts as standard IF, or if the score contours did not track the known synthetic structure, that would have been a strong signal that something was wrong.

## Benchmark results

I benchmarked three configurations across 13 standard outlier-detection datasets:

- Standard Isolation Forest
- EIF with `extensionLevel = 0`
- Fully extended EIF

I also compared the results against the original Liu et al. Isolation Forest paper and the reference Python EIF implementation from Hariri et al. All experiments used 100 trees, 256 samples per tree, and 10 trials with distinct random seeds.

These benchmarks are endpoint comparisons, not an exhaustive `extensionLevel` sweep. They validate the standard IF implementation, the axis-aligned EIF endpoint, and the fully extended EIF endpoint against published and reference implementations.

I have not yet systematically benchmarked intermediate extension levels across all 13 datasets, but I did run a targeted sweep on Ionosphere. In that sweep, AUROC increased from about **0.86** at `extensionLevel = 0` to about **0.91** at full extension, with intermediate values improving along the way.

The most important result is not that EIF is universally better. The result is more specific: **fully extended EIF helps most when axis-aligned bias is actually a limitation.**

The higher-dimensional datasets showed the clearest gains from fully extended EIF. On the four datasets in this benchmark suite with at least 21 dimensions, fully extended EIF improved AUROC on all four. In that subset, the mean AUROC improvement was **+0.02** and the median improvement was **+0.007**. AUPRC improved on three of the four, with mean improvement **+0.02** and median improvement **+0.017**.

A few representative results:

| Dataset | Dim | Standard IF AUROC | Standard IF AUPRC | Fully extended EIF AUROC | Fully extended EIF AUPRC | Takeaway |
|---|---:|---:|---:|---:|---:|---|
| Ionosphere | 33 | 0.84 | 0.80 | 0.91 | 0.88 | EIF higher |
| Satellite | 36 | 0.72 | 0.67 | 0.73 | 0.70 | EIF higher |
| Arrhythmia | 274 | 0.81 | 0.49 | 0.81 | 0.50 | Comparable |
| Cardio | 21 | 0.93 | 0.57 | 0.93 | 0.54 | Comparable |
| Mulcross | 4 | 0.99 | 0.85 | 0.94 | 0.44 | Standard IF higher |
| HTTP (KDDCUP99) | 3 | 0.9997 | 0.93 | 0.994 | 0.38 | Standard IF higher |

The parity checks were also important:

- My standard IF results closely match the original Liu et al. paper.
- My fully extended EIF results closely match the reference Python EIF implementation.
- EIF with `extensionLevel = 0` closely matches the reference EIF implementation at the same extension level.

That gives me confidence that the implementation is behaving as intended.

The full benchmark table, including AUROC/AUPRC results, standard errors, Liu et al. comparisons, and reference Python EIF comparisons, is available in the repository README.

## Validating AI-produced code with evidence

Because much of this implementation was AI-assisted, I treated validation artifacts as first-class outputs.

Instead of relying on line-by-line review alone, I asked for evidence that would be easy to inspect and difficult for a broken implementation to satisfy:

- score heatmaps on synthetic datasets where the expected behavior is visually obvious
- benchmark comparisons against the original Isolation Forest paper and the reference Python EIF implementation
- AUROC/AUPRC comparisons between Spark EIF and the reference Python EIF implementation
- edge-case tests for degenerate splits, persistence, constant features, tiny datasets, seed reproducibility, and invalid parameter values

The plots were especially useful. On simple two-dimensional datasets, standard Isolation Forest should show axis-aligned artifacts, and EIF should reduce them. That gives a quick visual check that the implementation has the expected qualitative behavior before reviewing lower-level code paths.

The validation artifacts also caught real issues.

One example was degenerate split handling. An early implementation attempted to avoid empty partitions and retry degenerate splits. Benchmark mismatches showed that the correct behavior was to match the EIF reference implementation and allow zero-size leaves.

Another example was persistence. Spark 4.x save/load validation exposed a precision mismatch in the Avro-backed model representation: hyperplane weights did not round-trip at full double precision.

A third example was `extensionLevel = 0`. It produces axis-aligned EIF splits, but it is not identical to standard Isolation Forest. The split direction is similar, but retry behavior, intercept sampling, and random-number consumption differ. The benchmark and edge-case comparisons made that distinction visible.

The checked-in tests covered the parts that visual inspection cannot: training and scoring, parameter validation, persistence, zero contamination, saved-model structure, sparse hyperplane invariants, zero-size leaves, feature-dimension validation, and constant-feature edge cases.

I also ran a separate edge-case study outside the main benchmark table. It covered hyperparameter sweeps, contamination behavior, seed reproducibility, save/load equality, low-dimensional data, constant-feature data, all-constant data, and tiny datasets. All **61 / 61** checks passed.

The point was not to choose between tests and plots. The tests protected invariants and the plots made model behavior visually verifiable.

The workflow that worked best was:

1. define what correctness should look like
2. generate artifacts that would falsify the implementation if it were wrong
3. inspect those artifacts first
4. review the code paths behind surprising results

AI did not replace review. It changed the review target from "read every generated line" to "evaluate the evidence, then inspect where it matters."

## Implementation highlights

The EIF implementation keeps the public Spark ML surface aligned with standard Isolation Forest, while isolating the new behavior to split generation, split representation, and node scoring.

**Sparse hyperplane representation.** Each EIF split stores only the active coordinates of the random hyperplane: feature indices, weights, and offset. Dense normal vectors are not materialized. Model size and per-node scoring cost therefore scale with `extensionLevel + 1`, not with the full input dimensionality. With `extensionLevel = 3`, a node evaluates a four-term dot product.

**Spark ML integration.** EIF uses the same Spark ML `Estimator` / `Model` contract as standard Isolation Forest. It can be used in Spark ML `Pipeline`s and follows the same distributed model persistence pattern.

**Persistence across Spark versions.** Spark 4.x save/load validation exposed a precision mismatch in the Avro-backed model representation: hyperplane weights did not round-trip at full double precision.

The persisted schema now makes the intended precision explicit: hyperplane weights are stored as floats, offsets are stored as doubles, and scoring accumulates the sparse dot product in double precision.

That split matches the role of each value. The weights encode a random direction, where float precision is sufficient; the offset fixes the split location and remains double precision so the decision boundary is stable across save/load.

## Choosing between IF and EIF

I treat **standard Isolation Forest** as the default baseline, especially when the data is low-dimensional, axis-aligned splits already work well, or ONNX export is required.

I reach for **Extended Isolation Forest** when my data has correlated features, when standard Isolation Forest produces suspicious axis-aligned score patterns, or when I want a more orientation-robust anomaly detector.

When I use EIF, I treat `extensionLevel` as a hyperparameter. `extensionLevel = numFeatures - 1` is a useful default and an important reference point, but it is not a guarantee of best performance. Intermediate values can be the right compromise when fully extended splits are not the best empirical fit.

## Getting started

The library is available in the [`isolation-forest` repository](https://github.com/linkedin/isolation-forest), with artifacts published to Maven Central. Full documentation, examples, and benchmark details are in the project README. The synthetic plot scripts are linked from the Resources section below.

## Resources

- [isolation-forest repository](https://github.com/linkedin/isolation-forest)
- [Merged EIF PR #79](https://github.com/linkedin/isolation-forest/pull/79)
- [Benchmark details in the README](https://github.com/linkedin/isolation-forest#performance-and-benchmarks)
- [Synthetic benchmark scripts and reproduction instructions](https://github.com/linkedin/isolation-forest/blob/f64d7a7d7cab8ae89fadcf0f0384d1198ae23885/benchmarks/README.md)

## References

- F. T. Liu, K. M. Ting, and Z.-H. Zhou. "[Isolation Forest](https://doi.org/10.1109/ICDM.2008.17)." 2008 Eighth IEEE International Conference on Data Mining, 2008.
- S. Hariri, M. Carrasco Kind, and R. J. Brunner. "[Extended Isolation Forest](https://doi.org/10.1109/TKDE.2019.2947676)." IEEE Transactions on Knowledge and Data Engineering, 2021. Also available as [arXiv:1811.02141](https://arxiv.org/abs/1811.02141).
- S. Hariri. "[eif: Extended Isolation Forest for Anomaly Detection](https://github.com/sahandha/eif)."
- J. Verbus. "[isolation-forest](https://github.com/linkedin/isolation-forest)." Software, 2019. BSD-2-Clause.
