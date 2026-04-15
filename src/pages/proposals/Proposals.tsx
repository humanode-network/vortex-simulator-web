import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/primitives/button";
import { Card } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { SearchBar } from "@/components/SearchBar";
import { PageHint } from "@/components/PageHint";
import { ExpandableCard } from "@/components/ExpandableCard";
import { StageDataTile } from "@/components/StageDataTile";
import { DashedStatItem } from "@/components/DashedStatItem";
import { StageChip } from "@/components/StageChip";
import type { ProposalStage } from "@/types/stages";
import { CardActionsRow } from "@/components/CardActionsRow";
import { Surface } from "@/components/Surface";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { HintLabel } from "@/components/Hint";
import { getFormationProgress } from "@/lib/dtoParsers";
import { formatLoadError } from "@/lib/errorFormatting";
import { toTimestampMs } from "@/lib/dateTime";
import {
  apiProposalChamberPage,
  apiProposalChamberVetoPage,
  apiProposalCitizenVetoPage,
  apiProposalFinishedPage,
  apiProposalFormationPage,
  apiProposalPoolPage,
  apiProposals,
} from "@/lib/apiClient";
import type {
  ChamberProposalPageDto,
  ChamberVetoProposalPageDto,
  CitizenVetoProposalPageDto,
  FormationProposalPageDto,
  ProposalFinishedPageDto,
  PoolProposalPageDto,
  ProposalListItemDto,
} from "@/types/api";

function parseRatioPair(value: string): { left: number; right: number } {
  const matches = value.match(/\d+/g) ?? [];
  const leftRaw = matches[0];
  const rightRaw = matches[1];
  if (!leftRaw || !rightRaw) return { left: 0, right: 0 };
  const left = Number.parseInt(leftRaw, 10);
  const right = Number.parseInt(rightRaw, 10);
  return {
    left: Number.isFinite(left) ? left : 0,
    right: Number.isFinite(right) ? right : 0,
  };
}

function isEndedProposal(proposal: ProposalListItemDto): boolean {
  return (
    proposal.stage === "passed" ||
    proposal.stage === "failed" ||
    proposal.summaryPill === "Finished" ||
    proposal.summaryPill === "Failed"
  );
}

function hasFinishedRoute(href?: string): boolean {
  return Boolean(href?.includes("/finished"));
}

const DELIBERATION_STAT_LABELS = new Set([
  "Deliberation",
  "Open concerns",
  "Last discussion",
]);

const Proposals: React.FC = () => {
  const [proposalData, setProposalData] = useState<
    ProposalListItemDto[] | null
  >(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    stageFilter: ProposalStage | "any";
    lifecycleFilter: "active" | "all";
    chamberFilter: string;
    sortBy: "Newest" | "Oldest" | "Activity" | "Votes";
  }>({
    stageFilter: "any",
    lifecycleFilter: "active",
    chamberFilter: "All chambers",
    sortBy: "Newest",
  });
  const { stageFilter, lifecycleFilter, chamberFilter, sortBy } = filters;

  const [poolPagesById, setPoolPagesById] = useState<
    Record<string, PoolProposalPageDto | undefined>
  >({});
  const [chamberPagesById, setChamberPagesById] = useState<
    Record<string, ChamberProposalPageDto | undefined>
  >({});
  const [citizenVetoPagesById, setCitizenVetoPagesById] = useState<
    Record<string, CitizenVetoProposalPageDto | undefined>
  >({});
  const [chamberVetoPagesById, setChamberVetoPagesById] = useState<
    Record<string, ChamberVetoProposalPageDto | undefined>
  >({});
  const [formationPagesById, setFormationPagesById] = useState<
    Record<string, FormationProposalPageDto | undefined>
  >({});
  const [finishedPagesById, setFinishedPagesById] = useState<
    Record<string, ProposalFinishedPageDto | undefined>
  >({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiProposals();
        if (!active) return;
        setProposalData(res.items);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setProposalData([]);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!expanded || !proposalData) return;
    const proposal = proposalData.find((p) => p.id === expanded);
    if (!proposal) return;

    if (hasFinishedRoute(proposal.href)) {
      if (finishedPagesById[proposal.id] === undefined) {
        void apiProposalFinishedPage(proposal.id).then((page) => {
          setFinishedPagesById((curr) => ({ ...curr, [proposal.id]: page }));
        });
      }
      return;
    }

    if (proposal.stage === "pool" && poolPagesById[proposal.id] === undefined) {
      void apiProposalPoolPage(proposal.id).then((page) => {
        setPoolPagesById((curr) => ({ ...curr, [proposal.id]: page }));
      });
    }
    if (
      proposal.stage === "vote" &&
      chamberPagesById[proposal.id] === undefined
    ) {
      void apiProposalChamberPage(proposal.id).then((page) => {
        setChamberPagesById((curr) => ({ ...curr, [proposal.id]: page }));
      });
    }
    if (
      proposal.stage === "citizen_veto" &&
      citizenVetoPagesById[proposal.id] === undefined
    ) {
      void apiProposalCitizenVetoPage(proposal.id).then((page) => {
        setCitizenVetoPagesById((curr) => ({ ...curr, [proposal.id]: page }));
      });
    }
    if (
      proposal.stage === "chamber_veto" &&
      chamberVetoPagesById[proposal.id] === undefined
    ) {
      void apiProposalChamberVetoPage(proposal.id).then((page) => {
        setChamberVetoPagesById((curr) => ({ ...curr, [proposal.id]: page }));
      });
    }
    if (
      proposal.stage === "build" &&
      formationPagesById[proposal.id] === undefined
    ) {
      void apiProposalFormationPage(proposal.id).then((page) => {
        setFormationPagesById((curr) => ({ ...curr, [proposal.id]: page }));
      });
    }
  }, [
    expanded,
    proposalData,
    poolPagesById,
    chamberPagesById,
    citizenVetoPagesById,
    chamberVetoPagesById,
    formationPagesById,
    finishedPagesById,
  ]);

  const filteredProposals = useMemo(() => {
    const term = search.trim().toLowerCase();

    return (proposalData ?? [])
      .filter((proposal) => {
        const matchesTerm = term
          ? proposal.title.toLowerCase().includes(term) ||
            proposal.summary.toLowerCase().includes(term) ||
            proposal.meta.toLowerCase().includes(term) ||
            proposal.keywords.some((keyword) =>
              keyword.toLowerCase().includes(term),
            )
          : true;
        const matchesStage =
          stageFilter === "any" ? true : proposal.stage === stageFilter;
        const ended = isEndedProposal(proposal);
        const matchesLifecycle = lifecycleFilter === "all" ? true : !ended;
        const matchesChamber =
          chamberFilter === "All chambers"
            ? true
            : proposal.chamber === chamberFilter;
        return (
          matchesTerm && matchesStage && matchesLifecycle && matchesChamber
        );
      })
      .sort((a, b) => {
        if (sortBy === "Newest") {
          return toTimestampMs(b.date, -1) - toTimestampMs(a.date, -1);
        }
        if (sortBy === "Oldest") {
          return toTimestampMs(a.date, -1) - toTimestampMs(b.date, -1);
        }
        if (sortBy === "Activity") {
          return b.activityScore - a.activityScore;
        }
        if (sortBy === "Votes") {
          return b.votes - a.votes;
        }
        return 0;
      });
  }, [
    proposalData,
    search,
    stageFilter,
    lifecycleFilter,
    chamberFilter,
    sortBy,
  ]);

  const chamberOptions = useMemo(() => {
    const unique = Array.from(
      new Set((proposalData ?? []).map((p) => p.chamber)),
    ).sort((a, b) => a.localeCompare(b));
    return [
      { value: "All chambers", label: "All chambers" },
      ...unique.map((chamber) => ({ value: chamber, label: chamber })),
    ];
  }, [proposalData]);

  const toggleProposal = (id: string) => {
    setExpanded((current) => (current === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="rounded-full px-4"
        >
          <Link to="/app/proposals/drafts">Drafts</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button asChild size="sm" className="rounded-full px-4">
            <Link to="/app/proposals/new">Create proposal</Link>
          </Button>
        </div>
      </div>

      <SearchBar
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search proposals by title, hash, proposer…"
        ariaLabel="Search proposals"
        filtersConfig={[
          {
            key: "stageFilter",
            label: "Status",
            options: [
              { value: "any", label: "Any" },
              { value: "pool", label: "Proposal pool" },
              { value: "vote", label: "Chamber vote" },
              { value: "citizen_veto", label: "Citizen veto" },
              { value: "chamber_veto", label: "Chamber veto" },
              { value: "build", label: "Formation" },
              { value: "passed", label: "Passed" },
              { value: "failed", label: "Ended (failed)" },
            ],
          },
          {
            key: "lifecycleFilter",
            label: "Lifecycle",
            options: [
              { value: "active", label: "Active only" },
              { value: "all", label: "Include ended" },
            ],
          },
          {
            key: "chamberFilter",
            label: "Chamber",
            options: chamberOptions,
          },
          {
            key: "sortBy",
            label: "Sort by",
            options: [
              { value: "Newest", label: "Newest" },
              { value: "Oldest", label: "Oldest" },
              { value: "Activity", label: "Activity" },
              { value: "Votes", label: "Votes cast" },
            ],
          },
        ]}
        filtersState={filters}
        onFiltersChange={setFilters}
      />

      {proposalData === null ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          Loading proposals…
        </Surface>
      ) : null}
      {loadError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-destructive"
        >
          Proposals unavailable: {formatLoadError(loadError)}
        </Surface>
      ) : null}

      {proposalData !== null && proposalData.length === 0 && !loadError ? (
        <NoDataYetBar label="proposals" />
      ) : null}

      <section aria-live="polite" className="flex flex-col gap-4">
        {proposalData !== null &&
          proposalData.length > 0 &&
          filteredProposals.length === 0 && (
            <Card className="border-dashed px-5 py-6 text-center text-sm text-muted">
              No proposals match the current search.
            </Card>
          )}

        {filteredProposals.map((proposal) =>
          // Collapsed state stays lightweight; expanded state is stage-aware.
          // Collapsed preview and expanded content are stage-aware, but always
          // keep the same "card skeleton": summary + stage module + key stats.
          (() => {
            const poolPage =
              proposal.stage === "pool" ? poolPagesById[proposal.id] : null;
            const chamberPage =
              proposal.stage === "vote" ? chamberPagesById[proposal.id] : null;
            const citizenVetoPage =
              proposal.stage === "citizen_veto"
                ? citizenVetoPagesById[proposal.id]
                : null;
            const chamberVetoPage =
              proposal.stage === "chamber_veto"
                ? chamberVetoPagesById[proposal.id]
                : null;
            const formationPage =
              proposal.stage === "build"
                ? formationPagesById[proposal.id]
                : null;
            const finishedPage = hasFinishedRoute(proposal.href)
              ? (finishedPagesById[proposal.id] ?? null)
              : null;
            const stageForChip: ProposalStage = proposal.stage;

            const poolStats =
              proposal.stage === "pool" && poolPage
                ? (() => {
                    const activeGovernors = Math.max(
                      1,
                      poolPage.activeGovernors,
                    );
                    const { left: filledSlots, right: totalSlots } =
                      parseRatioPair(poolPage.teamSlots);
                    const openSlots = Math.max(totalSlots - filledSlots, 0);
                    const milestonesCount = Number(poolPage.milestones);
                    const engaged = poolPage.upvotes + poolPage.downvotes;
                    const attentionPercent = Math.round(
                      (engaged / activeGovernors) * 100,
                    );
                    const attentionNeededPercent = Math.round(
                      poolPage.attentionQuorum * 100,
                    );
                    const upvoteFloorFractionPercent = Math.round(
                      ((poolPage.thresholdContext?.quorumThreshold
                        ?.upvoteFloorFraction ?? 0.1) *
                        1000) /
                        10,
                    );
                    const upvoteFloorProgressPercent = Math.round(
                      Math.min(
                        1,
                        poolPage.upvoteFloor > 0
                          ? poolPage.upvotes / poolPage.upvoteFloor
                          : 0,
                      ) * upvoteFloorFractionPercent,
                    );
                    const engagedNeeded = Math.min(
                      activeGovernors,
                      Math.max(
                        1,
                        Math.ceil(poolPage.attentionQuorum * activeGovernors),
                      ),
                    );
                    const meetsAttention = engaged >= engagedNeeded;
                    const meetsUpvoteFloor =
                      poolPage.upvotes >= poolPage.upvoteFloor;

                    return {
                      activeGovernors,
                      filledSlots,
                      openSlots,
                      milestonesCount: Number.isFinite(milestonesCount)
                        ? milestonesCount
                        : poolPage.milestones,
                      engaged,
                      attentionPercent,
                      attentionNeededPercent,
                      upvoteFloorFractionPercent,
                      upvoteFloorProgressPercent,
                      meetsAttention,
                      meetsUpvoteFloor,
                      engagedNeeded,
                      upvoteFloor: poolPage.upvoteFloor,
                    };
                  })()
                : null;

            const chamberStats =
              proposal.stage === "vote" && chamberPage
                ? (() => {
                    const activeGovernors = Math.max(
                      1,
                      chamberPage.activeGovernors,
                    );
                    const yesTotal = chamberPage.votes.yes;
                    const noTotal = chamberPage.votes.no;
                    const abstainTotal = chamberPage.votes.abstain;
                    const totalVotes = yesTotal + noTotal + abstainTotal;

                    // Derive engaged from chamber vote totals to avoid mixing in
                    // any pre-vote/pool counters.
                    const engaged = totalVotes;
                    const quorumNeeded = chamberPage.quorumNeeded;
                    const quorumPercent = Math.round(
                      (engaged / activeGovernors) * 100,
                    );
                    const quorumNeededPercent = Math.round(
                      (quorumNeeded / activeGovernors) * 100,
                    );
                    const yesPercentOfQuorum =
                      engaged > 0 ? Math.round((yesTotal / engaged) * 100) : 0;

                    const { left: filledSlots, right: totalSlots } =
                      parseRatioPair(chamberPage.teamSlots);
                    const openSlots = Math.max(totalSlots - filledSlots, 0);

                    const meetsQuorum = engaged >= quorumNeeded;
                    const meetsPassing = yesPercentOfQuorum >= 66.6;

                    const yesWidth = totalVotes
                      ? (yesTotal / totalVotes) * 100
                      : 0;
                    const noWidth = totalVotes
                      ? (noTotal / totalVotes) * 100
                      : 0;
                    const abstainWidth = totalVotes
                      ? (abstainTotal / totalVotes) * 100
                      : 0;

                    return {
                      activeGovernors,
                      yesTotal,
                      noTotal,
                      abstainTotal,
                      totalVotes,
                      engaged,
                      quorumNeeded,
                      quorumPercent,
                      quorumNeededPercent,
                      yesPercentOfQuorum,
                      meetsQuorum,
                      meetsPassing,
                      yesWidth,
                      noWidth,
                      abstainWidth,
                      openSlots,
                    };
                  })()
                : null;

            const formationStats =
              proposal.stage === "build" && formationPage
                ? getFormationProgress(formationPage)
                : null;
            const baseKeyStats =
              proposal.stage === "pool" && poolPage && poolStats
                ? poolPage.formationEligible
                  ? [
                      {
                        label: "Budget ask",
                        value: poolPage.budget,
                      },
                      {
                        label: "Formation",
                        value: "Yes",
                      },
                      {
                        label: "Team slots",
                        value: `${poolPage.teamSlots} (open: ${poolStats.openSlots})`,
                      },
                      {
                        label: "Milestones",
                        value: `${poolStats.milestonesCount} planned`,
                      },
                    ]
                  : []
                : proposal.stage === "vote" && chamberPage && chamberStats
                  ? chamberPage.formationEligible
                    ? [
                        {
                          label: "Budget ask",
                          value: chamberPage.budget,
                        },
                        {
                          label: "Formation",
                          value: "Yes",
                        },
                        {
                          label: "Team slots",
                          value: `${chamberPage.teamSlots} (open: ${chamberStats.openSlots})`,
                        },
                        {
                          label: "Milestones",
                          value: `${chamberPage.milestones} planned`,
                        },
                      ]
                    : []
                  : proposal.stage === "citizen_veto" && citizenVetoPage
                    ? citizenVetoPage.stats
                    : proposal.stage === "chamber_veto" && chamberVetoPage
                      ? chamberVetoPage.stats
                      : finishedPage
                        ? finishedPage.stats
                        : proposal.stage === "build" && formationPage
                          ? [
                              {
                                label: "Budget ask",
                                value: formationPage.budget,
                              },
                              {
                                label: "Time left",
                                value: formationPage.timeLeft,
                              },
                              {
                                label: "Team slots",
                                value: formationPage.teamSlots,
                              },
                              {
                                label: "Milestones",
                                value: formationPage.milestones,
                              },
                              ...formationPage.stats,
                            ]
                          : proposal.stats;
            const deliberationStats = proposal.stats.filter((stat) =>
              DELIBERATION_STAT_LABELS.has(stat.label),
            );
            const keyStats = [
              ...baseKeyStats,
              ...deliberationStats.filter(
                (stat) =>
                  !baseKeyStats.some((item) => item.label === stat.label),
              ),
            ];

            return (
              <ExpandableCard
                key={proposal.id}
                expanded={expanded === proposal.id}
                onToggle={() => toggleProposal(proposal.id)}
                title={proposal.title}
                right={
                  <>
                    <StageChip
                      stage={stageForChip}
                      label={
                        proposal.summaryPill === "Finished"
                          ? "Finished"
                          : undefined
                      }
                    />
                    <Badge variant="muted" size="sm">
                      {proposal.chamber.replace(/\s*chamber\s*$/i, "")}
                    </Badge>
                    <Badge variant="muted" size="sm">
                      {proposal.tier}
                    </Badge>
                  </>
                }
              >
                <section className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-text">Summary</p>
                    <p className="text-sm text-muted">{proposal.summary}</p>
                  </div>

                  {finishedPage ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-text">
                        Outcome status
                      </p>
                      <Surface
                        variant="panelAlt"
                        radius="2xl"
                        shadow="tile"
                        className="px-5 py-4 text-sm text-muted"
                      >
                        {finishedPage.terminalSummary}
                      </Surface>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {finishedPage.stageData.map((item, index) => (
                          <StageDataTile
                            key={`${proposal.id}-finished-${index}`}
                            title={item.title}
                            description={item.description}
                            value={item.value}
                          />
                        ))}
                      </div>
                    </div>
                  ) : hasFinishedRoute(proposal.href) ? (
                    <Surface
                      variant="panelAlt"
                      radius="2xl"
                      shadow="tile"
                      className="px-5 py-4 text-sm text-muted"
                    >
                      Loading outcome details…
                    </Surface>
                  ) : proposal.stage === "pool" && poolPage && poolStats ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-text">
                        Quorum of attention
                      </p>

                      <Surface
                        variant="panelAlt"
                        radius="2xl"
                        shadow="tile"
                        className="flex flex-wrap items-center justify-center gap-4 px-6 py-5 text-lg font-semibold"
                      >
                        <span className="text-accent">
                          {poolPage.upvotes} upvotes
                        </span>
                        <span className="text-muted">·</span>
                        <span className="text-destructive">
                          {poolPage.downvotes} downvotes
                        </span>
                        <span className="text-muted">·</span>
                        <span className="text-text">
                          {poolStats.engaged} / {poolStats.activeGovernors}{" "}
                          engaged
                        </span>
                      </Surface>

                      <div className="grid gap-3 md:grid-cols-2">
                        <StageDataTile
                          title={
                            <HintLabel
                              termId="quorum_of_attention"
                              termText="Attention quorum"
                            />
                          }
                          description={`Engaged ${poolStats.engaged} / ${poolStats.engagedNeeded} governors`}
                          value={`${poolStats.attentionPercent}% / ${poolStats.attentionNeededPercent}%`}
                          tone={poolStats.meetsAttention ? "ok" : "warn"}
                        />
                        <StageDataTile
                          title={
                            <HintLabel
                              termId="upvote_floor"
                              termText="Upvote floor"
                            />
                          }
                          description={`Upvotes ${poolPage.upvotes} / ${poolStats.upvoteFloor} governors`}
                          value={`${poolStats.upvoteFloorProgressPercent}% / ${poolStats.upvoteFloorFractionPercent}%`}
                          tone={poolStats.meetsUpvoteFloor ? "ok" : "warn"}
                        />
                      </div>

                      <p className="text-xs text-muted">
                        To move to chamber vote, the pool must meet both the
                        attention quorum and the upvote floor.
                      </p>
                    </div>
                  ) : proposal.stage === "vote" &&
                    chamberPage &&
                    chamberStats ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-text">
                        Vote snapshot
                      </p>

                      <Surface
                        variant="panelAlt"
                        radius="2xl"
                        shadow="tile"
                        className="space-y-3 px-5 py-4"
                      >
                        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                          <div className="flex h-full w-full">
                            <div
                              className="h-full bg-accent"
                              style={{ width: `${chamberStats.yesWidth}%` }}
                            />
                            <div
                              className="h-full bg-destructive"
                              style={{ width: `${chamberStats.noWidth}%` }}
                            />
                            <div
                              className="h-full bg-muted"
                              style={{ width: `${chamberStats.abstainWidth}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-accent" />
                              Yes {chamberStats.yesTotal}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-destructive" />
                              No {chamberStats.noTotal}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-muted" />
                              Abstain {chamberStats.abstainTotal}
                            </span>
                          </div>
                          <span>
                            Total {chamberStats.totalVotes} · Time left{" "}
                            {chamberPage.timeLeft}
                          </span>
                        </div>
                      </Surface>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <StageDataTile
                          title="Voting quorum"
                          description={`Governors ${chamberStats.engaged} / ${chamberStats.activeGovernors} (needs ${chamberStats.quorumNeeded})`}
                          value={`${chamberStats.quorumPercent}% / ${chamberStats.quorumNeededPercent}%`}
                          tone={chamberStats.meetsQuorum ? "ok" : "warn"}
                        />
                        <StageDataTile
                          title="Passing"
                          description={chamberPage.passingRule}
                          value={`${chamberStats.yesPercentOfQuorum}% yes`}
                          tone={chamberStats.meetsPassing ? "ok" : "warn"}
                        />
                        <StageDataTile
                          title="Time left"
                          description="Voting window"
                          value={chamberPage.timeLeft}
                        />
                      </div>

                      <p className="text-xs text-muted">
                        {chamberPage.formationEligible
                          ? "If this passes, it moves to Formation for execution."
                          : "If this passes, it stays a non-formation governance decision."}
                      </p>
                    </div>
                  ) : proposal.stage === "citizen_veto" && citizenVetoPage ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-text">
                        Citizen veto snapshot
                      </p>
                      <Surface
                        variant="panelAlt"
                        radius="2xl"
                        shadow="tile"
                        className="px-5 py-4 text-sm text-muted"
                      >
                        Citizen-tier voters can remand this approved decision
                        for reconsideration. Attempts used:{" "}
                        {citizenVetoPage.attemptsUsed} /{" "}
                        {citizenVetoPage.attemptsUsed +
                          citizenVetoPage.attemptsRemaining}
                        .
                      </Surface>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {citizenVetoPage.stageData.map((item, index) => (
                          <StageDataTile
                            key={`${proposal.id}-citizen-veto-${index}`}
                            title={item.title}
                            description={item.description}
                            value={item.value}
                            tone={item.tone}
                          />
                        ))}
                      </div>
                    </div>
                  ) : proposal.stage === "chamber_veto" && chamberVetoPage ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-text">
                        Chamber veto snapshot
                      </p>
                      <Surface
                        variant="panelAlt"
                        radius="2xl"
                        shadow="tile"
                        className="px-5 py-4 text-sm text-muted"
                      >
                        {chamberVetoPage.vetoingChambers} /{" "}
                        {chamberVetoPage.chamberThreshold} chambers currently
                        count as vetoing.
                      </Surface>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {chamberVetoPage.stageData.map((item, index) => (
                          <StageDataTile
                            key={`${proposal.id}-chamber-veto-${index}`}
                            title={item.title}
                            description={item.description}
                            value={item.value}
                            tone={item.tone}
                          />
                        ))}
                      </div>
                    </div>
                  ) : proposal.stage === "build" &&
                    formationPage &&
                    formationStats ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-text">
                        Execution snapshot
                      </p>

                      <Surface
                        variant="panelAlt"
                        radius="2xl"
                        shadow="tile"
                        className="space-y-3 px-5 py-4"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-text">
                            Progress
                          </span>
                          <span className="font-semibold text-text">
                            {formationPage.progress}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                          <div
                            className="h-full bg-accent"
                            style={{
                              width: `${Math.min(
                                Math.max(formationStats.progressValue, 0),
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                          <span>
                            Milestones {formationStats.milestones.a} /{" "}
                            {formationStats.milestones.b}
                          </span>
                          <span>
                            Team {formationStats.team.a} /{" "}
                            {formationStats.team.b}
                          </span>
                          <span>Time left {formationPage.timeLeft}</span>
                        </div>
                      </Surface>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {formationPage.stageData
                          .slice(0, 3)
                          .map((item, index) => (
                            <StageDataTile
                              key={`${proposal.id}-formation-${index}`}
                              title={item.title}
                              description={item.description}
                              value={item.value}
                            />
                          ))}
                      </div>
                    </div>
                  ) : proposal.stage === "vote" ? (
                    <Surface
                      variant="panelAlt"
                      radius="2xl"
                      shadow="tile"
                      className="px-5 py-4 text-sm text-muted"
                    >
                      Loading chamber vote stats…
                    </Surface>
                  ) : proposal.stage === "citizen_veto" ? (
                    <Surface
                      variant="panelAlt"
                      radius="2xl"
                      shadow="tile"
                      className="px-5 py-4 text-sm text-muted"
                    >
                      Loading citizen veto stats…
                    </Surface>
                  ) : proposal.stage === "chamber_veto" ? (
                    <Surface
                      variant="panelAlt"
                      radius="2xl"
                      shadow="tile"
                      className="px-5 py-4 text-sm text-muted"
                    >
                      Loading chamber veto stats…
                    </Surface>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-text">
                        Stage data
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {proposal.stageData.map((item, index) => (
                          <StageDataTile
                            key={`${proposal.id}-stage-${index}`}
                            title={item.title}
                            description={item.description}
                            value={item.value}
                            tone={item.tone}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {keyStats.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-text">
                        Key stats
                      </p>
                      <ul className="grid gap-2 text-sm text-text sm:grid-cols-2">
                        {keyStats.map((stat) => (
                          <DashedStatItem
                            key={`${proposal.id}-stat-${stat.label}`}
                            label={stat.label}
                            value={stat.value}
                          />
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {proposal.tags.map((tag) => (
                      <Badge key={tag} variant="muted" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <CardActionsRow
                    proposer={proposal.proposer}
                    proposerId={proposal.proposerId}
                    primaryHref={
                      proposal.href ??
                      (proposal.stage === "pool"
                        ? `/app/proposals/${proposal.id}/pp`
                        : proposal.stage === "vote"
                          ? `/app/proposals/${proposal.id}/chamber`
                          : proposal.stage === "citizen_veto"
                            ? `/app/proposals/${proposal.id}/citizen-veto`
                            : proposal.stage === "chamber_veto"
                              ? `/app/proposals/${proposal.id}/chamber-veto`
                              : proposal.stage === "passed"
                                ? `/app/proposals/${proposal.id}/finished`
                                : proposal.stage === "build"
                                  ? proposal.summaryPill === "Finished"
                                    ? `/app/proposals/${proposal.id}/finished`
                                    : `/app/proposals/${proposal.id}/formation`
                                  : `/app/proposals/${proposal.id}/pp`)
                    }
                    primaryLabel={proposal.ctaPrimary}
                  />
                </section>
              </ExpandableCard>
            );
          })(),
        )}
      </section>
    </div>
  );
};

export default Proposals;
