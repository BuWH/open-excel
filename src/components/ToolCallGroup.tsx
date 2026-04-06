import { useState } from "react";
import type { ChatMessagePart, ToolCallPart } from "../lib/chat/types";
import { ToolCallCard } from "./ToolCallCard";

type ToolCallGroupProps = {
  readonly parts: readonly ToolCallPart[];
};

export function ToolCallGroup({ parts }: ToolCallGroupProps) {
  const [collapsed, setCollapsed] = useState(true);
  const errorCount = parts.filter((p) => p.isError).length;

  return (
    <div className="tool-group">
      <button
        className="tool-group-header"
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        <span className="tool-group-left">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.5 2.1a4 4 0 0 0-4.8 5.3L2.4 10.7a1.4 1.4 0 1 0 2 2l3.3-3.3a4 4 0 0 0 5.3-4.8L10.8 6.8 9.2 5.2l2.2-2.2-.9-.9z" />
          </svg>
          <span className="tool-group-label">
            {parts.length} tool calls
            {errorCount > 0 && (
              <span className="tool-group-errors">{errorCount} failed</span>
            )}
          </span>
        </span>
        <svg
          className={`tool-chevron ${collapsed ? "" : "tool-chevron-open"}`}
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
      </button>
      {!collapsed && (
        <div className="tool-group-items">
          {parts.map((part) => (
            <ToolCallCard key={part.toolCallId} part={part} />
          ))}
        </div>
      )}
    </div>
  );
}

const MIN_GROUP_SIZE = 2;

/**
 * Groups tool-call parts into collapsible runs.
 * Empty/whitespace-only text parts between tool calls don't break a run.
 */
export function groupMessageParts(
  parts: readonly ChatMessagePart[],
): Array<ChatMessagePart | { type: "tool-group"; parts: ToolCallPart[] }> {
  const result: Array<ChatMessagePart | { type: "tool-group"; parts: ToolCallPart[] }> = [];
  let toolBuffer: ToolCallPart[] = [];
  let pendingText: ChatMessagePart[] = [];

  function flushBuffer() {
    if (toolBuffer.length >= MIN_GROUP_SIZE) {
      result.push({ type: "tool-group", parts: toolBuffer });
    } else {
      for (const part of toolBuffer) {
        result.push(part);
      }
    }
    toolBuffer = [];
  }

  for (const part of parts) {
    if (part.type === "tool-call") {
      // Absorb any pending trivial text into the tool run
      pendingText = [];
      toolBuffer.push(part);
    } else if (part.type === "text" && !part.text.trim() && toolBuffer.length > 0) {
      // Empty text between tool calls — keep pending, don't break the run
      pendingText.push(part);
    } else {
      // Non-tool, non-empty-text: flush any accumulated tools, then emit pending text + this part
      if (toolBuffer.length > 0) {
        flushBuffer();
      }
      for (const p of pendingText) {
        result.push(p);
      }
      pendingText = [];
      result.push(part);
    }
  }

  // Flush remaining
  if (toolBuffer.length > 0) {
    flushBuffer();
  }
  for (const p of pendingText) {
    result.push(p);
  }

  return result;
}
