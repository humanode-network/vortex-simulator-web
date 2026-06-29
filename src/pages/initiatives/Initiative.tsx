import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { Chip } from "@/components/Chip";
import { GlassyCard } from "@/components/GlassyCard";
import { GlassyStatusChip } from "@/components/GlassySection";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { Button } from "@/components/primitives/button";
import { apiInitiative } from "@/lib/apiClient";
import { formatDateTime } from "@/lib/dateTime";
import { formatLoadError } from "@/lib/errorFormatting";
import {
  initiativeBoardStatusLabel,
  initiativeRoleLabel,
  initiativeStatusLabel,
  initiativeStatusTone,
} from "@/lib/initiativeUi";
import { shortAddress } from "@/lib/profileUi";
import type { InitiativeBoardColumnDto, InitiativeDto } from "@/types/api";
import { InitiativeBoardSection } from "./components/InitiativeBoardSection";
import { InitiativeChatSection } from "./components/InitiativeChatSection";
import { InitiativeMembersSection } from "./components/InitiativeMembersSection";
import { InitiativeProposalsSection } from "./components/InitiativeProposalsSection";
import { InitiativeSettingsSection } from "./components/InitiativeSettingsSection";
import { InitiativeThreadsSection } from "./components/InitiativeThreadsSection";

const Initiative: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [initiative, setInitiative] = useState<InitiativeDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadInitiative = useCallback(async () => {
    if (!id) return;
    try {
      const res = await apiInitiative(id);
      setInitiative(res);
      setLoadError(null);
    } catch (error) {
      setInitiative(null);
      setLoadError((error as Error).message);
    }
  }, [id]);

  useEffect(() => {
    void loadInitiative();
  }, [loadInitiative]);

  const boardColumns = useMemo(() => {
    if (!initiative) return [];
    if (initiative.boardColumns && initiative.boardColumns.length > 0) {
      return initiative.boardColumns;
    }

    const statuses = Array.from(
      new Set((initiative.boardCards ?? []).map((card) => card.status)),
    );
    return statuses.map<InitiativeBoardColumnDto>((status, index) => ({
      id: status,
      key: status,
      title: initiativeBoardStatusLabel[status],
      sortOrder: index,
    }));
  }, [initiative]);

  if (!id) {
    return <NoDataYetBar label="initiative id" />;
  }

  if (loadError) {
    return (
      <GlassyCard className="px-4 py-6 text-center text-sm text-destructive">
        Initiative unavailable: {formatLoadError(loadError)}
      </GlassyCard>
    );
  }

  if (!initiative) {
    return (
      <GlassyCard className="px-4 py-6 text-center text-sm text-muted">
        Loading initiative...
      </GlassyCard>
    );
  }

  const cards = initiative.boardCards ?? [];
  const threads = initiative.threads ?? [];
  const memberships = initiative.memberships ?? [];
  const proposals = initiative.proposals ?? [];
  const chatMessages = initiative.chatMessages ?? [];
  const isOperational = initiative.status === "active";
  const canManage = isOperational && Boolean(initiative.viewerCanSteward);
  const canAdmin = Boolean(initiative.viewerCanAdmin);
  const canParticipate = isOperational && initiative.viewerRole != null;
  const viewerRole = initiative.viewerRole
    ? initiativeRoleLabel[initiative.viewerRole]
    : "Observer";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-start">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/initiatives">Back to initiatives</Link>
        </Button>
      </div>

      <GlassyCard as="article" className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <GlassyStatusChip tone={initiativeStatusTone(initiative.status)}>
                {initiativeStatusLabel[initiative.status]}
              </GlassyStatusChip>
              <Chip className="stage-chip stage-chip--system">
                {viewerRole}
              </Chip>
            </div>
            <h1 className="text-2xl leading-tight font-semibold text-text">
              {initiative.title}
            </h1>
            <p className="max-w-4xl text-sm leading-relaxed text-muted">
              {initiative.description || initiative.summary}
            </p>
          </div>

          <dl className="grid min-w-64 grid-cols-2 gap-2 text-sm">
            <HeroMetric label="Members" value={initiative.memberCount} />
            <HeroMetric label="Board" value={cards.length} />
            <HeroMetric label="Threads" value={threads.length} />
            <HeroMetric label="Proposals" value={proposals.length} />
          </dl>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {initiative.tags.map((tag) => (
            <Chip key={tag} className="stage-chip stage-chip--system">
              {tag}
            </Chip>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-[color:var(--surface-glass-border)] pt-4 text-xs text-muted">
          <span>Created by {shortAddress(initiative.createdByAddress)}</span>
          <span>Updated {formatDateTime(initiative.updatedAt)}</span>
        </div>
      </GlassyCard>

      {canAdmin ? (
        <InitiativeSettingsSection
          initiative={initiative}
          onChanged={loadInitiative}
        />
      ) : null}
      <InitiativeBoardSection
        cards={cards}
        canManage={canManage}
        columns={boardColumns}
        initiativeId={initiative.id}
        onChanged={loadInitiative}
      />
      <InitiativeThreadsSection
        canModerate={canManage}
        canPost={canParticipate}
        initiativeId={initiative.id}
        onChanged={loadInitiative}
        threads={threads}
      />
      <InitiativeChatSection
        canPost={canParticipate}
        initiativeId={initiative.id}
        messages={chatMessages}
        onChanged={loadInitiative}
      />
      <InitiativeProposalsSection proposals={proposals} />
      <InitiativeMembersSection
        canAdmin={isOperational && canAdmin}
        initiativeId={initiative.id}
        memberships={memberships}
        onChanged={loadInitiative}
      />
    </div>
  );
};

function HeroMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--surface-glass-border)] bg-[color:var(--surface-glass-bg)] px-3 py-2 text-center">
      <dt className="text-[0.68rem] leading-none font-semibold tracking-wide text-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-base leading-none font-semibold text-text">
        {value}
      </dd>
    </div>
  );
}

export default Initiative;
