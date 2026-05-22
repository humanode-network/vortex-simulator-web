import { AddressInline } from "@/components/AddressInline";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Kicker } from "@/components/Kicker";
import { Surface } from "@/components/Surface";
import { formatChamberLabel } from "@/lib/chamberUi";
import type { ChamberDto, GetMyGovernanceResponse } from "@/types/api";

type DelegationItem =
  GetMyGovernanceResponse["delegation"]["chambers"][number];

type MyGovernanceDelegationCardProps = {
  chambers: ChamberDto[];
  delegationChambers: DelegationItem[];
  delegationDrafts: Record<string, string>;
  delegationErrorByChamber: Record<string, string | null>;
  delegationPendingByChamber: Record<string, boolean>;
  onClearDelegation: (chamberId: string) => void;
  onSetDelegation: (chamberId: string) => void;
  onUpdateDelegationDraft: (chamberId: string, value: string) => void;
};

export function MyGovernanceDelegationCard({
  chambers,
  delegationChambers,
  delegationDrafts,
  delegationErrorByChamber,
  delegationPendingByChamber,
  onClearDelegation,
  onSetDelegation,
  onUpdateDelegationDraft,
}: MyGovernanceDelegationCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Delegation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {delegationChambers.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {delegationChambers.map((item) => {
              const pending =
                delegationPendingByChamber[item.chamberId] ?? false;
              const currentValue =
                delegationDrafts[item.chamberId] ??
                item.delegateeAddress ??
                "";

              return (
                <Surface
                  key={item.chamberId}
                  variant="panelAlt"
                  radius="2xl"
                  shadow="tile"
                  className="space-y-3 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Kicker>{formatChamberLabel(item.chamberId, chambers)}</Kicker>
                      <p className="mt-1 text-sm font-semibold text-text">
                        Current delegate
                      </p>
                      {item.delegateeAddress ? (
                        <AddressInline
                          address={item.delegateeAddress}
                          textClassName="text-sm text-muted"
                        />
                      ) : (
                        <p className="text-sm text-muted">No delegate set</p>
                      )}
                    </div>
                    <Badge variant="outline">
                      Inbound weight {item.inboundWeight}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Input
                      value={currentValue}
                      onChange={(event) =>
                        onUpdateDelegationDraft(
                          item.chamberId,
                          event.target.value,
                        )
                      }
                      placeholder="Delegate address"
                      disabled={pending}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => onSetDelegation(item.chamberId)}
                        disabled={pending || currentValue.trim().length === 0}
                      >
                        {item.delegateeAddress
                          ? "Update delegate"
                          : "Set delegate"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onClearDelegation(item.chamberId)}
                        disabled={pending || item.delegateeAddress === null}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  {delegationErrorByChamber[item.chamberId] ? (
                    <p className="text-sm text-danger">
                      {delegationErrorByChamber[item.chamberId]}
                    </p>
                  ) : null}
                </Surface>
              );
            })}
          </div>
        ) : (
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="px-4 py-3 text-sm text-muted"
          >
            Delegation becomes available once you are participating in chamber
            governance.
          </Surface>
        )}
      </CardContent>
    </Card>
  );
}
