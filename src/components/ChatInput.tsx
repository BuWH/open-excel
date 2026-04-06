import { useCallback, useRef, useState, type KeyboardEvent } from "react";

type ChatInputProps = {
  readonly onSend: (text: string) => void;
  readonly onStop: () => void;
  readonly isRunning: boolean;
  readonly disabled?: boolean;
};

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 14V2M8 2L3 7M8 2L13 7" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="3" y="3" width="10" height="10" rx="2" />
    </svg>
  );
}

export function ChatInput({ onSend, onStop, isRunning, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isRunning || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isRunning, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          placeholder="Ask about your workbook..."
          rows={1}
          value={value}
          disabled={disabled || isRunning}
          onChange={(e) => {
            setValue(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
        />
        {isRunning ? (
          <button
            className="chat-input-btn chat-input-btn-stop"
            type="button"
            onClick={onStop}
            title="Stop generating"
          >
            <StopIcon />
          </button>
        ) : (
          <button
            className="chat-input-btn chat-input-btn-send"
            type="button"
            disabled={!value.trim() || disabled}
            onClick={handleSubmit}
            title="Send message"
          >
            <SendIcon />
          </button>
        )}
      </div>
    </div>
  );
}
