# open-excel

Open-source AI-powered Excel add-in with tool-calling agent loop.

## Overview

An Excel add-in (React/Vite/TypeScript/Office.js) that provides an AI-powered taskpane with:

- routed taskpane shell
- gated boot flow
- local provider configuration
- tool-calling workbook agent loop
- Office.js workbook adapter

The LLM backend uses any OpenAI-compatible endpoint via LiteLLM.

## Stack

- Vite
- React
- TypeScript
- React Router
- Zustand
- Office.js
- LiteLLM via OpenAI-compatible `/chat/completions`

## Implemented tools

- `get_sheets_metadata`
- `get_cell_ranges`
- `set_cell_range`
- `clear_cell_range`
- `get_range_image`
- `execute_office_js`

## Not implemented yet

- bootstrap / claims merge
- MCP
- conductor
- PowerPoint / Word surfaces
- telemetry and analytics
- chart OOXML extraction

## Development

```bash
bun install
bun run certs:install
bun run dev
```

Default LiteLLM taskpane endpoint:

- `/api/litellm/v1`

Default LiteLLM upstream:

- `http://127.0.0.1:4000`

Environment variables:

- `LITELLM_UPSTREAM_URL`
- `VITE_LITELLM_BASE_URL`
- `VITE_LITELLM_MODEL`
- `VITE_LITELLM_API_KEY`

The Vite dev server proxies `/api/litellm/*` to `LITELLM_UPSTREAM_URL`, so the Excel taskpane can stay on HTTPS while talking to a local HTTP LiteLLM process.

Default model alias:

- `claude-opus-4.6`

## Build

```bash
bun run build
```

## E2E Flow

The only supported E2E path is the real Excel Online taskpane opened from `More options -> Open Excel`.

Detailed workflow notes live in:

- [docs/e2e-workflow.md](docs/e2e-workflow.md)

## Office sideload

An Excel add-in manifest is included:

- `manifest.xml`

Expected dev URL:

- `https://localhost:5173`

Notes:

- The Vite dev server uses `office-addin-dev-certs` for trusted localhost HTTPS certificates.
- The included icons are placeholders only.
- Run `bun run manifest:validate` before sideloading.
- Use `bun run office:web:start` to start the dev server and launch Excel on the web sideload flow with the official debugging toolchain.
- In Excel Online, reopen the taskpane from `More options -> Open Excel` when multiple add-ins are present.
