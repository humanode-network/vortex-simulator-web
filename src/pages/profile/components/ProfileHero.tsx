import { Badge } from "@/components/primitives/badge";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { AvatarPlaceholder } from "@/components/AvatarPlaceholder";
import { StatusPill } from "@/components/StatusPill";
import { Kicker } from "@/components/Kicker";
import type { HumanNodeProfileDto } from "@/types/api";
import { Check, Copy } from "lucide-react";

type ProfileHeroProps = {
  copied: boolean;
  headerAddress: string;
  headerTitle: string;
  onCopyAddress: () => void;
  profile: HumanNodeProfileDto | null;
  shortAddressLabel: string;
  showShortBadge: boolean;
  visibleHeroStats: HumanNodeProfileDto["heroStats"];
};

export function ProfileHero({
  copied,
  headerAddress,
  headerTitle,
  onCopyAddress,
  profile,
  shortAddressLabel,
  showShortBadge,
  visibleHeroStats,
}: ProfileHeroProps) {
  return (
    <>
      <Surface
        as="section"
        variant="panel"
        radius="2xl"
        shadow="card"
        className="p-6"
      >
        <div className="grid items-center gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="flex justify-center lg:justify-start">
            <AvatarPlaceholder
              initials={profile?.name?.substring(0, 2).toUpperCase() ?? "—"}
              size="lg"
            />
          </div>
          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-semibold text-text sm:text-3xl">
              {headerTitle}
            </h1>
            {headerAddress ? (
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
                {showShortBadge ? (
                  <Badge variant="muted">{shortAddressLabel}</Badge>
                ) : null}
                <button
                  type="button"
                  className="hover:bg-surface-alt inline-flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:text-text"
                  onClick={onCopyAddress}
                  aria-label={copied ? "Copied" : "Copy address"}
                  title={copied ? "Copied" : "Copy address"}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col items-center gap-2 text-sm lg:items-end">
            <StatusPill
              label="Governor"
              value={profile?.governorActive ? "Active" : "Not active"}
              active={profile?.governorActive ?? false}
            />
            <StatusPill
              label="Human node"
              value={profile?.humanNodeActive ? "Active" : "Not active"}
              active={profile?.humanNodeActive ?? false}
            />
          </div>
        </div>
      </Surface>

      {visibleHeroStats.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleHeroStats.map((stat) => (
            <Surface
              key={stat.label}
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="px-4 py-3 text-center"
            >
              <Kicker align="center">
                {stat.label === "ACM" ? (
                  <HintLabel termId="acm" termText="ACM" />
                ) : stat.label === "MM" ? (
                  <HintLabel termId="meritocratic_measure" termText="MM" />
                ) : (
                  stat.label
                )}
              </Kicker>
              <p className="text-xl font-semibold text-text">{stat.value}</p>
            </Surface>
          ))}
        </div>
      ) : null}
    </>
  );
}
