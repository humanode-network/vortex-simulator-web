import type {
  ChamberProposalPageDto,
  ChamberChatPeerDto,
  ChamberChatSignalDto,
  ChamberThreadDetailDto,
  ChamberThreadDto,
  ChamberThreadMessageDto,
  ChamberChatMessageDto,
  ChamberCmDto,
  CmSummaryDto,
  CourtCaseDetailDto,
  FactionDto,
  FormationProposalPageDto,
  GetFactionsResponse,
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
  PoolProposalPageDto,
} from "@/types/api";

type ApiClientRuntimeConfig = {
  apiBaseUrl?: string;
  apiHeaders?: Record<string, string>;
  apiCredentials?: RequestCredentials;
};

declare global {
  interface Window {
    __VORTEX_CONFIG__?: ApiClientRuntimeConfig;
  }
}

export type ApiErrorPayload = {
  error?: {
    message?: string;
    code?: string;
    [key: string]: unknown;
  };
};

export type ApiError = Error & {
  data?: ApiErrorPayload;
  status?: number;
};

export function getApiErrorPayload(error: unknown): ApiErrorPayload | null {
  if (!error || typeof error !== "object") return null;
  const data = (error as ApiError).data;
  if (!data || typeof data !== "object") return null;
  return data as ApiErrorPayload;
}

const envApiBaseUrl =
  import.meta.env.RSBUILD_PUBLIC_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "";

function getRuntimeConfig(): ApiClientRuntimeConfig | undefined {
  if (typeof window === "undefined") return undefined;
  return window.__VORTEX_CONFIG__;
}

function getApiBaseUrl(): string {
  const runtimeConfig = getRuntimeConfig();
  return runtimeConfig?.apiBaseUrl ?? envApiBaseUrl ?? "";
}

function getApiCredentials(): RequestCredentials {
  const runtimeConfig = getRuntimeConfig();
  return runtimeConfig?.apiCredentials ?? "include";
}

function getApiHeaders(): Record<string, string> {
  const runtimeConfig = getRuntimeConfig();
  return runtimeConfig?.apiHeaders ?? {};
}

function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return path;
  const base = apiBaseUrl.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

async function readJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.toLowerCase().includes("application/json");
  const body = isJson ? ((await res.json()) as unknown) : await res.text();
  if (!res.ok) {
    const payload = (body as ApiErrorPayload | null) ?? null;
    const rawMessage =
      payload?.error?.message ??
      (typeof body === "string" && body.trim() ? body : null) ??
      res.statusText;
    const message = `HTTP ${res.status}${rawMessage ? `: ${rawMessage}` : ""}`;
    const error = new Error(message) as ApiError;
    if (payload) error.data = payload;
    error.status = res.status;
    throw error;
  }
  return body as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(resolveApiUrl(path), {
    credentials: getApiCredentials(),
    headers: getApiHeaders(),
  });
  return await readJsonResponse<T>(res);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  init?: { headers?: HeadersInit },
): Promise<T> {
  const res = await fetch(resolveApiUrl(path), {
    method: "POST",
    credentials: getApiCredentials(),
    headers: {
      ...getApiHeaders(),
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  });
  return await readJsonResponse<T>(res);
}

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
  return await apiPost(
    "/api/command",
    {
      type: "pool.vote",
      payload: { proposalId: input.proposalId, direction: input.direction },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export type ChamberVoteChoice = "yes" | "no" | "abstain";

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
  return await apiPost(
    "/api/command",
    {
      type: "chamber.vote",
      payload: {
        proposalId: input.proposalId,
        choice: input.choice,
        ...(input.choice === "yes" && typeof input.score === "number"
          ? { score: input.score }
          : {}),
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
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
  return await apiPost(
    "/api/command",
    {
      type: "chamber.multiplier.submit",
      payload: {
        chamberId: input.chamberId,
        multiplierTimes10: input.multiplierTimes10,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
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
  return await apiPost(
    "/api/command",
    {
      type: "chamber.thread.create",
      payload: {
        chamberId: input.chamberId,
        title: input.title,
        body: input.body,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
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
  return await apiPost(
    "/api/command",
    {
      type: "chamber.thread.reply",
      payload: {
        chamberId: input.chamberId,
        threadId: input.threadId,
        body: input.body,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
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
  return await apiPost(
    "/api/command",
    {
      type: "chamber.chat.post",
      payload: {
        chamberId: input.chamberId,
        message: input.message,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
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
  return await apiPost(
    "/api/command",
    {
      type: "formation.join",
      payload: {
        proposalId: input.proposalId,
        ...(input.role ? { role: input.role } : {}),
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
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
  return await apiPost(
    "/api/command",
    {
      type: "formation.milestone.submit",
      payload: {
        proposalId: input.proposalId,
        milestoneIndex: input.milestoneIndex,
        ...(input.note ? { note: input.note } : {}),
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
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
  return await apiPost(
    "/api/command",
    {
      type: "formation.milestone.requestUnlock",
      payload: {
        proposalId: input.proposalId,
        milestoneIndex: input.milestoneIndex,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
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
  return await apiPost(
    "/api/command",
    {
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
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
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
  return await apiPost(
    "/api/command",
    {
      type: "formation.project.finish",
      payload: {
        proposalId: input.proposalId,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}
export async function apiProposalChamberPage(
  id: string,
): Promise<ChamberProposalPageDto> {
  return await apiGet<ChamberProposalPageDto>(`/api/proposals/${id}/chamber`);
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
): Promise<FormationProposalPageDto> {
  return await apiGet<FormationProposalPageDto>(`/api/proposals/${id}/finished`);
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
  return await apiPost(
    "/api/command",
    {
      type: "court.case.report",
      payload: { caseId: input.caseId },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
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
  return await apiPost(
    "/api/command",
    {
      type: "court.case.verdict",
      payload: { caseId: input.caseId, verdict: input.verdict },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiHumans(): Promise<GetHumansResponse> {
  return await apiGet<GetHumansResponse>("/api/humans");
}

export async function apiHuman(id: string): Promise<HumanNodeProfileDto> {
  return await apiGet<HumanNodeProfileDto>(`/api/humans/${id}`);
}

export async function apiFactions(): Promise<GetFactionsResponse> {
  return await apiGet<GetFactionsResponse>("/api/factions");
}

export async function apiFaction(id: string): Promise<FactionDto> {
  return await apiGet<FactionDto>(`/api/factions/${id}`);
}

export async function apiFactionCreate(input: {
  name: string;
  description: string;
  focus?: string;
  visibility?: "public" | "private";
  goals?: string[];
  tags?: string[];
  cofounders?: string[];
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.create";
  faction: { id: string; name: string };
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.create",
      payload: {
        name: input.name,
        description: input.description,
        ...(input.focus ? { focus: input.focus } : {}),
        ...(input.visibility ? { visibility: input.visibility } : {}),
        ...(input.goals && input.goals.length > 0
          ? { goals: input.goals }
          : {}),
        ...(input.tags && input.tags.length > 0 ? { tags: input.tags } : {}),
        ...(input.cofounders && input.cofounders.length > 0
          ? { cofounders: input.cofounders }
          : {}),
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionUpdate(input: {
  factionId: string;
  name?: string;
  description?: string;
  focus?: string;
  visibility?: "public" | "private";
  goals?: string[];
  tags?: string[];
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.update";
  factionId: string;
  updated: boolean;
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.update",
      payload: {
        factionId: input.factionId,
        ...(input.name ? { name: input.name } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.focus ? { focus: input.focus } : {}),
        ...(input.visibility ? { visibility: input.visibility } : {}),
        ...(input.goals ? { goals: input.goals } : {}),
        ...(input.tags ? { tags: input.tags } : {}),
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionDelete(input: {
  factionId: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.delete";
  factionId: string;
  status: "archived";
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.delete",
      payload: {
        factionId: input.factionId,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionMemberRoleSet(input: {
  factionId: string;
  address: string;
  role: "founder" | "steward" | "member";
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.member.role.set";
  factionId: string;
  member: { address: string; role: "founder" | "steward" | "member" };
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.member.role.set",
      payload: {
        factionId: input.factionId,
        address: input.address,
        role: input.role,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionJoin(input: {
  factionId: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.join";
  factionId: string;
  joined: boolean;
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.join",
      payload: {
        factionId: input.factionId,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionLeave(input: {
  factionId: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.leave";
  factionId: string;
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.leave",
      payload: {
        factionId: input.factionId,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionCofounderInviteAccept(input: {
  factionId: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.cofounder.invite.accept";
  factionId: string;
  accepted: true;
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.cofounder.invite.accept",
      payload: { factionId: input.factionId },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionCofounderInviteDecline(input: {
  factionId: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.cofounder.invite.decline";
  factionId: string;
  declined: true;
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.cofounder.invite.decline",
      payload: { factionId: input.factionId },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionCofounderInviteCancel(input: {
  factionId: string;
  address: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.cofounder.invite.cancel";
  factionId: string;
  address: string;
  canceled: true;
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.cofounder.invite.cancel",
      payload: { factionId: input.factionId, address: input.address },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionChannelCreate(input: {
  factionId: string;
  title: string;
  slug?: string;
  writeScope?: "stewards" | "members";
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.channel.create";
  factionId: string;
  channel: { id: string; title: string };
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.channel.create",
      payload: {
        factionId: input.factionId,
        title: input.title,
        ...(input.slug ? { slug: input.slug } : {}),
        ...(input.writeScope ? { writeScope: input.writeScope } : {}),
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionChannelLock(input: {
  factionId: string;
  channelId: string;
  isLocked: boolean;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.channel.lock";
  factionId: string;
  channel: { id: string; isLocked: boolean };
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.channel.lock",
      payload: {
        factionId: input.factionId,
        channelId: input.channelId,
        isLocked: input.isLocked,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionThreadCreate(input: {
  factionId: string;
  channelId: string;
  title: string;
  body: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.thread.create";
  factionId: string;
  thread: { id: string; title: string };
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.thread.create",
      payload: {
        factionId: input.factionId,
        channelId: input.channelId,
        title: input.title,
        body: input.body,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionThreadReply(input: {
  factionId: string;
  threadId: string;
  body: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.thread.reply";
  factionId: string;
  threadId: string;
  messageId: string;
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.thread.reply",
      payload: {
        factionId: input.factionId,
        threadId: input.threadId,
        body: input.body,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionThreadTransition(input: {
  factionId: string;
  threadId: string;
  status: "open" | "resolved" | "locked";
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.thread.transition";
  factionId: string;
  thread: { id: string; status: "open" | "resolved" | "locked" };
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.thread.transition",
      payload: {
        factionId: input.factionId,
        threadId: input.threadId,
        status: input.status,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionThreadDelete(input: {
  factionId: string;
  threadId: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.thread.delete";
  factionId: string;
  threadId: string;
  deleted: true;
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.thread.delete",
      payload: {
        factionId: input.factionId,
        threadId: input.threadId,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionThreadReplyDelete(input: {
  factionId: string;
  threadId: string;
  messageId: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.thread.reply.delete";
  factionId: string;
  threadId: string;
  messageId: string;
  deleted: true;
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.thread.reply.delete",
      payload: {
        factionId: input.factionId,
        threadId: input.threadId,
        messageId: input.messageId,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionInitiativeCreate(input: {
  factionId: string;
  title: string;
  intent?: string;
  checklist?: string[];
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.initiative.create";
  factionId: string;
  initiative: { id: string; title: string };
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.initiative.create",
      payload: {
        factionId: input.factionId,
        title: input.title,
        ...(input.intent ? { intent: input.intent } : {}),
        ...(input.checklist ? { checklist: input.checklist } : {}),
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiFactionInitiativeTransition(input: {
  factionId: string;
  initiativeId: string;
  status: "draft" | "active" | "blocked" | "done" | "archived";
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.initiative.transition";
  factionId: string;
  initiative: {
    id: string;
    status: "draft" | "active" | "blocked" | "done" | "archived";
  };
}> {
  return await apiPost(
    "/api/command",
    {
      type: "faction.initiative.transition",
      payload: {
        factionId: input.factionId,
        initiativeId: input.initiativeId,
        status: input.status,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
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
  return await apiPost(
    "/api/command",
    {
      type: "proposal.draft.save",
      payload: {
        ...(input.draftId ? { draftId: input.draftId } : {}),
        form: input.form,
      },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
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
  return await apiPost(
    "/api/command",
    {
      type: "proposal.draft.delete",
      payload: { draftId: input.draftId },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
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
  return await apiPost(
    "/api/command",
    {
      type: "proposal.submitToPool",
      payload: { draftId: input.draftId },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}
