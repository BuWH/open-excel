import basicChat from "./fixtures/basic-chat.json";
import errorStates from "./fixtures/error-states.json";
import settingsCopilotConnected from "./fixtures/settings-copilot-connected.json";
import settingsCopilotLogin from "./fixtures/settings-copilot-login.json";
import settingsCustom from "./fixtures/settings-custom.json";
import settingsProviderSwitch from "./fixtures/settings-provider-switch.json";
import streamingSlow from "./fixtures/streaming-slow.json";
import thinking from "./fixtures/thinking.json";
import toolCalls from "./fixtures/tool-calls.json";
import type { MockScenario } from "./mockAgentDriver";

export const CHAT_SCENARIOS: MockScenario[] = [
  basicChat as MockScenario,
  toolCalls as MockScenario,
  thinking as MockScenario,
  streamingSlow as MockScenario,
  errorStates as MockScenario,
];

export const SETTINGS_SCENARIOS: MockScenario[] = [
  settingsCustom as MockScenario,
  settingsCopilotConnected as MockScenario,
  settingsCopilotLogin as MockScenario,
  settingsProviderSwitch as MockScenario,
];

export const ALL_SCENARIOS: MockScenario[] = [...CHAT_SCENARIOS, ...SETTINGS_SCENARIOS];

export function getScenarioByName(name: string): MockScenario | undefined {
  return ALL_SCENARIOS.find((s) => s.name === name);
}
