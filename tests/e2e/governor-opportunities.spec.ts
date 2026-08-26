import { expect, test, type Page } from "@playwright/test";

const address = "hmrGovernorOpportunityViewer1111111111111111111111111111";

const opportunities = [
  {
    occurrenceId: "long-policy:pool:2026-08-01",
    proposalId: "long-policy",
    proposalTitle:
      "A deliberately long proposal title that verifies governing opportunity cards wrap without hiding civic context",
    chamberId: "general",
    chamberTitle: "General",
    proposalStage: "pool",
    stage: "pool",
    state: "available",
    accountable: true,
    canBecomeAccountable: true,
    participated: false,
    openedAt: "2026-08-01T00:00:00.000Z",
    accountableAt: "2026-08-02T00:00:00.000Z",
    closedAt: null,
    exclusionReason: null,
  },
  {
    occurrenceId: "completed-policy:vote:2026-08-03",
    proposalId: "completed-policy",
    proposalTitle: "Completed chamber decision",
    chamberId: "media",
    chamberTitle: "Media and Communications",
    proposalStage: "failed",
    stage: "vote",
    state: "completed",
    accountable: true,
    canBecomeAccountable: true,
    participated: true,
    openedAt: "2026-08-03T00:00:00.000Z",
    accountableAt: "2026-08-04T00:00:00.000Z",
    closedAt: "2026-08-05T00:00:00.000Z",
    exclusionReason: null,
  },
  {
    occurrenceId: "fast-policy:pool:2026-08-06",
    proposalId: "fast-policy",
    proposalTitle: "Fast-closing proposal pool",
    chamberId: "general",
    chamberTitle: "General",
    proposalStage: "failed",
    stage: "pool",
    state: "closed_unaccountable",
    accountable: false,
    canBecomeAccountable: false,
    participated: false,
    openedAt: "2026-08-06T00:00:00.000Z",
    accountableAt: "2026-08-07T00:00:00.000Z",
    closedAt: "2026-08-06T02:00:00.000Z",
    exclusionReason: null,
  },
  {
    occurrenceId: "formation-policy:vote:2026-08-07",
    proposalId: "formation-policy",
    proposalTitle: "Formation milestone owned by this team",
    chamberId: "general",
    chamberTitle: "General",
    proposalStage: "vote",
    stage: "vote",
    state: "excluded",
    accountable: false,
    canBecomeAccountable: false,
    participated: false,
    openedAt: "2026-08-07T00:00:00.000Z",
    accountableAt: "2026-08-08T00:00:00.000Z",
    closedAt: null,
    exclusionReason: "formation_team_member",
  },
] as const;

function governanceResponse(url: URL) {
  const stage = url.searchParams.get("opportunityStage");
  const state = url.searchParams.get("opportunityState");
  const filtered = opportunities.filter(
    (item) =>
      (!stage || item.stage === stage) && (!state || item.state === state),
  );
  return {
    eraActivity: {
      era: "4",
      required: 2,
      completed: 1,
      actions: [
        { label: "Pool votes", done: 0, required: 1 },
        { label: "Chamber votes", done: 1, required: 1 },
      ],
      timeLeft: "9d:00h:00m",
    },
    myChamberIds: [],
    delegation: { chambers: [] },
    legitimacy: {
      percent: 100,
      objecting: false,
      objectingHumanNodes: 0,
      eligibleHumanNodes: 5,
      referendumTriggered: false,
      triggerThresholdPercent: 33.3,
    },
    tier: {
      tier: "Ecclesiast",
      nextTier: "Legate",
      metrics: {
        governorEras: 4,
        activeEras: 2,
        acceptedProposals: 2,
        formationParticipation: 1,
      },
      requirements: {
        governorEras: 3,
        activeEras: 2,
        acceptedProposals: 2,
        formationParticipation: 1,
      },
    },
    opportunityAccounting: {
      exposureSeconds: 86_400,
      activeGovernorReason: "missed_pool_requirement",
      pool: { raw: 2, accountable: 1, completed: 0, required: 1 },
      chamber: { raw: 1, accountable: 1, completed: 1, required: 1 },
      items: filtered,
      page: {
        offset: 0,
        limit: 20,
        total: filtered.length,
        stage: stage === "pool" || stage === "vote" ? stage : null,
        state: state || null,
      },
    },
    rollup: {
      era: 3,
      rolledAt: "2026-08-01T00:00:00.000Z",
      status: "Losing status",
      requiredTotal: 2,
      completedTotal: 1,
      isActiveNextEra: false,
      activeGovernorsNextEra: 4,
    },
  };
}

async function installFixtures(page: Page) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/me") {
      await route.fulfill({
        json: {
          authenticated: true,
          address,
          gate: { eligible: true, expiresAt: "2026-09-01T00:00:00.000Z" },
        },
      });
      return;
    }
    if (url.pathname === "/api/my-governance") {
      await route.fulfill({ json: governanceResponse(url) });
      return;
    }
    if (url.pathname === "/api/feed") {
      await route.fulfill({
        json: {
          items: [
            {
              id: "generic-unverified-pool-card",
              title: "A proposal this viewer cannot vote on",
              meta: "General",
              stage: "pool",
              summaryPill: "Proposal Pool",
              summary:
                "Generic stage activity must not imply personal eligibility.",
              actionable: true,
              href: "/app/proposals/ineligible/pp",
              timestamp: "2026-08-24T00:00:00.000Z",
            },
          ],
        },
      });
      return;
    }
    if (url.pathname === "/api/chambers") {
      await route.fulfill({ json: { items: [] } });
      return;
    }
    if (url.pathname === "/api/clock") {
      await route.fulfill({
        json: {
          currentEra: 4,
          updatedAt: "2026-08-20T00:00:00.000Z",
          eraSeconds: 2_592_000,
          nextEraAt: "2026-09-19T00:00:00.000Z",
          activeGovernors: 4,
        },
      });
      return;
    }
    if (url.pathname === "/api/cm/me") {
      await route.fulfill({
        json: {
          address,
          totals: { lcm: 0, mcm: 0, acm: 0 },
          chambers: [],
          history: [],
        },
      });
      return;
    }
    if (url.pathname === `/api/humans/${address}`) {
      await route.fulfill({
        json: {
          id: address,
          name: "Phase 94 Governor",
          humanNodeActive: true,
          governor: true,
          governorActive: false,
          activeGovernorReason: "missed_pool_requirement",
          heroStats: [],
          quickDetails: [],
          proofSections: {},
          governanceActions: [],
          delegation: { chambers: [] },
          delegationEligibleChambers: [],
          projects: [],
          activity: [],
          history: [],
        },
      });
      return;
    }
    await route.fulfill({ json: { items: [] } });
  });
}

test("Governor opportunity accounting is explainable and server-filtered", async ({
  page,
}) => {
  await installFixtures(page);
  await page.goto("/app/my-governance");
  await expect(
    page.getByText("Pool votes this era", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Pool requirement missed", { exact: true }),
  ).toBeVisible();
  await page.getByText("Review opportunity history", { exact: true }).click();
  await expect(
    page.getByText(opportunities[0].proposalTitle, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Action required", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".glassy-status-chip")
      .filter({ hasText: "Closed before exposure" }),
  ).toBeVisible();
  await page
    .getByLabel("Filter governing opportunities by stage")
    .selectOption("vote");
  await expect(
    page.getByText("Completed chamber decision", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Fast-closing proposal pool", { exact: true }),
  ).toHaveCount(0);
});

test("Governor opportunity layout remains contained on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installFixtures(page);
  await page.goto("/app/my-governance");
  await page.getByText("Review opportunity history", { exact: true }).click();
  await expect(
    page.getByText(opportunities[0].proposalTitle, { exact: true }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("Urgent Feed uses the same verified opportunity projection", async ({
  page,
}) => {
  await installFixtures(page);
  await page.goto("/app/feed");

  await expect(
    page.getByText("A deliberately long proposal title", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("A proposal this viewer cannot vote on"),
  ).toHaveCount(0);
  await expect(
    page.getByText("This open stage now counts", { exact: false }),
  ).toBeVisible();
});

for (const theme of ["sky", "light", "night", "fire"] as const) {
  test(`Governor opportunity surface remains legible in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("vortex.theme", selectedTheme);
    }, theme);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await installFixtures(page);
    await page.goto("/app/my-governance");
    await page.getByText("Review opportunity history", { exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(
      page.getByText(opportunities[0].proposalTitle, { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`governor-opportunities-${theme}.png`),
      fullPage: true,
    });
  });
}
