import type { ReactNode } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { StatTile } from "@/components/StatTile";
import { TierLabel } from "@/components/TierLabel";
import {
  DETAIL_TILE_CLASS,
  PROOF_TILE_CLASS,
  normalizeDetailValue,
} from "@/lib/profileUi";
import type { HumanNodeProfileDto } from "@/types/api";

type Detail = HumanNodeProfileDto["quickDetails"][number];

type ProofTile = {
  key: string;
  label: ReactNode;
  value: string;
};

type HumanNodeDetailsProofsSectionProps = {
  proofTiles: ProofTile[];
  visibleDetails: Detail[];
};

export function HumanNodeDetailsProofsSection({
  proofTiles,
  visibleDetails,
}: HumanNodeDetailsProofsSectionProps) {
  return (
    <section className="space-y-4">
      <SectionHeader>Details &amp; Proofs</SectionHeader>
      <div className="grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
        {visibleDetails.map((detail) => (
          <StatTile
            key={detail.label}
            label={detail.label}
            value={
              detail.label === "Tier" ? (
                <TierLabel tier={detail.value} />
              ) : (
                normalizeDetailValue(detail.label, detail.value)
              )
            }
            className={DETAIL_TILE_CLASS}
            valueClassName="text-xl"
          />
        ))}
        {proofTiles.map((tile) => (
          <StatTile
            key={tile.key}
            label={tile.label}
            value={tile.value}
            className={PROOF_TILE_CLASS}
            valueClassName="text-xl"
          />
        ))}
      </div>
    </section>
  );
}
