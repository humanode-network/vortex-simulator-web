import { SectionHeader } from "@/components/SectionHeader";
import { StatTile } from "@/components/StatTile";
import { Surface } from "@/components/Surface";

type ProposalCitizenVetoStatsProps = {
  attemptsRemaining: number;
  attemptsUsed: number;
  castVotes: number;
  quorumNeeded: number;
  quorumPercent: number;
  timeLeft: string;
  vetoNeeded: number;
  vetoPercent: number;
  vetoVotes: number;
};

export const ProposalCitizenVetoStats: React.FC<
  ProposalCitizenVetoStatsProps
> = ({
  attemptsRemaining,
  attemptsUsed,
  castVotes,
  quorumNeeded,
  quorumPercent,
  timeLeft,
  vetoNeeded,
  vetoPercent,
  vetoVotes,
}) => {
  return (
    <section className="space-y-4">
      <SectionHeader>Citizen veto window</SectionHeader>
      {castVotes === 0 ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          No Citizen Veto votes yet.
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
          label="Participation"
          value={
            <>
              <span>
                {castVotes} / {quorumNeeded}
              </span>
              <span className="text-xs font-semibold text-muted">
                {quorumPercent}% of eligible Citizens
              </span>
            </>
          }
          variant="panel"
          className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
          valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
        />
        <StatTile
          label="Veto threshold"
          value={
            <>
              <span>
                {vetoVotes} / {vetoNeeded}
              </span>
              <span className="text-xs font-semibold text-muted">
                {vetoPercent}% of eligible Citizens
              </span>
            </>
          }
          variant="panel"
          className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
          valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
        />
        <StatTile
          label="Attempts left"
          value={
            <>
              <span>{attemptsRemaining}</span>
              <span className="text-xs font-semibold text-muted">
                {attemptsUsed} of {attemptsUsed + attemptsRemaining} used
              </span>
            </>
          }
          variant="panel"
          className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
          valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
        />
      </div>
    </section>
  );
};
