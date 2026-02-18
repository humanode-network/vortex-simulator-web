export type StepKey = "essentials" | "plan" | "budget" | "review";

export type TimelineItem = {
  id: string;
  title: string;
  timeframe: string;
  budgetHmnd?: string;
};

export type LinkItem = {
  id: string;
  label: string;
  url: string;
};

export type BudgetItem = {
  id: string;
  description: string;
  amount: string;
};

export type OpenSlotNeedItem = {
  id: string;
  title: string;
  desc: string;
};

export type ProposalDraftForm = {
  title: string;
  chamberId: string;
  summary: string;
  what: string;
  why: string;
  how: string;
  formationEligible?: boolean;
  presetId?: string;
  proposalType:
    | "basic"
    | "fee"
    | "monetary"
    | "core"
    | "administrative"
    | "dao-core";
  metaGovernance?: {
    action:
      | "chamber.create"
      | "chamber.rename"
      | "chamber.dissolve"
      | "chamber.censure"
      | "governor.censure";
    chamberId?: string;
    targetAddress?: string;
    title?: string;
    multiplier?: number;
    genesisMembers?: string[];
  };
  timeline: TimelineItem[];
  outputs: LinkItem[];
  openSlotNeeds: OpenSlotNeedItem[];
  budgetItems: BudgetItem[];
  aboutMe: string;
  attachments: LinkItem[];
  agreeRules: boolean;
  confirmBudget: boolean;
};

export const DEFAULT_DRAFT: ProposalDraftForm = {
  title: "",
  chamberId: "",
  summary: "",
  what: "",
  why: "",
  how: "",
  formationEligible: true,
  presetId: undefined,
  proposalType: "basic",
  metaGovernance: undefined,
  timeline: [
    { id: "ms-1", title: "Milestone 1", timeframe: "2 weeks", budgetHmnd: "" },
    { id: "ms-2", title: "Milestone 2", timeframe: "1 month", budgetHmnd: "" },
  ],
  outputs: [{ id: "out-1", label: "Public update", url: "" }],
  openSlotNeeds: [],
  budgetItems: [{ id: "b-1", description: "Work package", amount: "" }],
  aboutMe: "",
  attachments: [],
  agreeRules: false,
  confirmBudget: false,
};

export function isStepKey(value: string): value is StepKey {
  return value === "essentials" || value === "plan" || value === "budget";
}
