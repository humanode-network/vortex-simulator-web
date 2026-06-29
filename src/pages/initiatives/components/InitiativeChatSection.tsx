import type { FormEvent } from "react";
import { useState } from "react";

import { NoDataYetBar } from "@/components/NoDataYetBar";
import { GlassySection } from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { apiInitiativeChatPost } from "@/lib/apiClient";
import { formatDateTime } from "@/lib/dateTime";
import { shortAddress } from "@/lib/profileUi";
import type { InitiativeThreadMessageDto } from "@/types/api";

type InitiativeChatSectionProps = {
  canPost: boolean;
  initiativeId: string;
  messages: InitiativeThreadMessageDto[];
  onChanged: () => Promise<void> | void;
};

export function InitiativeChatSection({
  canPost,
  initiativeId,
  messages,
  onChanged,
}: InitiativeChatSectionProps) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function postMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = body.trim();
    if (!message) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiInitiativeChatPost({ initiativeId, body: message });
      setBody("");
      await onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassySection title="Chat">
      <div className="max-h-96 space-y-2 overflow-y-auto">
        {messages.length === 0 ? (
          <NoDataYetBar label="chat messages" />
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className="rounded-xl border border-[color:var(--surface-glass-border)] bg-[color:var(--surface-glass-bg)] px-3 py-2"
            >
              <div className="flex flex-wrap justify-between gap-2 text-xs">
                <span className="font-semibold text-text">
                  {shortAddress(message.authorAddress)}
                </span>
                <span className="text-muted">
                  {formatDateTime(message.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {message.body}
              </p>
            </article>
          ))
        )}
      </div>

      {canPost ? (
        <form className="mt-3 flex gap-2" onSubmit={postMessage}>
          <Input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a message"
            aria-label="Initiative chat message"
          />
          <Button type="submit" size="sm" disabled={submitting || !body.trim()}>
            Send
          </Button>
        </form>
      ) : null}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </GlassySection>
  );
}
