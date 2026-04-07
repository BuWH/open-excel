import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage, ToolCallPart } from "../lib/chat/types";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolCallCard } from "./ToolCallCard";
import { ToolCallGroup, groupMessageParts } from "./ToolCallGroup";

type MessageBubbleProps = {
  readonly message: ChatMessage;
  readonly isLast?: boolean;
  readonly isRunning?: boolean;
};

function isToolOnlyMessage(msg: ChatMessage): boolean {
  return msg.role === "assistant" && msg.parts.every((p) => p.type === "tool-call");
}

export function MessageBubble({ message, isLast, isRunning }: MessageBubbleProps) {
  if (message.role === "user") {
    const text = message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n");

    return (
      <div className="msg msg-user msg-enter">
        <div className="msg-bubble-user">{text}</div>
      </div>
    );
  }

  const isStreaming = isLast && isRunning;
  const grouped = groupMessageParts(message.parts);

  return (
    <div className="msg msg-assistant msg-enter">
      <div className="msg-content">
        {grouped.map((item, i) => {
          const key = `${message.id}-${i}`;

          if ("type" in item && item.type === "tool-group") {
            return <ToolCallGroup key={key} parts={item.parts} />;
          }

          const part = item;
          switch (part.type) {
            case "text":
              return part.text ? (
                <div className="msg-text" key={key}>
                  <Markdown remarkPlugins={[remarkGfm]}>{part.text}</Markdown>
                </div>
              ) : null;
            case "thinking":
              return <ThinkingBlock key={key} part={part} isStreaming={isStreaming} />;
            case "tool-call":
              return <ToolCallCard key={key} part={part} />;
            default:
              return null;
          }
        })}
        {message.status === "truncated" && (
          <p className="msg-truncated">Response was cut short due to output token limit.</p>
        )}
        {message.status === "error" && message.errorMessage && (
          <p className="msg-error">{message.errorMessage}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Groups consecutive tool-only assistant messages into merged groups.
 * Returns items that are either a single ChatMessage or a group of tool-call parts.
 */
export type MessageOrGroup =
  | { kind: "message"; message: ChatMessage }
  | { kind: "tool-group"; parts: ToolCallPart[]; id: string };

export function groupConsecutiveToolMessages(messages: readonly ChatMessage[]): MessageOrGroup[] {
  const result: MessageOrGroup[] = [];
  let toolBuffer: ToolCallPart[] = [];
  let pendingMessages: ChatMessage[] = [];
  let groupId = "";

  function flushBuffer() {
    if (toolBuffer.length >= 2) {
      result.push({ kind: "tool-group", parts: toolBuffer, id: groupId });
    } else if (toolBuffer.length === 1 && pendingMessages[0]) {
      result.push({ kind: "message", message: pendingMessages[0] });
    }
    toolBuffer = [];
    pendingMessages = [];
    groupId = "";
  }

  for (const msg of messages) {
    if (isToolOnlyMessage(msg)) {
      if (toolBuffer.length === 0) {
        groupId = `tg-${msg.id}`;
      }
      pendingMessages.push(msg);
      for (const part of msg.parts) {
        if (part.type === "tool-call") {
          toolBuffer.push(part);
        }
      }
    } else {
      flushBuffer();
      result.push({ kind: "message", message: msg });
    }
  }
  flushBuffer();

  return result;
}
