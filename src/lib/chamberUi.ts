type ChamberLabelSource = {
  id: string;
  name?: string | null;
  title?: string | null;
};

export function formatChamberLabel(
  chamberId: string | null | undefined,
  chambers?: ChamberLabelSource[] | null,
): string {
  const id = (chamberId ?? "").trim();
  if (!id || id === "general") return "General chamber";
  const match = chambers?.find((item) => item.id === id);
  return match?.name?.trim() || match?.title?.trim() || id;
}
