import { useCallback } from "react";
import { Link, useParams } from "react-router";

import { AddressInline } from "@/components/AddressInline";
import {
  GlassyCompactGrid,
  GlassyKeyValue,
  GlassySection,
  GlassyStatusChip,
  GlassyTile,
} from "@/components/GlassySection";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHeader } from "@/components/PageHeader";
import {
  CodexHint,
  CodexPolicyHint,
  CodexProcedureHint,
  CodexSeverityHint,
} from "@/components/CodexHint";
import { PageHint } from "@/components/PageHint";
import { Button } from "@/components/primitives/button";
import { apiCourtCaseV2 } from "@/lib/apiClient";
import type { CourtCaseViewerV2Dto } from "@/types/api";
import { CourtActionPanel } from "./CourtActionPanel";
import {
  courtLabel,
  CourtAppellateBrief,
  CourtAppealSummary,
  CourtDeadline,
  CourtEvidenceCard,
  CourtFinalDecisionSummary,
  CourtRemedySummary,
  CourtCopyValue,
  CourtStateSummary,
  CourtTargetPreview,
  CourtTimeline,
  courtTone,
  formatCourtInstant,
} from "./courtUi";
import {
  courtCaseDeadline,
  courtCaseStateDisplay,
  courtOffenseDisplay,
} from "./courtPresentation";
import { CourtsUnavailable } from "./CourtsUnavailable";
import { useCourtRuntime } from "./useCourtRuntime";
import { useCourtRecord } from "./useCourtRecord";

const Courtroom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const runtime = useCourtRuntime();
  const loadCase = useCallback(async () => {
    if (!id) throw new Error("Case id is missing.");
    return await apiCourtCaseV2(id);
  }, [id]);
  const caseRecord = useCourtRecord<CourtCaseViewerV2Dto>({
    enabled: runtime.status === "available" && Boolean(id),
    load: loadCase,
  });
  const record = caseRecord.data;

  if (runtime.status !== "available") {
    return (
      <CourtsUnavailable
        checking={runtime.status === "checking"}
        failed={runtime.status === "failed"}
        onRetry={runtime.retry}
        pageId="courtroom"
        title="Courtroom"
        reason={
          runtime.status === "unavailable" || runtime.status === "failed"
            ? runtime.reason
            : undefined
        }
      />
    );
  }

  const courtCase = record?.publicCase;
  const allegation = record?.caseRecord
    ? courtOffenseDisplay(record.caseRecord.allegationCode)
    : courtOffenseDisplay(courtCase?.offenseCode);
  const deadline = record ? courtCaseDeadline(record) : null;
  const finalDecision =
    record?.caseRecord?.finalDecision ?? courtCase?.finalDecision ?? null;
  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="courtroom" />
      <PageHeader
        eyebrow={
          courtCase ? `${courtLabel(courtCase.domain)} case` : "Court case"
        }
        title={
          <CodexHint
            reference={
              record?.caseRecord?.allegationCode ?? courtCase?.offenseCode ?? ""
            }
          >
            {allegation.label}
          </CodexHint>
        }
        description={courtCase ? "Governance case record" : (id ?? "Not set")}
        right={
          <Button asChild size="sm" variant="outline">
            <Link to="/app/courts">All cases</Link>
          </Button>
        }
      />

      {caseRecord.error && record ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-border/70 p-3">
          <p className="text-sm text-destructive" role="alert">
            The case below may be stale: {caseRecord.error}
          </p>
          <Button
            size="compact"
            variant="outline"
            onClick={() => void caseRecord.reload().catch(() => undefined)}
          >
            Retry case
          </Button>
        </div>
      ) : caseRecord.error ? (
        <div className="space-y-2">
          <NoDataYetBar label="case" description={caseRecord.error} />
          <Button
            size="compact"
            variant="outline"
            onClick={() => void caseRecord.reload().catch(() => undefined)}
          >
            Retry case
          </Button>
        </div>
      ) : null}
      {caseRecord.loading && !record ? (
        <NoDataYetBar label="case record" description="Loading case..." />
      ) : null}
      {record && !courtCase ? (
        <NoDataYetBar
          label="case access"
          description="No Court record is visible to this viewer."
        />
      ) : null}

      {courtCase ? (
        <>
          <GlassySection title="Case overview">
            <GlassyTile className="space-y-4">
              <CourtStateSummary
                description={courtCaseStateDisplay(courtCase.state).description}
                label={courtCaseStateDisplay(courtCase.state).label}
                tone={courtTone(courtCase.state)}
              />
              <GlassyCompactGrid className="sm:grid-cols-2 lg:grid-cols-4">
                <GlassyKeyValue
                  label="Case id"
                  value={
                    <CourtCopyValue label="case id" value={courtCase.id} />
                  }
                />
                <GlassyKeyValue
                  label={record?.caseRecord ? "Allegation" : "Finding"}
                  value={
                    <CodexHint
                      reference={
                        record?.caseRecord?.allegationCode ??
                        courtCase.offenseCode ??
                        ""
                      }
                    >
                      {allegation.label}
                    </CodexHint>
                  }
                />
                <GlassyKeyValue
                  label="Finality"
                  value={courtLabel(courtCase.finalityState)}
                />
                <GlassyKeyValue
                  label="Opened"
                  value={formatCourtInstant(courtCase.openedAt)}
                />
                <GlassyKeyValue
                  label="Last updated"
                  value={formatCourtInstant(courtCase.updatedAt)}
                />
                {deadline ? (
                  <CourtDeadline
                    dueAt={deadline.dueAt}
                    label={deadline.label}
                  />
                ) : null}
              </GlassyCompactGrid>
              <p className="text-xs text-muted">
                Policy{" "}
                <CodexPolicyHint>{courtCase.policyVersionId}</CodexPolicyHint>
                {" · "}
                Trigger{" "}
                <CodexProcedureHint clause="HC-2.2">
                  {courtLabel(courtCase.triggerKind)}
                </CodexProcedureHint>
              </p>
            </GlassyTile>
          </GlassySection>

          {record?.caseRecord ? (
            <GlassySection title="Target and allegation">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
                <CourtTargetPreview target={record.caseRecord.target} />
                <GlassyTile className="space-y-3">
                  <p className="text-xs font-semibold text-muted uppercase">
                    Alleged conduct
                  </p>
                  <h3 className="text-lg font-semibold text-text">
                    <CodexHint reference={record.caseRecord.allegationCode}>
                      {allegation.label}
                    </CodexHint>
                  </h3>
                  <p className="text-sm leading-6 text-muted">
                    {allegation.description}
                  </p>
                  <p className="text-xs text-muted">
                    Allegation code{" "}
                    <CodexHint reference={record.caseRecord.allegationCode}>
                      {record.caseRecord.allegationCode}
                    </CodexHint>
                    . This is not a finding of guilt.
                  </p>
                  {record.caseRecord.allegation ? (
                    <GlassyKeyValue
                      label="Statement digest"
                      value={
                        <CourtCopyValue
                          label="allegation statement digest"
                          value={record.caseRecord.allegation.statementDigest}
                        />
                      }
                    />
                  ) : null}
                </GlassyTile>
              </div>
            </GlassySection>
          ) : courtCase.targetSummary ? (
            <GlassySection title="Reported record">
              <CourtTargetPreview
                target={{
                  id: courtCase.targetSummary.id,
                  route: courtCase.targetSummary.route,
                  snapshot: courtCase.targetSummary.title
                    ? { title: courtCase.targetSummary.title }
                    : {},
                  type: courtCase.targetType,
                }}
              />
            </GlassySection>
          ) : null}

          {finalDecision ? (
            <GlassySection title="Final decision">
              <CourtFinalDecisionSummary decision={finalDecision} />
            </GlassySection>
          ) : null}

          {record.appellateTask ? (
            <GlassySection title="Decision brief">
              <CourtAppellateBrief task={record.appellateTask} />
            </GlassySection>
          ) : null}

          {record.juryTask ? (
            <GlassySection title="Jury task">
              <GlassyTile className="space-y-3">
                <GlassyStatusChip tone={courtTone(record.juryTask.state)}>
                  {courtLabel(record.juryTask.state)}
                </GlassyStatusChip>
                <GlassyCompactGrid className="grid-cols-2">
                  <GlassyKeyValue
                    label="Round"
                    value={record.juryTask.selectionRound}
                  />
                  <GlassyKeyValue
                    label="Seat"
                    value={record.juryTask.seatNumber ?? "Pending"}
                  />
                  <GlassyKeyValue
                    label="Conflict review"
                    value={courtLabel(record.juryTask.conflictResult)}
                  />
                  {record.juryTask.ballot ? (
                    <CourtDeadline
                      dueAt={record.juryTask.ballot.closesAt}
                      label="Ballot due"
                    />
                  ) : null}
                </GlassyCompactGrid>
                {record.juryTask.ballot?.existingVote ? (
                  <p className="text-sm text-muted">
                    Current recorded vote:{" "}
                    {courtLabel(record.juryTask.ballot.existingVote.choice)}
                    {record.juryTask.ballot.existingVote.severity ? (
                      <>
                        {" · "}
                        <CodexSeverityHint
                          code={record.juryTask.ballot.existingVote.severity}
                        >
                          {record.juryTask.ballot.existingVote.severity}
                        </CodexSeverityHint>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </GlassyTile>
            </GlassySection>
          ) : null}

          {record ? (
            <CourtActionPanel
              key={`${courtCase.state}-${record.juryTask?.ballot?.id ?? "no-ballot"}-${record.juryTask?.ballot?.existingVote?.revision ?? "no-vote"}-${record.appellateTask?.panelId ?? "no-panel"}-${record.appellateTask?.panelState ?? "no-panel-state"}`}
              courtCase={record}
              onCompleted={caseRecord.reload}
            />
          ) : null}

          {record.partyRecord ? (
            <GlassySection title="Parties and procedure">
              <div className="grid gap-4 lg:grid-cols-2">
                {record.partyRecord.parties.map((party) => (
                  <GlassyTile
                    key={`${party.address}-${party.role}`}
                    className="space-y-2"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted uppercase">
                        {courtLabel(party.role)}
                      </p>
                      <AddressInline address={party.address} size={7} />
                    </div>
                    <GlassyStatusChip tone={courtTone(party.state)}>
                      {courtLabel(party.state)}
                    </GlassyStatusChip>
                  </GlassyTile>
                ))}
              </div>
            </GlassySection>
          ) : null}

          <GlassySection title="Evidence">
            {record.evidence.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {record.evidence.map((evidence) => (
                  <CourtEvidenceCard key={evidence.id} evidence={evidence} />
                ))}
              </div>
            ) : (
              <NoDataYetBar label="visible evidence" />
            )}
          </GlassySection>

          {record?.caseRecord?.events.length ? (
            <GlassySection title="Case history">
              <CourtTimeline events={record.caseRecord.events} />
            </GlassySection>
          ) : null}

          <GlassySection title="Remedies and appeals">
            {courtCase.remedies.length || courtCase.appeals.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {courtCase.remedies.map((remedy) => (
                  <CourtRemedySummary key={remedy.id} remedy={remedy} />
                ))}
                {courtCase.appeals.map((appeal) => (
                  <CourtAppealSummary key={appeal.id} appeal={appeal} />
                ))}
              </div>
            ) : (
              <NoDataYetBar label="remedies or appeals" />
            )}
          </GlassySection>
        </>
      ) : null}
    </div>
  );
};

export default Courtroom;
