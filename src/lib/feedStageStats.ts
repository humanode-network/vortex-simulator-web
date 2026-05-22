import { parseRatio } from "@/lib/dtoParsers";
import type {
  ChamberProposalPageDto,
  FormationProposalPageDto,
  PoolProposalPageDto,
} from "@/types/api";

export function getFeedPoolStats(poolPage: PoolProposalPageDto) {
  const activeGovernors = Math.max(1, poolPage.activeGovernors);
  const engaged = poolPage.upvotes + poolPage.downvotes;
  const attentionPercent = Math.round((engaged / activeGovernors) * 100);
  const attentionNeededPercent = Math.round(poolPage.attentionQuorum * 100);
  const upvoteFloorFractionPercent = Math.round(
    ((poolPage.thresholdContext?.quorumThreshold?.upvoteFloorFraction ?? 0.1) *
      1000) /
      10,
  );
  const upvoteFloorProgressPercent = Math.round(
    Math.min(
      1,
      poolPage.upvoteFloor > 0 ? poolPage.upvotes / poolPage.upvoteFloor : 0,
    ) * upvoteFloorFractionPercent,
  );
  const meetsAttention = engaged / activeGovernors >= poolPage.attentionQuorum;
  const meetsUpvoteFloor = poolPage.upvotes >= poolPage.upvoteFloor;
  const engagedNeeded = Math.ceil(poolPage.attentionQuorum * activeGovernors);

  return {
    activeGovernors,
    engaged,
    attentionPercent,
    attentionNeededPercent,
    upvoteFloorFractionPercent,
    upvoteFloorProgressPercent,
    meetsAttention,
    meetsUpvoteFloor,
    engagedNeeded,
    upvoteFloor: poolPage.upvoteFloor,
  };
}

export function getFeedChamberStats(chamberPage: ChamberProposalPageDto) {
  const activeGovernors = Math.max(1, chamberPage.activeGovernors);
  const yesTotal = chamberPage.votes.yes;
  const noTotal = chamberPage.votes.no;
  const abstainTotal = chamberPage.votes.abstain;
  const totalVotes = yesTotal + noTotal + abstainTotal;

  const engaged = chamberPage.engagedGovernors;
  const quorumNeeded = Math.ceil(activeGovernors * chamberPage.attentionQuorum);
  const quorumPercent = Math.round((engaged / activeGovernors) * 100);
  const quorumNeededPercent = Math.round(chamberPage.attentionQuorum * 100);
  const yesPercentOfQuorum =
    engaged > 0 ? Math.round((yesTotal / engaged) * 100) : 0;

  const meetsQuorum = engaged >= quorumNeeded;
  const meetsPassing = yesPercentOfQuorum >= 66.6;

  const yesWidth = totalVotes ? (yesTotal / totalVotes) * 100 : 0;
  const noWidth = totalVotes ? (noTotal / totalVotes) * 100 : 0;
  const abstainWidth = totalVotes ? (abstainTotal / totalVotes) * 100 : 0;

  return {
    activeGovernors,
    yesTotal,
    noTotal,
    abstainTotal,
    totalVotes,
    engaged,
    quorumNeeded,
    quorumPercent,
    quorumNeededPercent,
    yesPercentOfQuorum,
    meetsQuorum,
    meetsPassing,
    yesWidth,
    noWidth,
    abstainWidth,
  };
}

export function getFeedFormationStats(formationPage: FormationProposalPageDto) {
  const progressRaw = Number.parseInt(
    formationPage.progress.replace("%", ""),
    10,
  );
  const progressValue = Number.isFinite(progressRaw) ? progressRaw : 0;

  return {
    progressValue,
    team: parseRatio(formationPage.teamSlots),
    milestones: parseRatio(formationPage.milestones),
  };
}
