/**
 * Step-by-step Playwright exploration.
 * Run with: node e2e/step.cjs <step-number>
 *
 * Steps:
 *   1 - Login to Microsoft and save state
 *   2 - Open Excel workbook (reuse login state)
 *   3 - Find Home tab and Add-ins inside Excel iframe
 *   4 - Sideload manifest.xml
 *   5 - Open the sideloaded add-in
 *   6 - Interact with the add-in taskpane
 */

const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const SCREENSHOT_DIR = path.join(__dirname, "screenshots");
const STATE_PATH = path.join(__dirname, ".auth/state.json");
const EXCEL_URL =
  "https://excel.cloud.microsoft/open/onedrive/?docId=F7127E0A4D24692B%21sfda69448f6d049468fcc43bc01bc3439&driveId=F7127E0A4D24692B";

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });

const step = parseInt(process.argv[2] || "1", 10);

async function snap(page, name) {
  const p = path.join(SCREENSHOT_DIR, `step${step}-${name}.png`);
  await page.screenshot({ path: p });
  console.log(`[snap] ${p}`);
}

async function launchWithState() {
  const hasState = fs.existsSync(STATE_PATH);
  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const ctx = hasState
    ? await browser.newContext({
        storageState: STATE_PATH,
        ignoreHTTPSErrors: true,
        viewport: { width: 1440, height: 900 },
      })
    : await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });

  // Remove WebAuthn/FIDO API so Microsoft login skips the passkey prompt
  // and goes directly to the password page.
  await ctx.addInitScript(() => {
    delete window.PublicKeyCredential;
  });

  return { browser, ctx };
}

async function saveState(ctx) {
  await ctx.storageState({ path: STATE_PATH });
  console.log("[state] saved to", STATE_PATH);
}

// Step 1: Login
async function step1() {
  const { browser, ctx } = await launchWithState();
  const page = await ctx.newPage();

  console.log("Going to Excel URL (will redirect to login)...");
  await page.goto(EXCEL_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(8000);
  await snap(page, "initial");
  console.log("URL after load:", page.url());

  // Check if login is needed
  const emailField = page.locator("#i0116");
  if ((await emailField.count()) === 0) {
    console.log("Already logged in! (no email field found)");
    await saveState(ctx);
    await browser.close();
    return;
  }

  // Enter email
  console.log("Filling email...");
  await emailField.click();
  await emailField.fill("wenhelog@gmail.com");
  await page.getByRole("button", { name: "Next" }).click();
  await page.waitForTimeout(5000);
  await snap(page, "after-email");
  console.log("URL after email:", page.url());

  // FIDO is disabled via initScript, so MS should go directly to password page
  console.log("Waiting for password field...");
  await page.waitForSelector('[name="passwd"], input[type="password"]', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await snap(page, "password-page");
  const pwField = page.locator('[name="passwd"], input[type="password"]').first();
  await pwField.click();
  await pwField.fill("Buzhisuoyun4225");
  await pwField.press("Enter");
  await page.waitForTimeout(5000);
  await snap(page, "after-password");
  console.log("URL after password:", page.url());

  // "Stay signed in?" - click Yes
  const primaryButton = page.getByTestId("primaryButton");
  if ((await primaryButton.count()) > 0) {
    console.log("Clicking primary button (stay signed in)...");
    await primaryButton.click();
    await page.waitForTimeout(3000);
  }
  await snap(page, "after-stay-signed-in");

  // May have another consent/account selection screen
  const primaryButton2 = page.getByTestId("primaryButton");
  if ((await primaryButton2.count()) > 0) {
    console.log("Clicking second primary button...");
    await primaryButton2.click();
    await page.waitForTimeout(3000);
  }

  // Account picker? (data-testid="0300" from codegen)
  const accountPicker = page.getByTestId("0300");
  if ((await accountPicker.count()) > 0) {
    console.log("Clicking account picker...");
    await accountPicker.click();
    await page.waitForTimeout(3000);
  }

  await snap(page, "final");
  console.log("Final URL:", page.url());
  console.log("Final title:", await page.title());

  await saveState(ctx);
  await browser.close();
  console.log("Step 1 done.");
}

// Step 2: Open Excel workbook
async function step2() {
  const { browser, ctx } = await launchWithState();
  const page = await ctx.newPage();

  console.log("Navigating to Excel workbook...");
  await page.goto(EXCEL_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

  // Wait for either: Excel loaded, account picker, or email login
  console.log("Waiting for Excel or login page...");
  await page.waitForSelector(
    '[data-testid="0300"], #i0116, [data-unique-id="Ribbon"], iframe[name="WacFrame_Excel_0"]',
    { timeout: 30000 },
  );
  await page.waitForTimeout(1000); // Let the account picker section render fully
  await snap(page, "after-wait");
  console.log("URL:", page.url());

  // Account picker? Click saved account
  // On login.microsoftonline.com the clickable tile is #newSessionLink
  // On login.live.com it may be data-testid="0300"
  const accountLink = page.locator('#newSessionLink, [data-testid="0300"]').first();
  if ((await accountLink.count()) > 0) {
    console.log("Account picker found, clicking saved account...");
    await accountLink.click();
    await page.waitForTimeout(5000);
    await snap(page, "after-account-click");
    console.log("URL after account click:", page.url());

    // This might require password again (session token expired)
    const pwField = page.locator('[name="passwd"], input[type="password"]').first();
    if ((await pwField.count()) > 0) {
      console.log("Password required again...");
      await pwField.fill("Buzhisuoyun4225");
      await pwField.press("Enter");
      await page.waitForTimeout(5000);
      await snap(page, "after-reauth-password");

      // "Stay signed in?" prompt
      const primaryBtn = page.getByTestId("primaryButton");
      if ((await primaryBtn.count()) > 0) {
        await primaryBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // Wait for Excel to load
    console.log("Waiting for Excel to load...");
    try {
      await page.waitForSelector('iframe[name="WacFrame_Excel_0"]', { timeout: 90000 });
    } catch {
      // Frame name might differ - check all frames and page state
      const frames = page.frames();
      console.log("WacFrame_Excel_0 not found after 90s. Frames:", frames.length);
      for (const f of frames) {
        console.log(`  "${f.name()}" -> ${f.url().substring(0, 120)}`);
      }
      // Check for any iframes at all
      const iframes = await page.locator("iframe").all();
      console.log("iframe elements:", iframes.length);
      for (const iframe of iframes) {
        const name = await iframe.getAttribute("name");
        const src = await iframe.getAttribute("src");
        console.log(`  iframe name="${name}" src="${src?.substring(0, 100)}"`);
      }
      // Dump console errors
      const html = await page.content();
      const snippet = html.substring(0, 2000);
      console.log("Page HTML snippet:", snippet);
      await snap(page, "excel-timeout");
    }
    await page.waitForTimeout(5000);
  } else {
    // Full login needed?
    const emailField = page.locator("#i0116");
    if ((await emailField.count()) > 0) {
      console.log("Full login needed (no saved session). Run step 1 first.");
    }
  }

  await snap(page, "excel-loaded");
  console.log("Final URL:", page.url());
  console.log("Title:", await page.title());

  // Check for Excel iframe
  const frames = page.frames();
  console.log("Frames:", frames.length);
  for (const f of frames) {
    console.log(`  "${f.name()}" -> ${f.url().substring(0, 100)}`);
  }

  const wacFrame = page.frame("WacFrame_Excel_0");
  if (wacFrame) {
    console.log("Found WacFrame_Excel_0!");
    const tabs = await wacFrame.locator("[role='tab']").allTextContents();
    console.log("Tabs in Excel:", JSON.stringify(tabs.filter(Boolean)));
    const buttons = await wacFrame.locator("button").allTextContents();
    const btnTexts = buttons
      .filter(Boolean)
      .map((b) => b.trim())
      .filter(Boolean);
    console.log("Buttons (first 40):", JSON.stringify(btnTexts.slice(0, 40)));
  } else {
    console.log("WacFrame_Excel_0 not found.");
  }

  await saveState(ctx);
  await browser.close();
  console.log("Step 2 done.");
}

// Helper: navigate to Excel and ensure we're past login
async function navigateToExcel(page) {
  await page.goto(EXCEL_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

  // Wait for account picker, login, or Excel iframe
  await page
    .waitForSelector(
      '#newSessionLink, [data-testid="0300"], #i0116, iframe[name="WacFrame_Excel_0"]',
      { timeout: 30000 },
    )
    .catch(() => {});
  await page.waitForTimeout(1000);

  // Click saved account if present
  const accountLink = page.locator('#newSessionLink, [data-testid="0300"]').first();
  if ((await accountLink.count()) > 0) {
    console.log("Clicking saved account...");
    await accountLink.click();
  }

  // Wait for the WacFrame iframe
  console.log("Waiting for Excel iframe...");
  await page.waitForSelector('iframe[name="WacFrame_Excel_0"]', { timeout: 90000 });

  // Wait for ribbon to load inside the iframe
  const excelFrame = page.locator('iframe[name="WacFrame_Excel_0"]').contentFrame();
  console.log("Waiting for ribbon...");
  await excelFrame.locator('[role="tab"]').first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(2000); // Let remaining UI settle
  console.log("Excel ready.");
  return excelFrame;
}

// Step 3: Navigate to Home tab and find Add-ins
async function step3() {
  const { browser, ctx } = await launchWithState();
  const page = await ctx.newPage();

  const excelFrame = await navigateToExcel(page);
  await snap(page, "excel-ready");

  // List all tabs
  const allTabs = await excelFrame.locator("[role='tab']").allTextContents();
  console.log("Available tabs:", JSON.stringify(allTabs.filter(Boolean)));

  // Click Add-ins button
  console.log("Looking for Add-ins button...");
  const addinsBtn = excelFrame.getByRole("button", { name: /Add-ins|加载项/ });
  if ((await addinsBtn.count()) > 0) {
    const btnText = await addinsBtn.textContent();
    console.log("Found Add-ins button:", btnText);
    await addinsBtn.click();
    await page.waitForTimeout(2000);
    await snap(page, "addins-menu");

    // Look for "More Add-ins"
    const moreAddins = excelFrame.getByRole("menuitem", { name: /More Add-ins|更多加载项/ });
    if ((await moreAddins.count()) > 0) {
      console.log("Found More Add-ins menuitem");
      await moreAddins.click();
      await page.waitForTimeout(3000);
      await snap(page, "more-addins-dialog");
    }
  } else {
    const allBtns = await excelFrame.locator("button").allTextContents();
    console.log("Available buttons:", JSON.stringify(allBtns.filter(Boolean).slice(0, 50)));
  }

  await saveState(ctx);
  await browser.close();
  console.log("Step 3 done.");
}

// Step 4: Sideload manifest.xml
async function step4() {
  const { browser, ctx } = await launchWithState();
  const page = await ctx.newPage();

  console.log("Opening Excel...");
  await page.goto(EXCEL_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(15000);

  const excelFrame = page.locator('iframe[name="WacFrame_Excel_0"]').contentFrame();

  // Navigate: Home > Add-ins > More Add-ins
  await excelFrame.getByRole("tab", { name: /Home|开始/ }).click();
  await page.waitForTimeout(1000);
  await excelFrame.getByRole("button", { name: /Add-ins|加载项/ }).click();
  await page.waitForTimeout(1000);
  await excelFrame.getByRole("menuitem", { name: /More Add-ins|更多加载项/ }).click();
  await page.waitForTimeout(3000);
  await snap(page, "more-addins-dialog");

  // Find the nested Office Add-ins iframe
  // The iframe name is dynamic, so we find it by partial match
  const nestedIframes = await excelFrame.locator("iframe").all();
  console.log("Nested iframes in Excel frame:", nestedIframes.length);
  for (const iframe of nestedIframes) {
    const name = await iframe.getAttribute("name");
    console.log("  iframe name:", name);
  }

  // Use the first nested iframe that matches the add-ins dialog pattern
  const addinsIframe = excelFrame.locator('iframe[name^="_xdm_"]').first();
  if ((await addinsIframe.count()) > 0) {
    const iframeName = await addinsIframe.getAttribute("name");
    console.log("Found add-ins iframe:", iframeName);

    const addinsFrame = addinsIframe.contentFrame();

    // Click "My Add-ins" tab
    const myAddinsTab = addinsFrame.getByRole("tab", { name: /MY ADD-INS|我的加载项/i });
    if ((await myAddinsTab.count()) > 0) {
      console.log("Found My Add-ins tab");
      await myAddinsTab.click();
      await page.waitForTimeout(2000);
      await snap(page, "my-addins-tab");
    }

    // Click "Manage My Add-ins" / "Upload My Add-in"
    const manageBtn = addinsFrame.getByRole("button", {
      name: /Manage My Add-ins|管理我的加载项/i,
    });
    if ((await manageBtn.count()) > 0) {
      console.log("Found Manage My Add-ins");
      await manageBtn.click();
      await page.waitForTimeout(1000);
    }

    const uploadMenuItem = addinsFrame.getByRole("menuitem", {
      name: /Upload My Add-in|上传我的加载项/i,
    });
    if ((await uploadMenuItem.count()) > 0) {
      console.log("Found Upload My Add-in");
      await uploadMenuItem.click();
      await page.waitForTimeout(2000);
      await snap(page, "upload-dialog");
    }

    // Upload manifest.xml
    // The Browse button is <input type="button">, not <input type="file">.
    // The actual file input is a hidden element. Use setInputFiles on the file input.
    const fileInput = addinsFrame.locator('input[type="file"]');
    if ((await fileInput.count()) > 0) {
      console.log("Found file input, uploading manifest.xml...");
      await fileInput.setInputFiles(path.join(__dirname, "..", "manifest.xml"));
      await page.waitForTimeout(1000);
      await snap(page, "file-selected");

      const uploadBtn = addinsFrame.getByRole("button", { name: /^Upload$|^上传$/i });
      if ((await uploadBtn.count()) > 0) {
        await uploadBtn.click();
        await page.waitForTimeout(3000);
        await snap(page, "uploaded");
        console.log("Manifest uploaded!");
      }
    }
  }

  // Close dialog
  const closeBtn = excelFrame.getByRole("button", { name: /Close|关闭/i });
  if ((await closeBtn.count()) > 0) {
    await closeBtn.click();
    await page.waitForTimeout(1000);
  }

  await snap(page, "after-sideload");
  await saveState(ctx);
  await browser.close();
  console.log("Step 4 done.");
}

// Step 5: Open the sideloaded add-in
async function step5() {
  const { browser, ctx } = await launchWithState();
  const page = await ctx.newPage();

  console.log("Opening Excel...");
  await page.goto(EXCEL_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(15000);

  const excelFrame = page.locator('iframe[name="WacFrame_Excel_0"]').contentFrame();

  // Click overflow "More options" button (the ribbon overflow, not split buttons)
  console.log("Looking for More options...");
  const moreOptions = excelFrame.locator("#RibbonOverflowMenu-overflow");
  if ((await moreOptions.count()) > 0) {
    await moreOptions.click();
    await page.waitForTimeout(2000);
    await snap(page, "more-options-menu");

    // Click "Open Assistant"
    const openRebuild = excelFrame.getByRole("menuitem", { name: "Open Assistant" });
    if ((await openRebuild.count()) > 0) {
      console.log("Found Open Assistant!");
      await openRebuild.click();
      await page.waitForTimeout(5000);
      await snap(page, "addin-opened");
    } else {
      // List available menuitems
      const menuItems = await excelFrame.locator("[role='menuitem']").allTextContents();
      console.log("Menu items:", JSON.stringify(menuItems.filter(Boolean)));
    }
  } else {
    console.log("More options not found. Looking for alternatives...");
    // It might already be in the ribbon as a button
    const openRebuildBtn = excelFrame.getByRole("button", { name: "Open Assistant" });
    if ((await openRebuildBtn.count()) > 0) {
      await openRebuildBtn.click();
      await page.waitForTimeout(5000);
      await snap(page, "addin-opened");
    }
  }

  // Check all frames for the taskpane
  const allFrames = page.frames();
  console.log("All frames after opening add-in:");
  for (const f of allFrames) {
    console.log(`  "${f.name()}" -> ${f.url().substring(0, 120)}`);
  }

  await snap(page, "final");
  await saveState(ctx);
  await browser.close();
  console.log("Step 5 done.");
}

// Step 6: Interact with the add-in taskpane
async function step6() {
  const { browser, ctx } = await launchWithState();
  const page = await ctx.newPage();

  console.log("Opening Excel...");
  await page.goto(EXCEL_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(15000);

  const excelFrame = page.locator('iframe[name="WacFrame_Excel_0"]').contentFrame();

  // Check if taskpane is already open (from previous step 5)
  let taskpaneFrame = null;
  for (const f of page.frames()) {
    if (f.url().includes("localhost:5173")) {
      taskpaneFrame = f;
      break;
    }
  }

  if (!taskpaneFrame) {
    // Open the add-in via ribbon overflow menu
    console.log("Taskpane not open, opening via ribbon overflow...");
    const moreOptions = excelFrame.locator("#RibbonOverflowMenu-overflow");
    if ((await moreOptions.count()) > 0) {
      await moreOptions.click();
      await page.waitForTimeout(1000);
      const openRebuild = excelFrame.getByRole("menuitem", { name: "Open Assistant" });
      if ((await openRebuild.count()) > 0) {
        await openRebuild.click();
        await page.waitForTimeout(5000);
      }
    }

    // Re-check for taskpane frame
    for (const f of page.frames()) {
      if (f.url().includes("localhost:5173")) {
        taskpaneFrame = f;
        break;
      }
    }
  }

  await snap(page, "taskpane-area");

  if (!taskpaneFrame) {
    console.log("Taskpane frame not found. All frames:");
    for (const f of page.frames()) {
      console.log(`  "${f.name()}" -> ${f.url().substring(0, 120)}`);
    }
    await browser.close();
    return;
  }

  console.log("Found taskpane frame:", taskpaneFrame.url().substring(0, 80));

  // Dump the current page state
  const pageContent = await taskpaneFrame.content();
  console.log("Taskpane HTML length:", pageContent.length);
  console.log("Contains 'aui-composer':", pageContent.includes("aui-composer"));
  console.log("Contains 'app-title':", pageContent.includes("app-title"));

  // List all visible buttons
  const allButtons = await taskpaneFrame.locator("button").allTextContents();
  console.log("Taskpane buttons:", JSON.stringify(allButtons.filter(Boolean)));

  // List all visible inputs
  const allInputs = await taskpaneFrame.locator("input, textarea").count();
  console.log("Taskpane inputs/textareas:", allInputs);

  await snap(page, "taskpane-initial");

  // The app now loads directly to the chat interface (no boot flow).
  // Check for the composer input
  const composerInput = taskpaneFrame.locator(".aui-composer-input");
  if ((await composerInput.count()) > 0) {
    console.log("Found composer input! Chat UI is ready.");
  } else {
    console.log("Composer input not found. Current buttons:");
    const btns = await taskpaneFrame.locator("button").allTextContents();
    console.log(JSON.stringify(btns.filter(Boolean)));
    const url = taskpaneFrame.url();
    console.log("Taskpane URL:", url);
  }

  await snap(page, "final");
  await saveState(ctx);
  await browser.close();
  console.log("Step 6 done.");
}

// Step 7: Enter a query in the workbench, submit, and verify response
async function step7() {
  const { browser, ctx } = await launchWithState();
  const page = await ctx.newPage();

  console.log("Opening Excel...");
  await page.goto(EXCEL_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(15000);

  const excelFrame = page.locator('iframe[name="WacFrame_Excel_0"]').contentFrame();

  // Check if taskpane is already open
  let taskpaneFrame = null;
  for (const f of page.frames()) {
    if (f.url().includes("localhost:5173")) {
      taskpaneFrame = f;
      break;
    }
  }

  if (!taskpaneFrame) {
    console.log("Taskpane not open, opening via ribbon overflow...");
    const moreOptions = excelFrame.locator("#RibbonOverflowMenu-overflow");
    if ((await moreOptions.count()) > 0) {
      await moreOptions.click();
      await page.waitForTimeout(1000);
      const openRebuild = excelFrame.getByRole("menuitem", { name: "Open Assistant" });
      if ((await openRebuild.count()) > 0) {
        await openRebuild.click();
        await page.waitForTimeout(5000);
      }
    }
    for (const f of page.frames()) {
      if (f.url().includes("localhost:5173")) {
        taskpaneFrame = f;
        break;
      }
    }
  }

  if (!taskpaneFrame) {
    console.log("ERROR: Taskpane frame not found.");
    await browser.close();
    return;
  }

  console.log("Taskpane found:", taskpaneFrame.url().substring(0, 80));

  // Ensure we're on the chat page (no boot flow needed)
  // Check for the composer input
  const composerInput = taskpaneFrame.locator('.aui-composer-input');
  const composerCount = await composerInput.count();
  console.log("Composer input count:", composerCount);

  if (composerCount === 0) {
    console.log("Composer not found. Current content:");
    const btns = await taskpaneFrame.locator("button").allTextContents();
    console.log(JSON.stringify(btns.filter(Boolean)));
  }

  await snap(page, "workbench-ready");

  // Type a query into the composer
  console.log("Typing query into composer...");
  await composerInput.waitFor({ timeout: 10000 });
  await composerInput.fill("Write hello world in cell A1");
  await page.waitForTimeout(500);

  await snap(page, "query-typed");

  // Check if the value was set
  const inputValue = await composerInput.inputValue();
  console.log("Input value after typing:", JSON.stringify(inputValue));

  // Click the send button
  const sendBtn = taskpaneFrame.locator('.aui-composer-send');
  const sendBtnCount = await sendBtn.count();
  console.log("Send button count:", sendBtnCount);

  if (sendBtnCount > 0) {
    console.log("Clicking send...");
    await sendBtn.click();
    await page.waitForTimeout(10000); // Wait for agent to process
    await snap(page, "after-send");

    // Check for assistant messages
    const assistantMessages = taskpaneFrame.locator('.aui-message-assistant');
    const msgCount = await assistantMessages.count();
    console.log("Assistant messages:", msgCount);
    if (msgCount > 0) {
      const content = await assistantMessages.first().textContent();
      console.log("First assistant message (first 500 chars):", content.substring(0, 500));
    }
  } else {
    console.log("Send button not found. All buttons:");
    const btns = await taskpaneFrame.locator("button").allTextContents();
    console.log(JSON.stringify(btns.filter(Boolean)));
  }

  await snap(page, "final");
  await saveState(ctx);
  await browser.close();
  console.log("Step 7 done.");
}

// Step 8: Run a complex query and read the results
async function step8() {
  const { browser, ctx } = await launchWithState();
  const page = await ctx.newPage();

  console.log("Opening Excel...");
  await page.goto(EXCEL_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(15000);

  const excelFrame = page.locator('iframe[name="WacFrame_Excel_0"]').contentFrame();

  // Find or open taskpane
  let taskpaneFrame = null;
  for (const f of page.frames()) {
    if (f.url().includes("localhost:5173")) {
      taskpaneFrame = f;
      break;
    }
  }
  if (!taskpaneFrame) {
    console.log("Opening add-in...");
    const overflow = excelFrame.locator("#RibbonOverflowMenu-overflow");
    await overflow.click();
    await page.waitForTimeout(1000);
    await excelFrame.getByRole("menuitem", { name: "Open Assistant" }).click();
    await page.waitForTimeout(5000);
    for (const f of page.frames()) {
      if (f.url().includes("localhost:5173")) {
        taskpaneFrame = f;
        break;
      }
    }
  }
  if (!taskpaneFrame) {
    console.log("ERROR: no taskpane");
    await browser.close();
    return;
  }

  // The app loads directly to the chat interface (no boot flow)
  // Reset conversation first
  const newChatBtn = taskpaneFrame.getByRole("button", { name: /New Chat/i });
  if ((await newChatBtn.count()) > 0) {
    await newChatBtn.click();
    await page.waitForTimeout(1000);
  }

  const QUERY =
    "Create a table: A1=Name, B1=Score, C1=Grade. Then fill rows 2-5 with sample student data (4 students). In C2:C5, use a formula: if Score>=90 then A, if >=80 then B, if >=70 then C, else D. Finally put the average score in B6 with a label Average in A6.";

  console.log("Setting query...");
  const composerInput = taskpaneFrame.locator('.aui-composer-input');
  await composerInput.waitFor({ timeout: 10000 });
  await composerInput.fill(QUERY);
  await page.waitForTimeout(500);

  console.log("Clicking send...");
  const sendBtn = taskpaneFrame.locator('.aui-composer-send');
  await sendBtn.click();

  // Wait for agent to finish -- poll for assistant messages
  console.log("Waiting for agent to finish...");
  let elapsed = 0;
  while (elapsed < 120000) {
    const assistantMsgs = taskpaneFrame.locator('.aui-message-assistant');
    const count = await assistantMsgs.count();
    // Check if the composer input is editable (agent done)
    const isEditable = await composerInput.isEditable().catch(() => false);
    if (count > 0 && isEditable) break;
    await page.waitForTimeout(2000);
    elapsed += 2000;
    if (elapsed % 10000 === 0) console.log(`  still running... (${elapsed / 1000}s)`);
  }
  console.log(`Agent finished in ~${elapsed / 1000}s`);

  await snap(page, "complex-result");

  // Read assistant messages
  const assistantMessages = taskpaneFrame.locator('.aui-message-assistant');
  const allMessages = await assistantMessages.all();
  console.log(`\n=== ${allMessages.length} assistant messages ===`);
  for (let i = 0; i < allMessages.length; i++) {
    const content = await allMessages[i].textContent().catch(() => "");
    console.log(`\n[${i}]:`);
    console.log(content.substring(0, 600));
  }

  await snap(page, "final");
  await saveState(ctx);
  await browser.close();
  console.log("\nStep 8 done.");
}

const steps = { 1: step1, 2: step2, 3: step3, 4: step4, 5: step5, 6: step6, 7: step7, 8: step8 };
const fn = steps[step];
if (!fn) {
  console.error("Unknown step:", step);
  process.exit(1);
}
fn().catch((e) => {
  console.error(e);
  process.exit(1);
});
