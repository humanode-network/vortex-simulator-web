import {
  humanodeCodexOffenses,
  type HumanodeCodexOffense,
} from "@/data/humanodeCodex";

export type CodexView = "matrix" | "measures" | "clauses";

export const CODEX_VIEWS = [
  ["matrix", "Transgression matrix"],
  ["measures", "Measures"],
  ["clauses", "Procedure and severity"],
] as const satisfies readonly (readonly [CodexView, string])[];

export function isCodexView(value: string | null): value is CodexView {
  return CODEX_VIEWS.some(([view]) => view === value);
}

export function matchesCodexQuery(
  query: string,
  ...values: unknown[]
): boolean {
  if (!query) return true;
  return values
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function sortCodexEntries<T extends { ref: string; title: string }>(
  entries: readonly T[],
  sortBy: string,
): T[] {
  return [...entries].sort((left, right) =>
    sortBy === "name"
      ? left.title.localeCompare(right.title)
      : left.ref.localeCompare(right.ref, undefined, { numeric: true }),
  );
}

export function viewForReference(reference: string): CodexView {
  if (reference.startsWith("HC-3.")) return "matrix";
  if (reference.startsWith("HC-5.") || reference.startsWith("HC-6.")) {
    return "measures";
  }
  return "clauses";
}

export function offensesForMeasure(code: string): HumanodeCodexOffense[] {
  return humanodeCodexOffenses.filter((offense) =>
    [
      ...offense.immediateMeasures,
      ...offense.corrections,
      ...offense.mandatoryMeasures,
      ...offense.allowedMeasures,
      ...offense.requiredOneOf.flat(),
    ].includes(code),
  );
}
