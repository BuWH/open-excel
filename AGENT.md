# AGENT.md

Instructions for AI coding agents working on the open-excel project.

## Project Overview

open-excel is an open-source AI-powered Excel add-in. It runs as an Office.js taskpane inside Excel Online, using a LiteLLM proxy for model-agnostic AI backend access. The core interaction model is a tool-calling agent loop that reads, writes, and formats workbook data through structured tools and an arbitrary Office.js escape hatch.

## Tech Stack

- **Runtime**: Bun (not npm/yarn)
- **Framework**: React 19 + Vite 8
- **Language**: TypeScript 5.9 (strict mode)
- **Agent**: `@mariozechner/pi-agent-core` + `@mariozechner/pi-ai` for LLM tool-calling loop
- **State management**: Zustand
- **Linting/Formatting**: Biome
- **Excel integration**: Office.js
- **AI backend**: LiteLLM (OpenAI-compatible API via Vite proxy)
- **Routing**: React Router (MemoryRouter)
- **E2E**: Playwright (chromium, headed, against Excel Online)

## Architecture

The system is organized in layers, top to bottom:

1. **React UI** -- Custom chat components (no assistant-ui dependency). `WorkbenchPage` hosts `ChatThread` (conversation) and `WorkbookInspector` (workbook preview). Routes flow: login -> terms -> onboarding -> workbench.
2. **Message Conversion** (`src/lib/chat/types.ts`) -- Converts pi-agent-core messages to `ChatMessage` format with typed parts: text, thinking, tool-call.
3. **Agent Loop** (`@mariozechner/pi-agent-core`) -- Manages the tool-calling agent loop. Sends transcript to LiteLLM, dispatches tool calls, appends results, and repeats until the model returns a final answer.
4. **Tool Registry** (`src/lib/agent/tools.ts`) -- 6 tools with TypeBox input validation. Returns tool definitions and executor functions keyed by tool name.
5. **Workbook Adapter** (`WorkbookAdapter` interface) -- Defines the contract for workbook operations: metadata, read, write, clear, image export, and raw Office.js execution.
6. **Office.js Context** -- All adapter methods run inside `Excel.run()` contexts. The adapter implementation lives in `src/lib/adapters/`.
7. **Live Excel Workbook** -- The actual spreadsheet open in Excel Online.

## Key Directories

```
src/
  app/              App shell and MemoryRouter setup
  components/       UI components:
    ChatThread.tsx     Scrollable message list + input area
    ChatInput.tsx      Auto-resize textarea, send/stop buttons
    MessageBubble.tsx  User/assistant message rendering
    ToolCallCard.tsx   Collapsible tool call display (input/output)
    ThinkingBlock.tsx  Collapsible thinking + animated indicator
    WorkbookInspector.tsx  Debug panel for workbook preview
  lib/
    adapters/       WorkbookAdapter interface and Office.js implementation
    agent/          Agent factory, system prompt, tools, event bridge
    chat/           Message types and conversion (ChatMessage, ChatMessagePart)
    debug/          Runtime event tracing (timeline)
    excel/          A1 notation utilities
    provider/       LiteLLM provider config, env, models
    types/          Type definitions (workbook types)
  routes/           Page routes (LoginPage, TermsPage, OnboardingPage, WorkbenchPage)
  state/            Zustand stores (sessionStore)
  styles/           CSS (single index.css)
e2e/                Playwright E2E tests
```

## Development Commands

```bash
bun install                # Install dependencies
bun run dev                # Dev server (https://localhost:5173)
bun run dev:stop           # Kill dev server on port 5173
bun run build              # TypeScript check + production build
bun run typecheck          # TypeScript type checking only
bun run lint               # Biome lint
bun run format             # Biome format (auto-fix)
bun run certs:install      # Install HTTPS certs for Office.js dev
bun run certs:verify       # Verify HTTPS certs
bun run manifest:validate  # Validate Office add-in manifest.xml
bun run e2e                # Run Playwright E2E tests
bun run e2e:headed         # E2E tests in headed mode
```

## Environment

- **LiteLLM proxy**: `http://localhost:4000` (default upstream)
- **Default model**: `claude-opus-4.6`
- **Dev server**: `https://localhost:5173` (HTTPS required for Office.js)
- **Vite proxy**: `/api/litellm/*` proxies to `LITELLM_UPSTREAM_URL`

Environment variables (see `.env.example`):

| Variable | Purpose |
|---|---|
| `LITELLM_UPSTREAM_URL` | LiteLLM upstream URL for the Vite proxy |
| `VITE_PROVIDER_BASE_URL` | Base URL exposed to the client (default: `/api/litellm/v1`) |
| `VITE_PROVIDER_MODEL` | Model alias override (default: `claude-opus-4.6`) |
| `VITE_PROVIDER_API_KEY` | API key for LiteLLM |
| `VITE_PROVIDER_NAME` | Provider name (default: `litellm`) |

## E2E Testing

Playwright E2E tests drive a real Chrome browser against Excel Online.

- Tests: `e2e/e2e.spec.ts` (5 tests, ~50s total)
- Auth state cached: `e2e/.auth/state.json`
- **Dev server must be running** before tests
- Tests login to Microsoft, open Excel, sideload manifest, verify chat UI, submit prompt

CSS selectors used in tests:
- `.chat-input-textarea` - chat input field
- `.chat-input-btn-send` - send button
- `.msg-assistant` - assistant message container
- `.app-title` - header title

## UI Component CSS Classes

Key CSS class naming convention (flat BEM-like):

- Messages: `.msg`, `.msg-user`, `.msg-assistant`, `.msg-bubble-user`, `.msg-content`, `.msg-text`
- Tool cards: `.tool-card`, `.tool-card-header`, `.tool-card-body`, `.tool-card-code`
- Thinking: `.thinking-block`, `.thinking-indicator`, `.thinking-dot`
- Input: `.chat-input-container`, `.chat-input-wrapper`, `.chat-input-textarea`, `.chat-input-btn-send`, `.chat-input-btn-stop`
- Thread: `.thread`, `.thread-messages`, `.thread-input`, `.thread-empty`
- App shell: `.app-shell`, `.app-header`, `.app-content`, `.chat-area`

## Development Workflow

Every feature must be E2E tested in Excel Online before committing.

1. Start the dev server: `bun run dev`
2. Run E2E tests: `bun run e2e`
3. Run the full check suite: `bun run typecheck && bun run lint && bun run build`
4. Only then commit.

## Commit Conventions

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Include `Co-Authored-By` for AI contributions
- Small, focused commits
- Never skip pre-commit hooks

## 6 Workbook Tools

| Tool | Description |
|---|---|
| `get_sheets_metadata` | List all worksheet names and dimensions. Call before reading/writing when structure is unknown. |
| `get_cell_ranges` | Read one or more A1 ranges from a worksheet. Supports optional `includeStyles` for style inspection. |
| `set_cell_range` | Write values, formulas, or notes to cells by A1 address. |
| `clear_cell_range` | Clear values and formulas inside an A1 range. |
| `get_range_image` | Export a worksheet range as a Base64 PNG image for visual debugging or style comparison. |
| `execute_office_js` | Run arbitrary Office.js code inside `Excel.run()`. Fallback for formatting, layout, tables, and other host-only actions. |

All tool inputs are validated with TypeBox schemas before execution. The agent system prompt instructs the model to prefer structured tools over `execute_office_js`.

## Known Constraints

- The add-in runs in Excel Online's browser sandbox. It cannot access localhost directly from the iframe.
- All LLM API calls must go through the Vite proxy (`/api/litellm/v1`) to bridge HTTPS to HTTP.
- Office.js APIs require an `Excel.run()` context for all workbook operations.
- The taskpane iframe has limited DOM access.
- `index.html` must exist at project root -- Vite uses it as the entry point. If deleted, the dev server returns 404.
