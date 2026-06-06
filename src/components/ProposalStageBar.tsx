import React from "react";
import { Link } from "react-router";
import { HintLabel } from "@/components/Hint";

export type ProposalStage =
  | "draft"
  | "pool"
  | "vote"
  | "citizen_veto"
  | "chamber_veto"
  | "build"
  | "passed"
  | "failed";

type ProposalStageBarProps = {
  current: ProposalStage;
  liveStage?: ProposalStage;
  showFormationStage?: boolean;
  className?: string;
  stageLinks?: Partial<Record<ProposalStage, string>>;
};

const stageOrder: ProposalStage[] = [
  "draft",
  "pool",
  "vote",
  "citizen_veto",
  "chamber_veto",
  "build",
  "passed",
  "failed",
];

function stageProgressIndex(stage: ProposalStage): number {
  if (stage === "passed" || stage === "failed") return 6;
  return stageOrder.indexOf(stage);
}

function stageRoute(proposalId: string, stage: ProposalStage): string | null {
  if (stage === "draft") return null;
  if (stage === "pool") return `/app/proposals/${proposalId}/pp`;
  if (stage === "vote") return `/app/proposals/${proposalId}/chamber`;
  if (stage === "citizen_veto")
    return `/app/proposals/${proposalId}/citizen-veto`;
  if (stage === "chamber_veto")
    return `/app/proposals/${proposalId}/chamber-veto`;
  if (stage === "build") return `/app/proposals/${proposalId}/formation`;
  return `/app/proposals/${proposalId}/finished`;
}

function withSnapshotStage(href: string, stage: ProposalStage): string {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}snapshotStage=${stage}`;
}

type BuildProposalStageLinksInput = {
  canonicalRoute?: string;
  liveStage: ProposalStage;
  proposalId: string;
  routeOverrides?: Partial<Record<ProposalStage, string>>;
  showFormationStage?: boolean;
};

export function buildProposalStageLinks({
  canonicalRoute,
  liveStage,
  proposalId,
  routeOverrides,
  showFormationStage = true,
}: BuildProposalStageLinksInput): Partial<Record<ProposalStage, string>> {
  const liveIndex = stageProgressIndex(liveStage);
  const links: Partial<Record<ProposalStage, string>> = {};

  for (const stage of stageOrder) {
    if (stage === "draft") continue;
    if (stage === "build" && !showFormationStage && liveStage !== "build") {
      continue;
    }
    if (stageProgressIndex(stage) > liveIndex) continue;
    if ((stage === "passed" || stage === "failed") && stage !== liveStage) {
      continue;
    }

    const baseHref = routeOverrides?.[stage] ?? stageRoute(proposalId, stage);
    if (!baseHref) continue;

    links[stage] =
      stage === liveStage
        ? (canonicalRoute ?? baseHref)
        : withSnapshotStage(baseHref, stage);
  }

  return links;
}

export const ProposalStageBar: React.FC<ProposalStageBarProps> = ({
  current,
  liveStage,
  showFormationStage = true,
  className,
  stageLinks,
}) => {
  const allStages: {
    key: ProposalStage;
    label: string;
    render?: React.ReactNode;
  }[] = [
    { key: "draft", label: "Draft" },
    {
      key: "pool",
      label: "Proposal pool",
      render: <HintLabel termId="proposal_pools">Proposal pool</HintLabel>,
    },
    {
      key: "vote",
      label: "Chamber vote",
      render: <HintLabel termId="chamber_vote">Chamber vote</HintLabel>,
    },
    { key: "citizen_veto", label: "Citizen veto" },
    { key: "chamber_veto", label: "Chamber veto" },
    {
      key: "build",
      label: "Formation",
      render: <HintLabel termId="formation">Formation</HintLabel>,
    },
    { key: "passed", label: "Passed" },
    { key: "failed", label: "Failed" },
  ];
  const stages = allStages.filter(
    (stage) =>
      stage.key !== "build" || showFormationStage || current === "build",
  );

  return (
    <div
      className={["flex flex-wrap gap-2", className].filter(Boolean).join(" ")}
    >
      {stages.map((stage) => {
        const active = stage.key === current;
        const live = stage.key === liveStage;
        const href = stageLinks?.[stage.key];
        const activeClasses =
          stage.key === "draft"
            ? "border border-[color:var(--surface-glass-border)] bg-[color:var(--surface-glass-bg)] text-text shadow-[var(--shadow-control)] ring-1 ring-inset ring-[color:var(--surface-glass-ring)]"
            : stage.key === "pool"
              ? "bg-primary text-[var(--primary-foreground)]"
              : stage.key === "vote"
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : stage.key === "citizen_veto"
                  ? "bg-[color:var(--danger)]/14 text-[color:var(--danger)]"
                  : stage.key === "chamber_veto"
                    ? "bg-[color:var(--danger)]/18 text-[color:var(--danger)] ring-1 ring-[color:var(--danger)]/25"
                    : stage.key === "build"
                      ? "bg-[var(--accent-warm)] text-[var(--text)]"
                      : stage.key === "passed"
                        ? "bg-[color:var(--ok)]/20 text-[color:var(--ok)]"
                        : "bg-[color:var(--danger)]/12 text-[color:var(--danger)]";
        const className = [
          "min-w-0 basis-[calc(50%-0.25rem)] rounded-full px-3 py-2 text-center text-xs leading-tight font-semibold transition sm:flex-1 sm:basis-0",
          active
            ? activeClasses
            : "border border-[color:var(--surface-glass-border)] bg-[color:var(--control-glass-bg)] text-muted supports-[backdrop-filter]:backdrop-blur-md",
          live && !active ? "ring-2 ring-[color:var(--primary)]/35" : "",
          href
            ? "hover:border-[color:var(--surface-glass-hover-border)] hover:bg-[color:var(--control-glass-hover-bg)] hover:text-text"
            : "",
        ].join(" ");
        const content = stage.render ?? stage.label;
        const inner = (
          <span className="flex min-w-0 flex-col items-center gap-0.5">
            <span className="min-w-0 truncate">{content}</span>
            {live ? (
              <span className="rounded-full bg-[color:var(--primary-dim)] px-1.5 py-0.5 text-[0.6rem] leading-none text-text">
                Live
              </span>
            ) : active ? (
              <span className="rounded-full bg-[color:var(--surface-glass-bg)] px-1.5 py-0.5 text-[0.6rem] leading-none text-text">
                Viewing
              </span>
            ) : null}
          </span>
        );
        return href ? (
          <Link key={stage.key} to={href} className={className}>
            {inner}
          </Link>
        ) : (
          <div key={stage.key} className={className}>
            {inner}
          </div>
        );
      })}
    </div>
  );
};
