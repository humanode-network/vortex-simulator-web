import { expect, test } from "@playwright/test";

test("Humanode Codex links transgressions to lawful measures", async ({
  page,
}) => {
  await page.goto("/app/humanode-codex?clause=HC-3.GOV-03");

  await expect(
    page.getByRole("heading", { name: "Humanode Codex" }),
  ).toBeVisible();
  const offense = page.locator('[data-codex-ref="HC-3.GOV-03"]');
  await expect(offense).toBeVisible();
  await expect(
    offense.getByText("Voter coercion", { exact: true }),
  ).toBeVisible();
  await expect(offense.getByText("Available sentence measures")).toBeVisible();

  await offense
    .getByRole("link", { name: /G-12 · Full governance restriction/ })
    .click();
  await expect(page).toHaveURL(/clause=HC-5.G-12/);
  await expect(page.locator('[data-codex-ref="HC-5.G-12"]')).toBeVisible();
  await expect(
    page.getByText("Linked transgressions", { exact: true }),
  ).toBeVisible();
});

test("Codex views, expansion, and searches remain truthful and addressable", async ({
  page,
}) => {
  await page.goto("/app/humanode-codex");

  await page.getByRole("tab", { name: "Measures" }).click();
  await expect(page).toHaveURL(/view=measures/);
  await page.reload();
  await expect(page.getByRole("tab", { name: "Measures" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  const search = page.getByRole("searchbox", { name: "Search Humanode Codex" });
  await search.fill("Forced labor");
  await expect(page.getByText("Showing 1 Codex entry")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Forced labor" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Automatic kill contract" }),
  ).toHaveCount(0);

  await search.fill("Voter coercion");
  await expect(
    page.getByRole("heading", { name: "Full governance restriction" }),
  ).toBeVisible();

  await search.fill("no-such-codex-entry");
  await expect(page.getByText("Showing 0 Codex entries")).toBeVisible();
  await expect(page.getByText("No Codex entry matches")).toBeVisible();

  await search.fill("");
  await page.getByRole("tab", { name: "Transgression matrix" }).click();
  const firstDetails = page
    .getByRole("button", { name: "View details" })
    .first();
  await firstDetails.click();
  await expect(page).toHaveURL(/view=matrix&clause=HC-3\.CMP-01/);
  await expect(
    page.getByRole("button", { name: "Hide details" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/view=matrix$/);
  await expect(page.getByRole("button", { name: "Hide details" })).toHaveCount(
    0,
  );
});

test("Codex keyboard tabs and cross-view deep links preserve a visible destination", async ({
  page,
}) => {
  await page.goto("/app/humanode-codex");

  const matrixTab = page.getByRole("tab", { name: "Transgression matrix" });
  await matrixTab.focus();
  await page.keyboard.press("ArrowRight");
  const measuresTab = page.getByRole("tab", { name: "Measures" });
  await expect(measuresTab).toBeFocused();
  await expect(measuresTab).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(/view=measures/);

  await page.keyboard.press("End");
  await expect(
    page.getByRole("tab", { name: "Procedure and severity" }),
  ).toBeFocused();

  await page.getByRole("tab", { name: "Transgression matrix" }).click();
  const search = page.getByRole("searchbox", { name: "Search Humanode Codex" });
  await search.fill("Threats, retaliation");
  await page.getByRole("button", { name: "View details" }).click();
  await page
    .getByRole("link", { name: /G-12 · Full governance restriction/ })
    .click();
  await expect(page).toHaveURL(/clause=HC-5\.G-12/);
  await expect(search).toHaveValue("");
  await expect(page.locator('[data-codex-ref="HC-5.G-12"]')).toBeVisible();
});

test("Codex references support anchored hover, keyboard, and touch access", async ({
  page,
}) => {
  await page.goto("/app/humanode-codex");
  const reference = page
    .getByRole("link", { name: /HC-3\.CMP-01.*Open in Humanode Codex/ })
    .first();

  await reference.hover();
  const hoverPreview = page.getByRole("dialog", {
    name: /Unauthorized proposal-tier use reference preview/,
  });
  await expect(hoverPreview).toBeVisible();
  await hoverPreview.hover();
  await page.waitForTimeout(250);
  await expect(hoverPreview).toBeVisible();

  await reference.focus();
  await page.keyboard.press("Escape");
  await expect(hoverPreview).toBeHidden();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/clause=HC-3\.CMP-01/);

  await page.goto("/app/humanode-codex");
  const touchReference = page
    .getByRole("link", { name: /HC-3\.CMP-01.*Open in Humanode Codex/ })
    .first();
  await touchReference.dispatchEvent("pointerdown", { pointerType: "touch" });
  await touchReference.dispatchEvent("click");
  await expect(page).toHaveURL(/\/app\/humanode-codex$/);
  const touchPreview = page.getByRole("dialog", {
    name: /Unauthorized proposal-tier use reference preview/,
  });
  await expect(touchPreview).toBeVisible();
  await touchPreview.getByRole("button", { name: "Humanode Codex" }).click();
  await expect(page).toHaveURL(/clause=HC-3\.CMP-01/);
});

test("Codex hints stay adjacent to their trigger at the viewport edge", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/app/humanode-codex");
  const sourceReference = page.getByRole("link", {
    name: /HC-1\.1.*Open in Humanode Codex/,
  });
  await sourceReference.evaluate((element) =>
    element.scrollIntoView({ block: "end" }),
  );
  const triggerBox = await sourceReference.boundingBox();
  if (!triggerBox) throw new Error("Codex trigger is not measurable");
  await page.mouse.move(
    triggerBox.x + triggerBox.width / 2,
    triggerBox.y + triggerBox.height / 2,
  );

  const preview = page.getByRole("dialog", {
    name: /Authority and scope reference preview/,
  });
  await expect(preview).toBeVisible();
  const previewBox = await preview.boundingBox();
  if (!previewBox) throw new Error("Codex preview is not measurable");
  expect(previewBox.y + previewBox.height).toBeLessThanOrEqual(
    triggerBox.y - 8,
  );
  expect(previewBox.x).toBeGreaterThanOrEqual(0);
  expect(previewBox.x + previewBox.width).toBeLessThanOrEqual(390);
});

test("numbered procedure points are exact destinations without nested controls", async ({
  page,
}) => {
  await page.goto("/app/humanode-codex?clause=HC-2.2.1");
  await expect(
    page.getByRole("tab", { name: "Procedure and severity" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.locator('[data-codex-ref="HC-2.2.1"]')).toBeVisible();
  await expect(
    page.locator("button [role='link'], [role='link'] [role='link']"),
  ).toHaveCount(0);
});

for (const width of [390, 768, 1024, 1440]) {
  test(`expanded Codex records stay usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/app/humanode-codex?clause=HC-3.GOV-03");
    await expect(
      page.getByRole("button", { name: "Hide details" }),
    ).toBeVisible();
    const bodyWidth = await page
      .locator("body")
      .evaluate((element) => element.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(width);
  });
}

for (const theme of ["sky", "light", "night", "fire"] as const) {
  test(`Humanode Codex visual contract in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("vortex.theme", selectedTheme);
    }, theme);
    await page.goto("/app/humanode-codex?clause=HC-3.GOV-03");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const bodyWidth = await page
      .locator("body")
      .evaluate((element) => element.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(1024);
    await page.screenshot({
      path: `test-results/playwright/humanode-codex-${theme}.png`,
      fullPage: true,
    });
  });
}
