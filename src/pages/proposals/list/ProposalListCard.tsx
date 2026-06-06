import { GlassyRecordCard } from "@/components/GlassyRecordCard";
import { Surface } from "@/components/Surface";
import { getFormationProgress } from "@/lib/dtoParsers";
import {
  getChamberProposalListStats,
  getPoolProposalListStats,
  getProposalListKeyStats,
  getProposalListLoadingMessage,
  getProposalListPrimaryHref,
  hasFinishedRoute,
} from "@/lib/proposalListUi";
import type { ProposalListItemDto } from "@/types/api";
import { ProposalListCardFooter } from "./ProposalListCardFooter";
import {
  ProposalChamberSnapshot,
  ProposalChamberVetoSnapshot,
  ProposalCitizenVetoSnapshot,
  ProposalFinishedSnapshot,
  ProposalFormationSnapshot,
  ProposalPoolSnapshot,
} from "./ProposalListStagePanels";
import { ProposalStageDataGrid } from "./ProposalStageDataGrid";
import type { ProposalStageDetailPages } from "./useProposalStageDetails";

type ProposalListCardProps = {
  detailPages: ProposalStageDetailPages;
  expanded: boolean;
  onToggle: () => void;
  proposal: ProposalListItemDto;
};

export function ProposalListCard({
  detailPages,
  expanded,
  onToggle,
  proposal,
}: ProposalListCardProps) {
  const poolPage =
    proposal.stage === "pool" ? detailPages.poolPagesById[proposal.id] : null;
  const chamberPage =
    proposal.stage === "vote"
      ? detailPages.chamberPagesById[proposal.id]
      : null;
  const citizenVetoPage =
    proposal.stage === "citizen_veto"
      ? detailPages.citizenVetoPagesById[proposal.id]
      : null;
  const chamberVetoPage =
    proposal.stage === "chamber_veto"
      ? detailPages.chamberVetoPagesById[proposal.id]
      : null;
  const formationPage =
    proposal.stage === "build"
      ? detailPages.formationPagesById[proposal.id]
      : null;
  const finishedPage = hasFinishedRoute(proposal.href)
    ? (detailPages.finishedPagesById[proposal.id] ?? null)
    : null;
  const poolStats =
    proposal.stage === "pool" && poolPage
      ? getPoolProposalListStats(poolPage)
      : null;
  const chamberStats =
    proposal.stage === "vote" && chamberPage
      ? getChamberProposalListStats(chamberPage)
      : null;
  const formationStats =
    proposal.stage === "build" && formationPage
      ? getFormationProgress(formationPage)
      : null;
  const keyStats = getProposalListKeyStats({
    proposal,
    poolPage,
    chamberPage,
    citizenVetoPage,
    chamberVetoPage,
    finishedPage,
    formationPage,
  });
  const loadingMessage = getProposalListLoadingMessage(proposal);

  return (
    <GlassyRecordCard
      expanded={expanded}
      onToggle={onToggle}
      rail={expanded ? "action" : "idle"}
      meta={proposal.chamber}
      stage={proposal.stage}
      stageLabel={proposal.summaryPill === "Finished" ? "Finished" : undefined}
      title={proposal.title}
      summary={proposal.summary}
      dateText={proposal.date}
    >
      <section className="space-y-5">
        {finishedPage ? (
          <ProposalFinishedSnapshot
            itemKeyPrefix={`${proposal.id}-finished`}
            stageData={finishedPage.stageData}
            terminalSummary={finishedPage.terminalSummary}
          />
        ) : proposal.stage === "pool" && poolPage && poolStats ? (
          <ProposalPoolSnapshot
            downvotes={poolPage.downvotes}
            upvotes={poolPage.upvotes}
            stats={poolStats}
          />
        ) : proposal.stage === "vote" && chamberPage && chamberStats ? (
          <ProposalChamberSnapshot
            formationEligible={chamberPage.formationEligible}
            passingRule={chamberPage.passingRule}
            timeLeft={chamberPage.timeLeft}
            stats={chamberStats}
          />
        ) : proposal.stage === "citizen_veto" && citizenVetoPage ? (
          <ProposalCitizenVetoSnapshot
            attemptsRemaining={citizenVetoPage.attemptsRemaining}
            attemptsUsed={citizenVetoPage.attemptsUsed}
            itemKeyPrefix={`${proposal.id}-citizen-veto`}
            stageData={citizenVetoPage.stageData}
          />
        ) : proposal.stage === "chamber_veto" && chamberVetoPage ? (
          <ProposalChamberVetoSnapshot
            chamberThreshold={chamberVetoPage.chamberThreshold}
            itemKeyPrefix={`${proposal.id}-chamber-veto`}
            stageData={chamberVetoPage.stageData}
            vetoingChambers={chamberVetoPage.vetoingChambers}
          />
        ) : proposal.stage === "build" && formationPage && formationStats ? (
          <ProposalFormationSnapshot
            itemKeyPrefix={`${proposal.id}-formation`}
            progress={formationPage.progress}
            stageData={formationPage.stageData}
            stats={formationStats}
            timeLeft={formationPage.timeLeft}
          />
        ) : loadingMessage ? (
          <Surface
            variant="glass"
            radius="2xl"
            shadow="tile"
            className="px-5 py-4 text-sm text-muted"
          >
            {loadingMessage}
          </Surface>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-text">Stage data</p>
            <ProposalStageDataGrid
              items={proposal.stageData}
              itemKeyPrefix={`${proposal.id}-stage`}
            />
          </div>
        )}

        <ProposalListCardFooter
          ctaPrimary={proposal.ctaPrimary}
          keyStats={keyStats}
          primaryHref={getProposalListPrimaryHref(proposal)}
          proposer={proposal.proposer}
          proposerId={proposal.proposerId}
          proposalId={proposal.id}
          tags={proposal.tags}
        />
      </section>
    </GlassyRecordCard>
  );
}
