# E2E Testing Workflow

This document defines the end-to-end testing workflow for the open-excel add-in. All features must pass E2E validation before committing.

## Prerequisites

- Bun >= 1.3.0
- LiteLLM proxy running at `http://localhost:4000`
- HTTPS dev certs installed (`bun run certs:install`)
- Chrome DevTools MCP configured (see MCP Setup below)

## MCP Setup (Chrome DevTools)

The project uses `chrome-devtools-mcp` for automated browser-based E2E testing. An MCP server is configured in `.claude/settings.local.json`.

Chrome profile location: `~/.cache/chrome-devtools-mcp/chrome-profile`

This profile persists cookies and login sessions for Excel Online, so you do not need to re-authenticate on each test run.

### How it works

1. Claude Code launches `chrome-devtools-mcp` as an MCP server.
2. CDM opens Chrome with the persistent profile (already logged into Microsoft/Excel Online).
3. Claude Code uses CDM tools (`browser_navigate`, `browser_click`, `browser_type`, `browser_evaluate`, `browser_snapshot`) to drive the browser.
4. The add-in taskpane at `https://localhost:5173` is tested through the Excel Online iframe.

### MCP configuration

File: `.claude/settings.local.json`

```json
{
  "mcpServers": {
    "chrome-devtools-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--acceptInsecureCerts"
      ]
    }
  }
}
```

## Default model

The add-in defaults to the LiteLLM model alias `claude-opus-4.6`.

Override via `.env.local` with `VITE_LITELLM_MODEL`.

## E2E Test Flow

### Step 1: Start the dev server

```bash
cd /Users/wenhe/code/open-excel
bun run manifest:validate
bun run dev
```

The dev server runs at `https://localhost:5173` with the Vite proxy forwarding `/api/litellm/*` to `http://localhost:4000`.

### Step 2: Open Excel Online with the add-in

Option A (manual):

```bash
bun run office:web:start
```

This opens Excel Online and sideloads the add-in manifest. In the ribbon, click `More options` -> `Claude Rebuild` to open the taskpane.

Option B (CDM automated):

Use CDM tools to navigate to Excel Online and open the sideloaded workbook directly. The Chrome profile already has the Microsoft login session.

### Step 3: Navigate the taskpane

If the taskpane is not at the workbench, complete the route flow:
1. Login page -> click through
2. Terms page -> accept
3. Onboarding page -> complete
4. Workbench page -> ready to test

### Step 4: Run test queries

#### Smoke test (minimal)

Use this simple query to verify the basic pipeline works:

```text
List all sheets in this workbook with their dimensions.
```

Expected behavior:
- Agent calls `get_sheets_metadata`
- Returns a list of sheet names with row/column counts
- No errors in the debug timeline

#### Structured tool test

```text
Read the contents of Sheet1!A1:C3.
```

Expected behavior:
- Agent calls `get_cell_ranges` with sheetName="Sheet1" and ranges=["A1:C3"]
- Returns cell values in the response
- Debug timeline shows llm-request -> llm-response -> tool-start -> tool-result -> final-answer

#### Write test

```text
Write "Hello from open-excel" into Sheet1!A1, then read it back to confirm.
```

Expected behavior:
- Agent calls `set_cell_range` to write the value
- Agent calls `get_cell_ranges` to verify
- Final response confirms the value was written

#### Complex audit test (known-good)

```text
Using the live Excel workbook only, update the existing Analysis sheet into a richer audit view. First inspect all sheets and the used ranges you need. Then overwrite Analysis!A1:D8 with a report that has headers Section, Metric, Value, Notes. Include rows for workbook sheet names, active sheet name, total sheet count, Sheet1!A1 value, whether the Analysis sheet already existed before this run, and a short data quality note. Also write a concise executive summary sentence into Analysis!F1 that mentions the workbook state in plain English. After writing, select Analysis!A1 and verify the final values by reading them back before you answer.
```

Expected results:
1. `Analysis!A1:D8` rewritten as a four-column audit table.
2. `Analysis!F1` filled with a one-sentence executive summary.
3. `Analysis!A1` selected at the end of the run.
4. Final verification shows successful `get_cell_ranges` readback.
5. Debug timeline shows multiple tool iterations.

### Step 5: Verify

After each test:
1. Check the debug timeline for expected trace events.
2. Verify the workbook was modified correctly (inspect cells).
3. Confirm no runtime errors in the console.

### Step 6: Static checks

```bash
bun run typecheck
bun run lint
bun run build
```

All three must pass before committing.

## CDM E2E Test Procedure (for Claude Code agents)

When an AI agent needs to run E2E tests using CDM, follow this procedure:

1. Ensure the dev server is running (`bun run dev` in background).
2. Use CDM `browser_navigate` to open the Excel Online workbook URL.
3. Use CDM `browser_snapshot` to verify the page loaded.
4. Navigate to the taskpane (may need to click through the add-in ribbon).
5. Use CDM `browser_evaluate` to interact with the React taskpane:
   - Set textarea value via native setter + dispatch `input` event (React controlled input).
   - Click the submit button.
6. Wait for the agent turn to complete.
7. Use CDM `browser_snapshot` or `browser_evaluate` to read the response.
8. Verify expected behavior.

### React textarea interaction pattern

The workbench prompt is a controlled React textarea. Direct `.value` assignment does not trigger React state updates. Use this pattern:

```javascript
const textarea = document.querySelector('textarea');
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLTextAreaElement.prototype, 'value'
).set;
nativeInputValueSetter.call(textarea, 'your prompt here');
textarea.dispatchEvent(new Event('input', { bubbles: true }));
textarea.dispatchEvent(new Event('change', { bubbles: true }));
```

## Debug features

### Runtime traces

Each turn records:
- LiteLLM request boundary and response latency
- Tool-call arguments
- Tool result or tool error payload
- Final assistant response timing

Use the timeline first when a test flakes. It shows whether the failure came from routing, model I/O, tool selection, or workbook mutation.

### Debugging notes

- If the assistant stops after planning but never calls tools, inspect LiteLLM response parsing. Some providers split content and tool calls across multiple `choices`.
- If Excel shows the wrong add-in, reopen from `More options` and explicitly choose `Claude Rebuild`.
- `get_range_image` returns Base64 PNG for visual debugging.
- `get_cell_ranges` with `includeStyles=true` inspects presentation before restyling.

## Common failure patterns

| Symptom | Cause | Fix |
|---------|-------|-----|
| HTTPS taskpane cannot reach LiteLLM | Direct HTTP call from HTTPS iframe | Use `/api/litellm/v1` via Vite proxy |
| Tool loop stalls | LiteLLM not responding or parsing error | Check LiteLLM logs, inspect debug timeline |
| Agent plans but never calls tools | Provider splits content/tool_calls | Check response parsing in `client.ts` |
| Wrong add-in opens | Multiple add-ins sideloaded | Explicitly choose "Claude Rebuild" from ribbon |
| CDM cannot find taskpane elements | Iframe sandboxing | Switch to the taskpane frame context in CDM |

## When adding new features

1. Write the feature code.
2. Validate in Excel Online via the taskpane.
3. Add a test query to this document if the feature introduces new tool behavior.
4. Run `bun run typecheck && bun run lint && bun run build`.
5. Commit with conventional commit format.
