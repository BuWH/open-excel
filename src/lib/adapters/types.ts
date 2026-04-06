import type {
  ClearCellRangeInput,
  GetCellRangesInput,
  GetCellRangesOutput,
  GetRangeImageInput,
  GetRangeImageOutput,
  SetCellRangeInput,
  SheetMetadata,
  WorkbookPreview,
} from "../types/workbook";

export type WorkbookAdapter = {
  kind: "office";
  label: string;
  getSheetsMetadata(): Promise<SheetMetadata[]>;
  getCellRanges(input: GetCellRangesInput): Promise<GetCellRangesOutput>;
  getRangeImage(input: GetRangeImageInput): Promise<GetRangeImageOutput>;
  setCellRange(input: SetCellRangeInput): Promise<{ success: true }>;
  clearCellRange(input: ClearCellRangeInput): Promise<{ success: true }>;
  executeOfficeJs(code: string): Promise<unknown>;
  getPreview(sheetName?: string): Promise<WorkbookPreview>;
};
