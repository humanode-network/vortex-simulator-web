import { expect, test, type Page } from "@playwright/test";

// Opt-in: this suite needs the isolated tests/preview/formation-scenarios.ts server.
test.skip(
  !process.env.FORMATION_LIVE_PREVIEW,
  "Start the disposable local scenario server first",
);
const root = "/api/phase96-preview";
async function signIn(
  page: Page,
  scenario: string,
  person = "applicant",
  project = false,
) {
  await page.goto(
    `${root}/session?scenario=${scenario}&person=${person}${project ? "&view=project" : ""}`,
  );
}
async function state(page: Page) {
  return (await page.request.get(`${root}/state`)).json();
}
test.beforeAll(async ({ request }) => {
  const response = await request.post(`${root}/reset`);
  expect(response.ok()).toBe(true);
});
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});

test("new application, role choice, proposer review and actual membership", async ({
  page,
}) => {
  await signIn(page, "empty", "applicant", true);
  await page
    .getByRole("combobox", { name: "Role", exact: true })
    .selectOption("Reviewer");
  await page
    .getByRole("textbox", { name: "How would you contribute?" })
    .fill("I can review reproducibility, quality and the release checklist.");
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(
    page.getByText("Application submitted. The proposer will review it."),
  ).toBeVisible();
  let data = await state(page);
  const application = data.applications.find(
    (row: any) => row.proposalId === "phase96-dummy-empty",
  );
  expect(application.role).toBe("Reviewer");
  expect(
    data.team.filter((row: any) => row.proposalId === application.proposalId),
  ).toHaveLength(0);
  await signIn(page, "empty", "proposer");
  await page.goto(`/app/formation/applications/${application.id}`);
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await page.getByRole("button", { name: "Confirm accept" }).click();
  await expect(
    page.getByText("Application accepted.", { exact: true }),
  ).toBeVisible();
  data = await state(page);
  expect(
    data.team
      .filter((row: any) => row.proposalId === application.proposalId)
      .map((row: any) => row.role),
  ).toEqual(["Reviewer"]);
});

test("decline is visible to applicant and grants no membership", async ({
  page,
}) => {
  await signIn(page, "pending", "proposer");
  await page
    .getByRole("textbox", { name: "Decision note (optional)" })
    .fill("Please add a delivery schedule.");
  await page.getByRole("button", { name: "Decline", exact: true }).click();
  await page.getByRole("button", { name: "Confirm decline" }).click();
  await expect(
    page.getByText("Application declined.", { exact: true }),
  ).toBeVisible();
  await signIn(page, "pending");
  await expect(page.getByText("Please add a delivery schedule.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Withdraw application" }),
  ).toHaveCount(0);
  expect(
    (await state(page)).team.filter(
      (row: any) => row.proposalId === "phase96-dummy-pending",
    ),
  ).toHaveLength(0);
});

for (const scenario of ["declined", "withdrawn", "left", "removed"]) {
  test(`${scenario}: applicant can submit a fresh attempt and withdraw it`, async ({
    page,
  }) => {
    await signIn(page, scenario, "applicant", true);
    await page
      .getByRole("combobox", { name: "Role", exact: true })
      .selectOption("Researcher");
    await page
      .getByRole("textbox", { name: "How would you contribute?" })
      .fill("I am ready to contribute research and documentation again.");
    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(
      page.getByText("Application submitted. The proposer will review it."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Withdraw application" }).click();
    await page.getByRole("button", { name: "Confirm withdraw" }).click();
    await expect(
      page.getByText("Application withdrawn.", { exact: true }),
    ).toBeVisible();
  });
}

test("approved member leaves and earned MM remains unchanged", async ({
  page,
}) => {
  const before = (await state(page)).awards;
  await signIn(page, "earned-mm", "applicant", true);
  await page.getByRole("button", { name: "Leave team", exact: true }).click();
  await page.getByRole("button", { name: "Confirm leave" }).click();
  await expect(
    page.getByText("You left the team. Earned MM is retained."),
  ).toBeVisible();
  const after = await state(page);
  expect(after.awards).toEqual(before);
  expect(
    after.team.filter(
      (row: any) => row.proposalId === "phase96-dummy-earned-mm",
    ),
  ).toHaveLength(0);
});

for (const scenario of [
  "accepted",
  "suspended",
  "canceled",
  "ready-to-finish",
  "completed",
]) {
  test(`${scenario}: proposer removes a member without touching awards`, async ({
    page,
  }) => {
    const before = (await state(page)).awards;
    await signIn(page, scenario, "proposer", true);
    await expect(
      page.getByRole("heading", { name: "Team", exact: true }),
    ).toHaveCount(1);
    await page
      .getByRole("button", { name: "Remove member", exact: true })
      .click();
    await page.getByRole("button", { name: "Confirm removal" }).click();
    await expect(
      page.getByText("Member removed. Their earned MM is retained."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Remove member", exact: true }),
    ).toHaveCount(0);
    expect((await state(page)).awards).toEqual(before);
  });
}

test("a full team rejects acceptance but permits declining the remaining application", async ({
  page,
}) => {
  await signIn(page, "full", "proposer");
  await expect(
    page.getByRole("button", { name: "Accept", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      "The team is full. Pending applications can still be declined or withdrawn.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Decline", exact: true }).click();
  await page.getByRole("button", { name: "Confirm decline" }).click();
  await expect(
    page.getByText("Application declined.", { exact: true }),
  ).toBeVisible();
});

test("closed application is read-only and an outsider cannot read private statements", async ({
  page,
}) => {
  await signIn(page, "closed");
  await expect(page.getByText("closed", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Withdraw application" }),
  ).toHaveCount(0);
  await signIn(page, "long-text", "outsider");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Contribution", exact: true }),
  ).toHaveCount(0);
});

test("all 25 queued applications paginate without duplicates", async ({
  page,
}) => {
  await signIn(page, "pagination", "proposer", true);
  await expect(
    page.getByRole("button", { name: "Accept", exact: true }),
  ).toHaveCount(20);
  await page.getByRole("button", { name: "Load more applications" }).click();
  await expect(
    page.getByRole("button", { name: "Accept", exact: true }),
  ).toHaveCount(25);
  await expect(
    page.getByRole("button", { name: "Load more applications" }),
  ).toHaveCount(0);
});

test("suspension prevents acceptance but still allows withdrawal", async ({
  page,
}) => {
  await signIn(page, "paused-pending", "proposer");
  await expect(
    page.getByRole("button", { name: "Accept", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      "Recruitment is paused during suspension or milestone voting. The application remains pending.",
      { exact: true },
    ),
  ).toBeVisible();
  await signIn(page, "paused-pending");
  await page.getByRole("button", { name: "Withdraw application" }).click();
  await page.getByRole("button", { name: "Confirm withdraw" }).click();
  await expect(
    page.getByText("Application withdrawn.", { exact: true }),
  ).toBeVisible();
});

test("proposer receives actionable Urgent cards while unrelated users do not", async ({
  page,
}) => {
  await signIn(page, "pagination", "proposer");
  await page.goto("/app/feed");
  await expect(
    page.getByText("Formation applications to review", { exact: true }),
  ).toBeVisible();
  const review = page.getByRole("link", {
    name: "Review application",
    exact: true,
  });
  await expect(review.first()).toBeVisible();
  await review.first().click();
  await expect(
    page.getByRole("button", { name: "Accept", exact: true }).first(),
  ).toBeVisible();
  await signIn(page, "pagination", "outsider", true);
  await page.goto("/app/feed");
  await expect(
    page.getByText("0 pending review", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Review application", exact: true }),
  ).toHaveCount(0);
});

test("member can leave on the actual milestone-vote page", async ({ page }) => {
  await signIn(page, "milestone-vote", "applicant", true);
  await expect(
    page.getByRole("button", { name: "Leave team", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Leave team", exact: true }).click();
  await page.getByRole("button", { name: "Confirm leave" }).click();
  await expect(
    page.getByText("You left the team. Earned MM is retained."),
  ).toBeVisible();
  expect(
    (await state(page)).team.filter(
      (row: any) => row.proposalId === "phase96-dummy-milestone-vote",
    ),
  ).toHaveLength(0);
});

for (const theme of ["light", "sky", "night", "fire"]) {
  test(`${theme}: long formatted application fits all four widths`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript(
      (theme) => localStorage.setItem("vortex.theme", theme),
      theme,
    );
    await signIn(page, "long-text", "proposer");
    for (const width of [390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(
        page.getByRole("heading", { name: "Contribution", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(`${theme}-${width}.png`),
      });
    }
  });
}
