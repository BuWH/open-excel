import basicChat from "./fixtures/basic-chat.json";
import errorStates from "./fixtures/error-states.json";
import streamingSlow from "./fixtures/streaming-slow.json";
import thinking from "./fixtures/thinking.json";
import toolCalls from "./fixtures/tool-calls.json";
import type { MockScenario } from "./mockAgentDriver";

export const ALL_SCENARIOS: MockScenario[] = [
  basicChat as MockScenario,
  toolCalls as MockScenario,
  thinking as MockScenario,
  streamingSlow as MockScenario,
  errorStates as MockScenario,
];

export function getScenarioByName(name: string): MockScenario | undefined {
  return ALL_SCENARIOS.find((s) => s.name === name);
}
