import { Link } from "react-router";

import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { formatDateTime } from "@/lib/dateTime";
import type { FactionDto } from "@/types/api";

type FactionThread = NonNullable<FactionDto["threads"]>[number];

type FactionThreadListCardProps = {
  canPost: boolean;
  channelId: string;
  factionId: string;
  threads: FactionThread[];
};

export function FactionThreadListCard({
  canPost,
  channelId,
  factionId,
  threads,
}: FactionThreadListCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Threads</CardTitle>
          {canPost ? (
            <Button asChild size="sm">
              <Link
                to={`/app/factions/${factionId}/channels/${channelId}/threads/new`}
              >
                Create thread
              </Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {threads.length === 0 ? (
          <p className="text-sm text-muted">No threads yet.</p>
        ) : (
          threads.map((thread) => (
            <div
              key={thread.id}
              className="rounded-md border border-border text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={`/app/factions/${factionId}/channels/${channelId}/threads/${thread.id}`}
                  className="min-w-0 flex-1 px-3 py-2 hover:bg-panel-alt/50"
                >
                  <p className="text-sm font-semibold text-text hover:underline">
                    {thread.title}
                  </p>
                  <p className="text-xs text-muted">
                    {thread.status} · replies {thread.replies} · updated{" "}
                    {formatDateTime(thread.updatedAt)}
                  </p>
                </Link>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
