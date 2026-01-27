import type { TierProgressDto } from "@/types/api";

export type TierRequirementItem = {
  key: keyof TierProgressDto["metrics"];
  label: string;
  done: number;
  required: number;
  percent: number;
};

const requirementLabel: Record<keyof TierProgressDto["metrics"], string> = {
  governorEras: "Governor eras",
  activeEras: "Active-governor eras",
  acceptedProposals: "Accepted proposals",
  formationParticipation: "Formation participation",
};

export function buildTierRequirementItems(
  tierProgress?: TierProgressDto | null,
): TierRequirementItem[] {
  if (!tierProgress?.requirements) return [];
  const metrics = tierProgress.metrics ?? {
    governorEras: 0,
    activeEras: 0,
    acceptedProposals: 0,
    formationParticipation: 0,
  };
  const keys = Object.keys(tierProgress.requirements) as Array<
    keyof TierProgressDto["metrics"]
  >;
  return keys.map((key) => {
    const required = Number(tierProgress.requirements?.[key] ?? 0);
    const done = Number(metrics[key] ?? 0);
    const percent =
      required > 0 ? Math.min(100, Math.round((done / required) * 100)) : 100;
    return { key, label: requirementLabel[key], done, required, percent };
  });
}
