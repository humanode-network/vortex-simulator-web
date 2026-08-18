import { useState } from "react";

import { GlassyTile } from "@/components/GlassySection";
import { ProposalNarrativeEditor } from "@/components/ProposalNarrative";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import {
  apiCastCourtReopeningVoteV2,
  apiFileCourtReopeningV2,
} from "@/lib/apiClient";
import type { CourtCaseViewerV2Dto } from "@/types/api";
import {
  CourtAsyncButton,
  CourtDecisionSummary,
  CourtFormField,
  CourtNarrativeRequirement,
} from "../forms/CourtFormUi";
import {
  COURT_STATEMENT_MAX_LENGTH,
  COURT_STATEMENT_MIN_LENGTH,
} from "../model/courtConstraints";
import type { CourtActionGroupProps } from "./actionTypes";

export function ReopeningActions({
  actionLocked,
  busy,
  can,
  caseId,
  courtCase,
  run,
}: CourtActionGroupProps & { courtCase: CourtCaseViewerV2Dto }) {
  const [evidenceReference, setEvidenceReference] = useState("");
  const [statement, setStatement] = useState("");
  const [reopenVote, setReopenVote] = useState(true);
  const [reasoning, setReasoning] = useState("");

  return (
    <>
      {can("file_reopening") ? (
        <GlassyTile>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run("reopening", (idempotencyKey) =>
                apiFileCourtReopeningV2(
                  {
                    caseId,
                    evidenceReference: evidenceReference.trim(),
                    statement: statement.trim(),
                  },
                  { idempotencyKey },
                ),
              );
            }}
          >
            <h3 className="text-base font-semibold text-text">
              Request reopening
            </h3>
            <p className="text-sm leading-6 text-muted">
              Reopening requires verified evidence that was genuinely
              unavailable and could change the result. Exonerating identity or
              cryptographic proof has no time limit.
            </p>
            <CourtFormField
              htmlFor="court-reopening-evidence"
              label="Evidence reference"
            >
              <Input
                id="court-reopening-evidence"
                value={evidenceReference}
                onChange={(event) => setEvidenceReference(event.target.value)}
                placeholder="ipfs://, protocol proof, or immutable archive"
              />
            </CourtFormField>
            <ProposalNarrativeEditor
              documentLabel="Reopening request"
              id="court-reopening-statement"
              value={statement}
              onChange={setStatement}
              placeholder="Explain why the evidence was unavailable and how it could alter the result."
              rows={8}
            />
            <CourtNarrativeRequirement
              current={statement.trim().length}
              minimum={COURT_STATEMENT_MIN_LENGTH}
              maximum={COURT_STATEMENT_MAX_LENGTH}
            />
            <CourtDecisionSummary
              items={[
                {
                  label: "Evidence reference",
                  value: evidenceReference.trim() || "Not set",
                },
                {
                  label: "Requested outcome",
                  value: "Open a new trial review",
                },
              ]}
            />
            <CourtAsyncButton
              busy={busy === `${caseId}:reopening`}
              busyLabel="Requesting review..."
              disabled={
                actionLocked("reopening") ||
                !evidenceReference.trim() ||
                statement.trim().length < COURT_STATEMENT_MIN_LENGTH ||
                statement.trim().length > COURT_STATEMENT_MAX_LENGTH
              }
            >
              Request reopening review
            </CourtAsyncButton>
          </form>
        </GlassyTile>
      ) : null}

      {can("vote_reopening") ? (
        <GlassyTile>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                "reopening-vote",
                (idempotencyKey) =>
                  apiCastCourtReopeningVoteV2(
                    {
                      panelId: courtCase.appellateTask!.panelId,
                      reopen: reopenVote,
                      reasoning: reasoning.trim(),
                    },
                    { idempotencyKey },
                  ),
                undefined,
                true,
              );
            }}
          >
            <h3 className="text-base font-semibold text-text">
              Reopening decision
            </h3>
            <CourtFormField htmlFor="court-reopening-outcome" label="Outcome">
              <Select
                id="court-reopening-outcome"
                value={reopenVote ? "reopen" : "deny"}
                onChange={(event) =>
                  setReopenVote(event.target.value === "reopen")
                }
              >
                <option value="reopen">Open a new trial</option>
                <option value="deny">Keep the final decision</option>
              </Select>
            </CourtFormField>
            <ProposalNarrativeEditor
              documentLabel="Reopening decision"
              id="court-reopening-reasoning"
              value={reasoning}
              onChange={setReasoning}
              placeholder="Explain whether the verified evidence meets the reopening standard."
              rows={7}
            />
            <CourtNarrativeRequirement
              current={reasoning.trim().length}
              minimum={COURT_STATEMENT_MIN_LENGTH}
              maximum={COURT_STATEMENT_MAX_LENGTH}
            />
            <CourtDecisionSummary
              items={[
                {
                  label: "Outcome",
                  value: reopenVote
                    ? "Open a new trial"
                    : "Keep the final decision",
                },
                { label: "Panel", value: "Reopening panel" },
              ]}
            />
            <CourtAsyncButton
              busy={busy === `${caseId}:reopening-vote`}
              busyLabel="Casting reopening vote..."
              disabled={
                actionLocked("reopening-vote") ||
                reasoning.trim().length < COURT_STATEMENT_MIN_LENGTH ||
                reasoning.trim().length > COURT_STATEMENT_MAX_LENGTH
              }
            >
              Cast reopening vote
            </CourtAsyncButton>
          </form>
        </GlassyTile>
      ) : null}
    </>
  );
}
