import type {
  GetInitiativesResponse,
  InitiativeBoardCardStatusDto,
  InitiativeDto,
  InitiativeRoleDto,
  InitiativeStatusDto,
  InitiativeThreadStatusDto,
} from "@/types/api";
import { apiCommand } from "./command";
import { apiGet } from "./http";

export async function apiInitiatives(): Promise<GetInitiativesResponse> {
  return await apiGet<GetInitiativesResponse>("/api/initiatives");
}

export async function apiInitiative(id: string): Promise<InitiativeDto> {
  return await apiGet<InitiativeDto>(
    `/api/initiatives/${encodeURIComponent(id)}`,
  );
}

export async function apiInitiativeCreate(input: {
  title: string;
  summary: string;
  description?: string;
  tags?: string[];
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "initiative.create";
  initiative: { id: string; slug: string; title: string };
}> {
  return await apiCommand({
    type: "initiative.create",
    payload: {
      title: input.title,
      summary: input.summary,
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.tags && input.tags.length > 0 ? { tags: input.tags } : {}),
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiInitiativeUpdate(input: {
  initiativeId: string;
  title?: string;
  summary?: string;
  description?: string;
  status?: InitiativeStatusDto;
  tags?: string[];
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "initiative.update";
  initiativeId: string;
  updated: boolean;
}> {
  return await apiCommand({
    type: "initiative.update",
    payload: {
      initiativeId: input.initiativeId,
      ...(input.title ? { title: input.title } : {}),
      ...(input.summary ? { summary: input.summary } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.tags ? { tags: input.tags } : {}),
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiInitiativeMemberRoleSet(input: {
  initiativeId: string;
  address: string;
  role: InitiativeRoleDto;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "initiative.member.role.set";
  initiativeId: string;
  member: { address: string; role: InitiativeRoleDto };
}> {
  return await apiCommand({
    type: "initiative.member.role.set",
    payload: {
      initiativeId: input.initiativeId,
      address: input.address,
      role: input.role,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiInitiativeBoardCardCreate(input: {
  initiativeId: string;
  columnId?: string;
  title: string;
  body?: string;
  ownerAddress?: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "initiative.board.card.create";
  initiativeId: string;
  card: { id: string; title: string };
}> {
  return await apiCommand({
    type: "initiative.board.card.create",
    payload: {
      initiativeId: input.initiativeId,
      title: input.title,
      ...(input.columnId ? { columnId: input.columnId } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.ownerAddress ? { ownerAddress: input.ownerAddress } : {}),
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiInitiativeBoardCardUpdate(input: {
  initiativeId: string;
  cardId: string;
  title?: string;
  body?: string;
  status?: InitiativeBoardCardStatusDto;
  ownerAddress?: string | null;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "initiative.board.card.update";
  initiativeId: string;
  card: { id: string; status: InitiativeBoardCardStatusDto };
}> {
  return await apiCommand({
    type: "initiative.board.card.update",
    payload: {
      initiativeId: input.initiativeId,
      cardId: input.cardId,
      ...(input.title ? { title: input.title } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.ownerAddress !== undefined
        ? { ownerAddress: input.ownerAddress }
        : {}),
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiInitiativeThreadCreate(input: {
  initiativeId: string;
  title: string;
  body: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "initiative.thread.create";
  initiativeId: string;
  thread: { id: string; title: string };
}> {
  return await apiCommand({
    type: "initiative.thread.create",
    payload: {
      initiativeId: input.initiativeId,
      title: input.title,
      body: input.body,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiInitiativeThreadReply(input: {
  initiativeId: string;
  threadId: string;
  body: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "initiative.thread.reply";
  initiativeId: string;
  threadId: string;
  messageId: string;
}> {
  return await apiCommand({
    type: "initiative.thread.reply",
    payload: {
      initiativeId: input.initiativeId,
      threadId: input.threadId,
      body: input.body,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiInitiativeThreadTransition(input: {
  initiativeId: string;
  threadId: string;
  status: InitiativeThreadStatusDto;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "initiative.thread.transition";
  initiativeId: string;
  thread: { id: string; status: InitiativeThreadStatusDto };
}> {
  return await apiCommand({
    type: "initiative.thread.transition",
    payload: {
      initiativeId: input.initiativeId,
      threadId: input.threadId,
      status: input.status,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiInitiativeChatPost(input: {
  initiativeId: string;
  body: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "initiative.chat.post";
  initiativeId: string;
  messageId: string;
}> {
  return await apiCommand({
    type: "initiative.chat.post",
    payload: {
      initiativeId: input.initiativeId,
      body: input.body,
    },
    idempotencyKey: input.idempotencyKey,
  });
}
