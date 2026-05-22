import type { FactionDto, GetFactionsResponse } from "@/types/api";
import { apiCommand } from "./command";
import { apiGet } from "./http";

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
  return await apiCommand({
    type: "faction.create",
    payload: {
      name: input.name,
      description: input.description,
      ...(input.focus ? { focus: input.focus } : {}),
      ...(input.visibility ? { visibility: input.visibility } : {}),
      ...(input.goals && input.goals.length > 0 ? { goals: input.goals } : {}),
      ...(input.tags && input.tags.length > 0 ? { tags: input.tags } : {}),
      ...(input.cofounders && input.cofounders.length > 0
        ? { cofounders: input.cofounders }
        : {}),
    },
    idempotencyKey: input.idempotencyKey,
  });
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
  return await apiCommand({
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
  });
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
  return await apiCommand({
    type: "faction.delete",
    payload: {
      factionId: input.factionId,
    },
    idempotencyKey: input.idempotencyKey,
  });
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
  return await apiCommand({
    type: "faction.member.role.set",
    payload: {
      factionId: input.factionId,
      address: input.address,
      role: input.role,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiFactionJoin(input: {
  factionId: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.join";
  factionId: string;
  joined: boolean;
  pending: boolean;
}> {
  return await apiCommand({
    type: "faction.join",
    payload: {
      factionId: input.factionId,
    },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiFactionJoinRequestApprove(input: {
  factionId: string;
  address: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.join.request.approve";
  factionId: string;
  address: string;
  accepted: true;
}> {
  return await apiCommand({
    type: "faction.join.request.approve",
    payload: { factionId: input.factionId, address: input.address },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiFactionJoinRequestDecline(input: {
  factionId: string;
  address: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.join.request.decline";
  factionId: string;
  address: string;
  declined: true;
}> {
  return await apiCommand({
    type: "faction.join.request.decline",
    payload: { factionId: input.factionId, address: input.address },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiFactionLeave(input: {
  factionId: string;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "faction.leave";
  factionId: string;
}> {
  return await apiCommand({
    type: "faction.leave",
    payload: {
      factionId: input.factionId,
    },
    idempotencyKey: input.idempotencyKey,
  });
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
  return await apiCommand({
    type: "faction.cofounder.invite.accept",
    payload: { factionId: input.factionId },
    idempotencyKey: input.idempotencyKey,
  });
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
  return await apiCommand({
    type: "faction.cofounder.invite.decline",
    payload: { factionId: input.factionId },
    idempotencyKey: input.idempotencyKey,
  });
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
  return await apiCommand({
    type: "faction.cofounder.invite.cancel",
    payload: { factionId: input.factionId, address: input.address },
    idempotencyKey: input.idempotencyKey,
  });
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
  return await apiCommand({
    type: "faction.channel.create",
    payload: {
      factionId: input.factionId,
      title: input.title,
      ...(input.slug ? { slug: input.slug } : {}),
      ...(input.writeScope ? { writeScope: input.writeScope } : {}),
    },
    idempotencyKey: input.idempotencyKey,
  });
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
  return await apiCommand({
    type: "faction.channel.lock",
    payload: {
      factionId: input.factionId,
      channelId: input.channelId,
      isLocked: input.isLocked,
    },
    idempotencyKey: input.idempotencyKey,
  });
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
  return await apiCommand({
    type: "faction.thread.create",
    payload: {
      factionId: input.factionId,
      channelId: input.channelId,
      title: input.title,
      body: input.body,
    },
    idempotencyKey: input.idempotencyKey,
  });
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
  return await apiCommand({
    type: "faction.thread.reply",
    payload: {
      factionId: input.factionId,
      threadId: input.threadId,
      body: input.body,
    },
    idempotencyKey: input.idempotencyKey,
  });
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
  return await apiCommand({
    type: "faction.thread.transition",
    payload: {
      factionId: input.factionId,
      threadId: input.threadId,
      status: input.status,
    },
    idempotencyKey: input.idempotencyKey,
  });
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
  return await apiCommand({
    type: "faction.thread.delete",
    payload: {
      factionId: input.factionId,
      threadId: input.threadId,
    },
    idempotencyKey: input.idempotencyKey,
  });
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
  return await apiCommand({
    type: "faction.thread.reply.delete",
    payload: {
      factionId: input.factionId,
      threadId: input.threadId,
      messageId: input.messageId,
    },
    idempotencyKey: input.idempotencyKey,
  });
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
  return await apiCommand({
    type: "faction.initiative.create",
    payload: {
      factionId: input.factionId,
      title: input.title,
      ...(input.intent ? { intent: input.intent } : {}),
      ...(input.checklist ? { checklist: input.checklist } : {}),
    },
    idempotencyKey: input.idempotencyKey,
  });
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
  return await apiCommand({
    type: "faction.initiative.transition",
    payload: {
      factionId: input.factionId,
      initiativeId: input.initiativeId,
      status: input.status,
    },
    idempotencyKey: input.idempotencyKey,
  });
}
