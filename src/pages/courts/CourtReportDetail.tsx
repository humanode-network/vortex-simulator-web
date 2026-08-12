import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

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
  ProposalNarrative,
  ProposalNarrativeEditor,
} from "@/components/ProposalNarrative";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import {
  apiCourtReportV2,
  apiSupplementCourtReportV2,
  apiWithdrawCourtReportV2,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import type { CourtPrivateReportV2Dto } from "@/types/api";
import { courtLabel, courtTone, formatCourtInstant } from "./courtUi";
import { CourtsUnavailable } from "./CourtsUnavailable";
import { useCourtRuntime } from "./useCourtRuntime";

const CourtReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const runtime = useCourtRuntime();
  const [report, setReport] = useState<CourtPrivateReportV2Dto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [supplement, setSupplement] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceDigest, setEvidenceDigest] = useState("");
  const [supplementing, setSupplementing] = useState(false);

  const loadReport = useCallback(async () => {
    if (runtime.status !== "available" || !id) return;
    try {
      setReport(await apiCourtReportV2(id));
      setError(null);
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }, [id, runtime.status]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  async function addSupplement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!report) return;
    setSupplementing(true);
    setError(null);
    try {
      await apiSupplementCourtReportV2({
        reportId: report.id,
        statement: supplement.trim() || null,
        statementAccess: "parties_and_jury",
        evidence:
          evidenceUrl.trim() && evidenceDigest.trim()
            ? [
                {
                  kind: "external_url",
                  url: evidenceUrl.trim(),
                  digest: evidenceDigest.trim(),
                  provenance: "reporter_supplement",
                  access: "parties_and_jury",
                },
              ]
            : [],
      });
      setSupplement("");
      setEvidenceUrl("");
      setEvidenceDigest("");
      await loadReport();
    } catch (supplementError) {
      setError((supplementError as Error).message);
    } finally {
      setSupplementing(false);
    }
  }

  async function withdraw() {
    if (
      !report ||
      !window.confirm("Withdraw this report from active consideration?")
    )
      return;
    setWithdrawing(true);
    setError(null);
    try {
      await apiWithdrawCourtReportV2({
        reportId: report.id,
        idempotencyKey: crypto.randomUUID(),
      });
      navigate("/app/courts");
    } catch (withdrawError) {
      setError((withdrawError as Error).message);
    } finally {
      setWithdrawing(false);
    }
  }

  if (runtime.status !== "available") {
    return (
      <CourtsUnavailable
        pageId="courts"
        title="Court report"
        reason={runtime.status === "unavailable" ? runtime.reason : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="My report"
        title={report?.offenseCode ?? "Court report"}
        description={report?.id ?? id ?? "Not set"}
        right={
          <Button asChild size="sm" variant="outline">
            <Link to="/app/courts">All reports</Link>
          </Button>
        }
      />
      {error ? (
        <NoDataYetBar label="report" description={formatLoadError(error)} />
      ) : null}
      {!error && !report ? (
        <NoDataYetBar label="report record" description="Loading report..." />
      ) : null}
      {report ? (
        <>
          <GlassySection title="Report status">
            <GlassyTile className="space-y-4">
              <GlassyStatusChip tone={courtTone(report.state)}>
                {courtLabel(report.state)}
              </GlassyStatusChip>
              <GlassyCompactGrid className="sm:grid-cols-2 lg:grid-cols-4">
                <GlassyKeyValue label="Lane" value={courtLabel(report.lane)} />
                <GlassyKeyValue
                  label="Target"
                  value={courtLabel(report.target.type)}
                />
                <GlassyKeyValue
                  label="Incident"
                  value={formatCourtInstant(report.incident.startedAt)}
                />
                <GlassyKeyValue
                  label="Updated"
                  value={formatCourtInstant(report.updatedAt)}
                />
              </GlassyCompactGrid>
            </GlassyTile>
          </GlassySection>
          {report.state === "collecting" || report.state === "submitted" ? (
            <GlassySection title="Add information">
              <GlassyTile>
                <form className="grid gap-4" onSubmit={addSupplement}>
                  <ProposalNarrativeEditor
                    id="court-report-supplement"
                    value={supplement}
                    onChange={setSupplement}
                    placeholder="Add a correction, relevant context, or an explanation of new evidence."
                    rows={7}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium text-text">
                      Evidence URL
                      <Input
                        type="url"
                        value={evidenceUrl}
                        onChange={(event) => setEvidenceUrl(event.target.value)}
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-text">
                      Evidence digest
                      <Input
                        value={evidenceDigest}
                        onChange={(event) =>
                          setEvidenceDigest(event.target.value)
                        }
                        placeholder="sha256:..."
                      />
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      disabled={
                        supplementing ||
                        (!supplement.trim() &&
                          !(evidenceUrl.trim() && evidenceDigest.trim()))
                      }
                    >
                      Add to report
                    </Button>
                  </div>
                </form>
              </GlassyTile>
            </GlassySection>
          ) : null}
          <GlassySection title="Statement and evidence">
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
                  value={report.statementDigest}
                />
                <GlassyKeyValue
                  label="Evidence records"
                  value={report.evidence.length}
                />
              </GlassyCompactGrid>
            </GlassyTile>
          </GlassySection>
          <div className="flex flex-wrap justify-end gap-2">
            {report.caseId ? (
              <Button asChild variant="outline">
                <Link to={`/app/courts/${encodeURIComponent(report.caseId)}`}>
                  Open case
                </Link>
              </Button>
            ) : null}
            {report.state === "collecting" || report.state === "submitted" ? (
              <Button
                type="button"
                variant="ghost"
                disabled={withdrawing}
                onClick={() => void withdraw()}
              >
                Withdraw report
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default CourtReportDetail;
