import type {
  ActiveGovernorReasonDto,
  FeedItemDto,
  GovernorOpportunityAccountingDto,
  GovernorOpportunityExclusionReasonDto,
  GovernorOpportunityItemDto,
  GovernorOpportunityStageDto,
  GovernorOpportunityStateDto,
} from "@/types/api";
import type { GlassyStatusTone } from "@/components/GlassySection";
import { formatChamberLabel } from "@/lib/chamberUi";
import { formatDateTime } from "@/lib/dateTime";
import { getProposalHrefForStage } from "@/lib/proposalListUi";

export const GOVERNOR_OPPORTUNITY_STAGES: ReadonlyArray<{
  value: GovernorOpportunityStageDto;
  label: string;
  requirementLabel: string;
  summaryKey: "pool" | "chamber";
}> = [
  {
    value: "pool",
    label: "Proposal Pool",
    requirementLabel: "Pool votes this era",
    summaryKey: "pool",
  },
  {
    value: "vote",
    label: "Chamber Vote",
    requirementLabel: "Chamber votes this era",
    summaryKey: "chamber",
  },
];

const ACTIVE_REASON_COPY: Record<
  ActiveGovernorReasonDto,
  { label: string; detail: string; tone: GlassyStatusTone }
> = {
  qualified_previous_era: {
    label: "Qualified",
    detail:
      "The previous era's accountable Pool and Chamber requirements were completed.",
    tone: "ok",
  },
  missed_pool_requirement: {
    label: "Pool requirement missed",
    detail:
      "The previous era ended below the required number of accountable Pool votes.",
    tone: "danger",
  },
  missed_chamber_requirement: {
    label: "Chamber requirement missed",
    detail:
      "The previous era ended below the required number of accountable Chamber votes.",
    tone: "danger",
  },
  missed_pool_and_chamber_requirements: {
    label: "Both requirements missed",
    detail:
      "The previous era ended below both accountable voting requirements.",
    tone: "danger",
  },
  not_evaluated_yet: {
    label: "Not evaluated yet",
    detail: "No completed prior-era assessment is available for this Governor.",
    tone: "neutral",
  },
  no_accountable_opportunities: {
    label: "No accountable opportunities",
    detail:
      "No eligible stage provided enough actionable time to create a requirement.",
    tone: "primary",
  },
};

const OPPORTUNITY_STATE_COPY: Record<
  GovernorOpportunityStateDto,
  { label: string; tone: GlassyStatusTone }
> = {
  available: { label: "Available", tone: "primary" },
  completed: { label: "Completed", tone: "ok" },
  closed_unaccountable: { label: "Closed before exposure", tone: "neutral" },
  excluded: { label: "Excluded", tone: "neutral" },
  missed: { label: "Missed", tone: "danger" },
};

const EXCLUSION_LABELS: Record<GovernorOpportunityExclusionReasonDto, string> =
  {
    proposal_author: "Proposal author cannot vote on this proposal",
    formation_team_member:
      "Formation team members cannot vote on their own milestone",
    censure_target_chamber_member:
      "Members of the censured chamber cannot vote",
    explicit_voting_restriction: "A stage-specific voting restriction applied",
    court_voting_restriction: "A Court remedy limited the actionable period",
  };

const GOVERNOR_OPPORTUNITY_STATE_ORDER: readonly GovernorOpportunityStateDto[] =
  ["available", "completed", "closed_unaccountable", "excluded", "missed"];

export const GOVERNOR_OPPORTUNITY_STATE_OPTIONS =
  GOVERNOR_OPPORTUNITY_STATE_ORDER.map((value) => ({
    value,
    label: OPPORTUNITY_STATE_COPY[value].label,
  }));

export function getActiveGovernorReasonCopy(reason: ActiveGovernorReasonDto) {
  return ACTIVE_REASON_COPY[reason];
}

export function getGovernorOpportunityStateCopy(
  item: GovernorOpportunityItemDto,
): {
  label: string;
  detail: string;
  tone: GlassyStatusTone;
} {
  const state = OPPORTUNITY_STATE_COPY[item.state];
  if (item.state === "available") {
    if (item.participated) {
      return {
        ...state,
        label: "Action recorded",
        detail: item.canBecomeAccountable
          ? "Your action is secured. It will count if this stage remains open through the exposure boundary."
          : "Your action is secured, but this occurrence cannot become an obligation in the current era.",
        tone: "ok",
      };
    }
    if (!item.accountable && !item.canBecomeAccountable) {
      return {
        ...state,
        label: "Available, not counted",
        detail:
          "This stage remains open, but there is not enough actionable time left for it to count in this era.",
        tone: "neutral",
      };
    }
    return {
      ...state,
      label: item.accountable ? "Action required" : "Exposure building",
      detail: item.accountable
        ? "This open stage now counts toward the era requirement."
        : "This stage remains available but does not count until its exposure time is reached.",
      tone: item.accountable ? "warn" : state.tone,
    };
  }
  if (item.state === "completed") {
    return {
      ...state,
      detail: "Your action is matched to this accountable occurrence.",
    };
  }
  if (item.state === "closed_unaccountable") {
    return {
      ...state,
      detail:
        item.exclusionReason === "court_voting_restriction"
          ? "The stage closed before you received enough unrestricted exposure to create an obligation."
          : "The stage closed before enough fair exposure elapsed to create an obligation.",
    };
  }
  if (item.state === "excluded") {
    return {
      ...state,
      detail: item.exclusionReason
        ? EXCLUSION_LABELS[item.exclusionReason]
        : "You were legally unable to act on this occurrence.",
    };
  }
  return {
    ...state,
    detail: "The accountable stage ended without a matched action.",
  };
}

export function isGovernorOpportunityStage(
  value: string,
): value is GovernorOpportunityStageDto {
  return GOVERNOR_OPPORTUNITY_STAGES.some((stage) => stage.value === value);
}

export function isGovernorOpportunityState(
  value: string,
): value is GovernorOpportunityStateDto {
  return GOVERNOR_OPPORTUNITY_STATE_ORDER.includes(
    value as GovernorOpportunityStateDto,
  );
}

export function formatGovernorOpportunityStage(
  stage: GovernorOpportunityStageDto,
): string {
  return (
    GOVERNOR_OPPORTUNITY_STAGES.find((definition) => definition.value === stage)
      ?.label ?? stage
  );
}

export function formatExposurePeriod(seconds: number): string {
  const duration = Math.max(0, Math.floor(seconds));
  if (duration < 60) return `${duration}s`;
  if (duration < 3600) {
    const minutes = duration / 60;
    return Number.isInteger(minutes) ? `${minutes}m` : `${minutes.toFixed(1)}m`;
  }
  if (duration < 86_400) {
    const hours = duration / 3600;
    return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
  }
  const days = duration / 86_400;
  return Number.isInteger(days) ? `${days}d` : `${days.toFixed(1)}d`;
}

export function isOutstandingGovernorOpportunity(
  item: GovernorOpportunityItemDto,
): boolean {
  return (
    item.state === "available" &&
    !item.participated &&
    (item.accountable || item.canBecomeAccountable)
  );
}

export function mergeGovernorOpportunityPages(
  current: GovernorOpportunityAccountingDto,
  fresh: GovernorOpportunityAccountingDto,
): GovernorOpportunityAccountingDto {
  return {
    ...fresh,
    items: [
      ...new Map(
        [...current.items, ...fresh.items].map((item) => [
          item.occurrenceId,
          item,
        ]),
      ).values(),
    ],
  };
}

export function governorOpportunityToFeedItem(
  item: GovernorOpportunityItemDto,
): FeedItemDto {
  const state = getGovernorOpportunityStateCopy(item);
  const timing = item.accountable
    ? "This occurrence is accountable while the stage remains open."
    : !item.canBecomeAccountable
      ? "You may still participate, but this occurrence cannot become an obligation in the current era."
      : `It becomes accountable at ${formatDateTime(item.accountableAt)} if the stage is still open.`;

  return {
    id: `governor-opportunity:${item.occurrenceId}`,
    title: item.proposalTitle,
    meta: formatChamberLabel(item.chamberId, [
      { id: item.chamberId, title: item.chamberTitle },
    ]),
    stage: item.stage,
    summaryPill: state.label,
    summary: `${state.detail} ${timing}`,
    actionable: true,
    ctaPrimary: "Open proposal",
    href: getProposalHrefForStage(item.proposalId, item.proposalStage),
    timestamp: item.openedAt,
  };
}
