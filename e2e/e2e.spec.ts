/**
 * Open-Excel E2E test.
 *
 * Exercises the full flow:
 *   1. Login to Microsoft (if needed)
 *   2. Open the Excel Online workbook
 *   3. Sideload manifest.xml (if not already sideloaded)
 *   4. Open the sideloaded add-in
 *   5. Navigate the add-in boot flow (login -> terms -> onboarding)
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

  // "Stay signed in?" → Yes
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
 * Path: Home tab → Add-ins → More Add-ins → My Add-ins → Manage → Upload.
 */
async function sideloadManifest(page: Page, excelFrame: FrameLocator) {
  // Home tab → Add-ins button
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

  // Manage My Add-ins → Upload My Add-in
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
  await excelFrame.getByRole("menuitem", { name: "Open Rebuild" }).click();
  await page.waitForTimeout(5_000);
}

/**
 * Navigate through the add-in boot flow (Login → Terms → Onboarding)
 * if not already on the workbench.
 */
async function navigateAddinBootFlow(page: Page, frame: Frame) {
  // Login page: click "Continue with LiteLLM" (uses default form values)
  const continueBtn = frame.getByRole("button", { name: /Continue with LiteLLM/i });
  if ((await continueBtn.count()) > 0) {
    await continueBtn.click();
    await page.waitForTimeout(2_000);
  }

  // Terms page
  const termsBtn = frame.getByRole("button", { name: /I understand/i });
  if ((await termsBtn.count()) > 0) {
    await termsBtn.click();
    await page.waitForTimeout(2_000);
  }

  // Onboarding page
  const launchBtn = frame.getByRole("button", { name: /Launch workbench/i });
  if ((await launchBtn.count()) > 0) {
    await launchBtn.click();
    await page.waitForTimeout(3_000);
  }
}

/**
 * Set a React-controlled textarea value using the native setter
 * so that React's onChange fires properly.
 */
async function setReactTextareaValue(frame: Frame, selector: string, value: string) {
  const textarea = frame.locator(selector);
  await textarea.waitFor({ timeout: 10_000 });
  await textarea.evaluate((el: HTMLTextAreaElement, val: string) => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter?.call(el, val);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
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
    // Try opening the add-in first; if "Open Rebuild" is missing, sideload
    const overflow = excelFrame.locator("#RibbonOverflowMenu-overflow");
    let alreadySideloaded = false;

    if ((await overflow.count()) > 0) {
      await overflow.click();
      await page.waitForTimeout(1_000);
      const openRebuild = excelFrame.getByRole("menuitem", { name: "Open Rebuild" });
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

      // Verify sideload succeeded: "Open Rebuild" should now appear in overflow
      await overflow.click();
      await page.waitForTimeout(1_000);
      const openRebuild = excelFrame.getByRole("menuitem", { name: "Open Rebuild" });
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

  test("navigate add-in boot flow to workbench", async () => {
    const taskpane = findTaskpaneFrame(page);
    expect(taskpane).not.toBeNull();
    await navigateAddinBootFlow(page, taskpane!);

    // Verify workbench is ready: prompt input, run button, and message list all visible
    await expect(taskpane!.locator('[data-testid="prompt-input"]')).toBeVisible({ timeout: 10_000 });
    await expect(taskpane!.locator('[data-testid="run-agent"]')).toBeVisible();
    await expect(taskpane!.locator('[data-testid="message-list"]')).toBeVisible();
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
    const nameBox = excelFrame.locator('input[aria-label*="名称框"], input[aria-label*="Name Box"]').first();
    await nameBox.click();
    await nameBox.fill("B1");
    await nameBox.press("Enter");
    await page.waitForTimeout(1_000);
    const formulaBar = excelFrame.locator('[aria-label="formula bar"]');
    const valueBefore = await formulaBar.innerText().catch(() => "");
    // The unique value should NOT already be in B1
    expect(valueBefore.trim()).not.toBe(uniqueValue);

    // Type the prompt
    await setReactTextareaValue(taskpane!, '[data-testid="prompt-input"]', prompt);

    // Click run
    const runBtn = taskpane!.locator('[data-testid="run-agent"]');
    await expect(runBtn).toBeEnabled();
    await runBtn.click();

    // Button should show "Running..." while the agent is working
    await expect(runBtn).toHaveText(/Running/i, { timeout: 5_000 });

    // Wait for agent to finish (busy state clears)
    await expect(runBtn).toHaveText("Run agent", { timeout: 60_000 });

    // Verify that the agent produced an assistant response
    const assistantMessages = taskpane!.locator('[data-testid="message-list"] .role-assistant');
    const assistantCount = await assistantMessages.count();
    expect(assistantCount).toBeGreaterThan(0);

    // Navigate to B1 again and verify the cell now contains our unique value
    await nameBox.click();
    await nameBox.fill("B1");
    await nameBox.press("Enter");
    await page.waitForTimeout(1_000);
    const valueAfter = await formulaBar.innerText();
    expect(valueAfter.trim()).toBe(uniqueValue);
  });
});
