import { getGitHubCopilotBaseUrl } from "@mariozechner/pi-ai/oauth";

type CopilotModel = {
  id: string;
  name: string;
};

type CopilotModelsResponse = {
  data?: Array<{
    id?: string;
    name?: string;
    version?: string;
    capabilities?: { type?: string };
  }>;
};

const COPILOT_HEADERS = {
  "User-Agent": "GitHubCopilotChat/0.35.0",
  "Editor-Version": "vscode/1.107.0",
  "Editor-Plugin-Version": "copilot-chat/0.35.0",
  "Copilot-Integration-Id": "vscode-chat",
};

export async function fetchCopilotModels(accessToken: string): Promise<CopilotModel[]> {
  const baseUrl = getGitHubCopilotBaseUrl(accessToken);
  const response = await fetch(`${baseUrl}/models`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...COPILOT_HEADERS,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Copilot models: ${response.status}`);
  }

  const payload = (await response.json()) as CopilotModelsResponse;

  return (payload.data ?? [])
    .filter((m) => m.id && m.capabilities?.type === "chat")
    .map((m) => ({
      id: m.id!,
      name: m.name ?? m.id!,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
