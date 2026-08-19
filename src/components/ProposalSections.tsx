import type { ReactNode } from "react";

import {
  AttachmentList,
  type AttachmentItem,
} from "@/components/AttachmentList";
import { AddressInline } from "@/components/AddressInline";
import { CourtReportButton } from "@/pages/courts/CourtReportButton";
import { SectionHeader } from "@/components/SectionHeader";
import { StatTile } from "@/components/StatTile";
import { Surface } from "@/components/Surface";
import { TitledSurface } from "@/components/TitledSurface";
import { formatDateTime } from "@/lib/dateTime";
import { formatProposalType } from "@/lib/proposalTypes";
import { Link } from "react-router";
import { ProposalNarrative } from "@/components/ProposalNarrative";
import { SYSTEM_ACTIONS } from "@/pages/proposals/proposalCreation/templates/systemActions";
import type { ProposalAuthoringDetailsDto } from "@/types/api";

export type ProposalSummaryStat = {
  label: string;
  value: ReactNode;
};

export type ProposalTeamMember = {
  name: string;
  role: string;
};

export type ProposalOpenSlot = {
  title: string;
  desc: string;
};

export type ProposalMilestoneDetail = {
  title: string;
  desc: string;
};

export type ProposalTimelineItem = {
  id: string;
  actionId?: string;
  timestamp: string;
  title: string;
  detail?: string;
  actor?: string;
  snapshot?: {
    fromStage: "pool" | "vote" | "citizen_veto" | "chamber_veto" | "build";
    toStage:
      | "vote"
      | "citizen_veto"
      | "chamber_veto"
      | "build"
      | "passed"
      | "failed";
    reason?: string;
    milestoneIndex?: number | null;
    metrics: Array<{ label: string; value: string }>;
  };
};

type ProposalSummaryCardProps = {
  summary: string;
  stats: ProposalSummaryStat[];
  overview: string;
  executionPlan: string[];
  budgetScope: string;
  attachments: AttachmentItem[];
  showExecutionPlan?: boolean;
  showBudgetScope?: boolean;
  authoring?: ProposalAuthoringDetailsDto;
};

function DetailFacts({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  const visibleItems = items.filter(
    (item) =>
      item.value !== null && item.value !== undefined && item.value !== "",
  );
  if (visibleItems.length === 0) return null;

  return (
    <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {visibleItems.map((item) => (
        <Surface
          key={item.label}
          as="div"
          variant="panel"
          radius="xl"
          shadow="control"
          className="min-w-0 px-3 py-2"
        >
          <dt className="text-xs text-muted">{item.label}</dt>
          <dd className="mt-1 text-sm font-semibold [overflow-wrap:anywhere] break-words text-text">
            {item.value}
          </dd>
        </Surface>
      ))}
    </dl>
  );
}

function NarrativeSurface({ title, value }: { title: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <AuthoringSurface title={title}>
      <ProposalNarrative value={value} />
    </AuthoringSurface>
  );
}

function AuthoringSurface({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <TitledSurface
      title={title}
      titleClassName="proposal-authoring__section-heading"
    >
      {children}
    </TitledSurface>
  );
}

function NarrativeBlock({ title, value }: { title: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-text">{title}</p>
      <ProposalNarrative value={value} />
    </div>
  );
}

function ProposalAuthoringCard({
  attachments,
  authoring,
  budgetScope,
  executionPlan,
  overview,
  showBudgetScope,
  showExecutionPlan,
}: Pick<
  ProposalSummaryCardProps,
  | "attachments"
  | "authoring"
  | "budgetScope"
  | "executionPlan"
  | "overview"
  | "showBudgetScope"
  | "showExecutionPlan"
>) {
  if (!authoring) return null;
  const actionId = authoring.systemAction?.action;
  const actionMeta =
    actionId && actionId in SYSTEM_ACTIONS
      ? SYSTEM_ACTIONS[actionId as keyof typeof SYSTEM_ACTIONS]
      : null;
  const showLegacyExecutionPlan =
    showExecutionPlan ?? executionPlan.some((item) => item.trim().length > 0);
  const showLegacyBudget = showBudgetScope ?? budgetScope.trim().length > 0;

  return (
    <div className="space-y-4 text-text">
      <AuthoringSurface title="Proposal path">
        <DetailFacts
          items={[
            {
              label: "Kind",
              value:
                authoring.kind === "system"
                  ? "System change"
                  : "Project proposal",
            },
            {
              label: "Proposal type",
              value:
                (authoring.proposalType &&
                  formatProposalType(authoring.proposalType)) ||
                "Not specified",
            },
            { label: "Preset", value: authoring.presetId ?? "Not selected" },
          ]}
        />
      </AuthoringSurface>

      {authoring.kind === "system" ? (
        <>
          <AuthoringSurface title="System action">
            <DetailFacts
              items={[
                {
                  label: "Action",
                  value: actionMeta?.label ?? authoring.systemAction?.action,
                },
                {
                  label: "Target chamber",
                  value: authoring.systemAction?.chamberId,
                },
                {
                  label: "Target governor",
                  value: authoring.systemAction?.targetAddress,
                },
                { label: "New title", value: authoring.systemAction?.title },
                {
                  label: "Multiplier",
                  value: authoring.systemAction?.multiplier,
                },
              ]}
            />
            {authoring.systemAction?.genesisMembers.length ? (
              <div className="mt-3">
                <p className="text-sm font-semibold text-text">
                  Genesis members
                </p>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {authoring.systemAction.genesisMembers.map((address) => (
                    <Surface
                      key={address}
                      as="li"
                      variant="panel"
                      radius="xl"
                      shadow="control"
                      className="px-3 py-2"
                    >
                      <AddressInline address={address} size={10} />
                    </Surface>
                  ))}
                </ul>
              </div>
            ) : null}
          </AuthoringSurface>
          <NarrativeSurface title="Rationale" value={authoring.how} />
          <NarrativeSurface title="What changes" value={authoring.what} />
          <NarrativeSurface title="Why now" value={authoring.why} />
        </>
      ) : (
        <>
          <AuthoringSurface title="Case">
            <div className="space-y-4">
              <NarrativeBlock title="What" value={authoring.what || overview} />
              <NarrativeBlock title="Why" value={authoring.why} />
            </div>
          </AuthoringSurface>

          <AuthoringSurface title="Plan">
            <div className="space-y-4">
              <NarrativeBlock
                title="How"
                value={authoring.how || executionPlan.join("\n")}
              />
              {authoring.outputs.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-text">Where</p>
                  <AttachmentList
                    items={authoring.outputs.map((output) => ({
                      id: output.id,
                      title: output.label,
                      href: output.href,
                      actionLabel: output.href ? "Open" : "Planned",
                    }))}
                    title="Outputs"
                  />
                </div>
              ) : null}
            </div>
          </AuthoringSurface>

          {authoring.timeline.length || authoring.budgetItems.length ? (
            <AuthoringSurface title="Funding and delivery">
              <div className="grid gap-3 lg:grid-cols-2">
                {authoring.timeline.length ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-text">When</p>
                    <ul className="space-y-2">
                      {authoring.timeline.map((milestone) => (
                        <Surface
                          key={`${milestone.title}-${milestone.timeframe ?? ""}`}
                          as="li"
                          variant="panel"
                          radius="xl"
                          shadow="control"
                          className="px-3 py-2"
                        >
                          <p className="font-semibold text-text">
                            {milestone.title}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {milestone.timeframe ?? "Timeline not specified"}
                            {milestone.budgetHmnd
                              ? ` · ${milestone.budgetHmnd} HMND`
                              : ""}
                          </p>
                        </Surface>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {authoring.budgetItems.length ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-text">Budget</p>
                    <ul className="space-y-2">
                      {authoring.budgetItems.map((item, index) => (
                        <Surface
                          key={`${item.description}-${index}`}
                          as="li"
                          variant="panel"
                          radius="xl"
                          shadow="control"
                          className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-3 py-2"
                        >
                          <span className="min-w-0 [overflow-wrap:anywhere] break-words">
                            {item.description || "Budget line"}
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-text">
                            {item.amountHmnd ? `${item.amountHmnd} HMND` : "—"}
                          </span>
                        </Surface>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </AuthoringSurface>
          ) : null}
        </>
      )}

      {authoring.aboutMe ? (
        <NarrativeSurface title="Proposer context" value={authoring.aboutMe} />
      ) : null}

      {authoring.kind === "project" &&
      !authoring.timeline.length &&
      showLegacyExecutionPlan ? (
        <NarrativeSurface
          title="Execution plan"
          value={executionPlan.join("\n")}
        />
      ) : null}
      {authoring.kind === "project" &&
      !authoring.budgetItems.length &&
      showLegacyBudget ? (
        <AuthoringSurface title="Budget and scope">
          <p className="text-sm text-muted">{budgetScope}</p>
        </AuthoringSurface>
      ) : null}
      <AttachmentList items={attachments} />
    </div>
  );
}

function canonicalizeProposalText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[^a-z0-9]+/i, "")
    .replace(/\b(the|a|an)\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .trim();
}

function hasVisibleAuthoring(authoring: ProposalAuthoringDetailsDto): boolean {
  return Boolean(
    authoring.what.trim() ||
      authoring.why.trim() ||
      authoring.how.trim() ||
      authoring.aboutMe.trim() ||
      authoring.outputs.length ||
      authoring.timeline.length ||
      authoring.budgetItems.length ||
      authoring.systemAction?.action,
  );
}

export function ProposalSummaryCard({
  summary,
  stats,
  overview,
  executionPlan,
  budgetScope,
  attachments,
  showExecutionPlan,
  showBudgetScope,
  authoring,
}: ProposalSummaryCardProps) {
  const normalizedSummary = summary.replace(/\s+/g, " ").trim();
  const normalizedOverview = overview.replace(/\s+/g, " ").trim();
  const normalizedBudgetScope = budgetScope.replace(/\s+/g, " ").trim();
  const canonicalSummary = canonicalizeProposalText(normalizedSummary);
  const canonicalOverview = canonicalizeProposalText(normalizedOverview);
  const showSummary =
    canonicalSummary.length > 0 &&
    canonicalOverview.length > 0 &&
    canonicalSummary !== canonicalOverview;
  const showSummaryHeader = showSummary || stats.length > 0;
  const renderExecutionPlan =
    showExecutionPlan ?? executionPlan.some((item) => item.trim().length > 0);
  const renderBudgetScope = showBudgetScope ?? normalizedBudgetScope.length > 0;
  const visibleAuthoring =
    authoring && hasVisibleAuthoring(authoring) ? authoring : undefined;

  return (
    <section className="space-y-3 text-sm text-muted">
      {showSummaryHeader ? <SectionHeader>Summary</SectionHeader> : null}
      {showSummary && <p>{summary}</p>}
      {stats.length > 0 && (
        <div className="grid gap-2 text-sm text-text sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <StatTile
              key={item.label}
              label={item.label}
              value={item.value}
              className="px-3 py-2"
            />
          ))}
        </div>
      )}
      {visibleAuthoring ? (
        <ProposalAuthoringCard
          attachments={attachments}
          authoring={visibleAuthoring}
          budgetScope={budgetScope}
          executionPlan={executionPlan}
          overview={overview}
          showBudgetScope={showBudgetScope}
          showExecutionPlan={showExecutionPlan}
        />
      ) : (
        <div className="space-y-4 text-text">
          <TitledSurface title="Proposal overview">
            <ProposalNarrative value={overview} />
          </TitledSurface>
          {renderExecutionPlan ? (
            <TitledSurface title="Execution plan">
              <ProposalNarrative value={executionPlan} />
            </TitledSurface>
          ) : null}
          {renderBudgetScope ? (
            <TitledSurface title="Budget & scope">
              <p className="text-sm text-muted">{budgetScope}</p>
            </TitledSurface>
          ) : null}
          <AttachmentList items={attachments} />
        </div>
      )}
    </section>
  );
}

type ProposalTeamMilestonesCardProps = {
  teamLocked: ProposalTeamMember[];
  openSlots: ProposalOpenSlot[];
  milestonesDetail: ProposalMilestoneDetail[];
  sectionTitle?: string;
  showMilestones?: boolean;
};

export function ProposalTeamMilestonesCard({
  teamLocked,
  openSlots,
  milestonesDetail,
  sectionTitle = "Team & milestones",
  showMilestones = true,
}: ProposalTeamMilestonesCardProps) {
  return (
    <section className="space-y-4 text-sm text-muted">
      <SectionHeader>{sectionTitle}</SectionHeader>
      <div className="grid gap-3 lg:grid-cols-2">
        <TitledSurface title="Team (locked)">
          <ul className="space-y-2 text-sm text-muted">
            {teamLocked.map((member) => (
              <Surface
                key={member.name}
                as="li"
                variant="panel"
                radius="xl"
                shadow="control"
                className="flex items-center justify-between px-3 py-2"
              >
                <span className="font-semibold text-text">{member.name}</span>
                <span className="text-xs text-muted">{member.role}</span>
              </Surface>
            ))}
            {teamLocked.length === 0 && (
              <Surface
                as="li"
                variant="panel"
                radius="xl"
                borderStyle="dashed"
                className="px-3 py-3 text-center text-xs text-muted"
              >
                No locked team members yet.
              </Surface>
            )}
          </ul>
        </TitledSurface>

        <TitledSurface title="Open slots (positions)">
          <ul className="space-y-2 text-sm text-muted">
            {openSlots.map((slot) => (
              <Surface
                key={slot.title}
                as="li"
                variant="panel"
                radius="xl"
                shadow="control"
                className="px-3 py-2"
              >
                <p className="font-semibold text-text">{slot.title}</p>
                <p className="text-xs text-muted">{slot.desc}</p>
              </Surface>
            ))}
            {openSlots.length === 0 && (
              <Surface
                as="li"
                variant="panel"
                radius="xl"
                borderStyle="dashed"
                className="px-3 py-3 text-center text-xs text-muted"
              >
                No open slots.
              </Surface>
            )}
          </ul>
        </TitledSurface>
      </div>

      {showMilestones ? (
        <TitledSurface title="Milestones">
          <ul className="space-y-2 text-sm text-muted">
            {milestonesDetail.map((ms) => (
              <Surface
                key={ms.title}
                as="li"
                variant="panel"
                radius="xl"
                shadow="control"
                className="px-3 py-2"
              >
                <p className="font-semibold text-text">{ms.title}</p>
                <p className="text-xs text-muted">{ms.desc}</p>
              </Surface>
            ))}
            {milestonesDetail.length === 0 && (
              <Surface
                as="li"
                variant="panel"
                radius="xl"
                borderStyle="dashed"
                className="px-3 py-3 text-center text-xs text-muted"
              >
                No milestones defined yet.
              </Surface>
            )}
          </ul>
        </TitledSurface>
      ) : null}
    </section>
  );
}

type ProposalTimelineCardProps = {
  items: ProposalTimelineItem[];
  proposalId?: string;
};

function isLikelyAddress(value: string): boolean {
  return /^[a-z0-9]{6,}$/i.test(value) && value.length >= 20;
}

function snapshotStageHref(
  proposalId: string,
  stage: "pool" | "vote" | "citizen_veto" | "chamber_veto" | "build",
): string | null {
  if (stage === "pool")
    return `/app/proposals/${proposalId}/pp?snapshotStage=pool`;
  if (stage === "vote")
    return `/app/proposals/${proposalId}/chamber?snapshotStage=vote`;
  if (stage === "citizen_veto") {
    return `/app/proposals/${proposalId}/citizen-veto?snapshotStage=citizen_veto`;
  }
  if (stage === "chamber_veto") {
    return `/app/proposals/${proposalId}/chamber-veto?snapshotStage=chamber_veto`;
  }
  // `build` stage can become unavailable after terminal transition.
  return null;
}

export function ProposalTimelineCard({
  items,
  proposalId,
}: ProposalTimelineCardProps) {
  return (
    <section className="space-y-3 text-sm text-text">
      <SectionHeader>Timeline</SectionHeader>
      <ul className="space-y-2 text-sm text-muted">
        {items.map((item) => (
          <Surface
            key={item.id}
            as="li"
            variant="panel"
            radius="xl"
            shadow="control"
            className="space-y-1 px-3 py-2"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="font-semibold text-text">{item.title}</p>
              <p className="text-xs text-muted">
                {formatDateTime(item.timestamp)}
              </p>
            </div>
            {item.detail ? (
              <p className="text-xs text-muted">{item.detail}</p>
            ) : null}
            {item.actor ? (
              <p className="text-xs [overflow-wrap:anywhere] break-words text-muted">
                Actor:{" "}
                {isLikelyAddress(item.actor) ? (
                  <AddressInline
                    address={item.actor}
                    className="inline-flex align-middle"
                    textClassName="text-xs text-muted"
                  />
                ) : (
                  item.actor
                )}
              </p>
            ) : null}
            {item.actionId ? (
              <div className="flex justify-end">
                <CourtReportButton
                  label="Report action"
                  size="compact"
                  target={{ type: "governance_action", id: item.actionId }}
                />
              </div>
            ) : null}
            {item.snapshot ? (
              <div className="space-y-2 rounded-lg border border-border/70 bg-panel-alt px-2 py-2">
                <p className="text-xs font-semibold text-text">
                  Stage transition: {item.snapshot.fromStage} →{" "}
                  {item.snapshot.toStage}
                </p>
                {item.snapshot.reason ? (
                  <p className="text-xs text-muted">{item.snapshot.reason}</p>
                ) : null}
                {item.snapshot.metrics.length > 0 ? (
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {item.snapshot.metrics.map((metric) => (
                      <li
                        key={`${item.id}-${metric.label}`}
                        className="text-xs text-muted"
                      >
                        <span className="font-semibold text-text">
                          {metric.label}:
                        </span>{" "}
                        {metric.value}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {proposalId
                  ? (() => {
                      const href = snapshotStageHref(
                        proposalId,
                        item.snapshot.fromStage,
                      );
                      if (!href) return null;
                      return (
                        <Link
                          to={href}
                          className="inline-flex text-xs font-semibold text-primary underline-offset-2 hover:underline"
                        >
                          Open {item.snapshot.fromStage} snapshot
                        </Link>
                      );
                    })()
                  : null}
              </div>
            ) : null}
          </Surface>
        ))}
        {items.length === 0 && (
          <Surface
            as="li"
            variant="panel"
            radius="xl"
            borderStyle="dashed"
            className="px-3 py-3 text-center text-xs text-muted"
          >
            No events yet.
          </Surface>
        )}
      </ul>
    </section>
  );
}
