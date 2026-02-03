import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Card } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { AvatarPlaceholder } from "@/components/AvatarPlaceholder";
import { StatusPill } from "@/components/StatusPill";
import { PageHint } from "@/components/PageHint";
import { Kicker } from "@/components/Kicker";
import { TierLabel } from "@/components/TierLabel";
import { ToggleGroup } from "@/components/ToggleGroup";
import { CmEconomyPanel } from "@/components/CmEconomyPanel";
import { SectionHeader } from "@/components/SectionHeader";
import { StatTile } from "@/components/StatTile";
import { ActivityTile } from "@/components/ActivityTile";
import { apiHuman } from "@/lib/apiClient";
import type { HumanNodeProfileDto, ProofKeyDto } from "@/types/api";
import { Check, Copy } from "lucide-react";
import {
  ACTIVITY_FILTERS,
  DETAIL_TILE_CLASS,
  PROOF_META,
  PROOF_TILE_CLASS,
  type ActivityFilter,
  activityMatches,
  shortAddress,
  shouldShowDetail,
} from "@/lib/profileUi";

const HumanNode: React.FC = () => {
  const { id } = useParams();
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<HumanNodeProfileDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const res = await apiHuman(id);
        if (!active) return;
        setProfile(res);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setProfile(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (!profile) {
    return (
      <div className="flex flex-col gap-6">
        <PageHint pageId="human-node" />
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          {loadError
            ? `Human profile unavailable: ${loadError}`
            : "Loading profile…"}
        </Card>
      </div>
    );
  }

  const {
    name,
    governorActive,
    humanNodeActive,
    heroStats,
    quickDetails,
    proofSections,
    governanceActions,
    projects,
    cmHistory = [],
    cmChambers = [],
  } = profile;
  const isAddressName = name.toLowerCase() === profile.id.toLowerCase();
  const headerTitle = isAddressName ? shortAddress(profile.id) : name;
  const visibleHeroStats = (heroStats ?? []).filter((stat) => {
    const label = stat.label.trim().toUpperCase();
    return !["ACM", "LCM", "MCM", "MM"].includes(label);
  });
  const proofKeys: ProofKeyDto[] = ["time", "devotion", "governance"];
  const proofCards = proofKeys
    .map((key) => ({
      key,
      section: proofSections[key],
    }))
    .filter(
      (
        entry,
      ): entry is {
        key: ProofKeyDto;
        section: HumanNodeProfileDto["proofSections"][ProofKeyDto];
      } => Boolean(entry.section),
    );

  const handleCopy = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const cmTotals = heroStats.reduce(
    (acc, stat) => {
      const label = stat.label.trim().toUpperCase();
      const numeric = Number(stat.value.replace(/[^0-9.-]/g, "")) || 0;
      if (label === "LCM") acc.lcm = numeric;
      if (label === "MCM") acc.mcm = numeric;
      if (label === "ACM") acc.acm = numeric;
      return acc;
    },
    { lcm: 0, mcm: 0, acm: 0 },
  );
  const filteredActions = governanceActions.filter((action) =>
    activityMatches(action, activityFilter),
  );
  const visibleDetails = quickDetails.filter((detail) =>
    shouldShowDetail(detail.label),
  );
  const proofTiles = proofCards.flatMap(({ key, section }) =>
    section.items.map((item) => ({
      key: `${key}-${item.label}`,
      label: (
        <span className="inline-flex items-center gap-1">
          <HintLabel
            termId={PROOF_META[key].termId}
            termText={PROOF_META[key].label}
          />
          <span className="text-muted">·</span>
          <span>{item.label}</span>
        </span>
      ),
      value: item.value,
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="human-node" />
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
              initials={name.substring(0, 2).toUpperCase()}
              size="lg"
            />
          </div>
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-semibold text-text">{headerTitle}</h1>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
              {!isAddressName ? (
                <Badge variant="muted">{shortAddress(profile.id)}</Badge>
              ) : null}
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-surface-alt hover:text-text"
                onClick={() => handleCopy(profile.id)}
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
          </div>
          <div className="flex flex-col items-center gap-2 text-sm lg:items-end">
            <StatusPill
              label="Governor"
              value={governorActive ? "Active" : "Not active"}
              active={governorActive}
            />
            <StatusPill
              label="Human node"
              value={humanNodeActive ? "Active" : "Not active"}
              active={humanNodeActive}
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
                {stat.label.startsWith("ACM") ? (
                  <HintLabel termId="acm">{stat.label}</HintLabel>
                ) : stat.label.startsWith("MM") ? (
                  <HintLabel termId="meritocratic_measure">
                    {stat.label}
                  </HintLabel>
                ) : (
                  stat.label
                )}
              </Kicker>
              <p className="text-xl font-semibold text-text">{stat.value}</p>
            </Surface>
          ))}
        </div>
      ) : null}

      <section className="space-y-4">
        <SectionHeader>Details &amp; Proofs</SectionHeader>
        <div className="grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
          {visibleDetails.map((detail) => (
            <StatTile
              key={detail.label}
              label={detail.label}
              value={
                detail.label === "Tier" ? (
                  <TierLabel tier={detail.value} />
                ) : (
                  detail.value
                )
              }
              className={DETAIL_TILE_CLASS}
              valueClassName="text-xl"
            />
          ))}
          {proofTiles.map((tile) => (
            <StatTile
              key={tile.key}
              label={tile.label}
              value={tile.value}
              className={PROOF_TILE_CLASS}
              valueClassName="text-xl"
            />
          ))}
        </div>
      </section>

      <CmEconomyPanel
        totals={cmTotals}
        chambers={cmChambers}
        history={cmHistory}
        mmValue="—"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <SectionHeader>Governance activity</SectionHeader>
            <Link
              to={`/app/human-nodes/${id ?? ""}/history`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              View full history
            </Link>
          </div>
          <ToggleGroup
            value={activityFilter}
            onValueChange={(val) =>
              setActivityFilter(
                (val as typeof activityFilter) || "all",
              )
            }
            options={ACTIVITY_FILTERS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
          {filteredActions.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredActions.map((action) => (
                <ActivityTile
                  key={`${action.title}-${action.timestamp}`}
                  action={action}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No activity to show yet.</p>
          )}
        </div>

        <div className="space-y-3">
          <SectionHeader>Formation projects</SectionHeader>
          {projects.length === 0 ? (
            <p className="text-sm text-muted">
              Not participating in Formation right now.
            </p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Surface
                  key={project.title}
                  variant="panelAlt"
                  radius="xl"
                  shadow="tile"
                  className="px-4 py-3"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-text">
                      {project.title}
                    </p>
                    <Kicker>{project.status}</Kicker>
                  </div>
                  <p className="text-sm text-muted">{project.summary}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {project.chips.map((chip) => (
                      <Badge key={chip} variant="outline">
                        {chip}
                      </Badge>
                    ))}
                  </div>
                </Surface>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HumanNode;
