import { useEffect, useState } from "react";
import type { ThinkingPart } from "../lib/chat/types";

type ThinkingBlockProps = {
  readonly part: ThinkingPart;
  readonly isStreaming?: boolean;
};

export function ThinkingBlock({ part, isStreaming }: ThinkingBlockProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="thinking-block">
      <button
        className="thinking-header"
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        <svg
          className="thinking-icon"
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="8" cy="8" r="6" />
          <path d="M6 6.5a2 2 0 0 1 3.5 1.5c0 1-1.5 1.5-1.5 1.5" />
          <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
        </svg>
        <span className={`thinking-label ${isStreaming ? "shimmer" : ""}`}>
          {isStreaming ? "Thinking..." : "Thought"}
        </span>
        <svg
          className={`thinking-chevron ${collapsed ? "" : "thinking-chevron-open"}`}
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
        <pre className="thinking-content">{part.text}</pre>
      )}
    </div>
  );
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

type WorkingIndicatorProps = {
  readonly lastMessageTimestamp?: number;
};

export function WorkingIndicator({ lastMessageTimestamp }: WorkingIndicatorProps) {
  const baseTime = lastMessageTimestamp ?? Date.now();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - baseTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [baseTime]);

  return (
    <div className="working-indicator">
      <span className="working-indicator-dot" />
      <span className="working-indicator-label">Working</span>
      {elapsed >= 10 && (
        <span className="working-indicator-time">{formatElapsed(elapsed)}</span>
      )}
    </div>
  );
}
