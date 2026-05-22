import type { RefObject } from "react";

import { cn } from "@/lib/utils";
import { ExpandableCard } from "@/components/ExpandableCard";
import { StageChip } from "@/components/StageChip";
import { formatDateTime } from "@/lib/dateTime";
import {
  feedItemKey,
  hasFinishedRoute,
  proposalIdFromHref,
} from "@/lib/feedUi";
import {
  getFeedChamberStats,
  getFeedFormationStats,
  getFeedPoolStats,
} from "@/lib/feedStageStats";
import type {
  ChamberVetoProposalPageDto,
  CitizenVetoProposalPageDto,
  FeedItemDto,
  ProposalFinishedPageDto,
} from "@/types/api";
import { FeedExpandedContent } from "./FeedExpandedContent";

type FeedListSectionProps = {
  chamberPagesById: Record<
    string,
    import("@/types/api").ChamberProposalPageDto | undefined
  >;
  chamberVetoPagesById: Record<string, ChamberVetoProposalPageDto | undefined>;
  citizenVetoPagesById: Record<string, CitizenVetoProposalPageDto | undefined>;
  expandedKey: string | null;
  feedListRef: RefObject<HTMLDivElement | null>;
  finishedPagesById: Record<string, ProposalFinishedPageDto | undefined>;
  formationPagesById: Record<
    string,
    import("@/types/api").FormationProposalPageDto | undefined
  >;
  inviteActionKey: string | null;
  onInviteAccept: (item: FeedItemDto) => void;
  onInviteDecline: (item: FeedItemDto) => void;
  onToggle: (key: string) => void;
  poolPagesById: Record<
    string,
    import("@/types/api").PoolProposalPageDto | undefined
  >;
  sortedFeed: FeedItemDto[];
};

export function FeedListSection({
  chamberPagesById,
  chamberVetoPagesById,
  citizenVetoPagesById,
  expandedKey,
  feedListRef,
  finishedPagesById,
  formationPagesById,
  inviteActionKey,
  onInviteAccept,
  onInviteDecline,
  onToggle,
  poolPagesById,
  sortedFeed,
}: FeedListSectionProps) {
  return (
    <section
      ref={feedListRef}
      aria-live="polite"
      className="flex flex-col gap-4"
    >
      {sortedFeed.map((item, index) => {
        const itemKey = feedItemKey(item);
        const proposalId = proposalIdFromHref(item.href) ?? item.id;
        const finishedPage = hasFinishedRoute(item.href)
          ? (finishedPagesById[proposalId] ?? null)
          : null;
        const poolPage =
          item.stage === "pool" ? poolPagesById[proposalId] : null;
        const chamberPage =
          item.stage === "vote" ? chamberPagesById[proposalId] : null;
        const citizenVetoPage =
          item.stage === "citizen_veto"
            ? citizenVetoPagesById[proposalId]
            : null;
        const chamberVetoPage =
          item.stage === "chamber_veto"
            ? chamberVetoPagesById[proposalId]
            : null;
        const formationPage =
          item.stage === "build" ? formationPagesById[proposalId] : null;

        const poolStats =
          item.stage === "pool" && poolPage ? getFeedPoolStats(poolPage) : null;

        const chamberStats =
          item.stage === "vote" && chamberPage
            ? getFeedChamberStats(chamberPage)
            : null;

        const formationStats =
          item.stage === "build" && formationPage
            ? getFeedFormationStats(formationPage)
            : null;
        const keyStats =
          finishedPage?.stats ??
          citizenVetoPage?.stats ??
          chamberVetoPage?.stats ??
          item.stats ??
          [];

        return (
          <ExpandableCard
            key={itemKey}
            expanded={expandedKey === itemKey}
            onToggle={() => onToggle(itemKey)}
            className={cn(index < 3 ? "border-primary" : "border-border")}
            meta={item.meta}
            title={item.title}
            right={
              <>
                <span className="text-xs text-muted">
                  {formatDateTime(item.timestamp)}
                </span>
                <StageChip stage={item.stage} />
              </>
            }
          >
            <FeedExpandedContent
              chamberPage={chamberPage}
              chamberStats={chamberStats}
              chamberVetoPage={chamberVetoPage}
              citizenVetoPage={citizenVetoPage}
              finishedPage={finishedPage}
              formationPage={formationPage}
              formationStats={formationStats}
              inviteActionBusy={inviteActionKey === itemKey}
              item={item}
              keyStats={keyStats}
              onInviteAccept={() => onInviteAccept(item)}
              onInviteDecline={() => onInviteDecline(item)}
              poolPage={poolPage}
              poolStats={poolStats}
            />
          </ExpandableCard>
        );
      })}
    </section>
  );
}
