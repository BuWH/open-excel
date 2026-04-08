import { Agent } from "@mariozechner/pi-agent-core";
import { refreshGitHubCopilotToken } from "@mariozechner/pi-ai/oauth";
import type { WorkbookAdapter } from "../adapters/types";
import type { ProviderConfig } from "../provider/config";
import { resolveModelFromConfig } from "../provider/resolveModel";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { createWorkbookTools } from "./tools";

let refreshPromise: Promise<string> | null = null;

export function createExcelAgent(
  adapter: WorkbookAdapter,
  config: ProviderConfig,
  onCredentialsRefreshed?: (credentials: { refresh: string; access: string; expires: number }) => void,
) {
  const tools = createWorkbookTools(adapter);
  const model = resolveModelFromConfig(config);

  return new Agent({
    initialState: {
      systemPrompt: SYSTEM_PROMPT,
      model,
      thinkingLevel: "off",
      tools,
      messages: [],
    },
    getApiKey: () => {
      if (config.type === "custom") {
        return config.apiKey.length > 0 ? config.apiKey : "no-key";
      }

      if (config.type === "github-copilot" && config.credentials) {
        if (Date.now() >= config.credentials.expires) {
          if (!refreshPromise) {
            refreshPromise = refreshGitHubCopilotToken(
              config.credentials.refresh,
            )
              .then((refreshed) => {
                onCredentialsRefreshed?.(refreshed);
                return refreshed.access;
              })
              .finally(() => {
                refreshPromise = null;
              });
          }
          return refreshPromise;
        }
        return config.credentials.access;
      }

      return "no-key";
    },
  });
}
