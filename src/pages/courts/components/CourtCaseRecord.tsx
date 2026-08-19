import { ExternalLink } from "lucide-react";

import {
  CodexEvidenceHint,
  CodexHint,
  CodexSeverityHint,
} from "@/components/CodexHint";
import {
  GlassyCompactGrid,
  GlassyKeyValue,
  GlassyStatusChip,
  GlassyTile,
  GlassyTileHeading,
} from "@/components/GlassySection";
import { ProposalNarrative } from "@/components/ProposalNarrative";
import { HUMANODE_CODEX_JURY_SIZE } from "@/data/humanodeCodex";
import { safeExternalHref } from "@/lib/safeExternalHref";
import type {
  CourtAppealV2Dto,
  CourtCaseViewerV2Dto,
  CourtPrivateReportV2Dto,
  CourtRemedyV2Dto,
} from "@/types/api";
import {
  courtAppealGroundDisplay,
  courtEventDisplay,
  courtEventFacts,
  courtReportStateDisplay,
  courtRemedyExpiry,
  courtRemedyLabel,
  formatCourtDuration,
} from "../model/courtPresentation";
import {
  CourtCopyValue,
  CourtDeadline,
  courtLabel,
  courtTone,
  formatCourtInstant,
} from "./CourtPrimitives";

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
          value={`${decision.support} of ${HUMANODE_CODEX_JURY_SIZE}`}
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
              value={`${decision.calculation.authorizationSupport} of ${HUMANODE_CODEX_JURY_SIZE}`}
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
      <GlassyKeyValue
        label="Support"
        value={`${remedy.support} of ${HUMANODE_CODEX_JURY_SIZE}`}
      />
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
  if (!brief) return null;
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
