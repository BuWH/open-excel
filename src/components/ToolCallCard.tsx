import { useState } from "react";
import type { ToolCallPart } from "../lib/chat/types";

type ToolCallCardProps = {
  readonly part: ToolCallPart;
};

const TOOL_LABELS: Record<string, string> = {
  get_sheets_metadata: "Get Sheets Metadata",
  get_cell_ranges: "Get Cell Ranges",
  set_cell_range: "Set Cell Range",
  clear_cell_range: "Clear Cell Range",
  get_range_image: "Get Range Image",
  execute_office_js: "Execute Office JS",
};

function WrenchIcon() {
  return (
    <svg className="tool-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 2.1a4 4 0 0 0-4.8 5.3L2.4 10.7a1.4 1.4 0 1 0 2 2l3.3-3.3a4 4 0 0 0 5.3-4.8L10.8 6.8 9.2 5.2l2.2-2.2-.9-.9z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8.5L6.5 11.5L12.5 5" />
    </svg>
  );
}

function StatusIndicator({ part }: { part: ToolCallPart }) {
  const isPending = part.result === undefined && !part.isError;

  if (isPending) {
    return <span className="tool-status tool-status-running"><span className="tool-status-dot tool-status-dot-pulse" />Running</span>;
  }
  if (part.isError) {
    return <span className="tool-status tool-status-error">Error</span>;
  }
  return <CheckIcon />;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`tool-chevron ${expanded ? "tool-chevron-open" : ""}`}
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

function cardClassName(part: ToolCallPart): string {
  const isPending = part.result === undefined && !part.isError;
  if (part.isError) return "tool-card tool-card-error";
  if (isPending) return "tool-card tool-card-running";
  return "tool-card tool-card-done";
}

function tryExtractImage(result: string | undefined): string | null {
  if (!result) return null;
  try {
    const parsed = JSON.parse(result) as Record<string, unknown>;
    if (typeof parsed["imageBase64"] === "string") {
      const mime = typeof parsed["mimeType"] === "string" ? parsed["mimeType"] : "image/png";
      return `data:${mime};base64,${parsed["imageBase64"]}`;
    }
  } catch {
    // not JSON, ignore
  }
  return null;
}

function ToolResultContent({ part }: { part: ToolCallPart }) {
  if (part.result === undefined && !part.imageBase64) return null;

  const imageDataUrl = part.imageBase64
    ? `data:${part.imageMimeType ?? "image/png"};base64,${part.imageBase64}`
    : tryExtractImage(part.result);

  return (
    <>
      {imageDataUrl && (
        <div className="tool-card-section">
          <span className="tool-card-section-label">Preview</span>
          <img className="tool-card-image" src={imageDataUrl} alt="Range preview" />
        </div>
      )}
      {part.result !== undefined && (
        <div className="tool-card-section">
          <span className="tool-card-section-label">
            {part.isError ? "Error" : "Output"}
          </span>
          <pre className="tool-card-code">{part.result}</pre>
        </div>
      )}
    </>
  );
}

export function ToolCallCard({ part }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[part.toolName] ?? part.toolName;

  return (
    <div className={cardClassName(part)}>
      <button
        className="tool-card-header"
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span className="tool-card-left">
          <WrenchIcon />
          <span className="tool-card-name">{label}</span>
          <StatusIndicator part={part} />
        </span>
        <ChevronIcon expanded={expanded} />
      </button>

      {expanded && (
        <div className="tool-card-body">
          <div className="tool-card-section">
            <span className="tool-card-section-label">Input</span>
            <pre className="tool-card-code">{part.argsText}</pre>
          </div>
          <ToolResultContent part={part} />
        </div>
      )}
    </div>
  );
}
