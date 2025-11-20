import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const governanceState = {
  label: "Egalitarian Republic",
  subtitle: "Balanced council with rotating chancellors",
  summary:
    "The Vortex network operates as an egalitarian republic. Power is split between chambers, Formation squads, and elected councils. " +
    "Legitimacy is stable, and factions are cooperating on expansion and treasury projects.",
  metrics: [
    { label: "Legitimacy", value: "78%", trend: "+3% vs last epoch" },
    { label: "Stability", value: "72%", trend: "Neutral" },
    { label: "Centralization", value: "44%", trend: "Decentralizing" },
  ],
};

const politicalBlocs = [
  { name: "Civic Union", seats: "38 seats", stance: "Pro-expansion, social reform" },
  { name: "Protocol Guard", seats: "31 seats", stance: "Security-first, validator hawks" },
  { name: "Arcadian Treasury", seats: "24 seats", stance: "Fiscal conservatives" },
  { name: "Formation League", seats: "17 seats", stance: "Growth of squads & guilds" },
];

const economicIndicators = [
  { label: "Treasury reserves", value: "412M HMND", detail: "52 weeks of runway" },
  { label: "Burn rate", value: "7.8M HMND / epoch", detail: "Up 4% vs prior" },
  { label: "Civic budget", value: "112M HMND", detail: "Infrastructure & grants" },
  { label: "Trade routes", value: "9 active", detail: "Formation & faction deals" },
];

const riskSignals = [
  { title: "Faction cohesion", status: "Low risk", detail: "Blocs aligned on governance reforms" },
  { title: "External deterrence", status: "Moderate risk", detail: "Neighboring factions probing markets" },
  { title: "Treasury liquidity", status: "Low risk", detail: "Healthy reserves & inflows" },
  { title: "Formation morale", status: "Watch", detail: "Two squads reported burnout" },
];

const edicts = [
  {
    title: "Edict #41 · Civic Prosperity",
    effect: "Increased Formation funding for public works",
    sponsors: "Civic Union · Formation League",
  },
  {
    title: "Edict #38 · Sentinel Watch",
    effect: "Expanded monitoring of validator regions",
    sponsors: "Protocol Guard · Arcadian Treasury",
  },
];

const Invision: React.FC = () => {
  return (
    <div className="app-page flex flex-col gap-5">
      <section className="rounded-2xl border border-border bg-panel p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Current governance state</p>
          <h1 className="text-2xl font-semibold text-text">{governanceState.label}</h1>
          <p className="text-sm text-muted">{governanceState.subtitle}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted">{governanceState.summary}</p>
        <div className="grid gap-3 text-center sm:grid-cols-3">
          {governanceState.metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-border px-3 py-3">
              <p className="text-xs uppercase tracking-wide text-muted">{metric.label}</p>
              <p className="text-2xl font-semibold text-text">{metric.value}</p>
              <p className="text-xs text-muted">{metric.trend}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Political blocs</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-text sm:grid-cols-2">
            {politicalBlocs.map((bloc) => (
              <div key={bloc.name} className="rounded-xl border border-border bg-panel-alt px-4 py-3">
                <p className="text-base font-semibold text-text">{bloc.name}</p>
                <p className="text-xs uppercase tracking-wide text-primary">{bloc.seats}</p>
                <p className="text-xs text-muted">{bloc.stance}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Treasury & economy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text">
            {economicIndicators.map((indicator) => (
              <div key={indicator.label} className="rounded-xl border border-border px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-muted">{indicator.label}</p>
                <p className="text-lg font-semibold text-text">{indicator.value}</p>
                <p className="text-xs text-muted">{indicator.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Risk dashboard</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm text-text">
            {riskSignals.map((signal) => (
              <div key={signal.title} className="rounded-xl border border-border px-3 py-3">
                <p className="text-xs uppercase tracking-wide text-muted">{signal.title}</p>
                <p className="text-base font-semibold text-primary">{signal.status}</p>
                <p className="text-xs text-muted">{signal.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Council edicts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text">
            {edicts.map((edict) => (
              <div key={edict.title} className="rounded-xl border border-border px-3 py-3">
                <p className="text-base font-semibold text-text">{edict.title}</p>
                <p className="text-xs uppercase tracking-wide text-primary">{edict.effect}</p>
                <p className="text-xs text-muted">{edict.sponsors}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Invision;
