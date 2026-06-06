import { AddressInline } from "@/components/AddressInline";
import {
  GlassyCompactGrid,
  GlassyCompactRow,
  GlassyKeyValue,
  GlassySection,
  GlassyStatusChip,
  GlassyTile,
} from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import { addressesReferToSameIdentity } from "@/lib/addressIdentity";
import { formatChamberLabel } from "@/lib/chamberUi";
import { shortAddress } from "@/lib/profileUi";
import type { GetMyGovernanceResponse, HumanNodeProfileDto } from "@/types/api";

type DelegationCard = HumanNodeProfileDto["delegation"]["chambers"][number];
type ViewerDelegation =
  GetMyGovernanceResponse["delegation"]["chambers"][number];

type HumanNodeDelegationSectionProps = {
  className?: string;
  delegationCards: DelegationCard[];
  delegationErrorByChamber: Record<string, string | null>;
  delegationPendingByChamber: Record<string, boolean>;
  isSelfProfile: boolean;
  manageableChambers: ViewerDelegation[];
  onClearDelegation: (chamberId: string) => void;
  onDelegateHere: (chamberId: string) => void;
  profileId: string;
  viewerDelegationByChamber: Map<string, ViewerDelegation>;
};

export function HumanNodeDelegationSection({
  className,
  delegationCards,
  delegationErrorByChamber,
  delegationPendingByChamber,
  isSelfProfile,
  manageableChambers,
  onClearDelegation,
  onDelegateHere,
  profileId,
  viewerDelegationByChamber,
}: HumanNodeDelegationSectionProps) {
  return (
    <GlassySection className={className} title="Delegation">
      {delegationCards.length === 0 ? (
        <GlassyTile className="px-4 py-3 text-sm text-muted">
          No delegation records yet.
        </GlassyTile>
      ) : (
        <GlassyCompactGrid className="h-full content-start">
          {delegationCards.map((item) => {
            const viewerItem =
              viewerDelegationByChamber.get(item.chamberId) ?? null;
            const viewerAlreadyDelegatesHere = addressesReferToSameIdentity(
              viewerItem?.delegateeAddress,
              profileId,
            );
            const canManage =
              !isSelfProfile &&
              manageableChambers.some(
                (chamber) => chamber.chamberId === item.chamberId,
              );
            const pending = delegationPendingByChamber[item.chamberId] ?? false;
            const error = delegationErrorByChamber[item.chamberId];

            return (
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

                  {canManage ? (
                    <div className="grid gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          size="compact"
                          disabled={pending || viewerAlreadyDelegatesHere}
                          onClick={() => onDelegateHere(item.chamberId)}
                        >
                          {viewerAlreadyDelegatesHere
                            ? "Delegated"
                            : "Delegate"}
                        </Button>
                        <Button
                          type="button"
                          size="compact"
                          variant="outline"
                          disabled={pending || !viewerAlreadyDelegatesHere}
                          onClick={() => onClearDelegation(item.chamberId)}
                        >
                          Clear
                        </Button>
                      </div>
                      {viewerItem?.delegateeAddress &&
                      !viewerAlreadyDelegatesHere ? (
                        <p className="m-0 text-xs text-muted">
                          You delegate this chamber to{" "}
                          <span className="font-semibold text-text">
                            {shortAddress(viewerItem.delegateeAddress)}
                          </span>
                          .
                        </p>
                      ) : null}
                      {error ? (
                        <p className="m-0 text-sm text-danger">{error}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </GlassyCompactRow>
            );
          })}
        </GlassyCompactGrid>
      )}
    </GlassySection>
  );
}
