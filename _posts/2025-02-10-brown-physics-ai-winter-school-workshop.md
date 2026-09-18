---
layout: post
title: "Exploring LLMs and RAG at the 2025 AI Winter School (Brown University)"
date: 2025-02-10
last_modified_at: 2026-09-17
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

Participants compared direct model answers with answers generated from retrieved passages. We used LUX calibration papers and Brown Particle Astrophysics theses, asking about the D-D neutron energy, the electric fields used in yield measurements, and the energy and origin of low-energy `127Xe` calibration events.

## Checking numerical answers
{: #the-scientific-problem }

For numerical answers, we checked the source passage, units, measurement conditions, and stated uncertainty. Page references made it possible to compare the answer with the original document.

## Retrieval Model

The RAG system in the notebooks used a standard dense-retrieval pipeline:

1. parse source documents from a Google Drive directory
2. split the extracted text into overlapping chunks
3. embed each chunk into a vector space
4. embed the user question into the same vector space
5. retrieve the top-ranked chunks by vector similarity
6. pass those chunks, plus the question, to the LLM

For example, a dense retriever can rank a question `q` against a document chunk `c_i` using cosine similarity:

```text
score(q, c_i) = cos(embed(q), embed(c_i))
```

## Two Implementations

We provided two Colab notebooks: one used a hosted API, and the other ran an open-weight model in the Colab runtime.

| Model | Execution | Retrieval |
| --- | --- | --- |
| `gpt-4o-mini` | OpenAI API | LlamaIndex document loading, chunking, embeddings, vector index, and query engine |
| `meta-llama/Meta-Llama-3.1-8B-Instruct` | Hugging Face model in a GPU-backed Colab runtime | LlamaIndex with `BAAI/bge-small-en-v1.5` embeddings |

The hosted path required API access. The Llama model ran in a GPU-backed Colab session with the notebook's dependencies, Hugging Face model access, and enough GPU memory.

## Indexing Parameters

The January 2025 [notebooks](#jupyter-notebooks) pinned `llama-index==0.12.3` and used the following settings:

```python
Settings.chunk_size = 1000
Settings.chunk_overlap = 100

query_engine = index.as_query_engine(similarity_top_k=5)
response = query_engine.query(question)
```

- **Chunk size:** Larger chunks preserve more surrounding text but use more of the prompt and make individual matches less specific.
- **Chunk overlap:** Overlap retains context when a definition or explanation crosses a chunk boundary.
- **Embedding model:** The embeddings determine which chunks are ranked near a question.
- **Top-k retrieval:** Increasing `similarity_top_k` includes more candidate passages, at the cost of a longer prompt and potentially more irrelevant text.

PDF extraction may separate a table from its caption or detach units from the associated values. Chunk boundaries can compound the problem by splitting a definition from the passage that uses it.

## Inspecting retrieved passages
{: #what-we-inspected }

The `response.metadata` and `response.source_nodes` fields identify the retrieved documents and passages:

```python
response.metadata
response.source_nodes
```

The retrieved passages help distinguish three sources of error:

| Source of error | Description | Check |
| --- | --- | --- |
| Missing document | The relevant paper or thesis is absent from the index. | Loaded documents and index contents |
| Retrieval | The relevant text is indexed, but the returned passages do not contain the answer. | `source_nodes`, page metadata, chunk text, and ranking |
| Answer generation | A retrieved passage contains the answer, but the model changes a value, unit, or qualification. | The generated answer against the passage |

<div id="practical-standard" aria-hidden="true"></div>

## Incremental Indexing

The notebooks also added new documents to an existing index. The first corpus used LUX D-D calibration papers; the second pass inserted Brown Particle Astrophysics theses:

```python
new_documents = SimpleDirectoryReader(new_llama_index_data_path, recursive=True).load_data()
new_nodes = SimpleNodeParser().get_nodes_from_documents(new_documents)
index.insert_nodes(new_nodes)
```

### Adding the missing thesis
{: #a-saved-corpus-coverage-example }

The [hosted-API notebook](https://github.com/jverbus/jverbus.github.io/blob/05561bf052e4e3639ec245c9cdbeee61e02fb585/assets/files/2025_01_15_James_Verbus_Brown_AI_Winter_School_Open_AI.ipynb) includes answers to the same question before and after the theses were added:

> How low in energy was the ER response measured using 127Xe? Where did the 127Xe come from?

Before insertion, the retrieved passages came from the D-D papers. One discussed cosmogenic `131mXe`; the generated answer substituted that isotope and did not identify the `127Xe` threshold. After insertion, the saved answer reported a lowest energy deposition of **186 eV** and attributed the `127Xe` to cosmogenic activation while the xenon was above ground.

After insertion, `response.source_nodes` included passages from the Huang thesis on pages 77–78, as numbered in the notebook metadata. Those passages give the 186 eV energy deposition and attribute the isotope to cosmogenic activation before the xenon was moved underground.

## Materials

- <span id="workshop-recording" aria-hidden="true"></span>[Workshop Recording](https://www.youtube.com/watch?v=3Ra9vuHEh7U&list=PL21yWP3gTVmo7gfqS1y0GSeB5ypla8kvi&index=5)
- <span id="jupyter-notebooks" aria-hidden="true"></span>[OpenAI-based LLM Setup](https://github.com/jverbus/jverbus.github.io/blob/master/assets/files/2025_01_15_James_Verbus_Brown_AI_Winter_School_Open_AI.ipynb)
- [Llama-based LLM Setup](https://github.com/jverbus/jverbus.github.io/blob/master/assets/files/2025_01_15_James_Verbus_Brown_AI_Winter_School_LLaMa.ipynb) ([historical snapshot](https://github.com/jverbus/jverbus.github.io/blob/05561bf052e4e3639ec245c9cdbeee61e02fb585/assets/files/2025_01_15_James_Verbus_Brown_AI_Winter_School_LLaMa.ipynb))
- <span id="slides" aria-hidden="true"></span>[Slides (PDF)]({{ '/assets/files/2025-01-15%20-%20James%20Verbus%20-%20Brown%20AI%20Winter%20School.pdf' | relative_url }})
- <span id="event-page" aria-hidden="true"></span>[2025 AI Winter School Event Page](https://indico.physics.brown.edu/event/34/)
