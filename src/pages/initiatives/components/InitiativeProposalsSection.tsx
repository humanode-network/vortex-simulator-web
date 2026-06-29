import { Link } from "react-router";

import { NoDataYetBar } from "@/components/NoDataYetBar";
import { GlassySection } from "@/components/GlassySection";
import { StageChip } from "@/components/StageChip";
import type { InitiativeProposalLinkDto } from "@/types/api";

type InitiativeProposalsSectionProps = {
  proposals: InitiativeProposalLinkDto[];
};

export function InitiativeProposalsSection({
  proposals,
}: InitiativeProposalsSectionProps) {
  return (
    <GlassySection title="Associated proposals">
      {proposals.length === 0 ? (
        <NoDataYetBar
          label="associated proposals"
          description="When an initiative admin or steward creates a proposal from an initiative, it should appear here as provenance."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {proposals.map((proposal) => (
            <Link
              key={proposal.proposalId}
              to={proposal.href}
              className="rounded-2xl border border-[color:var(--surface-glass-border)] bg-[color:var(--surface-glass-bg)] p-4 shadow-[var(--shadow-tile)] transition hover:border-[color:var(--surface-glass-hover-border)]"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-text">
                  {proposal.title}
                </h3>
                <StageChip stage={proposal.stage} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </GlassySection>
  );
}
