import { HintLabel } from "@/components/Hint";
import { SectionHeader } from "@/components/SectionHeader";
import { StatTile } from "@/components/StatTile";

type ProposalPoolAttentionStatsProps = {
  attentionNeededPercent: number;
  attentionPercent: number;
  upvoteFloorFractionPercent: number;
  upvoteFloorProgressPercent: number;
};

export const ProposalPoolAttentionStats: React.FC<
  ProposalPoolAttentionStatsProps
> = ({
  attentionNeededPercent,
  attentionPercent,
  upvoteFloorFractionPercent,
  upvoteFloorProgressPercent,
}) => {
  return (
    <section className="space-y-3">
      <SectionHeader>Quorum of attention</SectionHeader>
      <div className="grid gap-3 text-sm text-text sm:grid-cols-2 lg:grid-cols-2">
        <StatTile
          label={
            <HintLabel
              termId="quorum_of_attention"
              termText="Attention quorum"
              suffix=" (%)"
            />
          }
          value={
            <>
              {attentionPercent}% / {attentionNeededPercent}%
            </>
          }
          variant="panel"
          className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
          valueClassName="text-2xl font-semibold"
        />
        <StatTile
          label={
            <HintLabel
              termId="upvote_floor"
              termText="Upvote floor"
              suffix=" (%)"
            />
          }
          value={
            <>
              {upvoteFloorProgressPercent}% / {upvoteFloorFractionPercent}%
            </>
          }
          variant="panel"
          className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
          valueClassName="text-2xl font-semibold"
        />
      </div>
    </section>
  );
};
