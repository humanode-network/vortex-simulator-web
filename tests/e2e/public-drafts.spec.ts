import { expect, test, type Page } from "@playwright/test";
import type { ProposalDraftDetailDto } from "../../src/types/api";
import type { ProposalThreadDto } from "../../src/types/api";

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
  discussionId: `public-draft:${draftId}`,
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

async function installFixtures(
  page: Page,
  draftDetail: ProposalDraftDetailDto = detail as ProposalDraftDetailDto,
) {
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
      await route.fulfill({ json: draftDetail });
      return;
    }
    if (
      decodeURIComponent(url.pathname) ===
      `/api/proposals/${detail.discussionId}/threads`
    ) {
      await route.fulfill({
        json: {
          proposalId: detail.discussionId,
          permissions: { canCreate: false },
          items: [],
        },
      });
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
  await expect(page.getByText("Deliberation", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start thread" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Continue editing" }),
  ).toHaveCount(0);
});

test("public draft notifications appear in activity and chamber feeds without becoming urgent votes", async ({
  page,
}) => {
  const chamberQueries: string[] = [];
  const item = {
    id: "draft-publication-event",
    title: listItem.title,
    meta: "General chamber",
    stage: "draft",
    summaryPill: "Public draft",
    summary: listItem.summary,
    actionable: false,
    proposer: author,
    proposerId: author,
    href: detail.publication.publicUrl,
    timestamp: new Date().toISOString(),
    ctaPrimary: "Read and discuss",
    stats: [{ label: "Revision", value: "2" }],
  };
  await installFixtures(page);
  await page.route("**/api/me", (route) =>
    route.fulfill({
      json: {
        authenticated: true,
        address: author,
        gate: { eligible: true, expiresAt: "2099-01-01T00:00:00.000Z" },
      },
    }),
  );
  await page.route("**/api/my-governance*", (route) =>
    route.fulfill({ json: { myChamberIds: [] } }),
  );
  await page.route("**/api/humans/*", (route) =>
    route.fulfill({
      json: { governorActive: true, humanNodeActive: true, governor: true },
    }),
  );
  await page.route("**/api/feed?*", async (route) => {
    const query = new URL(route.request().url()).searchParams;
    if (query.has("chambers")) chamberQueries.push(query.get("chambers")!);
    await route.fulfill({ json: { items: query.has("stage") ? [] : [item] } });
  });
  await page.goto("/app/feed");
  await expect(
    page.getByRole("article").filter({ hasText: listItem.title }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "All activity", exact: true }).click();
  await expect(
    page.getByRole("article").filter({ hasText: listItem.title }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Chambers and factions", exact: true })
    .click();
  const card = page.getByRole("article").filter({ hasText: listItem.title });
  await expect(card).toBeVisible();
  expect(chamberQueries).toContain("general");
  await card.getByRole("button").click();
  await page.getByRole("link", { name: "Read and discuss" }).click();
  await expect(
    page.getByRole("heading", { name: listItem.title, exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Deliberation", { exact: true })).toBeVisible();
});

test("discussion permissions refresh when the session arrives after the public draft", async ({
  page,
}) => {
  await installFixtures(page);
  let releaseSession!: () => void;
  const initialRead = new Promise<void>((resolve) => {
    releaseSession = resolve;
  });
  let signedIn = false;
  let reads = 0;
  await page.route("**/api/me", async (route) => {
    await initialRead;
    signedIn = true;
    await route.fulfill({
      json: {
        authenticated: true,
        address: author,
        gate: { eligible: true, expiresAt: "2099-01-01T00:00:00.000Z" },
      },
    });
  });
  await page.route("**/threads", async (route) => {
    reads += 1;
    const canCreate = signedIn;
    await route.fulfill({
      json: {
        proposalId: detail.discussionId,
        permissions: { canCreate },
        items: [],
      },
    });
    releaseSession();
  });
  await page.goto(`/app/proposals/public-drafts/${draftId}`);
  await expect(page.getByPlaceholder("Thread title")).toBeEnabled();
  expect(reads).toBeGreaterThanOrEqual(2);
});

for (const action of ["reply", "transition"] as const) {
  test(`a pending ${action} cannot reopen a different thread or carry reply text across threads`, async ({
    page,
  }) => {
    await installFixtures(page);
    const threadA: ProposalThreadDto = {
      id: "review-a",
      proposalId: detail.discussionId,
      decisionRootProposalId: detail.discussionId,
      category: "question",
      status: "open",
      title: "Review the evidence",
      body: "Opening post for evidence review.",
      authorAddress: author,
      replies: 0,
      createdAt: listItem.updatedAt,
      updatedAt: listItem.updatedAt,
      permissions: { canReply: true, canTransition: true, canDelete: true },
    };
    const threadB = {
      ...threadA,
      id: "review-b",
      title: "Review the budget",
      body: "Opening post for budget review.",
    };
    let releaseWrite!: () => void;
    const writeWait = new Promise<void>((resolve) => {
      releaseWrite = resolve;
    });
    let announceWrite!: () => void;
    const writeStarted = new Promise<void>((resolve) => {
      announceWrite = resolve;
    });
    await page.route("**/api/me", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          address: author,
          gate: { eligible: true, expiresAt: "2099-01-01T00:00:00.000Z" },
        },
      }),
    );
    await page.route("**/threads", (route) =>
      route.fulfill({
        json: {
          proposalId: detail.discussionId,
          permissions: { canCreate: true },
          items: [threadA, threadB],
        },
      }),
    );
    await page.route("**/threads/*", (route) =>
      route.fulfill({
        json: {
          proposalId: detail.discussionId,
          thread: route.request().url().endsWith(threadA.id)
            ? threadA
            : threadB,
          messages: [],
        },
      }),
    );
    await page.route("**/api/command", async (route) => {
      expect(route.request().postDataJSON().payload.threadId).toBe(threadA.id);
      announceWrite();
      await writeWait;
      if (action === "transition") threadA.status = "resolved";
      await route.fulfill({ json: { ok: true } });
    });
    await page.goto(
      `/app/proposals/public-drafts/${draftId}?thread=${threadA.id}`,
    );
    await expect(page.getByPlaceholder("Write a reply")).toBeEnabled();
    await page
      .getByPlaceholder("Write a reply")
      .fill("This draft reply belongs only to evidence review.");
    if (action === "reply")
      await page.getByRole("button", { name: "Reply", exact: true }).click();
    else
      await page
        .getByRole("combobox", { name: "Thread status" })
        .selectOption("resolved");
    await writeStarted;
    await page
      .getByRole("article")
      .filter({ hasText: threadB.title })
      .getByRole("button")
      .click();
    await expect(
      page.getByRole("heading", { name: threadB.title, exact: true }),
    ).toHaveCount(2);
    releaseWrite();
    await expect(page.getByPlaceholder("Write a reply")).toBeEnabled();
    await expect(
      page.getByRole("heading", { name: threadB.title, exact: true }),
    ).toHaveCount(2);
    await expect(page.getByPlaceholder("Write a reply")).toHaveValue("");
    await expect(
      page.getByRole("combobox", { name: "Thread status" }),
    ).toHaveValue("open");
    await expect(page).toHaveURL(new RegExp(`thread=${threadB.id}`));
  });
}

for (const retryAction of ["none", "create", "reply", "transition"] as const) {
  test(`an active reader can start, reply and resolve a draft discussion (retry ${retryAction})`, async ({
    page,
  }) => {
    const thread = {
      id: "draft-review-thread",
      proposalId: detail.discussionId,
      decisionRootProposalId: detail.discussionId,
      title: "What evidence is required?",
      body: "Please describe the review criteria.",
      category: "question",
      status: "open",
      authorAddress: author,
      replies: 0,
      createdAt: "2026-10-26T12:00:00.000Z",
      updatedAt: "2026-10-26T12:00:00.000Z",
      permissions: { canReply: true, canTransition: true, canDelete: true },
    };
    let created = false;
    const messages: Array<{
      id: string;
      authorAddress: string;
      body: string;
      createdAt: string;
    }> = [];
    const commands: string[] = [];
    const applied = new Set<string>();
    const requestKeys = new Map<string, string[]>();
    let dropped = false;
    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const path = decodeURIComponent(new URL(request.url()).pathname);
      if (path === "/api/me")
        return route.fulfill({
          json: {
            authenticated: true,
            address: author,
            gate: { eligible: true, expiresAt: "2099-01-01T00:00:00.000Z" },
          },
        });
      if (path === `/api/proposals/public-drafts/${draftId}`)
        return route.fulfill({ json: detail });
      if (path === `/api/proposals/${detail.discussionId}/threads`)
        return route.fulfill({
          json: {
            proposalId: detail.discussionId,
            permissions: { canCreate: true },
            items: created ? [thread] : [],
          },
        });
      if (path === `/api/proposals/${detail.discussionId}/threads/${thread.id}`)
        return route.fulfill({
          json: { proposalId: detail.discussionId, thread, messages },
        });
      if (path === "/api/command") {
        const command = request.postDataJSON();
        expect(command.payload.proposalId).toBe(detail.discussionId);
        commands.push(command.type);
        const key = command.idempotencyKey;
        expect(typeof key).toBe("string");
        requestKeys.set(command.type, [
          ...(requestKeys.get(command.type) ?? []),
          key,
        ]);
        if (applied.has(key))
          return route.fulfill({ json: { ok: true, thread } });
        applied.add(key);
        if (command.type === "proposal.thread.create") {
          created = true;
          expect(command.payload.title).toBe(thread.title);
          expect(command.payload.body).toBe(thread.body);
        }
        if (command.type === "proposal.thread.reply") {
          messages.push({
            id: "draft-reply",
            authorAddress: author,
            body: command.payload.body,
            createdAt: thread.createdAt,
          });
          thread.replies += 1;
        }
        if (command.type === "proposal.thread.transition") {
          thread.status = command.payload.status;
        }
        if (!dropped && command.type === `proposal.thread.${retryAction}`) {
          dropped = true;
          return route.fulfill({
            status: 503,
            json: { error: { message: "Response unavailable. Retry." } },
          });
        }
        return route.fulfill({ json: { ok: true, thread } });
      }
      return route.fulfill({ json: { items: [] } });
    });
    await page.goto(`/app/proposals/public-drafts/${draftId}`);
    await page.getByPlaceholder("Thread title").fill(thread.title);
    await page.getByPlaceholder("Write the opening post").fill(thread.body);
    await page.getByRole("button", { name: "Start thread" }).click();
    if (retryAction === "create") {
      await expect(
        page.getByText("Response unavailable. Retry.", { exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Start thread" }).click();
    }
    await expect(page).toHaveURL(new RegExp(`thread=${thread.id}`));
    await page
      .getByPlaceholder("Write a reply")
      .fill("The criteria should be public and reproducible.");
    await page.getByRole("button", { name: "Reply", exact: true }).click();
    if (retryAction === "reply") {
      await expect(
        page.getByText("Response unavailable. Retry.", { exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Reply", exact: true }).click();
    }
    await expect(
      page.getByText("The criteria should be public and reproducible.", {
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Thread status" })
      .selectOption("resolved");
    if (retryAction === "transition") {
      await expect(
        page.getByText("Response unavailable. Retry.", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("combobox", { name: "Thread status" })
        .selectOption("resolved");
    }
    await expect(
      page.getByText("Resolved", { exact: true }).first(),
    ).toBeVisible();
    expect(commands).toEqual(
      ["create", "reply", "transition"].flatMap((action) =>
        Array(action === retryAction ? 2 : 1).fill(`proposal.thread.${action}`),
      ),
    );
    expect(applied.size).toBe(3);
    for (const keys of requestKeys.values()) expect(new Set(keys).size).toBe(1);
    expect(messages).toHaveLength(1);
    await page.reload();
    await expect(
      page.getByText("The criteria should be public and reproducible.", {
        exact: true,
      }),
    ).toBeVisible();
  });
}

for (const theme of ["light", "sky", "night", "fire"]) {
  for (const width of [390, 1440]) {
    test(`structured public draft ${theme} ${width}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (value) => localStorage.setItem("vortex.theme", value),
        theme,
      );
      const proposal = {
        ...detail,
        formationEligible: true,
        budget: "6000 HMND",
        teamSlots: "1 / 2",
        milestonesPlanned: "2",
        authoring: {
          ...detail.authoring,
          what: "## Evidence register\n\nA public register with independent review.\n\n- Signed sources\n- Reproducible results",
          why:
            "## Public accountability\n\n" +
            "Governors need complete evidence before making a decision. ".repeat(
              35,
            ),
          how: "1. Collect sources\n2. Publish results\n\n> Every claim needs evidence.\n\n`verification-status`\n\n[Research protocol](https://example.com/protocol)",
          aboutMe: "I maintain the research archive.",
          outputs: [
            {
              id: "register",
              label: "Public evidence register",
              href: "https://example.com/register",
            },
          ],
          timeline: [
            {
              title: "Collect evidence",
              timeframe: "Weeks 1-2",
              budgetHmnd: "4000",
            },
            {
              title: "Publish findings",
              timeframe: "Week 3",
              budgetHmnd: "2000",
            },
          ],
          budgetItems: [
            { description: "Research", amountHmnd: "4000" },
            { description: "Publication", amountHmnd: "2000" },
          ],
        },
        openSlotNeeds: [
          { title: "Reviewer", desc: "Review the evidence independently." },
        ],
      };
      await installFixtures(page, proposal as ProposalDraftDetailDto);
      await page.goto(`/app/proposals/public-drafts/${draftId}`);
      await expect(
        page.getByRole("heading", { name: "Evidence register", exact: true }),
      ).toBeVisible();
      await expect(
        page.locator("code").filter({ hasText: "verification-status" }),
      ).toBeVisible();
      await expect(page.locator("ol")).toContainText("Collect sources");
      await expect(page.locator("blockquote")).toContainText(
        "Every claim needs evidence.",
      );
      await expect(page.getByText("4000 HMND", { exact: true })).toHaveCount(1);
      await expect(page.getByText("2000 HMND", { exact: true })).toHaveCount(1);
      await expect(page.getByText("Weeks 1-2", { exact: true })).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Initiative · Governance Observatory" }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      const screenshot = testInfo.outputPath(
        `public-draft-${theme}-${width}.png`,
      );
      await page.screenshot({ path: screenshot, fullPage: true });
      await testInfo.attach(`public-draft-${theme}-${width}.png`, {
        path: screenshot,
        contentType: "image/png",
      });
    });
  }
}

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
    if (
      decodeURIComponent(url.pathname) ===
      `/api/proposals/${detail.discussionId}/threads`
    ) {
      await route.fulfill({
        json: {
          proposalId: detail.discussionId,
          permissions: { canCreate: true },
          items: [],
        },
      });
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
    returnSource: "failed_chamber_vote",
    publication: { status: "private" },
  };
  const publicDraft = {
    id: "owned-public-draft",
    title: "Published governance outline",
    chamber: "General Chamber",
    tier: "Consul",
    summary: "An owned draft that is already visible publicly.",
    updated: "2026-07-24T12:00:00.000Z",
    returnSource: null,
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
  await page.locator(".sidebar__brandLink").hover();
  const governorRow = page.locator(".sidebar__identityRow", {
    has: page.getByText("Governor", { exact: true }),
  });
  const activeGovernorRow = page.locator(".sidebar__identityRow", {
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
    page.getByText("Returned after chamber vote", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(publicDraft.title, { exact: true }),
  ).toBeVisible();
  const privateCard = page
    .getByRole("article")
    .filter({ hasText: privateDraft.title });
  const visibilityControl = privateCard.getByRole("button", {
    name: "Make draft public",
  });
  const editControl = privateCard.getByRole("link", {
    name: "Continue editing",
  });
  const controlStyle = async (locator: typeof visibilityControl) =>
    locator.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        borderRadius: style.borderRadius,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        height: element.getBoundingClientRect().height,
      };
    });
  await expect(visibilityControl).toHaveAttribute("data-button-size", "sm");
  await expect(editControl).toHaveAttribute("data-button-size", "sm");
  expect(await controlStyle(visibilityControl)).toEqual(
    await controlStyle(editControl),
  );
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
