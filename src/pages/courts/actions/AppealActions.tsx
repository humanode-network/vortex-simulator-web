import { useState } from "react";

import { GlassyTile } from "@/components/GlassySection";
import { ProposalNarrativeEditor } from "@/components/ProposalNarrative";
import { Select } from "@/components/primitives/select";
import {
  apiCastCourtAppellateVoteV2,
  apiFileCourtAppealV2,
  apiProposeCourtAppellateModificationV2,
  apiRespondToCourtAppellateJuryV2,
  apiRespondToCourtReopeningJuryV2,
} from "@/lib/apiClient";
import type { CourtCaseViewerV2Dto } from "@/types/api";
import { courtInitialAppellateResult } from "../model/courtBallot";
import { courtLabel } from "../components/CourtPrimitives";
import {
  CourtAsyncButton,
  CourtDecisionSummary,
  CourtFormField,
  CourtNarrativeRequirement,
} from "../forms/CourtFormUi";
import {
  COURT_APPEAL_GROUNDS,
  courtAppealGroundDisplay,
  courtRemedyLabel,
} from "../model/courtPresentation";
import {
  COURT_STATEMENT_MAX_LENGTH,
  COURT_STATEMENT_MIN_LENGTH,
} from "../model/courtConstraints";
import type { CourtActionGroupProps } from "./actionTypes";
import { CourtCodexCheckbox } from "./CourtCodexCheckbox";

export function AppealActions({
  actionLocked,
  busy,
  can,
  caseId,
  courtCase,
  run,
}: CourtActionGroupProps & { courtCase: CourtCaseViewerV2Dto }) {
  const [appealGround, setAppealGround] = useState<
    (typeof COURT_APPEAL_GROUNDS)[number]
  >(COURT_APPEAL_GROUNDS[0]);
  const [appeal, setAppeal] = useState("");
  const [requestStay, setRequestStay] = useState(true);
  const [appellateResult, setAppellateResult] = useState<
    "affirmed" | "reversed" | "remanded" | "modified"
  >(() => courtInitialAppellateResult(courtCase.appellateTask));
  const [appellateReasoning, setAppellateReasoning] = useState("");
  const [modificationPackageId, setModificationPackageId] = useState(
    courtCase.appellateTask?.existingVote?.modificationPackageId ?? "",
  );
  const [retainedRemedyIds, setRetainedRemedyIds] = useState<Set<string>>(
    () =>
      new Set(
        courtCase.appellateTask?.remedies.map((remedy) => remedy.id) ?? [],
      ),
  );
  const invitationLocked =
    busy !== null ||
    (["accept", "decline", "conflict"] as const).some((response) =>
      actionLocked(`appellate-invitation-${response}`),
    );
  const appellateTask = courtCase.appellateTask;

  return (
    <>
      {can("file_appeal") ? (
        <GlassyTile>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run("appeal", (idempotencyKey) =>
                apiFileCourtAppealV2(
                  {
                    caseId,
                    groundCode: appealGround,
                    grounds: appeal.trim(),
                    requestStay,
                  },
                  { idempotencyKey },
                ),
              );
            }}
          >
            <h3 className="text-base font-semibold text-text">
              File an appeal
            </h3>
            <CourtFormField htmlFor="court-appeal-ground" label="Ground">
              <Select
                id="court-appeal-ground"
                value={appealGround}
                onChange={(event) =>
                  setAppealGround(event.target.value as typeof appealGround)
                }
              >
                {COURT_APPEAL_GROUNDS.map((ground) => (
                  <option key={ground} value={ground}>
                    {courtAppealGroundDisplay(ground).label}
                  </option>
                ))}
              </Select>
            </CourtFormField>
            <p className="text-sm leading-6 text-muted">
              {courtAppealGroundDisplay(appealGround).description}
            </p>
            <ProposalNarrativeEditor
              documentLabel="Appeal"
              id="court-appeal-grounds"
              value={appeal}
              onChange={setAppeal}
              placeholder="Explain the material error or new evidence supporting this appeal."
              rows={8}
            />
            <CourtNarrativeRequirement
              current={appeal.trim().length}
              minimum={COURT_STATEMENT_MIN_LENGTH}
              maximum={COURT_STATEMENT_MAX_LENGTH}
            />
            <label className="flex items-center gap-2 text-sm font-medium text-text">
              <input
                type="checkbox"
                checked={requestStay}
                onChange={(event) => setRequestStay(event.target.checked)}
              />
              Request a stay while the appeal is reviewed
            </label>
            <CourtDecisionSummary
              items={[
                {
                  label: "Ground",
                  value: courtAppealGroundDisplay(appealGround).label,
                },
                {
                  label: "Stay requested",
                  value: requestStay ? "Yes" : "No",
                },
              ]}
            />
            <CourtAsyncButton
              busy={busy === `${caseId}:appeal`}
              busyLabel="Filing appeal..."
              disabled={
                actionLocked("appeal") ||
                appeal.trim().length < COURT_STATEMENT_MIN_LENGTH ||
                appeal.trim().length > COURT_STATEMENT_MAX_LENGTH
              }
            >
              File appeal
            </CourtAsyncButton>
          </form>
        </GlassyTile>
      ) : null}

      {can("respond_appellate_invitation") ||
      can("respond_reopening_invitation") ? (
        <GlassyTile className="space-y-4">
          <h3 className="text-base font-semibold text-text">
            {can("respond_reopening_invitation")
              ? "Reopening panel invitation"
              : "Appeal panel invitation"}
          </h3>
          <p className="text-sm leading-6 text-muted">
            This panel must remain distinct from prior juries. Accept only if
            you can serve independently and disclose any conflict.
          </p>
          <div className="flex flex-wrap gap-2">
            {(["accept", "decline", "conflict"] as const).map((response) => (
              <CourtAsyncButton
                key={response}
                busy={busy === `${caseId}:appellate-invitation-${response}`}
                busyLabel={
                  response === "accept"
                    ? "Accepting duty..."
                    : response === "decline"
                      ? "Declining duty..."
                      : "Recording conflict..."
                }
                disabled={invitationLocked}
                variant={response === "accept" ? "primary" : "outline"}
                onClick={() =>
                  void run(
                    `appellate-invitation-${response}`,
                    (idempotencyKey) =>
                      can("respond_reopening_invitation")
                        ? apiRespondToCourtReopeningJuryV2(
                            { panelId: appellateTask!.panelId, response },
                            { idempotencyKey },
                          )
                        : apiRespondToCourtAppellateJuryV2(
                            { panelId: appellateTask!.panelId, response },
                            { idempotencyKey },
                          ),
                  )
                }
              >
                {response === "accept"
                  ? "Accept duty"
                  : response === "decline"
                    ? "Decline"
                    : "Disclose conflict"}
              </CourtAsyncButton>
            ))}
          </div>
        </GlassyTile>
      ) : null}

      {can("propose_appellate_modification") &&
      appellateTask?.remedies.length ? (
        <GlassyTile>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                "modification",
                (idempotencyKey) =>
                  apiProposeCourtAppellateModificationV2(
                    {
                      panelId: appellateTask.panelId,
                      retainedRemedyIds: [...retainedRemedyIds],
                    },
                    { idempotencyKey },
                  ),
                undefined,
                true,
              );
            }}
          >
            <h3 className="text-base font-semibold text-text">
              Propose a reduced remedy package
            </h3>
            <p className="text-sm leading-6 text-muted">
              A modification can retain or remove existing remedies. It cannot
              add a component or increase the original burden.
            </p>
            <div className="grid gap-2">
              {appellateTask.remedies.map((remedy) => (
                <CourtCodexCheckbox
                  key={remedy.id}
                  checked={retainedRemedyIds.has(remedy.id)}
                  label={courtRemedyLabel(remedy.componentCode)}
                  onChange={(retain) =>
                    setRetainedRemedyIds((current) => {
                      const next = new Set(current);
                      if (retain) next.add(remedy.id);
                      else next.delete(remedy.id);
                      return next;
                    })
                  }
                  prefix="Keep "
                  reference={remedy.componentCode}
                />
              ))}
            </div>
            <CourtDecisionSummary
              items={[
                {
                  label: "Retained remedies",
                  value: `${retainedRemedyIds.size} of ${appellateTask.remedies.length}`,
                },
                {
                  label: "Effect",
                  value: "Reduce the original package only",
                },
              ]}
            />
            <CourtAsyncButton
              busy={busy === `${caseId}:modification`}
              busyLabel="Proposing package..."
              disabled={
                actionLocked("modification") ||
                retainedRemedyIds.size === appellateTask.remedies.length
              }
            >
              Propose modification
            </CourtAsyncButton>
          </form>
        </GlassyTile>
      ) : null}

      {can("vote_appeal") ? (
        <GlassyTile>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                "appellate-vote",
                (idempotencyKey) =>
                  appellateResult === "modified"
                    ? apiCastCourtAppellateVoteV2(
                        {
                          panelId: appellateTask!.panelId,
                          result: appellateResult,
                          modificationPackageId,
                          reasoning: appellateReasoning.trim(),
                        },
                        { idempotencyKey },
                      )
                    : apiCastCourtAppellateVoteV2(
                        {
                          panelId: appellateTask!.panelId,
                          result: appellateResult,
                          reasoning: appellateReasoning.trim(),
                        },
                        { idempotencyKey },
                      ),
                undefined,
                true,
              );
            }}
          >
            <h3 className="text-base font-semibold text-text">
              Appeal decision
            </h3>
            <CourtFormField htmlFor="court-appellate-outcome" label="Outcome">
              <Select
                id="court-appellate-outcome"
                value={appellateResult}
                onChange={(event) =>
                  setAppellateResult(
                    event.target.value as typeof appellateResult,
                  )
                }
              >
                <option value="affirmed">Affirm</option>
                <option value="reversed">Reverse</option>
                <option value="remanded">Remand for a new trial</option>
                <option value="modified">Adopt a modification</option>
              </Select>
            </CourtFormField>
            {appellateResult === "modified" ? (
              <CourtFormField
                htmlFor="court-modification-package"
                label="Modification package"
              >
                <Select
                  id="court-modification-package"
                  value={modificationPackageId}
                  onChange={(event) =>
                    setModificationPackageId(event.target.value)
                  }
                  required
                >
                  <option value="">Choose a package</option>
                  {appellateTask?.modificationPackages
                    .filter((item) => item.state === "proposed")
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.retainedRemedyIds.length} retained · burden{" "}
                        {item.modifiedBurden}
                      </option>
                    ))}
                </Select>
              </CourtFormField>
            ) : null}
            <ProposalNarrativeEditor
              documentLabel="Appellate reasoning"
              id="court-appellate-reasoning"
              value={appellateReasoning}
              onChange={setAppellateReasoning}
              placeholder="Explain the legal and evidentiary basis for this outcome."
              rows={7}
            />
            <CourtNarrativeRequirement
              current={appellateReasoning.trim().length}
              minimum={COURT_STATEMENT_MIN_LENGTH}
              maximum={COURT_STATEMENT_MAX_LENGTH}
            />
            <CourtDecisionSummary
              items={[
                { label: "Outcome", value: courtLabel(appellateResult) },
                {
                  label: "Modification package",
                  value:
                    appellateResult === "modified"
                      ? modificationPackageId || "Not selected"
                      : "Not applicable",
                },
              ]}
              replacement={
                appellateTask?.existingVote
                  ? "This replaces your currently recorded appellate vote."
                  : null
              }
            />
            <CourtAsyncButton
              busy={busy === `${caseId}:appellate-vote`}
              busyLabel="Casting appeal vote..."
              disabled={
                actionLocked("appellate-vote") ||
                appellateReasoning.trim().length < COURT_STATEMENT_MIN_LENGTH ||
                appellateReasoning.trim().length > COURT_STATEMENT_MAX_LENGTH ||
                (appellateResult === "modified" && !modificationPackageId)
              }
            >
              Cast appeal vote
            </CourtAsyncButton>
          </form>
        </GlassyTile>
      ) : null}
    </>
  );
}
