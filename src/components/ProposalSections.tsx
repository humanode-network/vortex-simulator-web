import type { ReactNode } from "react";

import {
  AttachmentList,
  type AttachmentItem,
} from "@/components/AttachmentList";
import { AddressInline } from "@/components/AddressInline";
import { StatTile } from "@/components/StatTile";
import { Surface } from "@/components/Surface";
import { TitledSurface } from "@/components/TitledSurface";
import { formatDateTime } from "@/lib/dateTime";
import { Link } from "react-router";

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
};

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

export function ProposalSummaryCard({
  summary,
  stats,
  overview,
  executionPlan,
  budgetScope,
  attachments,
  showExecutionPlan,
  showBudgetScope,
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

  return (
    <section className="space-y-3 text-sm text-muted">
      {showSummaryHeader ? (
        <h2 className="text-lg font-semibold text-text">Summary</h2>
      ) : null}
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
      <div className="space-y-4 text-text">
        <TitledSurface title="Proposal overview">
          <p className="text-sm leading-relaxed text-muted">{overview}</p>
        </TitledSurface>
        {renderExecutionPlan ? (
          <TitledSurface title="Execution plan">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              {executionPlan.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </TitledSurface>
        ) : null}
        {renderBudgetScope ? (
          <TitledSurface title="Budget & scope">
            <p className="text-sm text-muted">{budgetScope}</p>
          </TitledSurface>
        ) : null}
        <AttachmentList items={attachments} />
      </div>
    </section>
  );
}

type ProposalTeamMilestonesCardProps = {
  teamLocked: ProposalTeamMember[];
  openSlots: ProposalOpenSlot[];
  milestonesDetail: ProposalMilestoneDetail[];
};

export function ProposalTeamMilestonesCard({
  teamLocked,
  openSlots,
  milestonesDetail,
}: ProposalTeamMilestonesCardProps) {
  return (
    <section className="space-y-4 text-sm text-muted">
      <h2 className="text-lg font-semibold text-text">Team & milestones</h2>
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
      <h2 className="text-lg font-semibold text-text">Timeline</h2>
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
