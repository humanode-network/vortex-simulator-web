import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router";

import { Button } from "@/components/primitives/button";
import {
  GlassyCompactGrid,
  GlassyCompactMetric,
  GlassyCompactRow,
  GlassyKeyValue,
  GlassySection,
  GlassyStatusChip,
  GlassyTile,
  GlassyTileHeading,
} from "@/components/GlassySection";
import { GlassyRecordCard } from "@/components/GlassyRecordCard";
import { Input } from "@/components/primitives/input";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { TierLabel } from "@/components/TierLabel";
import { AddressInline } from "@/components/AddressInline";
import type {
  ChamberChatPeerDto,
  ChamberChatSignalDto,
  ChamberChatMessageDto,
  ChamberCmDto,
  ChamberProposalStageDto,
  ChamberThreadDetailDto,
  ChamberThreadDto,
  ChamberThreadMessageDto,
  GetChamberResponse,
  GetMyGovernanceResponse,
} from "@/types/api";
import {
  apiChamber,
  apiChamberCm,
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
import { formatDate, formatDateTime } from "@/lib/dateTime";
import { formatLoadError } from "@/lib/errorFormatting";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { useAuth } from "@/app/auth/AuthContext";
import { addressesReferToSameIdentity } from "@/lib/addressIdentity";
import { formatChamberMultiplier } from "./components/ChamberVisuals";
import type { ProposalStage } from "@/types/stages";

const chamberProposalStageLabels: Record<ChamberProposalStageDto, string> = {
  upcoming: "Proposal pool",
  live: "Chamber vote",
  ended: "Formation",
};

const chamberProposalRecordStage: Record<
  ChamberProposalStageDto,
  ProposalStage
> = {
  upcoming: "pool",
  live: "vote",
  ended: "build",
};

const chamberProposalStageCountKey: Record<
  ChamberProposalStageDto,
  "build" | "pool" | "vote"
> = {
  upcoming: "pool",
  live: "vote",
  ended: "build",
};

const Chamber: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { address } = useAuth();
  const [chamberTitle, setChamberTitle] = useState<string>(() =>
    id ? id.replace(/-/g, " ") : "Chamber",
  );

  const [data, setData] = useState<GetChamberResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cmData, setCmData] = useState<ChamberCmDto | null>(null);
  const [cmError, setCmError] = useState<string | null>(null);
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
  const [myGovernance, setMyGovernance] =
    useState<GetMyGovernanceResponse | null>(null);
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
  const [expandedProposalId, setExpandedProposalId] = useState<string | null>(
    null,
  );
  const [governorSearch, setGovernorSearch] = useState("");
  const requestedThreadId = searchParams.get("thread")?.trim() || null;

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [chamberRes, listRes] = await Promise.all([
          apiChamber(id),
          apiChambers(),
        ]);
        let nextCm: ChamberCmDto | null = null;
        let nextCmError: string | null = null;
        try {
          nextCm = await apiChamberCm(id);
        } catch (error) {
          nextCm = null;
          nextCmError = (error as Error).message;
        }
        if (!active) return;
        setData(chamberRes);
        setCmData(nextCm);
        setCmError(nextCmError);
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
        setCmData(null);
        setCmError((error as Error).message);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!address) {
      setMyGovernance(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await apiMyGovernance();
        if (!active) return;
        setMyGovernance(res);
      } catch {
        if (!active) return;
        setMyGovernance(null);
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
        String(gov.delegatedWeight).includes(term) ||
        String(gov.effectiveVotingPower).includes(term) ||
        gov.delegateeAddress?.toLowerCase().includes(term) ||
        gov.inboundDelegators.some((address) =>
          address.toLowerCase().includes(term),
        ),
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
      { label: "Created", value: formatDate(chamber.createdAt) },
      { label: "Origin", value: chamber.createdByProposalId ?? "Genesis" },
    ];
    if (chamber.dissolvedAt) {
      items.push({
        label: "Dissolved",
        value: formatDate(chamber.dissolvedAt),
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
    return data.governors.some((gov) =>
      addressesReferToSameIdentity(gov.id, address),
    );
  }, [address, data]);

  const canWrite = useMemo(() => {
    if (!address || !id) return false;
    if (id === "general") {
      return (
        isMember ||
        (myGovernance?.delegation.chambers ?? []).some(
          (item) => item.chamberId === "general",
        )
      );
    }
    return isMember;
  }, [address, id, isMember, myGovernance]);

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
      toPeerId: string;
      payload: Record<string, unknown>;
    }) => {
      if (!id) return;
      await apiChamberChatSignalPost(id, {
        peerId,
        kind: input.kind,
        toPeerId: input.toPeerId,
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
          toPeerId: remotePeerId,
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
            toPeerId: remotePeerId,
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
                toPeerId: peer.peerId,
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
                  updated: formatDateTime(new Date()),
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

  useEffect(() => {
    if (!requestedThreadId) return;
    if (activeThread?.thread.id === requestedThreadId) return;
    void handleThreadSelect(requestedThreadId);
  }, [activeThread?.thread.id, handleThreadSelect, requestedThreadId]);

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

      {loadError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-destructive"
        >
          Chamber unavailable: {formatLoadError(loadError)}
        </Surface>
      ) : null}
      {!data && !loadError ? (
        <GlassyTile className="px-5 py-4 text-sm text-muted">
          Loading chamber…
        </GlassyTile>
      ) : null}

      {data ? (
        <GlassySection
          title={<span className="capitalize">{chamberTitle}</span>}
        >
          <GlassyCompactGrid className="sm:grid-cols-2 lg:grid-cols-4">
            <GlassyCompactMetric
              label="Multiplier"
              value={formatChamberMultiplier(data.chamber.multiplier)}
            />
            {chamberMetaItems.map((item) => (
              <GlassyCompactMetric
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
            <GlassyCompactMetric
              label="Governors"
              value={chamberStats.governors}
            />
            <GlassyCompactMetric
              label="Members' ACM"
              value={chamberStats.acm}
            />
            <GlassyCompactMetric label="LCM" value={chamberStats.lcm} />
            <GlassyCompactMetric label="MCM" value={chamberStats.mcm} />
          </GlassyCompactGrid>
        </GlassySection>
      ) : null}

      {data ? (
        <GlassySection title="Chamber CM activity">
          {cmData ? (
            <div className="grid gap-3 lg:grid-cols-3">
              <GlassyTile className="space-y-3">
                <GlassyTileHeading>Top contributors</GlassyTileHeading>
                {cmData.topContributors.length === 0 ? (
                  <p className="m-0 text-sm text-muted">
                    No CM contributions yet.
                  </p>
                ) : (
                  <ul className="m-0 space-y-2 p-0 text-sm text-text">
                    {cmData.topContributors.slice(0, 5).map((entry) => (
                      <li
                        key={entry.address}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[color:var(--surface-glass-border)] px-3 py-2"
                      >
                        <AddressInline
                          address={entry.address}
                          className="min-w-0 flex-1"
                          textClassName="[overflow-wrap:anywhere] break-words"
                        />
                        <span className="text-xs text-muted">
                          LCM {entry.lcm} · MCM {entry.mcm} · ACM contribution{" "}
                          {entry.acm}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </GlassyTile>

              <GlassyTile className="space-y-3">
                <GlassyTileHeading>Multiplier submissions</GlassyTileHeading>
                {cmData.submissions.length === 0 ? (
                  <p className="m-0 text-sm text-muted">
                    No multiplier submissions yet.
                  </p>
                ) : (
                  <ul className="m-0 space-y-2 p-0 text-sm text-text">
                    {cmData.submissions.slice(0, 5).map((entry) => (
                      <li
                        key={`${entry.address}-${entry.submittedAt}`}
                        className="flex flex-col gap-1 rounded-[8px] border border-[color:var(--surface-glass-border)] px-3 py-2"
                      >
                        <AddressInline
                          address={entry.address}
                          className="min-w-0"
                          textClassName="font-semibold [overflow-wrap:anywhere] break-words"
                        />
                        <span className="text-xs text-muted">
                          M × {entry.multiplier} ·{" "}
                          {formatDate(entry.submittedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </GlassyTile>

              <GlassyTile className="space-y-3">
                <GlassyTileHeading>Recent CM awards</GlassyTileHeading>
                {cmData.history.length === 0 ? (
                  <p className="m-0 text-sm text-muted">No CM awards yet.</p>
                ) : (
                  <ul className="m-0 space-y-2 p-0 text-sm text-text">
                    {cmData.history.slice(0, 4).map((entry) => (
                      <li
                        key={`${entry.proposalId}-${entry.awardedAt}`}
                        className="flex flex-col gap-1 rounded-[8px] border border-[color:var(--surface-glass-border)] px-3 py-2"
                      >
                        <span className="font-semibold">{entry.title}</span>
                        <span className="text-xs text-muted">
                          M × {entry.multiplier} · LCM {entry.lcm} · MCM{" "}
                          {entry.mcm}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </GlassyTile>
            </div>
          ) : (
            <Surface
              variant="panelAlt"
              radius="xl"
              borderStyle="dashed"
              className="px-4 py-4 text-center text-sm text-muted"
            >
              {cmError
                ? `CM summary unavailable: ${formatLoadError(cmError)}`
                : "Loading CM…"}
            </Surface>
          )}
        </GlassySection>
      ) : null}

      {data ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <GlassySection title="Proposal status">
            <div
              className="flex w-full flex-wrap justify-center gap-2"
              role="tablist"
              aria-label="Proposal stages"
            >
              {(data?.stageOptions ?? []).map((option) => {
                const isSelected = stageFilter === option.value;
                const countKey = chamberProposalStageCountKey[option.value];
                const count = data.pipeline?.[countKey] ?? 0;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    role="tab"
                    size="sm"
                    aria-selected={isSelected}
                    variant="ghost"
                    onClick={() => {
                      setStageFilter(option.value);
                      setExpandedProposalId(null);
                    }}
                    className={
                      isSelected
                        ? "border-(--glass-border-strong) bg-(--btn-primary-active-bg) text-primary-foreground shadow-(--shadow-primary) filter-[saturate(1.35)]"
                        : "border-border bg-panel text-muted hover:text-primary"
                    }
                  >
                    <span>
                      {chamberProposalStageLabels[option.value] ?? option.label}
                    </span>
                    <span className="ml-2 rounded-full bg-[color:var(--control-glass-bg)] px-2 py-0.5 text-xs">
                      {count}
                    </span>
                  </Button>
                );
              })}
            </div>
            {filteredProposals.length === 0 ? (
              <Surface
                variant="panelAlt"
                borderStyle="dashed"
                className="px-4 py-6 text-center text-sm text-muted"
              >
                No proposals in this stage.
              </Surface>
            ) : (
              filteredProposals.map((proposal) => {
                const proposalHref =
                  proposal.href ??
                  (proposal.stage === "upcoming"
                    ? `/app/proposals/${proposal.id}/pp`
                    : proposal.stage === "live"
                      ? `/app/proposals/${proposal.id}/chamber`
                      : `/app/proposals/${proposal.id}/formation`);
                const expanded = expandedProposalId === proposal.id;
                return (
                  <GlassyRecordCard
                    key={proposal.id}
                    dateText={proposal.timing}
                    expanded={expanded}
                    meta={proposal.meta}
                    onToggle={() =>
                      setExpandedProposalId((current) =>
                        current === proposal.id ? null : proposal.id,
                      )
                    }
                    rail={expanded ? "action" : "idle"}
                    stage={chamberProposalRecordStage[proposal.stage]}
                    summary={proposal.summary}
                    title={proposal.title}
                  >
                    {(() => {
                      const metaTiles = [
                        { label: "Lead", value: proposal.lead },
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
                        metaTiles.length === 4
                          ? "sm:grid-cols-2 xl:grid-cols-4"
                          : "sm:grid-cols-3";
                      return (
                        <div
                          className={`grid gap-2 text-sm text-muted ${columns}`}
                        >
                          {metaTiles.map((tile) => (
                            <GlassyKeyValue
                              key={tile.label}
                              className="glassy-key-value--stacked glassy-key-value--metric"
                              label={tile.label}
                              value={tile.value}
                            />
                          ))}
                        </div>
                      );
                    })()}
                    <div className="flex justify-end">
                      <Button asChild size="sm">
                        <Link to={proposalHref}>Open proposal</Link>
                      </Button>
                    </div>
                  </GlassyRecordCard>
                );
              })
            )}
          </GlassySection>

          <GlassySection
            title={
              <span className="flex w-full items-center justify-between gap-3">
                <span>Chamber roster</span>
                <GlassyStatusChip tone="neutral">
                  {data?.governors.length ?? 0}
                </GlassyStatusChip>
              </span>
            }
          >
            <Input
              value={governorSearch}
              onChange={(event) => setGovernorSearch(event.target.value)}
              placeholder="Search governors"
            />
            <ul className="max-h-none space-y-2 overflow-visible p-0 pr-0 text-sm text-text lg:max-h-[360px] lg:overflow-auto lg:pr-1">
              {filteredGovernors.map((gov) => (
                <li key={gov.id}>
                  <GlassyCompactRow
                    title={gov.name}
                    actions={
                      <Button asChild size="compact" variant="ghost">
                        <Link to={`/app/human-nodes/${gov.id}`}>Profile</Link>
                      </Button>
                    }
                  >
                    <p className="m-0 text-xs text-muted">
                      <TierLabel tier={gov.tier} /> · {gov.focus}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <GlassyKeyValue
                        className="glassy-key-value--stacked glassy-key-value--metric"
                        label="Vote power"
                        value={
                          gov.delegatedWeight > 0
                            ? `${gov.effectiveVotingPower} (+${gov.delegatedWeight})`
                            : gov.effectiveVotingPower
                        }
                      />
                      <GlassyKeyValue
                        className="glassy-key-value--stacked glassy-key-value--metric"
                        label="Members' ACM"
                        value={gov.acm.toLocaleString()}
                      />
                      <GlassyKeyValue
                        className="glassy-key-value--stacked glassy-key-value--metric"
                        label="LCM"
                        value={gov.lcm.toLocaleString()}
                      />
                      <GlassyKeyValue
                        className="glassy-key-value--stacked glassy-key-value--metric"
                        label="MCM"
                        value={gov.mcm.toLocaleString()}
                      />
                    </div>
                    {gov.delegateeAddress ? (
                      <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted">
                        <span>Delegates to</span>
                        <AddressInline
                          address={gov.delegateeAddress}
                          showCopy={false}
                        />
                      </div>
                    ) : null}
                    {gov.inboundDelegators.length > 0 ? (
                      <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted">
                        <span>Backed by</span>
                        {gov.inboundDelegators.map((address) => (
                          <AddressInline
                            key={`${gov.id}-${address}`}
                            address={address}
                            showCopy={false}
                          />
                        ))}
                      </div>
                    ) : null}
                  </GlassyCompactRow>
                </li>
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
          </GlassySection>
        </div>
      ) : null}

      {data ? (
        <GlassySection title="Threads & chat">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div className="space-y-4">
              <GlassyTile>
                <GlassyTileHeading>Start a thread</GlassyTileHeading>
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
                    className="min-h-[110px] w-full resize-y rounded-xl border border-[color:var(--surface-glass-border)] bg-[color:var(--control-glass-bg)] px-3 py-2 text-sm text-text shadow-[var(--shadow-control)] transition hover:border-[color:var(--surface-glass-hover-border)] hover:bg-[color:var(--control-glass-hover-bg)] focus-visible:ring-2 focus-visible:ring-[color:var(--primary-dim)] focus-visible:outline-none supports-[backdrop-filter]:backdrop-blur-md"
                  />
                  {threadError ? (
                    <p className="text-sm text-destructive">
                      {formatLoadError(threadError)}
                    </p>
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
              </GlassyTile>

              {threads.length === 0 ? (
                <NoDataYetBar label="threads" />
              ) : (
                threads.map((thread) => (
                  <article key={thread.id} className="contents">
                    <GlassyTile className="px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <GlassyTileHeading>{thread.title}</GlassyTileHeading>
                          <p className="m-0 text-sm text-muted">
                            {thread.author} · {thread.replies} replies · Updated{" "}
                            {formatDateTime(thread.updated)}
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
                    </GlassyTile>
                  </article>
                ))
              )}

              {threadDetailError ? (
                <Surface
                  variant="panelAlt"
                  radius="xl"
                  className="px-4 py-3 text-sm text-destructive"
                >
                  {formatLoadError(threadDetailError)}
                </Surface>
              ) : null}

              {activeThread ? (
                <GlassyTile>
                  <GlassyTileHeading>
                    {activeThread.thread.title}
                  </GlassyTileHeading>
                  <p className="m-0 text-sm text-muted">
                    {activeThread.thread.author} ·{" "}
                    {formatDateTime(activeThread.thread.createdAt)}
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
                            {message.author} ·{" "}
                            {formatDateTime(message.createdAt)}
                          </p>
                          <p className="text-sm text-text">{message.message}</p>
                        </Surface>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleThreadReply} className="mt-4 space-y-3">
                    <textarea
                      value={threadReplyBody}
                      onChange={(event) =>
                        setThreadReplyBody(event.target.value)
                      }
                      placeholder="Write a reply"
                      disabled={!canWrite || threadReplyBusy}
                      className="min-h-[90px] w-full resize-y rounded-xl border border-[color:var(--surface-glass-border)] bg-[color:var(--control-glass-bg)] px-3 py-2 text-sm text-text shadow-[var(--shadow-control)] transition hover:border-[color:var(--surface-glass-hover-border)] hover:bg-[color:var(--control-glass-hover-bg)] focus-visible:ring-2 focus-visible:ring-[color:var(--primary-dim)] focus-visible:outline-none supports-[backdrop-filter]:backdrop-blur-md"
                    />
                    {threadReplyError ? (
                      <p className="text-sm text-destructive">
                        {formatLoadError(threadReplyError)}
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
                </GlassyTile>
              ) : null}
            </div>

            <GlassyTile>
              <GlassyTileHeading>Chamber chat</GlassyTileHeading>
              <p className="m-0 text-xs text-muted">
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
              <form
                onSubmit={handleChatSend}
                className="flex flex-col gap-2 sm:flex-row"
              >
                <Input
                  value={chatMessage}
                  onChange={(event) => setChatMessage(event.target.value)}
                  placeholder="Send a message"
                  disabled={!canWrite || chatBusy}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canWrite || chatBusy}
                >
                  {chatBusy ? "Sending..." : "Send"}
                </Button>
              </form>
              {chatError ? (
                <p className="mt-2 text-sm text-destructive">
                  {formatLoadError(chatError)}
                </p>
              ) : null}
              {chatSignalError ? (
                <p className="mt-2 text-xs text-destructive">
                  {formatLoadError(chatSignalError)}
                </p>
              ) : null}
              {!canWrite ? (
                <p className="mt-2 text-xs text-muted">
                  Read-only for non-members.
                </p>
              ) : null}
            </GlassyTile>
          </div>
        </GlassySection>
      ) : null}
    </div>
  );
};

export default Chamber;
