import type { ProposalDraftForm } from "../types";
import type { WizardTemplateId } from "../templates/types";
import {
  isTierEligible,
  requiredTierForProposalType,
} from "../../../../lib/proposalTypes";

export type ProposalPresetId =
  | "system.chamber.create"
  | "system.chamber.rename"
  | "system.chamber.dissolve"
  | "system.chamber.censure"
  | "system.governor.censure"
  | "project.blank"
  | "project.fee"
  | "project.monetary"
  | "project.core"
  | "project.administrative"
  | "project.dao_core"
  | "project.policy"
  | "project.fee.policy"
  | "project.monetary.policy"
  | "project.core.policy"
  | "project.admin.policy"
  | "project.dao_core.policy"
  | "project.basic.design"
  | "project.basic.social"
  | "project.basic.education"
  | "project.basic.frontend"
  | "project.core.consensus"
  | "project.basic.ecosystem"
  | "project.basic.legal"
  | "project.basic.financial"
  | "project.fee.split.policy"
  | "project.fee.payout.policy"
  | "project.fee.incentives.policy"
  | "project.monetary.fath"
  | "project.monetary.emission"
  | "project.monetary.distribution.policy"
  | "project.monetary.supply.policy"
  | "project.monetary.fee-equality.policy"
  | "project.core.cryptobiometrics"
  | "project.core.sybil"
  | "project.core.cvm"
  | "project.core.evm"
  | "project.core.privacy"
  | "project.core.global-state"
  | "project.core.delegation"
  | "project.core.security.policy"
  | "project.core.protocol-upgrades.policy"
  | "project.admin.formation.policy"
  | "project.admin.chamber-rules.policy"
  | "project.admin.veto.policy"
  | "project.admin.identity.policy"
  | "project.admin.treasury.policy"
  | "project.admin.incentives.policy"
  | "project.admin.operations.policy"
  | "project.admin.legal-compliance.policy"
  | "project.dao_core.proposal-protocol.policy"
  | "project.dao_core.voting-protocol.policy"
  | "project.dao_core.equal-vote.policy"
  | "project.dao_core.new-node-types.policy"
  | "project.dao_core.core-governance-ideology.policy"
  | "project.dao_core.cognitocracy.policy"
  | "project.dao_core.meritocracy.policy"
  | "project.dao_core.governing-threshold.policy";

export type ProposalPreset = {
  id: ProposalPresetId;
  label: string;
  description: string;
  templateId: WizardTemplateId;
  proposalType: ProposalDraftForm["proposalType"];
  formationEligible: boolean;
  recommendedChamber?: string;
  defaultChamberId?: string;
  metaGovernance?: ProposalDraftForm["metaGovernance"];
};

export function getPresetCategory(preset: ProposalPreset): string {
  if (preset.templateId === "system") {
    return "System changes";
  }
  switch (preset.proposalType) {
    case "basic":
      return "Basic";
    case "fee":
      return "Fee distribution";
    case "monetary":
      return "Monetary";
    case "core":
      return "Core infrastructure";
    case "administrative":
      return "Administrative";
    case "dao-core":
      return "DAO core";
    default:
      return "Project";
  }
}

export const PROPOSAL_PRESETS: ProposalPreset[] = [
  {
    id: "system.chamber.create",
    label: "Create chamber",
    description: "Create a new chamber via General-chamber approval.",
    templateId: "system",
    proposalType: "administrative",
    formationEligible: false,
    metaGovernance: {
      action: "chamber.create",
      chamberId: "",
      title: "",
      multiplier: 1,
      genesisMembers: [],
    },
  },
  {
    id: "system.chamber.rename",
    label: "Rename chamber",
    description: "Rename an active chamber via General-chamber approval.",
    templateId: "system",
    proposalType: "administrative",
    formationEligible: false,
    metaGovernance: {
      action: "chamber.rename",
      chamberId: "",
      title: "",
    },
  },
  {
    id: "system.chamber.dissolve",
    label: "Dissolve chamber",
    description: "Dissolve an existing chamber via General-chamber approval.",
    templateId: "system",
    proposalType: "administrative",
    formationEligible: false,
    metaGovernance: {
      action: "chamber.dissolve",
      chamberId: "",
    },
  },
  {
    id: "system.chamber.censure",
    label: "Censure chamber",
    description:
      "Censure an existing chamber via General-chamber approval (target chamber members are excluded from this vote).",
    templateId: "system",
    proposalType: "administrative",
    formationEligible: false,
    metaGovernance: {
      action: "chamber.censure",
      chamberId: "",
    },
  },
  {
    id: "system.governor.censure",
    label: "Censure governor",
    description:
      "Censure a governor via General-chamber approval; target governor actions are temporarily blocked.",
    templateId: "system",
    proposalType: "administrative",
    formationEligible: false,
    metaGovernance: {
      action: "governor.censure",
      targetAddress: "",
    },
  },
  {
    id: "project.blank",
    label: "Basic project",
    description: "Full project proposal with milestones and budget.",
    templateId: "project",
    proposalType: "basic",
    formationEligible: true,
    recommendedChamber: "Specialization chamber",
  },
  {
    id: "project.fee",
    label: "Fee distribution",
    description: "Change fee distribution policy via a formation project.",
    templateId: "project",
    proposalType: "fee",
    formationEligible: true,
    recommendedChamber: "Economics chamber",
  },
  {
    id: "project.monetary",
    label: "Monetary system",
    description: "Monetary or emission policy changes with formation delivery.",
    templateId: "project",
    proposalType: "monetary",
    formationEligible: true,
    recommendedChamber: "Economics chamber",
  },
  {
    id: "project.core",
    label: "Core infrastructure",
    description: "Protocol or infrastructure work with formation milestones.",
    templateId: "project",
    proposalType: "core",
    formationEligible: true,
    recommendedChamber: "Engineering chamber",
  },
  {
    id: "project.administrative",
    label: "Administrative project",
    description: "Governance administration work delivered via formation.",
    templateId: "project",
    proposalType: "administrative",
    formationEligible: true,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.dao_core",
    label: "DAO core project",
    description: "Constitutional governance changes with formation delivery.",
    templateId: "project",
    proposalType: "dao-core",
    formationEligible: true,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.policy",
    label: "Basic project",
    description: "Policy proposal without formation milestones or budget.",
    templateId: "project",
    proposalType: "basic",
    formationEligible: false,
    recommendedChamber: "Specialization chamber",
  },
  {
    id: "project.fee.policy",
    label: "Fee distribution",
    description: "Policy-only fee distribution proposal.",
    templateId: "project",
    proposalType: "fee",
    formationEligible: false,
    recommendedChamber: "Economics chamber",
  },
  {
    id: "project.monetary.policy",
    label: "Monetary system",
    description: "Policy-only monetary system proposal.",
    templateId: "project",
    proposalType: "monetary",
    formationEligible: false,
    recommendedChamber: "Economics chamber",
  },
  {
    id: "project.core.policy",
    label: "Core infrastructure",
    description: "Core infrastructure policy proposal.",
    templateId: "project",
    proposalType: "core",
    formationEligible: false,
    recommendedChamber: "Engineering chamber",
  },
  {
    id: "project.admin.policy",
    label: "Administrative project",
    description: "Governance policy proposal without formation milestones.",
    templateId: "project",
    proposalType: "administrative",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.dao_core.policy",
    label: "DAO core project",
    description: "Constitutional governance policy proposal.",
    templateId: "project",
    proposalType: "dao-core",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.basic.design",
    label: "Design & UX project",
    description: "Design system, UX audits, and UI revamps.",
    templateId: "project",
    proposalType: "basic",
    formationEligible: true,
    recommendedChamber: "Specialization chamber",
  },
  {
    id: "project.basic.social",
    label: "Social media & community",
    description: "Content, campaigns, and community growth.",
    templateId: "project",
    proposalType: "basic",
    formationEligible: true,
    recommendedChamber: "Specialization chamber",
  },
  {
    id: "project.basic.education",
    label: "Education & training",
    description: "Guides, curricula, and onboarding programs.",
    templateId: "project",
    proposalType: "basic",
    formationEligible: true,
    recommendedChamber: "Specialization chamber",
  },
  {
    id: "project.basic.frontend",
    label: "Front-end",
    description: "Frontend implementation and UX improvements.",
    templateId: "project",
    proposalType: "basic",
    formationEligible: true,
    recommendedChamber: "Specialization chamber",
  },
  {
    id: "project.core.consensus",
    label: "Consensus protocol",
    description: "Consensus improvements via core infrastructure work.",
    templateId: "project",
    proposalType: "core",
    formationEligible: true,
    recommendedChamber: "Engineering chamber",
  },
  {
    id: "project.basic.ecosystem",
    label: "Ecosystem development",
    description: "Partnerships, integrations, and ecosystem growth.",
    templateId: "project",
    proposalType: "basic",
    formationEligible: true,
    recommendedChamber: "Specialization chamber",
  },
  {
    id: "project.basic.legal",
    label: "Legal advisory project",
    description: "Legal research, frameworks, and advisory support.",
    templateId: "project",
    proposalType: "basic",
    formationEligible: true,
    recommendedChamber: "Specialization chamber",
  },
  {
    id: "project.basic.financial",
    label: "Financial management advisory",
    description: "Treasury planning, reporting, and advisory work.",
    templateId: "project",
    proposalType: "basic",
    formationEligible: true,
    recommendedChamber: "Specialization chamber",
  },
  {
    id: "project.fee.split.policy",
    label: "Fee split",
    description: "Define fee split between vault and validators.",
    templateId: "project",
    proposalType: "fee",
    formationEligible: false,
    recommendedChamber: "Economics chamber",
  },
  {
    id: "project.fee.payout.policy",
    label: "Fee payout cadence",
    description: "Update payout cadence or distribution policy.",
    templateId: "project",
    proposalType: "fee",
    formationEligible: false,
    recommendedChamber: "Economics chamber",
  },
  {
    id: "project.fee.incentives.policy",
    label: "Fee incentive overlays",
    description: "Introduce incentive overlays or bonus schemes.",
    templateId: "project",
    proposalType: "fee",
    formationEligible: false,
    recommendedChamber: "Economics chamber",
  },
  {
    id: "project.monetary.fath",
    label: "Fath implementation",
    description: "Implement the Fath monetary mechanism.",
    templateId: "project",
    proposalType: "monetary",
    formationEligible: true,
    recommendedChamber: "Economics chamber",
  },
  {
    id: "project.monetary.emission",
    label: "Emission",
    description: "Define or implement emission programs.",
    templateId: "project",
    proposalType: "monetary",
    formationEligible: true,
    recommendedChamber: "Economics chamber",
  },
  {
    id: "project.monetary.distribution.policy",
    label: "Emission distribution",
    description: "Set emission distribution rules and allocation.",
    templateId: "project",
    proposalType: "monetary",
    formationEligible: false,
    recommendedChamber: "Economics chamber",
  },
  {
    id: "project.monetary.supply.policy",
    label: "Supply balancing",
    description: "Supply balancing or stabilization mechanisms.",
    templateId: "project",
    proposalType: "monetary",
    formationEligible: false,
    recommendedChamber: "Economics chamber",
  },
  {
    id: "project.monetary.fee-equality.policy",
    label: "Fee distribution equality",
    description: "Ensure equal fee distribution among human nodes.",
    templateId: "project",
    proposalType: "monetary",
    formationEligible: false,
    recommendedChamber: "Economics chamber",
  },
  {
    id: "project.core.cryptobiometrics",
    label: "Cryptobiometrics",
    description: "Multimodal cryptobiometrics implementation.",
    templateId: "project",
    proposalType: "core",
    formationEligible: true,
    recommendedChamber: "Engineering chamber",
  },
  {
    id: "project.core.sybil",
    label: "Sybil defense",
    description: "Sybil defense mechanisms through cryptobiometrics.",
    templateId: "project",
    proposalType: "core",
    formationEligible: true,
    recommendedChamber: "Engineering chamber",
  },
  {
    id: "project.core.cvm",
    label: "CVM",
    description: "Control and governance of CVM deployments.",
    templateId: "project",
    proposalType: "core",
    formationEligible: true,
    recommendedChamber: "Engineering chamber",
  },
  {
    id: "project.core.evm",
    label: "EVM",
    description: "EVM support and runtime interoperability work.",
    templateId: "project",
    proposalType: "core",
    formationEligible: true,
    recommendedChamber: "Engineering chamber",
  },
  {
    id: "project.core.privacy",
    label: "Privacy",
    description: "Privacy tooling and protocol-layer privacy improvements.",
    templateId: "project",
    proposalType: "core",
    formationEligible: true,
    recommendedChamber: "Engineering chamber",
  },
  {
    id: "project.core.global-state",
    label: "Human node equality",
    description: "Equality between peers in global state decisions.",
    templateId: "project",
    proposalType: "core",
    formationEligible: true,
    recommendedChamber: "Engineering chamber",
  },
  {
    id: "project.core.delegation",
    label: "Delegation mechanics",
    description: "Delegation system delivery or upgrades.",
    templateId: "project",
    proposalType: "core",
    formationEligible: true,
    recommendedChamber: "Engineering chamber",
  },
  {
    id: "project.core.security.policy",
    label: "Security & integrity",
    description: "Security policies, audits, and integrity constraints.",
    templateId: "project",
    proposalType: "core",
    formationEligible: false,
    recommendedChamber: "Engineering chamber",
  },
  {
    id: "project.core.protocol-upgrades.policy",
    label: "Protocol upgrades",
    description: "Runtime upgrade policy and feature toggles.",
    templateId: "project",
    proposalType: "core",
    formationEligible: false,
    recommendedChamber: "Engineering chamber",
  },
  {
    id: "project.admin.formation.policy",
    label: "Formation procedures",
    description: "Formation procedures, grants, and operations.",
    templateId: "project",
    proposalType: "administrative",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.admin.chamber-rules.policy",
    label: "Chamber rules",
    description: "Chamber rules, membership, and governance ops.",
    templateId: "project",
    proposalType: "dao-core",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.admin.veto.policy",
    label: "Veto council",
    description: "Veto council rules and governance operations.",
    templateId: "project",
    proposalType: "dao-core",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.admin.identity.policy",
    label: "Identity & eligibility",
    description: "Eligibility rules, PoBU, and admission policies.",
    templateId: "project",
    proposalType: "dao-core",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.admin.treasury.policy",
    label: "Treasury & grants",
    description: "Treasury rules, grants, and funding caps.",
    templateId: "project",
    proposalType: "administrative",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.admin.incentives.policy",
    label: "Incentives & reputation",
    description: "CM multipliers, incentives, and reputation mechanics.",
    templateId: "project",
    proposalType: "administrative",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.admin.operations.policy",
    label: "Operations",
    description: "Operational standards and node requirements.",
    templateId: "project",
    proposalType: "administrative",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.admin.legal-compliance.policy",
    label: "Legal & compliance",
    description: "Compliance requirements, audits, and legal frameworks.",
    templateId: "project",
    proposalType: "administrative",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.dao_core.proposal-protocol.policy",
    label: "Proposal engine",
    description: "Proposal system values and protocol changes.",
    templateId: "project",
    proposalType: "dao-core",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.dao_core.voting-protocol.policy",
    label: "Voting proceedure",
    description: "Vortex voting values and protocol updates.",
    templateId: "project",
    proposalType: "dao-core",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.dao_core.equal-vote.policy",
    label: "Equal voting power",
    description: "Equal voting power distribution policies.",
    templateId: "project",
    proposalType: "dao-core",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.dao_core.new-node-types.policy",
    label: "Human nodes types",
    description: "Creation of new types of human nodes.",
    templateId: "project",
    proposalType: "dao-core",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.dao_core.core-governance-ideology.policy",
    label: "Core governance idealogy",
    description: "Core governance ideology and constitutional principles.",
    templateId: "project",
    proposalType: "dao-core",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.dao_core.cognitocracy.policy",
    label: "Cognitocracy",
    description: "Cognitocracy model and cognition-weight governance rules.",
    templateId: "project",
    proposalType: "dao-core",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.dao_core.meritocracy.policy",
    label: "Meritocracy",
    description: "Meritocracy model and merit-linked governance rules.",
    templateId: "project",
    proposalType: "dao-core",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
  {
    id: "project.dao_core.governing-threshold.policy",
    label: "Governing threshhold",
    description: "Governing thresholds and quorum constraints.",
    templateId: "project",
    proposalType: "dao-core",
    formationEligible: false,
    recommendedChamber: "General chamber",
    defaultChamberId: "general",
  },
];

export const DEFAULT_PRESET_ID: ProposalPresetId = "project.blank";

export function getProposalPreset(id?: string | null): ProposalPreset {
  return (
    PROPOSAL_PRESETS.find((preset) => preset.id === id) ??
    PROPOSAL_PRESETS.find((preset) => preset.id === DEFAULT_PRESET_ID) ??
    PROPOSAL_PRESETS[0]
  );
}

export function inferPresetIdFromDraft(
  draft: ProposalDraftForm,
): ProposalPresetId {
  const explicit = draft.presetId;
  if (explicit && PROPOSAL_PRESETS.some((preset) => preset.id === explicit)) {
    return explicit as ProposalPresetId;
  }

  const systemAction = draft.metaGovernance?.action;
  if (systemAction === "chamber.rename") return "system.chamber.rename";
  if (systemAction === "chamber.dissolve") return "system.chamber.dissolve";
  if (systemAction === "chamber.censure") return "system.chamber.censure";
  if (systemAction === "governor.censure") return "system.governor.censure";
  if (systemAction === "chamber.create") return "system.chamber.create";

  const formationEligible = draft.formationEligible !== false;
  switch (draft.proposalType) {
    case "fee":
      return formationEligible ? "project.fee" : "project.fee.policy";
    case "monetary":
      return formationEligible ? "project.monetary" : "project.monetary.policy";
    case "core":
      return formationEligible ? "project.core" : "project.core.policy";
    case "administrative":
      return formationEligible
        ? "project.administrative"
        : "project.admin.policy";
    case "dao-core":
      return formationEligible ? "project.dao_core" : "project.dao_core.policy";
    case "basic":
    default:
      return formationEligible ? "project.blank" : "project.policy";
  }
}

export function filterPresetsForEligibility(args: {
  presets: ProposalPreset[];
  currentTier: string | null;
  availableChamberIds: Iterable<string>;
  selectedPresetId?: string | null;
  systemProposalType?: ProposalDraftForm["proposalType"] | null;
}): ProposalPreset[] {
  const available = new Set(
    Array.from(args.availableChamberIds, (value) => value.trim().toLowerCase()),
  );
  const eligible = args.presets.filter((preset) => {
    const effectiveType =
      preset.templateId === "system" && args.systemProposalType
        ? args.systemProposalType
        : preset.proposalType;
    const requiredTier = requiredTierForProposalType(effectiveType);
    if (args.currentTier && !isTierEligible(args.currentTier, requiredTier)) {
      return false;
    }

    if (preset.templateId === "system") {
      return available.has("general");
    }

    if (preset.defaultChamberId) {
      return available.has(preset.defaultChamberId.trim().toLowerCase());
    }

    return true;
  });

  if (
    !args.selectedPresetId ||
    eligible.some((preset) => preset.id === args.selectedPresetId)
  ) {
    return eligible;
  }

  const selected = args.presets.find(
    (preset) => preset.id === args.selectedPresetId,
  );
  return selected ? [selected, ...eligible] : eligible;
}

export function applyPresetToDraft(
  draft: ProposalDraftForm,
  preset: ProposalPreset,
): ProposalDraftForm {
  const mergedMeta = preset.metaGovernance
    ? {
        ...preset.metaGovernance,
        ...(draft.metaGovernance ?? {}),
        action: preset.metaGovernance.action,
      }
    : undefined;

  const nextSystemType: ProposalDraftForm["proposalType"] =
    draft.proposalType === "basic" ? "administrative" : draft.proposalType;

  return {
    ...draft,
    presetId: preset.id,
    proposalType:
      preset.templateId === "system" ? nextSystemType : preset.proposalType,
    formationEligible: preset.formationEligible,
    metaGovernance: mergedMeta,
    chamberId:
      preset.templateId === "system"
        ? "general"
        : preset.defaultChamberId && !draft.chamberId
          ? preset.defaultChamberId
          : draft.chamberId,
  };
}
