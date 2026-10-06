import {
  apiFeed,
  apiHuman,
  apiMyGovernance,
  type FeedQueryInput,
} from "./apiClient";
import {
  buildUrgentFeedRequests,
  FEED_MAX_PAGE_SIZE,
  FEED_MIN_PAGE_SIZE,
} from "./feedScopeRouting";
import { toGovernorAwareUrgentItems } from "./feedUi";
import {
  governorOpportunityToFeedItem,
  isOutstandingGovernorOpportunity,
} from "./governorOpportunityUi";
import type {
  FeedItemDto,
  GovernorOpportunityAccountingDto,
  GovernorOpportunityItemDto,
} from "@/types/api";

const OPPORTUNITY_PAGE_SIZE = 50;

export type UrgentFeedContinuation = {
  events: FeedItemDto[];
  streams: Array<{ request: FeedQueryInput; cursor: string | null }>;
  opportunities: GovernorOpportunityItemDto[];
  opportunityOffset: number | null;
};

function nextOpportunityOffset(
  accounting: GovernorOpportunityAccountingDto | null,
) {
  if (!accounting) return null;
  const offset = accounting.page.offset + accounting.items.length;
  return accounting.items.length > 0 && offset < accounting.page.total
    ? offset
    : null;
}

export async function loadFeedViewer(
  address: string,
  includeOpportunities: boolean,
) {
  const [governance, profile] = await Promise.all([
    apiMyGovernance(
      includeOpportunities
        ? {
            opportunityState: "available",
            opportunityLimit: OPPORTUNITY_PAGE_SIZE,
          }
        : undefined,
    ),
    apiHuman(address),
  ]);
  return {
    chambers: [
      ...new Set([
        "general",
        ...(governance.myChamberIds ?? []).map((id) => id.toLowerCase()),
      ]),
    ],
    isGovernorActive: Boolean(profile.governorActive),
    governorOpportunities: includeOpportunities
      ? (governance.opportunityAccounting ?? null)
      : null,
  };
}

export async function loadUrgentFeed(input: {
  address?: string;
  chambers: string[];
  limit: number;
  isGovernorActive: boolean;
  governorOpportunities: GovernorOpportunityAccountingDto | null;
  continuation?: UrgentFeedContinuation;
}) {
  let continuation = input.continuation;
  if (!continuation) {
    const requests = buildUrgentFeedRequests({
      address: input.address,
      chamberFilters: input.chambers,
      baseLimit: input.limit,
      stageLimit: FEED_MAX_PAGE_SIZE * 2,
      factionLimit: FEED_MIN_PAGE_SIZE,
    });
    const responses = await Promise.all(
      requests.map((request) => apiFeed(request)),
    );
    continuation = {
      events: responses.flatMap((response) => response.items),
      streams: requests.map((request, index) => ({
        request,
        cursor: responses[index].nextCursor ?? null,
      })),
      opportunities: input.governorOpportunities?.items ?? [],
      opportunityOffset: nextOpportunityOffset(input.governorOpportunities),
    };
  } else {
    const buffered = urgentItems(continuation, input);
    if (buffered.length < input.limit) {
      const previous = continuation;
      const [streams, governance] = await Promise.all([
        Promise.all(
          previous.streams.map(async (stream) => {
            if (!stream.cursor) return { stream, items: [] as FeedItemDto[] };
            const page = await apiFeed({
              ...stream.request,
              cursor: stream.cursor,
            });
            if (page.nextCursor === stream.cursor)
              throw new Error(
                "The urgent feed could not advance. Please try again.",
              );
            return {
              stream: { ...stream, cursor: page.nextCursor ?? null },
              items: page.items,
            };
          }),
        ),
        previous.opportunityOffset === null
          ? null
          : apiMyGovernance({
              opportunityState: "available",
              opportunityOffset: previous.opportunityOffset,
              opportunityLimit:
                input.governorOpportunities?.page.limit ??
                OPPORTUNITY_PAGE_SIZE,
            }),
      ]);
      const accounting = governance?.opportunityAccounting ?? null;
      const opportunityOffset = nextOpportunityOffset(accounting);
      if (
        opportunityOffset !== null &&
        previous.opportunityOffset !== null &&
        opportunityOffset <= previous.opportunityOffset
      ) {
        throw new Error(
          "Governing opportunities could not advance. Please try again.",
        );
      }
      continuation = {
        events: [...previous.events, ...streams.flatMap((page) => page.items)],
        streams: streams.map((page) => page.stream),
        opportunities: [
          ...previous.opportunities,
          ...(accounting?.items ?? []),
        ],
        opportunityOffset,
      };
    }
  }
  const available = urgentItems(continuation, input);
  const hasMore =
    available.length > input.limit ||
    continuation.streams.some((stream) => Boolean(stream.cursor)) ||
    continuation.opportunityOffset !== null;
  return {
    items: available.slice(0, input.limit),
    hasMore,
    continuation: hasMore ? continuation : null,
  };
}

function urgentItems(
  continuation: UrgentFeedContinuation,
  input: { isGovernorActive: boolean; address?: string },
) {
  return toGovernorAwareUrgentItems({
    eventItems: continuation.events,
    verifiedOpportunityItems: continuation.opportunities
      .filter(isOutstandingGovernorOpportunity)
      .map(governorOpportunityToFeedItem),
    isGovernorActive: input.isGovernorActive,
    viewerAddress: input.address,
    limit: Infinity,
  });
}
