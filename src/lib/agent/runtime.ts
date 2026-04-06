import type { WorkbookAdapter } from "../adapters/types";
import type { AgentRuntimeEvent, AgentRuntimeEventDraft } from "../debug/runtimeEvents";
import { createChatCompletion } from "../litellm/client";
import type { ChatCompletionMessage, ProviderConfig, UiMessage } from "../types/llm";
import { buildToolRegistry } from "./toolRegistry";

const SYSTEM_PROMPT = `You are operating inside a reverse-engineered "Claude in Excel" prototype.

Primary goal: help the user inspect and edit workbook data safely.

Rules:
- Prefer structured tools over execute_office_js.
- Use get_sheets_metadata before guessing sheet names.
- Use get_cell_ranges before making decisions that depend on workbook contents.
- When you need to preserve or inspect presentation, call get_cell_ranges with includeStyles=true.
- Use set_cell_range for direct cell writes.
- Use clear_cell_range to remove values.
- Do not leave user-facing reports as naked raw grids. After writing a report or summary table, apply presentation formatting such as header emphasis, fills, borders, column sizing, wrapped summary text, and appropriate number or date formats.
- Formatting, layout, table creation, autofit, and worksheet screenshots are valid reasons to use execute_office_js.
- Use get_range_image when a human may need visual confirmation of a finished range or when you are comparing report styling across runs.
- Only use execute_office_js when the structured tools are insufficient for the task, especially for formatting and layout.
- If a worksheet already contains a styled report, preserve or improve that presentation instead of clearing it to an unformatted grid unless the user explicitly asks for a reset.
- Keep responses concise and operational.`;

function createUiMessage(role: UiMessage["role"], content: string, title?: string): UiMessage {
  return {
    id: crypto.randomUUID(),
    role,
    title,
    content,
  };
}

function createRuntimeEvent(event: AgentRuntimeEventDraft): AgentRuntimeEvent {
  return {
    ...event,
    id: crypto.randomUUID(),
  };
}

export async function runAgentTurn(args: {
  adapter: WorkbookAdapter;
  history: ChatCompletionMessage[];
  onEvent?(event: AgentRuntimeEvent): void;
  provider: ProviderConfig;
  prompt: string;
}) {
  const { adapter, history, onEvent, prompt, provider } = args;
  const { executors, tools } = buildToolRegistry(adapter);
  const transcript: ChatCompletionMessage[] = history.length
    ? [...history]
    : [{ role: "system", content: SYSTEM_PROMPT }];

  transcript.push({ role: "user", content: prompt });

  const uiMessages: UiMessage[] = [];
  const turnStartedAt = Date.now();

  for (let iteration = 0; iteration < 8; iteration += 1) {
    onEvent?.(
      createRuntimeEvent({
        type: "llm-request",
        iteration,
        timestamp: Date.now(),
        model: provider.model,
        messageCount: transcript.length,
      }),
    );

    const llmStartedAt = Date.now();
    const completion = await createChatCompletion(provider, transcript, tools);
    const llmDurationMs = Date.now() - llmStartedAt;

    onEvent?.(
      createRuntimeEvent({
        type: "llm-response",
        iteration,
        timestamp: Date.now(),
        durationMs: llmDurationMs,
        content: completion.content,
        toolCallNames: completion.toolCalls.map((toolCall) => toolCall.function.name),
      }),
    );

    if (completion.toolCalls.length === 0) {
      const content = completion.content || "No assistant content returned.";
      transcript.push({ role: "assistant", content });
      uiMessages.push(createUiMessage("assistant", content));
      onEvent?.(
        createRuntimeEvent({
          type: "final-answer",
          iteration,
          timestamp: Date.now(),
          durationMs: Date.now() - turnStartedAt,
          content,
        }),
      );

      return { transcript, uiMessages };
    }

    transcript.push({
      role: "assistant",
      content: completion.content,
      tool_calls: completion.toolCalls,
    });

    if (completion.content.trim().length > 0) {
      uiMessages.push(createUiMessage("assistant", completion.content));
    }

    for (const toolCall of completion.toolCalls) {
      onEvent?.(
        createRuntimeEvent({
          type: "tool-start",
          iteration,
          timestamp: Date.now(),
          toolName: toolCall.function.name,
          arguments: toolCall.function.arguments,
        }),
      );

      const executor = executors[toolCall.function.name];

      if (!executor) {
        const failure = JSON.stringify(
          {
            error: `Unsupported tool: ${toolCall.function.name}`,
          },
          null,
          2,
        );
        transcript.push({
          role: "tool",
          name: toolCall.function.name,
          tool_call_id: toolCall.id,
          content: failure,
        });
        uiMessages.push(createUiMessage("tool", failure, toolCall.function.name));
        onEvent?.(
          createRuntimeEvent({
            type: "tool-error",
            iteration,
            timestamp: Date.now(),
            durationMs: 0,
            toolName: toolCall.function.name,
            content: failure,
          }),
        );
        continue;
      }

      const toolStartedAt = Date.now();
      try {
        const result = await executor(toolCall.function.arguments);
        const content = JSON.stringify(result, null, 2);
        transcript.push({
          role: "tool",
          name: toolCall.function.name,
          tool_call_id: toolCall.id,
          content,
        });
        uiMessages.push(createUiMessage("tool", content, toolCall.function.name));
        onEvent?.(
          createRuntimeEvent({
            type: "tool-result",
            iteration,
            timestamp: Date.now(),
            durationMs: Date.now() - toolStartedAt,
            toolName: toolCall.function.name,
            content,
          }),
        );
      } catch (error) {
        const content = JSON.stringify(
          {
            error: error instanceof Error ? error.message : String(error),
          },
          null,
          2,
        );
        transcript.push({
          role: "tool",
          name: toolCall.function.name,
          tool_call_id: toolCall.id,
          content,
        });
        uiMessages.push(createUiMessage("tool", content, toolCall.function.name));
        onEvent?.(
          createRuntimeEvent({
            type: "tool-error",
            iteration,
            timestamp: Date.now(),
            durationMs: Date.now() - toolStartedAt,
            toolName: toolCall.function.name,
            content,
          }),
        );
      }
    }
  }

  throw new Error("Agent loop exceeded maximum tool iterations.");
}
