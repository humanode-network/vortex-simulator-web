import { Surface } from "@/components/Surface";
import { VoteButton } from "@/components/VoteButton";
import { getVetoActionGate } from "@/lib/proposalVetoUi";
import type { CitizenVetoProposalPageDto } from "@/types/api";

type CitizenVetoActionsProps = {
  onVote: (choice: "veto" | "keep") => void;
  submitting: boolean;
  vetoWindowOpen: boolean;
  viewer: CitizenVetoProposalPageDto["viewer"];
  viewerIsProposer: boolean;
};

export function ProposalCitizenVetoActions({
  onVote,
  submitting,
  vetoWindowOpen,
  viewer,
  viewerIsProposer,
}: CitizenVetoActionsProps) {
  const vetoRecorded = viewer.currentVote === "veto";
  const keepRecorded = viewer.currentVote === "keep";
  const ineligibleReason =
    "Only Citizens captured when this veto window opened can vote here.";
  const vetoActionGate = getVetoActionGate({
    alreadyRecorded: vetoRecorded,
    alreadyRecordedReason: "Your citizen veto is already recorded.",
    ineligibleReason,
    submitting,
    viewerEligible: viewer.eligible,
    viewerIsProposer,
    windowOpen: vetoWindowOpen,
  });
  const keepActionGate = getVetoActionGate({
    alreadyRecorded: keepRecorded,
    alreadyRecordedReason: "Your citizen keep vote is already recorded.",
    ineligibleReason,
    submitting,
    viewerEligible: viewer.eligible,
    viewerIsProposer,
    windowOpen: vetoWindowOpen,
  });

  return (
    <>
      <Surface
        variant="panelAlt"
        radius="2xl"
        shadow="tile"
        className="mx-auto max-w-3xl px-5 py-4 text-sm text-muted"
      >
        <p className="font-semibold text-text">Citizen Veto</p>
        <p className="mt-2">
          {viewerIsProposer
            ? "You proposed this decision, so you cannot vote in its Citizen Veto."
            : viewer.eligible
              ? viewer.currentVote === "veto"
                ? "Only Citizens captured when this veto window opened can vote here. Your current vote is Veto."
                : viewer.currentVote === "keep"
                  ? "Only Citizens captured when this veto window opened can vote here. Your current vote is Keep."
                  : "Only Citizens captured when this veto window opened can vote here. Cast Veto to send the decision back for reconsideration, or Keep to leave it in place."
              : "Only Citizens captured when this veto window opened can vote here. You were not in that group for this proposal."}
        </p>
        <p className="mt-2 text-xs text-muted">
          {vetoWindowOpen
            ? "If Veto reaches the threshold before this window ends, the proposal returns to the proposer for reconsideration."
            : "This veto window has ended."}
        </p>
      </Surface>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <VoteButton
          tone="destructive"
          label={
            submitting ? "Casting veto..." : vetoRecorded ? "Veto cast" : "Veto"
          }
          className={
            vetoRecorded
              ? "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)]"
              : undefined
          }
          disabled={vetoActionGate.disabled}
          title={vetoActionGate.title}
          onClick={() => onVote("veto")}
        />
        <VoteButton
          tone="neutral"
          label={
            submitting ? "Casting keep..." : keepRecorded ? "Keep cast" : "Keep"
          }
          className={
            keepRecorded
              ? "bg-[var(--panel-alt)] text-[var(--text)] ring-1 ring-[var(--border-strong)] hover:bg-[var(--panel-alt)]"
              : undefined
          }
          disabled={keepActionGate.disabled}
          title={keepActionGate.title}
          onClick={() => onVote("keep")}
        />
      </div>
    </>
  );
}
