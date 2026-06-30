import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { Chip } from "@/components/Chip";
import { initiativePath } from "@/lib/initiativeUi";
import {
  buildProposalStageLinks,
  ProposalStageBar,
  type ProposalStage,
} from "@/components/ProposalStageBar";
import { AddressInline } from "@/components/AddressInline";
import { StatTile } from "@/components/StatTile";
import { apiProposalStatus } from "@/lib/apiClient";
import type { ProposalStatusDto } from "@/types/api";

type ProposalPageHeaderProps = {
  title: string;
  stage: ProposalStage;
  proposalId?: string;
  showFormationStage?: boolean;
  chamber: string;
  proposer: string;
  stageLinks?: Partial<Record<ProposalStage, string>>;
  children?: ReactNode;
};

export function ProposalPageHeader({
  title,
  stage,
  proposalId,
  showFormationStage = true,
  chamber,
  proposer,
  stageLinks,
  children,
}: ProposalPageHeaderProps) {
  const [status, setStatus] = useState<ProposalStatusDto | null>(null);

  useEffect(() => {
    if (!proposalId) {
      setStatus(null);
      return;
    }

    let active = true;
    void apiProposalStatus(proposalId)
      .then((nextStatus) => {
        if (active) setStatus(nextStatus);
      })
      .catch(() => {
        if (active) setStatus(null);
      });

    return () => {
      active = false;
    };
  }, [proposalId]);

  const liveStage = status?.canonicalStage ?? stage;
  const computedStageLinks = useMemo(() => {
    if (!proposalId) return stageLinks;
    return buildProposalStageLinks({
      canonicalRoute: status?.canonicalRoute,
      liveStage,
      proposalId,
      routeOverrides: stageLinks,
      showFormationStage,
    });
  }, [
    liveStage,
    proposalId,
    showFormationStage,
    stageLinks,
    status?.canonicalRoute,
  ]);

  return (
    <section className="space-y-4">
      <h1 className="text-center text-2xl font-semibold text-text">{title}</h1>
      {status?.initiative ? (
        <div className="flex justify-center">
          <Link to={initiativePath(status.initiative)}>
            <Chip className="stage-chip stage-chip--system">
              Initiative · {status.initiative.title}
            </Chip>
          </Link>
        </div>
      ) : null}
      <ProposalStageBar
        current={stage}
        liveStage={liveStage}
        showFormationStage={showFormationStage}
        stageLinks={computedStageLinks}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <StatTile
          label="Chamber"
          value={chamber}
          radius="2xl"
          className="px-4 py-4"
          labelClassName="text-[0.8rem]"
          valueClassName="text-2xl"
        />
        <StatTile
          label="Proposer"
          value={
            <AddressInline
              address={proposer}
              className="justify-center"
              textClassName="text-base sm:text-lg"
            />
          }
          radius="2xl"
          className="px-4 py-4"
          labelClassName="text-[0.8rem]"
          valueClassName="text-lg"
        />
      </div>
      {children}
    </section>
  );
}
