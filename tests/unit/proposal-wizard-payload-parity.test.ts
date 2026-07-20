import { expect, test } from "@rstest/core";

import { draftToApiForm } from "../../src/pages/proposals/proposalCreation/toApiForm";
import {
  SYSTEM_ACTIONS,
  type SystemActionId,
} from "../../src/pages/proposals/proposalCreation/templates/systemActions";
import {
  DEFAULT_DRAFT,
  type ProposalDraftForm,
} from "../../src/pages/proposals/proposalCreation/types";

test("policy payload preserves Initiative and reconsideration provenance", () => {
  const payload = draftToApiForm(
    {
      ...structuredClone(DEFAULT_DRAFT),
      title: "Policy",
      chamberId: "general",
      summary: "Policy summary",
      what: "Policy change",
      why: "Policy reason",
      how: "Policy publication",
      formationEligible: false,
      presetId: "project.policy",
      initiativeId: "initiative-1",
      resubmitsProposalId: "proposal-root",
      agreeRules: true,
      confirmBudget: true,
    },
    { templateId: "project" },
  );
  expect(payload).toMatchObject({
    templateId: "project",
    presetId: "project.policy",
    initiativeId: "initiative-1",
    resubmitsProposalId: "proposal-root",
    formationEligible: false,
    title: "Policy",
    chamberId: "general",
  });
});

test("Formation payload aligns positive milestone budgets", () => {
  const payload = draftToApiForm(
    {
      ...structuredClone(DEFAULT_DRAFT),
      title: "Formation",
      formationEligible: true,
      timeline: [
        {
          id: "m1",
          title: "Research",
          timeframe: "2 weeks",
          budgetHmnd: "150",
        },
        {
          id: "m2",
          title: "",
          timeframe: "1 month",
          budgetHmnd: "250",
        },
      ],
    },
    { templateId: "project" },
  );
  expect(payload.budgetItems).toEqual([
    { id: "m1", description: "Research", amount: "150" },
    { id: "m2", description: "Milestone 2", amount: "250" },
  ]);
});

test("system payload preserves executable action metadata", () => {
  const payload = draftToApiForm(
    {
      ...structuredClone(DEFAULT_DRAFT),
      title: "Create research chamber",
      chamberId: "general",
      how: "Adopt the chamber definition",
      proposalType: "administrative",
      presetId: "system.chamber.create",
      formationEligible: false,
      metaGovernance: {
        action: "chamber.create",
        chamberId: "research",
        title: "Research Chamber",
        multiplier: 1.4,
        genesisMembers: ["hm123"],
      },
    },
    { templateId: "system" },
  );
  expect(payload).toMatchObject({
    templateId: "system",
    presetId: "system.chamber.create",
    chamberId: "general",
    metaGovernance: {
      action: "chamber.create",
      chamberId: "research",
      title: "Research Chamber",
      multiplier: 1.4,
      genesisMembers: ["hm123"],
    },
  });
});

test("every registered system action keeps its declared target shape", () => {
  for (const action of Object.keys(SYSTEM_ACTIONS) as SystemActionId[]) {
    const meta = SYSTEM_ACTIONS[action];
    const payload = draftToApiForm(
      {
        ...structuredClone(DEFAULT_DRAFT),
        title: `${meta.label} proposal`,
        chamberId: "general",
        how: "Apply and verify the approved system change.",
        proposalType: "administrative",
        presetId: `system.${action}` as ProposalDraftForm["presetId"],
        formationEligible: false,
        metaGovernance: {
          action,
          ...(meta.requiresChamberId ? { chamberId: "research" } : {}),
          ...(meta.requiresTargetAddress ? { targetAddress: "hm123" } : {}),
          ...(meta.requiresTitle ? { title: "Research Chamber" } : {}),
          ...(meta.showMultiplier ? { multiplier: 1.4 } : {}),
          ...(meta.showGenesisMembers ? { genesisMembers: ["hm123"] } : {}),
        },
      },
      { templateId: "system" },
    );

    expect(payload.metaGovernance).toEqual({
      action,
      ...(meta.requiresChamberId ? { chamberId: "research" } : {}),
      ...(meta.requiresTargetAddress ? { targetAddress: "hm123" } : {}),
      ...(meta.requiresTitle ? { title: "Research Chamber" } : {}),
      ...(meta.showMultiplier ? { multiplier: 1.4 } : {}),
      ...(meta.showGenesisMembers ? { genesisMembers: ["hm123"] } : {}),
    });
  }
});
