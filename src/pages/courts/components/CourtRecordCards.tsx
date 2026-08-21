import { Link } from "react-router";

import {
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
import type { CourtCaseViewerV2Dto, CourtMyReportItemV2Dto } from "@/types/api";
import {
  courtCaseDeadline,
  courtCaseStateDisplay,
  courtLaneDisplay,
  courtOffenseDisplay,
  courtReportStateDisplay,
  courtSnapshotTitle,
} from "../model/courtPresentation";
import {
  CourtCopyValue,
  CourtDeadline,
  CourtReportActionStatus,
  CourtStandingReference,
  courtLabel,
  courtTone,
  formatCourtInstant,
} from "./CourtPrimitives";

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
  const state = courtReportStateDisplay(report.state, report.lane);
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
      <CourtReportActionStatus report={report} />
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
        {report.respondentId ? (
          <GlassyKeyValue
            label="Respondent"
            value={
              <CourtCopyValue
                label="respondent address"
                value={report.respondentId}
              />
            }
          />
        ) : null}
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
