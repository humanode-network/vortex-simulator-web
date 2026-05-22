import { StageDataTile } from "@/components/StageDataTile";

type ProposalStageDataItem = {
  title: string;
  description: string;
  value: string;
  tone?: "ok" | "warn";
};

type ProposalStageDataGridProps = {
  items: ProposalStageDataItem[];
  itemKeyPrefix: string;
  limit?: number;
  includeTone?: boolean;
};

export function ProposalStageDataGrid({
  items,
  itemKeyPrefix,
  limit,
  includeTone = true,
}: ProposalStageDataGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {(limit ? items.slice(0, limit) : items).map((item, index) => (
        <StageDataTile
          key={`${itemKeyPrefix}-${index}`}
          title={item.title}
          description={item.description}
          value={item.value}
          tone={includeTone ? item.tone : undefined}
        />
      ))}
    </div>
  );
}
