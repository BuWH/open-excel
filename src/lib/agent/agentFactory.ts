import type { AgentMessage } from "@mariozechner/pi-agent-core";
import { Agent } from "@mariozechner/pi-agent-core";
import type { Message, Model } from "@mariozechner/pi-ai";
import type { WorkbookAdapter } from "../adapters/types";
import type { ProviderConfig } from "../types/llm";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { createWorkbookTools } from "./tools";

function isLlmRole(role: string): role is "user" | "assistant" | "toolResult" {
  return role === "user" || role === "assistant" || role === "toolResult";
}

function createLiteLlmModel(provider: ProviderConfig): Model<"openai-completions"> {
  return {
    id: provider.model,
    name: provider.model,
    api: "openai-completions",
    provider: "openrouter",
    baseUrl: provider.baseUrl,
    reasoning: false,
    input: ["text", "image"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 16384,
    compat: {
      supportsStore: false,
      supportsDeveloperRole: false,
      supportsReasoningEffort: false,
      supportsStrictMode: false,
    },
  };
}

export function createExcelAgent(adapter: WorkbookAdapter, provider: ProviderConfig) {
  const tools = createWorkbookTools(adapter);
  const model = createLiteLlmModel(provider);

  return new Agent({
    initialState: {
      systemPrompt: SYSTEM_PROMPT,
      model,
      thinkingLevel: "off",
      tools,
      messages: [],
    },
    convertToLlm: (messages: AgentMessage[]) => {
      return messages.filter((m): m is Message => isLlmRole(m.role));
    },
    getApiKey: () => {
      const key = provider.apiKey.trim();
      return key.length > 0 ? key : undefined;
    },
  });
}
