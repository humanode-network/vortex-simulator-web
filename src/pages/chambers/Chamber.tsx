import { useParams, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import "./Chamber.css";

const Chamber: React.FC = () => {
  const { id } = useParams();
  const title = id ? id.replace(/-/g, " ") : "Unknown";

  return (
    <div className="app-page flex flex-col gap-3">
      <div>
        <h1 className="text-xl font-semibold text-(--text)">Chamber: {title}</h1>
        <p className="text-sm text-muted">Overview and key metrics for this chamber.</p>
      </div>

      <div className="chamber-layout">
        <div className="chamber-layout__main">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle>Scope</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <p className="text-sm text-muted">
                This chamber governs decisions related to its specialization. Add charter, mandates, and focuses here.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {["Mandate", "Procedures", "Contacts"].map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="chamber-layout__side">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle>Leads & members</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <p className="text-sm text-muted">Lead: TBD</p>
              <p className="text-sm text-muted">Active members: —</p>
              <div className="flex gap-2 pt-1">
                <Button asChild variant="outline" size="sm">
                  <Link to="/chambers">Back to chambers</Link>
                </Button>
                <Button size="sm">Apply</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chamber;
