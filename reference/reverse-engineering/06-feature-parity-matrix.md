# 06. Feature Parity Matrix

## Snapshot vs reconstruction

| Area | Original snapshot | Current rebuild | Notes |
| --- | --- | --- | --- |
| Taskpane shell | Present | Present | Rebuilt as React/Vite routed shell |
| HTML host wrapper | Present | Partial | Office.js loaded in entry HTML, but original keyboard toggle shim not replicated |
| Excel surface | Present | Present | Core workbook tool loop implemented |
| PowerPoint surface | Present | Not implemented | Deferred |
| Word surface | Present | Not implemented | Deferred |
| Route gating | Present | Present | Login → Terms → Onboarding → App |
| Claude OAuth | Present | Not implemented | Replaced with local LiteLLM config |
| Gateway / Vertex / Bedrock | Present | Not implemented | Provider abstraction retained |
| Bootstrap / claims merge | Present | Not implemented | Provider config is local-only in rebuild |
| MCP registry | Present | Not implemented | Deferred |
| Conductor peer bus | Present | Not implemented | Deferred |
| Shared file bus | Present | Not implemented | Deferred |
| `get_cell_ranges` | Present | Present | Implemented for mock + Office host |
| `set_cell_range` | Present | Present | Implemented for mock + Office host |
| `clear_cell_range` | Present | Present | Implemented for mock + Office host |
| `execute_office_js` | Present | Present | Office host only |
| `get_range_as_csv` | Present | Not implemented | Easy next addition |
| `modify_sheet_structure` | Present | Not implemented | Planned follow-up |
| `extract_chart_xml` | Present | Not implemented | Requires OOXML/chart pipeline |
| Telemetry | Present | Not implemented | Deferred by design |
| Local mock runtime | Not observed | Present | Added to accelerate development outside Office |

## Evidence confidence

| Topic | Confidence | Basis |
| --- | --- | --- |
| Unified Office runtime | High | route surface names, tool descriptions, host capability code |
| Provider abstraction | High | explicit provider kinds and third-party routes |
| MCP as first-class subsystem | High | endpoints, config parsing, init flow |
| Conductor as peer coordination bus | High | websocket endpoint, file sharing, bash surface, agent events |
| Excel tool contracts | High | extracted tool schema and executor logic |
| Chart OOXML handoff | High | explicit tool contract and conductor instructions |
| Full lazy chunk behavior | Medium | some lazy-loaded code is missing from local snapshot |
| Exact production parity of current site | Low | local sample is older than the live build |

## Bottom line

The reconstruction is intentionally not feature-complete, but it already reproduces the key shape of the product:

- gated taskpane UI
- provider-backed agent loop
- workbook tool execution
- Office host attachment point

That is the correct base to continue toward a more faithful clone.

