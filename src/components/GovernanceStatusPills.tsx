import { governanceIdentityStatuses } from "@/lib/humanNodesUi";
import { StatusPill } from "./StatusPill";

type GovernanceStatusPillsProps = {
  governor: boolean;
  activeGovernor: boolean;
  humanNode: boolean;
};

export function GovernanceStatusPills(props: GovernanceStatusPillsProps) {
  const statuses = governanceIdentityStatuses(props);
  return (
    <div className="flex flex-col items-center gap-2 text-sm lg:items-end">
      {Object.values(statuses).map((status) => (
        <StatusPill key={status.label} {...status} />
      ))}
    </div>
  );
}
