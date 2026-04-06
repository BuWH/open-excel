type ParsedCell = {
  row: number;
  column: number;
};

type ParsedRange = {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
};

const CELL_PATTERN = /^([A-Z]+)(\d+)$/;

export function columnLabelToNumber(label: string) {
  let value = 0;

  for (const char of label.toUpperCase()) {
    value = value * 26 + (char.charCodeAt(0) - 64);
  }

  return value;
}

export function columnNumberToLabel(column: number) {
  let value = column;
  let label = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }

  return label;
}

export function parseCellAddress(address: string): ParsedCell {
  const match = address.toUpperCase().match(CELL_PATTERN);

  if (!match?.[1] || !match[2]) {
    throw new Error(`Unsupported A1 cell address: ${address}`);
  }

  return {
    column: columnLabelToNumber(match[1]),
    row: Number.parseInt(match[2], 10),
  };
}

export function parseRangeAddress(address: string): ParsedRange {
  const [start, end] = address.toUpperCase().split(":");
  if (!start) {
    throw new Error(`Unsupported A1 range: ${address}`);
  }
  const startCell = parseCellAddress(start);
  const endCell = parseCellAddress(end ?? start);

  return {
    startColumn: Math.min(startCell.column, endCell.column),
    endColumn: Math.max(startCell.column, endCell.column),
    startRow: Math.min(startCell.row, endCell.row),
    endRow: Math.max(startCell.row, endCell.row),
  };
}

export function expandRange(address: string) {
  const parsed = parseRangeAddress(address);
  const cells: string[] = [];

  for (let row = parsed.startRow; row <= parsed.endRow; row += 1) {
    for (let column = parsed.startColumn; column <= parsed.endColumn; column += 1) {
      cells.push(`${columnNumberToLabel(column)}${row}`);
    }
  }

  return cells;
}

export function getCellAddress(row: number, column: number) {
  return `${columnNumberToLabel(column)}${row}`;
}
