import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Chip } from "@/components/Chip";
import { HintLabel } from "@/components/Hint";
import {
  stageChipKindForStage,
  stageLabelForStage,
  type Stage,
  type StageChipKind,
} from "@/types/stages";
import "./StageChip.css";

const chipClasses: Record<StageChipKind, string> = {
  proposal_pool: "stage-chip--proposal-pool",
  chamber_vote: "stage-chip--chamber-vote",
  citizen_veto: "stage-chip--citizen-veto",
  chamber_veto: "stage-chip--chamber-veto",
  formation: "stage-chip--formation",
  passed: "stage-chip--passed",
  failed: "stage-chip--failed",
  thread: "stage-chip--thread",
  courts: "stage-chip--courts",
  faction: "stage-chip--faction",
  system: "stage-chip--system",
};

const hintByKind: Partial<Record<StageChipKind, string>> = {
  proposal_pool: "proposal_pools",
  chamber_vote: "chamber_vote",
  formation: "formation",
};

type StageChipProps = {
  stage: Stage;
  label?: ReactNode;
  className?: string;
};

export function StageChip({ stage, label, className }: StageChipProps) {
  const kind: StageChipKind = stageChipKindForStage(stage);
  const termId = hintByKind[kind];
  const content = label ?? stageLabelForStage(stage);

  return (
    <Chip className={cn("stage-chip", chipClasses[kind], className)}>
      {termId ? <HintLabel termId={termId}>{content}</HintLabel> : content}
    </Chip>
  );
}
