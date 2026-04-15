import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/primitives/button";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import {
  ProposalSummaryCard,
  ProposalTeamMilestonesCard,
  ProposalTimelineCard,
} from "@/components/ProposalSections";
import { apiProposalFinishedPage, apiProposalTimeline } from "@/lib/apiClient";
import type {
  ProposalFinishedPageDto,
  ProposalTimelineItemDto,
} from "@/types/api";
import {
  useProposalStageSync,
  useProposalTransitionNotice,
} from "./useProposalStageSync";
import { formatLoadError } from "@/lib/errorFormatting";
import { ProposalDeliberation } from "./ProposalDeliberation";

const ProposalFinished: React.FC = () => {
  const { id } = useParams();
  const [proposal, setProposal] = useState<ProposalFinishedPageDto | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<ProposalTimelineItemDto[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  useProposalStageSync(id);
  const transitionNotice = useProposalTransitionNotice();
  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [pageResult, timelineResult] = await Promise.allSettled([
          apiProposalFinishedPage(id),
          apiProposalTimeline(id),
        ]);
        if (!active) return;
        if (pageResult.status === "fulfilled") {
          setProposal(pageResult.value);
          setLoadError(null);
        } else {
          setProposal(null);
          setLoadError(pageResult.reason?.message ?? "Failed to load proposal");
        }
        if (timelineResult.status === "fulfilled") {
          setTimeline(timelineResult.value.items);
          setTimelineError(null);
        } else {
          setTimeline([]);
          setTimelineError(
            timelineResult.reason?.message ?? "Failed to load timeline",
          );
        }
      } catch (error) {
        if (!active) return;
        setProposal(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (!proposal) {
    return (
      <div className="flex flex-col gap-6">
        <PageHint pageId="proposals" />
        {transitionNotice ? (
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="px-5 py-4 text-sm text-muted"
          >
            {transitionNotice}
          </Surface>
        ) : null}
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          {loadError
            ? `Proposal unavailable: ${formatLoadError(loadError, "Failed to load proposal.")}`
            : "Loading proposal…"}
        </Surface>
      </div>
    );
  }

  const showFormationDetails = proposal.formationEligible;

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      {transitionNotice ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          {transitionNotice}
        </Surface>
      ) : null}
      <ProposalPageHeader
        title={proposal.title}
        stage={proposal.terminalStage}
        showFormationStage={proposal.formationEligible}
        chamber={proposal.chamber}
        proposer={proposal.proposer}
      >
        {proposal.canReconsider ? (
          <div className="flex justify-center">
            <Button asChild size="sm">
              <Link
                to={
                  proposal.reconsiderationDraftId
                    ? `/app/proposals/new?draftId=${encodeURIComponent(proposal.reconsiderationDraftId)}`
                    : `/app/proposals/new?resubmitsProposalId=${encodeURIComponent(proposal.decisionRootProposalId)}`
                }
              >
                Resubmit for reconsideration
              </Link>
            </Button>
          </div>
        ) : null}
      </ProposalPageHeader>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">
          {proposal.terminalLabel}
        </h2>
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          {proposal.terminalSummary}
        </Surface>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">Outcome status</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {proposal.stageData.map((entry) => (
            <Surface
              key={entry.title}
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="p-4"
            >
              <p className="text-sm font-semibold text-muted">{entry.title}</p>
              <p className="text-xs text-muted">{entry.description}</p>
              <p className="text-lg font-semibold text-text">{entry.value}</p>
            </Surface>
          ))}
        </div>
      </section>

      <ProposalSummaryCard
        summary={proposal.summary}
        stats={proposal.stats}
        overview={proposal.overview}
        executionPlan={proposal.executionPlan}
        budgetScope={proposal.budgetScope}
        attachments={proposal.attachments}
        showExecutionPlan={proposal.formationEligible}
        showBudgetScope={proposal.formationEligible}
      />

      {showFormationDetails ? (
        <ProposalTeamMilestonesCard
          teamLocked={proposal.lockedTeam}
          openSlots={proposal.openSlots}
          milestonesDetail={proposal.milestonesDetail}
        />
      ) : null}

      <ProposalDeliberation proposalId={id} />

      {timelineError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          Timeline unavailable: {formatLoadError(timelineError)}
        </Surface>
      ) : (
        <ProposalTimelineCard items={timeline} proposalId={id} />
      )}
    </div>
  );
};

export default ProposalFinished;
