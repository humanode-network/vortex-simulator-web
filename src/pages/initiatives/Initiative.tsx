import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { Chip } from "@/components/Chip";
import { GlassyCard } from "@/components/GlassyCard";
import { GlassyStatusChip } from "@/components/GlassySection";
import { MetricTile } from "@/components/MetricTile";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/primitives/button";
import { formatDateTime } from "@/lib/dateTime";
import { formatLoadError } from "@/lib/errorFormatting";
import {
  canManageInitiative,
  defaultInitiativeBoardColumns,
  initiativeDistinctDescription,
  initiativeRoleLabel,
  initiativeStatusLabel,
  initiativeStatusTone,
} from "@/lib/initiativeUi";
import { shortAddress } from "@/lib/profileUi";
import { InitiativeBoardSection } from "./components/InitiativeBoardSection";
import { InitiativeChatSection } from "./components/InitiativeChatSection";
import { InitiativeMembersSection } from "./components/InitiativeMembersSection";
import { InitiativeProposalsSection } from "./components/InitiativeProposalsSection";
import { InitiativeSettingsSection } from "./components/InitiativeSettingsSection";
import { InitiativeThreadsSection } from "./components/InitiativeThreadsSection";
import { useInitiativePageData } from "./hooks/useInitiativePageData";

const Initiative: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { initiative, loadError, reload } = useInitiativePageData(id);
  const [editing, setEditing] = useState(false);

  const boardColumns = useMemo(() => {
    if (!initiative) return [];
    if (initiative.boardColumns && initiative.boardColumns.length > 0) {
      return initiative.boardColumns;
    }
    return defaultInitiativeBoardColumns;
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
  const canManage = canManageInitiative(initiative);
  const canAdmin = Boolean(initiative.viewerCanAdmin);
  const canParticipate = isOperational && initiative.viewerRole != null;
  const viewerRole = initiative.viewerRole
    ? initiativeRoleLabel[initiative.viewerRole]
    : "Observer";
  const description = initiativeDistinctDescription(
    initiative.summary,
    initiative.description,
  );

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/app/initiatives">Back to initiatives</Link>
      </Button>

      <PageHeader
        title={initiative.title}
        titleClassName="text-2xl"
        description={initiative.summary}
        descriptionClassName="max-w-4xl leading-relaxed"
        right={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <GlassyStatusChip tone={initiativeStatusTone(initiative.status)}>
              {initiativeStatusLabel[initiative.status]}
            </GlassyStatusChip>
            <Chip className="stage-chip stage-chip--system">{viewerRole}</Chip>
          </div>
        }
      />

      {description ? (
        <p className="max-w-4xl text-sm leading-relaxed whitespace-pre-line text-text">
          {description}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <div className="flex flex-wrap gap-2">
          {initiative.tags.map((tag) => (
            <Chip key={tag} className="stage-chip stage-chip--system">
              {tag}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>Created by {shortAddress(initiative.createdByAddress)}</span>
          <span>Updated {formatDateTime(initiative.updatedAt)}</span>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Members" value={initiative.memberCount} />
        <MetricTile label="Board" value={cards.length} />
        <MetricTile label="Threads" value={threads.length} />
        <MetricTile label="Proposals" value={proposals.length} />
      </section>

      {canAdmin && editing ? (
        <InitiativeSettingsSection
          initiative={initiative}
          onChanged={reload}
          onClose={() => setEditing(false)}
        />
      ) : null}
      <InitiativeBoardSection
        cards={cards}
        canManage={canManage}
        columns={boardColumns}
        initiativeId={initiative.id}
        onChanged={reload}
        secondaryAction={
          canAdmin && !editing ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              Edit initiative
            </Button>
          ) : null
        }
      />
      <InitiativeThreadsSection
        canModerate={canManage}
        canPost={canParticipate}
        initiativeId={initiative.id}
        onChanged={reload}
        threads={threads}
      />
      <InitiativeChatSection
        canPost={canParticipate}
        initiativeId={initiative.id}
        messages={chatMessages}
        onChanged={reload}
      />
      <InitiativeProposalsSection proposals={proposals} />
      <InitiativeMembersSection
        canAdmin={isOperational && canAdmin}
        initiativeId={initiative.id}
        memberships={memberships}
        onChanged={reload}
      />
    </div>
  );
};

export default Initiative;
