import type { WorkbookAdapter } from "../lib/adapters/types";
import type {
  ClearCellRangeInput,
  GetCellRangesInput,
  GetCellRangesOutput,
  GetRangeImageInput,
  GetRangeImageOutput,
  SetCellRangeInput,
  SheetMetadata,
  WorkbookCell,
  WorkbookPreview,
} from "../lib/types/workbook";

// 1x1 transparent PNG as base64
const PLACEHOLDER_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRUEFTkSuQmCC";

type SheetData = {
  name: string;
  cells: Record<string, WorkbookCell>;
};

function defaultSheets(): Map<string, SheetData> {
  const sheets = new Map<string, SheetData>();

  const salesCells: Record<string, WorkbookCell> = {
    A1: { value: "Product" },
    B1: { value: "Q1 Sales" },
    C1: { value: "Q2 Sales" },
    D1: { value: "Q3 Sales" },
    E1: { value: "Q4 Sales" },
    F1: { value: "Total" },
    A2: { value: "Widget A" },
    B2: { value: 12500 },
    C2: { value: 14200 },
    D2: { value: 11800 },
    E2: { value: 16300 },
    F2: { formula: "=SUM(B2:E2)", value: 54800 },
    A3: { value: "Widget B" },
    B3: { value: 8900 },
    C3: { value: 9200 },
    D3: { value: 10100 },
    E3: { value: 11500 },
    F3: { formula: "=SUM(B3:E3)", value: 39700 },
    A4: { value: "Widget C" },
    B4: { value: 5600 },
    C4: { value: 6100 },
    D4: { value: 7200 },
    E4: { value: 8400 },
    F4: { formula: "=SUM(B4:E4)", value: 27300 },
  };
  sheets.set("Sales", { name: "Sales", cells: salesCells });

  const inventoryCells: Record<string, WorkbookCell> = {
    A1: { value: "Item" },
    B1: { value: "SKU" },
    C1: { value: "Quantity" },
    D1: { value: "Location" },
    A2: { value: "Widget A" },
    B2: { value: "WA-001" },
    C2: { value: 342 },
    D2: { value: "Warehouse 1" },
    A3: { value: "Widget B" },
    B3: { value: "WB-002" },
    C3: { value: 128 },
    D3: { value: "Warehouse 2" },
    A4: { value: "Widget C" },
    B4: { value: "WC-003" },
    C4: { value: 56 },
    D4: { value: "Warehouse 1" },
  };
  sheets.set("Inventory", { name: "Inventory", cells: inventoryCells });

  sheets.set("Summary", { name: "Summary", cells: {} });

  return sheets;
}

function columnLetter(col: number): string {
  let result = "";
  let c = col;
  while (c > 0) {
    c -= 1;
    result = String.fromCharCode(65 + (c % 26)) + result;
    c = Math.floor(c / 26);
  }
  return result;
}

function parseA1(address: string): { row: number; col: number } | null {
  const match = /^([A-Z]+)(\d+)$/i.exec(address.trim());
  if (!match?.[1] || !match[2]) return null;
  const letters = match[1].toUpperCase();
  const row = Number.parseInt(match[2], 10);
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return { row, col };
}

function getDimensions(cells: Record<string, WorkbookCell>): { rows: number; columns: number } {
  let maxRow = 0;
  let maxCol = 0;
  for (const address of Object.keys(cells)) {
    const parsed = parseA1(address);
    if (parsed) {
      maxRow = Math.max(maxRow, parsed.row);
      maxCol = Math.max(maxCol, parsed.col);
    }
  }
  return { rows: maxRow, columns: maxCol };
}

export class MockWorkbookAdapter implements WorkbookAdapter {
  readonly kind = "office" as const;
  readonly label = "Mock Workbook";

  private sheets: Map<string, SheetData>;

  constructor() {
    this.sheets = defaultSheets();
  }

  async getSheetsMetadata(): Promise<SheetMetadata[]> {
    const result: SheetMetadata[] = [];
    for (const sheet of this.sheets.values()) {
      const dim = getDimensions(sheet.cells);
      result.push({
        id: sheet.name,
        name: sheet.name,
        rows: dim.rows,
        columns: dim.columns,
      });
    }
    return result;
  }

  async getCellRanges(input: GetCellRangesInput): Promise<GetCellRangesOutput> {
    const sheet = this.sheets.get(input.sheetName);
    if (!sheet) {
      throw new Error(`Sheet "${input.sheetName}" not found`);
    }

    const cells: Record<string, WorkbookCell> = {};
    for (const rangeAddress of input.ranges) {
      const parts = rangeAddress.split(":");
      if (parts.length === 1) {
        const addr = (parts[0] ?? "").toUpperCase();
        if (sheet.cells[addr]) {
          cells[addr] = sheet.cells[addr];
        }
      } else {
        const start = parseA1(parts[0] ?? "");
        const end = parseA1(parts[1] ?? "");
        if (start && end) {
          for (let r = start.row; r <= end.row; r++) {
            for (let c = start.col; c <= end.col; c++) {
              const addr = `${columnLetter(c)}${r}`;
              cells[addr] = sheet.cells[addr] ?? {};
            }
          }
        }
      }
    }

    const dim = getDimensions(sheet.cells);
    return {
      success: true,
      worksheet: {
        name: input.sheetName,
        dimension: dim,
        cells,
      },
    };
  }

  async getRangeImage(_input: GetRangeImageInput): Promise<GetRangeImageOutput> {
    return {
      success: true,
      worksheet: { name: _input.sheetName },
      range: _input.range,
      mimeType: "image/png",
      imageBase64: PLACEHOLDER_PNG,
    };
  }

  async setCellRange(input: SetCellRangeInput): Promise<{ success: true }> {
    let sheet = this.sheets.get(input.sheetName);
    if (!sheet) {
      sheet = { name: input.sheetName, cells: {} };
      this.sheets.set(input.sheetName, sheet);
    }

    for (const [address, cell] of Object.entries(input.cells)) {
      sheet.cells[address.toUpperCase()] = { ...cell };
    }
    return { success: true };
  }

  async clearCellRange(input: ClearCellRangeInput): Promise<{ success: true }> {
    const sheet = this.sheets.get(input.sheetName);
    if (!sheet) return { success: true };

    const parts = input.range.split(":");
    if (parts.length === 1) {
      const addr = (parts[0] ?? "").toUpperCase();
      delete sheet.cells[addr];
    } else {
      const start = parseA1(parts[0] ?? "");
      const end = parseA1(parts[1] ?? "");
      if (start && end) {
        for (let r = start.row; r <= end.row; r++) {
          for (let c = start.col; c <= end.col; c++) {
            const addr = `${columnLetter(c)}${r}`;
            delete sheet.cells[addr];
          }
        }
      }
    }
    return { success: true };
  }

  async executeOfficeJs(_code: string): Promise<unknown> {
    return { success: true, note: "Mock: Office.js execution simulated" };
  }

  async getPreview(sheetName?: string): Promise<WorkbookPreview> {
    const targetName = sheetName ?? this.sheets.keys().next().value ?? "Sheet1";
    const sheet = this.sheets.get(targetName);
    const sheetNames = [...this.sheets.keys()];

    if (!sheet) {
      return { rows: [], sheetName: targetName, sheets: sheetNames };
    }

    const dim = getDimensions(sheet.cells);
    const maxRow = Math.min(dim.rows, 12);
    const maxCol = Math.min(dim.columns, 6);

    const rows: WorkbookPreview["rows"] = [];
    for (let r = 1; r <= maxRow; r++) {
      const cellsArr: Array<{ id: string; value: string }> = [];
      for (let c = 1; c <= maxCol; c++) {
        const addr = `${columnLetter(c)}${r}`;
        const cell = sheet.cells[addr];
        cellsArr.push({
          id: addr,
          value: cell?.value != null ? String(cell.value) : "",
        });
      }
      rows.push({ id: `row-${r}`, cells: cellsArr });
    }

    return { rows, sheetName: targetName, sheets: sheetNames };
  }
}
