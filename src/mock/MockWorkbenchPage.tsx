import type { AgentEvent, AgentMessage } from "@mariozechner/pi-agent-core";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { ChatThread } from "../components/ChatThread";
import { ErrorLogPanel } from "../components/ErrorLogPanel";
import { SettingsPanel } from "../components/SettingsPanel";
import { bridgeAgentEvent } from "../lib/agent/eventBridge";
import { convertMessages } from "../lib/chat/types";
import type { DebugTurnRecord } from "../lib/debug/runtimeEvents";
import { getModelDisplayId } from "../lib/provider/resolveModel";
import { useSessionStore } from "../state/sessionStore";
import type { MockScenario } from "./mockAgentDriver";
import { MockAgentDriver } from "./mockAgentDriver";
import { ScenarioPicker } from "./ScenarioPicker";
import { ALL_SCENARIOS } from "./scenarioLoader";

const MOCK_MODEL_ID = "mock-model";

export function MockWorkbenchPage() {
  const [showDebug, setShowDebug] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [debugTurns, setDebugTurns] = useState<DebugTurnRecord[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [scenario, setScenario] = useState<MockScenario>(ALL_SCENARIOS[0] as MockScenario);
  const [scenarioKey, setScenarioKey] = useState(0);
  const provider = useSessionStore((state) => state.provider);
  const modelDisplayId = getModelDisplayId(provider);

  const driverRef = useRef<MockAgentDriver>(new MockAgentDriver());
  const iterationRef = useRef(0);
  const turnStartRef = useRef(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scenarioKey forces re-run when resetting same scenario
  useEffect(() => {
    const driver = driverRef.current;

    const unsubscribe = driver.subscribe((event: AgentEvent) => {
      setMessages([...driver.state.messages]);
      setIsRunning(driver.state.isStreaming);

      const runtimeEvent = bridgeAgentEvent(
        event,
        iterationRef.current,
        turnStartRef.current,
        MOCK_MODEL_ID,
        driver.state.messages.length,
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

    driver.loadScenario(scenario);

    // Auto-play all turns in sequence
    if (scenario.autoPlay && scenario.turns.length > 0) {
      let cancelled = false;
      const autoplay = async () => {
        for (const turn of scenario.turns) {
          if (cancelled) break;

          turnStartRef.current = Date.now();
          iterationRef.current = 0;

          const turnId = crypto.randomUUID();
          setDebugTurns((current) => [
            {
              id: turnId,
              prompt: turn.userMessage,
              startedAt: Date.now(),
              status: "running",
              events: [],
            },
            ...current,
          ]);

          try {
            await driver.prompt(turn.userMessage);
            if (cancelled) break;
            setDebugTurns((current) =>
              current.map((t) =>
                t.id === turnId ? { ...t, finishedAt: Date.now(), status: "completed" } : t,
              ),
            );
          } catch {
            break;
          }

          // Pause between turns
          if (!cancelled) {
            await new Promise((r) => setTimeout(r, scenario.streamDelay ?? 500));
          }
        }
      };

      void autoplay();

      return () => {
        cancelled = true;
        unsubscribe();
        driver.abort();
      };
    }

    return () => {
      unsubscribe();
      driver.abort();
    };
  }, [scenario, scenarioKey]);

  const handleSend = useCallback(async (text: string) => {
    const driver = driverRef.current;

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
      await driver.prompt(text);
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
    driverRef.current.abort();
  }, []);

  const handleNewChat = useCallback(() => {
    driverRef.current.reset();
    setMessages([]);
    setDebugTurns([]);
  }, []);

  const handleScenarioSwitch = useCallback((newScenario: MockScenario) => {
    const driver = driverRef.current;
    driver.reset();
    setMessages([]);
    setDebugTurns([]);
    setIsRunning(false);
    setScenario(newScenario);
    setScenarioKey((k) => k + 1);
  }, []);

  const chatMessages = convertMessages(messages);

  return (
    <>
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
                <title>Settings</title>
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
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>Debug</title>
                <path d="M5.5 2.5L3 5M10.5 2.5L13 5" />
                <path d="M2 8h2.5M11.5 8H14" />
                <path d="M3 11l2.5-1M13 11l-2.5-1" />
                <rect x="5" y="4" width="6" height="8" rx="3" />
                <path d="M8 4v8" />
              </svg>
            </button>
            <button className="icon-button" type="button" onClick={handleNewChat} title="New Chat">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>New Chat</title>
                <path d="M8 3v10M3 8h10" />
              </svg>
            </button>
          </div>
        </header>

        <div className="app-content">
          <div className="chat-area">
            <ChatThread
              messages={chatMessages}
              isRunning={isRunning}
              onSend={handleSend}
              onStop={handleStop}
              disabled={false}
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

      <ScenarioPicker
        driver={driverRef.current}
        currentScenario={scenario}
        onSwitch={handleScenarioSwitch}
      />
    </>
  );
}
