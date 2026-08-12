import { expect, test, type Page } from "@playwright/test";

const viewer = "hmrCourtViewer111111111111111111111111111111111111111";
const caseId = "case-governance-coercion";

const caseRecord = {
  publicCase: {
    id: caseId,
    state: "appealed",
    finalityState: "stayed",
    policyVersionId: "court-codex-v1",
    targetType: "proposal",
    domain: "governance",
    schedule: {},
    openedAt: "2026-08-01T10:00:00.000Z",
    closedAt: null,
    updatedAt: "2026-08-11T10:00:00.000Z",
    offenseCode: null,
    remedies: [],
    appeals: [],
  },
  partyRecord: {
    parties: [
      { address: viewer, role: "complainant", state: "active" },
      { address: "hmrRespondent", role: "respondent", state: "active" },
    ],
    target: {
      canonicalRoute: "/app/proposals/proposal-under-review",
      digest: "sha256:target",
      accessClass: "public",
      snapshotPayload: { title: "Proposal under review" },
    },
    events: [],
  },
  evidence: [],
  juryTask: null,
  appellateTask: {
    panelId: "appeal-panel-1",
    kind: "ordinary",
    panelState: "ballot",
    seatNumber: 4,
    result: null,
    remedies: [
      { id: "remedy-record", componentCode: "D-01", state: "applicable" },
      { id: "remedy-vote", componentCode: "G-04", state: "applicable" },
    ],
    existingVote: null,
    modificationPackages: [],
  },
  safetyRecord: null,
  enforcementRecord: null,
  capabilities: {
    view_public_case: true,
    view_party_record: true,
    view_jury_task: true,
    propose_appellate_modification: true,
    vote_appeal: true,
  },
};

async function installCourtFixtures(
  page: Page,
  fixture: Record<string, unknown> = caseRecord,
  authenticated = true,
) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/me") {
      await route.fulfill({
        json: {
          authenticated,
          ...(authenticated
            ? {
                address: viewer,
                gate: { eligible: true, expiresAt: "2026-09-01T00:00:00.000Z" },
              }
            : {}),
        },
      });
      return;
    }
    if (url.pathname === "/api/reports/status") {
      await route.fulfill({
        json: {
          status: "available",
          policyVersion: "court-codex-v1",
          policyHash: "sha256:court-codex-v1",
        },
      });
      return;
    }
    if (url.pathname === "/api/reports/cases") {
      await route.fulfill({ json: { status: "available", cases: [fixture] } });
      return;
    }
    if (url.pathname === `/api/reports/cases/${caseId}`) {
      await route.fulfill({ json: fixture });
      return;
    }
    if (url.pathname === "/api/reports/mine") {
      await route.fulfill({ json: { status: "available", reports: [] } });
      return;
    }
    if (url.pathname === "/api/reports/notifications") {
      await route.fulfill({ json: { status: "available", notifications: [] } });
      return;
    }
    if (url.pathname === "/api/reports/capability") {
      await route.fulfill({
        json: {
          status: "available",
          target: {
            type: url.searchParams.get("type"),
            id: url.searchParams.get("id"),
            canonicalRoute: "/app/proposals/proposal-under-review",
            accessClass: "public",
          },
          reasonCapabilities: [
            {
              reason: { offenseCode: "GOV-03", lane: "court_report" },
              standing: {
                status: "verified",
                directStanding: true,
                source: "target-owner",
              },
            },
          ],
          population: null,
        },
      });
      return;
    }
    if (url.pathname === "/api/command" && request.method() === "POST") {
      const command = request.postDataJSON() as { type?: string };
      await route.fulfill({
        json:
          command.type === "court.report.submit"
            ? {
                ok: true,
                type: "court.report.submit",
                reportId: "report-browser-journey",
                reportState: "collecting",
                caseId: null,
              }
            : { ok: true },
      });
      return;
    }
    if (url.pathname === "/api/reports/mine/report-browser-journey") {
      await route.fulfill({
        json: {
          id: "report-browser-journey",
          state: "collecting",
          target: {
            type: "proposal",
            id: "proposal-under-review",
            route: "/app/proposals/proposal-under-review",
            digest: "sha256:target",
            snapshot: {},
          },
          offenseCode: "GOV-03",
          lane: "court_report",
          incident: { startedAt: "2026-08-12T10:00:00.000Z", endedAt: null },
          submittedAt: "2026-08-12T10:00:00.000Z",
          updatedAt: "2026-08-12T10:00:00.000Z",
          revision: 1,
          statementDigest: "sha256:statement",
          statement: { body: "A complete browser report." },
          evidence: [],
          caseId: null,
        },
      });
      return;
    }
    await route.fulfill({ json: {} });
  });
}

for (const width of [390, 1440]) {
  test(`Court records stay usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await installCourtFixtures(page);
    await page.goto("/app/courts");

    await expect(
      page.getByRole("heading", { name: "Courts", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Jury service 1/ }),
    ).toBeVisible();
    await expect(page.getByText(caseId, { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Open case" }).click();
    await expect(page).toHaveURL(`/app/courts/${caseId}`);
    await expect(
      page.getByRole("heading", { name: "Propose a reduced remedy package" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Appeal decision" }),
    ).toBeVisible();

    const bodyWidth = await page
      .locator("body")
      .evaluate((element) => element.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(width);
  });
}

test("a reporter completes the canonical report journey", async ({ page }) => {
  await installCourtFixtures(page);
  await page.goto(
    "/app/courts/reports/new?targetType=proposal&targetId=proposal-under-review",
  );

  await page.getByLabel("Reason").selectOption("GOV-03:court_report");
  await page
    .getByLabel(
      "Describe what happened, when it happened, and why this reason applies.",
    )
    .fill(
      "The respondent offered compensation for a governance vote and the attached record preserves the relevant context.",
    );
  await page
    .getByText(/I attest that this report is made in good faith/)
    .click();
  await page.getByRole("button", { name: "Submit report" }).click();

  await expect(page).toHaveURL("/app/courts/reports/report-browser-journey");
  await expect(
    page.getByText("report-browser-journey", { exact: true }),
  ).toBeVisible();
});

test("respondent and juror duties are projected as distinct work", async ({
  page,
}) => {
  const respondentRecord = {
    ...caseRecord,
    publicCase: { ...caseRecord.publicCase, state: "notice_and_response" },
    appellateTask: null,
    capabilities: {
      view_public_case: true,
      view_party_record: true,
      submit_response: true,
      submit_evidence: true,
    },
  };
  await installCourtFixtures(page, respondentRecord);
  await page.goto(`/app/courts/${caseId}`);
  await expect(
    page.getByRole("heading", { name: "Respond to the case" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Add evidence" }),
  ).toBeVisible();

  const jurorRecord = {
    ...caseRecord,
    publicCase: { ...caseRecord.publicCase, state: "jury_selection" },
    partyRecord: null,
    appellateTask: null,
    juryTask: {
      selectionRound: 1,
      seatNumber: null,
      conflictResult: "pending",
      state: "invited",
      selectedAt: "2026-08-11T10:00:00.000Z",
      respondedAt: null,
      ballot: null,
    },
    capabilities: {
      view_public_case: true,
      view_jury_task: true,
      accept_jury_seat: true,
    },
  };
  await page.unroute("**/api/**");
  await installCourtFixtures(page, jurorRecord);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Jury invitation" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept duty" })).toBeVisible();
});

test("an unauthorized observer receives no private task controls", async ({
  page,
}) => {
  const observerRecord = {
    ...caseRecord,
    partyRecord: null,
    juryTask: null,
    appellateTask: null,
    capabilities: { view_public_case: true, view_public_evidence: true },
  };
  await installCourtFixtures(page, observerRecord, false);
  await page.goto(`/app/courts/${caseId}`);
  await expect(page.getByText(caseId, { exact: true })).toBeVisible();
  await expect(
    page.getByText("Your Court actions", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(viewer, { exact: true })).toHaveCount(0);
});

for (const theme of ["sky", "light", "night", "fire"] as const) {
  test(`Courtroom visual contract in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("vortex.theme", selectedTheme);
    }, theme);
    await installCourtFixtures(page);
    await page.goto(`/app/courts/${caseId}`);
    await expect(
      page.getByRole("heading", { name: "Appeal decision" }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const bodyWidth = await page
      .locator("body")
      .evaluate((element) => element.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(1024);
    await page.screenshot({
      path: `test-results/playwright/courts-v2-${theme}.png`,
      fullPage: true,
    });
  });
}
