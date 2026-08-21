import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Check, CircleAlert, Copy } from "lucide-react";

import { CodexProcedureHint } from "@/components/CodexHint";
import {
  GlassyCompactGrid,
  GlassyKeyValue,
  GlassyStatusChip,
  GlassyTile,
  GlassyTileHeading,
} from "@/components/GlassySection";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { Button } from "@/components/primitives/button";
import {
  compactCourtAuditValue,
  courtSnapshotTitle,
  courtStandingDisplay,
} from "../model/courtPresentation";

export function courtLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function CourtCopyValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 1_800);
    return () => window.clearTimeout(timer);
  }, [status]);
  const feedback =
    status === "copied"
      ? `${label} copied`
      : status === "failed"
        ? `${label} could not be copied`
        : "";
  const visibleValue = compactCourtAuditValue(value);
  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1">
      <span
        aria-label={`${label}: ${value}`}
        className="max-w-full min-w-0 overflow-hidden font-mono text-xs text-ellipsis whitespace-nowrap text-text"
        title={value}
      >
        {visibleValue}
      </span>
      <button
        type="button"
        className="hover:bg-surface-alt inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition hover:text-text"
        aria-label={status === "copied" ? `${label} copied` : `Copy ${label}`}
        title={
          status === "copied"
            ? "Copied"
            : status === "failed"
              ? "Copy failed"
              : `Copy ${label}`
        }
        onClick={async () => {
          try {
            if (!navigator.clipboard) throw new Error("Clipboard unavailable");
            await navigator.clipboard.writeText(value);
            setStatus("copied");
          } catch {
            setStatus("failed");
          }
        }}
      >
        {status === "copied" ? (
          <Check className="h-3.5 w-3.5" />
        ) : status === "failed" ? (
          <CircleAlert className="h-3.5 w-3.5 text-destructive" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {feedback}
      </span>
    </span>
  );
}

export function CourtStandingReference({
  direct,
  source,
}: {
  direct: boolean;
  source: string;
}) {
  const standing = courtStandingDisplay({ direct, source });
  return (
    <>
      <CodexProcedureHint clause="HC-2.2">{standing.label}</CodexProcedureHint>
      <span className="font-normal text-muted">
        {` · ${standing.verification}`}
      </span>
    </>
  );
}

export function CourtTriggerCounter({
  current,
  description,
  label = "Governor reports",
  required,
  viewerCounts,
}: {
  current?: number;
  description?: string;
  label?: string;
  required: number;
  viewerCounts?: boolean;
}) {
  const completed = current === undefined ? 0 : Math.min(current, required);
  const percentage = required > 0 ? (completed / required) * 100 : 0;
  return (
    <div className="space-y-2 border-t border-border/70 pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-sm font-semibold text-text">
          {current === undefined
            ? `${required} required`
            : `${completed} / ${required}`}
        </p>
      </div>
      {current !== undefined ? (
        <div
          aria-label={`${completed} of ${required} Governor reports received`}
          aria-valuemax={required}
          aria-valuemin={0}
          aria-valuenow={completed}
          className="h-1.5 overflow-hidden rounded-full bg-border/70"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none"
            style={{ width: `${percentage}%` }}
          />
        </div>
      ) : null}
      <p className="text-xs leading-5 text-muted">
        {description ??
          (current === undefined
            ? `This action needs matching reports from ${required} eligible Governors.`
            : completed >= required
              ? "The Governor threshold has been reached."
              : `${required - completed} more matching Governor ${required - completed === 1 ? "report" : "reports"} required.`)}
        {viewerCounts === undefined
          ? ""
          : viewerCounts
            ? " Your report counts toward this threshold."
            : " Your report is recorded, but it does not add Governor support."}
      </p>
    </div>
  );
}

export function courtTone(
  value: string,
): "danger" | "neutral" | "ok" | "primary" | "warn" {
  if (["final", "applied", "confirmed", "accepted"].includes(value)) {
    return "ok";
  }
  if (["failed"].includes(value)) return "danger";
  if (
    [
      "appealed",
      "appeal_window",
      "awaiting_jury_capacity",
      "needs_amendment",
      "remanded",
    ].includes(value)
  ) {
    return "warn";
  }
  if (
    [
      "jury_selection",
      "finding_ballot",
      "sentence_ballot",
      "triggered",
    ].includes(value)
  ) {
    return "primary";
  }
  return "neutral";
}

export function formatCourtInstant(value: string | null): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleString();
}

export function CourtDeadline({
  dueAt,
  label,
  state = "due",
}: {
  dueAt: string;
  label: string;
  state?: "completed" | "due" | "overdue";
}) {
  const stateLabel =
    state === "completed"
      ? "Completed"
      : state === "overdue"
        ? "Overdue"
        : "Due";
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="text-xs text-muted">{label}</p>
        <GlassyStatusChip
          className="shrink-0"
          tone={
            state === "overdue"
              ? "danger"
              : state === "completed"
                ? "ok"
                : "warn"
          }
        >
          {stateLabel}
        </GlassyStatusChip>
      </div>
      <time className="block text-sm font-medium text-text" dateTime={dueAt}>
        {formatCourtInstant(dueAt)}
      </time>
    </div>
  );
}

export function CourtStateSummary({
  description,
  label,
  tone,
}: {
  description: string;
  label: ReactNode;
  tone: ReturnType<typeof courtTone>;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <p className="max-w-3xl min-w-0 text-sm leading-6 text-muted">
        {description}
      </p>
      <GlassyStatusChip className="shrink-0" tone={tone}>
        {label}
      </GlassyStatusChip>
    </div>
  );
}

export function CourtCollectionNotice({
  error,
  label,
  loading,
  onRetry,
}: {
  error: string | null;
  label: string;
  loading: boolean;
  onRetry: () => void;
}) {
  if (loading) {
    return <NoDataYetBar label={label} description={`Loading ${label}...`} />;
  }
  if (!error) return null;
  return (
    <div className="space-y-2">
      <NoDataYetBar label={label} description={error} />
      <Button size="compact" variant="outline" onClick={onRetry}>
        Retry {label}
      </Button>
    </div>
  );
}

export function CourtTargetPreview({
  securedAt,
  target,
}: {
  securedAt?: string;
  target: {
    accessClass?: "private" | "public" | "sealed";
    canonicalRoute?: string | null;
    digest?: string;
    id?: string;
    revision?: string;
    route?: string | null;
    snapshotPayload?: Record<string, unknown>;
    snapshot?: Record<string, unknown>;
    type?: string;
  };
}) {
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const snapshot = target.snapshotPayload ?? target.snapshot ?? {};
  const title = courtSnapshotTitle(snapshot);
  const route = target.canonicalRoute ?? target.route;
  return (
    <GlassyTile className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <GlassyTileHeading>{title ?? "Reported record"}</GlassyTileHeading>
          {target.type ? (
            <p className="text-sm text-muted">{courtLabel(target.type)}</p>
          ) : null}
        </div>
        {securedAt ? (
          <GlassyStatusChip tone="ok">Source record secured</GlassyStatusChip>
        ) : null}
      </div>
      {securedAt ? (
        <p className="text-sm leading-6 text-muted">
          Vortex captured this exact record at {formatCourtInstant(securedAt)}{" "}
          and will attach its verified snapshot to the report automatically.
        </p>
      ) : null}
      <details
        className={securedAt ? "border-t border-border/70 pt-3" : undefined}
        open={!securedAt || technicalOpen}
        onToggle={(event) => {
          if (securedAt) setTechnicalOpen(event.currentTarget.open);
        }}
      >
        {securedAt ? (
          <summary className="cursor-pointer text-sm font-medium text-text">
            Technical details
          </summary>
        ) : null}
        <GlassyCompactGrid
          className={securedAt ? "mt-3 sm:grid-cols-2" : "sm:grid-cols-2"}
        >
          {target.id ? (
            <GlassyKeyValue
              className="flex-col items-start gap-1"
              label="Target id"
              value={<CourtCopyValue label="target id" value={target.id} />}
            />
          ) : null}
          {target.revision ? (
            <GlassyKeyValue
              className="flex-col items-start gap-1"
              label="Revision"
              value={
                <CourtCopyValue
                  label="target revision"
                  value={target.revision}
                />
              }
            />
          ) : null}
          {target.digest ? (
            <GlassyKeyValue
              className="flex-col items-start gap-1"
              label="Snapshot digest"
              value={
                <CourtCopyValue label="snapshot digest" value={target.digest} />
              }
            />
          ) : null}
          {target.accessClass ? (
            <GlassyKeyValue
              className="flex-col items-start gap-1"
              label="Access"
              value={courtLabel(target.accessClass)}
            />
          ) : null}
        </GlassyCompactGrid>
      </details>
      {route ? (
        <div className="flex justify-end">
          <Button asChild size="compact" variant="outline">
            <Link to={route}>Open reported record</Link>
          </Button>
        </div>
      ) : null}
    </GlassyTile>
  );
}
