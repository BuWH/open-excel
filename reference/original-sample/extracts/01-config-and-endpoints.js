// Reverse excerpt: config, constants, endpoints
// Sources: reverse/pretty/index-CaYG1oEg.pretty.js lines 22840-23030 and 41670-41730

          }
        ),
      }),
      s.skipHydration || m(),
      h || f
    );
  },
  V$e = H$e,
  oU = "claude-opus-4-6",
  Fte = "claude-haiku-4-5-20251001",
  mS = 5e4,
  Um = 2e5,
  W$e = 5,
  q$e =
    "https://589e88e2079ff23d299e90d41e603b7a@o1158394.ingest.us.sentry.io/4510122264297473",
  G$e = "https://api.anthropic.com/mcp-registry/v0/servers",
  Z$e = "c2995f31-11e7-4882-b7a7-ef9def0a0266",
  Hge = 1048576,
  Vge = 16384,
  aU = 2e3,
  K$e = 500,
  CO = 4e4,
  X$e = "claude_sheets.chat.feedback",
  Y$e =
    "https://privacy.anthropic.com/en/articles/10023565-how-does-anthropic-use-submitted-feedback",
  Ute = {
    sheet: "https://support.claude.com/en/articles/12650343-claude-for-excel",
    slide:
      "https://support.claude.com/en/articles/13521390-using-claude-in-powerpoint",
  },
  J$e =
    "https://support.claude.com/en/articles/13945233-use-claude-in-excel-and-powerpoint-with-an-llm-gateway",
  Q$e = "https://claude.ai/settings/connectors",
  jte = "https://status.anthropic.com",
  qc = {
    CONTEXT_LIMIT: [
      "prompt is too long",
      "exceed context",
      "request size exceeds",
      "request too large",
    ],
    LONG_CONTEXT_OVERAGE: ["extra usage is required for long context requests"],
    TOOL_PAIRING: ["tool_use` ids were found without `tool_result` blocks"],
  },
  eze = 3,
  q4 = [
    ".pdf",
    ".docx",
    ".xlsx",
    ".xls",
    ".pptx",
    ".csv",
    ".txt",
    ".json",
    ".md",
    ".skill",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
  ],
  tze = [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  c9 = 30 * 1024 * 1024,
  nze = 10 * 1024 * 1024,
  SO = 20;
q4.join(",");
const rze = ".skill,.zip",
  ize = {
    production: "https://pivot.claude.ai",
    staging: "https://excel-add-in.staging.ant.dev",
    development: "https://localhost:3000",
  };
[...Object.values(ize)];
const Wge = {
  fetch: globalThis.fetch ? globalThis.fetch.bind(globalThis) : void 0,
  SubtleCrypto: globalThis.crypto ? globalThis.crypto.subtle : void 0,
  EventSource: globalThis.EventSource,
};
function qge() {
  return Wge;
}
function EO(t) {
  let e = 2166136261;
  const n = t.length;
  for (let r = 0; r < n; r++)
    ((e ^= t.charCodeAt(r)),
      (e += (e << 1) + (e << 4) + (e << 7) + (e << 8) + (e << 24)));
  return e >>> 0;
}
function gk(t, e, n) {
  return n === 2
    ? (EO(EO(t + e) + "") % 1e4) / 1e4
    : n === 1
      ? (EO(e + t) % 1e3) / 1e3
      : null;
}
function sze(t) {
  return t <= 0 ? [] : new Array(t).fill(1 / t);
}
function CH(t, e) {
  return t >= e[0] && t < e[1];
}
function oze(t, e) {
  const n = gk("__" + e[0], t, 1);
  return n === null ? !1 : n >= e[1] && n < e[2];
}
function aze(t, e) {
  for (let n = 0; n < e.length; n++) if (CH(t, e[n])) return n;
  return -1;
}
function Gge(t) {
  try {
    const e = t.replace(/([^\\])\//g, "$1\\/");
    return new RegExp(e);
  } catch (e) {
    console.error(e);
    return;
  }
}
function Zge(t, e) {
  if (!e.length) return !1;
  let n = !1,
    r = !1;
  for (let i = 0; i < e.length; i++) {
    const s = uze(t, e[i].type, e[i].pattern);
    if (e[i].include === !1) {
      if (s) return !1;
    } else ((n = !0), s && (r = !0));
  }
  return r || !n;
}
function lze(t, e, n) {
  try {
    let r = e.replace(/[*.+?^${}()|[\]\\]/g, "\\$&").replace(/_____/g, ".*");
    return (
      n && (r = "\\/?" + r.replace(/(^\/|\/$)/g, "") + "\\/?"),
      new RegExp("^" + r + "$", "i").test(t)
    );
  } catch {
    return !1;
  }
}
function cze(t, e) {
  try {
    const n = new URL(
        e.replace(/^([^:/?]*)\./i, "https://$1.").replace(/\*/g, "_____"),
        "https://_____",
      ),
      r = [
        [t.host, n.host, !1],
        [t.pathname, n.pathname, !0],
      ];
    return (
      n.hash && r.push([t.hash, n.hash, !1]),
      n.searchParams.forEach((i, s) => {
        r.push([t.searchParams.get(s) || "", i, !1]);
      }),
      !r.some((i) => !lze(i[0], i[1], i[2]))
    );
  } catch {
    return !1;
  }
}
function uze(t, e, n) {
  try {
    const r = new URL(t, "https://_");
    if (e === "regex") {
      const i = Gge(n);
      return i
        ? i.test(r.href) || i.test(r.href.substring(r.origin.length))
        : !1;
    } else if (e === "simple") return cze(r, n);
    return !1;
  } catch {
    return !1;
  }
}
function dze(t, e, n) {
  ((e = e === void 0 ? 1 : e), e < 0 ? (e = 0) : e > 1 && (e = 1));
  const r = sze(t);
  ((n = n || r), n.length !== t && (n = r));
  const i = n.reduce((o, a) => a + o, 0);
  (i < 0.99 || i > 1.01) && (n = r);
  let s = 0;
  return n.map((o) => {
    const a = s;
    return ((s += o), [a, a + e * o]);
  });
}
function fze(t, e, n) {


// ---- endpoint helpers ----

class vQe extends kJe {
  constructor(e) {
    super(
      $4e(e ?? {}, ZJe, "v1/metrics", { "Content-Type": "application/json" }),
      e,
    );
  }
}
const Bv = {};
function wQe() {
  return "https://claude.ai";
}
function _Qe() {
  return q$e;
}
function xQe() {
  return G$e;
}
function CQe() {
  return "https://mcp-proxy.anthropic.com";
}
function z4e() {
  return "wss://bridge.claudeusercontent.com";
}
function K1() {
  return "https://api.anthropic.com";
}
function H4e() {
  return "true" !== "false";
}
function V4e() {
  const t = Bv?.VITE_CODE_EXECUTION_ENABLED;
  return t === void 0 ? !0 : t !== "" && t !== "false";
}
function W4e() {
  const t = Bv?.VITE_WEB_SEARCH_ENABLED;
  return t === void 0 ? !0 : t !== "" && t !== "false";
}
function SQe() {
  return "";
}
function EQe() {
  const t = Bv?.VITE_API_BOOTSTRAP_ENABLED;
  return t === void 0 ? !1 : t !== "" && t !== "false";
}
function AQe() {
  return !0;
}
function kQe() {
  return "https://pivot.claude.ai";
}
function TQe() {
  return "office-agent";
}
function q4e() {
  return "9OzyBCW2fECeX2jg94oIaiSiDbh7bCeN1HylhX5Litw=";
}
function KV() {
  return "8a3d43cefdceab518a6d097570376a752fe96819";
}
function DQe() {
