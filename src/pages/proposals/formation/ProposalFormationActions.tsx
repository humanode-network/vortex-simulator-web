import { Button } from "@/components/primitives/button";
import { Surface } from "@/components/Surface";
import { formatLoadError } from "@/lib/errorFormatting";

type ProposalFormationActionsProps = {
  actionBusy: boolean;
  actionError: string | null;
  authStatus: {
    authenticated: boolean;
    eligible: boolean;
    loading: boolean;
  };
  canFinishProject: boolean;
  canJoinProject: boolean;
  canOpenMilestoneVote: boolean;
  canSubmitMilestone: boolean;
  isProposerViewer: boolean;
  nextMilestone: number | undefined;
  onFinishProject: () => void;
  onJoinProject: () => void;
  onOpenMilestoneVote: () => void;
  onSubmitMilestone: () => void;
  pendingMilestone: number | undefined;
};

export const ProposalFormationActions: React.FC<
  ProposalFormationActionsProps
> = ({
  actionBusy,
  actionError,
  authStatus,
  canFinishProject,
  canJoinProject,
  canOpenMilestoneVote,
  canSubmitMilestone,
  isProposerViewer,
  nextMilestone,
  onFinishProject,
  onJoinProject,
  onOpenMilestoneVote,
  onSubmitMilestone,
  pendingMilestone,
}) => {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-text">Formation actions</h2>
      <Surface
        variant="panelAlt"
        radius="2xl"
        shadow="tile"
        className="space-y-3 p-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            size="lg"
            disabled={
              !authStatus.authenticated ||
              !authStatus.eligible ||
              actionBusy ||
              isProposerViewer ||
              !canJoinProject
            }
            onClick={onJoinProject}
          >
            Join project
          </Button>

          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={!canSubmitMilestone}
            onClick={onSubmitMilestone}
          >
            Submit M{nextMilestone ?? "-"}
          </Button>

          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={!canOpenMilestoneVote}
            onClick={onOpenMilestoneVote}
          >
            Vote in chamber M{pendingMilestone ?? "-"}
          </Button>

          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={!canFinishProject}
            onClick={onFinishProject}
          >
            Finish Project
          </Button>
        </div>

        {authStatus.loading ? (
          <p className="text-xs text-muted">Checking wallet status...</p>
        ) : !authStatus.authenticated ? (
          <p className="text-xs text-muted">Connect a wallet to act.</p>
        ) : isProposerViewer ? (
          <p className="text-xs text-muted">
            Proposer is counted in team slots by default.
          </p>
        ) : authStatus.authenticated && !authStatus.eligible ? (
          <p className="text-xs text-muted">
            Wallet is connected, but not active (gated).
          </p>
        ) : null}

        {canOpenMilestoneVote ? (
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
      </Surface>
    </section>
  );
};
