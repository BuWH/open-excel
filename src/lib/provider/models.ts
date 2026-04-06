import { getBaseUrlValidationError, normaliseBaseUrl } from "./config";

type ModelsResponse = {
  data?: Array<{ id?: string }>;
};

function buildHeaders(apiKey: string): HeadersInit {
  const trimmed = apiKey.trim();
  if (trimmed.length > 0) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${trimmed}`,
    };
  }

  return { "Content-Type": "application/json" };
}

export async function listProviderModels(baseUrl: string, apiKey: string) {
  const validationError = getBaseUrlValidationError(baseUrl);
  if (validationError) {
    throw new Error(validationError);
  }

  const response = await fetch(`${normaliseBaseUrl(baseUrl)}/models`, {
    headers: buildHeaders(apiKey),
  });

  if (!response.ok) {
    throw new Error(`Model discovery failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ModelsResponse;

  return (payload.data ?? [])
    .map((item) => item.id?.trim())
    .filter((item): item is string => Boolean(item));
}
