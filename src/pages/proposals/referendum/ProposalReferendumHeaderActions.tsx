import { Link } from "react-router";
import { Button } from "@/components/primitives/button";
import { Surface } from "@/components/Surface";
import { formatLoadError } from "@/lib/errorFormatting";
import type { getProposalOrdinaryVoteGate } from "@/lib/proposalUi";
import type { ChamberProposalPageDto } from "@/types/api";
import { CitizenVetoActions } from "../veto/CitizenVetoActions";
import { ProposalOrdinaryVoteActions } from "../shared/ProposalOrdinaryVoteActions";

type OrdinaryVoteChoice = "yes" | "no" | "abstain";

type ProposalReferendumHeaderActionsProps = {
  id: string | undefined;
  onCitizenVetoVote: () => void;
  onVote: (choice: OrdinaryVoteChoice) => void;
  ordinaryVoteGate: ReturnType<typeof getProposalOrdinaryVoteGate>;
  proposal: ChamberProposalPageDto;
  submitError: string | null;
  submitting: boolean;
  vetoWindowOpen: boolean;
  viewerIsProposer: boolean;
};

export const ProposalReferendumHeaderActions: React.FC<
  ProposalReferendumHeaderActionsProps
> = ({
  id,
  onCitizenVetoVote,
  onVote,
  ordinaryVoteGate,
  proposal,
  submitError,
  submitting,
  vetoWindowOpen,
  viewerIsProposer,
}) => {
  return (
    <>
      <Surface
        variant="panelAlt"
        radius="2xl"
        shadow="tile"
        className="mx-auto px-4 py-2 text-xs font-semibold text-muted"
      >
        All active human nodes can vote
      </Surface>
      <ProposalOrdinaryVoteActions gate={ordinaryVoteGate} onVote={onVote} />
      <CitizenVetoActions
        citizenVeto={proposal.citizenVeto}
        viewerIsProposer={viewerIsProposer}
        windowOpen={vetoWindowOpen}
        submittingKey={submitting ? "citizen" : null}
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
        Use the Citizen Veto tab to inspect or cast Citizen Veto votes, and the
        Chamber Veto tab to inspect chamber-veto activity.
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
    </>
  );
};
