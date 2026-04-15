import type { FormEventHandler, ReactNode } from "react";

import { AddressInline } from "@/components/AddressInline";
import { Surface } from "@/components/Surface";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import { formatDateTime } from "@/lib/dateTime";

type DiscussionOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export type DiscussionStatusOption<TValue extends string = string> =
  DiscussionOption<TValue>;

type DiscussionThreadPermissions = {
  canReply?: boolean;
  canTransition?: boolean;
};

type DiscussionThreadListItem<
  TCategory extends string = string,
  TStatus extends string = string,
> = {
  id: string;
  category: TCategory;
  status: TStatus;
  title: string;
  body: string;
  replies: number;
  updatedAt: string;
  permissions: DiscussionThreadPermissions;
};

type DiscussionThreadDetailItem<
  TCategory extends string = string,
  TStatus extends string = string,
> = DiscussionThreadListItem<TCategory, TStatus> & {
  authorAddress: string;
  createdAt: string;
};

type DiscussionThreadMessage = {
  id: string;
  authorAddress: string;
  body: string;
  createdAt: string;
};

const textareaClassName =
  "min-h-[96px] w-full resize-y rounded-xl border border-border bg-panel-alt px-3 py-2 text-sm text-text shadow-[var(--shadow-control)] focus-visible:ring-2 focus-visible:ring-[color:var(--primary-dim)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

type ThreadCategoryFilterProps<TValue extends string> = {
  options: Array<DiscussionOption<TValue>>;
  value: TValue;
  onChange: (value: TValue) => void;
};

export function ThreadCategoryFilter<TValue extends string>({
  options,
  value,
  onChange,
}: ThreadCategoryFilterProps<TValue>) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? "primary" : "ghost"}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

type ThreadComposerProps<TCategory extends string> = {
  categoryOptions: Array<DiscussionOption<TCategory>>;
  categoryValue: TCategory;
  onCategoryChange: (value: TCategory) => void;
  title: string;
  onTitleChange: (value: string) => void;
  body: string;
  onBodyChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  canCreate: boolean;
  busy: boolean;
  disabledMessage?: string | null;
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
  submitLabel?: string;
  busyLabel?: string;
};

export function ThreadComposer<TCategory extends string>({
  categoryOptions,
  categoryValue,
  onCategoryChange,
  title,
  onTitleChange,
  body,
  onBodyChange,
  onSubmit,
  canCreate,
  busy,
  disabledMessage,
  titlePlaceholder = "Thread title",
  bodyPlaceholder = "Write the opening post",
  submitLabel = "Start thread",
  busyLabel = "Posting...",
}: ThreadComposerProps<TCategory>) {
  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
        <Select
          value={categoryValue}
          onChange={(event) =>
            onCategoryChange(event.target.value as TCategory)
          }
          disabled={!canCreate || busy}
          aria-label="Thread category"
        >
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={titlePlaceholder}
          disabled={!canCreate || busy}
        />
      </div>
      <textarea
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        placeholder={bodyPlaceholder}
        disabled={!canCreate || busy}
        className={textareaClassName}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={!canCreate || busy || !title.trim() || !body.trim()}
        >
          {busy ? busyLabel : submitLabel}
        </Button>
        {disabledMessage ? (
          <span className="text-xs text-muted">{disabledMessage}</span>
        ) : null}
      </div>
    </form>
  );
}

type ThreadListProps<
  TCategory extends string,
  TStatus extends string,
  TThread extends DiscussionThreadListItem<TCategory, TStatus>,
> = {
  threads: TThread[];
  selectedThreadId: string | null;
  emptyMessage: string;
  categoryLabel: (value: TCategory) => string;
  statusLabel: (value: TStatus) => string;
  onSelect: (threadId: string) => void;
};

export function ThreadList<
  TCategory extends string,
  TStatus extends string,
  TThread extends DiscussionThreadListItem<TCategory, TStatus>,
>({
  threads,
  selectedThreadId,
  emptyMessage,
  categoryLabel,
  statusLabel,
  onSelect,
}: ThreadListProps<TCategory, TStatus, TThread>) {
  if (threads.length === 0) {
    return (
      <Surface
        variant="panelAlt"
        radius="xl"
        shadow="none"
        className="px-4 py-4 text-sm text-muted"
      >
        {emptyMessage}
      </Surface>
    );
  }

  return (
    <>
      {threads.map((thread) => (
        <Surface
          key={thread.id}
          as="article"
          variant={selectedThreadId === thread.id ? "panel" : "panelAlt"}
          radius="xl"
          shadow="none"
          role="button"
          tabIndex={0}
          className="cursor-pointer px-4 py-3 transition hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-[color:var(--primary-dim)] focus-visible:outline-none"
          onClick={() => onSelect(thread.id)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            onSelect(thread.id);
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 text-left">
              <span className="text-xs font-semibold text-muted">
                {categoryLabel(thread.category)} · {statusLabel(thread.status)}
              </span>
              <h3 className="mt-1 text-base font-semibold text-text">
                {thread.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted">
                {thread.body}
              </p>
              <p className="mt-2 text-xs text-muted">
                {thread.replies} replies · Updated{" "}
                {formatDateTime(thread.updatedAt)}
              </p>
            </div>
          </div>
        </Surface>
      ))}
    </>
  );
}

type ThreadDetailProps<
  TCategory extends string,
  TStatus extends string,
  TThread extends DiscussionThreadDetailItem<TCategory, TStatus>,
  TMessage extends DiscussionThreadMessage,
> = {
  detail: {
    thread: TThread;
    messages: TMessage[];
  } | null;
  errorText: string | null;
  busy: boolean;
  emptyMessage: string;
  categoryLabel: (value: TCategory) => string;
  statusLabel: (value: TStatus) => string;
  statusOptions: Array<DiscussionStatusOption<TStatus>>;
  replyBody: string;
  onReplyBodyChange: (value: string) => void;
  onReply: FormEventHandler<HTMLFormElement>;
  onTransition: (status: TStatus) => void | Promise<void>;
  replyPlaceholder?: (thread: TThread) => string;
  renderAuthor?: (address: string) => ReactNode;
};

export function ThreadDetail<
  TCategory extends string,
  TStatus extends string,
  TThread extends DiscussionThreadDetailItem<TCategory, TStatus>,
  TMessage extends DiscussionThreadMessage,
>({
  detail,
  errorText,
  busy,
  emptyMessage,
  categoryLabel,
  statusLabel,
  statusOptions,
  replyBody,
  onReplyBodyChange,
  onReply,
  onTransition,
  replyPlaceholder = () => "Write a reply",
  renderAuthor = (address) => (
    <AddressInline
      address={address}
      className="text-text"
      textClassName="text-xs [overflow-wrap:anywhere] break-words"
    />
  ),
}: ThreadDetailProps<TCategory, TStatus, TThread, TMessage>) {
  return (
    <Surface variant="panelAlt" radius="xl" shadow="none" className="p-4">
      {errorText ? (
        <p className="text-sm text-destructive">{errorText}</p>
      ) : !detail ? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
              <span>{categoryLabel(detail.thread.category)}</span>
              <span>{statusLabel(detail.thread.status)}</span>
              <span>{formatDateTime(detail.thread.createdAt)}</span>
            </div>
            <h3 className="text-lg font-semibold text-text">
              {detail.thread.title}
            </h3>
            {renderAuthor(detail.thread.authorAddress)}
            <p className="text-sm whitespace-pre-wrap text-text">
              {detail.thread.body}
            </p>
          </div>

          {detail.thread.permissions.canTransition ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={detail.thread.status}
                onChange={(event) =>
                  void onTransition(event.target.value as TStatus)
                }
                disabled={busy}
                className="max-w-[180px]"
                aria-label="Thread status"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted">Replies</p>
            {detail.messages.length === 0 ? (
              <p className="text-sm text-muted">No replies yet.</p>
            ) : (
              detail.messages.map((message) => (
                <Surface
                  key={message.id}
                  variant="panel"
                  radius="xl"
                  shadow="none"
                  className="px-3 py-2"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      {renderAuthor(message.authorAddress)}
                      <p className="text-xs text-muted">
                        {formatDateTime(message.createdAt)}
                      </p>
                      <p className="text-sm whitespace-pre-wrap text-text">
                        {message.body}
                      </p>
                    </div>
                  </div>
                </Surface>
              ))
            )}
          </div>

          <form onSubmit={onReply} className="space-y-3">
            <textarea
              value={replyBody}
              onChange={(event) => onReplyBodyChange(event.target.value)}
              placeholder={replyPlaceholder(detail.thread)}
              disabled={!detail.thread.permissions.canReply || busy}
              className={textareaClassName}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={
                  busy ||
                  !detail.thread.permissions.canReply ||
                  !replyBody.trim()
                }
              >
                {busy ? "Posting..." : "Reply"}
              </Button>
              {!detail.thread.permissions.canReply ? (
                <span className="text-xs text-muted">
                  This thread is read-only for you.
                </span>
              ) : null}
            </div>
          </form>
        </div>
      )}
    </Surface>
  );
}
