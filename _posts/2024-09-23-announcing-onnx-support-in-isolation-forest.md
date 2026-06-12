---
layout: post
title: "Announcing ONNX Support in Isolation Forest"
description: "LinkedIn's open-source isolation forest library now supports ONNX export, enabling deployment beyond Spark for streaming and edge inference applications."
og_image: "/assets/images/social/2024-09-23-announcing-onnx-support-in-isolation-forest-1200x630.jpg"
og_image_alt: "Announcing ONNX Support in Isolation Forest"
og_image_width: 1200
og_image_height: 630
last_modified_at: 2026-06-10
categories: ["AI and Machine Learning"]
tags: [LinkedIn, machine learning, isolation forest, ONNX, open source]
related:
  - /2026/03/18/announcing-extended-isolation-forest-support/
  - /2019/08/13/open-source-isolation-forest-spark-scala/
  - /2021/09/02/using-deep-learning-to-detect-abusive-sequences-of-member-activity/
---

![ONNX support architecture for LinkedIn isolation forest]({{ '/assets/images/isolation_forest_onnx.png' | relative_url }}){: width="1280" height="720" style="width:90%; display: block; margin-left: 0;" }

I'm excited to announce that we've added an ONNX converter to our open-source isolation forest library on GitHub!

ONNX model format export capability is now available: [GitHub - LinkedIn Isolation Forest](https://github.com/linkedin/isolation-forest)

The library brings the isolation forest algorithm to Spark and Scala at distributed scale. The algorithm, first proposed by [Liu et al. in 2008](https://doi.org/10.1109/ICDM.2008.17), is an unsupervised approach to outlier detection that isolates anomalies with ensembles of randomized binary trees. We open-sourced the library in 2019, and the background story is covered in an earlier [LinkedIn engineering blog post](https://www.linkedin.com/blog/engineering/data-management/isolation-forest).

## Why ONNX

Until now, a trained model was saved in the library's own persistence format, which in practice meant loading it back into the library inside a Spark job. That is fine for offline batch scoring and a real constraint everywhere else. Plenty of anomaly detection belongs in places Spark does not go: a fraud check inside a low-latency service, a streaming consumer, a lightweight monitor running close to the data source.

The new converter turns a trained model into [ONNX](https://onnx.ai/), an open interchange format with runtimes for servers, browsers, and edge devices. The workflow becomes: train the forest once at Spark scale, then score wherever an ONNX runtime can go.

## How the Converter Works

The converter ships as a Python module, `isolation-forest-onnx`, living in the same repository as the Scala library ([PR #53](https://github.com/linkedin/isolation-forest/pull/53), merged September 3, 2024, with the Gradle build extended so the Scala and Python modules coexist). It reads a model straight from the library's saved-model layout (the Avro data file plus the metadata file) and emits an ONNX graph:

```python
from isolationforestonnx.isolation_forest_converter import IsolationForestConverter

converter = IsolationForestConverter(model_file_path, metadata_file_path)
converter.convert_and_save('isolation_forest.onnx')
```

Scoring then needs nothing but an ONNX runtime:

```python
import numpy as np
from onnxruntime import InferenceSession

session = InferenceSession('isolation_forest.onnx')
scores = session.run(None, {'features': features.astype(np.float32)})[0]
```

The package is on [PyPI](https://pypi.org/project/isolation-forest-onnx/). One practical note from the README: pin the converter to the same version as the `isolation-forest` release that trained your model.

## Validated by Parity

The correctness bar for a format converter is simple to state: the converted model must produce the same scores as the original. The module ships with unit tests and end-to-end correctness tests that score the same data through both the Spark/Scala model and the converted ONNX model and compare the outputs. Score parity on real test data is the evidence that the conversion preserves the model.

## Scope

**Update (2026):** ONNX conversion covers the standard `IsolationForestModel`. The [Extended Isolation Forest]({{ '/2026/03/18/announcing-extended-isolation-forest-support/' | relative_url }}) models added to the library in 2026 use hyperplane splits that do not map onto the axis-aligned tree representation the converter targets, so EIF scoring stays in Spark for now.

## Resources

### Blogs

- [Announcing ONNX Support in LinkedIn’s Open-Source Isolation Forest Library](https://www.linkedin.com/pulse/announcing-onnx-support-linkedins-open-source-isolation-james-verbus-paoqe/)
- [Detecting and preventing abuse on LinkedIn using isolation forests](https://www.linkedin.com/blog/engineering/data-management/isolation-forest)
- [Open Source: Spark/Scala Isolation Forest Library]({{ '/2019/08/13/open-source-isolation-forest-spark-scala/' | relative_url }})

### GitHub

- [isolation forest](https://github.com/linkedin/isolation-forest)
- [PR #53: the ONNX converter module](https://github.com/linkedin/isolation-forest/pull/53)

### PyPI

- [isolation-forest-onnx](https://pypi.org/project/isolation-forest-onnx/)
