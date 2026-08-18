import { useState } from "react";

import { GlassyTile } from "@/components/GlassySection";
import { Input } from "@/components/primitives/input";
import {
  apiRecuseFromCourtJuryV2,
  apiRespondToCourtJuryV2,
} from "@/lib/apiClient";
import {
  CourtAsyncButton,
  CourtFormField,
  CourtNarrativeRequirement,
} from "../forms/CourtFormUi";
import {
  COURT_REASON_MAX_LENGTH,
  COURT_REASON_MIN_LENGTH,
} from "../model/courtConstraints";
import type { CourtActionGroupProps } from "./actionTypes";

export function JuryDutyActions({
  actionLocked,
  busy,
  can,
  caseId,
  run,
}: CourtActionGroupProps) {
  const [recusalReason, setRecusalReason] = useState("");
  const invitationLocked =
    busy !== null ||
    (["accept", "decline", "conflict"] as const).some((response) =>
      actionLocked(`jury-invitation-${response}`),
    );

  return (
    <>
      {can("accept_jury_seat") ? (
        <GlassyTile className="space-y-4">
          <h3 className="text-base font-semibold text-text">Jury invitation</h3>
          <p className="text-sm leading-6 text-muted">
            Accept only if you can decide independently. Disclose any conflict
            instead of taking the seat.
          </p>
          <div className="flex flex-wrap gap-2">
            <CourtAsyncButton
              busy={busy === `${caseId}:jury-invitation-accept`}
              busyLabel="Accepting duty..."
              disabled={invitationLocked}
              onClick={() =>
                void run("jury-invitation-accept", (idempotencyKey) =>
                  apiRespondToCourtJuryV2(
                    { caseId, response: "accept", conflict: "clear" },
                    { idempotencyKey },
                  ),
                )
              }
            >
              Accept duty
            </CourtAsyncButton>
            <CourtAsyncButton
              busy={busy === `${caseId}:jury-invitation-decline`}
              busyLabel="Declining duty..."
              disabled={invitationLocked}
              variant="outline"
              onClick={() =>
                void run("jury-invitation-decline", (idempotencyKey) =>
                  apiRespondToCourtJuryV2(
                    { caseId, response: "decline", conflict: "clear" },
                    { idempotencyKey },
                  ),
                )
              }
            >
              Decline duty
            </CourtAsyncButton>
            <CourtAsyncButton
              busy={busy === `${caseId}:jury-invitation-conflict`}
              busyLabel="Recording conflict..."
              disabled={invitationLocked}
              variant="outline"
              onClick={() =>
                void run("jury-invitation-conflict", (idempotencyKey) =>
                  apiRespondToCourtJuryV2(
                    {
                      caseId,
                      response: "decline",
                      conflict: "self_disclosed",
                    },
                    { idempotencyKey },
                  ),
                )
              }
            >
              Disclose conflict
            </CourtAsyncButton>
          </div>
        </GlassyTile>
      ) : null}

      {can("recuse_jury_seat") ? (
        <GlassyTile>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run("recusal", (idempotencyKey) =>
                apiRecuseFromCourtJuryV2(
                  { caseId, reason: recusalReason.trim() },
                  { idempotencyKey },
                ),
              );
            }}
          >
            <h3 className="text-base font-semibold text-text">
              Disclose a conflict
            </h3>
            <p className="text-sm leading-6 text-muted">
              Recusal vacates your accepted seat and invites the next recorded
              alternate.
            </p>
            <CourtFormField
              htmlFor="court-recusal-reason"
              label="Conflict or inability to serve"
            >
              <Input
                id="court-recusal-reason"
                value={recusalReason}
                onChange={(event) => setRecusalReason(event.target.value)}
                minLength={COURT_REASON_MIN_LENGTH}
                maxLength={COURT_REASON_MAX_LENGTH}
              />
            </CourtFormField>
            <CourtNarrativeRequirement
              current={recusalReason.trim().length}
              minimum={COURT_REASON_MIN_LENGTH}
              maximum={COURT_REASON_MAX_LENGTH}
            />
            <CourtAsyncButton
              busy={busy === `${caseId}:recusal`}
              busyLabel="Recording recusal..."
              disabled={
                actionLocked("recusal") ||
                recusalReason.trim().length < COURT_REASON_MIN_LENGTH ||
                recusalReason.trim().length > COURT_REASON_MAX_LENGTH
              }
              variant="outline"
            >
              Recuse from this jury
            </CourtAsyncButton>
          </form>
        </GlassyTile>
      ) : null}
    </>
  );
}
