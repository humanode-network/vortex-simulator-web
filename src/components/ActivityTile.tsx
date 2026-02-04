import type { FC } from "react";
import { Link } from "react-router";
import { Surface } from "@/components/Surface";
import { Kicker } from "@/components/Kicker";
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
        "space-y-1 px-3 py-3 text-center transition hover:-translate-y-0.5 hover:shadow-card",
        ACTIVITY_TILE_CLASS,
        className,
      )}
    >
      <Kicker align="center" className="line-clamp-1 text-primary">
        {action.action}
      </Kicker>
      <p className="line-clamp-1 text-base font-semibold text-text">
        {action.title}
      </p>
      <p className="line-clamp-2 text-xs text-muted">{action.context}</p>
      <p className="line-clamp-2 text-xs text-muted">{action.detail}</p>
      <p className="text-[11px] text-muted">
        {formatActivityTimestamp(action.timestamp)}
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
