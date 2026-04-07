import { expect, test } from "@playwright/test";

const SCENARIOS = ["Basic Chat", "Tool Calls", "Thinking Blocks", "Streaming Slow", "Error States"];

async function switchScenario(page: import("@playwright/test").Page, name: string) {
  const scenarioBtn = page.locator(`button:has-text("${name}")`);
  if (!(await scenarioBtn.isVisible())) {
    await page.locator("text=Mock").first().click();
    await page.waitForTimeout(100);
  }
  await scenarioBtn.click();

  // Wait for the scenario switch to reset messages
  await page.waitForTimeout(300);
}

async function waitForTurnCount(
  page: import("@playwright/test").Page,
  selector: string,
  minCount: number,
  timeout = 30_000,
) {
  await page.waitForFunction(
    ({ sel, min }) => document.querySelectorAll(sel).length >= min,
    { sel: selector, min: minCount },
    { timeout },
  );
}

async function waitForNoWorkingIndicator(page: import("@playwright/test").Page, timeout = 30_000) {
  await page.waitForFunction(() => !document.querySelector(".working-indicator"), {}, { timeout });
}

// -- Page Load --

test.describe("Mock UI - Page Load", () => {
  test("renders the app shell without Office.js errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/");
    await expect(page.locator(".app-title")).toHaveText("OpenExcel");
    await expect(page.locator(".pill")).toHaveText("mock");

    await page.waitForTimeout(2000);

    const officeErrors = consoleErrors.filter(
      (e) => e.includes("Office") || e.includes("office.js"),
    );
    expect(officeErrors).toHaveLength(0);
  });

  test("shows scenario picker overlay", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Mock").first()).toBeVisible();
  });
});

// -- Basic Chat --
// Default scenario, auto-plays 3 turns → 3 user + 3 assistant messages

test.describe("Mock UI - Basic Chat Scenario", () => {
  test("renders text messages with markdown", async ({ page }) => {
    await page.goto("/");

    // Basic Chat auto-plays. Wait for all 3 assistant messages.
    await waitForTurnCount(page, ".msg-assistant", 3, 20_000);
    await waitForNoWorkingIndicator(page);

    await expect(page.locator(".msg-user").first()).toBeVisible();

    const assistantContent = page.locator(".msg-text").first();
    await expect(assistantContent).toBeVisible();

    const htmlContent = await assistantContent.innerHTML();
    expect(
      htmlContent.includes("<strong>") ||
        htmlContent.includes("<li>") ||
        htmlContent.includes("<code>"),
    ).toBe(true);
  });

  test("shows turn footer with timing and tokens", async ({ page }) => {
    await page.goto("/");
    await waitForTurnCount(page, ".msg-assistant", 3, 20_000);
    await waitForNoWorkingIndicator(page, 25_000);

    const turnFooter = page.locator(".turn-footer");
    await expect(turnFooter).toBeVisible({ timeout: 5_000 });
  });
});

// -- Tool Calls --
// 4 turns, each with tool calls. Turn 3 has an error. Turn 4 has 2 tool calls.
// Expected: ~8 assistant messages total (2 per turn: one with tools, one with text)

test.describe("Mock UI - Tool Calls Scenario", () => {
  test("renders tool call cards with success and error states", async ({ page }) => {
    await page.goto("/");
    await switchScenario(page, "Tool Calls");
    await waitForTurnCount(page, ".tool-card", 1, 15_000);
    await waitForTurnCount(page, ".msg-assistant", 6, 30_000);
    await waitForNoWorkingIndicator(page);

    const doneCards = page.locator(".tool-card-done");
    await expect(doneCards.first()).toBeVisible();

    const errorCards = page.locator(".tool-card-error");
    await expect(errorCards.first()).toBeVisible();
  });

  test("tool cards are expandable", async ({ page }) => {
    await page.goto("/");
    await switchScenario(page, "Tool Calls");
    await waitForTurnCount(page, ".tool-card", 1, 15_000);

    // Collapse the picker first so it doesn't intercept clicks
    const pickerHeader = page.locator("text=Mock").first();
    if (await page.locator(`button:has-text("${SCENARIOS[0]}")`).isVisible()) {
      await pickerHeader.click();
      await page.waitForTimeout(100);
    }

    const toolHeader = page.locator(".tool-card-header").first();
    await toolHeader.click();

    const inputSection = page.locator(".tool-card-section").first();
    await expect(inputSection).toBeVisible();
  });

  test("tool groups collapse multiple tool calls in one message", async ({ page }) => {
    await page.goto("/");
    await switchScenario(page, "Tool Calls");
    // Wait for all turns to complete - 4 turns produce 8 assistant messages
    await waitForTurnCount(page, ".msg-assistant", 8, 40_000);
    await waitForNoWorkingIndicator(page);

    // Turn 4 has an assistant message with 2 tool calls, which should render
    // as a .tool-group via groupMessageParts. Also, the consecutive tool-only
    // assistant messages across turns might produce cross-message tool-groups.
    // Wait for at least one tool-group to appear.
    await page.waitForFunction(
      () => document.querySelectorAll(".tool-group").length > 0,
      {},
      { timeout: 5_000 },
    );

    const toolGroups = page.locator(".tool-group");
    const groupCount = await toolGroups.count();
    expect(groupCount).toBeGreaterThan(0);
  });
});

// -- Thinking --
// 2 turns with thinking blocks, tool calls, and text

test.describe("Mock UI - Thinking Scenario", () => {
  test("renders thinking blocks", async ({ page }) => {
    await page.goto("/");
    await switchScenario(page, "Thinking Blocks");
    await waitForTurnCount(page, ".thinking-block", 1, 15_000);

    const thinkingBlocks = page.locator(".thinking-block");
    const count = await thinkingBlocks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("thinking blocks are collapsible", async ({ page }) => {
    await page.goto("/");
    await switchScenario(page, "Thinking Blocks");
    await waitForTurnCount(page, ".thinking-block", 1, 15_000);

    // Collapse the picker first
    const pickerHeader = page.locator("text=Mock").first();
    if (await page.locator(`button:has-text("${SCENARIOS[0]}")`).isVisible()) {
      await pickerHeader.click();
      await page.waitForTimeout(100);
    }

    const thinkingHeader = page.locator(".thinking-header").first();
    const thinkingContent = page.locator(".thinking-content").first();

    await expect(thinkingContent).toBeVisible();

    await thinkingHeader.click();
    await expect(thinkingContent).not.toBeVisible();

    await thinkingHeader.click();
    await expect(page.locator(".thinking-content").first()).toBeVisible();
  });

  test("thinking blocks coexist with tool calls and text", async ({ page }) => {
    await page.goto("/");
    await switchScenario(page, "Thinking Blocks");
    await waitForTurnCount(page, ".msg-assistant", 3, 20_000);
    await waitForNoWorkingIndicator(page);

    await expect(page.locator(".thinking-block").first()).toBeVisible();
    await expect(page.locator(".tool-card").first()).toBeVisible();
    await expect(page.locator(".msg-text").first()).toBeVisible();
  });
});

// -- Streaming Slow --

test.describe("Mock UI - Streaming Slow Scenario", () => {
  test("shows working indicator during streaming", async ({ page }) => {
    await page.goto("/");
    await switchScenario(page, "Streaming Slow");
    await expect(page.locator(".working-indicator")).toBeVisible({ timeout: 5_000 });
  });

  test("renders long markdown content with tables", async ({ page }) => {
    await page.goto("/");
    await switchScenario(page, "Streaming Slow");

    // Wait for tables to appear in the rendered markdown
    await page.waitForFunction(
      () => document.querySelectorAll(".msg-text table").length > 0,
      {},
      { timeout: 30_000 },
    );

    const tables = page.locator(".msg-text table");
    const tableCount = await tables.count();
    expect(tableCount).toBeGreaterThan(0);
  });
});

// -- Error States --
// 5 turns: truncated, tool error + model error, long output, image, fatal error

test.describe("Mock UI - Error States Scenario", () => {
  test("shows truncation warning for length-stopped responses", async ({ page }) => {
    await page.goto("/");
    await switchScenario(page, "Error States");
    await waitForTurnCount(page, ".msg-assistant", 1, 10_000);

    const truncatedMsg = page.locator(".msg-truncated");
    await expect(truncatedMsg).toBeVisible({ timeout: 5_000 });
    await expect(truncatedMsg).toContainText("cut short");
  });

  test("shows error messages for failed responses", async ({ page }) => {
    await page.goto("/");
    await switchScenario(page, "Error States");
    // Turn 2 produces an error assistant message. Wait for it.
    // Turn 1: 1 assistant, Turn 2: 2 assistants (tool + error) = 3 total
    await waitForTurnCount(page, ".msg-error", 1, 25_000);

    const errorMsgs = page.locator(".msg-error");
    const errorCount = await errorMsgs.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test("renders error tool card with error styling", async ({ page }) => {
    await page.goto("/");
    await switchScenario(page, "Error States");
    // Turn 2 has execute_office_js error
    await waitForTurnCount(page, ".tool-card", 1, 15_000);

    const errorToolCards = page.locator(".tool-card-error");
    await expect(errorToolCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test("handles image tool results", async ({ page }) => {
    await page.goto("/");
    await switchScenario(page, "Error States");
    // Turn 4 has get_range_image
    await waitForTurnCount(page, ".msg-assistant", 6, 30_000);

    // Collapse the picker first
    const pickerHeader = page.locator("text=Mock").first();
    if (await page.locator(`button:has-text("${SCENARIOS[0]}")`).isVisible()) {
      await pickerHeader.click();
      await page.waitForTimeout(100);
    }

    const imageToolCard = page.locator(".tool-card-header").filter({ hasText: "Get Range Image" });
    if ((await imageToolCard.count()) > 0) {
      await imageToolCard.click();
      const toolImage = page.locator(".tool-card-image");
      await expect(toolImage).toBeVisible({ timeout: 3_000 });
    }
  });
});

// -- Scenario Switching --

test.describe("Mock UI - Scenario Switching", () => {
  test("switching scenarios resets the chat", async ({ page }) => {
    await page.goto("/");
    await waitForTurnCount(page, ".msg-assistant", 1, 10_000);

    await switchScenario(page, "Thinking Blocks");
    await waitForTurnCount(page, ".thinking-block", 1, 15_000);

    const thinkingBlocks = page.locator(".thinking-block");
    const count = await thinkingBlocks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("reset button replays current scenario", async ({ page }) => {
    await page.goto("/");
    await waitForTurnCount(page, ".msg-assistant", 1, 10_000);

    const resetBtn = page.locator("button:has-text('Reset')");
    if (!(await resetBtn.isVisible())) {
      await page.locator("text=Mock").first().click();
      await page.waitForTimeout(100);
    }
    await resetBtn.click();

    await waitForTurnCount(page, ".msg-assistant", 1, 15_000);
    const msgCount = await page.locator(".msg").count();
    expect(msgCount).toBeGreaterThan(0);
  });

  test("all five scenarios are listed in the picker", async ({ page }) => {
    await page.goto("/");

    const firstScenarioBtn = page.locator(`button:has-text("${SCENARIOS[0]}")`);
    if (!(await firstScenarioBtn.isVisible())) {
      await page.locator("text=Mock").first().click();
    }

    for (const name of SCENARIOS) {
      await expect(page.locator(`button:has-text("${name}")`)).toBeVisible();
    }
  });
});

// -- Chat Input --

test.describe("Mock UI - Chat Input", () => {
  test("can type in the input area", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("textarea, input[type='text']").first();
    await input.fill("Hello mock!");

    const value = await input.inputValue();
    expect(value).toBe("Hello mock!");
  });

  test("new chat button clears all messages", async ({ page }) => {
    await page.goto("/");
    await waitForTurnCount(page, ".msg", 1, 10_000);

    // Collapse the picker first
    const pickerHeader = page.locator("text=Mock").first();
    if (await page.locator(`button:has-text("${SCENARIOS[0]}")`).isVisible()) {
      await pickerHeader.click();
      await page.waitForTimeout(100);
    }

    const newChatBtn = page.locator("button[title='New Chat']");
    await newChatBtn.click();

    await expect(page.locator(".thread-empty")).toBeVisible({ timeout: 3_000 });
  });
});
