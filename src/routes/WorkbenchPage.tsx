import type { Agent, AgentEvent, AgentMessage } from "@mariozechner/pi-agent-core";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { ChatThread } from "../components/ChatThread";
import { ErrorLogPanel } from "../components/ErrorLogPanel";
import { SettingsPanel } from "../components/SettingsPanel";
import { convertMessages } from "../lib/chat/types";
import { resolveWorkbookAdapter } from "../lib/adapters/host";
import type { WorkbookAdapter } from "../lib/adapters/types";
import { createExcelAgent } from "../lib/agent/agentFactory";
import { bridgeAgentEvent } from "../lib/agent/eventBridge";
import type { DebugTurnRecord } from "../lib/debug/runtimeEvents";
import { getModelDisplayId } from "../lib/provider/resolveModel";
import { useSessionStore } from "../state/sessionStore";

export function WorkbenchPage() {
  const [adapter, setAdapter] = useState<WorkbookAdapter | null>(null);
  const [hostError, setHostError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [debugTurns, setDebugTurns] = useState<DebugTurnRecord[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const agentRef = useRef<Agent | null>(null);

  const provider = useSessionStore((state) => state.provider);
  const setCopilotCredentials = useSessionStore((state) => state.setCopilotCredentials);

  const iterationRef = useRef(0);
  const turnStartRef = useRef(0);
  const modelDisplayId = getModelDisplayId(provider);

  useEffect(() => {
    let cancelled = false;

    void resolveWorkbookAdapter()
      .then((resolvedAdapter) => {
        if (cancelled) return;
        setAdapter(resolvedAdapter);
        setHostError(null);
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

  useEffect(() => {
    if (!adapter) return;

    const agent = createExcelAgent(adapter, provider, (refreshed) => {
      setCopilotCredentials(refreshed);
    });
    agentRef.current = agent;
    setMessages([]);
    setDebugTurns([]);

    const unsubscribe = agent.subscribe((event: AgentEvent) => {
      setMessages([...agent.state.messages]);
      setIsRunning(agent.state.isStreaming);

      // Debug logging for lifecycle events
      if (event.type === "agent_start") {
        console.log("[agent] agent_start");
      }
      if (event.type === "agent_end") {
        console.log("[agent] agent_end, messages:", event.messages.length);
      }
      if (event.type === "turn_end") {
        const msg = event.message as unknown as Record<string, unknown>;
        console.log("[agent] turn_end, stopReason:", msg["stopReason"], "errorMessage:", msg["errorMessage"]);
      }
      if (event.type === "tool_execution_end" && event.isError) {
        console.log("[agent] tool_execution_end ERROR:", event.toolName, event.result);
      }

      const runtimeEvent = bridgeAgentEvent(
        event,
        iterationRef.current,
        turnStartRef.current,
        modelDisplayId,
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

    });

    return () => {
      unsubscribe();
      agent.abort();
    };
  }, [adapter, provider, modelDisplayId, setCopilotCredentials]);

  const handleSend = useCallback(async (text: string) => {
    const agent = agentRef.current;
    if (!agent) return;

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
      setIsRunning(false);
      setDebugTurns((current) =>
        current.map((turn) =>
          turn.id === turnId ? { ...turn, finishedAt: Date.now(), status: "completed" } : turn,
        ),
      );
    } catch (error) {
      setIsRunning(false);
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

  const handleStop = useCallback(() => {
    agentRef.current?.abort();
  }, []);

  const handleNewChat = useCallback(() => {
    agentRef.current?.reset();
    setMessages([]);
    setDebugTurns([]);
  }, []);

  const chatMessages = convertMessages(messages);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">OpenExcel</h1>
          <span className="pill">{modelDisplayId}</span>
        </div>
        <div className="app-header-right">
          <button
            className="icon-button"
            type="button"
            onClick={() => setShowSettings((prev) => !prev)}
            title="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => setShowDebug((prev) => !prev)}
            title={showDebug ? "Hide Debug" : "Debug"}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.5 2.5L3 5M10.5 2.5L13 5" />
              <path d="M2 8h2.5M11.5 8H14" />
              <path d="M3 11l2.5-1M13 11l-2.5-1" />
              <rect x="5" y="4" width="6" height="8" rx="3" />
              <path d="M8 4v8" />
            </svg>
          </button>
          <button className="icon-button" type="button" onClick={handleNewChat} title="New Chat">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </button>
        </div>
      </header>

      {hostError && <p className="error-callout app-error">{hostError}</p>}

      <div className="app-content">
        <div className="chat-area">
          <ChatThread
            messages={chatMessages}
            isRunning={isRunning}
            onSend={handleSend}
            onStop={handleStop}
            disabled={!adapter}
            turnStartedAt={turnStartRef.current}
          />
        </div>

        {showDebug && (
          <aside className="debug-overlay">
            <div className="debug-overlay-header">
              <h2>Debug</h2>
              <button
                className="debug-close-btn"
                type="button"
                onClick={() => setShowDebug(false)}
              >
                Close
              </button>
            </div>

            <ErrorLogPanel />

            <section className="debug-timeline">
              <div className="debug-section-header">
                <h3>Timeline</h3>
              </div>
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

        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </div>
    </main>
  );
}
