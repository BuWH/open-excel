export type PrimitiveCellValue = string | number | boolean | null;

export type WorkbookCell = {
  value?: PrimitiveCellValue;
  formula?: string;
  note?: string;
  style?: {
    styleName?: string;
    fillColor?: string;
    fontColor?: string;
    fontBold?: boolean;
    fontItalic?: boolean;
    fontName?: string;
    fontSize?: number;
    horizontalAlignment?: string;
    verticalAlignment?: string;
    numberFormat?: string;
    wrapText?: boolean;
  };
};

export type SheetMetadata = {
  id: string;
  name: string;
  rows: number;
  columns: number;
};

export type GetCellRangesInput = {
  sheetName: string;
  ranges: string[];
  includeStyles?: boolean;
};

export type GetCellRangesOutput = {
  success: true;
  worksheet: {
    name: string;
    dimension: {
      rows: number;
      columns: number;
    };
    cells: Record<string, WorkbookCell>;
  };
};

export type SetCellRangeInput = {
  sheetName: string;
  cells: Record<string, WorkbookCell>;
};

export type ClearCellRangeInput = {
  sheetName: string;
  range: string;
};

export type GetRangeImageInput = {
  sheetName: string;
  range: string;
};

export type GetRangeImageOutput = {
  success: true;
  worksheet: {
    name: string;
  };
  range: string;
  mimeType: "image/png";
  imageBase64: string;
};

export type WorkbookPreview = {
  sheetName: string;
  sheets: string[];
  rows: Array<{
    id: string;
    cells: Array<{
      id: string;
      value: string;
    }>;
  }>;
};
