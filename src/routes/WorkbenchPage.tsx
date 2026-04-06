import type { Agent, AgentEvent, AgentMessage } from "@mariozechner/pi-agent-core";
import type { AssistantMessage, TextContent } from "@mariozechner/pi-ai";
import { startTransition, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { ChatPanel } from "../components/ChatPanel";
import { WorkbookInspector } from "../components/WorkbookInspector";
import { resolveWorkbookAdapter } from "../lib/adapters/host";
import type { WorkbookAdapter } from "../lib/adapters/types";
import { createExcelAgent } from "../lib/agent/agentFactory";
import { bridgeAgentEvent } from "../lib/agent/eventBridge";
import type { DebugTurnRecord } from "../lib/debug/runtimeEvents";
import { PROMPT_PRESETS } from "../lib/promptPresets";
import type { UiMessage } from "../lib/types/llm";
import type { WorkbookPreview } from "../lib/types/workbook";
import { useSessionStore } from "../state/sessionStore";

function extractAssistantText(message: AgentMessage): string {
  if (message.role !== "assistant") {
    return "";
  }
  return (message as AssistantMessage).content
    .filter((block): block is TextContent => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

const INITIAL_MESSAGE: UiMessage = {
  id: crypto.randomUUID(),
  role: "system",
  title: "runtime",
  content:
    "Workbench ready. Run this assistant against the live Excel workbook and treat real-host behavior as the source of truth.",
};

export function WorkbenchPage() {
  const onboardingCompleted = useSessionStore((state) => state.onboardingCompleted);
  const provider = useSessionStore((state) => state.provider);
  const resetSession = useSessionStore((state) => state.reset);
  const [adapter, setAdapter] = useState<WorkbookAdapter | null>(null);
  const [busy, setBusy] = useState(false);
  const [debugTurns, setDebugTurns] = useState<DebugTurnRecord[]>([]);
  const [hostError, setHostError] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([INITIAL_MESSAGE]);
  const [preview, setPreview] = useState<WorkbookPreview | null>(null);
  const [prompt, setPrompt] = useState(PROMPT_PRESETS[0]?.prompt ?? "");
  const [selectedSheet, setSelectedSheet] = useState<string>();
  const agentRef = useRef<Agent | null>(null);

  async function refreshPreview(activeAdapter = adapter, sheetName?: string) {
    if (!activeAdapter) {
      return;
    }

    const nextPreview = await activeAdapter.getPreview(sheetName ?? selectedSheet);
    setPreview(nextPreview);
    setSelectedSheet(nextPreview.sheetName);
  }

  useEffect(() => {
    let cancelled = false;

    void resolveWorkbookAdapter()
      .then(async (resolvedAdapter) => {
        if (cancelled) {
          return;
        }

        setAdapter(resolvedAdapter);
        setHostError(null);

        const nextPreview = await resolvedAdapter.getPreview();
        if (cancelled) {
          return;
        }

        setPreview(nextPreview);
        setSelectedSheet(nextPreview.sheetName);
      })
      .catch((error) => {
        if (!cancelled) {
          setHostError(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!provider.model || !provider.baseUrl) {
    return <Navigate replace to="/auth/login" />;
  }

  if (!onboardingCompleted) {
    return <Navigate replace to="/onboarding" />;
  }

  const latestTurn = debugTurns[0] ?? null;

  return (
    <main className="workbench-shell">
      <header className="workbench-header">
        <div>
          <p className="eyebrow">Claude in Excel rebuild</p>
          <h1>Taskpane workbench</h1>
          <p className="lead compact-lead">
            Tuned for real Excel Online taskpane runs only, with the live workbook acting as the
            single supported E2E surface.
          </p>
        </div>
        <div className="header-actions">
          <span className="pill">{provider.model}</span>
          <span className="pill">{adapter?.kind ?? "resolving"}</span>
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              agentRef.current?.reset();
              setMessages([INITIAL_MESSAGE]);
              setDebugTurns([]);
            }}
          >
            Clear chat
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              resetSession();
              agentRef.current?.reset();
              agentRef.current = null;
              setMessages([INITIAL_MESSAGE]);
              setDebugTurns([]);
            }}
          >
            Reset session
          </button>
        </div>
      </header>

      <div className="status-strip">
        <article>
          <span className="status-label">Workbook mode</span>
          <strong>{adapter?.label ?? "Resolving adapter..."}</strong>
        </article>
        <article>
          <span className="status-label">Host status</span>
          <strong>{hostError ?? "ready"}</strong>
        </article>
        <article>
          <span className="status-label">Last turn</span>
          <strong>{latestTurn ? latestTurn.status : "idle"}</strong>
        </article>
        <article>
          <span className="status-label">Trace events</span>
          <strong>{latestTurn?.events.length ?? 0}</strong>
        </article>
      </div>

      <div className="workbench-grid">
        <WorkbookInspector
          adapterLabel={adapter?.label ?? "Resolving adapter..."}
          onRefresh={async () => refreshPreview()}
          onSelectSheet={(sheetName) => {
            setSelectedSheet(sheetName);
            void refreshPreview(adapter, sheetName);
          }}
          preview={preview}
        />
        <ChatPanel
          busy={busy}
          messages={messages}
          onPromptChange={setPrompt}
          onReset={() => {
            agentRef.current?.reset();
            setMessages([INITIAL_MESSAGE]);
            setDebugTurns([]);
          }}
          onSubmit={async (nextPrompt) => {
            if (!adapter) {
              return;
            }

            if (!agentRef.current) {
              agentRef.current = createExcelAgent(adapter, provider);
            }
            const agent = agentRef.current;

            const turnId = crypto.randomUUID();
            const startedAt = Date.now();
            let iteration = 0;
            let messageCount = agent.state.messages.length;
            const uiMessages: UiMessage[] = [];

            setBusy(true);
            setMessages((current) => [
              ...current,
              {
                id: crypto.randomUUID(),
                role: "user",
                content: nextPrompt,
              },
            ]);
            setDebugTurns((current) => [
              {
                id: turnId,
                prompt: nextPrompt,
                startedAt,
                status: "running",
                events: [],
              },
              ...current,
            ]);

            const unsubscribe = agent.subscribe((event: AgentEvent) => {
              const runtimeEvent = bridgeAgentEvent(
                event,
                iteration,
                startedAt,
                provider.model,
                messageCount,
              );

              if (event.type === "turn_start") {
                iteration += 1;
                messageCount = agent.state.messages.length;
              }

              if (event.type === "message_end" && event.message.role === "assistant") {
                const text = extractAssistantText(event.message);
                if (text.trim().length > 0) {
                  uiMessages.push({
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: text,
                  });
                }
              }

              if (event.type === "tool_execution_end") {
                const resultText =
                  typeof event.result === "string"
                    ? event.result
                    : JSON.stringify(event.result, null, 2);
                uiMessages.push({
                  id: crypto.randomUUID(),
                  role: "tool",
                  title: event.toolName,
                  content: resultText,
                });
              }

              if (runtimeEvent) {
                startTransition(() => {
                  setDebugTurns((current) =>
                    current.map((turn) =>
                      turn.id === turnId
                        ? { ...turn, events: [...turn.events, runtimeEvent] }
                        : turn,
                    ),
                  );
                });
              }
            });

            try {
              await agent.prompt(nextPrompt);
              setMessages((current) => [...current, ...uiMessages]);
              await refreshPreview(adapter);
              setDebugTurns((current) =>
                current.map((turn) =>
                  turn.id === turnId
                    ? {
                        ...turn,
                        finishedAt: Date.now(),
                        status: "completed",
                        summary: uiMessages.at(-1)?.content,
                      }
                    : turn,
                ),
              );
            } catch (error) {
              const content = error instanceof Error ? error.message : String(error);
              setMessages((current) => [
                ...current,
                ...uiMessages,
                {
                  id: crypto.randomUUID(),
                  role: "tool",
                  title: "runtime error",
                  content,
                },
              ]);
              setDebugTurns((current) =>
                current.map((turn) =>
                  turn.id === turnId
                    ? {
                        ...turn,
                        finishedAt: Date.now(),
                        status: "failed",
                        summary: content,
                      }
                    : turn,
                ),
              );
            } finally {
              unsubscribe();
              setBusy(false);
            }
          }}
          prompt={prompt}
          promptPresets={PROMPT_PRESETS}
        />
      </div>
    </main>
  );
}
