import {
  GlassyCompactGrid,
  GlassyCompactMetric,
  GlassyCompactRow,
  GlassyKeyValue,
  GlassySection,
  GlassyStatusChip,
  GlassyTile,
} from "@/components/GlassySection";
import type {
  CmChamberBreakdownDto,
  CmHistoryItemDto,
  CmTotalsDto,
} from "@/types/api";

type CmEconomyPanelProps = {
  chambers: CmChamberBreakdownDto[];
  history: CmHistoryItemDto[];
  className?: string;
  mmValue?: number | string;
  totalsScope?: "full" | "personal";
  title?: string;
  totals: CmTotalsDto;
};

export const CmEconomyPanel: React.FC<CmEconomyPanelProps> = ({
  chambers,
  className,
  history,
  mmValue = "—",
  totalsScope = "full",
  title,
  totals,
}) => {
  const displayTitle = title ?? "CM + MM";
  const personalMmValue = mmValue === "—" ? totals.acm : mmValue;
  const tiles: Array<{ label: string; value: number | string }> =
    totalsScope === "personal"
      ? [
          { label: "ACM", value: totals.acm },
          { label: "MM", value: personalMmValue },
        ]
      : [
          { label: "LCM", value: totals.lcm },
          { label: "MCM", value: totals.mcm },
          { label: "Members' ACM", value: totals.acm },
          { label: "MM", value: mmValue },
        ];
  const formattedValue = (value: number | string) =>
    typeof value === "number" ? value.toLocaleString() : value;

  if (totalsScope === "personal") {
    return (
      <GlassySection className={className} title={displayTitle}>
        <div className="grid h-full gap-2">
          <GlassyCompactGrid>
            {tiles.map((tile) => (
              <GlassyCompactMetric
                key={tile.label}
                label={tile.label}
                value={formattedValue(tile.value)}
              />
            ))}
          </GlassyCompactGrid>
          {chambers.length === 0 ? (
            <GlassyTile className="px-4 py-3 text-sm text-muted">
              No CM chambers yet.
            </GlassyTile>
          ) : (
            <GlassyCompactGrid>
              {chambers.map((chamber) => (
                <GlassyCompactRow
                  className="cm-economy-row"
                  key={chamber.chamberId}
                  title={chamber.chamberTitle}
                  actions={
                    <GlassyStatusChip tone="primary">
                      M × {chamber.multiplier}
                    </GlassyStatusChip>
                  }
                >
                  <div className="cm-economy-row__metrics">
                    <GlassyKeyValue
                      className="glassy-key-value--stacked glassy-key-value--metric"
                      label="LCM"
                      value={chamber.lcm}
                    />
                    <GlassyKeyValue
                      className="glassy-key-value--stacked glassy-key-value--metric"
                      label="MCM"
                      value={chamber.mcm}
                    />
                  </div>
                </GlassyCompactRow>
              ))}
            </GlassyCompactGrid>
          )}
        </div>
      </GlassySection>
    );
  }

  return (
    <GlassySection className={className} title={displayTitle}>
      <GlassyCompactGrid className="lg:grid-cols-4">
        {tiles.map((tile) => (
          <GlassyCompactMetric
            key={tile.label}
            label={tile.label}
            value={formattedValue(tile.value)}
          />
        ))}
      </GlassyCompactGrid>

      <div className="grid gap-3 md:grid-cols-2">
        <GlassyTile className="grid gap-3">
          <p className="glassy-tile-heading">Chamber breakdown</p>
          {chambers.length === 0 ? (
            <p className="text-sm text-muted">No CM chambers yet.</p>
          ) : (
            <div className="grid gap-2">
              {chambers.map((chamber) => (
                <GlassyCompactRow
                  key={chamber.chamberId}
                  title={chamber.chamberTitle}
                  actions={
                    <GlassyStatusChip tone="primary">
                      M × {chamber.multiplier}
                    </GlassyStatusChip>
                  }
                >
                  <div className="grid grid-cols-3 gap-2">
                    <GlassyKeyValue
                      className="glassy-key-value--stacked glassy-key-value--metric"
                      label="LCM"
                      value={chamber.lcm}
                    />
                    <GlassyKeyValue
                      className="glassy-key-value--stacked glassy-key-value--metric"
                      label="MCM"
                      value={chamber.mcm}
                    />
                    <GlassyKeyValue
                      className="glassy-key-value--stacked glassy-key-value--metric"
                      label="Members' ACM"
                      value={chamber.acm}
                    />
                  </div>
                </GlassyCompactRow>
              ))}
            </div>
          )}
        </GlassyTile>

        <GlassyTile className="grid gap-3">
          <p className="glassy-tile-heading">Recent CM awards</p>
          {history.length === 0 ? (
            <p className="text-sm text-muted">No CM awards yet.</p>
          ) : (
            <div className="grid gap-2">
              {history.slice(0, 5).map((item) => (
                <GlassyCompactRow
                  key={`${item.proposalId}-${item.awardedAt}`}
                  title={item.title}
                  actions={
                    <GlassyStatusChip tone="primary">
                      M × {item.multiplier}
                    </GlassyStatusChip>
                  }
                >
                  <div className="grid grid-cols-3 gap-2">
                    <GlassyKeyValue
                      className="glassy-key-value--stacked glassy-key-value--metric"
                      label="Chamber"
                      value={item.chamberId}
                    />
                    <GlassyKeyValue
                      className="glassy-key-value--stacked glassy-key-value--metric"
                      label="LCM"
                      value={item.lcm}
                    />
                    <GlassyKeyValue
                      className="glassy-key-value--stacked glassy-key-value--metric"
                      label="MCM"
                      value={item.mcm}
                    />
                  </div>
                </GlassyCompactRow>
              ))}
            </div>
          )}
        </GlassyTile>
      </div>
    </GlassySection>
  );
};
