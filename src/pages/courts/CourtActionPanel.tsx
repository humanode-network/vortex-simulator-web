import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";

import { GlassySection, GlassyTile } from "@/components/GlassySection";
import {
  CodexEvidenceHint,
  CodexHint,
  CodexMeasureHint,
  CodexOffenseHint,
  CodexPolicyHint,
  CodexSeverityHint,
} from "@/components/CodexHint";
import { ProposalNarrativeEditor } from "@/components/ProposalNarrative";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import {
  apiAddCourtEvidenceV2,
  apiCastCourtAppellateVoteV2,
  apiCastCourtFindingVoteV2,
  apiCastCourtReopeningVoteV2,
  apiCastCourtRemedyVoteV2,
  apiChallengeCourtEvidenceV2,
  apiFileCourtAppealV2,
  apiFileCourtReopeningV2,
  apiProposeCourtAppellateModificationV2,
  apiRecuseFromCourtJuryV2,
  apiRespondToCourtJuryV2,
  apiRespondToCourtAppellateJuryV2,
  apiRespondToCourtReopeningJuryV2,
  apiSubmitCourtResponseV2,
} from "@/lib/apiClient";
import type { CourtCaseViewerV2Dto } from "@/types/api";
import {
  courtInitialAppellateResult,
  courtFindingDefinition,
  courtInitialFinding,
  courtInitialRemedyChoice,
  courtInitialRemedyChoices,
  courtInitialSentenceAuthorization,
  courtInitialSeverity,
  courtRemedyEnvelope,
  courtRemedySelectionIssues,
  courtSelectedRemedyBurden,
  type CourtRemedyChoice,
  type CourtRemedySelectionIssue,
  type CourtSeverity,
} from "./courtBallotModel";
import {
  CourtActionFeedback,
  CourtAsyncButton,
  CourtDecisionSummary,
  CourtEvidenceDraftFields,
  CourtEvidenceSafetyNote,
  CourtFormField,
  CourtNarrativeRequirement,
} from "./courtFormUi";
import { CourtCopyValue, courtLabel } from "./courtUi";
import {
  COURT_APPEAL_GROUNDS,
  compactCourtAuditValue,
  courtAppealGroundDisplay,
  courtCaseDeadline,
  courtOffenseDisplay,
  courtRemedyLabel,
  courtSeverityDisplay,
} from "./courtPresentation";
import { useCourtCommandRunner } from "./useCourtCommandRunner";
import {
  courtEvidenceDraftIsEmpty,
  courtEvidenceDraftToInput,
  emptyCourtEvidenceDraft,
  type CourtEvidenceDraftError,
} from "./courtEvidenceForm";

type ActionCapability =
  | "accept_jury_seat"
  | "challenge_evidence"
  | "file_appeal"
  | "file_reopening"
  | "propose_appellate_modification"
  | "recuse_jury_seat"
  | "submit_evidence"
  | "submit_response"
  | "respond_appellate_invitation"
  | "respond_reopening_invitation"
  | "vote_appeal"
  | "vote_finding"
  | "vote_sentence"
  | "vote_reopening";

const COURT_ACTION_FIELD_TARGETS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = Object.freeze({
  appeal: {
    groundCode: "court-appeal-ground",
    grounds: "court-appeal-grounds",
  },
  "appellate-vote": {
    modificationPackageId: "court-modification-package",
    reasoning: "court-appellate-reasoning",
    result: "court-appellate-outcome",
  },
  challenge: {
    evidenceId: "court-challenge-evidence",
    reason: "court-challenge-reason",
  },
  evidence: {
    digest: "court-case-evidence-digest",
    evidence: "court-evidence-statement",
    proofType: "court-case-evidence-proof-type",
    reference: "court-case-evidence-url",
    statement: "court-evidence-statement",
    targetId: "court-case-evidence-target-id",
    url: "court-case-evidence-url",
    verifierId: "court-case-evidence-verifier-id",
    verifierVersion: "court-case-evidence-verifier-version",
  },
  finding: {
    finding: "court-finding",
    severity: "court-severity",
  },
  recusal: { reason: "court-recusal-reason" },
  remedy: {
    components: "court-remedy-authorize",
    value: "court-remedy-authorize",
  },
  reopening: {
    evidenceReference: "court-reopening-evidence",
    statement: "court-reopening-statement",
  },
  "reopening-vote": {
    reasoning: "court-reopening-reasoning",
    reopen: "court-reopening-outcome",
  },
  response: {
    access: "court-party-response",
    statement: "court-party-response",
  },
});

function remedyReferences(codes: readonly string[]): ReactNode {
  return codes.map((code, index) => (
    <span key={code}>
      {index ? ", " : null}
      <CodexMeasureHint code={code}>{courtRemedyLabel(code)}</CodexMeasureHint>
    </span>
  ));
}

function remedyIssueDescription(issue: CourtRemedySelectionIssue): ReactNode {
  if (issue.code === "missing_mandatory") {
    return <>Required: {remedyReferences(issue.components)}.</>;
  }
  if (issue.code === "missing_required_group") {
    return <>Choose at least one: {remedyReferences(issue.components)}.</>;
  }
  if (issue.code === "incompatible_pair") {
    return (
      <>
        {remedyReferences(issue.components.slice(0, 1))} cannot be combined with{" "}
        {remedyReferences(issue.components.slice(1, 2))}.
      </>
    );
  }
  if (issue.code === "component_limit") {
    return `${issue.domain ? `${courtLabel(issue.domain)} ` : ""}punitive components: ${issue.actual} selected; maximum ${issue.maximum}.`;
  }
  return `Burden: ${issue.actual} weighted eras; maximum ${issue.maximum}.`;
}

function CourtCodexCheckbox({
  checked,
  disabled,
  label,
  onChange,
  prefix,
  reference,
  suffix,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  prefix?: string;
  reference: string;
  suffix?: string;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text">
      <label className="flex min-w-0 items-center gap-2 font-medium">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>
          {prefix}
          {label}
          {suffix}
        </span>
      </label>
      <CodexHint reference={reference} underline={false}>
        <span className="text-xs text-primary">Codex definition</span>
      </CodexHint>
    </div>
  );
}

export function CourtActionPanel({
  courtCase,
  onCompleted,
}: {
  courtCase: CourtCaseViewerV2Dto;
  onCompleted: () => Promise<void>;
}) {
  const caseId = courtCase.publicCase?.id ?? "";
  const ballot = courtCase.juryTask?.ballot ?? null;
  const remedyEnvelope = useMemo(
    () =>
      ballot?.type === "remedy" ? courtRemedyEnvelope(ballot.definition) : null,
    [ballot],
  );
  const components = useMemo(
    () => remedyEnvelope?.components ?? [],
    [remedyEnvelope],
  );
  const existingVote = ballot?.existingVote ?? null;
  const findingDefinition = useMemo(
    () =>
      ballot?.type === "finding"
        ? courtFindingDefinition(ballot.definition)
        : null,
    [ballot],
  );
  const [response, setResponse] = useState("");
  const [evidenceStatement, setEvidenceStatement] = useState("");
  const [evidenceDraft, setEvidenceDraft] = useState(emptyCourtEvidenceDraft);
  const [evidenceError, setEvidenceError] =
    useState<CourtEvidenceDraftError | null>(null);
  const [challengedEvidenceId, setChallengedEvidenceId] = useState("");
  const [challengeReason, setChallengeReason] = useState("");
  const challengedEvidence = courtCase.evidence.find(
    (item) => item.id === challengedEvidenceId,
  );
  const [recusalReason, setRecusalReason] = useState("");
  const [finding, setFinding] = useState<"dismissed" | "substantiated">(() =>
    courtInitialFinding(existingVote),
  );
  const [severity, setSeverity] = useState<CourtSeverity>(() =>
    courtInitialSeverity(existingVote, findingDefinition?.allowedSeverities),
  );
  const [authorizeSentence, setAuthorizeSentence] = useState(() =>
    courtInitialSentenceAuthorization(existingVote),
  );
  const [choices, setChoices] = useState<Record<string, CourtRemedyChoice>>(
    () => courtInitialRemedyChoices(components, existingVote),
  );
  const remedySelectionIssues = useMemo(
    () =>
      remedyEnvelope ? courtRemedySelectionIssues(remedyEnvelope, choices) : [],
    [choices, remedyEnvelope],
  );
  const selectedRemedyBurden = useMemo(
    () => courtSelectedRemedyBurden(components, choices),
    [choices, components],
  );
  const [appealGround, setAppealGround] = useState<
    (typeof COURT_APPEAL_GROUNDS)[number]
  >(COURT_APPEAL_GROUNDS[0]);
  const [appeal, setAppeal] = useState("");
  const [requestStay, setRequestStay] = useState(true);
  const [appellateResult, setAppellateResult] = useState<
    "affirmed" | "reversed" | "remanded" | "modified"
  >(() => courtInitialAppellateResult(courtCase.appellateTask));
  const [appellateReasoning, setAppellateReasoning] = useState("");
  const [modificationPackageId, setModificationPackageId] = useState(
    courtCase.appellateTask?.existingVote?.modificationPackageId ?? "",
  );
  const [retainedRemedyIds, setRetainedRemedyIds] = useState<Set<string>>(
    () =>
      new Set(
        courtCase.appellateTask?.remedies.map((remedy) => remedy.id) ?? [],
      ),
  );
  const [reopeningEvidenceReference, setReopeningEvidenceReference] =
    useState("");
  const [reopeningStatement, setReopeningStatement] = useState("");
  const [reopenVote, setReopenVote] = useState(true);
  const [reopeningReasoning, setReopeningReasoning] = useState("");
  const runner = useCourtCommandRunner(onCompleted);
  const busy = runner.busy;
  const actionLocked = (name: string) =>
    busy !== null || runner.isConfirmed(`${caseId}:${name}`);
  const juryInvitationLocked =
    busy !== null ||
    (["accept", "decline", "conflict"] as const).some((response) =>
      runner.isConfirmed(`${caseId}:jury-invitation-${response}`),
    );
  const appellateInvitationLocked =
    busy !== null ||
    (["accept", "decline", "conflict"] as const).some((response) =>
      runner.isConfirmed(`${caseId}:appellate-invitation-${response}`),
    );
  const deadline = courtCaseDeadline(courtCase);

  const can = (capability: ActionCapability) =>
    courtCase.capabilities[capability] === true;
  const hasActions =
    can("submit_response") ||
    can("submit_evidence") ||
    can("challenge_evidence") ||
    can("accept_jury_seat") ||
    can("recuse_jury_seat") ||
    can("vote_finding") ||
    can("vote_sentence") ||
    can("file_appeal") ||
    can("respond_appellate_invitation") ||
    can("propose_appellate_modification") ||
    can("vote_appeal") ||
    can("file_reopening") ||
    can("respond_reopening_invitation") ||
    can("vote_reopening");
  if (!caseId || !hasActions) return null;

  async function run(
    name: string,
    action: (idempotencyKey: string) => Promise<unknown>,
    onConfirmed?: () => void,
    unlockAfterRefresh = false,
  ) {
    await runner.run({
      id: `${caseId}:${name}`,
      label: courtLabel(name),
      action,
      fieldTargets: COURT_ACTION_FIELD_TARGETS[name],
      onConfirmed,
      unlockAfterRefresh,
    });
  }

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
    const evidenceInput = courtEvidenceDraftIsEmpty(evidenceDraft)
      ? null
      : courtEvidenceDraftToInput(evidenceDraft, "party_supplied");
    if (evidenceInput && !evidenceInput.ok) {
      setEvidenceError(evidenceInput.error);
      return;
    }
    await run(
      "evidence",
      (idempotencyKey) =>
        apiAddCourtEvidenceV2(
          {
            caseId,
            statement: evidenceStatement.trim() || null,
            statementAccess: "parties_and_jury",
            evidence: evidenceInput?.value ? [evidenceInput.value] : [],
          },
          { idempotencyKey },
        ),
      () => {
        setEvidenceStatement("");
        setEvidenceDraft(emptyCourtEvidenceDraft());
        setEvidenceError(null);
      },
      true,
    );
  }

  return (
    <GlassySection title="Your Court actions">
      <div className="mb-4 space-y-2" aria-live="polite">
        <p className="text-sm leading-6 text-muted">
          Only actions currently authorized for you are shown.
          {deadline
            ? ` ${deadline.label}: ${new Date(deadline.dueAt).toLocaleString()}.`
            : ""}
        </p>
        <CourtActionFeedback
          actionError={runner.actionError}
          actionField={runner.actionField}
          notice={runner.notice}
          refreshError={runner.refreshError}
          onRetryRefresh={() => void runner.refresh()}
        />
      </div>
      <div className="grid gap-4">
        {can("accept_jury_seat") ? (
          <GlassyTile className="space-y-4">
            <h3 className="text-base font-semibold text-text">
              Jury invitation
            </h3>
            <p className="text-sm leading-6 text-muted">
              Accept only if you can decide independently. Disclose any conflict
              instead of taking the seat.
            </p>
            <div className="flex flex-wrap gap-2">
              <CourtAsyncButton
                busy={busy === `${caseId}:jury-invitation-accept`}
                busyLabel="Accepting duty..."
                disabled={juryInvitationLocked}
                onClick={() =>
                  void run("jury-invitation-accept", (idempotencyKey) =>
                    apiRespondToCourtJuryV2(
                      {
                        caseId,
                        response: "accept",
                        conflict: "clear",
                      },
                      { idempotencyKey },
                    ),
                  )
                }
              >
                Accept duty
              </CourtAsyncButton>
              <CourtAsyncButton
                busy={busy === `${caseId}:jury-invitation-decline`}
                busyLabel="Declining duty..."
                disabled={juryInvitationLocked}
                variant="outline"
                onClick={() =>
                  void run("jury-invitation-decline", (idempotencyKey) =>
                    apiRespondToCourtJuryV2(
                      {
                        caseId,
                        response: "decline",
                        conflict: "clear",
                      },
                      { idempotencyKey },
                    ),
                  )
                }
              >
                Decline duty
              </CourtAsyncButton>
              <CourtAsyncButton
                busy={busy === `${caseId}:jury-invitation-conflict`}
                busyLabel="Recording conflict..."
                disabled={juryInvitationLocked}
                variant="outline"
                onClick={() =>
                  void run("jury-invitation-conflict", (idempotencyKey) =>
                    apiRespondToCourtJuryV2(
                      {
                        caseId,
                        response: "decline",
                        conflict: "self_disclosed",
                      },
                      { idempotencyKey },
                    ),
                  )
                }
              >
                Disclose conflict
              </CourtAsyncButton>
            </div>
          </GlassyTile>
        ) : null}

        {can("recuse_jury_seat") ? (
          <GlassyTile>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run("recusal", (idempotencyKey) =>
                  apiRecuseFromCourtJuryV2(
                    {
                      caseId,
                      reason: recusalReason.trim(),
                    },
                    { idempotencyKey },
                  ),
                );
              }}
            >
              <h3 className="text-base font-semibold text-text">
                Disclose a conflict
              </h3>
              <p className="text-sm leading-6 text-muted">
                Recusal vacates your accepted seat and invites the next recorded
                alternate.
              </p>
              <CourtFormField
                htmlFor="court-recusal-reason"
                label="Conflict or inability to serve"
              >
                <Input
                  id="court-recusal-reason"
                  value={recusalReason}
                  onChange={(event) => setRecusalReason(event.target.value)}
                  minLength={10}
                  maxLength={5_000}
                />
              </CourtFormField>
              <CourtNarrativeRequirement
                current={recusalReason.trim().length}
                minimum={10}
                maximum={5_000}
              />
              <CourtAsyncButton
                busy={busy === `${caseId}:recusal`}
                busyLabel="Recording recusal..."
                disabled={
                  actionLocked("recusal") || recusalReason.trim().length < 10
                }
                variant="outline"
              >
                Recuse from this jury
              </CourtAsyncButton>
            </form>
          </GlassyTile>
        ) : null}

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
                minimum={20}
              />
              <CourtAsyncButton
                busy={busy === `${caseId}:response`}
                busyLabel="Submitting response..."
                disabled={
                  actionLocked("response") || response.trim().length < 20
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
              <h3 className="text-base font-semibold text-text">
                Add evidence
              </h3>
              <ProposalNarrativeEditor
                documentLabel="Evidence statement"
                id="court-evidence-statement"
                value={evidenceStatement}
                onChange={setEvidenceStatement}
                placeholder="Explain what this evidence establishes and where it came from."
                rows={6}
              />
              <CourtEvidenceDraftFields
                draft={evidenceDraft}
                error={evidenceError}
                idPrefix="court-case-evidence"
                onChange={(next) => {
                  setEvidenceDraft(next);
                  setEvidenceError(null);
                }}
              />
              {evidenceStatement.trim() ? (
                <CourtNarrativeRequirement
                  current={evidenceStatement.trim().length}
                  minimum={20}
                  maximum={20_000}
                />
              ) : null}
              <CourtEvidenceSafetyNote />
              <CourtAsyncButton
                busy={busy === `${caseId}:evidence`}
                busyLabel="Adding evidence..."
                disabled={
                  actionLocked("evidence") ||
                  (!evidenceStatement.trim() &&
                    courtEvidenceDraftIsEmpty(evidenceDraft)) ||
                  (Boolean(evidenceStatement.trim()) &&
                    evidenceStatement.trim().length < 20) ||
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
                  minLength={10}
                  maxLength={5_000}
                />
              </CourtFormField>
              <CourtNarrativeRequirement
                current={challengeReason.trim().length}
                minimum={10}
                maximum={5_000}
              />
              <CourtAsyncButton
                busy={busy === `${caseId}:challenge`}
                busyLabel="Submitting challenge..."
                disabled={
                  actionLocked("challenge") ||
                  !challengedEvidenceId ||
                  challengeReason.trim().length < 10
                }
              >
                Submit challenge
              </CourtAsyncButton>
            </form>
          </GlassyTile>
        ) : null}

        {can("vote_finding") && ballot?.type === "finding" ? (
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
              <h3 className="text-base font-semibold text-text">
                Finding ballot
              </h3>
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
                    {(findingDefinition?.allowedSeverities ?? []).map(
                      (level) => (
                        <option key={level} value={level}>
                          {courtSeverityDisplay(level).label}
                        </option>
                      ),
                    )}
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
                    value:
                      finding === "dismissed" ? "Dismissed" : "Substantiated",
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
                        {
                          courtOffenseDisplay(findingDefinition.offenseCode)
                            .label
                        }
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
        ) : null}

        {can("vote_sentence") && ballot?.type === "remedy" ? (
          <GlassyTile>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run(
                  "remedy",
                  (idempotencyKey) =>
                    apiCastCourtRemedyVoteV2(
                      {
                        caseId,
                        ballotId: ballot.id,
                        authorizeSentence,
                        components: components.map((component) => ({
                          componentId: component.id,
                          include:
                            choices[component.id]?.include ??
                            component.mode === "mandatory",
                          ...(choices[component.id]?.conditionalValue !==
                          undefined
                            ? {
                                conditionalValue:
                                  choices[component.id].conditionalValue,
                              }
                            : {}),
                        })),
                      },
                      { idempotencyKey },
                    ),
                  undefined,
                  true,
                );
              }}
            >
              <h3 className="text-base font-semibold text-text">
                Remedy ballot
              </h3>
              {remedyEnvelope ? (
                <CourtDecisionSummary
                  title="Frozen sentence envelope"
                  items={[
                    {
                      label: "Offense and severity",
                      value: (
                        <>
                          <CodexOffenseHint code={remedyEnvelope.offenseCode}>
                            {
                              courtOffenseDisplay(remedyEnvelope.offenseCode)
                                .label
                            }
                          </CodexOffenseHint>
                          {" · "}
                          <CodexSeverityHint code={remedyEnvelope.severity}>
                            {
                              courtSeverityDisplay(remedyEnvelope.severity)
                                .label
                            }
                          </CodexSeverityHint>
                        </>
                      ),
                    },
                    {
                      label: "Authorization threshold",
                      value: `${remedyEnvelope.thresholds.authorization} of 12 jurors`,
                    },
                    {
                      label: "Punitive component limit",
                      value: remedyEnvelope.maximumComponentCount,
                    },
                    {
                      label: "Weighted burden ceiling",
                      value: `${remedyEnvelope.maximumBurden} eras`,
                    },
                  ]}
                  replacement={
                    <>
                      Policy{" "}
                      <CodexPolicyHint>
                        {remedyEnvelope.policyVersion}
                      </CodexPolicyHint>
                      . The ballot can record only the remedies and ranges
                      frozen when this sentence stage opened.
                    </>
                  }
                />
              ) : (
                <p className="text-sm text-destructive" role="alert">
                  The frozen sentence envelope is unavailable or invalid. This
                  ballot cannot be cast safely.
                </p>
              )}
              <label className="flex items-center gap-2 text-sm font-medium text-text">
                <input
                  id="court-remedy-authorize"
                  type="checkbox"
                  checked={authorizeSentence}
                  onChange={(event) =>
                    setAuthorizeSentence(event.target.checked)
                  }
                />
                Authorize a punitive sentence
              </label>
              <fieldset
                className="grid gap-3 disabled:opacity-50 sm:grid-cols-2"
                disabled={!authorizeSentence || actionLocked("remedy")}
              >
                {components.map((component) => {
                  const choice =
                    choices[component.id] ??
                    courtInitialRemedyChoice(component);
                  return (
                    <div
                      key={component.id}
                      className="grid gap-3 border border-border/60 p-3"
                    >
                      <CourtCodexCheckbox
                        checked={choice.include}
                        disabled={component.mode === "mandatory"}
                        label={courtRemedyLabel(component.id)}
                        onChange={(include) =>
                          setChoices((current) => ({
                            ...current,
                            [component.id]: {
                              ...choice,
                              include,
                            },
                          }))
                        }
                        reference={component.id}
                        suffix={
                          component.mode === "mandatory" ? " (required)" : ""
                        }
                      />
                      <p className="text-xs leading-5 text-muted">
                        {courtLabel(component.domain)} · Executor{" "}
                        {courtLabel(component.executorId)}{" "}
                        {component.executorVersion}
                        {` · ${courtLabel(component.expiryBehavior)} · ${courtLabel(component.appealBehavior)}`}
                      </p>
                      {component.burden ? (
                        <p className="text-xs leading-5 text-muted">
                          Burden weight {component.burden.weight} per{" "}
                          {component.burden.unit.slice(0, -1)}.
                        </p>
                      ) : null}
                      {component.value.kind === "ordered_scope" ? (
                        <Select
                          value={String(choice.conditionalValue ?? "")}
                          onChange={(event) =>
                            setChoices((current) => ({
                              ...current,
                              [component.id]: {
                                ...choice,
                                conditionalValue: event.target.value,
                              },
                            }))
                          }
                        >
                          {component.value.levels.map((level) => (
                            <option key={level} value={level}>
                              {courtLabel(level)}
                            </option>
                          ))}
                        </Select>
                      ) : null}
                      {component.value.kind === "quantitative" ? (
                        <div className="space-y-2">
                          <Input
                            type="number"
                            inputMode="numeric"
                            required
                            min={component.value.range.min}
                            max={component.value.range.max}
                            step={component.value.range.step}
                            value={String(
                              choice.conditionalValue ??
                                component.value.range.min,
                            )}
                            onChange={(event) =>
                              setChoices((current) => ({
                                ...current,
                                [component.id]: {
                                  ...choice,
                                  conditionalValue: event.target.value,
                                },
                              }))
                            }
                            aria-label={`${courtLabel(component.id)} value`}
                          />
                          <p className="text-xs text-muted">
                            Allowed range {component.value.range.min} to{" "}
                            {component.value.range.max}; step{" "}
                            {component.value.range.step}.
                          </p>
                        </div>
                      ) : null}
                      {component.value.kind === "permanent" ? (
                        <label className="flex items-center gap-2 text-sm text-text">
                          <input
                            type="checkbox"
                            checked={choice.conditionalValue === true}
                            onChange={(event) =>
                              setChoices((current) => ({
                                ...current,
                                [component.id]: {
                                  ...choice,
                                  conditionalValue: event.target.checked,
                                },
                              }))
                            }
                          />
                          Permanent
                        </label>
                      ) : null}
                    </div>
                  );
                })}
              </fieldset>
              {authorizeSentence && remedySelectionIssues.length ? (
                <div className="space-y-1" role="alert">
                  {remedySelectionIssues.map((issue, index) => (
                    <p
                      key={`${issue.code}-${index}`}
                      className="text-sm text-destructive"
                    >
                      {remedyIssueDescription(issue)}
                    </p>
                  ))}
                </div>
              ) : null}
              <CourtDecisionSummary
                items={[
                  {
                    label: "Punitive sentence",
                    value: authorizeSentence ? "Authorize" : "Do not authorize",
                  },
                  {
                    label: "Included remedies",
                    value: authorizeSentence
                      ? components.filter(
                          (component) =>
                            choices[component.id]?.include ??
                            component.mode === "mandatory",
                        ).length
                      : 0,
                  },
                  {
                    label: "Selected weighted burden",
                    value: authorizeSentence
                      ? `${selectedRemedyBurden} of ${remedyEnvelope?.maximumBurden ?? "unknown"} eras`
                      : "Not applicable",
                  },
                ]}
                replacement={
                  ballot.existingVote
                    ? `This replaces recorded vote revision ${ballot.existingVote.revision}.`
                    : null
                }
              />
              <CourtAsyncButton
                busy={busy === `${caseId}:remedy`}
                busyLabel="Casting remedy vote..."
                disabled={
                  actionLocked("remedy") ||
                  remedyEnvelope === null ||
                  components.length === 0 ||
                  (authorizeSentence && remedySelectionIssues.length > 0)
                }
              >
                Cast remedy vote
              </CourtAsyncButton>
            </form>
          </GlassyTile>
        ) : null}

        {can("file_appeal") ? (
          <GlassyTile>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run("appeal", (idempotencyKey) =>
                  apiFileCourtAppealV2(
                    {
                      caseId,
                      groundCode: appealGround,
                      grounds: appeal.trim(),
                      requestStay,
                    },
                    { idempotencyKey },
                  ),
                );
              }}
            >
              <h3 className="text-base font-semibold text-text">
                File an appeal
              </h3>
              <CourtFormField htmlFor="court-appeal-ground" label="Ground">
                <Select
                  id="court-appeal-ground"
                  value={appealGround}
                  onChange={(event) =>
                    setAppealGround(event.target.value as typeof appealGround)
                  }
                >
                  {COURT_APPEAL_GROUNDS.map((ground) => (
                    <option key={ground} value={ground}>
                      {courtAppealGroundDisplay(ground).label}
                    </option>
                  ))}
                </Select>
              </CourtFormField>
              <p className="text-sm leading-6 text-muted">
                {courtAppealGroundDisplay(appealGround).description}
              </p>
              <ProposalNarrativeEditor
                documentLabel="Appeal"
                id="court-appeal-grounds"
                value={appeal}
                onChange={setAppeal}
                placeholder="Explain the material error or new evidence supporting this appeal."
                rows={8}
              />
              <CourtNarrativeRequirement
                current={appeal.trim().length}
                minimum={20}
              />
              <label className="flex items-center gap-2 text-sm font-medium text-text">
                <input
                  type="checkbox"
                  checked={requestStay}
                  onChange={(event) => setRequestStay(event.target.checked)}
                />
                Request a stay while the appeal is reviewed
              </label>
              <CourtDecisionSummary
                items={[
                  {
                    label: "Ground",
                    value: courtAppealGroundDisplay(appealGround).label,
                  },
                  {
                    label: "Stay requested",
                    value: requestStay ? "Yes" : "No",
                  },
                ]}
              />
              <CourtAsyncButton
                busy={busy === `${caseId}:appeal`}
                busyLabel="Filing appeal..."
                disabled={actionLocked("appeal") || appeal.trim().length < 20}
              >
                File appeal
              </CourtAsyncButton>
            </form>
          </GlassyTile>
        ) : null}

        {can("respond_appellate_invitation") ||
        can("respond_reopening_invitation") ? (
          <GlassyTile className="space-y-4">
            <h3 className="text-base font-semibold text-text">
              {can("respond_reopening_invitation")
                ? "Reopening panel invitation"
                : "Appeal panel invitation"}
            </h3>
            <p className="text-sm leading-6 text-muted">
              This panel must remain distinct from prior juries. Accept only if
              you can serve independently and disclose any conflict.
            </p>
            <div className="flex flex-wrap gap-2">
              {(["accept", "decline", "conflict"] as const).map((response) => (
                <CourtAsyncButton
                  key={response}
                  busy={busy === `${caseId}:appellate-invitation-${response}`}
                  busyLabel={
                    response === "accept"
                      ? "Accepting duty..."
                      : response === "decline"
                        ? "Declining duty..."
                        : "Recording conflict..."
                  }
                  disabled={appellateInvitationLocked}
                  variant={response === "accept" ? "primary" : "outline"}
                  onClick={() =>
                    void run(
                      `appellate-invitation-${response}`,
                      (idempotencyKey) =>
                        can("respond_reopening_invitation")
                          ? apiRespondToCourtReopeningJuryV2(
                              {
                                panelId: courtCase.appellateTask!.panelId,
                                response,
                              },
                              { idempotencyKey },
                            )
                          : apiRespondToCourtAppellateJuryV2(
                              {
                                panelId: courtCase.appellateTask!.panelId,
                                response,
                              },
                              { idempotencyKey },
                            ),
                    )
                  }
                >
                  {response === "accept"
                    ? "Accept duty"
                    : response === "decline"
                      ? "Decline"
                      : "Disclose conflict"}
                </CourtAsyncButton>
              ))}
            </div>
          </GlassyTile>
        ) : null}

        {can("propose_appellate_modification") &&
        courtCase.appellateTask?.remedies.length ? (
          <GlassyTile>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run(
                  "modification",
                  (idempotencyKey) =>
                    apiProposeCourtAppellateModificationV2(
                      {
                        panelId: courtCase.appellateTask!.panelId,
                        retainedRemedyIds: [...retainedRemedyIds],
                      },
                      { idempotencyKey },
                    ),
                  undefined,
                  true,
                );
              }}
            >
              <h3 className="text-base font-semibold text-text">
                Propose a reduced remedy package
              </h3>
              <p className="text-sm leading-6 text-muted">
                A modification can retain or remove existing remedies. It cannot
                add a component or increase the original burden.
              </p>
              <div className="grid gap-2">
                {courtCase.appellateTask.remedies.map((remedy) => (
                  <CourtCodexCheckbox
                    key={remedy.id}
                    checked={retainedRemedyIds.has(remedy.id)}
                    label={courtRemedyLabel(remedy.componentCode)}
                    onChange={(retain) =>
                      setRetainedRemedyIds((current) => {
                        const next = new Set(current);
                        if (retain) next.add(remedy.id);
                        else next.delete(remedy.id);
                        return next;
                      })
                    }
                    prefix="Keep "
                    reference={remedy.componentCode}
                  />
                ))}
              </div>
              <CourtDecisionSummary
                items={[
                  {
                    label: "Retained remedies",
                    value: `${retainedRemedyIds.size} of ${courtCase.appellateTask.remedies.length}`,
                  },
                  {
                    label: "Effect",
                    value: "Reduce the original package only",
                  },
                ]}
              />
              <CourtAsyncButton
                busy={busy === `${caseId}:modification`}
                busyLabel="Proposing package..."
                disabled={
                  actionLocked("modification") ||
                  retainedRemedyIds.size ===
                    courtCase.appellateTask.remedies.length
                }
              >
                Propose modification
              </CourtAsyncButton>
            </form>
          </GlassyTile>
        ) : null}

        {can("vote_appeal") ? (
          <GlassyTile>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run(
                  "appellate-vote",
                  (idempotencyKey) =>
                    appellateResult === "modified"
                      ? apiCastCourtAppellateVoteV2(
                          {
                            panelId: courtCase.appellateTask!.panelId,
                            result: appellateResult,
                            modificationPackageId,
                            reasoning: appellateReasoning.trim(),
                          },
                          { idempotencyKey },
                        )
                      : apiCastCourtAppellateVoteV2(
                          {
                            panelId: courtCase.appellateTask!.panelId,
                            result: appellateResult,
                            reasoning: appellateReasoning.trim(),
                          },
                          { idempotencyKey },
                        ),
                  undefined,
                  true,
                );
              }}
            >
              <h3 className="text-base font-semibold text-text">
                Appeal decision
              </h3>
              <CourtFormField htmlFor="court-appellate-outcome" label="Outcome">
                <Select
                  id="court-appellate-outcome"
                  value={appellateResult}
                  onChange={(event) =>
                    setAppellateResult(
                      event.target.value as typeof appellateResult,
                    )
                  }
                >
                  <option value="affirmed">Affirm</option>
                  <option value="reversed">Reverse</option>
                  <option value="remanded">Remand for a new trial</option>
                  <option value="modified">Adopt a modification</option>
                </Select>
              </CourtFormField>
              {appellateResult === "modified" ? (
                <CourtFormField
                  htmlFor="court-modification-package"
                  label="Modification package"
                >
                  <Select
                    id="court-modification-package"
                    value={modificationPackageId}
                    onChange={(event) =>
                      setModificationPackageId(event.target.value)
                    }
                    required
                  >
                    <option value="">Choose a package</option>
                    {courtCase.appellateTask?.modificationPackages
                      .filter((item) => item.state === "proposed")
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.retainedRemedyIds.length} retained · burden{" "}
                          {item.modifiedBurden}
                        </option>
                      ))}
                  </Select>
                </CourtFormField>
              ) : null}
              <ProposalNarrativeEditor
                documentLabel="Appellate reasoning"
                id="court-appellate-reasoning"
                value={appellateReasoning}
                onChange={setAppellateReasoning}
                placeholder="Explain the legal and evidentiary basis for this outcome."
                rows={7}
              />
              <CourtNarrativeRequirement
                current={appellateReasoning.trim().length}
                minimum={20}
              />
              <CourtDecisionSummary
                items={[
                  { label: "Outcome", value: courtLabel(appellateResult) },
                  {
                    label: "Modification package",
                    value:
                      appellateResult === "modified"
                        ? modificationPackageId || "Not selected"
                        : "Not applicable",
                  },
                ]}
                replacement={
                  courtCase.appellateTask?.existingVote
                    ? "This replaces your currently recorded appellate vote."
                    : null
                }
              />
              <CourtAsyncButton
                busy={busy === `${caseId}:appellate-vote`}
                busyLabel="Casting appeal vote..."
                disabled={
                  actionLocked("appellate-vote") ||
                  appellateReasoning.trim().length < 20 ||
                  (appellateResult === "modified" && !modificationPackageId)
                }
              >
                Cast appeal vote
              </CourtAsyncButton>
            </form>
          </GlassyTile>
        ) : null}

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
                      evidenceReference: reopeningEvidenceReference.trim(),
                      statement: reopeningStatement.trim(),
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
                  value={reopeningEvidenceReference}
                  onChange={(event) =>
                    setReopeningEvidenceReference(event.target.value)
                  }
                  placeholder="ipfs://, protocol proof, or immutable archive"
                />
              </CourtFormField>
              <ProposalNarrativeEditor
                documentLabel="Reopening request"
                id="court-reopening-statement"
                value={reopeningStatement}
                onChange={setReopeningStatement}
                placeholder="Explain why the evidence was unavailable and how it could alter the result."
                rows={8}
              />
              <CourtNarrativeRequirement
                current={reopeningStatement.trim().length}
                minimum={20}
              />
              <CourtDecisionSummary
                items={[
                  {
                    label: "Evidence reference",
                    value: reopeningEvidenceReference.trim() || "Not set",
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
                  !reopeningEvidenceReference.trim() ||
                  reopeningStatement.trim().length < 20
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
                        reasoning: reopeningReasoning.trim(),
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
                value={reopeningReasoning}
                onChange={setReopeningReasoning}
                placeholder="Explain whether the verified evidence meets the reopening standard."
                rows={7}
              />
              <CourtNarrativeRequirement
                current={reopeningReasoning.trim().length}
                minimum={20}
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
                  reopeningReasoning.trim().length < 20
                }
              >
                Cast reopening vote
              </CourtAsyncButton>
            </form>
          </GlassyTile>
        ) : null}
      </div>
    </GlassySection>
  );
}
