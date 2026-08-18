import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import { Button, type ButtonProps } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import { cn } from "@/lib/utils";
import {
  COURT_EVIDENCE_KINDS,
  COURT_REPORTABLE_TARGET_TYPES,
  COURT_REPORT_EVIDENCE_ACCESS,
  type CourtEvidenceDraft,
  type CourtEvidenceDraftError,
} from "./courtEvidenceForm";

const EVIDENCE_KIND_LABELS = Object.freeze({
  vortex_reference: "Vortex record",
  external_url: "External URL",
  protocol_proof: "Protocol proof",
});

const EVIDENCE_ACCESS_LABELS = Object.freeze({
  public: "Public after finality",
  parties_and_jury: "Parties and seated jury",
  jury_only_pending_summary: "Jury only pending summary",
  security_sealed: "Authorized safety reviewers",
});

function formLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

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

export function CourtEvidencePairFields({
  digest,
  idPrefix,
  onDigestChange,
  onUrlChange,
  url,
}: {
  digest: string;
  idPrefix: string;
  onDigestChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  url: string;
}) {
  const incomplete = Boolean(url.trim()) !== Boolean(digest.trim());
  const errorId = `${idPrefix}-evidence-error`;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <CourtFormField
          htmlFor={`${idPrefix}-evidence-url`}
          label="External evidence URL"
        >
          <Input
            id={`${idPrefix}-evidence-url`}
            type="url"
            value={url}
            aria-describedby={incomplete ? errorId : undefined}
            aria-invalid={incomplete}
            onChange={(event) => onUrlChange(event.target.value)}
          />
        </CourtFormField>
        <CourtFormField
          htmlFor={`${idPrefix}-evidence-digest`}
          label="Evidence digest"
        >
          <Input
            id={`${idPrefix}-evidence-digest`}
            value={digest}
            placeholder="sha256:..."
            aria-describedby={incomplete ? errorId : undefined}
            aria-invalid={incomplete}
            onChange={(event) => onDigestChange(event.target.value)}
          />
        </CourtFormField>
      </div>
      {incomplete ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          Evidence requires both an external URL and its immutable digest.
        </p>
      ) : null}
    </>
  );
}

export function CourtEvidenceDraftFields({
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
            {COURT_REPORT_EVIDENCE_ACCESS.map((access) => (
              <option key={access} value={access}>
                {EVIDENCE_ACCESS_LABELS[access]}
              </option>
            ))}
          </Select>
        </CourtFormField>
      </div>

      {draft.kind === "external_url" ? (
        <CourtFormField
          htmlFor={`${idPrefix}-url`}
          label="External evidence URL"
        >
          <Input
            id={`${idPrefix}-url`}
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
            htmlFor={`${idPrefix}-target-type`}
            label="Vortex record type"
          >
            <Select
              id={`${idPrefix}-target-type`}
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
                  {formLabel(targetType)}
                </option>
              ))}
            </Select>
          </CourtFormField>
          <CourtFormField
            htmlFor={`${idPrefix}-target-id`}
            label="Vortex record id"
          >
            <Input
              id={`${idPrefix}-target-id`}
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
          <CourtFormField htmlFor={`${idPrefix}-proof-type`} label="Proof type">
            <Input
              id={`${idPrefix}-proof-type`}
              value={draft.proofType}
              onChange={(event) => update("proofType", event.target.value)}
              {...fieldProps("proofType")}
            />
          </CourtFormField>
          <CourtFormField
            htmlFor={`${idPrefix}-verifier-id`}
            label="Verifier id"
          >
            <Input
              id={`${idPrefix}-verifier-id`}
              value={draft.verifierId}
              onChange={(event) => update("verifierId", event.target.value)}
              {...fieldProps("verifierId")}
            />
          </CourtFormField>
          <CourtFormField
            htmlFor={`${idPrefix}-verifier-version`}
            label="Verifier version"
          >
            <Input
              id={`${idPrefix}-verifier-version`}
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
        htmlFor={`${idPrefix}-digest`}
        label="SHA-256 digest"
        hint="Use sha256: followed by exactly 64 lowercase hexadecimal characters. The server never fetches external evidence."
      >
        <Input
          id={`${idPrefix}-digest`}
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

export function CourtEvidenceSafetyNote() {
  return (
    <p className="text-sm leading-6 text-muted">
      Do not publish biometrics, private keys, exploit archives, doxxing, or
      illegal material. The Court stores only this reference and digest; it does
      not upload, embed, or fetch the content.
    </p>
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
          {actionField ? ` Check ${formLabel(actionField)}.` : ""}
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
