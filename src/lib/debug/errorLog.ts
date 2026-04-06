export type OfficeJsErrorEntry = {
  readonly id: string;
  readonly timestamp: number;
  readonly toolName: string;
  readonly code: string;
  readonly errorMessage: string;
  readonly errorStack?: string;
};

const MAX_ENTRIES = 200;

let entries: OfficeJsErrorEntry[] = [];
let listeners: Array<() => void> = [];

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function logToolError(
  toolName: string,
  args: Record<string, unknown>,
  error: unknown,
): void {
  const entry: OfficeJsErrorEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    toolName,
    code: toolName === "execute_office_js" ? String(args["code"] ?? "") : JSON.stringify(args, null, 2),
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined,
  };

  entries = [entry, ...entries].slice(0, MAX_ENTRIES);
  notify();
}

export function getErrorLog(): readonly OfficeJsErrorEntry[] {
  return entries;
}

export function clearErrorLog(): void {
  entries = [];
  notify();
}

export function subscribeErrorLog(listener: () => void): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
