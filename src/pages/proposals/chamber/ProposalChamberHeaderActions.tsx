import { Link } from "react-router";
import { Button } from "@/components/primitives/button";
import { Surface } from "@/components/Surface";
import { formatDateTime } from "@/lib/dateTime";
import { formatLoadError } from "@/lib/errorFormatting";
import type { getProposalOrdinaryVoteGate } from "@/lib/proposalUi";
import type { ChamberProposalPageDto } from "@/types/api";
import { CitizenVetoActions } from "../veto/CitizenVetoActions";
import { ProposalOrdinaryVoteActions } from "../shared/ProposalOrdinaryVoteActions";

type OrdinaryVoteChoice = "yes" | "no" | "abstain";

type ProposalChamberHeaderActionsProps = {
  id: string | undefined;
  milestoneVoteIndex: number | null;
  onCitizenVetoVote: () => void;
  onVote: (choice: OrdinaryVoteChoice, score?: number) => void;
  ordinaryVoteClosed: boolean;
  ordinaryVoteGate: ReturnType<typeof getProposalOrdinaryVoteGate>;
  proposal: ChamberProposalPageDto;
  scoreLabel: "CM" | "MM" | null;
  setYesScore: (score: number) => void;
  submitError: string | null;
  submittingVetoKey: string | null;
  vetoWindowOpen: boolean;
  viewerIsProposer: boolean;
  viewerVoteLabel: string | null;
  yesScore: number;
};

export const ProposalChamberHeaderActions: React.FC<
  ProposalChamberHeaderActionsProps
> = ({
  id,
  milestoneVoteIndex,
  onCitizenVetoVote,
  onVote,
  ordinaryVoteClosed,
  ordinaryVoteGate,
  proposal,
  scoreLabel,
  setYesScore,
  submitError,
  submittingVetoKey,
  vetoWindowOpen,
  viewerIsProposer,
  viewerVoteLabel,
  yesScore,
}) => {
  return (
    <>
      {milestoneVoteIndex !== null ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="mx-auto px-4 py-2 text-xs font-semibold text-muted"
        >
          Milestone vote: M{milestoneVoteIndex}
        </Surface>
      ) : null}
      <ProposalOrdinaryVoteActions
        gate={ordinaryVoteGate}
        onVote={onVote}
        score={
          proposal.scoreEnabled && scoreLabel
            ? {
                label: scoreLabel,
                onChange: setYesScore,
                value: yesScore,
              }
            : null
        }
      />
      <CitizenVetoActions
        citizenVeto={proposal.citizenVeto}
        viewerIsProposer={viewerIsProposer}
        windowOpen={vetoWindowOpen}
        submittingKey={submittingVetoKey}
        onVote={onCitizenVetoVote}
      />
      {id ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="sm" variant="outline">
            <Link to={`/app/proposals/${id}/citizen-veto`}>
              Open Citizen Veto
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/app/proposals/${id}/chamber-veto`}>
              Open Chamber Veto
            </Link>
          </Button>
        </div>
      ) : null}
      <Surface
        variant="panelAlt"
        radius="2xl"
        shadow="tile"
        className="px-5 py-4 text-sm text-muted"
      >
        {ordinaryVoteClosed
          ? "The ordinary vote passed. Use the veto pages above during the 24h veto window. If a veto succeeds, the proposal returns to the proposer for reconsideration."
          : "Use the Citizen Veto page for Citizen votes and the Chamber Veto page for chamber-by-chamber veto activity before the chamber vote closes."}
      </Surface>
      {submitError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-destructive"
        >
          {formatLoadError(submitError)}
        </Surface>
      ) : null}
      {proposal.viewerVote && !viewerIsProposer ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          Your current vote:{" "}
          <span className="font-semibold text-text">{viewerVoteLabel}</span>
          <span className="block text-xs text-muted">
            Recorded {formatDateTime(proposal.viewerVote.updatedAt)}
          </span>
        </Surface>
      ) : null}
    </>
  );
};
