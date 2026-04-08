import type { Api, Model } from "@mariozechner/pi-ai";
import { getModels } from "@mariozechner/pi-ai";
import { githubCopilotOAuthProvider } from "@mariozechner/pi-ai/oauth";
import type { ProviderConfig } from "./config";

function resolveBaseUrl(baseUrl: string): string {
  if (typeof window !== "undefined" && baseUrl.startsWith("/")) {
    return `${window.location.origin}${baseUrl}`;
  }
  return baseUrl;
}

export function resolveModelFromConfig(config: ProviderConfig): Model<Api> {
  if (config.type === "github-copilot") {
    let models = getModels("github-copilot") as Model<Api>[];
    if (config.credentials) {
      models = githubCopilotOAuthProvider.modifyModels!(models, config.credentials);
    }
    const selected = models.find((m) => m.id === config.modelId);
    if (!selected) throw new Error(`Model "${config.modelId}" not found in GitHub Copilot models`);
    return selected;
  }

  return {
    id: config.model,
    name: config.model,
    api: "openai-completions",
    provider: "litellm",
    baseUrl: resolveBaseUrl(config.baseUrl.replace(/\/+$/, "") || "/api/litellm/v1"),
    reasoning: false,
    input: ["text", "image"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 192000,
    maxTokens: 48000,
  };
}

export function getModelDisplayId(config: ProviderConfig): string {
  if (config.type === "github-copilot") return config.modelId;
  return config.model;
}
