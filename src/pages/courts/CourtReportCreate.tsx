import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import { GlassySection, GlassyTile } from "@/components/GlassySection";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHeader } from "@/components/PageHeader";
import { ProposalNarrativeEditor } from "@/components/ProposalNarrative";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import {
  apiCourtReportingCapabilityV2,
  apiSubmitCourtReportV2,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import type {
  CourtReportLaneV2Dto,
  CourtReportingCapabilityV2Dto,
  CourtTargetReferenceV2Dto,
} from "@/types/api";
import { courtLabel } from "./courtUi";
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
  const [incidentStartsAt, setIncidentStartsAt] = useState(() =>
    localDateTime(new Date()),
  );
  const [capability, setCapability] = useState<AvailableCapability | null>(
    null,
  );
  const [reasonKey, setReasonKey] = useState("");
  const [respondentId, setRespondentId] = useState("");
  const [affectedId, setAffectedId] = useState("");
  const [statement, setStatement] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceDigest, setEvidenceDigest] = useState("");
  const [immediateProtectionRequested, setImmediateProtectionRequested] =
    useState(false);
  const [goodFaithAttested, setGoodFaithAttested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (runtime.status !== "available" || !target) return;
    let active = true;
    void apiCourtReportingCapabilityV2({
      target,
      incidentAt: new Date(incidentStartsAt).toISOString(),
    })
      .then((result) => {
        if (!active) return;
        if (result.status !== "available") {
          setCapability(null);
          setError(result.reason);
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
        setError(null);
      })
      .catch((loadError) => {
        if (!active) return;
        setCapability(null);
        setError((loadError as Error).message);
      });
    return () => {
      active = false;
    };
  }, [incidentStartsAt, runtime.status, target]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target || !capability) return;
    const selected = capability.reasonCapabilities.find(
      ({ reason }) => `${reason.offenseCode}:${reason.lane}` === reasonKey,
    );
    if (!selected) {
      setError("Choose a report reason.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiSubmitCourtReportV2({
        target,
        offenseCode: selected.reason.offenseCode,
        lane: selected.reason.lane as CourtReportLaneV2Dto,
        respondentId: respondentId.trim() || null,
        affectedId: affectedId.trim() || null,
        incidentStartsAt: new Date(incidentStartsAt).toISOString(),
        statement: statement.trim(),
        statementAccess: "parties_and_jury",
        evidence:
          evidenceUrl.trim() && evidenceDigest.trim()
            ? [
                {
                  kind: "external_url",
                  url: evidenceUrl.trim(),
                  digest: evidenceDigest.trim(),
                  provenance: "reporter_supplied",
                  access: "parties_and_jury",
                },
              ]
            : [],
        immediateProtectionRequested,
        goodFaithAttested: true,
        idempotencyKey: crypto.randomUUID(),
      });
      navigate(`/app/courts/reports/${encodeURIComponent(result.reportId)}`);
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (runtime.status !== "available") {
    return (
      <CourtsUnavailable
        pageId="courts"
        title="Create report"
        reason={runtime.status === "unavailable" ? runtime.reason : undefined}
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
          <Button asChild size="sm" variant="outline">
            <Link to="/app/courts">Cancel</Link>
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
          <GlassySection title="Incident">
            <GlassyTile className="grid gap-4 md:grid-cols-2">
              <Field label="Target type">
                <Input value={courtLabel(target.type)} disabled />
              </Field>
              <Field label="Target id">
                <Input value={target.id} disabled />
              </Field>
              <Field label="Incident time">
                <Input
                  type="datetime-local"
                  value={incidentStartsAt}
                  onChange={(event) => setIncidentStartsAt(event.target.value)}
                  required
                />
              </Field>
              <Field label="Reason">
                <Select
                  value={reasonKey}
                  onChange={(event) => setReasonKey(event.target.value)}
                  required
                >
                  <option value="">Choose a verified reason</option>
                  {(capability?.reasonCapabilities ?? []).map(({ reason }) => (
                    <option
                      key={`${reason.offenseCode}:${reason.lane}`}
                      value={`${reason.offenseCode}:${reason.lane}`}
                    >
                      {reason.offenseCode} · {courtLabel(reason.lane)}
                    </option>
                  ))}
                </Select>
              </Field>
            </GlassyTile>
          </GlassySection>

          <GlassySection title="People and statement">
            <GlassyTile className="grid gap-4 md:grid-cols-2">
              <Field label="Respondent address">
                <Input
                  value={respondentId}
                  onChange={(event) => setRespondentId(event.target.value)}
                />
              </Field>
              <Field label="Affected address">
                <Input
                  value={affectedId}
                  onChange={(event) => setAffectedId(event.target.value)}
                />
              </Field>
              <Field className="md:col-span-2" label="Statement">
                <ProposalNarrativeEditor
                  id="court-report-statement"
                  value={statement}
                  onChange={setStatement}
                  placeholder="Describe what happened, when it happened, and why this reason applies."
                  rows={10}
                />
              </Field>
            </GlassyTile>
          </GlassySection>

          <GlassySection title="Evidence">
            <GlassyTile className="grid gap-4 md:grid-cols-2">
              <Field label="External evidence URL">
                <Input
                  type="url"
                  value={evidenceUrl}
                  onChange={(event) => setEvidenceUrl(event.target.value)}
                />
              </Field>
              <Field label="Evidence digest">
                <Input
                  value={evidenceDigest}
                  onChange={(event) => setEvidenceDigest(event.target.value)}
                  placeholder="sha256:..."
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-text md:col-span-2">
                <input
                  type="checkbox"
                  checked={immediateProtectionRequested}
                  onChange={(event) =>
                    setImmediateProtectionRequested(event.target.checked)
                  }
                />
                Request immediate protective review
              </label>
              <label className="flex items-start gap-2 text-sm leading-6 text-text md:col-span-2">
                <input
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

          {error ? (
            <p className="text-sm text-destructive">{formatLoadError(error)}</p>
          ) : null}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                submitting ||
                !capability ||
                !reasonKey ||
                !statement.trim() ||
                !goodFaithAttested
              }
            >
              Submit report
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

function Field({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label
      className={`grid gap-2 text-sm font-medium text-text ${className ?? ""}`}
    >
      {label}
      {children}
    </label>
  );
}

export default CourtReportCreate;
