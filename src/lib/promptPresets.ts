export type PromptPreset = {
  id: string;
  label: string;
  prompt: string;
};

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: "analysis-audit",
    label: "Analysis audit",
    prompt:
      "Using the live Excel workbook only, update the existing Analysis sheet into a richer audit view. First inspect all sheets and the used ranges you need. Then overwrite Analysis!A1:D8 with a report that has headers Section, Metric, Value, Notes. Include rows for workbook sheet names, active sheet name, total sheet count, Sheet1!A1 value, whether the Analysis sheet already existed before this run, and a short data quality note. Also write a concise executive summary sentence into Analysis!F1 that mentions the workbook state in plain English. After writing, select Analysis!A1 and verify the final values by reading them back before you answer.",
  },
  {
    id: "analysis-restyle",
    label: "Restyle report",
    prompt:
      "Using the live Excel workbook only, keep the existing values in Analysis!A1:F8 but restyle the report so it looks presentation-ready instead of like a raw grid. Inspect the current sheet first, preserve all current text and structure, then apply polished formatting: bold header row, filled header background, clear borders, wrapped long text in the Notes column and executive summary cell, sensible horizontal alignment, and autofit or widen columns so the report is readable. Keep Analysis!F1 as an executive summary block, and finish with Analysis!A1 selected. Verify the final cell values after formatting.",
  },
  {
    id: "sheet1-summary",
    label: "Sheet1 summary",
    prompt:
      "Using the live Excel workbook only, read Sheet1 and write a compact summary block into Analysis!H1:J5. Add a title row, metric labels, values, and a one-sentence interpretation. Format the block so it looks like a small finished dashboard card, not plain cells. Select Analysis!H1 before finishing and verify the written values.",
  },
];
