import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "react-router";

import { useAuth } from "@/app/auth/AuthContext";
import { useActionRunner } from "@/hooks/useActionRunner";
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
  const documentScope = useMemo(() => ({}), [proposalId, auth.address]);
  const {
    actionError,
    mutating: busy,
    runAction: runScopedAction,
    reportError: setActionError,
  } = useActionRunner({ scope: documentScope });
  const [filter, setFilter] = useState<ProposalThreadCategoryDto | "all">(
    "all",
  );
  const [newCategory, setNewCategory] =
    useState<ProposalThreadCategoryDto>("question");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const detailRef = useRef<HTMLDivElement | null>(null);
  const listRequest = useRef(0);
  const detailRequest = useRef(0);
  const scope = useRef<{
    selectedThreadId: string | null;
    document: object;
  } | null>(null);

  useLayoutEffect(() => {
    scope.current = { selectedThreadId, document: documentScope };
    return () => {
      scope.current = null;
    };
  }, [documentScope, selectedThreadId]);

  useEffect(() => {
    setNewTitle("");
    setNewBody("");
    setReplyBody("");
  }, [proposalId, auth.address]);

  const loadList = useCallback(async () => {
    if (!proposalId) return;
    const request = ++listRequest.current;
    try {
      const next = await apiProposalThreads(proposalId);
      if (request !== listRequest.current) return;
      setThreadList(next);
      setListError(null);
    } catch (error) {
      if (request !== listRequest.current) return;
      setThreadList(null);
      setListError((error as Error).message);
    }
  }, [proposalId]);

  const loadDetail = useCallback(
    async (threadId: string) => {
      if (!proposalId || !threadId) return;
      const request = ++detailRequest.current;
      try {
        const detail = await apiProposalThreadDetail(proposalId, threadId);
        if (request !== detailRequest.current) return;
        setActiveThread(detail);
        setDetailError(null);
      } catch (error) {
        if (request !== detailRequest.current) return;
        setActiveThread(null);
        setDetailError((error as Error).message);
      }
    },
    [proposalId],
  );

  useEffect(() => {
    setThreadList(null);
    setListError(null);
    void loadList();
    return () => {
      listRequest.current += 1;
    };
  }, [loadList, auth.address]);

  useEffect(() => {
    setActiveThread(null);
    setDetailError(null);
    if (!selectedThreadId) {
      return;
    }
    void loadDetail(selectedThreadId);
    return () => {
      detailRequest.current += 1;
    };
  }, [loadDetail, selectedThreadId, auth.address]);

  useEffect(() => {
    setReplyBody("");
    setActionError(null);
  }, [selectedThreadId]);

  const writeAllowed = canAttemptProposalDiscussionWrite(auth);

  const threadListForViewer = useMemo<ProposalThreadListDto | null>(() => {
    return restrictProposalThreadListForReadOnly(threadList, writeAllowed);
  }, [threadList, writeAllowed]);

  const activeThreadForViewer = useMemo<ProposalThreadDetailDto | null>(() => {
    return restrictProposalThreadDetailForReadOnly(
      activeThread?.thread.id === selectedThreadId ? activeThread : null,
      writeAllowed,
    );
  }, [activeThread, selectedThreadId, writeAllowed]);

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

  const runAction = async (
    retryKey: string,
    action: (guards: {
      documentCurrent: () => boolean;
      threadCurrent: () => boolean;
      idempotencyKey?: string;
    }) => Promise<void>,
  ) => {
    const started = scope.current;
    if (!started) return;
    const documentCurrent = () => scope.current?.document === started.document;
    const threadCurrent = () => documentCurrent() && scope.current === started;
    await runScopedAction(
      (idempotencyKey) =>
        action({ documentCurrent, threadCurrent, idempotencyKey }),
      { errorCurrent: threadCurrent, retryKey },
    );
  };

  const createThread = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!proposalId || !canCreate) return;
    if (!newTitle.trim() || !newBody.trim()) {
      setActionError("Thread title and body are required.");
      return;
    }
    const payload = {
      proposalId,
      category: newCategory,
      title: newTitle.trim(),
      body: newBody.trim(),
    };
    await runAction(
      `create:${JSON.stringify(payload)}`,
      async ({ documentCurrent, threadCurrent, idempotencyKey }) => {
        const res = await apiProposalThreadCreate({
          ...payload,
          idempotencyKey,
        });
        if (!documentCurrent()) return;
        setNewTitle("");
        setNewBody("");
        await loadList();
        if (threadCurrent()) selectThread(res.thread.id);
      },
    );
  };

  const replyToThread = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!proposalId || !activeThread || !replyBody.trim()) return;
    if (activeThread.thread.id !== selectedThreadId) return;
    if (!writeAllowed || !activeThread.thread.permissions.canReply) return;
    const payload = {
      proposalId,
      threadId: activeThread.thread.id,
      body: replyBody.trim(),
    };
    await runAction(
      `reply:${JSON.stringify(payload)}`,
      async ({ documentCurrent, threadCurrent, idempotencyKey }) => {
        await apiProposalThreadReply({ ...payload, idempotencyKey });
        if (!documentCurrent()) return;
        await loadList();
        if (!threadCurrent()) return;
        setReplyBody("");
        await loadDetail(activeThread.thread.id);
      },
    );
  };

  const transitionThread = async (status: ProposalThreadDto["status"]) => {
    if (!proposalId || !activeThread) return;
    if (activeThread.thread.id !== selectedThreadId) return;
    if (!writeAllowed || !activeThread.thread.permissions.canTransition) return;
    const payload = { proposalId, threadId: activeThread.thread.id, status };
    await runAction(
      `transition:${JSON.stringify(payload)}`,
      async ({ documentCurrent, threadCurrent, idempotencyKey }) => {
        await apiProposalThreadTransition({ ...payload, idempotencyKey });
        if (!documentCurrent()) return;
        await loadList();
        if (threadCurrent()) await loadDetail(activeThread.thread.id);
      },
    );
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
