import { useMemo, useState } from "react";

import {
  CodexEvidenceHint,
  CodexOffenseHint,
  CodexSeverityHint,
} from "@/components/CodexHint";
import { GlassyTile } from "@/components/GlassySection";
import { Select } from "@/components/primitives/select";
import { apiCastCourtFindingVoteV2 } from "@/lib/apiClient";
import {
  courtFindingDefinition,
  courtInitialFinding,
  courtInitialSeverity,
  type CourtFindingBallot,
  type CourtSeverity,
} from "../model/courtBallot";
import {
  CourtAsyncButton,
  CourtDecisionSummary,
  CourtFormField,
} from "../forms/CourtFormUi";
import {
  courtOffenseDisplay,
  courtSeverityDisplay,
} from "../model/courtPresentation";
import type { CourtActionGroupProps } from "./actionTypes";

type FindingBallotActionProps = Pick<
  CourtActionGroupProps,
  "actionLocked" | "busy" | "caseId" | "run"
> & { ballot: CourtFindingBallot };

export function FindingBallotAction({
  actionLocked,
  ballot,
  busy,
  caseId,
  run,
}: FindingBallotActionProps) {
  const findingDefinition = useMemo(
    () => courtFindingDefinition(ballot.definition),
    [ballot.definition],
  );
  const [finding, setFinding] = useState<"dismissed" | "substantiated">(() =>
    courtInitialFinding(ballot.existingVote),
  );
  const [severity, setSeverity] = useState<CourtSeverity>(() =>
    courtInitialSeverity(
      ballot.existingVote,
      findingDefinition?.allowedSeverities,
    ),
  );

  return (
    <GlassyTile>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void run(
            "finding",
            (idempotencyKey) =>
              finding === "dismissed"
                ? apiCastCourtFindingVoteV2(
                    { caseId, ballotId: ballot.id, finding },
                    { idempotencyKey },
                  )
                : apiCastCourtFindingVoteV2(
                    { caseId, ballotId: ballot.id, finding, severity },
                    { idempotencyKey },
                  ),
            undefined,
            true,
          );
        }}
      >
        <h3 className="text-base font-semibold text-text">Finding ballot</h3>
        <CourtFormField htmlFor="court-finding" label="Finding">
          <Select
            id="court-finding"
            value={finding}
            onChange={(event) =>
              setFinding(event.target.value as typeof finding)
            }
          >
            <option value="dismissed">Dismissed</option>
            <option value="substantiated">Substantiated</option>
          </Select>
        </CourtFormField>
        {finding === "substantiated" ? (
          <CourtFormField htmlFor="court-severity" label="Severity">
            <Select
              id="court-severity"
              value={severity}
              onChange={(event) =>
                setSeverity(event.target.value as typeof severity)
              }
            >
              {(findingDefinition?.allowedSeverities ?? []).map((level) => (
                <option key={level} value={level}>
                  {courtSeverityDisplay(level).label}
                </option>
              ))}
            </Select>
          </CourtFormField>
        ) : null}
        <p className="text-sm leading-6 text-muted">
          {finding === "dismissed" ? (
            "Dismiss when the authorized record does not meet the frozen finding standard."
          ) : (
            <>
              <CodexSeverityHint code={severity}>
                {courtSeverityDisplay(severity).label}
              </CodexSeverityHint>
              {`: ${courtSeverityDisplay(severity).description} Evidence standard: `}
              {findingDefinition?.evidenceStandards[severity] ? (
                <CodexEvidenceHint
                  code={findingDefinition.evidenceStandards[severity]}
                >
                  {findingDefinition.evidenceStandards[severity]}
                </CodexEvidenceHint>
              ) : (
                "Unavailable"
              )}
              .
            </>
          )}
        </p>
        <CourtDecisionSummary
          items={[
            {
              label: "Finding",
              value: finding === "dismissed" ? "Dismissed" : "Substantiated",
            },
            {
              label: "Severity",
              value:
                finding === "substantiated" ? (
                  <CodexSeverityHint code={severity}>
                    {courtSeverityDisplay(severity).label}
                  </CodexSeverityHint>
                ) : (
                  "Not applicable"
                ),
            },
            {
              label: "Alleged offense",
              value: findingDefinition?.offenseCode ? (
                <CodexOffenseHint code={findingDefinition.offenseCode}>
                  {courtOffenseDisplay(findingDefinition.offenseCode).label}
                </CodexOffenseHint>
              ) : (
                "Definition unavailable"
              ),
            },
            {
              label: "Evidence standard",
              value:
                finding === "substantiated" &&
                findingDefinition?.evidenceStandards[severity] ? (
                  <CodexEvidenceHint
                    code={findingDefinition.evidenceStandards[severity]}
                  >
                    {findingDefinition.evidenceStandards[severity]}
                  </CodexEvidenceHint>
                ) : finding === "substantiated" ? (
                  "Unavailable"
                ) : (
                  "Not applicable"
                ),
            },
          ]}
          replacement={
            ballot.existingVote
              ? `This replaces recorded vote revision ${ballot.existingVote.revision}.`
              : null
          }
        />
        <CourtAsyncButton
          busy={busy === `${caseId}:finding`}
          busyLabel="Casting finding vote..."
          disabled={actionLocked("finding") || findingDefinition === null}
        >
          Cast finding vote
        </CourtAsyncButton>
      </form>
    </GlassyTile>
  );
}
