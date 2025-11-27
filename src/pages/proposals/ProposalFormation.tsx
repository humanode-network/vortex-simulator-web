import { Link, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ProposalFormation: React.FC = () => {
  const { id } = useParams();
  const title = id ?? "Proposal";

  return (
    <div className="app-page flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{title} · Formation project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>Stage: Proposal became a Formation project.</p>
          <p>Team gathering, milestones, and delivery tracked here.</p>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link to="/formation">View in Formation</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/proposals">Back to proposals</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalFormation;
