---
layout: post
title: "Using deep learning to detect abusive sequences of member activity"
description: "Detecting logged-in profile scrapers from the order and timing of their requests."
last_modified_at: 2026-09-17
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

Beibei Wang and I developed a production deep learning model to detect profile scrapers from the order and timing of their requests. We described the model in our [LinkedIn Engineering article](https://www.linkedin.com/blog/engineering/trust-and-safety/using-deep-learning-to-detect-abusive-sequences-of-member-activi).

## Problem and input data
{: #the-modeling-problem }

Request sequences can help identify automation used for fake accounts, account takeovers, API abuse, and scraping. Our first production application was logged-in profile scraping.

## From Requests to Tokens

We modeled the ordered requests from an account, including the requests around each profile view: logins, searches, messages, settings changes, and page resources.

<img src="{{ '/assets/images/activity-sequence-construction.png' | relative_url }}" alt="Bursts of profile views on a distinct-profile-identifier versus time plot, expanded into a colored sequence of request types over time with the time between requests captured" width="1024" height="538" loading="lazy" decoding="async">

*A mock burst of profile views and the request sequence surrounding it. The time gaps between requests are supplied to the model separately. (Figure from my LinkedIn Engineering blog post.)*

The pipeline canonicalizes raw request paths into standardized path tokens, then assigns integer IDs in global request-frequency order: common requests get small IDs and rare requests get large IDs. These IDs index learned request-path embeddings.

The standardized request paths form a sequence of tokens, analogous to the words in a sentence. The elapsed time between each pair of requests is supplied as a second input.

## What the Model Sees

The grid shows 200 consecutive requests, twenty per row, colored by how common each request is. Here is a legitimate member browsing the site:

<img src="{{ '/assets/images/activity-sequence-legit-member.png' | relative_url }}" alt="Grid of 200 encoded requests from a legitimate member showing varied colors and heterogeneous patterns" width="900" height="368" loading="lazy" decoding="async">

*Request-path tokens for 200 consecutive requests from a legitimate member, colored by request frequency. (Figure 2 from our LinkedIn Engineering article.)*

And here is a scraper:

<img src="{{ '/assets/images/activity-sequence-scraper.png' | relative_url }}" alt="Grid of 200 encoded requests from a scraper showing almost uniformly common requests with little variation" width="900" height="368" loading="lazy" decoding="async">

*The same visualization for this scraper is dominated by common request types, with little variation. (Figure 3 from our LinkedIn Engineering article.)*

The grids show request order and type; the separate timing input is not shown.

## Model architecture
{: #architecture-local-motifs-timing-memory }

The classifier has separate request-path and timing branches. The request-path branch begins with embeddings learned during supervised training. One-dimensional convolutions identify short subsequences within the embedded request stream.

The timing branch processes the inter-request time gaps. After the path and timing representations are concatenated, an LSTM models longer-range dependencies across the account's activity window. A final dense layer produces an abuse score.

<img src="{{ '/assets/images/activity-sequence-architecture.png' | relative_url }}" alt="Architecture diagram: encoded request path sequence through embeddings and convolutions, time deltas through preprocessing, concatenated into an LSTM and classification layer producing an abuse score" width="900" height="516" loading="lazy" decoding="async">

*Request-path and timing branches of the sequence classifier. (Figure 4 from our LinkedIn Engineering article.)*

## Training labels
{: #labels-from-an-unsupervised-teacher }

We used the production [Isolation Forest]({{ '/2019/08/13/open-source-isolation-forest-spark-scala/' | relative_url }}) model to generate weak labels for the sequence classifier. Examples from known historical attacks could also be added to the training data.

## Evaluation at Natural Class Balance

We evaluated the initial proof-of-concept model on data collected well after the training period, retaining the natural class balance.

<img src="{{ '/assets/images/activity-sequence-results.png' | relative_url }}" alt="Slide showing LSTM score distributions on an unbalanced out-of-time test dataset, with non-scrapers concentrated at low scores and scrapers concentrated in the high-score tail" width="1920" height="1080" loading="lazy" decoding="async">

*Score distributions for the out-of-time test set. The scraper labels came from Isolation Forest; the figure also distinguishes accounts with high Isolation Forest scores. (Slide 34 from my Scale AI talk.)*

In the highlighted high-score bins, accounts labeled as scrapers outnumbered accounts labeled as non-scrapers by roughly 1,000 to 1.

## Activity sequence embeddings
{: #embeddings-and-coordinated-automation }

The model also produces activity sequence embeddings that can be used to group accounts with similar request patterns for investigation.

<img src="{{ '/assets/images/activity-sequence-embeddings.png' | relative_url }}" alt="Slide showing a two-dimensional projection of activity sequence embeddings, with non-scrapers, scrapers, and high-score scrapers forming visible clusters" width="1920" height="1080" loading="lazy" decoding="async">

*A two-dimensional projection of activity sequence embeddings, colored by the non-scraper and scraper label groups. (Slide from my Scale AI talk.)*

The embeddings can also serve as features for downstream outlier-detection models, replacing hand-engineered activity summaries with learned representations of the sequence.

## Resources

- <span id="blogs" aria-hidden="true"></span>[Using deep learning to detect abusive sequences of member activity (LinkedIn Engineering)](https://www.linkedin.com/blog/engineering/trust-and-safety/using-deep-learning-to-detect-abusive-sequences-of-member-activi)
- <span id="videos" aria-hidden="true"></span>[Talk recording (YouTube)](https://www.youtube.com/watch?v=4iX2agE3YWE)
- <span id="patents" aria-hidden="true"></span>US Patent 11,936,682: [DEEP LEARNING TO DETECT ABUSIVE SEQUENCES OF USER ACTIVITY IN ONLINE NETWORK]({{ '/assets/files/11936682.pdf' | relative_url }})
- US Patent 11,991,197: [DEEP LEARNING USING ACTIVITY GRAPH TO DETECT ABUSIVE USER ACTIVITY IN ONLINE NETWORKS]({{ '/assets/files/11991197.pdf' | relative_url }})
- US Patent 12,500,923: [IDENTIFYING COORDINATED MALICIOUS ACTIVITIES USING SEQUENCES OF REQUESTS]({{ '/assets/files/12500923.pdf' | relative_url }})
