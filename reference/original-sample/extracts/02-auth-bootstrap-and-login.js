// Reverse excerpt: auth, bootstrap, profile store, login, callback
// Sources: reverse/pretty/index-CaYG1oEg.pretty.js lines 42640-42720, 51020-52040, 79280-80980

  }
  throw o;
}
async function BQe(t, e) {
  const n = e ? { Authorization: `Bearer ${e}` } : void 0,
    r = await X3(t, { headers: n });
  if (!r.ok)
    throw new Error(
      `Customer bootstrap failed (${r.status}): ${await r.text()}`,
    );
  return r.json();
}
const $Qe = { claims: {}, bootstrap: null },
  ire = (t) =>
    t instanceof Error ? t.message || t.errorCode || t.name : String(t);
async function $U(t) {
  let e = {},
    n,
    r,
    i;
  if (t.entra)
    try {
      const a = await TV({ interactive: t.interactive ?? !1 });
      ((e = a.claims), (n = a.idToken));
    } catch (a) {
      ((r = `NAA failed: ${ire(a)}`), (i = "naa"));
    }
  const s = e.bootstrap_url ?? Yc.bootstrap_url;
  let o = null;
  if (s && (n || !t.entra))
    try {
      o = await BQe(s, n);
    } catch (a) {
      ((r = `Bootstrap fetch failed: ${ire(a)}`), (i = "fetch"));
    }
  return (
    Ft("bootstrap_resolved", {
      ok: !r,
      entra: t.entra,
      had_url: !!s,
      error_kind: i,
    }),
    { claims: e, bootstrap: o, error: r, errorKind: i }
  );
}
const zQe = 15e3,
  m4 = new Map(),
  zU = new Map();
function YV(t) {
  if (m4.has(t)) return;
  m4.set(t, performance.now());
  const e = setTimeout(() => {
    m4.has(t) && p1(t, "stuck");
  }, zQe);
  zU.set(t, e);
}
function HQe(t) {
  const e = m4.get(t);
  return e === void 0 ? 0 : Math.round(performance.now() - e);
}
let eN = null,
  tN = null;
function VQe() {
  return (
    eN ||
      (eN = XV().createHistogram("office_agent.startup_phase_duration_ms", {
        description: "Duration of each startup loading phase in milliseconds",
        unit: "ms",
      })),
    eN
  );
}
function WQe() {
  return (
    tN ||
      (tN = XV().createCounter("office_agent.startup_phase_outcome_total", {
        description: "Count of startup phase completions by outcome",
        unit: "{outcomes}",
      })),
    tN
  );


// ---- oauth + profile store ----

function Rie(t) {
  return encodeURIComponent(t)
    .replace(/%20/g, "+")
    .replace(
      /[-_.!~*'()]/g,
      (e) => `%${e.charCodeAt(0).toString(16).toUpperCase()}`,
    );
}
const Cit = Object.freeze(
    Object.defineProperty({ __proto__: null }, Symbol.toStringTag, {
      value: "Module",
    }),
  ),
  A6e = "oauth_module_sentinel";
if (typeof sessionStorage < "u")
  try {
    sessionStorage.setItem(A6e, String(Date.now()));
  } catch {}
const zS = new E6e({
  server: "https://claude.ai",
  clientId: "966eba67-8b8c-4eae-bbb3-08361d1b9292",
  authorizationEndpoint: "/oauth/authorize",
  tokenEndpoint: "/v1/oauth/token",
});
function m1() {
  return `${window.location.origin}/auth/callback`;
}
function cW() {
  return { vendor: "m", surface: Fn(), platform: au() };
}
function k6e() {
  const t = new Uint8Array(32);
  return (
    crypto.getRandomValues(t),
    btoa(String.fromCharCode(...t))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  );
}
function uW(t) {
  return btoa(JSON.stringify(t))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function T6e(t) {
  if (!t) return null;
  try {
    const e = "=".repeat((4 - (t.length % 4)) % 4),
      n = atob(t.replace(/-/g, "+").replace(/_/g, "/") + e);
    return JSON.parse(n);
  } catch {
    return null;
  }
}
function Sit(t) {
  const e = T6e(t);
  return !e || typeof e.vendor != "string" || typeof e.surface != "string"
    ? null
    : {
        vendor: e.vendor,
        surface: e.surface,
        platform: typeof e.platform == "string" ? e.platform : void 0,
      };
}
function D6e(t) {
  const e = T6e(t);
  return typeof e?.nonce == "string" ? e.nonce : void 0;
}
async function Eit() {
  const t = await x6e(),
    e = k6e(),
    n = uW({ nonce: e, ...cW() });
  (sessionStorage.setItem("oauth_state", n),
    sessionStorage.setItem("oauth_code_verifier", t),
    sessionStorage.setItem("oauth_initiated_at", String(Date.now())));
  const r = sessionStorage.getItem("oauth_state");
  if (r !== n) {
    const i = r === null,
      s = !i;
    (Ft("oauth_storage_write_failed", {
      readback_null: i,
      readback_stale: s,
      flow_id: e,
    }),
      xt.error(
        "sessionStorage oauth_state write did not survive immediate read-back",
        {
          component: "oauth",
          errorType: Zn.AUTH,
          extra: { readback_null: i, readback_stale: s },
        },
      ));
  }
  return zS.authorizationCode.getAuthorizeUri({
    redirectUri: m1(),
    scope: [
      "user:profile",
      "user:inference",
      "user:file_upload",
      "org:profile",
      "user:mcp_servers",
      "user:voice",
    ],
    codeVerifier: t,
    state: n,
  });
}
const vg = "#";
function R6e() {
  const t = sessionStorage.getItem("oauth_initiated_at"),
    e = t ? Number(t) : NaN;
  return Number.isFinite(e) ? Date.now() - e : -1;
}
function Ait(t) {
  sessionStorage.setItem("oauth_cta", t);
}
function kit() {
  return sessionStorage.getItem("oauth_cta") === "signup" ? "signup" : "login";
}
function I6e() {
  return {
    ss_len: sessionStorage.length,
    ss_module: sessionStorage.getItem(A6e) !== null,
    ss_cta: sessionStorage.getItem("oauth_cta") !== null,
  };
}
function fj() {
  return D6e(sessionStorage.getItem("oauth_state"));
}
async function Tit(t) {
  const e = t.indexOf(vg);
  if (e === -1)
    return {
      ok: !1,
      reason: "malformed",
      message: "Code must be in the form code#state",
    };
  const n = t.slice(0, e).trim(),
    r = t.slice(e + 1).trim();
  if (!n || !r)
    return {
      ok: !1,
      reason: "malformed",
      message: "Code must be in the form code#state",
    };
  const { state: i, codeVerifier: s } = Rit();
  if (!i || !s)
    return (
      xt.error(
        "OAuth no_pending — sessionStorage cleared between createLoginURL and paste",
        {
          component: "oauth",
          errorType: Zn.AUTH,
          extra: {
            state_null: i === null,
            verifier_null: s === null,
            duration_ms: R6e(),
            ...I6e(),
          },
        },
      ),
      {
        ok: !1,
        reason: "no_pending",
        message: "No pending sign-in. Click Log In first.",
      }
    );
  if (r !== i)
    return (
      xt.error(
        "Pasted code state mismatch — possible phishing or stale paste",
        { component: "oauth", errorType: Zn.AUTH },
      ),
      {
        ok: !1,
        reason: "state_mismatch",
        message:
          "This code doesn't match your sign-in. Click Log In to start over.",
      }
    );
  try {
    return { ok: !0, token: await Dit(n, i, s) };
  } catch (o) {
    return {
      ok: !1,
      reason: "exchange_failed",
      message: o instanceof Error ? o.message : String(o),
    };
  }
}
async function Dit(t, e, n) {
  const r = {
    grant_type: "authorization_code",
    code: t,
    state: e,
    code_verifier: n,
    redirect_uri: m1(),
  };
  try {
    const i = await zS.tokenResponseToOAuth2Token(
      zS.request("tokenEndpoint", r),
    );
    return (
      i?.accessToken &&
        (sessionStorage.removeItem("oauth_state"),
        sessionStorage.removeItem("oauth_code_verifier"),
        sessionStorage.removeItem("oauth_initiated_at")),
      i
    );
  } catch (i) {
    const s = dW(i);
    throw (
      xt.error("OAuth token exchange failed", {
        component: "oauth",
        errorType: Zn.AUTH,
        extra: { errorMessage: s },
      }),
      new Error(s)
    );
  }
}
function dW(t) {
  if (t instanceof Error) {
    if (t.message.includes("[object Object]")) {
      const e = t.cause;
      if (e?.error?.message) return `OAuth error: ${e.error.message}`;
    }
    return t.message;
  }
  if (typeof t == "object" && t !== null) {
    const e = t;
    if (e.error?.message) return `OAuth error: ${e.error.message}`;
    if (e.message) return e.message;
  }
  return String(t);
}
function Rit() {
  return {
    state: sessionStorage.getItem("oauth_state"),
    codeVerifier: sessionStorage.getItem("oauth_code_verifier"),
  };
}
async function Iit(t) {
  if (!t.refreshToken) throw new Error("oauth: no refresh token");
  const { kind: e, ...n } = t;
  return { kind: "oauth", ...(await zS.refreshToken(n)) };
}
const Oit = (t) => V3e({ authToken: t.accessToken }),
  Nit = {
    webSearch: !0,
    webFetch: !0,
    codeExecution: !0,
    fileUpload: !0,
    skills: !0,
    mcp: !0,
    conductor: !0,
    dictation: !0,
    toolSearchHeader: "advanced-tool-use-2025-11-20",
    localFileUpload: !1,
  },
  Mit = () => W3e(),
  Pit = () => Promise.resolve(Nit),
  Lit = {
    refresh: Iit,
    createClient: Oit,
    getModels: Mit,
    getCapabilities: Pit,
  };
var Fit = {};
const SN = (t) => {
  if (typeof globalThis.process < "u") return Fit?.[t]?.trim() ?? void 0;
  if (typeof globalThis.Deno < "u")
    return globalThis.Deno.env?.get?.(t)?.trim();
};
let hj = (t) => ((hj = Array.isArray), hj(t)),
  Iie = hj;
function EN(t) {
  return t != null && typeof t == "object" && !Array.isArray(t);
}
const O6e = Symbol.for("brand.privateNullableHeaders");
function* Uit(t) {
  if (!t) return;
  if (O6e in t) {
    const { values: r, nulls: i } = t;
    yield* r.entries();
    for (const s of i) yield [s, null];
    return;
  }
  let e = !1,
    n;
  t instanceof Headers
    ? (n = t.entries())
    : Iie(t)
      ? (n = t)
      : ((e = !0), (n = Object.entries(t ?? {})));
  for (let r of n) {
    const i = r[0];
    if (typeof i != "string")
      throw new TypeError("expected header name to be a string");
    const s = Iie(r[1]) ? r[1] : [r[1]];
    let o = !1;
    for (const a of s)
      a !== void 0 && (e && !o && ((o = !0), yield [i, null]), yield [i, a]);
  }
}
const Oie = (t) => {
    const e = new Headers(),
      n = new Set();
    for (const r of t) {
      const i = new Set();
      for (const [s, o] of Uit(r)) {
        const a = s.toLowerCase();
        (i.has(a) || (e.delete(s), i.add(a)),
          o === null ? (e.delete(s), n.add(a)) : (e.append(s, o), n.delete(a)));
      }
    }
    return { [O6e]: !0, values: e, nulls: n };
  },
  jit = "vertex-2023-10-16",
  Bit = new Set(["/v1/messages", "/v1/messages?beta=true"]);
class $it extends Ls {
  constructor({
    baseURL: e = SN("ANTHROPIC_VERTEX_BASE_URL"),
    region: n = SN("CLOUD_ML_REGION") ?? null,
    projectId: r = SN("ANTHROPIC_VERTEX_PROJECT_ID") ?? null,
    ...i
  } = {}) {
    if (!n)
      throw new Error(
        "No region was given. The client should be instantiated with the `region` option or the `CLOUD_ML_REGION` environment variable should be set.",
      );
    if (
      (super({
        baseURL:
          e ||
          (n === "global"
            ? "https://aiplatform.googleapis.com/v1"
            : `https://${n}-aiplatform.googleapis.com/v1`),
        ...i,
      }),
      (this.messages = zit(this)),
      (this.beta = Hit(this)),
      (this.region = n),
      (this.projectId = r),
      (this.accessToken = i.accessToken ?? null),
      i.authClient && i.googleAuth)
    )
      throw new Error(
        "You cannot provide both `authClient` and `googleAuth`. Please provide only one of them.",
      );
    i.authClient
      ? (this._authClientPromise = Promise.resolve(i.authClient))
      : i.accessToken != null
        ? (this._authClientPromise = null)
        : i.googleAuth
          ? ((this._auth = i.googleAuth),
            (this._authClientPromise = this._auth.getClient()))
          : (this._authClientPromise = Bn(
              async () => {
                const { GoogleAuth: s } =
                  await import("./index-kiAT1Xce.js").then((o) => o.i);
                return { GoogleAuth: s };
              },
              __vite__mapDeps([0, 1, 2]),
            ).then(
              ({ GoogleAuth: s }) => (
                (this._auth = new s({
                  scopes: "https://www.googleapis.com/auth/cloud-platform",
                })),
                this._auth.getClient()
              ),
            ));
  }
  validateHeaders() {}
  async prepareOptions(e) {
    if (this.accessToken && !this._authClientPromise) {
      e.headers = Oie([
        { Authorization: `Bearer ${this.accessToken}` },
        e.headers,
      ]);
      return;
    }
    const n = await this._authClientPromise,
      r = await n.getRequestHeaders(),
      i = n.projectId ?? r["x-goog-user-project"];
    (!this.projectId && i && (this.projectId = i),
      (e.headers = Oie([r, e.headers])));
  }
  async buildRequest(e) {
    if (
      (EN(e.body) && (e.body = { ...e.body }),
      EN(e.body) &&
        (e.body.anthropic_version || (e.body.anthropic_version = jit)),
      Bit.has(e.path) && e.method === "post")
    ) {
      if (!this.projectId)
        throw new Error(
          "No projectId was given and it could not be resolved from credentials. The client should be instantiated with the `projectId` option or the `ANTHROPIC_VERTEX_PROJECT_ID` environment variable should be set.",
        );
      if (!EN(e.body))
        throw new Error(
          "Expected request body to be an object for post /v1/messages",
        );
      const n = e.body.model;
      e.body.model = void 0;
      const i = (e.body.stream ?? !1) ? "streamRawPredict" : "rawPredict";
      e.path = `/projects/${this.projectId}/locations/${this.region}/publishers/anthropic/models/${n}:${i}`;
    }
    if (
      e.path === "/v1/messages/count_tokens" ||
      (e.path == "/v1/messages/count_tokens?beta=true" && e.method === "post")
    ) {
      if (!this.projectId)
        throw new Error(
          "No projectId was given and it could not be resolved from credentials. The client should be instantiated with the `projectId` option or the `ANTHROPIC_VERTEX_PROJECT_ID` environment variable should be set.",
        );
      e.path = `/projects/${this.projectId}/locations/${this.region}/publishers/anthropic/models/count-tokens:rawPredict`;
    }
    return super.buildRequest(e);
  }
}
function zit(t) {
  const e = new Vv(t);
  return (delete e.batches, e);
}
function Hit(t) {
  const e = new X1(t);
  return (delete e.messages.batches, e);
}
const N6e = () => ({ ...Wv, localFileUpload: Hc("pivot-open-dojo") }),
  Vit = "https://www.googleapis.com/auth/cloud-platform",
  M6e = "https://oauth2.googleapis.com/token",
  P6e = [
    { id: "claude-opus-4-6", label: "Opus 4.6" },
    { id: "claude-opus-4-5@20251101", label: "Opus 4.5" },
    { id: "claude-sonnet-4-6", label: "Sonnet 4.6" },
    { id: "claude-sonnet-4-5@20250929", label: "Sonnet 4.5" },
  ],
  pj = [
    "global",
    "us-central1",
    "us-east4",
    "us-east5",
    "us-west1",
    "europe-west1",
    "europe-west2",
    "europe-west3",
    "europe-west4",
    "asia-southeast1",
    "asia-northeast1",
    "australia-southeast1",
  ],
  Wit = new Set(["authorization", "content-type", "accept", "user-agent"]),
  qit = (t, e) => {
    if (!e?.headers) return fetch(t, e);
    const n = new Headers(e.headers);
    for (const r of [...n.keys()]) Wit.has(r) || n.delete(r);
    return fetch(t, { ...e, headers: n });
  },
  fW = (t) =>
    new $it({
      projectId: t.projectId,
      region: t.region,
      accessToken: t.accessToken,
      dangerouslyAllowBrowser: !0,
      maxRetries: 4,
      defaultHeaders: { "User-Agent": Zk() },
      fetch: qit,
    });
async function Git(t) {
  if (!t.googleRefreshToken || !t.googleClientId || !t.googleClientSecret)
    throw new Error("No refresh credentials available");
  const e = await X3(M6e, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: t.googleRefreshToken,
      client_id: t.googleClientId,
      client_secret: t.googleClientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!e.ok)
    throw new Error(
      `Google token refresh failed (${e.status}): ${await e.text()}`,
    );
  const n = await e.json();
  return {
    ...t,
    accessToken: n.access_token,
    expiresAt: Date.now() + n.expires_in * 1e3,
  };
}
const Zit = () => Promise.resolve(P6e),
  Kit = async () => ({
    ...N6e(),
    localFileUpload: await q3("pivot-open-dojo"),
  });
async function Xit(t) {
  const e = fW(t);
  let n;
  for (const r of P6e)
    try {
      return (
        await e.messages.create({
          model: r.id,
          max_tokens: 1,
          messages: [{ role: "user", content: "." }],
        }),
        { model: r.id }
      );
    } catch (i) {
      n = i;
      const s = i instanceof Error ? i.message : String(i);
      if (s.includes("404") || s.includes("429")) continue;
      throw i;
    }
  throw n ?? new Error("No Vertex model available in this project/region");
}
function Nie(t, e) {
  const n = uW({ nonce: crypto.randomUUID(), ...cW() });
  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({ client_id: t.google_client_id, redirect_uri: e, response_type: "code", scope: Vit, access_type: "offline", prompt: "consent", state: n })}`,
    state: n,
  };
}
async function Yit(t, e, n) {
  const r = await X3(M6e, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: t,
      client_id: e.google_client_id,
      client_secret: e.google_client_secret,
      redirect_uri: n,
      grant_type: "authorization_code",
    }),
  });
  if (!r.ok)
    throw new Error(
      `Google token exchange failed (${r.status}): ${await r.text()}`,
    );
  const i = await r.json(),
    s = {
      kind: "vertex",
      projectId: e.gcp_project_id,
      region: e.gcp_region,
      googleClientId: e.google_client_id,
      googleClientSecret: e.google_client_secret,
      googleRefreshToken: i.refresh_token,
      accessToken: i.access_token,
      expiresAt: Date.now() + i.expires_in * 1e3,
    },
    { model: o } = await Xit(s);
  return { profile: s, model: o };
}
function L6e(t) {
  return t.includes("Google token exchange failed") ||
    t.includes("Google token refresh failed")
    ? ["google_oauth", "Google sign-in failed. Try connecting again."]
    : t.includes("404") && t.includes("aiplatform")
      ? [
          "probe",
          "No Claude model available in this project/region. Accept the model EULA in Vertex Model Garden, or try region 'global'.",
        ]
      : t.includes("403") && t.includes("aiplatform")
        ? [
            "probe",
            "Access denied. Verify your Google account has the Vertex AI User role on this project.",
          ]
        : ["unknown", t.length > 200 ? `${t.slice(0, 200)}…` : t];
}
async function Jit(t, e) {
  try {
    return (
      await fW(t).messages.create({
        model: e,
        max_tokens: 1,
        messages: [{ role: "user", content: "." }],
        tools: [
          { type: "web_search_20250305", name: "web_search", max_uses: 1 },
        ],
      }),
      !0
    );
  } catch {
    return !1;
  }
}
function Qit(t, e) {
  let n = null;
  const r = (i) => {
    if (n === i) return;
    n = i;
    const s = performance.now();
    Jit(t, i)
      .then((o) => {
        n === i &&
          (Ft("third_party_capability_probed", {
            provider: "vertex",
            web_search: o,
            probe_duration_ms: Math.round(performance.now() - s),
          }),
          e({ capabilities: { ...N6e(), webSearch: o } }));
      })
      .finally(() => {
        n === i && (n = null);
      });
  };
  return (
    r(vn.getState().model),
    vn.subscribe((i, s) => {
      i.model !== s.model && r(i.model);
    })
  );
}
const est = {
    refresh: Git,
    createClient: fW,
    getModels: Zit,
    getCapabilities: Kit,
    registerHooks: Qit,
    classifyError: L6e,
  },
  F6e = { oauth: Lit, apiKey: Ket, gateway: yit, vertex: est, bedrock: uit },
  { useFeatureValue: tst } = RHe,
  e3 = "claude.inference.profile",
  sC = "claude.inference.customerConfig",
  E9 = 300 * 1e3,
  U6e = 3e4,
  hW = (t) => "expiresAt" in t && typeof t.expiresAt == "number";
let C5 = null,
  S5 = null,
  AN = null,
  Xp = null,
  Ry = null,
  mj = 0,
  HS = null;
const cr = lg((t, e) => ({
  profile: { kind: "none" },
  capabilities: null,
  models: [],
  mcpServers: Yc.mcp_servers,
  customerConfig: null,
  setProfile: async (n) => {
    (t({ profile: n, capabilities: null, models: [] }),
      await Mu.setItem(e3, JSON.stringify(n)),
      gW(n),
      A9(n));
  },
  setCustomerConfig: async (n) => {
    (t({ customerConfig: n }),
      lst(),
      n ? await Mu.setItem(sC, JSON.stringify(n)) : await Mu.removeItem(sC));
  },
  signOut: async () => {
    (C5 && clearTimeout(C5),
      S5 && clearTimeout(S5),
      (Ry = null),
      (mj = 0),
      HS?.(),
      (HS = null),
      (AN = null),
      (Xp = null),
      await Mu.removeItem(e3),
      await Mu.removeItem(sC),
      t({
        profile: { kind: "none" },
        capabilities: null,
        models: [],
        customerConfig: null,
      }));
  },
  refreshIfExpiring: async () => {
    const n = Q4e(e().customerConfig?.bootstrap_expires_at);
    if (n && n - Date.now() <= E9)
      try {
        await pW();
      } catch {}
    if (Xp) return Xp;
    const r = e().profile;
    !hW(r) || r.expiresAt - Date.now() > E9 || (await yW());
  },
  rehydrate: () => ((AN ??= nst()), AN),
}));
async function nst() {
  const t = (await ost()) ?? (await ast());
  if (!t || cr.getState().profile.kind !== "none") return;
  (cr.setState({ profile: t, customerConfig: await sst() }),
    (Yc.entra_sso === "1" || Yc.bootstrap_url) && (await pW()));
  const e = cr.getState().profile;
  if (e.kind !== "none")
    if (hW(e) && e.expiresAt - Date.now() <= E9) {
      await yW();
      const n = cr.getState().profile;
      if (n.kind === "none") return;
      Kv(n).registerHooks || A9(n);
    } else (gW(e), A9(e));
}
async function pW() {
  if (Ry) return Ry;
  if (Date.now() - mj < U6e) return;
  mj = Date.now();
  const t = (async () => {
    let e,
      n,
      r = {};
    try {
      ({ claims: r, bootstrap: n } = await Promise.race([
        $U({ entra: Yc.entra_sso === "1" }),
        new Promise((d, f) => {
          e = setTimeout(() => f(new Error("rebootstrap_timeout")), 1e4);
        }),
      ]));
    } catch {
      return;
    } finally {
      clearTimeout(e);
    }
    if (cr.getState().profile.kind === "none") return;
    const i = n?.mcp_servers ?? r.mcp_servers ?? Yc.mcp_servers;
    if ((i !== cr.getState().mcpServers && cr.setState({ mcpServers: i }), !n))
      return;
    n.skills && gn.getState().hydrateBootstrapSkills(n.skills);
    const s = cr.getState().customerConfig,
      { skills: o, ...a } = n;
    await cr
      .getState()
      .setCustomerConfig({
        ...s,
        ...a,
        bootstrap_expires_at: n.bootstrap_expires_at,
      });
    const l = cr.getState().profile,
      c = rst(l, n);
    if (c === l || c.kind === "none") return;
    (await Mu.setItem(e3, JSON.stringify(c)),
      cr.setState({ profile: c }),
      Kv(c).registerHooks && A9(c));
  })();
  return (
    (Ry = t),
    t.finally(() => {
      Ry === t && (Ry = null);
    }),
    t
  );
}
function rst(t, e) {
  return t.kind === "gateway" &&
    (e.gateway_url || e.gateway_token || e.gateway_auth_header)
    ? {
        ...t,
        url: e.gateway_url || t.url,
        token: e.gateway_token || t.token,
        authHeader: e.gateway_auth_header
          ? HU(e.gateway_auth_header)
          : t.authHeader,
      }
    : t;
}
function A9(t) {
  const e = Kv(t),
    n = (r) => {
      cr.getState().profile === t && cr.setState(r);
    };
  (e
    .getModels(t)
    .then((r) => n({ models: r }))
    .catch((r) =>
      xt.error("Model discovery failed", {
        component: "InferenceStore",
        errorType: Zn.NETWORK,
        extra: { kind: t.kind, error: String(r) },
      }),
    ),
    e
      .getCapabilities(t)
      .then((r) => n({ capabilities: r }))
      .catch((r) => void 0),
    HS?.(),
    (HS = e.registerHooks?.(t, n) ?? null));
}
function Jk() {
  const t = cr.getState().profile;
  if (t.kind === "none")
    throw new Error(
      "No inference profile — call rehydrate() or setProfile() first",
    );
  return Kv(t).createClient(t);
}
const kN = W4e(),
  Mie = V4e();
function j6e(t) {
  return kN && Mie
    ? t
    : {
        ...t,
        webSearch: t.webSearch && kN,
        webFetch: t.webFetch && kN,
        codeExecution: t.codeExecution && Mie,
      };
}
function Gc() {
  return j6e(cr.getState().capabilities ?? Wv);
}
function Mh() {
  return j6e(cr((t) => t.capabilities) ?? Wv);
}
function ist() {
  const t = cr((r) => r.profile.kind),
    e = cr((r) => r.models),
    n = tst("pivot-config", { models: [] });
  return t === "oauth" || t === "apiKey" ? (n.models ?? []) : e;
}
function mW() {
  return cr.getState().profile.kind;
}
function Zv() {
  return cr((t) => t.profile.kind !== "none");
}
function t3() {
  const t = cr.getState().profile.kind;
  return t !== "oauth" && t !== "apiKey" && t !== "none";
}
function ml() {
  const t = cr.getState().profile;
  return t.kind === "oauth" ? t.accessToken : void 0;
}
function VS() {
  const t = cr.getState().profile;
  return t.kind === "oauth"
    ? { Authorization: `Bearer ${t.accessToken}` }
    : t.kind === "apiKey"
      ? { "x-api-key": t.key }
      : null;
}
function Kv(t) {
  return F6e[t.kind];
}
async function sst() {
  const t = await Mu.getItem(sC);
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}
async function ost() {
  const t = await Mu.getItem(e3);
  if (!t) return null;
  try {
    const e = JSON.parse(t);
    return e.kind in F6e && e.kind !== "none" ? e : null;
  } catch {
    return (
      xt.error(
        "Stored inference profile failed to parse — user silently unauthenticated",
        {
          component: "inference-store",
          errorType: Zn.AUTH,
          extra: { rawLength: t.length },
        },
      ),
      null
    );
  }
}
async function ast() {
  const t = await Mu.getItem("oauth_token");
  if (t)
    try {
      const n = { kind: "oauth", ...JSON.parse(t) };
      return (await Mu.setItem(e3, JSON.stringify(n)), n);
    } catch {}
  return null;
}
function gW(t) {
  if ((C5 && clearTimeout(C5), !hW(t))) return;
  const e = Math.max(0, t.expiresAt - Date.now() - E9);
  C5 = setTimeout(() => {
    yW();
  }, e);
}
function lst() {
  S5 && clearTimeout(S5);
  const t = Q4e(cr.getState().customerConfig?.bootstrap_expires_at);
  if (!t) return;
  const e = Math.min(2147483647, Math.max(U6e, t - Date.now() - E9));
  S5 = setTimeout(() => {
    pW();
  }, e);
}
function yW() {
  if (Xp) return Xp;
  const t = (async () => {
    const { profile: e } = cr.getState();
    if (e.kind === "none") return;
    const n = Kv(e);
    if (!n.refresh) return;
    YV("token_refresh");
    let r, i;
    try {
      r = await Promise.race([
        n.refresh(e),
        new Promise((s, o) => {
          i = setTimeout(() => o(new Error("token_refresh_timeout")), 1e4);
        }),
      ]);
    } catch (s) {
      const o = s instanceof Error && s.message === "token_refresh_timeout";
      (p1("token_refresh", o ? "timeout" : "error"), gn.getState().logout());
      return;
    } finally {
      clearTimeout(i);
    }
    (p1("token_refresh", "success"),
      cr.getState().profile === e &&
        (await Mu.setItem(e3, JSON.stringify(r)),
        cr.setState({ profile: r }),
        gW(r),
        n.registerHooks && A9(r)));
  })();
  return (
    (Xp = t),
    t.finally(() => {
      Xp === t && (Xp = null);
    }),
    t
  );
}
const cs = lg((t) => ({
  draft: {},
  bootstrap: null,
  bootstrapError: void 0,
  provider: "gateway",
  trigger: null,
  update: (e) => t((n) => ({ draft: { ...n.draft, ...e } })),
}));
async function cst(t, e) {
  const r = `https://api.anthropic.com/api/bootstrap/${t}/app_start?growthbook_format=sdk`,
    i = await fetch(r, {
      headers: {
        Authorization: `Bearer ${e}`,
        "Content-Type": "application/json",
      },
    });
  if (!i.ok)
    throw new Error(`Bootstrap fetch failed: ${i.status} ${i.statusText}`);
  const s = await i.json();
  return { growthbook: s.org_growthbook ?? s.growthbook };
}
async function ust(t, e) {
  try {
    return await cst(t, e);
  } catch (n) {
    return (
      xt.warn("Bootstrap fetch failed — feature flags will use defaults", {
        component: "bootstrap",
        errorType: Zn.NETWORK,
        extra: {
          orgUuid: t,
          error: n instanceof Error ? n.message : String(n),
        },
      }),
      null
    );
  }
}
function B6e(t) {
  const e = new Uint8Array(t),
    n = [],
    r = 8192;
  for (let i = 0; i < e.length; i += r)
    n.push(String.fromCharCode(...e.subarray(i, i + r)));
  return btoa(n.join(""));
}
function $6e(t) {
  const e = atob(t),
    n = new Uint8Array(e.length);
  for (let r = 0; r < e.length; r++) n[r] = e.charCodeAt(r);
  return n.buffer;
}
function r1(t) {
  throw new Error(
    'Could not dynamically require "' +
      t +
      '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.',
  );
}
var TN = { exports: {} };
var Pie;
function z6e() {
  return (
    Pie ||
      ((Pie = 1),
      (function (t, e) {
        (function (n) {
          t.exports = n();
        })(function () {
          return (function n(r, i, s) {
            function o(c, u) {
              if (!i[c]) {
                if (!r[c]) {
                  var d = typeof r1 == "function" && r1;
                  if (!u && d) return d(c, !0);
                  if (a) return a(c, !0);
                  var f = new Error("Cannot find module '" + c + "'");
                  throw ((f.code = "MODULE_NOT_FOUND"), f);
                }
                var h = (i[c] = { exports: {} });
                r[c][0].call(
                  h.exports,
                  function (m) {
                    var g = r[c][1][m];
                    return o(g || m);
                  },
                  h,


// ---- auth UI + callback ----

              "div",
              { className: _n(a, "text-text-100"), children: l.label },
              l.key,
            ),
          ),
        }),
      }),
    ],
  });
}
function cu(t) {
  typeof Office < "u" && Office.context?.ui?.openBrowserWindow
    ? Office.context.ui.openBrowserWindow(t)
    : window.open(t, "_blank", "noopener,noreferrer");
}
function $ht(t) {
  return t.gateway_url || t.gateway_token
    ? "gateway"
    : t.gcp_project_id || t.google_client_id || t.google_client_secret
      ? "vertex"
      : t.aws_role_arn || t.aws_region
        ? "bedrock"
        : "gateway";
}
function zht() {
  const t = Jd(),
    e = cs((f) => f.provider),
    n = cs((f) => f.trigger),
    r = Yc.entra_sso === "1",
    i = r || !!Yc.bootstrap_url,
    [s, o] = I.useState(i ? null : $Qe),
    a = I.useRef(null);
  (I.useEffect(() => {
    Ft("third_party_page_viewed", { provider: e, via_manifest: Vz });
  }, [e]),
    I.useEffect(() => {
      i && $U({ entra: r }).then(o);
    }, [i, r]));
  const l = s?.errorKind === "naa",
    c = s !== null && !l,
    u = () => {
      (o(null), $U({ entra: r, interactive: !0 }).then(o));
    },
    d = (f, h = "manual") => {
      (cs.setState({ trigger: h }), t(f));
    };
  return (
    I.useEffect(() => {
      if (!s || s.errorKind === "naa") return;
      const { skills: f, ...h } = s.bootstrap ?? {},
        m = { ...Yc, ...s.claims, ...h };
      if (
        (cs.setState((p) => ({
          provider: n ? p.provider : $ht(m),
          draft: { ...m, ...p.draft },
          bootstrap: s.bootstrap,
          bootstrapError: s.error,
        })),
        s !== a.current &&
          s.bootstrap?.skills !== void 0 &&
          ((a.current = s),
          gn.getState().hydrateBootstrapSkills(s.bootstrap.skills)),
        n || m.auto_connect === "0")
      )
        return;
      const g = (p) =>
        p.some((y) => s.bootstrap?.[y])
          ? "bootstrap"
          : p.some((y) => s.claims[y])
            ? "claims"
            : "manifest";
      if (m.gateway_url && m.gateway_token)
        return d("/auth/3p/gateway", g(["gateway_url", "gateway_token"]));
      if (m.gcp_project_id && m.google_client_id && m.google_client_secret)
        return d(
          "/auth/3p/vertex",
          g(["gcp_project_id", "google_client_id", "google_client_secret"]),
        );
      if (m.aws_role_arn && m.aws_region)
        return d("/auth/3p/bedrock", g(["aws_role_arn", "aws_region"]));
    }, [s, n]),
    N.jsxs("main", {
      className: "h-full flex flex-col p-4",
      children: [
        N.jsx("div", {
          className: "flex items-center justify-between mb-4",
          children:
            kNe &&
            N.jsxs(Dr, {
              variant: "ghost",
              size: "sm",
              onClick: () => t("/auth/login"),
              className: "gap-1.5 !min-w-0 !px-2",
              children: [N.jsx(Q3, { size: 16 }), "Back"],
            }),
        }),
        N.jsxs("div", {
          className: "flex-1 min-h-0 flex flex-col gap-5",
          children: [
            N.jsxs("div", {
              children: [
                N.jsx("h1", {
                  className: "font-heading text-text-100 mb-1",
                  children: "Connect another way",
                }),
                N.jsx("p", {
                  className: "font-small text-text-400",
                  children: "Contact your IT team for connection details.",
                }),
              ],
            }),
            N.jsx(Bht, {
              options: [
                { key: "gateway", label: "Gateway" },
                { key: "vertex", label: "Vertex" },
                { key: "bedrock", label: "Bedrock" },
              ],
              selectedKey: e,
              onSelect: (f) => cs.setState({ provider: f }),
              className: "w-full",
            }),
            s === null &&
              N.jsxs("div", {
                className:
                  "flex-1 flex flex-col items-center justify-center gap-2",
                children: [
                  N.jsx("div", {
                    className:
                      "w-6 h-6 border-2 border-border-200 border-t-text-100 rounded-full animate-spin",
                  }),
                  N.jsx("p", {
                    className: "font-small text-text-400",
                    children: "Checking your organization's settings…",
                  }),
                ],
              }),
            l &&
              N.jsxs("div", {
                className:
                  "flex-1 flex flex-col items-center justify-center gap-3 text-center",
                children: [
                  N.jsx("p", {
                    className: "font-small text-text-400",
                    children: "Sign in to load your organization's settings.",
                  }),
                  N.jsx(Dr, { onClick: u, children: "Authorize access" }),
                  N.jsx("p", {
                    className: "font-tiny text-text-500 max-w-xs break-words",
                    children: s?.error,
                  }),
                ],
              }),
            e === "gateway" &&
              c &&
              N.jsx(Hht, { onSubmit: () => d("/auth/3p/gateway") }),
            e === "vertex" &&
              c &&
              N.jsx(Wht, { onSubmit: () => d("/auth/3p/vertex") }),
            e === "bedrock" &&
              c &&
              N.jsx(Vht, { onSubmit: () => d("/auth/3p/bedrock") }),
          ],
        }),
      ],
    })
  );
}
function Hht({ onSubmit: t }) {
  const e = cs((a) => a.draft.gateway_url ?? ""),
    n = cs((a) => a.draft.gateway_token ?? ""),
    r = cs((a) => a.update),
    [i, s] = I.useState(null);
  function o(a) {
    a.preventDefault();
    const l = r3e(e.trim());
    if (l) return s(l);
    (r({ gateway_url: e.trim(), gateway_token: n.trim() }), t());
  }
  return N.jsxs("form", {
    onSubmit: o,
    className: "flex-1 min-h-0 flex flex-col",
    children: [
      N.jsxs("div", {
        className: "flex-1 overflow-auto flex flex-col gap-4 px-1 pb-4",
        children: [
          N.jsx(bh, {
            label: "Gateway URL",
            type: "url",
            value: e,
            onChange: (a) => {
              (r({ gateway_url: a.target.value }), s(null));
            },
            placeholder: "https://your-gateway.example.com",
            error: !!i,
          }),
          i &&
            N.jsx("p", {
              className: "font-small text-danger -mt-2",
              children: i,
            }),
          N.jsx(Fbe, {
            label: "Token",
            value: n,
            onChange: (a) => r({ gateway_token: a.target.value }),
            placeholder: "sk-1234...",
          }),
          N.jsxs("button", {
            type: "button",
            onClick: () => cu(J$e),
            className:
              "flex items-center gap-1.5 font-small text-text-400 hover:text-text-100 self-start",
            children: [N.jsx(e6, { size: 12 }), "Gateway setup guide"],
          }),
        ],
      }),
      N.jsx(Dr, {
        type: "submit",
        disabled: !e.trim() || !n.trim(),
        className: "w-full shrink-0",
        children: "Continue",
      }),
    ],
  });
}
const Z5e =
  "https://support.claude.com/en/articles/13945233-use-claude-for-excel-and-powerpoint-with-third-party-platforms";
function Vht({ onSubmit: t }) {
  const e = cs((i) => i.draft.aws_role_arn ?? ""),
    n = cs((i) => i.draft.aws_region ?? Die[0]),
    r = cs((i) => i.update);
  return N.jsxs("form", {
    onSubmit: (i) => {
      (i.preventDefault(), r({ aws_role_arn: e.trim(), aws_region: n }), t());
    },
    className: "flex-1 min-h-0 flex flex-col",
    children: [
      N.jsxs("div", {
        className: "flex-1 overflow-auto flex flex-col gap-4 px-1 pb-4",
        children: [
          N.jsx(bh, {
            label: "IAM Role ARN",
            placeholder: "arn:aws:iam::123456789012:role/ClaudeBedrockAccess",
            value: e,
            onChange: (i) => r({ aws_role_arn: i.target.value }),
          }),
          N.jsxs("div", {
            className: "space-y-1.5",
            children: [
              N.jsx("label", {
                htmlFor: "bedrock-region",
                className: "block font-base-bold text-text",
                children: "Region",
              }),
              N.jsx("select", {
                id: "bedrock-region",
                value: n,
                onChange: (i) => r({ aws_region: i.target.value }),
                className:
                  "w-full h-9 px-3 text-sm text-text-000 bg-bg-000 border-1 border-border-200 rounded-md focus:border-accent-secondary disabled:opacity-50",
                children: Die.map((i) =>
                  N.jsx("option", { value: i, children: i }, i),
                ),
              }),
            ],
          }),
          N.jsxs("button", {
            type: "button",
            onClick: () => cu(Z5e),
            className:
              "flex items-center gap-1.5 font-small text-text-400 hover:text-text-100 self-start",
            children: [N.jsx(e6, { size: 12 }), "Bedrock setup guide"],
          }),
        ],
      }),
      N.jsx(Dr, {
        type: "submit",
        disabled: !e.trim(),
        className: "w-full shrink-0",
        children: "Continue",
      }),
    ],
  });
}
function Wht({ onSubmit: t }) {
  const e = cs((a) => a.draft.gcp_project_id ?? ""),
    n = cs((a) => a.draft.gcp_region ?? pj[0]),
    r = cs((a) => a.draft.google_client_id ?? ""),
    i = cs((a) => a.draft.google_client_secret ?? ""),
    s = cs((a) => a.update),
    o = e && r && i;
  return N.jsxs("form", {
    onSubmit: (a) => {
      (a.preventDefault(),
        s({
          gcp_project_id: e.trim(),
          gcp_region: n,
          google_client_id: r.trim(),
          google_client_secret: i.trim(),
        }),
        t());
    },
    className: "flex-1 min-h-0 flex flex-col",
    children: [
      N.jsxs("div", {
        className: "flex-1 overflow-auto flex flex-col gap-4 px-1 pb-4",
        children: [
          N.jsx(bh, {
            label: "Project ID",
            placeholder: "my-gcp-project",
            value: e,
            onChange: (a) => s({ gcp_project_id: a.target.value }),
          }),
          N.jsxs("div", {
            className: "space-y-1.5",
            children: [
              N.jsx("label", {
                htmlFor: "vertex-region",
                className: "block font-base-bold text-text",
                children: "Region",
              }),
              N.jsx("select", {
                id: "vertex-region",
                value: n,
                onChange: (a) => s({ gcp_region: a.target.value }),
                className:
                  "w-full h-9 px-3 text-sm text-text-000 bg-bg-000 border-1 border-border-200 rounded-md focus:border-accent-secondary disabled:opacity-50",
                children: pj.map((a) =>
                  N.jsx("option", { value: a, children: a }, a),
                ),
              }),
            ],
          }),
          N.jsx(bh, {
            label: "Google Client ID",
            placeholder: "123456-xxxx.apps.googleusercontent.com",
            value: r,
            onChange: (a) => s({ google_client_id: a.target.value }),
          }),
          N.jsx(Fbe, {
            label: "Google Client Secret",
            placeholder: "GOCSPX-...",
            value: i,
            onChange: (a) => s({ google_client_secret: a.target.value }),
          }),
          N.jsxs("button", {
            type: "button",
            onClick: () => cu(Z5e),
            className:
              "flex items-center gap-1.5 font-small text-text-400 hover:text-text-100 self-start",
            children: [N.jsx(e6, { size: 12 }), "Vertex setup guide"],
          }),
        ],
      }),
      N.jsx(Dr, {
        type: "submit",
        disabled: !o,
        className: "w-full shrink-0",
        children: "Continue",
      }),
    ],
  });
}
function K5e(t = {}) {
  const { onSuccess: e, onError: n, resetDelay: r = 2e3 } = t,
    [i, s] = I.useState(!1),
    [o, a] = I.useState(null),
    l = I.useRef(null),
    c = I.useCallback(
      async (u, d) => {
        try {
          if ((a(null), !navigator.clipboard))
            throw new Error("Clipboard API not supported");
          const f = [];
          if (d)
            try {
              const h = {
                "text/plain": new Blob([u], { type: "text/plain" }),
                "text/html": new Blob([d], { type: "text/html" }),
              };
              f.push(new ClipboardItem(h));
            } catch (h) {
              (xt.error("Failed to copy HTML, falling back to plain text", {
                component: "useCopyToClipboard",
                errorType: Zn.SYSTEM,
                extra: { error: h instanceof Error ? h.message : String(h) },
              }),
                f.push(
                  new ClipboardItem({
                    "text/plain": new Blob([u], { type: "text/plain" }),
                  }),
                ));
            }
          else
            f.push(
              new ClipboardItem({
                "text/plain": new Blob([u], { type: "text/plain" }),
              }),
            );
          (await navigator.clipboard.write(f),
            s(!0),
            e?.(),
            l.current && clearTimeout(l.current),
            (l.current = setTimeout(() => {
              (s(!1), (l.current = null));
            }, r)));
        } catch (f) {
          const h =
            f instanceof Error ? f : new Error("Failed to copy to clipboard");
          (a(h), n?.(h));
          try {
            (await qht(u),
              s(!0),
              e?.(),
              l.current && clearTimeout(l.current),
              (l.current = setTimeout(() => {
                (s(!1), (l.current = null));
              }, r)));
          } catch (m) {
            xt.error("Both clipboard methods failed", {
              component: "useCopyToClipboard",
              errorType: Zn.SYSTEM,
              extra: {
                primaryError: h instanceof Error ? h.message : String(h),
                fallbackError: m instanceof Error ? m.message : String(m),
              },
            });
          }
        }
      },
      [e, n, r],
    );
  return (
    I.useEffect(
      () => () => {
        l.current && clearTimeout(l.current);
      },
      [],
    ),
    { copyToClipboard: c, didCopy: i, error: o }
  );
}
async function qht(t) {
  const e = document.createElement("textarea");
  ((e.value = t),
    (e.style.top = "0"),
    (e.style.left = "0"),
    (e.style.position = "fixed"),
    (e.style.opacity = "0"),
    document.body.appendChild(e),
    e.focus(),
    e.select());
  try {
    if (!document.execCommand("copy"))
      throw new Error("Fallback copy command failed");
  } finally {
    document.body.removeChild(e);
  }
}
const Ght = { gateway: "Gateway", bedrock: "Bedrock", vertex: "Vertex" },
  Zht = /secret|token|password/i,
  Kht = (t, e) => {
    if (!Zht.test(t)) return e;
    const n = Math.max(4, Math.round(Math.sqrt(e.length)));
    return `${e.slice(0, n)}***${e.slice(-n)}`;
  };
function uq({
  provider: t,
  message: e,
  raw: n,
  context: r,
  onBack: i,
  onRetry: s,
}) {
  const { copyToClipboard: o, didCopy: a } = K5e(),
    l = cs((f) => f.bootstrap),
    c = cs((f) => f.bootstrapError),
    u = (f) =>
      Object.entries(f)
        .filter(([, h]) => h)
        .map(([h, m]) => `  ${h}: ${Kht(h, m)}`).join(`
`) || "  (none)",
    d = `Claude for Office connection failed (${Ght[t]})
Build: ${KV()}

${e}

Request:
${u(r ?? {})}

Manifest params:
${u(Yc)}

Bootstrap response:
${l ? u(l) : c ? `  (failed) ${c}` : "  (not called)"}

Raw error:
${n ?? "(none)"}`;
  return N.jsxs(N.Fragment, {
    children: [
      N.jsx("div", {
        className:
          "w-10 h-10 rounded-full bg-[rgba(181,51,51,0.08)] flex items-center justify-center mb-4",
        children: N.jsx(ZS, {
          size: 18,
          className: "text-danger",
          weight: "bold",
        }),
      }),
      N.jsx("h2", {
        className: "font-heading text-text-100 mb-1.5",
        children: "Connection failed",
      }),
      N.jsx("p", {
        className: "font-small text-text-400 max-w-[260px] break-words",
        children: e,
      }),
      n &&
        N.jsxs("button", {
          type: "button",
          onClick: () => {
            o(d);
          },
          className:
            "mt-3 flex items-center gap-1.5 font-small text-text-400 hover:text-text-100",
          children: [
            a ? N.jsx(Wg, { size: 12 }) : N.jsx(SW, { size: 12 }),
            a ? "Copied" : "Copy error details",
          ],
        }),
      N.jsxs("div", {
        className:
          "absolute left-4 right-4 bottom-4 max-w-sm mx-auto flex gap-2.5",
        children: [
          N.jsx(Dr, {
            variant: "ghost",
            onClick: i,
            className: "flex-1",
            children: "Go back",
          }),
          N.jsx(Dr, { onClick: s, className: "flex-1", children: "Try again" }),
        ],
      }),
    ],
  });
}
const Xht =
    "data:image/svg+xml,%3csvg%20viewBox='0%200%2024%2024'%20xmlns='http://www.w3.org/2000/svg'%20fill='%23fff'%3e%3cpath%20d='M6.763%2010.036c0%20.296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183%200%20.08-.048.16-.152.24l-.503.335a.383.383%200%200%201-.208.072c-.08%200-.16-.04-.239-.112a2.47%202.47%200%200%201-.287-.375%206.18%206.18%200%200%201-.248-.471c-.622.734-1.405%201.101-2.347%201.101-.67%200-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533%200-.678.239-1.23.726-1.644.487-.415%201.133-.623%201.955-.623.272%200%20.551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28%200-.568.031-.863.103-.295.072-.583.16-.862.272a2.287%202.287%200%200%201-.28.104.488.488%200%200%201-.127.023c-.112%200-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597%200%200%201%20.224-.167c.279-.144.614-.264%201.005-.36a4.84%204.84%200%200%201%201.246-.151c.95%200%201.644.216%202.091.647.439.43.662%201.085.662%201.963v2.586zm-3.24%201.214c.263%200%20.534-.048.822-.144.287-.096.543-.271.758-.51.128-.152.224-.32.272-.512.047-.191.08-.423.08-.694v-.335a6.66%206.66%200%200%200-.735-.136%206.02%206.02%200%200%200-.75-.048c-.535%200-.926.104-1.19.32-.263.215-.39.518-.39.917%200%20.375.095.655.295.846.191.2.47.296.838.296zm6.41.862c-.144%200-.24-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586%205.55a1.398%201.398%200%200%201-.072-.32c0-.128.064-.2.191-.2h.783c.151%200%20.255.025.31.08.065.048.113.16.16.312l1.342%205.284%201.245-5.284c.04-.16.088-.264.151-.312a.549.549%200%200%201%20.32-.08h.638c.152%200%20.256.025.32.08.063.048.12.16.151.312l1.261%205.348%201.381-5.348c.048-.16.104-.264.16-.312a.52.52%200%200%201%20.311-.08h.743c.127%200%20.2.065.2.2%200%20.04-.009.08-.017.128a1.137%201.137%200%200%201-.056.2l-1.923%206.17c-.048.16-.104.263-.168.311a.51.51%200%200%201-.303.08h-.687c-.151%200-.255-.024-.32-.08-.063-.056-.119-.16-.15-.32l-1.238-5.148-1.23%205.14c-.04.16-.087.264-.15.32-.065.056-.177.08-.32.08zm10.256.215c-.415%200-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563%200%200%201-.048-.224v-.407c0-.167.064-.247.183-.247.048%200%20.096.008.144.024.048.016.12.048.2.08.271.12.566.215.878.279.319.064.63.096.95.096.502%200%20.894-.088%201.165-.264a.86.86%200%200%200%20.415-.758.777.777%200%200%200-.215-.559c-.144-.151-.416-.287-.807-.415l-1.157-.36c-.583-.183-1.014-.454-1.277-.813a1.902%201.902%200%200%201-.4-1.158c0-.335.073-.63.216-.886.144-.255.335-.479.575-.654.24-.184.51-.32.83-.415.32-.096.655-.136%201.006-.136.175%200%20.359.008.535.032.183.024.35.056.518.088.16.04.312.08.455.127.144.048.256.096.336.144a.69.69%200%200%201%20.24.2.43.43%200%200%201%20.071.263v.375c0%20.168-.064.256-.184.256a.83.83%200%200%201-.303-.096%203.652%203.652%200%200%200-1.532-.311c-.455%200-.815.071-1.062.223-.248.152-.375.383-.375.71%200%20.224.08.416.24.567.159.152.454.304.877.44l1.134.358c.574.184.99.44%201.237.767.247.327.367.702.367%201.117%200%20.343-.072.655-.207.926-.144.272-.336.511-.583.703-.248.2-.543.343-.886.447-.36.111-.734.167-1.142.167zM21.698%2016.207c-2.626%201.94-6.442%202.969-9.722%202.969-4.598%200-8.74-1.7-11.87-4.526-.247-.223-.024-.527.272-.351%203.384%201.963%207.559%203.153%2011.877%203.153%202.914%200%206.114-.607%209.06-1.852.439-.2.814.287.383.607zM22.792%2014.961c-.336-.43-2.22-.207-3.074-.103-.255.032-.295-.192-.063-.36%201.5-1.053%203.967-.75%204.254-.399.287.36-.08%202.826-1.485%204.007-.215.184-.423.088-.327-.151.32-.79%201.03-2.57.695-2.994z'/%3e%3c/svg%3e",
  Yht =
    "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2034%2027'%3e%3cpath%20fill='%23EA4335'%20d='M21.85,7.41l1,0,2.85-2.85.14-1.21A12.81,12.81,0,0,0,5,9.6a1.55,1.55,0,0,1,1-.06l5.7-.94s.29-.48.44-.45a7.11,7.11,0,0,1,9.73-.74Z'/%3e%3cpath%20fill='%234285F4'%20d='M29.76,9.6a12.84,12.84,0,0,0-3.87-6.24l-4,4A7.11,7.11,0,0,1,24.5,13v.71a3.56,3.56,0,1,1,0,7.12H17.38l-.71.72v4.27l.71.71H24.5A9.26,9.26,0,0,0,29.76,9.6Z'/%3e%3cpath%20fill='%2334A853'%20d='M10.25,26.49h7.12v-5.7H10.25a3.54,3.54,0,0,1-1.47-.32l-1,.31L4.91,23.63l-.25,1A9.21,9.21,0,0,0,10.25,26.49Z'/%3e%3cpath%20fill='%23FBBC05'%20d='M10.25,8A9.26,9.26,0,0,0,4.66,24.6l4.13-4.13a3.56,3.56,0,1,1,4.71-4.71l4.13-4.13A9.25,9.25,0,0,0,10.25,8Z'/%3e%3c/svg%3e",
  Wf = {
    aws: { src: Xht, bg: "#FF9900", alt: "AWS", scale: 0.68 },
    gcp: { src: Yht, bg: "#FFFFFF", alt: "Google Cloud", scale: 0.62 },
  };
function Hj({ provider: t, size: e = 16, className: n, style: r }) {
  const i = Wf[t];
  return N.jsx("span", {
    className: _n("inline-flex items-center justify-center shrink-0", n),
    style: {
      width: e,
      height: e,
      background: i.bg,
      borderRadius: e * 0.2,
      ...r,
    },
    children: N.jsx("img", {
      src: i.src,
      alt: i.alt,
      style: { width: e * i.scale, height: e * i.scale },
    }),
  });
}
function Jht({ size: t = 22, className: e }) {
  const n =
      "rounded-full ring-[2.5px] ring-bg-100 inline-flex items-center justify-center shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.08)] transition-[margin] duration-200 ease-out",
    r = -Math.round(t * 0.45);
  return N.jsxs("span", {
    className: _n("inline-flex items-center shrink-0 isolate", e),
    style: { "--stack-gap": `${r}px` },
    children: [
      N.jsx("span", {
        className: n,
        style: { width: t, height: t, backgroundColor: Wf.aws.bg, zIndex: 0 },
        children: N.jsx("img", {
          src: Wf.aws.src,
          alt: Wf.aws.alt,
          style: { width: t * Wf.aws.scale },
        }),
      }),
      N.jsx("span", {
        className: n,
        style: {
          width: t,
          height: t,
          backgroundColor: Wf.gcp.bg,
          zIndex: 1,
          marginLeft: "var(--stack-gap)",
        },
        children: N.jsx("img", {
          src: Wf.gcp.src,
          alt: Wf.gcp.alt,
          style: { width: t * Wf.gcp.scale },
        }),
      }),
    ],
  });
}
function Qht() {
  const t = Jd(),
    { draft: e, trigger: n } = cs(),
    r =
      e.aws_role_arn && e.aws_region
        ? { aws_role_arn: e.aws_role_arn, aws_region: e.aws_region }
        : null,
    i = vn((c) => c.setModel),
    [s, o] = I.useState({ kind: "testing" }),
    a = () => t("/auth/3p");
  (I.useEffect(() => {
    if (s.kind !== "success") return;
    const c = setTimeout(() => t("/"), 1e3);
    return () => clearTimeout(c);
  }, [s, t]),
    I.useEffect(() => {
      if (!r) {
        o({
          kind: "error",
          message:
            "Connection settings missing. Go back and fill in your role ARN.",
        });
        return;
      }
      l(r, !1);
    }, []));
  async function l(c, u) {
    (o({ kind: "testing" }),
      Ft("third_party_connect_attempted", {
        provider: "bedrock",
        trigger: n ?? "manual",
      }));
    try {
      const d = await TV({ interactive: u }),
        { profile: f, model: h } = await cit(c, d);
      (await cr.getState().setProfile(f),
        await cr.getState().setCustomerConfig(cs.getState().draft),
        i(h),
        Ft("third_party_connect_completed", { provider: "bedrock" }),
        o({ kind: "success" }));
    } catch (d) {
      const f = d instanceof Error ? d.message : String(d),
        [h, m] = w6e(f);
      (Ft("third_party_connect_failed", { provider: "bedrock", reason: h }),
        o({ kind: "error", message: m, raw: f }));
    }
  }
  return N.jsxs("main", {
    className:
      "relative h-full flex flex-col items-center justify-center px-6 text-center",
    children: [
      s.kind === "testing" &&
        N.jsxs(N.Fragment, {
          children: [
            N.jsx("div", {
              className:
                "w-10 h-10 border-3 border-border-200 border-t-text-100 rounded-full animate-spin mb-4",
            }),
            N.jsx("h2", {
              className: "font-heading text-text-100 mb-1",
              children: "Testing connection…",
            }),
            N.jsx("p", {
              className: "font-small text-text-400",
              children: "Reaching AWS Bedrock",
            }),
          ],
        }),
      s.kind === "success" &&
        N.jsxs(N.Fragment, {
          children: [
            N.jsxs("div", {
              className: "relative mb-4",
              children: [
                N.jsx(Hj, { provider: "aws", size: 40 }),
                N.jsx("div", {
                  className:
                    "absolute -right-1.5 -bottom-1.5 w-[22px] h-[22px] rounded-full bg-[#2EA043] border-2 border-bg-100 flex items-center justify-center",
                  children: N.jsx(Yv, {
                    size: 12,
                    color: "#fff",
                    weight: "fill",
                  }),
                }),
              ],
            }),
            N.jsx("h2", {
              className: "font-heading text-text-100 mb-1",
              children: "Connected",
            }),
            N.jsx("div", {
              className: "absolute left-4 right-4 bottom-4 max-w-sm mx-auto",
              children: N.jsx(Dr, {
                onClick: () => t("/"),
                className: "w-full",
                children: "Continue",
              }),
            }),
          ],
        }),
      s.kind === "error" &&
        N.jsx(uq, {
          provider: "bedrock",
          message: s.message,
          raw: s.raw,
          context: r ?? void 0,
          onBack: a,
          onRetry: () => r && void l(r, !0),
        }),
    ],
  });
}
function ept() {
  const t = Jd(),
    { draft: e, trigger: n } = cs(),
    r =
      e.gateway_url && e.gateway_token
        ? {
            gateway_url: e.gateway_url,
            gateway_token: e.gateway_token,
            gateway_auth_header: e.gateway_auth_header,
          }
        : null,
    i = vn((h) => h.setModel),
    [s, o] = I.useState({ kind: "testing" }),
    [a, l] = I.useState(""),
    c = () => t("/auth/3p");
  (I.useEffect(() => {
    if (s.kind !== "success") return;
    const h = setTimeout(() => t("/"), 1e3);
    return () => clearTimeout(h);
  }, [s, t]),
    I.useEffect(() => {
      if (!r) {
        o({
          kind: "error",
          message:
            "Connection settings missing. Go back and fill in your gateway details.",
        });
        return;
      }
      u(r);
    }, []));
  async function u(h) {
    (o({ kind: "testing" }),
      Ft("third_party_connect_attempted", {
        provider: "gateway",
        trigger: n ?? "manual",
      }));
    const m = await JV(h.gateway_url, h.gateway_token, {
      auth: HU(h.gateway_auth_header),
    });
    if (m.status === "ok" && m.verified) {
      await d(h, m.verified);
      return;
    }
    if (m.status === "ok" || m.status === "no-supported-models") {
      (Ft("third_party_model_discovery_failed", { provider: "gateway" }),
        o({ kind: "enter-model" }));
      return;
    }
    (Ft("third_party_connect_failed", {
      provider: "gateway",
      reason: m.status,
    }),
      o({ kind: "error", message: t3e[m.status], raw: m.raw }));
  }
  async function d(h, m, g) {
    (await cr
      .getState()
      .setProfile({
        kind: "gateway",
        url: h.gateway_url,
        token: h.gateway_token,
        authHeader: HU(h.gateway_auth_header),
        manualModel: g,
      }),
      await cr.getState().setCustomerConfig(cs.getState().draft),
      i(m),
      Ft("third_party_connect_completed", { provider: "gateway" }),
      o({ kind: "success" }));
  }
  function f(h) {
    h.preventDefault();
    const m = a.trim();
    if (!(!r || !m)) {
      if (!n3e(m)) {
        o({
          kind: "error",
          message: "Unsupported model — use Claude Opus or Sonnet 4.5 or later",
        });
        return;
      }
      d(r, m, m);
    }
  }
  return N.jsxs("main", {
    className:
      "relative h-full flex flex-col items-center justify-center px-6 text-center",
    children: [
      s.kind === "testing" &&
        N.jsxs(N.Fragment, {
          children: [
            N.jsx("div", {
              className:
                "w-10 h-10 border-3 border-border-200 border-t-text-100 rounded-full animate-spin mb-4",
            }),
            N.jsx("h2", {
              className: "font-heading text-text-100 mb-1",
              children: "Testing connection…",
            }),
            N.jsx("p", {
              className: "font-small text-text-400",
              children: "Reaching your gateway",
            }),
          ],
        }),
      s.kind === "enter-model" &&
        N.jsxs("form", {
          onSubmit: f,
          className: "flex flex-col gap-4 items-center w-full max-w-[256px]",
          children: [
            N.jsx("h2", {
              className: "font-heading text-text-100",
              children: "Enter model name",
            }),
            N.jsx("p", {
              className: "font-small text-text-400 text-left",
              children:
                "Could not retrieve the model list from your gateway. Enter the model name to use:",
            }),
            N.jsx(bh, {
              "aria-label": "Model name",
              type: "text",
              value: a,
              onChange: (h) => l(h.target.value),
              placeholder: "claude-sonnet-4-6",
              autoFocus: !0,
              className: "h-10",
            }),
            N.jsx(Dr, {
              type: "submit",
              disabled: !a.trim(),
              className: "w-full",
              children: "Continue",
            }),
            N.jsx("button", {
              type: "button",
              onClick: c,
              className:
                "font-small text-text-300 hover:text-text-100 underline",
              children: "Back",
            }),
          ],
        }),
      s.kind === "success" &&
        N.jsxs(N.Fragment, {
          children: [
            N.jsx("div", {
              className:
                "w-10 h-10 rounded-full bg-[rgba(46,160,67,0.12)] flex items-center justify-center mb-4",
              children: N.jsx(Yv, {
                size: 24,
                className: "text-[#2EA043]",
                weight: "fill",
              }),
            }),
            N.jsx("h2", {
              className: "font-heading text-text-100 mb-1",
              children: "Connected",
            }),
            N.jsx("div", {
              className: "absolute left-4 right-4 bottom-4 max-w-sm mx-auto",
              children: N.jsx(Dr, {
                onClick: () => t("/"),
                className: "w-full",
                children: "Continue",
              }),
            }),
          ],
        }),
      s.kind === "error" &&
        N.jsx(uq, {
          provider: "gateway",
          message: s.message,
          raw: s.raw,
          context: r ?? void 0,
          onBack: c,
          onRetry: () => r && void u(r),
        }),
    ],
  });
}
function X5e({
  onSubmit: t,
  onBack: e,
  submitting: n,
  error: r,
  onPreflightFail: i,
}) {
  const [s, o] = I.useState(""),
    [a, l] = I.useState(null),
    c = I.useRef(null);
  I.useEffect(() => {
    const p = () => c.current?.focus();
    return (
      p(),
      window.addEventListener("focus", p),
      () => window.removeEventListener("focus", p)
    );
  }, []);
  const u = (p) => {
      const y = p.indexOf(vg);
      return y > 0 && p.length - y > 20;
    },
    d = (p) =>
      u(p)
        ? null
        : p.includes(vg)
          ? "That code looks incomplete. Make sure you copied the whole thing from the sign-in tab."
          : "That doesn't look like the full code. Go back to the sign-in tab and click the code box to copy it — don't select the text manually.",
    f = (p) => {
      const y = p.clipboardData.getData("text");
      u(y) && (p.preventDefault(), o(y), t(y, "onpaste"));
    },
    h = async () => {
      if (!n)
        try {
          const p = await navigator.clipboard.readText();
          (o(p), u(p) && t(p, "clipboard_button"));
        } catch {}
    },
    m = (p) => {
      p.preventDefault();
      const y = s.trim();
      if (!y) return;
      const b = d(y);
      if (b) {
        (l(b), i?.(y.length));
        return;
      }
      t(y, "manual_continue");
    },
    g = r ?? a;
  return N.jsxs("form", {
    onSubmit: m,
    className: "w-full flex flex-col gap-3",
    children: [
      N.jsxs("p", {
        className: "font-small text-text-300",
        children: [
          "A new tab opened. After you sign in, ",
          N.jsx("strong", { children: "click the code box to copy" }),
          " and paste it here.",
        ],
      }),
      N.jsxs("div", {
        className: "flex gap-2",
        children: [
          N.jsx("input", {
            ref: c,
            type: "text",
            value: s,
            onChange: (p) => {
              (o(p.target.value), l(null));
            },
            onPaste: f,
            placeholder: "Paste code here",
            autoComplete: "off",
            autoCorrect: "off",
            spellCheck: !1,
            disabled: n,
            className:
              "flex-1 h-9 px-3 bg-bg-200 border border-border-300 rounded-lg font-mono text-xs focus:outline-none focus:border-accent-brand disabled:opacity-50",
          }),
          N.jsx("button", {
            type: "button",
            onClick: h,
            disabled: n,
            title: "Paste from clipboard",
            className:
              "h-9 w-9 flex items-center justify-center bg-bg-200 border border-border-300 rounded-lg hover:border-accent-brand disabled:opacity-50",
            children: N.jsx(mbe, { size: 16 }),
          }),
        ],
      }),
      g &&
        N.jsx("p", {
          className: "font-small text-danger-200 text-left",
          children: g,
        }),
      N.jsx("button", {
        type: "submit",
        disabled: !s.trim() || n,
        className:
          "h-9 px-4 bg-text-100 text-bg-100 rounded-lg hover:bg-text-200 transition-colors font-base-bold disabled:opacity-50",
        children: n ? "Signing in…" : "Continue",
      }),
      N.jsx("button", {
        type: "button",
        onClick: e,
        className: "font-small text-text-300 hover:text-text-100 underline",
        children: "Start over",
      }),
    ],
  });
}
function tpt() {
  const t = Jd(),
    { draft: e, trigger: n } = cs(),
    r =
      e.gcp_project_id && e.google_client_id && e.google_client_secret
        ? {
            gcp_project_id: e.gcp_project_id,
            gcp_region: e.gcp_region || pj[0],
            google_client_id: e.google_client_id,
            google_client_secret: e.google_client_secret,
          }
        : null,
    i = vn((u) => u.setModel),
    [s, o] = I.useState(null),
    a = () => t("/auth/3p");
  (I.useEffect(() => {
    if (s?.kind !== "success") return;
    const u = setTimeout(() => t("/"), 1e3);
    return () => clearTimeout(u);
  }, [s, t]),
    I.useEffect(() => {
      if (!r) {
        o({
          kind: "error",
          message:
            "Connection settings missing. Go back and fill in your project details.",
        });
        return;
      }
      const u = m1(),
        { url: d, state: f } = Nie(r, u);
      (o({ kind: "paste", state: f }), cu(d));
    }, []));
  async function l(u) {
    if (!s || s.kind !== "paste") return;
    const d = u.indexOf(vg);
    if (d === -1) {
      o({
        kind: "error",
        message: "Invalid code format. Copy the full code from the browser.",
      });
      return;
    }
    const f = u.slice(0, d).trim();
    if (u.slice(d + 1).trim() !== s.state) {
      o({ kind: "error", message: "State mismatch — try connecting again." });
      return;
    }
    (o({ kind: "testing" }),
      Ft("third_party_connect_attempted", {
        provider: "vertex",
        trigger: n ?? "manual",
      }));
    try {
      const { profile: m, model: g } = await Yit(f, r, m1());
      (await cr.getState().setProfile(m),
        await cr.getState().setCustomerConfig(cs.getState().draft),
        i(g),
        Ft("third_party_connect_completed", { provider: "vertex" }),
        o({ kind: "success" }));
    } catch (m) {
      const g = m instanceof Error ? m.message : String(m),
        [p, y] = L6e(g);
      (Ft("third_party_connect_failed", { provider: "vertex", reason: p }),
        o({ kind: "error", message: y, raw: g }));
    }
  }
  function c() {
    if (!r) return t("/auth/3p");
    const u = m1(),
      { url: d, state: f } = Nie(r, u);
    (o({ kind: "paste", state: f }), cu(d));
  }
  return s
    ? N.jsxs("main", {
        className:
          "relative h-full flex flex-col items-center justify-center px-6 text-center",
        children: [
          s.kind === "paste" &&
            N.jsxs(N.Fragment, {
              children: [
                N.jsx("div", {
                  className: "relative mb-4",
                  children: N.jsx(Hj, { provider: "gcp", size: 40 }),
                }),
                N.jsx("h2", {
                  className: "font-heading text-text-100 mb-3",
                  children: "Sign in with Google",
                }),
                N.jsx("div", {
                  className: "w-full max-w-xs",
                  children: N.jsx(X5e, {
                    onSubmit: (u) => {
                      l(u);
                    },
                    onBack: a,
                    submitting: !1,
                    error: null,
                    onPreflightFail: () =>
                      Ft("third_party_connect_failed", {
                        provider: "vertex",
                        reason: "malformed_paste",
                      }),
                  }),
                }),
              ],
            }),
          s.kind === "testing" &&
            N.jsxs(N.Fragment, {
              children: [
                N.jsx("div", {
                  className:
                    "w-10 h-10 border-3 border-border-200 border-t-text-100 rounded-full animate-spin mb-4",
                }),
                N.jsx("h2", {
                  className: "font-heading text-text-100 mb-1",
                  children: "Testing connection…",
                }),
                N.jsx("p", {
                  className: "font-small text-text-400",
                  children: "Reaching GCP Vertex",
                }),
              ],
            }),
          s.kind === "success" &&
            N.jsxs(N.Fragment, {
              children: [
                N.jsxs("div", {
                  className: "relative mb-4",
                  children: [
                    N.jsx(Hj, { provider: "gcp", size: 40 }),
                    N.jsx("div", {
                      className:
                        "absolute -right-1.5 -bottom-1.5 w-[22px] h-[22px] rounded-full bg-[#2EA043] border-2 border-bg-100 flex items-center justify-center",
                      children: N.jsx(Yv, {
                        size: 12,
                        color: "#fff",
                        weight: "fill",
                      }),
                    }),
                  ],
                }),
                N.jsx("h2", {
                  className: "font-heading text-text-100 mb-1",
                  children: "Connected",
                }),
                N.jsx("div", {
                  className:
                    "absolute left-4 right-4 bottom-4 max-w-sm mx-auto",
                  children: N.jsx(Dr, {
                    onClick: () => t("/"),
                    className: "w-full",
                    children: "Continue",
                  }),
                }),
              ],
            }),
          s.kind === "error" &&
            N.jsx(uq, {
              provider: "vertex",
              message: s.message,
              raw: s.raw,
              context: r ?? void 0,
              onBack: a,
              onRetry: c,
            }),
        ],
      })
    : null;
}
const npt = {
    sheet: "ms-excel:ofe|u|",
    slide: "ms-powerpoint:ofe|u|",
    doc: "ms-word:ofe|u|",
  },
  rpt = { sheet: "Excel", slide: "PowerPoint", doc: "Word" };
function ipt() {
  const { sendAnalytics: t } = rd(),
    [e, n] = I.useState(!1),
    [r, i] = I.useState(!1),
    {
      code: s,
      state: o,
      error: a,
      errorDescription: l,
      adminConsent: c,
    } = I.useMemo(() => {
      const w = new URLSearchParams(window.location.search);
      return {
        code: w.get("code"),
        state: w.get("state"),
        error: w.get("error"),
        errorDescription: w.get("error_description"),
        adminConsent: w.get("admin_consent") === "True",
      };
    }, []),
    u = I.useMemo(() => Sit(o), [o]),
    d = I.useMemo(() => D6e(o), [o]),
    f = s && o ? `${s}${vg}${o}` : null,
    h = u ? rpt[u.surface] : void 0,
    m = h ? `Claude for ${h}` : "the Claude add-in",
    g = u?.platform === "Mac" ? npt[u.surface] : void 0;
  I.useEffect(() => {
    const w = a ? "idp_error" : s && o ? "success" : "missing_params";
    (Ft("oauth_callback_landed", {
      outcome: w,
      idp_error_code: a ?? void 0,
      hints_decoded: !!u,
      platform: u?.platform,
      flow_id: d,
    }),
      w === "idp_error" &&
        Ft("oauth_login_failed", {
          reason: "idp_error",
          error_message: l || a || void 0,
          flow_id: d,
        }),
      t("sheets.funnel.oauth_callback", {
        surface: u?.surface,
        vendor: u?.vendor,
        has_code: !!s,
        has_error: !!a,
        platform: u?.platform,
        flow_id: d,
      }));
  }, [t, u, d, s, o, a, l]);
  const p = async () => {
    if (f) {
      try {
        await navigator.clipboard.writeText(f);
      } catch {
        (i(!0),
          Ft("oauth_code_copied", {
            ms_protocol_fired: !1,
            clipboard_write_failed: !0,
            flow_id: d,
          }));
        return;
      }
      (n(!0),
        Ft("oauth_code_copied", {
          ms_protocol_fired: !!g,
          clipboard_write_failed: !1,
          flow_id: d,
        }),
        t("sheets.auth.callback_code_copied", {
          surface: u?.surface,
          vendor: u?.vendor,
          flow_id: d,
        }),
        setTimeout(
          () => navigator.clipboard.writeText("").catch(() => void 0),
          6e4,
        ),
        g && setTimeout(() => open(g, "_self"), 200));
    }
  };
  if (a)
    return N.jsxs("div", {
      className:
        "h-full flex flex-col items-center justify-center text-center font-ui-serif px-6",
      children: [
        N.jsx("p", {
          className: "font-title text-text-100 mb-2",
          children: "Sign-in failed",
        }),
        N.jsx("p", { className: "font-small text-text-300", children: l || a }),
        N.jsxs("p", {
          className: "font-small text-text-400 mt-6",
          children: ["You can close this tab and try again from ", m, "."],
        }),
      ],
    });
  if (c)
    return N.jsx("div", {
      className:
        "h-full flex flex-col items-center justify-center text-center font-ui-serif px-6",
      children: N.jsx("p", {
        className: "font-small text-text-300",
        children: "Admin consent granted. You can close this tab.",
      }),
    });
  if (!f)
    return N.jsx("div", {
      className:
        "h-full flex flex-col items-center justify-center text-center font-ui-serif px-6",
      children: N.jsx("p", {
        className: "font-small text-text-300",
        children: "No authorization code in response.",
      }),
    });
  const y = r
      ? "Copy this code manually"
      : e
        ? g
          ? "Copied — switching back…"
          : "Copied"
        : "Almost done",
    b = r
      ? `Select the code below, copy it, then paste into ${m}.`
      : e
        ? `Switch back to ${m} and paste to finish signing in.`
        : `Click the button, then paste into ${m} to finish signing in.`;
  return N.jsxs("div", {
    className:
      "h-full flex flex-col items-center justify-center text-center font-ui-serif px-6 max-w-lg mx-auto",
    children: [
      N.jsx("p", { className: "font-title text-text-100 mb-3", children: y }),
      N.jsx("p", { className: "font-base text-text-300 mb-10", children: b }),
      r
        ? N.jsx("code", {
            className:
              "font-mono text-xs text-text-200 bg-white border border-border-300 rounded-lg p-4 mb-10 break-all select-all text-left w-full",
            children: f,
          })
        : N.jsx(Dr, {
            type: "button",
            variant: "primary",
            size: "lg",
            onClick: p,
            className: "mb-10 gap-2",
            children: e
              ? N.jsxs(N.Fragment, {
                  children: [
                    N.jsx(Wg, { size: 20 }),
                    N.jsx("span", { children: "Copied" }),
                  ],
                })
              : N.jsxs(N.Fragment, {
                  children: [
                    N.jsx(SW, { size: 20 }),
                    N.jsx("span", { children: "Copy sign-in code" }),
                  ],
                }),
          }),
      N.jsxs("p", {
        className: "font-small text-text-400",
        children: ["Only paste this into ", m, ". Never share this code."],
      }),
    ],
  });
}
const spt = "/m-addin/assets/ObjectDocumentLined-DEcjVh-z.svg";
function dq({ className: t }) {
  return N.jsx("img", { src: spt, alt: "Document", className: t });
}
function fq({ className: t }) {
  return N.jsxs("svg", {
    width: "52",
    height: "47",
    viewBox: "0 0 51.8876 47.4352",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className: t,
    children: [
      N.jsx("title", { children: "Presentation" }),
      N.jsx("path", {
        d: "M36.8626 9.39701H15.3967V15.8631H36.8626V9.39701Z",
        fill: "#E3DACC",
      }),
      N.jsx("path", {
        d: "M1.30061 23.2555C1.29822 27.0736 1.34837 27.0736 1.34598 30.8916C1.34598 31.8992 1.34837 32.6406 1.35434 33.2626C1.35553 33.4178 1.35672 33.5659 1.35911 33.7091C1.35911 33.7414 1.35911 33.7724 1.35911 33.8035V33.819L1.36269 33.8488C1.36389 33.8667 1.36627 33.8846 1.36747 33.9026C1.3806 33.9073 1.40567 33.9014 1.42239 33.9014C1.43671 33.9002 1.45104 33.899 1.46656 33.8966C1.56446 33.8954 1.66474 33.8942 1.76861 33.893C2.005 33.8906 2.26049 33.8894 2.54463 33.887C3.11411 33.887 3.80178 33.8846 4.70197 33.8835C7.24652 33.8866 9.79147 33.8902 12.3368 33.8942C16.1536 33.9002 16.1536 33.9825 19.9705 33.9885C23.7873 33.9945 23.7873 33.8417 27.6041 33.8476C31.421 33.8536 31.4222 33.9825 35.239 33.9885C36.1941 33.9897 36.9092 33.9849 37.5062 33.9754C38.1055 33.9646 38.5854 33.9551 39.0654 33.9455C40.0205 33.924 40.9744 33.9037 42.8834 33.9121C44.7912 33.9205 45.7451 33.9455 46.699 33.9706C47.1754 33.9825 47.6529 33.9945 48.2487 34.0028C48.5459 34.0052 48.8743 34.0076 49.2456 34.0112C49.4318 34.0112 49.6276 34.0112 49.8377 34.0112C49.9822 34.0112 50.135 34.0088 50.2986 34.0076C50.3248 34.0076 50.3487 34.0064 50.3678 34.0052C50.3809 34.0076 50.3762 33.9945 50.3774 33.9909C50.3774 33.9849 50.3774 33.9813 50.3774 33.9802C50.3977 32.6012 50.4084 31.8491 50.4191 31.0659C50.4347 30.155 50.449 29.207 50.4597 27.4568C50.4824 23.6376 50.3296 23.6364 50.3499 19.8184C50.369 16.0004 50.4144 16.0004 50.4299 12.1823C50.4418 8.36431 50.5063 8.36431 50.5027 4.54868C50.5015 4.07232 50.5003 3.65565 50.4991 3.28316C50.4991 3.09692 50.4991 2.92261 50.4991 2.75666C50.4967 2.5931 50.4955 2.43909 50.4944 2.29225C50.4944 2.25643 50.4944 2.22181 50.4944 2.18718V2.16689C50.4944 2.15495 50.4944 2.14301 50.4944 2.13107C50.4944 2.10839 50.4824 2.0869 50.4645 2.07496C50.4478 2.06063 50.4251 2.06063 50.4048 2.05825H50.3893L50.3475 2.05347L50.1684 2.04153C49.2145 1.97826 48.2618 1.91498 46.3528 1.80873C42.536 1.59383 42.53 1.69292 38.712 1.47802C38.5926 1.47086 38.4768 1.46489 38.3657 1.45892C38.3096 1.45534 38.2547 1.45295 38.1998 1.44937L38.1592 1.44698H38.1568C38.1389 1.68217 38.1783 1.12702 38.1735 1.18313H38.1676C38.1676 1.30013 38.1676 0.919286 38.1676 1.44579H38.09C37.8798 1.44579 37.6817 1.44579 37.4954 1.44579C37.1229 1.44579 36.7946 1.44698 36.4961 1.44817C35.8992 1.45056 35.4228 1.45295 34.9453 1.45534C33.9914 1.45773 33.0363 1.46131 31.1285 1.46608C27.3092 1.46608 27.3092 1.39684 23.49 1.39684C20.9439 1.40082 18.3977 1.40519 15.8516 1.40997C12.0324 1.40997 12.0324 1.34192 8.21316 1.34192C6.32445 1.34192 5.37054 1.37893 4.4238 1.41594C3.95102 1.43504 3.48063 1.45295 2.89563 1.46728C2.60313 1.47205 2.28317 1.47802 1.92023 1.48518H1.81995L1.81875 1.48638C1.81875 1.48638 1.81756 1.48757 1.81637 1.48877C1.81637 1.49115 1.81637 1.49235 1.81637 1.49474C1.81637 1.49474 1.81637 1.49474 1.81637 1.49593C1.78891 3.37987 1.77458 4.32184 1.76145 5.26381C1.74951 6.21772 1.73757 7.17162 1.71489 9.08064C1.66833 12.901 1.58475 12.8999 1.54177 16.7203C1.50914 19.2688 1.47651 21.8173 1.44388 24.3659C1.40925 28.1887 1.37105 28.1887 1.34598 32.0103C1.33046 34.9603 1.09407 35.0558 0.720386 35.057C0.350284 35.057 -0.0150428 34.9567 0.000477601 32.0019C0.025549 28.1815 0.0792735 28.1827 0.113896 24.3647C0.150906 20.5478 0.245223 20.549 0.285814 16.7322C0.328794 12.9142 0.252386 12.913 0.298947 9.09496C0.322825 7.18595 0.325212 6.23204 0.3276 5.27694C0.329988 4.79939 0.332376 4.32184 0.335957 3.72609C0.339539 3.42762 0.341927 3.09931 0.346702 2.72682C0.352672 2.35075 0.359835 1.92931 0.366998 1.44698C0.369386 1.30133 0.372968 1.15806 0.372968 1.15448C0.382519 0.930031 0.441019 0.74498 0.543692 0.577837C0.645172 0.411888 0.788437 0.278174 0.947223 0.188633C1.1084 0.0990919 1.27315 0.0513368 1.45701 0.0417857C1.63131 0.0358163 1.86173 0.0405919 1.91188 0.039398C2.27243 0.039398 2.59119 0.039398 2.88131 0.0405919C3.46272 0.0417857 3.93311 0.0429796 4.40469 0.0441735C5.34905 0.0453674 6.30415 0.0465612 8.17496 0.048949C10.7203 0.0561123 13.2653 0.0632755 15.8098 0.0704388C19.629 0.0704388 19.629 0.152816 23.447 0.152816C27.2651 0.152816 27.2651 0.102674 31.0819 0.102674C32.9909 0.102674 33.946 0.0776021 34.9011 0.0513368C35.3787 0.0382041 35.8562 0.0262653 36.452 0.0155204C36.7504 0.0119388 37.0787 0.00835715 37.4512 0.00358163C37.6375 0.00358163 37.8357 0.00119388 38.0458 0C38.0721 0 38.0983 0 38.1258 0H38.1664L38.2607 0.00358163C38.3144 0.00596939 38.3705 0.00955102 38.4254 0.0119388C38.5377 0.0179082 38.6523 0.0250714 38.7717 0.0310408C42.5813 0.244745 42.5718 0.38801 46.3826 0.601714C48.2881 0.709164 49.242 0.725878 50.1971 0.742592L50.3762 0.746174L50.4788 0.748561C50.5361 0.750949 50.5946 0.753337 50.6531 0.754531C50.8919 0.756919 51.108 0.805868 51.3026 0.930031C51.4972 1.05061 51.662 1.24044 51.7527 1.46847C51.7969 1.58189 51.8279 1.70366 51.8351 1.84454C51.8387 1.96393 51.8422 2.0857 51.847 2.20987C51.853 2.36149 51.8578 2.52147 51.8649 2.68981C51.8685 2.85695 51.8721 3.03245 51.8757 3.21989C51.8816 3.59357 51.8876 4.01382 51.8876 4.49137C51.89 8.31417 51.742 8.31297 51.73 12.1334C51.7157 15.9538 51.7778 15.9538 51.7587 19.773C51.7384 23.5934 51.816 23.5934 51.7921 27.4138C51.7814 29.2106 51.7408 30.1621 51.699 31.0683C51.6775 31.522 51.6572 31.9637 51.6381 32.495C51.6309 32.76 51.6226 33.0489 51.613 33.3713C51.6094 33.5325 51.6059 33.7032 51.6023 33.8835C51.5987 34.2046 51.5951 34.5437 51.5903 34.9042C51.5474 34.9341 51.5008 34.9663 51.4518 35.0009C51.4005 35.0379 51.3396 35.0534 51.2775 35.0833C51.2143 35.1084 51.1498 35.1418 51.0698 35.1669L51.0101 35.1872C50.991 35.1943 50.9707 35.2015 50.9456 35.2015C50.8979 35.2039 50.8489 35.2063 50.8 35.2098C50.6937 35.2122 50.5887 35.2146 50.486 35.217C50.3965 35.2182 50.3081 35.2194 50.221 35.2206C50.1075 35.2218 49.9989 35.223 49.8926 35.2242C49.6813 35.2266 49.4831 35.2278 49.2957 35.2301C48.922 35.2337 48.5937 35.2373 48.294 35.2409C47.6971 35.2504 47.2184 35.2576 46.7408 35.266C45.7857 35.2827 44.8306 35.2994 42.9204 35.291C41.0102 35.2827 40.0551 35.291 39.1 35.2994C38.6248 35.303 38.1509 35.3066 37.5575 35.3113C36.9606 35.3125 36.2442 35.3149 35.2891 35.3161C31.4699 35.3101 31.4687 35.2349 27.6495 35.2289C23.8291 35.223 23.8291 35.1621 20.0087 35.1573C16.1907 35.1514 16.1907 35.3066 12.3714 35.3006C9.82371 35.2878 7.27597 35.2747 4.72823 35.2612C3.82089 35.2576 3.12844 35.2552 2.55538 35.2528C1.84621 35.2469 1.28509 35.2433 0.751427 35.2385C0.66308 35.1991 0.574733 35.1609 0.486386 35.1227L0.353865 35.0654L0.288202 35.0367L0.254774 35.0224L0.251192 35.02C0.125835 35.1454 0.420723 34.8481 0.390876 34.8791V34.8768L0.3861 34.872L0.377743 34.8624C0.324019 34.8004 0.2691 34.7395 0.214182 34.6774L0.116284 34.5675L0.0912123 34.5401L0.0792735 34.5258C0.0792735 34.5258 0.0768858 34.5114 0.0756919 34.5043L0.0685286 34.4111C0.0589776 34.287 0.0482327 34.1616 0.0386817 34.0351C0.0386817 33.9288 0.0386817 33.8202 0.0398756 33.7103C0.0398756 33.5671 0.0422633 33.419 0.0422633 33.2638C0.0434572 32.6418 0.045845 31.9016 0.0494266 30.8976C0.0518144 27.0736 0.103151 27.0736 0.105539 23.2496C0.10912 20.2995 0.345508 20.0989 0.728743 20.1061C0.729937 20.0834 0.731131 20.0607 0.7371 20.0416C0.744264 20.0237 0.756202 20.0046 0.792019 20.0058C0.826641 20.0034 0.891111 20.0524 0.913794 20.118L0.922151 20.1407L0.943641 20.155C0.953192 20.161 0.961549 20.1694 0.9711 20.1765C1.04273 20.2422 1.10362 20.3592 1.15257 20.5681C1.25047 20.9872 1.3018 21.7751 1.3018 23.2508L1.30061 23.2555Z",
        fill: "#141413",
      }),
      N.jsx("path", {
        d: "M36.9068 21.7262C35.7464 21.7453 35.7452 21.6534 34.5859 21.6677C33.4255 21.6784 33.4255 21.6474 32.265 21.6522C31.1046 21.6546 31.1046 21.7501 29.9417 21.7429C28.7789 21.7322 28.7789 21.7716 27.6125 21.7465C26.4401 21.7131 26.4592 21.5602 25.3035 21.5364C24.1514 21.5173 24.1502 21.5638 22.9958 21.5567C21.8401 21.5531 21.8401 21.5698 20.6832 21.5722C19.5264 21.5782 19.5252 21.5208 18.3671 21.5316C17.209 21.5447 17.2102 21.6056 16.0522 21.6223C15.1974 21.6367 15.078 21.3704 15.0708 21.0218C15.0636 20.6744 15.1747 20.4487 16.0331 20.4344C17.1923 20.4165 17.1911 20.2971 18.3504 20.2852C19.5108 20.2744 19.512 20.4082 20.6713 20.4022C21.8317 20.3986 21.8317 20.4225 22.9922 20.4261C24.1538 20.4332 24.155 20.2864 25.319 20.3067C26.4819 20.3294 26.4914 20.4487 27.6364 20.481C28.7873 20.506 28.7873 20.5168 29.9417 20.5275C31.0974 20.5347 31.0974 20.518 32.2531 20.5168C33.41 20.512 33.41 20.4105 34.5668 20.3986C35.7237 20.3843 35.7237 20.3556 36.8806 20.3353C37.7342 20.3198 37.6888 20.6732 37.6972 21.0218C37.7055 21.3692 37.764 21.7107 36.9056 21.7262H36.9068Z",
        fill: "#141413",
      }),
      N.jsx("path", {
        d: "M36.6394 26.7882C35.4849 26.762 35.4873 26.67 34.3316 26.6509C33.176 26.6366 33.176 26.602 32.0215 26.596C30.867 26.5936 30.867 26.6879 29.7137 26.6963C29.1371 26.7023 28.8505 26.7178 28.5628 26.7333C28.2751 26.7476 27.9886 26.7656 27.4155 26.7823C26.2753 26.8264 26.2562 26.6891 25.0958 26.7321C24.5144 26.7512 24.2243 26.7727 23.933 26.7894C23.6428 26.8061 23.3515 26.8288 22.7701 26.8348C22.1875 26.8443 21.8974 26.8503 21.6061 26.8551C21.3148 26.8611 21.0235 26.867 20.4421 26.8646C19.2768 26.8587 19.278 26.8014 18.114 26.7811C16.95 26.756 16.9488 26.8169 15.7824 26.7775C14.9216 26.7441 14.8153 26.4659 14.8344 26.1185C14.8535 25.7699 14.9753 25.5573 15.8265 25.5908C16.9786 25.6302 16.9822 25.5108 18.1331 25.5359C19.2852 25.555 19.284 25.6887 20.4385 25.6946C21.0151 25.6958 21.304 25.7006 21.5918 25.7042C21.8807 25.709 22.1684 25.7137 22.745 25.7042C23.3217 25.697 23.6094 25.6505 23.8959 25.6087C24.1837 25.5669 24.4702 25.5215 25.0457 25.5024C26.1989 25.4606 26.193 25.5633 27.3654 25.5179C27.948 25.5012 28.2405 25.4941 28.5306 25.4929L29.6946 25.4809C30.8586 25.4714 30.8586 25.4571 32.0203 25.4594C33.1831 25.4654 33.1843 25.3663 34.3472 25.3807C35.51 25.3998 35.51 25.3699 36.6728 25.3962C37.5324 25.4177 37.4703 25.7722 37.4596 26.1185C37.4488 26.4671 37.493 26.8073 36.6394 26.787V26.7882Z",
        fill: "#141413",
      }),
      N.jsx("path", {
        d: "M15.651 45.8688C16.5631 44.7048 16.6348 44.7621 17.5565 43.6052C18.0185 43.0274 18.2585 42.7444 18.4996 42.4627C18.7396 42.1785 18.9796 41.8956 19.4595 41.3285C19.9442 40.759 20.1734 40.4641 20.4361 40.1597C20.6713 39.8875 20.9005 39.6129 21.3948 39.0709C22.3797 37.9844 22.3487 37.9546 23.3229 36.8526C23.8088 36.2999 24.0774 36.0456 24.346 35.7913L24.3962 35.7435L24.4236 35.7172L24.469 35.6695C24.5287 35.6062 24.5896 35.5429 24.6529 35.4773C24.777 35.3471 24.906 35.2098 25.0445 35.057C25.1137 34.9806 25.1865 34.9006 25.2629 34.8147C25.3011 34.7717 25.3405 34.7263 25.3799 34.681L25.4098 34.6463L25.4169 34.638C25.4169 34.638 25.4193 34.6296 25.4205 34.638L25.4241 34.6559L25.436 34.7275C25.4444 34.7753 25.4528 34.823 25.4611 34.872L25.4671 34.9078C25.4695 34.9197 25.4719 34.9365 25.4731 34.9329L25.485 34.9412C25.6115 35.0236 25.6987 35.0726 25.7811 35.0833C25.8408 35.0129 25.8957 34.946 25.9482 34.8839C25.9745 34.8529 25.9996 34.8218 26.021 34.7908C26.0246 34.7884 26.027 34.7789 26.0222 34.786C26.021 34.7908 26.0199 34.7956 26.0199 34.8003V34.8278C26.0199 34.8469 26.0199 34.8648 26.0199 34.8827C26.027 35.0272 26.0366 35.1525 26.0449 35.2683C26.0449 35.3316 26.0593 35.3674 26.0819 35.3865C26.1034 35.4104 26.1178 35.445 26.1428 35.4677L26.1619 35.4832C26.1619 35.4904 26.1751 35.4797 26.1858 35.4725L26.218 35.451L26.2825 35.4092C26.3362 35.3591 26.39 35.3101 26.4425 35.26L26.6072 35.106C26.6156 35.1179 26.612 35.1442 26.6156 35.1621L26.6263 35.2839C26.6538 35.6062 26.6813 35.9381 26.7016 36.3631C26.7075 36.5052 26.7135 36.6604 26.7207 36.8383C26.7254 36.9851 26.7278 37.1511 26.729 37.3397C26.729 38.0955 26.7111 38.4751 26.6932 38.8548C26.6837 39.0446 26.6717 39.2344 26.6514 39.472C26.6419 39.5854 26.6323 39.7096 26.6204 39.8516C26.6084 39.9889 26.5965 40.1441 26.5881 40.3244C26.5487 41.0491 26.5296 41.412 26.5093 41.775C26.4902 42.1403 26.4711 42.5056 26.4747 43.2399C26.4914 44.7083 26.5535 44.7083 26.5965 46.1768C26.6347 47.2621 26.3756 47.4173 26.027 47.434C25.6808 47.4507 25.448 47.3122 25.4098 46.2162C25.3656 44.7346 25.245 44.7382 25.2283 43.2518C25.2247 42.508 25.2617 42.1343 25.3011 41.7619C25.3429 41.3882 25.3775 41.0181 25.4193 40.2647C25.4277 40.0773 25.4408 39.9113 25.4552 39.7621C25.4683 39.6141 25.479 39.4804 25.4922 39.3717C25.5148 39.1485 25.5316 38.9706 25.5459 38.7915C25.5722 38.4333 25.5996 38.074 25.5996 37.3517C25.5996 37.1714 25.5948 37.0126 25.5877 36.8717C25.5829 36.8013 25.5793 36.7344 25.5757 36.6723C25.5733 36.6413 25.571 36.6103 25.5686 36.5804C25.5662 36.5721 25.565 36.5673 25.5626 36.5601C25.5471 36.5136 25.528 36.4909 25.5089 36.4837C25.4898 36.4766 25.4719 36.4837 25.4587 36.4933C25.4516 36.498 25.4468 36.504 25.4432 36.5064L25.4408 36.5088L25.436 36.5171C25.436 36.5171 25.4313 36.5255 25.4289 36.5279C25.4205 36.5374 25.4158 36.5327 25.4038 36.5315C25.3978 36.5315 25.3907 36.5303 25.3811 36.5315C25.3656 36.5398 25.3859 36.5064 25.2952 36.5995C25.0313 36.861 24.7687 37.1224 24.2804 37.6776C23.3014 38.7867 23.2954 38.7795 22.2997 39.8791C21.7983 40.4271 21.5416 40.7029 21.2778 40.9763C21.0438 41.2234 20.805 41.4956 20.3322 42.0508C19.8606 42.6107 19.6481 42.9128 19.4356 43.2136C19.2231 43.5145 19.0106 43.8153 18.551 44.3908C17.6329 45.5429 17.6567 45.562 16.747 46.7224C16.0784 47.5808 15.8408 47.3122 15.5651 47.0985C15.2905 46.886 14.9789 46.7284 15.651 45.8652V45.8688Z",
        fill: "#141413",
      }),
      N.jsx("path", {
        d: "M35.7643 47.0161C35.4801 46.6973 35.3655 46.5242 35.2461 46.3511C35.1279 46.178 35.0086 46.0049 34.7399 45.6873C34.2015 45.0534 34.2278 45.0319 33.6917 44.3955C33.1581 43.7592 33.0852 43.8201 32.5528 43.1826C32.0215 42.545 31.9904 42.5701 31.4592 41.9314C30.9291 41.2927 31.0389 41.2007 30.51 40.5608C29.9811 39.9221 29.9453 39.9507 29.4164 39.312C28.8876 38.6721 28.8744 38.6816 28.3455 38.0417C27.8166 37.4006 27.8608 37.3636 27.3319 36.7225C26.803 36.0814 26.7565 36.1196 26.2288 35.4773C25.8384 35.0033 25.9948 34.7681 26.2634 34.5472C26.532 34.3264 26.7565 34.2488 27.1457 34.7227C27.6722 35.3627 27.7641 35.2875 28.2918 35.9274C28.8195 36.5673 28.7156 36.6532 29.2445 37.292C29.7722 37.9319 29.7543 37.9462 30.2832 38.5861C30.8121 39.2249 30.9243 39.1317 31.4532 39.7705C31.9821 40.4092 31.8985 40.4784 32.4286 41.1172C32.7796 41.5438 33.1306 41.9708 33.4816 42.3982C34.0141 43.0345 34.0248 43.025 34.5585 43.6601C35.0921 44.2941 35.1685 44.2308 35.7046 44.8612C35.972 45.1775 36.1129 45.328 36.2526 45.4796C36.3923 45.63 36.5331 45.7864 36.8006 46.0861C36.8495 46.1422 36.8889 46.1947 36.9188 46.2437C36.951 46.2974 36.9606 46.3249 36.9701 46.3643C36.9868 46.4371 36.9785 46.5087 36.9534 46.578C36.9032 46.7176 36.7851 46.8454 36.6704 46.9767C36.5558 47.1068 36.452 47.2465 36.3111 47.2871C36.2406 47.3074 36.1595 47.3014 36.0616 47.2549C36.015 47.2334 35.9541 47.194 35.9123 47.1594C35.8658 47.1224 35.8168 47.0746 35.7643 47.0161Z",
        fill: "#141413",
      }),
      N.jsx("path", {
        d: "M16.1966 13.5207C16.1727 14.2561 16.1632 14.8065 16.1727 15.241C16.1751 15.2936 16.1763 15.3461 16.1787 15.3962C16.1799 15.4201 16.1811 15.4452 16.1823 15.4691C16.1823 15.4774 16.1823 15.475 16.1811 15.4774C16.1787 15.4822 16.1775 15.4882 16.1763 15.4953C16.1727 15.5121 16.1859 15.5168 16.1978 15.5252L16.2026 15.5276C16.2026 15.5276 16.2002 15.5276 16.2098 15.53L16.2396 15.5347C16.2814 15.5395 16.3232 15.5455 16.3662 15.5503C16.4521 15.5598 16.5429 15.5682 16.636 15.5753C16.8234 15.5897 17.0276 15.6004 17.2556 15.6076C17.7117 15.6219 18.2668 15.6231 19.0082 15.6052C20.4994 15.5634 21.2443 15.5419 21.9893 15.5204C22.3642 15.5097 22.7379 15.5001 23.2059 15.487C23.6763 15.4762 24.235 15.4536 25.0039 15.4548C28.0041 15.487 27.9993 15.4058 30.9864 15.4285C32.4775 15.4368 33.2213 15.4213 33.9639 15.4022C34.334 15.3915 34.7053 15.3795 35.1638 15.3604C35.393 15.3497 35.6437 15.3378 35.9219 15.3175C35.9899 15.3115 36.0604 15.3055 36.1332 15.2995C36.1893 15.2936 36.2478 15.2876 36.3075 15.2816C36.3075 15.2852 36.3087 15.2733 36.3099 15.2673V15.2566L36.3182 15.2028C36.3362 15.0608 36.3469 14.9139 36.3565 14.7778C36.3756 14.5032 36.3851 14.2537 36.3947 14.0269C36.4114 13.5732 36.4221 13.2055 36.4281 12.839C36.4329 12.4724 36.4341 12.1047 36.4138 11.6475C36.403 11.4194 36.3875 11.1687 36.3588 10.8894C36.3445 10.7497 36.3278 10.6016 36.3039 10.45C36.2932 10.3736 36.28 10.2972 36.2645 10.2196L36.2562 10.179L36.2514 10.1599C36.249 10.1456 36.2454 10.136 36.243 10.1277C36.2383 10.1098 36.2323 10.0907 36.2203 10.0763C36.2084 10.062 36.1869 10.0644 36.1714 10.0608C36.1535 10.0596 36.1356 10.0572 36.1189 10.056C36.0448 10.0513 35.9732 10.0465 35.904 10.0429C35.6222 10.0274 35.3679 10.0202 35.1375 10.0142C34.6755 10.0035 34.3042 10.0011 33.9317 10.0011C33.1867 10.0011 32.4417 9.99992 30.9506 9.99873C29.457 9.99634 28.7097 10.0059 27.9635 10.0142C27.2161 10.0238 26.4699 10.0334 24.9752 10.0525C23.4805 10.0739 22.7331 10.0751 21.9857 10.0763C21.2384 10.0799 20.491 10.0799 18.9999 10.1324C18.2549 10.1599 17.6973 10.1897 17.2365 10.2232C17.0061 10.2387 16.7995 10.2566 16.6061 10.2745C16.5106 10.2841 16.4175 10.2948 16.3268 10.3044C16.2826 10.3103 16.2384 10.3151 16.1942 10.3211L16.1429 10.3282L16.1322 10.3306C16.1059 10.339 16.0701 10.3402 16.0689 10.3772C16.0665 10.3915 16.0653 10.407 16.0653 10.4214C16.0665 10.4154 16.0593 10.487 16.0546 10.53C16.051 10.5801 16.0462 10.6327 16.0426 10.6852C16.0152 11.1186 16.008 11.669 16.0175 12.4056C16.0343 13.4956 16.002 14.1212 15.9065 14.4746C15.8134 14.828 15.6642 14.9103 15.4899 14.9199C15.3167 14.9306 15.1687 14.8638 15.0529 14.5164C14.9383 14.1677 14.8475 13.541 14.8308 12.4211C14.8213 11.663 14.8237 11.0923 14.8511 10.5933C14.8559 10.53 14.8595 10.4679 14.8631 10.4082C14.8655 10.3772 14.869 10.3461 14.8714 10.3163C14.8738 10.29 14.8762 10.2471 14.8857 10.1957C14.9168 10.0035 14.9466 9.81129 15.0242 9.65608L15.0505 9.59639L15.0839 9.54386C15.1066 9.50924 15.1281 9.47342 15.1556 9.44119C15.1782 9.40418 15.2188 9.38746 15.2511 9.3612C15.2845 9.33851 15.3155 9.31583 15.3502 9.29434L15.4564 9.23584C15.491 9.21554 15.5376 9.21077 15.577 9.19764C15.6582 9.17256 15.7441 9.15704 15.8313 9.14391C16.0378 9.10809 16.0987 9.10332 16.205 9.0878C16.3029 9.07586 16.402 9.06392 16.5046 9.05079C16.7076 9.0281 16.9213 9.00662 17.1577 8.98751C17.6305 8.94812 18.194 8.91469 18.9449 8.88723C20.4468 8.8347 21.1954 8.85261 21.9463 8.86813C22.6961 8.88484 23.4459 8.90275 24.943 8.88126C26.4401 8.86096 27.1887 8.86216 27.9372 8.86216C28.6858 8.86216 29.4343 8.86454 30.9327 8.86693C32.431 8.87051 33.1807 8.84425 33.9329 8.81918C34.3089 8.80724 34.685 8.79769 35.159 8.79888C35.3966 8.80007 35.6568 8.80366 35.9589 8.81798C36.0353 8.82276 36.1141 8.82634 36.1965 8.83112L36.2323 8.8335L36.2896 8.83947C36.3278 8.84305 36.366 8.84664 36.4054 8.85022C36.4842 8.85499 36.5606 8.86813 36.6382 8.88365C36.6752 8.8932 36.7194 8.892 36.7528 8.90991C36.7874 8.92424 36.8233 8.93976 36.8579 8.95408C36.8937 8.96841 36.9259 8.98751 36.9594 9.00423L37.0107 9.03169L37.037 9.04601L37.0573 9.0687C37.111 9.12958 37.1647 9.18809 37.2172 9.24897C37.2375 9.28598 37.2578 9.32299 37.2781 9.36L37.3092 9.41612C37.3187 9.43522 37.3247 9.4579 37.3318 9.4782C37.3593 9.56296 37.3963 9.64653 37.4118 9.72891C37.4214 9.7695 37.4321 9.81009 37.4417 9.85069L37.4632 9.94023L37.4668 9.95814C37.4847 10.0548 37.5026 10.1492 37.5157 10.2363C37.5432 10.413 37.5623 10.5754 37.579 10.727C37.6112 11.0302 37.6291 11.2941 37.6435 11.5341C37.6685 12.0128 37.6733 12.3948 37.6733 12.7757C37.6733 13.1577 37.6673 13.5386 37.6542 14.0173C37.647 14.2573 37.6375 14.5211 37.6184 14.8256C37.6076 14.9784 37.5969 15.1408 37.5766 15.321C37.5718 15.3676 37.5682 15.4034 37.5551 15.4834C37.542 15.5538 37.536 15.6243 37.5181 15.6995C37.4835 15.8523 37.4417 16.0087 37.3521 16.1353C37.3307 16.1675 37.3092 16.1997 37.2853 16.2308C37.265 16.2654 37.2328 16.2869 37.2017 16.3096C37.1408 16.3537 37.0811 16.3943 37.0107 16.4206C36.871 16.4743 36.7194 16.5018 36.5725 16.5233C36.5355 16.5292 36.4985 16.534 36.4627 16.5376L36.3923 16.546C36.3493 16.5495 36.3075 16.5543 36.2657 16.5579C36.1845 16.5639 36.1057 16.571 36.0293 16.577C35.7273 16.5973 35.4658 16.608 35.2282 16.6164C34.7543 16.6319 34.3782 16.6379 34.0009 16.6427C33.2488 16.6498 32.4978 16.6522 30.9995 16.6439C29.005 16.6255 27.01 16.6076 25.0146 16.5901C24.2875 16.5889 23.724 16.6188 23.2596 16.6427C22.794 16.6677 22.4203 16.6952 22.0478 16.7215C21.3005 16.774 20.5543 16.8337 19.0476 16.8731C18.2931 16.891 17.7248 16.8981 17.2449 16.8958C17.0049 16.8946 16.7876 16.8898 16.5775 16.8826C16.4724 16.8779 16.3697 16.8731 16.2659 16.8659C16.2133 16.8623 16.162 16.8576 16.1095 16.854C16.0737 16.8504 15.9579 16.8385 15.8719 16.8253C15.6904 16.7979 15.509 16.7597 15.3537 16.6797C15.2773 16.6403 15.2021 16.5949 15.1436 16.528C15.0732 16.4707 15.0266 16.3955 14.9872 16.3143C14.9084 16.152 14.8547 15.9598 14.8356 15.7472C14.8296 15.6959 14.8201 15.6386 14.8177 15.592C14.8153 15.561 14.8129 15.5288 14.8093 15.4965C14.8058 15.4356 14.801 15.3736 14.7974 15.3091C14.7735 14.8077 14.7771 14.2358 14.801 13.4765C14.8416 12.3566 14.9681 11.8409 15.1138 11.6045C15.2606 11.3681 15.4349 11.4147 15.608 11.4266C15.7812 11.4385 15.9555 11.4171 16.0689 11.6654C16.1835 11.9137 16.2312 12.433 16.1919 13.5242L16.1966 13.5207Z",
        fill: "#141413",
      }),
    ],
  });
}
function yT({ className: t }) {
  return N.jsxs("svg", {
    width: "86",
    height: "64",
    viewBox: "0 0 86 64",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className: t,
    children: [
      N.jsx("title", { children: "Spreadsheet" }),
      N.jsx("path", {
        d: "M17.6892 54.0919H27.3622L26.9052 28.3102L67.4076 28.1316L66.5628 18.8926L17.6892 19.1479L17.3206 19.9947L17.6892 54.0919Z",
        fill: "#E8E6DC",
      }),
      N.jsx("path", {
        d: "M79.394 3.05856C73.4151 2.72256 73.4094 2.8032 67.4324 2.4672C65.9386 2.38848 64.8174 2.32896 63.8842 2.28096C63.4177 2.25984 62.9972 2.24064 62.5998 2.22144C62.2273 2.2272 61.8778 2.23104 61.5284 2.23488C60.0327 2.256 58.537 2.2752 55.5438 2.2752C51.5527 2.2752 47.561 2.27584 43.5687 2.27712C37.5822 2.27712 37.5822 2.14464 31.5975 2.14464C25.611 2.14464 25.611 2.3904 19.6225 2.3904C13.6359 2.3904 13.6359 2.18304 7.64936 2.18304C5.83304 2.18304 4.56776 2.1984 3.50984 2.22144C3.24488 2.2272 2.99528 2.23296 2.75144 2.23872C2.69 2.23872 2.63048 2.24256 2.57096 2.24256H2.48072L2.4404 2.2464H2.43464L2.3924 2.25792C2.33672 2.2656 2.3156 2.3328 2.33672 2.37696L2.34248 2.39616C2.34248 2.46528 2.34248 2.53632 2.34248 2.60736C2.34248 2.76288 2.34248 2.92224 2.34248 3.0912C2.34056 3.42528 2.33864 3.78624 2.3348 4.1856C2.32712 4.9824 2.31176 5.92704 2.28872 7.104C2.22728 10.0934 2.16776 11.5872 2.11016 13.081C2.05448 14.5747 1.99304 16.0704 1.98344 19.0541C1.98344 22.0358 1.9892 23.5315 2.04872 24.9811C2.0564 25.1616 2.06792 25.3382 2.08136 25.513C2.09288 25.6838 2.114 25.8662 2.13512 25.9738C2.13512 25.9814 2.13704 25.9834 2.13896 25.9872L2.11976 25.993L2.03144 26.0218C1.96616 26.0467 1.92584 26.0525 1.8836 26.064C1.79912 26.0851 1.71464 26.1139 1.634 26.1504C1.59368 26.1677 1.55336 26.1888 1.51304 26.2099L1.48424 26.2253L1.46504 26.231C1.4516 26.2349 1.44008 26.2387 1.42856 26.2445C1.40552 26.256 1.38248 26.2694 1.36136 26.2867C1.35176 26.2963 1.34216 26.3059 1.33256 26.3155L1.31912 26.3309C1.18088 26.4749 2.4788 25.0982 1.93736 25.6877L1.9508 25.703C2.02568 25.7818 2.0948 25.8758 2.14664 25.9757C2.21192 26.1062 2.19848 26.0986 2.21384 26.137C2.23304 26.1946 2.25416 26.2714 2.26376 26.3155L2.2868 26.4307C2.30408 26.5152 2.306 26.567 2.31752 26.6362C2.34824 26.8877 2.36552 27.1219 2.37896 27.3658C2.43464 28.3373 2.4596 29.4624 2.48264 30.9696C2.52104 33.9763 2.57288 35.4739 2.63432 36.9754C2.69192 38.4749 2.74952 39.9744 2.72456 42.9734C2.66696 48.9677 2.59208 48.9658 2.5076 54.9562C2.47688 56.9837 2.44232 58.3238 2.40968 59.4509C2.40008 59.7331 2.3924 60.0019 2.38472 60.263C2.38088 60.3936 2.37512 60.5242 2.37128 60.6528L2.36552 60.816L2.36168 60.8717C2.35592 60.9158 2.34824 60.9408 2.36744 60.9734C2.38472 61.0042 2.41928 61.0176 2.45768 61.0195L2.48264 61.0234C2.5364 61.0272 2.59208 61.031 2.64968 61.0349C2.786 61.0445 2.93 61.0522 3.07784 61.0618C3.37352 61.079 3.69416 61.1002 4.04168 61.1213C4.73864 61.1597 5.54888 61.2058 6.51464 61.2595C9.39464 61.4131 10.8865 61.5072 12.3534 61.5994C13.0868 61.6454 13.8126 61.6896 14.7015 61.7453C15.5751 61.7952 16.61 61.8528 17.9732 61.9296C17.9809 61.9296 18.1902 61.9258 18.409 61.9238C24.3994 61.8336 24.3956 61.6762 30.386 61.5859C34.3758 61.5142 38.3662 61.4426 42.3572 61.3709C48.3457 61.2806 48.3476 61.392 54.3361 61.3037C57.3294 61.2538 58.827 61.2288 60.3246 61.2038C60.699 61.1962 61.0734 61.1904 61.4708 61.1827C61.6705 61.1789 61.874 61.175 62.0871 61.1712C62.3079 61.1712 62.5364 61.1712 62.7783 61.1712C63.7134 61.175 64.8366 61.1808 66.3342 61.1885C72.3207 61.2173 72.3226 61.3306 78.3073 61.3421C79.803 61.3421 80.9262 61.3248 81.8574 61.296C82.0897 61.2883 82.3105 61.2787 82.5236 61.271L82.6023 61.2672C82.6292 61.2672 82.6196 61.2672 82.6311 61.2653L82.6638 61.2595L82.706 61.248C82.731 61.2403 82.7521 61.2326 82.7694 61.223C82.7828 61.223 82.7713 61.2 82.7694 61.1885L82.7578 61.1501C82.7502 61.1251 82.7425 61.104 82.7348 61.0867V61.081C82.7348 61.081 82.731 61.0886 82.729 61.0541L82.7252 60.9101C82.7214 60.8141 82.7194 60.7142 82.7156 60.6163C82.706 60.2189 82.6964 59.7965 82.6849 59.3299C82.6676 58.393 82.6599 57.2698 82.6676 55.7722C82.6881 51.7811 82.7079 47.7901 82.7271 43.799C82.7578 37.8067 82.8942 37.8067 82.921 31.8144C82.9466 27.817 82.9729 23.8195 82.9998 19.8221C83.0132 13.8278 83.0785 13.8259 83.0727 7.8336C83.067 5.52192 83.1553 4.3296 83.3146 3.71904C83.4778 3.10464 83.7236 3.05664 84.0231 3.04704C84.3226 3.03744 84.6164 3.06624 84.8449 3.68448C85.0772 4.3104 85.2308 5.50848 85.2366 7.82784C85.2404 13.8202 85.154 13.8202 85.1386 19.8086C85.1194 25.7952 84.9678 25.7933 84.9409 31.7779C84.914 37.7664 85.033 37.7664 85.0023 43.7549C84.9697 49.7414 85.035 49.7414 84.9985 55.728C84.9889 57.2256 84.9812 58.3469 84.9754 59.2838C84.9716 59.7523 84.9678 60.1728 84.9639 60.5702C84.9639 60.7891 84.9601 61.0003 84.9582 61.2096C84.9582 61.3939 84.9562 61.5763 84.9543 61.7587V62.0314C84.9486 62.0736 84.9562 62.1274 84.9466 62.1619L84.9102 62.2637C84.8622 62.3981 84.8122 62.5344 84.7642 62.6688L84.6548 62.9741L84.6356 63.0259C84.6202 63.0355 84.603 63.0432 84.5895 63.0509C84.4666 63.1104 84.3418 63.1699 84.2151 63.2294L84.1153 63.2774C84.0788 63.2928 84.0385 63.3043 84.0001 63.3178C83.9214 63.3427 83.8484 63.3792 83.7486 63.3754C83.5604 63.3869 83.3665 63.3926 83.1687 63.3965C82.9844 63.3984 82.7982 63.4022 82.6081 63.4042C82.393 63.4042 82.1684 63.408 81.9342 63.408C80.9972 63.408 79.8721 63.4118 78.3706 63.4138C72.3783 63.4042 72.3802 63.3658 66.3918 63.337C64.8942 63.3293 63.771 63.3139 62.8359 63.2966C62.6036 63.2928 62.3828 63.287 62.1697 63.2832C61.9623 63.2832 61.7646 63.2832 61.5706 63.2813C61.1732 63.2794 60.7988 63.2755 60.4244 63.2736C58.9268 63.2621 57.4292 63.2525 54.4359 63.2966C48.4494 63.3869 48.4513 63.4656 42.4647 63.5558C36.4762 63.6461 36.4801 63.8112 30.4916 63.8995C24.5031 63.9898 24.4993 63.7594 18.5108 63.8496C18.315 63.8534 18.1268 63.8554 17.9924 63.8573C17.2858 63.8266 16.6638 63.7997 16.105 63.7747C15.5636 63.7555 15.0855 63.7402 14.6458 63.7248C13.7665 63.6998 13.0484 63.6902 12.3188 63.6806C10.8615 63.6595 9.36584 63.6346 6.47048 63.481C5.49512 63.4291 4.67912 63.3792 3.97256 63.3312C3.18152 63.2736 2.51336 63.2237 1.91432 63.1795C1.634 63.1565 1.39592 63.0874 1.17896 62.9722C0.962003 62.8608 0.771923 62.7053 0.620243 62.5229C0.468563 62.3424 0.357203 62.1331 0.286163 61.9162C0.249683 61.8086 0.226643 61.6992 0.222803 61.5782C0.215123 61.4611 0.203603 61.3421 0.199763 61.2288C0.207443 61.0368 0.217043 60.8448 0.224723 60.6509C0.232403 60.5242 0.238163 60.3955 0.245843 60.265C0.259283 60.0058 0.272723 59.7389 0.288083 59.4605C0.341843 58.343 0.391763 57.0067 0.422483 54.9888C0.506963 49.0022 0.409043 49.0003 0.466643 43.0157C0.491603 40.0224 0.464723 38.5267 0.437843 37.033C0.407123 35.5392 0.384083 34.0416 0.347603 31.0618C0.324563 29.5757 0.311123 28.4602 0.280403 27.5654C0.272723 27.3446 0.261203 27.1354 0.247763 26.9587C0.242003 26.8954 0.236243 26.832 0.230483 26.7706C0.234323 26.7667 0.220883 26.7763 0.242003 26.7706L0.328403 26.7552C0.386003 26.7437 0.443603 26.7322 0.501203 26.7168C0.616403 26.688 0.727763 26.6515 0.837203 26.6093C0.890963 26.5882 0.948563 26.5632 0.998483 26.5421C1.03112 26.5402 1.06376 26.5325 1.09256 26.521C1.12328 26.5094 1.15208 26.4941 1.17704 26.473C1.19048 26.4634 1.202 26.4518 1.21352 26.4403L1.2308 26.4211L1.23848 26.4115C-0.224557 27.9782 0.823763 26.8378 0.493523 27.1834C0.410963 27.1008 0.336083 27.0029 0.276563 26.9011C0.263123 26.8762 0.245843 26.8474 0.236243 26.8282L0.222803 26.7994L0.197843 26.7398C0.182483 26.6995 0.167123 26.6592 0.153683 26.6189C0.140243 26.5786 0.140243 26.567 0.132563 26.5402C0.121043 26.4941 0.109523 26.4422 0.101843 26.4019L0.0845627 26.2963C0.0711227 26.2214 0.0672827 26.1677 0.0596027 26.1062C0.0480827 25.9872 0.0384827 25.8778 0.0327227 25.7741C0.0192827 25.5629 0.0135227 25.367 0.00776269 25.1712C-0.0075973 24.3917 0.00392269 23.6371 0.00776269 22.6906C0.0116027 21.7498 0.0173627 20.6227 0.0231227 19.1174C0.0308027 16.1146 0.0250427 14.617 0.0154427 13.1155C0.00776269 11.616 8.2695e-05 10.1165 0.0596027 7.11936C0.0826427 5.91936 0.0999227 4.95936 0.115283 4.15296C0.128723 3.25824 0.138323 2.53248 0.147923 1.87776C0.165203 1.65312 0.195923 1.43424 0.270803 1.24224C0.343763 1.0464 0.453203 0.86592 0.587603 0.70848C0.856403 0.39168 1.23272 0.17856 1.63784 0.10176C1.84328 0.0576 2.0756 0.06912 2.30024 0.06528C2.4404 0.06528 2.58056 0.06144 2.72456 0.05952C2.96648 0.05568 3.21608 0.05376 3.4772 0.04992C4.52744 0.0384 5.78312 0.03072 7.58024 0.03072C13.5687 0.03072 13.5687 0.15168 19.5591 0.15168C25.5495 0.15168 25.5495 0.2496 31.5399 0.2496C37.5265 0.2496 37.5265 0 43.515 0C47.5098 0.01536 51.5047 0.03008 55.4996 0.04416C58.4986 0.04416 59.9962 0.05952 61.4958 0.07296C61.6839 0.07296 61.8702 0.0768 62.0602 0.07872C62.1562 0.07872 62.2522 0.07872 62.3482 0.08064H62.4942C62.5498 0.08256 62.5652 0.08064 62.7054 0.0864C63.1086 0.11136 63.5348 0.13824 64.0071 0.16896C64.9422 0.22464 66.0654 0.28992 67.561 0.37824C73.5476 0.71424 73.5418 0.7968 79.5303 1.1328C80.6862 1.19808 81.5694 1.27296 82.2452 1.35744C82.5831 1.39968 82.8692 1.44384 83.1092 1.49184C83.2417 1.52064 83.3646 1.54752 83.474 1.57056C83.6967 1.61856 83.8618 1.70496 83.9982 1.80672C84.267 2.01024 84.3822 2.25024 84.4244 2.43072C84.4666 2.61504 84.4398 2.75136 84.3975 2.8416C84.3054 3.02208 84.1575 3.03744 84.0116 3.0432C83.8618 3.05088 83.7294 3.02592 83.6084 3.00096C83.4894 2.97792 83.3626 2.97024 83.305 3.03552C83.2993 3.0432 83.2935 3.05088 83.2916 3.06048C83.2916 3.06624 83.2839 3.06432 83.2954 3.07584H83.2993V3.07968C83.2993 3.07776 83.2974 3.10464 83.2993 3.09312H83.2897L83.2494 3.09888C83.2225 3.1008 83.1956 3.10464 83.1668 3.10656C83.1111 3.1104 83.0516 3.11616 82.9902 3.12C82.7444 3.13536 82.4545 3.14496 82.1146 3.14496C81.433 3.14496 80.546 3.11808 79.3902 3.0528L79.394 3.05856Z",
        fill: "#141413",
      }),
      N.jsx("path", {
        d: "M3.98216 9.72288C8.2772 9.72672 8.27336 9.88224 12.5607 9.90336C16.8481 9.9264 16.8481 9.98016 21.1335 9.99744C25.419 10.009 25.419 9.8592 29.7025 9.8496C33.9841 9.82656 33.9783 9.75552 38.2638 9.68832C42.5511 9.61536 42.555 9.84384 46.8442 9.77088C51.1335 9.70368 51.1316 9.62496 55.4266 9.5904C57.579 9.58272 58.6542 9.57888 59.7294 9.57504C60.8065 9.5808 61.8817 9.57504 64.0474 9.64224C64.5889 9.65952 65.0631 9.67872 65.4894 9.70752C65.9098 9.7344 66.2823 9.75744 66.6183 9.77856C67.2788 9.82656 67.8087 9.86496 68.3406 9.89568C69.4023 9.96288 70.4698 10.0205 72.6068 10.057C74.7457 10.0877 75.817 10.0627 76.8865 10.0416C77.9578 10.0166 79.0273 9.9936 81.17 9.9744C84.3322 9.93984 84.7623 10.3565 84.7758 10.9171C84.7873 11.4739 84.3668 11.8502 81.1892 11.8848C79.0426 11.904 77.9674 11.952 76.8942 12C75.819 12.0461 74.7457 12.0941 72.5914 12.0634C70.4372 12.0269 69.3601 11.9386 68.281 11.8406C67.7415 11.7907 67.202 11.7427 66.5262 11.6794C66.1844 11.6506 65.8254 11.6237 65.4126 11.5949C65.0017 11.5642 64.537 11.543 64.0071 11.5258C61.8817 11.4586 60.8122 11.449 59.7447 11.4259C58.6772 11.4106 57.6078 11.3952 55.467 11.4086C51.1854 11.4451 51.1892 11.6832 46.9038 11.7504C42.6164 11.8234 42.6145 11.6506 38.3233 11.7254C35.465 11.7702 32.6036 11.7971 29.739 11.8061C25.4439 11.8157 25.4439 11.8368 21.1508 11.8272C16.8558 11.8099 16.8558 11.9712 12.5607 11.9482C8.26952 11.927 8.26568 11.9674 3.98216 11.9635C3.19496 11.9674 2.6132 11.9328 2.19272 11.8771C1.98152 11.8483 1.8068 11.8138 1.66472 11.7715C1.5284 11.7331 1.42088 11.687 1.3364 11.6371C0.996563 11.4355 1.0196 11.1533 1.00424 10.873C0.988883 10.5946 0.915923 10.3181 1.27112 10.0992C1.35944 10.0435 1.47656 9.99168 1.62632 9.9456C1.77032 9.90144 1.94696 9.86304 2.16392 9.8304C2.59784 9.7632 3.18152 9.72864 3.97832 9.7248L3.98216 9.72288Z",
        fill: "#141413",
      }),
      N.jsx("path", {
        d: "M10.4334 10.9824C10.4334 10.4218 10.5831 10.4218 10.5831 9.86304C10.5831 9.30432 10.635 9.3024 10.635 8.74368C10.635 8.18496 10.4814 8.18304 10.4814 7.62432C10.4814 7.0656 10.418 7.06368 10.418 6.50496C10.418 5.94624 10.6503 5.94432 10.6503 5.38368C10.6503 4.82304 10.5774 4.82304 10.5774 4.26432C10.5774 3.7056 10.5524 3.70368 10.5524 3.14304C10.5524 2.5824 10.6465 2.5824 10.6465 2.02176C10.6465 1.46112 10.5505 1.46112 10.5505 0.90048C10.5505 0.48576 10.9844 0.43008 11.5431 0.43008C12.1018 0.43008 12.459 0.48576 12.459 0.90048C12.459 1.46112 12.651 1.46112 12.651 2.01984C12.651 2.57856 12.4359 2.58048 12.4359 3.1392C12.4359 3.69792 12.3975 3.69984 12.3975 4.25856C12.3975 4.81728 12.6318 4.8192 12.6318 5.37792C12.6318 5.93664 12.4551 5.93856 12.4551 6.4992C12.4551 7.05984 12.4378 7.05984 12.4378 7.61856C12.4378 8.17728 12.4628 8.1792 12.4628 8.73984C12.4628 9.30048 12.626 9.30048 12.626 9.86112C12.626 10.4218 12.6721 10.4218 12.6721 10.9824C12.6721 11.3971 12.1018 11.3722 11.5431 11.3722C10.9844 11.3722 10.4353 11.3971 10.4353 10.9824H10.4334Z",
        fill: "#141413",
      }),
      N.jsx("path", {
        d: "M18.4167 25.1578C18.4167 29.4835 18.3802 31.6454 18.3418 33.8074C18.3169 35.9712 18.2305 38.1312 18.2228 42.4474C18.217 46.7635 18.2324 48.9197 18.2938 51.0566C18.3111 51.5885 18.3322 52.1222 18.3706 52.6733C18.3822 52.8038 18.3918 52.9344 18.4033 53.0688C18.4052 53.0957 18.409 53.1226 18.411 53.1514C18.4167 53.1782 18.4167 53.209 18.434 53.2339C18.4609 53.2454 18.4916 53.2435 18.5223 53.2493L18.5703 53.2531C18.6202 53.255 18.6702 53.2589 18.7201 53.2608C18.8948 53.2685 19.0753 53.2742 19.2596 53.2819C19.6321 53.2934 20.0257 53.305 20.4442 53.3165C21.2852 53.3376 22.2279 53.353 23.307 53.3683C27.6231 53.4202 29.787 53.3837 31.947 53.3549C34.107 53.3222 36.2689 53.2896 40.5889 53.2819C44.9108 53.2704 47.0708 53.2378 49.2308 53.207C51.3908 53.1725 53.5489 53.1379 57.867 53.0707C60.0231 53.0362 61.6398 53.0093 62.9876 52.9862C64.3297 52.9632 65.4106 52.9517 66.4532 52.9037L66.6452 52.8941H66.6798L66.6913 52.896C66.7066 52.8979 66.7258 52.8998 66.7431 52.8998C66.7911 52.9114 66.8026 52.8672 66.8122 52.8326L66.8199 52.8038C66.8199 52.8038 66.8218 52.7923 66.8238 52.7846C66.8238 52.7866 66.8276 52.7616 66.8276 52.7462L66.8334 52.6963C66.8487 52.5638 66.8583 52.416 66.8698 52.272C66.891 51.9763 66.9063 51.6653 66.9178 51.335C66.9639 50.0083 66.962 48.3936 66.9159 46.2374C66.8161 41.9213 66.7086 39.769 66.674 37.5782C66.6471 35.4317 66.5914 33.2736 66.4455 28.9651C66.3687 26.809 66.29 25.1942 66.2094 23.8541C66.1268 22.5178 66.05 21.4406 65.9233 20.4134L65.8791 20.0928L65.8676 20.041C65.8618 20.0256 65.8618 20.0045 65.8446 19.9949C65.8273 19.9891 65.81 19.9872 65.7908 19.9853C65.7505 19.9814 65.7082 19.9795 65.666 19.9757C65.5258 19.968 65.3838 19.9584 65.2378 19.9488C64.9422 19.9334 64.6273 19.9238 64.2951 19.9162C62.9665 19.8835 61.3498 19.8835 59.1937 19.9046C54.8698 19.9565 52.7079 19.9814 50.546 20.0083C49.4631 20.0198 48.3802 20.0333 47.0247 20.0486C46.6849 20.0525 46.3278 20.0563 45.9495 20.0602C45.5694 20.0602 45.1681 20.0602 44.7418 20.0602C43.897 20.0602 42.9486 20.0582 41.8676 20.0563C33.2084 20.0563 33.2084 20.1523 24.5492 20.1523C18.1556 20.1523 17.2974 19.7184 17.2974 19.1597C17.2974 18.601 18.1556 18.2438 24.5492 18.2438C33.193 18.2438 33.193 18.0518 41.8388 18.0518C46.1511 18.0595 48.3073 18.0634 50.4654 18.0672C52.6292 18.0787 54.7911 18.0749 59.1246 18.025C61.2922 18.0038 62.9204 18.0077 64.2913 18.0461C64.635 18.0557 64.9614 18.0672 65.2782 18.0845C65.4394 18.0941 65.5969 18.1056 65.7505 18.1152C65.8618 18.1248 66.1863 18.1498 66.4206 18.1901C66.6682 18.2304 66.9102 18.2861 67.0849 18.4186C67.131 18.4493 67.177 18.48 67.225 18.5126C67.275 18.5453 67.3018 18.5971 67.3345 18.6394C67.3998 18.7277 67.4574 18.8218 67.5015 18.9274C67.5898 19.1386 67.6359 19.3786 67.6782 19.6128L67.707 19.7914L67.7242 19.9142L67.7511 20.1274C67.8817 21.2467 67.9508 22.3277 68.0295 23.689C68.1063 25.0464 68.1812 26.6726 68.258 28.8384C68.4135 33.1757 68.4922 35.3434 68.569 37.513C68.6401 39.6422 68.7879 41.8061 68.8897 46.1376C68.9377 48.3072 68.9454 49.9392 68.9031 51.3178C68.8935 51.6634 68.8782 51.9936 68.859 52.3142C68.8474 52.4774 68.834 52.6368 68.8225 52.7942C68.8129 52.8922 68.8033 52.9901 68.7937 53.0861C68.7783 53.2262 68.7514 53.3587 68.7303 53.4931L68.6977 53.6928C68.6804 53.7542 68.6554 53.8138 68.6362 53.8733L68.5729 54.0518C68.5518 54.1094 68.5191 54.1574 68.4922 54.2112C68.4615 54.2611 68.4423 54.3206 68.402 54.3629L68.3463 54.432L68.3194 54.4666L68.3118 54.4742C68.3214 54.4877 68.2945 54.4608 68.2964 54.4646L68.2926 54.4685L68.2753 54.4819C68.1831 54.5549 68.1025 54.6259 68.0007 54.6816C67.7876 54.7776 67.5342 54.8237 67.2807 54.8506C67.154 54.8659 67.0254 54.8755 66.8986 54.889L66.6625 54.9043C65.5431 54.9677 64.4622 54.985 63.1028 55.0157C61.7473 55.0406 60.121 55.0694 57.9534 55.1098C53.6257 55.1827 51.4618 55.1923 49.2999 55.2077C47.138 55.2173 44.9742 55.225 40.6484 55.2422C36.3188 55.248 34.155 55.2499 31.9892 55.2518C29.8234 55.248 27.6596 55.2518 23.3262 55.2019C22.2414 55.1866 21.291 55.1731 20.4423 55.1597C20.0161 55.152 19.6167 55.1424 19.2366 55.1366C19.0446 55.1309 18.8602 55.127 18.6798 55.1213C18.5607 55.1174 18.1594 55.104 17.8695 55.079C17.7946 55.0714 17.7198 55.0618 17.6449 55.0541C17.5758 55.0368 17.5028 55.0253 17.4394 55.0022C17.3166 54.9485 17.1918 54.912 17.0938 54.839C17.0132 54.7296 16.9057 54.6605 16.8442 54.5491C16.7751 54.4454 16.7271 54.3206 16.6868 54.1939C16.61 53.9347 16.5678 53.6582 16.5351 53.3856C16.5236 53.2896 16.514 53.1936 16.5025 53.0995C16.4948 53.0227 16.4871 52.9478 16.4794 52.873C16.4238 52.2758 16.3892 51.7286 16.3566 51.1795C16.2394 48.9907 16.1703 46.8192 16.1761 42.48C16.1838 38.1427 16.2222 35.9789 16.1972 33.815C16.1857 31.6512 16.1742 29.4893 16.1742 25.1616C16.1742 18.7718 16.7444 19.1597 17.3031 19.1578C17.8618 19.1578 18.411 18.7642 18.411 25.1635L18.4167 25.1578Z",
        fill: "#141413",
      }),
      N.jsx("path", {
        d: "M65.6718 29.3261C64.3834 29.3779 63.7364 29.3587 63.0913 29.3395C62.4462 29.3184 61.801 29.2992 60.5089 29.3107C57.9246 29.3203 57.9015 29.2416 55.3441 29.1648C52.7828 29.0842 52.777 29.2358 50.2177 29.1648C47.6583 29.0995 47.6564 29.161 45.1009 29.1149C42.5454 29.0803 42.5454 28.8403 39.9937 28.8461C39.3582 28.8518 38.8801 28.8634 38.4826 28.8749C38.0871 28.896 37.7722 28.9114 37.4554 28.9286C37.1386 28.9459 36.8295 28.9747 36.4378 28.9997C36.2401 29.0093 36.0346 29.0323 35.7966 29.0534C35.547 29.0746 35.2686 29.0995 34.9498 29.1264C33.6174 29.2301 32.9799 29.2358 32.329 29.2646C31.682 29.2838 31.033 29.3069 29.7428 29.3126C27.1623 29.3165 27.1642 29.2205 24.5895 29.1898C22.0167 29.1494 22.0148 29.2435 19.442 29.184C17.5431 29.1341 17.2993 28.6906 17.3166 28.1318C17.3338 27.5712 17.5969 27.2256 19.49 27.2755C22.0474 27.335 22.0532 27.145 24.6087 27.1872C27.1642 27.2179 27.1642 27.4349 29.7178 27.433C30.9908 27.4253 31.6282 27.4214 32.2638 27.4176C32.8954 27.4061 33.5425 27.4118 34.7732 27.3178C34.9268 27.3043 35.0708 27.2909 35.2052 27.2794C35.353 27.264 35.4894 27.2506 35.6199 27.2371C35.8791 27.2102 36.1114 27.1776 36.313 27.1603C36.7201 27.12 37.0484 27.0701 37.3729 27.0317C37.6974 26.9933 38.0218 26.9549 38.427 26.9222C38.8321 26.8954 39.3159 26.8742 39.963 26.8666C42.5454 26.8627 42.5415 27.0451 45.1143 27.0797C47.6833 27.1258 47.6833 27.1469 50.2503 27.2122C52.8193 27.2832 52.8193 27.2602 55.3863 27.3408C57.9591 27.4176 57.938 27.2794 60.482 27.2717C61.755 27.2602 62.3924 27.2314 63.0279 27.2045C63.6654 27.1776 64.3028 27.1488 65.5777 27.095C67.4593 27.0144 67.3709 27.5789 67.4036 28.1395C67.4362 28.6963 67.5783 29.2474 65.6698 29.3299L65.6718 29.3261Z",
        fill: "#141413",
      }),
      N.jsx("path", {
        d: "M65.6257 37.9718C63.0586 37.9718 63.0586 37.824 60.4935 37.8259C57.9265 37.8259 57.9265 37.7741 55.3594 37.776C52.7924 37.776 52.7924 37.9315 50.2234 37.9334C47.6564 37.9334 47.6564 37.9987 45.0874 38.0006C42.5185 38.0006 42.5204 37.7702 39.9534 37.7702C37.3882 37.7702 37.3882 37.8432 34.8231 37.8432C33.1118 37.8522 31.4004 37.8605 29.689 37.8682C27.1201 37.8682 27.1201 37.7741 24.5511 37.7741C21.9822 37.7741 21.9822 37.8701 19.4132 37.8701C17.5162 37.8701 17.2609 37.4362 17.259 36.8774C17.259 36.3187 17.5124 35.9616 19.4094 35.9616C21.9764 35.9616 21.9764 35.7696 24.5415 35.7696C27.1066 35.7696 27.1086 35.9846 29.6756 35.9846C32.2426 35.9846 32.2426 36.023 34.8097 36.023C37.3767 36.023 37.3786 35.7888 39.9457 35.7888C42.5146 35.7888 42.5127 35.9654 45.0778 35.9635C46.7879 35.9686 48.498 35.9731 50.2081 35.977C51.9182 35.9808 53.6295 35.9712 55.3422 35.9482C57.9111 35.9482 57.9111 35.785 60.4801 35.783C63.049 35.783 63.049 35.735 65.618 35.7331C67.515 35.7331 67.4017 36.3014 67.4017 36.8602C67.4017 37.4189 67.5207 37.968 65.6218 37.9699L65.6257 37.9718Z",
        fill: "#141413",
      }),
      N.jsx("path", {
        d: "M65.979 46.7021C63.4042 46.7021 63.4042 46.5542 60.8276 46.5562C58.249 46.5562 58.2452 46.5062 55.6647 46.5082C53.0823 46.5101 53.0842 46.6637 50.5018 46.6656C47.9194 46.6675 47.9194 46.7309 45.339 46.7328C44.0468 46.7328 43.4017 46.6771 42.7546 46.6195C42.1057 46.5638 41.4548 46.5139 40.1626 46.5158C37.5783 46.5197 37.5783 46.5907 34.9959 46.5888C33.273 46.5939 31.5502 46.599 29.8273 46.6042C27.241 46.5984 27.241 46.5043 24.6567 46.4986C22.0724 46.4947 22.0705 46.5888 19.4881 46.5907C17.5834 46.5946 17.3396 46.1722 17.3204 45.6115C17.3031 45.0547 17.5719 44.6842 19.4842 44.6803C22.0686 44.6803 22.0686 44.4883 24.651 44.4922C27.2334 44.4979 27.2334 44.713 29.8158 44.7187C32.3982 44.7245 32.3982 44.7629 34.9806 44.7667C37.561 44.7686 37.563 44.5363 40.1415 44.5325C41.4318 44.5306 42.0711 44.567 42.7162 44.6074C43.3633 44.6515 44.0084 44.6938 45.3006 44.6938C47.0222 44.6976 48.7438 44.7021 50.4654 44.7072C52.187 44.7123 53.9098 44.7027 55.634 44.6784C58.2202 44.6765 58.2164 44.5133 60.8065 44.5114C63.3985 44.5114 63.3985 44.4634 65.9905 44.4614C67.9047 44.4614 67.7838 45.0298 67.778 45.5904C67.7742 46.1491 67.8855 46.6982 65.9809 46.7002L65.979 46.7021Z",
        fill: "#141413",
      }),
      N.jsx("path", {
        d: "M25.7953 53.063C25.7953 51.2621 25.945 51.2621 25.945 49.463C25.945 47.664 25.9969 47.664 25.9969 45.863C25.9969 44.0621 25.8433 44.064 25.8433 42.263C25.8433 40.4621 25.7799 40.464 25.7799 38.663C25.7799 36.8621 26.0122 36.864 26.0122 35.063C26.0122 33.2621 25.9393 33.264 25.9393 31.465C25.9303 30.2643 25.922 29.0637 25.9143 27.863C25.9143 26.0602 26.0084 26.0621 26.0084 24.2592C26.0084 22.4563 25.9124 22.4563 25.9124 20.6554C25.9124 19.3248 26.3463 19.1462 26.905 19.1462C27.4638 19.1462 27.8209 19.3248 27.8209 20.6554C27.8209 22.4544 28.0129 22.4544 28.0129 24.2534C28.0129 26.0525 27.7978 26.0525 27.7978 27.8534C27.7978 29.6544 27.7594 29.6525 27.7594 31.4534C27.7594 33.2544 27.9937 33.2544 27.9937 35.0534C27.9937 36.8525 27.817 36.8544 27.817 38.6534C27.8106 39.8528 27.8049 41.0522 27.7998 42.2515C27.7946 43.4509 27.803 44.6515 27.8247 45.8534C27.8247 47.6563 27.9879 47.6563 27.9879 49.4573C27.9879 51.2602 28.034 51.2582 28.034 53.0592C28.034 54.3898 27.4638 54.3072 26.905 54.3091C26.3463 54.3091 25.7972 54.3917 25.7972 53.0592L25.7953 53.063Z",
        fill: "#141413",
      }),
      N.jsx("path", {
        d: "M45.8209 53.4605C45.673 52.4947 45.6922 52.009 45.7095 51.527C45.723 51.287 45.7364 51.047 45.7518 50.7475C45.7594 50.6054 45.7671 50.4499 45.7748 50.2714C45.7825 50.1005 45.7863 49.9066 45.7882 49.6819C45.7978 47.8925 45.8458 47.8886 45.842 46.0896C45.8343 44.2886 45.6807 44.2906 45.673 42.4877C45.6654 40.6848 45.6001 40.6848 45.5962 38.88C45.5962 37.0733 45.8266 37.0752 45.8458 35.257C45.8458 33.4579 45.7729 33.456 45.7729 31.6589C45.7639 30.4582 45.7556 29.2582 45.7479 28.0589C45.7479 26.2579 45.842 26.2579 45.842 24.457C45.842 22.656 45.746 22.656 45.746 20.8531C45.746 19.5226 46.1799 19.3421 46.7386 19.3402C47.2974 19.3382 47.6545 19.5149 47.6545 20.8493C47.6545 22.6522 47.8465 22.6522 47.8465 24.457C47.8465 26.2618 47.6314 26.2598 47.6314 28.0646C47.6314 29.8694 47.593 29.8675 47.593 31.6723C47.593 33.4771 47.8273 33.481 47.8273 35.2858C47.81 37.0675 47.6353 37.0714 47.6353 38.8685C47.634 40.0678 47.6321 41.2678 47.6295 42.4685C47.6372 44.2714 47.6641 44.2714 47.6698 46.0742C47.6737 47.881 47.8407 47.8771 47.8311 49.6954C47.8311 49.9238 47.8273 50.1254 47.8254 50.304C47.8254 50.4787 47.8254 50.6323 47.8254 50.7706C47.8254 51.0317 47.8369 51.2429 47.8484 51.4502C47.8772 51.8669 47.906 52.2874 48.0308 53.1034C48.1306 53.7024 48.0673 53.9962 47.8964 54.1766C47.7255 54.3533 47.451 54.4166 47.186 54.5069C46.921 54.5952 46.6599 54.697 46.4142 54.5914C46.1722 54.4877 45.9399 54.1766 45.8228 53.4624L45.8209 53.4605Z",
        fill: "#141413",
      }),
    ],
  });
}
const opt = {
  sheet: {
    icon: N.jsx(yT, {}),
    title: "Claude, right in your workbooks",
    description:
      "Analyze sheets, update assumptions, debug errors—with citations and transparency.",
  },
  slide: {
    icon: N.jsx(fq, { className: "w-24 h-24" }),
    title: "Claude, right in your slides",
    description:
      "Pinpoint editing, works with your templates, creates fully editable charts and tables.",
  },
  doc: {
    icon: N.jsx(dq, { className: "w-24 h-24" }),
    title: "Claude, right in your documents",
    description:
      "Draft, revise, and review—with tracked changes and inline citations.",
  },
};
function apt() {
  const t = Jd(),
    e = Zv();
  I.useEffect(() => {
    e && t("/", { replace: !0 });
  }, [e, t]);
  const n = lpt(),
    { submitPaste: r, submitting: i, error: s } = cpt(),
    [o, a] = I.useState(!1),
    l = Fn(),
    c = opt[l],
    { sendAnalytics: u } = rd();
  I.useEffect(() => {
    (u("sheets.auth.login_page_viewed", { surface: l, vendor: Zr }),
      u("sheets.funnel.login_page_viewed", { surface: l, vendor: Zr }));
  }, [u, l]);
  const d =
      "w-full flex h-10 justify-center items-center rounded-xl transition-colors font-base-bold",
    f = `${d} bg-text-100 text-bg-100 hover:bg-text-200`,
    h = `${d} border border-border-300 text-text-100 hover:bg-bg-200`,
    m = (g) => {
      const p = fj();
      if (p === void 0) {
        const y = I6e();
        (Ft("oauth_state_missing_at_click", {
          office_platform: au() ?? "unknown",
          ss_len: y.ss_len,
          ss_module: y.ss_module,
        }),
          xt.error(
            "OAuth state missing at click — mount-time sessionStorage write did not survive to click",
            { component: "oauth", errorType: Zn.AUTH, extra: y },
          ));
      }
      (Ait(g),
        Ft("oauth_login_initiated", { popup_opened: !0, cta: g, flow_id: p }),
        u("sheets.auth.login_clicked", {
          surface: l,
          vendor: Zr,
          cta: g,
          flow_id: p,
        }),
        u("sheets.funnel.oauth_redirect", {
          surface: l,
          vendor: Zr,
          cta: g,
          flow_id: p,
          office_platform: au(),
        }),
        a(!0));
    };
  return N.jsx("div", {
    className:
      "h-full flex flex-col items-center justify-center px-4 py-4 text-center text-text-400",
    children: N.jsxs("div", {
      className: "flex flex-col items-center w-full max-w-[272px]",
      children: [
        N.jsx("div", {
          className: "flex w-24 h-24 justify-center items-center mb-6",
          children: c.icon,
        }),
        N.jsx("h1", {
          className: "font-title text-text-300 mb-2",
          children: c.title,
        }),
        N.jsx("p", {
          className: "font-small text-text-300 mb-6",
          children: c.description,
        }),
        o
          ? N.jsx(X5e, {
              onSubmit: r,
              onBack: () => a(!1),
              submitting: i,
              error: s,
              onPreflightFail: (g) =>
                Ft("oauth_login_failed", {
                  reason: "malformed",
                  error_message: "preflight: bad shape before submit",
                  input_method: "manual_continue",
                  input_length: g,
                  flow_id: fj(),
                }),
            })
          : N.jsxs("div", {
              className: "w-full flex flex-col gap-2.5",
              children: [
                N.jsx("a", {
                  href: n,
                  target: "_blank",
                  rel: "noopener",
                  onClick: () => m("login"),
                  className: f,
                  children: "Log in to Claude",
                }),
                N.jsx("a", {
                  href: n,
                  target: "_blank",
                  rel: "noopener",
                  onClick: () => m("signup"),
                  className: h,
                  children: "Sign up",
                }),
                N.jsxs(dk, {
                  to: "/auth/3p",
                  className: `${h} group gap-2.5 hover:[--stack-gap:-3px]`,
                  children: [
                    N.jsx(Jht, {}),
                    N.jsx("span", { children: "Bedrock, Vertex, or Gateway" }),
                  ],
                }),
              ],
            }),
      ],
    }),
  });
}
function lpt() {
  const [t, e] = I.useState("");
  return (
    I.useEffect(() => {
      Eit().then(e);
    }, []),
    t
  );
}
function cpt() {
  const t = gn((u) => u.loadProfile),
    e = Jd(),
    { sendAnalytics: n } = rd(),
    r = Fn(),
    [i, s] = I.useState(!1),
    [o, a] = I.useState(null),
    l = I.useRef(!1);
  return {
    submitPaste: I.useCallback(
      async (u, d) => {
        if (l.current || i) return;
        (s(!0), a(null));
        const f = kit(),
          h = fj(),
          m = au(),
          g = R6e();
        Ft("oauth_paste_submitted", { input_method: d, flow_id: h });
        try {
          const p = await Tit(u);
          if (!p.ok) {
            (Ft("oauth_login_failed", {
              reason: p.reason,
              error_message: p.message,
              input_method: d,
              input_length: u.length,
              flow_id: h,
            }),
              n("sheets.auth.login_failed", {
                surface: r,
                vendor: Zr,
                reason: p.reason,
                error_message: p.message,
                cta: f,
                flow_id: h,
                office_platform: m,
              }),
              a(p.message));
            return;
          }
          if (p.token?.accessToken) {
            l.current = !0;
            const y = { kind: "oauth", ...p.token };
            (await cr.getState().setProfile(y),
              t(y),
              Ft("oauth_login_completed", {
                duration_ms: g,
                input_method: d,
                cta: f,
                flow_id: h,
              }),
              n("sheets.auth.login_completed", {
                surface: r,
                vendor: Zr,
                cta: f,
                flow_id: h,
                office_platform: m,
              }),
              n("sheets.funnel.auth_completed", {
                surface: r,
                vendor: Zr,
                cta: f,
                flow_id: h,
                office_platform: m,
              }),
              await e("/"));
          } else {
            const y =
              "Sign-in failed — no access token received. Click Start Over and try again.";
            (Ft("oauth_login_failed", {
              reason: "exchange_failed",
              error_message: "ok:true but token.accessToken falsy",
              input_method: d,
              flow_id: h,
            }),
              a(y));
          }
        } finally {
          s(!1);
        }
      },
      [e, t, n, r, i],
    ),
    submitting: i,
    error: o,
  };
}
function upt() {
  const t = Mge();
  return (
    I.useEffect(() => {
      nH(t, {
        tags: { component: "RootErrorBoundary", route_error: !0 },
        extra: { isRouteErrorResponse: W4(t) },
      });
    }, [t]),
    N.jsx("div", {
      className: "h-screen p-3",
      children: N.jsxs("div", {
        className:
          "rounded-2xl h-full bg-bg-100 flex flex-col justify-center items-center text-center",
        children: [
