import { SectionHeader } from "@/components/SectionHeader";
import { StatTile } from "@/components/StatTile";
import { Surface } from "@/components/Surface";

type ProposalChamberVetoStatsProps = {
  activeChambers: number;
  chamberThreshold: number;
  timeLeft: string;
  vetoingChambers: number;
  voteCount: number;
};

export const ProposalChamberVetoStats: React.FC<
  ProposalChamberVetoStatsProps
> = ({
  activeChambers,
  chamberThreshold,
  timeLeft,
  vetoingChambers,
  voteCount,
}) => {
  return (
    <section className="space-y-4">
      <SectionHeader>Chamber veto window</SectionHeader>
      {voteCount === 0 ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          No chamber veto initiated yet.
        </Surface>
      ) : null}
      <div className="grid gap-3 text-sm text-text sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Time left"
          value={timeLeft}
          variant="panel"
          className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
          valueClassName="text-2xl font-semibold"
        />
        <StatTile
          label="Active chambers"
          value={String(activeChambers)}
          variant="panel"
          className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
          valueClassName="text-2xl font-semibold"
        />
        <StatTile
          label="Vetoing chambers"
          value={`${vetoingChambers} / ${chamberThreshold}`}
          variant="panel"
          className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
          valueClassName="text-2xl font-semibold"
        />
        <StatTile
          label="Threshold"
          value="66.6%"
          variant="panel"
          className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
          valueClassName="text-2xl font-semibold"
        />
      </div>
    </section>
  );
};
