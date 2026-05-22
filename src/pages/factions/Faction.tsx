import { Link, useParams } from "react-router";

import { PageHint } from "@/components/PageHint";
import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import {
  apiFactionChannelCreate,
  apiFactionChannelLock,
  apiFactionCofounderInviteCancel,
  apiFactionDelete,
  apiFactionJoin,
  apiFactionJoinRequestApprove,
  apiFactionJoinRequestDecline,
  apiFactionLeave,
  apiFactionMemberRoleSet,
  apiFactionUpdate,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import { getFactionViewerPermissions } from "@/lib/factionUi";
import { FactionChannelsSection } from "./components/FactionChannelsSection";
import { FactionEditCard } from "./components/FactionEditCard";
import { FactionHero } from "./components/FactionHero";
import { FactionInitiativesSection } from "./components/FactionInitiativesSection";
import { FactionMembersSection } from "./components/FactionMembersSection";
import { FactionModerationQueues } from "./components/FactionModerationQueues";
import { useFactionChannelDraft } from "./hooks/useFactionChannelDraft";
import { useFactionActionRunner } from "./hooks/useFactionActionRunner";
import { useFactionEditForm } from "./hooks/useFactionEditForm";
import { useFactionLegacyThreadRedirect } from "./hooks/useFactionLegacyThreadRedirect";
import { useFactionPageData } from "./hooks/useFactionPageData";

const Faction: React.FC = () => {
  const { id } = useParams();
  const {
    faction,
    loadError,
    loading,
    reload: reloadFaction,
    viewerAddress,
  } = useFactionPageData(id);

  const channelDraft = useFactionChannelDraft();
  const editForm = useFactionEditForm(faction);
  const { actionError, mutating, runAction } = useFactionActionRunner({
    reload: reloadFaction,
  });

  const memberships = faction?.memberships ?? [];
  const channels = faction?.channels ?? [];
  const threads = faction?.threads ?? [];
  const initiatives = faction?.initiativesDetailed ?? [];
  const cofounderInvitations = faction?.cofounderInvitations ?? [];
  const joinRequests = faction?.joinRequests ?? [];
  const viewerJoinRequest = faction?.viewerJoinRequest ?? null;

  const {
    canJoin,
    canLeave,
    canManageMembers,
    canModerateQueues,
    isFounderAdmin,
    viewerMembershipActive,
    viewerRole,
  } = getFactionViewerPermissions(memberships, viewerAddress);

  useFactionLegacyThreadRedirect(id, threads);

  if (loading && !faction) {
    return (
      <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
        Loading faction…
      </Card>
    );
  }

  if (!faction) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-text">Faction not found</h1>
        {loadError ? (
          <p className="text-sm text-destructive">
            {formatLoadError(loadError)}
          </p>
        ) : null}
        <Button asChild size="sm">
          <Link to="/app/factions">Back to factions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="faction" />
      <FactionHero
        canJoin={canJoin}
        canLeave={canLeave}
        editOpen={editForm.open}
        faction={faction}
        isFounderAdmin={isFounderAdmin}
        mutating={mutating}
        onEditToggle={editForm.toggleOpen}
        onJoin={() =>
          runAction(async () => {
            await apiFactionJoin({ factionId: faction.id });
          })
        }
        onLeave={() =>
          runAction(async () => {
            await apiFactionLeave({ factionId: faction.id });
          })
        }
        viewerJoinRequest={viewerJoinRequest}
        viewerMembershipActive={viewerMembershipActive}
        viewerRole={viewerRole}
      />

      {isFounderAdmin && editForm.open ? (
        <FactionEditCard
          description={editForm.description}
          focus={editForm.focus}
          goalsText={editForm.goalsText}
          mutating={mutating}
          name={editForm.name}
          onArchive={() =>
            runAction(async () => {
              await apiFactionDelete({ factionId: faction.id });
            })
          }
          onDescriptionChange={editForm.setDescription}
          onFocusChange={editForm.setFocus}
          onGoalsTextChange={editForm.setGoalsText}
          onNameChange={editForm.setName}
          onSave={() =>
            runAction(async () => {
              await apiFactionUpdate({
                factionId: faction.id,
                ...editForm.payload(),
              });
              editForm.close();
            })
          }
          onTagsTextChange={editForm.setTagsText}
          onVisibilityChange={editForm.setVisibility}
          tagsText={editForm.tagsText}
          visibility={editForm.visibility}
        />
      ) : null}

      {actionError ? (
        <Card className="border-dashed px-4 py-3 text-sm text-destructive">
          {formatLoadError(actionError)}
        </Card>
      ) : null}

      <FactionMembersSection
        canManageMembers={canManageMembers}
        memberships={memberships}
        mutating={mutating}
        onRoleSet={(address, role) =>
          runAction(async () => {
            await apiFactionMemberRoleSet({
              factionId: faction.id,
              address,
              role,
            });
          })
        }
        viewerAddress={viewerAddress}
      />

      <FactionModerationQueues
        canModerateQueues={canModerateQueues}
        cofounderInvitations={cofounderInvitations}
        isFounderAdmin={isFounderAdmin}
        joinRequests={joinRequests}
        mutating={mutating}
        onApproveJoinRequest={(address) =>
          runAction(async () => {
            await apiFactionJoinRequestApprove({
              factionId: faction.id,
              address,
            });
          })
        }
        onCancelCofounderInvite={(address) =>
          runAction(async () => {
            await apiFactionCofounderInviteCancel({
              factionId: faction.id,
              address,
            });
          })
        }
        onDeclineJoinRequest={(address) =>
          runAction(async () => {
            await apiFactionJoinRequestDecline({
              factionId: faction.id,
              address,
            });
          })
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <FactionChannelsSection
          channelScope={channelDraft.scope}
          channelTitle={channelDraft.title}
          channels={channels}
          factionId={faction.id}
          isFounderAdmin={isFounderAdmin}
          mutating={mutating}
          onChannelScopeChange={channelDraft.setScope}
          onChannelTitleChange={channelDraft.setTitle}
          onCreateChannel={() =>
            runAction(async () => {
              await apiFactionChannelCreate({
                factionId: faction.id,
                ...channelDraft.payload(),
              });
              channelDraft.reset();
            })
          }
          onToggleChannelLock={(channelId, isLocked) =>
            runAction(async () => {
              await apiFactionChannelLock({
                factionId: faction.id,
                channelId,
                isLocked: !isLocked,
              });
            })
          }
        />

        <FactionInitiativesSection
          factionId={faction.id}
          initiatives={initiatives}
        />
      </div>

      <Card>
        <CardContent className="p-4 text-sm text-muted">
          Open a channel to create threads and manage discussions.
        </CardContent>
      </Card>
    </div>
  );
};

export default Faction;
