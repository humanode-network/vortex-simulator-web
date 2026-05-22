import { AddressInline } from "@/components/AddressInline";
import { SectionHeader } from "@/components/SectionHeader";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Kicker } from "@/components/Kicker";
import { Surface } from "@/components/Surface";
import { addressesReferToSameIdentity } from "@/lib/addressIdentity";
import { formatChamberLabel } from "@/lib/chamberUi";
import { shortAddress } from "@/lib/profileUi";
import type { GetMyGovernanceResponse, HumanNodeProfileDto } from "@/types/api";

type DelegationCard = HumanNodeProfileDto["delegation"]["chambers"][number];
type ViewerDelegation =
  GetMyGovernanceResponse["delegation"]["chambers"][number];

type HumanNodeDelegationSectionProps = {
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
  if (delegationCards.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <SectionHeader>Delegation</SectionHeader>
      <div className="grid gap-4 md:grid-cols-2">
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

          return (
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
              {canManage ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={pending || viewerAlreadyDelegatesHere}
                      onClick={() => onDelegateHere(item.chamberId)}
                    >
                      {viewerAlreadyDelegatesHere
                        ? "Delegated here"
                        : "Delegate here"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending || !viewerAlreadyDelegatesHere}
                      onClick={() => onClearDelegation(item.chamberId)}
                    >
                      Undelegate
                    </Button>
                  </div>
                  {viewerItem?.delegateeAddress &&
                  !viewerAlreadyDelegatesHere ? (
                    <p className="text-xs text-muted">
                      You currently delegate this chamber to{" "}
                      <span className="font-semibold text-text">
                        {shortAddress(viewerItem.delegateeAddress)}
                      </span>
                      .
                    </p>
                  ) : null}
                  {delegationErrorByChamber[item.chamberId] ? (
                    <p className="text-sm text-danger">
                      {delegationErrorByChamber[item.chamberId]}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </Surface>
          );
        })}
      </div>
    </section>
  );
}
