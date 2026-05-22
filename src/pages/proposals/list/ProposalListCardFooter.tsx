import { Badge } from "@/components/primitives/badge";
import { CardActionsRow } from "@/components/CardActionsRow";
import { DashedStatItem } from "@/components/DashedStatItem";
import type { ProposalStatDto } from "@/types/api";

type ProposalListCardFooterProps = {
  ctaPrimary: string;
  keyStats: ProposalStatDto[];
  primaryHref: string;
  proposer: string;
  proposerId: string;
  proposalId: string;
  tags: string[];
};

export function ProposalListCardFooter({
  ctaPrimary,
  keyStats,
  primaryHref,
  proposer,
  proposerId,
  proposalId,
  tags,
}: ProposalListCardFooterProps) {
  return (
    <>
      {keyStats.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text">Key stats</p>
          <ul className="grid gap-2 text-sm text-text sm:grid-cols-2">
            {keyStats.map((stat) => (
              <DashedStatItem
                key={`${proposalId}-stat-${stat.label}`}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="muted" size="sm">
            {tag}
          </Badge>
        ))}
      </div>

      <CardActionsRow
        proposer={proposer}
        proposerId={proposerId}
        primaryHref={primaryHref}
        primaryLabel={ctaPrimary}
      />
    </>
  );
}
