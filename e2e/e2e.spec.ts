/**
 * Open-Excel E2E test.
 *
 * Exercises the full flow:
 *   1. Login to Microsoft (if needed)
 *   2. Open the Excel Online workbook
 *   3. Sideload manifest.xml (if not already sideloaded)
 *   4. Open the sideloaded add-in
 *   5. Verify the chat UI is ready (direct to chat, no boot flow)
 *   6. Submit a prompt and verify the agent writes to the workbook
 *
 * Run:  npx playwright test e2e/e2e.spec.ts --headed
 */

import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { Page, FrameLocator, Frame, BrowserContext } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(__dirname, ".auth/state.json");
const MANIFEST_PATH = path.join(__dirname, "..", "manifest.xml");

const EXCEL_URL =
  "https://excel.cloud.microsoft/open/onedrive/?docId=F7127E0A4D24692B%21sfda69448f6d049468fcc43bc01bc3439&driveId=F7127E0A4D24692B";

const MS_EMAIL = "wenhelog@gmail.com";
const MS_PASSWORD = "Buzhisuoyun4225";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Disable WebAuthn/FIDO so Microsoft login skips the passkey prompt. */
async function disableFido(context: BrowserContext) {
  await context.addInitScript(() => {
    delete (window as Record<string, unknown>).PublicKeyCredential;
  });
}

/** Complete Microsoft login if an email field is present. */
async function loginIfNeeded(page: Page) {
  const emailField = page.locator("#i0116");
  if ((await emailField.count()) === 0) return;

  await emailField.fill(MS_EMAIL);
  await page.locator("#idSIButton9").click();
  await page.waitForSelector('[name="passwd"], input[type="password"]', { timeout: 15_000 });
  await page.waitForTimeout(1_000);

  const pw = page.locator('[name="passwd"], input[type="password"]').first();
  await pw.fill(MS_PASSWORD);
  await pw.press("Enter");
  await page.waitForTimeout(5_000);

  // "Stay signed in?" -> Yes
  const stayBtn = page.locator('[data-testid="primaryButton"]');
  if ((await stayBtn.count()) > 0) {
    await stayBtn.click();
    await page.waitForTimeout(3_000);
  }
}

/**
 * Navigate to the Excel workbook and return the Excel iframe FrameLocator.
 * Handles account picker / re-auth if the session cookie is stale.
 */
async function openExcelWorkbook(page: Page): Promise<FrameLocator> {
  await page.goto(EXCEL_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });

  // Wait for account picker, email login, or Excel iframe
  await page
    .waitForSelector(
      '#newSessionLink, [data-testid="0300"], #i0116, iframe[name="WacFrame_Excel_0"]',
      { timeout: 30_000 },
    )
    .catch(() => {});
  await page.waitForTimeout(1_000);

  // Account picker: click the saved account tile
  const accountLink = page.locator('#newSessionLink, [data-testid="0300"]').first();
  if ((await accountLink.count()) > 0) {
    await accountLink.click();
    await page.waitForTimeout(3_000);

    // May need to re-enter password
    const pwField = page.locator('[name="passwd"], input[type="password"]').first();
    if ((await pwField.count()) > 0) {
      await pwField.fill(MS_PASSWORD);
      await pwField.press("Enter");
      await page.waitForTimeout(5_000);
      const stayBtn = page.locator('[data-testid="primaryButton"]');
      if ((await stayBtn.count()) > 0) {
        await stayBtn.click();
        await page.waitForTimeout(3_000);
      }
    }
  }

  // Full login needed
  await loginIfNeeded(page);

  // Wait for Excel iframe + ribbon
  await page.waitForSelector('iframe[name="WacFrame_Excel_0"]', { timeout: 90_000 });
  const excelFrame = page.locator('iframe[name="WacFrame_Excel_0"]').contentFrame();
  await excelFrame.locator('[role="tab"]').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2_000);

  return excelFrame;
}

/** Find the taskpane frame (localhost:5173) among all page frames. */
function findTaskpaneFrame(page: Page): Frame | null {
  for (const f of page.frames()) {
    if (f.url().includes("localhost:5173")) return f;
  }
  return null;
}

/**
 * Sideload the manifest.xml via the Office Add-ins dialog.
 * Path: Home tab -> Add-ins -> More Add-ins -> My Add-ins -> Manage -> Upload.
 */
async function sideloadManifest(page: Page, excelFrame: FrameLocator) {
  // Home tab -> Add-ins button
  await excelFrame.getByRole("tab", { name: /Home|开始/ }).click();
  await page.waitForTimeout(1_000);
  await excelFrame.getByRole("button", { name: /Add-ins|加载项/ }).click();
  await page.waitForTimeout(1_000);
  await excelFrame.getByRole("menuitem", { name: /More Add-ins|更多加载项/ }).click();
  await page.waitForTimeout(3_000);

  // Get the nested Office Add-ins iframe (dynamic name starting with "_xdm_")
  const addinsFrame = excelFrame.locator('iframe[name^="_xdm_"]').first().contentFrame();

  // My Add-ins tab
  await addinsFrame.getByRole("tab", { name: /MY ADD-INS|我的加载项/i }).click();
  await page.waitForTimeout(2_000);

  // Manage My Add-ins -> Upload My Add-in
  await addinsFrame.getByRole("button", { name: /Manage My Add-ins|管理我的加载项/i }).click();
  await page.waitForTimeout(1_000);
  await addinsFrame.getByRole("menuitem", { name: /Upload My Add-in|上传我的加载项/i }).click();
  await page.waitForTimeout(2_000);

  // Upload the manifest file via the hidden file input
  const fileInput = addinsFrame.locator('input[type="file"]');
  await fileInput.setInputFiles(MANIFEST_PATH);
  await page.waitForTimeout(1_000);
  await addinsFrame.getByRole("button", { name: /^Upload$|^上传$/i }).click();
  await page.waitForTimeout(3_000);

  // Close the dialog
  const closeBtn = excelFrame.getByRole("button", { name: /Close|关闭/i });
  if ((await closeBtn.count()) > 0) {
    await closeBtn.click();
    await page.waitForTimeout(1_000);
  }
}

/** Open the sideloaded add-in from the ribbon overflow menu. */
async function openAddin(page: Page, excelFrame: FrameLocator) {
  const overflow = excelFrame.locator("#RibbonOverflowMenu-overflow");
  await overflow.click();
  await page.waitForTimeout(1_000);
  await excelFrame.getByRole("menuitem", { name: "Open Assistant" }).click();
  await page.waitForTimeout(5_000);
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

test.use({
  browserName: "chromium",
  headless: false,
  viewport: { width: 1440, height: 900 },
  ignoreHTTPSErrors: true,
  launchOptions: {
    args: ["--disable-blink-features=AutomationControlled"],
  },
});

// ---------------------------------------------------------------------------
// Auth setup: login and save state for reuse
// ---------------------------------------------------------------------------

test.describe("Open Excel E2E", () => {
  let savedContext: BrowserContext;
  let page: Page;
  let excelFrame: FrameLocator;
  const consoleLogs: string[] = [];

  test.beforeAll(async ({ browser }) => {
    const hasState = fs.existsSync(STATE_PATH);
    savedContext = hasState
      ? await browser.newContext({ storageState: STATE_PATH })
      : await browser.newContext();

    await disableFido(savedContext);
    page = await savedContext.newPage();

    // Capture console logs from all frames (including taskpane iframe)
    page.on("console", (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
  });

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status !== "passed") {
      console.log(`--- Console logs for failed test: ${testInfo.title} ---`);
      for (const log of consoleLogs) {
        console.log(log);
      }
      console.log("--- End console logs ---");
    }
  });

  test.afterAll(async () => {
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    await savedContext.storageState({ path: STATE_PATH });
    await savedContext.close();
  });

  test("login and open Excel workbook", async () => {
    excelFrame = await openExcelWorkbook(page);

    // Verify we're on the Excel page (not stuck on login)
    expect(page.url()).toContain("excel.cloud.microsoft");

    // Verify ribbon tabs loaded inside the Excel iframe
    const tabs = await excelFrame.locator('[role="tab"]').allTextContents();
    const tabNames = tabs.filter(Boolean);
    expect(tabNames.length).toBeGreaterThan(3);
    // Home tab must exist (Chinese: 开始, English: Home)
    expect(tabNames.some((t) => /Home|开始/.test(t))).toBe(true);
  });

  test("sideload add-in if not already loaded", async () => {
    // Try opening the add-in first; if "Open Assistant" is missing, sideload
    const overflow = excelFrame.locator("#RibbonOverflowMenu-overflow");
    let alreadySideloaded = false;

    if ((await overflow.count()) > 0) {
      await overflow.click();
      await page.waitForTimeout(1_000);
      const openRebuild = excelFrame.getByRole("menuitem", { name: "Open Assistant" });
      if ((await openRebuild.count()) > 0) {
        alreadySideloaded = true;
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
      } else {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
      }
    }

    if (!alreadySideloaded) {
      await sideloadManifest(page, excelFrame);

      // Verify sideload succeeded: "Open Assistant" should now appear in overflow
      await overflow.click();
      await page.waitForTimeout(1_000);
      const openRebuild = excelFrame.getByRole("menuitem", { name: "Open Assistant" });
      await expect(openRebuild).toBeVisible({ timeout: 5_000 });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
  });

  test("open the sideloaded add-in", async () => {
    await openAddin(page, excelFrame);
    const taskpane = findTaskpaneFrame(page);
    expect(taskpane).not.toBeNull();
    // Verify the taskpane iframe points to localhost dev server
    expect(taskpane!.url()).toContain("localhost:5173");
  });

  test("verify chat UI is ready", async () => {
    const taskpane = findTaskpaneFrame(page);
    expect(taskpane).not.toBeNull();

    // The app now loads directly to the chat interface (no boot flow).
    // Verify the composer input and header are visible.
    await expect(taskpane!.locator(".chat-input-textarea")).toBeVisible({ timeout: 15_000 });
    await expect(taskpane!.locator(".chat-input-btn-send")).toBeVisible();
    await expect(taskpane!.locator(".app-title")).toBeVisible();
  });

  test("submit a prompt and verify the agent writes to the workbook", async () => {
    const taskpane = findTaskpaneFrame(page);
    expect(taskpane).not.toBeNull();

    // Clear previous console logs
    consoleLogs.length = 0;

    // Use a unique value with timestamp so we can verify THIS run wrote it
    const uniqueValue = `e2e-${Date.now()}`;
    const prompt = `Write the exact text "${uniqueValue}" into cell B1 on Sheet1. Do not add anything else.`;

    // Read current B1 value from the workbook preview to confirm it's different
    // Navigate to B1 via the Name Box in Excel
    const nameBox = excelFrame
      .locator('input[aria-label*="名称框"], input[aria-label*="Name Box"]')
      .first();
    await nameBox.click();
    await nameBox.fill("B1");
    await nameBox.press("Enter");
    await page.waitForTimeout(1_000);
    const formulaBar = excelFrame.locator('[aria-label="formula bar"]');
    const valueBefore = await formulaBar.innerText().catch(() => "");
    // The unique value should NOT already be in B1
    expect(valueBefore.trim()).not.toBe(uniqueValue);

    // Type into the chat input textarea
    const composerInput = taskpane!.locator(".chat-input-textarea");
    await composerInput.waitFor({ timeout: 10_000 });
    await composerInput.fill(prompt);

    // Click the send button
    const sendBtn = taskpane!.locator(".chat-input-btn-send");
    await expect(sendBtn).toBeVisible();
    await sendBtn.click();

    // Wait for the agent to finish: the user message should appear, then
    // an assistant message should appear after the agent completes.
    // The chat input gets cleared after sending.
    await expect(composerInput).toHaveValue("", { timeout: 5_000 });

    // Wait for at least one assistant message to appear
    const assistantMessages = taskpane!.locator(".msg-assistant");
    await expect(assistantMessages.first()).toBeVisible({ timeout: 90_000 });

    // Wait for the agent to stop running (composer re-enables)
    // The send button should be visible and the input should be editable
    await expect(composerInput).toBeEditable({ timeout: 90_000 });

    // Give Excel a moment to sync after the agent finishes writing
    await page.waitForTimeout(3_000);

    // Navigate to a different cell first to force Excel to refresh, then back to B1
    await nameBox.click();
    await nameBox.fill("A1");
    await nameBox.press("Enter");
    await page.waitForTimeout(500);
    await nameBox.click();
    await nameBox.fill("B1");
    await nameBox.press("Enter");
    await page.waitForTimeout(1_000);
    const valueAfter = await formulaBar.innerText();
    expect(valueAfter.trim()).toBe(uniqueValue);
  });
});
