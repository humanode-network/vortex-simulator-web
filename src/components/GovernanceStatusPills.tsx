import { governanceIdentityStatuses } from "@/lib/humanNodesUi";
import { getActiveGovernorReasonCopy } from "@/lib/governorOpportunityUi";
import type { ActiveGovernorReasonDto } from "@/types/api";
import { StatusPill } from "./StatusPill";

type GovernanceStatusPillsProps = {
  governor: boolean;
  activeGovernor: boolean;
  activeGovernorReason?: ActiveGovernorReasonDto;
  humanNode: boolean;
};

export function GovernanceStatusPills(props: GovernanceStatusPillsProps) {
  const statuses = governanceIdentityStatuses(props);
  const activeGovernorHint = props.activeGovernorReason
    ? getActiveGovernorReasonCopy(props.activeGovernorReason).detail
    : undefined;
  return (
    <div className="flex flex-col items-center gap-2 text-sm lg:items-end">
      {Object.values(statuses).map((status) => (
        <StatusPill
          key={status.label}
          {...status}
          hint={
            status.label === "Active governor" && activeGovernorHint
              ? {
                  description: activeGovernorHint,
                  href: "/app/vortexopedia?term=governing_threshold",
                  title: "Active Governor assessment",
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}
