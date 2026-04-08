export const proposalStages = [
  "pool",
  "vote",
  "citizen_veto",
  "chamber_veto",
  "build",
  "passed",
  "failed",
] as const;

export type ProposalStage = (typeof proposalStages)[number];

export const feedStages = [
  "pool",
  "vote",
  "citizen_veto",
  "chamber_veto",
  "build",
  "passed",
  "failed",
  "thread",
  "courts",
  "faction",
  "system",
] as const;

export type FeedStage = (typeof feedStages)[number];

export type Stage = ProposalStage | FeedStage;

export type StageChipKind =
  | "proposal_pool"
  | "chamber_vote"
  | "citizen_veto"
  | "chamber_veto"
  | "formation"
  | "passed"
  | "failed"
  | "thread"
  | "courts"
  | "faction"
  | "system";

export const stageToChipKind = {
  pool: "proposal_pool",
  vote: "chamber_vote",
  citizen_veto: "citizen_veto",
  chamber_veto: "chamber_veto",
  build: "formation",
  passed: "passed",
  failed: "failed",
  thread: "thread",
  courts: "courts",
  faction: "faction",
  system: "system",
} as const satisfies Record<Stage, StageChipKind>;

export const stageLabel = {
  pool: "Proposal pool",
  vote: "Chamber vote",
  citizen_veto: "Citizen veto",
  chamber_veto: "Chamber veto",
  build: "Formation",
  passed: "Passed",
  failed: "Failed",
  thread: "Thread",
  courts: "Courts",
  faction: "Faction",
  system: "System",
} as const satisfies Record<Stage, string>;

export const proposalStageToChipKind: Record<ProposalStage, StageChipKind> =
  stageToChipKind;

export const feedStageToChipKind: Record<FeedStage, StageChipKind> =
  stageToChipKind;

export const proposalStageLabel: Record<ProposalStage, string> = stageLabel;

export const feedStageLabel: Record<FeedStage, string> = stageLabel;

export function stageChipKindForStage(stage: Stage) {
  return stageToChipKind[stage];
}

export function stageLabelForStage(stage: Stage) {
  return stageLabel[stage];
}

export function stageChipKindForProposalStage(stage: ProposalStage) {
  return stageChipKindForStage(stage);
}

export function stageChipKindForFeedStage(stage: FeedStage) {
  return stageChipKindForStage(stage);
}
