const PROXY_RULES: ReadonlyArray<{ match: string; replace: string }> = [
  { match: "https://github.com/", replace: "/api/github/" },
  { match: "https://api.github.com/", replace: "/api/github-api/" },
  { match: "https://api.individual.githubcopilot.com/", replace: "/api/copilot/" },
];

/**
 * Install a global fetch interceptor that rewrites external GitHub/Copilot URLs
 * to go through the Vite dev proxy, avoiding CORS issues in the Excel Online taskpane.
 *
 * Must be called once at app startup, before any OAuth flows are initiated.
 */
export function installGitHubProxy() {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    for (const rule of PROXY_RULES) {
      if (url.startsWith(rule.match)) {
        const proxied = url.replace(rule.match, `${window.location.origin}${rule.replace}`);
        return originalFetch(proxied, init);
      }
    }

    return originalFetch(input, init);
  };
}
