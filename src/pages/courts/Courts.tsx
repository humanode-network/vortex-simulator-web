import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import {
  GlassyKeyValue,
  GlassySection,
  GlassyStatusChip,
  GlassyTile,
} from "@/components/GlassySection";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHeader } from "@/components/PageHeader";
import { PageHint } from "@/components/PageHint";
import { Button } from "@/components/primitives/button";
import { Tabs } from "@/components/primitives/tabs";
import {
  apiCourtCasesV2,
  apiCourtNotificationsV2,
  apiMyCourtReportsV2,
  apiSetCourtNotificationStateV2,
} from "@/lib/apiClient";
import type {
  CourtCaseViewerV2Dto,
  CourtMyReportItemV2Dto,
  CourtNotificationV2Dto,
} from "@/types/api";
import {
  courtLabel,
  CourtCaseCard,
  CourtReportCard,
  courtTone,
  formatCourtInstant,
} from "./courtUi";
import { CourtsUnavailable } from "./CourtsUnavailable";
import { useCourtRuntime } from "./useCourtRuntime";

const Courts: React.FC = () => {
  const runtime = useCourtRuntime();
  const [cases, setCases] = useState<CourtCaseViewerV2Dto[]>([]);
  const [reports, setReports] = useState<CourtMyReportItemV2Dto[]>([]);
  const [notifications, setNotifications] = useState<CourtNotificationV2Dto[]>(
    [],
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState("all");
  const involvingCases = useMemo(
    () => cases.filter((item) => item.partyRecord !== null),
    [cases],
  );
  const juryCases = useMemo(
    () =>
      cases.filter(
        (item) => item.juryTask !== null || item.appellateTask !== null,
      ),
    [cases],
  );
  const visibleCases =
    view === "involving" ? involvingCases : view === "jury" ? juryCases : cases;

  const loadRecords = useCallback(async () => {
    if (runtime.status !== "available") return;
    try {
      const [caseResult, reportResult, notificationResult] = await Promise.all([
        apiCourtCasesV2(),
        apiMyCourtReportsV2(),
        apiCourtNotificationsV2(),
      ]);
      setCases(caseResult.status === "available" ? caseResult.cases : []);
      setReports(
        reportResult.status === "available" ? reportResult.reports : [],
      );
      setNotifications(
        notificationResult.status === "available"
          ? notificationResult.notifications
          : [],
      );
      setLoadError(null);
    } catch (error) {
      setLoadError((error as Error).message);
    }
  }, [runtime.status]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  async function setNotificationState(
    notificationId: string,
    state: "read" | "dismissed",
  ) {
    try {
      await apiSetCourtNotificationStateV2({ notificationId, state });
      await loadRecords();
    } catch (error) {
      setLoadError((error as Error).message);
    }
  }

  if (runtime.status !== "available") {
    return (
      <CourtsUnavailable
        pageId="courts"
        title="Courts"
        reason={runtime.status === "unavailable" ? runtime.reason : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="courts" />
      <PageHeader
        eyebrow="Reporting and adjudication"
        title="Courts"
        description="Follow cases, manage reports, and respond to Court duties."
        right={
          <Button asChild size="sm">
            <Link to="/app/courts/reports/new">Create report</Link>
          </Button>
        }
      />

      {loadError ? (
        <NoDataYetBar label="court records" description={loadError} />
      ) : null}

      <Tabs
        aria-label="Court records"
        className="flex-nowrap overflow-x-auto"
        value={view}
        onValueChange={setView}
        options={[
          { value: "all", label: `All cases ${cases.length}` },
          {
            value: "involving",
            label: `Involving me ${involvingCases.length}`,
          },
          { value: "jury", label: `Jury service ${juryCases.length}` },
          { value: "reports", label: `My reports ${reports.length}` },
          {
            value: "notifications",
            label: `Notifications ${notifications.filter((item) => item.state === "unread").length}`,
          },
        ]}
      />

      {view !== "reports" && view !== "notifications" ? (
        <GlassySection
          title={
            view === "jury"
              ? "Jury service"
              : view === "involving"
                ? "Cases involving me"
                : "Cases"
          }
        >
          {visibleCases.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleCases.map((item) => (
                <CourtCaseCard key={item.publicCase?.id} item={item} />
              ))}
            </div>
          ) : (
            <NoDataYetBar label={view === "jury" ? "jury tasks" : "cases"} />
          )}
        </GlassySection>
      ) : null}

      {view === "notifications" ? (
        <GlassySection title="Court notifications">
          {notifications.filter((item) => item.state !== "dismissed").length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {notifications
                .filter((item) => item.state !== "dismissed")
                .map((notification) => (
                  <GlassyTile key={notification.id} className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <GlassyKeyValue
                        label={courtLabel(notification.kind)}
                        value={notification.entityId}
                      />
                      <GlassyStatusChip tone={courtTone(notification.state)}>
                        {courtLabel(notification.state)}
                      </GlassyStatusChip>
                    </div>
                    <GlassyKeyValue
                      label="Received"
                      value={formatCourtInstant(notification.createdAt)}
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      {notification.entityType === "case" ? (
                        <Button asChild size="compact" variant="ghost">
                          <Link
                            to={`/app/courts/${encodeURIComponent(notification.entityId)}`}
                          >
                            Open case
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild size="compact" variant="ghost">
                          <Link
                            to={`/app/courts/reports/${encodeURIComponent(notification.entityId)}`}
                          >
                            Open report
                          </Link>
                        </Button>
                      )}
                      {notification.state === "unread" ? (
                        <Button
                          size="compact"
                          variant="outline"
                          onClick={() =>
                            void setNotificationState(notification.id, "read")
                          }
                        >
                          Mark read
                        </Button>
                      ) : null}
                      <Button
                        size="compact"
                        variant="ghost"
                        onClick={() =>
                          void setNotificationState(
                            notification.id,
                            "dismissed",
                          )
                        }
                      >
                        Dismiss
                      </Button>
                    </div>
                  </GlassyTile>
                ))}
            </div>
          ) : (
            <NoDataYetBar label="Court notifications" />
          )}
        </GlassySection>
      ) : null}

      {view === "reports" ? (
        <GlassySection title="My reports">
          {reports.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {reports.map((report) => (
                <CourtReportCard key={report.id} report={report} />
              ))}
            </div>
          ) : (
            <NoDataYetBar label="reports" />
          )}
        </GlassySection>
      ) : null}
    </div>
  );
};

export default Courts;
