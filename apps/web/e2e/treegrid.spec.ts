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
 * The chart is the figure above the table. Its accessible name is the current
 * crumb name, "Company", "Branch 1" or "Anna Blackwood".
 */

const CHANNEL_ID = "716e7c30-b7c3-45c5-aa64-cbcf483917e0";
const ANNA_ID = "e3c4637b-2f21-4b7e-883e-b13ae1a6df6a";

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
  await expect(figure).toHaveAccessibleName("Company");

  await page.getByRole("row", { name: "Branch 1" }).click();

  await expect(page).toHaveURL(/\?node=[0-9a-f-]{36}$/);
  await expect(figure).toHaveAccessibleName("Branch 1");

  // The legend names the advisers of the scope, not the branches.
  await expect(page.locator(".recharts-surface desc")).toContainText("Anna Blackwood");
  await expect(page.locator(".recharts-surface desc")).toContainText("Sarah Smith");

  // Clicking the company row clears the parameter.
  await page.getByRole("row", { name: "Company" }).click();
  await expect(page).not.toHaveURL(/\?node=/);
  await expect(figure).toHaveAccessibleName("Company");
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
  await expect(page.getByRole("figure")).toHaveAccessibleName("Company");
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
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Clients");
  await expect(page.getByRole("figure")).toHaveAccessibleName("Anna Blackwood");
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
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Clients");
  await expect(page.getByRole("figure")).toHaveAccessibleName("Anna Blackwood");
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
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Clients");
  await expect(page.getByRole("figure")).toHaveAccessibleName("Company");
  const company = page.getByRole("row", { name: "Company" });
  await expect(company).toHaveAttribute("aria-selected", "true");
  await expect(company).toHaveAttribute("aria-expanded", "false");
  await expect(branch1).toBeHidden();
});

test("the scope trail renders at the root", async ({ page }) => {
  await page.goto("/dashboard/2024");
  const nav = page.getByRole("navigation", { name: "Chart scope" });
  await expect(nav).toBeVisible();
  await expect(nav).toHaveText("Company");
  const current = nav.locator('[aria-current="location"]');
  await expect(current).toHaveText("Company");
});

test("the scope trail updates when a row is selected", async ({ page }) => {
  await page.goto("/dashboard/2024");
  const nav = page.getByRole("navigation", { name: "Chart scope" });

  await page.getByRole("row", { name: "Branch 1" }).click();
  await expect(nav).toHaveText("Company / Branch 1");

  await page.getByRole("button", { name: "Expand Branch 1" }).click();
  await page.getByRole("row", { name: "Anna Blackwood" }).click();
  await expect(nav).toHaveText("Company / Branch 1 / Anna Blackwood");

  await page.getByRole("button", { name: "Expand Anna Blackwood" }).click();
  await page.getByRole("row", { name: "Existing clients" }).click();
  await expect(nav).toHaveText("Company / Branch 1 / Anna Blackwood / Existing clients");
});

test("clicking an ancestor in the trail selects that node and clears the parameter at the company", async ({
  page,
}) => {
  await page.goto("/dashboard/2024");

  await page.getByRole("row", { name: "Branch 1" }).click();
  await expect(page).toHaveURL(/\?node=[0-9a-f-]{36}$/);

  const nav = page.getByRole("navigation", { name: "Chart scope" });
  await expect(nav).toHaveText("Company / Branch 1");

  await nav.getByRole("button", { name: "Company" }).click();

  await expect(page).not.toHaveURL(/\?node=/);
  await expect(nav).toHaveText("Company");
  await expect(page.getByRole("figure")).toHaveAccessibleName("Company");
  const company = page.getByRole("row", { name: "Company" });
  await expect(company).toHaveAttribute("aria-selected", "true");
});

test("focus moves to the current item after an ancestor click in the trail", async ({ page }) => {
  await page.goto("/dashboard/2024");

  await page.getByRole("button", { name: "Expand Branch 1" }).click();
  await page.getByRole("row", { name: "Anna Blackwood" }).click();

  const nav = page.getByRole("navigation", { name: "Chart scope" });
  await expect(nav).toHaveText("Company / Branch 1 / Anna Blackwood");

  const current = nav.locator('[aria-current="location"]');

  // Pointer click selects the node without moving focus to the current item.
  await nav.getByRole("button", { name: "Branch 1" }).click();
  await expect(current).toHaveText("Branch 1");
  await expect(current).not.toBeFocused();
  const isFocused = await current.evaluate((element) => element.matches(":focus"));
  expect(isFocused).toBe(false);
  const isFocusVisible = await current.evaluate((element) => element.matches(":focus-visible"));
  expect(isFocusVisible).toBe(false);
  const outlineStyle = await current.evaluate(
    (element) => window.getComputedStyle(element).outlineStyle,
  );
  expect(outlineStyle).toBe("none");

  // Keyboard activation focuses the replacement current item.
  await page.getByRole("row", { name: "Anna Blackwood" }).click();
  await expect(nav).toHaveText("Company / Branch 1 / Anna Blackwood");

  const branch1Button = nav.getByRole("button", { name: "Branch 1" });
  await branch1Button.focus();
  await page.keyboard.press("Enter");

  await expect(current).toBeFocused();
  await expect(current).toHaveText("Branch 1");

  // Selection made from the table must not steal focus.
  await page.getByRole("row", { name: "Anna Blackwood" }).click();
  await expect(page.getByRole("row", { name: "Anna Blackwood" })).toBeFocused();
  await expect(current).not.toBeFocused();
});

test("the scope trail wraps at 375px without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(`/dashboard/2024?node=${CHANNEL_ID}`);

  const nav = page.getByRole("navigation", { name: "Chart scope" });
  await expect(nav).toBeVisible();
  await expect(nav).toHaveText("Company / Branch 1 / Anna Blackwood / Existing clients");

  const pageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(pageOverflow).toBe(0);

  const crumbs = page.locator("nav[aria-label='Chart scope'] ol");
  const boundingBox = await crumbs.boundingBox();
  expect(boundingBox).not.toBeNull();
  expect(boundingBox?.height).toBeGreaterThan(30);
});

test("small screen layout at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/dashboard/2024");

  // The chart renders 12 month labels (count the text nodes in the chart).
  const yAxisTicks = page.locator("figure .recharts-yAxis-tick-labels text");
  await expect(yAxisTicks).toHaveCount(12);

  // The spacing between consecutive month rows is at least 24px.
  const tickBoxes = await yAxisTicks.evaluateAll((elements) =>
    elements.map((el) => {
      const box = (el as SVGGraphicsElement).getBBox();
      return { y: box.y };
    }),
  );
  expect(tickBoxes.length).toBe(12);
  for (let i = 1; i < tickBoxes.length; i++) {
    const prev = tickBoxes[i - 1];
    const curr = tickBoxes[i];
    if (prev && curr) {
      expect(Math.abs(curr.y - prev.y)).toBeGreaterThanOrEqual(24);
    }
  }

  // The month header reads "Feb".
  const firstMonthHeader = page.locator("thead th").nth(1);
  await expect(firstMonthHeader).toBeVisible();
  const shortSpan = firstMonthHeader.locator("span.sm\\:hidden");
  await expect(shortSpan).toBeVisible();
  await expect(shortSpan).toHaveText("Feb");

  // The name cell keeps the same x after the table's scroll container is scrolled to the end.
  const tableContainer = page.locator("[data-slot='table-container']");
  const nameCell = page.getByRole("row", { name: "Company" }).locator("td").first();
  const initialBox = await nameCell.boundingBox();
  expect(initialBox).not.toBeNull();

  await tableContainer.evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
  });

  const scrolledBox = await nameCell.boundingBox();
  expect(scrolledBox).not.toBeNull();
  expect(Math.round(scrolledBox?.x ?? 0)).toBe(Math.round(initialBox?.x ?? 0));

  // With Branch 1 selected the legend has 5 items, each on a single line (item height no more than 24px),
  // and the legend stays inside the chart card.
  await page.getByRole("row", { name: "Branch 1" }).click();

  const legend = page.locator("figure ul");
  const legendItems = legend.locator("li");
  await expect(legendItems).toHaveCount(5);

  const card = page.locator("figure").locator("..");
  const cardBox = await card.boundingBox();
  const legendBox = await legend.boundingBox();
  expect(cardBox).not.toBeNull();
  expect(legendBox).not.toBeNull();

  if (cardBox && legendBox) {
    expect(legendBox.x).toBeGreaterThanOrEqual(cardBox.x);
    expect(legendBox.x + legendBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1);
    expect(legendBox.y).toBeGreaterThanOrEqual(cardBox.y);
    expect(legendBox.y + legendBox.height).toBeLessThanOrEqual(cardBox.y + cardBox.height + 1);
  }

  for (let i = 0; i < 5; i++) {
    const itemBox = await legendItems.nth(i).boundingBox();
    expect(itemBox).not.toBeNull();
    expect(itemBox?.height).toBeLessThanOrEqual(24);
  }
});

test("sticky name column capped and truncated at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/dashboard/2024");

  // Measure the name cell width with only the company open.
  const companyNameCell = page.getByRole("row", { name: "Company" }).locator("td").first();
  await expect(companyNameCell).toBeVisible();
  const collapsedBox = await companyNameCell.boundingBox();
  expect(collapsedBox).not.toBeNull();
  const collapsedWidth = collapsedBox?.width ?? 0;

  // Expand Branch 1 and Anna Blackwood.
  await page.getByRole("button", { name: "Expand Branch 1" }).click();
  await page.getByRole("button", { name: "Expand Anna Blackwood" }).click();

  const annaRow = page.getByRole("row", { name: "Anna Blackwood" });
  await expect(annaRow).toBeVisible();

  // Assert the name cell width is the same (within 1px) in both states.
  const expandedBox = await companyNameCell.boundingBox();
  expect(expandedBox).not.toBeNull();
  const expandedWidth = expandedBox?.width ?? 0;
  expect(Math.abs(expandedWidth - collapsedWidth)).toBeLessThanOrEqual(1);

  const annaCellBox = await annaRow.locator("td").first().boundingBox();
  expect(annaCellBox).not.toBeNull();
  expect(Math.abs((annaCellBox?.width ?? 0) - collapsedWidth)).toBeLessThanOrEqual(1);

  // Assert the long adviser name is truncated, meaning scrollWidth > clientWidth,
  // and that its title attribute holds the full name.
  const annaNameSpan = annaRow.locator("td").first().locator("span.truncate");
  await expect(annaNameSpan).toBeVisible();
  await expect(annaNameSpan).toHaveAttribute("title", "Anna Blackwood");
  const isTruncated = await annaNameSpan.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(isTruncated).toBe(true);

  // Assert the page still does not scroll sideways.
  const pageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(pageOverflow).toBe(0);

  // Assert that the sticky name cell keeps its x position after the table container is scrolled to the end.
  const tableContainer = page.locator("[data-slot='table-container']");
  const annaNameCell = annaRow.locator("td").first();
  const initialBox = await annaNameCell.boundingBox();
  expect(initialBox).not.toBeNull();

  await tableContainer.evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
  });

  const scrolledBox = await annaNameCell.boundingBox();
  expect(scrolledBox).not.toBeNull();
  expect(Math.round(scrolledBox?.x ?? 0)).toBe(Math.round(initialBox?.x ?? 0));
});

test("the stacked bar chart rounds the topmost segment of each month column", async ({ page }) => {
  await page.goto(`/dashboard/2024?node=${ANNA_ID}`);

  await expect(page.getByRole("figure")).toHaveAccessibleName("Anna Blackwood");

  const rectangles = page.locator("figure path.recharts-rectangle");
  await expect(rectangles).toHaveCount(31);

  const isNarrow = await page.evaluate(() => window.innerWidth < 640);

  let paths: Array<{ x: number; y: number; width: number; d: string }> = [];

  await expect(async () => {
    paths = await rectangles.evaluateAll((elements) =>
      elements.map((el) => {
        const bbox = (el as SVGGraphicsElement).getBBox();
        return {
          x: Math.round(bbox.x),
          y: Math.round(bbox.y),
          width: bbox.width,
          d: el.getAttribute("d") ?? "",
        };
      }),
    );
    const xs = new Set(paths.map((p) => p.x));
    const ys = new Set(paths.map((p) => p.y));
    const count = isNarrow ? ys.size : xs.size;
    expect(count).toBe(12);
  }).toPass();

  if (isNarrow) {
    const rows = new Map<number, typeof paths>();
    for (const item of paths) {
      const group = rows.get(item.y) ?? [];
      group.push(item);
      rows.set(item.y, group);
    }

    expect(rows.size).toBe(12);

    for (const [, group] of rows) {
      group.sort((a, b) => b.x + b.width - (a.x + a.width));

      const [end, ...rest] = group;
      expect(end).toBeDefined();
      expect(end?.d).toContain("A ");

      for (const segment of rest) {
        expect(segment.d).not.toContain("A ");
      }
    }
  } else {
    const columns = new Map<number, typeof paths>();
    for (const item of paths) {
      const group = columns.get(item.x) ?? [];
      group.push(item);
      columns.set(item.x, group);
    }

    expect(columns.size).toBe(12);

    for (const [, group] of columns) {
      group.sort((a, b) => a.y - b.y);

      const [top, ...rest] = group;
      expect(top).toBeDefined();
      expect(top?.d).toContain("A ");

      for (const segment of rest) {
        expect(segment.d).not.toContain("A ");
      }
    }
  }
});
