import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid, Col } from "@/components/ui/layout";

const chambers = [
  {
    id: "protocol-engineering",
    name: "Protocol Engineering",
    lead: "Mozgiii",
    meta: "Core protocol, network stability, clients.",
    summary: "Oversees upgrades to validator stack, biometric verification flow, and consensus tuning.",
  },
  {
    id: "economics",
    name: "Economics & Treasury",
    lead: "Raamara",
    meta: "Token economics, fees, program budgets.",
    summary: "Shapes fee policy, treasury distributions, and incentive design across programs.",
  },
  {
    id: "security",
    name: "Security & Infra",
    lead: "TBD",
    meta: "Audits, monitoring, deterrence.",
    summary: "Handles preventative controls, incident drills, and operational security posture.",
  },
];

const Chambers: React.FC = () => {
  return (
    <div className="app-page flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-(--text)">Chambers</h1>
        <p className="text-sm text-muted">Browse active governance chambers.</p>
      </div>

      <Grid cols={12} gap="4">
        {chambers.map((chamber) => (
          <Col key={chamber.id} span={{ base: 12, sm: 6, md: 4 }}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle>{chamber.name}</CardTitle>
                <p className="text-sm text-muted">{chamber.meta}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted">{chamber.summary}</p>
              </CardContent>
              <CardFooter className="pt-0 justify-between">
                <Badge variant="outline">Lead: {chamber.lead}</Badge>
                <Button asChild size="sm">
                  <Link to={`/chambers/${chamber.id}`}>Open chamber</Link>
                </Button>
              </CardFooter>
            </Card>
          </Col>
        ))}
      </Grid>
    </div>
  );
};

export default Chambers;
