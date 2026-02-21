import type { ChamberDto, FormationProposalPageDto } from "@/types/api";

export function parseCommaNumber(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parsePercent(value: string): number {
  const cleaned = value.replace(/%/g, "").trim();
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseRatio(value: string): { a: number; b: number } {
  const parts = value
    .split("/")
    .map((part) => Number.parseInt(part.trim(), 10));
  if (parts.length !== 2) return { a: 0, b: 0 };
  const [a, b] = parts;
  return {
    a: Number.isFinite(a) ? a : 0,
    b: Number.isFinite(b) ? b : 0,
  };
}

export function getChamberNumericStats(chamber: ChamberDto) {
  return {
    governors: parseCommaNumber(chamber.stats.governors),
    acm: parseCommaNumber(chamber.stats.acm),
    lcm: parseCommaNumber(chamber.stats.lcm),
    mcm: parseCommaNumber(chamber.stats.mcm),
  };
}

export function computeChamberMetrics(chambers: ChamberDto[]) {
  // Governors can be members of multiple chambers, and `stats.acm` for a chamber
  // is an absolute total for that chamber's governor set (not a chamber-local slice).
  // Summing across chambers would double-count governors who are members of more than one chamber.
  //
  // The General chamber includes the full governor set, so the largest ACM total is a stable
  // approximation for "Total ACM" across unique governors.
  const totalAcm = chambers.reduce((max, chamber) => {
    const { acm } = getChamberNumericStats(chamber);
    return Math.max(max, acm);
  }, 0);
  // Governors can be members of multiple chambers; use the largest chamber roster
  // as a stable approximation of global governors for the summary tile.
  const governors = chambers.reduce((max, chamber) => {
    const { governors } = getChamberNumericStats(chamber);
    return Math.max(max, governors);
  }, 0);
  const liveProposals = chambers.reduce(
    (sum, chamber) => sum + (chamber.pipeline.vote ?? 0),
    0,
  );
  return {
    totalChambers: chambers.length,
    governors,
    totalAcm,
    liveProposals,
  };
}

export function getFormationProgress(formationPage: FormationProposalPageDto) {
  return {
    progressValue: parsePercent(formationPage.progress),
    team: parseRatio(formationPage.teamSlots),
    milestones: parseRatio(formationPage.milestones),
  };
}
