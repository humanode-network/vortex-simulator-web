import { GlassySection } from "@/components/GlassySection";
import type { CourtCaseViewerV2Dto } from "@/types/api";
import { AppealActions } from "./actions/AppealActions";
import { JuryDutyActions } from "./actions/JuryDutyActions";
import { PartyCaseActions } from "./actions/PartyCaseActions";
import { ReopeningActions } from "./actions/ReopeningActions";
import type { RunCourtAction } from "./actions/actionTypes";
import { VerdictActions } from "./actions/VerdictActions";
import { CourtActionFeedback } from "./forms/CourtFormUi";
import { courtEvidenceFieldIds } from "./forms/courtEvidence";
import { courtLabel } from "./components/CourtPrimitives";
import { courtCaseDeadline } from "./model/courtPresentation";
import {
  COURT_ACTION_CAPABILITIES,
  type CourtActionCapability,
} from "./model/courtCapabilities";
import { useCourtCommandRunner } from "./hooks/useCourtCommandRunner";

const COURT_CASE_EVIDENCE_FIELD_IDS = courtEvidenceFieldIds(
  "court-case-evidence",
);

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
    ...COURT_CASE_EVIDENCE_FIELD_IDS,
    evidence: "court-evidence-statement",
    reference: COURT_CASE_EVIDENCE_FIELD_IDS.url,
    statement: "court-evidence-statement",
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

export function CourtActionPanel({
  courtCase,
  onCompleted,
}: {
  courtCase: CourtCaseViewerV2Dto;
  onCompleted: () => Promise<void>;
}) {
  const caseId = courtCase.publicCase?.id ?? "";
  const runner = useCourtCommandRunner(onCompleted, caseId);
  const can = (capability: CourtActionCapability) =>
    courtCase.capabilities[capability] === true;
  const hasActions = COURT_ACTION_CAPABILITIES.some(can);
  const actionLocked = (name: string) =>
    runner.busy !== null || runner.isConfirmed(`${caseId}:${name}`);
  const deadline = courtCaseDeadline(courtCase);

  const run: RunCourtAction = async (
    name,
    action,
    onConfirmed,
    unlockAfterRefresh = false,
  ) => {
    await runner.run({
      id: `${caseId}:${name}`,
      label: courtLabel(name),
      action,
      fieldTargets: COURT_ACTION_FIELD_TARGETS[name],
      onConfirmed,
      unlockAfterRefresh,
    });
  };

  if (!caseId || !hasActions) return null;
  const groupProps = {
    actionLocked,
    busy: runner.busy,
    can,
    caseId,
    run,
  };

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
        <JuryDutyActions key={`${caseId}:jury-duty`} {...groupProps} />
        <PartyCaseActions
          key={`${caseId}:party-case`}
          {...groupProps}
          courtCase={courtCase}
        />
        <VerdictActions
          key={`${caseId}:verdict`}
          {...groupProps}
          courtCase={courtCase}
        />
        <AppealActions
          key={`${caseId}:appeal`}
          {...groupProps}
          courtCase={courtCase}
        />
        <ReopeningActions
          key={`${caseId}:reopening`}
          {...groupProps}
          courtCase={courtCase}
        />
      </div>
    </GlassySection>
  );
}
