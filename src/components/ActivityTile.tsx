import type { FC } from "react";
import { Link } from "react-router";
import { Surface } from "@/components/Surface";
import { Kicker } from "@/components/Kicker";
import { GlassyStatusChip } from "@/components/GlassySection";
import { cn } from "@/lib/utils";
import { ACTIVITY_TILE_CLASS, formatActivityTimestamp } from "@/lib/profileUi";
import type { GovernanceActionDto } from "@/types/api";

type ActivityTileProps = {
  action: GovernanceActionDto;
  className?: string;
};

export const ActivityTile: FC<ActivityTileProps> = ({ action, className }) => {
  const tile = (
    <Surface
      variant="panelAlt"
      radius="xl"
      shadow="tile"
      className={cn(
        "grid gap-2 px-3 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-card",
        ACTIVITY_TILE_CLASS,
        className,
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <Kicker className="max-h-[1.3em] overflow-hidden text-primary">
          {action.action}
        </Kicker>
        <GlassyStatusChip className="shrink-0 text-[0.66rem]">
          {formatActivityTimestamp(action.timestamp)}
        </GlassyStatusChip>
      </div>
      <p className="max-h-[2.7em] overflow-hidden text-sm leading-[1.35] font-semibold text-text">
        {action.title}
      </p>
      <p className="max-h-[2.8em] overflow-hidden text-xs leading-[1.4] text-muted">
        {action.context}
      </p>
      <p className="max-h-[2.8em] overflow-hidden text-xs leading-[1.4] text-muted">
        {action.detail}
      </p>
    </Surface>
  );

  return action.href ? (
    <Link to={action.href} className="block">
      {tile}
    </Link>
  ) : (
    <div>{tile}</div>
  );
};
