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
import {
  apiProposalThreadCreate,
  apiProposalThreadDetail,
  apiProposalThreadReply,
  apiProposalThreads,
  apiProposalThreadTransition,
} from "@/lib/apiClient";
import {
  canAttemptProposalDiscussionWrite,
  filterProposalThreadsByCategory,
  getProposalThreadReplyCount,
  restrictProposalThreadDetailForReadOnly,
  restrictProposalThreadListForReadOnly,
} from "@/lib/proposalDeliberationUi";
import type {
  ProposalThreadCategoryDto,
  ProposalThreadDetailDto,
  ProposalThreadDto,
  ProposalThreadListDto,
} from "@/types/api";

export function useProposalDeliberation(proposalId: string | undefined) {
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

  const writeAllowed = canAttemptProposalDiscussionWrite(auth);

  const threadListForViewer = useMemo<ProposalThreadListDto | null>(() => {
    return restrictProposalThreadListForReadOnly(threadList, writeAllowed);
  }, [threadList, writeAllowed]);

  const activeThreadForViewer = useMemo<ProposalThreadDetailDto | null>(() => {
    return restrictProposalThreadDetailForReadOnly(activeThread, writeAllowed);
  }, [activeThread, writeAllowed]);

  const visibleThreads = useMemo(() => {
    const items = threadListForViewer?.items ?? [];
    return filterProposalThreadsByCategory(items, filter);
  }, [filter, threadListForViewer?.items]);

  const replyCount = useMemo(
    () => getProposalThreadReplyCount(threadList),
    [threadList],
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

  return {
    actionError,
    activeThreadForViewer,
    busy,
    canCreate,
    createDisabledMessage,
    createThread,
    detailError,
    detailRef,
    filter,
    listError,
    newBody,
    newCategory,
    newTitle,
    replyBody,
    replyCount,
    replyToThread,
    selectedThreadId,
    selectThread,
    setFilter,
    setNewBody,
    setNewCategory,
    setNewTitle,
    setReplyBody,
    threadCount: threadList?.items.length ?? 0,
    transitionThread,
    visibleThreads,
  };
}
