import { useEffect, useState } from "react";

import {
  feedItemKey,
  hasFinishedRoute,
  proposalIdFromHref,
} from "@/lib/feedUi";
import {
  apiProposalChamberPage,
  apiProposalChamberVetoPage,
  apiProposalCitizenVetoPage,
  apiProposalFinishedPage,
  apiProposalFormationPage,
  apiProposalPoolPage,
} from "@/lib/apiClient";
import type {
  ChamberVetoProposalPageDto,
  CitizenVetoProposalPageDto,
  FeedItemDto,
  ProposalFinishedPageDto,
} from "@/types/api";

export function useFeedDetailPages(input: {
  expandedKey: string | null;
  feedItems: FeedItemDto[] | null;
}) {
  const { expandedKey, feedItems } = input;
  const [poolPagesById, setPoolPagesById] = useState<
    Record<string, import("@/types/api").PoolProposalPageDto | undefined>
  >({});
  const [chamberPagesById, setChamberPagesById] = useState<
    Record<string, import("@/types/api").ChamberProposalPageDto | undefined>
  >({});
  const [citizenVetoPagesById, setCitizenVetoPagesById] = useState<
    Record<string, CitizenVetoProposalPageDto | undefined>
  >({});
  const [chamberVetoPagesById, setChamberVetoPagesById] = useState<
    Record<string, ChamberVetoProposalPageDto | undefined>
  >({});
  const [formationPagesById, setFormationPagesById] = useState<
    Record<string, import("@/types/api").FormationProposalPageDto | undefined>
  >({});
  const [finishedPagesById, setFinishedPagesById] = useState<
    Record<string, ProposalFinishedPageDto | undefined>
  >({});

  useEffect(() => {
    if (!expandedKey || !feedItems) return;
    const item = feedItems.find((p) => feedItemKey(p) === expandedKey);
    if (!item) return;

    const proposalId = proposalIdFromHref(item.href) ?? item.id;

    if (hasFinishedRoute(item.href)) {
      if (finishedPagesById[proposalId] === undefined) {
        void apiProposalFinishedPage(proposalId).then((page) => {
          setFinishedPagesById((curr) => ({ ...curr, [proposalId]: page }));
        });
      }
      return;
    }

    if (item.stage === "pool" && poolPagesById[proposalId] === undefined) {
      void apiProposalPoolPage(proposalId).then((page) => {
        setPoolPagesById((curr) => ({ ...curr, [proposalId]: page }));
      });
    }
    if (item.stage === "vote" && chamberPagesById[proposalId] === undefined) {
      void apiProposalChamberPage(proposalId).then((page) => {
        setChamberPagesById((curr) => ({ ...curr, [proposalId]: page }));
      });
    }
    if (
      item.stage === "citizen_veto" &&
      citizenVetoPagesById[proposalId] === undefined
    ) {
      void apiProposalCitizenVetoPage(proposalId).then((page) => {
        setCitizenVetoPagesById((curr) => ({ ...curr, [proposalId]: page }));
      });
    }
    if (
      item.stage === "chamber_veto" &&
      chamberVetoPagesById[proposalId] === undefined
    ) {
      void apiProposalChamberVetoPage(proposalId).then((page) => {
        setChamberVetoPagesById((curr) => ({ ...curr, [proposalId]: page }));
      });
    }
    if (
      item.stage === "build" &&
      formationPagesById[proposalId] === undefined
    ) {
      void apiProposalFormationPage(proposalId).then((page) => {
        setFormationPagesById((curr) => ({ ...curr, [proposalId]: page }));
      });
    }
  }, [
    expandedKey,
    feedItems,
    poolPagesById,
    chamberPagesById,
    citizenVetoPagesById,
    chamberVetoPagesById,
    formationPagesById,
    finishedPagesById,
  ]);

  return {
    chamberPagesById,
    chamberVetoPagesById,
    citizenVetoPagesById,
    finishedPagesById,
    formationPagesById,
    poolPagesById,
  };
}
