# CLAUDE.md

Read and follow [AGENTS.md](AGENTS.md) — it is the single source of truth for this repository's
build/test commands, verification workflow, CSS and typography conventions, the interactive-demo
pattern, content/SEO rules, and git workflow.

Two points worth repeating from it:

1. Verify every change with the test suites and validators listed there before committing.
2. Bump the relevant cache-bust (`?v=loopN` for CSS in `_includes/site/head.html`, `?v=N` for a
   demo script in its include) whenever the underlying file changes.
