import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/index.css";

const OFFICE_JS_URL = "https://appsforoffice.microsoft.com/lib/1/hosted/office.js";

function renderApp() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Unable to find the application root element.");
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

function loadOfficeScript() {
  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${OFFICE_JS_URL}"]`,
  );

  if (existingScript) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = OFFICE_JS_URL;
    script.async = true;
    script.type = "text/javascript";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Office.js."));
    document.head.append(script);
  });
}

async function ensureOfficeRuntime() {
  if (typeof Office !== "undefined" && typeof Office.onReady === "function") {
    const info = await Office.onReady();
    if (info?.host !== Office.HostType.Excel || typeof Excel === "undefined") {
      throw new Error("OpenExcel only runs inside the Excel Office.js host.");
    }
    return;
  }

  await Promise.race([
    loadOfficeScript(),
    new Promise<void>((_, reject) => {
      window.setTimeout(
        () => reject(new Error("Office.js did not load. Open this build from Excel Online.")),
        2500,
      );
    }),
  ]);

  if (typeof Office !== "undefined" && typeof Office.onReady === "function") {
    const info = await Office.onReady();
    if (info?.host !== Office.HostType.Excel || typeof Excel === "undefined") {
      throw new Error("OpenExcel only runs inside the Excel Office.js host.");
    }
    return;
  }

  throw new Error("Office.js is unavailable. Open this build from Excel Online.");
}

async function bootstrap() {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.textContent = "Loading Office runtime…";
  }

  await ensureOfficeRuntime();

  renderApp();
}

void bootstrap().catch((error) => {
  console.error("Failed to bootstrap the taskpane.", error);

  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.textContent = error instanceof Error ? error.message : String(error);
  }
});
