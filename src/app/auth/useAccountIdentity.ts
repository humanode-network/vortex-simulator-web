import { apiHuman } from "@/lib/apiClient";
import { usePolledResource } from "@/hooks/usePolledResource";
import type { GovernanceIdentityState } from "@/lib/humanNodesUi";

async function load(address: string): Promise<GovernanceIdentityState> {
  const profile = await apiHuman(address);
  if (
    typeof profile.governor !== "boolean" ||
    typeof profile.governorActive !== "boolean" ||
    typeof profile.humanNodeActive !== "boolean"
  ) {
    throw new Error("Incomplete governance status");
  }
  return {
    governor: profile.governor,
    activeGovernor: profile.governorActive,
    humanNode: profile.humanNodeActive,
  };
}

export function useAccountIdentity(address: string | null) {
  return usePolledResource({ resourceKey: address, load });
}
