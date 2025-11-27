import { Link, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ProposalChamber: React.FC = () => {
  const { id } = useParams();
  const title = id ?? "Proposal";

  return (
    <div className="app-page flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{title} · Chamber vote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>Stage: Chamber voting window.</p>
          <p>Quorum and passing thresholds apply; votes tracked by chamber.</p>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link to={`/proposals/${id}/formation`}>Move to Formation</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={`/proposals/${id}/pool`}>Back to pool</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalChamber;
