---
layout: post
title: "Exploring LLMs and RAG at the 2025 AI Winter School (Brown University)"
date: 2025-02-10
last_modified_at: 2026-09-06
description: "A workshop on querying physics papers with LLMs and checking the answers against retrieved source passages."
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

Participants compared direct model answers with answers generated from passages retrieved from LUX papers and Brown theses.

The corpus covered LUX dark matter calibrations and Brown Particle Astrophysics theses. We asked about the mean D-D neutron energy, the electric fields used in LUX yield measurements, and the origin and energy of low-energy `127Xe` calibration events. The [saved `127Xe` example below](#a-saved-corpus-coverage-example) shows what changed when the relevant thesis was added.

## The Scientific Problem

For a numerical answer, I wanted the source location, units, and stated uncertainty. The checks were:

- which document was used
- which page or text region contained the answer
- whether the retrieved passage actually supports the claim
- whether the model preserved units, qualifiers, and uncertainty language
- whether the answer came from the requested source rather than adjacent but incompatible material

## Retrieval Model

The RAG system in the notebooks used a standard dense-retrieval pipeline:

1. parse source documents from a Google Drive directory
2. split the extracted text into overlapping chunks
3. embed each chunk into a vector space
4. embed the user question into the same vector space
5. retrieve the top-ranked chunks by vector similarity
6. pass those chunks, plus the question, to the LLM

As a conceptual example, cosine similarity can rank a question against document chunks:

```text
score(q, c_i) = cos(embed(q), embed(c_i))
```

This equation illustrates dense retrieval; it does not specify the notebook index's similarity implementation. Retrieval does not guarantee a correct answer: parsing or ranking can omit the right passage, and the generator can misread a passage that was retrieved.

## Two Implementations

The workshop used two parallel Colab notebooks so participants could see the same workflow with different model-serving assumptions.

| Path | Model setup | Retrieval setup | Role in the workshop |
| --- | --- | --- | --- |
| **Hosted API** | `gpt-4o-mini` through the OpenAI API | LlamaIndex document loading, chunking, embeddings, vector indexing, and query engine | Fast path for prototyping and comparing model answers against retrieved evidence |
| **Open model** | `meta-llama/Meta-Llama-3.1-8B-Instruct` through Hugging Face in a GPU-backed Colab runtime | LlamaIndex with `BAAI/bge-small-en-v1.5` embeddings for vector search | Running the model and configuring its tokenizer and embeddings in the Colab session |

The hosted path required API access. The Llama model ran in a GPU-backed Colab session with the notebook's dependencies, Hugging Face model access, and enough GPU memory.

## Indexing Parameters

**Workshop settings, January 2025.** Both [historical notebooks](#jupyter-notebooks) pinned `llama-index==0.12.3` and used:

```python
Settings.chunk_size = 1000
Settings.chunk_overlap = 100

query_engine = index.as_query_engine(similarity_top_k=5)
response = query_engine.query(question)
```

- **Chunk size:** larger chunks preserve more local context, but make retrieval less selective and consume more prompt budget.
- **Chunk overlap:** overlap reduces boundary artifacts, especially when a definition, figure caption, or table explanation straddles a chunk boundary.
- **Embedding model:** the embedding model defines the retrieval geometry. It determines which passages are "near" the question before the LLM sees anything.
- **Top-k retrieval:** increasing `similarity_top_k` improves recall only if the relevant chunks are somewhere near the top of the ranking; it also adds more irrelevant text for the generator to reconcile.

PDF extraction can separate tables, equations, captions, units, and paragraph references. A chunk that is reasonable for prose may be too small for a table and its caption, while a chunk that preserves a table may be too broad for precise nearest-neighbor retrieval.

## What We Inspected

Inspect `response.metadata` and `response.source_nodes` to see the retrieved evidence:

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

Checks for other answers include whether "about 2.45 MeV" preserves the source's measured neutron energy and statistical/systematic uncertainties, whether a recoil endpoint retains `keVnr`, and whether neutron-source rates and S1/S2 signal sizes retain their measurement conditions. These are checks to apply, not a list of observed model failures.

<div id="practical-standard" aria-hidden="true"></div>

Compare the answer with its source chunks, including units, assumptions, and uncertainties. If the trace is wrong, revise the corpus, chunking, embedding model, or prompt and query again.

## Incremental Indexing

The notebooks also added new documents to an existing index. The first corpus used LUX D-D calibration papers; the second pass inserted Brown Particle Astrophysics theses:

```python
new_documents = SimpleDirectoryReader(new_llama_index_data_path, recursive=True).load_data()
new_nodes = SimpleNodeParser().get_nodes_from_documents(new_documents)
index.insert_nodes(new_nodes)
```

### A saved corpus-coverage example

The [hosted-API notebook's saved outputs](https://github.com/jverbus/jverbus.github.io/blob/05561bf052e4e3639ec245c9cdbeee61e02fb585/assets/files/2025_01_15_James_Verbus_Brown_AI_Winter_School_Open_AI.ipynb) record the same question before and after the thesis insertion:

> How low in energy was the ER response measured using 127Xe? Where did the 127Xe come from?

Before insertion, the retrieved passages came from the D-D papers. One discussed cosmogenic `131mXe`; the generated answer substituted that isotope and did not identify the `127Xe` threshold. After insertion, the saved answer reported a lowest energy deposition of **186 eV** and attributed the `127Xe` to cosmogenic activation while the xenon was above ground.

The new retrieval trace includes the Huang thesis, pages 77–78 in the notebook metadata. The page-78 passage describes the calibration as “reaching all the way down to the observation of 186 eV energy deposition”; the page-77 passage attributes the isotope to cosmogenic activation before the xenon was moved underground. These are passages saved in `response.source_nodes`, so the answer's energy, units, and origin can be checked against the retrieved text. Adding the thesis gave the retriever the passage containing the 186 eV result and the isotope's origin.

## Materials

- <span id="workshop-recording" aria-hidden="true"></span>[Workshop Recording](https://www.youtube.com/watch?v=3Ra9vuHEh7U&list=PL21yWP3gTVmo7gfqS1y0GSeB5ypla8kvi&index=5)
- <span id="jupyter-notebooks" aria-hidden="true"></span>[OpenAI-based LLM Setup](https://github.com/jverbus/jverbus.github.io/blob/master/assets/files/2025_01_15_James_Verbus_Brown_AI_Winter_School_Open_AI.ipynb)
- [Llama-based LLM Setup](https://github.com/jverbus/jverbus.github.io/blob/master/assets/files/2025_01_15_James_Verbus_Brown_AI_Winter_School_LLaMa.ipynb) ([historical snapshot](https://github.com/jverbus/jverbus.github.io/blob/05561bf052e4e3639ec245c9cdbeee61e02fb585/assets/files/2025_01_15_James_Verbus_Brown_AI_Winter_School_LLaMa.ipynb))
- <span id="slides" aria-hidden="true"></span>[Slides (PDF)]({{ '/assets/files/2025-01-15%20-%20James%20Verbus%20-%20Brown%20AI%20Winter%20School.pdf' | relative_url }})
- <span id="event-page" aria-hidden="true"></span>[2025 AI Winter School Event Page](https://indico.physics.brown.edu/event/34/)
