export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type ChatCompletionMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
};

export type ProviderConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

export type UiMessage = {
  id: string;
  role: "system" | "user" | "assistant" | "tool";
  title?: string;
  content: string;
};
