import { expect, test, type Page, type Route } from "@playwright/test";
import type { FormationApplication } from "../../src/lib/api/formationApplications";

const proposer = "formation-test-proposer";
const applicant = "formation-test-applicant";
const projectId = "admission-test-project";
const limits = {
  statementMin: 20,
  statementMax: 20000,
  reasonMax: 2000,
};
function application(id = "application-one"): FormationApplication {
  return {
    id,
    proposalId: projectId,
    applicantAddress: applicant,
    role: "Research and documentation",
    statement:
      "## Contribution\n\n- Document findings\n- Test deliverables\n\n1. Research\n2. Review",
    status: "pending",
    revision: 1,
    createdAt: "2026-09-24T10:00:00.000Z",
    updatedAt: "2026-09-24T10:00:00.000Z",
    resolvedAt: null,
    resolvedByAddress: null,
    resolutionReason: null,
  };
}
async function fixtures(
  page: Page,
  viewer: string,
  initial: FormationApplication[],
) {
  page.on("pageerror", (error) => {
    console.error("Browser error:", error.message);
  });
  let applications = initial;
  let members = 1 + initial.filter((row) => row.status === "accepted").length;
  const commands: Record<string, unknown>[] = [];
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path === "/api/me")
      return route.fulfill({
        json: {
          authenticated: true,
          address: viewer,
          gate: { eligible: true, expiresAt: "2099-01-01T00:00:00.000Z" },
        },
      });
    if (path === "/api/my-governance")
      return route.fulfill({
        json: { myChamberIds: [], opportunityAccounting: { items: [] } },
      });
    if (path.startsWith("/api/humans/"))
      return route.fulfill({ json: { governorActive: false } });
    if (path === "/api/formation/applications") {
      const items = applications.filter(
        (row) =>
          (!url.searchParams.get("proposalId") ||
            row.proposalId === url.searchParams.get("proposalId")) &&
          (!url.searchParams.get("status") ||
            row.status === url.searchParams.get("status")),
      );
      return route.fulfill({
        json: {
          items: items.map((row) => ({
            application: row,
            proposalTitle:
              "A collaborative research project with a long and readable title",
          })),
          nextCursor: null,
          pendingCount: applications.filter((row) => row.status === "pending")
            .length,
          limits,
        },
      });
    }
    if (path.startsWith("/api/formation/applications/team/"))
      return route.fulfill({
        json: {
          isProposer: viewer === proposer,
          members:
            members > 1
              ? [
                  {
                    membershipId: "membership-one",
                    address: applicant,
                    role: "Researcher",
                    joinedAt: "2026-09-24T00:00:00Z",
                    canLeave: viewer === applicant,
                    canRemove: viewer === proposer,
                  },
                ]
              : [],
        },
      });
    if (path.startsWith("/api/formation/applications/"))
      return route.fulfill({
        json: {
          application: applications.find(
            (row) => row.id === path.split("/").pop(),
          ),
          proposalTitle: "Research project",
          proposerAddress: proposer,
        },
      });
    if (path === "/api/command") {
      const body = route.request().postDataJSON();
      commands.push(body);
      if (
        body.type === "formation.team.leave" ||
        body.type === "formation.team.remove"
      ) {
        members--;
        return route.fulfill({
          json: {
            ok: true,
            membershipId: body.payload.membershipId,
            status: body.type.endsWith("leave") ? "left" : "removed",
          },
        });
      }
      let result: FormationApplication;
      if (body.type === "formation.application.submit") {
        result = {
          ...application(`application-${applications.length + 1}`),
          statement: body.payload.statement,
          role: body.payload.role ?? null,
        };
        applications.push(result);
      } else {
        result = applications.find(
          (row) => row.id === body.payload.applicationId,
        )!;
        result.status =
          body.type === "formation.application.withdraw"
            ? "withdrawn"
            : body.payload.decision === "accept"
              ? "accepted"
              : "declined";
        result.revision++;
        if (result.status === "accepted") members++;
      }
      return route.fulfill({ json: { ok: true, application: result } });
    }
    if (path === `/api/proposals/${projectId}/formation`)
      return route.fulfill({
        json: {
          title: "Research project",
          chamber: "General Chamber",
          proposer,
          proposerId: proposer,
          projectState: "active",
          pendingMilestoneIndex: null,
          nextMilestoneIndex: 1,
          budget: "10 HMND",
          timeLeft: "7 days",
          teamSlots: `${members} / 3`,
          milestones: "0 / 2",
          progress: "0%",
          stageData: [],
          stats: [],
          lockedTeam: [],
          openSlots: [
            { title: "Researcher", desc: "Documentation and testing" },
          ],
          milestonesDetail: [],
          attachments: [],
          viewer: {
            isProposer: viewer === proposer,
            isTeamMember: viewer === proposer || members > 1,
            canJoin: viewer !== proposer && members === 1,
            canSubmitMilestone: false,
          },
          summary: "Collaborative research",
          overview: "Research",
          executionPlan: [],
          budgetScope: "Research budget",
          authoring: {
            kind: "project",
            what: "Research",
            why: "Shared knowledge",
            how: "Open review",
            outputs: [],
            timeline: [],
            budgetItems: [],
            systemAction: null,
          },
        },
      });
    if (path.endsWith("/status"))
      return route.fulfill({
        json: { proposalId: projectId, canonicalStage: "build" },
      });
    return route.fulfill({
      json: { items: [], threads: [], permissions: { canCreate: false } },
    });
  });
  return {
    commands,
    getMembers: () => members,
    setViewer: (address: string) => {
      viewer = address;
    },
  };
}
test("wallet switch refreshes Formation permissions without reloading the page", async ({
  page,
}) => {
  await page.clock.install();
  const state = await fixtures(page, proposer, []);
  await page.goto(`/app/proposals/${projectId}/formation`);
  await expect(page.getByText("No applications yet.")).toBeVisible();
  state.setViewer(applicant);
  await page.clock.fastForward(60_001);
  await expect(page.locator("#formation-apply-form")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Apply to join" }),
  ).toBeEnabled();
  await expect(page.getByRole("button", { name: "Submit M1" })).toHaveCount(0);
});

test("a delayed private list cannot repopulate the page after a wallet switch", async ({
  page,
}) => {
  await page.clock.install();
  const state = await fixtures(page, proposer, []);
  let delayed: Route | undefined;
  let first = true;
  await page.route("**/api/formation/applications?*", (route) => {
    if (first) {
      first = false;
      delayed = route;
      return;
    }
    return route.fulfill({
      json: { items: [], pendingCount: 0, nextCursor: null, limits },
    });
  });
  await page.goto(`/app/proposals/${projectId}/formation`);
  await expect.poll(() => Boolean(delayed)).toBe(true);
  state.setViewer(applicant);
  await page.clock.fastForward(60_001);
  await expect(page.locator("#formation-apply-form")).toBeVisible();
  const response = page.waitForResponse(
    (res) =>
      res.url().includes("/api/formation/applications?") &&
      res.status() === 200,
  );
  await delayed!.fulfill({
    json: {
      items: [
        {
          application: {
            ...application(),
            statement: "Private old-wallet application statement",
          },
          proposalTitle: "Research project",
        },
      ],
      pendingCount: 1,
      nextCursor: null,
      limits,
    },
  });
  await response;
  await expect(
    page.getByText("Private old-wallet application statement"),
  ).toHaveCount(0);
  await expect(page.getByText("No applications yet.")).toBeVisible();
  await expect(page.locator("#formation-apply-form")).toBeVisible();
});

test("Refresh team recovers project controls after a saved departure refresh fails", async ({
  page,
}) => {
  const state = await fixtures(page, applicant, [
    { ...application(), status: "accepted" },
  ]);
  await page.goto(`/app/proposals/${projectId}/formation`);
  await page.getByRole("button", { name: "Leave team", exact: true }).click();
  const projectUrl = `**/api/proposals/${projectId}/formation`;
  await page.route(projectUrl, (route) =>
    route.fulfill({
      status: 503,
      json: { error: { message: "Temporarily unavailable" } },
    }),
  );
  await page.getByRole("button", { name: "Confirm leave" }).click();
  await expect(
    page.getByText("Departure saved. Refresh to update the project."),
  ).toBeVisible();
  expect(state.getMembers()).toBe(1);
  await page.unroute(projectUrl);
  await page.getByRole("button", { name: "Refresh team" }).click();
  await expect(page.locator("#formation-apply-form")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Apply to join" }),
  ).toBeEnabled();
});

test("pending applicant action opens the current application", async ({
  page,
}) => {
  await fixtures(page, applicant, [application()]);
  await page.goto(`/app/proposals/${projectId}/formation`);
  const action = page.getByRole("button", { name: "View application" });
  await expect(action).toBeEnabled();
  await action.click();
  await expect(page.locator("#formation-current-application")).toBeInViewport();
  await expect(page.locator("#formation-apply-form")).toHaveCount(0);
});

test("reapplication form precedes a long resolved history", async ({
  page,
}) => {
  const history = Array.from({ length: 25 }, (_, index) => ({
    ...application(`resolved-${index}`),
    status: "withdrawn" as const,
  }));
  await fixtures(page, applicant, history);
  await page.setViewportSize({ width: 390, height: 780 });
  await page.goto(`/app/proposals/${projectId}/formation`);
  const form = page.locator("#formation-apply-form");
  await expect(form).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Apply to join" }),
  ).toBeEnabled();
  await expect(
    page
      .locator("#formation-apply-form + section")
      .getByText("Team applications"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Apply to join" }).click();
  await expect(form).toBeInViewport();
});

test("successful application keeps the pending action when refresh fails", async ({
  page,
}) => {
  await fixtures(page, applicant, []);
  await page.goto(`/app/proposals/${projectId}/formation`);
  await expect(page.locator("#formation-apply-form")).toBeVisible();
  await page
    .getByRole("combobox", { name: "Role", exact: true })
    .selectOption("Researcher");
  await page
    .getByRole("textbox", { name: "How would you contribute?" })
    .fill("I will document and test each milestone.");
  await page.route("**/api/formation/applications?*", (route) =>
    route.fulfill({ status: 503, json: { error: { message: "Unavailable" } } }),
  );
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(
    page.getByRole("button", { name: "View application" }),
  ).toBeEnabled();
  await expect(page.locator("#formation-current-application")).toBeVisible();
  await expect(page.locator("#formation-apply-form")).toHaveCount(0);
});

test("applicant submits a formatted candidacy and can withdraw without joining", async ({
  page,
}) => {
  const state = await fixtures(page, applicant, []);
  await page.goto(`/app/proposals/${projectId}/formation`);
  await expect(
    page.getByRole("button", { name: "Submit application" }),
  ).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Role", exact: true })
    .selectOption("Researcher");
  await page
    .getByRole("textbox", { name: "How would you contribute?" })
    .fill("I will research, document and test this project.");
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(
    page.getByText("Application submitted. The proposer will review it."),
  ).toBeVisible();
  expect(state.getMembers()).toBe(1);
  expect(state.commands[0].payload).toMatchObject({ role: "Researcher" });
  await page.getByRole("button", { name: "Withdraw application" }).click();
  await page.getByRole("button", { name: "Confirm withdraw" }).click();
  await expect(
    page.getByText("Application withdrawn.", { exact: true }),
  ).toBeVisible();
  expect(state.commands.map((command) => command.type)).toEqual([
    "formation.application.submit",
    "formation.application.withdraw",
  ]);
  await page
    .getByRole("textbox", { name: "How would you contribute?" })
    .fill("I will research, document and test this project.");
  await page
    .getByRole("combobox", { name: "Role", exact: true })
    .selectOption("Researcher");
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(
    page.getByText("Application submitted. The proposer will review it."),
  ).toBeVisible();
  expect(state.commands[2].idempotencyKey).not.toBe(
    state.commands[0].idempotencyKey,
  );
  expect(state.getMembers()).toBe(1);
});

test("submission locks the rich-text draft until the request finishes", async ({
  page,
}) => {
  await fixtures(page, applicant, []);
  let pending: Route | undefined;
  await page.route("**/api/command", (route) => {
    pending = route;
  });
  await page.goto(`/app/proposals/${projectId}/formation`);
  const editor = page.getByRole("textbox", {
    name: "How would you contribute?",
  });
  const text = "I will research and document the project deliverables.";
  await page
    .getByRole("combobox", { name: "Role", exact: true })
    .selectOption("Researcher");
  await editor.fill(text);
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect.poll(() => Boolean(pending)).toBe(true);
  await expect(editor).toHaveAttribute("contenteditable", "false");
  await expect(
    page.getByRole("button", { name: "Heading", exact: true }),
  ).toBeDisabled();
  await pending!.fulfill({
    status: 503,
    json: { error: { message: "Temporary test failure" } },
  });
  await expect(editor).toHaveAttribute("contenteditable", "true");
  await expect(editor).toHaveText(text);
});

test("eligibility expiry locks the rich-text draft without losing it", async ({
  page,
}) => {
  await page.clock.install();
  await fixtures(page, applicant, []);
  await page.goto(`/app/proposals/${projectId}/formation`);
  const editor = page.getByRole("textbox", {
    name: "How would you contribute?",
  });
  const text = "I will research and document the project deliverables.";
  await editor.fill(text);
  await page.route("**/api/me", (route) =>
    route.fulfill({
      json: {
        authenticated: true,
        address: applicant,
        gate: { eligible: false },
      },
    }),
  );
  await page.clock.fastForward(60001);
  await expect(
    page.getByText("An active Human Node is required to apply."),
  ).toBeVisible();
  await expect(editor).toHaveAttribute("contenteditable", "false");
  await expect(editor).toHaveText(text);
  await page.unroute("**/api/me");
  await page.clock.fastForward(60001);
  await expect(editor).toHaveAttribute("contenteditable", "true");
  await expect(editor).toHaveText(text);
});

for (const scenario of [
  {
    viewer: proposer,
    status: "pending",
    action: "Accept",
    group: "Confirm application decision",
  },
  {
    viewer: proposer,
    status: "pending",
    action: "Decline",
    group: "Confirm application decision",
  },
  {
    viewer: applicant,
    status: "pending",
    action: "Withdraw application",
    group: "Confirm application decision",
  },
  {
    viewer: proposer,
    status: "accepted",
    action: "Remove member",
    group: "Confirm team departure",
  },
  {
    viewer: applicant,
    status: "accepted",
    action: "Leave team",
    group: "Confirm team departure",
  },
] as const) {
  test(`cancel ${scenario.action} leaves the application and team unchanged`, async ({
    page,
  }) => {
    const state = await fixtures(page, scenario.viewer, [
      { ...application(), status: scenario.status },
    ]);
    await page.goto(`/app/proposals/${projectId}/formation`);
    await page
      .getByRole("button", { name: scenario.action, exact: true })
      .click();
    const confirmation = page.getByRole("group", { name: scenario.group });
    await confirmation
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    await expect(confirmation).toHaveCount(0);
    expect(state.commands).toHaveLength(0);
    expect(state.getMembers()).toBe(scenario.status === "accepted" ? 2 : 1);
    await expect(
      page.getByRole("button", { name: scenario.action, exact: true }),
    ).toBeEnabled();
  });
}

test("failed submission preserves form content and retries with the same receipt", async ({
  page,
}) => {
  const state = await fixtures(page, applicant, []);
  const attempts: Array<{ idempotencyKey: string }> = [];
  await page.route("**/api/command", (route) => {
    attempts.push(route.request().postDataJSON());
    return route.fulfill({
      status: 503,
      json: { error: { message: "Test submission unavailable" } },
    });
  });
  await page.goto(`/app/proposals/${projectId}/formation`);
  const role = page.getByRole("combobox", { name: "Role", exact: true });
  const statement = page.getByRole("textbox", {
    name: "How would you contribute?",
  });
  const text = "I will research, document and test this project.";
  await role.selectOption("Researcher");
  await statement.fill(text);
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Test submission unavailable",
  );
  await expect(role).toHaveValue("Researcher");
  await expect(statement).toHaveText(text);
  await page.unroute("**/api/command");
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(
    page.getByText("Application submitted. The proposer will review it."),
  ).toBeVisible();
  expect(state.commands[0].idempotencyKey).toBe(attempts[0].idempotencyKey);
  await page.getByRole("button", { name: "Withdraw application" }).click();
  await page.getByRole("button", { name: "Confirm withdraw" }).click();
  await expect(role).toHaveValue("");
  await expect(statement).toHaveText("");
});

test("inactive governor proposer gets distinct Urgent applications and accepts from the private review page", async ({
  page,
}) => {
  const state = await fixtures(page, proposer, [
    application(),
    {
      ...application("application-two"),
      applicantAddress: "another-test-applicant",
    },
  ]);
  await page.goto("/app/feed");
  await expect(
    page.getByRole("link", { name: "Review application" }),
  ).toHaveCount(2);
  await page.getByRole("link", { name: "Review application" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Contribution", exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Accept", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Confirm accept", exact: true })
    .click();
  await expect(
    page.getByText("Application accepted.", { exact: true }),
  ).toBeVisible();
  expect(state.getMembers()).toBe(2);
  await page.goto("/app/feed");
  await expect(
    page.getByRole("link", { name: "Review application" }),
  ).toHaveCount(1);
});

test("a delayed detail response cannot replace another project's review", async ({
  page,
}) => {
  const old = {
    ...application(),
    statement: "Private statement for the previous project",
  };
  const next = {
    ...application("application-two"),
    proposalId: "another-project",
    statement: "Current project candidacy for review",
  };
  await fixtures(page, proposer, [old, next]);
  let delayed: Route | undefined;
  await page.route("**/api/formation/applications/application-one", (route) => {
    delayed = route;
  });
  await page.goto("/app/feed");
  await page.getByRole("link", { name: "Review application" }).first().click();
  await expect.poll(() => Boolean(delayed)).toBe(true);
  await page.goBack();
  await page.getByRole("link", { name: "Review application" }).nth(1).click();
  await expect(page.getByText(next.statement)).toBeVisible();
  const response = page.waitForResponse(
    "**/api/formation/applications/application-one",
  );
  await delayed!.fulfill({
    json: {
      application: old,
      proposerAddress: proposer,
      proposalTitle: "Old project",
    },
  });
  await response;
  await expect(page.getByText(old.statement)).toHaveCount(0);
  await expect(page.getByText(next.statement)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open project" }),
  ).toHaveAttribute("href", "/app/proposals/another-project/formation");
});

test("application review remains reachable when the Formation project page is unavailable", async ({
  page,
}) => {
  const state = await fixtures(page, proposer, [application()]);
  await page.route("**/api/proposals/**", (route) =>
    route.fulfill({
      status: 404,
      json: { error: { message: "Not in Formation" } },
    }),
  );
  await page.goto("/app/formation/applications/application-one");
  await page.getByRole("button", { name: "Decline", exact: true }).click();
  await page.getByRole("button", { name: "Confirm decline" }).click();
  await expect(
    page.getByText("Application declined.", { exact: true }),
  ).toBeVisible();
  expect(state.getMembers()).toBe(1);
});

test("a saved decision stays resolved when the subsequent list refresh fails", async ({
  page,
}) => {
  const state = await fixtures(page, proposer, [application()]);
  await page.goto("/app/formation/applications/application-one");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await page.route("**/api/formation/applications?*", (route) =>
    route.fulfill({
      status: 503,
      json: { error: { message: "Temporarily unavailable" } },
    }),
  );
  await page.getByRole("button", { name: "Confirm accept" }).click();
  await expect(
    page.getByText("Application accepted.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Accept", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("0 pending review", { exact: true }),
  ).toBeVisible();
  expect(state.getMembers()).toBe(2);
});

test("refresh updates a selected application outside the first list page", async ({
  page,
}) => {
  const selected = application();
  await fixtures(page, proposer, [selected]);
  await page.route("**/api/formation/applications?*", (route) =>
    route.fulfill({
      json: { items: [], pendingCount: 0, nextCursor: null, limits },
    }),
  );
  await page.goto("/app/formation/applications/application-one");
  await expect(
    page.getByRole("button", { name: "Accept", exact: true }),
  ).toBeVisible();
  selected.status = "declined";
  selected.revision++;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Accept", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("declined", { exact: true })).toBeVisible();
});

test("selected review uses role availability from the newer detail read", async ({
  page,
}) => {
  const selected = application();
  await fixtures(page, proposer, [selected]);
  await page.route("**/api/formation/applications/application-one", (route) =>
    route.fulfill({
      json: {
        application: selected,
        proposerAddress: proposer,
        proposalTitle: "Research project",
        recruitmentBlock: "formation_role_unavailable",
      },
    }),
  );
  await page.goto("/app/formation/applications/application-one");
  await expect(
    page.getByText("1 pending review", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Accept", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Decline", exact: true }),
  ).toBeEnabled();
});

test("a stale review refreshes the outcome and closes its confirmation", async ({
  page,
}) => {
  const selected = application();
  await fixtures(page, proposer, [selected]);
  await page.goto("/app/formation/applications/application-one");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await page.route("**/api/command", (route) => {
    selected.status = "withdrawn";
    selected.revision++;
    return route.fulfill({
      status: 409,
      json: {
        error: {
          code: "formation_application_stale",
          message: "Application changed",
        },
      },
    });
  });
  await page.getByRole("button", { name: "Confirm accept" }).click();
  await expect(page.getByText("withdrawn", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm accept" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("0 pending review", { exact: true }),
  ).toBeVisible();
});

test("the proposer cannot apply or select a role in their own project", async ({
  page,
}) => {
  await fixtures(page, proposer, []);
  await page.goto(`/app/proposals/${projectId}/formation`);
  await expect(page.getByText("No applications yet.")).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Role", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Submit application" }),
  ).toHaveCount(0);
});

test("an approved member can leave and apply again without losing their acceptance history", async ({
  page,
}) => {
  const state = await fixtures(page, applicant, [
    { ...application(), status: "accepted" },
  ]);
  await page.goto(`/app/proposals/${projectId}/formation`);
  await page.getByRole("button", { name: "Leave team", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm leave", exact: true })
    .click();
  await expect(
    page.getByText("You left the team. Earned MM is retained."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Leave team", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("combobox", { name: "Role", exact: true }),
  ).toBeVisible();
  expect(state.getMembers()).toBe(1);
  expect(state.commands[0].type).toBe("formation.team.leave");
});

test("the proposer can remove an approved member through a confirmation", async ({
  page,
}) => {
  const state = await fixtures(page, proposer, [
    { ...application(), status: "accepted" },
  ]);
  await page.goto(`/app/proposals/${projectId}/formation`);
  await page
    .getByRole("button", { name: "Remove member", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm removal", exact: true })
    .click();
  await expect(
    page.getByText("Member removed. Their earned MM is retained."),
  ).toBeVisible();
  expect(state.getMembers()).toBe(1);
  expect(state.commands[0].type).toBe("formation.team.remove");
});

test("confirmation disables when the reviewer's Human Node eligibility expires", async ({
  page,
}) => {
  await page.clock.install();
  await fixtures(page, proposer, [application()]);
  await page.goto("/app/formation/applications/application-one");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Confirm accept" }),
  ).toBeEnabled();
  await page.route("**/api/me", (route) =>
    route.fulfill({
      json: {
        authenticated: true,
        address: proposer,
        gate: { eligible: false, reason: "Node inactive" },
      },
    }),
  );
  await page.clock.fastForward(60_001);
  await expect(
    page.getByRole("button", { name: "Confirm accept" }),
  ).toBeDisabled();
});

for (const theme of ["light", "sky", "night", "fire"]) {
  test(`review layout fits mobile and desktop in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript(
      (value) => localStorage.setItem("vortex.theme", value),
      theme,
    );
    await fixtures(page, proposer, [
      {
        ...application(),
        role: "Long research and documentation role ".repeat(3),
        statement:
          application().statement +
          "\n\n" +
          "A detailed contribution statement. ".repeat(100),
      },
    ]);
    await page.goto(`/app/proposals/${projectId}/formation`);
    await expect(
      page.getByRole("button", { name: "Accept", exact: true }),
    ).toBeVisible();
    for (const width of [390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const panel = page.locator("#formation-applications");
      await panel.scrollIntoViewIfNeeded();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      ).toBe(true);
      await expect(
        page.getByRole("button", { name: "Decline", exact: true }),
      ).toBeEnabled();
      await panel.screenshot({
        path: testInfo.outputPath(`${theme}-${width}.png`),
      });
    }
  });
}
