type AgentRuntimeEventBase = {
  id: string;
  iteration: number;
  timestamp: number;
};

export type AgentRuntimeEvent =
  | (AgentRuntimeEventBase & {
      type: "llm-request";
      model: string;
      messageCount: number;
    })
  | (AgentRuntimeEventBase & {
      type: "llm-response";
      durationMs: number;
      content: string;
      toolCallNames: string[];
    })
  | (AgentRuntimeEventBase & {
      type: "tool-start";
      toolName: string;
      arguments: string;
    })
  | (AgentRuntimeEventBase & {
      type: "tool-result";
      durationMs: number;
      toolName: string;
      content: string;
    })
  | (AgentRuntimeEventBase & {
      type: "tool-error";
      durationMs: number;
      toolName: string;
      content: string;
    })
  | (AgentRuntimeEventBase & {
      type: "final-answer";
      durationMs: number;
      content: string;
    });

export type AgentRuntimeEventDraft = AgentRuntimeEvent extends infer Event
  ? Event extends unknown
    ? Omit<Event, "id">
    : never
  : never;

export type DebugTurnRecord = {
  id: string;
  prompt: string;
  startedAt: number;
  finishedAt?: number;
  status: "running" | "completed" | "failed";
  summary?: string;
  events: AgentRuntimeEvent[];
};
