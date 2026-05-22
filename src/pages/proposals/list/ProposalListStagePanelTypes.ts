import type { getFormationProgress } from "@/lib/dtoParsers";
import type {
  getChamberProposalListStats,
  getPoolProposalListStats,
} from "@/lib/proposalListUi";

export type ProposalPoolSnapshotProps = {
  downvotes: number;
  upvotes: number;
  stats: ReturnType<typeof getPoolProposalListStats>;
};

export type ProposalChamberSnapshotProps = {
  formationEligible: boolean;
  passingRule: string;
  timeLeft: string;
  stats: ReturnType<typeof getChamberProposalListStats>;
};

export type ProposalStageDataItem = {
  title: string;
  description: string;
  value: string;
  tone?: "ok" | "warn";
};

export type ProposalFinishedSnapshotProps = {
  itemKeyPrefix: string;
  stageData: ProposalStageDataItem[];
  terminalSummary: string;
};

export type ProposalCitizenVetoSnapshotProps = {
  attemptsRemaining: number;
  attemptsUsed: number;
  itemKeyPrefix: string;
  stageData: ProposalStageDataItem[];
};

export type ProposalChamberVetoSnapshotProps = {
  chamberThreshold: number;
  itemKeyPrefix: string;
  stageData: ProposalStageDataItem[];
  vetoingChambers: number;
};

export type ProposalFormationSnapshotProps = {
  itemKeyPrefix: string;
  progress: string;
  stageData: ProposalStageDataItem[];
  stats: ReturnType<typeof getFormationProgress>;
  timeLeft: string;
};
