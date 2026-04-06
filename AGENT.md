# AGENT.md

Instructions for AI coding agents working on the open-excel project.

## Project Overview

open-excel is an open-source AI-powered Excel add-in. It runs as an Office.js taskpane inside Excel Online, using a LiteLLM proxy for model-agnostic AI backend access. The core interaction model is a tool-calling agent loop that reads, writes, and formats workbook data through structured tools and an arbitrary Office.js escape hatch.

## Tech Stack

- **Runtime**: Bun (not npm/yarn)
- **Framework**: React 19 + Vite 8
- **Language**: TypeScript 5.9 (strict mode)
- **State management**: Zustand
- **Validation**: Zod
- **Linting/Formatting**: Biome
- **Excel integration**: Office.js
- **AI backend**: LiteLLM (OpenAI-compatible `/chat/completions` API)
- **Routing**: React Router (MemoryRouter)

## Architecture

The system is organized in 7 layers, top to bottom:

1. **React UI** -- `WorkbenchPage` hosts `ChatPanel` (conversation) and `WorkbookInspector` (workbook preview). Routes flow: login -> terms -> onboarding -> workbench.
2. **Agent Loop** (`runAgentTurn`) -- Iterates up to 8 tool-calling rounds per user turn. Sends transcript to LiteLLM, dispatches tool calls, appends results, and repeats until the model returns a final text answer or the iteration limit is reached.
3. **Tool Registry** (`buildToolRegistry`) -- 6 tools with Zod input validation. Returns OpenAI-format tool definitions and executor functions keyed by tool name.
4. **LiteLLM HTTP Client** (`createChatCompletion`) -- Sends OpenAI-compatible requests to the configured endpoint. Normalizes response content (string or content-part arrays) and extracts tool calls across all choices.
5. **Workbook Adapter** (`WorkbookAdapter` interface) -- Defines the contract for workbook operations: metadata, read, write, clear, image export, and raw Office.js execution.
6. **Office.js Context** -- All adapter methods run inside `Excel.run()` contexts. The adapter implementation lives in `src/lib/adapters/`.
7. **Live Excel Workbook** -- The actual spreadsheet open in Excel Online.

## Key Directories

```
src/
  app/              App shell and MemoryRouter setup
  components/       UI components (ChatPanel, WorkbookInspector)
  lib/
    adapters/       WorkbookAdapter interface and Office.js implementation
    agent/          Agent runtime (runAgentTurn) and tool registry
    debug/          Runtime event tracing (timeline)
    excel/          A1 notation utilities
    litellm/        LiteLLM HTTP client and provider config
    types/          Type definitions (LLM messages, workbook types)
  routes/           Page routes (LoginPage, TermsPage, OnboardingPage, WorkbenchPage)
  state/            Zustand stores (sessionStore)
  styles/           CSS
docs/               Documentation (e2e-workflow.md)
```

## Development Commands

```bash
bun install                # Install dependencies
bun run dev                # Dev server (https://localhost:5173)
bun run build              # TypeScript check + production build
bun run typecheck          # TypeScript type checking only
bun run lint               # Biome lint
bun run format             # Biome format (auto-fix)
bun run certs:install      # Install HTTPS certs for Office.js dev
bun run certs:verify       # Verify HTTPS certs
bun run manifest:validate  # Validate Office add-in manifest.xml
bun run office:web:start   # Launch Excel Online with sideloaded add-in
bun run office:web:stop    # Stop the Office debugging session
```

## Environment

- **LiteLLM proxy**: `http://localhost:4000` (default upstream)
- **Default model**: `claude-opus-4.6`
- **Dev server**: `https://localhost:5173` (HTTPS required for Office.js)
- **Vite proxy**: `/api/litellm/*` proxies to `LITELLM_UPSTREAM_URL` (bridges HTTPS taskpane to HTTP LiteLLM)

Environment variables:

| Variable | Purpose |
|---|---|
| `LITELLM_UPSTREAM_URL` | LiteLLM upstream URL for the Vite proxy |
| `VITE_LITELLM_BASE_URL` | Base URL exposed to the client |
| `VITE_LITELLM_MODEL` | Model alias override |
| `VITE_LITELLM_API_KEY` | API key for LiteLLM |

## E2E Testing

Chrome DevTools MCP (CDM) is configured as the E2E testing tool. It drives Chrome with a persistent profile that has Microsoft/Excel Online sessions cached.

- CDM config: `.claude/settings.local.json`
- Chrome profile: `~/.cache/chrome-devtools-mcp/chrome-profile`
- Full E2E docs: `docs/e2e-workflow.md`

CDM tools available: `browser_navigate`, `browser_click`, `browser_type`, `browser_evaluate`, `browser_snapshot`.

## Development Workflow (CRITICAL)

Every feature must be E2E tested in Excel Online before committing. The real Excel Online taskpane is the primary validation path.

1. Start the dev server:
   ```bash
   bun run dev
   ```
2. Open Excel Online and sideload the add-in (or use CDM to navigate).
3. In Excel Online, open the add-in from `More options` -> `OpenExcel`.
4. If the taskpane is not at the workbench, complete the route flow: login -> terms -> onboarding -> workbench.
5. Confirm the model pill shows `claude-opus-4.6`.
6. Run a test query against the live workbook. Verify the add-in reads and writes correctly.
7. Check the debug timeline for expected trace events.
8. After E2E passes, run the full check suite:
   ```bash
   bun run typecheck && bun run lint && bun run build
   ```
9. Only then commit.

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

All tool inputs are validated with Zod schemas before execution. The agent system prompt instructs the model to prefer structured tools over `execute_office_js`.

## Known Constraints

- The add-in runs in Excel Online's browser sandbox. It cannot access localhost directly from the iframe.
- All LLM API calls must go through the Vite proxy (`/api/litellm/v1`) to bridge HTTPS to HTTP.
- Office.js APIs require an `Excel.run()` context for all workbook operations.
- The taskpane iframe has limited DOM access. Chrome DevTools can debug the taskpane, but programmatic DOM manipulation requires dispatching native events.
- The agent loop hard-caps at 8 tool-calling iterations per turn. If exceeded, the runtime throws.
- Temperature is fixed at 0.2 for all completions.

## Testing Checklist for New Features

- [ ] TypeScript compiles: `bun run typecheck`
- [ ] Lint passes: `bun run lint`
- [ ] Build succeeds: `bun run build`
- [ ] E2E: Add-in loads in Excel Online taskpane
- [ ] E2E: Feature works against live workbook
- [ ] E2E: Agent reads back results to verify correctness
- [ ] Debug timeline shows expected trace events

## Common Failure Patterns

- **HTTPS taskpane cannot call HTTP LiteLLM directly**: Use `/api/litellm/v1` in the client and set `LITELLM_UPSTREAM_URL` for the Vite proxy.
- **Tool loop stalls**: Open the debug timeline. If only `llm-request` events appear with no tool results, check LiteLLM logs.
- **Assistant plans but never calls tools**: Inspect LiteLLM response parsing. Some providers split content and tool calls across multiple choices.
- **Wrong add-in opens**: Reopen from `More options` and explicitly choose `OpenExcel`.

## Future Plans

- Add streaming responses
- Add pi-web-ui integration
- Add more workbook tools
- Support Word and PowerPoint surfaces
- MCP integration
- Telemetry and analytics
