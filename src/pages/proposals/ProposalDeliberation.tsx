import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "react-router";

import { useAuth } from "@/app/auth/AuthContext";
import { Surface } from "@/components/Surface";
import {
  ThreadCategoryFilter,
  ThreadComposer,
  ThreadDetail,
  ThreadList,
  type DiscussionStatusOption,
} from "@/components/discussions/ThreadPrimitives";
import {
  apiProposalThreadCreate,
  apiProposalThreadDetail,
  apiProposalThreadReply,
  apiProposalThreads,
  apiProposalThreadTransition,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import type {
  ProposalThreadCategoryDto,
  ProposalThreadDetailDto,
  ProposalThreadDto,
  ProposalThreadListDto,
} from "@/types/api";

const CATEGORY_OPTIONS: Array<{
  value: ProposalThreadCategoryDto | "all";
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "question", label: "Questions" },
  { value: "concern", label: "Concerns" },
  { value: "amendment", label: "Amendments" },
  { value: "support", label: "Support" },
  { value: "execution", label: "Execution" },
  { value: "general", label: "General" },
];

const CREATE_CATEGORY_OPTIONS = CATEGORY_OPTIONS.filter(
  (item): item is { value: ProposalThreadCategoryDto; label: string } =>
    item.value !== "all",
);

const THREAD_STATUS_OPTIONS: Array<
  DiscussionStatusOption<ProposalThreadDto["status"]>
> = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "locked", label: "Locked" },
];

function categoryLabel(value: ProposalThreadCategoryDto): string {
  return (
    CREATE_CATEGORY_OPTIONS.find((item) => item.value === value)?.label ??
    "General"
  );
}

function statusLabel(value: ProposalThreadDto["status"]): string {
  if (value === "resolved") return "Resolved";
  if (value === "locked") return "Locked";
  return "Open";
}

function canAttemptWrite(auth: ReturnType<typeof useAuth>): boolean {
  if (!auth.enabled) return true;
  return auth.authenticated && auth.eligible;
}

type ProposalDeliberationProps = {
  proposalId: string | undefined;
};

export const ProposalDeliberation: React.FC<ProposalDeliberationProps> = ({
  proposalId,
}) => {
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedThreadId = searchParams.get("thread")?.trim() || null;
  const [threadList, setThreadList] = useState<ProposalThreadListDto | null>(
    null,
  );
  const [activeThread, setActiveThread] =
    useState<ProposalThreadDetailDto | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<ProposalThreadCategoryDto | "all">(
    "all",
  );
  const [newCategory, setNewCategory] =
    useState<ProposalThreadCategoryDto>("question");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const detailRef = useRef<HTMLDivElement | null>(null);

  const loadList = useCallback(async () => {
    if (!proposalId) return;
    try {
      const next = await apiProposalThreads(proposalId);
      setThreadList(next);
      setListError(null);
    } catch (error) {
      setThreadList(null);
      setListError((error as Error).message);
    }
  }, [proposalId]);

  const loadDetail = useCallback(
    async (threadId: string) => {
      if (!proposalId || !threadId) return;
      try {
        const detail = await apiProposalThreadDetail(proposalId, threadId);
        setActiveThread(detail);
        setDetailError(null);
      } catch (error) {
        setActiveThread(null);
        setDetailError((error as Error).message);
      }
    },
    [proposalId],
  );

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!selectedThreadId) {
      setActiveThread(null);
      setDetailError(null);
      return;
    }
    void loadDetail(selectedThreadId);
  }, [loadDetail, selectedThreadId]);

  const writeAllowed = canAttemptWrite(auth);

  const threadListForViewer = useMemo<ProposalThreadListDto | null>(() => {
    if (!threadList) return null;
    if (writeAllowed) return threadList;
    return {
      ...threadList,
      permissions: {
        ...threadList.permissions,
        canCreate: false,
      },
      items: threadList.items.map((thread) => ({
        ...thread,
        permissions: {
          ...thread.permissions,
          canReply: false,
          canTransition: false,
        },
      })),
    };
  }, [threadList, writeAllowed]);

  const activeThreadForViewer = useMemo<ProposalThreadDetailDto | null>(() => {
    if (!activeThread) return null;
    if (writeAllowed) return activeThread;
    return {
      ...activeThread,
      thread: {
        ...activeThread.thread,
        permissions: {
          ...activeThread.thread.permissions,
          canReply: false,
          canTransition: false,
        },
      },
      messages: activeThread.messages,
    };
  }, [activeThread, writeAllowed]);

  const visibleThreads = useMemo(() => {
    const items = threadListForViewer?.items ?? [];
    if (filter === "all") return items;
    return items.filter((thread) => thread.category === filter);
  }, [filter, threadListForViewer?.items]);

  const replyCount = useMemo(
    () =>
      (threadList?.items ?? []).reduce(
        (sum, thread) => sum + thread.replies,
        0,
      ),
    [threadList?.items],
  );

  const canCreate = writeAllowed && Boolean(threadList?.permissions.canCreate);
  const createDisabledMessage = !writeAllowed
    ? "Sign in as an active human node to write."
    : threadList && !threadList.permissions.canCreate
      ? "Read-only until your session is active."
      : null;

  const scrollToDetail = useCallback(() => {
    window.setTimeout(() => {
      detailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }, []);

  const selectThread = useCallback(
    (threadId: string) => {
      const next = new URLSearchParams(searchParams);
      next.set("thread", threadId);
      setSearchParams(next, { preventScrollReset: true, replace: true });
      scrollToDetail();
    },
    [scrollToDetail, searchParams, setSearchParams],
  );

  const createThread = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!proposalId || !canCreate) return;
    if (!newTitle.trim() || !newBody.trim()) {
      setActionError("Thread title and body are required.");
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const res = await apiProposalThreadCreate({
        proposalId,
        category: newCategory,
        title: newTitle.trim(),
        body: newBody.trim(),
        idempotencyKey: crypto.randomUUID(),
      });
      setNewTitle("");
      setNewBody("");
      await loadList();
      selectThread(res.thread.id);
    } catch (error) {
      setActionError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const replyToThread = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!proposalId || !activeThread || !replyBody.trim()) return;
    if (!writeAllowed || !activeThread.thread.permissions.canReply) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiProposalThreadReply({
        proposalId,
        threadId: activeThread.thread.id,
        body: replyBody.trim(),
        idempotencyKey: crypto.randomUUID(),
      });
      setReplyBody("");
      await Promise.all([loadList(), loadDetail(activeThread.thread.id)]);
    } catch (error) {
      setActionError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const transitionThread = async (status: ProposalThreadDto["status"]) => {
    if (!proposalId || !activeThread) return;
    if (!writeAllowed || !activeThread.thread.permissions.canTransition) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiProposalThreadTransition({
        proposalId,
        threadId: activeThread.thread.id,
        status,
        idempotencyKey: crypto.randomUUID(),
      });
      await Promise.all([loadList(), loadDetail(activeThread.thread.id)]);
    } catch (error) {
      setActionError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!proposalId) return null;

  return (
    <Surface
      as="section"
      variant="panel"
      radius="xl"
      shadow="tile"
      className="p-5"
    >
      <header className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-lg font-semibold text-text">Deliberation</h2>
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          <span>{threadList?.items.length ?? 0} threads</span>
          <span>{replyCount} replies</span>
        </div>
      </header>

      {listError ? (
        <Surface
          variant="panelAlt"
          radius="xl"
          shadow="none"
          className="mt-4 px-4 py-3 text-sm text-destructive"
        >
          Deliberation unavailable: {formatLoadError(listError)}
        </Surface>
      ) : null}

      <ThreadCategoryFilter
        options={CATEGORY_OPTIONS}
        value={filter}
        onChange={setFilter}
      />

      <ThreadComposer
        categoryOptions={CREATE_CATEGORY_OPTIONS}
        categoryValue={newCategory}
        onCategoryChange={setNewCategory}
        title={newTitle}
        onTitleChange={setNewTitle}
        body={newBody}
        onBodyChange={setNewBody}
        onSubmit={createThread}
        canCreate={canCreate}
        busy={busy}
        disabledMessage={createDisabledMessage}
      />

      {actionError ? (
        <Surface
          variant="panelAlt"
          radius="xl"
          shadow="none"
          className="mt-4 px-4 py-3 text-sm text-destructive"
        >
          {formatLoadError(actionError)}
        </Surface>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-3">
          <ThreadList
            threads={visibleThreads}
            selectedThreadId={selectedThreadId}
            emptyMessage="No deliberation threads yet."
            categoryLabel={categoryLabel}
            statusLabel={statusLabel}
            onSelect={selectThread}
          />
        </div>

        <div ref={detailRef}>
          <ThreadDetail
            detail={activeThreadForViewer}
            errorText={
              detailError
                ? `Thread unavailable: ${formatLoadError(detailError)}`
                : null
            }
            busy={busy}
            emptyMessage="Open a thread to read the full discussion."
            categoryLabel={categoryLabel}
            statusLabel={statusLabel}
            statusOptions={THREAD_STATUS_OPTIONS}
            replyBody={replyBody}
            onReplyBodyChange={setReplyBody}
            onReply={replyToThread}
            onTransition={transitionThread}
            replyPlaceholder={(thread) =>
              thread.status === "locked" ? "Thread is locked" : "Write a reply"
            }
          />
        </div>
      </div>
    </Surface>
  );
};
