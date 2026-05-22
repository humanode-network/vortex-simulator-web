import { Link } from "react-router";
import { AppCard } from "@/components/AppCard";
import { PipelineList } from "@/components/PipelineList";
import { StatGrid, makeChamberStats } from "@/components/StatGrid";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import type { ChamberDto } from "@/types/api";

type MyGovernanceChambersCardProps = {
  myChambers: ChamberDto[];
};

export function MyGovernanceChambersCard({
  myChambers,
}: MyGovernanceChambersCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>My chambers</CardTitle>
      </CardHeader>
      <CardContent>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {myChambers.map((chamber) => (
            <AppCard
              key={chamber.id}
              title={<span className="text-xl font-bold">{chamber.name}</span>}
              badge={
                <Badge
                  size="md"
                  className="border-none bg-(--primary-dim) px-4 py-1 text-center text-sm font-bold tracking-wide whitespace-nowrap text-primary uppercase"
                >
                  M × {chamber.multiplier}
                </Badge>
              }
              footer={
                <div className="flex w-full justify-center">
                  <Button asChild size="md" variant="primary" className="w-56">
                    <Link to={`/app/chambers/${chamber.id}`}>Enter</Link>
                  </Button>
                </div>
              }
            >
              <StatGrid items={makeChamberStats(chamber.stats)} />
              <PipelineList pipeline={chamber.pipeline} />
            </AppCard>
          ))}
        </section>
      </CardContent>
    </Card>
  );
}
