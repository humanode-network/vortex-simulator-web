import { useMemo, useState, type ReactNode } from "react";

import {
  CodexMeasureHint,
  CodexOffenseHint,
  CodexPolicyHint,
  CodexSeverityHint,
} from "@/components/CodexHint";
import { GlassyTile } from "@/components/GlassySection";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import { HUMANODE_CODEX_JURY_SIZE } from "@/data/humanodeCodex";
import { apiCastCourtRemedyVoteV2 } from "@/lib/apiClient";
import {
  courtInitialRemedyChoice,
  courtInitialRemedyChoices,
  courtInitialSentenceAuthorization,
  courtRemedyEnvelope,
  courtRemedySelectionIssues,
  courtSelectedRemedyBurden,
  type CourtRemedyBallot,
  type CourtRemedyChoice,
  type CourtRemedySelectionIssue,
} from "../model/courtBallot";
import { courtLabel } from "../components/CourtPrimitives";
import { CourtAsyncButton, CourtDecisionSummary } from "../forms/CourtFormUi";
import {
  courtOffenseDisplay,
  courtRemedyLabel,
  courtSeverityDisplay,
} from "../model/courtPresentation";
import type { CourtActionGroupProps } from "./actionTypes";
import { CourtCodexCheckbox } from "./CourtCodexCheckbox";

type RemedyBallotActionProps = Pick<
  CourtActionGroupProps,
  "actionLocked" | "busy" | "caseId" | "run"
> & { ballot: CourtRemedyBallot };

function remedyReferences(codes: readonly string[]): ReactNode {
  return codes.map((code, index) => (
    <span key={code}>
      {index ? ", " : null}
      <CodexMeasureHint code={code}>{courtRemedyLabel(code)}</CodexMeasureHint>
    </span>
  ));
}

function remedyIssueDescription(issue: CourtRemedySelectionIssue): ReactNode {
  if (issue.code === "missing_mandatory") {
    return <>Required: {remedyReferences(issue.components)}.</>;
  }
  if (issue.code === "missing_required_group") {
    return <>Choose at least one: {remedyReferences(issue.components)}.</>;
  }
  if (issue.code === "incompatible_pair") {
    return (
      <>
        {remedyReferences(issue.components.slice(0, 1))} cannot be combined with{" "}
        {remedyReferences(issue.components.slice(1, 2))}.
      </>
    );
  }
  if (issue.code === "component_limit") {
    return `${issue.domain ? `${courtLabel(issue.domain)} ` : ""}punitive components: ${issue.actual} selected; maximum ${issue.maximum}.`;
  }
  return `Burden: ${issue.actual} weighted eras; maximum ${issue.maximum}.`;
}

export function RemedyBallotAction({
  actionLocked,
  ballot,
  busy,
  caseId,
  run,
}: RemedyBallotActionProps) {
  const remedyEnvelope = useMemo(
    () => courtRemedyEnvelope(ballot.definition),
    [ballot.definition],
  );
  const components = useMemo(
    () => remedyEnvelope?.components ?? [],
    [remedyEnvelope],
  );
  const [authorizeSentence, setAuthorizeSentence] = useState(() =>
    courtInitialSentenceAuthorization(ballot.existingVote),
  );
  const [choices, setChoices] = useState<Record<string, CourtRemedyChoice>>(
    () => courtInitialRemedyChoices(components, ballot.existingVote),
  );
  const remedySelectionIssues = useMemo(
    () =>
      remedyEnvelope ? courtRemedySelectionIssues(remedyEnvelope, choices) : [],
    [choices, remedyEnvelope],
  );
  const selectedRemedyBurden = useMemo(
    () => courtSelectedRemedyBurden(components, choices),
    [choices, components],
  );

  return (
    <GlassyTile>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void run(
            "remedy",
            (idempotencyKey) =>
              apiCastCourtRemedyVoteV2(
                {
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
                },
                { idempotencyKey },
              ),
            undefined,
            true,
          );
        }}
      >
        <h3 className="text-base font-semibold text-text">Remedy ballot</h3>
        {remedyEnvelope ? (
          <CourtDecisionSummary
            title="Frozen sentence envelope"
            items={[
              {
                label: "Offense and severity",
                value: (
                  <>
                    <CodexOffenseHint code={remedyEnvelope.offenseCode}>
                      {courtOffenseDisplay(remedyEnvelope.offenseCode).label}
                    </CodexOffenseHint>
                    {" · "}
                    <CodexSeverityHint code={remedyEnvelope.severity}>
                      {courtSeverityDisplay(remedyEnvelope.severity).label}
                    </CodexSeverityHint>
                  </>
                ),
              },
              {
                label: "Authorization threshold",
                value: `${remedyEnvelope.thresholds.authorization} of ${HUMANODE_CODEX_JURY_SIZE} jurors`,
              },
              {
                label: "Punitive component limit",
                value: remedyEnvelope.maximumComponentCount,
              },
              {
                label: "Weighted burden ceiling",
                value: `${remedyEnvelope.maximumBurden} eras`,
              },
            ]}
            replacement={
              <>
                Policy{" "}
                <CodexPolicyHint>
                  {remedyEnvelope.policyVersion}
                </CodexPolicyHint>
                . The ballot can record only the remedies and ranges frozen when
                this sentence stage opened.
              </>
            }
          />
        ) : (
          <p className="text-sm text-destructive" role="alert">
            The frozen sentence envelope is unavailable or invalid. This ballot
            cannot be cast safely.
          </p>
        )}
        <label className="flex items-center gap-2 text-sm font-medium text-text">
          <input
            id="court-remedy-authorize"
            type="checkbox"
            checked={authorizeSentence}
            onChange={(event) => setAuthorizeSentence(event.target.checked)}
          />
          Authorize a punitive sentence
        </label>
        <fieldset
          className="grid gap-3 disabled:opacity-50 sm:grid-cols-2"
          disabled={!authorizeSentence || actionLocked("remedy")}
        >
          {components.map((component) => {
            const choice =
              choices[component.id] ?? courtInitialRemedyChoice(component);
            return (
              <div
                key={component.id}
                className="grid gap-3 border border-border/60 p-3"
              >
                <CourtCodexCheckbox
                  checked={choice.include}
                  disabled={component.mode === "mandatory"}
                  label={courtRemedyLabel(component.id)}
                  onChange={(include) =>
                    setChoices((current) => ({
                      ...current,
                      [component.id]: { ...choice, include },
                    }))
                  }
                  reference={component.id}
                  suffix={component.mode === "mandatory" ? " (required)" : ""}
                />
                <p className="text-xs leading-5 text-muted">
                  {courtLabel(component.domain)} · Executor{" "}
                  {courtLabel(component.executorId)} {component.executorVersion}
                  {` · ${courtLabel(component.expiryBehavior)} · ${courtLabel(component.appealBehavior)}`}
                </p>
                {component.burden ? (
                  <p className="text-xs leading-5 text-muted">
                    Burden weight {component.burden.weight} per{" "}
                    {component.burden.unit.slice(0, -1)}.
                  </p>
                ) : null}
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
                  <div className="space-y-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      required
                      min={component.value.range.min}
                      max={component.value.range.max}
                      step={component.value.range.step}
                      value={String(
                        choice.conditionalValue ?? component.value.range.min,
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
                    <p className="text-xs text-muted">
                      Allowed range {component.value.range.min} to{" "}
                      {component.value.range.max}; step{" "}
                      {component.value.range.step}.
                    </p>
                  </div>
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
        </fieldset>
        {authorizeSentence && remedySelectionIssues.length ? (
          <div className="space-y-1" role="alert">
            {remedySelectionIssues.map((issue, index) => (
              <p
                key={`${issue.code}-${index}`}
                className="text-sm text-destructive"
              >
                {remedyIssueDescription(issue)}
              </p>
            ))}
          </div>
        ) : null}
        <CourtDecisionSummary
          items={[
            {
              label: "Punitive sentence",
              value: authorizeSentence ? "Authorize" : "Do not authorize",
            },
            {
              label: "Included remedies",
              value: authorizeSentence
                ? components.filter(
                    (component) =>
                      choices[component.id]?.include ??
                      component.mode === "mandatory",
                  ).length
                : 0,
            },
            {
              label: "Selected weighted burden",
              value: authorizeSentence
                ? `${selectedRemedyBurden} of ${remedyEnvelope?.maximumBurden ?? "unknown"} eras`
                : "Not applicable",
            },
          ]}
          replacement={
            ballot.existingVote
              ? `This replaces recorded vote revision ${ballot.existingVote.revision}.`
              : null
          }
        />
        <CourtAsyncButton
          busy={busy === `${caseId}:remedy`}
          busyLabel="Casting remedy vote..."
          disabled={
            actionLocked("remedy") ||
            remedyEnvelope === null ||
            components.length === 0 ||
            (authorizeSentence && remedySelectionIssues.length > 0)
          }
        >
          Cast remedy vote
        </CourtAsyncButton>
      </form>
    </GlassyTile>
  );
}
