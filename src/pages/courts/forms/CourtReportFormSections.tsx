import { CodexHint, CodexProcedureHint } from "@/components/CodexHint";
import { GlassyTile } from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import type { CourtEvidenceInputV2 } from "@/lib/api/courtsV2";
import type {
  CourtEvidenceAccessV2Dto,
  CourtReportingCapabilityV2Dto,
  CourtTargetReferenceV2Dto,
} from "@/types/api";
import {
  courtLabel,
  CourtCopyValue,
  CourtStandingReference,
  CourtStateSummary,
  formatCourtInstant,
} from "../components/CourtPrimitives";
import {
  courtLaneDisplay,
  courtOffenseDisplay,
  courtReportRouteDescription,
} from "../model/courtPresentation";
import { courtEvidenceAccessLabel } from "./courtEvidence";

type AvailableReportingCapability = Extract<
  CourtReportingCapabilityV2Dto,
  { status: "available" }
>;

export type CourtReportReasonCapability =
  AvailableReportingCapability["reasonCapabilities"][number];

type ProtectiveReview = Extract<
  CourtReportReasonCapability["protectiveReview"],
  { eligible: true }
>;

export function CourtPendingEvidenceList({
  evidence,
  onRemove,
}: {
  evidence: readonly Readonly<{
    key: string;
    value: CourtEvidenceInputV2;
  }>[];
  onRemove: (key: string) => void;
}) {
  if (!evidence.length) return null;

  return (
    <div className="grid gap-2" aria-label="Evidence records ready to submit">
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
              label={`evidence ${index + 1} ${item.value.digest ? "digest" : "URL"}`}
              value={
                item.value.digest ??
                (item.value.kind === "external_url"
                  ? item.value.url
                  : "Fingerprint created on submission")
              }
            />
          </div>
          <Button
            type="button"
            size="compact"
            variant="ghost"
            onClick={() => onRemove(item.key)}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}

export function CourtProtectiveReviewRequest({
  review,
  requested,
  onChange,
}: {
  review: ProtectiveReview;
  requested: boolean;
  onChange: (requested: boolean) => void;
}) {
  return (
    <div className="space-y-2 border-t border-border/70 pt-4">
      <label className="flex items-center gap-2 text-sm text-text">
        <input
          id="court-report-protective-review"
          type="checkbox"
          checked={requested}
          onChange={(event) => onChange(event.target.checked)}
        />
        Request immediate protective review
      </label>
      <p className="text-sm leading-6 text-muted">
        This temporary, non-punitive review lasts up to{" "}
        {Math.round(review.durationSeconds / 3_600)} hours and is assigned to{" "}
        {review.authorityIds.join(", ")}. It does not establish guilt or choose
        a punishment.
      </p>
    </div>
  );
}

export function CourtReportReview({
  evidenceCount,
  goodFaithAttested,
  incidentEndsAt,
  incidentStartsAt,
  onGoodFaithAttestedChange,
  protectiveReviewRequested,
  selectedReason,
  statementAccess,
  statementLength,
  target,
}: {
  evidenceCount: number;
  goodFaithAttested: boolean;
  incidentEndsAt: string;
  incidentStartsAt: string;
  onGoodFaithAttestedChange: (attested: boolean) => void;
  protectiveReviewRequested: boolean;
  selectedReason: CourtReportReasonCapability | undefined;
  statementAccess: CourtEvidenceAccessV2Dto;
  statementLength: number;
  target: CourtTargetReferenceV2Dto;
}) {
  return (
    <GlassyTile className="space-y-4">
      {selectedReason ? (
        <CourtStateSummary
          description={`${courtOffenseDisplay(selectedReason.reason.offenseCode).description} ${courtReportRouteDescription(selectedReason.reason.lane, selectedReason.standing)}`}
          label={
            <>
              <CodexHint reference={selectedReason.reason.offenseCode}>
                {courtOffenseDisplay(selectedReason.reason.offenseCode).label}
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
        <p>Incident: {formatCourtInstant(incidentStartsAt)}</p>
        <p>
          Incident end:{" "}
          {incidentEndsAt ? formatCourtInstant(incidentEndsAt) : "Ongoing"}
        </p>
        <p>Statement: {statementLength} characters</p>
        <p>Statement access: {courtEvidenceAccessLabel(statementAccess)}</p>
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
          Evidence: {evidenceCount} referenced{" "}
          {evidenceCount === 1 ? "record" : "records"}
        </p>
        <p>
          Protective review:{" "}
          {protectiveReviewRequested ? "Requested" : "Not requested"}
        </p>
      </div>
      <label className="flex items-start gap-2 text-sm leading-6 text-text">
        <input
          id="court-report-good-faith"
          className="mt-1"
          type="checkbox"
          checked={goodFaithAttested}
          onChange={(event) => onGoodFaithAttestedChange(event.target.checked)}
          required
        />
        I attest that this report is made in good faith and that the facts are
        accurate to the best of my knowledge.
      </label>
    </GlassyTile>
  );
}
