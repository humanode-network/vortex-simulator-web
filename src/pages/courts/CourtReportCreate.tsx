import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { GlassySection, GlassyTile } from "@/components/GlassySection";
import { Modal } from "@/components/Modal";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHeader } from "@/components/PageHeader";
import { CodexHint, CodexProcedureHint } from "@/components/CodexHint";
import { ProposalNarrativeEditor } from "@/components/ProposalNarrative";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import {
  apiCourtReportingCapabilityV2,
  apiSubmitCourtReportV2,
} from "@/lib/apiClient";
import type { CourtEvidenceInputV2 } from "@/lib/api/courtsV2";
import { formatLoadError } from "@/lib/errorFormatting";
import type {
  CourtReportLaneV2Dto,
  CourtReportingCapabilityV2Dto,
  CourtTargetReferenceV2Dto,
} from "@/types/api";
import {
  courtLabel,
  CourtStandingReference,
  CourtTargetPreview,
  formatCourtInstant,
} from "./components/CourtPrimitives";
import {
  CourtAsyncButton,
  CourtEvidenceAccessOptions,
  CourtEvidenceComposer,
  CourtFormField,
  CourtNarrativeRequirement,
} from "./forms/CourtFormUi";
import {
  CourtPendingEvidenceList,
  CourtProtectiveReviewRequest,
  CourtReportReview,
} from "./forms/CourtReportFormSections";
import {
  COURT_REPORT_EVIDENCE_ACCESS,
  courtEvidenceFieldIds,
} from "./forms/courtEvidence";
import {
  courtLaneDisplay,
  courtOffenseDisplay,
  courtReportLaneChoiceLabel,
  courtReportRouteDescription,
} from "./model/courtPresentation";
import {
  courtErrorIssue,
  courtReportingUnavailableMessage,
} from "./model/courtErrors";
import { CourtsUnavailable } from "./CourtsUnavailable";
import { useCourtRuntime } from "./hooks/useCourtRuntime";
import { useUnsavedChangesGuard } from "./hooks/useUnsavedChangesGuard";
import {
  COURT_STATEMENT_MAX_LENGTH,
  COURT_STATEMENT_MIN_LENGTH,
} from "./model/courtConstraints";
import { courtLocalDateTime } from "./model/courtDates";
import { focusCourtField } from "./model/courtFocus";
import { useCourtEvidenceDraft } from "./hooks/useCourtEvidenceDraft";
import {
  courtReportTargetFromSearchParams,
  safeCourtReturnPath,
} from "./model/courtReportTarget";

type AvailableCapability = Extract<
  CourtReportingCapabilityV2Dto,
  { status: "available" }
>;

const REPORT_EVIDENCE_FIELD_IDS = courtEvidenceFieldIds("court-report");
const REPORT_ADDITIONAL_EVIDENCE_KINDS = Object.freeze([
  "external_url",
  "protocol_proof",
] as const);

const REPORT_FIELD_IDS: Readonly<Record<string, string>> = Object.freeze({
  affectedId: "court-report-affected",
  evidence: REPORT_EVIDENCE_FIELD_IDS.digest,
  goodFaithAttested: "court-report-good-faith",
  immediateProtectionRequested: "court-report-protective-review",
  incidentEndsAt: "court-report-incident-end",
  incidentStartsAt: "court-report-incident-time",
  incidentWindow: "court-report-incident-time",
  lane: "court-report-reason",
  offenseCode: "court-report-reason",
  reason: "court-report-reason",
  respondentId: "court-report-respondent",
  statement: "court-report-statement",
});

const CourtReportCreate: React.FC = () => {
  const runtime = useCourtRuntime();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const target = useMemo<CourtTargetReferenceV2Dto | null>(
    () => courtReportTargetFromSearchParams(searchParams),
    [searchParams],
  );
  const targetKey = target
    ? `${target.type}:${target.id}:${target.revision ?? "current"}`
    : "missing";
  const previousTargetKey = useRef(targetKey);
  const defaultsAppliedTargetKey = useRef<string | null>(null);
  const canonicalTarget = useRef<CourtTargetReferenceV2Dto | null>(null);
  const [initialIncidentStartsAt, setInitialIncidentStartsAt] = useState("");
  const [incidentStartsAt, setIncidentStartsAt] = useState("");
  const [incidentEndsAt, setIncidentEndsAt] = useState("");
  const [capability, setCapability] = useState<AvailableCapability | null>(
    null,
  );
  const [capabilityLoading, setCapabilityLoading] = useState(false);
  const [initialReasonKey, setInitialReasonKey] = useState("");
  const [reasonKey, setReasonKey] = useState("");
  const [initialRespondentId, setInitialRespondentId] = useState("");
  const [respondentId, setRespondentId] = useState("");
  const [initialAffectedId, setInitialAffectedId] = useState("");
  const [affectedId, setAffectedId] = useState("");
  const [statement, setStatement] = useState("");
  const [statementAccess, setStatementAccess] =
    useState<(typeof COURT_REPORT_EVIDENCE_ACCESS)[number]>("parties_and_jury");
  const {
    change: changeEvidenceDraft,
    draft: evidenceDraft,
    error: evidenceError,
    isEmpty: evidenceDraftIsEmpty,
    reportError: reportEvidenceError,
    reset: resetEvidenceDraft,
    validate: validateEvidenceDraft,
  } = useCourtEvidenceDraft("court-report", true);
  const [evidence, setEvidence] = useState<
    { key: string; value: CourtEvidenceInputV2 }[]
  >([]);
  const [immediateProtectionRequested, setImmediateProtectionRequested] =
    useState(false);
  const [goodFaithAttested, setGoodFaithAttested] = useState(false);
  const [capabilityError, setCapabilityError] = useState<string | null>(null);
  const [capabilityRequest, setCapabilityRequest] = useState(0);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionKey, setSubmissionKey] = useState(() => crypto.randomUUID());
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    if (previousTargetKey.current === targetKey) return;
    previousTargetKey.current = targetKey;
    defaultsAppliedTargetKey.current = null;
    canonicalTarget.current = null;
    setInitialIncidentStartsAt("");
    setIncidentStartsAt("");
    setIncidentEndsAt("");
    setCapability(null);
    setInitialReasonKey("");
    setReasonKey("");
    setInitialRespondentId("");
    setRespondentId("");
    setInitialAffectedId("");
    setAffectedId("");
    setStatement("");
    setStatementAccess("parties_and_jury");
    resetEvidenceDraft();
    setEvidence([]);
    setImmediateProtectionRequested(false);
    setGoodFaithAttested(false);
    setCapabilityError(null);
    setSubmissionError(null);
    setSubmissionKey(crypto.randomUUID());
    setCancelOpen(false);
  }, [resetEvidenceDraft, targetKey]);

  useEffect(() => {
    if (runtime.status !== "available" || !target) return;
    const incidentTimestamp = incidentStartsAt
      ? Date.parse(incidentStartsAt)
      : null;
    if (incidentTimestamp !== null && !Number.isFinite(incidentTimestamp)) {
      setCapability(null);
      setCapabilityLoading(false);
      setCapabilityError("Enter a complete incident date and time.");
      return;
    }
    let active = true;
    setCapabilityLoading(true);
    void apiCourtReportingCapabilityV2({
      target: canonicalTarget.current ?? target,
      ...(incidentTimestamp === null
        ? {}
        : { incidentAt: new Date(incidentTimestamp).toISOString() }),
    })
      .then((result) => {
        if (!active) return;
        if (result.status !== "available") {
          setCapability(null);
          setCapabilityError(courtReportingUnavailableMessage(result.reason));
          return;
        }
        canonicalTarget.current = {
          type: result.target.type,
          id: result.target.id,
          ...(result.target.revision
            ? { revision: result.target.revision }
            : {}),
        };
        setCapability(result);
        const onlyReasonKey =
          result.reasonCapabilities.length === 1
            ? `${result.reasonCapabilities[0].reason.offenseCode}:${result.reasonCapabilities[0].reason.lane}`
            : "";
        if (defaultsAppliedTargetKey.current !== targetKey) {
          defaultsAppliedTargetKey.current = targetKey;
          const serverIncidentStart = courtLocalDateTime(
            new Date(result.defaults.incidentStartsAt),
          );
          const serverRespondent = result.defaults.respondentId ?? "";
          const serverAffected = result.defaults.affectedId ?? "";
          setInitialIncidentStartsAt(serverIncidentStart);
          setIncidentStartsAt(serverIncidentStart);
          setInitialReasonKey(onlyReasonKey);
          setReasonKey(onlyReasonKey);
          setInitialRespondentId(serverRespondent);
          setRespondentId(serverRespondent);
          setInitialAffectedId(serverAffected);
          setAffectedId(serverAffected);
        } else {
          setReasonKey((current) =>
            result.reasonCapabilities.some(
              ({ reason }) =>
                `${reason.offenseCode}:${reason.lane}` === current,
            )
              ? current
              : onlyReasonKey,
          );
        }
        setCapabilityError(null);
      })
      .catch((loadError) => {
        if (!active) return;
        setCapability(null);
        setCapabilityError(courtErrorIssue(loadError).message);
      })
      .finally(() => {
        if (active) setCapabilityLoading(false);
      });
    return () => {
      active = false;
    };
  }, [capabilityRequest, incidentStartsAt, runtime.status, target]);

  const selectedReason = capability?.reasonCapabilities.find(
    ({ reason }) => `${reason.offenseCode}:${reason.lane}` === reasonKey,
  );
  const protectiveReview = selectedReason?.protectiveReview;
  const protectiveReviewAvailable =
    protectiveReview?.eligible === true && !incidentEndsAt;
  const returnPath = useMemo(() => {
    const fallback = safeCourtReturnPath(
      capability?.target.canonicalRoute,
      "/app/courts?view=reports",
    );
    return safeCourtReturnPath(searchParams.get("returnTo"), fallback);
  }, [capability?.target.canonicalRoute, searchParams]);
  const dirty =
    incidentStartsAt !== initialIncidentStartsAt ||
    reasonKey !== initialReasonKey ||
    respondentId !== initialRespondentId ||
    affectedId !== initialAffectedId ||
    Boolean(
      incidentEndsAt ||
        statement ||
        evidence.length ||
        !evidenceDraftIsEmpty ||
        immediateProtectionRequested ||
        goodFaithAttested ||
        statementAccess !== "parties_and_jury",
    );
  useUnsavedChangesGuard(dirty && !submitting);

  useEffect(() => {
    if (!protectiveReviewAvailable) setImmediateProtectionRequested(false);
  }, [protectiveReviewAvailable]);

  function parsePendingEvidence(): CourtEvidenceInputV2 | null {
    const result = validateEvidenceDraft("reporter_supplied");
    return result.ok ? result.value : null;
  }

  function addEvidence() {
    const item = parsePendingEvidence();
    if (!item) return;
    if (
      item.digest &&
      evidence.some(({ value }) => value.digest === item.digest)
    ) {
      reportEvidenceError({
        field: "digest",
        message: "This evidence digest is already in the report.",
      });
      return;
    }
    setEvidence((current) => [
      ...current,
      { key: crypto.randomUUID(), value: item },
    ]);
    resetEvidenceDraft();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target || !capability) return;
    if (!selectedReason) {
      setSubmissionError("Choose a report reason.");
      return;
    }
    const startsAt = Date.parse(incidentStartsAt);
    const endsAt = incidentEndsAt ? Date.parse(incidentEndsAt) : null;
    if (endsAt !== null && endsAt < startsAt) {
      setSubmissionError("Incident end cannot be earlier than its start.");
      focusCourtField("court-report-incident-end");
      return;
    }
    if (!goodFaithAttested) {
      setSubmissionError(
        "Confirm the good-faith attestation before submitting.",
      );
      return;
    }
    const pendingEvidence = parsePendingEvidence();
    if (!evidenceDraftIsEmpty && !pendingEvidence) return;
    const submittedEvidence = [
      ...evidence.map((item) => item.value),
      ...(pendingEvidence ? [pendingEvidence] : []),
    ];
    setSubmitting(true);
    setSubmissionError(null);
    try {
      const result = await apiSubmitCourtReportV2({
        target: {
          type: capability.target.type,
          id: capability.target.id,
          ...(capability.target.revision
            ? { revision: capability.target.revision }
            : {}),
        },
        offenseCode: selectedReason.reason.offenseCode,
        lane: selectedReason.reason.lane as CourtReportLaneV2Dto,
        respondentId: respondentId.trim() || null,
        affectedId: affectedId.trim() || null,
        incidentStartsAt: new Date(incidentStartsAt).toISOString(),
        ...(incidentEndsAt
          ? { incidentEndsAt: new Date(incidentEndsAt).toISOString() }
          : {}),
        statement: statement.trim(),
        statementAccess,
        evidence: submittedEvidence,
        immediateProtectionRequested:
          protectiveReviewAvailable && immediateProtectionRequested,
        goodFaithAttested,
        idempotencyKey: submissionKey,
      });
      navigate(`/app/courts/reports/${encodeURIComponent(result.reportId)}`);
    } catch (submitError) {
      const issue = courtErrorIssue(submitError);
      const status =
        submitError &&
        typeof submitError === "object" &&
        "status" in submitError
          ? Number((submitError as { status?: unknown }).status)
          : null;
      if (status !== null && status >= 400 && status < 500) {
        setSubmissionKey(crypto.randomUUID());
      }
      setSubmissionError(issue.message);
      const fieldId = issue.fields
        .map((field) => REPORT_FIELD_IDS[field])
        .find(Boolean);
      if (fieldId) focusCourtField(fieldId);
    } finally {
      setSubmitting(false);
    }
  }

  if (runtime.status !== "available") {
    return (
      <CourtsUnavailable
        checking={runtime.status === "checking"}
        failed={runtime.status === "failed"}
        onRetry={runtime.retry}
        pageId="courts"
        title="Create report"
        reason={
          runtime.status === "unavailable" || runtime.status === "failed"
            ? runtime.reason
            : undefined
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Court reporting"
        title="Create report"
        description="The server verifies the target, standing, available reasons, and Court lane before accepting a report."
        right={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              if (dirty) setCancelOpen(true);
              else navigate(returnPath);
            }}
          >
            Cancel
          </Button>
        }
      />
      {!target ? (
        <NoDataYetBar
          label="report target"
          description="Open reporting from a reportable Vortex record so its canonical target is preserved."
        />
      ) : (
        <form className="grid gap-6" onSubmit={submit}>
          <GlassySection title="Reported record">
            <CourtTargetPreview
              securedAt={capability?.preview.capturedAt}
              target={
                capability
                  ? {
                      accessClass: capability.target.accessClass,
                      canonicalRoute: capability.target.canonicalRoute,
                      digest: capability.preview.digest,
                      id: capability.target.id,
                      revision: capability.target.revision,
                      snapshotPayload: capability.preview.payload,
                      type: capability.target.type,
                    }
                  : target
              }
            />
          </GlassySection>

          <GlassySection title="Incident and reason">
            <GlassyTile className="grid gap-4 md:grid-cols-2">
              <CourtFormField
                htmlFor="court-report-incident-time"
                label="Incident start"
                hint={
                  capability?.defaults.incidentStartsAtSource === "target_event"
                    ? "Filled from the reported record. Change it only when the conduct began at a different time."
                    : "Set to the server assessment time because this record has no distinct event time."
                }
              >
                <Input
                  id="court-report-incident-time"
                  type="datetime-local"
                  value={incidentStartsAt}
                  onChange={(event) => setIncidentStartsAt(event.target.value)}
                  required
                />
              </CourtFormField>
              <CourtFormField
                htmlFor="court-report-incident-end"
                label="Incident end"
                hint="Leave blank when the conduct or risk is ongoing."
              >
                <Input
                  id="court-report-incident-end"
                  type="datetime-local"
                  min={incidentStartsAt}
                  value={incidentEndsAt}
                  onChange={(event) => setIncidentEndsAt(event.target.value)}
                />
              </CourtFormField>
              <CourtFormField htmlFor="court-report-reason" label="Reason">
                <Select
                  id="court-report-reason"
                  aria-describedby="court-reason-help"
                  disabled={capabilityLoading || !capability}
                  value={reasonKey}
                  onChange={(event) => setReasonKey(event.target.value)}
                  required
                >
                  <option value="">
                    {capabilityLoading
                      ? "Checking available reasons..."
                      : "Choose a verified reason"}
                  </option>
                  {(capability?.reasonCapabilities ?? []).map(({ reason }) => (
                    <option
                      key={`${reason.offenseCode}:${reason.lane}`}
                      value={`${reason.offenseCode}:${reason.lane}`}
                    >
                      {courtOffenseDisplay(reason.offenseCode).label} ·{" "}
                      {courtReportLaneChoiceLabel(reason.lane)}
                    </option>
                  ))}
                </Select>
              </CourtFormField>
              <p
                id="court-reason-help"
                className="text-sm leading-6 text-muted md:col-span-2"
                role="status"
              >
                {selectedReason ? (
                  <>
                    <CodexHint reference={selectedReason.reason.offenseCode}>
                      {
                        courtOffenseDisplay(selectedReason.reason.offenseCode)
                          .label
                      }
                    </CodexHint>
                    {`: ${courtOffenseDisplay(selectedReason.reason.offenseCode).description} `}
                    <CodexProcedureHint clause="HC-2.1">
                      {courtLaneDisplay(selectedReason.reason.lane).label}
                    </CodexProcedureHint>
                    {`: ${courtLaneDisplay(selectedReason.reason.lane).description} `}
                    <br />
                    <CourtStandingReference
                      direct={selectedReason.standing.directStanding}
                      source={selectedReason.standing.source}
                    />
                    {`. ${courtReportRouteDescription(
                      selectedReason.reason.lane,
                      selectedReason.standing,
                    )}`}
                  </>
                ) : capabilityLoading ? (
                  "The server is verifying the target, incident time, standing, and available lanes."
                ) : (
                  "Reasons are limited to those verified for this exact target and incident time."
                )}
              </p>
              {selectedReason && capability?.population ? (
                <p className="text-xs leading-5 text-muted md:col-span-2">
                  Population basis: {courtLabel(capability.population.basis)} ·{" "}
                  effective{" "}
                  {formatCourtInstant(capability.population.effectiveAt)}.
                </p>
              ) : null}
              {capabilityError ? (
                <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                  <p className="text-sm text-destructive" role="alert">
                    {formatLoadError(capabilityError)}
                  </p>
                  <Button
                    type="button"
                    size="compact"
                    variant="outline"
                    onClick={() =>
                      setCapabilityRequest((current) => current + 1)
                    }
                  >
                    Retry reason check
                  </Button>
                </div>
              ) : null}
            </GlassyTile>
          </GlassySection>

          <GlassySection title="People and statement">
            <GlassyTile className="grid gap-4 md:grid-cols-2">
              <CourtFormField
                htmlFor="court-report-respondent"
                label="Respondent address"
                hint={
                  capability?.defaults.respondentIdSource ===
                  "sole_target_owner"
                    ? "Suggested from the record owner. Change it if another Human Node is responsible."
                    : "The Human Node whose conduct is being reported, when known."
                }
              >
                <Input
                  id="court-report-respondent"
                  value={respondentId}
                  onChange={(event) => setRespondentId(event.target.value)}
                />
              </CourtFormField>
              <CourtFormField
                htmlFor="court-report-affected"
                label="Affected address"
                hint={
                  capability?.defaults.affectedIdSource === "direct_reporter"
                    ? "Suggested from your verified direct standing. Change it if another Human Node was affected."
                    : "The Human Node directly affected by the conduct, if different."
                }
              >
                <Input
                  id="court-report-affected"
                  value={affectedId}
                  onChange={(event) => setAffectedId(event.target.value)}
                />
              </CourtFormField>
              <CourtFormField
                className="md:col-span-2"
                htmlFor="court-report-statement"
                label="Statement"
              >
                <ProposalNarrativeEditor
                  documentLabel="Court statement"
                  id="court-report-statement"
                  value={statement}
                  onChange={setStatement}
                  placeholder="Describe what happened, when it happened, and why this reason applies."
                  rows={10}
                />
                <CourtNarrativeRequirement
                  current={statement.trim().length}
                  minimum={COURT_STATEMENT_MIN_LENGTH}
                  maximum={COURT_STATEMENT_MAX_LENGTH}
                />
              </CourtFormField>
              <CourtFormField
                className="md:col-span-2"
                htmlFor="court-report-statement-access"
                label="Who may read the statement"
                hint="The selected access class is enforced by the Court record."
              >
                <Select
                  id="court-report-statement-access"
                  value={statementAccess}
                  onChange={(event) =>
                    setStatementAccess(
                      event.target.value as typeof statementAccess,
                    )
                  }
                >
                  <CourtEvidenceAccessOptions />
                </Select>
              </CourtFormField>
            </GlassyTile>
          </GlassySection>

          <GlassySection title="Additional evidence">
            <GlassyTile className="grid gap-4">
              <p className="text-sm leading-6 text-muted">
                The reported Vortex record is already secured and attached. Add
                supporting material only when it helps establish the conduct.
              </p>
              <details className="border-t border-border/70 pt-3">
                <summary className="cursor-pointer text-sm font-medium text-text">
                  Add supporting evidence
                </summary>
                <div className="mt-4 grid gap-4">
                  <CourtEvidenceComposer
                    allowedKinds={REPORT_ADDITIONAL_EVIDENCE_KINDS}
                    autoDigestExternalUrl
                    draft={evidenceDraft}
                    error={evidenceError}
                    idPrefix="court-report"
                    onChange={changeEvidenceDraft}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="compact"
                      variant="outline"
                      onClick={addEvidence}
                    >
                      Add evidence
                    </Button>
                  </div>
                </div>
              </details>
              <CourtPendingEvidenceList
                evidence={evidence}
                onRemove={(key) =>
                  setEvidence((current) =>
                    current.filter((candidate) => candidate.key !== key),
                  )
                }
              />
              {protectiveReviewAvailable && protectiveReview?.eligible ? (
                <CourtProtectiveReviewRequest
                  review={protectiveReview}
                  requested={immediateProtectionRequested}
                  onChange={setImmediateProtectionRequested}
                />
              ) : null}
            </GlassyTile>
          </GlassySection>

          <GlassySection title="Review and attest">
            <CourtReportReview
              evidenceCount={
                1 + evidence.length + (evidenceDraftIsEmpty ? 0 : 1)
              }
              goodFaithAttested={goodFaithAttested}
              incidentEndsAt={incidentEndsAt}
              incidentStartsAt={incidentStartsAt}
              onGoodFaithAttestedChange={setGoodFaithAttested}
              protectiveReviewRequested={immediateProtectionRequested}
              selectedReason={selectedReason}
              statementAccess={statementAccess}
              statementLength={statement.trim().length}
              target={capability?.target ?? target}
            />
          </GlassySection>

          {submissionError ? (
            <p className="text-sm text-destructive" role="alert">
              {formatLoadError(submissionError)}
            </p>
          ) : null}
          <div className="flex justify-end">
            <CourtAsyncButton
              type="submit"
              busy={submitting}
              busyLabel="Submitting report..."
              disabled={
                !capability ||
                capabilityLoading ||
                !reasonKey ||
                statement.trim().length < COURT_STATEMENT_MIN_LENGTH ||
                statement.trim().length > COURT_STATEMENT_MAX_LENGTH ||
                !goodFaithAttested ||
                evidenceError !== null
              }
            >
              Submit report
            </CourtAsyncButton>
          </div>
        </form>
      )}
      <Modal
        ariaLabel="Discard Court report"
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        contentClassName="max-w-lg"
      >
        <GlassyTile className="space-y-4 p-5">
          <h2 className="text-lg font-semibold text-text">
            Discard this report?
          </h2>
          <p className="text-sm leading-6 text-muted">
            The report has not been submitted. Leaving now discards the text and
            evidence entered on this page.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelOpen(false)}
            >
              Keep editing
            </Button>
            <Button type="button" onClick={() => navigate(returnPath)}>
              Discard and leave
            </Button>
          </div>
        </GlassyTile>
      </Modal>
    </div>
  );
};

export default CourtReportCreate;
