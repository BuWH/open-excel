import { z } from "zod";
import type { WorkbookAdapter } from "../adapters/types";
import type { ToolDefinition } from "../types/llm";

const getSheetsMetadataSchema = z.object({});

const getCellRangesSchema = z.object({
  sheetName: z.string().min(1),
  ranges: z.array(z.string().min(1)).min(1),
  includeStyles: z.boolean().optional(),
});

const setCellRangeSchema = z.object({
  sheetName: z.string().min(1),
  cells: z.record(
    z.string().min(1),
    z.object({
      value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
      formula: z.string().optional(),
      note: z.string().optional(),
    }),
  ),
});

const clearCellRangeSchema = z.object({
  sheetName: z.string().min(1),
  range: z.string().min(1),
});

const getRangeImageSchema = z.object({
  sheetName: z.string().min(1),
  range: z.string().min(1),
});

const executeOfficeJsSchema = z.object({
  code: z.string().min(1),
});

type ToolExecutor = (rawArguments: string) => Promise<unknown>;

export function buildToolRegistry(adapter: WorkbookAdapter) {
  const tools: ToolDefinition[] = [
    {
      type: "function",
      function: {
        name: "get_sheets_metadata",
        description:
          "Return worksheet names and dimensions. Use this before reading or writing when you do not know the workbook structure.",
        parameters: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_range_image",
        description:
          "Render a worksheet range as a Base64 PNG image. Use this for visual debugging or style comparison after writing a report.",
        parameters: {
          type: "object",
          properties: {
            sheetName: { type: "string" },
            range: { type: "string" },
          },
          required: ["sheetName", "range"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_cell_ranges",
        description:
          "Read one or more A1 ranges from a worksheet and return cell values keyed by A1 address.",
        parameters: {
          type: "object",
          properties: {
            sheetName: { type: "string" },
            ranges: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
            },
            includeStyles: { type: "boolean" },
          },
          required: ["sheetName", "ranges"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "set_cell_range",
        description:
          "Write one or more cell values or formulas into a worksheet. Input keys must be A1 addresses.",
        parameters: {
          type: "object",
          properties: {
            sheetName: { type: "string" },
            cells: {
              type: "object",
              additionalProperties: {
                type: "object",
                properties: {
                  value: {
                    type: ["string", "number", "boolean", "null"],
                  },
                  formula: { type: "string" },
                  note: { type: "string" },
                },
                additionalProperties: false,
              },
            },
          },
          required: ["sheetName", "cells"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "clear_cell_range",
        description: "Clear values and formulas inside an A1 range.",
        parameters: {
          type: "object",
          properties: {
            sheetName: { type: "string" },
            range: { type: "string" },
          },
          required: ["sheetName", "range"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "execute_office_js",
        description:
          "Execute raw Office.js code in Excel. Prefer structured tools first, but use this for formatting, layout, tables, and other host-only actions.",
        parameters: {
          type: "object",
          properties: {
            code: { type: "string" },
          },
          required: ["code"],
          additionalProperties: false,
        },
      },
    },
  ];

  const executors: Record<string, ToolExecutor> = {
    get_sheets_metadata: async (rawArguments) => {
      getSheetsMetadataSchema.parse(JSON.parse(rawArguments || "{}"));
      return adapter.getSheetsMetadata();
    },
    get_cell_ranges: async (rawArguments) => {
      const parsed = getCellRangesSchema.parse(JSON.parse(rawArguments));
      return adapter.getCellRanges(parsed);
    },
    set_cell_range: async (rawArguments) => {
      const parsed = setCellRangeSchema.parse(JSON.parse(rawArguments));
      return adapter.setCellRange(parsed);
    },
    clear_cell_range: async (rawArguments) => {
      const parsed = clearCellRangeSchema.parse(JSON.parse(rawArguments));
      return adapter.clearCellRange(parsed);
    },
    get_range_image: async (rawArguments) => {
      const parsed = getRangeImageSchema.parse(JSON.parse(rawArguments));
      return adapter.getRangeImage(parsed);
    },
    execute_office_js: async (rawArguments) => {
      const parsed = executeOfficeJsSchema.parse(JSON.parse(rawArguments));
      return adapter.executeOfficeJs(parsed.code);
    },
  };

  return { tools, executors };
}
