import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../lib/chat/types";
import { ChatInput } from "./ChatInput";
import { MessageBubble, groupConsecutiveToolMessages } from "./MessageBubble";
import { ToolCallGroup } from "./ToolCallGroup";
import { WorkingIndicator } from "./ThinkingBlock";

type ChatThreadProps = {
  readonly messages: readonly ChatMessage[];
  readonly isRunning: boolean;
  readonly onSend: (text: string) => void;
  readonly onStop: () => void;
  readonly disabled?: boolean;
  readonly turnStartedAt?: number;
};

function formatDuration(ms: number): string {
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${mins}m ${rem}s`;
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function TurnFooter({ messages, turnStartedAt }: { messages: readonly ChatMessage[]; turnStartedAt: number }) {
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") {
      lastUserIdx = i;
      break;
    }
  }

  const turnMessages = messages.slice(lastUserIdx + 1).filter((m) => m.role === "assistant");
  if (turnMessages.length === 0) return null;

  const lastMsg = turnMessages[turnMessages.length - 1]!;
  const elapsed = lastMsg.timestamp - turnStartedAt;
  if (elapsed <= 0) return null;

  let totalInput = 0;
  let totalOutput = 0;
  for (const m of turnMessages) {
    if (m.usage) {
      totalInput += m.usage.input;
      totalOutput += m.usage.output;
    }
  }

  return (
    <div className="turn-footer">
      <span>{formatDuration(elapsed)}</span>
      {(totalInput > 0 || totalOutput > 0) && (
        <span>{formatTokens(totalInput)} in / {formatTokens(totalOutput)} out</span>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="thread-empty">
      <div className="thread-empty-icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="6" width="24" height="20" rx="3" />
          <path d="M4 12h24" />
          <path d="M10 6V4" />
          <path d="M22 6V4" />
          <rect x="8" y="16" width="6" height="4" rx="1" />
          <rect x="18" y="16" width="6" height="4" rx="1" />
        </svg>
      </div>
      <h2 className="thread-empty-title">OpenExcel</h2>
      <p className="thread-empty-desc">
        Ask me to read, write, or format your workbook data.
      </p>
    </div>
  );
}

export function ChatThread({ messages, isRunning, onSend, onStop, disabled, turnStartedAt }: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isRunning]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      setShowScrollBtn(!isNearBottom);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const grouped = groupConsecutiveToolMessages(messages);

  return (
    <div className="thread">
      <div className="thread-messages" ref={scrollRef}>
        {messages.length === 0 && !isRunning ? (
          <EmptyState />
        ) : (
          <>
            {grouped.map((item) => {
              if (item.kind === "tool-group") {
                return <ToolCallGroup key={item.id} parts={item.parts} />;
              }
              const msg = item.message;
              const isLast = msg === messages[messages.length - 1];
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isLast={isLast}
                  isRunning={isRunning}
                />
              );
            })}
            {isRunning && <WorkingIndicator lastMessageTimestamp={messages.length > 0 ? messages[messages.length - 1]?.timestamp : undefined} />}
            {!isRunning && messages.length > 0 && turnStartedAt != null && turnStartedAt > 0 && (
              <TurnFooter messages={messages} turnStartedAt={turnStartedAt} />
            )}
          </>
        )}
      </div>
      {showScrollBtn && (
        <button
          className="scroll-to-bottom"
          type="button"
          onClick={scrollToBottom}
          title="Scroll to bottom"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v12M8 14l-4-4M8 14l4-4" />
          </svg>
        </button>
      )}
      <div className="thread-input">
        <ChatInput
          onSend={onSend}
          onStop={onStop}
          isRunning={isRunning}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
