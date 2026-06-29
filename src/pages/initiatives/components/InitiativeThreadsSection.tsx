import type { FormEvent } from "react";
import { useState } from "react";

import { NoDataYetBar } from "@/components/NoDataYetBar";
import { GlassySection, GlassyStatusChip } from "@/components/GlassySection";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import {
  apiInitiativeThreadCreate,
  apiInitiativeThreadReply,
  apiInitiativeThreadTransition,
} from "@/lib/apiClient";
import { formatDateTime } from "@/lib/dateTime";
import {
  initiativeThreadStatusLabel,
  initiativeThreadStatusTone,
} from "@/lib/initiativeUi";
import { shortAddress } from "@/lib/profileUi";
import type { InitiativeThreadDto } from "@/types/api";

type InitiativeThreadsSectionProps = {
  canModerate: boolean;
  canPost: boolean;
  initiativeId: string;
  onChanged: () => Promise<void> | void;
  threads: InitiativeThreadDto[];
};

export function InitiativeThreadsSection({
  canModerate,
  canPost,
  initiativeId,
  onChanged,
  threads,
}: InitiativeThreadsSectionProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyByThread, setReplyByThread] = useState<Record<string, string>>(
    {},
  );
  const [busyThreadId, setBusyThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiInitiativeThreadCreate({
        initiativeId,
        title: trimmedTitle,
        body: trimmedBody,
      });
      setTitle("");
      setBody("");
      await onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function replyToThread(threadId: string) {
    const body = replyByThread[threadId]?.trim();
    if (!body) return;
    setBusyThreadId(threadId);
    setError(null);
    try {
      await apiInitiativeThreadReply({ initiativeId, threadId, body });
      setReplyByThread((current) => ({ ...current, [threadId]: "" }));
      await onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyThreadId(null);
    }
  }

  async function transitionThread(
    threadId: string,
    status: InitiativeThreadDto["status"],
  ) {
    setBusyThreadId(threadId);
    setError(null);
    try {
      await apiInitiativeThreadTransition({
        initiativeId,
        threadId,
        status,
      });
      await onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyThreadId(null);
    }
  }

  return (
    <GlassySection title="Threads">
      {canPost ? (
        <form className="mb-4 grid gap-3" onSubmit={submitThread}>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Thread title"
            aria-label="Initiative thread title"
          />
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Start a thread"
            aria-label="Initiative thread body"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !title.trim() || !body.trim()}
            >
              Start thread
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      ) : null}

      {threads.length === 0 ? (
        <NoDataYetBar
          label="threads"
          description="Initiative members can start the first durable discussion."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {threads.map((thread) => (
            <article
              key={thread.id}
              className="rounded-2xl border border-[color:var(--surface-glass-border)] bg-[color:var(--surface-glass-bg)] p-4 shadow-[var(--shadow-tile)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base leading-tight font-semibold text-text">
                    {thread.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    {shortAddress(thread.authorAddress)} ·{" "}
                    {formatDateTime(thread.updatedAt)}
                  </p>
                </div>
                <GlassyStatusChip
                  tone={initiativeThreadStatusTone(thread.status)}
                >
                  {initiativeThreadStatusLabel[thread.status]}
                </GlassyStatusChip>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {thread.body}
              </p>
              <p className="mt-3 text-xs font-semibold text-muted">
                {thread.replies} replies
              </p>
              {thread.messages?.length ? (
                <div className="mt-3 space-y-2 border-t border-[color:var(--surface-glass-border)] pt-3">
                  {thread.messages.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-xl bg-[color:var(--surface-glass-bg)] px-3 py-2"
                    >
                      <p className="text-xs font-semibold text-text">
                        {shortAddress(message.authorAddress)}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {message.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
              {canPost && thread.status !== "locked" ? (
                <div className="mt-3 flex gap-2">
                  <Input
                    value={replyByThread[thread.id] ?? ""}
                    onChange={(event) =>
                      setReplyByThread((current) => ({
                        ...current,
                        [thread.id]: event.target.value,
                      }))
                    }
                    placeholder="Reply"
                    aria-label={`Reply to ${thread.title}`}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      busyThreadId === thread.id ||
                      !(replyByThread[thread.id] ?? "").trim()
                    }
                    onClick={() => void replyToThread(thread.id)}
                  >
                    Reply
                  </Button>
                </div>
              ) : null}
              {canModerate ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {thread.status !== "open" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busyThreadId === thread.id}
                      onClick={() => void transitionThread(thread.id, "open")}
                    >
                      Reopen
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busyThreadId === thread.id}
                      onClick={() =>
                        void transitionThread(thread.id, "resolved")
                      }
                    >
                      Resolve
                    </Button>
                  )}
                  {thread.status !== "locked" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busyThreadId === thread.id}
                      onClick={() => void transitionThread(thread.id, "locked")}
                    >
                      Lock
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </GlassySection>
  );
}
