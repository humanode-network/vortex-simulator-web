import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import {
  apiFormationJoin,
  apiFormationMilestoneSubmit,
  apiFormationProjectFinish,
  apiProposalFormationPage,
} from "@/lib/apiClient";
import { getFormationActionVisibility } from "@/lib/formationActionsUi";
import { viewerIsProposalAuthor } from "@/lib/proposalUi";
import { parseRatio } from "@/lib/dtoParsers";
import { useAuth } from "@/app/auth/AuthContext";
import {
  useProposalStageSync,
  useProposalTransitionNotice,
} from "./hooks/useProposalStageSync";
import { ProposalDeliberation } from "./ProposalDeliberation";
import { ProposalPageLoadingState } from "./shared/ProposalPageLoadingState";
import { ProposalTimelineSection } from "./shared/ProposalTimelineSection";
import { useProposalPageData } from "./hooks/useProposalPageData";
import { ProposalPageShell } from "./shared/ProposalPageShell";
import { ProposalFormationActions } from "./formation/ProposalFormationActions";
import { ProposalFormationStatus } from "./formation/ProposalFormationStatus";
import { ProposalDetailsSections } from "./shared/ProposalDetailsSections";

const ProposalFormation: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const {
    loadError,
    page: project,
    setPage: setProject,
    timeline,
    timelineError,
  } = useProposalPageData({
    id,
    loadPage: apiProposalFormationPage,
    pageErrorFallback: "Failed to load proposal",
  });
  const auth = useAuth();
  const syncProposalStage = useProposalStageSync(id);
  const transitionNotice = useProposalTransitionNotice();

  if (!project) {
    return (
      <ProposalPageLoadingState
        fallbackMessage="Loading proposal…"
        loadError={loadError}
        transitionNotice={transitionNotice}
        unavailableFallback="Failed to load proposal."
        unavailableLabel="Proposal unavailable"
      />
    );
  }

  const milestoneRatio = parseRatio(project.milestones);
  const teamSlotRatio = parseRatio(project.teamSlots);
  const milestones = { filled: milestoneRatio.a, total: milestoneRatio.b };
  const openRoleCount =
    project.openSlots.length > 0
      ? project.openSlots.length
      : Math.max(teamSlotRatio.b - teamSlotRatio.a, 0);
  const nextMilestone =
    project.nextMilestoneIndex ??
    (milestones.total > 0 ? milestones.filled + 1 : undefined);
  const pendingMilestone = project.pendingMilestoneIndex ?? undefined;
  const isProposerViewer = viewerIsProposalAuthor(
    auth.address,
    project.proposerId || project.proposer,
  );
  const viewerIsTeamMember = project.viewer?.isTeamMember ?? isProposerViewer;
  const actionVisibility = getFormationActionVisibility({
    actionBusy,
    authenticated: auth.authenticated,
    eligible: auth.eligible,
    hasOpenRoles: openRoleCount > 0,
    isProposerViewer: project.viewer?.isProposer ?? isProposerViewer,
    nextMilestone:
      typeof nextMilestone === "number" && nextMilestone <= milestones.total
        ? nextMilestone
        : undefined,
    pendingMilestone,
    projectState: project.projectState,
    viewerCanFinishProject: project.viewer?.canFinishProject,
    viewerCanJoin: project.viewer?.canJoin,
    viewerCanOpenMilestoneVote: project.viewer?.canOpenMilestoneVote,
    viewerCanSubmitMilestone: project.viewer?.canSubmitMilestone,
    viewerIsTeamMember,
  });
  const stageForHeader =
    project.projectState === "awaiting_milestone_vote" ? "vote" : "build";

  const runAction = async (fn: () => Promise<void>) => {
    setActionError(null);
    setActionBusy(true);
    try {
      await fn();
      const redirected = await syncProposalStage();
      if (redirected) return;
      if (id) {
        const next = await apiProposalFormationPage(id);
        setProject(next);
      }
    } catch (error) {
      setActionError((error as Error).message);
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <ProposalPageShell transitionNotice={transitionNotice}>
      <ProposalPageHeader
        title={project.title}
        stage={stageForHeader}
        proposalId={id}
        chamber={project.chamber}
        proposer={project.proposer}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ProposalFormationStatus stageData={project.stageData} />

        <ProposalFormationActions
          actionError={actionError}
          authStatus={auth}
          visibility={actionVisibility}
          nextMilestone={nextMilestone}
          onFinishProject={() =>
            void runAction(async () => {
              if (!id) return;
              await apiFormationProjectFinish({ proposalId: id });
            })
          }
          onJoinProject={() =>
            void runAction(async () => {
              if (!id) return;
              await apiFormationJoin({ proposalId: id });
            })
          }
          onOpenMilestoneVote={() => {
            if (!id) return;
            navigate(`/app/proposals/${id}/chamber`);
          }}
          onSubmitMilestone={() =>
            void runAction(async () => {
              if (!id || !nextMilestone) return;
              await apiFormationMilestoneSubmit({
                proposalId: id,
                milestoneIndex: nextMilestone,
              });
            })
          }
          pendingMilestone={pendingMilestone}
        />
      </div>

      <ProposalDetailsSections
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
        teamLocked={project.lockedTeam}
        openSlots={project.openSlots}
        milestonesDetail={project.milestonesDetail}
      />

      <ProposalDeliberation proposalId={id} />

      <ProposalTimelineSection
        error={timelineError}
        items={timeline}
        proposalId={id}
      />
    </ProposalPageShell>
  );
};

export default ProposalFormation;
