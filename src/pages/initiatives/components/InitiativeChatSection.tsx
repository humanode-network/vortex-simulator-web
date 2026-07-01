import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { GlassySection } from "@/components/GlassySection";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/primitives/button";
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
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    const viewport = messageViewportRef.current;
    if (!viewport || !stickToBottomRef.current) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [messages.length]);

  function trackScrollPosition() {
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 48;
  }

  async function postMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = body.trim();
    if (!message) return;
    setSubmitting(true);
    setError(null);
    stickToBottomRef.current = true;
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
    <GlassySection
      title="Chat"
      action={
        <span className="text-xs text-muted">
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </span>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-[color:var(--surface-glass-border)] bg-[color:var(--surface-glass-bg)] shadow-[var(--shadow-tile)] supports-[backdrop-filter]:backdrop-blur-md">
        <div
          ref={messageViewportRef}
          role="log"
          aria-live="polite"
          aria-label="Initiative chat history"
          onScroll={trackScrollPosition}
          className="h-[clamp(18rem,52vh,30rem)] overflow-y-auto overscroll-contain"
        >
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center px-5 text-center text-sm text-muted">
              No chat messages yet.
            </div>
          ) : (
            <div className="divide-y divide-[color:var(--surface-glass-border)]">
              {messages.map((message) => (
                <article key={message.id} className="px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
                    <span className="font-semibold text-text">
                      {shortAddress(message.authorAddress)}
                    </span>
                    <time className="text-muted" dateTime={message.createdAt}>
                      {formatDateTime(message.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-text">
                    {message.body}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        {canPost ? (
          <form
            className="flex flex-col gap-2 border-t border-[color:var(--surface-glass-border)] bg-[color:var(--control-glass-bg)] p-3 sm:flex-row sm:items-end"
            onSubmit={postMessage}
          >
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write a message"
              aria-label="Initiative chat message"
              rows={2}
              className="max-h-40 min-h-20 resize-y"
            />
            <Button
              type="submit"
              size="md"
              className="w-full sm:w-24"
              disabled={submitting || !body.trim()}
            >
              Send
            </Button>
          </form>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </GlassySection>
  );
}
