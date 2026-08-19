import { useState, type FormEvent } from "react";

import { GlassyTile } from "@/components/GlassySection";
import { ProposalNarrativeEditor } from "@/components/ProposalNarrative";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import {
  apiAddCourtEvidenceV2,
  apiChallengeCourtEvidenceV2,
  apiSubmitCourtResponseV2,
} from "@/lib/apiClient";
import type { CourtCaseViewerV2Dto } from "@/types/api";
import { CourtCopyValue, courtLabel } from "../components/CourtPrimitives";
import {
  CourtAsyncButton,
  CourtEvidenceComposer,
  CourtFormField,
  CourtNarrativeRequirement,
} from "../forms/CourtFormUi";
import { compactCourtAuditValue } from "../model/courtPresentation";
import { useCourtEvidenceDraft } from "../hooks/useCourtEvidenceDraft";
import {
  COURT_REASON_MAX_LENGTH,
  COURT_REASON_MIN_LENGTH,
  COURT_STATEMENT_MAX_LENGTH,
  COURT_STATEMENT_MIN_LENGTH,
} from "../model/courtConstraints";
import type { CourtActionGroupProps } from "./actionTypes";

export function PartyCaseActions({
  actionLocked,
  busy,
  can,
  caseId,
  courtCase,
  run,
}: CourtActionGroupProps & { courtCase: CourtCaseViewerV2Dto }) {
  const [response, setResponse] = useState("");
  const [evidenceStatement, setEvidenceStatement] = useState("");
  const {
    change: changeEvidenceDraft,
    draft: evidenceDraft,
    error: evidenceError,
    isEmpty: evidenceDraftIsEmpty,
    reset: resetEvidenceDraft,
    validate: validateEvidenceDraft,
  } = useCourtEvidenceDraft("court-case-evidence");
  const [challengedEvidenceId, setChallengedEvidenceId] = useState("");
  const [challengeReason, setChallengeReason] = useState("");
  const challengedEvidence = courtCase.evidence.find(
    (item) => item.id === challengedEvidenceId,
  );

  async function submitResponse(event: FormEvent) {
    event.preventDefault();
    await run(
      "response",
      (idempotencyKey) =>
        apiSubmitCourtResponseV2(
          {
            caseId,
            statement: response.trim(),
            access: "parties_and_jury",
          },
          { idempotencyKey },
        ),
      () => setResponse(""),
      true,
    );
  }

  async function submitEvidence(event: FormEvent) {
    event.preventDefault();
    const evidenceInput = validateEvidenceDraft("party_supplied");
    if (!evidenceInput.ok) return;
    await run(
      "evidence",
      (idempotencyKey) =>
        apiAddCourtEvidenceV2(
          {
            caseId,
            statement: evidenceStatement.trim() || null,
            statementAccess: "parties_and_jury",
            evidence: evidenceInput.value ? [evidenceInput.value] : [],
          },
          { idempotencyKey },
        ),
      () => {
        setEvidenceStatement("");
        resetEvidenceDraft();
      },
      true,
    );
  }

  return (
    <>
      {can("submit_response") ? (
        <GlassyTile>
          <form className="space-y-4" onSubmit={submitResponse}>
            <h3 className="text-base font-semibold text-text">
              Respond to the case
            </h3>
            <ProposalNarrativeEditor
              documentLabel="Court response"
              id="court-party-response"
              value={response}
              onChange={setResponse}
              placeholder="State your response, relevant facts, and any disputed claims."
              rows={8}
            />
            <CourtNarrativeRequirement
              current={response.trim().length}
              minimum={COURT_STATEMENT_MIN_LENGTH}
              maximum={COURT_STATEMENT_MAX_LENGTH}
            />
            <CourtAsyncButton
              busy={busy === `${caseId}:response`}
              busyLabel="Submitting response..."
              disabled={
                actionLocked("response") ||
                response.trim().length < COURT_STATEMENT_MIN_LENGTH ||
                response.trim().length > COURT_STATEMENT_MAX_LENGTH
              }
            >
              Submit response
            </CourtAsyncButton>
          </form>
        </GlassyTile>
      ) : null}

      {can("submit_evidence") ? (
        <GlassyTile>
          <form className="space-y-4" onSubmit={submitEvidence}>
            <h3 className="text-base font-semibold text-text">Add evidence</h3>
            <ProposalNarrativeEditor
              documentLabel="Evidence statement"
              id="court-evidence-statement"
              value={evidenceStatement}
              onChange={setEvidenceStatement}
              placeholder="Explain what this evidence establishes and where it came from."
              rows={6}
            />
            <CourtEvidenceComposer
              draft={evidenceDraft}
              error={evidenceError}
              idPrefix="court-case-evidence"
              onChange={changeEvidenceDraft}
            />
            {evidenceStatement.trim() ? (
              <CourtNarrativeRequirement
                current={evidenceStatement.trim().length}
                minimum={COURT_STATEMENT_MIN_LENGTH}
                maximum={COURT_STATEMENT_MAX_LENGTH}
              />
            ) : null}
            <CourtAsyncButton
              busy={busy === `${caseId}:evidence`}
              busyLabel="Adding evidence..."
              disabled={
                actionLocked("evidence") ||
                (!evidenceStatement.trim() && evidenceDraftIsEmpty) ||
                (Boolean(evidenceStatement.trim()) &&
                  (evidenceStatement.trim().length <
                    COURT_STATEMENT_MIN_LENGTH ||
                    evidenceStatement.trim().length >
                      COURT_STATEMENT_MAX_LENGTH)) ||
                evidenceError !== null
              }
            >
              Add evidence
            </CourtAsyncButton>
          </form>
        </GlassyTile>
      ) : null}

      {can("challenge_evidence") && courtCase.evidence.length > 0 ? (
        <GlassyTile>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                "challenge",
                (idempotencyKey) =>
                  apiChallengeCourtEvidenceV2(
                    {
                      caseId,
                      evidenceId: challengedEvidenceId,
                      reason: challengeReason.trim(),
                    },
                    { idempotencyKey },
                  ),
                () => {
                  setChallengedEvidenceId("");
                  setChallengeReason("");
                },
                true,
              );
            }}
          >
            <h3 className="text-base font-semibold text-text">
              Challenge evidence
            </h3>
            <CourtFormField
              htmlFor="court-challenge-evidence"
              label="Evidence record"
            >
              <Select
                id="court-challenge-evidence"
                value={challengedEvidenceId}
                onChange={(event) =>
                  setChallengedEvidenceId(event.target.value)
                }
                required
              >
                <option value="">Choose evidence</option>
                {courtCase.evidence.map((item) => (
                  <option key={item.id} value={item.id}>
                    {courtLabel(item.kind)} ·{" "}
                    {compactCourtAuditValue(item.digest, 24)}
                  </option>
                ))}
              </Select>
            </CourtFormField>
            {challengedEvidence ? (
              <p className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted">
                Selected digest
                <CourtCopyValue
                  label="selected evidence digest"
                  value={challengedEvidence.digest}
                />
              </p>
            ) : null}
            <CourtFormField htmlFor="court-challenge-reason" label="Reason">
              <Input
                id="court-challenge-reason"
                value={challengeReason}
                onChange={(event) => setChallengeReason(event.target.value)}
                minLength={COURT_REASON_MIN_LENGTH}
                maxLength={COURT_REASON_MAX_LENGTH}
              />
            </CourtFormField>
            <CourtNarrativeRequirement
              current={challengeReason.trim().length}
              minimum={COURT_REASON_MIN_LENGTH}
              maximum={COURT_REASON_MAX_LENGTH}
            />
            <CourtAsyncButton
              busy={busy === `${caseId}:challenge`}
              busyLabel="Submitting challenge..."
              disabled={
                actionLocked("challenge") ||
                !challengedEvidenceId ||
                challengeReason.trim().length < COURT_REASON_MIN_LENGTH ||
                challengeReason.trim().length > COURT_REASON_MAX_LENGTH
              }
            >
              Submit challenge
            </CourtAsyncButton>
          </form>
        </GlassyTile>
      ) : null}
    </>
  );
}
