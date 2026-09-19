---
layout: post
title: "Detecting AI-Generated Profile Photos"
description: "Detecting StyleGAN-generated profile photos using compact image embeddings."
last_modified_at: 2026-09-17
og_image: "/assets/images/social/2023-06-20-detecting-ai-generated-profile-photos-1200x630.jpg"
og_image_alt: "Detecting AI-Generated Profile Photos"
og_image_width: 1200
og_image_height: 630
categories: ["AI and Machine Learning"]
tags: [LinkedIn, machine learning, AI, Generative AI, deepfake]
related:
  - /2024/08/15/finding-ai-generated-faces-in-the-wild/
  - /2021/09/02/using-deep-learning-to-detect-abusive-sequences-of-member-activity/
---

The average of 400 StyleGAN2 faces retains sharp facial features, while the average of 400 real profile photos is blurred. We used this difference to detect synthetic profile photos. Fake accounts can use newly generated faces with no earlier published image for reverse-image search to find.

My team worked with Professor Hany Farid at UC Berkeley to develop detectors based on compact embeddings of StyleGAN-family faces. We published the [study]({{ '/assets/files/mundra2023-exposing-gan-generated-profile-photos-from-compact-embeddings.pdf' | relative_url }}#page=1) at the [Workshop on Media Forensics](https://sites.google.com/view/wmf2023/home) at CVPR 2023.

## Facial alignment in StyleGAN images
{: #the-tell-synthetic-faces-are-too-regular }

In the StyleGAN2 average below, the eyes, nose, and mouth remain recognizable because they occupy similar positions across images. The real-photo average shows more variation in alignment and framing.

<img src="{{ '/assets/images/gan-detection-average-faces.jpg' | relative_url }}" alt="Average of 400 StyleGAN2 faces appearing sharp next to the blurry average of 400 real profile photos, with reconstruction visualizations below" width="652" height="673" loading="lazy" decoding="async">

*Averaging 400 StyleGAN2 faces (left) produces a sharp composite; averaging 400 real profile photos (right) produces a blur. The bottom row visualizes reconstruction behavior from a compact embedding learned on synthetic faces. (Figure 1 of the paper.)*

## Detection from compact embeddings
{: #a-compact-embedding-instead-of-a-heavy-classifier }

We learned a 128-dimensional linear embedding using principal components analysis (PCA) on a few thousand StyleGAN faces. Reconstruction errors were lower for StyleGAN images than for real profile photos.

<img src="{{ '/assets/images/gan-detection-reconstruction-error.png' | relative_url }}" alt="Histograms comparing reconstruction error distributions for StyleGAN faces and real profile photos across StyleGAN1, StyleGAN2, and StyleGAN3" width="673" height="1314" loading="lazy" decoding="async">

*Reconstruction-error distributions for StyleGAN faces (blue) and real profile photos (orange), using learned linear embeddings for StyleGAN1, StyleGAN2, and StyleGAN3. (Figure 3 of the paper.)*

Reconstruction error can be thresholded to classify an image. [Logistic regression on the PCA coordinates]({{ '/assets/files/mundra2023-exposing-gan-generated-profile-photos-from-compact-embeddings.pdf' | relative_url }}#page=4) improved detection to 99.6% of StyleGAN-family faces at a 1% false positive rate on real profile photos. An autoencoder embedding produced a similar result. The CNN baseline in [Table 1]({{ '/assets/files/mundra2023-exposing-gan-generated-profile-photos-from-compact-embeddings.pdf' | relative_url }}#page=7) was evaluated at a different false positive rate of 3.3%.

## Generalization to other generators
{: #the-generator-landscape }

<img src="{{ '/assets/images/gan-detection-synthesis-engines.jpg' | relative_url }}" alt="Grid of representative synthetic faces produced by StyleGAN1, StyleGAN2, StyleGAN3, Generated.photos, and Stable Diffusion" width="1309" height="1048" loading="lazy" decoding="async">

*Representative synthetic faces from five generation engines: StyleGAN1, StyleGAN2, StyleGAN3, Generated.photos, and Stable Diffusion. (Figure 2 of the paper.)*

We also evaluated Generated.photos and Stable Diffusion images. The method had some success on Generated.photos but [failed on Stable Diffusion](https://www.linkedin.com/blog/engineering/trust-and-safety/new-approaches-for-detecting-ai-generated-profile-photos), whose faces do not share the same rigid alignment. Our subsequent study, [Finding AI-Generated Faces in the Wild]({{ '/2024/08/15/finding-ai-generated-faces-in-the-wild/' | relative_url }}), evaluated a different model across GAN and diffusion generators.

## Resources

- <span id="blogs" aria-hidden="true"></span>Engineering article: [New Approaches For Detecting AI-Generated Profile Photos](https://engineering.linkedin.com/blog/2023/new-approaches-for-detecting-ai-generated-profile-photos?)
- <span id="papers" aria-hidden="true"></span>Paper: [Exposing GAN-Generated Profile Photos from Compact Embeddings](https://openaccess.thecvf.com/content/CVPR2023W/WMF/papers/Mundra_Exposing_GAN-Generated_Profile_Photos_From_Compact_Embeddings_CVPRW_2023_paper.pdf)
- <span id="posters" aria-hidden="true"></span>Poster: [Exposing GAN-Generated Profile Photos from Compact Embeddings]({{ '/assets/files/CVPRW_poster_2023.pdf' | relative_url }})
- <span id="news-coverage" aria-hidden="true"></span>Related coverage: [Researchers From LinkedIn And UC Berkeley Propose A New Method To Detect AI-Generated Profile Photos](https://www.marktechpost.com/2023/06/24/researchers-from-linkedin-and-uc-berkeley-propose-a-new-method-to-detect-ai-generated-profile-photos/)
- [LinkedIn Reveals AI Image Detection Research That Catches Fake Profiles](https://www.searchenginejournal.com/linkedin-ai-image-detector-fake-profiles/489936/)
- [LinkedIn And UC Berkeley Introduces New Method To Detect AI-Generated Profile Photos](https://analyticsdrift.com/linkedin-and-uc-berkeley-introduces-new-method-to-detect-ai-generated-profile-photos/)
