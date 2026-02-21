import type { ReactNode } from "react";

import {
  ProposalStageBar,
  type ProposalStage,
} from "@/components/ProposalStageBar";
import { AddressInline } from "@/components/AddressInline";
import { StatTile } from "@/components/StatTile";

type ProposalPageHeaderProps = {
  title: string;
  stage: ProposalStage;
  showFormationStage?: boolean;
  chamber: string;
  proposer: string;
  children?: ReactNode;
};

export function ProposalPageHeader({
  title,
  stage,
  showFormationStage = true,
  chamber,
  proposer,
  children,
}: ProposalPageHeaderProps) {
  return (
    <section className="space-y-4">
      <h1 className="text-center text-2xl font-semibold text-text">{title}</h1>
      <ProposalStageBar current={stage} showFormationStage={showFormationStage} />
      <div className="grid gap-3 sm:grid-cols-2">
        <StatTile
          label="Chamber"
          value={chamber}
          radius="2xl"
          className="px-4 py-4"
          labelClassName="text-[0.8rem]"
          valueClassName="text-2xl"
        />
        <StatTile
          label="Proposer"
          value={
            <AddressInline
              address={proposer}
              className="justify-center"
              textClassName="text-base sm:text-lg"
            />
          }
          radius="2xl"
          className="px-4 py-4"
          labelClassName="text-[0.8rem]"
          valueClassName="text-lg"
        />
      </div>
      {children}
    </section>
  );
}
