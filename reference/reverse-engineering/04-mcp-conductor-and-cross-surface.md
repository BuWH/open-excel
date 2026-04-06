# 04. MCP, Conductor, and Cross-Surface Operation

## MCP is a first-class subsystem

The sample contains a built-in MCP client path with support for:

- remote MCP registry discovery
- proxying through Anthropic infrastructure
- customer-provided MCP server definitions
- automatic initialization and refresh behavior

Observed endpoints include:

- `https://api.anthropic.com/v1/mcp_servers`
- `https://api.anthropic.com/mcp-registry/v0/servers`
- `https://mcp-proxy.anthropic.com/v1/mcp/<id>`

## MCP initialization behavior

The client parses `mcp_servers` from runtime configuration, validates the JSON shape, resolves template variables from merged config, and then decides between discovery and direct modes.

That means the add-in is designed to operate as an integration-capable enterprise agent shell, not a closed SaaS widget.

## Conductor role

Conductor is the peer-to-peer coordination layer between Office surfaces.

Observed characteristics:

- WebSocket endpoint: `wss://bridge.claudeusercontent.com`
- explicit peer registration
- agent online/offline events
- replay support
- transcript sync
- shared file propagation
- user-visible status reminders

## Shared virtual filesystem

Each connected agent gets a virtual namespace similar to:

- `/agents/<agent-id>/transcript.jsonl`
- `/agents/<agent-id>/files/<filename>`
- `/agents/<agent-id>/metadata.json`
- `/agents/<agent-id>/status.json`

The client also exposes a restricted read-only shell over this workspace with an allowlist of text-inspection commands.

## Why conductor matters

Conductor changes the product model entirely. Without it, this is “Claude in Excel”. With it, this becomes “an Office-side agent node that can coordinate with other Office-side agents”.

The strongest evidence is the documented Excel-to-PowerPoint chart transfer flow based on shared OOXML files rather than screenshots or pasted summaries.

## What is not rebuilt yet

The current prototype intentionally does not implement:

- MCP registry access
- remote MCP sessions
- conductor transport
- peer file sharing
- cross-surface messaging

This is not an omission by accident. It is a phased reconstruction choice:

1. rebuild the routed shell and workbook tool loop first
2. keep external integration boundaries explicit
3. add MCP and conductor only after the local host/runtime model is stable

## Recommended next milestone

If the goal is to approach production-class functional parity, the next major subsystem after the Excel tool loop should be conductor, not OAuth polish. Conductor is what turns the product from a local assistant into a multi-surface Office workflow engine.

