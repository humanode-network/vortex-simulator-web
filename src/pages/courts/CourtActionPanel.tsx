import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";

import { GlassySection, GlassyTile } from "@/components/GlassySection";
import { ProposalNarrativeEditor } from "@/components/ProposalNarrative";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import {
  apiAddCourtEvidenceV2,
  apiCastCourtAppellateVoteV2,
  apiCastCourtFindingVoteV2,
  apiCastCourtReopeningVoteV2,
  apiCastCourtRemedyVoteV2,
  apiChallengeCourtEvidenceV2,
  apiFileCourtAppealV2,
  apiFileCourtReopeningV2,
  apiProposeCourtAppellateModificationV2,
  apiRecuseFromCourtJuryV2,
  apiRespondToCourtJuryV2,
  apiRespondToCourtAppellateJuryV2,
  apiRespondToCourtReopeningJuryV2,
  apiSubmitCourtResponseV2,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import type { CourtCaseViewerV2Dto } from "@/types/api";
import { courtLabel } from "./courtUi";

type ActionCapability =
  | "accept_jury_seat"
  | "challenge_evidence"
  | "file_appeal"
  | "file_reopening"
  | "propose_appellate_modification"
  | "recuse_jury_seat"
  | "submit_evidence"
  | "submit_response"
  | "respond_appellate_invitation"
  | "respond_reopening_invitation"
  | "vote_appeal"
  | "vote_finding"
  | "vote_sentence"
  | "vote_reopening";

type RemedyComponent = {
  id: string;
  mode: "mandatory" | "optional";
  value:
    | { kind: "categorical" | "permanent" }
    | { kind: "ordered_scope"; levels: string[] }
    | {
        kind: "quantitative";
        range: { min: string; max: string; step: string };
      };
};

type RemedyChoice = {
  include: boolean;
  conditionalValue?: string | boolean;
};

const APPEAL_GROUNDS = [
  "material_procedural_error",
  "juror_ineligibility_or_conflict",
  "material_evidence_error",
  "policy_or_envelope_violation",
  "material_new_evidence",
  "executor_mismatch",
] as const;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function remedyComponents(
  definition: Record<string, unknown>,
): RemedyComponent[] {
  const envelope = record(definition.envelope);
  const components = envelope?.components;
  if (!Array.isArray(components)) return [];
  const result: RemedyComponent[] = [];
  for (const candidate of components) {
    const item = record(candidate);
    const value = record(item?.value);
    if (
      !item ||
      typeof item.id !== "string" ||
      (item.mode !== "mandatory" && item.mode !== "optional") ||
      !value ||
      typeof value.kind !== "string"
    ) {
      continue;
    }
    if (value.kind === "categorical" || value.kind === "permanent") {
      result.push({
        id: item.id,
        mode: item.mode,
        value: { kind: value.kind },
      });
      continue;
    }
    if (
      value.kind === "ordered_scope" &&
      Array.isArray(value.levels) &&
      value.levels.every((level) => typeof level === "string")
    ) {
      result.push({
        id: item.id,
        mode: item.mode,
        value: { kind: value.kind, levels: value.levels },
      });
      continue;
    }
    const range = record(value.range);
    if (
      value.kind === "quantitative" &&
      typeof range?.min === "string" &&
      typeof range.max === "string" &&
      typeof range.step === "string"
    ) {
      result.push({
        id: item.id,
        mode: item.mode,
        value: {
          kind: value.kind,
          range: { min: range.min, max: range.max, step: range.step },
        },
      });
    }
  }
  return result;
}

function initialRemedyChoice(component: RemedyComponent): RemedyChoice {
  if (component.value.kind === "permanent") {
    return { include: component.mode === "mandatory", conditionalValue: false };
  }
  if (component.value.kind === "ordered_scope") {
    return {
      include: component.mode === "mandatory",
      conditionalValue: component.value.levels[0] ?? "",
    };
  }
  if (component.value.kind === "quantitative") {
    return {
      include: component.mode === "mandatory",
      conditionalValue: component.value.range.min,
    };
  }
  return { include: component.mode === "mandatory" };
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-text">
      {label}
      {children}
    </label>
  );
}

export function CourtActionPanel({
  courtCase,
  onCompleted,
}: {
  courtCase: CourtCaseViewerV2Dto;
  onCompleted: () => Promise<void>;
}) {
  const caseId = courtCase.publicCase?.id ?? "";
  const ballot = courtCase.juryTask?.ballot ?? null;
  const components = useMemo(
    () =>
      ballot?.type === "remedy" ? remedyComponents(ballot.definition) : [],
    [ballot],
  );
  const [response, setResponse] = useState("");
  const [evidenceStatement, setEvidenceStatement] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceDigest, setEvidenceDigest] = useState("");
  const [challengedEvidenceId, setChallengedEvidenceId] = useState("");
  const [challengeReason, setChallengeReason] = useState("");
  const [recusalReason, setRecusalReason] = useState("");
  const [finding, setFinding] = useState<"dismissed" | "substantiated">(
    "dismissed",
  );
  const [severity, setSeverity] = useState<"L1" | "L2" | "L3" | "L4">("L1");
  const [authorizeSentence, setAuthorizeSentence] = useState(true);
  const [choices, setChoices] = useState<Record<string, RemedyChoice>>(() =>
    Object.fromEntries(
      components.map((item) => [item.id, initialRemedyChoice(item)]),
    ),
  );
  const [appealGround, setAppealGround] = useState<
    (typeof APPEAL_GROUNDS)[number]
  >(APPEAL_GROUNDS[0]);
  const [appeal, setAppeal] = useState("");
  const [requestStay, setRequestStay] = useState(true);
  const [appellateResult, setAppellateResult] = useState<
    "affirmed" | "reversed" | "remanded" | "modified"
  >("affirmed");
  const [appellateReasoning, setAppellateReasoning] = useState("");
  const [modificationPackageId, setModificationPackageId] = useState("");
  const [retainedRemedyIds, setRetainedRemedyIds] = useState<Set<string>>(
    () =>
      new Set(
        courtCase.appellateTask?.remedies.map((remedy) => remedy.id) ?? [],
      ),
  );
  const [reopeningEvidenceReference, setReopeningEvidenceReference] =
    useState("");
  const [reopeningStatement, setReopeningStatement] = useState("");
  const [reopenVote, setReopenVote] = useState(true);
  const [reopeningReasoning, setReopeningReasoning] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const can = (capability: ActionCapability) =>
    courtCase.capabilities[capability] === true;
  const hasActions =
    can("submit_response") ||
    can("submit_evidence") ||
    can("challenge_evidence") ||
    can("accept_jury_seat") ||
    can("recuse_jury_seat") ||
    can("vote_finding") ||
    can("vote_sentence") ||
    can("file_appeal") ||
    can("respond_appellate_invitation") ||
    can("propose_appellate_modification") ||
    can("vote_appeal") ||
    can("file_reopening") ||
    can("respond_reopening_invitation") ||
    can("vote_reopening");
  if (!caseId || !hasActions) return null;

  async function run(name: string, action: () => Promise<unknown>) {
    setBusy(name);
    setError(null);
    try {
      await action();
      await onCompleted();
    } catch (actionError) {
      setError(
        formatLoadError(
          actionError instanceof Error
            ? actionError.message
            : String(actionError),
        ),
      );
    } finally {
      setBusy(null);
    }
  }

  async function submitResponse(event: FormEvent) {
    event.preventDefault();
    await run("response", async () => {
      await apiSubmitCourtResponseV2({
        caseId,
        statement: response.trim(),
        access: "parties_and_jury",
      });
      setResponse("");
    });
  }

  async function submitEvidence(event: FormEvent) {
    event.preventDefault();
    await run("evidence", async () => {
      await apiAddCourtEvidenceV2({
        caseId,
        statement: evidenceStatement.trim() || null,
        statementAccess: "parties_and_jury",
        evidence:
          evidenceUrl.trim() && evidenceDigest.trim()
            ? [
                {
                  kind: "external_url",
                  url: evidenceUrl.trim(),
                  digest: evidenceDigest.trim(),
                  provenance: "party_supplied",
                  access: "parties_and_jury",
                },
              ]
            : [],
      });
      setEvidenceStatement("");
      setEvidenceUrl("");
      setEvidenceDigest("");
    });
  }

  return (
    <GlassySection title="Your Court actions">
      <div className="grid gap-4 lg:grid-cols-2">
        {can("accept_jury_seat") ? (
          <GlassyTile className="space-y-4">
            <h3 className="text-base font-semibold text-text">
              Jury invitation
            </h3>
            <p className="text-sm leading-6 text-muted">
              Accept only if you can decide independently. Disclose any conflict
              instead of taking the seat.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy !== null}
                onClick={() =>
                  void run("jury", () =>
                    apiRespondToCourtJuryV2({
                      caseId,
                      response: "accept",
                      conflict: "clear",
                    }),
                  )
                }
              >
                Accept duty
              </Button>
              <Button
                disabled={busy !== null}
                variant="outline"
                onClick={() =>
                  void run("jury", () =>
                    apiRespondToCourtJuryV2({
                      caseId,
                      response: "decline",
                      conflict: "self_disclosed",
                    }),
                  )
                }
              >
                Disclose conflict and decline
              </Button>
            </div>
          </GlassyTile>
        ) : null}

        {can("recuse_jury_seat") ? (
          <GlassyTile>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run("recusal", () =>
                  apiRecuseFromCourtJuryV2({
                    caseId,
                    reason: recusalReason.trim(),
                  }),
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
              <Field label="Conflict or inability to serve">
                <Input
                  value={recusalReason}
                  onChange={(event) => setRecusalReason(event.target.value)}
                  minLength={10}
                  maxLength={5_000}
                />
              </Field>
              <Button
                disabled={busy !== null || recusalReason.trim().length < 10}
                variant="outline"
              >
                Recuse from this jury
              </Button>
            </form>
          </GlassyTile>
        ) : null}

        {can("submit_response") ? (
          <GlassyTile>
            <form className="space-y-4" onSubmit={submitResponse}>
              <h3 className="text-base font-semibold text-text">
                Respond to the case
              </h3>
              <ProposalNarrativeEditor
                id="court-party-response"
                value={response}
                onChange={setResponse}
                placeholder="State your response, relevant facts, and any disputed claims."
                rows={8}
              />
              <Button disabled={busy !== null || response.trim().length < 20}>
                Submit response
              </Button>
            </form>
          </GlassyTile>
        ) : null}

        {can("submit_evidence") ? (
          <GlassyTile>
            <form className="space-y-4" onSubmit={submitEvidence}>
              <h3 className="text-base font-semibold text-text">
                Add evidence
              </h3>
              <ProposalNarrativeEditor
                id="court-evidence-statement"
                value={evidenceStatement}
                onChange={setEvidenceStatement}
                placeholder="Explain what this evidence establishes and where it came from."
                rows={6}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Evidence URL">
                  <Input
                    type="url"
                    value={evidenceUrl}
                    onChange={(event) => setEvidenceUrl(event.target.value)}
                  />
                </Field>
                <Field label="Evidence digest">
                  <Input
                    value={evidenceDigest}
                    onChange={(event) => setEvidenceDigest(event.target.value)}
                    placeholder="sha256:..."
                  />
                </Field>
              </div>
              <Button
                disabled={
                  busy !== null ||
                  (!evidenceStatement.trim() &&
                    !(evidenceUrl.trim() && evidenceDigest.trim()))
                }
              >
                Add evidence
              </Button>
            </form>
          </GlassyTile>
        ) : null}

        {can("challenge_evidence") && courtCase.evidence.length > 0 ? (
          <GlassyTile>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run("challenge", async () => {
                  await apiChallengeCourtEvidenceV2({
                    caseId,
                    evidenceId: challengedEvidenceId,
                    reason: challengeReason.trim(),
                  });
                  setChallengedEvidenceId("");
                  setChallengeReason("");
                });
              }}
            >
              <h3 className="text-base font-semibold text-text">
                Challenge evidence
              </h3>
              <Field label="Evidence record">
                <Select
                  value={challengedEvidenceId}
                  onChange={(event) =>
                    setChallengedEvidenceId(event.target.value)
                  }
                  required
                >
                  <option value="">Choose evidence</option>
                  {courtCase.evidence.map((item) => (
                    <option key={item.id} value={item.id}>
                      {courtLabel(item.kind)} · {item.digest}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Reason">
                <Input
                  value={challengeReason}
                  onChange={(event) => setChallengeReason(event.target.value)}
                  minLength={10}
                  maxLength={5_000}
                />
              </Field>
              <Button
                disabled={
                  busy !== null ||
                  !challengedEvidenceId ||
                  challengeReason.trim().length < 10
                }
              >
                Submit challenge
              </Button>
            </form>
          </GlassyTile>
        ) : null}

        {can("vote_finding") && ballot?.type === "finding" ? (
          <GlassyTile>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run("finding", () =>
                  finding === "dismissed"
                    ? apiCastCourtFindingVoteV2({
                        caseId,
                        ballotId: ballot.id,
                        finding,
                      })
                    : apiCastCourtFindingVoteV2({
                        caseId,
                        ballotId: ballot.id,
                        finding,
                        severity,
                      }),
                );
              }}
            >
              <h3 className="text-base font-semibold text-text">
                Finding ballot
              </h3>
              <Field label="Finding">
                <Select
                  value={finding}
                  onChange={(event) =>
                    setFinding(event.target.value as typeof finding)
                  }
                >
                  <option value="dismissed">Dismissed</option>
                  <option value="substantiated">Substantiated</option>
                </Select>
              </Field>
              {finding === "substantiated" ? (
                <Field label="Severity">
                  <Select
                    value={severity}
                    onChange={(event) =>
                      setSeverity(event.target.value as typeof severity)
                    }
                  >
                    {(["L1", "L2", "L3", "L4"] as const).map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </Select>
                </Field>
              ) : null}
              <Button disabled={busy !== null}>Cast finding vote</Button>
            </form>
          </GlassyTile>
        ) : null}

        {can("vote_sentence") && ballot?.type === "remedy" ? (
          <GlassyTile className="lg:col-span-2">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run("remedy", () =>
                  apiCastCourtRemedyVoteV2({
                    caseId,
                    ballotId: ballot.id,
                    authorizeSentence,
                    components: components.map((component) => ({
                      componentId: component.id,
                      include:
                        choices[component.id]?.include ??
                        component.mode === "mandatory",
                      ...(choices[component.id]?.conditionalValue !== undefined
                        ? {
                            conditionalValue:
                              choices[component.id].conditionalValue,
                          }
                        : {}),
                    })),
                  }),
                );
              }}
            >
              <h3 className="text-base font-semibold text-text">
                Remedy ballot
              </h3>
              <label className="flex items-center gap-2 text-sm font-medium text-text">
                <input
                  type="checkbox"
                  checked={authorizeSentence}
                  onChange={(event) =>
                    setAuthorizeSentence(event.target.checked)
                  }
                />
                Authorize a punitive sentence
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {components.map((component) => {
                  const choice =
                    choices[component.id] ?? initialRemedyChoice(component);
                  return (
                    <div
                      key={component.id}
                      className="grid gap-3 border border-border/60 p-3"
                    >
                      <label className="flex items-center gap-2 text-sm font-medium text-text">
                        <input
                          type="checkbox"
                          checked={choice.include}
                          disabled={component.mode === "mandatory"}
                          onChange={(event) =>
                            setChoices((current) => ({
                              ...current,
                              [component.id]: {
                                ...choice,
                                include: event.target.checked,
                              },
                            }))
                          }
                        />
                        {courtLabel(component.id)}
                        {component.mode === "mandatory" ? " (required)" : ""}
                      </label>
                      {component.value.kind === "ordered_scope" ? (
                        <Select
                          value={String(choice.conditionalValue ?? "")}
                          onChange={(event) =>
                            setChoices((current) => ({
                              ...current,
                              [component.id]: {
                                ...choice,
                                conditionalValue: event.target.value,
                              },
                            }))
                          }
                        >
                          {component.value.levels.map((level) => (
                            <option key={level} value={level}>
                              {courtLabel(level)}
                            </option>
                          ))}
                        </Select>
                      ) : null}
                      {component.value.kind === "quantitative" ? (
                        <Input
                          inputMode="numeric"
                          value={String(
                            choice.conditionalValue ??
                              component.value.range.min,
                          )}
                          onChange={(event) =>
                            setChoices((current) => ({
                              ...current,
                              [component.id]: {
                                ...choice,
                                conditionalValue: event.target.value,
                              },
                            }))
                          }
                          aria-label={`${courtLabel(component.id)} value`}
                        />
                      ) : null}
                      {component.value.kind === "permanent" ? (
                        <label className="flex items-center gap-2 text-sm text-text">
                          <input
                            type="checkbox"
                            checked={choice.conditionalValue === true}
                            onChange={(event) =>
                              setChoices((current) => ({
                                ...current,
                                [component.id]: {
                                  ...choice,
                                  conditionalValue: event.target.checked,
                                },
                              }))
                            }
                          />
                          Permanent
                        </label>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <Button disabled={busy !== null || components.length === 0}>
                Cast remedy vote
              </Button>
            </form>
          </GlassyTile>
        ) : null}

        {can("file_appeal") ? (
          <GlassyTile className="lg:col-span-2">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run("appeal", () =>
                  apiFileCourtAppealV2({
                    caseId,
                    groundCode: appealGround,
                    grounds: appeal.trim(),
                    requestStay,
                  }),
                );
              }}
            >
              <h3 className="text-base font-semibold text-text">
                File an appeal
              </h3>
              <Field label="Ground">
                <Select
                  value={appealGround}
                  onChange={(event) =>
                    setAppealGround(event.target.value as typeof appealGround)
                  }
                >
                  {APPEAL_GROUNDS.map((ground) => (
                    <option key={ground} value={ground}>
                      {courtLabel(ground)}
                    </option>
                  ))}
                </Select>
              </Field>
              <ProposalNarrativeEditor
                id="court-appeal-grounds"
                value={appeal}
                onChange={setAppeal}
                placeholder="Explain the material error or new evidence supporting this appeal."
                rows={8}
              />
              <label className="flex items-center gap-2 text-sm font-medium text-text">
                <input
                  type="checkbox"
                  checked={requestStay}
                  onChange={(event) => setRequestStay(event.target.checked)}
                />
                Request a stay while the appeal is reviewed
              </label>
              <Button disabled={busy !== null || appeal.trim().length < 20}>
                File appeal
              </Button>
            </form>
          </GlassyTile>
        ) : null}

        {can("respond_appellate_invitation") ||
        can("respond_reopening_invitation") ? (
          <GlassyTile className="space-y-4 lg:col-span-2">
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
                <Button
                  key={response}
                  disabled={busy !== null}
                  variant={response === "accept" ? "primary" : "outline"}
                  onClick={() =>
                    void run("appellate-invitation", () =>
                      can("respond_reopening_invitation")
                        ? apiRespondToCourtReopeningJuryV2({
                            panelId: courtCase.appellateTask!.panelId,
                            response,
                          })
                        : apiRespondToCourtAppellateJuryV2({
                            panelId: courtCase.appellateTask!.panelId,
                            response,
                          }),
                    )
                  }
                >
                  {response === "accept"
                    ? "Accept duty"
                    : response === "decline"
                      ? "Decline"
                      : "Disclose conflict"}
                </Button>
              ))}
            </div>
          </GlassyTile>
        ) : null}

        {can("propose_appellate_modification") &&
        courtCase.appellateTask?.remedies.length ? (
          <GlassyTile>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run("modification", () =>
                  apiProposeCourtAppellateModificationV2({
                    panelId: courtCase.appellateTask!.panelId,
                    retainedRemedyIds: [...retainedRemedyIds],
                  }),
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
                {courtCase.appellateTask.remedies.map((remedy) => (
                  <label
                    key={remedy.id}
                    className="flex items-center gap-2 text-sm text-text"
                  >
                    <input
                      type="checkbox"
                      checked={retainedRemedyIds.has(remedy.id)}
                      onChange={(event) =>
                        setRetainedRemedyIds((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(remedy.id);
                          else next.delete(remedy.id);
                          return next;
                        })
                      }
                    />
                    Keep {courtLabel(remedy.componentCode)}
                  </label>
                ))}
              </div>
              <Button
                disabled={
                  busy !== null ||
                  retainedRemedyIds.size ===
                    courtCase.appellateTask.remedies.length
                }
              >
                Propose modification
              </Button>
            </form>
          </GlassyTile>
        ) : null}

        {can("vote_appeal") ? (
          <GlassyTile>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run("appellate-vote", () =>
                  appellateResult === "modified"
                    ? apiCastCourtAppellateVoteV2({
                        panelId: courtCase.appellateTask!.panelId,
                        result: appellateResult,
                        modificationPackageId,
                        reasoning: appellateReasoning.trim(),
                      })
                    : apiCastCourtAppellateVoteV2({
                        panelId: courtCase.appellateTask!.panelId,
                        result: appellateResult,
                        reasoning: appellateReasoning.trim(),
                      }),
                );
              }}
            >
              <h3 className="text-base font-semibold text-text">
                Appeal decision
              </h3>
              <Field label="Outcome">
                <Select
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
              </Field>
              {appellateResult === "modified" ? (
                <Field label="Modification package">
                  <Select
                    value={modificationPackageId}
                    onChange={(event) =>
                      setModificationPackageId(event.target.value)
                    }
                    required
                  >
                    <option value="">Choose a package</option>
                    {courtCase.appellateTask?.modificationPackages
                      .filter((item) => item.state === "proposed")
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.retainedRemedyIds.length} retained · burden{" "}
                          {item.modifiedBurden}
                        </option>
                      ))}
                  </Select>
                </Field>
              ) : null}
              <ProposalNarrativeEditor
                id="court-appellate-reasoning"
                value={appellateReasoning}
                onChange={setAppellateReasoning}
                placeholder="Explain the legal and evidentiary basis for this outcome."
                rows={7}
              />
              <Button
                disabled={
                  busy !== null ||
                  appellateReasoning.trim().length < 20 ||
                  (appellateResult === "modified" && !modificationPackageId)
                }
              >
                Cast appeal vote
              </Button>
            </form>
          </GlassyTile>
        ) : null}

        {can("file_reopening") ? (
          <GlassyTile className="lg:col-span-2">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run("reopening", () =>
                  apiFileCourtReopeningV2({
                    caseId,
                    evidenceReference: reopeningEvidenceReference.trim(),
                    statement: reopeningStatement.trim(),
                  }),
                );
              }}
            >
              <h3 className="text-base font-semibold text-text">
                Request reopening
              </h3>
              <p className="text-sm leading-6 text-muted">
                Reopening requires verified evidence that was genuinely
                unavailable and could change the result. Exonerating identity or
                cryptographic proof has no time limit.
              </p>
              <Field label="Evidence reference">
                <Input
                  value={reopeningEvidenceReference}
                  onChange={(event) =>
                    setReopeningEvidenceReference(event.target.value)
                  }
                  placeholder="ipfs://, protocol proof, or immutable archive"
                />
              </Field>
              <ProposalNarrativeEditor
                id="court-reopening-statement"
                value={reopeningStatement}
                onChange={setReopeningStatement}
                placeholder="Explain why the evidence was unavailable and how it could alter the result."
                rows={8}
              />
              <Button
                disabled={
                  busy !== null ||
                  !reopeningEvidenceReference.trim() ||
                  reopeningStatement.trim().length < 20
                }
              >
                Request reopening review
              </Button>
            </form>
          </GlassyTile>
        ) : null}

        {can("vote_reopening") ? (
          <GlassyTile className="lg:col-span-2">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run("reopening-vote", () =>
                  apiCastCourtReopeningVoteV2({
                    panelId: courtCase.appellateTask!.panelId,
                    reopen: reopenVote,
                    reasoning: reopeningReasoning.trim(),
                  }),
                );
              }}
            >
              <h3 className="text-base font-semibold text-text">
                Reopening decision
              </h3>
              <Field label="Outcome">
                <Select
                  value={reopenVote ? "reopen" : "deny"}
                  onChange={(event) =>
                    setReopenVote(event.target.value === "reopen")
                  }
                >
                  <option value="reopen">Open a new trial</option>
                  <option value="deny">Keep the final decision</option>
                </Select>
              </Field>
              <ProposalNarrativeEditor
                id="court-reopening-reasoning"
                value={reopeningReasoning}
                onChange={setReopeningReasoning}
                placeholder="Explain whether the verified evidence meets the reopening standard."
                rows={7}
              />
              <Button
                disabled={
                  busy !== null || reopeningReasoning.trim().length < 20
                }
              >
                Cast reopening vote
              </Button>
            </form>
          </GlassyTile>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </GlassySection>
  );
}
