import type { ReactNode } from "react";

import { ChevronDown } from "lucide-react";

import { Chip } from "@/components/Chip";
import { GlassyCard } from "@/components/GlassyCard";
import { StageChip } from "@/components/StageChip";
import { proposalSummaryPreview } from "@/lib/textPreview";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types/stages";
import "./GlassyRecordCard.css";

type GlassyRecordCardProps = {
  children: ReactNode;
  className?: string;
  dateText?: ReactNode;
  expanded: boolean;
  meta?: ReactNode;
  onToggle: () => void;
  rail?: "action" | "idle" | "recent";
  stage: Stage;
  stageLabel?: ReactNode;
  summary: ReactNode;
  title: ReactNode;
};

export function GlassyRecordCard({
  children,
  className,
  dateText,
  expanded,
  meta,
  onToggle,
  rail = "idle",
  stage,
  stageLabel,
  summary,
  title,
}: GlassyRecordCardProps) {
  const renderedSummary =
    typeof summary === "string" ? proposalSummaryPreview(summary) : summary;

  return (
    <GlassyCard
      as="article"
      className={cn(
        "glassy-record-card",
        expanded && "glassy-record-card--open",
        rail === "action" && "glassy-record-card--action",
        rail === "recent" && "glassy-record-card--recent",
        className,
      )}
    >
      <button
        type="button"
        className="glassy-record-card__button"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <span className="glassy-record-card__copy">
          <span className="glassy-record-card__titleRow">
            <span className="glassy-record-card__title">{title}</span>
          </span>
          <span className="glassy-record-card__summary">{renderedSummary}</span>
        </span>
        <span className="glassy-record-card__aside">
          {meta ? (
            <Chip className="glassy-record-card__metaPill">{meta}</Chip>
          ) : null}
          <StageChip
            stage={stage}
            label={stageLabel}
            className="glassy-record-card__stage"
          />
          {dateText ? (
            <span className="glassy-record-card__time">{dateText}</span>
          ) : null}
          <ChevronDown
            className={cn(
              "glassy-record-card__chevron",
              expanded && "glassy-record-card__chevron--open",
            )}
          />
        </span>
      </button>

      {expanded ? (
        <div className="glassy-record-card__details">{children}</div>
      ) : null}
    </GlassyCard>
  );
}
