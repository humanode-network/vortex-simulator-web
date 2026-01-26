export const proposalTypeLabel: Record<string, string> = {
  basic: "Basic",
  fee: "Fee distribution",
  monetary: "Monetary system",
  core: "Core infrastructure",
  administrative: "Administrative",
  "dao-core": "DAO core",
};

export function formatProposalType(value: string): string {
  return proposalTypeLabel[value] ?? value.replace(/-/g, " ");
}
