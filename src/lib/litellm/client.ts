import type { ChatCompletionMessage, ProviderConfig, ToolDefinition } from "../types/llm";
import { getBaseUrlValidationError, normaliseBaseUrl } from "./provider";

type ModelsResponse = {
  data?: Array<{ id?: string }>;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
  }>;
};

type CompletionChoiceMessage = NonNullable<ChatCompletionResponse["choices"]>[number]["message"];

function buildHeaders(apiKey: string) {
  const headers: Record<string, string> & { Authorization?: string } = {
    "Content-Type": "application/json",
  };

  if (apiKey.trim().length > 0) {
    headers.Authorization = `Bearer ${apiKey.trim()}`;
  }

  return headers;
}

export async function listLiteLlmModels(baseUrl: string, apiKey: string) {
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

function normaliseAssistantContent(
  content: string | Array<{ type?: string; text?: string }> | undefined,
) {
  if (!content) {
    return "";
  }

  if (typeof content === "string") {
    return content;
  }

  return content
    .map((item) => item.text ?? "")
    .filter((item) => item.length > 0)
    .join("\n");
}

export async function createChatCompletion(
  provider: ProviderConfig,
  messages: ChatCompletionMessage[],
  tools: ToolDefinition[],
) {
  const validationError = getBaseUrlValidationError(provider.baseUrl);
  if (validationError) {
    throw new Error(validationError);
  }

  const response = await fetch(`${normaliseBaseUrl(provider.baseUrl)}/chat/completions`, {
    method: "POST",
    headers: buildHeaders(provider.apiKey),
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      messages,
      tools,
      tool_choice: "auto",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LiteLLM request failed with status ${response.status}: ${body}`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const messagesFromChoices = (payload.choices ?? [])
    .map((choice) => choice.message)
    .filter((message): message is NonNullable<CompletionChoiceMessage> => Boolean(message));

  if (messagesFromChoices.length === 0) {
    throw new Error("LiteLLM returned no assistant message.");
  }

  const content = messagesFromChoices
    .map((message) => normaliseAssistantContent(message.content))
    .filter((messageContent) => messageContent.length > 0)
    .join("\n\n");

  const toolCalls = messagesFromChoices.flatMap((message) => message.tool_calls ?? []);

  return {
    content,
    toolCalls,
  };
}
