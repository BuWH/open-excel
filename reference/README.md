# Claude in Excel Reverse Engineering Workspace

This repository captures a reverse-engineering effort against an obfuscated `pivot.claude.ai` Office add-in snapshot, plus a working reconstruction prototype that preserves the original product shape where possible.

## Repository goals

1. Preserve the original sample and extracted evidence.
2. Produce implementation-grade reverse-engineering documentation in English.
3. Rebuild the core Excel taskpane experience with a local LLM backend.
4. Make it feasible to continue toward a higher-fidelity clone incrementally.

## Main areas

- `reverse/`
  - Preserved local sample, pretty-printed bundles, extracted source slices, and generated indexes.
- `docs/reverse-engineering/`
  - Canonical English technical documentation for architecture, runtime behavior, tool surface, and reimplementation strategy.
- `rebuild/`
  - React/Vite/TypeScript prototype that recreates the routed taskpane shell and workbook tool-calling loop using LiteLLM.

## Starting points

- Reverse-engineering index: [docs/reverse-engineering/README.md](/Users/wenhe/code/claude_in_excel/docs/reverse-engineering/README.md)
- Prototype usage: [rebuild/README.md](/Users/wenhe/code/claude_in_excel/rebuild/README.md)
- Evidence catalog: [reverse/README.md](/Users/wenhe/code/claude_in_excel/reverse/README.md)

