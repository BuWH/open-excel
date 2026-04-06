  getCwd() {
    return this.state.cwd;
  }
  getEnv() {
    return Ny(this.state.env);
  }
  registerTransformPlugin(e) {
    this.transformPlugins.push(e);
  }
  transform(e) {
    const n = Mle(e);
    let r = w3(n),
      i = Object.create(null);
    for (const s of this.transformPlugins) {
      const o = s.transform({ ast: r, metadata: i });
      ((r = o.ast), o.metadata && (i = { ...i, ...o.metadata }));
    }
    return { script: g7t(r), ast: r, metadata: i };
  }
}
function Mle(t) {
  const e = t.split(`
`),
    n = [],
    r = [];
  for (let i = 0; i < e.length; i++) {
    const s = e[i];
    if (r.length > 0) {
      const l = r[r.length - 1];
      if ((l.stripTabs ? s.replace(/^\t+/, "") : s) === l.delimiter) {
        (n.push(s.trimStart()), r.pop());
        continue;
      }
      n.push(s);
      continue;
    }
    const o = s.trimStart();
    n.push(o);
    const a = /<<(-?)\s*(['"]?)([\w-]+)\2/g;
    for (const l of o.matchAll(a)) {
      const c = l[1] === "-",
        u = l[3];
      r.push({ delimiter: u, stripTabs: c });
    }
  }
  return n.join(`
`);
}
const q_ = 3e4,
  j7t = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/;
function fw(t) {
  if (!j7t.test(t)) throw new Error(`Invalid agentId: ${t}`);
  return t;
}
function B7t(t) {
  return `/agents/${t}/transcript.jsonl`;
}
const j7e = [
  "cat",
  "head",
  "tail",
  "wc",
  "file",
  "stat",
  "du",
  "grep",
  "egrep",
  "fgrep",
  "rg",
  "find",
  "cut",
  "sort",
  "uniq",
  "tr",
  "rev",
  "nl",
  "fold",
  "expand",
  "unexpand",
  "column",
  "comm",
  "join",
  "paste",
  "diff",
  "tac",
  "strings",
  "od",
  "jq",
  "base64",
  "ls",
  "pwd",
  "env",
  "printenv",
  "basename",
  "dirname",
  "tree",
  "true",
  "false",
  "seq",
  "expr",
  "date",
  "which",
  "xargs",
];
function $7t(t) {
  const e = () => {
    throw new Error("Read-only filesystem");
  };
  return new Proxy(t, {
    get(n, r, i) {
      switch (r) {
        case "writeFile":
        case "appendFile":
        case "mkdir":
        case "rm":
        case "cp":
        case "mv":
          return e;
        default:
          return Reflect.get(n, r, i);
      }
    },
  });
}
let i8 = null,
  s8 = null,
  o8 = null;
async function Yg() {
  return i8 && s8
    ? { reader: i8, writer: s8 }
    : o8
      ? (await o8, { reader: i8, writer: s8 })
      : ((o8 = (async () => {
          const t = new Nle({ cwd: "/agents" });
          (await t.fs.mkdir("/agents", { recursive: !0 }), (s8 = t));
          const e = $7t(t.fs);
          i8 = new Nle({ fs: e, cwd: "/agents", commands: j7e });
        })().catch((t) => {
          throw ((o8 = null), t);
        })),
        await o8,
        { reader: i8, writer: s8 });
}
let z7t = 0;
const Jg = new Map();
function H7t() {
  const t = `sub_${++z7t}`;
  return (Jg.set(t, new Map()), t);
}
function V7t(t) {
  Jg.delete(t);
}
function W7t(t, e, n, r) {
  for (const i of Jg.values()) {
    const s = i.get(t);
    s
      ? ((s.newMessageCount = r ? n : s.newMessageCount + n),
        (s.displayName = e))
      : i.set(t, { displayName: e, newMessageCount: n });
  }
}
function B7e(t) {
  for (const e of Jg.values()) e.delete(t);
}
async function q7t(t, e, n, r) {
  if (n.length === 0) return;
  const i = fw(t);
  W7t(i, e, n.length, r);
  const { writer: s } = await Yg();
  await s.exec(`mkdir -p /agents/${i}`);
  const o = B7t(i),
    a = `${n.map((l) => JSON.stringify(l)).join(`
`)}
`;
  r
    ? await s.exec(`cat > ${o}`, { stdin: a })
    : await s.exec(`cat >> ${o}`, { stdin: a });
}
async function $7e(t) {
  const e = fw(t),
    { writer: n } = await Yg();
  (await n.exec(`rm -rf /agents/${e}`), B7e(e));
}
async function G7t(t) {
  const { reader: e } = await Yg(),
    n = await e.exec(t);
  let r = n.stdout;
  r.length > q_ &&
    (r = `${r.slice(0, q_)}
... (output truncated)`);
  let i = n.stderr;
  i.length > q_ &&
    (i = `${i.slice(0, q_)}
... (output truncated)`);
  for (const s of Jg.values())
    for (const o of s.keys()) t.includes(o) && s.delete(o);
  return { stdout: r, stderr: i, exitCode: n.exitCode };
}
function Z7t(t) {
  const e = Jg.get(t);
  if (!e) return [];
  const n = [];
  for (const [r, { displayName: i, newMessageCount: s }] of e)
    n.push(
      `${r} "${i}" conversation updated (+${s} new messages). Use the bash tool to inspect: tail -${s} /agents/${r}/transcript.jsonl`,
    );
  return n;
}
function K7t(t) {
  const e = Jg.get(t);
  e && e.clear();
}
function X7t() {
  return {
    name: "bash",
    description: `Run a bash command against the shared agent workspace. Each connected agent has a directory at /agents/<agent-id>/ with:
  transcript.jsonl  — conversation messages ({role, content} JSON per line)
  files/            — shared files from the agent (if any)

This is a sandboxed, read-only virtual shell — NOT a real bash environment. Only the following commands are available:
  ${j7e.join(" ")}

NOT available: awk, sed, echo, printf, curl, wget, python, node, less, more, or any command not listed above. Attempting them returns "command not found".

KEEP IT SIMPLE — use one command at a time. Do NOT chain pipes, suppress stderr with 2>/dev/null, or build complex one-liners. Simple commands work; complex pipelines break in this sandbox.

== Reading transcripts ==
Use \`tail\` to read the latest messages — this is almost always what you need:
  tail -10 /agents/excel-abc/transcript.jsonl        # last 10 messages
Use \`grep\` only when searching for something specific:
  grep 'revenue' /agents/excel-abc/transcript.jsonl  # find a topic

== Reading files ==
Use \`ls\` to see what files an agent has:
  ls /agents/excel-abc/files/
Then use \`head\` to peek at the shape — just enough to write code against:
  head -5 /agents/excel-abc/files/data.csv           # column names + a few rows
  jq 'keys' /agents/excel-abc/files/data.json        # top-level structure
Once you know the shape, you're good — use your code-execution tool with conductor.readFile() to process the full file. The data stays out of your context entirely; the header is enough to write correct code.

== Anti-patterns (never do these) ==
  cat file | tail -5 | jq '...' 2>/dev/null | head   # over-piped
  find /agents -type f -name "*" | grep -v ...        # use ls instead
  ls -la /agents/*/files/ 2>/dev/null                 # globs can fail; ls each dir
  for i in ...; do cat ...; done                      # no loops
  cat /agents/excel-abc/files/data.csv                # bare cat dumps entire file

IMPORTANT: Check conversations BEFORE using send_message. The data you need may already be in another agent's conversation file.`,
    input_schema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The bash command to execute.",
        },
      },
      required: ["command"],
    },
  };
}
async function Y7t(t, e) {
  const { writer: n } = await Yg(),
    r = t.substring(0, t.lastIndexOf("/"));
  (await n.exec(`mkdir -p ${r}`), await n.exec(`cat > ${t}`, { stdin: e }));
}
async function Ple(t, e) {
  const n = fw(t),
    { writer: r } = await Yg();
  await r.exec(`mkdir -p /agents/${n}`);
  const i = JSON.stringify(e, null, 2);
  await r.exec(`cat > /agents/${n}/metadata.json`, { stdin: i });
}
async function G_(t, e) {
  const n = fw(t),
    { writer: r } = await Yg();
  await r.exec(`mkdir -p /agents/${n}`);
  const i = JSON.stringify(e, null, 2);
  await r.exec(`cat > /agents/${n}/status.json`, { stdin: i });
}
async function J7t(t) {
  const e = fw(t),
    { writer: n } = await Yg();
  (await n.exec(`rm -f /agents/${e}/transcript.jsonl`),
    await n.exec(`rm -rf /agents/${e}/files`),
    B7e(e));
}
const Q7t = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/,
  e_t = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/;
function KT(t) {
  if (!Q7t.test(t)) throw new Error(`Invalid agentId: ${t}`);
}
function t_t(t) {
  if (!e_t.test(t)) throw new Error(`Invalid filename: ${t}`);
}
const j9 = new Map();
function z7e(t, e) {
  return (KT(t), j9.get(t)?.get(e) ?? null);
}
function H7e(t) {
  KT(t);
  const e = j9.get(t);
  return e ? Array.from(e.keys()) : [];
}
async function wG(t, e) {
  KT(t);
  let n = j9.get(t);
  n || ((n = new Map()), j9.set(t, n));
  for (const [r, i] of Object.entries(e))
    (t_t(r), n.set(r, i), await Y7t(`/agents/${t}/files/${r}`, i));
}
function PB(t) {
  (KT(t), j9.delete(t));
}
const n_t = 2,
  r_t = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/;
function i_t(t) {
  if (!r_t.test(t)) throw new Error(`Invalid filename: ${t}`);
}
function s_t(t) {
  const { schema: e } = t,
    n = e.interface ?? t.interfaceType,
    r = e.capabilities ?? t.capabilities ?? { receive_message: {} },
    i = e.display ?? t.display ?? { label: e.label };
  return {
    instructions: e.instructions,
    appName: e.label,
    version: n_t,
    interface: n ?? e.label,
    capabilities: r,
    display: i,
  };
}
function Lle(t) {
  return {
    instructions: t.instructions,
    label: t.appName,
    ...(t.version != null ? { version: t.version } : {}),
    ...(t.interface ? { interface: t.interface } : {}),
    ...(t.capabilities ? { capabilities: t.capabilities } : {}),
    ...(t.display ? { display: t.display } : {}),
  };
}
class V7e {
  config;
  logger;
  state = "DISCONNECTED";
  connectedAgents = new Map();
  liveEventQueue = [];
  incomingQueue = [];
  isHandling = !1;
  systemReminders = [];
  dirtySubscriberId;
  constructor(e) {
    ((this.config = e),
      (this.logger = e.logger ?? Gq),
      (this.dirtySubscriberId = H7t()));
  }
  connect() {
    const e = this.config.transport;
    ((e.onopen = () => this.handleTransportOpen()),
      (e.onmessage = (n) => this.handleMessage(n)),
      (e.onerror = (n) =>
        this.logger.error("Transport error", { error: n.message })),
      (e.onclose = () => {
        ((this.state = "DISCONNECTED"), this.config.onDisconnect?.());
      }),
      e.start());
  }
  disconnect() {
    ((this.state = "DISCONNECTED"),
      this.config.transport.close(),
      this.connectedAgents.clear(),
      (this.liveEventQueue = []),
      V7t(this.dirtySubscriberId));
  }
  async getConnectedAgents() {
    return Array.from(this.connectedAgents.entries()).map(([e, n]) => ({
      agentId: e,
      schema: n,
    }));
  }
  async sendMessage(e, n, r) {
    if (e === this.config.agentId)
      throw new Error("Cannot send message to self");
    const i = this.connectedAgents.get(e);
    if (i && !i.capabilities?.receive_message)
      throw new Error(
        `Agent "${e}" cannot receive messages (send-only client). Do not attempt to message it.`,
      );
    const s = { type: "conductor_send_message", to: e, message: n };
    return (
      r && Object.keys(r).length > 0 && (s.files = r),
      this.send(s),
      "ok"
    );
  }
  canAgentReceive(e) {
    return this.connectedAgents.get(e)?.capabilities?.receive_message != null;
  }
  updateSchema(e) {
    Object.assign(this.config.schema, e);
  }
  emitStream(e, n, r) {
    if (e.length === 0) return;
    const i = { type: "stream", messages: e, total_messages: n };
    (r && (i.full_sync = !0), this.send(i));
  }
  emitFile(e, n) {
    (i_t(e), this.send({ type: "file", filename: e, data: n }));
  }
  emitStatus(e) {
    this.send({ type: "status", ...e });
  }
  clearContext() {
    this.send({ type: "clear_context" });
  }
  emitActivate(e) {
    const n = { type: "activate" };
    (e && (n.target_agent_id = e), this.send(n));
  }
  pushSystemReminder(e) {
    this.systemReminders.push(e);
  }
  drainSystemReminders() {
    const e = Z7t(this.dirtySubscriberId);
    K7t(this.dirtySubscriberId);
    const n = [...this.systemReminders, ...e];
    return ((this.systemReminders = []), n);
  }
  handleTransportOpen() {
    ((this.state = "CONNECTING"),
      this.connectedAgents.clear(),
      (this.liveEventQueue = []));
    const e = this.config.getDevUserId?.(),
      n = e ? void 0 : this.config.getAuthToken(),
      r = {
        type: "register",
        agentId: this.config.agentId,
        schema: s_t(this.config),
        ...(e ? { dev_user_id: e } : { oauth_token: n }),
        ...(this.config.peerRetention != null
          ? { peer_retention: this.config.peerRetention }
          : {}),
      };
    this.send(r);
  }
  handleMessage(e) {
    switch (e.type) {
      case "conductor_connected": {
        const n = e;
        ((this.state = "REPLAYING"),
          this.config.onConnect?.(n.server_settings));
        break;
      }
      case "conductor_event": {
        const n = e;
        this.state === "REPLAYING"
          ? n.replay
            ? this.processEvent(n)
            : this.liveEventQueue.push(n)
          : this.processEvent(n);
        break;
      }
      case "conductor_replay_complete": {
        const n = e;
        for (const r of this.liveEventQueue) this.processEvent(r);
        ((this.liveEventQueue = []),
          (this.state = "LIVE"),
          this.config.onReplayComplete?.(n.events_replayed));
        break;
      }
      case "conductor_agent_online": {
        const n = e,
          r = Lle(n.schema);
        (this.connectedAgents.set(n.agentId, r),
          Ple(n.agentId, r),
          G_(n.agentId, { connected: !0 }),
          this.config.onAgentOnline?.(n.agentId, r),
          this.pushAgentOnlineReminder(n.agentId, r));
        break;
      }
      case "conductor_agent_offline":
        break;
      case "conductor_message": {
        const n = e;
        (this.incomingQueue.push({
          message: n.message,
          fromAgentId: n.from,
          files: n.files,
        }),
          this.processIncomingQueue());
        break;
      }
      case "conductor_agent_reset": {
        const n = e;
        this.config.onAgentReset?.(n.agentId);
        break;
      }
      case "conductor_agent_expired": {
        const n = e;
        ($7e(n.agentId),
          PB(n.agentId),
          this.config.onAgentExpired?.(n.agentId),
          this.pushSystemReminder(
            `Agent "${n.agentId}" data expired and was purged.`,
          ));
        break;
      }
      case "conductor_error": {
        const n = e;
        this.logger.error("Conductor error", { error: n.error });
        break;
      }
      case "activate": {
        const n = e;
        this.config.onActivate?.(n.from, n.target_agent_id);
        break;
      }
    }
  }
  processEvent(e) {
    if (e.event_type === "connect" && e.payload) {
      const n = e.payload,
        r = Lle(n);
      (e.disconnected ||
        (this.connectedAgents.set(e.agent_id, r),
        this.config.onAgentOnline?.(e.agent_id, r),
        G_(e.agent_id, { connected: !0 })),
        !e.replay &&
          !e.disconnected &&
          this.pushAgentConnectedReminder(e.agent_id, r),
        Ple(e.agent_id, r));
    }
    if (e.event_type === "status") {
      const n = e.payload;
      if ((G_(e.agent_id, n), n.fileName && !e.replay)) {
        const i = this.connectedAgents.get(e.agent_id)?.label ?? e.agent_id;
        this.pushSystemReminder(
          `Agent "${i}" (id: ${e.agent_id}) is working on "${n.fileName}".`,
        );
      }
    }
    if (e.event_type === "file" && e.payload) {
      const n = e.payload;
      n.filename && n.data && wG(e.agent_id, { [n.filename]: n.data });
    }
    (e.event_type === "disconnect" &&
      (this.connectedAgents.delete(e.agent_id),
      this.config.onAgentOffline?.(e.agent_id),
      PB(e.agent_id),
      G_(e.agent_id, { connected: !1, disconnectedAt: e.timestamp }),
      e.replay || this.pushAgentOfflineReminder(e.agent_id)),
      this.config.onEvent?.(e));
  }
  pushAgentConnectedReminder(e, n) {
    this.systemReminders.push(`Agent "${n.label}" (id: ${e}) is connected.`);
  }
  pushAgentOnlineReminder(e, n) {
    this.systemReminders.push(`Agent "${n.label}" (id: ${e}) just connected.`);
  }
  pushAgentOfflineReminder(e) {
    this.systemReminders.push(`Agent "${e}" just disconnected.`);
  }
  async processIncomingQueue() {
    if (!this.isHandling) {
      for (this.isHandling = !0; this.incomingQueue.length > 0; ) {
        const e = this.incomingQueue.shift();
        if (e)
          try {
            const n = this.config.messageHandler;
            n && (await n(e.message, e.fromAgentId, e.files));
          } catch (n) {
            this.logger.error("Error in message handler", {
              fromAgentId: e.fromAgentId,
              error: n instanceof Error ? n.message : String(n),
            });
          }
      }
      this.isHandling = !1;
    }
  }
  send(e) {
    this.config.transport.send(e);
  }
}
const o_t = `Send a message to another connected agent, requesting it to perform work.

At the protocol level, send_message is fire-and-forget: it dispatches the message and returns immediately without waiting for a response.`,
  a_t = `WORKFLOW:
1. FIRST check if the data you need is already in the other agent's transcript. Use the bash tool: cat /agents/<id>/transcript.jsonl | tail -20. Tool results contain cell values, chart details, slide content, etc. Reading is instant.
2. ONLY if the data is NOT in the transcript and you need the agent to perform NEW work (create, modify, extract), send a message.`,
  l_t = {
    serial: `3. AFTER sending: end your turn immediately. Do NOT continue with other tool calls. The other agent's reply is queued and will be delivered as a new inbound message — you will be notified when it arrives.

When sending to multiple agents, tell the user that replies will arrive one at a time as each agent finishes.`,
  },
  c_t = `3. AFTER sending: tell the user the message was sent and work will now happen in the target application. You CANNOT receive reply messages from other agents — do not say you will be notified, do not claim you are waiting or monitoring. End your turn.

MULTI-STEP REQUESTS. When the user asks for a sequence spanning multiple agents (e.g. "create a sheet in Excel, then add a chart to PowerPoint"):
- If the steps are INDEPENDENT (no step needs output from another), send all messages now and tell the user work is happening in each app independently.
- If a later step DEPENDS on an earlier step's output, send only the first message. Tell the user clearly: you cannot see when it finishes, so they should let you know once it's done and you will then send the next step.`,
      break;
    }
    case "status": {
      Pxe(n, r);
      break;
    }
  }
}
function htn({ commands: t }) {
  const e = gn((i) => i.userId),
    n = cr((i) => i.profile.kind === "oauth" && !!i.profile.accessToken),
    r = I.useRef(null);
  return (
    I.useEffect(() => {
      const i = RF.includes("localhost") || RF.includes("127.0.0.1");
      if ((!n && !i) || (i && r.current)) return;
      const s = vH() ?? "excel",
        o = ltn.slice(0, 6),
        a = `${s}-${o}`;
      let l = 0,
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
