import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type {
  AssistantMessage,
  ToolCall,
  ToolResultMessage,
  UserMessage,
} from "@mariozechner/pi-ai";

export type ToolCallPart = {
  readonly type: "tool-call";
  readonly toolCallId: string;
  readonly toolName: string;
  readonly args: Record<string, unknown>;
  readonly argsText: string;
  readonly result?: string;
  readonly isError?: boolean;
  readonly imageBase64?: string;
  readonly imageMimeType?: string;
};

export type ThinkingPart = {
  readonly type: "thinking";
  readonly text: string;
};

export type TextPart = {
  readonly type: "text";
  readonly text: string;
};

export type ChatMessagePart = TextPart | ThinkingPart | ToolCallPart;

export type ChatMessage = {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly parts: readonly ChatMessagePart[];
  readonly timestamp: number;
  readonly status?: "complete" | "streaming" | "error" | "truncated";
  readonly errorMessage?: string;
  readonly usage?: { input: number; output: number };
};

type PiMessage = AgentMessage & { role: string };

function isUserMessage(msg: PiMessage): msg is UserMessage {
  return msg.role === "user";
}

function isAssistantMessage(msg: PiMessage): msg is AssistantMessage {
  return msg.role === "assistant";
}

function isToolResultMessage(msg: PiMessage): msg is ToolResultMessage {
  return msg.role === "toolResult";
}

function buildToolResultMap(messages: AgentMessage[]): Map<string, ToolResultMessage> {
  const map = new Map<string, ToolResultMessage>();
  for (const msg of messages) {
    const m = msg as PiMessage;
    if (isToolResultMessage(m)) {
      map.set(m.toolCallId, m);
    }
  }
  return map;
}

function convertToolCall(tc: ToolCall, resultMap: Map<string, ToolResultMessage>): ToolCallPart {
  const result = resultMap.get(tc.id);
  const resultText = result?.content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  const imageBlock = result?.content.find(
    (c): c is { type: "image"; data: string; mimeType: string } => c.type === "image",
  );

  return {
    type: "tool-call",
    toolCallId: tc.id,
    toolName: tc.name,
    args: tc.arguments as Record<string, unknown>,
    argsText: JSON.stringify(tc.arguments, null, 2),
    result: resultText,
    isError: result?.isError,
    imageBase64: imageBlock?.data,
    imageMimeType: imageBlock?.mimeType,
  };
}

function convertAssistantContent(
  msg: AssistantMessage,
  resultMap: Map<string, ToolResultMessage>,
): ChatMessagePart[] {
  const parts: ChatMessagePart[] = [];

  for (const block of msg.content) {
    if (block.type === "text" && (block as { text: string }).text.trim().length > 0) {
      parts.push({ type: "text", text: (block as { text: string }).text });
    } else if (block.type === "thinking") {
      parts.push({
        type: "thinking",
        text: (block as { type: "thinking"; thinking: string }).thinking,
      });
    } else if (block.type === "toolCall") {
      parts.push(convertToolCall(block as ToolCall, resultMap));
    }
  }

  return parts;
}

export function convertMessages(messages: AgentMessage[]): ChatMessage[] {
  const resultMap = buildToolResultMap(messages);
  const converted: ChatMessage[] = [];

  for (const msg of messages) {
    const m = msg as PiMessage;

    if (isToolResultMessage(m)) {
      continue;
    }

    if (isAssistantMessage(m)) {
      const parts = convertAssistantContent(m, resultMap);
      const status =
        m.stopReason === "error"
          ? ("error" as const)
          : m.stopReason === "length"
            ? ("truncated" as const)
            : ("complete" as const);

      // Log assistant messages with empty content for debugging
      if (parts.length === 0) {
        console.log("[convertMessages] empty assistant message, stopReason:", m.stopReason, "content blocks:", m.content.length, "content types:", m.content.map((b: { type: string }) => b.type));
      }

      converted.push({
        id: `assistant-${m.timestamp}`,
        role: "assistant",
        parts: parts.length > 0 ? parts : [{ type: "text", text: "" }],
        timestamp: m.timestamp,
        status,
        errorMessage: m.errorMessage,
        usage: m.usage ? { input: m.usage.input, output: m.usage.output } : undefined,
      });
      continue;
    }

    if (isUserMessage(m)) {
      const text =
        typeof m.content === "string"
          ? m.content
          : (m.content as Array<{ type: string; text?: string }>)
              .filter((c) => c.type === "text" && typeof c.text === "string")
              .map((c) => c.text as string)
              .join("\n");

      converted.push({
        id: `user-${m.timestamp}`,
        role: "user",
        parts: [{ type: "text", text }],
        timestamp: m.timestamp,
      });
    }
  }

  return converted;
}
