import type { FormEvent } from "react";
import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import {
  GlassyCompactGrid,
  GlassyKeyValue,
  GlassySection,
  GlassyTile,
} from "@/components/GlassySection";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHeader } from "@/components/PageHeader";
import {
  CodexHint,
  CodexPolicyHint,
  CodexProcedureHint,
} from "@/components/CodexHint";
import { Modal } from "@/components/Modal";
import {
  ProposalNarrative,
  ProposalNarrativeEditor,
} from "@/components/ProposalNarrative";
import { Button } from "@/components/primitives/button";
import {
  CourtActionFeedback,
  CourtAsyncButton,
  CourtEvidenceDraftFields,
  CourtEvidenceSafetyNote,
  CourtNarrativeRequirement,
} from "./courtFormUi";
import {
  apiAmendCourtReportV2,
  apiCourtReportV2,
  apiSupplementCourtReportV2,
  apiWithdrawCourtReportV2,
} from "@/lib/apiClient";
import type { CourtPrivateReportV2Dto } from "@/types/api";
import {
  courtLabel,
  CourtDeadline,
  CourtEvidenceCard,
  CourtCopyValue,
  CourtReportRevisionHistory,
  CourtStandingReference,
  CourtStateSummary,
  CourtTargetPreview,
  courtTone,
  formatCourtInstant,
} from "./courtUi";
import {
  courtLaneDisplay,
  courtOffenseDisplay,
  courtReportProcessContext,
  courtReportStateDisplay,
} from "./courtPresentation";
import { CourtsUnavailable } from "./CourtsUnavailable";
import { useCourtRuntime } from "./useCourtRuntime";
import { useCourtCommandRunner } from "./useCourtCommandRunner";
import { useCourtRecord } from "./useCourtRecord";
import {
  courtEvidenceDraftIsEmpty,
  courtEvidenceDraftToInput,
  emptyCourtEvidenceDraft,
  type CourtEvidenceDraftError,
} from "./courtEvidenceForm";

const CourtReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const runtime = useCourtRuntime();
  const loadReport = useCallback(async () => {
    if (!id) throw new Error("Report id is missing.");
    return await apiCourtReportV2(id);
  }, [id]);
  const record = useCourtRecord<CourtPrivateReportV2Dto>({
    enabled: runtime.status === "available" && Boolean(id),
    load: loadReport,
  });
  const report = record.data;
  const process = report ? courtReportProcessContext(report) : null;
  const revisionRunner = useCourtCommandRunner(record.reload);
  const withdrawRunner = useCourtCommandRunner();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [supplement, setSupplement] = useState("");
  const [evidenceDraft, setEvidenceDraft] = useState(emptyCourtEvidenceDraft);
  const [evidenceError, setEvidenceError] =
    useState<CourtEvidenceDraftError | null>(null);

  async function reviseReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!report) return;
    const amendment = report.actions.amend;
    const evidenceInput = courtEvidenceDraftIsEmpty(evidenceDraft)
      ? null
      : courtEvidenceDraftToInput(
          evidenceDraft,
          amendment ? "reporter_amendment" : "reporter_supplement",
        );
    if (evidenceInput && !evidenceInput.ok) {
      setEvidenceError(evidenceInput.error);
      return;
    }
    const evidence = evidenceInput?.value ? [evidenceInput.value] : [];
    await revisionRunner.run({
      id: `${amendment ? "amendment" : "supplement"}:${report.id}:${report.revision}`,
      label: amendment ? "Report amendment" : "Report supplement",
      fieldTargets: {
        digest: "court-supplement-digest",
        evidence: "court-supplement-digest",
        statement: "court-report-supplement",
      },
      action: (idempotencyKey) => {
        if (amendment) {
          return apiAmendCourtReportV2(
            {
              reportId: report.id,
              statement: supplement.trim(),
              statementAccess: "parties_and_jury",
              evidence,
            },
            { idempotencyKey },
          );
        }
        return apiSupplementCourtReportV2(
          {
            reportId: report.id,
            statement: supplement.trim() || null,
            statementAccess: "parties_and_jury",
            evidence,
          },
          { idempotencyKey },
        );
      },
      onConfirmed: () => {
        setSupplement("");
        setEvidenceDraft(emptyCourtEvidenceDraft());
        setEvidenceError(null);
      },
      unlockAfterRefresh: true,
    });
  }

  async function withdraw() {
    if (!report) return;
    await withdrawRunner.run({
      id: `withdraw:${report.id}`,
      label: "Report withdrawal",
      action: (idempotencyKey) =>
        apiWithdrawCourtReportV2({ reportId: report.id, idempotencyKey }),
      onConfirmed: () => navigate("/app/courts?view=reports"),
    });
  }

  if (runtime.status !== "available") {
    return (
      <CourtsUnavailable
        checking={runtime.status === "checking"}
        failed={runtime.status === "failed"}
        onRetry={runtime.retry}
        pageId="courts"
        title="Court report"
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
        eyebrow="My report"
        title={
          report ? (
            <CodexHint reference={report.offenseCode}>
              {courtOffenseDisplay(report.offenseCode).label}
            </CodexHint>
          ) : (
            "Court report"
          )
        }
        description={report ? "Private reporter record" : (id ?? "Not set")}
        right={
          <Button asChild size="sm" variant="outline">
            <Link to="/app/courts?view=reports">All reports</Link>
          </Button>
        }
      />
      {record.error && report ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-border/70 p-3">
          <p className="text-sm text-destructive" role="alert">
            The report below may be stale: {record.error}
          </p>
          <Button
            size="compact"
            variant="outline"
            onClick={() => void record.reload().catch(() => undefined)}
          >
            Retry report
          </Button>
        </div>
      ) : record.error ? (
        <div className="space-y-2">
          <NoDataYetBar label="report" description={record.error} />
          <Button
            size="compact"
            variant="outline"
            onClick={() => void record.reload().catch(() => undefined)}
          >
            Retry report
          </Button>
        </div>
      ) : null}
      {record.loading && !report ? (
        <NoDataYetBar label="report record" description="Loading report..." />
      ) : null}
      {report ? (
        <>
          <GlassySection title="Report status">
            <GlassyTile className="space-y-4">
              <CourtStateSummary
                description={courtReportStateDisplay(report.state).description}
                label={courtReportStateDisplay(report.state).label}
                tone={courtTone(report.state)}
              />
              <GlassyCompactGrid className="sm:grid-cols-2 lg:grid-cols-4">
                <GlassyKeyValue
                  label="Report id"
                  value={<CourtCopyValue label="report id" value={report.id} />}
                />
                <GlassyKeyValue
                  label="Lane"
                  value={
                    <CodexProcedureHint clause="HC-2.1">
                      {courtLaneDisplay(report.lane).label}
                    </CodexProcedureHint>
                  }
                />
                <GlassyKeyValue
                  label="Target"
                  value={courtLabel(report.target.type)}
                />
                <GlassyKeyValue
                  label="Incident"
                  value={formatCourtInstant(report.incident.startedAt)}
                />
                {report.incident.endedAt ? (
                  <GlassyKeyValue
                    label="Incident ended"
                    value={formatCourtInstant(report.incident.endedAt)}
                  />
                ) : null}
                <GlassyKeyValue
                  label="Submitted"
                  value={formatCourtInstant(report.submittedAt)}
                />
                <GlassyKeyValue
                  label="Updated"
                  value={formatCourtInstant(report.updatedAt)}
                />
                <GlassyKeyValue
                  label="Standing"
                  value={
                    <CourtStandingReference
                      direct={report.standing.direct}
                      source={report.standing.source}
                    />
                  }
                />
                <GlassyKeyValue
                  label="Destination"
                  value={process?.destination ?? "Not set"}
                />
                <GlassyKeyValue
                  label="Policy"
                  value={
                    <CodexPolicyHint>{report.policyVersionId}</CodexPolicyHint>
                  }
                />
                <GlassyKeyValue
                  label="Protective review"
                  value={
                    report.immediateProtectionRequested
                      ? "Requested at intake"
                      : "Not requested"
                  }
                />
              </GlassyCompactGrid>
              {process ? (
                <p className="text-sm leading-6 text-muted">
                  Next: {process.nextStep}
                </p>
              ) : null}
            </GlassyTile>
          </GlassySection>
          {report.amendmentRequest ? (
            <GlassySection title="Amendment requested">
              <GlassyTile className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-text">
                    Intake review needs a correction
                  </h2>
                  <p className="text-sm leading-6 text-muted">
                    {report.amendmentRequest.reason}
                  </p>
                </div>
                {report.amendmentRequest.missingFields.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted uppercase">
                      Fields to address
                    </p>
                    <ul className="grid gap-1 text-sm text-text sm:grid-cols-2">
                      {report.amendmentRequest.missingFields.map((field) => (
                        <li key={field}>- {courtLabel(field)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <CourtDeadline
                  dueAt={report.amendmentRequest.dueAt}
                  label="Amendment deadline"
                  state={report.amendmentDeadlineState ?? "due"}
                />
              </GlassyTile>
            </GlassySection>
          ) : null}
          <GlassySection title="Reported record">
            <CourtTargetPreview target={report.target} />
          </GlassySection>
          {report.actions.amend || report.actions.supplement ? (
            <GlassySection
              title={report.actions.amend ? "Amend report" : "Add information"}
            >
              <GlassyTile>
                <form className="grid gap-4" onSubmit={reviseReport}>
                  {report.actions.amend ? (
                    <p className="text-sm leading-6 text-muted">
                      Correct the report below, then submit it for intake review
                      again. Adding an amendment changes the report back to
                      Submitted; it does not open a case by itself.
                    </p>
                  ) : null}
                  <ProposalNarrativeEditor
                    documentLabel={
                      report.actions.amend
                        ? "Court amendment"
                        : "Court supplement"
                    }
                    id="court-report-supplement"
                    value={supplement}
                    onChange={setSupplement}
                    placeholder={
                      report.actions.amend
                        ? "Provide the corrected statement requested by intake review."
                        : "Add relevant context or explain new evidence."
                    }
                    rows={7}
                  />
                  {report.actions.amend || supplement.trim() ? (
                    <CourtNarrativeRequirement
                      current={supplement.trim().length}
                      minimum={20}
                      maximum={20_000}
                    />
                  ) : (
                    <p className="text-xs text-muted">
                      A written supplement is optional when adding an evidence
                      reference.
                    </p>
                  )}
                  <CourtEvidenceDraftFields
                    draft={evidenceDraft}
                    error={evidenceError}
                    idPrefix="court-supplement"
                    onChange={(next) => {
                      setEvidenceDraft(next);
                      setEvidenceError(null);
                    }}
                  />
                  <CourtEvidenceSafetyNote />
                  <CourtActionFeedback
                    actionError={revisionRunner.actionError}
                    actionField={revisionRunner.actionField}
                    notice={revisionRunner.notice}
                    refreshError={revisionRunner.refreshError}
                    onRetryRefresh={() => void revisionRunner.refresh()}
                  />
                  <div className="flex justify-end">
                    <CourtAsyncButton
                      busy={revisionRunner.busy !== null}
                      busyLabel={
                        report.actions.amend
                          ? "Submitting amendment..."
                          : "Adding supplement..."
                      }
                      disabled={
                        (report.actions.amend &&
                          supplement.trim().length < 20) ||
                        (!report.actions.amend &&
                          !supplement.trim() &&
                          courtEvidenceDraftIsEmpty(evidenceDraft)) ||
                        (Boolean(supplement.trim()) &&
                          supplement.trim().length < 20) ||
                        evidenceError !== null
                      }
                    >
                      {report.actions.amend
                        ? "Submit amendment"
                        : "Add supplement"}
                    </CourtAsyncButton>
                  </div>
                </form>
              </GlassyTile>
            </GlassySection>
          ) : null}
          <GlassySection title="Statement">
            <GlassyTile className="space-y-4">
              <ProposalNarrative
                value={
                  typeof report.statement.markdown === "string"
                    ? report.statement.markdown
                    : typeof report.statement.body === "string"
                      ? report.statement.body
                      : "Statement is available in its signed evidence record."
                }
              />
              <GlassyCompactGrid className="sm:grid-cols-2">
                <GlassyKeyValue
                  label="Statement digest"
                  value={
                    <CourtCopyValue
                      label="statement digest"
                      value={report.statementDigest}
                    />
                  }
                />
                <GlassyKeyValue label="Revision" value={report.revision} />
              </GlassyCompactGrid>
            </GlassyTile>
          </GlassySection>
          <GlassySection title="Evidence">
            {report.evidence.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {report.evidence.map((evidence) => (
                  <CourtEvidenceCard key={evidence.id} evidence={evidence} />
                ))}
              </div>
            ) : (
              <NoDataYetBar label="evidence records" />
            )}
          </GlassySection>
          <GlassySection title="Revision history">
            <CourtReportRevisionHistory revisions={report.revisions} />
          </GlassySection>
          <div className="flex flex-wrap justify-end gap-2">
            {report.caseId ? (
              <Button asChild variant="outline">
                <Link to={`/app/courts/${encodeURIComponent(report.caseId)}`}>
                  Open case
                </Link>
              </Button>
            ) : null}
            {report.actions.withdraw ? (
              <Button
                type="button"
                variant="ghost"
                disabled={withdrawRunner.busy !== null}
                onClick={() => setWithdrawOpen(true)}
              >
                Withdraw report
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
      <Modal
        ariaLabel="Withdraw Court report"
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        contentClassName="max-w-lg"
      >
        <GlassyTile className="space-y-4 p-5">
          <h2 className="text-lg font-semibold text-text">Withdraw report?</h2>
          <p className="text-sm leading-6 text-muted">
            This removes the report from active consideration. A Court case
            already opened from the record remains preserved.
          </p>
          <CourtActionFeedback
            actionError={withdrawRunner.actionError}
            actionField={withdrawRunner.actionField}
            notice={withdrawRunner.notice}
            refreshError={withdrawRunner.refreshError}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={withdrawRunner.busy !== null}
              onClick={() => setWithdrawOpen(false)}
            >
              Keep report
            </Button>
            <CourtAsyncButton
              type="button"
              busy={withdrawRunner.busy !== null}
              busyLabel="Withdrawing..."
              onClick={() => void withdraw()}
            >
              Withdraw report
            </CourtAsyncButton>
          </div>
        </GlassyTile>
      </Modal>
    </div>
  );
};

export default CourtReportDetail;
