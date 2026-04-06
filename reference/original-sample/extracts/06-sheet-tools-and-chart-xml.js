        messages: Er(He())
          .optional()
          .describe("Optional messages to return to the model"),
      }),
      description:
        "WRITE. Create, update, or delete spreadsheet objects. Create: omit id, provide objectType and properties. Update: provide id and partial properties to change (LIMITATION: cannot update source range or destination location - you must delete and recreate for those changes). Delete: provide id only. IMPORTANT: When recreating objects, always delete the existing object FIRST to avoid range conflicts, then create the new one.",
    },
    resize_range: {
      inputSchema: lt({
        sheetName: Ff,
        range: He()
          .optional()
          .describe(
            "A1 notation range to resize (e.g., 'A:D' for columns, '1:5' for rows). If omitted, applies to entire sheet",
          ),
        width: px.optional().describe("Column width settings"),
        height: px.optional().describe("Row height settings"),
      }).refine((t) => t.width || t.height, {
        message: "At least one of width or height must be specified",
        path: ["width", "height"],
      }),
      resultSchema: lt({}),
      description:
        "WRITE. Resize columns and/or rows in a sheet. Supports specific sizes in point units or standard size reset. Can target specific ranges or entire sheet.",
    },
    clear_cell_range: {
      inputSchema: lt({
        sheetName: Ff,
        range: He().describe(
          'A1 notation range to clear (e.g., "A1:C10", "B5", "D:D", "3:3")',
        ),
        clearType: Ir(["all", "contents", "formats"])
          .optional()
          .default("contents")
          .describe(
            "What to clear: 'all' (content + formatting), 'contents' (values/formulas only), 'formats' (formatting only)",
          ),
      }),
      resultSchema: lt({}),
      description:
        "WRITE. Clear cells in a range. By default clears only content (values/formulas) while preserving formatting. Use clearType='all' to remove both content and formatting, or clearType='formats' to remove only formatting.",
    },
    extract_chart_xml: {
      inputSchema: lt({
        chartId: He().describe("ID of the chart (from get_all_objects)"),
        sheetName: He()
          .optional()
          .describe(
            "Worksheet name to scope the search. Recommended for faster lookup.",
          ),
        fileName: He()
          .optional()
          .describe(
            "Base filename for the chart XML files (default: 'chart'). Use unique names when extracting multiple charts (e.g., 'revenue-chart', 'costs-chart').",
          ),
      }),
      resultSchema: lt({ files: Er(He()) }),
      description:
        "READ. Extract a chart's OOXML XML from the workbook for sending to a PowerPoint agent via send_message. Only use this in the conductor chart-sharing flow — do NOT use for general chart reading or analysis. Applies PPT-specific transforms (transparent background, strips workbook references) and saves chart.xml, chart-style.xml, chart-colors.xml as conductor files. Call send_message next — the files are shared automatically.",
    },
  },
  oSe = [
    "set_cell_range",
    "clear_cell_range",
    "modify_sheet_structure",
    "copy_to",
    "modify_object",
  ],
  aSe = new Set(["extract_chart_xml"]);
function lSe() {
  const t = Tg();
  return Object.entries(RZ)
    .filter(([e]) => t || !aSe.has(e))
    .map(([e, n]) => {
      const r = EZ(n.inputSchema);
      return {
        type: "custom",
        name: e,
        description: n.description,
        input_schema: r,
      };
    });
}
lSe();
const yTt = {
    read_range_image: async (t, e) => {
      if (!e.getRangeImage)
        throw new Error(
          "NotSupportedError: read_range_image is only available in Excel.",
        );
      const n = await e.getFileData({});
      if (!n.success) throw new Error(n.error || "Failed to get file data");
      const r = Oc(n.sheetsMetadata, t.sheetName),
        i = await e.getRangeImage({ sheetId: r, range: t.range });
      if (!i.success)
        throw new Error(i.error || "Failed to render range image");
      return {
        success: !0,
        address: `${t.sheetName}!${t.range}`,
        _images: [{ data: i.base64, mediaType: "image/png" }],
      };
    },
    get_cell_ranges: async (t, e) => {
      const n = await e.getFileData({});
      if (!n.success)
        throw new Error(n.error || "Failed to get file data for pagination");
      const r = Oc(n.sheetsMetadata, t.sheetName),
        i = n.sheetsMetadata.find((p) => p.id === r);
      if (!i) throw new Error(`Sheet not found: ${t.sheetName}`);
      const s = { rows: i.maxRows, columns: i.maxColumns },
        o = Math.min(t.cellLimit, aU),
        a = J2t(t.ranges, K$e, s.rows, s.columns),
        l = { name: i.name, cells: {}, dimension: s };
      if (s.rows === 0 || s.columns === 0)
        return { success: !0, hasMore: !1, worksheet: Gde(l) };
      let c = 0;
      const u = [];
      async function d(p) {
        const {
            startRow: y,
            endRow: b,
            startColumn: w,
            endColumn: x,
          } = Kj(p, s.rows, s.columns),
          S = await e.getSheet({
            sheetId: r,
            startRow: y,
            endRow: b,
            includeStyles: t.includeStyles,
          });
        if (!S.success)
          throw new Error(S.error || `Failed to get sheet data for range ${p}`);
        return {
          startRow: y,
          endRow: b,
          startColumn: w,
          endColumn: x,
          cells: S.data,
          notes: S.notes,
        };
      }
      function f({
        cells: p = [],
        startRow: y,
        endRow: b,
        startColumn: w,
        endColumn: x,
        notes: S = {},
      }) {
        const T = t.includeStyles
            ? ["value", "formula", "note", "cellStyles", "borderStyles"]
            : ["value", "formula", "note"],
          O = ja(w),
          U = ja(x);
        for (let F = 0; F < p.length; F++) {
          const B = y + F,
            H = p[F]?.slice(w - 1, x) || [];
          for (const $ of H) {
            if (c >= o) {
              (H.forEach((P) => delete l.cells[P.a1]),
                u.push(`${O}${B}:${U}${b}`));
              return;
            }
            ((l.cells[$.a1] = E$e($, T)), (c += Xj($) ? 0 : 1));
          }
        }
        for (const [F, B] of Object.entries(S)) {
          const { row: H, col: $ } = L9(F);
          H < y ||
            H > b ||
            $ < w ||
            $ > x ||
            ((l.cells[F] ??= {}), (l.cells[F].note = B));
        }
      }
      async function h(p = 3) {
        let y = 0;
        for (; c < o && y < a.length; ) {
          const b = Math.min(y + p, a.length),
            w = a.slice(y, b),
            x = await Promise.allSettled(w.map(d)),
            [S, T] = YBe(x, (O) => O.status === "fulfilled");
          if (S.length === 0) {
            const O = T.map(
              (U, F) => `${w[F]}: ${U.status === "rejected" ? U.reason : ""}`,
            );
            throw new Error(O.join("; "));
          }
          (S.forEach((O) => O.status === "fulfilled" && f(O.value)), (y = b));
        }
        return [...u, ...a.slice(y)];
      }
      const m = await h(3),
        g = Gde(l);
      return {
        success: !0,
        hasMore: m.length > 0,
        nextRanges: m.length > 0 ? m : void 0,
        worksheet: {
          ...g,
          styles: t.includeStyles ? g.styles : void 0,
          borders: t.includeStyles ? g.borders : void 0,
        },
      };
    },
    get_range_as_csv: async (t, e) => {
      const n = await e.getFileData({});
      if (!n.success) throw new Error(n.error || "Failed to get file data");
      const r = Oc(n.sheetsMetadata, t.sheetName),
        i = n.sheetsMetadata.find((y) => y.id === r);
      if (!i) throw new Error(`Sheet not found: ${t.sheetName}`);
      const s = { rows: i.maxRows, columns: i.maxColumns },
        {
          startRow: o,
          endRow: a,
          startColumn: l,
          endColumn: c,
        } = Kj(t.range, s.rows, s.columns),
        u = t.includeHeaders ? t.maxRows + 1 : t.maxRows,
        d = Math.min(a, o + u - 1),
        f = a > d,
        h = await e.getSheet({
          sheetId: r,
          startRow: o,
          endRow: d,
          includeStyles: !1,
        });
      if (!h.success) throw new Error(h.error || "Failed to get sheet data");
      const m = [],
        g = c - l + 1;
      for (let y = 0; y < h.data.length; y++) {
        const b = h.data[y]?.slice(l - 1, c) || [],
          w = [];
        for (let x = 0; x < g; x++) {
          let T = b[x]?.value ?? "";
          (typeof T == "string" &&
            (T.includes(",") ||
              T.includes('"') ||
              T.includes(`
`)) &&
            (T = `"${T.replace(/"/g, '""')}"`),
            w.push(String(T)));
        }
        m.push(w.join(","));
      }
      const p = t.includeHeaders ? m.length - 1 : m.length;
      return {
        success: !0,
        csv: m.join(`
`),
        rowCount: p,
        columnCount: g,
        hasMore: f,
        sheetName: i.name,
      };
    },
    search_data: async (t, e) => {
      const n = t.options || {},
        r = t.offset || 0,
        i = n.maxResults || 500,
        s = await e.getFileData({});
      if (!s.success) throw new Error(s.error || "Failed to get file data");
      const o = t.sheetName ? Oc(s.sheetsMetadata, t.sheetName) : void 0,
        a = e.searchCells;
      if (a && !n.useRegex) {
        const h = await a({
          sheetId: o,
          searchTerm: t.searchTerm,
          matchCase: n.matchCase ?? !1,
          matchEntireCell: n.matchEntireCell ?? !1,
        });
        if (h.success) {
          const m = h.matches.slice(r, r + i).map(({ sheetId: p, ...y }) => y),
            g = h.matches.length > r + i;
          return {
            success: !0,
            matches: m,
            totalFound: h.totalFound,
            returned: m.length,
            offset: r,
            hasMore: g,
            searchTerm: t.searchTerm,
            searchScope: t.sheetName ? `Sheet "${t.sheetName}"` : "All sheets",
            nextOffset: g ? r + i : null,
          };
        }
      }
      const l = [],
        c = (h, m) => {
          let g = 0;
          for (const p of h) {
            let y = 0;
            for (const b of p) {
              const w = b.value ? String(b.value) : "",
                x = b.formula || "",
                S = n.matchFormulas ? x : w;
              let T = !1;
              (n.useRegex
                ? (T = new RegExp(t.searchTerm, n.matchCase ? "g" : "gi").test(
                    S,
                  ))
                : n.matchEntireCell
                  ? (T = n.matchCase
                      ? S === t.searchTerm
                      : S.toLowerCase() === t.searchTerm.toLowerCase())
                  : (T = n.matchCase
                      ? S.includes(t.searchTerm)
                      : S.toLowerCase().includes(t.searchTerm.toLowerCase())),
                T &&
                  l.length < r + i &&
                  l.push({
                    sheetName: m,
                    a1: b.a1,
                    value: b.value,
                    formula: b.formula || null,
                    row: g + 1,
                    column: y + 1,
                  }),
                y++);
            }
            g++;
          }
        },
        u = [];
      o ? u.push({ id: o }) : u.push(...s.sheetsMetadata);
      for (const h of u) {
        const m = s.sheetsMetadata.find((y) => y.id === h.id);
        if (!m || m.maxRows === 0) continue;
        const g = 1e3;
        let p = 1;
        for (; p <= m.maxRows && l.length < r + i; ) {
          const y = Math.min(p + g - 1, m.maxRows),
            b = await e.getSheet({ sheetId: h.id, startRow: p, endRow: y });
          if (b.success && b.data) {
            const w = b.metadata?.name || "Unknown";
            if ((c(b.data, w), l.length >= r + i)) break;
          }
          p += g;
        }
      }
      const d = l.slice(r, r + i),
        f = l.length > r + i;
      return {
        success: !0,
        matches: d,
        totalFound: l.length,
        returned: d.length,
        offset: r,
        hasMore: f,
        searchTerm: t.searchTerm,
        searchScope: t.sheetName ? `Sheet "${t.sheetName}"` : "All sheets",
        nextOffset: f ? r + i : null,
      };
    },
    set_cell_range: async (t, e) => {
      const n = await e.getFileData({});
      if (!n.success) throw new Error(n.error || "Failed to get file data");
      const r = Oc(n.sheetsMetadata, t.sheetName),
        i = [],
        s = [],
        o = [],
        a = [];
      for (const [d, f] of Object.entries(t.cells)) {
        const h = d.toUpperCase(),
          m =
            typeof f.value == "string" && f.value.startsWith("=")
              ? `'${f.value}`
              : f.value;
        (s.push({
          a1: h,
          value: m,
          formula: f.formula,
          note: f.note,
          cellStyles: f.cellStyles,
          borderStyles: f.borderStyles,
        }),
          f.formula && o.push(h),
          (f.value !== void 0 || f.formula !== void 0) && a.push(h));
      }
      const l = X2t(Object.keys(t.cells));
      if (!t.allow_overwrite && a.length > 0)
        try {
          let d = 1 / 0,
            f = 0;
          for (const h of a) {
            const m = h.match(/(\d+)/);
            if (m) {
              const g = parseInt(m[1], 10);
              ((d = Math.min(d, g)), (f = Math.max(f, g)));
            }
          }
          if (d !== 1 / 0) {
            const h = await e.getSheet({ sheetId: r, startRow: d, endRow: f });
            if ("success" in h && h.success && h.data) {
              const m = new Map();
              for (const p of h.data) for (const y of p) y.a1 && m.set(y.a1, y);
              const g = [];
              for (const p of a) {
                const y = m.get(p);
                y && !Xj(y) && g.push(p);
              }
              if (g.length > 0) {
                const p = g.slice(0, 5).join(", "),
                  y = g.length - 5,
                  b = y > 0 ? `${p}... (and ${y} more)` : p;
                throw new Error(
                  `Would overwrite ${g.length} non-empty cell${g.length > 1 ? "s" : ""}: ${b}. To proceed with overwriting existing data, retry with allow_overwrite set to true.`,
                );
              }
            }
          }
        } catch (d) {
          if (d instanceof Error && d.message.includes("Would overwrite"))
            throw d;
          xt.error(
            "Failed to validate overwrite protection, proceeding with write",
            {
              component: "set_cell_range",
              errorType: Zn.TOOL_EXECUTION,
              extra: { error: d instanceof Error ? d.message : String(d) },
            },
          );
        }
      const c = await e.setCells({ sheetId: r, cells: s });
      if (!("success" in c) || !c.success)
        throw new Error("error" in c ? c.error : "Unknown error");
      if ((c.warnings && i.push(...c.warnings), t.copyToRange)) {
        const d = await e.copyTo({
          sheetId: r,
          sourceRange: l,
          destinationRange: t.copyToRange,
        });
        if (!("success" in d) || !d.success)
          throw new Error("error" in d ? d.error : "Failed to copy range");
      }
      if (t.resizeWidth || t.resizeHeight) {
        const d = await e.resizeRange({
          sheetId: r,
          range: l,
          width: t.resizeWidth,
          height: t.resizeHeight,
        });
        if (!("success" in d) || !d.success)
          throw new Error("error" in d ? d.error : "Failed to resize range");
      }
      const u = {};
      if (o.length > 0)
        try {
          let d = 1 / 0,
            f = 0;
          for (const m of o) {
            const g = m.match(/(\d+)/);
            if (g) {
              const p = parseInt(g[1], 10);
              ((d = Math.min(d, p)), (f = Math.max(f, p)));
            }
          }
          d === 1 / 0 && ((d = 1), (f = 1));
          const h = await e.getSheet({ sheetId: r, startRow: d, endRow: f });
          if ("success" in h && h.success && h.data) {
            const m = new Map();
            for (const g of h.data)
              for (const p of g)
                p.a1 && p.value !== void 0 && m.set(p.a1, p.value);
            for (const g of o) {
              const p = m.get(g);
              p !== void 0 &&
                ((typeof p == "string" && p.startsWith("#")) ||
                typeof p == "number"
                  ? (u[g] = p)
                  : (u[g] = String(p)));
            }
          }
        } catch (d) {
          xt.error("Failed to get formula results", {
            component: "tools",
            errorType: Zn.TOOL_EXECUTION,
            extra: { error: d instanceof Error ? d.message : String(d) },
          });
        }
      return {
        success: !0,
        formula_results: Object.keys(u).length > 0 ? u : void 0,
        messages: i.length > 0 ? i : void 0,
      };
    },
    modify_sheet_structure: async (t, e) => {
      const n = await e.getFileData({});
      if (!n.success) throw new Error(n.error || "Failed to get file data");
      const r = Oc(n.sheetsMetadata, t.sheetName),
        { sheetName: i, ...s } = t,
        o = await e.modifySheetStructure({ ...s, sheetId: r });
      if (!("success" in o) || !o.success)
        throw new Error("error" in o ? o.error : "Unknown error");
      return { success: !0 };
    },
    copy_to: async (t, e) => {
      const n = await e.getFileData({});
      if (!n.success) throw new Error(n.error || "Failed to get file data");
      const r = Oc(n.sheetsMetadata, t.sheetName),
        i = await e.copyTo({
          sheetId: r,
          sourceRange: t.sourceRange,
          destinationRange: t.destinationRange,
        });
      if (!("success" in i) || !i.success)
        throw new Error("error" in i ? i.error : "Unknown error");
      return { success: !0 };
    },
    get_all_objects: async (t, e) => {
      const n = await e.getPivotTables({}),
        r = await e.getCharts({});
      if (!n.success) throw new Error(n.error);
      if (!r.success) throw new Error(r.error);
      const i = await e.getFileData({});
      if (!i.success) throw new Error(i.error || "Failed to get file data");
      const s = new Map(i.sheetsMetadata.map((l) => [l.id, l.name]));
      let o = [...n.results, ...r.results];
      if (t.sheetName) {
        const l = Oc(i.sheetsMetadata, t.sheetName);
        o = o.filter((c) => c.sheetId === l);
      }
      return (
        t.id && (o = o.filter((l) => l.id === t.id)),
        {
          success: !0,
          objects: o.map(({ sheetId: l, ...c }) => ({
            ...c,
            worksheetName: s.get(l) ?? "Unknown",
          })),
        }
      );
    },
    modify_object: async (t, e) => {
      const n = await e.getFileData({});
      if (!n.success) throw new Error(n.error || "Failed to get file data");
      const r = Oc(n.sheetsMetadata, t.sheetName),
        i = `${t.operation}${O$e(t.objectType)}`,
        s = t.properties || {},
        o = { id: t.id, sheetId: r, properties: { ...s, sheetId: r } },
        l = b2t[i].inputSchema.safeParse(o);
      if (!l.success) {
        const u = l.error.issues
          .map((d) => `${d.path.join(".")}: ${d.message}`)
          .join("; ");
        throw new Error(`ToolInputValidationError: ${u}`);
      }
      const c = await e[i](o);
      if (!c.success) throw new Error(c.error);
      return c;
    },
    resize_range: async (t, e) => {
      const n = await e.getFileData({});
      if (!n.success) throw new Error(n.error || "Failed to get file data");
      const r = Oc(n.sheetsMetadata, t.sheetName),
        i = await e.resizeRange({
          sheetId: r,
          range: t.range,
          width: t.width,
          height: t.height,
        });
      if (!("success" in i) || !i.success)
        throw new Error("error" in i ? i.error : "Unknown error");
      return { success: !0 };
    },
    clear_cell_range: async (t, e) => {
      const n = await e.getFileData({});
      if (!n.success) throw new Error(n.error || "Failed to get file data");
      const r = Oc(n.sheetsMetadata, t.sheetName),
        i = await e.clearCellRange({
          sheetId: r,
          range: t.range,
          clearType: t.clearType,
        });
      if (!("success" in i) || !i.success)
        throw new Error("error" in i ? i.error : "Unknown error");
      return { success: !0 };
    },
    extract_chart_xml: async (t, e) => {
      if (!e.extractChartXml)
        throw new Error("extract_chart_xml is not supported on this platform");
      let n;
      if (t.sheetName) {
        const c = await e.getFileData({});
        if (!c.success) throw new Error(c.error || "Failed to get file data");
        n = Oc(c.sheetsMetadata, t.sheetName);
      }
      const r = await e.extractChartXml({ chartId: t.chartId, sheetId: n });
      if ("success" in r && !r.success)
        throw new Error("error" in r ? r.error : "Unknown error");
      const i = "chartXml" in r ? r.chartXml : "",
        s = "styleXml" in r ? r.styleXml : null,
        o = "colorsXml" in r ? r.colorsXml : null,
        a = t.fileName || "chart",
        l = [];
      try {
        const { getActiveConductorClient: c } = await Bn(
            async () => {
              const { getActiveConductorClient: d } =
                await Promise.resolve().then(() => jCt);
              return { getActiveConductorClient: d };
            },
            void 0,
          ),
          u = c();
        if (u) {
          (u.emitFile(`${a}.xml`, i),
            l.push(`${a}.xml`),
            s && (u.emitFile(`${a}-style.xml`, s), l.push(`${a}-style.xml`)),
            o && (u.emitFile(`${a}-colors.xml`, o), l.push(`${a}-colors.xml`)));
          const { track: d } = await Bn(
            async () => {
              const { track: f } = await Promise.resolve().then(() => FQe);
              return { track: f };
            },
            void 0,
          );
          for (const f of l) d("conductor_file_broadcast", { filename: f });
        }
      } catch (c) {
        xt.error("Conductor chart broadcast threw after client check passed", {
