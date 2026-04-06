  switch (t) {
    case "get_connected_agents":
      return n.getConnectedAgents();
    case "send_message": {
      const r = e.agent_id,
        i = e.message;
      if (!r || !i) return { error: "agent_id and message are required" };
      try {
        return (
          await n.sendMessage(r, i),
          Ft("conductor_message_sent", {
            peer_agent_id: r,
            peer_app_name: gw(r),
            message_length: i.length,
          }),
          {
            status: "delivered",
            agent_id: r,
            instruction:
              "Message delivered. The other agent is now working on your request. End your turn and tell the user you're waiting for a response. You will be notified when the agent replies.",
          }
        );
      } catch (s) {
        return { error: s instanceof Error ? s.message : String(s) };
      }
    }
    case "bash": {
      const r = e.command;
      return (Ft("conductor_bash_read", LCt(r)), G7t(r));
    }
    default:
      return { error: `Unknown conductor tool: ${t}` };
  }
}
const ide =
    'FILE SHARING MECHANICS: To broadcast a file, inside execute_office_js read your data and call conductor.writeFile("name.json", JSON.stringify(data)). The file is immediately visible to all peers at /agents/<your-id>/files/name.json.',
  FCt = `CHART SHARING: When sending a chart to a PowerPoint agent:
1. Use extract_chart_xml to extract the chart — it broadcasts chart.xml, chart-style.xml, chart-colors.xml to all peers.
2. Call send_message with a short message like 'Please add the "<chart title>" chart.' — the files are already visible in their filesystem.
Do NOT describe chart data, categories, values, or series in the message — all data is in the shared files. Do NOT copy the XML into the message text. Do NOT reconstruct chart XML from scratch or send base64 images.

MULTI-CHART SHARING: When sharing multiple charts:
1. Extract each chart with extract_chart_xml using a unique fileName prefix (e.g. "revenue", "costs") to avoid overwriting.
2. After extracting all charts, call send_message ONCE listing the chart file prefixes so the receiver knows which files to use.

TABLE / CELL DATA SHARING: When sharing cell data with another Excel agent, prefer to use get_cell_ranges (includeStyles: true) so formulas and formatting (number formats, fonts, borders) are preserved. Do NOT use get_range_as_csv — it discards formulas and formatting.`;
function UCt() {
  return Fn() === "sheet"
    ? `${ide}

${FCt}`
    : ide;
}
function Wxe() {
  return f_t({ sendMessageAddendum: UCt() });
}
const jCt = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        ConductorClient: V7e,
        consumePendingConductorFileName: Hxe,
        consumePendingConductorFrom: $xe,
        executeConductorTool: Vxe,
        getActiveConductorClient: N4,
        getConductorAgentSchema: Lxe,
        getConductorAgentStatus: Fxe,
        getConductorAgentsList: xD,
        getConductorSystemReminders: jxe,
        getConductorToolDefinitions: Wxe,
        getPeerAppName: gw,
        getSelfAgentId: Oxe,
        getSelfDocumentUrl: Nxe,
        onConductorAgentListChange: Uxe,
        pushConductorSystemReminder: L5,
        registerConductorAgentOffline: BC,
        registerConductorAgentOnline: Mxe,
        setActiveConductorClient: jB,
        setPendingConductorFileName: zxe,
        setPendingConductorFrom: Bxe,
        setSelfAgentId: UB,
        updateConductorAgentStatus: Pxe,
      },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  BE = "http://schemas.microsoft.com/office/2006/xmlPackage";
function qxe(t) {
  return new DOMParser().parseFromString(t, "application/xml");
}
function BCt(t) {
  return new XMLSerializer().serializeToString(t);
}
function $Ct(t) {
  const e = qxe(t),
    n = e.getElementsByTagNameNS(BE, "part");
  for (let r = 0; r < n.length; r++) {
    if (
      !(n[r].getAttributeNS(BE, "name") ?? n[r].getAttribute("pkg:name"))
        ?.toLowerCase()
        .endsWith(".rels")
    )
      continue;
    const s = n[r].getElementsByTagNameNS("*", "Relationship");
    for (let o = s.length - 1; o >= 0; o--)
      s[o].getAttribute("TargetMode")?.toLowerCase() === "external" &&
        s[o].parentNode?.removeChild(s[o]);
  }
  return BCt(e);
}
function zCt(t) {
  const e = qxe(t),
    n = e.getElementsByTagName("parsererror")[0];
  if (n)
    throw new Error(
      `SecurityBlocked: malformed XML — ${n.textContent?.slice(0, 200)}`,
    );
  const r = e.getElementsByTagNameNS(BE, "part");
  for (let i = 0; i < r.length; i++) {
    const s = (
      r[i].getAttributeNS(BE, "name") ??
      r[i].getAttribute("pkg:name") ??
      ""
    ).toLowerCase();
    if (/\/vbaproject/.test(s))
      throw new Error(
        "SecurityBlocked: VBA macros not permitted in insertOoxml",
      );
    if (/\/activex\//.test(s))
      throw new Error(
        "SecurityBlocked: ActiveX controls not permitted in insertOoxml",
      );
    if (/\/macrosheets\//.test(s))
      throw new Error(
        "SecurityBlocked: XLM macro sheets not permitted in insertOoxml",
      );
    if (/\/embeddings\//.test(s))
      throw new Error(
        "SecurityBlocked: OLE embeddings not permitted in insertOoxml",
      );
  }
}
var Th = "operator",
  HB = "operator-trim",
  q9 = "bool",
  y6 = "error",
  yw = "number",
  b6 = "func",
  CD = "newline",
  SD = "whitespace",
  G9 = "string",
  Eu = "context_quote",
  Fc = "context",
  ri = "range",
  qu = "range_beam",
  ph = "range_ternary",
  tc = "range_named",
  ah = "structured",
  VB = "fx_prefix",
  ku = "unknown",
  ED = "UnaryExpression",
  uZ = "BinaryExpression",
  kg = "ReferenceIdentifier",
  $E = "Literal",
  dZ = "ErrorLiteral",
  WB = "CallExpression",
  Gxe = "LambdaExpression",
  Zxe = "LetExpression",
  HCt = "ArrayExpression",
  fZ = "Identifier",
  VCt = "LetDeclarator",
  Kxe = 2 ** 14 - 1,
  Xxe = 2 ** 20 - 1,
  Yxe = "$",
  WCt = [
    [ri, ":", ri],
    [ri, ".:", ri],
    [ri, ":.", ri],
    [ri, ".:.", ri],
    [ri],
    [qu],
    [ph],
    [Fc, "!", ri, ":", ri],
    [Fc, "!", ri, ".:", ri],
    [Fc, "!", ri, ":.", ri],
    [Fc, "!", ri, ".:.", ri],
    [Fc, "!", ri],
    [Fc, "!", qu],
    [Fc, "!", ph],
    [Eu, "!", ri, ":", ri],
    [Eu, "!", ri, ".:", ri],
    [Eu, "!", ri, ":.", ri],
    [Eu, "!", ri, ".:.", ri],
    [Eu, "!", ri],
    [Eu, "!", qu],
    [Eu, "!", ph],
    [tc],
    [Fc, "!", tc],
    [Eu, "!", tc],
    [ah],
    [tc, ah],
    [Fc, "!", tc, ah],
    [Eu, "!", tc, ah],
  ],
  Jxe = {};
function Qxe(t, e) {
  if (t.length) {
    const n = t[0];
    (e[n] || (e[n] = {}), Qxe(t.slice(1), e[n]));
  } else e[Yxe] = !0;
}
WCt.forEach((t) => Qxe(t.concat().reverse(), Jxe));
var qCt = (t, e, n, r = 0) => {
  let i = r,
    s = e;
  const o = t.length - r;
  for (; i <= o; ) {
    const a = t[n - i];
    if (a) {
      const l = a.type === Th ? a.value : a.type;
      if (l in s) {
        ((s = s[l]), (i += 1));
        continue;
      }
    }
    return s[Yxe] ? i : 0;
  }
};
function GCt(t) {
  const e = [];
  for (let n = t.length - 1; n >= 0; n--) {
    let r = t[n];
    const i = r.type;
    if (i === ri || i === qu || i === ph || i === tc || i === ah) {
      const s = qCt(t, Jxe, n);
      if (s > 1) {
        r = { ...r, value: "" };
        const o = n - s + 1;
        for (let a = o; a <= n; a++) r.value += t[a].value;
        (r.loc && t[o].loc && (r.loc[0] = t[o].loc[0]), (n -= s - 1));
      }
    }
    e[e.length] = r;
  }
  return e.reverse();
}
var sde =
    /#(?:NAME\?|FIELD!|CALC!|VALUE!|REF!|DIV\/0!|NULL!|NUM!|N\/A|GETTING_DATA\b|SPILL!|UNKNOWN!|SYNTAX\?|ERROR!|CONNECT!|BLOCKED!|EXTERNAL!)/iy,
  ZCt = 35;
function KCt(t, e) {
  if (t.charCodeAt(e) === ZCt) {
    sde.lastIndex = e;
    const n = sde.exec(t);
    if (n) return { type: y6, value: n[0] };
  }
}
var RP = 46,
  ode = 58;
function XCt(t, e) {
  const n = t.charCodeAt(e);
  if (n === RP || n === ode) {
    const r = t.charCodeAt(e + 1);
    if (n !== r) {
      if (r === ode)
        return {
          type: HB,
          value: t.slice(e, e + (t.charCodeAt(e + 2) === RP ? 3 : 2)),
        };
      if (r === RP) return { type: HB, value: t.slice(e, e + 2) };
    }
  }
}
function YCt(t, e) {
  const n = t.charCodeAt(e),
    r = t.charCodeAt(e + 1);
  if (
    (n === 60 && r === 61) ||
    (n === 62 && r === 61) ||
    (n === 60 && r === 62)
  )
    return { type: Th, value: t.slice(e, e + 2) };
  if (
    n === 123 ||
    n === 125 ||
    n === 33 ||
    n === 35 ||
    n === 37 ||
    n === 38 ||
    (n >= 40 && n <= 45) ||
    n === 47 ||
    (n >= 58 && n <= 62) ||
    n === 64 ||
    n === 94
  )
    return { type: Th, value: t[e] };
}
function ade(t) {
  return (
    (t >= 65 && t <= 90) ||
    (t >= 97 && t <= 122) ||
    (t >= 48 && t <= 57) ||
    t === 95 ||
    t === 92 ||
    t === 40 ||
    t === 46 ||
    t === 63 ||
    t > 160
  );
}
function JCt(t, e) {
  const n = t.charCodeAt(e);
  if (n === 84 || n === 116) {
    const r = t.charCodeAt(e + 1);
    if (r === 82 || r === 114) {
      const i = t.charCodeAt(e + 2);
      if (i === 85 || i === 117) {
        const s = t.charCodeAt(e + 3);
        if (s === 69 || s === 101) {
          const o = t.charCodeAt(e + 4);
          if (!ade(o)) return { type: q9, value: t.slice(e, e + 4) };
        }
      }
    }
  }
  if (n === 70 || n === 102) {
    const r = t.charCodeAt(e + 1);
    if (r === 65 || r === 97) {
      const i = t.charCodeAt(e + 2);
      if (i === 76 || i === 108) {
        const s = t.charCodeAt(e + 3);
        if (s === 83 || s === 115) {
          const o = t.charCodeAt(e + 4);
          if (o === 69 || o === 101) {
            const a = t.charCodeAt(e + 5);
            if (!ade(a)) return { type: q9, value: t.slice(e, e + 5) };
          }
        }
      }
    }
  }
}
function QCt(t, e) {
  const n = e;
  for (; t.charCodeAt(e) === 10; ) e++;
  if (e !== n) return { type: CD, value: t.slice(n, e) };
}
function hZ(t) {
  return (
    t === 9 ||
    t === 11 ||
    t === 12 ||
    t === 13 ||
    t === 32 ||
    t === 160 ||
    t === 5760 ||
    t === 8232 ||
    t === 8233 ||
    t === 8239 ||
    t === 8287 ||
    t === 12288 ||
    t === 65279 ||
    (t >= 8192 && t <= 8202)
  );
}
function eSt(t, e) {
  const n = e;
  for (; hZ(t.charCodeAt(e)); ) e++;
  if (e !== n) return { type: SD, value: t.slice(n, e) };
}
var IP = 34;
function tSt(t, e) {
  const n = e;
  if (t.charCodeAt(e) === IP) {
    for (e++; e < t.length; ) {
      if (t.charCodeAt(e) === IP && (e++, t.charCodeAt(e) !== IP))
        return { type: G9, value: t.slice(n, e) };
      e++;
    }
    return { type: G9, value: t.slice(n, e), unterminated: !0 };
  }
}
var $C = 39,
  eCe = 91,
  tCe = 93,
  qB = 33;
function nSt(t, e, n) {
  const r = t.charCodeAt(e);
  let i, s;
  if (r === $C) {
    const o = e;
    for (e++; e < t.length; ) {
      const a = t.charCodeAt(e);
      if (a === eCe) {
        if (i) return;
        i = e;
      } else if (a === tCe) {
        if (s) return;
        s = e;
      } else if (a === $C && (e++, t.charCodeAt(e) !== $C)) {
        let l = i == null && s == null;
        return (
          n.xlsx && i === o + 1 && s === e - 2 && (l = !0),
          i >= o + 1 && s < e - 2 && s > i + 1 && (l = !0),
          l && t.charCodeAt(e) === qB
            ? { type: Eu, value: t.slice(o, e) }
            : void 0
        );
      }
      e++;
    }
  }
}
function rSt(t, e, n) {
  const r = t.charCodeAt(e);
  let i, s;
  if (r !== $C && r !== qB) {
    const o = e;
    for (; e < t.length; ) {
      const a = t.charCodeAt(e);
      if (a === eCe) {
        if (i) return;
        i = e;
      } else if (a === tCe) {
        if (s) return;
        s = e;
      } else if (a === qB) {
        let l = i == null && s == null;
        if (
          (n.xlsx && i === o && s === e - 1 && (l = !0),
          i >= o && s < e - 1 && s > i + 1 && (l = !0),
          l)
        )
          return { type: Fc, value: t.slice(o, e) };
      } else if (
        (i == null || s != null) &&
        !(
          (a >= 65 && a <= 90) ||
          (a >= 97 && a <= 122) ||
          (a >= 48 && a <= 57) ||
          a === 46 ||
          a === 95 ||
          a === 161 ||
          a === 164 ||
          a === 167 ||
          a === 168 ||
          a === 170 ||
          a === 173 ||
          a >= 175
        )
      )
        return;
      e++;
    }
  }
}
var OP = 46,
  lde = 58;
function GB(t, e) {
  const n = t.charCodeAt(e);
  if (n === OP) {
    if (t.charCodeAt(e + 1) === lde) return t.charCodeAt(e + 2) === OP ? 3 : 2;
  } else if (n === lde) return t.charCodeAt(e + 1) === OP ? 2 : 1;
  return 0;
}
function km(t, e) {
  const n = t.charCodeAt(e);
  return !(
    (n >= 65 && n <= 90) ||
    (n >= 97 && n <= 122) ||
    (n >= 48 && n <= 57) ||
    n === 95 ||
    n > 160
  );
}
function cde(t, e) {
  const n = t.charCodeAt(e);
  return !(
    (n >= 65 && n <= 90) ||
    (n >= 97 && n <= 122) ||
    (n >= 48 && n <= 57) ||
    n === 95 ||
    n === 40 ||
    n === 36 ||
    n === 46
  );
}
function NP(t, e) {
  const n = e;
  t.charCodeAt(e) === 36 && e++;
  const r = e + 3;
  let i = 0;
  do {
    const s = t.charCodeAt(e);
    if (s >= 65 && s <= 90) ((i = 26 * i + s - 64), e++);
    else if (s >= 97 && s <= 122) ((i = 26 * i + s - 96), e++);
    else break;
  } while (e < r && e < t.length);
  return i && i <= Kxe + 1 ? e - n : 0;
}
function ox(t, e) {
  const n = e;
  t.charCodeAt(e) === 36 && e++;
  const r = e + 7;
  let i = 0,
    s = t.charCodeAt(e);
  if (s >= 49 && s <= 57) {
    ((i = i * 10 + s - 48), e++);
    do
      if (((s = t.charCodeAt(e)), s >= 48 && s <= 57))
        ((i = i * 10 + s - 48), e++);
      else break;
    while (e < r && e < t.length);
  }
  return i && i <= Xxe + 1 ? e - n : 0;
}
function iSt(t, e, n) {
  let r = e;
  const i = NP(t, r);
  let s = 0,
    o = 0;
  if (i) {
    r += i;
    const a = ox(t, r);
    r += a;
    const l = GB(t, r),
      c = r;
    if (l) {
      if (
        ((r += l),
        (s = NP(t, r)),
        (r += s),
        (o = ox(t, r)),
        (r += o),
        a && o && s)
      ) {
        if (km(t, r) && n.mergeRefs) return { type: ri, value: t.slice(e, r) };
      } else if (!a && !o) {
        if (km(t, r)) return { type: qu, value: t.slice(e, r) };
      } else if (n.allowTernary && (o || s) && cde(t, r))
        return { type: ph, value: t.slice(e, r) };
    }
    if (a && km(t, c)) return { type: ri, value: t.slice(e, c) };
  } else {
    const a = ox(t, r);
    if (a) {
      r += a;
      const l = GB(t, r);
      if (l) {
        if (
          ((r += l),
          (s = NP(t, r)),
          s && (r += s),
          (o = ox(t, r)),
          (r += o),
          s && o && n.allowTernary && cde(t, r))
        )
          return { type: ph, value: t.slice(e, r) };
        if (!s && o && km(t, r)) return { type: qu, value: t.slice(e, r) };
      }
    }
  }
}
var sSt = 91,
  oSt = 93,
  aSt = 82,
  lSt = 114,
  cSt = 67,
  uSt = 99,
  dSt = 43,
  ude = 45;
function ax(t, e, n = !1) {
  const r = e,
    i = t.charCodeAt(e);
  if (n ? i === aSt || i === lSt : i === cSt || i === uSt) {
    e++;
    let s = 0,
      o = 0,
      a = t.length;
    const l = t.charCodeAt(e);
    let c,
      u = 1;
    const d = l === sSt;
    if (d)
      ((a = Math.min(a, e + (n ? 8 : 6))),
        e++,
        (c = t.charCodeAt(e)),
        (c === dSt || c === ude) && (e++, a++, (u = c === ude ? -1 : 1)));
    else if (l < 49 || l > 57 || isNaN(l)) return 1;
    do {
      const h = t.charCodeAt(e);
      if (h >= 48 && h <= 57) ((o = o * 10 + h - 48), s++, e++);
      else break;
    } while (e < a);
    const f = n ? Xxe : Kxe;
    return d
      ? t.charCodeAt(e) !== oSt
        ? 0
        : (e++, (o *= u), s && -f <= o && o <= f ? e - r : 0)
      : s && o <= f + 1
        ? e - r
        : 0;
  }
  return 0;
}
function fSt(t, e, n) {
  let r = e;
  const i = ax(t, r, !0);
  r += i;
  const s = ax(t, r);
  if (((r += s), s || i)) {
    const o = GB(t, r),
      a = r;
    if (o) {
      r += o;
      const l = ax(t, r, !0);
      r += l;
      const c = ax(t, r);
      if (
        ((r += c),
        (i && !s && l && c) ||
          (!i && s && l && c) ||
          (i && s && l && !c) ||
          (i && s && !l && c))
      ) {
        if (n.allowTernary && km(t, r))
          return { type: ph, value: t.slice(e, r) };
      } else if (((s && c && !i && !l) || (!s && !c && i && l)) && km(t, r))
        return { type: qu, value: t.slice(e, r) };
    }
    if (km(t, a)) return { type: i && s ? ri : qu, value: t.slice(e, a) };
  }
}
function hSt(t, e, n) {
  return n.r1c1 ? fSt(t, e, n) : iSt(t, e, n);
}
var zC = 64,
  M4 = 93,
  Zy = 91,
  nCe = 58,
  pSt = 44,
  HC = 35,
  lx = 39,
  MP = { headers: 1, data: 2, totals: 4, all: 8, "this row": 16, "@": 16 },
  Dp = (...t) => Object.freeze(t),
  dde = {
    0: Dp(),
    1: Dp("headers"),
    2: Dp("data"),
    4: Dp("totals"),
    8: Dp("all"),
    16: Dp("this row"),
    3: Dp("headers", "data"),
    6: Dp("data", "totals"),
  };
function fde(t, e) {
  let n = e;
  if (t.charCodeAt(n++) === Zy && t.charCodeAt(n++) === HC) {
    do {
      const r = t.charCodeAt(n);
      if ((r >= 65 && r <= 90) || (r >= 97 && r <= 122) || r === 32) n++;
      else break;
    } while (n < e + 11);
    if (t.charCodeAt(n++) === M4) return n - e;
  }
}
function cx(t, e) {
  let n = e;
  for (; hZ(t.charCodeAt(n)); ) n++;
  return n - e;
}
function PP(t, e, n = !0) {
  let r = e,
    i = "";
  if (t.charCodeAt(r) === Zy) {
    r++;
    let s;
    do
      if (((s = t.charCodeAt(r)), s === lx))
        if (
          (r++,
          (s = t.charCodeAt(r)),
          s === lx || s === HC || s === zC || s === Zy || s === M4)
        )
          ((i += String.fromCharCode(s)), r++);
        else return;
      else {
        if (s === lx || s === HC || s === zC || s === Zy) return;
        if (s === M4) return (r++, [t.slice(e, r), i]);
        ((i += String.fromCharCode(s)), r++);
      }
    while (r < t.length);
  } else if (n) {
    let s;
    do {
      if (
        ((s = t.charCodeAt(r)),
        s === lx || s === HC || s === zC || s === Zy || s === M4 || s === nCe)
      )
        break;
      ((i += String.fromCharCode(s)), r++);
    } while (r < t.length);
    if (r !== e) return [i, i];
  }
}
function mSt(t, e = 0) {
  const n = [],
    r = e;
  let i,
    s = 0;
  if (t.charCodeAt(e) !== Zy) return;
  if ((i = fde(t, e))) {
    const a = t.slice(e + 2, e + i - 1);
    e += i;
    const l = MP[a.toLowerCase()];
    if (!l) return;
    s |= l;
  } else if ((i = PP(t, e, !1))) ((e += i[0].length), i[1] && n.push(i[1]));
  else {
    let a = !0;
    for (e++, e += cx(t, e); a && (i = fde(t, e)); ) {
      const c = t.slice(e + 2, e + i - 1),
        u = MP[c.toLowerCase()];
      if (!u) return;
      ((s |= u),
        (e += i),
        (e += cx(t, e)),
        (a = t.charCodeAt(e) === pSt),
        a && (e++, (e += cx(t, e))));
    }
    if (
      (a &&
        t.charCodeAt(e) === zC &&
        ((s |= MP["@"]), (e += 1), (a = t.charCodeAt(e) !== M4)),
      !dde[s])
    )
      return;
    const l = a && PP(t, e, !0);
    if (l) {
      if (((e += l[0].length), n.push(l[1]), t.charCodeAt(e) === nCe)) {
        e++;
        const c = PP(t, e, !0);
        if (c) ((e += c[0].length), n.push(c[1]));
        else return;
      }
      a = !1;
    }
    if (((e += cx(t, e)), a || t.charCodeAt(e) !== M4)) return;
    e++;
  }
  const o = dde[s];
  return {
    columns: n,
    sections: o && o.concat(),
    length: e - r,
    token: t.slice(r, e),
  };
}
var gSt = 33;
function ySt(t, e) {
  const n = mSt(t, e);
  if (n && n.length) {
    let r = n.length;
    for (; hZ(t.charCodeAt(e + r)); ) r++;
    if (t.charCodeAt(e + r) !== gSt) return { type: ah, value: n.token };
  }
}
function LP(t, e) {
  const n = e;
  do {
    const r = t.charCodeAt(e);
    if (r < 48 || r > 57) break;
    e++;
  } while (e < t.length);
  return e - n;
}
function bSt(t, e) {
  const n = e,
    r = LP(t, e);
  if (!r) return;
  if (((e += r), t.charCodeAt(e) === 46)) {
    e++;
    const o = LP(t, e);
    if (!o) return;
    e += o;
  }
  const s = t.charCodeAt(e);
  if (s === 69 || s === 101) {
    e++;
    const o = t.charCodeAt(e);
    (o === 43 || o === 45) && e++;
    const a = LP(t, e);
    if (!a) return;
    e += a;
  }
  return { type: yw, value: t.slice(n, e) };
}
var vSt = 91,
  wSt = 40,
  _St = 33,
  Z9 = 32,
  ZB = new Uint8Array(180 - Z9),
  K9 = 1,
  zE = 2,
  X9 = 4,
  AD = 8,
  pZ = 16,
  kD = 32,
  xSt = K9 | zE | X9,
  CSt = AD | pZ | kD,
  hde = K9 | AD | X9 | kD;
for (let t = Z9; t < 180; t++) {
  const e = String.fromCharCode(t),
    n = /^[a-zA-Z_\\\u00a1-\uffff]$/.test(e),
    r = /^[a-zA-Z_]$/.test(e),
    i = /^[a-zA-Z0-9_.\\?\u00a1-\uffff]$/.test(e),
    s = /^[a-zA-Z0-9_.]$/.test(e),
    o = /^[a-zA-Z0-9_.¡¤§¨ª\u00ad¯-\uffff]$/.test(e);
  ZB[t - Z9] =
    (n ? K9 : 0) |
    (i ? AD : 0) |
    (r ? zE : 0) |
    (s ? pZ : 0) |
    (o ? X9 : 0) |
    (o ? kD : 0);
}
function pde(t, e, n, r, i) {
  const s = r - n;
  return i && s && s < 255
    ? (e === 92 && s < 3) ||
      (s === 1 && (e === 114 || e === 82 || e === 99 || e === 67))
      ? void 0
      : { type: tc, value: t.slice(n, r) }
    : { type: ku, value: t.slice(n, r) };
}
function SSt(t, e, n) {
  const r = e,
    i = t.charCodeAt(e),
    s = i > 180 ? hde : ZB[i - Z9];
  if ((s & X9 && !(s & K9) && !(s & zE)) || i === vSt) return rSt(t, e, n);
  if (!(s & xSt)) return;
  let o = s & K9 ? 1 : 0,
    a = s & zE ? 1 : 0,
    l = s & X9 ? 1 : 0;
  e++;
  let c;
  do {
    c = t.charCodeAt(e);
    const u = i > 180 ? hde : (ZB[c - Z9] ?? 0);
    if (u & CSt)
      (o && !(u & AD) && (o = 0),
        a && !(u & pZ) && (a = 0),
        l && !(u & kD) && (l = 0));
    else
      return c === wSt && a
        ? { type: b6, value: t.slice(r, e) }
        : c === _St && l
          ? { type: Fc, value: t.slice(r, e) }
          : pde(t, i, r, e, o);
    e++;
  } while ((o || a || l) && e < t.length);
  if (r !== e) return pde(t, i, r, e, o);
}
var ESt = [KCt, XCt, YCt, QCt, eSt, tSt, hSt, bSt, JCt, nSt, SSt, ySt],
  rCe = /^l(?:ambda|et)$/i,
  ASt = (t, e) => t && t.type === e,
  mde = (t) => t === tc || t === b6,
  kSt = (t) =>
    !ASt(t, Th) ||
    t.value === "%" ||
    t.value === "}" ||
    t.value === ")" ||
    t.value === "#";
function TSt(t) {
  let e = 0,
    n = 0,
    r;
  for (const i of t)
    (i.type === Th
      ? i.value === "("
        ? (n++, r.type === b6 && rCe.test(r.value) && (e = n))
        : i.value === ")" && (n--, n < e && (e = 0))
      : e && i.type === ku && /^[rc]$/.test(i.value) && (i.type = tc),
      (r = i));
  return t;
}
function DSt(t, e, n = {}) {
  const {
      withLocation: r = !1,
      mergeRefs: i = !0,
      negativeNumbers: s = !0,
    } = n,
    o = {
      withLocation: r,
      mergeRefs: i,
      allowTernary: n.allowTernary ?? !1,
      negativeNumbers: s,
      r1c1: n.r1c1 ?? !1,
      xlsx: n.xlsx ?? !1,
    },
    a = [];
  let l = 0,
    c = 0,
    u = 0;
  const d = [];
  let f, h, m;
  const g = (y) => {
    let b = y.type;
    const w = b === ku,
      x = m && m.type === ku;
    m && ((w && x) || (w && mde(m.type)) || (x && mde(b)))
      ? ((m.value += y.value), (m.type = ku), r && (m.loc[1] = y.loc[1]))
      : (b === HB && (d.push(a.length), (b = ku), (y.type = ku)),
        (a[a.length] = y),
        (m = y),
        b !== SD && b !== CD && ((h = f), (f = y)));
  };
  if (t.startsWith("=")) {
    const y = { type: VB, value: "=" };
    (r && (y.loc = [0, 1]), l++, g(y));
  }
  const p = e.length;
  for (; l < t.length; ) {
    const y = l;
    let b;
    for (let w = 0; w < p; w++)
      if (((b = e[w](t, l, o)), b)) {
        l += b.value.length;
        break;
      }
    if (
      (b || ((b = { type: ku, value: t[l] }), l++),
      r && (b.loc = [y, l]),
      m && b.value === "(" && m.type === b6 && rCe.test(m.value) && c++,
      b.type === ku && b.value.length === 1)
    ) {
      const w = b.value.toLowerCase();
      u += w === "r" || w === "c" ? 1 : 0;
    }
    if (s && b.type === yw) {
      const w = m;
      if (
        w?.type === Th &&
        w.value === "-" &&
        (!h || h.type === VB || !kSt(h))
      ) {
        const x = a.pop();
        ((b.value = "-" + b.value),
          b.loc && (b.loc[0] = x.loc[0]),
          (f = h),
          (m = a[a.length - 1]));
      }
    }
    g(b);
  }
  u && c && TSt(a);
  for (const y of d) {
    const b = a[y - 1],
      w = a[y + 1];
    a[y].type = b?.type === ri && w?.type === ri ? Th : ku;
  }
  return i ? GCt(a) : a;
}
function iCe(t, e = {}) {
  return DSt(t, ESt, e);
}
function mZ(t) {
  return (
    !!t &&
    (t.type === ri ||
      t.type === qu ||
      t.type === ph ||
      t.type === ah ||
      t.type === tc)
  );
}
function sCe(t) {
  return (
    !!t && (t.type === q9 || t.type === y6 || t.type === yw || t.type === G9)
  );
}
function RSt(t) {
  return !!t && t.type === y6;
}
function v1(t) {
  return !!t && (t.type === SD || t.type === CD);
}
function oCe(t) {
  return !!t && t.type === b6;
}
function gZ(t) {
  return !!t && t.type === Th;
}
var aCe = "(END)",
  yZ = "(FUNCTION)",
  lCe = "(WHITESPACE)",
  ISt = [
    "ANCHORARRAY",
    "CHOOSE",
    "DROP",
    "IF",
    "IFS",
    "INDEX",
    "INDIRECT",
    "LAMBDA",
    "LET",
    "OFFSET",
    "REDUCE",
    "SINGLE",
    "SWITCH",
    "TAKE",
    "TRIMRANGE",
    "XLOOKUP",
  ],
  th = {},
  Gr,
  nh,
  Kl,
  cCe = (t) => ISt.includes(t.toUpperCase()),
  OSt = (t, e = !1) => {
    const n = (t && t.value) + "";
    return !!(
      mZ(t) ||
      (e && gZ(t) && (n === ":" || n === "," || !n.trim())) ||
      (oCe(t) && cCe(n)) ||
      (RSt(t) && n === "#REF!")
    );
  },
  HE = (t) =>
    !!t &&
    (t.type === kg ||
      ((t.type === dZ || t.type === y6) && t.value === "#REF!") ||
      (t.type === uZ &&
        (t.operator === ":" || t.operator === " " || t.operator === ",")) ||
      mZ(t) ||
      (t.type === WB && cCe(t.callee.name)));
function go(t, e = null) {
  const n = new Error(t);
  throw (
    (n.source = nh.map((r) => r.value).join("")),
    (n.sourceOffset = nh
      .slice(0, e ?? Kl)
      .reduce((r, i) => r + i.value.length, 0)),
    n
  );
}
function NSt(t = !1) {
  let e = Kl,
    n;
  do n = nh[++e];
  while (n && (v1(n) || (gZ(n) && n.value === "(")));
  return OSt(n, t);
}
function yo(t = null, e = null) {
  if ((t && t !== Gr.id && go(`Expected ${t} but got ${Gr.id}`), v1(nh[Kl]))) {
    const i = HE(e),
      s = i && NSt(!1),
      o = i && nh[Kl + 1] && nh[Kl + 1].value === "(";
    if (!s && !o) for (; v1(nh[Kl]); ) Kl++;
  }
  if (Kl >= nh.length) {
    Gr = th[aCe];
    return;
  }
  const n = nh[Kl];
  ((Kl += 1), n.unterminated && go("Encountered an unterminated token"));
  let r;
  return (
    gZ(n)
      ? ((r = th[n.value]), r || go(`Unknown operator ${n.value}`))
      : v1(n)
        ? (r = th[lCe])
        : sCe(n)
          ? (r = th[$E])
          : mZ(n)
            ? (r = th[kg])
            : oCe(n)
              ? (r = th[yZ])
              : go(`Unexpected ${n.type} token: ${n.value}`),
    (Gr = Object.create(r)),
    (Gr.type = n.type),
    (Gr.value = n.value),
    n.loc && (Gr.loc = [...n.loc]),
    Gr
  );
}
function n2(t) {
  let e = Gr;
  yo(null, e);
  let n = e.nud();
  for (; t < Gr.lbp; ) ((e = Gr), yo(null, e), (n = e.led(n)));
  return n;
}
var MSt = {
  nud: () => go("Invalid syntax"),
  led: () => go("Missing operator"),
};
function af(t, e = 0) {
  let n = th[t];
  return (
    n
      ? e >= n.lbp && (n.lbp = e)
      : ((n = { ...MSt }), (n.id = t), (n.value = t), (n.lbp = e), (th[t] = n)),
    n
  );
}
function Ol(t, e, n) {
  const r = af(t, e);
  return (
    (r.led =
      n ||
      function (i) {
        ((this.type = uZ), (this.operator = this.value), delete this.value);
        const s = n2(e);
        return (
          (this.arguments = [i, s]),
          this.loc && (this.loc = [i.loc[0], s.loc[1]]),
          this
        );
      }),
    r
  );
}
function uCe(t, e) {
  const n = af(t, 0);
  return (
    (n.lbp = 70),
    (n.led =
      e ||
      function (r) {
        return (
          (this.type = ED),
          (this.operator = this.value),
          delete this.value,
          (this.arguments = [r]),
          this.loc && (this.loc[0] = r.loc[0]),
          this
        );
      }),
    n
  );
}
function bw(t, e) {
  const n = af(t);
  return (
    (n.nud =
      e ||
      function () {
        ((this.type = ED), (this.operator = this.value), delete this.value);
        const r = n2(70);
        return (
          (this.arguments = [r]),
          this.loc && (this.loc[1] = r.loc[1]),
          this
        );
      }),
    n
  );
}
function bZ(t, e) {
  return Ol(t, e, function (n) {
    HE(n) || go(`Unexpected ${t} operator`);
    const r = n2(e);
    return (
      HE(r) || go(`Unexpected ${Gr.type} following ${this.id}`),
      (this.type = uZ),
      (this.operator = this.value.trim() ? this.value : " "),
      delete this.value,
      (this.arguments = [n, r]),
      this.loc && (this.loc = [n.loc[0], r.loc[1]]),
      this
    );
  });
}
af(aCe);
bZ(":", 80);
var gde = bZ(",", 80);
bZ(lCe, 80);
var Gu = (t) => {
  const e = gde.lbp > 0;
  return (t != null && (gde.lbp = t ? 80 : 0), e);
};
uCe("%");
uCe("#", function (t) {
  return (
    HE(t) || go("# expects a reference"),
    (this.type = ED),
    (this.operator = this.value),
    delete this.value,
    (this.arguments = [t]),
    this
  );
});
bw("+");
bw("-");
bw("@");
Ol("^", 50);
Ol("*", 40);
Ol("/", 40);
Ol("+", 30);
Ol("-", 30);
Ol("&", 20);
Ol("=", 10);
Ol("<", 10);
Ol(">", 10);
Ol("<=", 10);
Ol(">=", 10);
Ol("<>", 10);
af($E).nud = function () {
  const { type: t, value: e } = this;
  if (((this.type = $E), (this.raw = e), t === yw)) this.value = +e;
  else if (t === q9) this.value = e.toUpperCase() === "TRUE";
  else if (t === y6) ((this.type = dZ), (this.value = e.toUpperCase()));
  else if (t === G9) this.value = e.slice(1, -1).replace(/""/g, '"');
  else throw new Error("Unsupported literal type: " + t);
  return this;
};
af(kg).nud = function () {
  return (
    this.type === tc
      ? (this.kind = "name")
      : this.type === ah
        ? (this.kind = "table")
        : this.type === qu
          ? (this.kind = "beam")
          : (this.kind = "range"),
    (this.type = kg),
    this
  );
};
af(")");
bw("(", function () {
  const t = Gu(!0),
    e = n2(0);
  return (yo(")", e), Gu(t), e);
});
af(yZ).nud = function () {
  return this;
};
Ol("(", 90, function (t) {
  let e = { type: fZ, name: t.value };
  t.id !== yZ &&
    (t.type === Gxe ||
    t.type === WB ||
    t.type === Zxe ||
    t.type === kg ||
    (t.type === ED && t.value === "#") ||
    (t.type === dZ && t.value === "#REF!")
      ? (e = t)
      : go("Unexpected call", Kl - 1));
  const n = t.value.toLowerCase();
  if (n === "lambda") return PSt.call(this, t);
  if (n === "let") return LSt.call(this, t);
  const r = [];
  let i = !1;
  if (Gr.id !== ")") {
    const o = Gu(!1);
    for (; Gr.id !== ")"; )
      if ((v1(Gr) && yo(), Gr.id === ",")) (r.push(null), (i = !0), yo());
      else {
        const a = n2(0);
        (r.push(a), (i = !1), Gr.id === "," && (yo(","), (i = !0)));
      }
    Gu(o);
  }
  i && r.push(null);
  const s = Gr;
  return (
    delete this.value,
    (this.type = WB),
    (this.callee = e),
    t.loc && (this.callee.loc = [...t.loc]),
    (this.arguments = r),
    t.loc && (this.loc = [t.loc[0], s.loc[1]]),
    yo(")", this),
    this
  );
});
function PSt(t) {
  const e = [],
    n = {};
  let r,
    i = !1;
  const s = Gu(!1);
  if (Gr.id !== ")")
    for (; !i; ) {
      v1(Gr) && yo();
      const o = Kl,
        a = n2(0);
      if (Gr.id === ",") {
        if (a.type === kg && a.kind === "name") {
          const l = a.value.toLowerCase();
          (l in n && go("Duplicate name: " + a.value), (n[l] = 1));
          const c = { type: fZ, name: a.value };
          (a.loc && (c.loc = a.loc), e.push(c));
        } else ((Kl = o), go("LAMBDA argument is not a name"));
        yo(",");
      } else ((r = a), (i = !0));
    }
  return (
    Gu(s),
    delete this.value,
    (this.type = Gxe),
    (this.params = e),
    (this.body = r || null),
    t.loc && (this.loc = [t.loc[0], Gr.loc[1]]),
    yo(")", this),
    this
  );
}
function LSt(t) {
  const e = [],
    n = [],
    r = {};
  let i,
    s = 0;
  const o = (c, u) => {
      if ((i && go("Unexpected argument following calculation"), u && s >= 2))
        i = c;
      else if (!(s % 2))
        if (c && c.type === kg && c.kind === "name") {
          const f = c.value.toLowerCase();
          (f in r && go("Duplicate name: " + c.value),
            (r[f] = 1),
            e.push({ type: fZ, name: c.value, loc: c.loc }));
        } else s >= 2 ? (i = c) : go("Argument is not a name");
      else n.push(c);
      s++;
    },
    a = Gu(!1);
  let l = !1;
  if (Gr.id !== ")") {
    for (; Gr.id !== ")"; )
      if ((v1(Gr) && yo(), Gr.id === ",")) (o(null), (l = !0), yo());
      else {
        const c = n2(0);
        (o(c, Gr.id !== ","), (l = !1), Gr.id === "," && (yo(","), (l = !0)));
      }
    Gu(a);
  }
  (l && o(null, !0),
    i === void 0 && go("Unexpected end of arguments"),
    Gu(a),
    delete this.value,
    (this.type = Zxe),
    (this.declarations = []),
    e.length || go("Unexpected end of arguments"));
  for (let c = 0; c < e.length; c++) {
    const u = {
      type: VCt,
      id: e[c],
      init: n[c],
      loc: e[c].loc && [e[c].loc[0], n[c].loc[1]],
    };
    this.declarations.push(u);
  }
  return (
    (this.body = i),
    t.loc && (this.loc = [t.loc[0], Gr.loc[1]]),
    yo(")", this),
    this
  );
}
af("}");
af(";");
bw("{", function () {
  Gr.id === "}" && go("Unexpected empty array");
  let t = [],
    e = !1;
  const n = [t],
    r = Gu(!1);
  for (; !e; )
    (v1(Gr) && yo(),
      sCe(Gr)
        ? (t.push(th[$E].nud.call(Gr)), yo())
        : go(`Unexpected ${Gr.type} in array: ${Gr.value}`),
      Gr.id === ","
        ? yo(",")
        : Gr.id === ";"
          ? (yo(";"), (t = []), n.push(t))
          : (e = !0));
  const i = Gr;
  return (
    yo("}"),
    Gu(r),
    (this.type = HCt),
    (this.elements = n),
    this.loc && (this.loc[1] = i.loc[1]),
    delete this.value,
    this
  );
});
var F5 = Object.freeze({
  OPERATOR: Th,
  BOOLEAN: q9,
  ERROR: y6,
  NUMBER: yw,
  FUNCTION: b6,
  NEWLINE: CD,
  WHITESPACE: SD,
  STRING: G9,
  CONTEXT: Fc,
  CONTEXT_QUOTE: Eu,
  REF_RANGE: ri,
  REF_BEAM: qu,
  REF_TERNARY: ph,
  REF_NAMED: tc,
  REF_STRUCT: ah,
  FX_PREFIX: VB,
  UNKNOWN: ku,
});
const FSt = [
    "WEBSERVICE",
    "IMPORTDATA",
    "INDIRECT",
    "IMPORTXML",
    "IMPORTHTML",
    "IMPORTFEED",
    "FILTERXML",
    "RTD",
    "REGISTER.ID",
    "CALL",
    "EVALUATE",
    "FORMULA",
    "IMAGE",
    "FILES",
    "DIRECTORY",
    "DDE",
    "FOPEN",
    "FWRITE",
    "FCLOSE",
    "INFO",
    "STOCKHISTORY",
    "STOCKSERIES",
    "TRANSLATE",
    "CUBEKPIMEMBER",
    "CUBEMEMBER",
    "CUBEMEMBERPROPERTY",
    "CUBERANKEDMEMBER",
    "CUBESET",
    "CUBESETCOUNT",
    "CUBEVALUE",
    "EXEC",
  ],
  dCe = new Set(FSt.map((t) => t.toUpperCase())),
  USt = ["=", "+", "-", "@", "{="];
function KB(t) {
  const e = t.trim();
  if (!e || !USt.some((n) => e.startsWith(n))) return !1;
  try {
    const n = iCe(e);
    for (const r of n) {
      if (r.type === F5.FUNCTION || r.type === F5.REF_NAMED) {
        const i = r.value
          .toUpperCase()
          .replace(/^_XLFN\.(_XLWS\.)?|^_XLWS\./, "");
        if (dCe.has(i)) return !0;
      }
      if (r.type === F5.UNKNOWN && r.value.includes("|")) return !0;
    }
  } catch {
    return !0;
  }
  return !1;
}
function jSt(t) {
  if (!t || typeof t != "object" || !("cells" in t) || !Array.isArray(t.cells))
    return !1;
  for (const e of t.cells)
    if (Array.isArray(e))
      for (const n of e) {
        if (!n || typeof n != "object") continue;
        const r = "formula" in n ? n.formula : void 0,
          i = "value" in n ? n.value : void 0;
        if ((typeof r == "string" && KB(r)) || (typeof i == "string" && KB(i)))
          return !0;
      }
  return !1;
}
function BSt(t) {
  const e = new Set();
  if (!t || typeof t != "object" || !("cells" in t) || !Array.isArray(t.cells))
    return [];
  for (const n of t.cells)
    if (Array.isArray(n))
      for (const r of n) {
        if (!r || typeof r != "object") continue;
        const i = "formula" in r ? r.formula : void 0,
          s = "value" in r ? r.value : void 0;
        for (const o of [i, s]) {
          if (typeof o != "string" || !o) continue;
          let a;
          try {
            a = iCe(o);
          } catch {
            e.add(o);
            continue;
          }
          for (const l of a) {
            if (l.type !== F5.FUNCTION && l.type !== F5.REF_NAMED) continue;
            const c = l.value
              .toUpperCase()
              .replace(/^(_XLFN\._XLWS\.|_XLFN\.|_XLWS\.)/, "");
            dCe.has(c) && e.add(c);
          }
        }
      }
  return Array.from(e);
}
const XB = new Set([
    "delete",
    "clear",
    "clearAll",
    "deleteAll",
    "deleteRows",
    "deleteColumns",
    "removeDuplicates",
    "replaceAll",
    "moveTo",
    "cut",
    "clearOrResetContents",
    "deleteText",
    "clearFilters",
    "acceptAllRevisions",
    "rejectAllRevisions",
    "acceptAll",
    "rejectAll",
    "ungroup",
    "markDirty",
    "unmerge",
    "split",
    "convertToText",
    "breakAllLinks",
    "breakLinks",
    "removePageBreaks",
    "save",
    "close",
    "autoFill",
    "flashFill",
  ]),
  $St = [
    "add",
    "apply",
    "accept",
    "attach",
    "auto",
    "break",
    "change",
    "clear",
    "close",
    "connect",
    "convert",
    "copy",
    "cut",
    "delete",
    "detach",
    "disconnect",
    "distribute",
    "duplicate",
    "flash",
    "freeze",
    "hide",
    "increment",
    "indent",
    "insert",
    "merge",
    "move",
    "outdent",
    "pause",
    "protect",
    "refresh",
    "reject",
    "remove",
    "replace",
    "resize",
    "reset",
    "resume",
    "save",
    "scale",
    "set",
    "sort",
    "split",
    "suspend",
    "group",
    "unfreeze",
    "unprotect",
    "update",
  ],
  zSt = new Set([
    "values",
    "formulas",
    "formulasLocal",
    "formulasR1C1",
    "formulasR1C1Local",
    "formulaArray",
    "numberFormat",
    "numberFormatLocal",
    "text",
    "name",
    "position",
    "visibility",
    "visible",
    "style",
    "hyperlink",
    "left",
    "top",
    "width",
    "height",
    "rotation",
  ]);
function yde(t) {
  return XB.has(t) || $St.some((e) => t.startsWith(e));
}
const YB = {
  font: "Modify font on",
  fill: "Modify fill on",
  format: "Modify format on",
  border: "Modify border on",
  borders: "Modify borders on",
  protection: "Modify protection on",
  paragraphFormat: "Modify paragraph on",
  lineFormat: "Modify line on",
  textFrame: "Modify text frame on",
};
function HSt(t) {
  return t.some((e) => e in YB);
}
const bde = {
    worksheets: "worksheet",
    tables: "table",
    charts: "chart",
    pivotTables: "pivot table",
    names: "named range",
    namedItems: "named range",
    slicers: "slicer",
    conditionalFormats: "conditional format",
    notes: "note",
    series: "chart series",
    points: "data point",
    trendlines: "trendline",
    pivotFields: "pivot field",
    pivotItems: "pivot item",
    borders: "border",
    allowEditRanges: "allow-edit range",
    linkedWorkbooks: "linked workbook",
    namedSheetViews: "named view",
    commentReplies: "comment reply",
    windows: "window",
    slides: "slide",
    layouts: "layout",
    slideMasters: "slide master",
    bindings: "binding",
    adjustments: "adjustment",
    contentControls: "content control",
    lists: "list",
    inlinePictures: "inline picture",
    fields: "field",
    footnotes: "footnote",
    endnotes: "endnote",
    bookmarks: "bookmark",
    styles: "style",
    shapes: "shape",
    rows: "row",
    columns: "column",
    cells: "cell",
    comments: "comment",
    paragraphs: "paragraph",
    sections: "section",
    tags: "tag",
    hyperlinks: "hyperlink",
    customProperties: "custom property",
    customXmlParts: "XML part",
  },
  VSt = new Set([
    "getItem",
    "getRange",
    "getItemAt",
    "getItemOrNullObject",
    "getHeader",
    "getFooter",
    "getFirst",
    "getLast",
  ]),
  WSt = {
    delete: "Delete",
    clear: "Clear",
    clearAll: "Clear all",
    add: "Add",
    insert: "Insert",
    merge: "Merge",
    cut: "Cut",
    moveTo: "Move",
    sort: "Sort",
    protect: "Protect",
    unprotect: "Unprotect",
    name: "Rename",
    copyFrom: "Copy data to",
    deleteRows: "Delete rows from",
    deleteColumns: "Delete columns from",
    mergeCells: "Merge cells in",
    unmerge: "Unmerge cells in",
    split: "Split",
    values: "Set values on",
    formulas: "Set formulas on",
    formulasLocal: "Set formulas on",
    formulasR1C1: "Set formulas on",
    formulasR1C1Local: "Set formulas on",
    formulaArray: "Set formulas on",
    numberFormat: "Set number format on",
    numberFormatLocal: "Set number format on",
    text: "Set text on",
    position: "Reposition",
    visibility: "Change visibility of",
    style: "Set style on",
    hyperlink: "Set hyperlink on",
    visible: "Change visibility of",
    left: "Reposition",
    top: "Reposition",
    width: "Resize",
    height: "Resize",
    rotation: "Rotate",
    addWorksheet: "Add",
    removeDuplicates: "Remove duplicates from",
    replaceAll: "Replace all in",
    convertToRange: "Convert table to range",
    group: "Group rows/columns in",
    ungroup: "Ungroup",
    freezeAt: "Freeze panes at",
    freezeColumns: "Freeze columns in",
    freezeRows: "Freeze rows in",
    unfreeze: "Unfreeze panes in",
    autoFill: "Auto-fill",
    autofitColumns: "Auto-fit columns in",
    autofitRows: "Auto-fit rows in",
    flashFill: "Flash-fill",
    calculate: "Recalculate",
    clearFormat: "Clear formatting from",
    clearArrows: "Clear arrows from",
    clearOrResetContents: "Clear contents of",
    copy: "Copy",
    copyTo: "Copy to",
    breakAllLinks: "Break all links in",
    breakLinks: "Break links in",
    duplicate: "Duplicate",
    save: "Save",
    close: "Close",
    insertWorksheetsFromBase64: "Insert worksheets into",
    removePageBreaks: "Remove page breaks from",
    refreshAll: "Refresh all",
    hideGroupDetails: "Hide group details in",
    scaleHeight: "Scale height of",
    scaleWidth: "Scale width of",
    setData: "Set data on",
    setPosition: "Reposition",
    setFormula: "Set formula on",
    setCellProperties: "Set cell properties on",
    apply: "Apply filter to",
    reapply: "Reapply filters on",
    remove: "Remove filter from",
    clearCriteria: "Clear filter criteria from",
    clearFilter: "Clear filter from",
    clearColumnCriteria: "Clear column filter criteria",
    clearFilters: "Clear filters from",
    clearAllFilters: "Clear all filters from",
    applyValuesFilter: "Apply values filter to",
    applyCustomFilter: "Apply custom filter to",
    applyDynamicFilter: "Apply dynamic filter to",
    applyBottomItemsFilter: "Apply bottom items filter to",
    applyBottomPercentFilter: "Apply bottom percent filter to",
    applyCellColorFilter: "Apply cell color filter to",
    applyFontColorFilter: "Apply font color filter to",
    applyIconFilter: "Apply icon filter to",
    applyTopItemsFilter: "Apply top items filter to",
    applyTopPercentFilter: "Apply top percent filter to",
    refresh: "Refresh",
    addGeometricShape: "Add shape to",
    addTextBox: "Add text box to",
    addLine: "Add line to",
    addTable: "Add table to",
    addGroup: "Add group to",
    addImage: "Add image to",
    setZOrder: "Reorder",
    insertSlidesFromBase64: "Insert slides into",
    setSelectedSlides: "Select slides in",
    setSelectedShapes: "Select shapes on",
    setSelected: "Select",
    reset: "Reset",
    addFromSelection: "Add binding from selection to",
    deleteAll: "Delete all",
    setXml: "Set XML on",
    markDirty: "Mark as modified",
    deleteText: "Delete text from",
    setHyperlink: "Set hyperlink on",
    applyLayout: "Apply layout to",
    setImage: "Set image on",
    setSolidColor: "Set color on",
    setGradientFill: "Set gradient background on",
    setPatternFill: "Set pattern background on",
    setPictureOrTextureFill: "Set picture background on",
    setSolidFill: "Set solid background on",
    setThemeColor: "Set theme color on",
    resize: "Resize cells in",
    distributeColumns: "Distribute columns in",
    insertBreak: "Insert break in",
    insertContentControl: "Insert content control in",
    insertInlinePictureFromBase64: "Insert image in",
    insertParagraph: "Insert paragraph in",
    insertTable: "Insert table in",
    insertText: "Insert text in",
    insertBookmark: "Insert bookmark in",
    insertComment: "Insert comment in",
    insertField: "Insert field in",
    insertFootnote: "Insert footnote in",
    insertEndnote: "Insert endnote in",
    indent: "Indent",
    outdent: "Outdent",
    applyStyleDirectFormatting: "Apply style to",
    convertToText: "Convert to text",
    detachFromList: "Remove from list",
    attachToList: "Attach to list",
    addColumns: "Add columns to",
    addRows: "Add rows to",
    setCellPadding: "Set cell padding on",
    autoFitWindow: "Auto-fit to window",
    acceptAll: "Accept all changes in",
    rejectAll: "Reject all changes in",
    acceptAllRevisions: "Accept all changes in",
    rejectAllRevisions: "Reject all changes in",
    acceptAllRevisionsShown: "Accept visible changes in",
    rejectAllRevisionsShown: "Reject visible changes in",
  },
  vde = {
    getRange: "range",
    getCell: "cell",
    getRow: "row",
    getColumn: "column",
    getSelectedRange: "range",
    getUsedRange: "range",
    getActiveCell: "range",
    getEntireRow: "row",
    getEntireColumn: "column",
    getRangeByIndexes: "range",
    getDataBodyRange: "range",
    getHeaderRowRange: "range",
    getTotalRowRange: "range",
    getResizedRange: "range",
    getAbsoluteResizedRange: "range",
    getOffsetRange: "range",
    getBoundingRect: "range",
    getIntersection: "range",
    getSurroundingRegion: "range",
    getExtendedRange: "range",
    getRangeEdge: "range",
    getLastCell: "range",
    getLastRow: "range",
    getLastColumn: "range",
    getColumnsAfter: "range",
    getColumnsBefore: "range",
    getRowsAbove: "range",
    getRowsBelow: "range",
    getSpillingToRange: "range",
    getSpillParent: "range",
    getVisibleView: "range",
    getSpecialCells: "range",
    getDependents: "range",
    getDirectDependents: "range",
    getDirectPrecedents: "range",
    getPrecedents: "range",
    getSelectedRanges: "range",
    getPrintArea: "range",
    getActiveWorksheet: "worksheet",
    getActiveChart: "chart",
    getActiveShape: "shape",
    getActiveSlicer: "slicer",
    getLocation: "range",
    getInvalidCells: "range",
    getParentComment: "comment",
    getItemByCell: "comment",
    getRanges: "range",
    getTables: "table",
    getColumnLabelRange: "range",
    getRowLabelRange: "range",
    getFilterAxisRange: "range",
    getDataTable: "data table",
    getPivotItems: "pivot item",
    getPrintTitleColumns: "range",
    getPrintTitleRows: "range",
    getUsedRangeAreas: "range",
    getOffsetRangeAreas: "range",
    getCellAfterBreak: "range",
    addGeometricShape: "shape",
    addGroup: "shape",
    addImage: "shape",
    addLine: "shape",
    addTextBox: "shape",
    getActivePage: "slide",
    getParentSlide: "slide",
    getParentSlideLayout: "layout",
    getParentSlideMaster: "master",
    getTextFrame: "text frame",
    getSubstring: "text range",
    getSelectedShapes: "shape",
    getSelectedSlides: "slide",
    getSelectedTextRange: "text range",
    getParentTextFrame: "text frame",
    getParentShape: "shape",
    getTable: "table",
    getShape: "shape",
    getLinkedShape: "shape",
    getLinkedTextRange: "text range",
    getMergedAreas: "table cell",
    getGradientFill: "gradient fill",
    getPatternFill: "pattern fill",
    getPictureOrTextureFill: "picture fill",
    getSolidFill: "solid fill",
    getByNamespace: "XML part",
    getOnlyItem: "XML part",
    addTable: "table",
    group: "shape",
    getSelection: "range",
    getBookmarkRange: "range",
    getParagraphBefore: "paragraph",
    getParagraphAfter: "paragraph",
    getAncestor: "paragraph",
    getParagraphByUniqueLocalId: "paragraph",
    getHeader: "body",
    getFooter: "body",
    insertParagraph: "paragraph",
    insertTable: "table",
    insertContentControl: "content control",
    insertText: "range",
    insertField: "field",
  };
function ux(t, e) {
  if (e.length === 0) return t;
  const n = e[0],
    r = typeof n == "string" ? n : JSON.stringify(n);
  return `${t}(${r})`;
}
const qSt = { sheet: "workbook", doc: "document", slide: "presentation" };
function fCe(t) {
  for (let e = t.length - 1; e >= 0; e--) {
    const n = t[e].split("(")[0],
      r = n.replace(/OrNullObject$/, "");
    if (vde[r]) return vde[r];
    if (bde[n]) return bde[n];
  }
  return qSt[Fn()] ?? "item";
}
const GSt = { getItemAt: (t) => ZSt(Number(t)) };
function hCe(t) {
  for (let e = t.length - 1; e >= 0; e--) {
    const n = t[e].match(/^(\w+)\((.+)\)$/);
    if (!n || !VSt.has(n[1])) continue;
    const r = GSt[n[1]];
    return r ? r(n[2]) : n[2];
  }
}
function ZSt(t) {
  const e = t + 1,
    n = ["th", "st", "nd", "rd"],
    r = e % 100;
  return `${e}${n[(r - 20) % 10] || n[r] || n[0]}`;
}
function FP(t, e) {
  const n = fCe(e),
    r = hCe(e),
    i = WSt[t] || pCe(t);
  return r
    ? /^\d+(st|nd|rd|th)$/.test(r)
      ? `${i} ${r} ${n}`
      : `${i} ${n} "${r}"`
    : `${i} ${n}`;
}
function KSt(t, e) {
  for (let n = t.length - 1; n >= 0; n--)
    if (t[n] in YB) {
      const r = t[n],
        i = t.slice(0, n),
        s = fCe(i),
        o = hCe(i),
        a = e ? `Set ${r} ${pCe(e).toLowerCase()} on` : YB[r];
      return o
        ? /^\d+(st|nd|rd|th)$/.test(o)
          ? `${a} ${o} ${s}`
          : `${a} ${s} "${o}"`
        : `${a} ${s}`;
    }
  return "Modify item";
}
function pCe(t) {
  const e = bH(t).toLowerCase();
  return e.charAt(0).toUpperCase() + e.slice(1);
}
const vZ = R1.loadAsync.bind(R1),
  mCe = Object.freeze({ loadAsync: vZ });
Object.freeze(TextDecoder.prototype);
Object.freeze(TextEncoder.prototype);
typeof DOMParser < "u" &&
  (Object.freeze(DOMParser.prototype), Object.freeze(XMLSerializer.prototype));
const XSt = 3,
  YSt = [
    "context.ui.openBrowserWindow",
    "context.ui.displayDialogAsync",
    "auth.getAccessToken",
    "context.auth.getAccessToken",
    "context.document.getFileAsync",
    "context.document.setSelectedDataAsync",
    "context.document.addHandlerAsync",
    "context.document.bindings",
    "select",
    "actions.associate",
  ],
  JSt = new Set([
    "addAsJson",
    "sendForReview",
    "sendFaxOverInternet",
    "sendFax",
    "sendMail",
    "insertHtml",
  ]),
  wde = new Map([
    ["valuesAsJson", _de],
    ["valuesAsJsonLocal", _de],
    ["values", Rp],
    ["formulas", Rp],
    ["formulasLocal", Rp],
    ["formulasR1C1", Rp],
    ["formulasR1C1Local", Rp],
    ["formulaArray", Rp],
    ["dataValidation", Rp],
    ["formula", Rp],
  ]);
function _de(t) {
  throw new Error(`IllegalAccessError: Writing to '${t}' is blocked`);
}
function Rp(t, e) {
  try {
    VE(e);
  } catch {
    throw new Error(
      `IllegalAccessError: Formula set via '${t}' contains blocked function(s)`,
    );
  }
}
async function UP(t, e, n, r) {
  const i = n[0];
  if (typeof i != "string")
    throw new Error(
      `IllegalAccessError: ${t} requires a base64 string argument`,
    );
  let s;
  try {
    s = await vZ(i, { base64: !0 });
  } catch {
    throw new Error(`IllegalAccessError: ${t} received invalid base64 data`);
  }
  const o = [],
    a = e.toLowerCase();
  for (const [c, u] of Object.entries(s.files)) {
    if (u.dir) continue;
    const d = c.toLowerCase();
    if (d.startsWith(`${a}/vbaproject`))
      throw new Error(
        "SecurityBlocked: This file contains VBA macros which are a security risk and cannot be inserted.",
      );
    if (d.startsWith(`${a}/activex/`))
      throw new Error(
        "SecurityBlocked: This file contains ActiveX controls which are a security risk and cannot be inserted.",
      );
    if (d.startsWith(`${a}/macrosheets/`))
      throw new Error(
        "SecurityBlocked: This file contains Excel 4.0 macro sheets which are a security risk and cannot be inserted.",
      );
    d.startsWith(`${a}/embeddings/`) &&
      o.push(`Contains embedded object: ${c}`);
  }
  const l = await Yj(s);
  for (const c of l) o.push(`Contains external reference: ${c}`);
  if (o.length > 0) {
    if (!r) return;
    const c = o.map((d) => ({
      type: "method",
      name: t,
      chain: [t],
      isDestructive: !0,
      security: !0,
      warning: `⚠️ Security: ${d}`,
    }));
    if (!(await r(c)))
      throw new Error(
        "PermissionDenied: User denied permission to insert content with potentially dangerous content. Do NOT attempt to achieve the same outcome using alternative tools or approaches. Instead, inform the user that you've skipped this step and ask how they'd like to proceed.",
      );
  }
}
async function QSt(t) {
  const e = t[0];
  if (typeof e != "string")
    throw new Error(
      "IllegalAccessError: insertOoxml requires a string argument",
    );
  const n = xT(e);
  (zCt(n), (t[0] = $Ct(n)));
}
const eEt = new Map([
  [
    "insertSlidesFromBase64",
    (t, e) => UP("insertSlidesFromBase64", "ppt", t, e),
  ],
  [
    "insertWorksheetsFromBase64",
    (t, e) => UP("insertWorksheetsFromBase64", "xl", t, e),
  ],
  ["insertFileFromBase64", (t, e) => UP("insertFileFromBase64", "word", t, e)],
  ["insertOoxml", (t) => QSt(t)],
]);
function VE(t, e = 0) {
  if (!(e > XSt)) {
    if (typeof t == "string") {
      if (KB(t))
        throw new Error(
          "IllegalAccessError: Method argument contains blocked formula function(s)",
        );
      return;
    }
    if (Array.isArray(t)) {
      for (const n of t) VE(n, e + 1);
      return;
    }
    if (t && typeof t == "object" && !rh.has(t))
      for (const n of Object.values(t)) VE(n, e + 1);
  }
}
function WE(t, e = new WeakSet()) {
  if (t === null || typeof t != "object" || e.has(t)) return t;
  if ((e.add(t), Array.isArray(t))) {
    for (const n of t) WE(n, e);
    return Object.freeze(t);
  }
  if (Object.getPrototypeOf(t) === Object.prototype) {
    for (const n of Object.values(t)) WE(n, e);
    return Object.freeze(t);
  }
  return t;
}
const tEt = new Set([
  "defineProperty",
  "getOwnPropertyDescriptor",
  "getPrototypeOf",
  "setPrototypeOf",
]);
function gCe() {
  const t = {};
  for (const e of Object.getOwnPropertyNames(Object))
    tEt.has(e) || (t[e] = Object[e]);
  return t;
}
let xde = !1;
const nEt = new Set(["length", "name", "prototype"]);
function rEt() {
  const t = new Map();
  for (const e of Object.getOwnPropertyNames(Function))
    nEt.has(e) || t.set(e, Function[e]);
  return t;
}
const iEt = new Set([
  "_validateParams",
  "_validateParameterCount",
  "_validateParameter",
  "_validateParameterType",
]);
function sEt(t) {
  if (t.size === 0) return;
  const e = () => null;
  for (const s of iEt) t.has(s) && t.set(s, e);
  const n = globalThis.Function;
  if (Object.isExtensible(n))
    try {
      for (const [s, o] of t)
        Object.defineProperty(n, s, {
          value: o,
          writable: !1,
          enumerable: !1,
          configurable: !1,
        });
      return;
    } catch {}
  const r = Object.getOwnPropertyDescriptor(globalThis, "Function");
  if (!r || (!r.writable && !r.configurable)) return;
  const i = new Proxy(n, {
    get(s, o, a) {
      return t.has(o) ? t.get(o) : Reflect.get(s, o, a);
    },
    has(s, o) {
      return t.has(o) ? !0 : Reflect.has(s, o);
    },
    getOwnPropertyDescriptor(s, o) {
      return t.has(o)
        ? { value: t.get(o), writable: !1, enumerable: !1, configurable: !0 }
        : Reflect.getOwnPropertyDescriptor(s, o);
    },
  });
  Object.defineProperty(globalThis, "Function", {
    value: i,
    writable: r.writable ?? !1,
    configurable: r.configurable ?? !1,
  });
}
function yCe() {
  if (!xde) {
    xde = !0;
    try {
      const t = rEt();
      (lockdown({
        errorTaming: "unsafe",
        consoleTaming: "unsafe",
        overrideTaming: "severe",
      }),
        sEt(t));
    } catch (t) {
      if (
        !(
          t instanceof TypeError &&
          String(t).includes("SES_ALREADY_LOCKED_DOWN")
        )
      )
        throw t;
    }
  }
}
function X8(t, e) {
  const n = new Map(),
    r = new Set();
  for (const i of e) {
    const s = i.indexOf(".");
    if (s === -1) r.add(i);
    else {
      const o = i.slice(0, s),
        a = i.slice(s + 1);
      (n.has(o) || n.set(o, []), n.get(o)?.push(a));
    }
  }
  return new Proxy(Object.create(null), {
    get(i, s) {
      if (typeof s == "string" && r.has(s))
        throw new Error(`IllegalAccessError: Access to '${s}' is blocked`);
      const o = Reflect.get(t, s);
      return typeof s == "string" && n.has(s) && o && typeof o == "object"
        ? X8(o, n.get(s) ?? [])
        : o;
    },
  });
}
const jP = [
  "run",
  "RequestContext",
  "createWorkbook",
  "createDocument",
  "createPresentation",
];
function oEt(t) {
  return {
    Office: typeof Office < "u" ? X8(Office, YSt) : void 0,
    Excel: typeof Excel < "u" ? X8(Excel, jP) : void 0,
    Word: typeof Word < "u" ? X8(Word, jP) : void 0,
    PowerPoint: typeof PowerPoint < "u" ? X8(PowerPoint, jP) : void 0,
    pptx:
      typeof PowerPoint < "u"
        ? {
            withSlideZip: (e, n, r) => Kg(e, n, r, m3, t, aEt),
            resolveSlideId: p3,
          }
        : void 0,
    insertImage:
      typeof PowerPoint < "u"
        ? (e, n) => {
            if (typeof e != "string")
              throw new Error(
                "IllegalAccessError: insertImage requires a base64 string argument",
              );
            const r = { coercionType: "image" },
              {
                imageLeft: i,
                imageTop: s,
                imageWidth: o,
                imageHeight: a,
              } = n ?? {};
            return (
              i !== void 0 && (r.imageLeft = i),
              s !== void 0 && (r.imageTop = s),
              o !== void 0 && (r.imageWidth = o),
              a !== void 0 && (r.imageHeight = a),
              new Promise((l, c) => {
                Office.context.document.setSelectedDataAsync(e, r, (u) =>
                  u.error
                    ? c(
                        new Error(
                          `insertImage: ${u.error.name} ${u.error.code} — ${u.error.message}`,
                        ),
                      )
                    : l(),
                );
              })
            );
          }
        : void 0,
    conductor: Object.freeze({
      writeFile: (e, n) => {
        const r = N4();
        if (!r)
          throw new Error(
            "Conductor client not connected — cannot broadcast file",
          );
        (r.emitFile(e, n), Ft("conductor_file_broadcast", { filename: e }));
      },
      readFile: (e, n) => (
        Ft("conductor_file_consumed", {
          filename: n,
          peer_agent_id: e,
          peer_app_name: gw(e),
        }),
        z7e(e, n)
      ),
      listFiles: (e) => H7e(e),
    }),
  };
}
const rh = new WeakMap();
function aEt(t) {
  return t && typeof t == "object" && rh.has(t) ? rh.get(t) : t;
}
function Y8(t, e, n, r) {
  if (!t || typeof t != "object") return t;
  if (Array.isArray(t)) {
    const s = new Proxy(t, {
      get(o, a) {
        const l = Reflect.get(o, a);
        return l && typeof l == "object" && !Array.isArray(l)
          ? Y8(l, e, n, r)
          : l;
      },
    });
    return (rh.set(s, t), s);
  }
  const i = new Proxy(Object.create(null), {
    set(s, o, a) {
      if (typeof o == "string") {
        const l = wde.get(o);
        l && (l(o, a), WE(a));
      }
      return (
        e &&
          typeof o == "string" &&
          (zSt.has(o)
            ? e.push({
                type: "setter",
                name: o,
                chain: [...(n ?? []), o],
                isDestructive: !1,
                warning: FP(o, n ?? []),
              })
            : HSt(n ?? []) &&
              e.push({
                type: "setter",
                name: o,
                chain: [...(n ?? []), o],
                isDestructive: !1,
                warning: KSt(n ?? [], o),
              })),
        Reflect.set(t, o, a)
      );
    },
    get(s, o) {
      if (typeof o == "string" && JSt.has(o))
        throw new Error(`IllegalAccessError: Access to '${o}' is blocked`);
      const a = Reflect.get(t, o);
      if (typeof a == "function") {
        if (e && o === "sync" && (n ?? []).length === 0)
          return async () => {
            const c = [...e];
            if (c.length > 0 && r && !(await r(c)))
              throw new Error(
                "PermissionDenied: User denied permission. Do NOT attempt to achieve the same outcome using alternative tools or approaches. Instead, inform the user that you've skipped this step and ask how they'd like to proceed.",
              );
            return ((e.length = 0), a.apply(t));
          };
        const l = typeof o == "string" ? eEt.get(o) : void 0;
        return l
          ? async function (...c) {
              await l(c, r);
              const u = c.map((f) =>
                f && typeof f == "object" && rh.has(f) ? rh.get(f) : f,
              );
              e &&
                typeof o == "string" &&
                yde(o) &&
                e.push({
                  type: "method",
                  name: o,
                  chain: [...(n ?? []), ux(o, c)],
                  isDestructive: XB.has(o),
                  warning: FP(o, n ?? []),
                });
              const d = a.apply(t, u);
              return Y8(
                d,
                e,
                [...(n ?? []), ux(typeof o == "string" ? o : String(o), c)],
                r,
              );
            }
          : function (...c) {
              if (
                o === "set" &&
                c.length > 0 &&
                c[0] &&
                typeof c[0] == "object"
              ) {
                const f = c[0];
                for (const [h, m] of Object.entries(f)) {
                  const g = wde.get(h);
                  g && (g(h, m), WE(m));
                }
              }
              if (typeof o == "string" && typeof Excel < "u")
                for (const f of c) VE(f);
              const u = c.map((f) =>
                f && typeof f == "object" && rh.has(f) ? rh.get(f) : f,
              );
              e &&
                typeof o == "string" &&
                yde(o) &&
                e.push({
                  type: "method",
                  name: o,
                  chain: [...(n ?? []), ux(o, c)],
                  isDestructive: XB.has(o),
                  warning: FP(o, n ?? []),
                });
              const d = a.apply(t, u);
              return Y8(
                d,
                e,
                [...(n ?? []), ux(typeof o == "string" ? o : String(o), c)],
                r,
              );
            };
      }
      return a && typeof a == "object" ? Y8(a, e, [...(n ?? []), o], r) : a;
    },
    has(s, o) {
      return Reflect.has(t, o);
    },
    ownKeys(s) {
      return Reflect.ownKeys(t);
    },
    getOwnPropertyDescriptor(s, o) {
      const a = Object.getOwnPropertyDescriptor(t, o);
      if (a)
        return "value" in a && a.value !== null && typeof a.value == "object"
          ? { enumerable: a.enumerable, configurable: !0 }
          : typeof a.value == "function" || "get" in a || "set" in a
            ? { enumerable: a.enumerable, configurable: !0 }
            : { ...a, configurable: !0 };
    },
  });
  return (rh.set(i, t), i);
}
let lm = null;
function lEt(t) {
  lm = t;
}
function cEt() {
  const t = [];
  return {
    attachImage: (e, n = "image/png") => {
      if (typeof e != "string" || e.length === 0)
        throw new TypeError("attachImage: base64 must be a non-empty string");
      if (typeof n != "string" || n.length === 0)
        throw new TypeError(
          "attachImage: mediaType must be a non-empty string",
        );
      const r = e.replace(/^data:[^;]+;base64,/, ""),
        s = Object.entries({
          iVBORw: "image/png",
          "/9j/": "image/jpeg",
          R0lGOD: "image/gif",
          UklGR: "image/webp",
        }).find(([o]) => r.startsWith(o))?.[1];
      if (!s)
        throw new TypeError(
          `attachImage: data does not look like a base64-encoded PNG/JPEG/GIF/WebP (starts with "${r.slice(0, 8)}"). On Excel for Mac, Range.getImage() returns invalid bytes — use chart.getImage() or get_cell_ranges instead.`,
        );
      t.push({ data: r, mediaType: n === "image/png" ? s : n });
    },
    drain: () => t,
  };
}
function bCe() {
  return Object.freeze({
    get: (t) => {
      const e = lm?.get(t);
      return e ? new Uint8Array(e.slice(0)) : null;
    },
    has: (t) => lm?.has(t) ?? !1,
    keys: () => [...(lm?.keys() ?? [])],
    getBase64: (t) => {
      const e = lm?.get(t);
      return e ? B6e(e) : null;
    },
    getText: (t) => {
      const e = lm?.get(t);
      return e ? new TextDecoder().decode(e) : null;
    },
    getSlideIds: async (t) => {
      const e = lm?.get(t);
      if (!e) return null;
      const r = await (await vZ(e))
        .file("ppt/presentation.xml")
        ?.async("string");
      return r
        ? [...r.matchAll(/<p:sldId[^>]+id="(\d+)"/g)].map((i) => i[1])
        : null;
    },
  });
}
function uEt() {
  return Object.freeze({ Workbook: m_t.Workbook });
}
function dEt() {
  return {
    console,
    Math,
    Date,
    DOMParser: typeof DOMParser < "u" ? DOMParser : void 0,
    XMLSerializer: typeof XMLSerializer < "u" ? XMLSerializer : void 0,
    eval: void 0,
    Reflect: void 0,
    Proxy: void 0,
    Object: gCe(),
    Compartment: void 0,
    harden: void 0,
    lockdown: void 0,
    blobs: bCe(),
    ExcelJS: uEt(),
    JSZip: mCe,
    mammoth: Object.freeze({
      extractRawText: rde.extractRawText,
      convertToHtml: rde.convertToHtml,
    }),
    TextDecoder,
    TextEncoder,
  };
}
function fEt(t, e, n) {
  yCe();
  const r = new Compartment({
      ...dEt(),
      ...oEt(e),
      ...(n && { attachImage: n.attachImage }),
    }),
    i = "(async function(context) { " + t + " })",
    s = r.evaluate(i, { __rejectSomeDirectEvalExpressions__: !1 });
  return async (o) => s(Y8(o, [], [], e));
}
function hEt(t) {
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
function vCe(t) {
  yCe();
  const e = new Compartment({
      console,
      Math,
      Date,
      DOMParser: typeof DOMParser < "u" ? DOMParser : void 0,
      XMLSerializer: typeof XMLSerializer < "u" ? XMLSerializer : void 0,
      escapeXml: hEt,
      conductor: Object.freeze({
        writeFile: (r, i) => {
          const s = N4();
          if (!s)
            throw new Error(
              "Conductor client not connected — cannot broadcast file",
            );
          (s.emitFile(r, i), Ft("conductor_file_broadcast", { filename: r }));
        },
        readFile: (r, i) => (
          Ft("conductor_file_consumed", {
            filename: i,
            peer_agent_id: r,
            peer_app_name: gw(r),
          }),
          z7e(r, i)
        ),
        listFiles: (r) => H7e(r),
      }),
      blobs: bCe(),
      JSZip: mCe,
      eval: void 0,
      Reflect: void 0,
      Proxy: void 0,
      Object: gCe(),
      Compartment: void 0,
      harden: void 0,
      lockdown: void 0,
    }),
    n = "(async function({ zip, markDirty }) { " + t + " })";
  return e.evaluate(n, { __rejectSomeDirectEvalExpressions__: !1 });
}
const pEt = ["claude_free", "claude_pro", "claude_max", "api_individual"],
  mEt = ["claude_team", "claude_enterprise", "api_team"];
function gEt(t) {
  const e = t?.organization.rate_limit_tier;
  return e ? e.toLowerCase().includes("max_20x") : !1;
}
function wCe(t) {
  if (!t) return "unknown";
  const e = t.organization.organization_type;
  return pEt.includes(e)
    ? "individual"
    : mEt.includes(e)
      ? "organization"
      : "unknown";
}
function wZ(t, e) {
  return typeof t == "boolean" ? t : wCe(e) === "individual";
}
function _Z() {
  if (!Gc().conductor) return "no_caps";
  if (
    gn
      .getState()
      .organizationFeatureSettings?.disabled_features.includes(
        "work_across_apps",
      ) ??
    !1
  )
    return "org_disabled";
  const e = vn.getState().conductorEnabled,
    n = gn.getState().oauthProfile;
  if (!wZ(e, n)) return e === !1 ? "setting_off" : "setting_default_org";
}
function Tg() {
  return _Z() === void 0;
}
function yEt() {
  const t = _Z();
  if (t !== "setting_off" && t !== "setting_default_org") return !1;
  const {
    oauthProfile: e,
    organizationUUID: n,
    organizationFeatureSettings: r,
  } = gn.getState();
  return !((t === "setting_default_org" && e === null) || (n && r === null));
}
const xZ = 9e4;
function r2(t) {
  const e = t.debugInfo || {};
  let n = t.message;
  if (e.code === "ApiNotFound") {
    const r = Fn(),
      [i, s] =
        r === "slide"
          ? ["PowerPointApi", _H()]
          : r === "doc"
            ? ["WordApi", xH()]
            : ["ExcelApi", pk()];
    s !== "unknown" &&
      (n = `${t.message ?? "Unknown error"}

Hint: This client supports ${i} up to ${s}. The API you called requires a newer requirement set. Try an older equivalent from the Office.js docs.`);
  }
  throw new Error(JSON.stringify({ success: !1, error: n, ...e }));
}
const bEt = "execute_office_js";
function vEt(t) {
  const e = W3[t];
  let n = `Execute Office.js JavaScript code to interact with the ${e} document. The code receives a context parameter and runs inside ${e}.run(). Use this for any document operations.`;
  return (
    Tg() &&
      (n += `

A \`conductor\` global is available for sharing files with other agents:
  \`conductor.writeFile("data.json", jsonString)\`  — broadcast a file to all connected agents
  \`conductor.readFile("excel-abc", "data.json")\`  — read another agent's file
  \`conductor.listFiles("excel-abc")\`              — list an agent's shared files

LARGE DATA: When you need to send data to another agent (cell values, tables, extracted content, XML, etc.), write it to a conductor file instead of putting it in the send_message text. Use \`execute_office_js\` to read the data and call \`conductor.writeFile()\` with a descriptive filename (e.g. data.json, table.txt, chart.xml). The file is broadcast immediately to all peers and visible in their virtual filesystem. Then call send_message with a short message saying what you want done. Do NOT include instructions on how to read the file; the receiving agent can access it directly.

USING RECEIVED FILES: When a peer has shared a file, read AND use it inside the SAME code block. NEVER \`return conductor.readFile(...)\` — that dumps the entire file into your context.

WORKFLOW: peek at structure via bash \`head -5 /agents/<id>/files/<name>\`, then come straight here and write the full processing code. The header line is enough — you do NOT need to see every row in your context.

  // ✅ GOOD: after bash head -5 showed "Country,Region,Rate,Year"
  const raw = conductor.readFile("desktop-41c", "data.csv");
  const lines = raw.trim().split("\\n");
  const rows = lines.slice(1).map(r => r.split(","));
  const sheet = context.workbook.worksheets.add("Imported");
  sheet.getRangeByIndexes(0, 0, rows.length, rows[0].length).values = rows;
  await context.sync();
  return { rowsWritten: rows.length };

  // ❌ BAD: read-only — whole file leaks into context
  return conductor.readFile("desktop-41c", "data.csv");

If structure is genuinely unclear after \`head\`, return a small probe (e.g. \`return { keys: Object.keys(JSON.parse(raw)), len: raw.length }\`) — never the full contents.`),
    (n += `

A \`blobs\` global provides read-only access to skill-bundled files (populated automatically by \`read_skill\`):
  \`blobs.getText("name")\`   — decoded UTF-8 string or null (for .csv, .json, .html, code files)
  \`blobs.get("name")\`       — Uint8Array or null (raw bytes)
  \`blobs.getBase64("name")\` — base64 string or null (for insert*FromBase64)
  \`blobs.has("name")\`       — check if blob exists
  \`blobs.keys()\`            — list stored blob names
The \`blobs\` global holds SKILL files (auto-populated by \`read_skill\`)${Gc().localFileUpload ? " and user-uploaded files — images, .xlsx, .csv, .docx, etc. — all keyed by filename." : " and user-uploaded images (pre-loaded, keyed by `file_id`). For other uploaded files (`container_upload`: .xlsx, .pdf, .csv, .docx), use `code_execution` (Python) — see the File Uploads section of the system prompt."}

`),
    (n +=
      t === "sheet" && !Bi.excelRangeImage()
        ? "An `attachImage(base64, mediaType?)` global lets you return an image you can SEE in the tool result (as a vision content block, not text). Call it with the `.value` of `chart.getImage()` after `context.sync()`:\n  `const img = sheet.charts.getItemAt(0).getImage(); await context.sync(); attachImage(img.value);`\nOn this platform (Excel for Mac), `Range.getImage()` is NOT supported — it returns invalid bytes. Use `attachImage` ONLY for charts. For range visuals, use get_cell_ranges with `includeFormatting: true` instead."
        : 'An `attachImage(base64, mediaType?)` global lets you return an image you can SEE in the tool result (as a vision content block, not text). Call it with the `.value` of any Office.js `getImage()` after `context.sync()`:\n  `const img = sheet.getRange("A1:F20").getImage(); await context.sync(); attachImage(img.value);`\nAlso works for `chart.getImage()`. Use it when visual layout/formatting matters and cell values alone aren\'t answering the question. Keep rendered ranges under ~50 rows — larger produces illegible text.'),
    n
  );
}
function wEt(t) {
  return `Async function body that receives 'context: ${W3[t]}.RequestContext'. Must call context.sync() to execute batched operations and load() to read properties. Return JSON-serializable results.`;
