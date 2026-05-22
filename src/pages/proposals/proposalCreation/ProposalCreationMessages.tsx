import { Card } from "@/components/primitives/card";
import { TierLabel } from "@/components/TierLabel";
import { formatLoadError } from "@/lib/errorFormatting";

type ProposalCreationMessagesProps = {
  currentTier: string | null;
  loadDraftError: string | null;
  loadingDraftId: string | null;
  requiredTier: string;
  resubmitsProposalId?: string;
  saveError: string | null;
  submitError: string | null;
  tierBlocked: boolean;
};

export function ProposalCreationLineageMessage({
  resubmitsProposalId,
}: {
  resubmitsProposalId?: string;
}) {
  if (!resubmitsProposalId) return null;
  return (
    <Card className="border-dashed px-4 py-4 text-sm text-muted">
      This draft is marked as a reconsideration of decision lineage{" "}
      <span className="font-mono text-xs text-text">{resubmitsProposalId}</span>
      . Submit it only if you intend this proposal to count as the same decision
      lineage.
    </Card>
  );
}

export function ProposalCreationMessages({
  currentTier,
  loadDraftError,
  loadingDraftId,
  requiredTier,
  saveError,
  submitError,
  tierBlocked,
}: ProposalCreationMessagesProps) {
  return (
    <>
      {saveError ? (
        <div className="rounded-xl border border-dashed border-border bg-panel-alt px-4 py-3 text-xs text-muted">
          {formatLoadError(saveError)}
        </div>
      ) : null}
      {loadingDraftId ? (
        <div className="rounded-xl border border-dashed border-border bg-panel-alt px-4 py-3 text-xs text-muted">
          Loading draft for editing…
        </div>
      ) : null}
      {loadDraftError ? (
        <div className="rounded-xl border border-dashed border-border bg-panel-alt px-4 py-3 text-xs text-destructive">
          Draft load failed: {formatLoadError(loadDraftError)}
        </div>
      ) : null}
      {submitError ? (
        <div className="rounded-xl border border-dashed border-border bg-panel-alt px-4 py-3 text-xs text-destructive">
          Submit failed: {formatLoadError(submitError)}
        </div>
      ) : null}
      {tierBlocked ? (
        <div className="rounded-xl border border-dashed border-border bg-panel-alt px-4 py-3 text-xs text-destructive">
          Selected proposal type requires <TierLabel tier={requiredTier} />.
          Your tier is <TierLabel tier={currentTier ?? "Nominee"} />. Choose an
          eligible type to continue.
        </div>
      ) : null}
    </>
  );
}
