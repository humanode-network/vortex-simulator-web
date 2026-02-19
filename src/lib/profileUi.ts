import type { GovernanceActionDto, ProofKeyDto } from "@/types/api";
import { formatDate, formatDateTime } from "@/lib/dateTime";

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
  const text =
    `${action.title} ${action.context} ${action.action}`.toLowerCase();
  if (filter === "votes") return text.includes("vote");
  if (filter === "proposals")
    return text.includes("proposal") || text.includes("pool");
  if (filter === "chambers") return text.includes("chamber");
  if (filter === "formation") return text.includes("formation");
  return true;
};

export const formatActivityTimestamp = (value: string) => {
  return formatDateTime(value);
};

const DATE_LABEL_HINTS = [
  "since",
  "date",
  "created",
  "updated",
  "opened",
  "submitted",
  "at",
];

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export const normalizeDetailValue = (label: string, value: string) => {
  if (!value) return value;
  const normalizedLabel = label.trim().toLowerCase();
  const likelyDate = DATE_LABEL_HINTS.some((hint) =>
    normalizedLabel.includes(hint),
  );
  if (!likelyDate) return value;
  if (DATE_ONLY_RE.test(value.trim())) return formatDate(value);
  return formatDateTime(value);
};

export const shortAddress = (value: string, size = 4) => {
  if (!value) return value;
  if (value.length <= size * 2 + 3) return value;
  return `${value.slice(0, size)}…${value.slice(-size)}`;
};

const DETAIL_LABEL_OMIT = new Set(["address", "wallet", "id"]);

export const shouldShowDetail = (label: string) => {
  const normalized = label.trim().toLowerCase();
  return !DETAIL_LABEL_OMIT.has(normalized);
};
