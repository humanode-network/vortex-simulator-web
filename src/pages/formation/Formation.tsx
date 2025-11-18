import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Grid, Col } from "@/components/ui/layout";

const metrics = [
  { label: "Total funded HMND", value: "210k" },
  { label: "Active projects", value: "12" },
  { label: "Open team slots", value: "9" },
  { label: "Milestones delivered", value: "46" },
];

const categories = ["All", "Research", "Development", "Social"];
const statuses = ["Live", "Upcoming", "Completed"];

const projects = [
  {
    id: "node-health-kit",
    title: "Node Health Kit",
    track: "Formation Logistics · Live",
    summary: "Tooling bundle to automate node diagnostics and recovery workflows for operators.",
    chips: ["Budget: 80k HMND", "Milestones: 6 / 9", "Team slots: 2 open"],
    proposer: "Mozgiii",
  },
  {
    id: "identity-risk-lab",
    title: "Identity Risk Lab",
    track: "Research · Upcoming",
    summary: "Experimental track exploring threat modeling for biometric verification attacks.",
    chips: ["Budget: 45k HMND", "Milestones: 0 / 5", "Team slots: 3 open"],
    proposer: "Raamara",
  },
];

const Formation: React.FC = () => {
  return (
    <div className="app-page flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-(--text)">Formation</h1>
      </div>

      <Grid cols={12} gap="3">
        {metrics.map((m) => (
          <Col key={m.label} span={{ base: 12, sm: 6, md: 3 }}>
            <Card className="h-full">
              <CardContent className="pt-4">
                <p className="text-sm text-muted">{m.label}</p>
                <p className="text-lg font-semibold text-(--text)">{m.value}</p>
              </CardContent>
            </Card>
          </Col>
        ))}
      </Grid>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-[color:var(--panel)] p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Badge key={c} variant={c === "All" ? "default" : "outline"}>
              {c}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <Badge key={s} variant="outline">
              {s}
            </Badge>
          ))}
        </div>
      </div>

      <section className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted">Search projects</p>
        <Input placeholder="Search by project, proposer, focus…" />
      </section>

      <Grid cols={12} gap="4">
        {projects.map((p) => (
          <Col key={p.id} span={{ base: 12, md: 6 }}>
            <Card className="h-full">
              <CardContent className="pt-4 space-y-2">
                <h3 className="text-lg font-semibold text-(--text)">{p.title}</h3>
                <p className="text-sm text-muted">{p.track}</p>
                <p className="text-sm text-muted">{p.summary}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {p.chips.map((c) => (
                    <Badge key={c} variant="outline">
                      {c}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-0 justify-between">
                <p className="text-sm text-muted">
                  Proposer: <Link to={`/human-nodes/${p.proposer}`}>{p.proposer}</Link>
                </p>
                <Button asChild size="sm">
                  <Link to={`/formation/${p.id}`}>Open project</Link>
                </Button>
              </CardFooter>
            </Card>
          </Col>
        ))}
      </Grid>
    </div>
  );
};

export default Formation;
