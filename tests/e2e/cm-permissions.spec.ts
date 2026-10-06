import { expect, test, type Page } from "@playwright/test";

async function mockCm(page: Page) {
  const state = {
    address: "cm-test-governor" as string | null,
    eligible: true,
    memberships: ["general"],
    membershipUnavailable: false,
    submissions: [] as Array<{ type: string; payload: unknown }>,
  };
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/me") {
      await route.fulfill({
        json: state.address
          ? {
              authenticated: true,
              address: state.address,
              gate: {
                eligible: state.eligible,
                reason: "inactive",
                expiresAt: "2099-01-01",
              },
            }
          : { authenticated: false },
      });
    } else if (path === "/api/my-governance") {
      await route.fulfill({
        status: state.membershipUnavailable ? 503 : 200,
        json: state.membershipUnavailable
          ? { message: "Membership verification unavailable" }
          : { myChamberIds: state.memberships, opportunityAccounting: null },
      });
    } else if (path === "/api/chambers") {
      await route.fulfill({
        json: {
          items: [
            { id: "general", name: "General", multiplier: 1.2 },
            { id: "media", name: "Media", multiplier: 1 },
          ],
        },
      });
    } else if (path === "/api/command") {
      state.submissions.push(route.request().postDataJSON());
      await route.fulfill({
        json: {
          ok: true,
          aggregate: { submissions: 1, avgTimes10: 14 },
          applied: { nextMultiplierTimes10: 14 },
        },
      });
    } else {
      await route.fulfill({
        status: 503,
        json: { message: "Unavailable in isolated CM test" },
      });
    }
  });
  return state;
}

function controls(page: Page, chamber: string) {
  return page.getByText(chamber, { exact: true }).locator("..").locator("..");
}

for (const width of [390, 1440]) {
  test(`General CM is read-only while specialized outsider CM works at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await mockCm(page);
    await page.goto("/app/cm");
    const general = controls(page, "General");
    const media = controls(page, "Media");
    await expect(general.getByRole("spinbutton")).toBeDisabled();
    await expect(
      general.getByRole("button", { name: "Submit" }),
    ).toBeDisabled();
    await expect(general).toContainText(
      "You cannot set M for chambers you belong to.",
    );
    await expect(media.getByRole("spinbutton")).toBeEnabled();
    await media.getByRole("spinbutton").fill("1.4");
    await media.getByRole("button", { name: "Submit" }).click();
    await expect(media).toContainText("M × 1.4");
    expect(state.submissions).toMatchObject([
      {
        type: "chamber.multiplier.submit",
        payload: { chamberId: "media", multiplierTimes10: 14 },
      },
    ]);
    await expect(general).toContainText("M × 1.2");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}

test("failed membership verification never exposes outsider controls", async ({
  page,
}) => {
  const state = await mockCm(page);
  state.membershipUnavailable = true;
  await page.goto("/app/cm");
  await expect(page.getByText(/CM panel unavailable:/)).toBeVisible();
  await expect(page.getByRole("spinbutton")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Submit", exact: true }),
  ).toHaveCount(0);
  expect(state.submissions).toHaveLength(0);
});

for (const mode of ["anonymous", "inactive"] as const) {
  test(`${mode} Human Nodes cannot submit chamber CM`, async ({ page }) => {
    const state = await mockCm(page);
    if (mode === "anonymous") state.address = null;
    else state.eligible = false;
    await page.goto("/app/cm");
    await expect(
      controls(page, "Media").getByRole("spinbutton"),
    ).toBeDisabled();
    await expect(
      controls(page, "Media").getByRole("button", { name: "Submit" }),
    ).toBeDisabled();
    expect(state.submissions).toHaveLength(0);
  });
}

test("wallet changes reload membership instead of retaining outsider permissions", async ({
  page,
}) => {
  const state = await mockCm(page);
  await page.clock.install();
  await page.goto("/app/cm");
  await expect(controls(page, "Media").getByRole("spinbutton")).toBeEnabled();
  state.address = "cm-test-media-member";
  state.memberships = ["general", "media"];
  await page.clock.fastForward(60_000);
  await expect(controls(page, "Media").getByRole("spinbutton")).toBeDisabled();
  await expect(
    controls(page, "General").getByRole("spinbutton"),
  ).toBeDisabled();
  expect(state.submissions).toHaveLength(0);
});
