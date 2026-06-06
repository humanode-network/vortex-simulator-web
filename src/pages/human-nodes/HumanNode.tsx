import { useState } from "react";
import { useParams } from "react-router";
import { Card } from "@/components/primitives/card";
import { HintLabel } from "@/components/Hint";
import { CmEconomyPanel } from "@/components/CmEconomyPanel";
import { addressesReferToSameIdentity } from "@/lib/addressIdentity";
import { formatLoadError } from "@/lib/errorFormatting";
import type { ProofKeyDto } from "@/types/api";
import { useAuth } from "@/app/auth/AuthContext";
import { buildTierRequirementItems } from "@/lib/tierProgress";
import {
  PROOF_META,
  type ActivityFilter,
  activityMatches,
  shortAddress,
  shouldShowDetail,
} from "@/lib/profileUi";
import {
  getHumanNodeCmTotals,
  getHumanNodeDelegationCards,
  getHumanNodeHeaderTitle,
  getHumanNodeManageableDelegationChambers,
  getHumanNodeViewerDelegationByChamber,
  getHumanNodeVisibleHeroStats,
  shouldShowHumanNodeShortBadge,
} from "@/lib/humanNodesUi";
import { HumanNodeDelegationSection } from "./components/HumanNodeDelegationSection";
import { HumanNodeDetailsProofsSection } from "./components/HumanNodeDetailsProofsSection";
import { HumanNodeHero } from "./components/HumanNodeHero";
import { useHumanNodeDelegationActions } from "./hooks/useHumanNodeDelegationActions";
import { useHumanNodePageData } from "./hooks/useHumanNodePageData";
import {
  ProfileFormationProjectsSection,
  ProfileGovernanceActivitySection,
} from "@/pages/profile/components/ProfileActivityProjectsSection";
import { ProfileTierProgressSection } from "@/pages/profile/components/ProfileTierProgressSection";

const HumanNode: React.FC = () => {
  const auth = useAuth();
  const { id } = useParams();
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [copied, setCopied] = useState(false);
  const {
    loadError,
    profile,
    refreshProfile,
    refreshViewerGovernance,
    viewerGovernance,
  } = useHumanNodePageData(id);
  const {
    delegationErrorByChamber,
    delegationPendingByChamber,
    handleClearDelegation,
    handleDelegateHere,
  } = useHumanNodeDelegationActions({
    profileId: profile?.id ?? "",
    refreshProfile,
    refreshViewerGovernance,
    routeId: id,
  });

  const delegationChambers = profile?.delegation?.chambers ?? [];
  const profileDelegationEligibleChambers =
    profile?.delegationEligibleChambers ?? [];
  const viewerDelegationByChamber =
    getHumanNodeViewerDelegationByChamber(viewerGovernance);
  const delegationCards = getHumanNodeDelegationCards(
    delegationChambers,
    profileDelegationEligibleChambers,
  );
  const manageableChambers = getHumanNodeManageableDelegationChambers(
    viewerGovernance,
    profileDelegationEligibleChambers,
  );

  if (!profile) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          {loadError
            ? `Human profile unavailable: ${formatLoadError(loadError)}`
            : "Loading profile…"}
        </Card>
      </div>
    );
  }

  const {
    governorActive,
    humanNodeActive,
    heroStats,
    quickDetails,
    proofSections,
    governanceActions,
    projects,
    tierProgress,
    cmHistory = [],
    cmChambers = [],
  } = profile;
  const headerTitle = getHumanNodeHeaderTitle(profile);
  const visibleHeroStats = getHumanNodeVisibleHeroStats(heroStats ?? []).filter(
    (stat) => stat.label.trim().toUpperCase() !== "ACM",
  );
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
        section: NonNullable<typeof profile>["proofSections"][ProofKeyDto];
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

  const cmTotals = getHumanNodeCmTotals(heroStats);
  const filteredActions = governanceActions.filter((action) =>
    activityMatches(action, activityFilter),
  );
  const requirementItems = buildTierRequirementItems(tierProgress ?? null);
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

  const showShortBadge = shouldShowHumanNodeShortBadge(profile);
  const isSelfProfile = addressesReferToSameIdentity(auth.address, profile.id);

  return (
    <div className="flex flex-col gap-6">
      <HumanNodeHero
        copied={copied}
        governorActive={governorActive}
        headerTitle={headerTitle}
        humanNodeActive={humanNodeActive}
        onCopyAddress={() => handleCopy(profile.id)}
        profile={profile}
        shortAddressLabel={shortAddress(profile.id)}
        showShortBadge={showShortBadge}
        visibleHeroStats={visibleHeroStats}
      />

      <HumanNodeDetailsProofsSection
        proofTiles={proofTiles}
        visibleDetails={visibleDetails}
      />

      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)]">
        <ProfileFormationProjectsSection
          className="h-full"
          projects={projects}
        />

        <ProfileTierProgressSection
          className="h-full"
          requirementItems={requirementItems}
          tierProgress={tierProgress ?? null}
        />
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-3">
        <CmEconomyPanel
          className="h-full"
          totals={cmTotals}
          chambers={cmChambers}
          history={cmHistory}
          mmValue={cmTotals.acm}
          totalsScope="personal"
        />

        <HumanNodeDelegationSection
          className="h-full"
          delegationCards={delegationCards}
          delegationErrorByChamber={delegationErrorByChamber}
          delegationPendingByChamber={delegationPendingByChamber}
          isSelfProfile={isSelfProfile}
          manageableChambers={manageableChambers}
          onClearDelegation={(chamberId) =>
            void handleClearDelegation(chamberId)
          }
          onDelegateHere={(chamberId) => void handleDelegateHere(chamberId)}
          profileId={profile.id}
          viewerDelegationByChamber={viewerDelegationByChamber}
        />

        <ProfileGovernanceActivitySection
          className="h-full"
          activityFilter={activityFilter}
          filteredActions={filteredActions}
          historyHref={`/app/human-nodes/${id ?? ""}/history`}
          onActivityFilterChange={setActivityFilter}
        />
      </div>
    </div>
  );
};

export default HumanNode;
