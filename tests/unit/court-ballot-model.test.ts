import { describe, expect, test } from "@rstest/core";

import {
  courtInitialAppellateResult,
  courtFindingDefinition,
  courtInitialFinding,
  courtInitialRemedyChoices,
  courtInitialSentenceAuthorization,
  courtInitialSeverity,
  courtRemedyEnvelope,
  courtRemedyComponents,
  courtRemedySelectionIssues,
  courtSelectedRemedyBurden,
} from "@/pages/courts/model/courtBallot";

const existingVote = {
  revision: 3,
  choice: "authorize",
  severity: "L3",
  components: [
    {
      componentId: "G-04",
      include: true,
      conditionalValue: "45",
    },
    {
      componentId: "D-02",
      include: false,
      conditionalValue: null,
    },
  ],
};

const remedyDefinition = {
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
        id: "G-04",
        domain: "governance_restriction",
        harmKey: "proposal_creation_restriction",
        mode: "optional",
        countsTowardPunitiveLimit: true,
        burden: { unit: "eras", weight: 2 },
        executorId: "governance-restriction",
        executorVersion: "v1",
        expiryBehavior: "expires_after_term",
        appealBehavior: "stay_on_appeal",
        value: {
          kind: "quantitative",
          range: { min: "1", max: "90", step: "1", lessRestrictive: "lower" },
        },
      },
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
    ],
    maximumComponentCount: 2,
    maximumBurden: "90",
    maximumComponentsByDomain: {
      governance_restriction: 1,
      public_record: 1,
    },
    requiredOneOfComponentGroups: [["G-04", "D-02"]],
    incompatibleComponentPairs: [["G-04", "D-02"]],
  },
};

describe("Court ballot hydration", () => {
  test("hydrates a recorded finding instead of defaulting a replacement vote", () => {
    expect(
      courtInitialFinding({ ...existingVote, choice: "substantiated" }),
    ).toBe("substantiated");
    expect(courtInitialSeverity(existingVote)).toBe("L3");
    expect(
      courtInitialSentenceAuthorization({
        ...existingVote,
        choice: "do_not_authorize",
      }),
    ).toBe(false);
  });

  test("projects only frozen offense severities and evidence standards", () => {
    const definition = courtFindingDefinition({
      offenseCode: "CMP-01",
      allowedSeverities: ["L1", "L2", "L3"],
      evidenceStandards: { L1: "E1", L2: "E2", L3: "E2" },
    });
    expect(definition).toEqual({
      offenseCode: "CMP-01",
      allowedSeverities: ["L1", "L2", "L3"],
      evidenceStandards: { L1: "E1", L2: "E2", L3: "E2", L4: null },
    });
    expect(courtInitialSeverity(existingVote, ["L1", "L2"])).toBe("L1");
  });

  test("hydrates every recorded remedy component inside the frozen envelope", () => {
    const components = courtRemedyComponents(remedyDefinition);
    expect(courtInitialRemedyChoices(components, existingVote)).toEqual({
      "G-04": { include: true, conditionalValue: "45" },
      "D-02": { include: false },
    });
    const envelope = courtRemedyEnvelope(remedyDefinition);
    expect(envelope?.thresholds.authorization).toBe(8);
    expect(envelope?.components[0]).toMatchObject({
      id: "G-04",
      executorId: "governance-restriction",
      burden: { unit: "eras", weight: 2 },
    });
    expect(
      courtSelectedRemedyBurden(components, {
        "G-04": { include: true, conditionalValue: "45" },
        "D-02": { include: true },
      }),
    ).toBe("90");
    expect(
      envelope &&
        courtRemedySelectionIssues(envelope, {
          "G-04": { include: true, conditionalValue: "45" },
          "D-02": { include: true },
        }),
    ).toContainEqual({
      code: "incompatible_pair",
      components: ["G-04", "D-02"],
    });
  });

  test("hydrates an existing appellate outcome", () => {
    expect(
      courtInitialAppellateResult({
        panelId: "panel-1",
        kind: "ordinary",
        panelState: "ballot",
        seatNumber: 1,
        invitationDueAt: "2026-08-13T00:00:00.000Z",
        result: null,
        brief: {
          kind: "ordinary",
          appealId: "appeal-1",
          groundCode: "material_evidence_error",
          groundsDigest: "sha256:grounds",
          grounds: "Material evidence was excluded.",
          stayState: "granted",
          deadlineAt: "2026-08-17T00:00:00.000Z",
          filedAt: "2026-08-10T00:00:00.000Z",
        },
        remedies: [],
        existingVote: { result: "remanded", modificationPackageId: null },
        modificationPackages: [],
      }),
    ).toBe("remanded");
  });
});
