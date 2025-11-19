import { useParams, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import "./HumanNode.css";

const HumanNode: React.FC = () => {
  const { id } = useParams();
  const name = id ?? "Unknown";

  return (
    <div className="app-page flex flex-col gap-3">
      <div>
        <h1 className="text-xl font-semibold text-(--text)">Human node: {name}</h1>
        <p className="text-sm text-muted">Profile overview and participation summary.</p>
      </div>

      <div className="human-node-detail">
        <div className="human-node-detail__main">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">ACM: —</Badge>
                <Badge variant="outline">MM: —</Badge>
              </div>
              <p className="text-sm text-muted">
                Add bio, chamber affiliations, and last activity here.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="human-node-detail__side">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/human-nodes">Back to list</Link>
                </Button>
                <Button size="sm">Contact</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HumanNode;
