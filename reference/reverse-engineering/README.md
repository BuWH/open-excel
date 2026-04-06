# Reverse Engineering Documentation

## Scope

These documents describe the local snapshot currently stored in this repository:

- local entry HTML: `index.html`
- main bundle: `m-addin/assets/index-CaYG1oEg.js`
- preload bundle: `m-addin/assets/index-D8FTRdxx.js`
- service name observed in bundle: `office-agent`
- release SHA observed in bundle: `8a3d43cefdceab518a6d097570376a752fe96819`

The local snapshot is not the current production build. On `2026-04-06`, the live entry page at `https://pivot.claude.ai/` referenced newer JS bundle hashes than the local sample.

## Documentation set

1. [01-system-architecture.md](/Users/wenhe/code/claude_in_excel/docs/reverse-engineering/01-system-architecture.md)
2. [02-boot-auth-and-provider-flow.md](/Users/wenhe/code/claude_in_excel/docs/reverse-engineering/02-boot-auth-and-provider-flow.md)
3. [03-excel-tool-surface-and-sandbox.md](/Users/wenhe/code/claude_in_excel/docs/reverse-engineering/03-excel-tool-surface-and-sandbox.md)
4. [04-mcp-conductor-and-cross-surface.md](/Users/wenhe/code/claude_in_excel/docs/reverse-engineering/04-mcp-conductor-and-cross-surface.md)
5. [05-reimplementation-strategy.md](/Users/wenhe/code/claude_in_excel/docs/reverse-engineering/05-reimplementation-strategy.md)
6. [06-feature-parity-matrix.md](/Users/wenhe/code/claude_in_excel/docs/reverse-engineering/06-feature-parity-matrix.md)

## Evidence sources

Use these directories when verifying claims:

- `reverse/pretty/`
- `reverse/extracts/`
- `reverse/analysis/generated/`

The English documentation is the canonical implementation-facing analysis. Older Chinese notes under `reverse/analysis/` are retained as intermediate working material.

