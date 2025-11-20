import { useState } from "react";
import { useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const heroStats = [
  { label: "ACM score", value: "182" },
  { label: "MM score", value: "92" },
  { label: "Invision score", value: "82 / 100" },
  { label: "Member since", value: "11.06.2021" },
];

const quickDetails = [
  { label: "Tier", value: "Legate" },
  { label: "Faction", value: "Protocol Vanguard" },
  { label: "Delegation share", value: "113 · 3.4%" },
  { label: "Quorum participation", value: "91% · 12 epochs" },
];

const proofSections = {
  time: {
    title: "Proof-of-Time",
    items: [
      { label: "Human node for", value: "3 Y · 4 M" },
      { label: "Governor for", value: "2 Y · 2 M" },
    ],
  },
  devotion: {
    title: "Proof-of-Devotion",
    items: [
      { label: "Proposal accepted?", value: "Yes" },
      { label: "Participated in formation?", value: "Yes" },
    ],
  },
  governance: {
    title: "Proof-of-Governance",
    items: [
      { label: "Actively governed", value: "2 Y · 1 M" },
      { label: "Active governor?", value: "Yes" },
    ],
  },
};

const governanceActions = [
  { title: "Reddit brand proposal", action: "Upvoted", context: "Marketing proposal pool" },
  { title: "Update runtime proposal", action: "Casted vote", context: "Protocol chamber" },
  { title: "The Smurf project", action: "Left project", context: "Formation" },
  { title: "Fee telemetry upgrade #225", action: "Authored proposal", context: "Protocol chamber" },
  { title: "Treasury split adjustment #883", action: "Presented motion", context: "Economic chamber" },
  { title: "Protocol SSC quorum drill", action: "Coordinated drill", context: "Protocol chamber" },
  { title: "Mesh sequencer redundancy", action: "Reviewed implementation", context: "Formation" },
  { title: "Budget oversight motion", action: "Co-authored memo", context: "Governance proposal pool" },
  { title: "Telemetry SDK handoff", action: "Mentored team", context: "Faction task force" },
];

const projects = [
  {
    title: "Node Health Kit",
    status: "Formation Logistics · Live",
    summary: "Automation bundle for validator diagnostics, recovery, and escalation workflows for operators.",
    chips: ["Budget: 80k HMND", "Milestones: 6 / 9", "Team slots: 2 open"],
  },
  {
    title: "Identity Risk Lab",
    status: "Research · Upcoming",
    summary: "Threat modeling track focused on biometric verification attacks and countermeasures.",
    chips: ["Budget: 45k HMND", "Milestones: 0 / 5", "Team slots: 3 open"],
  },
];

const history = [
  "Epoch 192 · Proposed GC motion on fee telemetry",
  "Epoch 181 · Presented fee split adjustment #883",
];

const HumanNode: React.FC = () => {
  const { id } = useParams();
  const [activeProof, setActiveProof] = useState<"" | "time" | "devotion" | "governance">("");
  const name = id ?? "Unknown";
  const governorActive = true;
  const humanNodeActive = true;

  return (
    <div className="app-page flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-panel p-6">
        <div className="grid items-center gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="flex justify-center lg:justify-start">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-border bg-panel-alt text-lg font-semibold text-muted shadow-inner">
              {name.substring(0, 2).toUpperCase()}
            </div>
          </div>
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-semibold text-text">{name}</h1>
          </div>
          <div className="flex flex-col items-center gap-2 text-sm lg:items-end">
            <div className="inline-flex w-48 items-center justify-between rounded-full border border-border bg-panel-alt px-4 py-2">
              <span className="text-xs uppercase tracking-wide text-muted">Governor</span>
              <span className={`font-semibold ${governorActive ? "text-primary" : "text-muted"}`}>
                {governorActive ? "Active" : "Not active"}
              </span>
            </div>
            <div className="inline-flex w-48 items-center justify-between rounded-full border border-border bg-panel-alt px-4 py-2">
              <span className="text-xs uppercase tracking-wide text-muted">Human node</span>
              <span className={`font-semibold ${humanNodeActive ? "text-primary" : "text-muted"}`}>
                {humanNodeActive ? "Active" : "Not active"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {heroStats.map((stat) => (
          <Card key={stat.label} className="h-full">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{stat.label}</p>
              <p className="text-2xl font-semibold text-text">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Governance summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              <p>
                Mozgiii currently leads several operator-focused squads and acts as a liaison for the Governance Council. Recent work focused on
                telemetry for biometric proofs, redundancy inside the mesh sequencer, and readiness drills for upcoming upgrades.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Governance activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-scroll pr-2 sm:grid-cols-2 xl:grid-cols-3">
                {governanceActions.map((action) => (
                  <div key={action.title} className="rounded-xl border border-border bg-panel-alt px-3 py-3 text-left space-y-1">
                    <p className="text-sm font-semibold text-text line-clamp-1">{action.title}</p>
                    <p className="text-xs uppercase tracking-wide text-primary line-clamp-1">{action.action}</p>
                    <p className="text-xs text-muted line-clamp-1">{action.context}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Formation projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.map((project) => (
                <div key={project.title} className="rounded-xl border border-border px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-text">{project.title}</p>
                    <p className="text-xs uppercase tracking-wide text-muted">{project.status}</p>
                  </div>
                  <p className="text-sm text-muted">{project.summary}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {project.chips.map((chip) => (
                      <Badge key={chip} variant="outline">
                        {chip}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-center sm:grid-cols-2">
                {quickDetails.map((detail) => (
                  <div key={detail.label} className="flex h-20 flex-col items-center justify-between rounded-xl border border-border px-3 py-3">
                    <p className="text-xs uppercase tracking-wide text-muted">{detail.label}</p>
                    <p className="text-base font-semibold text-text">{detail.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 text-center">
                <div className="inline-flex rounded-full border border-border bg-panel p-1">
                  {(
                    [
                      { key: "time", label: "PoT" },
                      { key: "devotion", label: "PoD" },
                      { key: "governance", label: "PoG" },
                    ] as const
                  ).map((option) => {
                    const isActive = activeProof === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setActiveProof((prev) => (prev === option.key ? "" : option.key))}
                        className={`min-w-20 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                          isActive ? "bg-primary text-white shadow" : "text-text hover:bg-panel-alt"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {activeProof && (
                  <div className="grid gap-3 text-sm text-text sm:grid-cols-2">
                    {proofSections[activeProof].items.map((item) => (
                      <div key={item.label} className="flex h-20 flex-col items-center justify-between rounded-xl border border-border px-3 py-2 text-center">
                        <p className="text-xs uppercase tracking-wide text-muted leading-tight min-h-6">{item.label}</p>
                        <p className="text-sm font-semibold text-text min-h-5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.map((entry) => (
                <div key={entry} className="rounded-xl border border-border px-3 py-2 text-sm text-text">
                  {entry}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HumanNode;
