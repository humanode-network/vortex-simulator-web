import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import {
  ProposalInvisionInsightCard,
  ProposalSummaryCard,
  ProposalTeamMilestonesCard,
  ProposalTimelineCard,
} from "@/components/ProposalSections";
import { apiProposalFinishedPage, apiProposalTimeline } from "@/lib/apiClient";
import type {
  FormationProposalPageDto,
  ProposalTimelineItemDto,
} from "@/types/api";

const ProposalFinished: React.FC = () => {
  const { id } = useParams();
  const [project, setProject] = useState<FormationProposalPageDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<ProposalTimelineItemDto[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);

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
          setProject(pageResult.value);
          setLoadError(null);
        } else {
          setProject(null);
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
        setProject(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (!project) {
    return (
      <div className="flex flex-col gap-6">
        <PageHint pageId="proposals" />
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          {loadError
            ? `Proposal unavailable: ${loadError}`
            : "Loading proposal…"}
        </Surface>
      </div>
    );
  }

  const isCanceled = project.projectState === "canceled";

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <ProposalPageHeader
        title={project.title}
        stage="build"
        chamber={project.chamber}
        proposer={project.proposer}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">
          {isCanceled ? "Canceled project" : "Finished project"}
        </h2>
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          {isCanceled
            ? "This project ended as canceled."
            : "This project has completed formation execution."}
        </Surface>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">Project status</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {project.stageData.map((entry) => (
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
        summary={project.summary}
        stats={[
          { label: "Budget ask", value: project.budget },
          { label: "Time left", value: project.timeLeft },
          { label: "Team slots", value: project.teamSlots },
          { label: "Milestones", value: project.milestones },
        ]}
        overview={project.overview}
        executionPlan={project.executionPlan}
        budgetScope={project.budgetScope}
        attachments={project.attachments}
      />

      <ProposalTeamMilestonesCard
        teamLocked={project.lockedTeam}
        openSlots={project.openSlots}
        milestonesDetail={project.milestonesDetail}
      />

      <ProposalInvisionInsightCard insight={project.invisionInsight} />

      {timelineError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          Timeline unavailable: {timelineError}
        </Surface>
      ) : (
        <ProposalTimelineCard items={timeline} />
      )}
    </div>
  );
};

export default ProposalFinished;
