import type { ThreadMessageLike } from "@assistant-ui/react";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type {
  AssistantMessage,
  ToolCall,
  ToolResultMessage,
  UserMessage,
} from "@mariozechner/pi-ai";

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

/**
 * Build a lookup from toolCallId -> ToolResultMessage so we can merge
 * tool results into the preceding assistant message's tool-call parts.
 */
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

type ToolCallPart = {
  readonly type: "tool-call";
  readonly toolCallId: string;
  readonly toolName: string;
  readonly args: Record<string, string | number | boolean | null>;
  readonly argsText: string;
  readonly result?: string;
  readonly isError?: boolean;
};

type ContentPart =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "reasoning"; readonly text: string }
  | ToolCallPart;

function convertToolCall(tc: ToolCall, resultMap: Map<string, ToolResultMessage>): ToolCallPart {
  const result = resultMap.get(tc.id);
  const resultText = result?.content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  return {
    type: "tool-call",
    toolCallId: tc.id,
    toolName: tc.name,
    args: tc.arguments as Record<string, string | number | boolean | null>,
    argsText: JSON.stringify(tc.arguments, null, 2),
    result: resultText,
    isError: result?.isError,
  };
}

function convertAssistantContent(
  msg: AssistantMessage,
  resultMap: Map<string, ToolResultMessage>,
): ContentPart[] {
  const parts: ContentPart[] = [];

  for (const block of msg.content) {
    if (block.type === "text" && block.text.trim().length > 0) {
      parts.push({ type: "text", text: block.text });
    } else if (block.type === "thinking") {
      parts.push({
        type: "reasoning",
        text: (block as { type: "thinking"; thinking: string }).thinking,
      });
    } else if (block.type === "toolCall") {
      parts.push(convertToolCall(block as ToolCall, resultMap));
    }
  }

  return parts;
}

function assistantStatus(msg: AssistantMessage): ThreadMessageLike["status"] {
  if (msg.stopReason === "error") {
    return { type: "incomplete", reason: "error", error: msg.errorMessage };
  }
  return { type: "complete", reason: "stop" };
}

/**
 * Convert a full pi-agent-core message array, merging tool results into
 * assistant messages. Returns messages suitable for useExternalStoreRuntime.
 */
export function convertMessages(messages: AgentMessage[]): ThreadMessageLike[] {
  const resultMap = buildToolResultMap(messages);
  const converted: ThreadMessageLike[] = [];

  for (const msg of messages) {
    const m = msg as PiMessage;

    // Skip toolResult messages -- they're merged into assistant messages
    if (isToolResultMessage(m)) {
      continue;
    }

    if (isAssistantMessage(m)) {
      const contentParts = convertAssistantContent(m, resultMap);

      converted.push({
        role: "assistant",
        content: contentParts.length > 0 ? contentParts : [{ type: "text", text: "" }],
        id: `assistant-${m.timestamp}`,
        createdAt: new Date(m.timestamp),
        status: assistantStatus(m),
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
        role: "user",
        content: text,
        id: `user-${m.timestamp}`,
        createdAt: new Date(m.timestamp),
      });
    }
  }

  return converted;
}
