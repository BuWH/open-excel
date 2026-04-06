      ? N.jsx(qtn, {
          onComplete: u,
          onJobFunctionSelect: l,
          onJobFunctionSkip: c,
          jobFunctionAlreadySet: !!i,
        })
      : N.jsx(t1, { to: "/auth/login", replace: !0 });
}
function Ztn({ className: t }) {
  return N.jsxs("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className: t,
    children: [
      N.jsx("title", { children: "Experimental" }),
      N.jsx("path", {
        d: "M10.7999 2.40039C11.0208 2.40039 11.1999 2.57948 11.1999 2.80039C11.1999 3.0213 11.0208 3.20039 10.7999 3.20039H10.3999V6.67539L13.4374 11.0941C14.167 12.1557 13.4068 13.6004 12.1186 13.6004H3.88108C2.59305 13.6002 1.83291 12.1557 2.56232 11.0941L5.59984 6.67539V3.20039H5.19984C4.97902 3.20028 4.79984 3.02124 4.79984 2.80039C4.79984 2.57954 4.97902 2.4005 5.19984 2.40039H10.7999ZM3.2217 11.5473C2.85707 12.078 3.23714 12.8002 3.88108 12.8004H12.1186C12.7627 12.8004 13.1428 12.0781 12.778 11.5473L11.9897 10.4004H4.00999L3.2217 11.5473ZM6.39985 6.80039C6.39985 6.88128 6.37535 6.96029 6.32954 7.02695L4.55999 9.60039H11.4397L9.67019 7.02695C9.62442 6.96031 9.59988 6.88124 9.59988 6.80039V3.20039H6.39985V6.80039Z",
        fill: "#141413",
      }),
    ],
  });
}
function Ktn() {
  const t = Jd(),
    { acceptTerms: e, isLoading: n } = gn(),
    r = Zv(),
    { sendAnalytics: i } = rd();
  if (n) return N.jsx(t1, { to: "/", replace: !0 });
  if (!r) return N.jsx(t1, { to: "/auth/login", replace: !0 });
  const s = () => {
    try {
      (i("sheets.funnel.terms_accepted", { surface: Fn(), vendor: Zr }),
        e(),
        t("/"));
    } catch (o) {
      xt.error("Failed to accept terms", {
        component: "terms",
        errorType: Zn.USER_ERROR,
        extra: { error: o instanceof Error ? o.message : String(o) },
      });
    }
  };
  return N.jsx("div", {
    className:
      "h-full flex flex-col items-center justify-center px-4 py-4 text-center text-text-400 relative",
    children: N.jsxs("div", {
      className: "flex flex-col items-center max-w-md w-full",
      children: [
        N.jsx("h1", {
          className:
            "text-xl font-semibold text-text-300 font-claude-response mb-8 leading-[140%] max-w-[324px]",
          children:
            Fn() === "slide"
              ? "You are entering a research preview experience"
              : "This feature is in beta",
        }),
        N.jsxs("div", {
          className:
            "flex flex-col p-5 px-4 items-start gap-4 w-full max-w-[324px] rounded-lg border border-gray-200 shadow-sm",
          children: [
            N.jsxs("div", {
              className: "flex items-start gap-3 w-full",
              children: [
                N.jsx("div", {
                  className: "flex-shrink-0 mt-0.5 text-text-400",
                  children: N.jsx(Ztn, {}),
                }),
                N.jsxs("p", {
                  className:
                    "text-xs text-text-300 text-left leading-[140%] font-ui-sans",
                  children: [
                    "This is",
                    " ",
                    Fn() === "slide"
                      ? N.jsxs(N.Fragment, {
                          children: [
                            N.jsx("span", { children: "an " }),
                            N.jsx("span", {
                              className: "font-medium",
                              children: "early",
                            }),
                            " ",
                          ],
                        })
                      : "a ",
                    "beta feature that we are actively improving. Not all native ",
                    W3[Fn()],
                    " features will be supported.",
                  ],
                }),
              ],
            }),
            N.jsx("div", { className: "w-full h-px bg-gray-300" }),
            N.jsxs("div", {
              className: "flex items-start gap-3 w-full text-danger-200",
              children: [
                N.jsx("div", {
                  className: "flex-shrink-0 mt-0.5",
                  children: N.jsx(Y1, {}),
                }),
                N.jsxs("p", {
                  className: "font-ui-small text-left text-xs",
                  children: [
                    "Malicious actors can hide instructions in websites, emails, and documents that trick AI into taking harmful actions without your knowledge.",
                    " ",
                    N.jsx(Xtn, {
                      href: Ute[Fn()] ?? Ute.sheet,
                      children: "Learn more",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        N.jsx("button", {
          type: "button",
          onClick: s,
          className:
            "mt-[72px] flex h-9 px-4 justify-center items-center bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium",
          children: "I understand",
        }),
      ],
    }),
  });
}
function Xtn({ href: t, children: e }) {
  return N.jsx("a", {
    href: t,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "underline",
    children: e,
  });
}
const Ytn = [
  {
    path: "/",
    element: N.jsx(Tat, {}),
    errorElement: N.jsx(upt, {}),
    children: [
      { index: !0, element: N.jsx(gtn, {}) },
      { path: "onboarding", element: N.jsx(Gtn, {}) },
      { path: "terms", element: N.jsx(Ktn, {}) },
      { path: "auth/callback", element: N.jsx(ipt, {}) },
      { path: "auth/3p", element: N.jsx(zht, {}) },
      { path: "auth/3p/gateway", element: N.jsx(ept, {}) },
      { path: "auth/3p/vertex", element: N.jsx(tpt, {}) },
      { path: "auth/3p/bedrock", element: N.jsx(Qht, {}) },
      { path: "auth/login", element: N.jsx(apt, {}) },
    ],
  },
];
class Jtn {
  constructor(e) {
    ((this.activeTask = null),
      (this.messages = []),
      (this.unsubscribe = null),
      (this.sendMessage = e.sendMessage));
  }
  async executeTask(e) {
    ((this.activeTask = e), (this.messages = []));
    const n = ibe();
    if (!n) {
      this.sendMessage({
        type: "subagent_result",
        id: e.id,
        success: !1,
        error: "No agent available. Please ensure the add-in chat is open.",
        messages: [],
      });
      return;
    }
    let i = wt.getState().messages.length;
    this.unsubscribe = wt.subscribe((s) => {
      const o = s.messages;
      if (o.length > i) {
        for (let a = i; a < o.length; a++) {
          const l = o[a],
            c = this.convertToSubagentMessage(l);
          c &&
            (this.messages.push(c),
            this.sendMessage({
              type: "subagent_stream",
              id: e.id,
              message: c,
            }));
        }
        i = o.length;
      }
    });
    try {
      wt.getState().setBanner({
        type: "info",
        content: `📥 Task from Desktop: ${e.task.slice(0, 50)}${e.task.length > 50 ? "..." : ""}`,
      });
      const s = e.context
        ? `[Context from Desktop: ${e.context}]

${e.task}`
        : e.task;
      (await n.query(s), wt.getState().setBanner(null));
      const a =
        this.messages.filter((l) => l.type === "text").pop()?.content ||
        "Task completed successfully";
      this.sendMessage({
        type: "subagent_result",
        id: e.id,
        success: !0,
        result: a,
        messages: this.messages,
      });
    } catch (s) {
      (xt.error("Subagent task failed", {
        component: "SubagentRunner",
        errorType: Zn.TOOL_EXECUTION,
        extra: {
          taskId: e.id,
          error: s instanceof Error ? s.message : String(s),
        },
      }),
        wt.getState().setBanner(null),
        this.sendMessage({
          type: "subagent_result",
          id: e.id,
          success: !1,
          error: s instanceof Error ? s.message : String(s),
          messages: this.messages,
        }));
    } finally {
      (this.unsubscribe?.(),
        (this.unsubscribe = null),
        (this.activeTask = null));
    }
  }
  convertToSubagentMessage(e) {
    const n = e.timestamp.getTime();
    if (e.type === "user" || e.type === "assistant")
      return { type: "text", uuid: e.uuid, content: e.content, timestamp: n };
    if (e.type === "tool") {
      const r = e;
      if (r.status === "pending" || r.status === "running")
        return {
          type: "tool_use",
          uuid: r.uuid,
          toolName: r.name,
          toolInput: r.input,
          timestamp: n,
        };
      if (r.status === "complete")
        return {
          type: "tool_result",
          uuid: r.uuid,
          toolOutput: r.result,
          timestamp: n,
        };
      if (r.status === "error")
        return {
          type: "tool_result",
          uuid: r.uuid,
          toolOutput: { error: r.error },
          timestamp: n,
        };
    }
    return null;
  }
  isRunning() {
    return this.activeTask !== null;
  }
  getCurrentTaskId() {
    return this.activeTask?.id ?? null;
  }
}
const Qtn = new Jtn({ sendMessage: TEt });
kEt(async (t) => {
  await Qtn.executeTask(t);
});
yUe(vot);
const ZRe = {
  endpoint: "https://pivot.claude.ai",
  serviceName: "office-agent",
  enabled: !0,
  resourceAttributes: { "git.sha": "8a3d43cefdceab518a6d097570376a752fe96819" },
};
tat({
  ...ZRe,
  useSimpleProcessor: !0,
  privacy: { shouldExport: cot, isInternalUser: uot, getCustomCollector: nat },
});
OQe(ZRe);
const enn = (t) => t.ctrlKey && t.altKey && t.key.toLowerCase() === "c";
document.addEventListener("keydown", (t) => {
  enn(t) && t.preventDefault();
});
window.addEventListener("message", (t) => {
  if (
    t.data.type === "KEYBOARD_SHORTCUT_TRIGGERED" &&
    t.data.action === "ShowTaskpane"
  ) {
    const e = (n = 0) => {
      const r = document.querySelector('textarea, input[type="text"]');
      r ? r.focus() : n < 10 && setTimeout(() => e(n + 1), 100);
    };
    e();
  }
});
n$(() => {
  document.querySelector('textarea, input[type="text"]')?.focus();
});
Office?.onReady((t) => {
  t.host && Bge(t.host.toString());
  let e, n;
  t.host === Office.HostType.Excel
    ? ((e = "ExcelApi"), (n = pk()))
    : t.host === Office.HostType.PowerPoint
      ? ((e = "PowerPointApi"), (n = _H()))
      : t.host === Office.HostType.Word && ((e = "WordApi"), (n = xH()));
  {
    const r = fk();
    TPe({
      "addin.host": `office.${t.host?.toString()?.toLowerCase()}`,
      ...(t.platform && { "office.platform": t.platform.toString() }),
      ...(r.version && { "office.version": r.version }),
      ...(n && { "office.api_max": `${e}:${n}` }),
    });
  }
  e &&
    n &&
    Ft("office_capability_snapshot", {
      api_set_name: e,
      api_max: n,
      keyboard_shortcuts: Bi.keyboardShortcuts(),
      ...(e === "ExcelApi" && {
        excel_notes: Bi.excelNotes(),
        excel_displayed_cell_props: Bi.excelDisplayedCellProps(),
      }),
      ...(e === "WordApi" && {
        word_comments: Bi.wordComments(),
        word_tracked_changes: Bi.wordTrackedChanges(),
      }),
    });
});
const tnn = { basename: void 0 },
  nnn = wUe(jBe)(Ytn, tnn),
  X0e = document.getElementById("react-container");
X0e &&
  AUe.createRoot(X0e).render(
    N.jsx(I.StrictMode, { children: N.jsx(dBe, { router: nnn }) }),
  );
export {
  md as D,
  Os as E,
  R1 as J,
  dw as a,
  $Vt as b,
  Za as c,
  Ny as d,
  ed as e,
