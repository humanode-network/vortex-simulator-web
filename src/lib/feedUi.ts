import { addressesReferToSameIdentity } from "@/lib/addressIdentity";
import { toTimestampMs } from "@/lib/dateTime";
import type { FeedItemDto } from "@/types/api";

export const normalizeAppHref = (href?: string) => {
  if (!href) return undefined;
  const appHref = href.startsWith("/app/") ? href : `/app${href}`;

  const factionThreadMatch = appHref.match(
    /^\/app\/factions\/([^/]+)\/threads\/([^/]+)$/,
  );
  if (factionThreadMatch) {
    return `/app/factions/${factionThreadMatch[1]}?thread=${encodeURIComponent(factionThreadMatch[2])}`;
  }

  const chamberThreadMatch = appHref.match(
    /^\/app\/chambers\/([^/]+)\/threads\/([^/]+)$/,
  );
  if (chamberThreadMatch) {
    return `/app/chambers/${chamberThreadMatch[1]}?thread=${encodeURIComponent(chamberThreadMatch[2])}`;
  }

  return appHref;
};

export const courtCaseIdFromHref = (href?: string) => {
  if (!href) return null;
  const clean = href.startsWith("/app/") ? href.slice("/app".length) : href;
  const match = clean.match(/^\/courts\/(.+)$/);
  return match?.[1] ?? null;
};

export const proposalIdFromHref = (href?: string) => {
  if (!href) return null;
  const noQuery = href.split("?")[0] ?? href;
  const clean = noQuery.startsWith("/app/")
    ? noQuery.slice("/app".length)
    : noQuery;
  const match = clean.match(
    /^\/proposals\/([^/]+)\/(pp|chamber|citizen-veto|chamber-veto|referendum|formation|finished)$/,
  );
  return match?.[1] ?? null;
};

export const factionIdFromHref = (href?: string) => {
  if (!href) return null;
  const clean = href.startsWith("/app/") ? href.slice("/app".length) : href;
  const match = clean.match(/^\/factions\/([^/]+)$/);
  return match?.[1] ?? null;
};

export const hasFinishedRoute = (href?: string) =>
  Boolean(href?.includes("/finished"));

export const feedItemKey = (item: FeedItemDto) =>
  `${item.id}|${item.stage}|${item.timestamp}|${item.href ?? ""}`;

export const urgentEntityKey = (item: FeedItemDto) => {
  const proposalId = proposalIdFromHref(item.href);
  if (proposalId) return `proposal:${proposalId}`;
  const caseId = courtCaseIdFromHref(item.href);
  if (caseId) return `court:${caseId}`;
  if (item.href) return `href:${item.href}`;
  return `id:${item.id}`;
};

export const isUrgentItemInteractable = (
  item: FeedItemDto,
  isGovernorActive: boolean,
  viewerAddress?: string,
) => {
  if (item.actionable !== true) return false;
  if (item.stage === "build") {
    return addressesReferToSameIdentity(
      viewerAddress,
      item.proposerId ?? item.proposer,
    );
  }
  if ((item.stage === "pool" || item.stage === "vote") && !isGovernorActive) {
    if (item.href?.includes("/referendum")) return true;
    return false;
  }
  return true;
};

export const toUrgentItems = (
  items: FeedItemDto[],
  isGovernorActive: boolean,
  viewerAddress?: string,
): FeedItemDto[] => {
  const filtered = items.filter((item) =>
    isUrgentItemInteractable(item, isGovernorActive, viewerAddress),
  );
  const deduped = new Map<string, FeedItemDto>();
  for (const item of filtered) {
    const key = urgentEntityKey(item);
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, item);
      continue;
    }
    if (
      toTimestampMs(item.timestamp, -1) > toTimestampMs(existing.timestamp, -1)
    ) {
      deduped.set(key, item);
    }
  }
  return Array.from(deduped.values());
};

export const toLimitedUrgentItems = (
  items: FeedItemDto[],
  isGovernorActive: boolean,
  viewerAddress: string | undefined,
  limit: number,
): FeedItemDto[] => {
  const safeLimit = Math.max(0, Math.floor(limit));
  if (safeLimit === 0) return [];
  return toUrgentItems(items, isGovernorActive, viewerAddress).slice(
    0,
    safeLimit,
  );
};
