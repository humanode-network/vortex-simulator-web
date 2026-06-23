import type { FeedQueryInput } from "@/lib/apiClient";

export type FeedScope = "urgent" | "my" | "chambers" | "system" | "all";

export const FEED_SCOPES: { value: FeedScope; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "my", label: "My activity" },
  { value: "chambers", label: "Chambers and factions" },
  { value: "system", label: "System" },
  { value: "all", label: "All activity" },
];

export const SYSTEM_FEED_STAGE = "system";
export const PRIVATE_FEED_ENTITY_TYPES = ["faction_invite"] as const;

const ACTIVITY_EXCLUDED_STAGES = [SYSTEM_FEED_STAGE];

export function feedScopeRequiresWallet(scope: FeedScope) {
  return scope === "urgent" || scope === "my" || scope === "chambers";
}

export function feedScopeRequiresChambers(scope: FeedScope) {
  return scope === "urgent" || scope === "chambers";
}

export function buildFeedRequestForScope(input: {
  scope: Exclude<FeedScope, "urgent">;
  address?: string;
  chamberFilters?: string[] | null;
  cursor?: string | null;
  limit: number;
}): FeedQueryInput {
  const base: FeedQueryInput = {
    cursor: input.cursor ?? undefined,
    limit: input.limit,
  };

  if (input.scope === "my") {
    return {
      ...base,
      actor: input.address,
      excludeStages: ACTIVITY_EXCLUDED_STAGES,
    };
  }

  if (input.scope === "chambers") {
    return {
      ...base,
      chambers: input.chamberFilters ?? [],
      excludeStages: ACTIVITY_EXCLUDED_STAGES,
      excludeEntityTypes: [...PRIVATE_FEED_ENTITY_TYPES],
    };
  }

  if (input.scope === "system") {
    return {
      ...base,
      stage: SYSTEM_FEED_STAGE,
    };
  }

  return {
    ...base,
    excludeEntityTypes: [...PRIVATE_FEED_ENTITY_TYPES],
  };
}

export function buildUrgentFeedRequests(input: {
  address?: string;
  chamberFilters: string[];
  baseLimit: number;
  stageLimit: number;
  factionLimit: number;
}): FeedQueryInput[] {
  const requests: FeedQueryInput[] = [
    {
      chambers: input.chamberFilters,
      excludeStages: ACTIVITY_EXCLUDED_STAGES,
      excludeEntityTypes: [...PRIVATE_FEED_ENTITY_TYPES],
      limit: input.baseLimit,
    },
    {
      stage: "pool",
      chambers: input.chamberFilters,
      limit: input.stageLimit,
    },
    {
      stage: "vote",
      chambers: input.chamberFilters,
      limit: input.stageLimit,
    },
  ];

  if (input.address) {
    requests.push(
      {
        stage: "build",
        actor: input.address,
        limit: input.stageLimit,
      },
      {
        stage: "faction",
        actor: input.address,
        limit: input.factionLimit,
      },
    );
  }

  return requests;
}
