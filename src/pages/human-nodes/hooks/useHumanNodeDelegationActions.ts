import { useState } from "react";

import { apiDelegationClear, apiDelegationSet } from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";

type UseHumanNodeDelegationActionsInput = {
  profileId: string;
  routeId: string | undefined;
  refreshProfile: () => Promise<void>;
  refreshViewerGovernance: () => Promise<void>;
};

export function useHumanNodeDelegationActions({
  profileId,
  refreshProfile,
  refreshViewerGovernance,
  routeId,
}: UseHumanNodeDelegationActionsInput) {
  const [delegationPendingByChamber, setDelegationPendingByChamber] = useState<
    Record<string, boolean>
  >({});
  const [delegationErrorByChamber, setDelegationErrorByChamber] = useState<
    Record<string, string | null>
  >({});

  const handleDelegateHere = async (chamberId: string) => {
    if (!routeId) return;
    try {
      setDelegationPendingByChamber((current) => ({
        ...current,
        [chamberId]: true,
      }));
      setDelegationErrorByChamber((current) => ({
        ...current,
        [chamberId]: null,
      }));
      await apiDelegationSet({
        chamberId,
        delegateeAddress: profileId,
        idempotencyKey: crypto.randomUUID(),
      });
      await Promise.all([refreshProfile(), refreshViewerGovernance()]);
    } catch (error) {
      setDelegationErrorByChamber((current) => ({
        ...current,
        [chamberId]: formatLoadError((error as Error).message),
      }));
    } finally {
      setDelegationPendingByChamber((current) => ({
        ...current,
        [chamberId]: false,
      }));
    }
  };

  const handleClearDelegation = async (chamberId: string) => {
    if (!routeId) return;
    try {
      setDelegationPendingByChamber((current) => ({
        ...current,
        [chamberId]: true,
      }));
      setDelegationErrorByChamber((current) => ({
        ...current,
        [chamberId]: null,
      }));
      await apiDelegationClear({
        chamberId,
        idempotencyKey: crypto.randomUUID(),
      });
      await Promise.all([refreshProfile(), refreshViewerGovernance()]);
    } catch (error) {
      setDelegationErrorByChamber((current) => ({
        ...current,
        [chamberId]: formatLoadError((error as Error).message),
      }));
    } finally {
      setDelegationPendingByChamber((current) => ({
        ...current,
        [chamberId]: false,
      }));
    }
  };

  return {
    delegationErrorByChamber,
    delegationPendingByChamber,
    handleClearDelegation,
    handleDelegateHere,
  };
}
