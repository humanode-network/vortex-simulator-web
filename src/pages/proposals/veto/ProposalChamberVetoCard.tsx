import { StatTile } from "@/components/StatTile";
import { Surface } from "@/components/Surface";
import { VoteButton } from "@/components/VoteButton";
import { formatDateTime } from "@/lib/dateTime";
import { getVetoActionGate } from "@/lib/proposalVetoUi";
import type { ChamberVetoProposalPageDto } from "@/types/api";

type ChamberVetoCardProps = {
  chamber: ChamberVetoProposalPageDto["chambers"][number];
  onVote: (chamberId: string, choice: "veto" | "keep" | "abstain") => void;
  submitting: boolean;
  vetoWindowOpen: boolean;
  viewerIsProposer: boolean;
};

export function ProposalChamberVetoCard({
  chamber,
  onVote,
  submitting,
  vetoWindowOpen,
  viewerIsProposer,
}: ChamberVetoCardProps) {
  const totalVotes =
    chamber.votes.veto + chamber.votes.keep + chamber.votes.abstain;
  const currentVote = chamber.viewer.currentVote;
  const vetoRecorded = currentVote === "veto";
  const keepRecorded = currentVote === "keep";
  const abstainRecorded = currentVote === "abstain";
  const ineligibleReason = "You are not eligible to vote in this chamber veto.";
  const vetoActionGate = getVetoActionGate({
    alreadyRecorded: vetoRecorded,
    alreadyRecordedReason: "Your chamber veto is already recorded here.",
    ineligibleReason,
    submitting,
    viewerEligible: chamber.viewer.eligible,
    viewerIsProposer,
    windowOpen: vetoWindowOpen,
  });
  const keepActionGate = getVetoActionGate({
    alreadyRecorded: keepRecorded,
    alreadyRecordedReason: "Your chamber keep vote is already recorded here.",
    ineligibleReason,
    submitting,
    viewerEligible: chamber.viewer.eligible,
    viewerIsProposer,
    windowOpen: vetoWindowOpen,
  });
  const abstainActionGate = getVetoActionGate({
    alreadyRecorded: abstainRecorded,
    alreadyRecordedReason:
      "Your chamber abstain vote is already recorded here.",
    ineligibleReason,
    submitting,
    viewerEligible: chamber.viewer.eligible,
    viewerIsProposer,
    windowOpen: vetoWindowOpen,
  });

  return (
    <Surface
      variant="panelAlt"
      radius="2xl"
      shadow="tile"
      className="space-y-4 p-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-text">
            {chamber.chamberTitle}
          </h3>
          <p className="text-xs text-muted">
            {chamber.countsAsVetoing
              ? "This chamber currently counts as vetoing."
              : "This chamber has not yet crossed its internal veto threshold."}
          </p>
        </div>
        <Surface
          variant="panel"
          radius="full"
          className="px-3 py-1 text-xs font-semibold text-muted"
        >
          {chamber.countsAsVetoing ? "Vetoing" : "Not vetoing"}
        </Surface>
      </div>

      <div className="grid gap-2 text-sm text-text sm:grid-cols-2">
        <StatTile
          label="Eligible voters"
          value={String(chamber.eligibleVoters)}
          className="px-3 py-3"
        />
        <StatTile
          label="Quorum needed"
          value={String(chamber.quorumNeeded)}
          className="px-3 py-3"
        />
        <StatTile
          label="Veto needed"
          value={String(chamber.vetoNeeded)}
          className="px-3 py-3"
        />
        <StatTile
          label="Weighted split"
          value={`${chamber.votes.veto} / ${chamber.votes.keep} / ${chamber.votes.abstain}`}
          className="px-3 py-3"
        />
        <StatTile
          label="Delegation source"
          value={
            chamber.delegation.snapshotCapturedAt
              ? `${chamber.delegation.source} · ${formatDateTime(chamber.delegation.snapshotCapturedAt)}`
              : chamber.delegation.source
          }
          className="px-3 py-3"
        />
      </div>

      <p className="text-xs text-muted">
        Eligible voters and quorum are headcount-based. Weighted totals below
        include delegated voting weight captured for this proposal.
      </p>

      <p className="text-xs text-muted">
        {viewerIsProposer
          ? "You cannot vote on your own proposal."
          : chamber.viewer.eligible
            ? chamber.viewer.currentVote
              ? `Your current vote: ${chamber.viewer.currentVote}`
              : "You are eligible to vote in this chamber."
            : "You are not eligible in this chamber's snapped electorate."}
      </p>

      <div className="flex flex-wrap gap-2">
        <VoteButton
          tone="destructive"
          label={vetoRecorded ? "Veto cast" : "Veto"}
          className={
            vetoRecorded
              ? "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)]"
              : undefined
          }
          disabled={vetoActionGate.disabled}
          title={vetoActionGate.title}
          onClick={() => onVote(chamber.chamberId, "veto")}
        />
        <VoteButton
          tone="accent"
          label={keepRecorded ? "Keep cast" : "Keep"}
          className={
            keepRecorded
              ? "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              : undefined
          }
          disabled={keepActionGate.disabled}
          title={keepActionGate.title}
          onClick={() => onVote(chamber.chamberId, "keep")}
        />
        <VoteButton
          tone="neutral"
          label={abstainRecorded ? "Abstaining" : "Abstain"}
          className={
            abstainRecorded
              ? "bg-[var(--panel-alt)] text-[var(--text)] ring-1 ring-[var(--border-strong)] hover:bg-[var(--panel-alt)]"
              : undefined
          }
          disabled={abstainActionGate.disabled}
          title={abstainActionGate.title}
          onClick={() => onVote(chamber.chamberId, "abstain")}
        />
      </div>

      <p className="text-xs text-muted">
        {totalVotes} weighted votes cast so far in this chamber.
      </p>
    </Surface>
  );
}
