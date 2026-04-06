import type { AppendMessage } from "@assistant-ui/react";
import { AssistantRuntimeProvider, useExternalStoreRuntime } from "@assistant-ui/react";
import type { Agent, AgentEvent, AgentMessage } from "@mariozechner/pi-agent-core";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { Thread } from "../components/Thread";
import { WorkbookInspector } from "../components/WorkbookInspector";
import { resolveWorkbookAdapter } from "../lib/adapters/host";
import type { WorkbookAdapter } from "../lib/adapters/types";
import { createExcelAgent } from "../lib/agent/agentFactory";
import { bridgeAgentEvent } from "../lib/agent/eventBridge";
import { convertMessages } from "../lib/agent/messageConverter";
import type { DebugTurnRecord } from "../lib/debug/runtimeEvents";
import { ENV_MODEL } from "../lib/provider/env";
import type { WorkbookPreview } from "../lib/types/workbook";

function extractAppendText(message: AppendMessage): string {
  if (typeof message.content === "string") {
    return message.content;
  }
  return (message.content as ReadonlyArray<{ type: string; text?: string }>)
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("\n");
}

export function WorkbenchPage() {
  const [adapter, setAdapter] = useState<WorkbookAdapter | null>(null);
  const [hostError, setHostError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugTurns, setDebugTurns] = useState<DebugTurnRecord[]>([]);
  const [preview, setPreview] = useState<WorkbookPreview | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const agentRef = useRef<Agent | null>(null);

  // Track iteration + timing for debug bridge
  const iterationRef = useRef(0);
  const turnStartRef = useRef(0);

  const refreshPreview = useCallback(
    async (activeAdapter = adapter, sheetName?: string) => {
      if (!activeAdapter) return;
      const nextPreview = await activeAdapter.getPreview(sheetName ?? selectedSheet);
      setPreview(nextPreview);
      setSelectedSheet(nextPreview.sheetName);
    },
    [adapter, selectedSheet],
  );

  // Resolve workbook adapter on mount
  useEffect(() => {
    let cancelled = false;

    void resolveWorkbookAdapter()
      .then(async (resolvedAdapter) => {
        if (cancelled) return;
        setAdapter(resolvedAdapter);
        setHostError(null);

        const nextPreview = await resolvedAdapter.getPreview();
        if (cancelled) return;
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

  // Create agent when adapter is ready
  useEffect(() => {
    if (!adapter) return;

    const agent = createExcelAgent(adapter);
    agentRef.current = agent;

    const unsubscribe = agent.subscribe((event: AgentEvent) => {
      // Sync messages + streaming state
      setMessages([...agent.state.messages]);
      setIsRunning(agent.state.isStreaming);

      // Bridge debug events
      const runtimeEvent = bridgeAgentEvent(
        event,
        iterationRef.current,
        turnStartRef.current,
        ENV_MODEL.id,
        agent.state.messages.length,
      );

      if (event.type === "turn_start") {
        iterationRef.current += 1;
      }

      if (runtimeEvent) {
        startTransition(() => {
          setDebugTurns((current) => {
            const turnId = current[0]?.id;
            if (!turnId) return current;
            return current.map((turn) =>
              turn.id === turnId ? { ...turn, events: [...turn.events, runtimeEvent] } : turn,
            );
          });
        });
      }

      // Refresh workbook preview on agent_end
      if (event.type === "agent_end") {
        void refreshPreview(adapter);
      }
    });

    return () => {
      unsubscribe();
      agent.abort();
    };
  }, [adapter, refreshPreview]);

  const handleNew = useCallback(async (appendMessage: AppendMessage) => {
    const agent = agentRef.current;
    if (!agent) return;

    const text = extractAppendText(appendMessage);
    if (!text.trim()) return;

    const turnId = crypto.randomUUID();
    iterationRef.current = 0;
    turnStartRef.current = Date.now();

    setDebugTurns((current) => [
      {
        id: turnId,
        prompt: text,
        startedAt: Date.now(),
        status: "running",
        events: [],
      },
      ...current,
    ]);

    try {
      await agent.prompt(text);
      setDebugTurns((current) =>
        current.map((turn) =>
          turn.id === turnId ? { ...turn, finishedAt: Date.now(), status: "completed" } : turn,
        ),
      );
    } catch (error) {
      const content = error instanceof Error ? error.message : String(error);
      setDebugTurns((current) =>
        current.map((turn) =>
          turn.id === turnId
            ? { ...turn, finishedAt: Date.now(), status: "failed", summary: content }
            : turn,
        ),
      );
    }
  }, []);

  const handleCancel = useCallback(async () => {
    agentRef.current?.abort();
  }, []);

  const convertedMessages = convertMessages(messages);

  const runtime = useExternalStoreRuntime({
    messages: convertedMessages,
    isRunning,
    convertMessage: (msg) => msg,
    onNew: handleNew,
    onCancel: handleCancel,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <main className="app-shell">
        <header className="app-header">
          <div className="app-header-left">
            <h1 className="app-title">OpenExcel</h1>
            <span className="pill">{ENV_MODEL.id}</span>
            <span className="pill">{adapter?.kind ?? "resolving"}</span>
          </div>
          <div className="app-header-right">
            <button
              className="ghost-button"
              type="button"
              onClick={() => setShowDebug((prev) => !prev)}
            >
              {showDebug ? "Hide Debug" : "Debug"}
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                agentRef.current?.reset();
                setMessages([]);
                setDebugTurns([]);
              }}
            >
              New Chat
            </button>
          </div>
        </header>

        {hostError && <p className="error-callout app-error">{hostError}</p>}

        <div className={`app-content ${showDebug ? "app-content-with-debug" : ""}`}>
          <div className="chat-area">
            <Thread />
          </div>

          {showDebug && (
            <aside className="debug-sidebar">
              <WorkbookInspector
                adapterLabel={adapter?.label ?? "Resolving adapter..."}
                onRefresh={async () => refreshPreview()}
                onSelectSheet={(sheetName) => {
                  setSelectedSheet(sheetName);
                  void refreshPreview(adapter, sheetName);
                }}
                preview={preview}
              />

              <section className="debug-timeline">
                <h3>Debug Timeline</h3>
                <div className="debug-turns">
                  {debugTurns.map((turn) => (
                    <article className="debug-turn" key={turn.id}>
                      <div className="turn-summary">
                        <span className={`turn-status turn-status-${turn.status}`}>
                          {turn.status}
                        </span>
                        <span className="turn-events">{turn.events.length} events</span>
                      </div>
                      <pre className="turn-prompt">{turn.prompt}</pre>
                      {turn.summary && <pre className="turn-result">{turn.summary}</pre>}
                    </article>
                  ))}
                </div>
              </section>
            </aside>
          )}
        </div>
      </main>
    </AssistantRuntimeProvider>
  );
}
