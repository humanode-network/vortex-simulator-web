import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Card } from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/primitives/badge";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { AvatarPlaceholder } from "@/components/AvatarPlaceholder";
import { StatusPill } from "@/components/StatusPill";
import { Kicker } from "@/components/Kicker";
import { TierLabel } from "@/components/TierLabel";
import { ToggleGroup } from "@/components/ToggleGroup";
import { CmEconomyPanel } from "@/components/CmEconomyPanel";
import { SectionHeader } from "@/components/SectionHeader";
import { StatTile } from "@/components/StatTile";
import { ActivityTile } from "@/components/ActivityTile";
import { AddressInline } from "@/components/AddressInline";
import {
  apiDelegationClear,
  apiDelegationSet,
  apiHuman,
  apiMyGovernance,
} from "@/lib/apiClient";
import { addressesReferToSameIdentity } from "@/lib/addressIdentity";
import { formatLoadError } from "@/lib/errorFormatting";
import type {
  GetMyGovernanceResponse,
  HumanNodeProfileDto,
  ProofKeyDto,
} from "@/types/api";
import { useAuth } from "@/app/auth/AuthContext";
import { Check, Copy } from "lucide-react";
import {
  ACTIVITY_FILTERS,
  DETAIL_TILE_CLASS,
  PROOF_META,
  PROOF_TILE_CLASS,
  type ActivityFilter,
  activityMatches,
  normalizeDetailValue,
  shortAddress,
  shouldShowDetail,
} from "@/lib/profileUi";

const chamberLabel = (chamberId: string): string =>
  chamberId === "general" ? "General chamber" : chamberId;

const HumanNode: React.FC = () => {
  const auth = useAuth();
  const { id } = useParams();
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<HumanNodeProfileDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewerGovernance, setViewerGovernance] =
    useState<GetMyGovernanceResponse | null>(null);
  const [delegationPendingByChamber, setDelegationPendingByChamber] = useState<
    Record<string, boolean>
  >({});
  const [delegationErrorByChamber, setDelegationErrorByChamber] = useState<
    Record<string, string | null>
  >({});

  const refreshProfile = async (targetId: string) => {
    const res = await apiHuman(targetId);
    setProfile(res);
    setLoadError(null);
  };

  const refreshViewerGovernance = async () => {
    const res = await apiMyGovernance();
    setViewerGovernance(res);
  };

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

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiMyGovernance();
        if (!active) return;
        setViewerGovernance(res);
      } catch {
        if (!active) return;
        setViewerGovernance(null);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const delegationChambers = profile?.delegation?.chambers ?? [];
  const profileDelegationEligibleChambers =
    profile?.delegationEligibleChambers ?? [];
  const viewerDelegationByChamber = useMemo(() => {
    const out = new Map<
      string,
      GetMyGovernanceResponse["delegation"]["chambers"][number]
    >();
    for (const item of viewerGovernance?.delegation.chambers ?? []) {
      out.set(item.chamberId, item);
    }
    return out;
  }, [viewerGovernance]);
  const delegationCards = useMemo(() => {
    const byChamber = new Map<
      string,
      HumanNodeProfileDto["delegation"]["chambers"][number]
    >();
    for (const item of delegationChambers) {
      byChamber.set(item.chamberId, item);
    }
    for (const chamberId of profileDelegationEligibleChambers) {
      if (!byChamber.has(chamberId)) {
        byChamber.set(chamberId, {
          chamberId,
          delegateeAddress: null,
          inboundWeight: 0,
          inboundDelegators: [],
        });
      }
    }
    return [...byChamber.values()].sort((a, b) =>
      a.chamberId.localeCompare(b.chamberId),
    );
  }, [delegationChambers, profileDelegationEligibleChambers]);
  const manageableChambers = useMemo(() => {
    const targetEligible = new Set(profileDelegationEligibleChambers);
    return (viewerGovernance?.delegation.chambers ?? [])
      .filter((item) => targetEligible.has(item.chamberId))
      .sort((a, b) => a.chamberId.localeCompare(b.chamberId));
  }, [
    profileDelegationEligibleChambers,
    viewerGovernance?.delegation.chambers,
  ]);

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
  const normalizedName = name.trim().toLowerCase();
  const isGenericName = [
    "human node profile",
    "human node",
    "profile",
  ].includes(normalizedName);
  const isAddressName = normalizedName === profile.id.toLowerCase();
  const headerTitle =
    isAddressName || isGenericName ? shortAddress(profile.id) : name;
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

  const showShortBadge = !isAddressName && !isGenericName;
  const isSelfProfile = addressesReferToSameIdentity(auth.address, profile.id);

  const handleDelegateHere = async (chamberId: string) => {
    if (!id) return;
    try {
      setDelegationPendingByChamber((current) => ({
        ...current,
        [chamberId]: true,
      }));
      setDelegationErrorByChamber((current) => ({
        ...current,
        [chamberId]: null,
      }));
      await apiDelegationSet({
        chamberId,
        delegateeAddress: profile.id,
        idempotencyKey: crypto.randomUUID(),
      });
      await Promise.all([refreshProfile(id), refreshViewerGovernance()]);
    } catch (error) {
      setDelegationErrorByChamber((current) => ({
        ...current,
        [chamberId]: formatLoadError((error as Error).message),
      }));
    } finally {
      setDelegationPendingByChamber((current) => ({
        ...current,
        [chamberId]: false,
      }));
    }
  };

  const handleClearDelegation = async (chamberId: string) => {
    if (!id) return;
    try {
      setDelegationPendingByChamber((current) => ({
        ...current,
        [chamberId]: true,
      }));
      setDelegationErrorByChamber((current) => ({
        ...current,
        [chamberId]: null,
      }));
      await apiDelegationClear({
        chamberId,
        idempotencyKey: crypto.randomUUID(),
      });
      await Promise.all([refreshProfile(id), refreshViewerGovernance()]);
    } catch (error) {
      setDelegationErrorByChamber((current) => ({
        ...current,
        [chamberId]: formatLoadError((error as Error).message),
      }));
    } finally {
      setDelegationPendingByChamber((current) => ({
        ...current,
        [chamberId]: false,
      }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
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
            <h1 className="text-2xl font-semibold text-text sm:text-3xl">
              {headerTitle}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
              {showShortBadge ? (
                <Badge variant="muted">{shortAddress(profile.id)}</Badge>
              ) : null}
              <button
                type="button"
                className="hover:bg-surface-alt inline-flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:text-text"
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
                  normalizeDetailValue(detail.label, detail.value)
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

      {delegationCards.length > 0 ? (
        <section className="space-y-4">
          <SectionHeader>Delegation</SectionHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {delegationCards.map((item) => {
              const viewerItem =
                viewerDelegationByChamber.get(item.chamberId) ?? null;
              const viewerAlreadyDelegatesHere = addressesReferToSameIdentity(
                viewerItem?.delegateeAddress,
                profile.id,
              );
              const canManage =
                !isSelfProfile &&
                manageableChambers.some(
                  (chamber) => chamber.chamberId === item.chamberId,
                );
              const pending =
                delegationPendingByChamber[item.chamberId] ?? false;

              return (
                <Surface
                  key={item.chamberId}
                  variant="panelAlt"
                  radius="xl"
                  shadow="tile"
                  className="space-y-3 px-4 py-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Kicker>{chamberLabel(item.chamberId)}</Kicker>
                    <Badge variant="outline">
                      Inbound {item.inboundWeight}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                      Current delegate
                    </p>
                    {item.delegateeAddress ? (
                      <AddressInline
                        address={item.delegateeAddress}
                        textClassName="text-sm text-text"
                      />
                    ) : (
                      <p className="text-sm text-text">No delegate set</p>
                    )}
                  </div>
                  {item.inboundDelegators.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                        Delegated by
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.inboundDelegators.map((delegator) => (
                          <Badge key={delegator} variant="muted">
                            {shortAddress(delegator)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {canManage ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={pending || viewerAlreadyDelegatesHere}
                          onClick={() =>
                            void handleDelegateHere(item.chamberId)
                          }
                        >
                          {viewerAlreadyDelegatesHere
                            ? "Delegated here"
                            : "Delegate here"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={pending || !viewerAlreadyDelegatesHere}
                          onClick={() =>
                            void handleClearDelegation(item.chamberId)
                          }
                        >
                          Undelegate
                        </Button>
                      </div>
                      {viewerItem?.delegateeAddress &&
                      !viewerAlreadyDelegatesHere ? (
                        <p className="text-xs text-muted">
                          You currently delegate this chamber to{" "}
                          <span className="font-semibold text-text">
                            {shortAddress(viewerItem.delegateeAddress)}
                          </span>
                          .
                        </p>
                      ) : null}
                      {delegationErrorByChamber[item.chamberId] ? (
                        <p className="text-sm text-danger">
                          {delegationErrorByChamber[item.chamberId]}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </Surface>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
              setActivityFilter((val as typeof activityFilter) || "all")
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
