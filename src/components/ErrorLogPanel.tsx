import { useEffect, useState } from "react";
import {
  clearErrorLog,
  getErrorLog,
  subscribeErrorLog,
  type OfficeJsErrorEntry,
} from "../lib/debug/errorLog";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function ErrorEntry({ entry }: { readonly entry: OfficeJsErrorEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="error-entry">
      <button
        className="error-entry-header"
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span className="error-entry-left">
          <span className="error-entry-time">{formatTime(entry.timestamp)}</span>
          <span className="error-entry-tool">{entry.toolName}</span>
        </span>
        <svg
          className={`error-entry-chevron ${expanded ? "error-entry-chevron-open" : ""}`}
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
      </button>
      <div className="error-entry-message">{entry.errorMessage}</div>
      {expanded && (
        <div className="error-entry-details">
          <div className="error-entry-section">
            <span className="error-entry-label">Code / Args</span>
            <pre className="error-entry-code">{entry.code}</pre>
          </div>
          {entry.errorStack && (
            <div className="error-entry-section">
              <span className="error-entry-label">Stack</span>
              <pre className="error-entry-code">{entry.errorStack}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ErrorLogPanel() {
  const [entries, setEntries] = useState<readonly OfficeJsErrorEntry[]>(getErrorLog);

  useEffect(() => {
    return subscribeErrorLog(() => setEntries(getErrorLog()));
  }, []);

  return (
    <section className="debug-error-log">
      <div className="debug-section-header">
        <h3>Error Log</h3>
        {entries.length > 0 && (
          <button
            className="debug-section-action"
            type="button"
            onClick={() => clearErrorLog()}
          >
            Clear
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="debug-empty">No errors recorded.</p>
      ) : (
        <div className="error-entries">
          {entries.map((entry) => (
            <ErrorEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
