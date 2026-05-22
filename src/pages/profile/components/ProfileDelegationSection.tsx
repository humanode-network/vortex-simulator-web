import { AddressInline } from "@/components/AddressInline";
import { SectionHeader } from "@/components/SectionHeader";
import { Badge } from "@/components/primitives/badge";
import { Kicker } from "@/components/Kicker";
import { Surface } from "@/components/Surface";
import { formatChamberLabel } from "@/lib/chamberUi";
import { shortAddress } from "@/lib/profileUi";
import type { HumanNodeProfileDto } from "@/types/api";

type DelegationChamber = HumanNodeProfileDto["delegation"]["chambers"][number];

type ProfileDelegationSectionProps = {
  delegationChambers: DelegationChamber[];
};

export function ProfileDelegationSection({
  delegationChambers,
}: ProfileDelegationSectionProps) {
  if (delegationChambers.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <SectionHeader>Delegation</SectionHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {delegationChambers.map((item) => (
          <Surface
            key={item.chamberId}
            variant="panelAlt"
            radius="xl"
            shadow="tile"
            className="space-y-3 px-4 py-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Kicker>{formatChamberLabel(item.chamberId)}</Kicker>
              <Badge variant="outline">Inbound {item.inboundWeight}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                Current delegate
              </p>
              {item.delegateeAddress ? (
                <AddressInline
                  address={item.delegateeAddress}
                  textClassName="text-sm text-text"
                />
              ) : (
                <p className="text-sm text-text">No delegate set</p>
              )}
            </div>
            {item.inboundDelegators.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                  Delegated by
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.inboundDelegators.map((delegator) => (
                    <Badge key={delegator} variant="muted">
                      {shortAddress(delegator)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </Surface>
        ))}
      </div>
    </section>
  );
}
