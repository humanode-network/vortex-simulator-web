import { Link } from "react-router";

import { AddressInline } from "@/components/AddressInline";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/primitives/badge";
import { StatTile } from "@/components/StatTile";
import { Surface } from "@/components/Surface";
import { proposalSummaryPreview } from "@/lib/textPreview";
import { cn } from "@/lib/utils";
import type { FormationProjectDto, FormationStageDto } from "@/types/api";
import "../Formation.css";

type FormationProjectCardFact = {
  label: string;
  value: string;
  highlight?: boolean;
};

type FormationProjectCardAction = {
  href: string;
  label: string;
};

type FormationProjectCardViewModel = {
  action?: FormationProjectCardAction;
  facts?: FormationProjectCardFact[];
  footerLabel?: string;
  footerValue?: string;
  id?: string;
  stage: FormationStageDto;
  statusLabel?: string;
  summary: string;
  tags?: string[];
  title: string;
};

type FormationProjectCardProps = {
  className?: string;
  project: FormationProjectCardViewModel;
};

const stageLabel: Record<FormationStageDto, string> = {
  live: "Ongoing",
  gathering: "Gathering team",
  completed: "Ended",
};

const stageVisual: Record<FormationStageDto, { railClass: string }> = {
  live: { railClass: "formation-project-card--ongoing" },
  gathering: { railClass: "formation-project-card--gathering" },
  completed: { railClass: "formation-project-card--ended" },
};

function compactFormationMetric(value: string) {
  return value
    .replace(/\s+completed\b/gi, "")
    .replace(/\s+locked\b/gi, "")
    .replace(/\s+open\b/gi, "");
}

function formationHref(project: FormationProjectDto) {
  return project.stage === "completed"
    ? `/app/proposals/${project.id ?? "project"}/finished`
    : `/app/proposals/${project.id ?? "project"}/formation`;
}

export function formationProjectCardFromDto(
  project: FormationProjectDto,
): FormationProjectCardViewModel {
  const chamberLabel = project.chamberTitle ?? project.chamber ?? "Unassigned";
  return {
    action: {
      href: formationHref(project),
      label: project.stage === "completed" ? "Open finished" : "Open project",
    },
    facts: [
      { label: "Chamber", value: chamberLabel, highlight: true },
      { label: "Budget", value: project.budget },
      {
        label: "Milestones",
        value: compactFormationMetric(project.milestones),
      },
      { label: "Team slots", value: compactFormationMetric(project.teamSlots) },
    ],
    footerLabel: "Proposer",
    footerValue: project.proposer,
    id: project.id,
    stage: project.stage,
    summary: project.summary,
    title: project.title,
  };
}

function stageFromProjectStatus(status: string): FormationStageDto {
  const normalized = status.trim().toLowerCase();
  if (normalized.includes("gather")) return "gathering";
  if (
    normalized.includes("end") ||
    normalized.includes("complete") ||
    normalized.includes("finish")
  ) {
    return "completed";
  }
  return "live";
}

export function formationProjectCardFromProfileProject(project: {
  budget?: string;
  chamber?: string;
  chamberTitle?: string;
  chips: string[];
  id?: string;
  milestones?: string;
  proposer?: string;
  stage?: FormationStageDto;
  status: string;
  summary: string;
  teamSlots?: string;
  title: string;
}): FormationProjectCardViewModel {
  if (
    project.id &&
    project.stage &&
    project.proposer &&
    project.budget &&
    project.milestones &&
    project.teamSlots
  ) {
    return formationProjectCardFromDto({
      budget: project.budget,
      category: "research",
      chamber: project.chamber,
      chamberTitle: project.chamberTitle,
      focus: project.chips[0] ?? "Formation",
      id: project.id,
      milestones: project.milestones,
      proposer: project.proposer,
      stage: project.stage,
      summary: project.summary,
      teamSlots: project.teamSlots,
      title: project.title,
    });
  }

  return {
    facts: [
      {
        label: "Chamber",
        value: project.chamberTitle ?? "Unassigned",
        highlight: true,
      },
      { label: "Budget", value: project.budget ?? "—" },
      {
        label: "Milestones",
        value: compactFormationMetric(project.milestones ?? "—"),
      },
      {
        label: "Team slots",
        value: compactFormationMetric(project.teamSlots ?? "—"),
      },
    ],
    footerLabel: project.proposer ? "Proposer" : undefined,
    footerValue: project.proposer,
    id: project.id,
    stage: stageFromProjectStatus(project.status),
    summary: project.summary,
    title: project.title,
  };
}

export function FormationProjectCard({
  className,
  project,
}: FormationProjectCardProps) {
  const visual = stageVisual[project.stage];
  const facts = project.facts ?? [];
  const statusLabel = project.statusLabel ?? stageLabel[project.stage];

  return (
    <Surface
      as="article"
      variant="glass"
      radius="2xl"
      shadow="card"
      className={cn("formation-project-card", visual.railClass, className)}
    >
      <Chip className="formation-project-card__stage">{statusLabel}</Chip>
      <div className="formation-project-card__header">
        <div className="formation-project-card__copy">
          <h3 className="formation-project-card__title">{project.title}</h3>
          <p className="formation-project-card__summary">
            {proposalSummaryPreview(project.summary)}
          </p>
        </div>
      </div>

      <div className="formation-project-card__body">
        <div className="formation-project-card__facts">
          {facts.map((fact) => (
            <StatTile
              key={fact.label}
              align="left"
              className={cn(
                "formation-project-card__fact",
                fact.highlight && "formation-project-card__fact--chamber",
              )}
              label={fact.label}
              value={fact.value}
              valueClassName="formation-project-card__factValue"
            />
          ))}
        </div>

        {project.tags?.length ? (
          <div className="formation-project-card__tags">
            {project.tags.map((tag) => (
              <Badge key={tag} size="sm" variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        {project.footerValue || project.action ? (
          <div className="formation-project-card__footer">
            {project.footerValue ? (
              <div className="formation-project-card__proposer">
                {project.footerLabel ? (
                  <span className="formation-project-card__label">
                    {project.footerLabel}
                  </span>
                ) : null}
                <AddressInline
                  address={project.footerValue}
                  className="min-w-0"
                  textClassName="text-sm font-semibold text-text"
                />
              </div>
            ) : (
              <span />
            )}
            {project.action ? (
              <div className="formation-project-card__actions">
                <Button asChild size="compact">
                  <Link to={project.action.href}>{project.action.label}</Link>
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Surface>
  );
}
