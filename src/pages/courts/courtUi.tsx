import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Check, CircleAlert, Copy, ExternalLink } from "lucide-react";

import { ProposalNarrative } from "@/components/ProposalNarrative";
import {
  CodexEvidenceHint,
  CodexHint,
  CodexProcedureHint,
  CodexSeverityHint,
} from "@/components/CodexHint";
import {
  GlassyCompactGrid,
  GlassyKeyValue,
  GlassyStatusChip,
  GlassyTile,
  GlassyTileHeading,
} from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { safeExternalHref } from "@/lib/safeExternalHref";
import type {
  CourtCaseViewerV2Dto,
  CourtAppealV2Dto,
  CourtMyReportItemV2Dto,
  CourtPrivateReportV2Dto,
  CourtRemedyV2Dto,
} from "@/types/api";
import {
  courtAppealGroundDisplay,
  compactCourtAuditValue,
  courtCaseDeadline,
  courtCaseStateDisplay,
  courtEventDisplay,
  courtEventFacts,
  courtLaneDisplay,
  courtOffenseDisplay,
  courtReportStateDisplay,
  courtRemedyExpiry,
  courtRemedyLabel,
  courtSnapshotTitle,
  courtStandingDisplay,
  formatCourtDuration,
} from "./courtPresentation";

export function courtLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function CourtCopyValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 1_800);
    return () => window.clearTimeout(timer);
  }, [status]);
  const feedback =
    status === "copied"
      ? `${label} copied`
      : status === "failed"
        ? `${label} could not be copied`
        : "";
  const visibleValue = compactCourtAuditValue(value);
  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1">
      <span
        aria-label={`${label}: ${value}`}
        className="max-w-full min-w-0 overflow-hidden font-mono text-xs text-ellipsis whitespace-nowrap text-text"
        title={value}
      >
        {visibleValue}
      </span>
      <button
        type="button"
        className="hover:bg-surface-alt inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition hover:text-text"
        aria-label={status === "copied" ? `${label} copied` : `Copy ${label}`}
        title={
          status === "copied"
            ? "Copied"
            : status === "failed"
              ? "Copy failed"
              : `Copy ${label}`
        }
        onClick={async () => {
          try {
            if (!navigator.clipboard) throw new Error("Clipboard unavailable");
            await navigator.clipboard.writeText(value);
            setStatus("copied");
          } catch {
            setStatus("failed");
          }
        }}
      >
        {status === "copied" ? (
          <Check className="h-3.5 w-3.5" />
        ) : status === "failed" ? (
          <CircleAlert className="h-3.5 w-3.5 text-destructive" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {feedback}
      </span>
    </span>
  );
}

export function CourtStandingReference({
  direct,
  source,
}: {
  direct: boolean;
  source: string;
}) {
  const standing = courtStandingDisplay({ direct, source });
  return (
    <>
      <CodexProcedureHint clause="HC-2.2">{standing.label}</CodexProcedureHint>
      <span className="font-normal text-muted">
        {` · ${standing.verification}`}
      </span>
    </>
  );
}

export function courtTone(
  value: string,
): "danger" | "neutral" | "ok" | "primary" | "warn" {
  if (["final", "applied", "confirmed", "accepted"].includes(value))
    return "ok";
  if (["failed"].includes(value)) return "danger";
  if (
    [
      "appealed",
      "appeal_window",
      "awaiting_jury_capacity",
      "needs_amendment",
      "remanded",
    ].includes(value)
  ) {
    return "warn";
  }
  if (
    [
      "jury_selection",
      "finding_ballot",
      "sentence_ballot",
      "triggered",
    ].includes(value)
  ) {
    return "primary";
  }
  return "neutral";
}

export function formatCourtInstant(value: string | null): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleString();
}

export function CourtDeadline({
  dueAt,
  label,
  state = "due",
}: {
  dueAt: string;
  label: string;
  state?: "completed" | "due" | "overdue";
}) {
  const stateLabel =
    state === "completed"
      ? "Completed"
      : state === "overdue"
        ? "Overdue"
        : "Due";
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="text-xs text-muted">{label}</p>
        <GlassyStatusChip
          className="shrink-0"
          tone={
            state === "overdue"
              ? "danger"
              : state === "completed"
                ? "ok"
                : "warn"
          }
        >
          {stateLabel}
        </GlassyStatusChip>
      </div>
      <time className="block text-sm font-medium text-text" dateTime={dueAt}>
        {formatCourtInstant(dueAt)}
      </time>
    </div>
  );
}

export function CourtStateSummary({
  description,
  label,
  tone,
}: {
  description: string;
  label: ReactNode;
  tone: ReturnType<typeof courtTone>;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <p className="max-w-3xl min-w-0 text-sm leading-6 text-muted">
        {description}
      </p>
      <GlassyStatusChip className="shrink-0" tone={tone}>
        {label}
      </GlassyStatusChip>
    </div>
  );
}

export function CourtCollectionNotice({
  error,
  label,
  loading,
  onRetry,
}: {
  error: string | null;
  label: string;
  loading: boolean;
  onRetry: () => void;
}) {
  if (loading) {
    return <NoDataYetBar label={label} description={`Loading ${label}...`} />;
  }
  if (!error) return null;
  return (
    <div className="space-y-2">
      <NoDataYetBar label={label} description={error} />
      <Button size="compact" variant="outline" onClick={onRetry}>
        Retry {label}
      </Button>
    </div>
  );
}

export function CourtTargetPreview({
  target,
}: {
  target: {
    accessClass?: "private" | "public" | "sealed";
    canonicalRoute?: string | null;
    digest?: string;
    id?: string;
    revision?: string;
    route?: string | null;
    snapshotPayload?: Record<string, unknown>;
    snapshot?: Record<string, unknown>;
    type?: string;
  };
}) {
  const snapshot = target.snapshotPayload ?? target.snapshot ?? {};
  const title = courtSnapshotTitle(snapshot);
  const route = target.canonicalRoute ?? target.route;
  return (
    <GlassyTile className="space-y-4">
      <div className="space-y-1">
        <GlassyTileHeading>{title ?? "Reported record"}</GlassyTileHeading>
        {target.type ? (
          <p className="text-sm text-muted">{courtLabel(target.type)}</p>
        ) : null}
      </div>
      <GlassyCompactGrid className="sm:grid-cols-2">
        {target.id ? (
          <GlassyKeyValue
            className="flex-col items-start gap-1"
            label="Target id"
            value={<CourtCopyValue label="target id" value={target.id} />}
          />
        ) : null}
        {target.revision ? (
          <GlassyKeyValue
            className="flex-col items-start gap-1"
            label="Revision"
            value={
              <CourtCopyValue label="target revision" value={target.revision} />
            }
          />
        ) : null}
        {target.digest ? (
          <GlassyKeyValue
            className="flex-col items-start gap-1"
            label="Snapshot digest"
            value={
              <CourtCopyValue label="snapshot digest" value={target.digest} />
            }
          />
        ) : null}
        {target.accessClass ? (
          <GlassyKeyValue
            className="flex-col items-start gap-1"
            label="Access"
            value={courtLabel(target.accessClass)}
          />
        ) : null}
      </GlassyCompactGrid>
      {route ? (
        <div className="flex justify-end">
          <Button asChild size="compact" variant="outline">
            <Link to={route}>Open reported record</Link>
          </Button>
        </div>
      ) : null}
    </GlassyTile>
  );
}

export function CourtEvidenceCard({
  evidence,
}: {
  evidence: CourtCaseViewerV2Dto["evidence"][number];
}) {
  const description =
    typeof evidence.metadata.description === "string"
      ? evidence.metadata.description
      : null;
  const body =
    typeof evidence.metadata.body === "string" && evidence.metadata.body.trim()
      ? evidence.metadata.body.trim()
      : null;
  const reference =
    typeof evidence.metadata.reference === "string"
      ? evidence.metadata.reference
      : typeof evidence.metadata.url === "string"
        ? evidence.metadata.url
        : null;
  return (
    <GlassyTile className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <GlassyTileHeading>{courtLabel(evidence.kind)}</GlassyTileHeading>
        <GlassyStatusChip tone={courtTone(evidence.state)}>
          {courtLabel(evidence.state)}
        </GlassyStatusChip>
      </div>
      {body ? <ProposalNarrative value={body} /> : null}
      {description && description.trim() !== body ? (
        <p className="text-sm leading-6 text-text">{description}</p>
      ) : null}
      <GlassyCompactGrid className="sm:grid-cols-2">
        <GlassyKeyValue
          label="Provenance"
          value={courtLabel(evidence.provenance)}
        />
        <GlassyKeyValue
          label="Access"
          value={
            evidence.accessClass
              ? courtLabel(evidence.accessClass)
              : "Private Court record"
          }
        />
        <GlassyKeyValue
          className="flex-col items-start gap-1"
          label="Digest"
          value={
            <CourtCopyValue label="evidence digest" value={evidence.digest} />
          }
        />
        <GlassyKeyValue
          label="Added"
          value={formatCourtInstant(evidence.createdAt)}
        />
      </GlassyCompactGrid>
      {reference ? <CourtEvidenceReference reference={reference} /> : null}
    </GlassyTile>
  );
}

export function CourtFinalDecisionSummary({
  decision,
}: {
  decision: NonNullable<
    NonNullable<CourtCaseViewerV2Dto["publicCase"]>["finalDecision"]
  >;
}) {
  return (
    <GlassyTile className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <GlassyTileHeading>Recorded decision</GlassyTileHeading>
        <GlassyStatusChip tone={courtTone(decision.outcome)}>
          {courtLabel(decision.outcome)}
        </GlassyStatusChip>
      </div>
      <GlassyCompactGrid className="sm:grid-cols-2 lg:grid-cols-4">
        <GlassyKeyValue
          label="Severity"
          value={
            decision.severity ? (
              <CodexSeverityHint code={decision.severity}>
                {decision.severity}
              </CodexSeverityHint>
            ) : (
              "Not applicable"
            )
          }
        />
        <GlassyKeyValue
          label="Evidence standard"
          value={
            decision.evidenceStandard ? (
              <CodexEvidenceHint code={decision.evidenceStandard}>
                {decision.evidenceStandard}
              </CodexEvidenceHint>
            ) : (
              "Not applicable"
            )
          }
        />
        <GlassyKeyValue
          label="Finding support"
          value={`${decision.support} of 12`}
        />
        <GlassyKeyValue
          label="Decided"
          value={formatCourtInstant(decision.decidedAt)}
        />
        <GlassyKeyValue
          label="Appeal result"
          value={
            decision.appellateOutcome
              ? courtLabel(decision.appellateOutcome)
              : "No appellate result"
          }
        />
        {decision.calculation ? (
          <>
            <GlassyKeyValue
              label="Sentence authorization"
              value={`${decision.calculation.authorizationSupport} of 12`}
            />
            <GlassyKeyValue
              className="flex-col items-start gap-1"
              label="Calculation digest"
              value={
                <CourtCopyValue
                  label="calculation digest"
                  value={decision.calculation.digest}
                />
              }
            />
          </>
        ) : null}
      </GlassyCompactGrid>
    </GlassyTile>
  );
}

export function CourtRemedySummary({ remedy }: { remedy: CourtRemedyV2Dto }) {
  const expiresAt = courtRemedyExpiry(remedy);
  return (
    <GlassyTile className="space-y-2">
      <GlassyStatusChip tone={courtTone(remedy.state)}>
        {courtLabel(remedy.state)}
      </GlassyStatusChip>
      <GlassyKeyValue
        label="Remedy"
        value={
          <CodexHint reference={remedy.componentCode}>
            {courtRemedyLabel(remedy.componentCode)}
          </CodexHint>
        }
      />
      <GlassyKeyValue
        label="Scope"
        value={remedy.scopeCode ? courtLabel(remedy.scopeCode) : "System-wide"}
      />
      <GlassyKeyValue
        label="Duration"
        value={formatCourtDuration(remedy.durationSeconds)}
      />
      <GlassyKeyValue label="Support" value={`${remedy.support} of 12`} />
      {remedy.quantitativeValue ? (
        <GlassyKeyValue
          label="Applied value"
          value={remedy.quantitativeValue}
        />
      ) : null}
      <GlassyKeyValue
        label="Executor"
        value={`${courtLabel(remedy.executorId)} · ${remedy.executorVersion}`}
      />
      <GlassyKeyValue
        label="During appeal"
        value={courtLabel(remedy.appealBehavior)}
      />
      <GlassyKeyValue
        label="Created"
        value={formatCourtInstant(remedy.createdAt)}
      />
      {expiresAt ? (
        <GlassyKeyValue
          label="Scheduled end"
          value={formatCourtInstant(expiresAt)}
        />
      ) : null}
    </GlassyTile>
  );
}

export function CourtAppealSummary({ appeal }: { appeal: CourtAppealV2Dto }) {
  const ground = courtAppealGroundDisplay(appeal.groundCode);
  return (
    <GlassyTile className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <GlassyTileHeading>{ground.label}</GlassyTileHeading>
        <GlassyStatusChip tone={courtTone(appeal.status)}>
          {courtLabel(appeal.status)}
        </GlassyStatusChip>
      </div>
      <p className="text-sm leading-6 text-muted">{ground.description}</p>
      <GlassyCompactGrid className="sm:grid-cols-2">
        <GlassyKeyValue label="Stay" value={courtLabel(appeal.stayState)} />
        <GlassyKeyValue
          label="Filed"
          value={formatCourtInstant(appeal.filedAt)}
        />
        <GlassyKeyValue
          label="Result"
          value={appeal.result ? courtLabel(appeal.result) : "Pending"}
        />
        <CourtDeadline
          dueAt={appeal.deadlineAt}
          label="Appeal deadline"
          state={appeal.decidedAt || appeal.withdrawnAt ? "completed" : "due"}
        />
      </GlassyCompactGrid>
      <CourtCopyValue
        label="appeal grounds digest"
        value={appeal.groundsDigest}
      />
    </GlassyTile>
  );
}

export function CourtAppellateBrief({
  task,
}: {
  task: NonNullable<CourtCaseViewerV2Dto["appellateTask"]>;
}) {
  const brief = task.brief;
  if (brief.kind === "ordinary") {
    const ground = courtAppealGroundDisplay(brief.groundCode);
    return (
      <GlassyTile className="space-y-4">
        <div className="space-y-1">
          <GlassyTileHeading>Appeal brief</GlassyTileHeading>
          <p className="text-sm text-muted">{ground.description}</p>
        </div>
        <GlassyCompactGrid className="sm:grid-cols-2 lg:grid-cols-4">
          <GlassyKeyValue label="Ground" value={ground.label} />
          <GlassyKeyValue label="Stay" value={courtLabel(brief.stayState)} />
          <GlassyKeyValue
            label="Filed"
            value={formatCourtInstant(brief.filedAt)}
          />
          <CourtDeadline label="Decision due" dueAt={brief.deadlineAt} />
          <GlassyKeyValue
            label="Grounds digest"
            value={
              <CourtCopyValue
                label="appeal grounds digest"
                value={brief.groundsDigest}
              />
            }
          />
        </GlassyCompactGrid>
        <ProposalNarrative value={brief.grounds} />
      </GlassyTile>
    );
  }
  return (
    <GlassyTile className="space-y-4">
      <div className="space-y-1">
        <GlassyTileHeading>Reopening brief</GlassyTileHeading>
        <p className="text-sm text-muted">
          Verified evidence offered after the final decision.
        </p>
      </div>
      <GlassyCompactGrid className="sm:grid-cols-2 lg:grid-cols-4">
        <GlassyKeyValue label="Basis" value={courtLabel(brief.basis)} />
        <GlassyKeyValue
          label="Filed"
          value={formatCourtInstant(brief.filedAt)}
        />
        <GlassyKeyValue
          label="Verified"
          value={formatCourtInstant(brief.verifiedAt)}
        />
        <GlassyKeyValue
          label="Verifier"
          value={
            <CourtCopyValue label="verifier id" value={brief.verifierId} />
          }
        />
        <GlassyKeyValue
          label="Evidence digest"
          value={
            <CourtCopyValue
              label="reopening evidence digest"
              value={brief.evidenceDigest}
            />
          }
        />
      </GlassyCompactGrid>
      <ProposalNarrative value={brief.statement} />
      <CourtEvidenceReference reference={brief.evidenceReference} />
    </GlassyTile>
  );
}

export function CourtTimeline({
  events,
}: {
  events: NonNullable<CourtCaseViewerV2Dto["caseRecord"]>["events"];
}) {
  if (!events.length) return null;
  return (
    <ol className="grid gap-3">
      {[...events]
        .sort((left, right) => right.sequence - left.sequence)
        .map((event) => {
          const display = courtEventDisplay(event.eventType);
          const facts = courtEventFacts(event.payload);
          return (
            <li key={event.sequence}>
              <GlassyTile className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text">
                      {display.label}
                    </p>
                    {event.previousState || event.nextState ? (
                      <p className="text-xs leading-5 text-muted">
                        {display.description}
                        {event.previousState && event.nextState
                          ? ` Moved from ${courtLabel(event.previousState)} to ${courtLabel(event.nextState)}.`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                  <time
                    className="shrink-0 text-xs text-muted"
                    dateTime={event.createdAt}
                  >
                    {formatCourtInstant(event.createdAt)}
                  </time>
                </div>
                {facts.length ? (
                  <GlassyCompactGrid className="sm:grid-cols-2 lg:grid-cols-4">
                    {facts.map((fact) => (
                      <GlassyKeyValue
                        key={`${event.sequence}-${fact.label}`}
                        label={fact.label}
                        value={
                          fact.reference ? (
                            <CodexHint reference={fact.reference}>
                              {fact.value}
                            </CodexHint>
                          ) : (
                            fact.value
                          )
                        }
                      />
                    ))}
                  </GlassyCompactGrid>
                ) : null}
              </GlassyTile>
            </li>
          );
        })}
    </ol>
  );
}

export function CourtReportRevisionHistory({
  revisions,
}: {
  revisions: CourtPrivateReportV2Dto["revisions"];
}) {
  if (!revisions.length) return null;
  return (
    <ol className="grid gap-3">
      {[...revisions]
        .sort((left, right) => right.revision - left.revision)
        .map((revision) => (
          <li key={revision.revision}>
            <GlassyTile className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-text">
                  Revision {revision.revision} - {courtLabel(revision.kind)}
                </p>
                <p className="text-xs leading-5 text-muted">
                  {revision.previousState
                    ? `${courtReportStateDisplay(revision.previousState).label} to `
                    : "Opened as "}
                  {courtReportStateDisplay(revision.nextState).label}
                </p>
                <CourtCopyValue
                  label={`revision ${revision.revision} statement digest`}
                  value={revision.statementDigest}
                />
              </div>
              <time
                className="shrink-0 text-xs text-muted"
                dateTime={revision.createdAt}
              >
                {formatCourtInstant(revision.createdAt)}
              </time>
            </GlassyTile>
          </li>
        ))}
    </ol>
  );
}

function CourtEvidenceReference({ reference }: { reference: string }) {
  const href = safeExternalHref(reference);
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted">
      <span>Reference</span>
      {href ? (
        <a
          className="inline-flex min-w-0 items-center gap-1 break-all text-primary hover:underline"
          href={href}
          rel="noreferrer"
          target="_blank"
        >
          {reference}
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      ) : (
        <CourtCopyValue label="evidence reference" value={reference} />
      )}
    </div>
  );
}

export function CourtCaseCard({ item }: { item: CourtCaseViewerV2Dto }) {
  const courtCase = item.publicCase;
  if (!courtCase) return null;
  const state = courtCaseStateDisplay(courtCase.state);
  const offense = courtOffenseDisplay(courtCase.offenseCode);
  const finalDecision = courtCase.finalDecision;
  const deadline = courtCaseDeadline(item);
  const targetTitle =
    item.publicCase?.targetSummary?.title ??
    (item.caseRecord
      ? courtSnapshotTitle(item.caseRecord.target.snapshotPayload)
      : null);
  return (
    <GlassyTile className="flex min-h-56 flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <GlassyTileHeading>
            {targetTitle ?? (
              <CodexHint reference={courtCase.offenseCode ?? ""}>
                {offense.label}
              </CodexHint>
            )}
          </GlassyTileHeading>
          <p className="text-xs text-muted">
            {courtLabel(courtCase.domain)} case
          </p>
          <CourtCopyValue label="case id" value={courtCase.id} />
        </div>
        <GlassyStatusChip tone={courtTone(courtCase.state)}>
          {state.label}
        </GlassyStatusChip>
      </div>
      <p className="text-sm leading-6 text-muted">{state.description}</p>
      <GlassyCompactGrid className="grid-cols-2">
        <GlassyKeyValue
          label={finalDecision ? "Outcome" : "Allegation"}
          value={
            finalDecision ? (
              <>
                {courtLabel(finalDecision.outcome)}
                {finalDecision.severity ? (
                  <>
                    {" · "}
                    <CodexSeverityHint code={finalDecision.severity}>
                      {finalDecision.severity}
                    </CodexSeverityHint>
                  </>
                ) : null}
              </>
            ) : (
              <CodexHint reference={courtCase.offenseCode ?? ""}>
                {offense.label}
              </CodexHint>
            )
          }
        />
        {finalDecision ? (
          <GlassyKeyValue
            label="Offense record"
            value={
              <CodexHint reference={courtCase.offenseCode ?? ""}>
                {offense.label}
              </CodexHint>
            }
          />
        ) : null}
        <GlassyKeyValue
          label="Finality"
          value={courtLabel(courtCase.finalityState)}
        />
        <GlassyKeyValue
          label="Opened"
          value={formatCourtInstant(courtCase.openedAt)}
        />
        <GlassyKeyValue
          label="Updated"
          value={formatCourtInstant(courtCase.updatedAt)}
        />
        {deadline ? (
          <CourtDeadline dueAt={deadline.dueAt} label={deadline.label} />
        ) : null}
      </GlassyCompactGrid>
      <div className="mt-auto flex justify-end">
        <Button asChild size="compact" variant="ghost">
          <Link to={`/app/courts/${encodeURIComponent(courtCase.id)}`}>
            Open case
          </Link>
        </Button>
      </div>
    </GlassyTile>
  );
}

export function CourtReportCard({
  report,
}: {
  report: CourtMyReportItemV2Dto;
}) {
  const offense = courtOffenseDisplay(report.offenseCode);
  const state = courtReportStateDisplay(report.state);
  const lane = courtLaneDisplay(report.lane);
  return (
    <GlassyTile className="flex min-h-56 flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <GlassyTileHeading>
            <CodexHint reference={report.offenseCode}>
              {offense.label}
            </CodexHint>
          </GlassyTileHeading>
          <p className="text-xs text-muted">{courtLabel(report.target.type)}</p>
          <CourtCopyValue label="target id" value={report.target.id} />
        </div>
        <GlassyStatusChip tone={courtTone(report.state)}>
          {state.label}
        </GlassyStatusChip>
      </div>
      <p className="text-sm leading-6 text-muted">{state.description}</p>
      <GlassyCompactGrid className="grid-cols-2">
        <GlassyKeyValue
          label="Lane"
          value={
            <CodexProcedureHint clause="HC-2.1">
              {lane.label}
            </CodexProcedureHint>
          }
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
          label="Updated"
          value={formatCourtInstant(report.updatedAt)}
        />
        {report.amendmentDueAt ? (
          <CourtDeadline
            dueAt={report.amendmentDueAt}
            label="Amendment deadline"
            state={report.amendmentDeadlineState ?? "due"}
          />
        ) : null}
      </GlassyCompactGrid>
      <div className="mt-auto flex flex-wrap justify-end gap-2">
        {report.target.route ? (
          <Button asChild size="compact" variant="outline">
            <Link to={report.target.route}>Open record</Link>
          </Button>
        ) : null}
        {report.caseId ? (
          <Button asChild size="compact" variant="ghost">
            <Link to={`/app/courts/${encodeURIComponent(report.caseId)}`}>
              Open case
            </Link>
          </Button>
        ) : null}
        <Button asChild size="compact" variant="ghost">
          <Link to={`/app/courts/reports/${encodeURIComponent(report.id)}`}>
            View report
          </Link>
        </Button>
      </div>
    </GlassyTile>
  );
}
