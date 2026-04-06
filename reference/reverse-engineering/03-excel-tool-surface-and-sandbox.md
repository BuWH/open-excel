# 03. Excel Tool Surface and Sandbox

## Core observation

The original client does not only render assistant output. It exposes a local execution environment with both structured workbook tools and a privileged raw Office.js path.

That combination is the center of the product.

## Structured Excel tools

Observed Excel-centric tools include:

- `get_cell_ranges`
- `get_range_as_csv`
- `search_data`
- `read_range_image`
- `set_cell_range`
- `modify_sheet_structure`
- `copy_to`
- `resize_range`
- `clear_cell_range`
- `get_all_objects`
- `modify_object`
- `extract_chart_xml`

These are not low-level method forwards. They encode product semantics, safety rules, and user-facing behavior.

## Tool behavior patterns

### Read operations

- `get_cell_ranges` is the high-fidelity read path
- `get_range_as_csv` is optimized for analysis/code execution workflows
- `search_data` is a workbook-aware lookup tool
- `read_range_image` is explicitly for visual inspection, not raw data extraction

### Write operations

- `set_cell_range` includes overwrite protection and formula result feedback
- `modify_sheet_structure` is preferred for large structural edits
- `copy_to`, `resize_range`, and `clear_cell_range` cover common spreadsheet editing primitives

## `execute_office_js`

This is the privileged escape hatch. It allows arbitrary Office.js code execution from the model side when structured tools are not enough.

The original runtime also augments this environment with product-specific globals, including file-sharing hooks for conductor.

## Security and policy controls

The sample wraps `execute_office_js` and related host access with several layers:

- SES lockdown / compartmentalization
- blocked APIs and property access
- formula validation for risky functions
- OOXML content inspection
- restrictions against VBA, ActiveX, XLM macros, OLE embeddings, and external references

This is strong evidence that the original product assumes the agent runtime is powerful enough to need hard local guardrails.

## Chart extraction

`extract_chart_xml` is especially important because it reveals a concrete cross-surface feature:

1. extract Excel chart OOXML
2. normalize it for PowerPoint consumption
3. broadcast it through conductor files
4. hand off to another Office surface

Even though the lazy-loaded chart extraction chunk is not present in this local snapshot, the public contract is explicit enough to infer the intended data flow.

## Reconstruction mapping

The reconstruction keeps the same tool model, but narrows scope to an Excel-first implementation:

- implemented in `rebuild/`:
  - `get_sheets_metadata`
  - `get_cell_ranges`
  - `set_cell_range`
  - `clear_cell_range`
  - `execute_office_js`
- available in two runtime modes:
  - browser mock workbook
  - Excel Office.js host

This is enough to preserve the product’s main interaction pattern:

model → tool calls → workbook mutation → user-visible state update

## Engineering implication

If this project eventually aims for higher fidelity, the correct next investment is not a prettier UI. It is broadening and hardening the tool surface until the reconstructed agent can perform the same classes of workbook operations as the original.

