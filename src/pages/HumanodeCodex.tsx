import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { CodexHint, CodexReferencedText } from "@/components/CodexHint";
import { GlassyCard } from "@/components/GlassyCard";
import { GlassyCompactGrid, GlassyKeyValue } from "@/components/GlassySection";
import { Kicker } from "@/components/Kicker";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHeader } from "@/components/PageHeader";
import { Pill } from "@/components/Pill";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/primitives/button";
import {
  HUMANODE_CODEX_VERSION,
  HUMANODE_CODEX_JURY_SIZE,
  HUMANODE_CODEX_SENTENCE_AUTHORIZATION,
  humanodeCodexClauses,
  humanodeCodexEvidenceRules,
  humanodeCodexExcludedMeasures,
  humanodeCodexMeasures,
  humanodeCodexMeasuresByCode,
  humanodeCodexOffenses,
  humanodeCodexReference,
  humanodeCodexSeverityRules,
  type HumanodeCodexMeasure,
  type HumanodeCodexOffense,
} from "@/data/humanodeCodex";
import { cn } from "@/lib/utils";

type CodexView = "matrix" | "measures" | "clauses";

const CODEX_VIEWS = [
  ["matrix", "Transgression matrix"],
  ["measures", "Measures"],
  ["clauses", "Procedure and severity"],
] as const satisfies readonly (readonly [CodexView, string])[];

function isCodexView(value: string | null): value is CodexView {
  return CODEX_VIEWS.some(([view]) => view === value);
}

function matchesCodexQuery(query: string, ...values: unknown[]): boolean {
  if (!query) return true;
  return values
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function sortCodexEntries<T extends { ref: string; title: string }>(
  entries: readonly T[],
  sortBy: string,
): T[] {
  return [...entries].sort((left, right) =>
    sortBy === "name"
      ? left.title.localeCompare(right.title)
      : left.ref.localeCompare(right.ref, undefined, { numeric: true }),
  );
}

const measureStatusLabel: Record<HumanodeCodexMeasure["status"], string> = {
  active: "Active in v1",
  defined: "Defined; not in a v1 sentence template",
  protective_control: "Protective control",
  reserved: "Reserved and inactive",
};

function viewForReference(reference: string): CodexView {
  if (reference.startsWith("HC-3.")) return "matrix";
  if (reference.startsWith("HC-5.") || reference.startsWith("HC-6.")) {
    return "measures";
  }
  return "clauses";
}

function MeasureLinks({ codes }: { codes: readonly string[] }) {
  if (!codes.length) return <span className="text-muted">None specified</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {codes.map((code) => {
        const item = humanodeCodexMeasuresByCode.get(code);
        return (
          <CodexHint key={code} reference={code} underline={false}>
            <Pill tone="primary" size="sm" className="normal-case">
              {code} · {item?.title ?? code}
            </Pill>
          </CodexHint>
        );
      })}
    </div>
  );
}

function offensesForMeasure(code: string): HumanodeCodexOffense[] {
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

function OffenseCard({
  expanded,
  offense,
  onToggle,
}: {
  expanded: boolean;
  offense: HumanodeCodexOffense;
  onToggle: () => void;
}) {
  const minimum = humanodeCodexMeasuresByCode.get(offense.minimumDisposition);
  return (
    <GlassyCard
      as="article"
      className={cn(
        "scroll-mt-5 border border-border/70 transition-colors",
        expanded && "border-primary/70",
      )}
      data-codex-ref={offense.ref}
      id={offense.ref}
    >
      <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <Kicker>{offense.domain}</Kicker>
            <h2 className="text-lg font-semibold text-text">{offense.title}</h2>
            <p className="max-w-4xl text-sm leading-6 text-muted">
              <CodexReferencedText text={offense.definition} />
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <CodexHint reference={offense.ref} underline={false}>
              <Pill tone="primary" size="sm">
                {offense.ref}
              </Pill>
            </CodexHint>
            <Pill tone="muted" size="sm">
              {offense.allowedSeverities[0]}-
              {offense.allowedSeverities[offense.allowedSeverities.length - 1]}
            </Pill>
            <Button
              type="button"
              size="compact"
              variant="ghost"
              aria-controls={`${offense.ref}-details`}
              aria-expanded={expanded}
              onClick={onToggle}
            >
              {expanded ? "Hide details" : "View details"}
            </Button>
          </div>
        </div>
      </div>
      {expanded ? (
        <div
          id={`${offense.ref}-details`}
          className="grid gap-5 border-t border-border/70 p-5"
        >
          <GlassyCompactGrid className="sm:grid-cols-2 lg:grid-cols-4">
            <GlassyKeyValue
              label="Finding range"
              value={
                <CodexReferencedText
                  text={offense.allowedSeverities.join(" · ")}
                />
              }
            />
            <GlassyKeyValue
              label="Evidence standards"
              value={
                <CodexReferencedText
                  text={offense.evidenceStandards.join(" · ")}
                />
              }
            />
            <GlassyKeyValue
              label="Minimum disposition"
              value={
                <CodexReferencedText
                  text={`${offense.minimumDisposition} · ${minimum?.title ?? "Not set"}`}
                />
              }
            />
            <GlassyKeyValue
              label="Sentence authorization"
              value={`${HUMANODE_CODEX_SENTENCE_AUTHORIZATION} of ${HUMANODE_CODEX_JURY_SIZE} jurors`}
            />
          </GlassyCompactGrid>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text">
                Immediate protection or correction
              </h3>
              <MeasureLinks codes={offense.immediateMeasures} />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text">Corrections</h3>
              <MeasureLinks codes={offense.corrections} />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text">
                Mandatory sentence components
              </h3>
              <MeasureLinks codes={offense.mandatoryMeasures} />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text">
                Required alternatives
              </h3>
              {offense.requiredOneOf.length ? (
                <div className="grid gap-2">
                  {offense.requiredOneOf.map((group) => (
                    <div key={group.join("-")} className="space-y-1">
                      <p className="text-xs text-muted">At least one</p>
                      <MeasureLinks codes={group} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No alternative group.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text">
              Available sentence measures
            </h3>
            <MeasureLinks codes={offense.allowedMeasures} />
            <p className="text-xs leading-5 text-muted">
              This is an outer envelope, not an automatic package. The selected
              severity, component support, compatibility, jurisdiction, burden
              ceiling, and registered executor determine the lawful result.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text">
              Severity ceiling
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {offense.allowedSeverities.map((level) => {
                const rule = humanodeCodexSeverityRules[level];
                return (
                  <div key={level} className="border border-border/70 p-3">
                    <p className="text-sm font-semibold text-text">
                      <CodexHint reference={rule.ref}>
                        {level} · {rule.title}
                      </CodexHint>
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      <CodexReferencedText text={rule.evidence} /> ·{" "}
                      {rule.duration} · up to {rule.componentLimit} punitive
                      component
                      {rule.componentLimit === 1 ? "" : "s"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </GlassyCard>
  );
}

function MeasureCard({
  expanded,
  measure,
  onToggle,
}: {
  expanded: boolean;
  measure: HumanodeCodexMeasure;
  onToggle: () => void;
}) {
  const linkedOffenses = offensesForMeasure(measure.code);
  return (
    <GlassyCard
      as="article"
      className={cn(
        "scroll-mt-5 border border-border/70 transition-colors",
        expanded && "border-primary/70",
      )}
      data-codex-ref={measure.ref}
      id={measure.ref}
    >
      <div className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Kicker>{measure.kind.replace("_", " ")}</Kicker>
            <h2 className="text-lg font-semibold text-text">{measure.title}</h2>
            <p className="max-w-4xl text-sm leading-6 text-muted">
              <CodexReferencedText text={measure.description} />
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <CodexHint reference={measure.ref} underline={false}>
              <Pill tone="primary" size="sm">
                {measure.ref}
              </Pill>
            </CodexHint>
            <Pill tone="muted" size="sm">
              {measureStatusLabel[measure.status]}
            </Pill>
            <Button
              type="button"
              size="compact"
              variant="ghost"
              aria-controls={`${measure.ref}-details`}
              aria-expanded={expanded}
              onClick={onToggle}
            >
              {expanded ? "Hide details" : "View details"}
            </Button>
          </div>
        </div>
      </div>
      {expanded ? (
        <div
          id={`${measure.ref}-details`}
          className="space-y-3 border-t border-border/70 p-5"
        >
          <h3 className="text-sm font-semibold text-text">
            Linked transgressions
          </h3>
          {linkedOffenses.length ? (
            <div className="flex flex-wrap gap-2">
              {linkedOffenses.map((offense) => (
                <CodexHint
                  key={offense.code}
                  reference={offense.code}
                  underline={false}
                >
                  <Pill tone="primary" size="sm">
                    {offense.code} · {offense.title}
                  </Pill>
                </CodexHint>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              This measure is defined by the Codex but is not present in the
              compiled v1 offense sentence templates.
            </p>
          )}
        </div>
      ) : null}
    </GlassyCard>
  );
}

const HumanodeCodex: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ category: "any", sortBy: "ref" });
  const lastScrolledReference = useRef<string | null>(null);
  const expandedRef = searchParams.get("clause");
  const resolvedExpandedRef =
    expandedRef && humanodeCodexReference(expandedRef) ? expandedRef : null;
  const requestedView = searchParams.get("view");
  const view = resolvedExpandedRef
    ? viewForReference(resolvedExpandedRef)
    : isCodexView(requestedView)
      ? requestedView
      : "matrix";

  const domains = useMemo(
    () => Array.from(new Set(humanodeCodexOffenses.map((item) => item.domain))),
    [],
  );

  useEffect(() => {
    const reference = resolvedExpandedRef;
    if (!reference) {
      lastScrolledReference.current = null;
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(reference);
      if (!target) {
        setSearch("");
        setFilters((current) => ({ ...current, category: "any" }));
        return;
      }
      if (lastScrolledReference.current === reference) return;
      lastScrolledReference.current = reference;
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [filters.category, resolvedExpandedRef, search]);

  const updateLocation = (nextView: CodexView, reference?: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("view", nextView);
    if (reference) next.set("clause", reference);
    else next.delete("clause");
    setSearchParams(next);
  };

  const moveTabFocus = (index: number) => {
    const [nextView] = CODEX_VIEWS[index];
    updateLocation(nextView);
    window.requestAnimationFrame(() => {
      document.getElementById(`codex-tab-${nextView}`)?.focus();
    });
  };

  const filteredOffenses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortCodexEntries(
      humanodeCodexOffenses.filter((item) => {
        const measureText = item.allowedMeasures
          .map((code) => humanodeCodexMeasuresByCode.get(code)?.title ?? code)
          .join(" ");
        return (
          matchesCodexQuery(
            query,
            item.ref,
            item.code,
            item.title,
            item.domain,
            item.definition,
            item.allowedSeverities.join(" "),
            item.evidenceStandards.join(" "),
            measureText,
          ) &&
          (filters.category === "any" || item.domain === filters.category)
        );
      }),
      filters.sortBy,
    );
  }, [filters, search]);

  const filteredMeasures = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortCodexEntries(
      humanodeCodexMeasures.filter((item) =>
        matchesCodexQuery(
          query,
          item.ref,
          item.code,
          item.title,
          item.kind,
          item.status,
          item.description,
          offensesForMeasure(item.code)
            .map(
              (offense) => `${offense.code} ${offense.title} ${offense.domain}`,
            )
            .join(" "),
        ),
      ),
      filters.sortBy,
    );
  }, [filters.sortBy, search]);

  const filteredExcludedMeasures = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortCodexEntries(
      humanodeCodexExcludedMeasures.filter((item) =>
        matchesCodexQuery(
          query,
          item.ref,
          item.title,
          item.status,
          item.reason,
        ),
      ),
      filters.sortBy,
    );
  }, [filters.sortBy, search]);

  const filteredClauses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortCodexEntries(
      humanodeCodexClauses.filter((item) =>
        matchesCodexQuery(
          query,
          item.ref,
          item.title,
          item.summary,
          item.points.join(" "),
        ),
      ),
      filters.sortBy,
    );
  }, [filters.sortBy, search]);

  const filteredSeverityRules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortCodexEntries(
      Object.entries(humanodeCodexSeverityRules)
        .map(([level, rule]) => ({ level, ...rule }))
        .filter((rule) =>
          matchesCodexQuery(
            query,
            rule.ref,
            rule.level,
            rule.title,
            rule.evidence,
            rule.duration,
            String(rule.componentLimit),
          ),
        ),
      filters.sortBy,
    );
  }, [filters.sortBy, search]);

  const filteredEvidenceRules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortCodexEntries(
      Object.values(humanodeCodexEvidenceRules).filter((rule) =>
        matchesCodexQuery(
          query,
          rule.ref,
          rule.code,
          rule.title,
          rule.description,
        ),
      ),
      filters.sortBy,
    );
  }, [filters.sortBy, search]);

  const count =
    view === "matrix"
      ? filteredOffenses.length
      : view === "measures"
        ? filteredMeasures.length + filteredExcludedMeasures.length
        : filteredClauses.length +
          filteredSeverityRules.length +
          filteredEvidenceRules.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Governance law"
        title="Humanode Codex"
        description="Definitions, evidence thresholds, and lawful response envelopes used by Vortex reporting and Courts."
        right={
          <Pill tone="primary" size="sm">
            {HUMANODE_CODEX_VERSION}
          </Pill>
        }
      />

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Codex view"
      >
        {CODEX_VIEWS.map(([value, label]) => (
          <Button
            key={value}
            id={`codex-tab-${value}`}
            type="button"
            size="sm"
            variant={view === value ? "primary" : "ghost"}
            role="tab"
            aria-controls={`codex-panel-${value}`}
            aria-selected={view === value}
            tabIndex={view === value ? 0 : -1}
            onClick={() => updateLocation(value)}
            onKeyDown={(event) => {
              const index = CODEX_VIEWS.findIndex(
                ([candidate]) => candidate === value,
              );
              let nextIndex: number | null = null;
              if (event.key === "ArrowRight") {
                nextIndex = (index + 1) % CODEX_VIEWS.length;
              } else if (event.key === "ArrowLeft") {
                nextIndex =
                  (index - 1 + CODEX_VIEWS.length) % CODEX_VIEWS.length;
              } else if (event.key === "Home") {
                nextIndex = 0;
              } else if (event.key === "End") {
                nextIndex = CODEX_VIEWS.length - 1;
              }
              if (nextIndex === null) return;
              event.preventDefault();
              moveTabFocus(nextIndex);
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      <SearchBar
        value={search}
        onChange={(event) => {
          if (resolvedExpandedRef) updateLocation(view);
          setSearch(event.target.value);
        }}
        placeholder="Search Codex..."
        ariaLabel="Search Humanode Codex"
        filtersConfig={
          view === "matrix"
            ? [
                {
                  key: "category",
                  label: "Domain",
                  options: [
                    { value: "any", label: "Any domain" },
                    ...domains.map((domain) => ({
                      value: domain,
                      label: domain,
                    })),
                  ],
                },
                {
                  key: "sortBy",
                  label: "Sort by",
                  options: [
                    { value: "ref", label: "Clause reference" },
                    { value: "name", label: "Name" },
                  ],
                },
              ]
            : [
                {
                  key: "sortBy",
                  label: "Sort by",
                  options: [
                    { value: "ref", label: "Clause reference" },
                    { value: "name", label: "Name" },
                  ],
                },
              ]
        }
        filtersState={filters}
        onFiltersChange={(nextFilters) => {
          if (resolvedExpandedRef) updateLocation(view);
          setFilters(nextFilters);
        }}
      />

      <p className="text-xs text-muted">
        Showing {count} Codex {count === 1 ? "entry" : "entries"}
      </p>

      {expandedRef && !resolvedExpandedRef ? (
        <NoDataYetBar
          label="Codex reference"
          description={`No Codex entry uses the reference ${expandedRef}. Browse or search the current Codex instead.`}
        />
      ) : null}

      {count === 0 ? (
        <NoDataYetBar
          label="Codex matches"
          description="No Codex entry matches the current search and filters."
        />
      ) : null}

      {view === "matrix" ? (
        <div
          id="codex-panel-matrix"
          className="grid gap-3"
          role="tabpanel"
          aria-labelledby="codex-tab-matrix"
        >
          {filteredOffenses.map((item) => (
            <OffenseCard
              key={item.code}
              offense={item}
              expanded={resolvedExpandedRef === item.ref}
              onToggle={() =>
                updateLocation(
                  "matrix",
                  resolvedExpandedRef === item.ref ? undefined : item.ref,
                )
              }
            />
          ))}
        </div>
      ) : null}

      {view === "measures" ? (
        <div
          id="codex-panel-measures"
          className="grid gap-3"
          role="tabpanel"
          aria-labelledby="codex-tab-measures"
        >
          {filteredMeasures.map((item) => (
            <MeasureCard
              key={item.code}
              measure={item}
              expanded={resolvedExpandedRef === item.ref}
              onToggle={() =>
                updateLocation(
                  "measures",
                  resolvedExpandedRef === item.ref ? undefined : item.ref,
                )
              }
            />
          ))}
          {filteredExcludedMeasures.map((item) => (
            <GlassyCard
              as="article"
              key={item.ref}
              id={item.ref}
              data-codex-ref={item.ref}
              className="scroll-mt-5 border border-destructive/40 p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <Kicker>
                    <CodexHint reference={item.ref}>{item.ref}</CodexHint> ·{" "}
                    excluded measure
                  </Kicker>
                  <h2 className="text-lg font-semibold text-text">
                    {item.title}
                  </h2>
                  <p className="text-sm leading-6 text-muted">
                    <CodexReferencedText text={item.reason} />
                  </p>
                </div>
                <Pill tone="muted" size="sm" className="shrink-0">
                  {item.status}
                </Pill>
              </div>
            </GlassyCard>
          ))}
        </div>
      ) : null}

      {view === "clauses" ? (
        <div
          id="codex-panel-clauses"
          className="grid gap-3"
          role="tabpanel"
          aria-labelledby="codex-tab-clauses"
        >
          {filteredClauses.map((item) => (
            <GlassyCard
              as="article"
              key={item.ref}
              id={item.ref}
              data-codex-ref={item.ref}
              className="scroll-mt-5 space-y-4 border border-border/70 p-5"
            >
              <div className="space-y-2">
                <Kicker>
                  <CodexHint reference={item.ref}>{item.ref}</CodexHint>
                </Kicker>
                <h2 className="text-lg font-semibold text-text">
                  {item.title}
                </h2>
                <p className="text-sm leading-6 text-muted">
                  <CodexReferencedText text={item.summary} />
                </p>
              </div>
              <ol className="grid gap-2 pl-5 text-sm leading-6 text-muted">
                {item.points.map((point, index) => (
                  <li
                    key={point}
                    className="scroll-mt-5 list-decimal"
                    data-codex-ref={`${item.ref}.${index + 1}`}
                    id={`${item.ref}.${index + 1}`}
                  >
                    <CodexHint reference={`${item.ref}.${index + 1}`}>
                      <span className="font-mono text-xs text-primary">
                        {item.ref}.{index + 1}
                      </span>
                    </CodexHint>{" "}
                    <CodexReferencedText text={point} />
                  </li>
                ))}
              </ol>
            </GlassyCard>
          ))}
          {filteredSeverityRules.map(({ level, ...rule }) => (
            <GlassyCard
              as="article"
              key={level}
              id={rule.ref}
              data-codex-ref={rule.ref}
              className="scroll-mt-5 border border-border/70 p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <Kicker>
                    <CodexHint reference={rule.ref}>{rule.ref}</CodexHint> ·{" "}
                    severity
                  </Kicker>
                  <h2 className="text-lg font-semibold text-text">
                    {level} · {rule.title}
                  </h2>
                  <p className="text-sm text-muted">
                    Evidence <CodexReferencedText text={rule.evidence} />;{" "}
                    {rule.duration}; maximum {rule.componentLimit} punitive
                    component
                    {rule.componentLimit === 1 ? "" : "s"}.
                  </p>
                </div>
                <Pill tone="primary" size="sm">
                  {level}
                </Pill>
              </div>
            </GlassyCard>
          ))}
          {filteredEvidenceRules.map((rule) => (
            <GlassyCard
              as="article"
              key={rule.code}
              id={rule.ref}
              data-codex-ref={rule.ref}
              className="scroll-mt-5 border border-border/70 p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <Kicker>
                    <CodexHint reference={rule.ref}>{rule.ref}</CodexHint> ·{" "}
                    evidence standard
                  </Kicker>
                  <h2 className="text-lg font-semibold text-text">
                    {rule.code} · {rule.title}
                  </h2>
                  <p className="max-w-4xl text-sm leading-6 text-muted">
                    <CodexReferencedText text={rule.description} />
                  </p>
                </div>
                <Pill tone="primary" size="sm">
                  {rule.code}
                </Pill>
              </div>
            </GlassyCard>
          ))}
        </div>
      ) : null}

      <p className="text-xs leading-5 text-muted">
        Source: Humanode Foundational Charters and the frozen{" "}
        <CodexReferencedText text={HUMANODE_CODEX_VERSION} /> policy. Executable
        behavior remains bounded by the registered protocol policy and executor
        authority.
      </p>
    </div>
  );
};

export default HumanodeCodex;
