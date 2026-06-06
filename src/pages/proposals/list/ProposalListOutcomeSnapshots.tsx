import { Surface } from "@/components/Surface";
import { ProposalStageDataGrid } from "./ProposalStageDataGrid";
import type {
  ProposalChamberVetoSnapshotProps,
  ProposalCitizenVetoSnapshotProps,
  ProposalFinishedSnapshotProps,
  ProposalFormationSnapshotProps,
} from "./ProposalListStagePanelTypes";

export function ProposalFinishedSnapshot({
  itemKeyPrefix,
  stageData,
  terminalSummary,
}: ProposalFinishedSnapshotProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-text">Outcome status</p>
      <Surface
        variant="glass"
        radius="2xl"
        shadow="tile"
        className="px-5 py-4 text-sm text-muted"
      >
        {terminalSummary}
      </Surface>
      <ProposalStageDataGrid
        items={stageData}
        itemKeyPrefix={itemKeyPrefix}
        includeTone={false}
      />
    </div>
  );
}

export function ProposalCitizenVetoSnapshot({
  attemptsRemaining,
  attemptsUsed,
  itemKeyPrefix,
  stageData,
}: ProposalCitizenVetoSnapshotProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-text">Citizen veto snapshot</p>
      <Surface
        variant="glass"
        radius="2xl"
        shadow="tile"
        className="px-5 py-4 text-sm text-muted"
      >
        Citizen-tier voters can remand this approved decision for
        reconsideration. Attempts used: {attemptsUsed} /{" "}
        {attemptsUsed + attemptsRemaining}.
      </Surface>
      <ProposalStageDataGrid items={stageData} itemKeyPrefix={itemKeyPrefix} />
    </div>
  );
}

export function ProposalChamberVetoSnapshot({
  chamberThreshold,
  itemKeyPrefix,
  stageData,
  vetoingChambers,
}: ProposalChamberVetoSnapshotProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-text">Chamber veto snapshot</p>
      <Surface
        variant="glass"
        radius="2xl"
        shadow="tile"
        className="px-5 py-4 text-sm text-muted"
      >
        {vetoingChambers} / {chamberThreshold} chambers currently count as
        vetoing.
      </Surface>
      <ProposalStageDataGrid items={stageData} itemKeyPrefix={itemKeyPrefix} />
    </div>
  );
}

export function ProposalFormationSnapshot({
  itemKeyPrefix,
  progress,
  stageData,
  stats,
  timeLeft,
}: ProposalFormationSnapshotProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-text">Execution snapshot</p>

      <Surface
        variant="glass"
        radius="2xl"
        shadow="tile"
        className="space-y-3 px-5 py-4"
      >
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-text">Progress</span>
          <span className="font-semibold text-text">{progress}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full bg-accent"
            style={{
              width: `${Math.min(Math.max(stats.progressValue, 0), 100)}%`,
            }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <span>
            Milestones {stats.milestones.a} / {stats.milestones.b}
          </span>
          <span>
            Team {stats.team.a} / {stats.team.b}
          </span>
          <span>Time left {timeLeft}</span>
        </div>
      </Surface>

      <ProposalStageDataGrid
        items={stageData}
        itemKeyPrefix={itemKeyPrefix}
        limit={3}
        includeTone={false}
      />
    </div>
  );
}
