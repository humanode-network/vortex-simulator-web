import {
  FormationApplicationForm,
  type FormationApplicationDraft,
} from "./applications/FormationApplicationForm";
import { FormationApplicationCard } from "./applications/FormationApplicationCard";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useAuth } from "@/app/auth/AuthContext";
import { GlassySection } from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import { formatLoadError } from "@/lib/errorFormatting";
import { getApiErrorPayload } from "@/lib/api/http";
import { formationApplicationError } from "@/lib/formationApplicationUi";
import {
  apiFormationApplication,
  apiFormationApplicationCommand,
  apiFormationApplications,
  type ApplicationCommand,
  type FormationApplication,
  type FormationApplicationPage,
  type FormationApplicationRow,
} from "@/lib/api/formationApplications";

type Props = {
  initialApplication?: FormationApplication;
  initialRecruitmentBlock?: string | null;
  proposalId?: string;
  isProposer?: boolean;
  canApply?: boolean;
  openRoles?: Array<{ title: string; desc: string }>;
  urgent?: boolean;
  onChanged?: () => Promise<void>;
  onPendingChange?: (pending: boolean) => void;
};

export function FormationApplications(props: Props) {
  const auth = useAuth();
  if (!auth.authenticated || !auth.address) return null;
  // Remount private state synchronously on identity or scope changes.
  return (
    <ApplicationWorkspace
      key={`${auth.address}:${props.proposalId ?? "feed"}:${props.urgent ?? false}`}
      {...props}
      eligible={auth.eligible}
    />
  );
}

function ApplicationWorkspace({
  initialApplication,
  initialRecruitmentBlock,
  proposalId,
  isProposer = false,
  canApply = false,
  openRoles = [],
  urgent = false,
  onChanged,
  onPendingChange,
  eligible,
}: Props & { eligible: boolean }) {
  const [query] = useSearchParams();
  const selectedId =
    initialApplication?.id ?? (proposalId ? query.get("application") : null);
  const [page, setPage] = useState<FormationApplicationPage | null>(null);
  const [selected, setSelected] = useState<FormationApplicationRow | null>(
    initialApplication
      ? {
          application: initialApplication,
          proposalTitle: "",
          recruitmentBlock: initialRecruitmentBlock,
        }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<FormationApplicationDraft>({
    statement: "",
    role: "",
  });
  const inFlight = useRef(false);
  const generation = useRef(0);
  const receipts = useRef(new Map<string, string>());
  const reload = useCallback(
    async (cursor?: string) => {
      const request = ++generation.current;
      try {
        const result = await apiFormationApplications({
          proposalId,
          scope: urgent ? "review" : "visible",
          status: urgent ? "pending" : undefined,
          cursor,
        });
        if (request !== generation.current) return;
        setPage((previous) =>
          cursor && previous
            ? {
                ...result,
                items: [...previous.items, ...result.items].filter(
                  (row, index, rows) =>
                    rows.findIndex(
                      (other) => other.application.id === row.application.id,
                    ) === index,
                ),
              }
            : result,
        );
        if (proposalId && !isProposer && !cursor)
          onPendingChange?.(result.pendingCount > 0);
        if (selectedId && !cursor) {
          const listed = result.items.find(
            (row) => row.application.id === selectedId,
          );
          if (listed) setSelected(listed);
          const detail = await apiFormationApplication(selectedId);
          if (request !== generation.current) return;
          if (detail.application.proposalId === proposalId) {
            setSelected(detail);
          }
        }
        setError(null);
      } catch (cause) {
        if (request === generation.current)
          setError(formatLoadError((cause as Error).message));
      }
    },
    [proposalId, urgent, selectedId],
  );
  useEffect(() => {
    void reload();
    const refresh = () => {
      if (!inFlight.current) void reload();
    };
    window.addEventListener("focus", refresh);
    return () => {
      generation.current++;
      window.removeEventListener("focus", refresh);
    };
  }, [reload]);

  async function command(input: ApplicationCommand) {
    if (inFlight.current) return;
    inFlight.current = true;
    generation.current++;
    setBusy(true);
    setError(null);
    setNotice(null);
    const fingerprint = JSON.stringify(input);
    const key = receipts.current.get(fingerprint) ?? crypto.randomUUID();
    receipts.current.set(fingerprint, key);
    try {
      const result = await apiFormationApplicationCommand(input, key);
      receipts.current.delete(fingerprint);
      setPage((current) => {
        if (!current) return current;
        const updated = result.application;
        const previous = current.items.find(
          (row) => row.application.id === updated.id,
        )?.application;
        const wasPending =
          previous?.status === "pending" ||
          (input.type !== "formation.application.submit" && !previous);
        const items = current.items.map((row) =>
          row.application.id === updated.id
            ? { ...row, application: updated }
            : row,
        );
        if (!previous && input.type === "formation.application.submit")
          items.unshift({ application: updated, proposalTitle: "" });
        return {
          ...current,
          items: urgent
            ? items.filter((row) => row.application.status === "pending")
            : items,
          pendingCount: Math.max(
            0,
            current.pendingCount +
              Number(updated.status === "pending") -
              Number(wasPending),
          ),
        };
      });
      if (proposalId && !isProposer)
        onPendingChange?.(result.application.status === "pending");
      setSelected((current) =>
        selectedId === result.application.id ||
        current?.application.id === result.application.id
          ? {
              ...current,
              proposalTitle: current?.proposalTitle ?? "",
              application: result.application,
            }
          : current,
      );
      setNotice(
        input.type === "formation.application.submit"
          ? "Application submitted. The proposer will review it."
          : `Application ${result.application.status}.`,
      );
      if (input.type === "formation.application.submit")
        setDraft({ statement: "", role: "" });
      await reload();
      try {
        await onChanged?.();
      } catch {
        setError(
          "Your application change was saved, but the project could not refresh. Refresh to update the team.",
        );
      }
    } catch (cause) {
      const code = getApiErrorPayload(cause)?.error?.code;
      if (
        code === "formation_application_stale" ||
        code === "formation_application_resolved"
      ) {
        await reload();
      }
      setError(formationApplicationError(cause));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const items = page?.items ?? [];
  const listed = items.find((row) => row.application.id === selectedId);
  const currentSelected =
    selected?.application.id === selectedId ? selected : null;
  const focused =
    listed &&
    (!currentSelected ||
      listed.application.revision > currentSelected.application.revision)
      ? listed
      : currentSelected;
  const applications = focused
    ? [
        focused,
        ...items.filter((row) => row.application.id !== focused.application.id),
      ]
    : items;
  return (
    <div id="formation-applications" className="flex min-w-0 flex-col gap-4">
      {proposalId &&
        page &&
        !isProposer &&
        canApply &&
        page.pendingCount === 0 && (
          <FormationApplicationForm
            proposalId={proposalId}
            eligible={eligible}
            busy={busy}
            openRoles={openRoles}
            limits={page.limits}
            onCommand={command}
            value={draft}
            onChange={setDraft}
          />
        )}
      <GlassySection
        title={
          urgent ? "Formation applications to review" : "Team applications"
        }
        action={
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void reload()}
          >
            Refresh
          </Button>
        }
      >
        {error && (
          <p
            role="alert"
            className="text-sm [overflow-wrap:anywhere] text-destructive"
          >
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm">
            {notice}
          </p>
        )}
        {!page ? (
          <p className="text-sm text-muted">Loading applications...</p>
        ) : (
          <>
            <p className="text-sm text-muted">
              {page.pendingCount} pending{" "}
              {urgent || isProposer ? "review" : "application(s)"}
            </p>
            <div className="grid gap-3">
              {applications.map(
                ({ application, recruitmentBlock, proposalTitle }) => {
                  return (
                    <div
                      key={application.id}
                      id={
                        proposalId &&
                        !isProposer &&
                        application.status === "pending"
                          ? "formation-current-application"
                          : undefined
                      }
                    >
                      <FormationApplicationCard
                        application={application}
                        recruitmentBlock={recruitmentBlock ?? null}
                        title={proposalTitle}
                        review={isProposer || urgent}
                        linked={!proposalId}
                        eligible={eligible}
                        busy={busy}
                        reasonMax={page.limits.reasonMax}
                        onCommand={command}
                      />
                    </div>
                  );
                },
              )}
            </div>
            {applications.length === 0 && (
              <p className="text-sm text-muted">No applications yet.</p>
            )}
            {page.nextCursor && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void reload(page.nextCursor!)}
              >
                Load more applications
              </Button>
            )}
          </>
        )}
      </GlassySection>
    </div>
  );
}
