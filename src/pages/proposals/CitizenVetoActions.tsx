import { VoteButton } from "@/components/VoteButton";
import type { ChamberProposalPageDto } from "@/types/api";

type CitizenVetoActionsProps = {
  citizenVeto: ChamberProposalPageDto["citizenVeto"];
  viewerIsProposer: boolean;
  windowOpen: boolean;
  submittingKey: string | null;
  onVote: () => void;
};

export const CitizenVetoActions: React.FC<CitizenVetoActionsProps> = ({
  citizenVeto,
  viewerIsProposer,
  windowOpen,
  submittingKey,
  onVote,
}) => {
  const currentVote = citizenVeto.viewer.currentVote;
  const vetoRecorded = currentVote === "veto";
  const tone = currentVote === "keep" ? "neutral" : "destructive";
  const disabled =
    Boolean(submittingKey) ||
    viewerIsProposer ||
    !windowOpen ||
    !citizenVeto.available ||
    !citizenVeto.viewer.eligible ||
    currentVote !== null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <VoteButton
        tone={tone}
        label={
          submittingKey
            ? "Casting veto..."
            : currentVote === "veto"
              ? "Citizen veto cast"
              : currentVote === "keep"
                ? "Citizen keep recorded"
                : "Citizen veto"
        }
        className={
          vetoRecorded
            ? "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)]"
            : undefined
        }
        disabled={disabled}
        title={
          viewerIsProposer
            ? "You cannot veto your own proposal."
            : currentVote === "veto"
              ? "Your citizen veto is already recorded."
              : currentVote === "keep"
                ? "Your citizen keep vote is already recorded. Use the Citizen Veto tab to change it."
                : !windowOpen
                  ? "Veto window ended."
                  : !citizenVeto.available
                    ? "Citizen veto is exhausted for this decision."
                    : !citizenVeto.viewer.eligible
                      ? "Only Citizens captured when this veto window opened can vote here."
                      : undefined
        }
        onClick={onVote}
      />
    </div>
  );
};
