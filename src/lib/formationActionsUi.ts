type FormationProjectState =
  | "active"
  | "awaiting_milestone_vote"
  | "canceled"
  | "ready_to_finish"
  | "completed"
  | undefined;

export type FormationActionVisibilityInput = {
  actionBusy: boolean;
  authenticated: boolean;
  eligible: boolean;
  hasOpenRoles: boolean;
  isProposerViewer: boolean;
  nextMilestone: number | undefined;
  pendingMilestone: number | undefined;
  projectState: FormationProjectState;
  viewerCanFinishProject?: boolean;
  viewerCanJoin?: boolean;
  viewerCanOpenMilestoneVote?: boolean;
  viewerCanSubmitMilestone?: boolean;
  viewerIsTeamMember: boolean;
};

export type FormationActionVisibility = {
  canFinishProject: boolean;
  canJoinProject: boolean;
  canOpenMilestoneVote: boolean;
  canSubmitMilestone: boolean;
  showFinishProject: boolean;
  showJoinProject: boolean;
  showOpenMilestoneVote: boolean;
  showSubmitMilestone: boolean;
  statusMessage: string | null;
};

function canUseAuthenticatedCommand(input: FormationActionVisibilityInput) {
  return input.authenticated && input.eligible && !input.actionBusy;
}

export function getFormationActionVisibility(
  input: FormationActionVisibilityInput,
): FormationActionVisibility {
  const nextMilestoneReady =
    typeof input.nextMilestone === "number" && input.nextMilestone > 0;
  const pendingMilestoneReady =
    typeof input.pendingMilestone === "number" && input.pendingMilestone > 0;
  const projectIsActive = input.projectState === "active";
  const projectIsReadyToFinish = input.projectState === "ready_to_finish";
  const projectIsAwaitingVote =
    input.projectState === "awaiting_milestone_vote";
  const viewerCanJoin = input.viewerCanJoin ?? true;
  const viewerCanOpenMilestoneVote = input.viewerCanOpenMilestoneVote ?? true;
  const viewerCanSubmitMilestone = input.viewerCanSubmitMilestone ?? true;
  const viewerCanFinishProject = input.viewerCanFinishProject ?? true;

  const showJoinProject =
    projectIsActive &&
    input.hasOpenRoles &&
    !input.isProposerViewer &&
    !input.viewerIsTeamMember;
  const showSubmitMilestone =
    projectIsActive && input.isProposerViewer && nextMilestoneReady;
  const showOpenMilestoneVote =
    projectIsAwaitingVote &&
    pendingMilestoneReady &&
    !input.isProposerViewer &&
    !input.viewerIsTeamMember;
  const showFinishProject = projectIsReadyToFinish && input.isProposerViewer;

  const commandAllowed = canUseAuthenticatedCommand(input);
  const canJoinProject = showJoinProject && commandAllowed && viewerCanJoin;
  const canSubmitMilestone =
    showSubmitMilestone && commandAllowed && viewerCanSubmitMilestone;
  const canOpenMilestoneVote =
    showOpenMilestoneVote && viewerCanOpenMilestoneVote;
  const canFinishProject =
    showFinishProject && commandAllowed && viewerCanFinishProject;

  let statusMessage: string | null = null;
  if (
    !showJoinProject &&
    !showSubmitMilestone &&
    !showOpenMilestoneVote &&
    !showFinishProject
  ) {
    if (input.projectState === "completed") {
      statusMessage = "This Formation project is finished.";
    } else if (input.projectState === "canceled") {
      statusMessage = "This Formation project was canceled.";
    } else if (input.viewerIsTeamMember) {
      statusMessage =
        "You are on this Formation team. No team action is available right now.";
    } else if (!input.hasOpenRoles && projectIsActive) {
      statusMessage = "No open team slots are available right now.";
    } else {
      statusMessage = "No Formation action is available right now.";
    }
  }

  return {
    canFinishProject,
    canJoinProject,
    canOpenMilestoneVote,
    canSubmitMilestone,
    showFinishProject,
    showJoinProject,
    showOpenMilestoneVote,
    showSubmitMilestone,
    statusMessage,
  };
}
