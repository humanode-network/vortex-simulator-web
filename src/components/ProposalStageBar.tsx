import React from "react";
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
  showFormationStage?: boolean;
  className?: string;
};

export const ProposalStageBar: React.FC<ProposalStageBarProps> = ({
  current,
  showFormationStage = true,
  className,
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
        const activeClasses =
          stage.key === "draft"
            ? "bg-panel text-text border border-border shadow-[var(--shadow-control)] ring-1 ring-inset ring-[color:var(--glass-border)]"
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
        return (
          <div
            key={stage.key}
            className={[
              "min-w-0 basis-[calc(50%-0.25rem)] rounded-full px-3 py-2 text-center text-xs leading-tight font-semibold transition sm:flex-1 sm:basis-0",
              active
                ? activeClasses
                : "border border-border bg-panel-alt [background-image:var(--card-grad)] bg-cover bg-no-repeat text-muted",
            ].join(" ")}
          >
            {stage.render ?? stage.label}
          </div>
        );
      })}
    </div>
  );
};
