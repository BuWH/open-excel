export type ProviderConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

const providerEnv = import.meta.env as ImportMetaEnv & {
  VITE_PROVIDER_API_KEY?: string;
  VITE_PROVIDER_BASE_URL?: string;
  VITE_PROVIDER_MODEL?: string;
};
const defaultBaseUrl = (providerEnv.VITE_PROVIDER_BASE_URL ?? "/api/litellm/v1").trim();
const defaultModel = (providerEnv.VITE_PROVIDER_MODEL ?? "claude-opus-4.6").trim();

function isLegacyLocalUrl(baseUrl: string) {
  return /^http:\/\/(?:127\.0\.0\.1|localhost):4000\/v1\/?$/i.test(baseUrl.trim());
}

export const DEFAULT_PROVIDER: ProviderConfig = {
  apiKey: providerEnv.VITE_PROVIDER_API_KEY ?? "",
  baseUrl: defaultBaseUrl.replace(/\/+$/, "") || "/api/litellm/v1",
  model: defaultModel || "claude-opus-4.6",
};

export function normaliseBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim();

  if (trimmed.length === 0) {
    return DEFAULT_PROVIDER.baseUrl;
  }

  if (isLegacyLocalUrl(trimmed)) {
    return DEFAULT_PROVIDER.baseUrl;
  }

  return trimmed.replace(/\/+$/, "");
}

export function getBaseUrlValidationError(baseUrl: string) {
  const normalised = normaliseBaseUrl(baseUrl);

  if (normalised.length === 0) {
    return "Base URL is required.";
  }

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    /^http:\/\//i.test(normalised)
  ) {
    return "This HTTPS taskpane cannot call an HTTP endpoint directly. Use /api/litellm/v1 or an HTTPS endpoint.";
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
