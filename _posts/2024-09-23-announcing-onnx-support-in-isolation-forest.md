---
layout: post
title: "Announcing ONNX Support in Isolation Forest"
description: "Exporting standard Isolation Forest models trained in Spark for inference with a compatible ONNX runtime."
og_image: "/assets/images/social/2024-09-23-announcing-onnx-support-in-isolation-forest-1200x630.jpg"
og_image_alt: "Announcing ONNX Support in Isolation Forest"
og_image_width: 1200
og_image_height: 630
last_modified_at: 2026-09-06
categories: ["AI and Machine Learning"]
tags: [LinkedIn, machine learning, isolation forest, ONNX, open source]
related:
  - /2026/03/18/announcing-extended-isolation-forest-support/
  - /2019/08/13/open-source-isolation-forest-spark-scala/
---

![ONNX support architecture for LinkedIn isolation forest]({{ '/assets/images/isolation_forest_onnx.png' | relative_url }}){: width="1280" height="720" style="width:90%; display: block; margin-left: 0;" }

We added an ONNX converter so models trained with the Spark/Scala library can be scored without starting a Spark job.

The [library](https://github.com/linkedin/isolation-forest), open-sourced in 2019, implements the algorithm introduced by [Liu et al. in 2008](https://doi.org/10.1109/ICDM.2008.17); the [original engineering article](https://www.linkedin.com/blog/engineering/data-management/isolation-forest) explains the algorithm and its use at LinkedIn.

## Why ONNX

Before the converter, scoring a saved model required loading it into the library inside a Spark job. Export to [ONNX](https://onnx.ai/) made inference possible with a compatible ONNX runtime. A service or streaming consumer is a possible use; the exported graph's operators must be supported by the selected runtime and backend.

## How the Converter Works

The converter was added as the Python module `isolation-forest-onnx` in [PR #53](https://github.com/linkedin/isolation-forest/pull/53), merged September 3, 2024. It reads the library's saved-model layout: `model_file_path` points to the Avro data file and `metadata_file_path` to the metadata file. It then emits an ONNX graph:

```python
from isolationforestonnx.isolation_forest_converter import IsolationForestConverter

converter = IsolationForestConverter(model_file_path, metadata_file_path)
converter.convert_and_save('isolation_forest.onnx')
```

The [converter's input contract](https://github.com/linkedin/isolation-forest/blob/ae6efe58db52a705151420ed6adcd556498a352b/isolation-forest-onnx/src/isolationforestonnx/isolation_forest_converter.py) names the input `features`, a float32 matrix shaped `[number of rows, number of training features]`. Supply numeric features in the same order used during training. The Python example uses ONNX Runtime, as do the tests; the graph includes `ai.onnx.ml` tree-ensemble operators, so support in another runtime or provider needs checking.

```python
import numpy as np
from onnxruntime import InferenceSession

session = InferenceSession('isolation_forest.onnx')
scores = session.run(None, {'features': features.astype(np.float32)})[0]
```

The package is on [PyPI](https://pypi.org/project/isolation-forest-onnx/). Pin the converter to the same version as the `isolation-forest` release that trained your model, as the README specifies.

## Comparing Spark and ONNX scores
{: #validated-by-parity }

The [original converter tests](https://github.com/linkedin/isolation-forest/blob/ae6efe58db52a705151420ed6adcd556498a352b/isolation-forest-onnx/test/test_isolation_forest_converter.py) compared benchmark AUROC with expected values. A [later end-to-end integration test, present in the March 2026 revision](https://github.com/linkedin/isolation-forest/blob/9de37cdcd0a1e8c9892f3ce9cfcd5da2f165cf3d/isolation-forest-onnx/test/integration/test_isolation_forest_onnx_integration.py), scores the same six-feature test data with the Spark model and exported ONNX graph, then compares their outputs. It passes float32 features to Python ONNX Runtime and asserts a maximum absolute score difference below `1e-5`.

## Scope

**Update (2026):** ONNX conversion covers the standard `IsolationForestModel`. The [Extended Isolation Forest]({{ '/2026/03/18/announcing-extended-isolation-forest-support/' | relative_url }}) models added to the library in 2026 use hyperplane splits that do not map onto the axis-aligned tree representation the converter targets, so EIF scoring stays in Spark for now.

## Resources

- <span id="blogs" aria-hidden="true"></span>[Announcing ONNX Support in LinkedIn’s Open-Source Isolation Forest Library](https://www.linkedin.com/pulse/announcing-onnx-support-linkedins-open-source-isolation-james-verbus-paoqe/)
- [Detecting and preventing abuse on LinkedIn using isolation forests](https://www.linkedin.com/blog/engineering/data-management/isolation-forest)
- [Open Source: Spark/Scala Isolation Forest Library]({{ '/2019/08/13/open-source-isolation-forest-spark-scala/' | relative_url }})
- <span id="github" aria-hidden="true"></span>[isolation forest](https://github.com/linkedin/isolation-forest)
- [PR #53: converter implementation and Gradle integration for the Scala and Python modules](https://github.com/linkedin/isolation-forest/pull/53)
- <span id="pypi" aria-hidden="true"></span>[isolation-forest-onnx](https://pypi.org/project/isolation-forest-onnx/)
