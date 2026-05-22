import { Link } from "react-router";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import type { FactionDto } from "@/types/api";

type FactionChannel = NonNullable<FactionDto["channels"]>[number];

type FactionChannelsSectionProps = {
  channelScope: "stewards" | "members";
  channelTitle: string;
  channels: FactionChannel[];
  factionId: string;
  isFounderAdmin: boolean;
  mutating: boolean;
  onChannelScopeChange: (scope: "stewards" | "members") => void;
  onChannelTitleChange: (title: string) => void;
  onCreateChannel: () => void;
  onToggleChannelLock: (channelId: string, isLocked: boolean) => void;
};

export function FactionChannelsSection({
  channelScope,
  channelTitle,
  channels,
  factionId,
  isFounderAdmin,
  mutating,
  onChannelScopeChange,
  onChannelTitleChange,
  onCreateChannel,
  onToggleChannelLock,
}: FactionChannelsSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Channels</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {channels.length === 0 ? (
          <NoDataYetBar label="channels" />
        ) : (
          channels.map((channel) => (
            <div
              key={channel.id}
              className="rounded-md border border-border text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <Link
                  to={`/app/factions/${factionId}/channels/${channel.id}`}
                  className="min-w-0 flex-1 px-3 py-2 hover:bg-panel-alt/50"
                >
                  <p className="font-semibold text-text hover:underline">
                    {channel.title}
                  </p>
                  <p className="text-xs text-muted">
                    #{channel.slug} · {channel.writeScope} · threads{" "}
                    {channel.threadCount}
                  </p>
                </Link>
                {isFounderAdmin ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={mutating}
                    onClick={() =>
                      onToggleChannelLock(channel.id, channel.isLocked)
                    }
                  >
                    {channel.isLocked ? "Unlock" : "Lock"}
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
        {isFounderAdmin ? (
          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-xs font-semibold text-muted">Create channel</p>
            <Input
              value={channelTitle}
              onChange={(event) => onChannelTitleChange(event.target.value)}
              placeholder="Channel title"
            />
            <Select
              value={channelScope}
              onChange={(event) =>
                onChannelScopeChange(
                  event.target.value as "stewards" | "members",
                )
              }
            >
              <option value="members">Members can post</option>
              <option value="stewards">Stewards only</option>
            </Select>
            <Button
              size="sm"
              disabled={mutating || channelTitle.trim().length < 2}
              onClick={onCreateChannel}
            >
              Add channel
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
