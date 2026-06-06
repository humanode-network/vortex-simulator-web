import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/auth/AuthContext";
import { GlassyTile } from "@/components/GlassySection";
import { PageHint } from "@/components/PageHint";
import {
  apiDelegationClear,
  apiDelegationSet,
  apiLegitimacyObjectSet,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import {
  formatDayHourMinute,
  governingStatusForProgress,
  governingStatusTermId,
  type GoverningStatus,
} from "@/lib/myGovernanceUi";
import { toTimestampMs } from "@/lib/dateTime";
import { cn } from "@/lib/utils";
import { MyGovernanceChambersCard } from "./my-governance/components/MyGovernanceChambersCard";
import { MyGovernanceCmEconomyCard } from "./my-governance/components/MyGovernanceCmEconomyCard";
import { MyGovernanceDelegationCard } from "./my-governance/components/MyGovernanceDelegationCard";
import { MyGovernanceLegitimacyCard } from "./my-governance/components/MyGovernanceLegitimacyCard";
import { MyGovernanceProgressionCard } from "./my-governance/components/MyGovernanceProgressionCard";
import { MyGovernanceThresholdCard } from "./my-governance/components/MyGovernanceThresholdCard";
import { useMyGovernancePageData } from "./my-governance/hooks/useMyGovernancePageData";

const MyGovernance: React.FC = () => {
  const [legitimacyPending, setLegitimacyPending] = useState(false);
  const [legitimacyError, setLegitimacyError] = useState<string | null>(null);
  const [delegationPendingByChamber, setDelegationPendingByChamber] = useState<
    Record<string, boolean>
  >({});
  const [delegationErrorByChamber, setDelegationErrorByChamber] = useState<
    Record<string, string | null>
  >({});
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const auth = useAuth();
  const {
    chambers,
    clock,
    cmSummary,
    delegationGovernorsByChamber,
    gov,
    loadError,
    refreshGovernance,
  } = useMyGovernancePageData();

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const eraActivity = gov?.eraActivity;
  const timeLeftValue = useMemo(() => {
    const targetMs = clock?.nextEraAt
      ? toTimestampMs(clock.nextEraAt, NaN)
      : NaN;
    if (Number.isFinite(targetMs)) {
      return formatDayHourMinute(targetMs, nowMs);
    }
    return eraActivity?.timeLeft ?? "—";
  }, [clock?.nextEraAt, eraActivity?.timeLeft, nowMs]);

  const myChambers = useMemo(() => {
    if (!gov || !chambers) return [];
    return chambers.filter((chamber) => gov.myChamberIds.includes(chamber.id));
  }, [gov, chambers]);

  if (gov === null || chambers === null) {
    return (
      <div className="flex flex-col gap-6">
        <PageHint pageId="my-governance" />
        <GlassyTile
          className={cn(
            "px-5 py-4 text-sm text-muted",
            loadError ? "text-destructive" : undefined,
          )}
        >
          {loadError
            ? `My governance unavailable: ${formatLoadError(loadError)}`
            : "Loading…"}
        </GlassyTile>
      </div>
    );
  }

  const status: { label: GoverningStatus; termId: string } = gov?.rollup
    ? {
        label: gov.rollup.status,
        termId: governingStatusTermId(gov.rollup.status),
      }
    : governingStatusForProgress(
        eraActivity?.completed ?? 0,
        eraActivity?.required ?? 0,
      );

  const legitimacy = gov?.legitimacy ?? {
    percent: 100,
    objecting: false,
    objectingHumanNodes: 0,
    eligibleHumanNodes: 0,
    referendumTriggered: false,
    triggerThresholdPercent: 33.3,
  };

  const handleDelegationSet = async (
    chamberId: string,
    delegateeAddress: string,
  ) => {
    if (!delegateeAddress) {
      setDelegationErrorByChamber((current) => ({
        ...current,
        [chamberId]: "Choose a governor to delegate to.",
      }));
      return;
    }
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
        delegateeAddress,
        idempotencyKey: crypto.randomUUID(),
      });
      await refreshGovernance();
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

  const handleDelegationClear = async (chamberId: string) => {
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
      await refreshGovernance();
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

  const handleLegitimacyToggle = async () => {
    try {
      setLegitimacyPending(true);
      setLegitimacyError(null);
      await apiLegitimacyObjectSet({
        active: !legitimacy.objecting,
        idempotencyKey: crypto.randomUUID(),
      });
      await refreshGovernance();
    } catch (error) {
      setLegitimacyError(formatLoadError((error as Error).message));
    } finally {
      setLegitimacyPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="my-governance" />
      <MyGovernanceThresholdCard
        eraActivity={eraActivity}
        status={status}
        timeLeftValue={timeLeftValue}
      />

      <MyGovernanceProgressionCard tierProgress={gov.tier} />

      <MyGovernanceChambersCard myChambers={myChambers} />

      <div className="grid items-start gap-4 xl:grid-cols-3">
        <MyGovernanceCmEconomyCard cmSummary={cmSummary} />

        <MyGovernanceDelegationCard
          chambers={chambers}
          delegationChambers={gov.delegation.chambers}
          delegationErrorByChamber={delegationErrorByChamber}
          delegationGovernorsByChamber={delegationGovernorsByChamber}
          delegationPendingByChamber={delegationPendingByChamber}
          onClearDelegation={(chamberId) =>
            void handleDelegationClear(chamberId)
          }
          onSetDelegation={(chamberId, delegateeAddress) =>
            void handleDelegationSet(chamberId, delegateeAddress)
          }
          viewerAddress={auth.address}
        />

        <MyGovernanceLegitimacyCard
          legitimacy={legitimacy}
          legitimacyError={legitimacyError}
          legitimacyPending={legitimacyPending}
          onToggleLegitimacy={handleLegitimacyToggle}
        />
      </div>
    </div>
  );
};

export default MyGovernance;
