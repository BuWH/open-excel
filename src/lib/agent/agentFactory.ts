import { Agent } from "@mariozechner/pi-agent-core";
import type { Model } from "@mariozechner/pi-ai";
import type { WorkbookAdapter } from "../adapters/types";
import type { ProviderConfig } from "../types/llm";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { createWorkbookTools } from "./tools";

function resolveBaseUrl(baseUrl: string): string {
  // pi-ai passes baseUrl to OpenAI SDK which requires an absolute URL.
  // In the browser, relative paths like "/api/litellm/v1" need the current origin.
  if (typeof window !== "undefined" && baseUrl.startsWith("/")) {
    return `${window.location.origin}${baseUrl}`;
  }
  return baseUrl;
}

function createLiteLlmModel(provider: ProviderConfig): Model<"openai-completions"> {
  return {
    id: provider.model,
    name: provider.model,
    api: "openai-completions",
    provider: "litellm",
    baseUrl: resolveBaseUrl(provider.baseUrl),
    reasoning: false,
    input: ["text", "image"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 16384,
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
    getApiKey: () => {
      const key = provider.apiKey.trim();
      // pi-ai requires a non-empty API key; LiteLLM proxy doesn't validate it
      return key.length > 0 ? key : "no-key";
    },
  });
}
