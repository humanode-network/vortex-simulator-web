import { proposalFormationSummaryStats } from "@/lib/proposalUi";
import { toTimestampMs } from "@/lib/dateTime";
import type {
  ChamberProposalPageDto,
  ProposalListItemDto,
  ProposalStatDto,
  PoolProposalPageDto,
} from "@/types/api";
import type { ProposalStage } from "@/types/stages";

export type ProposalListSort = "Newest" | "Oldest" | "Activity" | "Votes";
export type ProposalListFilters = {
  stageFilter: ProposalStage | "any";
  lifecycleFilter: "active" | "all";
  chamberFilter: string;
  sortBy: ProposalListSort;
};
export type ProposalListFilterConfigField = {
  key: keyof ProposalListFilters & string;
  label: string;
  options: { value: string; label: string }[];
};

type PoolStatsInput = Pick<
  PoolProposalPageDto,
  | "activeGovernors"
  | "attentionQuorum"
  | "downvotes"
  | "thresholdContext"
  | "upvoteFloor"
  | "upvotes"
>;

type ChamberStatsInput = Pick<
  ChamberProposalPageDto,
  "activeGovernors" | "quorumNeeded" | "votes"
>;

type FormationSummaryInput = Parameters<
  typeof proposalFormationSummaryStats
>[0];

type PoolKeyStatsPage = PoolStatsInput & FormationSummaryInput;
type ChamberKeyStatsPage = ChamberStatsInput & FormationSummaryInput;
type StatsOnlyPage = {
  stats: ProposalStatDto[];
};
type FormationKeyStatsPage = StatsOnlyPage & {
  budget: string;
  timeLeft: string;
  teamSlots: string;
  milestones: string;
};

type ProposalListKeyStatsInput = {
  proposal: ProposalListItemDto;
  poolPage?: PoolKeyStatsPage | null;
  chamberPage?: ChamberKeyStatsPage | null;
  citizenVetoPage?: StatsOnlyPage | null;
  chamberVetoPage?: StatsOnlyPage | null;
  finishedPage?: StatsOnlyPage | null;
  formationPage?: FormationKeyStatsPage | null;
};

type ProposalPrimaryHrefInput = Pick<
  ProposalListItemDto,
  "href" | "id" | "stage" | "summaryPill"
>;

const DELIBERATION_STAT_LABELS = new Set([
  "Deliberation",
  "Open concerns",
  "Last discussion",
]);

export const DEFAULT_PROPOSAL_LIST_FILTERS: ProposalListFilters = {
  stageFilter: "any",
  lifecycleFilter: "active",
  chamberFilter: "All chambers",
  sortBy: "Newest",
};

export const PROPOSAL_STAGE_FILTER_OPTIONS: Array<{
  value: ProposalListFilters["stageFilter"];
  label: string;
}> = [
  { value: "any", label: "Any" },
  { value: "pool", label: "Proposal pool" },
  { value: "vote", label: "Chamber vote" },
  { value: "citizen_veto", label: "Citizen veto" },
  { value: "chamber_veto", label: "Chamber veto" },
  { value: "build", label: "Formation" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Ended (failed)" },
];

export const PROPOSAL_LIFECYCLE_FILTER_OPTIONS: Array<{
  value: ProposalListFilters["lifecycleFilter"];
  label: string;
}> = [
  { value: "active", label: "Active only" },
  { value: "all", label: "Include ended" },
];

export const PROPOSAL_SORT_OPTIONS: Array<{
  value: ProposalListSort;
  label: string;
}> = [
  { value: "Newest", label: "Newest" },
  { value: "Oldest", label: "Oldest" },
  { value: "Activity", label: "Activity" },
  { value: "Votes", label: "Votes cast" },
];

export function isEndedProposal(proposal: ProposalListItemDto): boolean {
  return (
    proposal.stage === "passed" ||
    proposal.stage === "failed" ||
    proposal.summaryPill === "Finished" ||
    proposal.summaryPill === "Failed"
  );
}

export function hasFinishedRoute(href?: string): boolean {
  return Boolean(href?.includes("/finished"));
}

function proposalMatchesSearchTerm(
  proposal: ProposalListItemDto,
  term: string,
): boolean {
  if (!term) return true;
  return (
    proposal.title.toLowerCase().includes(term) ||
    proposal.summary.toLowerCase().includes(term) ||
    proposal.meta.toLowerCase().includes(term) ||
    proposal.keywords.some((keyword) => keyword.toLowerCase().includes(term))
  );
}

function compareProposalsBySort(
  sortBy: ProposalListSort,
  a: ProposalListItemDto,
  b: ProposalListItemDto,
): number {
  if (sortBy === "Newest") {
    return toTimestampMs(b.date, -1) - toTimestampMs(a.date, -1);
  }
  if (sortBy === "Oldest") {
    return toTimestampMs(a.date, -1) - toTimestampMs(b.date, -1);
  }
  if (sortBy === "Activity") {
    return b.activityScore - a.activityScore;
  }
  if (sortBy === "Votes") {
    return b.votes - a.votes;
  }
  return 0;
}

export function filterProposalList(
  proposals: ProposalListItemDto[],
  search: string,
  filters: ProposalListFilters,
): ProposalListItemDto[] {
  const term = search.trim().toLowerCase();
  return proposals
    .filter((proposal) => {
      const matchesStage =
        filters.stageFilter === "any"
          ? true
          : proposal.stage === filters.stageFilter;
      const matchesLifecycle =
        filters.lifecycleFilter === "all" ? true : !isEndedProposal(proposal);
      const matchesChamber =
        filters.chamberFilter === "All chambers"
          ? true
          : proposal.chamber === filters.chamberFilter;
      return (
        proposalMatchesSearchTerm(proposal, term) &&
        matchesStage &&
        matchesLifecycle &&
        matchesChamber
      );
    })
    .sort((a, b) => compareProposalsBySort(filters.sortBy, a, b));
}

export function getProposalChamberFilterOptions(
  proposals: ProposalListItemDto[],
): Array<{ value: string; label: string }> {
  const unique = Array.from(
    new Set(proposals.map((proposal) => proposal.chamber)),
  ).sort((a, b) => a.localeCompare(b));
  return [
    { value: "All chambers", label: "All chambers" },
    ...unique.map((chamber) => ({ value: chamber, label: chamber })),
  ];
}

export function getProposalListFilterConfig(
  chamberOptions: Array<{ value: string; label: string }>,
): ProposalListFilterConfigField[] {
  return [
    {
      key: "stageFilter",
      label: "Status",
      options: PROPOSAL_STAGE_FILTER_OPTIONS,
    },
    {
      key: "lifecycleFilter",
      label: "Lifecycle",
      options: PROPOSAL_LIFECYCLE_FILTER_OPTIONS,
    },
    {
      key: "chamberFilter",
      label: "Chamber",
      options: chamberOptions,
    },
    {
      key: "sortBy",
      label: "Sort by",
      options: PROPOSAL_SORT_OPTIONS,
    },
  ];
}

export function getPoolProposalListStats(poolPage: PoolStatsInput) {
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
  const engagedNeeded = Math.min(
    activeGovernors,
    Math.max(1, Math.ceil(poolPage.attentionQuorum * activeGovernors)),
  );

  return {
    activeGovernors,
    engaged,
    attentionPercent,
    attentionNeededPercent,
    upvoteFloorFractionPercent,
    upvoteFloorProgressPercent,
    meetsAttention: engaged >= engagedNeeded,
    meetsUpvoteFloor: poolPage.upvotes >= poolPage.upvoteFloor,
    engagedNeeded,
    upvoteFloor: poolPage.upvoteFloor,
  };
}

export function getChamberProposalListStats(chamberPage: ChamberStatsInput) {
  const activeGovernors = Math.max(1, chamberPage.activeGovernors);
  const yesTotal = chamberPage.votes.yes;
  const noTotal = chamberPage.votes.no;
  const abstainTotal = chamberPage.votes.abstain;
  const totalVotes = yesTotal + noTotal + abstainTotal;
  const engaged = totalVotes;
  const quorumNeeded = chamberPage.quorumNeeded;
  const quorumPercent = Math.round((engaged / activeGovernors) * 100);
  const quorumNeededPercent = Math.round(
    (quorumNeeded / activeGovernors) * 100,
  );
  const yesPercentOfQuorum =
    engaged > 0 ? Math.round((yesTotal / engaged) * 100) : 0;

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
    meetsQuorum: engaged >= quorumNeeded,
    meetsPassing: yesPercentOfQuorum >= 66.6,
    yesWidth: totalVotes ? (yesTotal / totalVotes) * 100 : 0,
    noWidth: totalVotes ? (noTotal / totalVotes) * 100 : 0,
    abstainWidth: totalVotes ? (abstainTotal / totalVotes) * 100 : 0,
  };
}

export function getProposalListKeyStats({
  proposal,
  poolPage,
  chamberPage,
  citizenVetoPage,
  chamberVetoPage,
  finishedPage,
  formationPage,
}: ProposalListKeyStatsInput): ProposalStatDto[] {
  const baseKeyStats =
    proposal.stage === "pool" && poolPage
      ? proposalFormationSummaryStats(poolPage, {
          milestoneSuffix: "planned",
        })
      : proposal.stage === "vote" && chamberPage
        ? proposalFormationSummaryStats(chamberPage, {
            milestoneSuffix: "planned",
          })
        : proposal.stage === "citizen_veto" && citizenVetoPage
          ? citizenVetoPage.stats
          : proposal.stage === "chamber_veto" && chamberVetoPage
            ? chamberVetoPage.stats
            : finishedPage
              ? finishedPage.stats
              : proposal.stage === "build" && formationPage
                ? [
                    {
                      label: "Budget ask",
                      value: formationPage.budget,
                    },
                    {
                      label: "Time left",
                      value: formationPage.timeLeft,
                    },
                    {
                      label: "Team slots",
                      value: formationPage.teamSlots,
                    },
                    {
                      label: "Milestones",
                      value: formationPage.milestones,
                    },
                    ...formationPage.stats,
                  ]
                : proposal.stats;
  const deliberationStats = proposal.stats.filter((stat) =>
    DELIBERATION_STAT_LABELS.has(stat.label),
  );
  return [
    ...baseKeyStats,
    ...deliberationStats.filter(
      (stat) => !baseKeyStats.some((item) => item.label === stat.label),
    ),
  ];
}

export function getProposalListPrimaryHref(
  proposal: ProposalPrimaryHrefInput,
): string {
  if (proposal.href) return proposal.href;
  if (proposal.stage === "pool") return `/app/proposals/${proposal.id}/pp`;
  if (proposal.stage === "vote") {
    return `/app/proposals/${proposal.id}/chamber`;
  }
  if (proposal.stage === "citizen_veto") {
    return `/app/proposals/${proposal.id}/citizen-veto`;
  }
  if (proposal.stage === "chamber_veto") {
    return `/app/proposals/${proposal.id}/chamber-veto`;
  }
  if (proposal.stage === "passed") {
    return `/app/proposals/${proposal.id}/finished`;
  }
  if (proposal.stage === "build") {
    return proposal.summaryPill === "Finished"
      ? `/app/proposals/${proposal.id}/finished`
      : `/app/proposals/${proposal.id}/formation`;
  }
  return `/app/proposals/${proposal.id}/pp`;
}

export function getProposalListLoadingMessage(
  proposal: Pick<ProposalListItemDto, "href" | "stage">,
): string | null {
  if (hasFinishedRoute(proposal.href)) return "Loading outcome details…";
  if (proposal.stage === "vote") return "Loading chamber vote stats…";
  if (proposal.stage === "citizen_veto") return "Loading citizen veto stats…";
  if (proposal.stage === "chamber_veto") return "Loading chamber veto stats…";
  return null;
}
