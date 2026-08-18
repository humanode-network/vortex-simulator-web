import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

import { GlassySection } from "@/components/GlassySection";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHeader } from "@/components/PageHeader";
import { PageHint } from "@/components/PageHint";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import { Tabs } from "@/components/primitives/tabs";
import {
  apiCourtCasesV2,
  apiCourtNotificationsV2,
  apiMyCourtReportsV2,
} from "@/lib/apiClient";
import type {
  CourtCaseViewerV2Dto,
  CourtMyReportItemV2Dto,
  CourtNotificationV2Dto,
} from "@/types/api";
import { CourtCaseCard, CourtReportCard } from "./components/CourtRecordCards";
import { CourtCollectionNotice } from "./components/CourtPrimitives";
import { CourtNotificationCard } from "./CourtNotificationCard";
import { CourtsUnavailable } from "./CourtsUnavailable";
import { useCourtCollection } from "./hooks/useCourtCollection";
import { useCourtRuntime } from "./hooks/useCourtRuntime";
import {
  COURT_CASE_STATE_OPTIONS,
  courtCaseStateDisplay,
  courtOffenseDisplay,
} from "./model/courtPresentation";

const COURT_PAGE_SIZE = 12;

async function loadCases(): Promise<CourtCaseViewerV2Dto[]> {
  const result = await apiCourtCasesV2();
  if (result.status !== "available") throw new Error("Cases are unavailable.");
  return result.cases;
}

async function loadReports(): Promise<CourtMyReportItemV2Dto[]> {
  const result = await apiMyCourtReportsV2();
  if (result.status !== "available")
    throw new Error("Reports are unavailable.");
  return result.reports;
}

async function loadNotifications(): Promise<CourtNotificationV2Dto[]> {
  const result = await apiCourtNotificationsV2();
  if (result.status !== "available")
    throw new Error("Notifications are unavailable.");
  return result.notifications;
}

const Courts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const runtime = useCourtRuntime();
  const enabled = runtime.status === "available";
  const caseCollection = useCourtCollection({ enabled, load: loadCases });
  const reportCollection = useCourtCollection({ enabled, load: loadReports });
  const notificationCollection = useCourtCollection({
    enabled,
    load: loadNotifications,
  });
  const cases = caseCollection.data;
  const reports = reportCollection.data;
  const notifications = notificationCollection.data;
  const requestedView = searchParams.get("view");
  const view = [
    "all",
    "involving",
    "jury",
    "reports",
    "notifications",
  ].includes(requestedView ?? "")
    ? requestedView!
    : "all";
  const query = searchParams.get("query")?.trim() ?? "";
  const requestedState = searchParams.get("state");
  const state = COURT_CASE_STATE_OPTIONS.includes(
    requestedState as (typeof COURT_CASE_STATE_OPTIONS)[number],
  )
    ? requestedState!
    : "all";
  const requestedPage = Number(searchParams.get("page") ?? "1");
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
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
  const scopedCases =
    view === "involving" ? involvingCases : view === "jury" ? juryCases : cases;
  const filteredCases = useMemo(() => {
    const normalized = query.toLocaleLowerCase();
    return scopedCases.filter((item) => {
      const courtCase = item.publicCase;
      if (!courtCase || (state !== "all" && courtCase.state !== state))
        return false;
      if (!normalized) return true;
      const targetTitle = courtCase.targetSummary?.title ?? "";
      const allegation = courtOffenseDisplay(
        item.caseRecord?.allegationCode ?? courtCase.offenseCode,
      ).label;
      return [
        courtCase.id,
        courtCase.domain,
        courtCase.state,
        courtCase.finalityState,
        targetTitle,
        allegation,
      ].some((value) => value.toLocaleLowerCase().includes(normalized));
    });
  }, [query, scopedCases, state]);
  const pageCount = Math.max(
    1,
    Math.ceil(filteredCases.length / COURT_PAGE_SIZE),
  );
  const currentPage = Math.min(page, pageCount);
  const visibleCases = filteredCases.slice(
    (currentPage - 1) * COURT_PAGE_SIZE,
    currentPage * COURT_PAGE_SIZE,
  );

  const updateCaseQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (!value) next.delete(key);
        else next.set(key, value);
      }
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const updateNotification = useCallback(
    (next: CourtNotificationV2Dto) => {
      notificationCollection.setData((current) =>
        current.map((item) => (item.id === next.id ? next : item)),
      );
    },
    [notificationCollection.setData],
  );

  if (runtime.status !== "available") {
    return (
      <CourtsUnavailable
        checking={runtime.status === "checking"}
        failed={runtime.status === "failed"}
        onRetry={runtime.retry}
        pageId="courts"
        title="Courts"
        reason={
          runtime.status === "unavailable" || runtime.status === "failed"
            ? runtime.reason
            : undefined
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="courts" />
      <PageHeader
        eyebrow="Reporting and adjudication"
        title="Courts"
        description="Follow cases, manage reports, and respond to Court duties. Start a report from the Report action on the exact Vortex record involved."
      />

      <Tabs
        aria-label="Court records"
        className="flex-nowrap overflow-x-auto"
        value={view}
        onValueChange={(nextView) => {
          const next = new URLSearchParams(searchParams);
          if (nextView === "all") next.delete("view");
          else next.set("view", nextView);
          next.delete("page");
          setSearchParams(next);
        }}
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
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.35fr)]">
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              Search cases
              <Input
                value={query}
                onChange={(event) =>
                  updateCaseQuery({
                    query: event.target.value || null,
                    page: null,
                  })
                }
                placeholder="Case id, record, allegation, or domain"
                type="search"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              Procedure state
              <Select
                value={state}
                onChange={(event) =>
                  updateCaseQuery({
                    state:
                      event.target.value === "all" ? null : event.target.value,
                    page: null,
                  })
                }
              >
                <option value="all">All states</option>
                {COURT_CASE_STATE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {courtCaseStateDisplay(option).label}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <CourtCollectionNotice
            error={caseCollection.error}
            label="cases"
            loading={caseCollection.loading}
            onRetry={() => void caseCollection.reload()}
          />
          {visibleCases.length ? (
            <>
              <p className="text-xs text-muted" aria-live="polite">
                {filteredCases.length} matching{" "}
                {filteredCases.length === 1 ? "case" : "cases"}
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleCases.map((item) => (
                  <CourtCaseCard key={item.publicCase?.id} item={item} />
                ))}
              </div>
              {pageCount > 1 ? (
                <nav
                  aria-label="Court case pages"
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <Button
                    size="compact"
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() =>
                      updateCaseQuery({
                        page: currentPage > 2 ? String(currentPage - 1) : null,
                      })
                    }
                  >
                    Previous
                  </Button>
                  <p className="text-xs text-muted">
                    Page {currentPage} of {pageCount}
                  </p>
                  <Button
                    size="compact"
                    variant="outline"
                    disabled={currentPage === pageCount}
                    onClick={() =>
                      updateCaseQuery({ page: String(currentPage + 1) })
                    }
                  >
                    Next
                  </Button>
                </nav>
              ) : null}
            </>
          ) : !caseCollection.loading && !caseCollection.error ? (
            <NoDataYetBar
              label={view === "jury" ? "jury tasks" : "cases"}
              description={
                query || state !== "all"
                  ? "No case matches the current search and procedure state."
                  : undefined
              }
            />
          ) : null}
        </GlassySection>
      ) : null}

      {view === "notifications" ? (
        <GlassySection title="Court notifications">
          <CourtCollectionNotice
            error={notificationCollection.error}
            label="notifications"
            loading={notificationCollection.loading}
            onRetry={() => void notificationCollection.reload()}
          />
          {notifications.filter((item) => item.state !== "dismissed").length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {notifications
                .filter((item) => item.state !== "dismissed")
                .map((notification) => (
                  <CourtNotificationCard
                    key={notification.id}
                    notification={notification}
                    onChange={updateNotification}
                  />
                ))}
            </div>
          ) : !notificationCollection.loading &&
            !notificationCollection.error ? (
            <NoDataYetBar label="Court notifications" />
          ) : null}
        </GlassySection>
      ) : null}

      {view === "reports" ? (
        <GlassySection title="My reports">
          <CourtCollectionNotice
            error={reportCollection.error}
            label="reports"
            loading={reportCollection.loading}
            onRetry={() => void reportCollection.reload()}
          />
          {reports.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {reports.map((report) => (
                <CourtReportCard key={report.id} report={report} />
              ))}
            </div>
          ) : !reportCollection.loading && !reportCollection.error ? (
            <NoDataYetBar label="reports" />
          ) : null}
        </GlassySection>
      ) : null}
    </div>
  );
};

export default Courts;
