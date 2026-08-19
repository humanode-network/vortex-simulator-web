import type { CourtCaseViewerV2Dto } from "@/types/api";
import type {
  CourtFindingBallot,
  CourtRemedyBallot,
} from "../model/courtBallot";
import type { CourtActionGroupProps } from "./actionTypes";
import { FindingBallotAction } from "./FindingBallotAction";
import { RemedyBallotAction } from "./RemedyBallotAction";

export function VerdictActions({
  actionLocked,
  busy,
  can,
  caseId,
  courtCase,
  run,
}: CourtActionGroupProps & { courtCase: CourtCaseViewerV2Dto }) {
  const ballot = courtCase.juryTask?.ballot ?? null;
  if (!ballot) return null;

  const actionProps = { actionLocked, busy, caseId, run };
  const revisionKey = `${ballot.id}:${ballot.existingVote?.revision ?? 0}`;

  if (can("vote_finding") && ballot.type === "finding") {
    return (
      <FindingBallotAction
        key={revisionKey}
        {...actionProps}
        ballot={ballot as CourtFindingBallot}
      />
    );
  }

  if (can("vote_sentence") && ballot.type === "remedy") {
    return (
      <RemedyBallotAction
        key={revisionKey}
        {...actionProps}
        ballot={ballot as CourtRemedyBallot}
      />
    );
  }

  return null;
}
