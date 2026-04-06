# Refactoring Plan: pi-mono Integration

This document outlines the plan to refactor open-excel from its current custom LLM client and agent loop to use pi-mono's `@mariozechner/pi-ai` and `@mariozechner/pi-agent-core` packages.

## Current Architecture

```
WorkbenchPage (React)
  -> runAgentTurn() (custom agent loop, 8 iterations max)
    -> createChatCompletion() (custom HTTP client)
      -> fetch() to /api/litellm/v1/chat/completions
    -> buildToolRegistry() (Zod schemas, OpenAI tool format)
      -> executor functions calling WorkbookAdapter
```

### Files to refactor

| File | Role | Action |
|------|------|--------|
| `src/lib/agent/runtime.ts` | Agent loop | Replace with pi-agent-core Agent |
| `src/lib/agent/toolRegistry.ts` | Tool definitions + executors | Convert to AgentTool format |
| `src/lib/litellm/client.ts` | HTTP client | Replace with pi-ai stream/complete |
| `src/lib/litellm/provider.ts` | URL validation | Remove (handled by pi-ai) |
| `src/lib/types/llm.ts` | Message types | Replace with pi-ai/pi-agent-core types |
| `src/lib/debug/runtimeEvents.ts` | Debug events | Map to Agent events |
| `src/routes/WorkbenchPage.tsx` | Main UI + state | Refactor to use Agent instance |
| `src/state/sessionStore.ts` | Zustand store | Simplify (Agent manages conversation state) |
| `src/components/ChatPanel.tsx` | Chat UI | Update to consume Agent events |
| `src/lib/adapters/types.ts` | WorkbookAdapter | Keep unchanged |
| `src/lib/adapters/officeWorkbook.ts` | Office.js adapter | Keep unchanged |

## Phase 1: Agent Core Refactor

Replace the custom agent loop with pi-agent-core while keeping the UI layer unchanged.

### 1.1 Install dependencies

```bash
bun add @mariozechner/pi-ai @mariozechner/pi-agent-core @sinclair/typebox
```

Remove `zod` after migration (or keep if used elsewhere).

### 1.2 Convert tools to AgentTool format

Current tools use Zod schemas with OpenAI JSON Schema format. pi-agent-core uses TypeBox schemas with an `execute` function.

Create: `src/lib/agent/tools.ts`

```typescript
import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { WorkbookAdapter } from "../adapters/types";

export function createWorkbookTools(adapter: WorkbookAdapter): AgentTool[] {
  return [
    {
      name: "get_sheets_metadata",
      label: "Get Sheets Metadata",
      description: "Return worksheet names and dimensions.",
      parameters: Type.Object({}),
      execute: async () => {
        const result = await adapter.getSheetsMetadata();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      },
    },
    {
      name: "get_cell_ranges",
      label: "Get Cell Ranges",
      description: "Read one or more A1 ranges from a worksheet.",
      parameters: Type.Object({
        sheetName: Type.String(),
        ranges: Type.Array(Type.String(), { minItems: 1 }),
        includeStyles: Type.Optional(Type.Boolean()),
      }),
      execute: async (_toolCallId, params) => {
        const result = await adapter.getCellRanges(params);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      },
    },
    // ... same pattern for set_cell_range, clear_cell_range, get_range_image, execute_office_js
  ];
}
```

### 1.3 Create Agent factory

Create: `src/lib/agent/agentFactory.ts`

```typescript
import { Agent, type AgentMessage, type Message } from "@mariozechner/pi-agent-core";
import { getModel } from "@mariozechner/pi-ai";
import type { WorkbookAdapter } from "../adapters/types";
import { createWorkbookTools } from "./tools";
import { SYSTEM_PROMPT } from "./systemPrompt";

export function createExcelAgent(adapter: WorkbookAdapter, modelId: string) {
  const tools = createWorkbookTools(adapter);

  // Use OpenAI provider with custom baseUrl pointing to LiteLLM proxy
  const model = {
    ...getModel("openai", "gpt-4o"), // base config
    id: modelId,
    name: modelId,
    baseUrl: "/api/litellm/v1", // Vite proxy -> LiteLLM
  };

  return new Agent({
    initialState: {
      systemPrompt: SYSTEM_PROMPT,
      model,
      thinkingLevel: "off",
      tools,
      messages: [],
    },
    convertToLlm: (messages: AgentMessage[]): Message[] => {
      return messages.filter(
        (m): m is Message => ["user", "assistant", "toolResult"].includes(m.role)
      );
    },
  });
}
```

### 1.4 Extract system prompt

Move from inline string in `runtime.ts` to its own file.

Create: `src/lib/agent/systemPrompt.ts`

### 1.5 Create Agent event bridge for debug timeline

Create: `src/lib/agent/eventBridge.ts`

Map pi-agent-core events to the existing debug timeline format:

| Agent Event | Current Event Type |
|------------|-------------------|
| `turn_start` | `llm-request` |
| `turn_end` | `llm-response` |
| `tool_execution_start` | `tool-start` |
| `tool_execution_end` | `tool-result` / `tool-error` |
| `agent_end` | `final-answer` |

### 1.6 Update WorkbenchPage

Replace `runAgentTurn()` call with `agent.prompt()` + event subscription:

```typescript
const agent = createExcelAgent(adapter, provider.model);

agent.subscribe(async (event) => {
  switch (event.type) {
    case "message_update":
      // Stream text to UI
      break;
    case "tool_execution_start":
      // Add to debug timeline
      break;
    case "tool_execution_end":
      // Add result/error to debug timeline
      break;
    case "agent_end":
      // Finalize turn
      break;
  }
});

await agent.prompt(userInput);
```

### 1.7 Delete replaced files

After migration:
- Delete `src/lib/agent/runtime.ts`
- Delete `src/lib/agent/toolRegistry.ts`
- Delete `src/lib/litellm/client.ts`
- Delete `src/lib/litellm/provider.ts`
- Delete `src/lib/types/llm.ts` (replace with pi-ai types)

### 1.8 Testing checkpoint

- [ ] E2E: Add-in loads in taskpane
- [ ] E2E: Smoke test (list sheets) works
- [ ] E2E: Write test (write + readback) works
- [ ] E2E: Complex audit test passes
- [ ] Debug timeline shows correct events
- [ ] `bun run typecheck && bun run lint && bun run build` pass

### Risk: Proxy compatibility

pi-ai makes its own HTTP requests. In the browser (Excel Online taskpane), it needs to go through the Vite proxy. The `baseUrl` on the model must be set to `/api/litellm/v1` (relative URL) so the browser resolves it against the current origin (`https://localhost:5173`).

If pi-ai does not support relative URLs, create a custom `streamFn` or use `streamProxy` from pi-agent-core with the proxy URL.

Fallback: wrap pi-ai's fetch calls with a custom fetch that rewrites URLs.

## Phase 2: State and UI Refactor

After Phase 1 is stable and tested.

### 2.1 Simplify Zustand store

The Agent class manages conversation messages and streaming state internally. The Zustand store can be simplified to:
- Provider config (baseUrl, model, apiKey)
- Onboarding/terms flags
- Agent instance reference

Remove from Zustand: message history, debug turns (Agent manages these).

### 2.2 Add streaming support

pi-ai supports streaming via `stream()`. Update the UI to show tokens as they arrive:

```typescript
agent.subscribe(async (event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    appendDelta(event.assistantMessageEvent.delta);
  }
});
```

This replaces the current non-streaming approach where the full response appears at once.

### 2.3 Support model switching

pi-ai supports runtime model switching:

```typescript
agent.state.model = getModel("openai", newModelId);
```

Add a model selector dropdown that calls this when changed.

### 2.4 Testing checkpoint

- [ ] E2E: Streaming text appears incrementally
- [ ] E2E: Model switching works mid-session
- [ ] E2E: Session persistence still works
- [ ] All static checks pass

## Phase 3: Web UI Refactor (Future)

Evaluate pi-web-ui's `ChatPanel` component as a replacement for the custom chat UI.

### 3.1 Evaluate pi-web-ui

Questions to answer:
- Does ChatPanel support the Excel taskpane's narrow width?
- Can it render tool results as collapsible sections?
- Does it support the debug timeline view?
- Can it work within Office.js iframe constraints?

### 3.2 If adopting pi-web-ui

```bash
bun add @mariozechner/pi-web-ui
```

- Replace `src/components/ChatPanel.tsx` with pi-web-ui ChatPanel
- Replace `src/components/WorkbookInspector.tsx` with custom wrapper around pi-web-ui
- Migrate localStorage to IndexedDB (pi-web-ui uses IndexedDBStorageBackend)

### 3.3 If keeping custom UI

- Keep current ChatPanel but consume Agent events
- Add custom message renderers for tool results
- Keep WorkbookInspector as-is

### 3.4 Testing checkpoint

- [ ] E2E: Full flow works with new UI
- [ ] E2E: Tool results display correctly
- [ ] E2E: Debug timeline works
- [ ] All static checks pass

## Migration Order

```
Phase 1.1  Install deps
Phase 1.2  Convert tools (new file, no breaking changes)
Phase 1.3  Create Agent factory (new file)
Phase 1.4  Extract system prompt (new file)
Phase 1.5  Create event bridge (new file)
  -- E2E test: verify new files compile --
Phase 1.6  Update WorkbenchPage to use Agent
  -- E2E test: full flow works --
Phase 1.7  Delete old files
  -- E2E test + static checks --
Phase 2.1  Simplify Zustand
Phase 2.2  Add streaming
Phase 2.3  Model switching
  -- E2E test: streaming + model switch --
Phase 3    Web UI (separate decision)
```

Each phase produces a commit after E2E validation.

## Dependencies

### Add
- `@mariozechner/pi-ai`
- `@mariozechner/pi-agent-core`
- `@sinclair/typebox`

### Remove (after Phase 1)
- `zod` (if not used elsewhere)

### Keep
- `react`, `react-dom`, `react-router-dom`
- `zustand`
- `@types/office-js`
- `vite`, `@vitejs/plugin-react`
- `@biomejs/biome`
- `typescript`
- `office-addin-*` packages
