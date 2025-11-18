import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid, Col } from "@/components/ui/layout";

const cards = [
  { title: "Invision score", text: "82 / 100 · Deterrence influence rating across last 12 epochs." },
  { title: "Quorum participation", text: "91% average participation on proposals in current era." },
  { title: "Delegation share", text: "3.4% of all delegated votes from governors." },
  { title: "Alerts", text: "No outstanding flags." },
];

const Invision: React.FC = () => {
  return (
    <div className="app-page flex flex-col gap-3">
      <div>
        <h1 className="text-xl font-semibold text-(--text)">Invision</h1>
        <p className="text-sm text-muted">Deterrence & oversight signals</p>
      </div>

      <Grid cols={12} gap="3">
        {cards.map((card) => (
          <Col key={card.title} span={{ base: 12, sm: 6, md: 3 }}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle>{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted">{card.text}</p>
              </CardContent>
            </Card>
          </Col>
        ))}
      </Grid>
    </div>
  );
};

export default Invision;
