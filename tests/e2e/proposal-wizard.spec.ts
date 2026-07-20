import { expect, test, type Page } from "@playwright/test";

const address = "hmr1GRb1SRdDfJZmFaYh5L1RNev3dFcTVLGS2Rqqmk3Fbgj2W";

const existingDraftForm = {
  templateId: "project" as const,
  presetId: "project.policy",
  formationEligible: false,
  title: "Existing policy draft",
  chamberId: "general",
  summary: "A saved policy draft.",
  what: "Publish a governance policy.",
  why: "Keep governance work auditable.",
  how: "",
  proposalType: "basic" as const,
  timeline: [],
  outputs: [],
  openSlotNeeds: [],
  budgetItems: [],
  aboutMe: "",
  attachments: [],
  agreeRules: false,
  confirmBudget: false,
};

function draftDetail(id: string, editableForm: typeof existingDraftForm) {
  return {
    id,
    submittedAt: null,
    submittedProposalId: null,
    title: editableForm.title,
    proposer: address,
    chamber: "General Chamber",
    focus: "Basic",
    tier: "Consul",
    budget: "0 HMND",
    formationEligible: false,
    teamSlots: "0",
    milestonesPlanned: "0",
    summary: editableForm.summary,
    rationale: editableForm.why,
    budgetScope: "No Formation budget",
    checklist: [],
    milestones: [],
    teamLocked: [],
    openSlotNeeds: [],
    milestonesDetail: [],
    attachments: [],
    editableForm,
  };
}

async function installApiFixtures(page: Page) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/me") {
      await route.fulfill({
        json: {
          authenticated: true,
          address,
          gate: {
            eligible: true,
            expiresAt: "2026-07-03T00:00:00.000Z",
          },
        },
      });
      return;
    }
    if (path === "/api/chambers") {
      await route.fulfill({
        json: {
          items: [
            {
              id: "general",
              name: "General Chamber",
              multiplier: 1.25,
              stats: { governors: "8", acm: "12000", mcm: "9000", lcm: "7200" },
              pipeline: { pool: 2, vote: 1, build: 1 },
            },
            {
              id: "protocol-research",
              name: "Protocol Research and Cryptobiometric Infrastructure",
              multiplier: 1.6,
              stats: { governors: "5", acm: "8000", mcm: "6000", lcm: "3750" },
              pipeline: { pool: 1, vote: 1, build: 0 },
            },
          ],
        },
      });
      return;
    }
    if (path === "/api/my-governance") {
      await route.fulfill({
        json: {
          tier: {
            tier: "Consul",
            nextTier: null,
            metrics: {
              governorEras: 4,
              activeEras: 3,
              acceptedProposals: 6,
              formationParticipation: 3,
            },
            requirements: null,
          },
        },
      });
      return;
    }
    if (path === "/api/initiatives") {
      await route.fulfill({
        json: {
          items: [
            {
              id: "initiative-governance-observatory",
              slug: "governance-observatory",
              title:
                "Governance Observatory and Long-Term Collusion Analysis Initiative",
              summary: "Study voting behavior.",
              description: "Study voting behavior.",
              visibility: "public",
              status: "active",
              tags: ["governance"],
              createdByAddress: address,
              createdAt: "2026-07-01T00:00:00.000Z",
              updatedAt: "2026-07-02T00:00:00.000Z",
              admins: [address],
              stewards: [],
              memberCount: 1,
              viewerRole: "admin",
              viewerCanAdmin: true,
              viewerCanSteward: true,
            },
          ],
        },
      });
      return;
    }
    if (path === "/api/proposals/drafts/draft-existing") {
      await route.fulfill({
        json: draftDetail("draft-existing", existingDraftForm),
      });
      return;
    }
    if (path === "/api/proposals/drafts/draft-stale") {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        json: draftDetail("draft-stale", {
          ...existingDraftForm,
          title: "Stale response",
        }),
      });
      return;
    }
    if (path.startsWith("/api/humans/")) {
      await route.fulfill({
        json: {
          id: address,
          name: "Test Governor",
          governorActive: true,
          humanNodeActive: true,
          governanceSummary: "",
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
    if (path === "/api/command" && request.method() === "POST") {
      const body = request.postDataJSON() as { type?: string };
      if (body.type === "proposal.draft.save") {
        await route.fulfill({
          json: {
            ok: true,
            type: body.type,
            draftId: "draft-e2e",
            updatedAt: "2026-07-02T12:00:00.000Z",
          },
        });
        return;
      }
      if (body.type === "proposal.submitToPool") {
        await route.fulfill({
          json: {
            ok: true,
            type: body.type,
            proposalId: "proposal-e2e",
          },
        });
        return;
      }
    }
    await route.fulfill({ json: { items: [] } });
  });
}

async function openFreshWizard(
  page: Page,
  theme = "night",
  legacyStep?: string,
  legacyDraft?: Record<string, unknown>,
) {
  await page.addInitScript(
    ({ nextTheme, nextLegacyStep, nextLegacyDraft }) => {
      if (sessionStorage.getItem("phase91-fixture-ready")) return;
      sessionStorage.setItem("phase91-fixture-ready", "true");
      localStorage.clear();
      localStorage.setItem("vortex.theme", nextTheme);
      if (nextLegacyStep) {
        localStorage.setItem("vortex:proposalCreation:step", nextLegacyStep);
      }
      if (nextLegacyDraft) {
        localStorage.setItem(
          "vortex:proposalCreation:draft",
          JSON.stringify(nextLegacyDraft),
        );
        localStorage.setItem(
          "vortex:proposalCreation:preset",
          "project.policy",
        );
        localStorage.setItem("vortex:proposalCreation:template", "project");
      }
    },
    {
      nextTheme: theme,
      nextLegacyStep: legacyStep,
      nextLegacyDraft: legacyDraft,
    },
  );
  await installApiFixtures(page);
  await page.goto("/app/proposals/new");
  await expect(
    page.getByRole("heading", { name: "Proposal Wizard" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/step=intent/);
}

test("fresh entry ignores legacy Review state and completes policy submission", async ({
  page,
}) => {
  await openFreshWizard(page, "night", "review");

  await page.locator("#proposal-kind").selectOption("project");
  await page.locator("#proposal-type").selectOption("basic");
  await page.locator("#proposal-formation-mode").selectOption("policy");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/step=essentials/);
  await page.locator("#title").fill("Transparent governance reporting");
  await page.locator("#chamber").selectOption("general");
  await page
    .locator("#proposal-initiative")
    .selectOption("initiative-governance-observatory");
  await page.locator("#summary").fill("Publish regular governance reports.");
  await page.locator("#what").fill("Create a public reporting policy.");
  await page.locator("#why").fill("Make governance decisions auditable.");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/step=plan/);
  await page
    .locator("#how")
    .fill("Publish one signed report at the end of every governance era.");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/step=review/);
  await page.locator("#agree-rules").check();
  await page.locator("#confirm-budget").check();
  await page.getByRole("button", { name: "Submit proposal" }).click();
  await expect(page).toHaveURL(/\/app\/proposals\/proposal-e2e\/pp$/);
});

test("future steps remain locked until their requirements are complete", async ({
  page,
}) => {
  await openFreshWizard(page);
  const review = page.getByRole("button", { name: /Review/ });
  await expect(review).toBeDisabled();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#proposal-kind")).toBeFocused();
  await expect(page).toHaveURL(/step=intent/);
});

test("narrative editor formats selected proposal prose", async ({ page }) => {
  await openFreshWizard(page);
  await page.locator("#proposal-kind").selectOption("project");
  await page.locator("#proposal-type").selectOption("basic");
  await page.locator("#proposal-formation-mode").selectOption("policy");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.locator("#what").fill("Publish decision evidence");
  await page.locator("#what").evaluate((textarea: HTMLTextAreaElement) => {
    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);
  });
  await page
    .locator('button[aria-controls="what"][aria-label="Heading"]')
    .click();
  await expect(page.locator("#what")).toHaveValue(
    "## Publish decision evidence",
  );

  await page.locator("#why").fill("Keep public records readable");
  await page.locator("#why").evaluate((textarea: HTMLTextAreaElement) => {
    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);
  });
  await page.locator('button[aria-controls="why"][aria-label="List"]').click();
  await expect(page.locator("#why")).toHaveValue(
    "- Keep public records readable",
  );
});

test("Formation uses a dedicated funding step before Review", async ({
  page,
}) => {
  await openFreshWizard(page);

  await page.locator("#proposal-kind").selectOption("project");
  await page.locator("#proposal-type").selectOption("basic");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#title").fill("Formation delivery");
  await page.locator("#chamber").selectOption("general");
  await page.locator("#what").fill("Deliver a governed public artifact.");
  await page.locator("#why").fill("The work requires staged execution.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#how").fill("Complete and verify both milestones.");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/step=funding/);
  await page.locator("#timeline-budget-0").fill("100");
  await page.locator("#timeline-budget-1").fill("200");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/step=review/);
});

test("system changes follow action and rationale steps", async ({ page }) => {
  await openFreshWizard(page);

  await page.locator("#proposal-kind").selectOption("system");
  await page.locator("#proposal-type").selectOption("administrative");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/step=system-change/);
  await page.locator("#target-chamber-id").fill("research");
  await page.locator("#target-title").fill("Research Chamber");
  await page.locator("#title").fill("Create Research Chamber");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/step=rationale/);
  await page.locator("#how").fill("Create the chamber and verify membership.");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/step=review/);
});

test("legacy recovery ignores the old global step and resumes incomplete work", async ({
  page,
}) => {
  await openFreshWizard(page, "light", "review", existingDraftForm);

  const recovery = page.locator(".proposal-wizard__recovery");
  await expect(recovery).toContainText("Existing policy draft");
  await recovery.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/step=plan/);
  await expect(
    page.getByRole("heading", { name: "Explain the plan" }),
  ).toBeFocused();
});

test("server draft links hydrate into their first incomplete step", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("vortex.theme", "sky");
  });
  await installApiFixtures(page);
  await page.goto("/app/proposals/new?draftId=draft-existing");
  await expect(page).toHaveURL(/draftId=draft-existing/);
  await expect(page).toHaveURL(/step=plan/);
  await expect(page.locator("#title")).not.toBeVisible();
  await expect(page.locator("#how")).toHaveValue("");
});

test("reconsideration entry keeps its decision lineage visible", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.clear());
  await installApiFixtures(page);
  await page.goto(
    "/app/proposals/new?resubmitsProposalId=proposal-root-decision",
  );
  await expect(page).toHaveURL(/resubmitsProposalId=proposal-root-decision/);
  await expect(
    page.getByText(/reconsideration of decision lineage/),
  ).toContainText("proposal-root-decision");
});

test("Start over preserves an existing server draft", async ({ page }) => {
  let deleteRequests = 0;
  await page.addInitScript(() => localStorage.clear());
  await installApiFixtures(page);
  page.on("request", (request) => {
    if (request.url().endsWith("/api/command") && request.postData()) {
      const body = request.postDataJSON() as { type?: string };
      if (body.type === "proposal.draft.delete") deleteRequests += 1;
    }
  });
  await page.goto("/app/proposals/new?draftId=draft-existing");
  await expect(page).toHaveURL(/draftId=draft-existing/);
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page).toHaveURL(/step=intent/);
  await expect(page).not.toHaveURL(/draftId=/);
  expect(deleteRequests).toBe(0);
});

test("late hydration cannot replace the currently selected server draft", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.clear());
  await installApiFixtures(page);
  await page.goto("/app/proposals/new?draftId=draft-stale");
  await expect(
    page.getByRole("heading", { name: "Proposal Wizard" }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.history.pushState(
      {},
      "",
      "/app/proposals/new?draftId=draft-existing",
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page).toHaveURL(/draftId=draft-existing/);
  await expect(page).toHaveURL(/step=plan/);
  await page.waitForTimeout(550);
  await expect(page.getByText("Existing policy draft")).toBeVisible();
  await expect(page.getByText("Stale response")).not.toBeVisible();
});

test("failed synchronization keeps a refresh-safe local session", async ({
  page,
}) => {
  await openFreshWizard(page);
  await page.locator("#proposal-kind").selectOption("project");
  await page.locator("#proposal-type").selectOption("basic");
  await page.locator("#proposal-formation-mode").selectOption("policy");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#title").fill("Locally safe policy");

  await page.route("**/api/command", async (route) => {
    const body = route.request().postDataJSON() as { type?: string };
    if (body.type !== "proposal.draft.save") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 503,
      json: {
        error: {
          code: "temporarily_unavailable",
          message: "Temporary synchronization outage",
        },
      },
    });
  });
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Local copy safe")).toBeVisible();
  await expect(
    page.getByText(/Temporary synchronization outage/),
  ).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/step=essentials/);
  await expect(page.locator("#title")).toHaveValue("Locally safe policy");
});

const themes = ["sky", "light", "night", "fire"] as const;
const viewports = [
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 900 },
  { name: "1440", width: 1440, height: 1000 },
] as const;

for (const theme of themes) {
  for (const viewport of viewports) {
    test(`visual shell ${theme} ${viewport.name}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await openFreshWizard(page, theme);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.locator(".proposal-wizard__workspace")).toBeVisible();
      const screenshot = await page.screenshot({
        fullPage: true,
        animations: "disabled",
        caret: "hide",
      });
      expect(screenshot.byteLength).toBeGreaterThan(10_000);
      await testInfo.attach(`proposal-wizard-${theme}-${viewport.name}.png`, {
        body: screenshot,
        contentType: "image/png",
      });
    });
  }
}
