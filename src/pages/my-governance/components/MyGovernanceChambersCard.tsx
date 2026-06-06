import { Link } from "react-router";
import { AppCard } from "@/components/AppCard";
import { GlassySection, GlassyStatusChip } from "@/components/GlassySection";
import { PipelineList } from "@/components/PipelineList";
import { StatGrid, makeChamberStats } from "@/components/StatGrid";
import { Button } from "@/components/primitives/button";
import type { ChamberDto } from "@/types/api";

type MyGovernanceChambersCardProps = {
  myChambers: ChamberDto[];
};

export function MyGovernanceChambersCard({
  myChambers,
}: MyGovernanceChambersCardProps) {
  return (
    <GlassySection title="My chambers">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {myChambers.map((chamber) => (
          <AppCard
            key={chamber.id}
            surface="glass"
            title={<span className="glassy-tile-heading">{chamber.name}</span>}
            badge={
              <GlassyStatusChip tone="primary" className="uppercase">
                M × {chamber.multiplier}
              </GlassyStatusChip>
            }
            footer={
              <div className="flex w-full justify-center">
                <Button asChild size="md" variant="primary" className="w-56">
                  <Link to={`/app/chambers/${chamber.id}`}>Enter</Link>
                </Button>
              </div>
            }
          >
            <StatGrid items={makeChamberStats(chamber.stats)} surface="glass" />
            <PipelineList pipeline={chamber.pipeline} surface="glass" />
          </AppCard>
        ))}
      </div>
    </GlassySection>
  );
}
