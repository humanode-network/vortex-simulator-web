import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Courts: React.FC = () => {
  return (
    <div className="app-page flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-(--text)">Courts</h1>
        <p className="text-sm text-muted">Disputes, appeals, and court activity overview.</p>
      </header>
      <Card className="border border-border bg-panel">
        <CardHeader className="pb-2">
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          Court cases, rulings, and appeals will surface here.
        </CardContent>
      </Card>
    </div>
  );
};

export default Courts;
