import { CodexHint, CodexReferencedText } from "@/components/CodexHint";
import { GlassyCard } from "@/components/GlassyCard";
import { GlassyCompactGrid, GlassyKeyValue } from "@/components/GlassySection";
import { Kicker } from "@/components/Kicker";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/primitives/button";
import {
  HUMANODE_CODEX_JURY_SIZE,
  HUMANODE_CODEX_SENTENCE_AUTHORIZATION,
  humanodeCodexMeasuresByCode,
  humanodeCodexSeverityRules,
  type HumanodeCodexClause,
  type HumanodeCodexEvidenceRule,
  type HumanodeCodexExcludedMeasure,
  type HumanodeCodexMeasure,
  type HumanodeCodexOffense,
} from "@/data/humanodeCodex";
import { cn } from "@/lib/utils";
import { offensesForMeasure } from "@/pages/humanode-codex/codexModel";

const measureStatusLabel: Record<HumanodeCodexMeasure["status"], string> = {
  active: "Active in v1",
  defined: "Defined; not in a v1 sentence template",
  protective_control: "Protective control",
  reserved: "Reserved and inactive",
};

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

export function OffenseCard({
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

export function MeasureCard({
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

export function ExcludedMeasureCard({
  measure,
}: {
  measure: HumanodeCodexExcludedMeasure;
}) {
  return (
    <GlassyCard
      as="article"
      id={measure.ref}
      data-codex-ref={measure.ref}
      className="scroll-mt-5 border border-destructive/40 p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Kicker>
            <CodexHint reference={measure.ref}>{measure.ref}</CodexHint> ·
            excluded measure
          </Kicker>
          <h2 className="text-lg font-semibold text-text">{measure.title}</h2>
          <p className="text-sm leading-6 text-muted">
            <CodexReferencedText text={measure.reason} />
          </p>
        </div>
        <Pill tone="muted" size="sm" className="shrink-0">
          {measure.status}
        </Pill>
      </div>
    </GlassyCard>
  );
}

export function ClauseCard({ clause }: { clause: HumanodeCodexClause }) {
  return (
    <GlassyCard
      as="article"
      id={clause.ref}
      data-codex-ref={clause.ref}
      className="scroll-mt-5 space-y-4 border border-border/70 p-5"
    >
      <div className="space-y-2">
        <Kicker>
          <CodexHint reference={clause.ref}>{clause.ref}</CodexHint>
        </Kicker>
        <h2 className="text-lg font-semibold text-text">{clause.title}</h2>
        <p className="text-sm leading-6 text-muted">
          <CodexReferencedText text={clause.summary} />
        </p>
      </div>
      <ol className="grid gap-2 pl-5 text-sm leading-6 text-muted">
        {clause.points.map((point, index) => {
          const reference = `${clause.ref}.${index + 1}`;
          return (
            <li
              key={point}
              className="scroll-mt-5 list-decimal"
              data-codex-ref={reference}
              id={reference}
            >
              <CodexHint reference={reference}>
                <span className="font-mono text-xs text-primary">
                  {reference}
                </span>
              </CodexHint>{" "}
              <CodexReferencedText text={point} />
            </li>
          );
        })}
      </ol>
    </GlassyCard>
  );
}

type SeverityRuleCardProps = {
  level: string;
  rule: {
    componentLimit: number;
    duration: string;
    evidence: string;
    ref: string;
    title: string;
  };
};

export function SeverityRuleCard({ level, rule }: SeverityRuleCardProps) {
  return (
    <GlassyCard
      as="article"
      id={rule.ref}
      data-codex-ref={rule.ref}
      className="scroll-mt-5 border border-border/70 p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Kicker>
            <CodexHint reference={rule.ref}>{rule.ref}</CodexHint> · severity
          </Kicker>
          <h2 className="text-lg font-semibold text-text">
            {level} · {rule.title}
          </h2>
          <p className="text-sm text-muted">
            Evidence <CodexReferencedText text={rule.evidence} />;{" "}
            {rule.duration}; maximum {rule.componentLimit} punitive component
            {rule.componentLimit === 1 ? "" : "s"}.
          </p>
        </div>
        <Pill tone="primary" size="sm">
          {level}
        </Pill>
      </div>
    </GlassyCard>
  );
}

export function EvidenceRuleCard({
  rule,
}: {
  rule: HumanodeCodexEvidenceRule;
}) {
  return (
    <GlassyCard
      as="article"
      id={rule.ref}
      data-codex-ref={rule.ref}
      className="scroll-mt-5 border border-border/70 p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Kicker>
            <CodexHint reference={rule.ref}>{rule.ref}</CodexHint> · evidence
            standard
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
  );
}
