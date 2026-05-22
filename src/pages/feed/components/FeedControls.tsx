import { ToggleGroup } from "@/components/ToggleGroup";

export type FeedScope = "urgent" | "my" | "chambers" | "all";

const FEED_SCOPES: { value: FeedScope; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "my", label: "My activity" },
  { value: "chambers", label: "Chambers and factions" },
  { value: "all", label: "All activity" },
];

type FeedControlsProps = {
  chamberCount: number;
  chambersLoading: boolean;
  feedScope: FeedScope;
  onFeedScopeChange: (scope: FeedScope) => void;
};

export function FeedControls({
  chamberCount,
  chambersLoading,
  feedScope,
  onFeedScopeChange,
}: FeedControlsProps) {
  const chamberScoped = feedScope === "chambers" || feedScope === "urgent";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <ToggleGroup
        value={feedScope}
        onValueChange={(value) => onFeedScopeChange(value as FeedScope)}
        options={FEED_SCOPES.map((scope) => ({
          value: scope.value,
          label: scope.label,
        }))}
      />
      {chamberScoped && chambersLoading ? (
        <span className="text-xs text-muted">Loading chambers…</span>
      ) : chamberScoped ? (
        <span className="text-xs text-muted">
          {chamberCount} chamber{chamberCount === 1 ? "" : "s"}
        </span>
      ) : null}
    </div>
  );
}
