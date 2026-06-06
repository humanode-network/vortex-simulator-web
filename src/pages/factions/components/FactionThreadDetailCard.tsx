import { AddressInline } from "@/components/AddressInline";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import { formatDateTime } from "@/lib/dateTime";
import type { FactionDto } from "@/types/api";

type FactionThread = NonNullable<FactionDto["threads"]>[number];

type FactionThreadDetailCardProps = {
  canModerate: boolean;
  canPost: boolean;
  mutating: boolean;
  onReply: () => void;
  onReplyBodyChange: (value: string) => void;
  onStatusChange: (status: "open" | "resolved" | "locked") => void;
  replyBody: string;
  thread: FactionThread | null;
};

export function FactionThreadDetailCard({
  canModerate,
  canPost,
  mutating,
  onReply,
  onReplyBodyChange,
  onStatusChange,
  replyBody,
  thread,
}: FactionThreadDetailCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionHeader>Thread</SectionHeader>
      </CardHeader>
      <CardContent className="space-y-3">
        {!thread ? (
          <p className="text-sm text-muted">
            Thread not found in this channel.
          </p>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text">{thread.title}</p>
              <p className="text-xs text-muted">
                {thread.status} · replies {thread.replies}
              </p>
              <AddressInline
                address={thread.authorAddress}
                className="text-text"
                textClassName="text-xs [overflow-wrap:anywhere] break-words"
              />
            </div>

            <p className="text-sm text-muted">{thread.body}</p>

            <div className="space-y-2 rounded-md border border-border p-3">
              <p className="text-xs font-semibold text-muted">Replies</p>
              {(thread.messages ?? []).length === 0 ? (
                <p className="text-sm text-muted">No replies yet.</p>
              ) : (
                (thread.messages ?? []).map((message) => (
                  <div
                    key={message.id}
                    className="space-y-1 rounded-md border border-border px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <AddressInline
                        address={message.authorAddress}
                        className="text-text"
                        textClassName="text-xs [overflow-wrap:anywhere] break-words"
                      />
                      <span className="text-xs text-muted">
                        {formatDateTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted">{message.body}</p>
                  </div>
                ))
              )}
            </div>

            {canModerate ? (
              <Select
                value={thread.status}
                onChange={(event) =>
                  onStatusChange(
                    event.target.value as "open" | "resolved" | "locked",
                  )
                }
              >
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="locked">Locked</option>
              </Select>
            ) : null}

            {canPost ? (
              <div className="flex items-center gap-2">
                <Input
                  value={replyBody}
                  onChange={(event) => onReplyBodyChange(event.target.value)}
                  placeholder="Write a reply"
                />
                <Button
                  size="sm"
                  disabled={mutating || !replyBody.trim()}
                  onClick={onReply}
                >
                  Reply
                </Button>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
