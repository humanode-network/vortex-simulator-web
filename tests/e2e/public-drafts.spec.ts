import { expect, test, type Page } from "@playwright/test";

const draftId = "draft-public-governance";
const author = "hmr1GRb1SRdDfJZmFaYh5L1RNev3dFcTVLGS2Rqqmk3Fbgj2W";

const listItem = {
  id: draftId,
  title: "Transparent governance reporting",
  chamber: "General Chamber",
  summary: "Publish regular governance reports before formal submission.",
  proposer: author,
  proposalKind: "policy",
  revision: 2,
  publishedAt: "2026-07-22T10:00:00.000Z",
  updatedAt: "2026-07-23T12:30:00.000Z",
  initiative: {
    id: "governance-observatory",
    slug: "governance-observatory",
    title: "Governance Observatory",
  },
};

const detail = {
  id: draftId,
  submittedAt: null,
  submittedProposalId: null,
  title: listItem.title,
  proposer: author,
  chamber: "General Chamber",
  focus: "Basic",
  tier: "Consul",
  budget: "0 HMND",
  formationEligible: false,
  teamSlots: "0 / 0",
  milestonesPlanned: "0",
  summary: listItem.summary,
  overview: "Create a public reporting policy with readable evidence.",
  rationale:
    "Let reviewers catch mistakes before the proposal enters governance.",
  executionPlan: [
    "Publish a signed report at the end of every governance era.",
  ],
  budgetScope: "No Formation budget",
  checklist: [],
  milestones: [],
  teamLocked: [],
  openSlotNeeds: [],
  milestonesDetail: [],
  attachments: [],
  authoring: {
    kind: "project",
    presetId: "project.policy",
    proposalType: "basic",
    what: "Create a public reporting policy with readable evidence.",
    why: "Let reviewers catch mistakes before the proposal enters governance.",
    how: "Publish a signed report at the end of every governance era.",
    aboutMe: "",
    outputs: [],
    timeline: [],
    budgetItems: [],
    systemAction: {
      action: null,
      chamberId: null,
      targetAddress: null,
      title: null,
      multiplier: null,
      genesisMembers: [],
    },
  },
  publication: {
    status: "published",
    revision: 2,
    publicUrl: `/app/proposals/public-drafts/${draftId}`,
    publishedAt: listItem.publishedAt,
    publicUpdatedAt: listItem.updatedAt,
  },
  initiative: listItem.initiative,
};

async function installFixtures(page: Page) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/me") {
      await route.fulfill({ json: { authenticated: false } });
      return;
    }
    if (url.pathname === "/api/proposals/public-drafts") {
      await route.fulfill({ json: { items: [listItem] } });
      return;
    }
    if (url.pathname === `/api/proposals/public-drafts/${draftId}`) {
      await route.fulfill({ json: detail });
      return;
    }
    await route.fulfill({ json: { items: [] } });
  });
}

test("anonymous readers can discover and open a complete public draft", async ({
  page,
}) => {
  await installFixtures(page);
  await page.goto("/app/proposals/public-drafts");
  await expect(
    page.getByRole("heading", { name: "Public drafts", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(listItem.title, { exact: true })).toBeVisible();
  await page.getByRole("article").getByRole("button").click();
  await page.getByRole("link", { name: "Read draft" }).click();
  await expect(page).toHaveURL(`/app/proposals/public-drafts/${draftId}`);
  await expect(
    page.getByRole("heading", { name: listItem.title, exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(detail.overview, { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue editing" }),
  ).toHaveCount(0);
});

test("public draft owners receive one coherent action group", async ({
  page,
}) => {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/me") {
      await route.fulfill({
        json: {
          authenticated: true,
          address: author,
          gate: {
            eligible: true,
            expiresAt: "2026-07-24T20:00:00.000Z",
          },
        },
      });
      return;
    }
    if (url.pathname === `/api/proposals/public-drafts/${draftId}`) {
      await route.fulfill({ json: detail });
      return;
    }
    await route.fulfill({ json: { items: [] } });
  });

  await page.goto(`/app/proposals/public-drafts/${draftId}`);
  await expect(page.getByRole("button", { name: "Copy link" })).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Continue editing" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Unpublish" })).toBeVisible();
});

test("changing the directory query retires the previous pagination cursor", async ({
  page,
}) => {
  let mixedCursorRequest = false;
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/me") {
      await route.fulfill({ json: { authenticated: false } });
      return;
    }
    if (url.pathname === "/api/proposals/public-drafts") {
      if (url.searchParams.get("q") && url.searchParams.get("cursor")) {
        mixedCursorRequest = true;
      }
      if (url.searchParams.get("q")) {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }
      await route.fulfill({
        json: url.searchParams.get("q")
          ? { items: [] }
          : { items: [listItem], nextCursor: "cursor-from-old-query" },
      });
      return;
    }
    await route.fulfill({ json: { items: [] } });
  });

  await page.goto("/app/proposals/public-drafts");
  await expect(page.getByRole("button", { name: "Load more" })).toBeVisible();
  await page.getByLabel("Search public drafts").fill("different");
  await page.waitForTimeout(350);
  expect(await page.getByRole("button", { name: "Load more" }).count()).toBe(0);
  expect(mixedCursorRequest).toBe(false);
});

test("My Drafts keeps private and public drafts together and toggles visibility", async ({
  page,
}) => {
  const privateDraft = {
    id: "owned-private-draft",
    title: "Private policy notes",
    chamber: "General Chamber",
    tier: "Consul",
    summary: "Notes that are ready to become a public draft.",
    updated: "2026-07-24T13:00:00.000Z",
    publication: { status: "private" },
  };
  const publicDraft = {
    id: "owned-public-draft",
    title: "Published governance outline",
    chamber: "General Chamber",
    tier: "Consul",
    summary: "An owned draft that is already visible publicly.",
    updated: "2026-07-24T12:00:00.000Z",
    publication: {
      status: "published",
      revision: 2,
      publicUrl: "/app/proposals/public-drafts/owned-public-draft",
      publishedAt: "2026-07-23T12:00:00.000Z",
      publicUpdatedAt: "2026-07-24T12:00:00.000Z",
      hasUnpublishedChanges: false,
    },
  };
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/me") {
      await route.fulfill({
        json: {
          authenticated: true,
          address: author,
          gate: { eligible: true, expiresAt: "2026-08-01T00:00:00.000Z" },
        },
      });
      return;
    }
    if (url.pathname === "/api/proposals/drafts") {
      await route.fulfill({ json: { items: [privateDraft, publicDraft] } });
      return;
    }
    if (url.pathname.startsWith("/api/humans/")) {
      await route.fulfill({
        json: {
          id: author,
          name: "Draft Author",
          humanNodeActive: true,
          governor: true,
          governorActive: false,
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
    if (url.pathname === "/api/command" && request.method() === "POST") {
      const body = request.postDataJSON() as {
        type?: string;
        payload?: { draftId?: string };
      };
      if (body.type === "proposal.draft.publish") {
        await route.fulfill({
          json: {
            ok: true,
            type: body.type,
            draftId: body.payload?.draftId,
            revision: 1,
            publicUrl: `/app/proposals/public-drafts/${body.payload?.draftId}`,
            publishedAt: "2026-07-24T14:00:00.000Z",
            updatedAt: "2026-07-24T14:00:00.000Z",
          },
        });
        return;
      }
      if (body.type === "proposal.draft.unpublish") {
        await route.fulfill({
          json: {
            ok: true,
            type: body.type,
            draftId: body.payload?.draftId,
            unpublished: true,
            updatedAt: "2026-07-24T14:05:00.000Z",
          },
        });
        return;
      }
    }
    await route.fulfill({ json: { items: [] } });
  });

  await page.goto("/app/proposals/drafts");
  const authPanel = page.locator(".sidebar__auth");
  const governorRow = authPanel.locator(".sidebar__authRow", {
    has: page.getByText("Governor", { exact: true }),
  });
  const activeGovernorRow = authPanel.locator(".sidebar__authRow", {
    has: page.getByText("Active governor", { exact: true }),
  });
  await expect(governorRow.getByText("Active", { exact: true })).toBeVisible();
  await expect(
    activeGovernorRow.getByText("Not active", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(privateDraft.title, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(publicDraft.title, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Make draft public" }).click();
  await expect(
    page.getByRole("button", { name: "Make draft private" }),
  ).toHaveCount(2);

  page.once("dialog", (dialog) => void dialog.accept());
  await page
    .getByRole("button", { name: "Make draft private" })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Make draft public" }),
  ).toHaveCount(1);
});
