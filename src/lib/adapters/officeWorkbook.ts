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

      // Get range pixel bounds and cell image
      const range = worksheet.getRange(input.range);
      range.load(["top", "left", "width", "height"]);
      const cellImage = range.getImage();

      // Load all charts on the sheet
      const charts = worksheet.charts;
      charts.load("items");
      await context.sync();

      const rangeTop = range.top;
      const rangeLeft = range.left;
      const rangeWidth = range.width;
      const rangeHeight = range.height;

      console.log("[getRangeImage] range bounds:", { top: rangeTop, left: rangeLeft, width: rangeWidth, height: rangeHeight });
      console.log("[getRangeImage] charts on sheet:", charts.items.length);

      // Find charts that overlap the range bounds
      type ChartOverlay = {
        top: number;
        left: number;
        width: number;
        height: number;
        imageRequest: OfficeExtension.ClientResult<string>;
      };
      const overlays: ChartOverlay[] = [];

      for (const chart of charts.items) {
        chart.load(["top", "left", "width", "height", "name"]);
      }
      await context.sync();

      for (const chart of charts.items) {
        const cRight = chart.left + chart.width;
        const cBottom = chart.top + chart.height;
        const rRight = rangeLeft + rangeWidth;
        const rBottom = rangeTop + rangeHeight;

        console.log("[getRangeImage] chart:", chart.name, { top: chart.top, left: chart.left, width: chart.width, height: chart.height, cRight, cBottom, rRight, rBottom });

        // Check overlap
        const overlaps = chart.left < rRight && cRight > rangeLeft && chart.top < rBottom && cBottom > rangeTop;
        console.log("[getRangeImage] overlaps:", overlaps);

        if (overlaps) {
          const imageReq = chart.getImage();
          overlays.push({
            top: chart.top,
            left: chart.left,
            width: chart.width,
            height: chart.height,
            imageRequest: imageReq,
          });
        }
      }

      console.log("[getRangeImage] overlapping charts:", overlays.length);

      if (overlays.length > 0) {
        await context.sync();
      }

      // If no overlapping charts, just return the range image
      if (overlays.length === 0) {
        return {
          success: true as const,
          worksheet: { name: input.sheetName },
          range: input.range,
          mimeType: "image/png" as const,
          imageBase64: cellImage.value,
        };
      }

      // Composite: draw range image, then overlay charts
      const composited = await this.compositeImages(
        cellImage.value,
        rangeTop,
        rangeLeft,
        rangeWidth,
        rangeHeight,
        overlays.map((o) => ({
          base64: o.imageRequest.value,
          top: o.top,
          left: o.left,
          width: o.width,
          height: o.height,
        })),
      );

      return {
        success: true as const,
        worksheet: { name: input.sheetName },
        range: input.range,
        mimeType: "image/png" as const,
        imageBase64: composited,
      };
    });
  }

  private async compositeImages(
    baseBase64: string,
    rangeTop: number,
    rangeLeft: number,
    rangeWidth: number,
    rangeHeight: number,
    overlays: Array<{
      base64: string;
      top: number;
      left: number;
      width: number;
      height: number;
    }>,
  ): Promise<string> {
    // Use a scale factor for crisp rendering
    const scale = 2;
    const canvasWidth = Math.ceil(rangeWidth * scale);
    const canvasHeight = Math.ceil(rangeHeight * scale);

    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to create OffscreenCanvas context");

    // Draw the base range image
    const baseImg = await this.loadImage(baseBase64);
    ctx.drawImage(baseImg, 0, 0, canvasWidth, canvasHeight);

    // Draw each chart overlay at its position relative to the range
    for (const overlay of overlays) {
      const x = (overlay.left - rangeLeft) * scale;
      const y = (overlay.top - rangeTop) * scale;
      const w = overlay.width * scale;
      const h = overlay.height * scale;

      const chartImg = await this.loadImage(overlay.base64);
      ctx.drawImage(chartImg, x, y, w, h);
    }

    // Export as PNG base64
    const blob = await canvas.convertToBlob({ type: "image/png" });
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  private loadImage(base64: string): Promise<ImageBitmap> {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "image/png" });
    return createImageBitmap(blob);
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
