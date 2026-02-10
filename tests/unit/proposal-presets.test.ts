import { test, expect } from "@rstest/core";

import type { ProposalDraftForm } from "../../src/pages/proposals/proposalCreation/types";
import {
  applyPresetToDraft,
  filterPresetsForEligibility,
  getPresetCategory,
  getProposalPreset,
  inferPresetIdFromDraft,
  PROPOSAL_PRESETS,
} from "../../src/pages/proposals/proposalCreation/presets/registry";
import { DEFAULT_DRAFT } from "../../src/pages/proposals/proposalCreation/types";
import { projectTemplate } from "../../src/pages/proposals/proposalCreation/templates/project";

test("applyPresetToDraft seeds formation flags and meta governance", () => {
  const policyPreset = getProposalPreset("project.policy");
  const policyDraft = applyPresetToDraft(DEFAULT_DRAFT, policyPreset);
  expect(policyDraft.formationEligible).toBe(false);
  expect(policyDraft.proposalType).toBe("basic");
  expect(policyDraft.metaGovernance).toBeUndefined();

  const systemPreset = getProposalPreset("system.chamber.create");
  const systemDraft = applyPresetToDraft(DEFAULT_DRAFT, systemPreset);
  expect(systemDraft.formationEligible).toBe(false);
  expect(systemDraft.metaGovernance?.action).toBe("chamber.create");

  const systemFeeDraft = applyPresetToDraft(
    { ...DEFAULT_DRAFT, proposalType: "fee" },
    systemPreset,
  );
  expect(systemFeeDraft.proposalType).toBe("fee");
});

test("applyPresetToDraft preserves existing system meta fields", () => {
  const systemPreset = getProposalPreset("system.chamber.dissolve");
  const draft: ProposalDraftForm = {
    ...DEFAULT_DRAFT,
    metaGovernance: {
      action: "chamber.create",
      chamberId: "temo",
      title: "Temo chamber",
      multiplier: 1.2,
      genesisMembers: ["hm123"],
    },
  };
  const next = applyPresetToDraft(draft, systemPreset);
  expect(next.metaGovernance?.action).toBe("chamber.dissolve");
  expect(next.metaGovernance?.chamberId).toBe("temo");
  expect(next.metaGovernance?.title).toBe("Temo chamber");
  expect(next.metaGovernance?.genesisMembers).toEqual(["hm123"]);
});

test("applyPresetToDraft supports chamber rename preset", () => {
  const systemPreset = getProposalPreset("system.chamber.rename");
  const draft: ProposalDraftForm = {
    ...DEFAULT_DRAFT,
    metaGovernance: {
      action: "chamber.create",
      chamberId: "design",
      title: "Design chamber",
      multiplier: 1.2,
      genesisMembers: ["hm123"],
    },
  };
  const next = applyPresetToDraft(draft, systemPreset);
  expect(next.metaGovernance?.action).toBe("chamber.rename");
  expect(next.metaGovernance?.chamberId).toBe("design");
  expect(next.metaGovernance?.title).toBe("Design chamber");
});

test("getProposalPreset falls back to default preset", () => {
  const preset = getProposalPreset("missing-id");
  expect(PROPOSAL_PRESETS.map((item) => item.id)).toContain(preset.id);
});

test("inferPresetIdFromDraft aligns with system and policy-only drafts", () => {
  expect(inferPresetIdFromDraft(DEFAULT_DRAFT)).toBe("project.blank");
  expect(
    inferPresetIdFromDraft({
      ...DEFAULT_DRAFT,
      formationEligible: false,
    }),
  ).toBe("project.policy");
  expect(
    inferPresetIdFromDraft({
      ...DEFAULT_DRAFT,
      proposalType: "fee",
    }),
  ).toBe("project.fee");
  expect(
    inferPresetIdFromDraft({
      ...DEFAULT_DRAFT,
      metaGovernance: { action: "chamber.dissolve", chamberId: "temo" },
    }),
  ).toBe("system.chamber.dissolve");
  expect(
    inferPresetIdFromDraft({
      ...DEFAULT_DRAFT,
      metaGovernance: { action: "chamber.rename", chamberId: "temo" },
    }),
  ).toBe("system.chamber.rename");
  expect(
    inferPresetIdFromDraft({
      ...DEFAULT_DRAFT,
      metaGovernance: { action: "governor.censure", targetAddress: "hm123" },
    }),
  ).toBe("system.governor.censure");
});

test("project template treats policy-only proposals as budget-valid", () => {
  const draft = {
    ...DEFAULT_DRAFT,
    formationEligible: false,
    title: "Policy change",
    what: "Policy scope",
    why: "Reason",
    how: "Execution notes",
    budgetItems: [],
  };
  const computed = projectTemplate.compute(draft, { budgetTotal: 0 });
  expect(computed.budgetValid).toBe(true);
  expect(computed.planValid).toBe(true);
  expect(computed.essentialsValid).toBe(true);
});

test("getPresetCategory groups presets by taxonomy", () => {
  expect(getPresetCategory(getProposalPreset("system.chamber.create"))).toBe(
    "System changes",
  );
  expect(getPresetCategory(getProposalPreset("project.blank"))).toBe("Basic");
  expect(getPresetCategory(getProposalPreset("project.policy"))).toBe("Basic");
  expect(
    getPresetCategory(getProposalPreset("project.monetary.emission")),
  ).toBe("Monetary");
  expect(
    getPresetCategory(getProposalPreset("project.core.security.policy")),
  ).toBe("Core infrastructure");
});

test("preset registry contains full v1 proposal tree ids", () => {
  const expectedIds = [
    "system.chamber.create",
    "system.chamber.rename",
    "system.chamber.dissolve",
    "system.chamber.censure",
    "system.governor.censure",
    "project.blank",
    "project.fee",
    "project.monetary",
    "project.core",
    "project.administrative",
    "project.dao_core",
    "project.policy",
    "project.fee.policy",
    "project.monetary.policy",
    "project.core.policy",
    "project.admin.policy",
    "project.dao_core.policy",
    "project.basic.design",
    "project.basic.social",
    "project.basic.education",
    "project.basic.frontend",
    "project.core.consensus",
    "project.basic.ecosystem",
    "project.basic.legal",
    "project.basic.financial",
    "project.fee.split.policy",
    "project.fee.payout.policy",
    "project.fee.incentives.policy",
    "project.monetary.fath",
    "project.monetary.emission",
    "project.monetary.distribution.policy",
    "project.monetary.supply.policy",
    "project.monetary.fee-equality.policy",
    "project.core.cryptobiometrics",
    "project.core.sybil",
    "project.core.cvm",
    "project.core.evm",
    "project.core.privacy",
    "project.core.global-state",
    "project.core.delegation",
    "project.core.security.policy",
    "project.core.protocol-upgrades.policy",
    "project.admin.governor-tiers.policy",
    "project.admin.formation.policy",
    "project.admin.chamber-rules.policy",
    "project.admin.veto.policy",
    "project.admin.identity.policy",
    "project.admin.treasury.policy",
    "project.admin.incentives.policy",
    "project.admin.operations.policy",
    "project.admin.legal-compliance.policy",
    "project.dao_core.proposal-protocol.policy",
    "project.dao_core.voting-protocol.policy",
    "project.dao_core.equal-vote.policy",
    "project.dao_core.new-node-types.policy",
    "project.dao_core.core-governance-ideology.policy",
    "project.dao_core.cognitocracy.policy",
    "project.dao_core.meritocracy.policy",
    "project.dao_core.governing-threshold.policy",
  ];

  const actualIds = PROPOSAL_PRESETS.map((preset) => preset.id);
  expect(new Set(actualIds).size).toBe(actualIds.length);
  expectedIds.forEach((id) => {
    expect(actualIds).toContain(id);
  });
});

test("filterPresetsForEligibility applies tier gating", () => {
  const presetIds = filterPresetsForEligibility({
    presets: PROPOSAL_PRESETS,
    currentTier: "Nominee",
    availableChamberIds: ["general", "temo"],
  }).map((preset) => preset.id);

  expect(presetIds).toContain("project.blank");
  expect(presetIds).not.toContain("system.chamber.create");
  expect(presetIds).not.toContain("project.core");
  expect(presetIds).not.toContain("project.dao_core");
});

test("filterPresetsForEligibility applies chamber availability and preserves selection", () => {
  const result = filterPresetsForEligibility({
    presets: PROPOSAL_PRESETS,
    currentTier: "Citizen",
    availableChamberIds: ["temo"],
    selectedPresetId: "system.chamber.create",
  });
  const presetIds = result.map((preset) => preset.id);

  expect(presetIds).toContain("project.blank");
  expect(presetIds.filter((id) => id === "system.chamber.create")).toEqual([
    "system.chamber.create",
  ]);
});

test("filterPresetsForEligibility applies system tier gating from selected type", () => {
  const feeSystem = filterPresetsForEligibility({
    presets: PROPOSAL_PRESETS,
    currentTier: "Ecclesiast",
    availableChamberIds: ["general"],
    systemProposalType: "fee",
  }).map((preset) => preset.id);
  expect(feeSystem).toContain("system.chamber.create");

  const daoCoreSystem = filterPresetsForEligibility({
    presets: PROPOSAL_PRESETS,
    currentTier: "Consul",
    availableChamberIds: ["general"],
    systemProposalType: "dao-core",
  }).map((preset) => preset.id);
  expect(daoCoreSystem).not.toContain("system.chamber.create");
});

test("system preset group is locked to executable chamber actions", () => {
  const systemPresetIds = PROPOSAL_PRESETS.filter(
    (preset) => preset.templateId === "system",
  ).map((preset) => preset.id);

  expect(systemPresetIds).toEqual([
    "system.chamber.create",
    "system.chamber.rename",
    "system.chamber.dissolve",
    "system.chamber.censure",
    "system.governor.censure",
  ]);
});
