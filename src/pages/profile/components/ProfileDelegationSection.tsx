import { AddressInline } from "@/components/AddressInline";
import {
  GlassyCompactGrid,
  GlassyCompactRow,
  GlassyKeyValue,
  GlassySection,
  GlassyStatusChip,
  GlassyTile,
} from "@/components/GlassySection";
import { formatChamberLabel } from "@/lib/chamberUi";
import { shortAddress } from "@/lib/profileUi";
import type { HumanNodeProfileDto } from "@/types/api";

type DelegationChamber = HumanNodeProfileDto["delegation"]["chambers"][number];

type ProfileDelegationSectionProps = {
  className?: string;
  delegationChambers: DelegationChamber[];
};

export function ProfileDelegationSection({
  className,
  delegationChambers,
}: ProfileDelegationSectionProps) {
  return (
    <GlassySection className={className} title="Delegation">
      {delegationChambers.length === 0 ? (
        <GlassyTile className="px-4 py-3 text-sm text-muted">
          No delegation records yet.
        </GlassyTile>
      ) : (
        <GlassyCompactGrid className="h-full content-start">
          {delegationChambers.map((item) => (
            <GlassyCompactRow
              key={item.chamberId}
              title={formatChamberLabel(item.chamberId)}
            >
              <div className="grid gap-2.5">
                <div className="glassy-compact-address">
                  {item.delegateeAddress ? (
                    <AddressInline
                      address={item.delegateeAddress}
                      textClassName="text-sm text-muted"
                    />
                  ) : (
                    <p className="text-sm text-muted">No delegate set</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <GlassyKeyValue
                    className="glassy-key-value--stacked glassy-key-value--metric"
                    label="Inbound"
                    value={item.inboundWeight}
                  />
                  <GlassyKeyValue
                    className="glassy-key-value--stacked glassy-key-value--metric"
                    label="State"
                    value={item.delegateeAddress ? "Delegating" : "Open"}
                  />
                </div>
                {item.inboundDelegators.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {item.inboundDelegators.map((delegator) => (
                      <GlassyStatusChip key={delegator}>
                        {shortAddress(delegator)}
                      </GlassyStatusChip>
                    ))}
                  </div>
                ) : null}
              </div>
            </GlassyCompactRow>
          ))}
        </GlassyCompactGrid>
      )}
    </GlassySection>
  );
}
