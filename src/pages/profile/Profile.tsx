import { useEffect, useState } from "react";
import { Card } from "@/components/primitives/card";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { SectionHeader } from "@/components/SectionHeader";
import { apiHuman } from "@/lib/apiClient";
import type { HumanNodeProfileDto, ProofKeyDto } from "@/types/api";
import { useAuth } from "@/app/auth/AuthContext";
import { buildTierRequirementItems } from "@/lib/tierProgress";
import { formatLoadError } from "@/lib/errorFormatting";
import { CmEconomyPanel } from "@/components/CmEconomyPanel";
import {
  PROOF_META,
  type ActivityFilter,
  activityMatches,
  shortAddress,
  shouldShowDetail,
} from "@/lib/profileUi";
import { ProfileActivityProjectsSection } from "./components/ProfileActivityProjectsSection";
import { ProfileDelegationSection } from "./components/ProfileDelegationSection";
import { ProfileDetailsProofsSection } from "./components/ProfileDetailsProofsSection";
import { ProfileHero } from "./components/ProfileHero";
import { ProfileTierProgressSection } from "./components/ProfileTierProgressSection";

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
    if (auth.enabled && auth.loading) {
      return;
    }
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
  }, [auth.address, auth.authenticated, auth.enabled, auth.loading]);

  const proofKeys: ProofKeyDto[] = ["time", "devotion", "governance"];
  const proofCards = proofKeys
    .map((key) =>
      profile ? { key, section: profile.proofSections[key] } : null,
    )
    .filter(
      (
        entry,
      ): entry is {
        key: ProofKeyDto;
        section: HumanNodeProfileDto["proofSections"][ProofKeyDto];
      } => Boolean(entry?.section),
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
  const historyHref = headerAddress
    ? `/app/human-nodes/${headerAddress}/history`
    : null;
  const delegationChambers = profile?.delegation?.chambers ?? [];
  const normalizedName = (profile?.name ?? "").trim().toLowerCase();
  const isGenericName = [
    "human node profile",
    "human node",
    "profile",
  ].includes(normalizedName);
  const isAddressName =
    Boolean(profile?.name && headerAddress) &&
    normalizedName === headerAddress.toLowerCase();
  const headerTitle =
    isAddressName || isGenericName
      ? shortAddress(headerAddress)
      : (profile?.name ?? "—");
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

  const showShortBadge = !isAddressName && !isGenericName;

  return (
    <div className="flex flex-col gap-6">
      {showHint ? <PageHint pageId="profile" /> : null}
      {!auth.enabled ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Auth is disabled in this build.
        </Card>
      ) : auth.loading ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Checking wallet status…
        </Card>
      ) : !auth.authenticated ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Connect a wallet to view the profile.
        </Card>
      ) : profile === null ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          {loadError
            ? `Profile unavailable: ${formatLoadError(loadError)}`
            : "Loading profile…"}
        </Card>
      ) : null}

      <ProfileHero
        copied={copied}
        headerAddress={headerAddress}
        headerTitle={headerTitle}
        onCopyAddress={() => handleCopy(headerAddress)}
        profile={profile}
        shortAddressLabel={shortAddress(headerAddress)}
        showShortBadge={showShortBadge}
        visibleHeroStats={visibleHeroStats}
      />

      <ProfileDetailsProofsSection
        proofTiles={proofTiles}
        visibleDetails={visibleDetails}
      />

      <CmEconomyPanel
        totals={cmTotals}
        chambers={cmChambers}
        history={cmHistory}
        mmValue="—"
      />

      <ProfileDelegationSection delegationChambers={delegationChambers} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ProfileActivityProjectsSection
          activityFilter={activityFilter}
          filteredActions={filteredActions}
          historyHref={historyHref}
          onActivityFilterChange={setActivityFilter}
          projects={profile?.projects ?? []}
        />

        <div className="flex flex-col gap-4">
          <ProfileTierProgressSection
            requirementItems={requirementItems}
            tierProgress={tierProgress}
          />
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
