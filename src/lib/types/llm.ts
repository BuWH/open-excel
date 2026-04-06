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
