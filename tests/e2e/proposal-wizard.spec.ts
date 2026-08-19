import { expect, test, type Locator, type Page } from "@playwright/test";

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
    overview: editableForm.what,
    rationale: editableForm.why,
    executionPlan: [],
    budgetScope: "No Formation budget",
    checklist: [],
    milestones: [],
    teamLocked: [],
    openSlotNeeds: [],
    milestonesDetail: [],
    attachments: [],
    authoring: {
      kind: "project",
      presetId: editableForm.presetId,
      proposalType: editableForm.proposalType,
      what: editableForm.what,
      why: editableForm.why,
      how: editableForm.how,
      aboutMe: editableForm.aboutMe,
      outputs: [],
      budgetItems: [],
    },
    publication: { status: "private" },
    editableForm,
  };
}

async function installApiFixtures(
  page: Page,
  options: { existingDraftDelayMs?: number } = {},
) {
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
      if (options.existingDraftDelayMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, options.existingDraftDelayMs),
        );
      }
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
          governor: true,
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
      if (body.type === "proposal.draft.publish") {
        await route.fulfill({
          json: {
            ok: true,
            type: body.type,
            draftId: "draft-e2e",
            revision: 1,
            publicUrl: "/app/proposals/public-drafts/draft-e2e",
            publishedAt: "2026-07-02T12:00:00.000Z",
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
    page.getByRole("heading", { name: "Not set", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".proposal-wizard__header-summary")).toHaveText(
    "Not set",
  );
  await expect(page.getByText("Not chosen", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/step=intent/);
}

async function openClonedWizardSession(
  page: Page,
  {
    sessionId,
    step,
    title,
  }: { sessionId: string; step: string; title: string },
) {
  await page.evaluate(
    ({ nextSessionId, nextStep, nextTitle }) => {
      const key = "vortex:proposalWizard:sessions:v2";
      const store = JSON.parse(localStorage.getItem(key) ?? "{}") as {
        sessions: Record<string, Record<string, unknown>>;
      };
      const current = Object.values(store.sessions)[0];
      if (!current) throw new Error("Expected the current wizard session.");
      store.sessions[nextSessionId] = {
        ...current,
        sessionId: nextSessionId,
        updatedAt: "2026-07-03T12:10:00.000Z",
        form: {
          ...(current.form as Record<string, unknown>),
          title: nextTitle,
        },
      };
      localStorage.setItem(key, JSON.stringify(store));
      window.history.pushState(
        {},
        "",
        `/app/proposals/new?session=${nextSessionId}&step=${nextStep}`,
      );
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    { nextSessionId: sessionId, nextStep: step, nextTitle: title },
  );
}

async function focusWithTab(page: Page, target: Locator, maxTabs = 80) {
  for (let index = 0; index < maxTabs; index += 1) {
    if (
      await target.evaluate((element) => document.activeElement === element)
    ) {
      return;
    }
    await page.keyboard.press("Tab");
  }
  throw new Error(
    `Could not reach ${await target.evaluate((element) => element.id)} with Tab.`,
  );
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
  await expect(
    page.getByRole("heading", {
      name: "Transparent governance reporting",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".proposal-wizard__header-summary")).toHaveText(
    "Publish regular governance reports.",
  );
  await page.locator("#what").fill("Create a public reporting policy.");
  await page.locator("#why").fill("Make governance decisions auditable.");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/step=plan/);
  await page
    .locator("#how")
    .fill("Publish one signed report at the end of every governance era.");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/step=review/);
  await expect(
    page.getByRole("heading", { name: "When", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Funding and team", exact: true }),
  ).toHaveCount(0);
  await page.locator("#agree-rules").check();
  await page.locator("#confirm-budget").check();
  await page.getByRole("button", { name: "Submit proposal" }).click();
  await expect(page).toHaveURL(/\/app\/proposals\/proposal-e2e\/pp$/);
});

test("Review publishes an explicit public snapshot without submitting", async ({
  page,
}) => {
  await openFreshWizard(page);
  await page.locator("#proposal-kind").selectOption("project");
  await page.locator("#proposal-type").selectOption("basic");
  await page.locator("#proposal-formation-mode").selectOption("policy");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#title").fill("Draft before governance");
  await page.locator("#chamber").selectOption("general");
  await page.locator("#summary").fill("Invite review before submission.");
  await page.locator("#what").fill("Publish a readable snapshot.");
  await page.locator("#why").fill("Catch mistakes before formal voting.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#how").fill("Review, revise, and submit separately.");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#agree-rules")).not.toBeChecked();
  await expect(page.locator("#confirm-budget")).not.toBeChecked();

  const publishRequest = page.waitForRequest((request) => {
    if (!request.url().endsWith("/api/command")) return false;
    return request.postDataJSON()?.type === "proposal.draft.publish";
  });
  await page.getByRole("button", { name: "Publish draft" }).click();
  await publishRequest;
  await expect(
    page.getByRole("button", { name: "Update public draft" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/step=review/);
});

test("submission locks draft-changing controls until the pool response returns", async ({
  page,
}) => {
  let submitSeen = false;
  const submitGate = { release: () => {} };
  const waitForSubmit = new Promise<void>((resolve) => {
    submitGate.release = resolve;
  });

  await openFreshWizard(page);
  await page.route("**/api/command", async (route) => {
    const body = route.request().postDataJSON() as { type?: string };
    if (body.type !== "proposal.submitToPool") {
      await route.fallback();
      return;
    }
    submitSeen = true;
    await waitForSubmit;
    await route.fulfill({
      json: {
        ok: true,
        type: body.type,
        proposalId: "proposal-e2e",
      },
    });
  });

  await page.locator("#proposal-kind").selectOption("project");
  await page.locator("#proposal-type").selectOption("basic");
  await page.locator("#proposal-formation-mode").selectOption("policy");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#title").fill("Submission lock policy");
  await page.locator("#chamber").selectOption("general");
  await page
    .locator("#summary")
    .fill("Keep the draft stable while submitting.");
  await page
    .locator("#what")
    .fill("Prevent navigation races during submission.");
  await page
    .locator("#why")
    .fill("A submitted draft must remain the submitted draft.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .locator("#how")
    .fill("Lock draft-changing controls until the response returns.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#agree-rules").check();
  await page.locator("#confirm-budget").check();
  await page.getByRole("button", { name: "Submit proposal" }).click();

  await expect.poll(() => submitSeen).toBe(true);
  await expect(page.getByRole("button", { name: "Save draft" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Save and exit" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Start over" })).toBeDisabled();
  await expect(
    page.locator(".proposal-wizard__progress-step").first(),
  ).toBeDisabled();

  submitGate.release();
  await expect(page).toHaveURL(/\/app\/proposals\/proposal-e2e\/pp$/);
});

test("a rejected submission cannot mutate a newly opened draft session", async ({
  page,
}) => {
  let submitSeen = false;
  const submitGate = { release: () => {} };
  const waitForSubmit = new Promise<void>((resolve) => {
    submitGate.release = resolve;
  });

  await openFreshWizard(page);
  await page.route("**/api/command", async (route) => {
    const body = route.request().postDataJSON() as { type?: string };
    if (body.type !== "proposal.submitToPool") {
      await route.fallback();
      return;
    }
    submitSeen = true;
    await waitForSubmit;
    await route.fulfill({
      status: 409,
      json: {
        error: {
          code: "draft_not_submittable",
          message: "The original draft can no longer be submitted.",
        },
      },
    });
  });

  await page.locator("#proposal-kind").selectOption("project");
  await page.locator("#proposal-type").selectOption("basic");
  await page.locator("#proposal-formation-mode").selectOption("policy");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#title").fill("Original pending submission");
  await page.locator("#chamber").selectOption("general");
  await page.locator("#summary").fill("Submit the original policy draft.");
  await page
    .locator("#what")
    .fill("Exercise the asynchronous submission path.");
  await page
    .locator("#why")
    .fill("Old responses must stay with their session.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .locator("#how")
    .fill("Open another draft before rejection returns.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#agree-rules").check();
  await page.locator("#confirm-budget").check();
  await page.getByRole("button", { name: "Submit proposal" }).click();
  await expect.poll(() => submitSeen).toBe(true);

  await openClonedWizardSession(page, {
    sessionId: "session-after-rejected-submit",
    step: "essentials",
    title: "New draft remains active",
  });

  await expect(page).toHaveURL(/session=session-after-rejected-submit/);
  await expect(page).toHaveURL(/step=essentials/);
  await expect(page.locator("#title")).toHaveValue("New draft remains active");

  submitGate.release();

  await expect(page).toHaveURL(/session=session-after-rejected-submit/);
  await expect(page).toHaveURL(/step=essentials/);
  await expect(page.locator("#title")).toHaveValue("New draft remains active");
  await expect(
    page.getByText("The original draft can no longer be submitted."),
  ).toHaveCount(0);
});

test("submission synchronizes the newest edit after an earlier save is still pending", async ({
  page,
}) => {
  const savedForms: Array<{ how?: string }> = [];
  const firstSaveGate = { release: () => {} };
  const waitForFirstSave = new Promise<void>((resolve) => {
    firstSaveGate.release = resolve;
  });
  let firstSaveSeen = false;
  let submittedDraftId: string | undefined;

  await openFreshWizard(page);
  await page.route("**/api/command", async (route) => {
    const body = route.request().postDataJSON() as {
      payload?: { draftId?: string; form?: { how?: string } };
      type?: string;
    };
    if (body.type === "proposal.draft.save") {
      savedForms.push(body.payload?.form ?? {});
      if (savedForms.length === 1) {
        firstSaveSeen = true;
        await waitForFirstSave;
      }
      await route.fulfill({
        json: {
          ok: true,
          type: body.type,
          draftId: "draft-latest-revision",
          updatedAt: "2026-07-03T12:00:00.000Z",
        },
      });
      return;
    }
    if (body.type === "proposal.submitToPool") {
      submittedDraftId = body.payload?.draftId;
      await route.fulfill({
        json: {
          ok: true,
          type: body.type,
          draftId: submittedDraftId,
          proposalId: "proposal-e2e",
        },
      });
      return;
    }
    await route.fallback();
  });

  await page.locator("#proposal-kind").selectOption("project");
  await page.locator("#proposal-type").selectOption("basic");
  await page.locator("#proposal-formation-mode").selectOption("policy");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#title").fill("Latest revision wins");
  await page.locator("#chamber").selectOption("general");
  await page.locator("#what").fill("Keep the submitted text current.");
  await page.locator("#why").fill("The server draft must match Review.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#how").fill("Original plan before save.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect.poll(() => firstSaveSeen).toBe(true);

  await page.locator("#how").fill("Final plan immediately before submit.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#agree-rules").check();
  await page.locator("#confirm-budget").check();
  await page.getByRole("button", { name: "Submit proposal" }).click();
  firstSaveGate.release();

  await expect(page).toHaveURL(/\/app\/proposals\/proposal-e2e\/pp$/);
  expect(savedForms).toHaveLength(2);
  expect(savedForms[0]?.how).toBe("Original plan before save.");
  expect(savedForms[1]?.how).toBe("Final plan immediately before submit.");
  expect(submittedDraftId).toBe("draft-latest-revision");
});

test("an ambiguous submission failure retries without rewriting the submitted draft", async ({
  page,
}) => {
  let saveCount = 0;
  const submitKeys: string[] = [];

  await openFreshWizard(page);
  await page.route("**/api/command", async (route) => {
    const request = route.request();
    const body = request.postDataJSON() as { type?: string };
    if (body.type === "proposal.draft.save") {
      saveCount += 1;
      await route.fulfill({
        json: {
          ok: true,
          type: body.type,
          draftId: "draft-ambiguous-submit",
          updatedAt: "2026-07-03T12:00:00.000Z",
        },
      });
      return;
    }
    if (body.type === "proposal.submitToPool") {
      submitKeys.push(request.headers()["idempotency-key"] ?? "");
      if (submitKeys.length === 1) {
        await route.fulfill({
          status: 503,
          json: {
            error: {
              code: "temporarily_unavailable",
              message: "Submission response was interrupted.",
            },
          },
        });
        return;
      }
      await route.fulfill({
        json: {
          ok: true,
          type: body.type,
          proposalId: "proposal-recovered-submit",
        },
      });
      return;
    }
    await route.fallback();
  });

  await page.locator("#proposal-kind").selectOption("project");
  await page.locator("#proposal-type").selectOption("basic");
  await page.locator("#proposal-formation-mode").selectOption("policy");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#title").fill("Recover uncertain submission");
  await page.locator("#chamber").selectOption("general");
  await page.locator("#summary").fill("Retry without rewriting the draft.");
  await page.locator("#what").fill("Preserve an accepted proposal command.");
  await page
    .locator("#why")
    .fill("Network failures cannot reveal commit state.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#how").fill("Replay the same idempotent submission.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#agree-rules").check();
  await page.locator("#confirm-budget").check();

  await page.getByRole("button", { name: "Submit proposal" }).click();
  await expect(
    page.getByText("Submission response was interrupted."),
  ).toBeVisible();
  expect(saveCount).toBe(1);
  expect(submitKeys).toHaveLength(1);

  await page.getByRole("button", { name: "Submit proposal" }).click();
  await expect(page).toHaveURL(
    /\/app\/proposals\/proposal-recovered-submit\/pp$/,
  );
  expect(saveCount).toBe(1);
  expect(submitKeys).toHaveLength(2);
  expect(submitKeys[0]).not.toBe("");
  expect(submitKeys[1]).toBe(submitKeys[0]);
});

test("a keyboard-only author can complete a policy proposal", async ({
  page,
}) => {
  await openFreshWizard(page);

  const kind = page.locator("#proposal-kind");
  const type = page.locator("#proposal-type");
  const mode = page.locator("#proposal-formation-mode");
  const continueButton = page.getByRole("button", { name: "Continue" });

  await focusWithTab(page, kind);
  await page.keyboard.press("ArrowDown");
  await expect(kind).toHaveValue("project");

  await focusWithTab(page, type);
  await page.keyboard.press("ArrowDown");
  await expect(type).toHaveValue("basic");

  await focusWithTab(page, mode);
  await page.keyboard.press("ArrowDown");
  await expect(mode).toHaveValue("policy");

  await focusWithTab(page, continueButton);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/step=essentials/);

  const title = page.locator("#title");
  const chamber = page.locator("#chamber");
  const summary = page.locator("#summary");
  const what = page.locator("#what");
  const why = page.locator("#why");
  await focusWithTab(page, title);
  await page.keyboard.type("Keyboard governance reporting");
  await focusWithTab(page, chamber);
  await page.keyboard.press("ArrowDown");
  await expect(chamber).toHaveValue("general");
  await focusWithTab(page, summary);
  await page.keyboard.type("A fully keyboard-authored proposal.");
  await focusWithTab(page, what);
  await page.keyboard.type("Publish a public reporting policy.");
  await focusWithTab(page, why);
  await page.keyboard.type("Make governance decisions auditable.");

  await focusWithTab(page, continueButton);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/step=plan/);

  const how = page.locator("#how");
  await focusWithTab(page, how);
  await page.keyboard.type(
    "Publish one signed report at the end of every era.",
  );
  await focusWithTab(page, continueButton);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/step=review/);

  const agreeRules = page.locator("#agree-rules");
  const confirmBudget = page.locator("#confirm-budget");
  const submit = page.getByRole("button", { name: "Submit proposal" });
  await focusWithTab(page, agreeRules);
  await page.keyboard.press("Space");
  await expect(agreeRules).toBeChecked();
  await focusWithTab(page, confirmBudget);
  await page.keyboard.press("Space");
  await expect(confirmBudget).toBeChecked();
  await focusWithTab(page, submit);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/app\/proposals\/proposal-e2e\/pp$/);
});

test("wizard announces step changes and disables smooth focus scrolling for reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const behaviors: string[] = [];
    Object.defineProperty(window, "__wizardScrollBehaviors", {
      configurable: true,
      value: behaviors,
    });
    HTMLElement.prototype.scrollIntoView = function (
      options?: boolean | ScrollIntoViewOptions,
    ) {
      if (typeof options === "object") {
        behaviors.push(options.behavior ?? "auto");
      }
    };
  });
  await openFreshWizard(page);

  const announcement = page.locator('[aria-live="polite"]').first();
  await expect(announcement).toContainText("Choose the proposal path");
  await page.locator("#proposal-kind").selectOption("project");
  await page.locator("#proposal-type").selectOption("basic");
  await page.locator("#proposal-formation-mode").selectOption("policy");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(announcement).toContainText("Define the proposal");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __wizardScrollBehaviors: string[] })
            .__wizardScrollBehaviors,
      ),
    )
    .toContain("auto");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __wizardScrollBehaviors: string[] })
            .__wizardScrollBehaviors,
      ),
    )
    .not.toContain("smooth");
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

test("narrative editor formats visible proposal prose without markup", async ({
  page,
}) => {
  await openFreshWizard(page);
  await page.locator("#proposal-kind").selectOption("project");
  await page.locator("#proposal-type").selectOption("basic");
  await page.locator("#proposal-formation-mode").selectOption("policy");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.locator("#what").fill("Publish decision evidence");
  await page.locator("#what").evaluate((editor: HTMLDivElement) => {
    const range = document.createRange();
    range.selectNodeContents(editor);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page
    .locator('button[aria-controls="what"][aria-label="Heading"]')
    .click();
  await expect(page.locator("#what h2")).toHaveText(
    "Publish decision evidence",
  );
  await expect(page.locator("#what")).not.toContainText("##");

  await page.locator("#why").fill("Keep public records readable");
  await page.locator('button[aria-controls="why"][aria-label="List"]').click();
  await expect(page.locator("#why ul li")).toHaveText(
    "Keep public records readable",
  );
  await expect(page.locator("#why ul")).toHaveCSS("list-style-type", "disc");

  await page.locator("#what").fill("Publish numbered evidence");
  await page.locator("#what").evaluate((editor: HTMLDivElement) => {
    const range = document.createRange();
    range.selectNodeContents(editor);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page
    .locator('button[aria-controls="what"][aria-label="Numbered list"]')
    .click();
  await expect(page.locator("#what ol li").first()).toHaveText(
    "Publish numbered evidence",
  );
  await expect(page.locator("#what ol")).toHaveCSS(
    "list-style-type",
    "decimal",
  );
});

test("narrative editor supports keyboard-accessible formatting and safe links", async ({
  page,
}) => {
  await openFreshWizard(page);
  await page.locator("#proposal-kind").selectOption("project");
  await page.locator("#proposal-type").selectOption("basic");
  await page.locator("#proposal-formation-mode").selectOption("policy");
  await page.getByRole("button", { name: "Continue" }).click();

  const editor = page.locator("#what");
  await editor.fill("Publish decision evidence");
  const heading = page.locator(
    'button[aria-controls="what"][aria-label="Heading"]',
  );
  await heading.focus();
  await page.keyboard.press("Enter");
  await expect(editor.locator("h2")).toHaveText("Publish decision evidence");

  await editor.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Humanode reference");
  await editor.evaluate((element: HTMLDivElement) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page.locator('button[aria-controls="what"][aria-label="Link"]').click();
  await page.getByLabel("Link URL").fill("https://humanode.io");
  await page.getByRole("button", { name: "Apply link" }).click();
  await expect(editor.locator('a[href="https://humanode.io/"]')).toHaveText(
    "Humanode reference",
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
  await page
    .getByPlaceholder("Label (e.g., GitHub, Notion)")
    .fill("Public delivery dashboard");
  await page
    .getByPlaceholder("https://…")
    .first()
    .fill("https://humanode.io/dashboard");
  await page.getByRole("button", { name: "Add role" }).click();
  await page
    .getByPlaceholder("Role title (e.g., Frontend dev)")
    .fill("Release steward");
  await page
    .getByPlaceholder("Why needed / scope")
    .fill("Coordinates milestone evidence.");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/step=funding/);
  await page.locator("#timeline-budget-0").fill("100");
  await page.locator("#timeline-budget-1").fill("200");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/step=review/);

  for (const section of [
    "Proposal path",
    "Identity",
    "Case",
    "Plan",
    "Funding and team",
    "Proposer",
    "Supporting material",
    "Confirm",
  ]) {
    await expect(page.getByRole("heading", { name: section })).toBeVisible();
  }
  await expect(page.getByText("Formation delivery").last()).toBeVisible();
  await expect(page.getByText("Public delivery dashboard")).toBeVisible();
  await expect(page.getByText("Release steward")).toBeVisible();
  await expect(
    page.locator(".proposal-wizard__workspace").getByText("300 HMND"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add link" }).click();
  await page.getByPlaceholder("Label").fill("Milestone evidence");
  await page
    .getByPlaceholder("https://...")
    .fill("https://humanode.io/evidence");
  await expect(page.getByPlaceholder("Label")).toHaveValue(
    "Milestone evidence",
  );
  await page.getByRole("button", { name: "Remove" }).last().click();
  await expect(page.getByText("No supporting material added.")).toBeVisible();
});

for (const action of [
  "chamber.create",
  "chamber.rename",
  "chamber.dissolve",
  "chamber.censure",
  "governor.censure",
] as const) {
  test(`system action ${action} follows a complete author journey`, async ({
    page,
  }) => {
    await openFreshWizard(page);

    await page.locator("#proposal-kind").selectOption("system");
    await page.locator("#proposal-type").selectOption("administrative");
    await page.locator("#proposal-preset").selectOption(`system.${action}`);
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(/step=system-change/);
    if (action === "governor.censure") {
      await page
        .locator("#target-governor-address")
        .fill("hmr1GRb1SRdDfJZmFaYh5L1RNev3dFcTVLGS2Rqqmk3Fbgj2W");
    } else {
      await page.locator("#target-chamber-id").fill("research");
    }
    if (action === "chamber.create" || action === "chamber.rename") {
      await page.locator("#target-title").fill("Research Chamber");
    }
    await page.locator("#title").fill(`${action} author journey`);
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(/step=rationale/);
    await page.locator("#how").fill("Apply and verify the system change.");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/step=review/);
    await expect(
      page.getByRole("heading", { name: "System action" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Proposal identity" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Rationale" }),
    ).toBeVisible();
  });
}

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
  await installApiFixtures(page, { existingDraftDelayMs: 300 });
  await page.goto("/app/proposals/new?draftId=draft-existing");
  await expect(page).toHaveURL(/draftId=draft-existing/);
  await expect(page).toHaveURL(/step=plan/);
  await expect(page.locator("#title")).not.toBeVisible();
  await expect(page.locator("#how")).toBeEmpty();
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

test("Start over clears unsaved reconsideration lineage", async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await installApiFixtures(page);
  await page.goto(
    "/app/proposals/new?resubmitsProposalId=proposal-root-decision",
  );
  await expect(page).toHaveURL(/resubmitsProposalId=proposal-root-decision/);

  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Start over" }).click();

  await expect(page).not.toHaveURL(/resubmitsProposalId=/);
  await expect(
    page.getByText(/reconsideration of decision lineage/),
  ).toHaveCount(0);
  await expect(page.getByText("Not chosen", { exact: true })).toBeVisible();
});

test("late hydration cannot replace the currently selected server draft", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.clear());
  await installApiFixtures(page);
  await page.goto("/app/proposals/new?draftId=draft-stale");
  await expect(
    page.getByRole("heading", { name: "Not set", exact: true }),
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
  await expect(
    page.getByRole("heading", { name: "Existing policy draft", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Stale response")).not.toBeVisible();
});

test("browser history restores the local wizard session named in the URL", async ({
  page,
}) => {
  await openFreshWizard(page);
  await expect(page).toHaveURL(/session=/);
  const firstSessionPath =
    new URL(page.url()).pathname + new URL(page.url()).search;
  await openClonedWizardSession(page, {
    sessionId: "session-history-other",
    step: "intent",
    title: "History session title",
  });

  await expect(page).toHaveURL(/session=session-history-other/);
  await expect(
    page.getByRole("heading", {
      name: "History session title",
      exact: true,
    }),
  ).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(
    new RegExp(firstSessionPath.replace(/[?]/g, "\\?")),
  );
  await expect(
    page.getByRole("complementary", { name: "Proposal summary" }),
  ).toContainText("Not set");
});

test("an expired browser session link starts a fresh isolated draft", async ({
  page,
}) => {
  await openFreshWizard(page);
  await page.locator("#proposal-kind").selectOption("project");
  await page.locator("#proposal-type").selectOption("basic");
  await page.locator("#proposal-formation-mode").selectOption("policy");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#title").fill("Draft kept for recovery");

  await page.evaluate(() => {
    window.history.pushState(
      {},
      "",
      "/app/proposals/new?session=expired-session-from-another-device&step=review",
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await expect(page).not.toHaveURL(/expired-session-from-another-device/);
  await expect(page).toHaveURL(/step=intent/);
  await expect(page.getByText("Not chosen", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Proposal summary" }),
  ).toContainText("Not set");
  await expect(page.locator(".proposal-wizard__recovery")).toContainText(
    "Draft kept for recovery",
  );
});

test("a delayed save only synchronizes the session that started it", async ({
  page,
}) => {
  let saveSeen = false;
  const saveGate = { release: () => {} };
  const waitForSave = new Promise<void>((resolve) => {
    saveGate.release = resolve;
  });

  await openFreshWizard(page);
  await page.route("**/api/command", async (route) => {
    const body = route.request().postDataJSON() as { type?: string };
    if (body.type !== "proposal.draft.save") {
      await route.fallback();
      return;
    }
    saveSeen = true;
    await waitForSave;
    await route.fulfill({
      json: {
        ok: true,
        type: body.type,
        draftId: "draft-delayed-session",
        updatedAt: "2026-07-03T12:00:00.000Z",
      },
    });
  });
  await page.locator("#proposal-kind").selectOption("project");
  await page.locator("#proposal-type").selectOption("basic");
  await page.locator("#proposal-formation-mode").selectOption("policy");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#title").fill("First draft waiting to save");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect.poll(() => saveSeen).toBe(true);

  await openClonedWizardSession(page, {
    sessionId: "session-delayed-save-target",
    step: "essentials",
    title: "Second draft stays active",
  });

  await expect(page).toHaveURL(/session=session-delayed-save-target/);
  await expect(page.locator("#title")).toHaveValue("Second draft stays active");
  saveGate.release();

  await expect(page.locator("#title")).toHaveValue("Second draft stays active");
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const key = "vortex:proposalWizard:sessions:v2";
        const store = JSON.parse(localStorage.getItem(key) ?? "{}") as {
          sessions: Record<
            string,
            { draftId?: string; form?: { title?: string } }
          >;
        };
        return Object.values(store.sessions).some(
          (session) =>
            session.draftId === "draft-delayed-session" &&
            session.form?.title === "First draft waiting to save",
        );
      }),
    )
    .toBe(true);
});

test("Save and exit cannot redirect a session opened while saving", async ({
  page,
}) => {
  let saveSeen = false;
  const saveGate = { release: () => {} };
  const waitForSave = new Promise<void>((resolve) => {
    saveGate.release = resolve;
  });

  await openFreshWizard(page);
  await page.route("**/api/command", async (route) => {
    const body = route.request().postDataJSON() as { type?: string };
    if (body.type !== "proposal.draft.save") {
      await route.fallback();
      return;
    }
    saveSeen = true;
    await waitForSave;
    await route.fulfill({
      json: {
        ok: true,
        type: body.type,
        draftId: "draft-delayed-save-and-exit",
        updatedAt: "2026-07-03T12:15:00.000Z",
      },
    });
  });

  await page.getByRole("button", { name: "Save and exit" }).click();
  await expect.poll(() => saveSeen).toBe(true);
  await openClonedWizardSession(page, {
    sessionId: "session-after-save-and-exit",
    step: "intent",
    title: "New session avoids old redirect",
  });
  await expect(page).toHaveURL(/session=session-after-save-and-exit/);

  saveGate.release();

  await expect(page).toHaveURL(/session=session-after-save-and-exit/);
  await expect(page).toHaveURL(/step=intent/);
  await expect(
    page.getByRole("heading", {
      name: "New session avoids old redirect",
      exact: true,
    }),
  ).toBeVisible();
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

test("Save and exit does not route an unsynced first draft to server-only Drafts", async ({
  page,
}) => {
  await openFreshWizard(page);
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

  await page.getByRole("button", { name: "Save and exit" }).click();
  await expect(page).toHaveURL(/\/app\/proposals$/);
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
