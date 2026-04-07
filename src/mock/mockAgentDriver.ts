import type { AgentEvent, AgentMessage } from "@mariozechner/pi-agent-core";
import type {
  AssistantMessage,
  TextContent,
  ThinkingContent,
  ToolCall,
  ToolResultMessage,
  UserMessage,
} from "@mariozechner/pi-ai";

export type MockToolResultContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string };

export type MockEventDef =
  | { type: "turn_start"; delay?: number }
  | {
      type: "turn_end";
      delay?: number;
      message: {
        content: Array<
          | { type: "text"; text: string }
          | { type: "thinking"; thinking: string }
          | { type: "toolCall"; id: string; name: string; arguments: Record<string, unknown> }
        >;
        stopReason?: "stop" | "length" | "toolUse" | "error" | "aborted";
        errorMessage?: string;
        usage?: { input: number; output: number };
      };
    }
  | {
      type: "tool_execution_start";
      toolCallId?: string;
      toolName: string;
      args?: Record<string, unknown>;
      delay?: number;
    }
  | {
      type: "tool_execution_end";
      toolCallId?: string;
      toolName: string;
      result: { content: MockToolResultContent[] };
      isError: boolean;
      delay?: number;
    };

export type MockTurn = {
  userMessage: string;
  events: MockEventDef[];
};

export type MockScenario = {
  name: string;
  description: string;
  autoPlay?: boolean;
  streamDelay?: number;
  turns: MockTurn[];
};

function makeUsage(input = 0, output = 0) {
  return {
    input,
    output,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: input + output,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

function buildAssistantMessage(
  def: Extract<MockEventDef, { type: "turn_end" }>["message"],
): AssistantMessage {
  const content: (TextContent | ThinkingContent | ToolCall)[] = def.content.map((block) => {
    if (block.type === "text") return { type: "text" as const, text: block.text };
    if (block.type === "thinking") return { type: "thinking" as const, thinking: block.thinking };
    return {
      type: "toolCall" as const,
      id: block.id,
      name: block.name,
      arguments: block.arguments,
    };
  });

  return {
    role: "assistant",
    content,
    api: "openai-completions",
    provider: "mock",
    model: "mock-model",
    usage: makeUsage(def.usage?.input, def.usage?.output),
    stopReason: def.stopReason ?? "stop",
    errorMessage: def.errorMessage,
    timestamp: uniqueTimestamp(),
  };
}

function buildToolResultMessage(
  def: Extract<MockEventDef, { type: "tool_execution_end" }>,
): ToolResultMessage {
  return {
    role: "toolResult",
    toolCallId: def.toolCallId ?? `mock-tc-${def.toolName}`,
    toolName: def.toolName,
    content: def.result.content.map((c) => {
      if (c.type === "text") return { type: "text" as const, text: c.text };
      return { type: "image" as const, data: c.data, mimeType: c.mimeType };
    }),
    isError: def.isError,
    timestamp: uniqueTimestamp(),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let timestampCounter = 0;

function uniqueTimestamp(): number {
  timestampCounter += 1;
  return Date.now() + timestampCounter;
}

type AgentLikeState = {
  messages: AgentMessage[];
  isStreaming: boolean;
};

export class MockAgentDriver {
  state: AgentLikeState = {
    messages: [],
    isStreaming: false,
  };

  private listeners: Set<(event: AgentEvent) => void> = new Set();
  private scenario: MockScenario | null = null;
  private turnIndex = 0;
  private aborted = false;
  private autoPlayTimer: ReturnType<typeof setTimeout> | null = null;

  subscribe(handler: (event: AgentEvent) => void): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  private emit(event: AgentEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  loadScenario(scenario: MockScenario) {
    this.reset();
    this.scenario = scenario;
    this.turnIndex = 0;
  }

  async prompt(text: string | AgentMessage | AgentMessage[]): Promise<void> {
    const userText = typeof text === "string" ? text : "";
    if (!this.scenario) return;

    const turn = this.scenario.turns[this.turnIndex];
    if (!turn) return;

    this.turnIndex += 1;
    this.aborted = false;
    this.state.isStreaming = true;

    // Add user message
    const userMsg: UserMessage = {
      role: "user",
      content: userText,
      timestamp: uniqueTimestamp(),
    };
    this.state.messages = [...this.state.messages, userMsg];

    // Emit agent_start
    this.emit({ type: "agent_start" });

    // Replay events
    for (const eventDef of turn.events) {
      if (this.aborted) break;

      if (eventDef.delay) {
        await sleep(eventDef.delay);
      }
      if (this.aborted) break;

      switch (eventDef.type) {
        case "turn_start": {
          this.emit({ type: "turn_start" });
          break;
        }
        case "turn_end": {
          const assistantMsg = buildAssistantMessage(eventDef.message);
          this.state.messages = [...this.state.messages, assistantMsg];
          this.emit({
            type: "turn_end",
            message: assistantMsg,
            toolResults: [],
          });
          break;
        }
        case "tool_execution_start": {
          this.emit({
            type: "tool_execution_start",
            toolCallId: eventDef.toolCallId ?? `mock-tc-${eventDef.toolName}`,
            toolName: eventDef.toolName,
            args: eventDef.args ?? {},
          });
          break;
        }
        case "tool_execution_end": {
          const toolResult = buildToolResultMessage(eventDef);
          this.state.messages = [...this.state.messages, toolResult];
          this.emit({
            type: "tool_execution_end",
            toolCallId: eventDef.toolCallId ?? `mock-tc-${eventDef.toolName}`,
            toolName: eventDef.toolName,
            result: eventDef.result,
            isError: eventDef.isError,
          });
          break;
        }
      }
    }

    // Emit agent_end
    this.state.isStreaming = false;
    this.emit({
      type: "agent_end",
      messages: this.state.messages,
    });
  }

  abort() {
    this.aborted = true;
    this.state.isStreaming = false;
    if (this.autoPlayTimer) {
      clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  reset() {
    this.abort();
    this.state.messages = [];
    this.state.isStreaming = false;
    this.turnIndex = 0;
  }

  get currentTurnIndex(): number {
    return this.turnIndex;
  }

  get totalTurns(): number {
    return this.scenario?.turns.length ?? 0;
  }

  get hasNextTurn(): boolean {
    return this.scenario != null && this.turnIndex < this.scenario.turns.length;
  }

  promptNextTurn(): void {
    if (!this.scenario || !this.hasNextTurn) return;
    const turn = this.scenario.turns[this.turnIndex];
    if (turn) {
      void this.prompt(turn.userMessage);
    }
  }
}
