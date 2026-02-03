import { useEffect, useState } from "react";
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
import { SectionHeader } from "@/components/SectionHeader";
import { StatTile } from "@/components/StatTile";
import { ActivityTile } from "@/components/ActivityTile";
import { apiHuman } from "@/lib/apiClient";
import type { HumanNodeProfileDto, ProofKeyDto } from "@/types/api";
import { useAuth } from "@/app/auth/AuthContext";
import { buildTierRequirementItems } from "@/lib/tierProgress";
import { CmEconomyPanel } from "@/components/CmEconomyPanel";
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

type ProfileProps = {
  showHint?: boolean;
};

const Profile: React.FC<ProfileProps> = ({ showHint = true }) => {
  const auth = useAuth();
  const [copied, setCopied] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [profile, setProfile] = useState<HumanNodeProfileDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.enabled || !auth.authenticated || !auth.address) {
      setProfile(null);
      setLoadError(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        const address = auth.address;
        if (!address) {
          if (!active) return;
          setProfile(null);
          setLoadError("Wallet address is missing.");
          return;
        }

        const res = await apiHuman(address);
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
  }, [auth.address, auth.authenticated, auth.enabled]);

  const proofKeys: ProofKeyDto[] = ["time", "devotion", "governance"];
  const proofCards = proofKeys
    .map((key) => (profile ? { key, section: profile.proofSections[key] } : null))
    .filter(
      (entry): entry is { key: ProofKeyDto; section: HumanNodeProfileDto["proofSections"][ProofKeyDto] } =>
        Boolean(entry?.section),
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

  const tierProgress = profile?.tierProgress ?? null;
  const filteredActions = (profile?.governanceActions ?? []).filter((action) =>
    activityMatches(action, activityFilter),
  );
  const requirementItems = buildTierRequirementItems(tierProgress);
  const cmHistory = profile?.cmHistory ?? [];
  const cmChambers = profile?.cmChambers ?? [];
  const cmTotals = (profile?.heroStats ?? []).reduce(
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
  const visibleHeroStats = (profile?.heroStats ?? []).filter((stat) => {
    const label = stat.label.trim().toUpperCase();
    return !["ACM", "LCM", "MCM", "MM"].includes(label);
  });
  const visibleDetails = (profile?.quickDetails ?? []).filter((detail) =>
    shouldShowDetail(detail.label),
  );
  const headerAddress = profile?.id ?? auth.address ?? "";
  const isAddressName =
    Boolean(profile?.name && headerAddress) &&
    profile?.name.toLowerCase() === headerAddress.toLowerCase();
  const headerTitle = isAddressName
    ? shortAddress(headerAddress)
    : profile?.name ?? "—";
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
      {showHint ? <PageHint pageId="profile" /> : null}
      {!auth.enabled ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Auth is disabled in this build.
        </Card>
      ) : !auth.authenticated ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Connect a wallet to view the profile.
        </Card>
      ) : profile === null ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          {loadError ? `Profile unavailable: ${loadError}` : "Loading profile…"}
        </Card>
      ) : null}

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
            <h1 className="text-3xl font-semibold text-text">{headerTitle}</h1>
            {headerAddress ? (
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
                {!isAddressName ? (
                  <Badge variant="muted">
                    {shortAddress(headerAddress)}
                  </Badge>
                ) : null}
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-surface-alt hover:text-text"
                  onClick={() => handleCopy(headerAddress)}
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <div className="space-y-3">
            <SectionHeader>Governance activity</SectionHeader>
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
              <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-scroll pr-2 sm:grid-cols-2 xl:grid-cols-3">
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
            {profile?.projects?.length ? (
              <div className="space-y-3">
                {profile.projects.map((project) => (
                  <Surface
                    key={project.title}
                    variant="panelAlt"
                    radius="xl"
                    className="px-4 py-3"
                  >
                    <div className="flex flex-col gap-1 text-center">
                      <p className="text-sm font-semibold text-text">
                        {project.title}
                      </p>
                      <Kicker align="center">{project.status}</Kicker>
                    </div>
                    <p className="text-center text-sm text-muted">
                      {project.summary}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      {project.chips.map((chip) => (
                        <Badge key={chip} variant="outline">
                          {chip}
                        </Badge>
                      ))}
                    </div>
                  </Surface>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Not participating in Formation right now.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {tierProgress ? (
            <section className="space-y-3">
              <SectionHeader>Tier progress</SectionHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <Surface
                  variant="panelAlt"
                  radius="2xl"
                  shadow="tile"
                  className="flex h-full flex-col items-center justify-center px-4 py-4 text-center"
                >
                  <Kicker align="center">Current tier</Kicker>
                  <p className="text-xl font-semibold text-text">
                    <TierLabel tier={tierProgress.tier} />
                  </p>
                </Surface>
                <Surface
                  variant="panelAlt"
                  radius="2xl"
                  shadow="tile"
                  className="flex h-full flex-col items-center justify-center px-4 py-4 text-center"
                >
                  <Kicker align="center">Next tier</Kicker>
                  <p className="text-xl font-semibold text-text">
                    {tierProgress.nextTier ? (
                      <TierLabel tier={tierProgress.nextTier} />
                    ) : (
                      "Max tier"
                    )}
                  </p>
                </Surface>
              </div>
              {requirementItems.length > 0 ? (
                <div className="grid gap-3 text-center sm:grid-cols-2">
                  {requirementItems.map((item) => (
                    <Surface
                      key={item.key}
                      variant="panelAlt"
                      radius="xl"
                      shadow="tile"
                      className="flex h-24 flex-col items-center justify-between px-3 py-3"
                    >
                      <Kicker align="center">{item.label}</Kicker>
                      <p className="text-lg font-semibold text-text">
                        {item.done} / {item.required}
                      </p>
                      <p className="text-xs text-muted">
                        {item.percent}% complete
                      </p>
                    </Surface>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  You have reached the highest available tier.
                </p>
              )}
            </section>
          ) : null}
          <section className="space-y-3">
            <SectionHeader>History</SectionHeader>
            {(profile?.history ?? []).length ? (
              (profile?.history ?? []).map((entry) => (
                <Surface
                  key={entry}
                  variant="panelAlt"
                  radius="xl"
                  shadow="tile"
                  className="px-3 py-2 text-center text-sm text-text"
                >
                  {entry}
                </Surface>
              ))
            ) : (
              <p className="text-sm text-muted">No history yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
