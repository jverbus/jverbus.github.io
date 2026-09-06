---
layout: post
title: "Using deep learning to detect abusive sequences of member activity"
description: "Detecting logged-in profile scrapers from the order and timing of their requests."
last_modified_at: 2026-09-06
og_image: "/assets/images/social/2021-09-02-using-deep-learning-to-detect-abusive-sequences-of-member-activity-1200x630.jpg"
og_image_alt: "Using deep learning to detect abusive sequences of member activity"
og_image_width: 1200
og_image_height: 630
categories: ["AI and Machine Learning"]
tags: [LinkedIn, machine learning, AI, cybersecurity, NLP]
related:
  - /2019/08/13/open-source-isolation-forest-spark-scala/
  - /2023/06/20/detecting-ai-generated-profile-photos/
  - /2024/08/15/finding-ai-generated-faces-in-the-wild/
---

One logged-in profile scraper we studied at LinkedIn viewed roughly seventy distinct profiles in a day with randomized delays. Another viewed profiles in short bursts and deliberately revisited profiles it had already seen. Their activity volumes could plausibly have been human; request counts alone gave us little separation.

I built a production deep learning model with my colleague Beibei Wang to use the order and timing of requests as a complementary representation. The [original coauthored engineering article](https://www.linkedin.com/blog/engineering/trust-and-safety/using-deep-learning-to-detect-abusive-sequences-of-member-activi) describes the work; a recorded talk is linked under [Resources](#resources).

## The Modeling Problem

Automation used for fake accounts, account takeovers, API abuse, and scraping can leave repeatable request sequences. Logged-in profile scraping was our first production use case: we modeled request types, ordering, repetition, and timing, including activity across site surfaces. Labels were imperfect, scraping was rare relative to normal activity, and attackers could adapt to visible defenses.

## From Requests to Tokens

We modeled the ordered requests from an account, including the requests around each profile view: logins, searches, messages, settings changes, and page resources.

<img src="{{ '/assets/images/activity-sequence-construction.png' | relative_url }}" alt="Bursts of profile views on a distinct-profile-identifier versus time plot, expanded into a colored sequence of request types over time with the time between requests captured" width="1024" height="538" loading="lazy" decoding="async">

*A mock burst of profile views, expanded into the full request sequence around it. The model also consumes the time gap between consecutive requests. (Figure from my LinkedIn Engineering blog post.)*

The pipeline canonicalizes raw request paths into standardized path tokens, then assigns integer IDs in global request-frequency order: common requests get small IDs and rare requests get large IDs. These IDs index the learned embeddings described below; frequency ordering alone does not specify a prior on those embeddings.

Timing is kept as a parallel signal. For each adjacent pair of requests, the model receives the elapsed time between them. In NLP terms, the request-path stream is the sentence, the standardized paths are tokens, and the inter-request delays are a second channel that tells the model how the sentence was paced.

## What the Model Sees

The grid shows 200 consecutive requests, twenty per row, colored by how common each request is. Here is a legitimate member browsing the site:

<img src="{{ '/assets/images/activity-sequence-legit-member.png' | relative_url }}" alt="Grid of 200 encoded requests from a legitimate member showing varied colors and heterogeneous patterns" width="900" height="368" loading="lazy" decoding="async">

*The first two hundred requests from this legitimate member, colored by request-path frequency, show a varied mix of request types. (Figure 2 from our LinkedIn Engineering article.)*

And here is a scraper:

<img src="{{ '/assets/images/activity-sequence-scraper.png' | relative_url }}" alt="Grid of 200 encoded requests from a scraper showing almost uniformly common requests with little variation" width="900" height="368" loading="lazy" decoding="async">

*The same visualization for this scraper is dominated by common request types, with little variation. (Figure 3 from our LinkedIn Engineering article.)*

The grid displays the ordered token IDs that feed the request-path branch. Inter-request time gaps enter through a separate branch and are not shown in these grids.

## Architecture: Local Motifs, Timing, Memory

The model is a supervised sequence classifier with two input branches. The request-path branch starts with learned embeddings over the frequency-ranked path tokens. Those embeddings let the model learn a dense representation of request types from the abuse-detection objective rather than from manually assigned semantics. One-dimensional convolutions then detect local motifs: short subsequences that may be suspicious wherever they appear in the stream.

The timing branch processes the inter-request time gaps. After the path and timing representations are concatenated, an LSTM models longer-range dependencies across the account's activity window. A final dense layer produces an abuse score.

<img src="{{ '/assets/images/activity-sequence-architecture.png' | relative_url }}" alt="Architecture diagram: encoded request path sequence through embeddings and convolutions, time deltas through preprocessing, concatenated into an LSTM and classification layer producing an abuse score" width="900" height="516" loading="lazy" decoding="async">

*Request-path and timing branches of the sequence classifier. (Figure 4 from our LinkedIn Engineering article.)*

## Labels From an Unsupervised Teacher

Supervised sequence models need labels, and scraping does not come with clean ground truth. The labels for this model came from a different production signal: the [isolation forest]({{ '/2019/08/13/open-source-isolation-forest-spark-scala/' | relative_url }}) outlier-detection approach we used for automation detection. Those labels could be augmented with examples from known historical attacks.

These are weak labels. The sequence model learns a different representation from the standardized request stream, but that does not establish that it escapes the labeling model's biases or recovers attacks that model missed.

## Evaluation at Natural Class Balance

The initial proof-of-concept model was evaluated out of time, on data from well after the training period, at the natural class balance. The slide plots the labeled populations without balancing a rare-abuse sample.

<img src="{{ '/assets/images/activity-sequence-results.png' | relative_url }}" alt="Slide showing LSTM score distributions on an unbalanced out-of-time test dataset, with non-scrapers concentrated at low scores and scrapers concentrated in the high-score tail" width="1920" height="1080" loading="lazy" decoding="async">

*Out-of-time labeled score distributions at natural class balance. The scraper groups are labeled by Isolation Forest, including a group with high Isolation Forest scores. (Slide 34 from my Scale AI talk.)*

The slide annotates roughly a thousandfold difference in plotted non-scraper and scraper counts near the high-score end. This is a count comparison within those labeled distributions. The slide does not specify an operating threshold and reviewed production precision or recall, so it does not measure the false-positive burden of a deployed workflow.

## Embeddings and Coordinated Automation

The model also produces activity sequence embeddings. Nearby sequence embeddings can help identify accounts worth investigating together. Similar request patterns are an investigative lead; they do not by themselves prove shared control or use of a particular script.

<img src="{{ '/assets/images/activity-sequence-embeddings.png' | relative_url }}" alt="Slide showing a two-dimensional projection of activity sequence embeddings, with non-scrapers, scrapers, and high-score scrapers forming visible clusters" width="1920" height="1080" loading="lazy" decoding="async">

*A two-dimensional projection of activity sequence embeddings, colored by the displayed non-scraper and scraper label groups. Proximity represents behavioral resemblance. (Slide from my Scale AI talk.)*

The embeddings can also serve as features for downstream outlier-detection models, replacing hand-engineered activity summaries with learned representations of the sequence.

## Resources

- <span id="blogs" aria-hidden="true"></span>[Using deep learning to detect abusive sequences of member activity (LinkedIn Engineering)](https://www.linkedin.com/blog/engineering/trust-and-safety/using-deep-learning-to-detect-abusive-sequences-of-member-activi)
- <span id="videos" aria-hidden="true"></span>[Talk recording (YouTube)](https://www.youtube.com/watch?v=4iX2agE3YWE)
- <span id="patents" aria-hidden="true"></span>US Patent 11,936,682: [DEEP LEARNING TO DETECT ABUSIVE SEQUENCES OF USER ACTIVITY IN ONLINE NETWORK]({{ '/assets/files/11936682.pdf' | relative_url }})
- US Patent 11,991,197: [DEEP LEARNING USING ACTIVITY GRAPH TO DETECT ABUSIVE USER ACTIVITY IN ONLINE NETWORKS]({{ '/assets/files/11991197.pdf' | relative_url }})
- US Patent 12,500,923: [IDENTIFYING COORDINATED MALICIOUS ACTIVITIES USING SEQUENCES OF REQUESTS]({{ '/assets/files/12500923.pdf' | relative_url }})
