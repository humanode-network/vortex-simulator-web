import { Badge } from "@/components/primitives/badge";
import { Surface } from "@/components/Surface";
import { Kicker } from "@/components/Kicker";
import { SectionHeader } from "@/components/SectionHeader";
import type {
  CmChamberBreakdownDto,
  CmHistoryItemDto,
  CmTotalsDto,
} from "@/types/api";

type CmEconomyPanelProps = {
  totals: CmTotalsDto;
  chambers: CmChamberBreakdownDto[];
  history: CmHistoryItemDto[];
  mmValue?: number | string;
  title?: string;
};

export const CmEconomyPanel: React.FC<CmEconomyPanelProps> = ({
  totals,
  chambers,
  history,
  mmValue = "—",
  title = "CM + MM",
}) => {
  const tiles: Array<{ label: string; value: number | string }> = [
    { label: "LCM", value: totals.lcm },
    { label: "MCM", value: totals.mcm },
    { label: "ACM", value: totals.acm },
    { label: "MM", value: mmValue },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader>{title}</SectionHeader>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Surface
            key={tile.label}
            variant="panelAlt"
            radius="xl"
            shadow="tile"
            className="px-4 py-3 text-center"
          >
            <Kicker align="center">{tile.label}</Kicker>
            <p className="text-xl font-semibold text-text">
              {typeof tile.value === "number"
                ? tile.value.toLocaleString()
                : tile.value}
            </p>
          </Surface>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Surface variant="panelAlt" radius="xl" shadow="tile" className="px-4 py-3">
          <Kicker>Chamber breakdown</Kicker>
          {chambers.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No CM chambers yet.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-text">
              {chambers.map((chamber) => (
                <li key={chamber.chamberId} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{chamber.chamberTitle}</span>
                    <Badge variant="outline">M × {chamber.multiplier}</Badge>
                  </div>
                  <span className="text-xs text-muted">
                    LCM {chamber.lcm} · MCM {chamber.mcm} · ACM {chamber.acm}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface variant="panelAlt" radius="xl" shadow="tile" className="px-4 py-3">
          <Kicker>Recent CM awards</Kicker>
          {history.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No CM awards yet.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-text">
              {history.slice(0, 5).map((item) => (
                <li key={`${item.proposalId}-${item.awardedAt}`} className="flex flex-col gap-1">
                  <span className="font-semibold">{item.title}</span>
                  <span className="text-xs text-muted">
                    {item.chamberId} · M × {item.multiplier} · LCM {item.lcm} ·
                    MCM {item.mcm}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>
    </div>
  );
};
