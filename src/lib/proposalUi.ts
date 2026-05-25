import { addressesReferToSameIdentity } from "@/lib/addressIdentity";
import { parseRatio } from "@/lib/dtoParsers";
import type { ChamberProposalPageDto } from "@/types/api";

type ProposalSummaryStat = {
  label: string;
  value: string;
};

type ProposalFormationSummaryInput = {
  formationEligible: boolean;
  budget: string;
  teamSlots: string;
  milestones: string;
};

type ProposalFormationSummaryOptions = {
  milestoneSuffix?: "milestones planned" | "planned";
};

type ProposalPoolVotingGateInput = {
  auth: {
    authenticated: boolean;
    eligible: boolean;
    enabled: boolean;
    gateReason?: string;
    loading: boolean;
  };
  viewerIsProposer: boolean;
};

type ProposalOrdinaryVoteGateInput = {
  auth?: {
    authenticated: boolean;
    enabled: boolean;
    loading: boolean;
  };
  closedReason?: string;
  submitting: boolean;
  viewerIsProposer: boolean;
  votingClosed?: boolean;
};

type ProposalChamberPageDerivationInput = {
  proposal: ChamberProposalPageDto;
  viewerAddress: string | null | undefined;
};

export function viewerIsProposalAuthor(
  viewerAddress: string | null | undefined,
  proposerAddress: string | null | undefined,
): boolean {
  return addressesReferToSameIdentity(viewerAddress, proposerAddress);
}

export function getProposalPoolVotingGate({
  auth,
  viewerIsProposer,
}: ProposalPoolVotingGateInput): { allowed: boolean; disabledReason: string } {
  const allowed =
    !viewerIsProposer &&
    (!auth.enabled || (auth.authenticated && !auth.loading));
  const disabledReason = viewerIsProposer
    ? "You cannot vote on your own proposal."
    : auth.enabled && auth.loading
      ? "Checking wallet status…"
      : auth.enabled && !auth.authenticated
        ? "Connect your wallet to vote."
        : "Only chamber Governors can vote. Active Governors are counted for quorum.";
  return { allowed, disabledReason };
}

export function getProposalOrdinaryVoteGate({
  auth,
  closedReason = "Ordinary voting is closed.",
  submitting,
  viewerIsProposer,
  votingClosed = false,
}: ProposalOrdinaryVoteGateInput): {
  disabled: boolean;
  title: string | undefined;
} {
  const authBlocked = Boolean(
    auth?.enabled && (auth.loading || !auth.authenticated),
  );
  return {
    disabled: submitting || votingClosed || viewerIsProposer || authBlocked,
    title: viewerIsProposer
      ? "You cannot vote on your own proposal."
      : votingClosed
        ? closedReason
        : auth?.enabled && auth.loading
          ? "Checking wallet status…"
          : auth?.enabled && !auth.authenticated
            ? "Connect your wallet to vote."
            : undefined,
  };
}

export function proposalFormationSummaryStats(
  proposal: ProposalFormationSummaryInput,
  options: ProposalFormationSummaryOptions = {},
): ProposalSummaryStat[] {
  if (!proposal.formationEligible) return [];
  const { a: filledSlots, b: totalSlots } = parseRatio(proposal.teamSlots);
  const openSlots = Math.max(totalSlots - filledSlots, 0);
  const milestoneSuffix = options.milestoneSuffix ?? "milestones planned";
  return [
    { label: "Budget ask", value: proposal.budget },
    {
      label: "Formation",
      value: "Yes",
    },
    {
      label: "Team slots",
      value: `${proposal.teamSlots} (open: ${openSlots})`,
    },
    {
      label: "Milestones",
      value: `${proposal.milestones} ${milestoneSuffix}`,
    },
  ];
}

export function getProposalChamberPageDerivation({
  proposal,
  viewerAddress,
}: ProposalChamberPageDerivationInput) {
  const yesTotal = proposal.votes.yes;
  const noTotal = proposal.votes.no;
  const abstainTotal = proposal.votes.abstain;
  const totalVotes = yesTotal + noTotal + abstainTotal;
  const engaged = proposal.engagedVoters ?? proposal.engagedGovernors;
  const eligibleVoters = Math.max(
    1,
    proposal.eligibleVoters ?? proposal.activeGovernors,
  );
  const quorumFraction =
    proposal.thresholdContext?.quorumThreshold?.quorumFraction ??
    proposal.attentionQuorum ??
    0.33;
  const quorumNeeded = proposal.quorumNeeded;
  const quorumPercent = Math.round((engaged / eligibleVoters) * 100);
  const quorumNeededPercent = Math.round(quorumFraction * 100);
  const yesPercentOfQuorum =
    engaged > 0 ? Math.round((yesTotal / engaged) * 100) : 0;
  const yesPercentOfTotal =
    totalVotes > 0 ? Math.round((yesTotal / totalVotes) * 100) : 0;
  const noPercentOfTotal =
    totalVotes > 0 ? Math.round((noTotal / totalVotes) * 100) : 0;
  const abstainPercentOfTotal =
    totalVotes > 0 ? Math.round((abstainTotal / totalVotes) * 100) : 0;
  const milestoneVoteIndex =
    typeof proposal.milestoneIndex === "number" && proposal.milestoneIndex > 0
      ? proposal.milestoneIndex
      : null;
  const referendumVote = proposal.voteKind === "referendum";
  const viewerIsProposer = viewerIsProposalAuthor(
    viewerAddress,
    proposal.proposerId,
  );
  const scoreLabel: "CM" | "MM" | null =
    proposal.scoreLabel === "MM" || milestoneVoteIndex !== null
      ? "MM"
      : proposal.scoreLabel === "CM"
        ? "CM"
        : null;
  const chamberTitle = referendumVote
    ? `${proposal.title} — Referendum`
    : milestoneVoteIndex !== null
      ? `${proposal.title} — Milestone vote (M${milestoneVoteIndex})`
      : proposal.title;
  const viewerVoteLabel = proposal.viewerVote
    ? proposal.viewerVote.choice === "yes"
      ? `Yes${
          typeof proposal.viewerVote.score === "number"
            ? ` (score ${proposal.viewerVote.score})`
            : ""
        }`
      : proposal.viewerVote.choice === "no"
        ? "No"
        : "Abstain"
    : null;

  return {
    abstainPercentOfTotal,
    abstainTotal,
    chamberTitle,
    engaged,
    eligibleVoters,
    formationSummaryStats: proposalFormationSummaryStats(proposal),
    milestoneVoteIndex,
    noPercentOfTotal,
    noTotal,
    ordinaryVoteClosed: proposal.ordinaryVoteClosed,
    passingNeededPercent: 66.6,
    quorumNeeded,
    quorumNeededPercent,
    quorumPercent,
    referendumQuorumRuleLabel: "33.3% + 1",
    referendumVote,
    scoreLabel,
    totalVotes,
    vetoWindowOpen: proposal.timeLeft !== "Ended",
    viewerIsProposer,
    viewerVoteLabel,
    yesPercentOfQuorum,
    yesPercentOfTotal,
    yesTotal,
  };
}
