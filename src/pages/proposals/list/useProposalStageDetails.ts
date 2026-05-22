import { useEffect, useState } from "react";

import {
  apiProposalChamberPage,
  apiProposalChamberVetoPage,
  apiProposalCitizenVetoPage,
  apiProposalFinishedPage,
  apiProposalFormationPage,
  apiProposalPoolPage,
} from "@/lib/apiClient";
import { hasFinishedRoute } from "@/lib/proposalListUi";
import type {
  ChamberProposalPageDto,
  ChamberVetoProposalPageDto,
  CitizenVetoProposalPageDto,
  FormationProposalPageDto,
  ProposalFinishedPageDto,
  ProposalListItemDto,
  PoolProposalPageDto,
} from "@/types/api";

export type ProposalStageDetailPages = {
  chamberPagesById: Record<string, ChamberProposalPageDto | undefined>;
  chamberVetoPagesById: Record<string, ChamberVetoProposalPageDto | undefined>;
  citizenVetoPagesById: Record<string, CitizenVetoProposalPageDto | undefined>;
  finishedPagesById: Record<string, ProposalFinishedPageDto | undefined>;
  formationPagesById: Record<string, FormationProposalPageDto | undefined>;
  poolPagesById: Record<string, PoolProposalPageDto | undefined>;
};

export function useProposalStageDetails(
  expanded: string | null,
  proposalData: ProposalListItemDto[] | null,
): ProposalStageDetailPages {
  const [poolPagesById, setPoolPagesById] = useState<
    Record<string, PoolProposalPageDto | undefined>
  >({});
  const [chamberPagesById, setChamberPagesById] = useState<
    Record<string, ChamberProposalPageDto | undefined>
  >({});
  const [citizenVetoPagesById, setCitizenVetoPagesById] = useState<
    Record<string, CitizenVetoProposalPageDto | undefined>
  >({});
  const [chamberVetoPagesById, setChamberVetoPagesById] = useState<
    Record<string, ChamberVetoProposalPageDto | undefined>
  >({});
  const [formationPagesById, setFormationPagesById] = useState<
    Record<string, FormationProposalPageDto | undefined>
  >({});
  const [finishedPagesById, setFinishedPagesById] = useState<
    Record<string, ProposalFinishedPageDto | undefined>
  >({});

  useEffect(() => {
    if (!expanded || !proposalData) return;
    const proposal = proposalData.find((item) => item.id === expanded);
    if (!proposal) return;

    if (hasFinishedRoute(proposal.href)) {
      if (finishedPagesById[proposal.id] === undefined) {
        void apiProposalFinishedPage(proposal.id).then((page) => {
          setFinishedPagesById((current) => ({
            ...current,
            [proposal.id]: page,
          }));
        });
      }
      return;
    }

    if (proposal.stage === "pool" && poolPagesById[proposal.id] === undefined) {
      void apiProposalPoolPage(proposal.id).then((page) => {
        setPoolPagesById((current) => ({ ...current, [proposal.id]: page }));
      });
    }
    if (
      proposal.stage === "vote" &&
      chamberPagesById[proposal.id] === undefined
    ) {
      void apiProposalChamberPage(proposal.id).then((page) => {
        setChamberPagesById((current) => ({
          ...current,
          [proposal.id]: page,
        }));
      });
    }
    if (
      proposal.stage === "citizen_veto" &&
      citizenVetoPagesById[proposal.id] === undefined
    ) {
      void apiProposalCitizenVetoPage(proposal.id).then((page) => {
        setCitizenVetoPagesById((current) => ({
          ...current,
          [proposal.id]: page,
        }));
      });
    }
    if (
      proposal.stage === "chamber_veto" &&
      chamberVetoPagesById[proposal.id] === undefined
    ) {
      void apiProposalChamberVetoPage(proposal.id).then((page) => {
        setChamberVetoPagesById((current) => ({
          ...current,
          [proposal.id]: page,
        }));
      });
    }
    if (
      proposal.stage === "build" &&
      formationPagesById[proposal.id] === undefined
    ) {
      void apiProposalFormationPage(proposal.id).then((page) => {
        setFormationPagesById((current) => ({
          ...current,
          [proposal.id]: page,
        }));
      });
    }
  }, [
    expanded,
    proposalData,
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
