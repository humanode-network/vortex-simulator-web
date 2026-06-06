import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/primitives/button";
import { formatLoadError } from "@/lib/errorFormatting";
import type { FormationActionVisibility } from "@/lib/formationActionsUi";

type ProposalFormationActionsProps = {
  actionError: string | null;
  authStatus: {
    authenticated: boolean;
    eligible: boolean;
    loading: boolean;
  };
  nextMilestone: number | undefined;
  onFinishProject: () => void;
  onJoinProject: () => void;
  onOpenMilestoneVote: () => void;
  onSubmitMilestone: () => void;
  pendingMilestone: number | undefined;
  visibility: FormationActionVisibility;
};

export const ProposalFormationActions: React.FC<
  ProposalFormationActionsProps
> = ({
  actionError,
  authStatus,
  nextMilestone,
  onFinishProject,
  onJoinProject,
  onOpenMilestoneVote,
  onSubmitMilestone,
  pendingMilestone,
  visibility,
}) => {
  const hasVisibleActions =
    visibility.showJoinProject ||
    visibility.showSubmitMilestone ||
    visibility.showOpenMilestoneVote ||
    visibility.showFinishProject;

  return (
    <section className="space-y-2">
      <SectionHeader>Formation actions</SectionHeader>
      {hasVisibleActions ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {visibility.showJoinProject ? (
            <Button
              type="button"
              size="md"
              disabled={!visibility.canJoinProject}
              onClick={onJoinProject}
            >
              Join project
            </Button>
          ) : null}

          {visibility.showSubmitMilestone ? (
            <Button
              type="button"
              size="md"
              variant="outline"
              disabled={!visibility.canSubmitMilestone}
              onClick={onSubmitMilestone}
            >
              Submit M{nextMilestone ?? "-"}
            </Button>
          ) : null}

          {visibility.showOpenMilestoneVote ? (
            <Button
              type="button"
              size="md"
              variant="outline"
              disabled={!visibility.canOpenMilestoneVote}
              onClick={onOpenMilestoneVote}
            >
              Vote in chamber M{pendingMilestone ?? "-"}
            </Button>
          ) : null}

          {visibility.showFinishProject ? (
            <Button
              type="button"
              size="md"
              variant="outline"
              disabled={!visibility.canFinishProject}
              onClick={onFinishProject}
            >
              Finish Project
            </Button>
          ) : null}
        </div>
      ) : visibility.statusMessage ? (
        <p className="text-sm text-muted">{visibility.statusMessage}</p>
      ) : null}

      {authStatus.loading ? (
        <p className="text-xs text-muted">Checking wallet status...</p>
      ) : hasVisibleActions && !authStatus.authenticated ? (
        <p className="text-xs text-muted">Connect a wallet to act.</p>
      ) : hasVisibleActions &&
        authStatus.authenticated &&
        !authStatus.eligible ? (
        <p className="text-xs text-muted">
          Wallet is connected, but not active (gated).
        </p>
      ) : null}

      {visibility.showOpenMilestoneVote ? (
        <p className="text-xs text-muted">
          Milestone continuation/release voting is done in the Chamber vote
          stage.
        </p>
      ) : null}

      {actionError ? (
        <p className="text-xs text-destructive" role="status">
          {formatLoadError(actionError)}
        </p>
      ) : null}
    </section>
  );
};
