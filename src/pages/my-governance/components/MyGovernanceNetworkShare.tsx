import { GlassyMetricTile, GlassySection } from "@/components/GlassySection";
import { formatNetworkSharePercent } from "@/lib/myGovernanceUi";
import { useNetworkShare } from "../hooks/useNetworkShare";

export function MyGovernanceNetworkShare() {
  const { share, status } = useNetworkShare();
  const placeholder = status === "loading" ? "Loading..." : "Unavailable";
  const detail =
    status === "disconnected"
      ? "Connect your wallet to view your network share."
      : status === "unavailable"
        ? "Live Humanode network data is unavailable."
        : share?.humanNodeActive === false
          ? "Your Human Node is inactive. Only active Human Nodes hold a network share."
          : "One equal share per active Human Node. Refreshes every minute.";

  return (
    <GlassySection title="Share of the network">
      <div className="grid items-stretch gap-3 sm:grid-cols-2">
        <GlassyMetricTile
          className="min-h-20"
          label="Your ownership"
          value={share ? formatNetworkSharePercent(share.percent) : placeholder}
        />
        <GlassyMetricTile
          className="min-h-20"
          label="Active Human Nodes"
          value={share ? share.activeHumanNodes.toLocaleString() : placeholder}
        />
      </div>
      <p className="text-sm text-muted">{detail}</p>
    </GlassySection>
  );
}
