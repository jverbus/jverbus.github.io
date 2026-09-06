---
layout: post
title: "Finding AI-Generated Faces in the Wild"
description: "Evaluating synthetic-face detection across GAN and diffusion engines, including held-out generators and reduced image quality."
og_image: "/assets/images/social/2024-08-15-finding-ai-generated-faces-in-the-wild-1200x630.jpg"
og_image_alt: "Finding AI-Generated Faces in the Wild"
og_image_width: 1200
og_image_height: 630
last_modified_at: 2026-09-06
categories: ["AI and Machine Learning"]
tags: [LinkedIn, machine learning, AI, Generative AI, deepfake]
related:
  - /2023/06/20/detecting-ai-generated-profile-photos/
  - /2021/09/02/using-deep-learning-to-detect-abusive-sequences-of-member-activity/
---

Our [2023 detector]({{ '/2023/06/20/detecting-ai-generated-profile-photos/' | relative_url }}) exploited the rigid facial geometry of StyleGAN images. But the generative landscape did not hold still. Stable Diffusion, DALL-E 2, and Midjourney could also generate faces, without StyleGAN's alignment. Upload pipelines could then downscale and recompress those images.

In *Finding AI-Generated Faces in the Wild*, our LinkedIn team and Professor Hany Farid at UC Berkeley evaluated detection across GAN and diffusion engines, including generators withheld from training. We also tested reduced resolution and JPEG compression, using separately resolution-matched models for the small-image results. We published this [coauthored paper]({{ '/assets/files/porcile2024-finding-ai-generated-faces-in-the-wild.pdf' | relative_url }}#page=1) at the [Workshop on Media Forensics](https://sites.google.com/view/wmf2024/home) at CVPR 2024.

This post describes the model evaluated in that paper. [Section 3, footnote 7]({{ '/assets/files/porcile2024-finding-ai-generated-faces-in-the-wild.pdf' | relative_url }}#page=4) identifies it as an older LinkedIn model that had already been replaced when the paper was published.

## One Classifier, Ten Engines

We trained and evaluated against 18 datasets: 120,000 real profile photos from LinkedIn members, plus another 105,900 synthetic images spanning ten generation engines. The GAN side includes generated.photos, StyleGAN 1 through 3, and EG3D; the diffusion side includes DALL-E 2, Midjourney, and Stable Diffusion 1, 2, and xl. Six engines were used for training; four were held out entirely to test generalization.

<img src="{{ '/assets/images/ai-faces-wild-engines.jpg' | relative_url }}" alt="Grid of representative AI-generated face and non-face images from ten synthesis engines including generated.photos, StyleGAN 1 to 3, EG3D, DALL-E 2, Midjourney, and Stable Diffusion variants" width="1253" height="1648" loading="lazy" decoding="async">

*Representative AI-generated images from the ten synthesis engines used for training and evaluation. Some engines contribute faces only; others contribute both faces and non-face images. (Figure 2 of the paper; dataset counts in Table 1.)*

At a fixed 0.5% false positive rate, the classifier detected 98% of AI-generated faces from engines seen in training. [Table 2]({{ '/assets/files/porcile2024-finding-ai-generated-faces-in-the-wild.pdf' | relative_url }}#page=5) reports 84.5% for the held-out evaluation, which Section 2.6 describes as a set of 5,000 faces from four engines. The listed per-engine rates varied: EG3D reached 99.5% and generated.photos 95.4%, while Midjourney mostly slips through (19.4%). The 84.5% is the paper's reported result, not an unweighted mean of these three examples. Adding examples from new engines to training is one possible response; this held-out test does not establish generalization to future generators.

## Built for the Wild

The "in the wild" part is the point of the paper. Profile photos do not arrive as pristine megapixel originals; they get downscaled and JPEG-compressed, sometimes repeatedly. Detectors that depend on fragile pixel-level traces tend to die somewhere in that pipeline.

The architecture is straightforward: images are resized to 512 pixels and fed through an EfficientNet-B1 backbone, with the backbone frozen and 6.8 million parameters of scoring layers trained on top. For compression robustness, the training data mixes uncompressed images with JPEG-compressed ones across a range of quality levels.

<img src="{{ '/assets/images/ai-faces-wild-robustness.png' | relative_url }}" alt="Two plots showing true positive rate versus image resolution and versus JPEG quality, with resolution-matched training maintaining high accuracy at small sizes" width="656" height="706" loading="lazy" decoding="async">

*True positive rate as a function of resolution (top) and JPEG quality (bottom) at a fixed 0.5% false positive rate. In the top panel, the solid curve is the 512-trained model evaluated at lower resolutions; each point on the dashed curve uses a model trained at the matching resolution. The JPEG model was trained on uncompressed images and a range of JPEG qualities. (Figure 3 of the paper.)*

A model trained only at 512 pixels lost most of its detection power on 128-pixel images. A separate model trained and evaluated at 128 pixels stayed around 90%, at the same 0.5% false positive rate. For the model trained with mixed uncompressed and JPEG images, detection degraded as JPEG quality fell from 100 to 20. [Section 4]({{ '/assets/files/porcile2024-finding-ai-generated-faces-in-the-wild.pdf' | relative_url }}#page=6) reports 94.3% TPR at quality 80 and 88.0% at quality 60, both at 0.5% FPR.

## What the detector appears to use
{: #a-face-specific-signal-not-a-synthesis-fingerprint }

The detector flagged none of the synthetic non-face images in this evaluation: their true positive rate was 0% (Table 2). The training data provides a confound: some real training photos contain no face, while every synthetic training image contains one. The result is consistent with reliance on facial properties, but it does not isolate a unique mechanism or rule out low-level synthesis artifacts.

<img src="{{ '/assets/images/ai-faces-wild-saliency.jpg' | relative_url }}" alt="AI-generated faces alongside their integrated-gradient attribution maps, which concentrate on facial regions" width="641" height="1483" loading="lazy" decoding="async">

*Integrated-gradient attributions for AI-generated faces concentrate around the face and other areas of skin. The top row averages 100 StyleGAN 2 faces together; the others are individual examples. (Figure 5 of the paper.)*

The attributions also suggest that facial regions contribute to classification, as discussed in [Section 4.1]({{ '/assets/files/porcile2024-finding-ai-generated-faces-in-the-wild.pdf' | relative_url }}#page=6). Together with the non-face result, they support a hypothesis about facial structure. They do not prove that the model has learned a synthesis-independent property that will survive arbitrary image processing.

## Resources

- <span id="blogs" aria-hidden="true"></span>Engineering article: [Finding AI-generated (deepfake) faces in the wild](https://www.linkedin.com/blog/engineering/trust-and-safety/finding-ai-generated-deepfake-faces-in-the-wild)
- <span id="papers" aria-hidden="true"></span>Paper: [Finding AI-Generated Faces in the Wild](https://openaccess.thecvf.com/content/CVPR2024W/WMF/papers/Porcile_Finding_AI-Generated_Faces_in_the_Wild_CVPRW_2024_paper.pdf) ([arXiv:2311.08577](https://arxiv.org/abs/2311.08577))
- <span id="posters" aria-hidden="true"></span>Poster: [Finding AI-Generated Faces in the Wild]({{ '/assets/files/CVPRW_poster_2024.pdf' | relative_url }})
- <span id="videos" aria-hidden="true"></span>[SXSW 2024 panel with DARPA: "Real or Not: Defending Authenticity in a Digital World"](https://www.youtube.com/watch?v=8zniAjqWI2A)
- [DARPA recap: "SXSW Panel Replay: Real or Not, Defending Authenticity in a Digital World"](https://www.darpa.mil/news/2024/sxsw-panel-replay)
