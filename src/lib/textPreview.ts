export const PROPOSAL_SUMMARY_PREVIEW_MAX = 180;

export function proposalSummaryPreview(
  value: string,
  maxLength = PROPOSAL_SUMMARY_PREVIEW_MAX,
): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;

  const hardCut = text.slice(0, maxLength + 1);
  const wordCut = hardCut.lastIndexOf(" ");
  const cutAt = wordCut >= Math.floor(maxLength * 0.72) ? wordCut : maxLength;

  return text
    .slice(0, cutAt)
    .trim()
    .replace(/[\s,;:./\\-]+$/g, "");
}
