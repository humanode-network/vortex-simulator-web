import { useEffect, useState } from "react";
import { FormationConfirmation } from "../FormationConfirmation";
import { Link } from "react-router";
import { AddressInline } from "@/components/AddressInline";
import { GlassyStatusChip, GlassyTile } from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { ProposalNarrative } from "@/components/ProposalNarrative";
import { formatDateTime } from "@/lib/dateTime";
import { formationApplicationBlockMessage } from "@/lib/formationApplicationUi";
import type {
  ApplicationCommand,
  FormationApplication,
} from "@/lib/api/formationApplications";

export function FormationApplicationCard({
  application,
  recruitmentBlock,
  title,
  review,
  linked,
  eligible,
  busy,
  reasonMax,
  onCommand,
}: {
  application: FormationApplication;
  recruitmentBlock: string | null;
  title?: string;
  review: boolean;
  linked: boolean;
  eligible: boolean;
  busy: boolean;
  reasonMax: number;
  onCommand: (command: ApplicationCommand) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [decision, setDecision] = useState<
    "accept" | "decline" | "withdraw" | null
  >(null);
  const pending = application.status === "pending";
  useEffect(() => {
    setDecision(null);
  }, [application.revision, recruitmentBlock]);
  return (
    <GlassyTile className="min-w-0 space-y-3 [overflow-wrap:anywhere]">
      {title && linked && <h3 className="text-base font-semibold">{title}</h3>}
      <div className="flex flex-wrap items-center gap-3">
        <AddressInline address={application.applicantAddress} />
        <GlassyStatusChip
          tone={
            pending
              ? "warn"
              : application.status === "accepted"
                ? "ok"
                : "neutral"
          }
        >
          {application.status}
        </GlassyStatusChip>
      </div>
      <p className="text-xs text-muted">
        Submitted {formatDateTime(application.createdAt)}
        {application.role ? ` · ${application.role}` : ""}
      </p>
      {linked ? (
        <Button asChild variant="outline">
          <Link
            to={`/app/formation/applications/${encodeURIComponent(application.id)}`}
          >
            {pending && review ? "Review application" : "Open application"}
          </Link>
        </Button>
      ) : (
        <>
          <div
            role="region"
            aria-label="Application statement"
            tabIndex={0}
            className="max-h-[min(24rem,30dvh)] overflow-y-auto overscroll-contain rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ProposalNarrative value={application.statement} />
          </div>
          {application.resolutionReason && (
            <div>
              <p className="text-sm font-semibold">Decision note</p>
              <ProposalNarrative value={application.resolutionReason} />
            </div>
          )}
          {pending && (
            <div className="space-y-3">
              {review && recruitmentBlock && (
                <p role="status" className="text-sm text-muted">
                  {formationApplicationBlockMessage(recruitmentBlock)}
                </p>
              )}
              {review && (
                <label className="block space-y-2 text-sm">
                  <span>Decision note (optional)</span>
                  <Input
                    value={reason}
                    maxLength={reasonMax}
                    disabled={busy}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
              )}
              <div className="flex flex-wrap gap-2">
                {review ? (
                  <>
                    <Button
                      disabled={busy || !eligible || Boolean(recruitmentBlock)}
                      onClick={() => setDecision("accept")}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy || !eligible}
                      onClick={() => setDecision("decline")}
                    >
                      Decline
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => setDecision("withdraw")}
                  >
                    Withdraw application
                  </Button>
                )}
              </div>
              {review && !eligible && (
                <p className="text-sm text-muted">
                  An active Human Node is required to review applications.
                </p>
              )}
              {decision && (
                <FormationConfirmation
                  label="Confirm application decision"
                  confirmLabel={`Confirm ${decision}`}
                  busy={busy}
                  onCancel={() => setDecision(null)}
                  disabled={
                    (decision !== "withdraw" && !eligible) ||
                    (decision === "accept" && Boolean(recruitmentBlock))
                  }
                  onConfirm={() =>
                    void onCommand(
                      decision === "withdraw"
                        ? {
                            type: "formation.application.withdraw",
                            payload: {
                              applicationId: application.id,
                              expectedRevision: application.revision,
                            },
                          }
                        : {
                            type: "formation.application.review",
                            payload: {
                              applicationId: application.id,
                              expectedRevision: application.revision,
                              decision,
                              ...(reason.trim()
                                ? { reason: reason.trim() }
                                : {}),
                            },
                          },
                    )
                  }
                >
                  {decision === "accept"
                    ? "Accept this applicant into the team? Eligibility and capacity will be checked again."
                    : decision === "decline"
                      ? "Decline this application?"
                      : "Withdraw your application?"}
                </FormationConfirmation>
              )}
            </div>
          )}
        </>
      )}
    </GlassyTile>
  );
}
