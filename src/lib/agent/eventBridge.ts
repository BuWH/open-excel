import type { AgentEvent } from "@mariozechner/pi-agent-core";
import type { AssistantMessage, TextContent } from "@mariozechner/pi-ai";
import type { AgentRuntimeEvent } from "../debug/runtimeEvents";

function extractTextContent(message: { content: (TextContent | unknown)[] }): string {
  return (message.content as { type: string; text?: string }[])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("\n");
}

function extractToolCallNames(message: { content: unknown[] }): string[] {
  return (message.content as { type: string; name?: string }[])
    .filter((block) => block.type === "toolCall" && typeof block.name === "string")
    .map((block) => block.name as string);
}

export function bridgeAgentEvent(
  event: AgentEvent,
  iteration: number,
  turnStartedAt: number,
  model: string,
  messageCount: number,
): AgentRuntimeEvent | null {
  const base = {
    id: crypto.randomUUID(),
    iteration,
    timestamp: Date.now(),
  };

  switch (event.type) {
    case "turn_start":
      return {
        ...base,
        type: "llm-request",
        model,
        messageCount,
      };

    case "turn_end": {
      const assistantMsg = event.message as AssistantMessage;
      return {
        ...base,
        type: "llm-response",
        durationMs: 0,
        content: extractTextContent(assistantMsg),
        toolCallNames: extractToolCallNames(assistantMsg),
      };
    }

    case "tool_execution_start":
      return {
        ...base,
        type: "tool-start",
        toolName: event.toolName,
        arguments: JSON.stringify(event.args),
      };

    case "tool_execution_end":
      return event.isError
        ? {
            ...base,
            type: "tool-error",
            durationMs: 0,
            toolName: event.toolName,
            content: JSON.stringify(event.result),
          }
        : {
            ...base,
            type: "tool-result",
            durationMs: 0,
            toolName: event.toolName,
            content: JSON.stringify(event.result),
          };

    case "agent_end":
      return {
        ...base,
        type: "final-answer",
        durationMs: Date.now() - turnStartedAt,
        content: "",
      };

    default:
      return null;
  }
}
