# Reverse Evidence Catalog

This directory contains the preserved local sample and the extracted evidence used by the English documentation in `docs/reverse-engineering/`.

## Snapshot under analysis

- original entry: `index.html`
- main bundle: `m-addin/assets/index-CaYG1oEg.js`
- preload bundle: `m-addin/assets/index-D8FTRdxx.js`
- observed service name: `office-agent`
- observed release SHA: `8a3d43cefdceab518a6d097570376a752fe96819`

## Structure

- `pretty/`
  - pretty-printed bundles for manual reading.
- `extracts/`
  - focused source slices for key subsystems.
- `analysis/generated/`
  - machine-extracted route lists, URL indexes, manifest parameter lists, and event inventories.
- `scripts/`
  - helper scripts used to produce the generated indexes.

## Primary extract files

- `extracts/01-config-and-endpoints.js`
- `extracts/02-auth-bootstrap-and-login.js`
- `extracts/03-mcp-client-and-hooks.js`
- `extracts/04-conductor-and-bridge.js`
- `extracts/05-execute-office-js-and-conductor-globals.js`
- `extracts/06-sheet-tools-and-chart-xml.js`
- `extracts/07-router-and-entry.js`

## Relationship to the documentation

Implementation-facing analysis now lives under:

- `docs/reverse-engineering/`

The older Chinese notes under `reverse/analysis/` are retained only as intermediate working material. The English documentation is the canonical reverse-engineering write-up for this repository.

