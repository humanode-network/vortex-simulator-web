import { expect, test, type Page } from "@playwright/test";

import type {
  PoolProposalPageDto,
  ProposalFinishedPageDto,
  ProposalStatusDto,
} from "../../src/types/api";

const proposalId = "revision-safe-policy";
const owner = "hmr1GRb1SRdDfJZmFaYh5L1RNev3dFcTVLGS2Rqqmk3Fbgj2W";
const other = "hmrNAGavT2UK35yZN9Txv7yucaH36cmztkseoqfgFTcPyfEU6";
const returnedDraftId = `draft-reconsider-${proposalId}`;

const authoring = {
  kind: "project" as const,
  presetId: "project.policy",
  proposalType: "basic",
  what: "Keep governance history while revision work continues privately.",
  why: "Reviewers need an auditable outcome and proposers need an editable copy.",
  how: "Close the live entry, create one linked draft, and resubmit through Proposal Pool.",
  aboutMe: "Policy proposer",
  outputs: [],
  timeline: [],
  budgetItems: [],
  systemAction: null,
};

const poolPage = {
  title: "Revision-safe policy",
  proposer: owner,
  proposerId: owner,
  chamber: "General Chamber",
  focus: "Basic",
  tier: "Consul",
  budget: "0 HMND",
  cooldown: "Ready",
  formationEligible: false,
  timeLeft: "2d 4h",
  teamSlots: "0 / 0",
  milestones: "0",
  upvotes: 2,
  downvotes: 0,
  attentionQuorum: 0.3,
  activeGovernors: 5,
  upvoteFloor: 1,
  rules: ["Active Governors may vote once while the pool remains open."],
  attachments: [],
  teamLocked: [],
  openSlotNeeds: [],
  milestonesDetail: [],
  summary:
    "A safe way to revise proposals without erasing their governance record.",
  overview: authoring.what,
  executionPlan: [],
  budgetScope: "No Formation budget",
  authoring,
} satisfies PoolProposalPageDto;

function statusFor(stage: "pool" | "failed"): ProposalStatusDto {
  return {
    proposalId,
    canonicalStage: stage,
    canonicalRoute:
      stage === "pool"
        ? `/app/proposals/${proposalId}/pp`
        : `/app/proposals/${proposalId}/finished`,
    ...(stage === "failed"
      ? {
          redirectReason: "returned_to_draft",
          draftReturn: {
            reason: "failed_chamber_vote" as const,
            available: true,
            draftId: returnedDraftId,
            route: `/app/proposals/new?draftId=${returnedDraftId}`,
          },
        }
      : {}),
    updatedAt: "2026-08-27T10:00:00.000Z",
  };
}

const finishedPage = {
  title: poolPage.title,
  chamber: poolPage.chamber,
  proposer: owner,
  proposerId: owner,
  terminalStage: "failed",
  resolutionKind: "ordinary_failed_vote",
  terminalLabel: "Returned after chamber vote",
  terminalSummary:
    "This proposal did not pass chamber vote. Its governance history remains here, and a private revision draft was returned to the proposer.",
  decisionRootProposalId: proposalId,
  canReconsider: true,
  reconsiderationDraftId: returnedDraftId,
  draftReturn: {
    reason: "failed_chamber_vote",
    available: true,
    draftId: returnedDraftId,
    route: `/app/proposals/new?draftId=${returnedDraftId}`,
  },
  formationEligible: false,
  budget: "0 HMND",
  timeLeft: "Ended",
  stageData: [
    {
      title: "Outcome",
      description: "Chamber vote did not pass",
      value: "Returned to private draft",
    },
  ],
  stats: [
    { label: "Budget ask", value: "0 HMND" },
    { label: "Result", value: "Returned to draft" },
  ],
  lockedTeam: [],
  openSlots: [],
  milestonesDetail: [],
  attachments: [],
  summary: poolPage.summary,
  overview: poolPage.overview,
  executionPlan: [],
  budgetScope: poolPage.budgetScope,
  authoring,
} satisfies ProposalFinishedPageDto;

async function installProposalFixtures(
  page: Page,
  input: {
    viewer: string;
    stage?: "pool" | "failed";
    onCommand?: (body: Record<string, unknown>) => void;
  },
) {
  const stage = input.stage ?? "pool";
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/me") {
      await route.fulfill({
        json: {
          authenticated: true,
          address: input.viewer,
          gate: { eligible: true, expiresAt: "2026-09-01T00:00:00.000Z" },
        },
      });
      return;
    }
    if (url.pathname.startsWith("/api/humans/")) {
      await route.fulfill({
        json: {
          id: input.viewer,
          name: "Proposal reviewer",
          humanNodeActive: true,
          governor: true,
          governorActive: true,
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
    if (url.pathname === `/api/proposals/${proposalId}/pool`) {
      await route.fulfill({ json: poolPage });
      return;
    }
    if (url.pathname === `/api/proposals/${proposalId}/finished`) {
      await route.fulfill({ json: finishedPage });
      return;
    }
    if (url.pathname === `/api/proposals/${proposalId}/status`) {
      await route.fulfill({ json: statusFor(stage) });
      return;
    }
    if (url.pathname === `/api/proposals/${proposalId}/timeline`) {
      await route.fulfill({ json: { items: [] } });
      return;
    }
    if (url.pathname === `/api/proposals/${proposalId}/threads`) {
      await route.fulfill({
        json: { proposalId, permissions: { canCreate: true }, items: [] },
      });
      return;
    }
    if (url.pathname === "/api/command" && request.method() === "POST") {
      const body = request.postDataJSON() as Record<string, unknown>;
      input.onCommand?.(body);
      await route.fulfill({
        json: {
          ok: true,
          type: "proposal.returnToDraft",
          proposalId,
          draftId: returnedDraftId,
          draftRoute: `/app/proposals/new?draftId=${returnedDraftId}`,
        },
      });
      return;
    }
    await route.fulfill({ json: { items: [] } });
  });
}

test("the proposer returns a Proposal Pool entry through an explicit confirmation", async ({
  page,
}) => {
  let command: Record<string, unknown> | null = null;
  await installProposalFixtures(page, {
    viewer: owner,
    onCommand: (body) => {
      command = body;
    },
  });

  await page.goto(`/app/proposals/${proposalId}/pp`);
  const trigger = page.getByRole("button", { name: "Return to drafts" });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog", {
    name: "Return proposal to drafts",
  });
  await expect(
    dialog.getByRole("heading", { name: "Return to drafts?" }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Existing votes and proposal history remain visible."),
  ).toBeVisible();
  await expect(
    dialog.getByText("The returned draft stays private until you publish it."),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Return to drafts" }).click();

  await expect(page).toHaveURL(`/app/proposals/new?draftId=${returnedDraftId}`);
  expect(command).toMatchObject({
    type: "proposal.returnToDraft",
    payload: { proposalId },
  });
  expect(
    (command as { idempotencyKey?: string } | null)?.idempotencyKey,
  ).toBeTruthy();
});

test("a different viewer cannot see the Proposal Pool return action", async ({
  page,
}) => {
  await installProposalFixtures(page, { viewer: other });
  await page.goto(`/app/proposals/${proposalId}/pp`);
  await expect(
    page.getByRole("button", { name: "Return to drafts" }),
  ).toHaveCount(0);
});

test("only the proposer receives the returned-draft continuation on the public outcome", async ({
  page,
}) => {
  await installProposalFixtures(page, { viewer: owner, stage: "failed" });
  await page.goto(`/app/proposals/${proposalId}/finished`);
  await expect(
    page.getByText("Returned after chamber vote", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Continue editing" }),
  ).toHaveAttribute("href", `/app/proposals/new?draftId=${returnedDraftId}`);
});

for (const theme of ["sky", "light", "night", "fire"] as const) {
  for (const width of [390, 768, 1024, 1440]) {
    test(`return controls stay contained in ${theme} at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((selectedTheme) => {
        localStorage.setItem("vortex.theme", selectedTheme);
      }, theme);
      await installProposalFixtures(page, { viewer: owner });
      await page.goto(`/app/proposals/${proposalId}/pp`);

      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const trigger = page.getByRole("button", { name: "Return to drafts" });
      await expect(trigger).toBeVisible();
      const triggerBox = await trigger.boundingBox();
      expect(triggerBox).not.toBeNull();
      expect(triggerBox!.x).toBeGreaterThanOrEqual(0);
      expect(triggerBox!.x + triggerBox!.width).toBeLessThanOrEqual(width);

      await trigger.click();
      const dialog = page.getByRole("dialog", {
        name: "Return proposal to drafts",
      });
      await expect(dialog).toBeVisible();
      const dialogBox = await dialog.boundingBox();
      expect(dialogBox).not.toBeNull();
      expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
      expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(width);

      await page.screenshot({
        path: testInfo.outputPath(
          `proposal-draft-return-${theme}-${width}.png`,
        ),
        fullPage: true,
      });
    });
  }
}
