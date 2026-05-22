import { Surface } from "@/components/Surface";

type ProposalStageStatusEntry = {
  description: string;
  title: string;
  value: string;
};

type ProposalStageStatusProps = {
  stageData: ProposalStageStatusEntry[];
  title: string;
};

export const ProposalStageStatus: React.FC<ProposalStageStatusProps> = ({
  stageData,
  title,
}) => {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stageData.map((entry) => (
          <Surface
            key={entry.title}
            variant="panelAlt"
            radius="xl"
            shadow="tile"
            className="p-4"
          >
            <p className="text-sm font-semibold text-muted">{entry.title}</p>
            <p className="text-xs text-muted">{entry.description}</p>
            <p className="text-lg font-semibold text-text">{entry.value}</p>
          </Surface>
        ))}
      </div>
    </section>
  );
};
