import { useState } from "react";
import type { MockAgentDriver, MockScenario } from "./mockAgentDriver";
import { CHAT_SCENARIOS, SETTINGS_SCENARIOS } from "./scenarioLoader";

type ScenarioPickerProps = {
  readonly driver: MockAgentDriver;
  readonly currentScenario: MockScenario;
  readonly onSwitch: (scenario: MockScenario) => void;
};

function ScenarioGroup({
  label,
  scenarios,
  currentName,
  onSwitch,
}: {
  label: string;
  scenarios: MockScenario[];
  currentName: string;
  onSwitch: (s: MockScenario) => void;
}) {
  return (
    <>
      <div
        style={{
          marginBottom: 4,
          marginTop: 8,
          opacity: 0.5,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
      {scenarios.map((scenario) => (
        <button
          type="button"
          key={scenario.name}
          onClick={() => onSwitch(scenario)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "6px 8px",
            margin: "2px 0",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 11,
            background: scenario.name === currentName ? "#0f3460" : "transparent",
            color: scenario.name === currentName ? "#7ec8e3" : "#c0c0c0",
            fontWeight: scenario.name === currentName ? 600 : 400,
          }}
        >
          {scenario.name}
        </button>
      ))}
    </>
  );
}

export function ScenarioPicker({ driver, currentScenario, onSwitch }: ScenarioPickerProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 8,
        left: 8,
        zIndex: 9999,
        background: "#1a1a2e",
        color: "#e0e0e0",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        fontSize: 12,
        fontFamily: "system-ui, sans-serif",
        minWidth: collapsed ? "auto" : 220,
        maxHeight: "80vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          padding: "8px 12px",
          border: "none",
          background: "#16213e",
          color: "#e0e0e0",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <span style={{ fontSize: 14 }}>Mock</span>
        <span style={{ opacity: 0.6, flex: 1, textAlign: "left" }}>
          {collapsed ? currentScenario.name : ""}
        </span>
        <span style={{ fontSize: 10 }}>{collapsed ? "+" : "-"}</span>
      </button>

      {!collapsed && (
        <div style={{ padding: "4px 8px 8px", overflowY: "auto" }}>
          <ScenarioGroup
            label="Chat"
            scenarios={CHAT_SCENARIOS}
            currentName={currentScenario.name}
            onSwitch={onSwitch}
          />
          <ScenarioGroup
            label="Settings"
            scenarios={SETTINGS_SCENARIOS}
            currentName={currentScenario.name}
            onSwitch={onSwitch}
          />

          <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
            <button
              type="button"
              onClick={() => onSwitch(currentScenario)}
              style={{
                flex: 1,
                padding: "5px 8px",
                border: "1px solid #333",
                borderRadius: 4,
                background: "#1a1a2e",
                color: "#e0e0e0",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              Reset
            </button>
            {driver.hasNextTurn && !currentScenario.autoPlay && (
              <button
                type="button"
                onClick={() => driver.promptNextTurn()}
                style={{
                  flex: 1,
                  padding: "5px 8px",
                  border: "1px solid #333",
                  borderRadius: 4,
                  background: "#0f3460",
                  color: "#7ec8e3",
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                Next Turn
              </button>
            )}
          </div>

          <div style={{ marginTop: 6, fontSize: 10, opacity: 0.4 }}>
            Turn {driver.currentTurnIndex}/{driver.totalTurns}
          </div>
        </div>
      )}
    </div>
  );
}
