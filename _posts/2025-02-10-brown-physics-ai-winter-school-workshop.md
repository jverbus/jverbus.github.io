---
layout: post
title: "Exploring LLMs and RAG at the 2025 AI Winter School (Brown University)"
date: 2025-02-10
last_modified_at: 2026-06-24
description: "Hands-on workshop on source-grounded LLM workflows for physics: direct-model baselines, vector retrieval over LUX papers and Brown theses, retrieval diagnostics, and API/open-model tradeoffs."
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

At the 2025 AI Winter School, hosted by the Center for the Fundamental Physics of the Universe at Brown University, I led a 2.5-hour hands-on workshop on using large language models with physics-specific source material.

The workshop was not about training a foundation model. It was about a narrower research workflow: take technical questions whose answers live in papers and theses, compare direct model answers against source-grounded answers, and inspect the retrieval evidence before trusting the result.

The example corpus came from LUX dark matter calibration papers and Brown Particle Astrophysics theses. The questions were deliberately concrete: neutron-source rates, mean D-D neutron energy, electric fields used in LUX yield measurements, the liquid-xenon nuclear-recoil endpoint, S1/S2 signal sizes, and the origin of low-energy `127Xe` calibration events. Those are the kinds of details a generic model may phrase confidently while getting wrong.

## The Scientific Problem

For scientific use, the hard part is not asking an LLM to explain "dark matter detectors" or "neutron calibration." The hard part is asking for a specific number, condition, or systematic detail and being able to trace the answer back to the document that supports it.

In a physics analysis, a plausible answer is not enough. A usable answer needs provenance:

- which document was used
- which page or text region contained the answer
- whether the retrieved passage actually supports the claim
- whether the model preserved units, qualifiers, and uncertainty language
- whether the answer came from the requested source rather than adjacent but incompatible material

That framing makes retrieval-augmented generation (RAG) less of a chatbot feature and more of an evidence-routing problem.

## Retrieval Model

The RAG system in the notebooks used a standard dense-retrieval pipeline:

1. parse source documents from a Google Drive directory
2. split the extracted text into overlapping chunks
3. embed each chunk into a vector space
4. embed the user question into the same vector space
5. retrieve the top-ranked chunks by vector similarity
6. pass those chunks, plus the question, to the LLM

In shorthand, the retriever ranks chunks by a score such as:

```text
score(q, c_i) = cos(embed(q), embed(c_i))
```

This changes the model's job. Without retrieval, the model is being asked to answer from its parameters. With retrieval, the model is being asked to synthesize an answer from a small set of retrieved passages. That is a meaningful improvement, but it is not a proof of correctness. A RAG answer can still fail if the parser loses a table, the embedding model ranks the wrong passage, the top-k cutoff excludes the relevant chunk, or the LLM misreads the retrieved evidence.

## Two Implementations

The workshop used two parallel Colab notebooks so participants could see the same workflow with different model-serving assumptions.

| Path | Model setup | Retrieval setup | Role in the workshop |
| --- | --- | --- | --- |
| **Hosted API** | `gpt-4o-mini` through the OpenAI API | LlamaIndex document loading, chunking, embeddings, vector indexing, and query engine | Fast path for prototyping and comparing model answers against retrieved evidence |
| **Open model** | `meta-llama/Meta-Llama-3.1-8B-Instruct` through Hugging Face in a GPU-backed Colab runtime | LlamaIndex with `BAAI/bge-small-en-v1.5` embeddings for vector search | More explicit control over model weights, runtime, tokenizer, embedding model, and data-handling environment |

The hosted path minimized setup. The open-model path exposed more of the system boundary: model access, GPU memory, dependency management, inference latency, tokenizer behavior, and the fact that "local" control still requires disciplined handling of the surrounding retrieval and prompting code.

## Indexing Parameters

For the first pass, the notebooks used compact, inspectable RAG settings:

```python
Settings.chunk_size = 1000
Settings.chunk_overlap = 100

query_engine = index.as_query_engine(similarity_top_k=5)
response = query_engine.query(question)
```

These are engineering choices, not universal defaults.

- **Chunk size:** larger chunks preserve more local context, but make retrieval less selective and consume more prompt budget.
- **Chunk overlap:** overlap reduces boundary artifacts, especially when a definition, figure caption, or table explanation straddles a chunk boundary.
- **Embedding model:** the embedding model defines the retrieval geometry. It determines which passages are "near" the question before the LLM sees anything.
- **Top-k retrieval:** increasing `similarity_top_k` improves recall only if the relevant chunks are somewhere near the top of the ranking; it also adds more irrelevant text for the generator to reconcile.

For physics PDFs, those choices are not cosmetic. Tables, equations, captions, units, and paragraph references can be separated by PDF extraction. A chunk that is reasonable for prose may be too small for a table and its caption, while a chunk that preserves a table may be too broad for precise nearest-neighbor retrieval.

## What We Inspected

The important notebook cells were not just the calls that generated answers. They were the cells that exposed the retrieval trace:

```python
response.metadata
response.source_nodes
```

That output lets the user separate three different failure modes:

| Failure mode | What it looks like | What to check |
| --- | --- | --- |
| Missing corpus coverage | The answer is generic or absent because the relevant paper/thesis was never indexed | Directory contents, document parser output, index construction |
| Retrieval failure | The answer uses source text, but from the wrong document, page, calibration, or energy range | `source_nodes`, page metadata, chunk text, similarity ranking |
| Generation failure | The right passage was retrieved, but the model changed a number, dropped a unit, or over-compressed a caveat | Source passage against final answer, especially numerical claims |

This is why the workshop used questions with checkable numerical answers. If the answer says "about 2.45 MeV" when the source reports a measured mean energy with statistical and systematic uncertainties, the difference matters. If an answer reports an endpoint but drops whether it is in `keVnr`, the unit loss matters. If an answer identifies `127Xe` without distinguishing cosmogenic activation from a calibration source, the provenance matters.

## Incremental Indexing

The notebooks also added new documents to an existing index. The first corpus used LUX D-D calibration papers; the second pass inserted Brown Particle Astrophysics theses:

```python
new_documents = SimpleDirectoryReader(new_llama_index_data_path, recursive=True).load_data()
new_nodes = SimpleNodeParser().get_nodes_from_documents(new_documents)
index.insert_nodes(new_nodes)
```

That exercise was included because a research group's document base is not static. Papers, theses, detector notes, analysis notes, meeting slides, and internal documentation accumulate over years. Rebuilding a small demo index is trivial; maintaining an auditable research index requires attention to versioning, provenance, document freshness, access control, and regression tests for important queries.

## Practical Standard

The standard I wanted participants to take away was deliberately strict:

1. ask the model a domain-specific question
2. inspect the retrieved source chunks
3. verify the answer against the source text
4. check units, assumptions, and uncertainty language
5. revise the corpus, chunking, embedding model, or prompt when the retrieval trace is wrong

That is slower than treating an LLM as an oracle, but it is closer to how scientific work is actually checked. For physics, RAG earns its keep only when it shortens the path from question to source evidence without hiding uncertainty behind fluent prose.

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
