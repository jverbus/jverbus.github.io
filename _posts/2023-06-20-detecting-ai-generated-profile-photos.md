---
layout: post
title: "Detecting AI-Generated Profile Photos"
description: "CVPR Workshop research on detecting GAN-generated profile photos from compact embeddings: a lightweight approach to catching synthetic faces at scale."
last_modified_at: 2026-06-10
og_image: "/assets/images/social/2023-06-20-detecting-ai-generated-profile-photos-1200x630.jpg"
og_image_alt: "Detecting AI-Generated Profile Photos"
og_image_width: 1200
og_image_height: 630
categories: ["AI and Machine Learning"]
tags: [LinkedIn, machine learning, AI, Generative AI, deepfake]
related:
  - /2024/08/15/finding-ai-generated-faces-in-the-wild/
  - /2021/09/02/using-deep-learning-to-detect-abusive-sequences-of-member-activity/
  - /2026/03/18/announcing-extended-isolation-forest-support/
---

Fake accounts increasingly rely on AI-generated profile photos: a synthetic face is unique and photorealistic, and it leaves none of the reverse-image-search traces that stolen photos do. Detecting these images automatically, at platform scale where false positives are expensive, is a hard, high-stakes problem for any platform that fights fake accounts.

Together with Professor Hany Farid at UC Berkeley, my team developed a detector that is small, cheap to run, and extremely accurate against the family of AI-generated profile photos most common in fake accounts at the time. We published the details at the [Workshop on Media Forensics](https://sites.google.com/view/wmf2023/home) at CVPR 2023.

## The Tell: Synthetic Faces Are Too Regular

The core observation behind the paper is simple to see and surprisingly powerful: GAN-generated profile photos share a rigid facial geometry. Average 400 StyleGAN2 faces and you get a sharp, recognizable face. Eyes, nose, and mouth land in nearly the same place every time. Average 400 real profile photos and you get a blur.

<img src="{{ '/assets/images/gan-detection-average-faces.jpg' | relative_url }}" alt="Average of 400 StyleGAN2 faces appearing sharp next to the blurry average of 400 real profile photos, with reconstruction visualizations below" width="652" height="673" loading="lazy" decoding="async">

*Averaging 400 StyleGAN2 faces (left) produces a sharp composite; averaging 400 real profile photos (right) produces a blur. The bottom row visualizes reconstruction behavior from a compact embedding learned on synthetic faces. (Figure from the paper.)*

## A Compact Embedding Instead of a Heavy Classifier

That structural regularity means synthetic faces live in a much smaller space than real photos, small enough to capture with a 128-dimensional linear embedding learned from a few thousand synthetic faces. Synthetic images reconstruct from that embedding with low error; real profile photos, with all their natural variation, do not.

<img src="{{ '/assets/images/gan-detection-reconstruction-error.png' | relative_url }}" alt="Histograms showing reconstruction error distributions for StyleGAN faces separated cleanly from real profile photos across StyleGAN1, StyleGAN2, and StyleGAN3" width="673" height="1314" loading="lazy" decoding="async">

*Reconstruction error from the learned linear embedding cleanly separates StyleGAN faces (blue) from real profile photos (orange) across StyleGAN1, StyleGAN2, and StyleGAN3. (Figure from the paper.)*

A threshold on reconstruction error alone already makes a usable classifier. Going one step further and fitting a simple logistic regression to the embedding coordinates caught 99.6% of synthetic photos at a 1% false positive rate, outperforming much larger CNN-based forensic classifiers. A learned autoencoder embedding behaves similarly.

That efficiency is the point. At platform scale, false positives are costly and inference budgets are real. A detector this small can be trained on modest data, audited easily, and deployed cheaply, which is what makes it practical as one layer of automated anti-abuse defenses.

## The Generator Landscape

<img src="{{ '/assets/images/gan-detection-synthesis-engines.jpg' | relative_url }}" alt="Grid of representative synthetic faces produced by StyleGAN1, StyleGAN2, StyleGAN3, Generated.photos, and Stable Diffusion" width="1309" height="1048" loading="lazy" decoding="async">

*Representative synthetic faces from five generation engines: StyleGAN1, StyleGAN2, StyleGAN3, Generated.photos, and Stable Diffusion. (Figure from the paper.)*

The paper focuses on the StyleGAN family, which dominated fake-profile imagery at the time. The bottom rows of the figure hint at what came next: diffusion models without the same rigid alignment. Detecting those in real-world conditions became the subject of our follow-up work, [Finding AI-Generated Faces in the Wild]({{ '/2024/08/15/finding-ai-generated-faces-in-the-wild/' | relative_url }}).

## Resources

### Blogs

- [New Approaches For Detecting AI-Generated Profile Photos](https://engineering.linkedin.com/blog/2023/new-approaches-for-detecting-ai-generated-profile-photos?)

### Papers

- [Exposing GAN-Generated Profile Photos from Compact Embeddings](https://openaccess.thecvf.com/content/CVPR2023W/WMF/papers/Mundra_Exposing_GAN-Generated_Profile_Photos_From_Compact_Embeddings_CVPRW_2023_paper.pdf)

### Posters

- [Exposing GAN-Generated Profile Photos from Compact Embeddings]({{ '/assets/files/CVPRW_poster_2023.pdf' | relative_url }})

### News coverage

- [Researchers From LinkedIn And UC Berkeley Propose A New Method To Detect AI-Generated Profile Photos](https://www.marktechpost.com/2023/06/24/researchers-from-linkedin-and-uc-berkeley-propose-a-new-method-to-detect-ai-generated-profile-photos/)
- [LinkedIn Reveals AI Image Detection Research That Catches Fake Profiles](https://www.searchenginejournal.com/linkedin-ai-image-detector-fake-profiles/489936/)
- [LinkedIn And UC Berkeley Introduces New Method To Detect AI-Generated Profile Photos](https://analyticsdrift.com/linkedin-and-uc-berkeley-introduces-new-method-to-detect-ai-generated-profile-photos/)
