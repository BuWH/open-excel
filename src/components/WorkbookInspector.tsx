import type { WorkbookPreview } from "../lib/types/workbook";

type WorkbookInspectorProps = {
  adapterLabel: string;
  onRefresh(): Promise<void>;
  onSelectSheet(sheetName: string): void;
  preview: WorkbookPreview | null;
};

export function WorkbookInspector(props: WorkbookInspectorProps) {
  const { adapterLabel, onRefresh, onSelectSheet, preview } = props;

  return (
    <section className="panel workbook-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Workbook Surface</p>
          <h2>{adapterLabel}</h2>
        </div>
        <button className="ghost-button" onClick={() => void onRefresh()} type="button">
          Refresh
        </button>
      </div>

      {preview ? (
        <>
          <div className="sheet-meta">
            <span>
              Active sheet <strong>{preview.sheetName}</strong>
            </span>
            <span>{preview.sheets.length} sheets loaded</span>
          </div>
          <div className="sheet-tabs" data-testid="sheet-tabs">
            {preview.sheets.map((sheetName) => (
              <button
                className={sheetName === preview.sheetName ? "sheet-tab is-active" : "sheet-tab"}
                data-testid={`sheet-tab-${sheetName}`}
                key={sheetName}
                onClick={() => onSelectSheet(sheetName)}
                type="button"
              >
                {sheetName}
              </button>
            ))}
          </div>
          <div className="grid-wrapper">
            <table className="preview-grid" data-testid="preview-grid">
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.id}>
                    {row.cells.map((cell) => (
                      <td key={cell.id}>{cell.value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>No workbook preview loaded yet.</p>
        </div>
      )}
    </section>
  );
}
