import { useMemo, useState } from "react";

import { AddressInline } from "@/components/AddressInline";
import {
  GlassyCompactGrid,
  GlassyCompactRow,
  GlassyKeyValue,
  GlassySection,
  GlassyStatusChip,
  GlassyTile,
} from "@/components/GlassySection";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { addressesReferToSameIdentity } from "@/lib/addressIdentity";
import { formatChamberLabel } from "@/lib/chamberUi";
import type {
  ChamberDto,
  ChamberGovernorDto,
  GetMyGovernanceResponse,
} from "@/types/api";

type DelegationItem = GetMyGovernanceResponse["delegation"]["chambers"][number];

type MyGovernanceDelegationCardProps = {
  chambers: ChamberDto[];
  delegationChambers: DelegationItem[];
  delegationErrorByChamber: Record<string, string | null>;
  delegationGovernorsByChamber: Record<string, ChamberGovernorDto[]>;
  delegationPendingByChamber: Record<string, boolean>;
  onClearDelegation: (chamberId: string) => void;
  onSetDelegation: (chamberId: string, delegateeAddress: string) => void;
  viewerAddress: string | null;
};

export function MyGovernanceDelegationCard({
  chambers,
  delegationChambers = [],
  delegationErrorByChamber = {},
  delegationGovernorsByChamber = {},
  delegationPendingByChamber = {},
  onClearDelegation,
  onSetDelegation,
  viewerAddress,
}: MyGovernanceDelegationCardProps) {
  const [pickerChamberId, setPickerChamberId] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const pickerItem = useMemo(
    () =>
      delegationChambers.find((item) => item.chamberId === pickerChamberId) ??
      null,
    [delegationChambers, pickerChamberId],
  );
  const pickerGovernors = useMemo(() => {
    if (!pickerItem) return [];
    return (delegationGovernorsByChamber[pickerItem.chamberId] ?? []).filter(
      (governor) =>
        !viewerAddress ||
        !addressesReferToSameIdentity(governor.id, viewerAddress),
    );
  }, [delegationGovernorsByChamber, pickerItem, viewerAddress]);
  const visiblePickerGovernors = useMemo(() => {
    const term = pickerSearch.trim().toLowerCase();
    if (!term) return pickerGovernors;
    return pickerGovernors.filter((governor) =>
      [governor.name, governor.id, governor.tier, governor.focus]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [pickerGovernors, pickerSearch]);

  return (
    <GlassySection title="Delegation">
      {delegationChambers.length ? (
        <GlassyCompactGrid>
          {delegationChambers.map((item) => {
            const pending = delegationPendingByChamber[item.chamberId] ?? false;
            const availableGovernors =
              delegationGovernorsByChamber[item.chamberId] ?? [];
            const selectableGovernors = availableGovernors.filter(
              (governor) =>
                !viewerAddress ||
                !addressesReferToSameIdentity(governor.id, viewerAddress),
            );

            return (
              <GlassyCompactRow
                key={item.chamberId}
                title={formatChamberLabel(item.chamberId, chambers)}
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

                  <div className="grid gap-2">
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
                    <div className="glassy-compact-command-row">
                      <Button
                        type="button"
                        size="compact"
                        variant="ghost"
                        onClick={() => {
                          setPickerSearch("");
                          setPickerChamberId(item.chamberId);
                        }}
                        disabled={pending || selectableGovernors.length === 0}
                      >
                        {item.delegateeAddress ? "Change" : "Choose"}
                      </Button>
                      <div className="glassy-compact-command-row__actions">
                        <Button
                          type="button"
                          size="compact"
                          variant="outline"
                          onClick={() => onClearDelegation(item.chamberId)}
                          disabled={pending || item.delegateeAddress === null}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {delegationErrorByChamber[item.chamberId] ? (
                  <p className="text-sm text-danger">
                    {delegationErrorByChamber[item.chamberId]}
                  </p>
                ) : null}
              </GlassyCompactRow>
            );
          })}
        </GlassyCompactGrid>
      ) : (
        <GlassyTile className="px-4 py-3 text-sm text-muted">
          Delegation becomes available once you are participating in chamber
          governance.
        </GlassyTile>
      )}
      <Modal
        open={pickerItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPickerSearch("");
            setPickerChamberId(null);
          }
        }}
        ariaLabel="Choose delegation governor"
        contentClassName="max-w-2xl"
      >
        <GlassyTile className="glassy-picker-modal">
          <div className="glassy-picker-modal__header">
            <div>
              <p className="glassy-picker-modal__eyebrow">Choose delegate</p>
              <p className="glassy-picker-modal__title">
                {pickerItem
                  ? formatChamberLabel(pickerItem.chamberId, chambers)
                  : "Chamber"}
              </p>
            </div>
            <Button
              type="button"
              size="compact"
              variant="outline"
              onClick={() => {
                setPickerSearch("");
                setPickerChamberId(null);
              }}
            >
              Close
            </Button>
          </div>

          <div className="glassy-picker-search">
            <Input
              className="glassy-picker-search__input"
              value={pickerSearch}
              onChange={(event) => setPickerSearch(event.target.value)}
              placeholder="Search governors by name, address, tier, or focus"
            />
          </div>

          {pickerGovernors.length === 0 ? (
            <div className="glassy-picker-empty">
              No other governors are available in this chamber.
            </div>
          ) : visiblePickerGovernors.length === 0 ? (
            <div className="glassy-picker-empty">
              No governors match this search.
            </div>
          ) : (
            <div className="glassy-picker-list">
              {visiblePickerGovernors.map((governor) => {
                const isCurrent = addressesReferToSameIdentity(
                  governor.id,
                  pickerItem?.delegateeAddress,
                );
                const pending =
                  delegationPendingByChamber[pickerItem?.chamberId ?? ""] ??
                  false;

                return (
                  <div className="glassy-picker-row" key={governor.id}>
                    <div className="glassy-picker-row__main">
                      <div className="glassy-picker-row__nameLine">
                        <p className="glassy-picker-row__name">
                          {governor.name}
                        </p>
                        {isCurrent ? (
                          <GlassyStatusChip tone="primary">
                            Current
                          </GlassyStatusChip>
                        ) : null}
                      </div>
                      <AddressInline
                        address={governor.id}
                        textClassName="text-sm text-muted"
                      />
                      <div className="glassy-picker-row__metrics">
                        <GlassyKeyValue label="Tier" value={governor.tier} />
                        <GlassyKeyValue label="MCM" value={governor.mcm} />
                        <GlassyKeyValue
                          label="Power"
                          value={governor.effectiveVotingPower}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="compact"
                      disabled={pending || isCurrent || !pickerItem}
                      onClick={() => {
                        if (!pickerItem) return;
                        onSetDelegation(pickerItem.chamberId, governor.id);
                        setPickerChamberId(null);
                      }}
                    >
                      Delegate
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </GlassyTile>
      </Modal>
    </GlassySection>
  );
}
