import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Surface } from "@/components/Surface";

export function MyGovernanceVetoProcessCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Veto process</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-4 py-3 text-sm text-muted"
        >
          Veto happens on the chamber vote page itself. Citizens and chambers
          can cast veto votes during the chamber vote window, and if the
          ordinary vote passes, a 24h veto countdown remains open on that same
          page.
        </Surface>
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-4 py-3 text-sm text-muted"
        >
          If a veto succeeds, the proposal returns to reconsideration draft and
          the proposer can resubmit it directly into chamber vote without going
          through proposal pool again.
        </Surface>
      </CardContent>
    </Card>
  );
}
