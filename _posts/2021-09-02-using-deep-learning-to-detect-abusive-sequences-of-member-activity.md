---
layout: post
title: "Using deep learning to detect abusive sequences of member activity"
description: "Production deep learning approach for detecting abusive sequences of member activity at LinkedIn using request-level behavior streams."
last_modified_at: 2026-06-10
og_image: "/assets/images/social/2021-09-02-using-deep-learning-to-detect-abusive-sequences-of-member-activity-1200x630.jpg"
og_image_alt: "Using deep learning to detect abusive sequences of member activity"
og_image_width: 1200
og_image_height: 630
categories: ["AI and Machine Learning"]
tags: [LinkedIn, machine learning, AI, cybersecurity, NLP]
---

LinkedIn's Anti-Abuse AI team builds and runs the production models defending the platform against fake accounts, account takeovers, profile scraping, and automated spam.

This post summarizes a production deep learning model I built with my colleague Beibei Wang that operates directly on sequences of member requests to detect abusive automated activity. The full write-up is on the LinkedIn Engineering blog, and a recorded talk walks through the details; both are linked under Resources.

## Automation Is the Common Thread

Fake account rings, account takeovers, API abuse, and scraping look like very different problems, but they share one property: none of them scales without automation. A bad actor controlling a fleet of fake accounts, or sending spam from a browser extension, or harvesting profile data, is running scripts. That suggests a unifying strategy. Instead of building bespoke defenses for every product surface, build models that recognize automated behavior itself.

Three things make that hard in the anti-abuse domain. There are many surfaces to defend, so the approach has to scale across them. Handcrafted features tend to be lossy, because aggregations and summary statistics throw away the subtle structure in raw behavior. And the domain is adversarial: there are humans on the other side who adapt to whatever you deploy. Add weak or missing labels, extreme class imbalance, and the need to score activity online or nearline, and the requirements get demanding.

## What Scraping Actually Looks Like

The first production use case for this work was detecting member profile scraping by logged-in accounts, which violates LinkedIn's terms of service and its members' privacy expectations.

Real scrapers are not crude. One scraper we studied viewed profiles in a handful of short bursts and deliberately revisited profiles it had already seen, so its viewing pattern would look more organic. Another viewed roughly seventy distinct profiles in a day, never revisiting any, with randomized delays between profile views. Both kept their volumes low enough that a human could plausibly have done the same browsing. Volume thresholds and simple heuristics have little to grab onto here.

## Activity Sequences

The insight behind the model is that profile views are a tiny slice of what an account does. Between those views sit logins, searches, messaging requests, settings changes, and the long tail of everything else a browser requests during a session. The full ordered stream, with the time gap between each request, is an enormously rich description of behavior.

<img src="{{ '/assets/images/activity-sequence-construction.png' | relative_url }}" alt="Bursts of profile views on a distinct-profile-identifier versus time plot, expanded into a colored sequence of request types over time with the time between requests captured" width="1024" height="538" loading="lazy" decoding="async">

*A mock example of a burst of profile views, expanded into the full activity sequence around it. The model also consumes the time gap between consecutive requests. (Figure from the LinkedIn Engineering blog post.)*

Turning that stream into model input takes two steps. First, an automated process standardizes raw request paths into a common vocabulary of tokens, with no manual feature engineering. Second, each token is mapped to an integer by how frequent that request path is across all members, so a small integer means a very common request and a large integer means a rare one. The encoding itself carries behavioral signal: it says whether this account is doing ordinary things or unusual things, relative to everyone.

The analogy to natural language processing is direct. Where an NLP model reads a sentence and classifies its sentiment, this model reads a sequence of requests and classifies whether it is automated.

## Seeing the Difference

A useful way to visualize an encoded sequence is a grid: 200 consecutive requests, twenty per row, colored by how common each request is. Here is a normal, healthy member browsing the site:

<img src="{{ '/assets/images/activity-sequence-legit-member.png' | relative_url }}" alt="Grid of 200 encoded requests from a legitimate member showing varied colors and heterogeneous patterns" width="900" height="368" loading="lazy" decoding="async">

*The first two hundred requests from a legitimate member, colored by request-path frequency. Organic browsing produces a varied, heterogeneous texture. (Figure from the LinkedIn Engineering blog post.)*

And here is a scraper:

<img src="{{ '/assets/images/activity-sequence-scraper.png' | relative_url }}" alt="Grid of 200 encoded requests from a scraper showing almost uniformly common requests with little variation" width="900" height="368" loading="lazy" decoding="async">

*The same visualization for an automated scraper. Scripts hammer a few request types and fail to reproduce the subtle variety of real browsing. (Figure from the LinkedIn Engineering blog post.)*

This is the core of why the approach works, and why it is hard to evade. A script's author would have to simulate the ordering, mix, and timing of everything an organic user does incidentally. Scrapers like these, careful enough to randomize timing and revisit profiles, still produce flat, repetitive sequences that stand out immediately against organic texture.

## Model Architecture

The model is a supervised LSTM classifier with two input branches. The encoded request sequence passes through learned path embeddings, which place request types that mean similar things near each other, and one-dimensional convolutions, which pick up suspicious short subsequences wherever they occur. The sequence of time gaps between requests is preprocessed in a parallel branch. The two are concatenated, fed through the LSTM, and a final classification layer produces an abuse score.

<img src="{{ '/assets/images/activity-sequence-architecture.png' | relative_url }}" alt="Architecture diagram: encoded request path sequence through embeddings and convolutions, time deltas through preprocessing, concatenated into an LSTM and classification layer producing an abuse score" width="900" height="516" loading="lazy" decoding="async">

*The two-branch architecture: encoded request paths plus inter-request time gaps, concatenated into an LSTM with a final classification layer that outputs an abuse score. (Figure from the LinkedIn Engineering blog post.)*

One sequence dataset and one architecture serve many behavior classification tasks; only the labels change. That is the scalability argument: a universal input and a single model family, instead of a handcrafted feature set per surface.

## Labels From an Unsupervised Teacher

Supervised models need labels, and scraping does not come with them. The ground truth here came from a different model entirely: the [isolation forest]({{ '/2019/08/13/open-source-isolation-forest-spark-scala/' | relative_url }}) unsupervised outlier detection approach, whose use for automation detection we pioneered, which produces scraper labels with high precision and recall. Those labels trained the sequence model, and they can be augmented with labels from known historical attacks. It is a practical recipe for bootstrapping supervised deep learning in a domain that starts with no labels at all.

## Results

The initial proof-of-concept model was evaluated out of time, on data well after the training period, at the natural class balance, where scrapers are a small fraction of overall activity. Plotting the distribution of model scores, non-scrapers concentrate at low scores while labeled scrapers concentrate at high scores, with roughly a thousandfold separation between the distributions at the high-score end. That separation is what makes the model actionable: thresholds can sit high enough to catch sophisticated scrapers of exactly the kind that older handcrafted-feature defenses missed, while barely touching the non-scraper distribution.

## Sequence Embeddings

The model also produces activity sequence embeddings, and those open a second front. Accounts running the same browser extension or the same script produce similar sequences, so they land near each other in embedding space. Clustering there can surface rings of automated accounts even without any labels. The embeddings can also replace hand-engineered features in other abuse models, which pushes the scalability benefit into the rest of the defense stack.

## Resources

### Blogs

- [Using deep learning to detect abusive sequences of member activity (LinkedIn Engineering)](https://www.linkedin.com/blog/engineering/trust-and-safety/using-deep-learning-to-detect-abusive-sequences-of-member-activi)

### Videos

- [Talk recording (YouTube)](https://www.youtube.com/watch?v=4iX2agE3YWE)
- [Using Deep Learning to Detect Abusive Sequences of Member Activity on LinkedIn (Scale Exchange)](https://exchange.scale.com/public/videos/using-deep-learning-to-detect-abusive-sequences-of-member-activity-on-linkedin)

### Patents

- US Patent 11,936,682: [DEEP LEARNING TO DETECT ABUSIVE SEQUENCES OF USER ACTIVITY IN ONLINE NETWORK]({{ '/assets/files/11936682.pdf' | relative_url }})
- US Patent 11,991,197: [DEEP LEARNING USING ACTIVITY GRAPH TO DETECT ABUSIVE USER ACTIVITY IN ONLINE NETWORKS]({{ '/assets/files/11991197.pdf' | relative_url }})
- US Patent 12,500,923: [IDENTIFYING COORDINATED MALICIOUS ACTIVITIES USING SEQUENCES OF REQUESTS]({{ '/assets/files/12500923.pdf' | relative_url }})
