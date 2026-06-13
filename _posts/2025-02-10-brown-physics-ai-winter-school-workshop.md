---
layout: post
title: "Exploring LLMs and RAG at the 2025 AI Winter School (Brown University)"
date: 2025-02-10
last_modified_at: 2026-06-10
description: "Hands-on workshop on LLMs and Retrieval-Augmented Generation for physics workflows, using the OpenAI API, an open Llama model, and LlamaIndex over research documents."
og_image: "/assets/images/social/2025-02-10-brown-physics-ai-winter-school-workshop-1200x630.jpg"
og_image_alt: "2025 AI Winter School banner from the Brown University Department of Physics"
og_image_width: 1200
og_image_height: 630
categories:
  - AI and Machine Learning
tags:
  - Generative AI
  - Brown University
  - AI
  - LLM
  - RAG
  - Physics
related:
  - /2026/01/09/brown-physics-ai-winter-school-workshop/
  - /2016/08/18/calibrating-the-lux-dark-matter-experiment/
---

<img src="{{ '/assets/images/2025-ai-winter-school-banner.jpg' | relative_url }}" alt="2025 AI Winter School banner — Brown University Department of Physics, Center for the Fundamental Physics of the Universe, January 13–16, 2025" width="1024" height="768" loading="eager" decoding="async" fetchpriority="high">

I recently gave a 2.5-hour hands-on workshop on Large Language Models (LLMs) at the 2025 AI Winter School, hosted by the Center for the Fundamental Physics of the Universe at Brown University. The session focused on a practical question: how can physics researchers use LLMs with their own specialized technical material?

Rather than covering how to train LLMs from scratch, the workshop focused on using existing models in research workflows. Participants worked through Google Colab notebooks that compared API-based and locally hosted models, then connected both approaches to a basic retrieval-augmented generation (RAG) system.

## Workshop Goals

The workshop covered four main topics:

- setting up an LLM through the OpenAI API
- running an open Llama model locally in a GPU-backed notebook
- building a RAG system over physics papers and theses
- inspecting retrieved source chunks to understand and debug model answers

The examples used LUX dark matter calibration documents and Brown Particle Astrophysics theses as the document corpus. The point was not the particular experiment, but the workflow: many physics questions depend on technical details scattered across papers, theses, detector notes, calibration documents, internal analysis writeups, and code-adjacent documentation.

## Why RAG Is Useful for Physics

A general-purpose LLM may be able to explain broad physics concepts, but it often will not know the details of a specific experiment, calibration, analysis note, or recently published result. That information may be private, too new, too specialized, or simply absent from the model's training data.

One option is to paste a large amount of context into the prompt. That can work for small cases, but it does not scale well to a research group's full document collection. Context windows are finite, long prompts can be expensive, and adding irrelevant text can make the model's job harder.

RAG provides a more scalable pattern:

1. split documents into chunks
2. convert each chunk into an embedding vector
3. store those vectors in a vector index
4. embed the user's question
5. retrieve the most relevant chunks
6. pass the retrieved context to the LLM along with the question

For physics researchers, this turns an LLM into a more useful interface to technical source material. Instead of asking the model to rely only on its training data, the model can answer using relevant sections of papers, theses, notes, or documentation retrieved at query time.

## API-Based Models vs. Open Models

A major part of the workshop was comparing two common ways to use LLMs.

| Approach             | Advantages                                                                                            | Tradeoffs                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **OpenAI API**       | Fast setup, strong model performance, no local GPU required, useful for prototyping                   | Requires using a hosted service, has API costs, and gives less control over model internals          |
| **Open Llama model** | More control over model choice, runtime, tokenizer, inference settings, and data-handling environment | Requires more setup, GPU/RAM resources, dependency management, and model access through Hugging Face |

The OpenAI notebook was the quickest path to a working LLM workflow. Participants created an API key, stored it in Colab secrets, and used the OpenAI API together with LlamaIndex.

The Llama notebook showed a more controlled but heavier-weight setup. Participants used Meta's Llama model through Hugging Face, requested access to the gated model weights, created a Hugging Face token, and ran the model in a GPU-backed Colab environment. Even the 8-billion-parameter model required substantially more compute than the API example.

This distinction matters for research groups. A hosted API may be best for rapid prototyping, while an open model may be preferable when local deployment, reproducibility, model control, cost structure, or data-handling constraints are more important.

## Technical Setup

For the RAG portion, we used LlamaIndex to load documents, chunk text, create embeddings, and build a vector index. In the OpenAI notebook, the LLM was `gpt-4o-mini`, with embeddings from the OpenAI API (LlamaIndex's default). In the Llama notebook, the model was `meta-llama/Meta-Llama-3.1-8B-Instruct`, with a small open embedding model (`BAAI/bge-small-en-v1.5`) handling the vector search.

The workshop used simple starting values for the RAG parameters:

```python
Settings.chunk_size = 1000
Settings.chunk_overlap = 100

query_engine = index.as_query_engine(similarity_top_k=5)
response = query_engine.query(question)
```

These are not universal defaults. They are engineering parameters.

- **Chunk size** controls how much text is retrieved at once.
- **Chunk overlap** helps avoid losing context at chunk boundaries.
- **Embedding model** determines how text is represented in vector space.
- **Top-k retrieval** controls how many chunks are passed to the LLM.

There are real tradeoffs. If chunks are too small, the retrieved text may omit surrounding context needed to answer the question. If chunks are too large, similarity search may become less precise, and the retrieved context may waste valuable context-window space.

## Debugging RAG

One of the most important parts of the workshop was inspecting the retrieved sources. The notebooks showed how to examine objects such as:

```python
response.metadata
response.source_nodes
```

This lets the user see which documents, pages, and text chunks were actually passed to the model.

That matters because a bad RAG answer can come from different failure modes:

- the relevant document was not included in the index
- the retriever selected the wrong chunks
- the model had the right context but still generated an incorrect answer

This is especially important for quantitative scientific work. RAG can improve grounding, but it does not make an answer automatically correct. The retrieved evidence still needs to be checked.

## Growing the Document Index

We also showed how to add documents incrementally. After starting with a small set of LUX calibration papers, we added additional Brown theses to the existing index instead of rebuilding the full index from scratch.

That is closer to how a real research group would use this kind of system. A group knowledge base may grow over time as new papers, theses, detector notes, analysis notes, and internal documentation are added. Incremental indexing makes that workflow more practical, especially when the corpus becomes large enough that rebuilding the entire vector index would be slow or expensive.

## Takeaway

The main takeaway was that LLMs become much more useful for scientific work when they are connected to the right technical context and when their sources can be inspected.

For physics researchers, RAG is valuable not because it makes an LLM infallible, but because it provides a practical way to query specialized document collections using natural language. It can help researchers find relevant sections of papers, compare details across documents, navigate long theses or technical notes, and prototype assistants for experiment-specific knowledge bases.

The API and open-model workflows each have a place. Hosted APIs are often the easiest way to prototype. Open models require more infrastructure but give more control. In both cases, the essential research practice is the same: keep the evidence visible, verify quantitative claims, and treat the system as an assistant for navigating technical material rather than as an authority.

## Materials

### Workshop Recording

You can watch my full 2.5-hour workshop here:

[Workshop Recording](https://www.youtube.com/watch?v=3Ra9vuHEh7U&list=PL21yWP3gTVmo7gfqS1y0GSeB5ypla8kvi&index=5)

### Jupyter Notebooks

For a deeper look at the code and examples, check out these notebooks:

[OpenAI-based LLM Setup](https://github.com/jverbus/jverbus.github.io/blob/master/assets/files/2025_01_15_James_Verbus_Brown_AI_Winter_School_Open_AI.ipynb)

[Llama-based LLM Setup](https://github.com/jverbus/jverbus.github.io/blob/master/assets/files/2025_01_15_James_Verbus_Brown_AI_Winter_School_LLaMa.ipynb)

### Slides

You can also review the presentation slides for additional context:

[Slides (PDF)]({{ '/assets/files/2025-01-15%20-%20James%20Verbus%20-%20Brown%20AI%20Winter%20School.pdf' | relative_url }})

### Event Page

For more details on the 2025 AI Winter School, including the full schedule and other workshop sessions, visit the official event page:

[2025 AI Winter School Event Page](https://indico.physics.brown.edu/event/34/)
