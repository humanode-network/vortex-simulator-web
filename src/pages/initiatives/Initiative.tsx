import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Chip } from "@/components/Chip";
import { GlassyCard } from "@/components/GlassyCard";
import { GlassyStatusChip } from "@/components/GlassySection";
import { MetricTile } from "@/components/MetricTile";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { formatDateTime } from "@/lib/dateTime";
import { formatLoadError } from "@/lib/errorFormatting";
import {
  canManageInitiative,
  defaultInitiativeBoardColumns,
  initiativeBoardCardCreatePath,
  initiativeDescriptionParagraphs,
  initiativeDistinctDescription,
  initiativeRoleLabel,
  initiativeStatusLabel,
  initiativeStatusTone,
} from "@/lib/initiativeUi";
import { shortAddress } from "@/lib/profileUi";
import { InitiativeBoardSection } from "./components/InitiativeBoardSection";
import { InitiativeChatSection } from "./components/InitiativeChatSection";
import { InitiativeHeaderAction } from "./components/InitiativeHeaderAction";
import { InitiativeMembersSection } from "./components/InitiativeMembersSection";
import { InitiativeProposalsSection } from "./components/InitiativeProposalsSection";
import { InitiativeSettingsSection } from "./components/InitiativeSettingsSection";
import { InitiativeThreadsSection } from "./components/InitiativeThreadsSection";
import { useInitiativePageData } from "./hooks/useInitiativePageData";

const Initiative: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const descriptionParagraphs = initiativeDescriptionParagraphs(description);

  return (
    <div className="flex flex-col gap-6">
      <GlassyCard as="article" className="p-5 sm:p-6">
        <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="max-w-4xl min-w-0 space-y-2">
            <h1 className="text-2xl leading-tight font-semibold text-text sm:text-3xl">
              {initiative.title}
            </h1>
            <p className="text-base leading-relaxed text-muted">
              {initiative.summary}
            </p>
          </div>

          {canAdmin || canManage ? (
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {canAdmin ? (
                <InitiativeHeaderAction onClick={() => setEditing(true)}>
                  Edit initiative
                </InitiativeHeaderAction>
              ) : null}
              {canManage ? (
                <InitiativeHeaderAction
                  onClick={() =>
                    navigate(
                      initiativeBoardCardCreatePath({ id: initiative.id }),
                    )
                  }
                >
                  Create card
                </InitiativeHeaderAction>
              ) : null}
            </div>
          ) : null}
        </header>

        {descriptionParagraphs.length > 0 ? (
          <div className="mt-5 max-w-4xl space-y-3 border-t border-[color:var(--surface-glass-border)] pt-5">
            {descriptionParagraphs.map((paragraph, index) => (
              <p
                key={`${index}-${paragraph}`}
                className="border-l-2 border-[color:var(--surface-glass-border)] pl-3 text-sm leading-7 text-text"
              >
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}

        <footer className="mt-5 flex flex-col gap-4 border-t border-[color:var(--surface-glass-border)] pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <GlassyStatusChip tone={initiativeStatusTone(initiative.status)}>
              {initiativeStatusLabel[initiative.status]}
            </GlassyStatusChip>
            <GlassyStatusChip tone="neutral">{viewerRole}</GlassyStatusChip>
            {initiative.tags.length > 0 ? (
              <span
                aria-hidden="true"
                className="mx-1 h-4 w-px bg-[color:var(--surface-glass-border)]"
              />
            ) : null}
            {initiative.tags.map((tag) => (
              <Chip key={tag} className="stage-chip stage-chip--system">
                {tag}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span>Created by {shortAddress(initiative.createdByAddress)}</span>
            <span>Updated {formatDateTime(initiative.updatedAt)}</span>
          </div>
        </footer>
      </GlassyCard>

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
