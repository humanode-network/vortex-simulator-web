import { expect, test } from "@playwright/test";

test.skip(
  !process.env.FORMATION_LIVE_PREVIEW,
  "Requires isolated local preview",
);
const root = "/api/phase96-preview";
test.beforeAll(async ({ request }) => {
  expect((await request.post(`${root}/reset`)).ok()).toBe(true);
});

test("review availability refreshes when a different member leaves", async ({
  page,
  browser,
}) => {
  await page.goto(`${root}/session?scenario=full&person=proposer`);
  await expect(
    page.getByRole("button", { name: "Accept", exact: true }),
  ).toBeDisabled();
  const memberContext = await browser.newContext();
  try {
    const member = await memberContext.newPage();
    await member.goto(
      `http://127.0.0.1:4197${root}/session?scenario=full&person=outsider&view=project`,
    );
    await member
      .getByRole("button", { name: "Leave team", exact: true })
      .click();
    await member
      .getByRole("button", { name: "Confirm leave", exact: true })
      .click();
    await expect(
      member.getByText("You left the team. Earned MM is retained."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Accept", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByText(
        "The team is full. Pending applications can still be declined or withdrawn.",
        { exact: true },
      ),
    ).toHaveCount(0);
  } finally {
    await memberContext.close();
  }
});

test("long statements remain fully readable without pushing decisions off the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${root}/session?scenario=long-text&person=proposer`);
  const statement = page.getByRole("region", { name: "Application statement" });
  await expect(statement).toBeVisible();
  expect(
    await statement.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true);
  await statement.focus();
  await statement.press("PageDown");
  await expect
    .poll(() => statement.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  await expect(
    page.getByRole("button", { name: "Accept", exact: true }),
  ).toBeInViewport();
  await page.getByRole("button", { name: "Decline", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
});

test("mobile formatting, link editing and validation never submit an application", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    `${root}/session?scenario=empty&person=applicant&view=project`,
  );
  const submit = page.getByRole("button", { name: "Submit application" });
  await expect(submit).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Role", exact: true })
    .selectOption("Reviewer");
  const editor = page.getByRole("textbox", {
    name: "How would you contribute?",
  });
  await editor.fill(
    "I will review delivery evidence and reproducible results.",
  );
  await expect(submit).toBeEnabled();
  for (const [name, tag] of [
    ["Heading", "h2"],
    ["List", "ul"],
    ["Numbered list", "ol"],
    ["Quote", "blockquote"],
  ]) {
    await editor.click();
    await page.getByRole("button", { name, exact: true }).click();
    await expect(editor.locator(tag)).toHaveCount(1);
    await page.getByRole("button", { name, exact: true }).click();
  }
  await editor.press("ControlOrMeta+a");
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await expect(editor.locator("code")).toHaveCount(1);
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Link URL" })).toBeFocused();
  await page
    .getByRole("textbox", { name: "Link URL" })
    .fill("https://example.com/evidence");
  await page.getByRole("button", { name: "Apply link", exact: true }).click();
  await expect(editor.locator("a")).toHaveAttribute(
    "href",
    "https://example.com/evidence",
  );
  await expect(submit).toBeVisible();
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Link URL" })
    .fill("javascript:alert(1)");
  await expect(
    page.getByRole("button", { name: "Apply link", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Link URL" })
    .fill("https://example.com/updated");
  await page.getByRole("textbox", { name: "Link URL" }).press("Enter");
  await expect(editor.locator("a")).toHaveAttribute(
    "href",
    "https://example.com/updated",
  );
  const data = await (await page.request.get(`${root}/state`)).json();
  expect(
    data.applications.filter(
      (row: { proposalId: string }) => row.proposalId === "phase96-dummy-empty",
    ),
  ).toHaveLength(0);
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(editor).toBeFocused();
  await page.screenshot({
    path: testInfo.outputPath("mobile-application-editor.png"),
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});

test("review cancel and refresh preserve pending state; project navigation works", async ({
  page,
}) => {
  await page.goto(`${root}/session?scenario=pending&person=proposer`);
  for (const action of ["Accept", "Decline"]) {
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(
      page.getByRole("group", { name: "Confirm application decision" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(
      page.getByRole("group", { name: "Confirm application decision" }),
    ).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByText("pending", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Open project", exact: true }).click();
  await expect(page).toHaveURL(/\/phase96-dummy-pending\/formation/);
});

test("canceling withdrawal and removal changes no membership", async ({
  page,
}) => {
  await page.goto(`${root}/session?scenario=pending&person=applicant`);
  await page
    .getByRole("button", { name: "Withdraw application", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Withdraw application", exact: true }),
  ).toBeVisible();
  await page.goto(`${root}/session?scenario=accepted&person=applicant`);
  await page.getByRole("button", { name: "Leave team", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("group", { name: "Confirm team departure" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Refresh team", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Leave team", exact: true }),
  ).toBeVisible();
  await page.goto(`${root}/session?scenario=accepted&person=proposer`);
  await page
    .getByRole("button", { name: "Remove member", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Remove member", exact: true }),
  ).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`review and departure controls fit at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${root}/session?scenario=pending&person=proposer`);
    await page.getByRole("button", { name: "Decline", exact: true }).click();
    await page
      .getByRole("button", { name: "Confirm decline", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath("review-confirmation.png"),
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.goto(`${root}/session?scenario=accepted&person=proposer`);
    await page
      .getByRole("button", { name: "Remove member", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm removal", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath("departure-confirmation.png"),
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  });
}
