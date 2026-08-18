import type { CourtCaseViewerV2Dto } from "@/types/api";

export type CourtRemedyComponent = {
  id: string;
  domain: string;
  harmKey: string;
  mode: "mandatory" | "optional";
  countsTowardPunitiveLimit: boolean;
  burden: { unit: "eras"; weight: number } | null;
  executorId: string;
  executorVersion: string;
  expiryBehavior: string;
  appealBehavior: string;
  value:
    | { kind: "categorical" | "permanent" }
    | { kind: "ordered_scope"; levels: string[] }
    | {
        kind: "quantitative";
        range: {
          min: string;
          max: string;
          step: string;
          lessRestrictive: "lower" | "higher";
        };
      };
};

export type CourtRemedyEnvelope = {
  policyVersion: string;
  policyHash: string;
  offenseCode: string;
  severity: CourtSeverity;
  thresholds: {
    authorization: number;
    optionalComponent: number;
    orderedScope: number;
    permanence: number;
  };
  components: CourtRemedyComponent[];
  maximumComponentCount: number;
  maximumBurden: string;
  maximumComponentsByDomain: Readonly<Record<string, number>>;
  requiredOneOfComponentGroups: string[][];
  incompatibleComponentPairs: [string, string][];
};

export type CourtRemedyChoice = {
  include: boolean;
  conditionalValue?: string | boolean;
};

export type CourtRemedySelectionIssue =
  | { code: "missing_mandatory"; components: readonly string[] }
  | { code: "missing_required_group"; components: readonly string[] }
  | { code: "incompatible_pair"; components: readonly [string, string] }
  | {
      code: "component_limit";
      actual: number;
      maximum: number;
      domain: string | null;
    }
  | { code: "burden_limit"; actual: string; maximum: string };

export type CourtSeverity = "L1" | "L2" | "L3" | "L4";
export type CourtEvidenceStandard = "E1" | "E2" | "E3";

export type CourtJuryBallot = NonNullable<
  NonNullable<CourtCaseViewerV2Dto["juryTask"]>["ballot"]
>;
export type CourtFindingBallot = CourtJuryBallot & { type: "finding" };
export type CourtRemedyBallot = CourtJuryBallot & { type: "remedy" };

export type CourtFindingDefinition = {
  offenseCode: string;
  allowedSeverities: readonly CourtSeverity[];
  evidenceStandards: Readonly<
    Record<CourtSeverity, CourtEvidenceStandard | null>
  >;
};

type ExistingVote = CourtJuryBallot["existingVote"];

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isSeverity(value: unknown): value is CourtSeverity {
  return value === "L1" || value === "L2" || value === "L3" || value === "L4";
}

function isEvidenceStandard(value: unknown): value is CourtEvidenceStandard {
  return value === "E1" || value === "E2" || value === "E3";
}

function canonicalText(value: unknown): value is string {
  return (
    typeof value === "string" && Boolean(value.trim()) && value === value.trim()
  );
}

function integer(value: unknown): value is number {
  return Number.isSafeInteger(value);
}

function integerText(value: unknown): value is string {
  return typeof value === "string" && /^-?(0|[1-9]\d*)$/.test(value);
}

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every(canonicalText) ? [...value] : null;
}

function remedyComponent(candidate: unknown): CourtRemedyComponent | null {
  const item = record(candidate);
  const value = record(item?.value);
  const burden = item?.burden === undefined ? null : record(item.burden);
  if (
    !item ||
    !value ||
    !canonicalText(item.id) ||
    !canonicalText(item.domain) ||
    !canonicalText(item.harmKey) ||
    (item.mode !== "mandatory" && item.mode !== "optional") ||
    typeof item.countsTowardPunitiveLimit !== "boolean" ||
    (burden !== null &&
      (burden.unit !== "eras" ||
        !integer(burden.weight) ||
        burden.weight <= 0)) ||
    !canonicalText(item.executorId) ||
    !canonicalText(item.executorVersion) ||
    !canonicalText(item.expiryBehavior) ||
    !canonicalText(item.appealBehavior)
  ) {
    return null;
  }
  const base: Omit<CourtRemedyComponent, "value"> = {
    id: item.id,
    domain: item.domain,
    harmKey: item.harmKey,
    mode: item.mode,
    countsTowardPunitiveLimit: item.countsTowardPunitiveLimit,
    burden: burden
      ? { unit: "eras" as const, weight: burden.weight as number }
      : null,
    executorId: item.executorId,
    executorVersion: item.executorVersion,
    expiryBehavior: item.expiryBehavior,
    appealBehavior: item.appealBehavior,
  };
  if (value.kind === "categorical" || value.kind === "permanent") {
    return { ...base, value: { kind: value.kind } };
  }
  const levels = stringArray(value.levels);
  if (value.kind === "ordered_scope" && levels) {
    return { ...base, value: { kind: value.kind, levels } };
  }
  const range = record(value.range);
  if (
    value.kind === "quantitative" &&
    integerText(range?.min) &&
    integerText(range.max) &&
    integerText(range.step) &&
    (range.lessRestrictive === "lower" || range.lessRestrictive === "higher")
  ) {
    return {
      ...base,
      value: {
        kind: value.kind,
        range: {
          min: range.min,
          max: range.max,
          step: range.step,
          lessRestrictive: range.lessRestrictive,
        },
      },
    };
  }
  return null;
}

export function courtFindingDefinition(
  definition: Record<string, unknown>,
): CourtFindingDefinition | null {
  const allowed = definition.allowedSeverities;
  const standards = record(definition.evidenceStandards);
  if (
    typeof definition.offenseCode !== "string" ||
    !definition.offenseCode.trim() ||
    !Array.isArray(allowed) ||
    allowed.length === 0 ||
    !allowed.every(isSeverity) ||
    new Set(allowed).size !== allowed.length ||
    !standards
  ) {
    return null;
  }
  return {
    offenseCode: definition.offenseCode,
    allowedSeverities: Object.freeze([...allowed]),
    evidenceStandards: Object.freeze({
      L1: isEvidenceStandard(standards.L1) ? standards.L1 : null,
      L2: isEvidenceStandard(standards.L2) ? standards.L2 : null,
      L3: isEvidenceStandard(standards.L3) ? standards.L3 : null,
      L4: isEvidenceStandard(standards.L4) ? standards.L4 : null,
    }),
  };
}

export function courtRemedyEnvelope(
  definition: Record<string, unknown>,
): CourtRemedyEnvelope | null {
  const envelope = record(definition.envelope);
  const thresholds = record(envelope?.thresholds);
  const maximumByDomain = record(envelope?.maximumComponentsByDomain);
  const componentCandidates = Array.isArray(envelope?.components)
    ? envelope.components
    : null;
  const components = componentCandidates?.map(remedyComponent) ?? null;
  const requiredGroups = Array.isArray(envelope?.requiredOneOfComponentGroups)
    ? envelope.requiredOneOfComponentGroups.map(stringArray)
    : null;
  const incompatiblePairs = Array.isArray(envelope?.incompatibleComponentPairs)
    ? envelope.incompatibleComponentPairs.map(stringArray)
    : null;
  if (
    !envelope ||
    !thresholds ||
    !canonicalText(envelope.policyVersion) ||
    !canonicalText(envelope.policyHash) ||
    !canonicalText(envelope.offenseCode) ||
    !isSeverity(envelope.severity) ||
    !integer(thresholds.authorization) ||
    !integer(thresholds.optionalComponent) ||
    !integer(thresholds.orderedScope) ||
    !integer(thresholds.permanence) ||
    !components ||
    components.some((component) => component === null) ||
    !integer(envelope.maximumComponentCount) ||
    !integerText(envelope.maximumBurden) ||
    !maximumByDomain ||
    Object.entries(maximumByDomain).some(
      ([domain, maximum]) => !canonicalText(domain) || !integer(maximum),
    ) ||
    !requiredGroups ||
    requiredGroups.some((group) => group === null) ||
    !incompatiblePairs ||
    incompatiblePairs.some((pair) => pair === null || pair.length !== 2)
  ) {
    return null;
  }
  return {
    policyVersion: envelope.policyVersion,
    policyHash: envelope.policyHash,
    offenseCode: envelope.offenseCode,
    severity: envelope.severity,
    thresholds: {
      authorization: thresholds.authorization,
      optionalComponent: thresholds.optionalComponent,
      orderedScope: thresholds.orderedScope,
      permanence: thresholds.permanence,
    },
    components: components as CourtRemedyComponent[],
    maximumComponentCount: envelope.maximumComponentCount,
    maximumBurden: envelope.maximumBurden,
    maximumComponentsByDomain: Object.freeze(
      maximumByDomain as Record<string, number>,
    ),
    requiredOneOfComponentGroups: requiredGroups as string[][],
    incompatibleComponentPairs: incompatiblePairs as [string, string][],
  };
}

export function courtRemedyComponents(
  definition: Record<string, unknown>,
): CourtRemedyComponent[] {
  return courtRemedyEnvelope(definition)?.components ?? [];
}

export function courtInitialRemedyChoice(
  component: CourtRemedyComponent,
  existing?: NonNullable<ExistingVote>["components"][number],
): CourtRemedyChoice {
  const include = existing?.include ?? component.mode === "mandatory";
  if (
    existing?.conditionalValue !== null &&
    existing?.conditionalValue !== undefined
  ) {
    return { include, conditionalValue: existing.conditionalValue };
  }
  if (component.value.kind === "permanent") {
    return { include, conditionalValue: false };
  }
  if (component.value.kind === "ordered_scope") {
    return { include, conditionalValue: component.value.levels[0] ?? "" };
  }
  if (component.value.kind === "quantitative") {
    return { include, conditionalValue: component.value.range.min };
  }
  return { include };
}

export function courtInitialRemedyChoices(
  components: CourtRemedyComponent[],
  existingVote: ExistingVote,
): Record<string, CourtRemedyChoice> {
  return Object.fromEntries(
    components.map((component) => [
      component.id,
      courtInitialRemedyChoice(
        component,
        existingVote?.components.find(
          (choice) => choice.componentId === component.id,
        ),
      ),
    ]),
  );
}

export function courtSelectedRemedyBurden(
  components: readonly CourtRemedyComponent[],
  choices: Readonly<Record<string, CourtRemedyChoice>>,
): string {
  const total = components.reduce((sum, component) => {
    const choice = choices[component.id];
    const included = choice?.include ?? component.mode === "mandatory";
    if (
      !included ||
      !component.burden ||
      component.value.kind !== "quantitative" ||
      typeof choice?.conditionalValue !== "string" ||
      !integerText(choice.conditionalValue)
    ) {
      return sum;
    }
    return (
      sum + BigInt(choice.conditionalValue) * BigInt(component.burden.weight)
    );
  }, 0n);
  return total.toString(10);
}

export function courtSelectedRemedyConflicts(
  envelope: CourtRemedyEnvelope,
  choices: Readonly<Record<string, CourtRemedyChoice>>,
): readonly [string, string][] {
  const selected = new Set(
    envelope.components
      .filter(
        (component) =>
          choices[component.id]?.include ?? component.mode === "mandatory",
      )
      .map((component) => component.id),
  );
  return envelope.incompatibleComponentPairs.filter(
    ([left, right]) => selected.has(left) && selected.has(right),
  );
}

export function courtRemedySelectionIssues(
  envelope: CourtRemedyEnvelope,
  choices: Readonly<Record<string, CourtRemedyChoice>>,
): readonly CourtRemedySelectionIssue[] {
  const selected = envelope.components.filter(
    (component) =>
      choices[component.id]?.include ?? component.mode === "mandatory",
  );
  const selectedIds = new Set(selected.map((component) => component.id));
  const issues: CourtRemedySelectionIssue[] = [];
  const missingMandatory = envelope.components
    .filter(
      (component) =>
        component.mode === "mandatory" && !selectedIds.has(component.id),
    )
    .map((component) => component.id);
  if (missingMandatory.length) {
    issues.push({ code: "missing_mandatory", components: missingMandatory });
  }
  for (const group of envelope.requiredOneOfComponentGroups) {
    if (!group.some((componentId) => selectedIds.has(componentId))) {
      issues.push({ code: "missing_required_group", components: group });
    }
  }
  for (const components of courtSelectedRemedyConflicts(envelope, choices)) {
    issues.push({ code: "incompatible_pair", components });
  }
  const punitive = selected.filter(
    (component) => component.countsTowardPunitiveLimit,
  );
  if (punitive.length > envelope.maximumComponentCount) {
    issues.push({
      code: "component_limit",
      actual: punitive.length,
      maximum: envelope.maximumComponentCount,
      domain: null,
    });
  }
  for (const [domain, maximum] of Object.entries(
    envelope.maximumComponentsByDomain,
  )) {
    const actual = punitive.filter(
      (component) => component.domain === domain,
    ).length;
    if (actual > maximum) {
      issues.push({ code: "component_limit", actual, maximum, domain });
    }
  }
  const burden = courtSelectedRemedyBurden(envelope.components, choices);
  if (BigInt(burden) > BigInt(envelope.maximumBurden)) {
    issues.push({
      code: "burden_limit",
      actual: burden,
      maximum: envelope.maximumBurden,
    });
  }
  return issues;
}

export function courtInitialFinding(
  vote: ExistingVote,
): "dismissed" | "substantiated" {
  return vote?.choice === "substantiated" ? "substantiated" : "dismissed";
}

export function courtInitialSeverity(
  vote: ExistingVote,
  allowed: readonly CourtSeverity[] = ["L1", "L2", "L3", "L4"],
): CourtSeverity {
  const recorded = isSeverity(vote?.severity) ? vote.severity : null;
  return recorded && allowed.includes(recorded)
    ? recorded
    : (allowed[0] ?? "L1");
}

export function courtInitialSentenceAuthorization(vote: ExistingVote): boolean {
  return vote?.choice !== "do_not_authorize";
}

export function courtInitialAppellateResult(
  task: CourtCaseViewerV2Dto["appellateTask"],
): "affirmed" | "reversed" | "remanded" | "modified" {
  const result = task?.existingVote?.result;
  return result === "reversed" || result === "remanded" || result === "modified"
    ? result
    : "affirmed";
}
