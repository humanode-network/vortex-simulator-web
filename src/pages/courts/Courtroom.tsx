import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import {
  GlassyCompactGrid,
  GlassyKeyValue,
  GlassySection,
  GlassyStatusChip,
  GlassyTile,
} from "@/components/GlassySection";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHeader } from "@/components/PageHeader";
import { PageHint } from "@/components/PageHint";
import { Button } from "@/components/primitives/button";
import { apiCourtCaseV2 } from "@/lib/apiClient";
import type { CourtCaseViewerV2Dto } from "@/types/api";
import { CourtActionPanel } from "./CourtActionPanel";
import { courtLabel, courtTone, formatCourtInstant } from "./courtUi";
import { CourtsUnavailable } from "./CourtsUnavailable";
import { useCourtRuntime } from "./useCourtRuntime";

const Courtroom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const runtime = useCourtRuntime();
  const [record, setRecord] = useState<CourtCaseViewerV2Dto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCase = useCallback(async () => {
    if (runtime.status !== "available" || !id) return;
    try {
      setRecord(await apiCourtCaseV2(id));
      setLoadError(null);
    } catch (error) {
      setLoadError((error as Error).message);
    }
  }, [id, runtime.status]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  if (runtime.status !== "available") {
    return (
      <CourtsUnavailable
        pageId="courtroom"
        title="Courtroom"
        reason={runtime.status === "unavailable" ? runtime.reason : undefined}
      />
    );
  }

  const courtCase = record?.publicCase;
  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="courtroom" />
      <PageHeader
        eyebrow={
          courtCase ? `${courtLabel(courtCase.domain)} case` : "Court case"
        }
        title={courtCase?.offenseCode ?? "Case record"}
        description={id ?? "Not set"}
        right={
          <Button asChild size="sm" variant="outline">
            <Link to="/app/courts">All cases</Link>
          </Button>
        }
      />

      {loadError ? <NoDataYetBar label="case" description={loadError} /> : null}
      {!loadError && !record ? (
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
          {record ? (
            <CourtActionPanel
              key={`${courtCase.state}-${record.juryTask?.ballot?.id ?? "no-ballot"}-${record.appellateTask?.panelId ?? "no-panel"}-${record.appellateTask?.panelState ?? "no-panel-state"}`}
              courtCase={record}
              onCompleted={loadCase}
            />
          ) : null}
          <GlassySection title="Case status">
            <GlassyTile className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <GlassyStatusChip tone={courtTone(courtCase.state)}>
                  {courtLabel(courtCase.state)}
                </GlassyStatusChip>
                <GlassyStatusChip tone={courtTone(courtCase.finalityState)}>
                  {courtLabel(courtCase.finalityState)}
                </GlassyStatusChip>
              </div>
              <GlassyCompactGrid className="sm:grid-cols-2 lg:grid-cols-4">
                <GlassyKeyValue
                  label="Offense"
                  value={courtCase.offenseCode ?? "Pending"}
                />
                <GlassyKeyValue
                  label="Policy"
                  value={courtCase.policyVersionId}
                />
                <GlassyKeyValue
                  label="Opened"
                  value={formatCourtInstant(courtCase.openedAt)}
                />
                <GlassyKeyValue
                  label="Closed"
                  value={formatCourtInstant(courtCase.closedAt)}
                />
              </GlassyCompactGrid>
            </GlassyTile>
          </GlassySection>

          {record.partyRecord ? (
            <GlassySection title="Parties and procedure">
              <div className="grid gap-4 lg:grid-cols-2">
                {record.partyRecord.parties.map((party) => (
                  <GlassyTile
                    key={`${party.address}-${party.role}`}
                    className="space-y-2"
                  >
                    <GlassyKeyValue
                      label={courtLabel(party.role)}
                      value={party.address}
                    />
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
                  <GlassyTile key={evidence.id} className="space-y-2">
                    <GlassyKeyValue
                      label="Type"
                      value={courtLabel(evidence.kind)}
                    />
                    <GlassyKeyValue label="Digest" value={evidence.digest} />
                    <GlassyKeyValue
                      label="Added"
                      value={formatCourtInstant(evidence.createdAt)}
                    />
                  </GlassyTile>
                ))}
              </div>
            ) : (
              <NoDataYetBar label="visible evidence" />
            )}
          </GlassySection>

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
                </GlassyCompactGrid>
              </GlassyTile>
            </GlassySection>
          ) : null}

          <GlassySection title="Remedies and appeals">
            {courtCase.remedies.length || courtCase.appeals.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {courtCase.remedies.map((remedy) => (
                  <GlassyTile key={remedy.id} className="space-y-2">
                    <GlassyStatusChip tone={courtTone(remedy.state)}>
                      {courtLabel(remedy.state)}
                    </GlassyStatusChip>
                    <GlassyKeyValue
                      label="Remedy"
                      value={remedy.componentCode}
                    />
                    <GlassyKeyValue
                      label="Scope"
                      value={remedy.scopeCode ?? "System-wide"}
                    />
                  </GlassyTile>
                ))}
                {courtCase.appeals.map((appeal) => (
                  <GlassyTile key={appeal.id} className="space-y-2">
                    <GlassyStatusChip tone={courtTone(appeal.status)}>
                      {courtLabel(appeal.status)}
                    </GlassyStatusChip>
                    <GlassyKeyValue
                      label="Stay"
                      value={courtLabel(appeal.stayState)}
                    />
                    <GlassyKeyValue
                      label="Filed"
                      value={formatCourtInstant(appeal.filedAt)}
                    />
                  </GlassyTile>
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
