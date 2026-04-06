import { getCellAddress, parseRangeAddress } from "../excel/a1";
import type {
  ClearCellRangeInput,
  GetCellRangesInput,
  GetRangeImageInput,
  SetCellRangeInput,
  WorkbookCell,
  WorkbookPreview,
} from "../types/workbook";
import type { WorkbookAdapter } from "./types";

function serialiseValue(value: unknown): WorkbookCell {
  if (value === undefined) {
    return {};
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return { value };
  }

  return { value: JSON.stringify(value) };
}

export class OfficeWorkbookAdapter implements WorkbookAdapter {
  readonly kind = "office";
  readonly label = "Excel Office.js host";

  async getSheetsMetadata() {
    await this.ensureReady();

    return Excel.run(async (context: Excel.RequestContext) => {
      const worksheets = context.workbook.worksheets;
      worksheets.load("items/name");
      await context.sync();

      const results: Array<{ id: string; name: string; rows: number; columns: number }> = [];

      for (const sheet of worksheets.items) {
        const usedRange = sheet.getUsedRangeOrNullObject();
        usedRange.load(["rowCount", "columnCount", "isNullObject"]);
        await context.sync();

        results.push({
          id: sheet.name,
          name: sheet.name,
          rows: usedRange.isNullObject ? 0 : usedRange.rowCount,
          columns: usedRange.isNullObject ? 0 : usedRange.columnCount,
        });
      }

      return results;
    });
  }

  async getCellRanges(input: GetCellRangesInput) {
    await this.ensureReady();

    return Excel.run(async (context: Excel.RequestContext) => {
      const worksheet = context.workbook.worksheets.getItem(input.sheetName);
      const usedRange = worksheet.getUsedRangeOrNullObject();
      usedRange.load(["rowCount", "columnCount", "isNullObject"]);
      await context.sync();

      const cells: Record<string, WorkbookCell> = {};
      const styledCells: Array<{ address: string; range: Excel.Range }> = [];

      for (const rangeAddress of input.ranges) {
        const range = worksheet.getRange(rangeAddress);
        range.load(["values", "formulas", "rowCount", "columnCount", "rowIndex", "columnIndex"]);
        await context.sync();

        for (let row = 0; row < range.rowCount; row += 1) {
          for (let column = 0; column < range.columnCount; column += 1) {
            const address = getCellAddress(
              range.rowIndex + row + 1,
              range.columnIndex + column + 1,
            );
            const formula = range.formulas[row]?.[column];
            const value = range.values[row]?.[column];

            cells[address] =
              typeof formula === "string" && formula.startsWith("=")
                ? { formula, value: value === formula ? undefined : serialiseValue(value).value }
                : serialiseValue(value);

            if (input.includeStyles) {
              const cellRange = range.getCell(row, column);
              cellRange.load([
                "style",
                "numberFormat",
                "format/fill/color",
                "format/font/bold",
                "format/font/color",
                "format/font/italic",
                "format/font/name",
                "format/font/size",
                "format/horizontalAlignment",
                "format/verticalAlignment",
                "format/wrapText",
              ]);
              styledCells.push({ address, range: cellRange });
            }
          }
        }
      }

      if (input.includeStyles && styledCells.length > 0) {
        await context.sync();

        for (const { address, range } of styledCells) {
          cells[address] = {
            ...cells[address],
            style: {
              styleName: range.style || undefined,
              fillColor: range.format.fill.color || undefined,
              fontBold: range.format.font.bold || undefined,
              fontColor: range.format.font.color || undefined,
              fontItalic: range.format.font.italic || undefined,
              fontName: range.format.font.name || undefined,
              fontSize: range.format.font.size || undefined,
              horizontalAlignment: range.format.horizontalAlignment || undefined,
              numberFormat: range.numberFormat?.[0]?.[0] || undefined,
              verticalAlignment: range.format.verticalAlignment || undefined,
              wrapText: range.format.wrapText || undefined,
            },
          };
        }
      }

      return {
        success: true as const,
        worksheet: {
          name: input.sheetName,
          dimension: {
            rows: usedRange.isNullObject ? 0 : usedRange.rowCount,
            columns: usedRange.isNullObject ? 0 : usedRange.columnCount,
          },
          cells,
        },
      };
    });
  }

  async getRangeImage(input: GetRangeImageInput) {
    await this.ensureReady();

    return Excel.run(async (context: Excel.RequestContext) => {
      const worksheet = context.workbook.worksheets.getItem(input.sheetName);
      const image = worksheet.getRange(input.range).getImage();
      await context.sync();

      return {
        success: true as const,
        worksheet: {
          name: input.sheetName,
        },
        range: input.range,
        mimeType: "image/png" as const,
        imageBase64: image.value,
      };
    });
  }

  async setCellRange(input: SetCellRangeInput) {
    await this.ensureReady();

    return Excel.run(async (context: Excel.RequestContext) => {
      const worksheet = context.workbook.worksheets.getItem(input.sheetName);

      for (const [address, cell] of Object.entries(input.cells)) {
        const range = worksheet.getRange(address.toUpperCase());
        if (cell.formula) {
          range.formulas = [[cell.formula]];
        } else {
          range.values = [[cell.value ?? ""]];
        }
      }

      await context.sync();
      return { success: true as const };
    });
  }

  async clearCellRange(input: ClearCellRangeInput) {
    await this.ensureReady();

    return Excel.run(async (context: Excel.RequestContext) => {
      const worksheet = context.workbook.worksheets.getItem(input.sheetName);
      worksheet.getRange(input.range).clear(Excel.ClearApplyTo.contents);
      await context.sync();

      return { success: true as const };
    });
  }

  async executeOfficeJs(code: string) {
    await this.ensureReady();

    return Excel.run(async (context: Excel.RequestContext) => {
      const runtime = new Function(
        "Excel",
        "context",
        `"use strict"; return (async () => {${code}\n})();`,
      ) as (excelApi: typeof Excel, requestContext: Excel.RequestContext) => Promise<unknown>;
      const result = await runtime(Excel, context);
      await context.sync();

      return JSON.parse(JSON.stringify(result ?? { success: true }));
    });
  }

  async getPreview(sheetName?: string): Promise<WorkbookPreview> {
    await this.ensureReady();

    return Excel.run(async (context: Excel.RequestContext) => {
      const worksheets = context.workbook.worksheets;
      worksheets.load("items/name");
      await context.sync();

      const activeSheet = sheetName ?? worksheets.items[0]?.name;
      if (!activeSheet) {
        return {
          rows: [],
          sheetName: "Empty workbook",
          sheets: [],
        };
      }

      const worksheet = worksheets.getItem(activeSheet);
      const usedRange = worksheet.getUsedRangeOrNullObject();
      usedRange.load(["address", "isNullObject"]);
      await context.sync();

      if (usedRange.isNullObject) {
        return {
          rows: [],
          sheetName: activeSheet,
          sheets: worksheets.items.map((item: Excel.Worksheet) => item.name),
        };
      }

      const parsed = parseRangeAddress(usedRange.address.split("!").at(-1) ?? "A1:A1");
      const previewAddress = `A1:${getCellAddress(
        Math.min(parsed.endRow, 12),
        Math.min(parsed.endColumn, 6),
      )}`;
      const previewRange = worksheet.getRange(previewAddress);
      previewRange.load("values");
      await context.sync();

      return {
        rows: previewRange.values.map((row: unknown[], rowIndex: number) => ({
          id: `row-${rowIndex + 1}`,
          cells: row.map((value: unknown, columnIndex: number) => ({
            id: getCellAddress(rowIndex + 1, columnIndex + 1),
            value: String(value ?? ""),
          })),
        })),
        sheetName: activeSheet,
        sheets: worksheets.items.map((item: Excel.Worksheet) => item.name),
      };
    });
  }

  private async ensureReady() {
    if (typeof Office === "undefined") {
      throw new Error("Office.js is not available in the current runtime.");
    }

    await Office.onReady();
  }
}
