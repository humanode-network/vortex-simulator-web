import type { GetMyGovernanceResponse } from "@/types/api";

export type GoverningStatus =
  | "Ahead"
  | "Stable"
  | "Falling behind"
  | "At risk"
  | "Losing status";

export type TierProgress = NonNullable<GetMyGovernanceResponse["tier"]>;

export type TierKey =
  | "Nominee"
  | "Ecclesiast"
  | "Legate"
  | "Consul"
  | "Citizen";

export const proposalRightsByTier: Record<TierKey, string[]> = {
  Nominee: ["Basic proposals"],
  Ecclesiast: ["Basic proposals", "Fee distribution", "Monetary system"],
  Legate: [
    "Basic proposals",
    "Fee distribution",
    "Monetary system",
    "Core infrastructure",
  ],
  Consul: [
    "Basic proposals",
    "Fee distribution",
    "Monetary system",
    "Core infrastructure",
    "Administrative",
  ],
  Citizen: [
    "Basic proposals",
    "Fee distribution",
    "Monetary system",
    "Core infrastructure",
    "Administrative",
    "DAO core",
  ],
};

export const labelForTier = (tier: TierKey): string => {
  return tier;
};

export const requirementLabel: Record<
  | "governorEras"
  | "activeEras"
  | "acceptedProposals"
  | "formationParticipation",
  string
> = {
  governorEras: "Run a node as a governor (eras)",
  activeEras: "Active-governor eras",
  acceptedProposals: "Accepted proposals",
  formationParticipation: "Formation participation",
};

export const getRequirementProgress = (
  key: keyof typeof requirementLabel,
  metrics: TierProgress["metrics"],
  requirements: TierProgress["requirements"],
): { done: number; required: number; percent: number } => {
  const required = Number(requirements?.[key] ?? 0);
  const done = Number(metrics[key] ?? 0);
  if (required <= 0) return { done, required, percent: 100 };
  return {
    done,
    required,
    percent: Math.min(100, Math.round((done / required) * 100)),
  };
};

export const governingStatusForProgress = (
  completed: number,
  required: number,
): { label: GoverningStatus; termId: string } => {
  if (required <= 0) {
    return { label: "Stable", termId: "governing_status_stable" };
  }

  if (completed >= required + 1) {
    return { label: "Ahead", termId: "governing_status_ahead" };
  }

  if (completed >= required) {
    return { label: "Stable", termId: "governing_status_stable" };
  }

  const ratio = completed / required;
  if (ratio >= 0.75) {
    return {
      label: "Falling behind",
      termId: "governing_status_falling_behind",
    };
  }
  if (ratio >= 0.55) {
    return { label: "At risk", termId: "governing_status_at_risk" };
  }
  return {
    label: "Losing status",
    termId: "governing_status_losing_status",
  };
};

export const governingStatusTermId = (label: GoverningStatus): string => {
  if (label === "Ahead") return "governing_status_ahead";
  if (label === "Stable") return "governing_status_stable";
  if (label === "Falling behind") return "governing_status_falling_behind";
  if (label === "At risk") return "governing_status_at_risk";
  return "governing_status_losing_status";
};

export const formatDayHourMinute = (
  targetMs: number,
  nowMs: number,
): string => {
  const deltaMs = Math.max(0, targetMs - nowMs);
  const totalMinutes = Math.floor(deltaMs / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  return `${days}d:${String(hours).padStart(2, "0")}h:${String(minutes).padStart(2, "0")}m`;
};
