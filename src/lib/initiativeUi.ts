import type {
  InitiativeBoardCardDto,
  InitiativeBoardColumnDto,
  InitiativeBoardCardStatusDto,
  InitiativeRoleDto,
  InitiativeStatusDto,
  InitiativeThreadStatusDto,
} from "@/types/api";

type InitiativePathIdentity = {
  id: string;
  slug?: string;
};

type InitiativeManageability = {
  status: InitiativeStatusDto;
  viewerCanSteward?: boolean;
};

export const initiativeRoleLabel: Record<InitiativeRoleDto, string> = {
  admin: "Admin",
  steward: "Steward",
  member: "Member",
};

export const initiativeStatusLabel: Record<InitiativeStatusDto, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

export const initiativeThreadStatusLabel: Record<
  InitiativeThreadStatusDto,
  string
> = {
  open: "Open",
  resolved: "Resolved",
  locked: "Locked",
};

export const initiativeBoardStatusLabel: Record<
  InitiativeBoardCardStatusDto,
  string
> = {
  backlog: "Backlog",
  doing: "In progress",
  proposal: "Proposal ready",
  blocked: "Blocked",
  done: "Done",
};

export const initiativeBoardStatusOrder: InitiativeBoardCardStatusDto[] = [
  "backlog",
  "doing",
  "proposal",
  "blocked",
  "done",
];

export const defaultInitiativeBoardColumns: InitiativeBoardColumnDto[] =
  initiativeBoardStatusOrder.map((status, sortOrder) => ({
    id: status,
    key: status,
    title: initiativeBoardStatusLabel[status],
    sortOrder,
  }));

export function initiativeStatusTone(
  status: InitiativeStatusDto,
): "neutral" | "ok" | "warn" {
  if (status === "active") return "ok";
  if (status === "paused") return "warn";
  return "neutral";
}

export function initiativeThreadStatusTone(
  status: InitiativeThreadStatusDto,
): "neutral" | "ok" | "warn" {
  if (status === "open") return "ok";
  if (status === "locked") return "warn";
  return "neutral";
}

export function initiativePath(initiative: InitiativePathIdentity): string {
  const routeId = initiative.slug?.trim() || initiative.id;
  return `/app/initiatives/${encodeURIComponent(routeId)}`;
}

export function initiativeBoardCardCreatePath(
  initiative: InitiativePathIdentity,
): string {
  return `${initiativePath(initiative)}/board/new`;
}

export function canManageInitiative(
  initiative: InitiativeManageability,
): boolean {
  return initiative.status === "active" && Boolean(initiative.viewerCanSteward);
}

export function initiativeSummaryPreview(value: string, maxLength = 150) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const boundary = normalized.lastIndexOf(" ", maxLength - 1);
  const cutAt = boundary > 80 ? boundary : maxLength;
  return normalized.slice(0, cutAt).trim();
}

export function initiativeOptionsWithSelection(
  options: Array<{ value: string; label: string }>,
  selectedId?: string,
) {
  if (!selectedId || options.some((option) => option.value === selectedId)) {
    return options;
  }
  return [
    ...options,
    {
      value: selectedId,
      label: "Unavailable or no longer managed",
    },
  ];
}

export function initiativeCardsForColumn(
  cards: InitiativeBoardCardDto[],
  column: InitiativeBoardColumnDto,
): InitiativeBoardCardDto[] {
  const matches = cards.filter(
    (card) =>
      card.columnId === column.id ||
      card.columnId === column.key ||
      card.status === column.key,
  );

  return Array.from(
    new Map(matches.map((card) => [card.id, card])).values(),
  ).sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function parseInitiativeTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 8);
}
