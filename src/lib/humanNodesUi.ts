import type {
  ChamberDto,
  FactionDto,
  GetMyGovernanceResponse,
  HumanNodeDto,
  HumanNodeProfileDto,
} from "@/types/api";
import { shortAddress } from "./profileUi";

export type HumanNodesSortBy = "acm-desc" | "acm-asc" | "tier" | "name";
export type HumanNodesTierFilter =
  | "all"
  | "nominee"
  | "ecclesiast"
  | "legate"
  | "consul"
  | "citizen";
export type HumanNodesStatusFilter =
  | "all"
  | "governor"
  | "human"
  | "inactive";
export type HumanNodesCmRange = "all" | "0-50" | "50-200" | "200+";

export type HumanNodesFilters = {
  cmRange: HumanNodesCmRange;
  sortBy: HumanNodesSortBy;
  statusFilter: HumanNodesStatusFilter;
  tierFilter: HumanNodesTierFilter;
};

export const DEFAULT_HUMAN_NODES_FILTERS: HumanNodesFilters = {
  sortBy: "acm-desc",
  tierFilter: "all",
  statusFilter: "all",
  cmRange: "all",
};

const tierOrder = ["nominee", "ecclesiast", "legate", "consul", "citizen"];

export function isLikelyHumanodeAddress(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized.startsWith("hm")) return false;
  if (normalized.length < 24) return false;
  return /^[a-z0-9]+$/.test(normalized);
}

export function filterHumanNodes(input: {
  chambersById: Record<string, ChamberDto>;
  factionsById: Record<string, FactionDto>;
  filters: HumanNodesFilters;
  nodes: HumanNodeDto[] | null;
  search: string;
}): HumanNodeDto[] {
  const { chambersById, factionsById, filters, nodes, search } = input;
  const term = search.toLowerCase();
  const { cmRange, sortBy, statusFilter, tierFilter } = filters;

  return [...(nodes ?? [])]
    .filter((node) => {
      const factionName =
        factionsById[node.factionId]?.name?.toLowerCase() ?? "";
      const chamberName =
        chambersById[node.chamber]?.name?.toLowerCase() ?? "";
      const matchesTerm =
        node.name.toLowerCase().includes(term) ||
        node.role.toLowerCase().includes(term) ||
        node.tags.some((t) => t.toLowerCase().includes(term)) ||
        node.chamber.toLowerCase().includes(term) ||
        chamberName.includes(term) ||
        factionName.includes(term);
      const matchesTier =
        tierFilter === "all" ? true : node.tier === tierFilter;
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "governor"
            ? node.active.governorActive
            : statusFilter === "human"
              ? node.active.humanNodeActive
              : !node.active.governorActive && !node.active.humanNodeActive;
      const acmValue = node.cmTotals?.acm ?? node.acm ?? 0;
      const matchesRange =
        cmRange === "all"
          ? true
          : cmRange === "0-50"
            ? acmValue <= 50
            : cmRange === "50-200"
              ? acmValue > 50 && acmValue <= 200
              : acmValue > 200;
      return matchesTerm && matchesTier && matchesStatus && matchesRange;
    })
    .sort((a, b) => {
      const acmA = a.cmTotals?.acm ?? a.acm;
      const acmB = b.cmTotals?.acm ?? b.acm;
      if (sortBy === "acm-desc") return acmB - acmA;
      if (sortBy === "acm-asc") return acmA - acmB;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
    });
}

export function getHumanNodeHeaderTitle(profile: HumanNodeProfileDto): string {
  const normalizedName = profile.name.trim().toLowerCase();
  const isGenericName = [
    "human node profile",
    "human node",
    "profile",
  ].includes(normalizedName);
  const isAddressName = normalizedName === profile.id.toLowerCase();
  return isAddressName || isGenericName
    ? shortAddress(profile.id)
    : profile.name;
}

export function shouldShowHumanNodeShortBadge(
  profile: HumanNodeProfileDto,
): boolean {
  const normalizedName = profile.name.trim().toLowerCase();
  const isGenericName = [
    "human node profile",
    "human node",
    "profile",
  ].includes(normalizedName);
  const isAddressName = normalizedName === profile.id.toLowerCase();
  return !isAddressName && !isGenericName;
}

export function getHumanNodeVisibleHeroStats(
  heroStats: HumanNodeProfileDto["heroStats"],
): HumanNodeProfileDto["heroStats"] {
  return heroStats.filter((stat) => {
    const label = stat.label.trim().toUpperCase();
    return !["ACM", "LCM", "MCM", "MM"].includes(label);
  });
}

export function getHumanNodeCmTotals(heroStats: HumanNodeProfileDto["heroStats"]) {
  return heroStats.reduce(
    (acc, stat) => {
      const label = stat.label.trim().toUpperCase();
      const numeric = Number(stat.value.replace(/[^0-9.-]/g, "")) || 0;
      if (label === "LCM") acc.lcm = numeric;
      if (label === "MCM") acc.mcm = numeric;
      if (label === "ACM") acc.acm = numeric;
      return acc;
    },
    { lcm: 0, mcm: 0, acm: 0 },
  );
}

export function getHumanNodeDelegationCards(
  delegationChambers: HumanNodeProfileDto["delegation"]["chambers"],
  eligibleChamberIds: string[],
): HumanNodeProfileDto["delegation"]["chambers"] {
  const byChamber = new Map<
    string,
    HumanNodeProfileDto["delegation"]["chambers"][number]
  >();
  for (const item of delegationChambers) {
    byChamber.set(item.chamberId, item);
  }
  for (const chamberId of eligibleChamberIds) {
    if (!byChamber.has(chamberId)) {
      byChamber.set(chamberId, {
        chamberId,
        delegateeAddress: null,
        inboundWeight: 0,
        inboundDelegators: [],
      });
    }
  }
  return [...byChamber.values()].sort((a, b) =>
    a.chamberId.localeCompare(b.chamberId),
  );
}

export function getHumanNodeViewerDelegationByChamber(
  viewerGovernance: GetMyGovernanceResponse | null,
): Map<string, GetMyGovernanceResponse["delegation"]["chambers"][number]> {
  const out = new Map<
    string,
    GetMyGovernanceResponse["delegation"]["chambers"][number]
  >();
  for (const item of viewerGovernance?.delegation.chambers ?? []) {
    out.set(item.chamberId, item);
  }
  return out;
}

export function getHumanNodeManageableDelegationChambers(
  viewerGovernance: GetMyGovernanceResponse | null,
  eligibleChamberIds: string[],
): GetMyGovernanceResponse["delegation"]["chambers"] {
  const targetEligible = new Set(eligibleChamberIds);
  return (viewerGovernance?.delegation.chambers ?? [])
    .filter((item) => targetEligible.has(item.chamberId))
    .sort((a, b) => a.chamberId.localeCompare(b.chamberId));
}
