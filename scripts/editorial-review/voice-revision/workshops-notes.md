# Workshop article voice revision

Implemented on 2026-09-17. The 31 individual dispositions are in
`dispositions.json`: VOICE-RAG-01 through VOICE-RAG-19 and
VOICE-RL-01 through VOICE-RL-12 are all `edited`.

Both complete revised articles were read for flow after applying the specified
replacements. No unenumerated prose changes were needed. The brief's current-text
cues matched the source after accounting for Markdown links, code formatting and
typography; there was no substantive source drift in these two articles.

## Preservation and links

- Preserved all distinct external resource URLs, including immutable notebook
  snapshots, and all local asset paths. Link labels changed where required by the
  replacement prose. The removed RAG introduction's forward-link sentence was
  deleted under VOICE-RAG-01; its target remains at the renamed example heading.
- Retained `#the-scientific-problem`, `#what-we-inspected`,
  `#a-saved-corpus-coverage-example`, and `#experiment-loop` with explicit heading
  attributes. Retained `#practical-standard` as the existing empty anchor before
  Incremental Indexing. The existing diagnostics and Materials anchors remain.
- Source comparison with HEAD confirmed all five fenced code blocks, all eleven
  MathML blocks, all four image tags, the orbit demo include directive, post
  titles, and publication dates are byte-identical. Each modified date is
  2026-09-17.
- Compared normalized visible replacements against the brief for all 31 IDs.
  Explicitly deleted paragraphs are absent; no replacement disclaimer was added.
- No notebook, image, algorithm, demo include, script, shared UI or Castle file was
  changed by this work.

## Retained conditions and caveats

The RAG model-access and GPU requirements prevent readers from treating both
notebook execution paths as interchangeable. The parameter tradeoffs and the
parsing/chunk-boundary descriptions explain separate causes of changed retrieval
results. The three-category table distinguishes missing documents, retrieval
failure and generation failure. These are diagnostic conditions, followed by the
specific saved Huang-thesis example; they are not newly observed workshop failure
counts. The introductory numerical-answer check describes the workshop procedure,
while the later example identifies the actual wrong isotope and corrected answer.

The RL model omissions define the physical model used by the notebook. The saved
Hohmann radius/timestep residual identifies the finite-step analytic baseline,
without attributing that residual to PPO. The possible diagnostic patterns retain
the distinction between crossing the target radius and reaching the target
circular orbit. The final notebook note prevents a comparison from treating the
inconsistent custom-experiment output as if it matched its setup cell, and gives
the requested rerun/seed instructions. No notebook was rerun or silently repaired.

## Validation scope

Source-level replacement and preservation checks passed. Full build, site/demo
checks, rendered anchor/link checks and browser inspection are coordinated by the
parent task and are not claimed here. The saved RL configuration inconsistency
remains documented; no new scientific question or unsupported author admission
was introduced.
