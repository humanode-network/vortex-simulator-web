import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { CodexReferencedText } from "@/components/CodexHint";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHeader } from "@/components/PageHeader";
import { Pill } from "@/components/Pill";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/primitives/button";
import {
  HUMANODE_CODEX_VERSION,
  humanodeCodexClauses,
  humanodeCodexEvidenceRules,
  humanodeCodexExcludedMeasures,
  humanodeCodexMeasures,
  humanodeCodexMeasuresByCode,
  humanodeCodexOffenses,
  humanodeCodexReference,
  humanodeCodexSeverityRules,
} from "@/data/humanodeCodex";
import {
  ClauseCard,
  EvidenceRuleCard,
  ExcludedMeasureCard,
  MeasureCard,
  OffenseCard,
  SeverityRuleCard,
} from "@/pages/humanode-codex/CodexEntryCards";
import {
  CODEX_VIEWS,
  type CodexView,
  isCodexView,
  matchesCodexQuery,
  offensesForMeasure,
  sortCodexEntries,
  viewForReference,
} from "@/pages/humanode-codex/codexModel";

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
            <ExcludedMeasureCard key={item.ref} measure={item} />
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
            <ClauseCard key={item.ref} clause={item} />
          ))}
          {filteredSeverityRules.map(({ level, ...rule }) => (
            <SeverityRuleCard key={level} level={level} rule={rule} />
          ))}
          {filteredEvidenceRules.map((rule) => (
            <EvidenceRuleCard key={rule.code} rule={rule} />
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
