import type { GovernanceActionDto, ProofKeyDto } from "@/types/api";

export const DETAIL_TILE_CLASS = "h-20 flex flex-col justify-between";
export const PROOF_TILE_CLASS = "h-20 flex flex-col justify-between";
export const ACTIVITY_TILE_CLASS = "min-h-[120px]";

export const PROOF_META: Record<
  ProofKeyDto,
  { termId: string; label: string }
> = {
  time: { termId: "proof_of_time_pot", label: "PoT" },
  devotion: { termId: "proof_of_devotion_pod", label: "PoD" },
  governance: { termId: "proof_of_governance_pog", label: "PoG" },
};

export const ACTIVITY_FILTERS = [
  { value: "all", label: "All" },
  { value: "votes", label: "Votes" },
  { value: "proposals", label: "Proposals" },
  { value: "chambers", label: "Chambers" },
  { value: "formation", label: "Formation" },
] as const;

export type ActivityFilter = (typeof ACTIVITY_FILTERS)[number]["value"];

export const activityMatches = (
  action: GovernanceActionDto,
  filter: ActivityFilter,
) => {
  if (filter === "all") return true;
  const text = `${action.title} ${action.context} ${action.action}`.toLowerCase();
  if (filter === "votes") return text.includes("vote");
  if (filter === "proposals") return text.includes("proposal") || text.includes("pool");
  if (filter === "chambers") return text.includes("chamber");
  if (filter === "formation") return text.includes("formation");
  return true;
};

export const formatActivityTimestamp = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

export const shortAddress = (value: string, size = 6) => {
  if (!value) return value;
  if (value.length <= size * 2 + 3) return value;
  return `${value.slice(0, size)}…${value.slice(-size)}`;
};

const DETAIL_LABEL_OMIT = new Set(["address", "wallet", "id"]);

export const shouldShowDetail = (label: string) => {
  const normalized = label.trim().toLowerCase();
  return !DETAIL_LABEL_OMIT.has(normalized);
};
