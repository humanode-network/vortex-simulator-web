import { Surface } from "@/components/Surface";
import { ProposalTimelineCard } from "@/components/ProposalSections";
import { formatLoadError } from "@/lib/errorFormatting";
import type { ProposalTimelineItemDto } from "@/types/api";

type ProposalTimelineSectionProps = {
  error: string | null;
  items: ProposalTimelineItemDto[];
  proposalId?: string;
};

export function ProposalTimelineSection({
  error,
  items,
  proposalId,
}: ProposalTimelineSectionProps) {
  if (error) {
    return (
      <Surface
        variant="panelAlt"
        radius="2xl"
        shadow="tile"
        className="px-5 py-4 text-sm text-muted"
      >
        Timeline unavailable: {formatLoadError(error)}
      </Surface>
    );
  }

  return <ProposalTimelineCard items={items} proposalId={proposalId ?? ""} />;
}
