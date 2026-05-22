export function calculateCitizenVetoSupportPercent(input: {
  vetoVotes: number;
  eligibleCitizens: number;
}): number {
  const eligibleCitizens = Math.max(0, input.eligibleCitizens);
  if (eligibleCitizens === 0) return 0;
  const vetoVotes = Math.max(0, input.vetoVotes);
  return Math.round((vetoVotes / eligibleCitizens) * 100);
}

type VetoActionGateInput = {
  alreadyRecorded: boolean;
  alreadyRecordedReason: string;
  ineligibleReason: string;
  submitting: boolean;
  viewerEligible: boolean;
  viewerIsProposer: boolean;
  windowOpen: boolean;
};

export function getVetoActionGate({
  alreadyRecorded,
  alreadyRecordedReason,
  ineligibleReason,
  submitting,
  viewerEligible,
  viewerIsProposer,
  windowOpen,
}: VetoActionGateInput): {
  disabled: boolean;
  title: string | undefined;
} {
  return {
    disabled:
      submitting ||
      !windowOpen ||
      alreadyRecorded ||
      !viewerEligible ||
      viewerIsProposer,
    title: viewerIsProposer
      ? "You cannot vote on your own proposal."
      : alreadyRecorded
        ? alreadyRecordedReason
        : !windowOpen
          ? "Veto window ended."
          : !viewerEligible
            ? ineligibleReason
            : undefined,
  };
}
