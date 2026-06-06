import { ToggleGroup } from "@/components/ToggleGroup";

export type FeedScope = "urgent" | "my" | "chambers" | "all";

const FEED_SCOPES: { value: FeedScope; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "my", label: "My activity" },
  { value: "chambers", label: "Chambers and factions" },
  { value: "all", label: "All activity" },
];

type FeedControlsProps = {
  feedScope: FeedScope;
  onFeedScopeChange: (scope: FeedScope) => void;
};

export function FeedControls({
  feedScope,
  onFeedScopeChange,
}: FeedControlsProps) {
  return (
    <div className="feed-controls">
      <ToggleGroup
        value={feedScope}
        onValueChange={(value) => onFeedScopeChange(value as FeedScope)}
        options={FEED_SCOPES.map((scope) => ({
          value: scope.value,
          label: scope.label,
        }))}
      />
      <div className="feed-controls__legend" aria-label="Feed indicator legend">
        <span className="feed-controls__legend-item">
          <span className="feed-controls__legend-swatch feed-controls__legend-swatch--action" />
          Action / open
        </span>
        <span className="feed-controls__legend-item">
          <span className="feed-controls__legend-swatch feed-controls__legend-swatch--recent" />
          Recent
        </span>
        <span className="feed-controls__legend-item">
          <span className="feed-controls__legend-swatch feed-controls__legend-swatch--idle" />
          Standard
        </span>
      </div>
    </div>
  );
}
