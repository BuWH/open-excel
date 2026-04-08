import type { Api, Model } from "@mariozechner/pi-ai";
import { getModels } from "@mariozechner/pi-ai";
import { getGitHubCopilotBaseUrl, githubCopilotOAuthProvider } from "@mariozechner/pi-ai/oauth";
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
    if (selected) return selected;

    // Model not in static list (fetched dynamically from Copilot API).
    // Construct a model object using the Copilot token's base URL.
    const baseUrl = config.credentials
      ? getGitHubCopilotBaseUrl(config.credentials.access)
      : "https://api.individual.githubcopilot.com";

    return {
      id: config.modelId,
      name: config.modelId,
      api: "openai-completions",
      provider: "github-copilot",
      baseUrl,
      headers: {
        "User-Agent": "GitHubCopilotChat/0.35.0",
        "Editor-Version": "vscode/1.107.0",
        "Editor-Plugin-Version": "copilot-chat/0.35.0",
        "Copilot-Integration-Id": "vscode-chat",
      },
      reasoning: false,
      input: ["text", "image"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 16000,
    };
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
