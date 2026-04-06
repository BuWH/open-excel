import type { PromptPreset } from "../lib/promptPresets";
import type { UiMessage } from "../lib/types/llm";

type ChatPanelProps = {
  busy: boolean;
  messages: UiMessage[];
  onPromptChange(prompt: string): void;
  onReset(): void;
  onSubmit(prompt: string): Promise<void>;
  prompt: string;
  promptPresets: PromptPreset[];
};

export function ChatPanel(props: ChatPanelProps) {
  const { busy, messages, onPromptChange, onReset, onSubmit, prompt, promptPresets } = props;

  return (
    <section className="panel chat-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Agent Console</p>
          <h2>LiteLLM-backed Excel assistant</h2>
        </div>
        <button className="ghost-button" onClick={onReset} type="button">
          Reset conversation
        </button>
      </div>

      <div className="chat-toolbar">
        <label className="toolbar-field" htmlFor="prompt-preset">
          Prompt preset
        </label>
        <select
          data-testid="prompt-preset"
          id="prompt-preset"
          value=""
          onChange={(event) => {
            const nextPreset = promptPresets.find((preset) => preset.id === event.target.value);
            if (!nextPreset) {
              return;
            }

            onPromptChange(nextPreset.prompt);
          }}
        >
          <option value="">Choose a saved Excel prompt…</option>
          {promptPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      <div className="message-list" data-testid="message-list">
        {messages.map((message) => (
          <article className={`message-card role-${message.role}`} key={message.id}>
            <p className="message-role">{message.title ?? message.role}</p>
            <pre>{message.content}</pre>
          </article>
        ))}
        {busy ? (
          <article className="message-card role-system">
            <p className="message-role">runtime</p>
            <pre>Running tool-aware agent loop…</pre>
          </article>
        ) : null}
      </div>

      <form
        className="composer"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit(prompt);
        }}
      >
        <label className="composer-label" htmlFor="prompt">
          Prompt
        </label>
        <textarea
          data-testid="prompt-input"
          id="prompt"
          rows={6}
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
        />
        <div className="composer-actions">
          <p className="field-hint">
            Keep prompts realistic: live workbook reads, structured writes, Office.js actions, and
            concise executive summaries are the main real-host E2E targets.
          </p>
          <button
            data-testid="run-agent"
            disabled={busy || prompt.trim().length === 0}
            type="submit"
          >
            {busy ? "Running…" : "Run agent"}
          </button>
        </div>
      </form>
    </section>
  );
}
