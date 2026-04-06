import type { ProviderConfig } from "../types/llm";

const providerEnv = import.meta.env as ImportMetaEnv & {
  VITE_LITELLM_API_KEY?: string;
  VITE_LITELLM_BASE_URL?: string;
  VITE_LITELLM_MODEL?: string;
};
const defaultBaseUrl = (providerEnv.VITE_LITELLM_BASE_URL ?? "/api/litellm/v1").trim();
const defaultModel = (providerEnv.VITE_LITELLM_MODEL ?? "claude-opus-4.6").trim();

function isLegacyLocalLiteLlmUrl(baseUrl: string) {
  return /^http:\/\/(?:127\.0\.0\.1|localhost):4000\/v1\/?$/i.test(baseUrl.trim());
}

export const DEFAULT_PROVIDER: ProviderConfig = {
  apiKey: providerEnv.VITE_LITELLM_API_KEY ?? "",
  baseUrl: defaultBaseUrl.replace(/\/+$/, "") || "/api/litellm/v1",
  model: defaultModel || "claude-opus-4.6",
};

export function normaliseBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim();

  if (trimmed.length === 0) {
    return DEFAULT_PROVIDER.baseUrl;
  }

  if (isLegacyLocalLiteLlmUrl(trimmed)) {
    return DEFAULT_PROVIDER.baseUrl;
  }

  return trimmed.replace(/\/+$/, "");
}

export function getBaseUrlValidationError(baseUrl: string) {
  const normalised = normaliseBaseUrl(baseUrl);

  if (normalised.length === 0) {
    return "LiteLLM base URL is required.";
  }

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    /^http:\/\//i.test(normalised)
  ) {
    return "This HTTPS taskpane cannot call an HTTP LiteLLM endpoint directly. Use /api/litellm/v1 or an HTTPS endpoint.";
  }

  return null;
}

export function normaliseProvider(provider: ProviderConfig): ProviderConfig {
  return {
    apiKey: provider.apiKey.trim(),
    baseUrl: normaliseBaseUrl(provider.baseUrl),
    model: provider.model.trim() || DEFAULT_PROVIDER.model,
  };
}
