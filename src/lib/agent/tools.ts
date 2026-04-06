import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import type { Static, TSchema } from "@mariozechner/pi-ai";
import { Type } from "@mariozechner/pi-ai";
import type { WorkbookAdapter } from "../adapters/types";
import { logToolError } from "../debug/errorLog";

function textResult<T>(data: T): AgentToolResult<T> {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    details: data,
  };
}

const GetSheetsMetadataParams = Type.Object({});

const GetCellRangesParams = Type.Object({
  sheetName: Type.String({ minLength: 1 }),
  ranges: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
  includeStyles: Type.Optional(Type.Boolean()),
});

const SetCellRangeParams = Type.Object({
  sheetName: Type.String({ minLength: 1 }),
  cells: Type.Record(
    Type.String(),
    Type.Object({
      value: Type.Optional(Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])),
      formula: Type.Optional(Type.String()),
      note: Type.Optional(Type.String()),
    }),
  ),
});

const ClearCellRangeParams = Type.Object({
  sheetName: Type.String({ minLength: 1 }),
  range: Type.String({ minLength: 1 }),
});

const GetRangeImageParams = Type.Object({
  sheetName: Type.String({ minLength: 1 }),
  range: Type.String({ minLength: 1 }),
});

const ExecuteOfficeJsParams = Type.Object({
  code: Type.String({ minLength: 1 }),
});

function createTool<TParams extends TSchema>(config: {
  name: string;
  label: string;
  description: string;
  parameters: TParams;
  execute: (params: Static<TParams>) => Promise<unknown>;
}): AgentTool {
  return {
    name: config.name,
    label: config.label,
    description: config.description,
    parameters: config.parameters,
    execute: async (_toolCallId, params) => {
      try {
        return textResult(await config.execute(params as Static<TParams>));
      } catch (error) {
        logToolError(config.name, params as Record<string, unknown>, error);
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        const errorDetail = stack ? `${message}\n\nStack:\n${stack}` : message;
        return {
          content: [{ type: "text", text: `Error: ${errorDetail}` }],
          details: null,
          isError: true,
        };
      }
    },
  };
}

export function createWorkbookTools(adapter: WorkbookAdapter): AgentTool[] {
  return [
    createTool({
      name: "get_sheets_metadata",
      label: "Get sheets metadata",
      description:
        "Return worksheet names and dimensions. Use this before reading or writing when you do not know the workbook structure.",
      parameters: GetSheetsMetadataParams,
      execute: () => adapter.getSheetsMetadata(),
    }),
    createTool({
      name: "get_cell_ranges",
      label: "Get cell ranges",
      description:
        "Read one or more A1 ranges from a worksheet and return cell values keyed by A1 address.",
      parameters: GetCellRangesParams,
      execute: (params) => adapter.getCellRanges(params),
    }),
    createTool({
      name: "set_cell_range",
      label: "Set cell range",
      description:
        "Write one or more cell values or formulas into a worksheet. Input keys must be A1 addresses.",
      parameters: SetCellRangeParams,
      execute: (params) => adapter.setCellRange(params),
    }),
    createTool({
      name: "clear_cell_range",
      label: "Clear cell range",
      description: "Clear values and formulas inside an A1 range.",
      parameters: ClearCellRangeParams,
      execute: (params) => adapter.clearCellRange(params),
    }),
    {
      name: "get_range_image",
      label: "Get range image",
      description:
        "Render a worksheet range as a Base64 PNG image, including any charts or shapes that overlap the range. Use this for visual debugging or style comparison after writing a report.",
      parameters: GetRangeImageParams,
      execute: async (_toolCallId, params) => {
        try {
          const result = await adapter.getRangeImage(params as { sheetName: string; range: string });
          return {
            content: [
              { type: "text" as const, text: `Image captured for ${result.range} on sheet "${result.worksheet.name}".` },
              { type: "image" as const, data: result.imageBase64, mimeType: result.mimeType },
            ],
            details: result,
          };
        } catch (error) {
          logToolError("get_range_image", params as Record<string, unknown>, error);
          const message = error instanceof Error ? error.message : String(error);
          return {
            content: [{ type: "text" as const, text: `Error: ${message}` }],
            details: null,
            isError: true,
          };
        }
      },
    },
    createTool({
      name: "execute_office_js",
      label: "Execute Office JS",
      description:
        "Execute raw Office.js code in Excel. Prefer structured tools first, but use this for formatting, layout, tables, and other host-only actions.",
      parameters: ExecuteOfficeJsParams,
      execute: (params) => adapter.executeOfficeJs(params.code),
    }),
  ];
}
