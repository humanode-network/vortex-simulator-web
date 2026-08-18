import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
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
  CourtCopyValue,
  CourtStandingReference,
  CourtStateSummary,
  CourtTargetPreview,
} from "./courtUi";
import {
  CourtAsyncButton,
  CourtEvidenceDraftFields,
  CourtEvidenceSafetyNote,
  CourtFormField,
  CourtNarrativeRequirement,
} from "./courtFormUi";
import {
  COURT_REPORT_EVIDENCE_ACCESS,
  courtEvidenceDraftIsEmpty,
  courtEvidenceDraftToInput,
  emptyCourtEvidenceDraft,
  type CourtEvidenceDraftError,
} from "./courtEvidenceForm";
import {
  courtLaneDisplay,
  courtOffenseDisplay,
  courtStandingDisplay,
} from "./courtPresentation";
import { courtErrorIssue } from "./courtErrors";
import { CourtsUnavailable } from "./CourtsUnavailable";
import { useCourtRuntime } from "./useCourtRuntime";

type AvailableCapability = Extract<
  CourtReportingCapabilityV2Dto,
  { status: "available" }
>;

function localDateTime(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const EVIDENCE_FIELD_IDS: Record<CourtEvidenceDraftError["field"], string> = {
  digest: "court-report-digest",
  url: "court-report-url",
  targetType: "court-report-target-type",
  targetId: "court-report-target-id",
  proofType: "court-report-proof-type",
  verifierId: "court-report-verifier-id",
  verifierVersion: "court-report-verifier-version",
};

const REPORT_FIELD_IDS: Readonly<Record<string, string>> = Object.freeze({
  affectedId: "court-report-affected",
  evidence: "court-report-digest",
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
  const target = useMemo<CourtTargetReferenceV2Dto | null>(() => {
    const type = searchParams.get("targetType")?.trim();
    const id = searchParams.get("targetId")?.trim();
    if (!type || !id) return null;
    const revision = searchParams.get("revision")?.trim() || undefined;
    return { type: type as CourtTargetReferenceV2Dto["type"], id, revision };
  }, [searchParams]);
  const [initialIncidentStartsAt] = useState(() => localDateTime(new Date()));
  const [incidentStartsAt, setIncidentStartsAt] = useState(
    initialIncidentStartsAt,
  );
  const [incidentEndsAt, setIncidentEndsAt] = useState("");
  const [capability, setCapability] = useState<AvailableCapability | null>(
    null,
  );
  const [capabilityLoading, setCapabilityLoading] = useState(false);
  const [reasonKey, setReasonKey] = useState("");
  const [respondentId, setRespondentId] = useState("");
  const [affectedId, setAffectedId] = useState("");
  const [statement, setStatement] = useState("");
  const [statementAccess, setStatementAccess] =
    useState<(typeof COURT_REPORT_EVIDENCE_ACCESS)[number]>("parties_and_jury");
  const [evidenceDraft, setEvidenceDraft] = useState(emptyCourtEvidenceDraft);
  const [evidenceError, setEvidenceError] =
    useState<CourtEvidenceDraftError | null>(null);
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
    if (runtime.status !== "available" || !target) return;
    const incidentTimestamp = Date.parse(incidentStartsAt);
    if (!Number.isFinite(incidentTimestamp)) {
      setCapability(null);
      setCapabilityLoading(false);
      setCapabilityError("Enter a complete incident date and time.");
      return;
    }
    let active = true;
    setCapabilityLoading(true);
    void apiCourtReportingCapabilityV2({
      target,
      incidentAt: new Date(incidentTimestamp).toISOString(),
    })
      .then((result) => {
        if (!active) return;
        if (result.status !== "available") {
          setCapability(null);
          setCapabilityError(result.reason);
          return;
        }
        setCapability(result);
        setReasonKey((current) =>
          result.reasonCapabilities.some(
            ({ reason }) => `${reason.offenseCode}:${reason.lane}` === current,
          )
            ? current
            : "",
        );
        setCapabilityError(null);
      })
      .catch((loadError) => {
        if (!active) return;
        setCapability(null);
        setCapabilityError((loadError as Error).message);
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
    const requested = searchParams.get("returnTo")?.trim();
    if (requested?.startsWith("/app/") && !requested.startsWith("//")) {
      return requested;
    }
    return capability?.target.canonicalRoute ?? "/app/courts?view=reports";
  }, [capability?.target.canonicalRoute, searchParams]);
  const dirty =
    incidentStartsAt !== initialIncidentStartsAt ||
    Boolean(
      incidentEndsAt ||
        reasonKey ||
        respondentId ||
        affectedId ||
        statement ||
        evidence.length ||
        !courtEvidenceDraftIsEmpty(evidenceDraft) ||
        immediateProtectionRequested ||
        goodFaithAttested,
    );

  useEffect(() => {
    if (!protectiveReviewAvailable) setImmediateProtectionRequested(false);
  }, [protectiveReviewAvailable]);

  function parsePendingEvidence(): CourtEvidenceInputV2 | null {
    if (courtEvidenceDraftIsEmpty(evidenceDraft)) {
      setEvidenceError(null);
      return null;
    }
    const result = courtEvidenceDraftToInput(
      evidenceDraft,
      "reporter_supplied",
    );
    if (!result.ok) {
      setEvidenceError(result.error);
      window.requestAnimationFrame(() => {
        document
          .getElementById(EVIDENCE_FIELD_IDS[result.error.field])
          ?.focus();
      });
      return null;
    }
    setEvidenceError(null);
    return result.value;
  }

  function addEvidence() {
    const item = parsePendingEvidence();
    if (!item) return;
    if (evidence.some(({ value }) => value.digest === item.digest)) {
      setEvidenceError({
        field: "digest",
        message: "This evidence digest is already in the report.",
      });
      return;
    }
    setEvidence((current) => [
      ...current,
      { key: crypto.randomUUID(), value: item },
    ]);
    setEvidenceDraft(emptyCourtEvidenceDraft());
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
      window.requestAnimationFrame(() =>
        document.getElementById("court-report-incident-end")?.focus(),
      );
      return;
    }
    if (!goodFaithAttested) {
      setSubmissionError(
        "Confirm the good-faith attestation before submitting.",
      );
      return;
    }
    const pendingEvidence = parsePendingEvidence();
    if (!courtEvidenceDraftIsEmpty(evidenceDraft) && !pendingEvidence) return;
    const submittedEvidence = [
      ...evidence.map((item) => item.value),
      ...(pendingEvidence ? [pendingEvidence] : []),
    ];
    setSubmitting(true);
    setSubmissionError(null);
    try {
      const result = await apiSubmitCourtReportV2({
        target,
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
      if (fieldId) {
        window.requestAnimationFrame(() =>
          document.getElementById(fieldId)?.focus(),
        );
      }
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
                      {courtLaneDisplay(reason.lane).label}
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
                    {`. ${courtStandingDisplay(selectedReason.standing).description}`}
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
                  {formatReviewInstant(capability.population.effectiveAt)}.
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
                hint="The Human Node whose conduct is being reported, when known."
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
                hint="The Human Node directly affected by the conduct, if different."
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
                  minimum={20}
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
                  {COURT_REPORT_EVIDENCE_ACCESS.map((access) => (
                    <option key={access} value={access}>
                      {courtLabel(access)}
                    </option>
                  ))}
                </Select>
              </CourtFormField>
            </GlassyTile>
          </GlassySection>

          <GlassySection title="Evidence">
            <GlassyTile className="grid gap-4">
              <CourtEvidenceDraftFields
                draft={evidenceDraft}
                error={evidenceError}
                idPrefix="court-report"
                onChange={(next) => {
                  setEvidenceDraft(next);
                  setEvidenceError(null);
                }}
              />
              <CourtEvidenceSafetyNote />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="compact"
                  variant="outline"
                  onClick={addEvidence}
                >
                  Add another evidence record
                </Button>
              </div>
              {evidence.length ? (
                <div
                  className="grid gap-2"
                  aria-label="Evidence records ready to submit"
                >
                  {evidence.map((item, index) => (
                    <div
                      key={item.key}
                      className="flex min-w-0 flex-wrap items-center justify-between gap-3 border border-border/70 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text">
                          {index + 1}. {courtLabel(item.value.kind)}
                        </p>
                        <CourtCopyValue
                          label={`evidence ${index + 1} digest`}
                          value={item.value.digest}
                        />
                      </div>
                      <Button
                        type="button"
                        size="compact"
                        variant="ghost"
                        onClick={() =>
                          setEvidence((current) =>
                            current.filter(
                              (candidate) => candidate.key !== item.key,
                            ),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
              {protectiveReviewAvailable && protectiveReview?.eligible ? (
                <div className="space-y-2 border-t border-border/70 pt-4">
                  <label className="flex items-center gap-2 text-sm text-text">
                    <input
                      id="court-report-protective-review"
                      type="checkbox"
                      checked={immediateProtectionRequested}
                      onChange={(event) =>
                        setImmediateProtectionRequested(event.target.checked)
                      }
                    />
                    Request immediate protective review
                  </label>
                  <p className="text-sm leading-6 text-muted">
                    This temporary, non-punitive review lasts up to{" "}
                    {Math.round(protectiveReview.durationSeconds / 3_600)} hours
                    and is assigned to{" "}
                    {protectiveReview.authorityIds.join(", ")}. It does not
                    establish guilt or choose a punishment.
                  </p>
                </div>
              ) : null}
            </GlassyTile>
          </GlassySection>

          <GlassySection title="Review and attest">
            <GlassyTile className="space-y-4">
              {selectedReason ? (
                <CourtStateSummary
                  description={`${courtOffenseDisplay(selectedReason.reason.offenseCode).description} ${courtLaneDisplay(selectedReason.reason.lane).description}`}
                  label={
                    <>
                      <CodexHint reference={selectedReason.reason.offenseCode}>
                        {
                          courtOffenseDisplay(selectedReason.reason.offenseCode)
                            .label
                        }
                      </CodexHint>
                      {" · "}
                      <CodexProcedureHint clause="HC-2.1">
                        {courtLaneDisplay(selectedReason.reason.lane).label}
                      </CodexProcedureHint>
                    </>
                  }
                  tone="primary"
                />
              ) : (
                <p className="text-sm text-muted">
                  Choose a verified reason to complete the review.
                </p>
              )}
              <div className="grid gap-3 text-sm text-text sm:grid-cols-2">
                <p>
                  Target: {courtLabel(target.type)} · {target.id}
                </p>
                <p>Incident: {formatReviewInstant(incidentStartsAt)}</p>
                <p>
                  Incident end:{" "}
                  {incidentEndsAt
                    ? formatReviewInstant(incidentEndsAt)
                    : "Ongoing"}
                </p>
                <p>Statement: {statement.trim().length} characters</p>
                <p>Statement access: {courtLabel(statementAccess)}</p>
                {selectedReason ? (
                  <p>
                    Standing:{" "}
                    <CourtStandingReference
                      direct={selectedReason.standing.directStanding}
                      source={selectedReason.standing.source}
                    />
                  </p>
                ) : null}
                <p>
                  Evidence:{" "}
                  {evidence.length +
                    (courtEvidenceDraftIsEmpty(evidenceDraft) ? 0 : 1)}{" "}
                  referenced
                  {evidence.length +
                    (courtEvidenceDraftIsEmpty(evidenceDraft) ? 0 : 1) ===
                  1
                    ? " record"
                    : " records"}
                </p>
                <p>
                  Protective review:{" "}
                  {immediateProtectionRequested ? "Requested" : "Not requested"}
                </p>
              </div>
              <label className="flex items-start gap-2 text-sm leading-6 text-text">
                <input
                  id="court-report-good-faith"
                  className="mt-1"
                  type="checkbox"
                  checked={goodFaithAttested}
                  onChange={(event) =>
                    setGoodFaithAttested(event.target.checked)
                  }
                  required
                />
                I attest that this report is made in good faith and that the
                facts are accurate to the best of my knowledge.
              </label>
            </GlassyTile>
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
                statement.trim().length < 20 ||
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

function formatReviewInstant(value: string): string {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toLocaleString()
    : "Not set";
}

export default CourtReportCreate;
