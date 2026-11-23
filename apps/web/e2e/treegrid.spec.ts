import { expect, test } from "@playwright/test";

/**
 * The browser suite for the treegrid keyboard model and the selection.
 *
 * The brief grades the keyboard model, the hierarchy reaching assistive
 * technology and the selection that remaps the chart. Those belong in a
 * browser, where the focus ring and the accessibility tree are real.
 *
 * The base URL is http://localhost:5173 and is set in playwright.config.ts, so
 * page.goto("/dashboard/2024") is enough. The config starts the API and the
 * dev server, so the spec starts neither.
 *
 * The table is <table role="treegrid" aria-label="Monthly figures by branch,
 * adviser and acquisition channel">. Its rows carry role="row", aria-level
 * from 1 to 4, aria-posinset and aria-setsize, aria-expanded on the rows that
 * have children and aria-selected on every row. Exactly one row has
 * tabindex="0" at a time.
 *
 * The rows are addressed by their text: the company row reads "Company", the
 * branch rows read "Branch 1", "Branch 2" and "Branch 3", the adviser rows
 * read the adviser names, and a channel row reads the channel name.
 *
 * The chevron is a button named "Expand {name}" or "Collapse {name}". It is
 * not a focus target, so the specs click it by name and never tab to it.
 *
 * The rows are reached with the keyboard, so focus the grid first:
 * await page.getByRole("row", { name: "Company" }).focus()
 *
 * The chart is the figure above the table. Its accessible name is the scope
 * title, "Company, by branch", "Branch 1, by adviser" or
 * "Anna Blackwood, by channel".
 */

const CHANNEL_ID = "716e7c30-b7c3-45c5-aa64-cbcf483917e0";

test("the dashboard route resolves", async ({ page }) => {
  await page.goto("/dashboard/2024");
  await expect(page).toHaveURL(/\/dashboard\/2024$/);
});

test("the treegrid renders the tree", async ({ page }) => {
  await page.goto("/dashboard/2024");

  const company = page.getByRole("row", { name: "Company" });
  await expect(company).toBeVisible();
  await expect(company).toHaveAttribute("aria-level", "1");
  await expect(company).toHaveAttribute("aria-expanded", "true");
  await expect(company).toHaveAttribute("aria-selected", "true");

  const branches = [
    { name: "Branch 1", posinset: "1" },
    { name: "Branch 2", posinset: "2" },
    { name: "Branch 3", posinset: "3" },
  ];

  for (const branch of branches) {
    const row = page.getByRole("row", { name: branch.name });
    await expect(row).toBeVisible();
    await expect(row).toHaveAttribute("aria-level", "2");
    await expect(row).toHaveAttribute("aria-posinset", branch.posinset);
    await expect(row).toHaveAttribute("aria-setsize", "3");
  }

  // The branches without employees are leaves, so they carry no aria-expanded.
  await expect(page.getByRole("row", { name: "Branch 2" })).not.toHaveAttribute("aria-expanded");

  await expect(page.locator("tbody [role='row']")).toHaveCount(4);
  await expect(page.locator("[role='row'][aria-selected='true']")).toHaveCount(1);
  await expect(page.locator("[role='row'][tabindex='0']")).toHaveCount(1);
});

test("the keyboard model", async ({ page }) => {
  await page.goto("/dashboard/2024");

  const company = page.getByRole("row", { name: "Company" });
  const branch1 = page.getByRole("row", { name: "Branch 1" });
  const anna = page.getByRole("row", { name: "Anna Blackwood" });

  await company.focus();

  // ArrowDown reaches the next visible row.
  await page.keyboard.press("ArrowDown");
  await expect(branch1).toBeFocused();

  // ArrowRight on a collapsed parent expands it and keeps the focus there.
  await expect(branch1).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("ArrowRight");
  await expect(branch1).toHaveAttribute("aria-expanded", "true");
  await expect(branch1).toBeFocused();

  // ArrowRight on an expanded parent moves to its first child.
  await page.keyboard.press("ArrowRight");
  await expect(anna).toBeFocused();

  // ArrowLeft on a leaf moves to the parent row.
  await page.keyboard.press("ArrowLeft");
  await expect(branch1).toBeFocused();

  // ArrowLeft on an expanded parent collapses it and keeps the focus there.
  await page.keyboard.press("ArrowLeft");
  await expect(branch1).toHaveAttribute("aria-expanded", "false");
  await expect(branch1).toBeFocused();

  // Enter selects and leaves the expansion alone.
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\?node=[0-9a-f-]{36}$/);
  await expect(branch1).toHaveAttribute("aria-selected", "true");
  await expect(branch1).toHaveAttribute("aria-expanded", "false");

  // Home and End reach the ends of the visible rows.
  await page.keyboard.press("End");
  await expect(page.getByRole("row", { name: "Branch 3" })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(company).toBeFocused();

  await expect(page.locator("[role='row'][aria-selected='true']")).toHaveCount(1);
  await expect(page.locator("[role='row'][tabindex='0']")).toHaveCount(1);
});

test("the chevron expands without selecting", async ({ page }) => {
  await page.goto("/dashboard/2024");

  const branch1 = page.getByRole("row", { name: "Branch 1" });

  // The focus starts on the chart, outside the grid.
  await page.getByRole("application").focus();

  await page.getByRole("button", { name: "Expand Branch 1" }).click();

  await expect(branch1).toHaveAttribute("aria-expanded", "true");
  await expect(branch1).toHaveAttribute("aria-selected", "false");
  await expect(page).not.toHaveURL(/\?node=/);

  // The chevron is pointer only, so the focus lands on the row and Enter
  // selects the row rather than toggling the expansion.
  await expect(branch1).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(branch1).toHaveAttribute("aria-selected", "true");
  await expect(branch1).toHaveAttribute("aria-expanded", "true");
});

test("the selection remaps the chart", async ({ page }) => {
  await page.goto("/dashboard/2024");

  const figure = page.getByRole("figure");
  await expect(figure).toHaveAccessibleName("Company, by branch");

  await page.getByRole("row", { name: "Branch 1" }).click();

  await expect(page).toHaveURL(/\?node=[0-9a-f-]{36}$/);
  await expect(figure).toHaveAccessibleName("Branch 1, by adviser");

  // The legend names the advisers of the scope, not the branches.
  await expect(page.locator(".recharts-surface desc")).toContainText("Anna Blackwood");
  await expect(page.locator(".recharts-surface desc")).toContainText("Sarah Smith");

  // Clicking the company row clears the parameter.
  await page.getByRole("row", { name: "Company" }).click();
  await expect(page).not.toHaveURL(/\?node=/);
  await expect(figure).toHaveAccessibleName("Company, by branch");
});

test("the deep link opens the path", async ({ page }) => {
  await page.goto(`/dashboard/2024?node=${CHANNEL_ID}`);

  const channel = page.getByRole("row", { name: "Existing clients" });
  await expect(channel).toBeVisible();
  await expect(channel).toHaveAttribute("aria-selected", "true");
  await expect(channel).toHaveAttribute("aria-level", "4");

  // The path to the selected node opens, and the selected node itself does
  // not expand.
  await expect(page.getByRole("row", { name: "Company" })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("row", { name: "Branch 1" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.getByRole("row", { name: "Anna Blackwood" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(channel).not.toHaveAttribute("aria-expanded");

  await expect(page.getByRole("figure")).toHaveAccessibleName("Existing clients");
});

test("an unknown node falls back to the company", async ({ page }) => {
  await page.goto("/dashboard/2024?node=nope");

  await expect(page.getByRole("row", { name: "Company" })).toBeVisible();
  await expect(page.getByRole("figure")).toHaveAccessibleName("Company, by branch");
  await expect(page.locator("[role='row'][aria-selected='true']")).toHaveCount(1);
});

test("the chart announces the active month", async ({ page }) => {
  await page.goto("/dashboard/2024");
  await page.getByRole("application").focus();

  const reader = page.locator('figure [aria-live="polite"]');
  await expect(reader).toContainText("Feb 2024");

  await page.keyboard.press("ArrowRight");
  await expect(reader).toContainText("Mar 2024");
  await expect(reader).toContainText("Branch 1 157");
});

test("the chart resets its active month on blur", async ({ page }) => {
  await page.goto("/dashboard/2024");

  const chart = page.getByRole("application");
  const reader = page.locator('figure [aria-live="polite"]');
  const tooltip = page.locator(".recharts-tooltip-wrapper");
  const cursor = page.locator("figure .recharts-tooltip-cursor");

  await expect(chart).toBeVisible();

  // Tab into the chart (the chart is the first tab stop on the page).
  await page.keyboard.press("Tab");
  await expect(chart).toBeFocused();
  await expect(reader).toContainText("Feb 2024");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("Feb 2024");
  await expect(cursor).toBeVisible();

  // ArrowRight shows Mar 2024.
  await page.keyboard.press("ArrowRight");
  await expect(reader).toContainText("Mar 2024");
  await expect(tooltip).toContainText("Mar 2024");
  await expect(cursor).toBeVisible();

  // Tab away hides the tooltip and cursor.
  await page.keyboard.press("Tab");
  await expect(chart).not.toBeFocused();
  await expect(tooltip).toBeHidden();
  await expect(cursor).toBeHidden();

  // Shift+Tab back re-focuses the chart and the tooltip and the live region show Feb 2024 again.
  await page.keyboard.press("Shift+Tab");
  await expect(chart).toBeFocused();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("Feb 2024");
  await expect(reader).toContainText("Feb 2024");
  await expect(cursor).toBeVisible();
});

test("nothing overflows at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/dashboard/2024");
  await expect(page.getByRole("row", { name: "Company" })).toBeVisible();

  // The page does not scroll sideways.
  const pageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(pageOverflow).toBe(0);

  // The table does, inside its own container.
  const tableScrolls = await page.evaluate(() => {
    const container = document.querySelector("table")?.parentElement;
    return container ? container.scrollWidth > container.clientWidth : false;
  });
  expect(tableScrolls).toBe(true);
});

test("collapsing with the chevron lifts the selection", async ({ page }) => {
  await page.goto("/dashboard/2024");

  await page.getByRole("button", { name: "Expand Branch 1" }).click();
  await page.getByRole("button", { name: "Expand Anna Blackwood" }).click();
  await page.getByRole("row", { name: "New paid" }).click();

  await page.getByRole("button", { name: "Collapse Anna Blackwood" }).click();

  await expect(page.getByRole("row", { name: "New paid" })).toBeHidden();
  const anna = page.getByRole("row", { name: "Anna Blackwood" });
  await expect(anna).toHaveAttribute("aria-selected", "true");
  await expect(anna).toHaveAttribute("aria-expanded", "false");
  await expect(page).toHaveURL(/\?node=e3c4637b-2f21-4b7e-883e-b13ae1a6df6a$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Anna Blackwood");
  await expect(page.getByRole("figure")).toHaveAccessibleName("Anna Blackwood, by channel");
  await expect(page.locator("[role='row'][aria-selected='true']")).toHaveCount(1);
  await expect(page.locator("[role='row'][tabindex='0']")).toHaveCount(1);
  await expect(page.getByRole("row", { name: "Branch 1" })).toBeVisible();
  await expect(page.getByRole("row", { name: "Branch 1" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});

test("collapsing with ArrowLeft lifts the selection the same way", async ({ page }) => {
  await page.goto("/dashboard/2024");

  await page.getByRole("button", { name: "Expand Branch 1" }).click();
  await page.getByRole("button", { name: "Expand Anna Blackwood" }).click();
  const newPaid = page.getByRole("row", { name: "New paid" });
  await newPaid.click();
  await expect(newPaid).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("ArrowLeft");
  const anna = page.getByRole("row", { name: "Anna Blackwood" });
  await expect(anna).toBeFocused();

  await page.keyboard.press("ArrowLeft");

  await expect(page.getByRole("row", { name: "New paid" })).toBeHidden();
  await expect(anna).toBeFocused();
  await expect(anna).toHaveAttribute("aria-selected", "true");
  await expect(anna).toHaveAttribute("aria-expanded", "false");
  await expect(page).toHaveURL(/\?node=e3c4637b-2f21-4b7e-883e-b13ae1a6df6a$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Anna Blackwood");
  await expect(page.getByRole("figure")).toHaveAccessibleName("Anna Blackwood, by channel");
  await expect(page.locator("[role='row'][aria-selected='true']")).toHaveCount(1);
  await expect(page.locator("[role='row'][tabindex='0']")).toHaveCount(1);
});

test("collapsing the company row lifts the selection to the company and clears the parameter", async ({
  page,
}) => {
  await page.goto("/dashboard/2024");

  const branch1 = page.getByRole("row", { name: "Branch 1" });
  await branch1.click();
  await expect(branch1).toHaveAttribute("aria-selected", "true");

  await page.getByRole("button", { name: "Collapse Company" }).click();

  await expect(page).not.toHaveURL(/\?node=/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Book of business");
  await expect(page.getByRole("figure")).toHaveAccessibleName("Company, by branch");
  const company = page.getByRole("row", { name: "Company" });
  await expect(company).toHaveAttribute("aria-selected", "true");
  await expect(company).toHaveAttribute("aria-expanded", "false");
  await expect(branch1).toBeHidden();
});
