import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

const files = {
  html: path.join(cwd, "index.html"),
  rawBundle: path.join(cwd, "m-addin/assets/index-CaYG1oEg.js"),
  prettyBundle: path.join(cwd, "reverse/pretty/index-CaYG1oEg.pretty.js"),
  outDir: path.join(cwd, "reverse/analysis/generated"),
};

for (const file of [files.html, files.rawBundle, files.prettyBundle]) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

fs.mkdirSync(files.outDir, { recursive: true });

const html = fs.readFileSync(files.html, "utf8");
const rawBundle = fs.readFileSync(files.rawBundle, "utf8");
const prettyBundle = fs.readFileSync(files.prettyBundle, "utf8");

const toSortedUnique = (values) =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );

const writeText = (name, content) => {
  fs.writeFileSync(path.join(files.outDir, name), content, "utf8");
};

const collectQuotedList = (source, pattern) =>
  Array.from(source.matchAll(pattern), (match) => match[1]);

const dynamicChunkBlock =
  rawBundle.match(/m\.f\s*\|\|\s*\(m\.f=\[(.*?)\]\)\)/s)?.[1] ?? "";
const dynamicChunks = toSortedUnique(
  collectQuotedList(dynamicChunkBlock, /"([^"]+)"/g),
);

const urlRegex = /\b(?:https?|wss?):\/\/[^\s"'`<>\\)]+/g;
const urls = toSortedUnique(Array.from(prettyBundle.match(urlRegex) ?? []));

const manifestParamsBlock =
  prettyBundle.match(/const hme = \[(.*?)\],\s*pme = "claude\.manifest\.params"/s)?.[1] ??
  "";
const manifestParams = toSortedUnique(
  collectQuotedList(manifestParamsBlock, /"([^"]+)"/g),
);

const routeBlock = prettyBundle.match(/const Ytn = \[(.*?)\n\];/s)?.[1] ?? "";
const routes = [
  "/",
  ...collectQuotedList(routeBlock, /path: "([^"]+)"/g).map((value) =>
    value.startsWith("/") ? value : `/${value}`,
  ),
];

const telemetryEvents = toSortedUnique(
  Array.from(prettyBundle.matchAll(/Ft\("([^"]+)"/g), (match) => match[1]),
);

const analyticsEvents = toSortedUnique(
  Array.from(
    prettyBundle.matchAll(/"((?:sheets|office_agent)\.[^"]+)"/g),
    (match) => match[1],
  ),
);

const libraryDetections = [
  ["React", /react\.dev\/errors|react\.transitional\.element/],
  ["React Router", /reactrouter\.com|data router/],
  ["Sentry", /SENTRY_RELEASE|ingest\.us\.sentry\.io|Sentry Logger/],
  ["MSAL", /login\.microsoftonline\.com|msal\.js\.common/],
  ["Anthropic SDK", /anthropic-sdk-typescript|api\.anthropic\.com/],
  ["GrowthBook", /cdn\.growthbook\.io|org_growthbook/],
  ["ExcelJS", /exceljs|XLSX#createInputStream|CSV#createInputStream/],
  ["JSZip", /JSZip|loadAsync\(/],
  ["mammoth", /mammoth\/style-map|mammoth\.extractRawText/],
  ["SES", /SES_ALREADY_LOCKED_DOWN|SES_HTML_COMMENT_REJECTED/],
  ["OpenTelemetry", /otlp|office_agent\.startup_phase_duration_ms/],
  ["Google Auth", /GoogleAuth|oauth2\.googleapis\.com/],
  ["AWS Bedrock", /bedrock-runtime|sts\.amazonaws\.com/],
];

const detectedLibraries = libraryDetections
  .filter(([, pattern]) => pattern.test(prettyBundle))
  .map(([name]) => name);

const entrypoints = {
  localHtmlModule:
    html.match(/<script type="module" crossorigin src="([^"]+)"/)?.[1] ?? null,
  localHtmlPreload:
    html.match(/<link rel="modulepreload" crossorigin href="([^"]+)"/)?.[1] ??
    null,
  releaseSha:
    prettyBundle.match(/"git\.sha"\s*:\s*"([a-f0-9]{40})"/)?.[1] ??
    prettyBundle.match(/SENTRY_RELEASE=\{id:"([a-f0-9]{40})"\}/)?.[1] ??
    null,
  serviceName:
    prettyBundle.match(/serviceName:\s*"([^"]+)"/)?.[1] ?? null,
};

const summary = {
  generatedAt: new Date().toISOString(),
  entrypoints,
  counts: {
    dynamicChunks: dynamicChunks.length,
    urls: urls.length,
    routes: routes.length,
    telemetryEvents: telemetryEvents.length,
    analyticsEvents: analyticsEvents.length,
    manifestParams: manifestParams.length,
    detectedLibraries: detectedLibraries.length,
  },
  notes: [
    "dynamicChunks come from __vite__mapDeps in the local raw bundle",
    "routes are extracted from the React Router config block",
    "telemetryEvents are local Ft(...) calls",
    "analyticsEvents include sheets./office_agent. event strings found in the bundle",
  ],
};

writeText("dynamic-chunks.txt", `${dynamicChunks.join("\n")}\n`);
writeText("urls.txt", `${urls.join("\n")}\n`);
writeText("routes.txt", `${toSortedUnique(routes).join("\n")}\n`);
writeText("telemetry-events.txt", `${telemetryEvents.join("\n")}\n`);
writeText("analytics-events.txt", `${analyticsEvents.join("\n")}\n`);
writeText("manifest-params.txt", `${manifestParams.join("\n")}\n`);
writeText("detected-libraries.txt", `${detectedLibraries.join("\n")}\n`);
writeText("summary.json", `${JSON.stringify(summary, null, 2)}\n`);
