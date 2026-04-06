import { startTransition, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ChatPanel } from "../components/ChatPanel";
import { WorkbookInspector } from "../components/WorkbookInspector";
import { resolveWorkbookAdapter } from "../lib/adapters/host";
import type { WorkbookAdapter } from "../lib/adapters/types";
import { runAgentTurn } from "../lib/agent/runtime";
import type { DebugTurnRecord } from "../lib/debug/runtimeEvents";
import { PROMPT_PRESETS } from "../lib/promptPresets";
import type { ChatCompletionMessage, UiMessage } from "../lib/types/llm";
import type { WorkbookPreview } from "../lib/types/workbook";
import { useSessionStore } from "../state/sessionStore";

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
  const [history, setHistory] = useState<ChatCompletionMessage[]>([]);
  const [hostError, setHostError] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([INITIAL_MESSAGE]);
  const [preview, setPreview] = useState<WorkbookPreview | null>(null);
  const [prompt, setPrompt] = useState(PROMPT_PRESETS[0]?.prompt ?? "");
  const [selectedSheet, setSelectedSheet] = useState<string>();

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
              setHistory([]);
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
              setHistory([]);
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
          <strong>{adapter?.label ?? "Resolving adapter…"}</strong>
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
          adapterLabel={adapter?.label ?? "Resolving adapter…"}
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
            setHistory([]);
            setMessages([INITIAL_MESSAGE]);
            setDebugTurns([]);
          }}
          onSubmit={async (nextPrompt) => {
            if (!adapter) {
              return;
            }

            const turnId = crypto.randomUUID();
            const startedAt = Date.now();

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

            try {
              const result = await runAgentTurn({
                adapter,
                history,
                onEvent: (event) => {
                  startTransition(() => {
                    setDebugTurns((current) =>
                      current.map((turn) =>
                        turn.id === turnId ? { ...turn, events: [...turn.events, event] } : turn,
                      ),
                    );
                  });
                },
                prompt: nextPrompt,
                provider,
              });
              setHistory(result.transcript);
              setMessages((current) => [...current, ...result.uiMessages]);
              await refreshPreview(adapter);
              setDebugTurns((current) =>
                current.map((turn) =>
                  turn.id === turnId
                    ? {
                        ...turn,
                        finishedAt: Date.now(),
                        status: "completed",
                        summary: result.uiMessages.at(-1)?.content,
                      }
                    : turn,
                ),
              );
            } catch (error) {
              const content = error instanceof Error ? error.message : String(error);
              setMessages((current) => [
                ...current,
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
