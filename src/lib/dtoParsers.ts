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
  const totalAcm = chambers.reduce((sum, chamber) => {
    const { acm } = getChamberNumericStats(chamber);
    return sum + acm;
  }, 0);
  const liveProposals = chambers.reduce(
    (sum, chamber) => sum + (chamber.pipeline.vote ?? 0),
    0,
  );
  return {
    totalChambers: chambers.length,
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
