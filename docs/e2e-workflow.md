# Rebuild E2E Workflow

This document locks down the current end-to-end workflow for the `rebuild` package so future iterations can start from a known-good path instead of rediscovering the setup.

## Goals

- Make the real Excel Online taskpane path the primary end-to-end loop.
- Keep the sideloaded `Claude Rebuild` add-in easy to reopen and debug inside a live workbook.
- Keep complex workbook prompts repeatable through documented real-host prompts.

## Default model

The rebuild now defaults to the LiteLLM model alias:

- `claude-opus-4.6`

Override it only when you explicitly need a different backend:

- `.env.local`
- `VITE_LITELLM_MODEL`

## Daily loop

### 1. Install and verify

```bash
cd rebuild
bun install
bun run certs:install
bun run certs:verify
```

### 2. Real Excel Online E2E

This is the default validation path for the add-in. Open the actual workbook, launch the real `Claude Rebuild` taskpane, and run a realistic query against the live workbook.

```bash
cd rebuild
bun run manifest:validate
bun run office:web:start
```

Use this exact host flow:

1. Open the workbook in Excel Online.
2. In the ribbon, click `More options`.
3. In the dropdown, choose `Claude Rebuild`.
4. If the taskpane is not already at the workbench, complete the route flow: login -> terms -> onboarding -> workbench.
5. Confirm the model pill shows `claude-opus-4.6`.
6. Run at least one structured prompt and one prompt that requires `execute_office_js`.

Recommended real-host checks:

1. The taskpane loads from `https://localhost:5173`.
2. The model selector/session store resolves to `claude-opus-4.6`, not an older GPT default.
3. The prompt creates or rewrites workbook content in the live document.
4. The assistant reads the final values back with `get_cell_ranges` before finishing.
5. The selected cell in Excel matches the final assistant response.

Current known-good complex real-host prompt:

```text
Using the live Excel workbook only, update the existing Analysis sheet into a richer audit view. First inspect all sheets and the used ranges you need. Then overwrite Analysis!A1:D8 with a report that has headers Section, Metric, Value, Notes. Include rows for workbook sheet names, active sheet name, total sheet count, Sheet1!A1 value, whether the Analysis sheet already existed before this run, and a short data quality note. Also write a concise executive summary sentence into Analysis!F1 that mentions the workbook state in plain English. After writing, select Analysis!A1 and verify the final values by reading them back before you answer.
```

Known-good result from the shared workbook on 2026-04-06:

1. `Analysis!A1:D8` rewritten as a four-column audit table.
2. `Analysis!F1` filled with a one-sentence executive summary.
3. `Analysis!C7` written with a UTC timestamp.
4. `Analysis!A1` selected at the end of the run.
5. Final verification returned 27 trace events and a successful `GET_CELL_RANGES` readback of the finished sheet.

## Debug features now available

### Runtime traces

Each turn records:

- LiteLLM request boundary
- LiteLLM response latency
- tool-call arguments
- tool result or tool error payload
- final assistant response timing

Use the timeline first when a test flakes. It is the fastest way to see whether the failure came from routing, model I/O, tool selection, or workbook mutation.

### Real-host debugging notes

- If Chrome DevTools `fill()` does not update the prompt input inside the taskpane, set the textarea value through the native setter and dispatch `input` + `change`. The workbench prompt is a controlled React textarea.
- If the assistant stops after a natural-language planning message and never executes tools, inspect LiteLLM response parsing first. A provider may split assistant content and tool calls across multiple `choices`.
- If Excel shows the wrong add-in, reopen from `More options` and explicitly choose `Claude Rebuild`, not `Claude`.
- `get_range_image` is now available for real-host runs. It uses `Excel.Range.getImage()` and returns a Base64 PNG for a target range. Use it for human debugging and style comparison.
- `get_cell_ranges` now supports `includeStyles=true` in the Office host. Use it before restyling an existing report when you want to preserve the current presentation instead of rewriting a naked grid.

## When adding new features

Use this order:

1. First validate the feature in Excel Online through `More options -> Claude Rebuild`.
2. Save at least one realistic real-host prompt in this document or in the UI prompt presets.
3. Re-run `bun run typecheck`, `bun run lint`, and `bun run build`.

## Common failure patterns

- `HTTPS taskpane cannot call an HTTP LiteLLM endpoint directly`
  Use `/api/litellm/v1` in the UI and set `LITELLM_UPSTREAM_URL` for the Vite proxy.

- Tool loop stalls
  Open the debug timeline. If you only see `LLM request` with no tool result, inspect LiteLLM logs first.
