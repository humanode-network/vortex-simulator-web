import type {
  ChamberProposalPageDto,
  ChamberVetoProposalPageDto,
  ChamberChatPeerDto,
  ChamberChatSignalDto,
  ChamberThreadDetailDto,
  ChamberThreadDto,
  ChamberThreadMessageDto,
  ChamberChatMessageDto,
  ChamberCmDto,
  CitizenVetoProposalPageDto,
  CmSummaryDto,
  CourtCaseDetailDto,
  FormationProposalPageDto,
  ProposalFinishedPageDto,
  GetChamberResponse,
  GetChambersResponse,
  GetClockResponse,
  GetCourtsResponse,
  GetFeedResponse,
  GetFormationResponse,
  GetHumansResponse,
  GetInvisionResponse,
  GetMyGovernanceResponse,
  GetProposalDraftsResponse,
  GetProposalsResponse,
  GetProposalTimelineResponse,
  HumanNodeProfileDto,
  ProposalDraftDetailDto,
  ProposalThreadDetailDto,
  ProposalThreadDto,
  ProposalThreadListDto,
  ProposalThreadMessageDto,
  ProposalStatusDto,
  PoolProposalPageDto,
} from "@/types/api";
export * from "@/lib/api/factions";
export {
  apiGet,
  apiPost,
  getApiErrorPayload,
  type ApiError,
  type ApiErrorPayload,
} from "@/lib/api/http";

import { apiGet, apiPost } from "@/lib/api/http";
import { apiCommand } from "@/lib/api/command";

export type ApiMeResponse =
  | { authenticated: false }
  | {
      authenticated: true;
      address: string;
      gate: { eligible: boolean; reason?: string; expiresAt: string };
    };

export async function apiMe(): Promise<ApiMeResponse> {
  return await apiGet<ApiMeResponse>("/api/me");
}

export async function apiLogout(): Promise<{ ok: true }> {
  return await apiPost<{ ok: true }>("/api/auth/logout", {});
}

export async function apiNonce(address: string): Promise<{ nonce: string }> {
  return await apiPost<{ nonce: string }>("/api/auth/nonce", { address });
}

export async function apiVerify(input: {
  address: string;
  nonce: string;
  signature: string;
}): Promise<{ ok: true; address: string }> {
  return await apiPost<{ ok: true; address: string }>(
    "/api/auth/verify",
    input,
  );
}

export async function apiFeed(input?: {
  stage?: string;
  cursor?: string;
  actor?: string;
  chambers?: string[];
  limit?: number;
}): Promise<GetFeedResponse> {
  const params = new URLSearchParams();
  if (input?.stage) params.set("stage", input.stage);
  if (input?.cursor) params.set("cursor", input.cursor);
  if (input?.actor) params.set("actor", input.actor);
  if (input?.chambers && input.chambers.length > 0) {
    params.set("chambers", input.chambers.join(","));
  }
  if (input?.limit) params.set("limit", String(input.limit));
  const qs = params.size ? `?${params.toString()}` : "";
  return await apiGet<GetFeedResponse>(`/api/feed${qs}`);
}

export async function apiChambers(): Promise<GetChambersResponse> {
  return await apiGet<GetChambersResponse>("/api/chambers");
}

export async function apiChamber(id: string): Promise<GetChamberResponse> {
  return await apiGet<GetChamberResponse>(`/api/chambers/${id}`);
}

export async function apiChamberCm(id: string): Promise<ChamberCmDto> {
  return await apiGet<ChamberCmDto>(`/api/chambers/${id}/cm`);
}

export async function apiChamberThreads(
  id: string,
): Promise<{ items: ChamberThreadDto[] }> {
  return await apiGet<{ items: ChamberThreadDto[] }>(
    `/api/chambers/${id}/threads`,
  );
}

export async function apiChamberThreadDetail(
  chamberId: string,
  threadId: string,
): Promise<ChamberThreadDetailDto> {
  return await apiGet<ChamberThreadDetailDto>(
    `/api/chambers/${chamberId}/threads/${threadId}`,
  );
}

export async function apiChamberChatSignalPost(
  chamberId: string,
  input: {
    peerId: string;
    kind: "offer" | "answer" | "candidate";
    toPeerId?: string;
    payload: Record<string, unknown>;
  },
): Promise<{ ok: true }> {
  return await apiPost<{ ok: true }>(`/api/chambers/${chamberId}/chat/signal`, {
    peerId: input.peerId,
    kind: input.kind,
    toPeerId: input.toPeerId,
    payload: input.payload,
  });
}

export async function apiChamberChatSignalPoll(
  chamberId: string,
  peerId: string,
): Promise<{ messages: ChamberChatSignalDto[] }> {
  const qs = new URLSearchParams({ peerId });
  return await apiGet<{ messages: ChamberChatSignalDto[] }>(
    `/api/chambers/${chamberId}/chat/signal?${qs.toString()}`,
  );
}

export async function apiChamberChatPresence(
  chamberId: string,
  peerId: string,
): Promise<{ peers: ChamberChatPeerDto[] }> {
  const qs = new URLSearchParams({ peerId });
  return await apiGet<{ peers: ChamberChatPeerDto[] }>(
    `/api/chambers/${chamberId}/chat/presence?${qs.toString()}`,
  );
}

export async function apiProposals(input?: {
  stage?: string;
}): Promise<GetProposalsResponse> {
  const params = new URLSearchParams();
  if (input?.stage) params.set("stage", input.stage);
  const qs = params.size ? `?${params.toString()}` : "";
  return await apiGet<GetProposalsResponse>(`/api/proposals${qs}`);
}

export async function apiProposalPoolPage(
  id: string,
): Promise<PoolProposalPageDto> {
  return await apiGet<PoolProposalPageDto>(`/api/proposals/${id}/pool`);
}

export async function apiProposalTimeline(
  id: string,
): Promise<GetProposalTimelineResponse> {
  return await apiGet<GetProposalTimelineResponse>(
    `/api/proposals/${id}/timeline`,
  );
}

export async function apiProposalThreads(
  id: string,
): Promise<ProposalThreadListDto> {
  return await apiGet<ProposalThreadListDto>(`/api/proposals/${id}/threads`);
}

export async function apiProposalThreadDetail(
  proposalId: string,
  threadId: string,
): Promise<ProposalThreadDetailDto> {
  return await apiGet<ProposalThreadDetailDto>(
    `/api/proposals/${proposalId}/threads/${threadId}`,
  );
}

export async function apiProposalStatus(
  id: string,
): Promise<ProposalStatusDto> {
  return await apiGet<ProposalStatusDto>(`/api/proposals/${id}/status`);
}

export type CitizenVetoVoteChoice = "veto" | "keep";

export async function apiCitizenVetoVote(input: {
  proposalId: string;
  choice: CitizenVetoVoteChoice;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "veto.citizen.vote";
  proposalId: string;
  choice: CitizenVetoVoteChoice;
  counts: { veto: number; keep: number };
}> {
  return await apiCommand({
    type: "veto.citizen.vote",
    payload: {
      proposalId: input.proposalId,
      choice: input.choice,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export type PoolVoteDirection = "up" | "down";

export async function apiPoolVote(input: {
  proposalId: string;
  direction: PoolVoteDirection;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "pool.vote";
  proposalId: string;
  direction: PoolVoteDirection;
  counts: { upvotes: number; downvotes: number };
}> {
  return await apiCommand({
    type: "pool.vote",
    payload: { proposalId: input.proposalId, direction: input.direction },
    idempotencyKey: input.idempotencyKey,
  });
}

export type ChamberVoteChoice = "yes" | "no" | "abstain";

export type ChamberVetoVoteChoice = "veto" | "keep" | "abstain";

export async function apiChamberVote(input: {
  proposalId: string;
  choice: ChamberVoteChoice;
  score?: number;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "chamber.vote";
  proposalId: string;
  choice: ChamberVoteChoice;
  counts: { yes: number; no: number; abstain: number };
}> {
  return await apiCommand({
    type: "chamber.vote",
    payload: {
      proposalId: input.proposalId,
      choice: input.choice,
      ...(input.choice === "yes" && typeof input.score === "number"
        ? { score: input.score }
        : {}),
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiChamberMultiplierSubmit(input: {
  chamberId: string;
  multiplierTimes10: number;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "chamber.multiplier.submit";
  chamberId: string;
  submission: { multiplierTimes10: number };
  aggregate: { submissions: number; avgTimes10: number | null };
  applied: {
    updated: boolean;
    prevMultiplierTimes10: number;
    nextMultiplierTimes10: number;
  } | null;
}> {
  return await apiCommand({
    type: "chamber.multiplier.submit",
    payload: {
      chamberId: input.chamberId,
      multiplierTimes10: input.multiplierTimes10,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiChamberThreadCreate(input: {
  chamberId: string;
  title: string;
  body: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "chamber.thread.create";
  thread: ChamberThreadDto;
}> {
  return await apiCommand({
    type: "chamber.thread.create",
    payload: {
      chamberId: input.chamberId,
      title: input.title,
      body: input.body,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiChamberThreadReply(input: {
  chamberId: string;
  threadId: string;
  body: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "chamber.thread.reply";
  threadId: string;
  message: ChamberThreadMessageDto;
  replies: number;
}> {
  return await apiCommand({
    type: "chamber.thread.reply",
    payload: {
      chamberId: input.chamberId,
      threadId: input.threadId,
      body: input.body,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiProposalThreadCreate(input: {
  proposalId: string;
  category?: ProposalThreadDto["category"];
  title: string;
  body: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "proposal.thread.create";
  proposalId: string;
  thread: ProposalThreadDto;
}> {
  return await apiCommand({
    type: "proposal.thread.create",
    payload: {
      proposalId: input.proposalId,
      category: input.category ?? "general",
      title: input.title,
      body: input.body,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiProposalThreadReply(input: {
  proposalId: string;
  threadId: string;
  body: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "proposal.thread.reply";
  proposalId: string;
  threadId: string;
  message: ProposalThreadMessageDto;
  replies: number;
}> {
  return await apiCommand({
    type: "proposal.thread.reply",
    payload: {
      proposalId: input.proposalId,
      threadId: input.threadId,
      body: input.body,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiProposalThreadTransition(input: {
  proposalId: string;
  threadId: string;
  status: ProposalThreadDto["status"];
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "proposal.thread.transition";
  proposalId: string;
  thread: { id: string; status: ProposalThreadDto["status"] };
}> {
  return await apiCommand({
    type: "proposal.thread.transition",
    payload: {
      proposalId: input.proposalId,
      threadId: input.threadId,
      status: input.status,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiChamberChatPost(input: {
  chamberId: string;
  message: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "chamber.chat.post";
  message: ChamberChatMessageDto;
}> {
  return await apiCommand({
    type: "chamber.chat.post",
    payload: {
      chamberId: input.chamberId,
      message: input.message,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiFormationJoin(input: {
  proposalId: string;
  role?: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "formation.join";
  proposalId: string;
  teamSlots: { filled: number; total: number };
}> {
  return await apiCommand({
    type: "formation.join",
    payload: {
      proposalId: input.proposalId,
      ...(input.role ? { role: input.role } : {}),
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiFormationMilestoneSubmit(input: {
  proposalId: string;
  milestoneIndex: number;
  note?: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "formation.milestone.submit";
  proposalId: string;
  milestoneIndex: number;
  milestones: { completed: number; total: number };
}> {
  return await apiCommand({
    type: "formation.milestone.submit",
    payload: {
      proposalId: input.proposalId,
      milestoneIndex: input.milestoneIndex,
      ...(input.note ? { note: input.note } : {}),
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiFormationMilestoneRequestUnlock(input: {
  proposalId: string;
  milestoneIndex: number;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "formation.milestone.requestUnlock";
  proposalId: string;
  milestoneIndex: number;
  milestones: { completed: number; total: number };
}> {
  return await apiCommand({
    type: "formation.milestone.requestUnlock",
    payload: {
      proposalId: input.proposalId,
      milestoneIndex: input.milestoneIndex,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiFormationMilestoneVote(input: {
  proposalId: string;
  milestoneIndex: number;
  choice: "yes" | "no" | "abstain";
  score?: number;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "formation.milestone.vote";
  proposalId: string;
  milestoneIndex: number;
  choice: "yes" | "no" | "abstain";
  counts: { yes: number; no: number; abstain: number };
  outcome: "pending" | "accepted" | "rejected";
  projectState:
    | "active"
    | "awaiting_milestone_vote"
    | "canceled"
    | "ready_to_finish"
    | "completed";
  pendingMilestoneIndex: number | null;
  milestones: { completed: number; total: number };
}> {
  return await apiCommand({
    type: "formation.milestone.vote",
    payload: {
      proposalId: input.proposalId,
      milestoneIndex: input.milestoneIndex,
      choice: input.choice,
      ...(input.choice === "yes" && typeof input.score === "number"
        ? { score: input.score }
        : {}),
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiFormationProjectFinish(input: {
  proposalId: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "formation.project.finish";
  proposalId: string;
  projectState: "completed";
  milestones: { completed: number; total: number };
}> {
  return await apiCommand({
    type: "formation.project.finish",
    payload: {
      proposalId: input.proposalId,
    },
    idempotencyKey: input.idempotencyKey,
  });
}
export async function apiProposalChamberPage(
  id: string,
): Promise<ChamberProposalPageDto> {
  return await apiGet<ChamberProposalPageDto>(`/api/proposals/${id}/chamber`);
}

export async function apiProposalCitizenVetoPage(
  id: string,
): Promise<CitizenVetoProposalPageDto> {
  return await apiGet<CitizenVetoProposalPageDto>(
    `/api/proposals/${id}/citizen-veto`,
  );
}

export async function apiProposalChamberVetoPage(
  id: string,
): Promise<ChamberVetoProposalPageDto> {
  return await apiGet<ChamberVetoProposalPageDto>(
    `/api/proposals/${id}/chamber-veto`,
  );
}

export async function apiProposalReferendumPage(
  id: string,
): Promise<ChamberProposalPageDto> {
  return await apiGet<ChamberProposalPageDto>(
    `/api/proposals/${id}/referendum`,
  );
}

export async function apiReferendumVote(input: {
  proposalId: string;
  choice: ChamberVoteChoice;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "referendum.vote";
  proposalId: string;
  choice: ChamberVoteChoice;
  counts: { yes: number; no: number; abstain: number };
  systemReset?: boolean;
}> {
  return await apiCommand({
    type: "referendum.vote",
    payload: { proposalId: input.proposalId, choice: input.choice },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiChamberVetoVote(input: {
  proposalId: string;
  chamberId: string;
  choice: ChamberVetoVoteChoice;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "veto.chamber.vote";
  proposalId: string;
  chamberId: string;
  choice: ChamberVetoVoteChoice;
  counts: { veto: number; keep: number; abstain: number };
}> {
  return await apiCommand({
    type: "veto.chamber.vote",
    payload: {
      proposalId: input.proposalId,
      chamberId: input.chamberId,
      choice: input.choice,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiProposalFormationPage(
  id: string,
): Promise<FormationProposalPageDto> {
  return await apiGet<FormationProposalPageDto>(
    `/api/proposals/${id}/formation`,
  );
}

export async function apiProposalFinishedPage(
  id: string,
): Promise<ProposalFinishedPageDto> {
  return await apiGet<ProposalFinishedPageDto>(`/api/proposals/${id}/finished`);
}

export async function apiCourts(): Promise<GetCourtsResponse> {
  return await apiGet<GetCourtsResponse>("/api/courts");
}

export async function apiCourt(id: string): Promise<CourtCaseDetailDto> {
  return await apiGet<CourtCaseDetailDto>(`/api/courts/${id}`);
}

export async function apiCourtReport(input: {
  caseId: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "court.case.report";
  caseId: string;
  reports: number;
  status: "jury" | "live" | "ended";
}> {
  return await apiCommand({
    type: "court.case.report",
    payload: { caseId: input.caseId },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiCourtVerdict(input: {
  caseId: string;
  verdict: "guilty" | "not_guilty";
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "court.case.verdict";
  caseId: string;
  verdict: "guilty" | "not_guilty";
  status: "jury" | "live" | "ended";
  totals: { guilty: number; notGuilty: number };
}> {
  return await apiCommand({
    type: "court.case.verdict",
    payload: { caseId: input.caseId, verdict: input.verdict },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiHumans(): Promise<GetHumansResponse> {
  return await apiGet<GetHumansResponse>("/api/humans");
}

export async function apiHuman(id: string): Promise<HumanNodeProfileDto> {
  return await apiGet<HumanNodeProfileDto>(`/api/humans/${id}`);
}

export async function apiFormation(): Promise<GetFormationResponse> {
  return await apiGet<GetFormationResponse>("/api/formation");
}

export async function apiInvision(): Promise<GetInvisionResponse> {
  return await apiGet<GetInvisionResponse>("/api/invision");
}

export async function apiMyGovernance(): Promise<GetMyGovernanceResponse> {
  return await apiGet<GetMyGovernanceResponse>("/api/my-governance");
}

export async function apiLegitimacyObjectSet(input: {
  active: boolean;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "legitimacy.object.set";
  legitimacy: GetMyGovernanceResponse["legitimacy"];
}> {
  return await apiCommand({
    type: "legitimacy.object.set",
    payload: {
      active: input.active,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiDelegationSet(input: {
  chamberId: string;
  delegateeAddress: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "delegation.set";
  chamberId: string;
  delegatorAddress: string;
  delegateeAddress: string;
  updatedAt: string;
}> {
  return await apiCommand({
    type: "delegation.set",
    payload: {
      chamberId: input.chamberId,
      delegateeAddress: input.delegateeAddress,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiDelegationClear(input: {
  chamberId: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "delegation.clear";
  chamberId: string;
  delegatorAddress: string;
  cleared: boolean;
}> {
  return await apiCommand({
    type: "delegation.clear",
    payload: {
      chamberId: input.chamberId,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiCmMe(): Promise<CmSummaryDto> {
  return await apiGet<CmSummaryDto>("/api/cm/me");
}

export async function apiCmAddress(address: string): Promise<CmSummaryDto> {
  return await apiGet<CmSummaryDto>(`/api/cm/${address}`);
}

export async function apiClock(): Promise<GetClockResponse> {
  return await apiGet<GetClockResponse>("/api/clock");
}

export async function apiProposalDrafts(): Promise<GetProposalDraftsResponse> {
  return await apiGet<GetProposalDraftsResponse>("/api/proposals/drafts");
}

export async function apiProposalDraft(
  id: string,
): Promise<ProposalDraftDetailDto> {
  return await apiGet<ProposalDraftDetailDto>(`/api/proposals/drafts/${id}`);
}

export type ProposalDraftFormPayload = {
  templateId?: "project" | "system";
  presetId?: string;
  resubmitsProposalId?: string;
  formationEligible?: boolean;
  title: string;
  chamberId: string;
  summary: string;
  what: string;
  why: string;
  how: string;
  proposalType?:
    | "basic"
    | "fee"
    | "monetary"
    | "core"
    | "administrative"
    | "dao-core";
  metaGovernance?: {
    action:
      | "chamber.create"
      | "chamber.rename"
      | "chamber.dissolve"
      | "chamber.censure"
      | "governor.censure";
    chamberId?: string;
    targetAddress?: string;
    title?: string;
    multiplier?: number;
    genesisMembers?: string[];
  };
  timeline: {
    id: string;
    title: string;
    timeframe: string;
    budgetHmnd?: string;
  }[];
  outputs: { id: string; label: string; url: string }[];
  openSlotNeeds: { id: string; title: string; desc: string }[];
  budgetItems: { id: string; description: string; amount: string }[];
  aboutMe: string;
  attachments: { id: string; label: string; url: string }[];
  agreeRules: boolean;
  confirmBudget: boolean;
};

export async function apiProposalDraftSave(input: {
  draftId?: string;
  form: ProposalDraftFormPayload;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "proposal.draft.save";
  draftId: string;
  updatedAt: string;
}> {
  return await apiCommand({
    type: "proposal.draft.save",
    payload: {
      ...(input.draftId ? { draftId: input.draftId } : {}),
      form: input.form,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiProposalDraftDelete(input: {
  draftId: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "proposal.draft.delete";
  draftId: string;
  deleted: boolean;
}> {
  return await apiCommand({
    type: "proposal.draft.delete",
    payload: { draftId: input.draftId },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiProposalSubmitToPool(input: {
  draftId: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "proposal.submitToPool";
  draftId: string;
  proposalId: string;
}> {
  return await apiCommand({
    type: "proposal.submitToPool",
    payload: { draftId: input.draftId },
    idempotencyKey: input.idempotencyKey,
  });
}
