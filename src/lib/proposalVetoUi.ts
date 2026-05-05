export function calculateCitizenVetoSupportPercent(input: {
  vetoVotes: number;
  eligibleCitizens: number;
}): number {
  const eligibleCitizens = Math.max(0, input.eligibleCitizens);
  if (eligibleCitizens === 0) return 0;
  const vetoVotes = Math.max(0, input.vetoVotes);
  return Math.round((vetoVotes / eligibleCitizens) * 100);
}
