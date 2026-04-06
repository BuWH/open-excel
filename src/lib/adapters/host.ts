import { OfficeWorkbookAdapter } from "./officeWorkbook";
import type { WorkbookAdapter } from "./types";

let officeAdapter: OfficeWorkbookAdapter | null = null;
let adapterPromise: Promise<WorkbookAdapter> | null = null;

async function createAdapter(): Promise<WorkbookAdapter> {
  if (typeof Office === "undefined" || typeof Office.onReady !== "function") {
    throw new Error("Claude in Excel Rebuild must run inside Excel Online.");
  }

  const info = await Office.onReady();
  if (info?.host !== Office.HostType.Excel || typeof Excel === "undefined") {
    throw new Error("Claude in Excel Rebuild only supports the Excel Office.js host.");
  }

  officeAdapter ??= new OfficeWorkbookAdapter();

  return officeAdapter;
}

export function resolveWorkbookAdapter() {
  adapterPromise ??= createAdapter();
  return adapterPromise;
}
