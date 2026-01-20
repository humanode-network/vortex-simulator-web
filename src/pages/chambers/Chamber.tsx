import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router";

import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Input } from "@/components/primitives/input";
import { Kicker } from "@/components/Kicker";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { PageHeader } from "@/components/PageHeader";
import { TierLabel } from "@/components/TierLabel";
import { PipelineList } from "@/components/PipelineList";
import { StatGrid, makeChamberStats } from "@/components/StatGrid";
import type {
  ChamberChatPeerDto,
  ChamberChatSignalDto,
  ChamberChatMessageDto,
  ChamberProposalStageDto,
  ChamberThreadDetailDto,
  ChamberThreadDto,
  ChamberThreadMessageDto,
  GetChamberResponse,
} from "@/types/api";
import {
  apiChamber,
  apiChamberChatPresence,
  apiChamberChatSignalPoll,
  apiChamberChatSignalPost,
  apiChambers,
  apiChamberChatPost,
  apiChamberThreadCreate,
  apiChamberThreadDetail,
  apiChamberThreadReply,
  apiMyGovernance,
} from "@/lib/apiClient";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { useAuth } from "@/app/auth/AuthContext";

const Chamber: React.FC = () => {
  const { id } = useParams();
  const { address } = useAuth();
  const [chamberTitle, setChamberTitle] = useState<string>(() =>
    id ? id.replace(/-/g, " ") : "Chamber",
  );

  const [data, setData] = useState<GetChamberResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChamberThreadDto[]>([]);
  const [chatLog, setChatLog] = useState<ChamberChatMessageDto[]>([]);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadBody, setThreadBody] = useState("");
  const [threadError, setThreadError] = useState<string | null>(null);
  const [threadBusy, setThreadBusy] = useState(false);
  const [activeThread, setActiveThread] =
    useState<ChamberThreadDetailDto | null>(null);
  const [threadMessages, setThreadMessages] = useState<
    ChamberThreadMessageDto[]
  >([]);
  const [threadDetailError, setThreadDetailError] = useState<string | null>(
    null,
  );
  const [threadReplyBody, setThreadReplyBody] = useState("");
  const [threadReplyBusy, setThreadReplyBusy] = useState(false);
  const [threadReplyError, setThreadReplyError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatBusy, setChatBusy] = useState(false);
  const [myChamberIds, setMyChamberIds] = useState<string[]>([]);
  const [chatPeers, setChatPeers] = useState<ChamberChatPeerDto[]>([]);
  const [chatSignalError, setChatSignalError] = useState<string | null>(null);

  const [peerId] = useState(
    () => `peer_${Math.random().toString(16).slice(2, 10)}`,
  );
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map());
  const chatMessageIdsRef = useRef<Set<string>>(new Set());

  const [stageFilter, setStageFilter] =
    useState<ChamberProposalStageDto>("upcoming");
  const [governorSearch, setGovernorSearch] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [chamberRes, listRes] = await Promise.all([
          apiChamber(id),
          apiChambers(),
        ]);
        if (!active) return;
        setData(chamberRes);
        const nextThreads = chamberRes.threads ?? [];
        const nextChat = chamberRes.chatLog ?? [];
        setThreads(nextThreads);
        setChatLog(nextChat);
        chatMessageIdsRef.current = new Set(nextChat.map((entry) => entry.id));
        setActiveThread(null);
        setThreadMessages([]);
        const found = listRes.items.find((c) => c.id === id);
        const fallbackTitle = chamberRes.chamber?.title;
        setChamberTitle(found?.name ?? fallbackTitle ?? id.replace(/-/g, " "));
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setData(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!address) {
      setMyChamberIds([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await apiMyGovernance();
        if (!active) return;
        setMyChamberIds(res.myChamberIds ?? []);
      } catch {
        if (!active) return;
        setMyChamberIds([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [address]);

  const filteredProposals = useMemo(
    () =>
      (data?.proposals ?? []).filter(
        (proposal) => proposal.stage === stageFilter,
      ),
    [data, stageFilter],
  );

  const filteredGovernors = useMemo(() => {
    const term = governorSearch.toLowerCase();
    return (data?.governors ?? []).filter(
      (gov) =>
        gov.name.toLowerCase().includes(term) ||
        gov.tier.toLowerCase().includes(term) ||
        gov.focus.toLowerCase().includes(term) ||
        String(gov.acm).includes(term) ||
        String(gov.lcm).includes(term) ||
        String(gov.mcm).includes(term) ||
        String(gov.delegatedWeight).includes(term),
    );
  }, [data, governorSearch]);

  const chamberStats = useMemo(() => {
    const governors = data?.governors ?? [];
    const totals = governors.reduce(
      (acc, gov) => ({
        acm: acc.acm + (Number.isFinite(gov.acm) ? gov.acm : 0),
        lcm: acc.lcm + (Number.isFinite(gov.lcm) ? gov.lcm : 0),
        mcm: acc.mcm + (Number.isFinite(gov.mcm) ? gov.mcm : 0),
      }),
      { acm: 0, lcm: 0, mcm: 0 },
    );
    return {
      governors: String(governors.length),
      acm: totals.acm.toLocaleString(),
      lcm: totals.lcm.toLocaleString(),
      mcm: totals.mcm.toLocaleString(),
    };
  }, [data]);

  const chamberMetaItems = useMemo(() => {
    const chamber = data?.chamber;
    if (!chamber) return [];
    const items = [
      { label: "Status", value: chamber.status },
      { label: "Multiplier", value: chamber.multiplier.toFixed(1) },
      { label: "Created", value: chamber.createdAt.slice(0, 10) },
      { label: "Origin", value: chamber.createdByProposalId ?? "Genesis" },
    ];
    if (chamber.dissolvedAt) {
      items.push({
        label: "Dissolved",
        value: chamber.dissolvedAt.slice(0, 10),
      });
    }
    if (chamber.dissolvedByProposalId) {
      items.push({
        label: "Dissolved by",
        value: chamber.dissolvedByProposalId,
      });
    }
    return items;
  }, [data]);

  const isMember = useMemo(() => {
    if (!address || !data) return false;
    return data.governors.some((gov) => gov.id === address);
  }, [address, data]);

  const canWrite = useMemo(() => {
    if (!address || !id) return false;
    if (id === "general") {
      return isMember || myChamberIds.length > 0;
    }
    return isMember;
  }, [address, id, isMember, myChamberIds.length]);

  const appendChatMessage = useCallback((message: ChamberChatMessageDto) => {
    if (chatMessageIdsRef.current.has(message.id)) return;
    chatMessageIdsRef.current.add(message.id);
    setChatLog((prev) => [...prev, message]);
  }, []);

  const registerDataChannel = useCallback(
    (remotePeerId: string, channel: RTCDataChannel) => {
      dataChannelsRef.current.set(remotePeerId, channel);
      channel.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data as string) as {
            type: string;
            payload: ChamberChatMessageDto;
          };
          if (parsed?.type === "chat" && parsed.payload) {
            appendChatMessage(parsed.payload);
          }
        } catch {
          // ignore malformed messages
        }
      };
      channel.onclose = () => {
        dataChannelsRef.current.delete(remotePeerId);
      };
    },
    [appendChatMessage],
  );

  const sendSignal = useCallback(
    async (input: {
      kind: "offer" | "answer" | "candidate";
      targetPeerId: string;
      payload: Record<string, unknown>;
    }) => {
      if (!id) return;
      await apiChamberChatSignalPost(id, {
        peerId,
        kind: input.kind,
        targetPeerId: input.targetPeerId,
        payload: input.payload,
      });
    },
    [id, peerId],
  );

  const ensurePeerConnection = useCallback(
    (remotePeerId: string, isCaller: boolean): RTCPeerConnection => {
      const existing = peerConnectionsRef.current.get(remotePeerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        void sendSignal({
          kind: "candidate",
          targetPeerId: remotePeerId,
          payload: event.candidate.toJSON() as Record<string, unknown>,
        });
      };
      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed" ||
          pc.connectionState === "disconnected"
        ) {
          pc.close();
          peerConnectionsRef.current.delete(remotePeerId);
          dataChannelsRef.current.delete(remotePeerId);
        }
      };

      if (isCaller) {
        const channel = pc.createDataChannel("chat");
        registerDataChannel(remotePeerId, channel);
      } else {
        pc.ondatachannel = (event) => {
          registerDataChannel(remotePeerId, event.channel);
        };
      }

      peerConnectionsRef.current.set(remotePeerId, pc);
      return pc;
    },
    [registerDataChannel, sendSignal],
  );

  const handleSignal = useCallback(
    async (signal: ChamberChatSignalDto) => {
      if (!signal?.fromPeerId) return;
      const remotePeerId = signal.fromPeerId;
      const kind = signal.kind;
      const payload = signal.payload as
        | RTCSessionDescriptionInit
        | RTCIceCandidateInit;

      if (kind === "offer") {
        const pc = ensurePeerConnection(remotePeerId, false);
        await pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (pc.localDescription) {
          await sendSignal({
            kind: "answer",
            targetPeerId: remotePeerId,
            payload: pc.localDescription.toJSON() as unknown as Record<
              string,
              unknown
            >,
          });
        }
        return;
      }

      if (kind === "answer") {
        const pc = ensurePeerConnection(remotePeerId, true);
        await pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
        return;
      }

      if (kind === "candidate") {
        const pc = ensurePeerConnection(remotePeerId, false);
        try {
          await pc.addIceCandidate(payload as RTCIceCandidateInit);
        } catch {
          // ignore invalid candidates
        }
      }
    },
    [ensurePeerConnection, sendSignal],
  );

  const broadcastChatMessage = useCallback((message: ChamberChatMessageDto) => {
    const payload = JSON.stringify({ type: "chat", payload: message });
    for (const channel of dataChannelsRef.current.values()) {
      if (channel.readyState === "open") {
        channel.send(payload);
      }
    }
  }, []);

  useEffect(() => {
    if (!id || !address || !canWrite) return undefined;
    let active = true;
    const poll = async () => {
      try {
        const res = await apiChamberChatSignalPoll(id, peerId);
        if (!active) return;
        for (const signal of res.messages ?? []) {
          await handleSignal(signal);
        }
        setChatSignalError(null);
      } catch (error) {
        if (!active) return;
        setChatSignalError((error as Error).message);
      }
      if (active) {
        window.setTimeout(poll, 2000);
      }
    };
    poll();
    return () => {
      active = false;
    };
  }, [address, canWrite, handleSignal, id, peerId]);

  useEffect(() => {
    if (!id || !address || !canWrite) return undefined;
    let active = true;
    const tick = async () => {
      try {
        const res = await apiChamberChatPresence(id, peerId);
        if (!active) return;
        const peers = (res.peers ?? []).filter(
          (peer) => peer.peerId !== peerId,
        );
        setChatPeers(peers);

        for (const peer of peers) {
          if (peerConnectionsRef.current.has(peer.peerId)) continue;
          if (peerId.localeCompare(peer.peerId) < 0) {
            const pc = ensurePeerConnection(peer.peerId, true);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            if (pc.localDescription) {
              await sendSignal({
                kind: "offer",
                targetPeerId: peer.peerId,
                payload: pc.localDescription.toJSON() as unknown as Record<
                  string,
                  unknown
                >,
              });
            }
          }
        }
        setChatSignalError(null);
      } catch (error) {
        if (!active) return;
        setChatSignalError((error as Error).message);
      }
      if (active) {
        window.setTimeout(tick, 6000);
      }
    };
    tick();
    return () => {
      active = false;
    };
  }, [address, canWrite, ensurePeerConnection, id, peerId, sendSignal]);

  useEffect(() => {
    return () => {
      for (const pc of peerConnectionsRef.current.values()) {
        pc.close();
      }
      peerConnectionsRef.current.clear();
      dataChannelsRef.current.clear();
    };
  }, []);

  const handleThreadCreate = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!id) return;
      if (!canWrite) {
        setThreadError(
          "You are not eligible to start a thread in this chamber.",
        );
        return;
      }
      if (!threadTitle.trim() || !threadBody.trim()) {
        setThreadError("Thread title and body are required.");
        return;
      }
      setThreadBusy(true);
      setThreadError(null);
      try {
        const res = await apiChamberThreadCreate({
          chamberId: id,
          title: threadTitle.trim(),
          body: threadBody.trim(),
        });
        setThreads((prev) => [res.thread, ...prev]);
        setThreadTitle("");
        setThreadBody("");
      } catch (error) {
        setThreadError((error as Error).message);
      } finally {
        setThreadBusy(false);
      }
    },
    [canWrite, id, threadBody, threadTitle],
  );

  const handleThreadSelect = useCallback(
    async (threadId: string) => {
      if (!id) return;
      setThreadDetailError(null);
      try {
        const detail = await apiChamberThreadDetail(id, threadId);
        setActiveThread(detail);
        setThreadMessages(detail.messages ?? []);
      } catch (error) {
        setThreadDetailError((error as Error).message);
      }
    },
    [id],
  );

  const handleThreadReply = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!id || !activeThread) return;
      if (!canWrite) {
        setThreadReplyError("You are not eligible to reply in this chamber.");
        return;
      }
      if (!threadReplyBody.trim()) {
        setThreadReplyError("Reply body is required.");
        return;
      }
      setThreadReplyBusy(true);
      setThreadReplyError(null);
      try {
        const res = await apiChamberThreadReply({
          chamberId: id,
          threadId: activeThread.thread.id,
          body: threadReplyBody.trim(),
        });
        setThreadMessages((prev) => [...prev, res.message]);
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === activeThread.thread.id
              ? {
                  ...thread,
                  replies: res.replies,
                  updated: new Date().toISOString().slice(0, 10),
                }
              : thread,
          ),
        );
        setThreadReplyBody("");
      } catch (error) {
        setThreadReplyError((error as Error).message);
      } finally {
        setThreadReplyBusy(false);
      }
    },
    [activeThread, canWrite, id, threadReplyBody],
  );

  const handleChatSend = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!id) return;
      if (!canWrite) {
        setChatError("You are not eligible to chat in this chamber.");
        return;
      }
      if (!chatMessage.trim()) {
        setChatError("Chat message is required.");
        return;
      }
      setChatBusy(true);
      setChatError(null);
      try {
        const res = await apiChamberChatPost({
          chamberId: id,
          message: chatMessage.trim(),
        });
        appendChatMessage(res.message);
        broadcastChatMessage(res.message);
        setChatMessage("");
      } catch (error) {
        setChatError((error as Error).message);
      } finally {
        setChatBusy(false);
      }
    },
    [appendChatMessage, broadcastChatMessage, canWrite, chatMessage, id],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="chamber" />
      <PageHeader
        eyebrow="Chamber detail"
        title={<span className="capitalize">{chamberTitle}</span>}
        description="Proposal status, governor roster, and forum activity for this chamber."
      />

      {loadError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-destructive"
        >
          Chamber unavailable: {loadError}
        </Surface>
      ) : null}

      {data ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <Kicker>Chamber profile</Kicker>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              {chamberMetaItems.map((item) => (
                <Surface
                  key={item.label}
                  variant="panelAlt"
                  radius="xl"
                  shadow="tile"
                  className="px-3 py-2"
                >
                  <Kicker className="text-text">{item.label}</Kicker>
                  <p className="text-base font-semibold text-text">
                    {item.value}
                  </p>
                </Surface>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Kicker>Chamber stats</Kicker>
              <CardTitle>Governance metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <StatGrid items={makeChamberStats(chamberStats)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Kicker>Pipeline</Kicker>
              <CardTitle>Proposal flow</CardTitle>
            </CardHeader>
            <CardContent>
              {data.pipeline ? (
                <PipelineList pipeline={data.pipeline} />
              ) : (
                <Surface
                  variant="panelAlt"
                  radius="xl"
                  borderStyle="dashed"
                  className="px-3 py-4 text-center text-sm text-muted"
                >
                  No pipeline data yet.
                </Surface>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader className="flex flex-col gap-4 pb-4">
            <div>
              <Kicker>Chamber vote</Kicker>
              <CardTitle>Proposal status</CardTitle>
            </div>
            <div
              className="flex w-full flex-wrap justify-center gap-2"
              role="tablist"
              aria-label="Proposal stages"
            >
              {(data?.stageOptions ?? []).map((option) => {
                const isSelected = stageFilter === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    role="tab"
                    size="sm"
                    aria-selected={isSelected}
                    variant="ghost"
                    onClick={() => setStageFilter(option.value)}
                    className={
                      isSelected
                        ? "border-(--glass-border-strong) bg-(--btn-primary-active-bg) text-primary-foreground shadow-(--shadow-primary) filter-[saturate(1.35)]"
                        : "border-border bg-panel text-muted hover:text-primary"
                    }
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredProposals.length === 0 ? (
              <Surface
                variant="panelAlt"
                borderStyle="dashed"
                className="px-4 py-6 text-center text-sm text-muted"
              >
                No proposals in this stage.
              </Surface>
            ) : (
              filteredProposals.map((proposal) => (
                <Surface key={proposal.id} variant="panelAlt" className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Kicker>{proposal.meta}</Kicker>
                      <h3 className="text-lg font-semibold text-text">
                        {proposal.title}
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      size="sm"
                      className="font-semibold"
                    >
                      Lead {proposal.lead}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-text">{proposal.summary}</p>
                  {(() => {
                    const metaTiles = [
                      { label: "Next step", value: proposal.nextStep },
                      { label: "Timing", value: proposal.timing },
                    ];
                    if (typeof proposal.activeGovernors === "number") {
                      metaTiles.push({
                        label: "Active governors",
                        value: proposal.activeGovernors.toLocaleString(),
                      });
                    }
                    const columns =
                      metaTiles.length === 3
                        ? "sm:grid-cols-3"
                        : "sm:grid-cols-2";
                    return (
                      <div
                        className={`mt-3 grid gap-2 text-sm text-muted ${columns}`}
                      >
                        {metaTiles.map((tile) => (
                          <Surface
                            key={tile.label}
                            variant="panel"
                            radius="xl"
                            shadow="control"
                            className="px-3 py-2"
                          >
                            <Kicker className="text-text">{tile.label}</Kicker>
                            <p className="text-sm font-semibold text-text">
                              {tile.value}
                            </p>
                          </Surface>
                        ))}
                      </div>
                    );
                  })()}
                </Surface>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-3">
            <div>
              <Kicker>Governors</Kicker>
              <CardTitle>Chamber roster</CardTitle>
            </div>
            <span className="rounded-full border border-border bg-panel-alt px-3 py-1 text-sm font-semibold">
              {data?.governors.length ?? 0}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={governorSearch}
              onChange={(event) => setGovernorSearch(event.target.value)}
              placeholder="Search governors"
            />
            <ul className="max-h-[360px] space-y-2 overflow-auto pr-1 text-sm text-text">
              {filteredGovernors.map((gov) => (
                <Surface
                  as="li"
                  key={gov.id}
                  variant="panelAlt"
                  radius="xl"
                  shadow="control"
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div>
                    <p className="font-semibold">{gov.name}</p>
                    <p className="text-xs text-muted">
                      <TierLabel tier={gov.tier} /> · {gov.focus}
                    </p>
                    <p className="text-xs text-muted">
                      ACM {gov.acm.toLocaleString()} · LCM{" "}
                      {gov.lcm.toLocaleString()} · MCM{" "}
                      {gov.mcm.toLocaleString()}
                      {gov.delegatedWeight > 0
                        ? ` · Delegated +${gov.delegatedWeight}`
                        : ""}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/app/human-nodes/${gov.id}`}>Profile</Link>
                  </Button>
                </Surface>
              ))}
              {filteredGovernors.length === 0 && (
                <Surface
                  as="li"
                  variant="panelAlt"
                  radius="xl"
                  borderStyle="dashed"
                  className="px-3 py-4 text-center text-muted"
                >
                  No governors found.
                </Surface>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Surface
        as="section"
        variant="panel"
        radius="2xl"
        shadow="card"
        className="p-5"
      >
        <header className="mb-4 flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Kicker>Chamber forum</Kicker>
            <h2 className="text-lg font-semibold text-text">Threads & chat</h2>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="space-y-4">
            <Surface variant="panelAlt" className="p-4">
              <header className="text-sm font-semibold text-text">
                Start a thread
              </header>
              <form onSubmit={handleThreadCreate} className="mt-3 space-y-3">
                <Input
                  value={threadTitle}
                  onChange={(event) => setThreadTitle(event.target.value)}
                  placeholder="Thread title"
                  disabled={!canWrite || threadBusy}
                />
                <textarea
                  value={threadBody}
                  onChange={(event) => setThreadBody(event.target.value)}
                  placeholder="Write the opening post"
                  disabled={!canWrite || threadBusy}
                  className="min-h-[110px] w-full resize-y rounded-xl border border-border bg-panel-alt px-3 py-2 text-sm text-text shadow-[var(--shadow-control)] focus-visible:ring-2 focus-visible:ring-[color:var(--primary-dim)] focus-visible:outline-none"
                />
                {threadError ? (
                  <p className="text-sm text-destructive">{threadError}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!canWrite || threadBusy}
                  >
                    {threadBusy ? "Posting..." : "Post thread"}
                  </Button>
                  {!canWrite ? (
                    <span className="text-xs text-muted">
                      Read-only for non-members.
                    </span>
                  ) : null}
                </div>
              </form>
            </Surface>

            {threads.length === 0 ? (
              <NoDataYetBar label="threads" />
            ) : (
              threads.map((thread) => (
                <article key={thread.id} className="contents">
                  <Surface variant="panelAlt" className="px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-text">
                          {thread.title}
                        </h3>
                        <p className="text-sm text-muted">
                          {thread.author} · {thread.replies} replies · Updated{" "}
                          {thread.updated}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleThreadSelect(thread.id)}
                      >
                        Open
                      </Button>
                    </div>
                  </Surface>
                </article>
              ))
            )}

            {threadDetailError ? (
              <Surface
                variant="panelAlt"
                radius="xl"
                className="px-4 py-3 text-sm text-destructive"
              >
                {threadDetailError}
              </Surface>
            ) : null}

            {activeThread ? (
              <Surface variant="panelAlt" className="p-4">
                <header className="mb-2 text-sm font-semibold text-text">
                  {activeThread.thread.title}
                </header>
                <p className="text-sm text-muted">
                  {activeThread.thread.author} ·{" "}
                  {activeThread.thread.createdAt.slice(0, 10)}
                </p>
                <p className="mt-3 text-sm text-text">
                  {activeThread.thread.body}
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  {threadMessages.length === 0 ? (
                    <p className="text-muted">No replies yet.</p>
                  ) : (
                    threadMessages.map((message) => (
                      <Surface
                        key={message.id}
                        variant="panel"
                        className="px-3 py-2"
                      >
                        <p className="text-xs text-muted">
                          {message.author} · {message.createdAt.slice(0, 10)}
                        </p>
                        <p className="text-sm text-text">{message.message}</p>
                      </Surface>
                    ))
                  )}
                </div>
                <form onSubmit={handleThreadReply} className="mt-4 space-y-3">
                  <textarea
                    value={threadReplyBody}
                    onChange={(event) => setThreadReplyBody(event.target.value)}
                    placeholder="Write a reply"
                    disabled={!canWrite || threadReplyBusy}
                    className="min-h-[90px] w-full resize-y rounded-xl border border-border bg-panel-alt px-3 py-2 text-sm text-text shadow-[var(--shadow-control)] focus-visible:ring-2 focus-visible:ring-[color:var(--primary-dim)] focus-visible:outline-none"
                  />
                  {threadReplyError ? (
                    <p className="text-sm text-destructive">
                      {threadReplyError}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!canWrite || threadReplyBusy}
                    >
                      {threadReplyBusy ? "Posting..." : "Reply"}
                    </Button>
                    {!canWrite ? (
                      <span className="text-xs text-muted">
                        Read-only for non-members.
                      </span>
                    ) : null}
                  </div>
                </form>
              </Surface>
            ) : null}
          </div>

          <Surface variant="panelAlt" className="p-4">
            <header className="text-sm font-semibold text-text">
              Chamber chat
            </header>
            <p className="text-xs text-muted">
              Peers online: {chatPeers.length}
            </p>
            <div className="my-3 max-h-64 space-y-2 overflow-auto pr-2 text-sm">
              {chatLog.length === 0 ? (
                <p className="text-muted">No chat messages yet.</p>
              ) : (
                chatLog.map((entry) => (
                  <p key={entry.id}>
                    <strong>{entry.author}:</strong> {entry.message}
                  </p>
                ))
              )}
            </div>
            <form onSubmit={handleChatSend} className="flex gap-2">
              <Input
                value={chatMessage}
                onChange={(event) => setChatMessage(event.target.value)}
                placeholder="Send a message"
                disabled={!canWrite || chatBusy}
              />
              <Button type="submit" size="sm" disabled={!canWrite || chatBusy}>
                {chatBusy ? "Sending..." : "Send"}
              </Button>
            </form>
            {chatError ? (
              <p className="mt-2 text-sm text-destructive">{chatError}</p>
            ) : null}
            {chatSignalError ? (
              <p className="mt-2 text-xs text-muted">{chatSignalError}</p>
            ) : null}
            {!canWrite ? (
              <p className="mt-2 text-xs text-muted">
                Read-only for non-members.
              </p>
            ) : null}
          </Surface>
        </div>
      </Surface>
    </div>
  );
};

export default Chamber;
