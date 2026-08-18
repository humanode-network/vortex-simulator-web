import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import { Button, type ButtonProps } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import { cn } from "@/lib/utils";
import { courtLabel } from "../components/CourtPrimitives";
import {
  COURT_EVIDENCE_KINDS,
  COURT_REPORT_EVIDENCE_ACCESS,
  courtEvidenceAccessLabel,
  courtEvidenceFieldId,
  type CourtEvidenceDraft,
  type CourtEvidenceDraftError,
} from "./courtEvidence";
import { COURT_REPORTABLE_TARGET_TYPES } from "../model/courtReportTarget";

const EVIDENCE_KIND_LABELS = Object.freeze({
  vortex_reference: "Vortex record",
  external_url: "External URL",
  protocol_proof: "Protocol proof",
});

export function CourtFormField({
  children,
  className,
  hint,
  htmlFor,
  label,
}: {
  children: ReactNode;
  className?: string;
  hint?: ReactNode;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <label className="text-sm font-medium text-text" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <div className="text-xs leading-5 text-muted">{hint}</div> : null}
    </div>
  );
}

function CourtEvidenceDraftFields({
  draft,
  error,
  idPrefix,
  onChange,
}: {
  draft: CourtEvidenceDraft;
  error: CourtEvidenceDraftError | null;
  idPrefix: string;
  onChange: (next: CourtEvidenceDraft) => void;
}) {
  const update = <Key extends keyof CourtEvidenceDraft>(
    key: Key,
    value: CourtEvidenceDraft[Key],
  ) => onChange({ ...draft, [key]: value });
  const errorId = `${idPrefix}-error`;
  const fieldProps = (field: CourtEvidenceDraftError["field"]) => ({
    "aria-describedby": error?.field === field ? errorId : undefined,
    "aria-invalid": error?.field === field,
  });
  const fieldId = (field: CourtEvidenceDraftError["field"]) =>
    courtEvidenceFieldId(idPrefix, field);
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <CourtFormField htmlFor={`${idPrefix}-kind`} label="Evidence type">
          <Select
            id={`${idPrefix}-kind`}
            value={draft.kind}
            onChange={(event) =>
              update("kind", event.target.value as CourtEvidenceDraft["kind"])
            }
          >
            {COURT_EVIDENCE_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {EVIDENCE_KIND_LABELS[kind]}
              </option>
            ))}
          </Select>
        </CourtFormField>
        <CourtFormField
          htmlFor={`${idPrefix}-access`}
          label="Who may read it"
          hint="Access is enforced by the Court record; choosing Public does not publish pending evidence early."
        >
          <Select
            id={`${idPrefix}-access`}
            value={draft.access}
            onChange={(event) =>
              update(
                "access",
                event.target.value as CourtEvidenceDraft["access"],
              )
            }
          >
            <CourtEvidenceAccessOptions />
          </Select>
        </CourtFormField>
      </div>

      {draft.kind === "external_url" ? (
        <CourtFormField htmlFor={fieldId("url")} label="External evidence URL">
          <Input
            id={fieldId("url")}
            type="url"
            value={draft.url}
            onChange={(event) => update("url", event.target.value)}
            {...fieldProps("url")}
          />
        </CourtFormField>
      ) : null}

      {draft.kind === "vortex_reference" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <CourtFormField
            htmlFor={fieldId("targetType")}
            label="Vortex record type"
          >
            <Select
              id={fieldId("targetType")}
              value={draft.targetType}
              onChange={(event) =>
                update(
                  "targetType",
                  event.target.value as CourtEvidenceDraft["targetType"],
                )
              }
              {...fieldProps("targetType")}
            >
              {COURT_REPORTABLE_TARGET_TYPES.map((targetType) => (
                <option key={targetType} value={targetType}>
                  {courtLabel(targetType)}
                </option>
              ))}
            </Select>
          </CourtFormField>
          <CourtFormField
            htmlFor={fieldId("targetId")}
            label="Vortex record id"
          >
            <Input
              id={fieldId("targetId")}
              value={draft.targetId}
              onChange={(event) => update("targetId", event.target.value)}
              {...fieldProps("targetId")}
            />
          </CourtFormField>
          <CourtFormField
            htmlFor={`${idPrefix}-target-revision`}
            label="Revision"
            hint="Optional. Use the immutable revision when the record has one."
          >
            <Input
              id={`${idPrefix}-target-revision`}
              value={draft.targetRevision}
              onChange={(event) => update("targetRevision", event.target.value)}
            />
          </CourtFormField>
        </div>
      ) : null}

      {draft.kind === "protocol_proof" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <CourtFormField htmlFor={fieldId("proofType")} label="Proof type">
            <Input
              id={fieldId("proofType")}
              value={draft.proofType}
              onChange={(event) => update("proofType", event.target.value)}
              {...fieldProps("proofType")}
            />
          </CourtFormField>
          <CourtFormField htmlFor={fieldId("verifierId")} label="Verifier id">
            <Input
              id={fieldId("verifierId")}
              value={draft.verifierId}
              onChange={(event) => update("verifierId", event.target.value)}
              {...fieldProps("verifierId")}
            />
          </CourtFormField>
          <CourtFormField
            htmlFor={fieldId("verifierVersion")}
            label="Verifier version"
          >
            <Input
              id={fieldId("verifierVersion")}
              value={draft.verifierVersion}
              onChange={(event) =>
                update("verifierVersion", event.target.value)
              }
              {...fieldProps("verifierVersion")}
            />
          </CourtFormField>
        </div>
      ) : null}

      <CourtFormField
        htmlFor={fieldId("digest")}
        label="SHA-256 digest"
        hint="Use sha256: followed by exactly 64 lowercase hexadecimal characters. The server never fetches external evidence."
      >
        <Input
          id={fieldId("digest")}
          value={draft.digest}
          placeholder="sha256:..."
          onChange={(event) => update("digest", event.target.value)}
          {...fieldProps("digest")}
        />
      </CourtFormField>
      {error ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}

function CourtEvidenceSafetyNote() {
  return (
    <p className="text-sm leading-6 text-muted">
      Do not publish biometrics, private keys, exploit archives, doxxing, or
      illegal material. The Court stores only this reference and digest; it does
      not upload, embed, or fetch the content.
    </p>
  );
}

export function CourtEvidenceAccessOptions({
  accesses = COURT_REPORT_EVIDENCE_ACCESS,
}: {
  accesses?: readonly CourtEvidenceDraft["access"][];
}) {
  return (
    <>
      {accesses.map((access) => (
        <option key={access} value={access}>
          {courtEvidenceAccessLabel(access)}
        </option>
      ))}
    </>
  );
}

export function CourtEvidenceComposer({
  draft,
  error,
  idPrefix,
  onChange,
}: {
  draft: CourtEvidenceDraft;
  error: CourtEvidenceDraftError | null;
  idPrefix: string;
  onChange: (next: CourtEvidenceDraft) => void;
}) {
  return (
    <>
      <CourtEvidenceDraftFields
        draft={draft}
        error={error}
        idPrefix={idPrefix}
        onChange={onChange}
      />
      <CourtEvidenceSafetyNote />
    </>
  );
}

export function CourtNarrativeRequirement({
  current,
  maximum,
  minimum,
}: {
  current: number;
  maximum?: number;
  minimum: number;
}) {
  const ready =
    current >= minimum && (maximum === undefined || current <= maximum);
  return (
    <p className={cn("text-xs", ready ? "text-muted" : "text-destructive")}>
      {current.toLocaleString()} characters. Minimum {minimum.toLocaleString()}
      {maximum === undefined ? "." : `; maximum ${maximum.toLocaleString()}.`}
    </p>
  );
}

export function CourtDecisionSummary({
  items,
  replacement,
  title = "Decision to record",
}: {
  items: { label: string; value: ReactNode }[];
  replacement?: ReactNode;
  title?: string;
}) {
  return (
    <div className="border-t border-border/70 pt-4">
      <p className="text-xs font-semibold text-muted uppercase">{title}</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="mt-1 text-sm font-medium break-words text-text">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      {replacement ? (
        <p className="mt-3 text-xs leading-5 text-muted">{replacement}</p>
      ) : null}
    </div>
  );
}

export function CourtActionFeedback({
  actionError,
  actionField,
  notice,
  onRetryRefresh,
  refreshError,
}: {
  actionError: string | null;
  actionField?: string | null;
  notice: string | null;
  onRetryRefresh?: () => void;
  refreshError: string | null;
}) {
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (actionError || notice || refreshError) feedbackRef.current?.focus();
  }, [actionError, notice, refreshError]);
  if (!actionError && !notice && !refreshError) return null;
  return (
    <div
      ref={feedbackRef}
      className="space-y-2 outline-none"
      aria-live="polite"
      tabIndex={-1}
    >
      {notice ? <p className="text-sm text-primary">{notice}</p> : null}
      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
          {actionField ? ` Check ${courtLabel(actionField)}.` : ""}
        </p>
      ) : null}
      {refreshError ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-destructive" role="alert">
            The action was recorded, but the latest Court record could not be
            loaded: {refreshError}
          </p>
          {onRetryRefresh ? (
            <Button size="compact" variant="outline" onClick={onRetryRefresh}>
              Retry record
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function CourtAsyncButton({
  busy,
  busyLabel,
  children,
  disabled,
  ...props
}: ButtonProps & {
  busy: boolean;
  busyLabel: string;
}) {
  return (
    <Button
      {...props}
      aria-busy={busy}
      disabled={busy || disabled}
      className={cn("min-w-32", props.className)}
    >
      {busy ? busyLabel : children}
    </Button>
  );
}
