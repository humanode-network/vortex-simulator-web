export const proposalStages = ["pool", "vote", "build"] as const;

export type ProposalStage = (typeof proposalStages)[number];

export const feedStages = [
  "pool",
  "vote",
  "build",
  "thread",
  "courts",
  "faction",
] as const;

export type FeedStage = (typeof feedStages)[number];

export type Stage = ProposalStage | FeedStage;

export type StageChipKind =
  | "proposal_pool"
  | "chamber_vote"
  | "formation"
  | "thread"
  | "courts"
  | "faction";

export const stageToChipKind = {
  pool: "proposal_pool",
  vote: "chamber_vote",
  build: "formation",
  thread: "thread",
  courts: "courts",
  faction: "faction",
} as const satisfies Record<Stage, StageChipKind>;

export const stageLabel = {
  pool: "Proposal pool",
  vote: "Chamber vote",
  build: "Formation",
  thread: "Thread",
  courts: "Courts",
  faction: "Faction",
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
