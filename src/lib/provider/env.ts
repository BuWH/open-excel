import type { Model } from "@mariozechner/pi-ai";

const env = import.meta.env;
const envBaseUrl = ((env.VITE_PROVIDER_BASE_URL as string | undefined) ?? "/api/litellm/v1").trim();
const envModel = ((env.VITE_PROVIDER_MODEL as string | undefined) ?? "claude-opus-4.6").trim();
const envApiKey = ((env.VITE_PROVIDER_API_KEY as string | undefined) ?? "").trim();
const envProvider = ((env.VITE_PROVIDER_NAME as string | undefined) ?? "litellm").trim();

function resolveBaseUrl(baseUrl: string): string {
  if (typeof window !== "undefined" && baseUrl.startsWith("/")) {
    return `${window.location.origin}${baseUrl}`;
  }
  return baseUrl;
}

export const ENV_MODEL: Model<"openai-completions"> = {
  id: envModel,
  name: envModel,
  api: "openai-completions",
  provider: envProvider,
  baseUrl: resolveBaseUrl(envBaseUrl.replace(/\/+$/, "") || "/api/litellm/v1"),
  reasoning: false,
  input: ["text", "image"],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 192000,
  maxTokens: 48000,
};

export const ENV_API_KEY = envApiKey;
