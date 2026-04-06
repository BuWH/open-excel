import { Agent } from "@mariozechner/pi-agent-core";
import type { WorkbookAdapter } from "../adapters/types";
import { ENV_API_KEY, ENV_MODEL } from "../provider/env";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { createWorkbookTools } from "./tools";

export function createExcelAgent(adapter: WorkbookAdapter) {
  const tools = createWorkbookTools(adapter);

  return new Agent({
    initialState: {
      systemPrompt: SYSTEM_PROMPT,
      model: ENV_MODEL,
      thinkingLevel: "off",
      tools,
      messages: [],
    },
    getApiKey: () => {
      const key = ENV_API_KEY;
      return key.length > 0 ? key : "no-key";
    },
  });
}
