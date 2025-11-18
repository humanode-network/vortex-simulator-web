import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Grid, Col } from "@/components/ui/layout";

const proposals = [
  {
    id: "mesh",
    title: "Orbital Mesh Sequencer Upgrade",
    chamber: "Protocol Engineering · Legate tier",
    status: "Proposal pool",
    chamberTag: "Protocol chamber",
    summary:
      "Introduce redundant biometric sequencer nodes to lower latency inside human-node verification flow and enable inter-era checkpoints.",
  },
  {
    id: "fees",
    title: "Adaptive Fee Shaping",
    chamber: "Economics & Treasury · Consul",
    status: "Chamber vote",
    chamberTag: "Economics chamber",
    summary:
      "Tune transaction fees dynamically based on network load to improve determinism for quorum settlement while protecting user experience.",
  },
];

const Proposals: React.FC = () => {
  return (
    <div className="app-page flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <p className="text-xs uppercase tracking-wide text-muted">Filters</p>
          <CardTitle>Search proposals</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <Grid cols={12} gap="3">
            <Col span={{ base: 12, sm: 6, md: 3 }}>
              <Label htmlFor="keyword">Keyword search</Label>
              <Input id="keyword" placeholder="Proposal, hash, proposer…" />
            </Col>
            <Col span={{ base: 12, sm: 6, md: 3 }}>
              <Label htmlFor="status">Status</Label>
              <Select id="status" defaultValue="any">
                <option value="any">Any</option>
                <option value="pool">Proposal pool</option>
                <option value="vote">Chamber vote</option>
                <option value="build">Formation build</option>
                <option value="final">Final vote</option>
                <option value="archived">Archived</option>
              </Select>
            </Col>
            <Col span={{ base: 12, sm: 6, md: 3 }}>
              <Label htmlFor="chamber">Chamber</Label>
              <Select id="chamber" defaultValue="all">
                <option value="all">All chambers</option>
                <option value="protocol">Protocol Engineering</option>
                <option value="economics">Economics</option>
                <option value="security">Security</option>
                <option value="social">Social</option>
              </Select>
            </Col>
            <Col span={{ base: 12, sm: 6, md: 3 }}>
              <Label htmlFor="sort">Sort by</Label>
              <Select id="sort" defaultValue="newest">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="activity">Activity</option>
              </Select>
            </Col>
          </Grid>

          <div className="flex flex-wrap gap-2 pt-1">
            {["Infrastructure", "Formation", "Security", "Research", "Community", "High quorum"].map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {proposals.map((p) => (
          <Card key={p.id} className="border-border">
            <CardContent className="pt-4 space-y-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-muted">{p.chamber}</p>
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{p.status}</Badge>
                  <Badge variant="outline">{p.chamberTag}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted">{p.summary}</p>
            </CardContent>
            <CardFooter className="pt-0 gap-2">
              <Button size="sm">Open proposal</Button>
              <Button variant="outline" size="sm">
                Watch
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Proposals;
