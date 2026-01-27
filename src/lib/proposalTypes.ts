export const proposalTypeLabel: Record<string, string> = {
  basic: "Basic",
  fee: "Fee distribution",
  monetary: "Monetary system",
  core: "Core infrastructure",
  administrative: "Administrative",
  "dao-core": "DAO core",
};

const proposalTypeRequiredTier: Record<string, string> = {
  basic: "Nominee",
  fee: "Ecclesiast",
  monetary: "Ecclesiast",
  core: "Legate",
  administrative: "Consul",
  "dao-core": "Citizen",
};

const tierOrder = ["Nominee", "Ecclesiast", "Legate", "Consul", "Citizen"];

export function formatProposalType(value: string): string {
  return proposalTypeLabel[value] ?? value.replace(/-/g, " ");
}

export function requiredTierForProposalType(value: string): string {
  return proposalTypeRequiredTier[value] ?? "Nominee";
}

export function isTierEligible(
  currentTier: string,
  requiredTier: string,
): boolean {
  const normalizedCurrent = currentTier.trim();
  const normalizedRequired = requiredTier.trim();
  const currentIdx = tierOrder.indexOf(normalizedCurrent);
  const requiredIdx = tierOrder.indexOf(normalizedRequired);
  if (currentIdx < 0 || requiredIdx < 0) return false;
  return currentIdx >= requiredIdx;
}
