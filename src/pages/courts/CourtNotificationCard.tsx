import { Link } from "react-router";

import {
  GlassyKeyValue,
  GlassyStatusChip,
  GlassyTile,
} from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import { apiSetCourtNotificationStateV2 } from "@/lib/apiClient";
import type { CourtNotificationV2Dto } from "@/types/api";
import { CourtActionFeedback, CourtAsyncButton } from "./courtFormUi";
import { courtNotificationMessage } from "./courtPresentation";
import {
  courtLabel,
  CourtDeadline,
  courtTone,
  formatCourtInstant,
} from "./courtUi";
import { useCourtCommandRunner } from "./useCourtCommandRunner";

export function CourtNotificationCard({
  notification,
  onChange,
}: {
  notification: CourtNotificationV2Dto;
  onChange: (next: CourtNotificationV2Dto) => void;
}) {
  const runner = useCourtCommandRunner();

  function update(state: "read" | "dismissed") {
    void runner.run({
      id: `${notification.id}:${state}`,
      label:
        state === "read" ? "Notification read state" : "Notification dismissal",
      action: (idempotencyKey) =>
        apiSetCourtNotificationStateV2(
          { notificationId: notification.id, state },
          { idempotencyKey },
        ),
      onConfirmed: () =>
        onChange({
          ...notification,
          state,
          readAt:
            state === "read" ? new Date().toISOString() : notification.readAt,
        }),
    });
  }

  return (
    <GlassyTile className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <GlassyKeyValue
          label={courtLabel(notification.kind)}
          value={
            courtNotificationMessage(notification) ??
            `${courtLabel(notification.entityType)} ${notification.entityId}`
          }
        />
        <GlassyStatusChip tone={courtTone(notification.state)}>
          {courtLabel(notification.state)}
        </GlassyStatusChip>
      </div>
      <GlassyKeyValue
        label="Received"
        value={formatCourtInstant(notification.createdAt)}
      />
      {notification.dueAt ? (
        <CourtDeadline
          dueAt={notification.dueAt}
          label="Action deadline"
          state={
            notification.payload.deadlineState === "overdue"
              ? "overdue"
              : notification.payload.deadlineState === "completed"
                ? "completed"
                : "due"
          }
        />
      ) : null}
      <CourtActionFeedback
        actionError={runner.actionError}
        actionField={runner.actionField}
        notice={runner.notice}
        refreshError={runner.refreshError}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild size="compact" variant="ghost">
          <Link
            to={
              notification.entityType === "case"
                ? `/app/courts/${encodeURIComponent(notification.entityId)}`
                : `/app/courts/reports/${encodeURIComponent(notification.entityId)}`
            }
          >
            Open {notification.entityType}
          </Link>
        </Button>
        {notification.state === "unread" ? (
          <CourtAsyncButton
            busy={runner.busy === `${notification.id}:read`}
            busyLabel="Marking read..."
            disabled={runner.busy !== null}
            size="compact"
            variant="outline"
            onClick={() => update("read")}
          >
            Mark read
          </CourtAsyncButton>
        ) : null}
        <CourtAsyncButton
          busy={runner.busy === `${notification.id}:dismissed`}
          busyLabel="Dismissing..."
          disabled={runner.busy !== null}
          size="compact"
          variant="ghost"
          onClick={() => update("dismissed")}
        >
          Dismiss
        </CourtAsyncButton>
      </div>
    </GlassyTile>
  );
}
