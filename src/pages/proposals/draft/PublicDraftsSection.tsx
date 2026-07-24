import { GlassySection } from "@/components/GlassySection";
import type { PublicProposalDraftListItemDto } from "@/types/api";
import { PublicDraftCard } from "./PublicDraftCard";

type PublicDraftsSectionProps = {
  drafts: PublicProposalDraftListItemDto[];
  title?: string;
};

export function PublicDraftsSection({
  drafts,
  title = "Public drafts",
}: PublicDraftsSectionProps) {
  if (drafts.length === 0) return null;
  return (
    <GlassySection title={title}>
      <div className="grid gap-3 lg:grid-cols-2">
        {drafts.map((draft) => (
          <PublicDraftCard key={draft.id} draft={draft} />
        ))}
      </div>
    </GlassySection>
  );
}
