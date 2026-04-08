/**
 * Mock fetch interceptor for the mock UI site.
 *
 * Intercepts requests using mock Copilot tokens and returns
 * realistic fake responses so the settings panel displays
 * correctly without hitting real APIs.
 */

const MOCK_COPILOT_MODELS = {
  data: [
    {
      id: "claude-sonnet-4.6",
      name: "Claude Sonnet 4.6",
      version: "2025-04-14",
      capabilities: { type: "chat" },
    },
    {
      id: "claude-opus-4.6",
      name: "Claude Opus 4.6",
      version: "2025-04-14",
      capabilities: { type: "chat" },
    },
    { id: "gpt-4.1", name: "GPT-4.1", version: "2025-04-14", capabilities: { type: "chat" } },
    { id: "gpt-4o", name: "GPT-4o", version: "2025-01-13", capabilities: { type: "chat" } },
    { id: "o4-mini", name: "o4-mini", version: "2025-04-16", capabilities: { type: "chat" } },
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      version: "2025-03-01",
      capabilities: { type: "chat" },
    },
    {
      id: "copilot-internal-embeddings",
      name: "Copilot Embeddings",
      version: "2025-01-01",
      capabilities: { type: "embeddings" },
    },
  ],
};

function isMockToken(init?: RequestInit): boolean {
  if (!init?.headers) return false;
  if (init.headers instanceof Headers) {
    return init.headers.get("Authorization")?.includes("ghu_mock_") ?? false;
  }
  if (Array.isArray(init.headers)) {
    const entry = init.headers.find(([k]) => k.toLowerCase() === "authorization");
    return entry?.[1]?.includes("ghu_mock_") ?? false;
  }
  const headers = init.headers as Record<string, string>;
  const auth = headers["Authorization"] ?? headers["authorization"] ?? "";
  return auth.includes("ghu_mock_");
}

export function installMockFetchInterceptor() {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    // Intercept Copilot model list requests with mock tokens
    if (url.endsWith("/models") && isMockToken(init)) {
      return Promise.resolve(
        new Response(JSON.stringify(MOCK_COPILOT_MODELS), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }

    // Intercept Copilot token endpoint with mock tokens
    if (url.includes("copilot_internal/v2/token") && isMockToken(init)) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            token: "tid=mock;exp=9999999999;sku=copilot_for_individual",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            endpoints: { api: "https://api.individual.githubcopilot.com" },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    }

    return originalFetch(input, init);
  };
}
