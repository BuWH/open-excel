// Reverse excerpt: MCP bootstrap, proxy/gateway client, runtime hook
// Sources: reverse/pretty/index-CaYG1oEg.pretty.js lines 66090-66820 and 278120-278340

async function Z6e() {
  const t = performance.now(),
    e = ml();
  if (!e)
    return {
      servers: [],
      fetchStatus: "no_auth",
      durationMs: performance.now() - t,
    };
  const n = "https://api.anthropic.com",
    r = {
      Authorization: `Bearer ${e}`,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "mcp-servers-2025-12-04",
    },
    i = [];
  let s = null,
    o = 0,
    a;
  const l = 10;
  try {
    do {
      o++;
      const c = new URL(`${n}/v1/mcp_servers`);
      (c.searchParams.set("limit", "100"), s && c.searchParams.set("page", s));
      const u = new AbortController(),
        d = setTimeout(() => u.abort(), 5e3),
        f = await fetch(c.toString(), {
          method: "GET",
          headers: r,
          signal: u.signal,
        });
      if ((clearTimeout(d), (a = f.status), !f.ok))
        return (
          xt.warn("MCP servers fetch failed", {
            component: "mcp-servers",
            extra: { status: f.status, statusText: f.statusText },
          }),
          {
            servers: i,
            fetchStatus: "error",
            httpStatus: f.status,
            durationMs: performance.now() - t,
          }
        );
      const h = await f.json(),
        m = h.data ?? [];
      (i.push(...m), (s = m.length > 0 ? h.next_page : null));
    } while (s && o < l);
    try {
      const c = await jst();
      for (const u of i) u.icon_url || (u.icon_url = Bst(u.url, c));
    } catch {}
    return (
      (bj = i),
      {
        servers: bj,
        fetchStatus: "success",
        httpStatus: a,
        durationMs: performance.now() - t,
      }
    );
  } catch (c) {
    const u = c instanceof Error && c.name === "AbortError",
      d = u ? "MCP servers fetch timed out" : "Failed to fetch MCP servers";
    return (
      xt.warn(d, {
        component: "mcp-servers",
        extra: { error: c instanceof Error ? c.message : String(c) },
      }),
      {
        servers: i,
        fetchStatus: u ? "timeout" : "error",
        httpStatus: a,
        durationMs: performance.now() - t,
      }
    );
  }
}
function $st() {
  ((bj = null), (Iy = null));
}
function hh(t) {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}
function zst(t, e) {
  const n = hh(t);
  return e.map((r) => ({
    type: "custom",
    name: `mcp__${n}__${r.name}`,
    description: r.description ?? "",
    input_schema: r.inputSchema ?? { type: "object", properties: {} },
  }));
}
function bW(t) {
  const e = t.slice(5),
    n = e.indexOf("__");
  return n === -1
    ? { serverName: e, toolName: "" }
    : { serverName: e.slice(0, n), toolName: e.slice(n + 2) };
}
function vj(t) {
  const e = t.trimStart();
  if (e.startsWith("{")) return JSON.parse(e);
  for (const n of t.split(`
`))
    if (n.startsWith("data: ")) return JSON.parse(n.slice(6));
  throw new Error(`Unrecognized MCP response format: ${t.slice(0, 120)}`);
}
class vW extends Error {
  constructor(e, n) {
    (super(
      n
        ? `MCP server "${e}" requires OAuth setup on claude.ai`
        : `MCP server "${e}" authentication expired — re-authenticate on claude.ai`,
    ),
      (this.name = "McpAuthError"),
      (this.requiresSetup = n));
  }
}
function Hst(t) {
  return t instanceof Error
    ? t.name === "AbortError" || t instanceof TypeError
    : !1;
}
function K6e(t) {
  return {
    kind: "proxy",
    url: `${CQe()}/v1/mcp/${t}`,
    getAuthHeaders: async () => {
      const e = ml();
      return e ? { Authorization: `Bearer ${e}` } : null;
    },
  };
}
function Vst(t, e) {
  return { kind: "gateway", url: t, getAuthHeaders: async () => e };
}
function Wst(t, e) {
  const n = new URL(t).origin;
  return {
    kind: "gateway",
    url: t,
    getAuthHeaders: () =>
      G6e(n).then((r) =>
        r?.access_token
          ? { ...e, Authorization: `Bearer ${r.access_token}` }
          : (e ?? null),
      ),
  };
}
function X6e(t, e) {
  if (t === e) return !0;
  if (!t || !e) return !1;
  const n = Object.keys(t);
  return n.length !== Object.keys(e).length
    ? !1
    : n.every((r) => t[r] === e[r]);
}
const IN = "2025-06-18";
let qst = 1,
  Y6e = 0;
const wj = new Set();
function bl() {
  Y6e++;
  for (const t of wj) t();
}
function J6e(t) {
  return (wj.add(t), () => wj.delete(t));
}
function Gst() {
  return Y6e;
}
function Zst() {
  return qst++;
}
async function aC(t, e, n, r = !1) {
  const i = await t.transport.getAuthHeaders();
  if (!i) throw new Error("No auth headers available for MCP request");
  const s = {
    ...i,
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    "X-Mcp-Client-Session-Id": t.clientSessionId,
    "x-mcp-client-name": "ClaudeOffice",
  };
  (t.mcpSessionId && (s["Mcp-Session-Id"] = t.mcpSessionId),
    t.protocolVersion && (s["Mcp-Protocol-Version"] = t.protocolVersion));
  const o = { jsonrpc: "2.0", method: e };
  (n && (o.params = n), r || (o.id = Zst()));
  const a = new AbortController(),
    l = setTimeout(() => a.abort(), 15e3);
  try {
    const c = await fetch(t.transport.url, {
      method: "POST",
      headers: s,
      body: JSON.stringify(o),
      signal: a.signal,
    });
    return (
      clearTimeout(l),
      { text: await c.text(), headers: c.headers, status: c.status }
    );
  } catch (c) {
    throw (clearTimeout(l), c);
  }
}
async function i3(t, e, n, r = "", i) {
  const s = {
      serverId: t,
      serverName: e,
      sanitizedName: hh(e),
      serverUrl: r,
      iconUrl: i,
      clientSessionId: crypto.randomUUID(),
      protocolVersion: IN,
      tools: [],
      transport: n,
    },
    o = await aC(s, "initialize", {
      protocolVersion: IN,
      capabilities: {},
      clientInfo: { name: "sheet-add-in", version: "1.0.0" },
    });
  if (o.status === 401) throw new vW(e, !0);
  if (o.status >= 400)
    throw new Error(`MCP server initialization failed with status ${o.status}`);
  const a = o.headers.get("mcp-session-id");
  a && (s.mcpSessionId = a);
  const l = vj(o.text);
  ((s.protocolVersion = l.result?.protocolVersion ?? IN),
    await aC(s, "notifications/initialized", {}, !0));
  let c;
  do {
    const u = {};
    c && (u.cursor = c);
    const d = await aC(s, "tools/list", u),
      f = vj(d.text);
    if (f.error) throw new Error(`tools/list error: ${f.error.message}`);
    (f.result?.tools && s.tools.push(...f.result.tools),
      (c = f.result?.nextCursor));
  } while (c);
  return s;
}
class Q6e {
  constructor() {
    ((this.sessions = new Map()),
      (this.failedServers = new Map()),
      (this.pendingServers = new Map()),
      (this.gatewayStatuses = new Map()),
      (this.pendingClientInits = new Map()),
      (this.initPromise = null),
      (this.lastInitSnapshot = null));
  }
  get live() {
    return this === Hs;
  }
}
let Hs = new Q6e();
function $ie(t) {
  (Hs.pendingClientInits.delete(t), Hs.gatewayStatuses.delete(t));
  for (const [e, n] of Hs.sessions) n.serverUrl === t && Hs.sessions.delete(e);
  for (const [e, n] of Hs.failedServers)
    n.serverUrl === t && Hs.failedServers.delete(e);
  bl();
}
function Kst() {
  return Hs.gatewayStatuses;
}
function Oy(t, e, n, r, i) {
  const s = t.gatewayStatuses.get(e);
  (s?.status === n && s.label === r && s.headers === i) ||
    (t.gatewayStatuses.set(e, { status: n, label: r, headers: i }),
    t.live && bl());
}
function ebe(t, e, n) {
  const r = Hs,
    i = r.pendingClientInits.get(t);
  if (i) return i;
  const s = Xst(r, t, e, n).finally(() => {
    r.pendingClientInits.get(t) === s && r.pendingClientInits.delete(t);
  });
  return (r.pendingClientInits.set(t, s), s);
}
async function Xst(t, e, n, r) {
  const { hostname: i, pathname: s, origin: o } = new URL(e),
    a = n ?? i + s,
    l = hh(a),
    c = await G6e(o);
  if (!t.pendingClientInits.has(e)) return "failed";
  if (!c?.access_token) return (Oy(t, e, "needs_auth", a, r), "needs_auth");
  const u = Wst(e, r),
    d = t.sessions.get(l);
  if (d?.serverUrl === e && X6e(d.headers, r))
    return (Oy(t, e, "connected", a, r), "connected");
  d &&
    (xt.warn("MCP session key collision — replacing existing server", {
      component: "mcp-client",
      extra: { key: l, prevUrl: d.serverUrl, newUrl: e, displayName: a },
    }),
    t.sessions.delete(l));
  try {
    const f = await i3(e, a, u, e);
    return t.pendingClientInits.has(e)
      ? ((f.headers = r),
        t.sessions.set(f.sanitizedName, f),
        t.failedServers.delete(l),
        t.live && Ft("mcp_gateway_connected", { tool_count: f.tools.length }),
        Oy(t, e, "connected", a, r),
        "connected")
      : "failed";
  } catch (f) {
    if (!t.pendingClientInits.has(e)) return "failed";
    if (f instanceof vW)
      return (
        t.failedServers.delete(l),
        Oy(t, e, "needs_auth", a, r),
        "needs_auth"
      );
    throw (
      t.failedServers.set(l, {
        sanitizedName: l,
        displayName: a,
        serverUrl: e,
        kind: "gateway",
        error: String(f),
      }),
      Oy(t, e, "failed", a, r),
      f
    );
  }
}
function Yst(t, e, n) {
  const r = Hs,
    i = r.pendingClientInits.get(t);
  if (i) return i;
  const s = Jst(r, t, e, n).finally(() => {
    r.pendingClientInits.get(t) === s && r.pendingClientInits.delete(t);
  });
  return (r.pendingClientInits.set(t, s), s);
}
async function Jst(t, e, n, r) {
  const { hostname: i, pathname: s } = new URL(e),
    o = n ?? i + s,
    a = hh(o),
    l = t.sessions.get(a);
  if (l?.serverUrl === e && X6e(l.headers, r)) return "connected";
  l && t.sessions.delete(a);
  try {
    const c = await i3(e, o, Vst(e, r), e);
    return t.pendingClientInits.has(e)
      ? ((c.headers = r),
        t.sessions.set(c.sanitizedName, c),
        t.failedServers.delete(a),
        t.live &&
          (Ft("mcp_gateway_connected", { tool_count: c.tools.length }), bl()),
        "connected")
      : "failed";
  } catch (c) {
    if (!t.pendingClientInits.has(e)) return "failed";
    throw (
      t.failedServers.set(a, {
        sanitizedName: a,
        displayName: o,
        serverUrl: e,
        kind: "gateway",
        error: String(c),
      }),
      t.live && bl(),
      c
    );
  }
}
async function tbe() {
  const t = Hs;
  if (t.initPromise) return t.initPromise;
  const e = Qst(t).finally(() => {
    t.initPromise === e && (t.initPromise = null);
  });
  return ((t.initPromise = e), e);
}
async function Qst(t) {
  const e = await Z6e(),
    { servers: n } = e;
  if (n.length > 0) {
    for (const r of n) {
      const i = hh(r.display_name);
      t.sessions.has(i) ||
        t.pendingServers.set(i, {
          sanitizedName: i,
          displayName: r.display_name,
          serverUrl: r.url,
          iconUrl: r.icon_url,
        });
    }
    (t.live && bl(),
      await Promise.allSettled(
        n.map(async (r) => {
          const i = hh(r.display_name);
          if (!t.sessions.has(i)) {
            try {
              const s = await i3(
                r.id,
                r.display_name,
                K6e(r.id),
                r.url,
                r.icon_url,
              );
              (t.sessions.set(s.sanitizedName, s),
                t.pendingServers.delete(s.sanitizedName),
                t.failedServers.delete(s.sanitizedName));
            } catch (s) {
              (t.pendingServers.delete(i),
                t.failedServers.set(i, {
                  sanitizedName: i,
                  displayName: r.display_name,
                  serverUrl: r.url,
                  iconUrl: r.icon_url,
                  error: String(s),
                }),
                xt.warn(`MCP server init failed: ${r.display_name}`, {
                  component: "mcp-client",
                  extra: { serverId: r.id, error: String(s) },
                }));
            }
            t.live && bl();
          }
        }),
      ));
  }
  if (t.live) {
    try {
      const r = t.sessions.size,
        i = t.failedServers.size,
        s = [];
      for (const o of t.sessions.values())
        s.push({
          name: o.serverName,
          status: "connected",
          tool_count: o.tools.length,
        });
      for (const o of t.failedServers.values())
        s.push({
          name: o.displayName,
          status: "failed",
          tool_count: 0,
          error: o.error,
        });
      Ft("mcp_servers_initialized", {
        total_servers: r + i,
        connected_servers: r,
        failed_servers: i,
        servers: s,
        fetch_status: e.fetchStatus,
        fetch_duration_ms: Math.round(e.durationMs),
        fetch_http_status: e.httpStatus,
        user_email: gn.getState().email ?? void 0,
        session_id: wt.getState().uuid,
      });
    } catch {}
    ((t.lastInitSnapshot = {
      configuredCount: t.sessions.size + t.failedServers.size,
      connectedCount: t.sessions.size,
      failedCount: t.failedServers.size,
      fetchStatus: e.fetchStatus,
      fetchDurationMs: Math.round(e.durationMs),
      fetchHttpStatus: e.httpStatus,
      servers: JSON.stringify(
        [...t.sessions.values()]
          .map((r) => ({ name: r.serverName, status: "connected" }))
          .concat(
            [...t.failedServers.values()].map((r) => ({
              name: r.displayName,
              status: "failed",
              error: r.error,
            })),
          ),
      ),
    }),
      bl());
  }
}
function zie() {
  return Hs.lastInitSnapshot;
}
function _j() {
  const t = [],
    { mcpDisabledServers: e } = vn.getState();
  for (const n of Hs.sessions.values())
    e.includes(n.sanitizedName) || t.push(...zst(n.serverName, n.tools));
  return t;
}
function nbe() {
  const t = Array.from(Hs.sessions.values()).map((r) => ({
      status: "connected",
      sanitizedName: r.sanitizedName,
      displayName: r.serverName,
      serverUrl: r.serverUrl,
      iconUrl: r.iconUrl,
      toolNames: r.tools.map((i) => i.name),
    })),
    e = Array.from(Hs.failedServers.values()).map((r) => ({
      status: "failed",
      ...r,
    })),
    n = Array.from(Hs.pendingServers.values()).map((r) => ({
      status: "loading",
      ...r,
    }));
  return [...t, ...n, ...e];
}
function eot(t) {
  return Hs.sessions.get(t)?.serverName ?? t;
}
async function tot(t, e, n) {
  const r = Hs.sessions.get(t);
  if (!r) throw new Error(`No MCP session found for server "${t}"`);
  return not(r, e, n);
}
async function not(t, e, n) {
  try {
    return await WS(t, e, n);
  } catch (r) {
    if (Hst(r))
      return (
        xt.warn(`MCP tool call network error, retrying: ${t.serverName}/${e}`, {
          component: "mcp-client",
          extra: { error: r instanceof Error ? r.message : String(r) },
        }),
        WS(t, e, n)
      );
    throw r;
  }
}
async function WS(t, e, n, r = !1) {
  const i = Hs,
    s = await aC(t, "tools/call", { name: e, arguments: n });
  if (s.status === 401)
    throw (
      i.gatewayStatuses.has(t.serverUrl) &&
        (i.sessions.delete(t.sanitizedName),
        Oy(
          i,
          t.serverUrl,
          "needs_auth",
          t.serverName,
          i.gatewayStatuses.get(t.serverUrl)?.headers,
        )),
      new vW(t.serverName, !1)
    );
  if (!r && s.status === 404) {
    xt.warn(`MCP session terminated (404), recreating: ${t.serverName}`, {
      component: "mcp-client",
      extra: { status: s.status },
    });
    const a = await i3(t.serverId, t.serverName, t.transport, t.serverUrl);
    return (
      (a.headers = t.headers),
      i.sessions.set(a.sanitizedName, a),
      i.live && bl(),
      WS(a, e, n, !0)
    );
  }
  if (s.status >= 400)
    throw new Error(`MCP tool call failed with status ${s.status}`);
  const o = vj(s.text);
  if (!r && o.error?.code === 32600) {
    xt.warn(`MCP session terminated (32600), recreating: ${t.serverName}`, {
      component: "mcp-client",
      extra: { status: s.status, errorCode: o.error.code },
    });
    const a = await i3(t.serverId, t.serverName, t.transport, t.serverUrl);
    return (
      (a.headers = t.headers),
      i.sessions.set(a.sanitizedName, a),
      i.live && bl(),
      WS(a, e, n, !0)
    );
  }
  if (o.error) throw new Error(`MCP tool error: ${o.error.message}`);
  return o.result?.content ?? o.result;
}
async function wW() {
  const t = Hs;
  t.initPromise && (await t.initPromise);
  const e = await Z6e(),
    { servers: n } = e,
    r = new Set(n.map((s) => hh(s.display_name)));
  let i = !1;
  for (const [s, o] of t.sessions.entries())
    o.transport.kind !== "gateway" &&
      (r.has(s) || (t.sessions.delete(s), (i = !0)));
  for (const [s, o] of t.failedServers.entries())
    o.kind !== "gateway" && (r.has(s) || (t.failedServers.delete(s), (i = !0)));
  if ((i && t.live && bl(), n.length > 0)) {
    const s = n.filter((o) => {
      const a = hh(o.display_name);
      return !t.sessions.has(a);
    });
    s.length > 0 &&
      (await Promise.allSettled(
        s.map(async (o) => {
          const a = hh(o.display_name);
          try {
            const l = await i3(
              o.id,
              o.display_name,
              K6e(o.id),
              o.url,
              o.icon_url,
            );
            (t.sessions.set(l.sanitizedName, l),
              t.failedServers.delete(l.sanitizedName),
              t.live && bl());
          } catch (l) {
            const c = t.failedServers.get(a),
              u = String(l);
            ((!c || c.error !== u) &&
              (t.failedServers.set(a, {
                sanitizedName: a,
                displayName: o.display_name,
                serverUrl: o.url,
                iconUrl: o.icon_url,
                error: u,
              }),
              t.live && bl()),
              xt.warn(
                `MCP server init failed during refresh: ${o.display_name}`,
                {
                  component: "mcp-client",
                  extra: { serverId: o.id, error: u },
                },
              ));
          }
        }),
      ));
  } else {
    let s = !1;
    for (const [o, a] of t.sessions.entries())
      a.transport.kind === "proxy" && (t.sessions.delete(o), (s = !0));
    for (const [o, a] of t.failedServers.entries())
      a.kind !== "gateway" && (t.failedServers.delete(o), (s = !0));
    s && t.live && bl();
  }
  return nbe();
}
function Hie() {
  ((Hs = new Q6e()), $st(), Ist(), Mst().catch((t) => void 0), bl());
}
let lC = null,
  xj = null;
async function rot(t) {
  if (lC && xj === t) return lC;
  const e = new AbortController(),
    n = setTimeout(() => e.abort(), 5e3);
  try {
    const i = await fetch("https://api.anthropic.com/api/oauth/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
      },
      signal: e.signal,
    });
    if ((clearTimeout(n), !i.ok))
      return (
        xt.warn("OAuth profile API failed", {
          component: "oauth-profile-service",
          extra: { status: i.status, statusText: i.statusText },
        }),
        null
      );
    const s = await i.json();
    return ((lC = s), (xj = t), s);
  } catch (r) {
    clearTimeout(n);
    const i =
      r instanceof Error && r.name === "AbortError"
        ? "OAuth profile fetch timed out"
        : "Failed to fetch OAuth profile";
    return (
      xt.warn(i, {
        component: "oauth-profile-service",
        extra: { error: r instanceof Error ? r.message : String(r) },
      }),
      null
    );
  }
}
function iot() {
  ((lC = null), (xj = null));
}
async function sot(t, e) {
  if (!t || !e)
    return (
      xt.warn(
        "Missing organizationUUID or authToken for feature settings fetch",
        { component: "organization-service" },
      ),
      null
    );
  const n = new AbortController(),
    r = setTimeout(() => n.abort(), 5e3);
  try {
    const i = await fetch(
      `https://api.anthropic.com/api/oauth/organizations/${t}/feature_settings`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${e}`,
          "Content-Type": "application/json",
        },
        signal: n.signal,
      },
    );
    return (
      clearTimeout(r),
      i.ok
        ? await i.json()
        : (xt.warn("Organization feature settings API failed", {
            component: "organization-service",
            extra: { status: i.status, statusText: i.statusText },
          }),
          null)
    );
  } catch (i) {
    return (


// ---- runtime MCP hook glue ----

        c = "ws_close";
      const u = () => {
          (Ft("conductor_disconnected", { agent_id: a, reason: c }), l++);
          for (const { agentId: b } of xD()) BC(b);
        },
        d = new bbt({
          url: () => {
            const b = i ? "dev_user_local" : gn.getState().userId;
            return b ? `${RF}/v${otn}/conductor/${b}` : null;
          },
          logger: uM,
        }),
        f = d.createTransport(a);
      let h = Aj();
      UB(a, h?.url);
      let m = !1,
        g;
      const p = (b, w) => {
          const x = h?.fileName ?? w,
            S = h?.url;
          b.emitStatus({
            ...(x ? { fileName: x } : {}),
            ...(S ? { documentUrl: S } : {}),
          });
        },
        y = (b) => {
          if (m) return;
          const w = new V7e({
            agentId: a,
            schema: { label: s, instructions: utn(s) },
            peerRetention: 60,
            transport: f,
            getUserId: () => gn.getState().userId ?? void 0,
            getAuthToken: () => ml(),
            getDevUserId: () => (i ? "dev_user_local" : void 0),
            interfaceType: s,
            capabilities: {
              receive_message: {},
              file_sharing: { accept: ctn[Fn()] },
            },
            display: { label: s, color: dtn(s) },
            onConnect: (x) => {
              (uM.info?.("Conductor connected", { serverSettings: x }),
                Ft("conductor_connected", {
                  agent_id: a,
                  app_name: s,
                  reconnect_attempts: l,
                }),
                (l = 0),
                p(w, b));
            },
            messageHandler: stn(),
            onAgentOnline: (x, S) => Mxe(x, S),
            onAgentOffline: (x) => BC(x),
            onAgentExpired: (x) => {
              ($7e(x), PB(x), BC(x));
            },
            onDisconnect: u,
            onEvent: (x) => ftn(x),
            onReplayComplete: (x) => {
              uM.info?.("Conductor replay complete", { events_replayed: x });
            },
            onAgentReset: (x) => {
              (J7t(x), L5(`Agent "${x}" cleared its context.`));
            },
          });
          ((r.current = w),
            jB(w),
            d.start().then(() => w.connect()),
            (g = setInterval(() => {
              const x = Aj();
              x && x.url !== h?.url && ((h = x), UB(a, x.url), p(w));
            }, atn)));
        };
      return (
        t
          .getFileData({})
          .then((b) => y(b?.fileName))
          .catch(() => y()),
        () => {
          ((m = !0),
            (c = "user"),
            clearInterval(g),
            r.current?.disconnect(),
            d.close(),
            jB(null),
            (r.current = null));
        }
      );
    }, [e, n, t]),
    null
  );
}
function ptn(t, e) {
  let n;
  const r = (a) =>
    a.replace(/\{\{(\w+)\}\}/g, (l, c) => {
      const u = e[c];
      return (u || (n ??= c), u || l);
    });
  if (typeof t.url != "string" || !t.url)
    return { ok: !1, url: "", error: "mcp_servers entry is missing url" };
  const i = r(t.url);
  if (n)
    return {
      ok: !1,
      url: t.url,
      error: `mcp_servers template {{${n}}} has no value in CustomerConfig`,
    };
  const s = t.discover ?? !t.headers;
  if (!t.headers) return { ok: !0, url: i, label: t.label, discover: s };
  const o = {};
  for (const [a, l] of Object.entries(t.headers))
    if (((o[a] = r(l)), n))
      return {
        ok: !1,
        url: t.url,
        error: `mcp_servers template {{${n}}} has no value in CustomerConfig`,
      };
  return { ok: !0, url: i, label: t.label, headers: o, discover: s };
}
function mtn() {
  const t = Mh().mcp;
  I.useEffect(() => {
    t &&
      tbe().catch((a) => {
        xt.warn("MCP initialization failed (hook retry)", {
          component: "useMcpInit",
          extra: { error: a instanceof Error ? a.message : String(a) },
        });
      });
  }, [t]);
  const e = wa("pivot-portal") || !1,
    n = gn((a) => a.userId),
    r = cr((a) => a.mcpServers),
    i = cr((a) => a.customerConfig),
    s = I.useMemo(() => {
      let a;
      if (r) {
        try {
          a = JSON.parse(r);
        } catch (c) {
          return (
            xt.warn("mcp_servers is not valid JSON", {
              component: "useMcpInit",
              extra: { raw: r, error: String(c) },
            }),
            []
          );
        }
        if (!Array.isArray(a))
          return (
            xt.warn("mcp_servers is not a JSON array", {
              component: "useMcpInit",
              extra: { raw: r },
            }),
            []
          );
      } else a = [];
      const l = { ...Yc, ...i };
      return a.map((c) => ptn(c, l));
    }, [r, i]),
    o = I.useRef(new Set());
  (I.useEffect(() => {
    if (!e) {
      for (const l of o.current) $ie(l);
      o.current = new Set();
      return;
    }
    const a = new Set(s.filter((l) => l.ok).map((l) => l.url));
    for (const l of o.current) a.has(l) || $ie(l);
    o.current = a;
    for (const l of s) {
      if (!l.ok) {
        xt.warn(l.error, { component: "useMcpInit", extra: { url: l.url } });
        continue;
      }
      (l.discover
        ? ebe(l.url, l.label, l.headers)
        : Yst(l.url, l.label, l.headers ?? {})
      ).catch((u) => {
        xt.warn("MCP server init failed (hook)", {
          component: "useMcpInit",
          extra: {
            url: l.url,
            discover: l.discover,
            error: u instanceof Error ? u.message : String(u),
          },
        });
      });
    }
  }, [e, s, n]),
    I.useEffect(() => {
      if (!t) return;
      const a = () => {
        document.visibilityState === "visible" &&
          wW().catch((l) => {
            xt.warn("MCP refresh on visibility change failed", {
              component: "useMcpInit",
              extra: { error: l instanceof Error ? l.message : String(l) },
            });
          });
      };
      return (
        document.addEventListener("visibilitychange", a),
        () => document.removeEventListener("visibilitychange", a)
      );
    }, [t]));
}
function gtn() {
  const t = I.useMemo(() => TAt(), []),
    { sendAnalytics: e } = rd(),
    {
      isLoading: n,
      checkAuth: r,
      error: i,
      termsAccepted: s,
      onboardingCompleted: o,
      oauthProfile: a,
    } = gn(),
    l = Zv(),
