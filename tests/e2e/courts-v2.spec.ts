import { expect, test, type Page } from "@playwright/test";

const viewer = "hmrCourtViewer111111111111111111111111111111111111111";
const caseId = "case-governance-coercion";
const reportStanding = {
  status: "verified",
  direct: true,
  source: "target_owner",
} as const;
const findingBallotDefinition = {
  offenseCode: "CMP-01",
  allowedSeverities: ["L1", "L2", "L3"],
  evidenceStandards: { L1: "E1", L2: "E2", L3: "E2" },
  thresholds: { ordinary: 8, critical: 10 },
};
const remedyBallotDefinition = {
  envelope: {
    policyVersion: "court-codex-v1",
    policyHash: "sha256:policy",
    offenseCode: "GOV-03",
    severity: "L2",
    thresholds: {
      authorization: 8,
      optionalComponent: 8,
      orderedScope: 8,
      permanence: 10,
    },
    components: [
      {
        id: "D-02",
        domain: "public_record",
        harmKey: "public_offense_record",
        mode: "mandatory",
        countsTowardPunitiveLimit: true,
        executorId: "public-record",
        executorVersion: "v1",
        expiryBehavior: "persists",
        appealBehavior: "continues_on_appeal",
        value: { kind: "categorical" },
      },
      {
        id: "G-04",
        domain: "governance_restriction",
        harmKey: "proposal_creation_restriction",
        mode: "optional",
        countsTowardPunitiveLimit: true,
        burden: { unit: "eras", weight: 1 },
        executorId: "governance-restriction",
        executorVersion: "v1",
        expiryBehavior: "expires_after_term",
        appealBehavior: "stay_on_appeal",
        value: {
          kind: "quantitative",
          range: { min: "1", max: "6", step: "1", lessRestrictive: "lower" },
        },
      },
    ],
    maximumComponentCount: 2,
    maximumBurden: "18",
    maximumComponentsByDomain: {
      public_record: 2,
      governance_restriction: 2,
    },
    requiredOneOfComponentGroups: [],
    incompatibleComponentPairs: [],
  },
};

const latestCommand = (commands: Record<string, unknown>[]) =>
  commands[commands.length - 1];

const caseRecord = {
  publicCase: {
    id: caseId,
    state: "appealed",
    finalityState: "stayed",
    policyVersionId: "court-codex-v1",
    triggerKind: "direct_standing",
    targetType: "proposal",
    targetSummary: null,
    domain: "governance",
    schedule: {},
    openedAt: "2026-08-01T10:00:00.000Z",
    closedAt: null,
    updatedAt: "2026-08-11T10:00:00.000Z",
    offenseCode: null,
    remedies: [],
    appeals: [],
    finalDecision: null,
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
  caseRecord: {
    allegationCode: "GOV-03",
    allegation: { statementDigest: "sha256:allegation" },
    finalDecision: null,
    target: {
      canonicalRoute: "/app/proposals/proposal-under-review",
      digest: "sha256:target",
      accessClass: "public",
      snapshotPayload: { title: "Proposal under review" },
    },
    events: [
      {
        sequence: 1,
        eventType: "case_opened",
        previousState: null,
        nextState: "case_opened",
        payload: {},
        createdAt: "2026-08-01T10:00:00.000Z",
      },
      {
        sequence: 2,
        eventType: "appeal_filed",
        previousState: "appeal_window",
        nextState: "appealed",
        payload: {},
        createdAt: "2026-08-11T10:00:00.000Z",
      },
    ],
  },
  evidence: [
    {
      id: "evidence-1",
      kind: "external_url",
      digest: "sha256:evidence",
      provenance: "party_supplied",
      metadata: {
        description: "Signed governance-message archive.",
        body: "## Evidence note\n\n- Signed by the submitting party\n- Preserved before service",
        url: "https://evidence.example/archive",
      },
      accessClass: "parties_and_jury",
      state: "admitted",
      createdAt: "2026-08-04T10:00:00.000Z",
    },
  ],
  juryTask: null,
  appellateTask: {
    panelId: "appeal-panel-1",
    kind: "ordinary",
    panelState: "ballot",
    seatNumber: 4,
    invitationDueAt: "2026-08-14T10:00:00.000Z",
    result: null,
    brief: {
      kind: "ordinary",
      appealId: "appeal-1",
      groundCode: "material_evidence_error",
      groundsDigest: "sha256:appeal-grounds",
      grounds:
        "## Claimed error\n\nThe jury excluded a signed record that could materially change the finding.",
      stayState: "granted",
      deadlineAt: "2026-08-17T10:00:00.000Z",
      filedAt: "2026-08-11T10:00:00.000Z",
    },
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
  options: {
    caseDetailFailureAfter?: number;
    caseDetailDelays?: Record<string, number>;
    caseDetails?: Record<string, Record<string, unknown>>;
    caseListDelayMs?: number;
    casesStatus?: "available" | "unavailable";
    capabilityDirectStanding?: boolean;
    capabilityPopulation?: {
      source: string;
      basis: "incident_time" | "capture_time_fallback";
      effectiveAt: string;
      capturedAt: string;
      eligibleGovernorCount: number;
      communityThreshold: number | null;
      viewerCountsTowardCommunity: boolean;
    } | null;
    commandFailures?: number;
    notificationsStatus?: "available" | "unavailable";
    notifications?: Record<string, unknown>[];
    onCapability?: (url: URL) => void;
    onCommand?: (command: Record<string, unknown>) => void;
    reasonCapabilities?: Record<string, unknown>[];
    reportDetail?: Record<string, unknown>;
    reports?: Record<string, unknown>[];
    reportsStatus?: "available" | "unavailable";
  } = {},
) {
  let caseDetailRequests = 0;
  let commandRequests = 0;
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
      if (options.caseListDelayMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, options.caseListDelayMs),
        );
      }
      await route.fulfill({
        json: {
          status: options.casesStatus ?? "available",
          cases: options.casesStatus === "unavailable" ? [] : [fixture],
        },
      });
      return;
    }
    if (url.pathname.startsWith("/api/reports/cases/")) {
      caseDetailRequests += 1;
      const requestedCaseId = decodeURIComponent(
        url.pathname.split("/").pop() ?? "",
      );
      const delay = options.caseDetailDelays?.[requestedCaseId];
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      if (
        options.caseDetailFailureAfter !== undefined &&
        caseDetailRequests > options.caseDetailFailureAfter
      ) {
        await route.fulfill({
          status: 503,
          json: { error: "Projection temporarily unavailable" },
        });
        return;
      }
      const detail =
        options.caseDetails?.[requestedCaseId] ??
        (requestedCaseId === caseId ? fixture : null);
      await route.fulfill(
        detail
          ? { json: detail }
          : { status: 404, json: { error: "Court case not found" } },
      );
      return;
    }
    if (url.pathname === "/api/reports/mine") {
      await route.fulfill({
        json: {
          status: options.reportsStatus ?? "available",
          reports:
            options.reportsStatus === "unavailable"
              ? []
              : (options.reports ?? []),
        },
      });
      return;
    }
    if (url.pathname === "/api/reports/notifications") {
      await route.fulfill({
        json: {
          status: options.notificationsStatus ?? "available",
          notifications:
            options.notificationsStatus === "unavailable"
              ? []
              : (options.notifications ?? []),
        },
      });
      return;
    }
    if (url.pathname === "/api/reports/capability") {
      options.onCapability?.(url);
      await route.fulfill({
        json: {
          status: "available",
          assessedAt: "2026-08-12T10:00:00.000Z",
          target: {
            type: url.searchParams.get("type"),
            id: url.searchParams.get("id"),
            revision: url.searchParams.get("revision") ?? "revision-1",
            canonicalRoute: "/app/proposals/proposal-under-review",
            accessClass: "public",
          },
          preview: {
            capturedAt: "2026-08-12T10:00:00.000Z",
            digest: "sha256:target",
            payload: { title: "Proposal under review" },
          },
          defaults: {
            incidentStartsAt: "2026-08-12T10:00:00.000Z",
            incidentStartsAtSource: "assessment_time",
            respondentId: "hmrProposalAuthor",
            respondentIdSource: "sole_target_owner",
            affectedId: "hmrCurrentReporter",
            affectedIdSource: "direct_reporter",
          },
          reasonCapabilities: options.reasonCapabilities ?? [
            {
              reason: { offenseCode: "GOV-03", lane: "court_report" },
              standing: {
                status: "verified",
                directStanding: options.capabilityDirectStanding ?? true,
                source: "target-owner",
              },
              protectiveReview: { eligible: false },
            },
          ],
          population: options.capabilityPopulation ?? null,
        },
      });
      return;
    }
    if (url.pathname === "/api/command" && request.method() === "POST") {
      commandRequests += 1;
      const command = request.postDataJSON() as Record<string, unknown>;
      options.onCommand?.(command);
      if (commandRequests <= (options.commandFailures ?? 0)) {
        await route.fulfill({
          status: 503,
          json: { error: "Command result unavailable" },
        });
        return;
      }
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
        json: options.reportDetail ?? {
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
          respondentId: "human-respondent",
          affectedId: null,
          submittedAt: "2026-08-12T10:00:00.000Z",
          updatedAt: "2026-08-12T10:00:00.000Z",
          amendmentDueAt: null,
          amendmentDeadlineState: null,
          standing: reportStanding,
          triggerProgress: {
            qualifyingReports: 2,
            requiredReports: 3,
            viewerReportCounts: true,
          },
          policyVersionId: "court-codex-v1",
          immediateProtectionRequested: false,
          triggerKind: null,
          revision: 1,
          statementDigest: "sha256:statement",
          statement: {
            body: "A complete browser report.",
            access: "parties_and_jury",
          },
          revisions: [
            {
              revision: 1,
              kind: "initial",
              statementDigest: "sha256:statement",
              previousState: null,
              nextState: "submitted",
              createdAt: "2026-08-12T10:00:00.000Z",
            },
          ],
          amendmentRequest: null,
          evidence: [],
          caseId: null,
          actions: { amend: false, supplement: true, withdraw: true },
        },
      });
      return;
    }
    await route.fulfill({ json: {} });
  });
}

for (const width of [390, 768, 1024, 1440]) {
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
    await expect(page.getByText(new RegExp(caseId))).toBeVisible();
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

test("long Court audit values stay readable and exactly copyable", async ({
  page,
}) => {
  const longDigest = `sha256:${"a".repeat(64)}`;
  const fixture = {
    ...caseRecord,
    partyRecord: {
      ...caseRecord.partyRecord,
      target: { ...caseRecord.caseRecord.target, digest: longDigest },
    },
    caseRecord: {
      ...caseRecord.caseRecord,
      target: { ...caseRecord.caseRecord.target, digest: longDigest },
    },
    evidence: caseRecord.evidence.map((item) => ({
      ...item,
      digest: longDigest,
    })),
  };
  await page.setViewportSize({ width: 390, height: 900 });
  await installCourtFixtures(page, fixture);
  await page.goto(`/app/courts/${caseId}`);

  const snapshotDigest = page.getByLabel(`snapshot digest: ${longDigest}`);
  await expect(snapshotDigest).toBeVisible();
  await expect(snapshotDigest).toContainText("...");
  await expect(
    page.getByRole("button", { name: "Copy snapshot digest" }).first(),
  ).toBeVisible();
  const bodyWidth = await page
    .locator("body")
    .evaluate((element) => element.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(390);
});

test("switching case ids never exposes the previous case response", async ({
  page,
}) => {
  const caseA = "case-route-a";
  const caseB = "case-route-b";
  const fixtureA = {
    ...caseRecord,
    publicCase: { ...caseRecord.publicCase, id: caseA },
    partyRecord: { ...caseRecord.partyRecord, id: caseA },
    caseRecord: { ...caseRecord.caseRecord, id: caseA },
  };
  const fixtureB = {
    ...caseRecord,
    publicCase: { ...caseRecord.publicCase, id: caseB },
    partyRecord: { ...caseRecord.partyRecord, id: caseB },
    caseRecord: { ...caseRecord.caseRecord, id: caseB },
  };
  await installCourtFixtures(page, caseRecord, true, {
    caseDetailDelays: { [caseA]: 800 },
    caseDetails: { [caseA]: fixtureA, [caseB]: fixtureB },
  });
  await page.goto(`/app/courts/${caseA}`);
  await page.evaluate((nextPath) => {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, `/app/courts/${caseB}`);
  await expect(page.getByText(caseB, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(caseA, { exact: true })).toHaveCount(0);
});

test("Court choices and their Codex definitions remain separate controls", async ({
  page,
}) => {
  await installCourtFixtures(page);
  await page.goto(`/app/courts/${caseId}`);

  await expect(
    page.locator("label [role='link'], button [role='link']"),
  ).toHaveCount(0);
  const retainedRemedy = page.getByRole("checkbox", {
    name: "Keep Admonition",
  });
  await expect(retainedRemedy).toBeChecked();

  const definition = page.getByRole("link", {
    name: /HC-5\.D-01.*Open in Humanode Codex/,
  });
  await definition.focus();
  await expect(retainedRemedy).toBeChecked();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/clause=HC-5\.D-01/);
});

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
  await expect(page.getByText("Private reporter record")).toBeVisible();
  await expect(
    page.getByText("report-browser-journey", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("2 received · 1 left", { exact: true }),
  ).toBeVisible();
});

test("report creation uses server time and warns before abandoning dirty work", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const RealDate = Date;
    class SkewedDate extends RealDate {
      constructor(value?: string | number | Date) {
        super(value === undefined ? "2036-01-01T00:00:00.000Z" : value);
      }
      static now() {
        return Date.parse("2036-01-01T00:00:00.000Z");
      }
    }
    window.Date = SkewedDate as DateConstructor;
  });
  const capabilityRequests: URL[] = [];
  await installCourtFixtures(page, caseRecord, true, {
    onCapability: (url) => capabilityRequests.push(url),
  });
  await page.goto(
    "/app/courts/reports/new?targetType=proposal&targetId=proposal-under-review",
  );
  const incidentStart = page.getByLabel("Incident start");
  await expect(incidentStart).not.toHaveValue("");
  expect(await incidentStart.inputValue()).not.toContain("2036");
  expect(capabilityRequests[0]?.searchParams.has("incidentAt")).toBe(false);
  await expect.poll(() => capabilityRequests.length).toBeGreaterThan(1);
  expect(
    capabilityRequests[capabilityRequests.length - 1]?.searchParams.get(
      "revision",
    ),
  ).toBe("revision-1");

  await page
    .getByLabel(
      "Describe what happened, when it happened, and why this reason applies.",
    )
    .fill(
      "This unsaved report should remain present when navigation is cancelled.",
    );
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("link", { name: "Feed", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/courts\/reports\/new/);
  await expect(
    page.getByLabel(
      "Describe what happened, when it happened, and why this reason applies.",
    ),
  ).toContainText(
    "This unsaved report should remain present when navigation is cancelled.",
  );
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.evaluate(() => window.history.back());
  await expect(page).toHaveURL(/\/app\/courts\/reports\/new/);
});

test("report source and URL fingerprints require no technical entry", async ({
  page,
}) => {
  const submittedCommands: Record<string, unknown>[] = [];
  await installCourtFixtures(page, caseRecord, true, {
    onCommand: (command) => {
      if (command.type === "court.report.submit")
        submittedCommands.push(command);
    },
  });
  await page.goto(
    "/app/courts/reports/new?targetType=proposal&targetId=proposal-under-review",
  );
  await expect(page.getByText("Source record secured")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Respondent address" }),
  ).toHaveValue("hmrProposalAuthor");
  await page
    .getByLabel(
      "Describe what happened, when it happened, and why this reason applies.",
    )
    .fill(
      "This report includes an external record whose reference should be fingerprinted automatically.",
    );
  await page.getByText("Add supporting evidence", { exact: true }).click();
  await page
    .getByLabel("External evidence URL")
    .fill("https://evidence.example/record");
  await expect(page.getByLabel("SHA-256 digest")).toHaveCount(0);
  await page
    .getByText(/I attest that this report is made in good faith/)
    .click();
  await page.getByRole("button", { name: "Submit report" }).click();
  await expect(page).toHaveURL(
    /\/app\/courts\/reports\/report-browser-journey$/,
  );
  const submittedCommand = submittedCommands.find(
    (command) => command.type === "court.report.submit",
  );
  const payload = (submittedCommand?.payload ?? {}) as {
    evidence?: Record<string, unknown>[];
  };
  expect(payload.evidence).toEqual([
    expect.objectContaining({
      kind: "external_url",
      url: "https://evidence.example/record",
    }),
  ]);
  expect(payload.evidence?.[0]).not.toHaveProperty("digest");
});

test("community report creation shows the Governor threshold and contribution", async ({
  page,
}) => {
  await installCourtFixtures(page, caseRecord, true, {
    capabilityDirectStanding: false,
    capabilityPopulation: {
      source: "vortex-governor-roster:fixture",
      basis: "capture_time_fallback",
      effectiveAt: "2026-08-12T10:00:00.000Z",
      capturedAt: "2026-08-12T10:00:00.000Z",
      eligibleGovernorCount: 99,
      communityThreshold: 10,
      viewerCountsTowardCommunity: false,
    },
  });
  await page.goto(
    "/app/courts/reports/new?targetType=proposal&targetId=proposal-under-review",
  );
  await page.getByLabel("Reason").selectOption("GOV-03:court_report");
  await expect(page.getByText("10 required", { exact: true })).toBeVisible();
  await expect(page.getByText(/does not add Governor support/)).toBeVisible();
  await expect(page.getByText(/Governor population: 99/)).toBeVisible();
});

test("report creation explains each lane's actual trigger semantics", async ({
  page,
}) => {
  const standing = (directStanding: boolean) => ({
    status: "verified",
    directStanding,
    source: directStanding ? "target-owner" : "active-governor",
  });
  await installCourtFixtures(page, caseRecord, true, {
    capabilityPopulation: {
      source: "vortex-governor-roster:fixture",
      basis: "capture_time_fallback",
      effectiveAt: "2026-08-12T10:00:00.000Z",
      capturedAt: "2026-08-12T10:00:00.000Z",
      eligibleGovernorCount: 99,
      communityThreshold: 10,
      viewerCountsTowardCommunity: true,
    },
    reasonCapabilities: [
      {
        reason: { offenseCode: "CMP-01", lane: "correction" },
        standing: standing(true),
        protectiveReview: { eligible: false },
      },
      {
        reason: { offenseCode: "CMP-03", lane: "scoped_moderation" },
        standing: standing(true),
        protectiveReview: { eligible: false },
      },
      {
        reason: { offenseCode: "GOV-03", lane: "court_report" },
        standing: standing(true),
        protectiveReview: { eligible: false },
      },
      {
        reason: {
          offenseCode: "SEC-03",
          lane: "safety_or_protocol_incident",
        },
        standing: standing(true),
        protectiveReview: {
          eligible: true,
          authorityIds: ["protocol-safety-council"],
          durationSeconds: 86_400,
        },
      },
    ],
  });
  await page.goto(
    "/app/courts/reports/new?targetType=proposal&targetId=proposal-under-review",
  );

  const reason = page.getByLabel("Reason", { exact: true });
  await reason.selectOption("CMP-01:correction");
  await expect(page.getByText("Governor reports", { exact: true })).toBeVisible();
  await expect(page.getByText("10 required", { exact: true })).toBeVisible();

  await reason.selectOption("CMP-03:scoped_moderation");
  await expect(page.getByText("Moderation action", { exact: true })).toBeVisible();
  await expect(page.getByText("1 required", { exact: true })).toBeVisible();

  await reason.selectOption("GOV-03:court_report");
  await expect(page.getByText("Admissible reports", { exact: true })).toBeVisible();
  await expect(page.getByText("1 required", { exact: true })).toBeVisible();

  await reason.selectOption("SEC-03:safety_or_protocol_incident");
  await expect(page.getByText("Court case trigger", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Verified proof or authorized referral", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Governor reports", { exact: true })).toHaveCount(0);
  await expect(page.getByText("10 required", { exact: true })).toHaveCount(0);
});

for (const width of [390, 1440]) {
  test(`dense report creation stays readable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await installCourtFixtures(page);
    await page.goto(
      "/app/courts/reports/new?targetType=proposal&targetId=proposal-under-review&revision=revision-with-a-long-immutable-identifier",
    );
    await page.getByLabel("Reason").selectOption("GOV-03:court_report");
    const respondentInput = page.getByRole("textbox", {
      name: "Respondent address",
    });
    await expect(respondentInput).toHaveValue("hmrProposalAuthor");
    await expect(respondentInput).toHaveAttribute("readonly", "");
    await expect(page.getByText("1 required", { exact: true })).toBeVisible();
    await page
      .getByLabel("Affected address")
      .fill("hmrAffectedWithAVeryLongCanonicalAddress2222222222222222222");
    await page
      .getByLabel(
        "Describe what happened, when it happened, and why this reason applies.",
      )
      .fill(
        "Incident record\n\nThe reported conduct occurred across several governance discussions and requires the Court to review the exact proposal revision. ".repeat(
          6,
        ),
      );
    await page.getByText("Add supporting evidence", { exact: true }).click();
    await page
      .getByLabel("External evidence URL")
      .fill("https://evidence.example/immutable-governance-archive");
    await page
      .getByText(/I attest that this report is made in good faith/)
      .click();
    await expect(
      page.getByRole("button", { name: "Submit report" }),
    ).toBeEnabled();
    const bodyWidth = await page
      .locator("body")
      .evaluate((element) => element.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/playwright/court-report-create-${width}.png`,
      fullPage: true,
    });
  });
}

test("every reporter state has visible next-step guidance", async ({
  page,
}) => {
  const states = [
    "submitted",
    "needs_amendment",
    "collecting",
    "routed_to_correction",
    "routed_to_moderation",
    "grouped",
    "withdrawn",
    "expired",
    "closed_without_case",
    "triggered",
  ];
  await installCourtFixtures(page, caseRecord, true, {
    reports: states.map((state, index) => ({
      id: `report-${state}`,
      state,
      target: {
        type: index % 2 === 0 ? "proposal" : "initiative_message",
        id: `target-${index}`,
        route: null,
      },
      offenseCode:
        state === "grouped"
          ? "SEC-03"
          : state === "routed_to_correction"
          ? "CMP-01"
          : index % 2 === 0
            ? "GOV-03"
            : "CMP-03",
      lane:
        state === "grouped"
          ? "safety_or_protocol_incident"
          : state === "routed_to_correction"
          ? "correction"
          : state === "routed_to_moderation"
            ? "scoped_moderation"
            : "court_report",
      submittedAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-12T10:00:00.000Z",
      caseId: state === "triggered" ? caseId : null,
      respondentId: `human-respondent-${index}`,
      triggerProgress:
        state === "routed_to_correction" ||
        state === "routed_to_moderation" ||
        state === "grouped"
          ? null
          : {
              qualifyingReports: 2,
              requiredReports: 3,
              viewerReportCounts: true,
            },
      amendmentDueAt:
        state === "needs_amendment" ? "2026-08-19T10:00:00.000Z" : null,
      amendmentDeadlineState: state === "needs_amendment" ? "due" : null,
      standing: reportStanding,
    })),
  });
  await page.goto("/app/courts");
  await page.getByRole("button", { name: /My reports 10/ }).click();
  await expect(
    page.getByText("2 received · 1 left", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("1 received · 0 left", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText(/more matching Governor report/).first(),
  ).toBeVisible();
  for (const label of [
    "Submitted",
    "Needs amendment",
    "Collecting",
    "Routed to correction",
    "Routed to moderation",
    "Safety intake",
    "Withdrawn",
    "Expired",
    "Closed without a case",
    "Case opened",
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
});

test("Courts home only starts reports from a canonical record", async ({
  page,
}) => {
  await installCourtFixtures(page);
  await page.goto("/app/courts");
  await expect(
    page.getByText(/Start a report from the Report action/),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Create report" })).toHaveCount(
    0,
  );
});

test("Court collections load and fail independently", async ({ page }) => {
  await installCourtFixtures(page, caseRecord, true, {
    caseListDelayMs: 1_200,
    notificationsStatus: "unavailable",
    reports: [
      {
        id: "report-independent",
        state: "collecting",
        target: {
          type: "proposal",
          id: "proposal-independent",
          route: "/app/proposals/proposal-independent",
        },
        offenseCode: "GOV-03",
        lane: "court_report",
        submittedAt: "2026-08-12T10:00:00.000Z",
        updatedAt: "2026-08-12T10:00:00.000Z",
        caseId: null,
        respondentId: "human-respondent",
        triggerProgress: {
          qualifyingReports: 2,
          requiredReports: 3,
          viewerReportCounts: true,
        },
        amendmentDueAt: null,
        amendmentDeadlineState: null,
        standing: reportStanding,
      },
    ],
  });
  await page.goto("/app/courts");
  await expect(page.getByText("Loading cases...")).toBeVisible();
  await page.getByRole("button", { name: /My reports/ }).click();
  await expect(page.getByText("Voter coercion")).toBeVisible();
  await page.getByRole("button", { name: /Notifications/ }).click();
  await expect(page.getByText("Notifications are unavailable.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry notifications" }),
  ).toBeVisible();
});

test("report actions come from the server projection in amendment state", async ({
  page,
}) => {
  await installCourtFixtures(page, caseRecord, true, {
    reportDetail: {
      id: "report-browser-journey",
      state: "needs_amendment",
      target: {
        type: "proposal",
        id: "proposal-under-review",
        route: "/app/proposals/proposal-under-review",
        digest: "sha256:target",
        snapshot: { title: "Proposal under review" },
      },
      offenseCode: "GOV-03",
      lane: "court_report",
      incident: { startedAt: "2026-08-12T10:00:00.000Z", endedAt: null },
      respondentId: "human-respondent",
      affectedId: null,
      submittedAt: "2026-08-12T10:00:00.000Z",
      updatedAt: "2026-08-12T10:00:00.000Z",
      amendmentDueAt: "2026-08-19T10:00:00.000Z",
      amendmentDeadlineState: "due",
      standing: reportStanding,
      triggerProgress: null,
      policyVersionId: "court-codex-v1",
      immediateProtectionRequested: false,
      triggerKind: null,
      revision: 2,
      statementDigest: "sha256:statement",
      statement: {
        body: "A report requiring one precise amendment.",
        access: "parties_and_jury",
      },
      revisions: [
        {
          revision: 1,
          kind: "initial",
          statementDigest: "sha256:initial",
          previousState: null,
          nextState: "submitted",
          createdAt: "2026-08-12T10:00:00.000Z",
        },
        {
          revision: 2,
          kind: "amendment_request",
          statementDigest: "sha256:statement",
          previousState: "submitted",
          nextState: "needs_amendment",
          createdAt: "2026-08-12T11:00:00.000Z",
        },
      ],
      amendmentRequest: {
        reason:
          "Clarify when the incident ended and identify the affected vote.",
        missingFields: ["incident_ended_at", "affected_vote"],
        dueAt: "2026-08-19T10:00:00.000Z",
      },
      evidence: [],
      caseId: null,
      actions: { amend: true, supplement: false, withdraw: true },
    },
  });
  await page.goto("/app/courts/reports/report-browser-journey");
  await expect(
    page.getByRole("heading", { name: "Amend report" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Clarify when the incident ended and identify the affected vote.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Revision 2 - Amendment Request")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit amendment" }),
  ).toBeDisabled();
  await page
    .getByLabel("Provide the corrected statement requested by intake review.")
    .fill(
      "The corrected report identifies the affected vote and clarifies the incident timeline.",
    );
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("link", { name: "Feed", exact: true }).click();
  await expect(page).toHaveURL("/app/courts/reports/report-browser-journey");
  await expect(
    page.getByRole("button", { name: "Withdraw report" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Withdraw report" }).click();
  await expect(
    page.getByRole("dialog", { name: "Withdraw Court report" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Keep report" })).toBeVisible();
});

test("an uncertain command retry keeps the same idempotency key", async ({
  page,
}) => {
  const commands: Record<string, unknown>[] = [];
  const fixture = {
    ...caseRecord,
    publicCase: { ...caseRecord.publicCase, state: "notice_and_response" },
    appellateTask: null,
    capabilities: {
      view_public_case: true,
      view_party_record: true,
      submit_response: true,
    },
  };
  await installCourtFixtures(page, fixture, true, {
    commandFailures: 1,
    onCommand: (command) => commands.push(command),
  });
  await page.goto(`/app/courts/${caseId}`);
  const response = page.getByLabel(
    "State your response, relevant facts, and any disputed claims.",
  );
  await response.fill(
    "I dispute the allegation and preserve this response across a retry.",
  );
  await page.getByRole("button", { name: "Submit response" }).click();
  await expect(
    page.getByText("Service Unavailable", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit response" }).click();
  expect(commands).toHaveLength(2);
  expect(commands[0]?.idempotencyKey).toBe(commands[1]?.idempotencyKey);
});

test("a successful command stays successful when only refresh fails", async ({
  page,
}) => {
  const fixture = {
    ...caseRecord,
    publicCase: { ...caseRecord.publicCase, state: "notice_and_response" },
    appellateTask: null,
    capabilities: {
      view_public_case: true,
      view_party_record: true,
      submit_response: true,
    },
  };
  await installCourtFixtures(page, fixture, true, {
    caseDetailFailureAfter: 1,
  });
  await page.goto(`/app/courts/${caseId}`);
  await page
    .getByLabel("State your response, relevant facts, and any disputed claims.")
    .fill(
      "This response is accepted even though the projection refresh fails.",
    );
  await page.getByRole("button", { name: "Submit response" }).click();
  await expect(page.getByText("Response recorded.")).toBeVisible();
  await expect(
    page.getByText(/action was recorded, but the latest Court record/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry record" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit response" }),
  ).toBeDisabled();
});

test("replacement ballots hydrate the user's recorded decisions", async ({
  page,
}) => {
  const findingRecord = {
    ...caseRecord,
    publicCase: { ...caseRecord.publicCase, state: "finding_ballot" },
    appellateTask: null,
    juryTask: {
      selectionRound: 1,
      seatNumber: 3,
      conflictResult: "clear",
      state: "accepted",
      selectedAt: "2026-08-10T10:00:00.000Z",
      invitationDueAt: "2026-08-13T10:00:00.000Z",
      respondedAt: "2026-08-10T11:00:00.000Z",
      ballot: {
        id: "finding-ballot-existing",
        type: "finding",
        round: 1,
        definition: findingBallotDefinition,
        openedAt: "2026-08-11T10:00:00.000Z",
        closesAt: "2026-08-14T10:00:00.000Z",
        existingVote: {
          revision: 4,
          choice: "substantiated",
          severity: "L3",
          components: [],
        },
      },
    },
    capabilities: {
      view_public_case: true,
      view_jury_task: true,
      vote_finding: true,
    },
  };
  await installCourtFixtures(page, findingRecord);
  await page.goto(`/app/courts/${caseId}`);
  await expect(page.getByLabel("Finding")).toHaveValue("substantiated");
  await expect(page.getByLabel("Severity")).toHaveValue("L3");
  await expect(
    page.getByText(/replaces recorded vote revision 4/),
  ).toBeVisible();
});

test("a recorded no-sentence vote preserves remedy choices without enabling them", async ({
  page,
}) => {
  const remedyRecord = {
    ...caseRecord,
    publicCase: { ...caseRecord.publicCase, state: "sentence_ballot" },
    appellateTask: null,
    juryTask: {
      selectionRound: 1,
      seatNumber: 3,
      conflictResult: "clear",
      state: "accepted",
      selectedAt: "2026-08-10T10:00:00.000Z",
      invitationDueAt: "2026-08-13T10:00:00.000Z",
      respondedAt: "2026-08-10T11:00:00.000Z",
      ballot: {
        id: "remedy-ballot-existing",
        type: "remedy",
        round: 1,
        definition: {
          envelope: {
            ...remedyBallotDefinition.envelope,
            components: [
              {
                ...remedyBallotDefinition.envelope.components[1],
                value: {
                  kind: "quantitative",
                  range: {
                    min: "1",
                    max: "6",
                    step: "1",
                    lessRestrictive: "lower",
                  },
                },
              },
            ],
          },
        },
        openedAt: "2026-08-11T10:00:00.000Z",
        closesAt: "2026-08-14T10:00:00.000Z",
        existingVote: {
          revision: 2,
          choice: "do_not_authorize",
          severity: null,
          components: [
            { componentId: "G-04", include: true, conditionalValue: "5" },
          ],
        },
      },
    },
    capabilities: {
      view_public_case: true,
      view_jury_task: true,
      vote_sentence: true,
    },
  };
  await installCourtFixtures(page, remedyRecord);
  await page.goto(`/app/courts/${caseId}`);
  await expect(
    page.getByRole("checkbox", { name: "Authorize a punitive sentence" }),
  ).not.toBeChecked();
  await expect(page.getByLabel("G-04 value")).toHaveValue("5");
  await expect(page.getByLabel("G-04 value")).toBeDisabled();
  await expect(
    page.getByText("Do not authorize", { exact: true }),
  ).toBeVisible();
});

test("Court notifications explain the event and its deadline", async ({
  page,
}) => {
  await installCourtFixtures(page, caseRecord, true, {
    notifications: [
      {
        id: "notice-response-due",
        kind: "deadline_notice",
        entityType: "case",
        entityId: caseId,
        state: "unread",
        payload: { message: "Your response to the allegation is required." },
        dueAt: "2026-08-13T10:00:00.000Z",
        createdAt: "2026-08-12T10:00:00.000Z",
        readAt: null,
      },
    ],
  });
  await page.goto("/app/courts");
  await page.getByRole("button", { name: /Notifications 1/ }).click();
  await expect(
    page.getByText("Your response to the allegation is required."),
  ).toBeVisible();
  await expect(
    page.getByText("Action deadline", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Due", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mark read" }).click();
  await expect(page.getByText("Read", { exact: true })).toBeVisible();
});

test("respondent and juror duties are projected as distinct work", async ({
  page,
}) => {
  const commands: Record<string, unknown>[] = [];
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
  await installCourtFixtures(page, respondentRecord, true, {
    onCommand: (command) => commands.push(command),
  });
  await page.goto(`/app/courts/${caseId}`);
  await expect(
    page.getByRole("heading", { name: "Respond to the case" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Add evidence" }),
  ).toBeVisible();
  await page
    .getByLabel("State your response, relevant facts, and any disputed claims.")
    .fill("I dispute the allegation and provide the following relevant facts.");
  await page.getByRole("button", { name: "Submit response" }).click();
  expect(latestCommand(commands)?.type).toBe("court.case.respond");

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
      invitationDueAt: "2026-08-14T10:00:00.000Z",
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
  await installCourtFixtures(page, jurorRecord, true, {
    onCommand: (command) => commands.push(command),
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Jury invitation" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept duty" })).toBeVisible();
  await page.getByRole("button", { name: "Accept duty" }).click();
  expect(latestCommand(commands)?.type).toBe("court.jury.respond");
});

test("finding, remedy, appeal, and reopening ballots emit their exact commands", async ({
  page,
}) => {
  const commands: Record<string, unknown>[] = [];
  const install = async (fixture: Record<string, unknown>) => {
    await page.unroute("**/api/**").catch(() => undefined);
    await installCourtFixtures(page, fixture, true, {
      onCommand: (command) => commands.push(command),
    });
    await page.goto(`/app/courts/${caseId}`);
  };

  await install({
    ...caseRecord,
    publicCase: { ...caseRecord.publicCase, state: "finding_ballot" },
    appellateTask: null,
    juryTask: {
      selectionRound: 1,
      seatNumber: 3,
      conflictResult: "clear",
      state: "accepted",
      selectedAt: "2026-08-10T10:00:00.000Z",
      invitationDueAt: "2026-08-13T10:00:00.000Z",
      respondedAt: "2026-08-10T11:00:00.000Z",
      ballot: {
        id: "finding-ballot-1",
        type: "finding",
        round: 1,
        definition: findingBallotDefinition,
        openedAt: "2026-08-11T10:00:00.000Z",
        closesAt: "2026-08-14T10:00:00.000Z",
        existingVote: null,
      },
    },
    capabilities: {
      view_public_case: true,
      view_jury_task: true,
      vote_finding: true,
    },
  });
  await page.getByLabel("Finding").selectOption("substantiated");
  await page.getByLabel("Severity").selectOption("L3");
  await page.getByRole("button", { name: "Cast finding vote" }).click();
  expect(latestCommand(commands)?.type).toBe("court.finding.vote");

  await install({
    ...caseRecord,
    publicCase: { ...caseRecord.publicCase, state: "sentence_ballot" },
    appellateTask: null,
    juryTask: {
      selectionRound: 1,
      seatNumber: 3,
      conflictResult: "clear",
      state: "accepted",
      selectedAt: "2026-08-10T10:00:00.000Z",
      invitationDueAt: "2026-08-13T10:00:00.000Z",
      respondedAt: "2026-08-10T11:00:00.000Z",
      ballot: {
        id: "remedy-ballot-1",
        type: "remedy",
        round: 1,
        definition: remedyBallotDefinition,
        openedAt: "2026-08-11T10:00:00.000Z",
        closesAt: "2026-08-14T10:00:00.000Z",
        existingVote: null,
      },
    },
    capabilities: {
      view_public_case: true,
      view_jury_task: true,
      vote_sentence: true,
    },
  });
  await page.getByRole("button", { name: "Cast remedy vote" }).click();
  expect(latestCommand(commands)?.type).toBe("court.remedy.vote");

  await install(caseRecord);
  await page
    .getByLabel("Explain the legal and evidentiary basis for this outcome.")
    .fill(
      "The frozen record supports affirming the decision under the stated standard.",
    );
  await page.getByRole("button", { name: "Cast appeal vote" }).click();
  expect(latestCommand(commands)?.type).toBe("court.appellate.vote");

  await install({
    ...caseRecord,
    publicCase: {
      ...caseRecord.publicCase,
      state: "final",
      finalityState: "final",
    },
    appellateTask: {
      ...caseRecord.appellateTask,
      kind: "reopening",
      panelState: "ballot",
      brief: {
        kind: "reopening",
        requestId: "reopening-1",
        basis: "material_new_evidence",
        evidenceDigest: "sha256:reopening-evidence",
        evidenceReference: "https://evidence.example/reopening",
        statement:
          "## New evidence\n\nThis verified record was unavailable during the original proceeding.",
        verifierId: "verifier-1",
        verifiedAt: "2026-08-20T10:00:00.000Z",
        filedAt: "2026-08-19T10:00:00.000Z",
      },
    },
    capabilities: {
      view_public_case: true,
      view_jury_task: true,
      vote_reopening: true,
    },
  });
  await page
    .getByLabel(
      "Explain whether the verified evidence meets the reopening standard.",
    )
    .fill(
      "The verified evidence was unavailable and could materially alter the final result.",
    );
  await page.getByRole("button", { name: "Cast reopening vote" }).click();
  expect(latestCommand(commands)?.type).toBe("court.reopening.vote");
});

test("an unauthorized observer receives no private task controls", async ({
  page,
}) => {
  const observerRecord = {
    ...caseRecord,
    partyRecord: null,
    caseRecord: null,
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

test("Court policy hints open the exact Humanode Codex clause", async ({
  page,
}) => {
  await installCourtFixtures(page);
  await page.goto(`/app/courts/${caseId}`);

  await page.locator("h1 .hint-trigger").hover();
  const codexButton = page.getByRole("button", { name: "Humanode Codex" });
  await expect(codexButton).toBeVisible();
  await page.waitForTimeout(2_250);
  await codexButton.click();

  await expect(page).toHaveURL(/clause=HC-3.GOV-03/);
  await expect(page.locator('[data-codex-ref="HC-3.GOV-03"]')).toBeVisible();
});

test("Court timeline evidence references retain exact Codex destinations", async ({
  page,
}) => {
  const referencedRecord = {
    ...caseRecord,
    caseRecord: {
      ...caseRecord.caseRecord,
      events: [
        ...caseRecord.caseRecord.events,
        {
          sequence: 3,
          eventType: "finding_recorded",
          previousState: "finding_ballot",
          nextState: "substantiated",
          payload: {
            evidenceStandard: "E2",
            policyVersion: "court-codex-v1",
            severity: "L3",
          },
          createdAt: "2026-08-12T10:00:00.000Z",
        },
      ],
    },
  };
  await installCourtFixtures(page, referencedRecord);
  await page.goto(`/app/courts/${caseId}`);

  await page
    .locator(".hint-trigger")
    .filter({ hasText: /^E2$/ })
    .first()
    .hover();
  const codexButton = page.getByRole("button", { name: "Humanode Codex" });
  await expect(codexButton).toBeVisible();
  await page.waitForTimeout(2_250);
  await codexButton.click();

  await expect(page).toHaveURL(/clause=HC-4.E2/);
  await expect(page.locator('[data-codex-ref="HC-4.E2"]')).toBeVisible();
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
