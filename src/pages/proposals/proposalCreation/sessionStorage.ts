import { getProposalPreset, inferPresetIdFromDraft } from "./presets/registry";
import { DEFAULT_DRAFT, type ProposalDraftForm } from "./types";
import {
  firstIncompleteWizardStep,
  pathIdForDraft,
  type WizardPathId,
  type WizardStepId,
} from "./wizardModel";

const SESSION_STORE_KEY = "vortex:proposalWizard:sessions:v2";
const MIGRATION_RECEIPT_KEY = "vortex:proposalWizard:migrated:v2";
const LEGACY_DRAFT_KEY = "vortex:proposalCreation:draft";
const LEGACY_TEMPLATE_KEY = "vortex:proposalCreation:template";
const LEGACY_PRESET_KEY = "vortex:proposalCreation:preset";
const LEGACY_SERVER_DRAFT_ID_KEY = "vortex:proposalCreation:serverDraftId";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type ProposalWizardSessionV2 = {
  version: 2;
  sessionId: string;
  draftId?: string;
  resubmitsProposalId?: string;
  templateId: "project" | "system";
  presetId: string;
  pathId: WizardPathId;
  lastVisitedStep: WizardStepId;
  form: ProposalDraftForm;
  legacyRecovery?: boolean;
  localRevision: number;
  serverSavedAt?: string;
  updatedAt: string;
};

type SessionStoreV2 = {
  version: 2;
  sessions: Record<string, ProposalWizardSessionV2>;
};

type SessionRepositoryOptions = {
  createId?: () => string;
  now?: () => string;
};

export function mergeProposalWizardServerSave(input: {
  draftId: string;
  latest: ProposalWizardSessionV2;
  requested: ProposalWizardSessionV2;
  serverSavedAt: string;
}) {
  if (input.latest.sessionId !== input.requested.sessionId) {
    throw new Error("Cannot merge a server save into another wizard session.");
  }
  return {
    changedDuringSync:
      input.latest.localRevision > input.requested.localRevision,
    session: {
      ...input.latest,
      draftId: input.draftId,
      serverSavedAt: input.serverSavedAt,
    },
  };
}

function cloneDraft(draft: ProposalDraftForm): ProposalDraftForm {
  return structuredClone(draft);
}

export function normalizeSessionDraft(
  parsed: Partial<ProposalDraftForm> | null | undefined,
): ProposalDraftForm {
  const chamberId =
    typeof parsed?.chamberId === "string" ? parsed.chamberId : "";
  return {
    ...cloneDraft(DEFAULT_DRAFT),
    ...(parsed ?? {}),
    chamberId,
    timeline: Array.isArray(parsed?.timeline)
      ? parsed.timeline.filter(Boolean)
      : cloneDraft(DEFAULT_DRAFT).timeline,
    outputs: Array.isArray(parsed?.outputs)
      ? parsed.outputs.filter(Boolean)
      : cloneDraft(DEFAULT_DRAFT).outputs,
    openSlotNeeds: Array.isArray(parsed?.openSlotNeeds)
      ? parsed.openSlotNeeds.filter(Boolean)
      : cloneDraft(DEFAULT_DRAFT).openSlotNeeds,
    budgetItems: Array.isArray(parsed?.budgetItems)
      ? parsed.budgetItems.filter(Boolean)
      : cloneDraft(DEFAULT_DRAFT).budgetItems,
    attachments: Array.isArray(parsed?.attachments)
      ? parsed.attachments.filter(Boolean)
      : cloneDraft(DEFAULT_DRAFT).attachments,
  };
}

function fallbackId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `proposal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyStore(): SessionStoreV2 {
  return { version: 2, sessions: {} };
}

function parseStore(storage: StorageLike): SessionStoreV2 {
  try {
    const raw = storage.getItem(SESSION_STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<SessionStoreV2>;
    if (parsed.version !== 2 || !parsed.sessions) return emptyStore();
    const sessions: Record<string, ProposalWizardSessionV2> = {};
    for (const [id, value] of Object.entries(parsed.sessions)) {
      if (
        !value ||
        value.version !== 2 ||
        value.sessionId !== id ||
        !value.form
      ) {
        continue;
      }
      const templateId: "project" | "system" =
        value.templateId === "system" ? "system" : "project";
      const form = normalizeSessionDraft(value.form);
      sessions[id] = {
        ...value,
        templateId,
        form,
        pathId: pathIdForDraft(form, templateId),
      };
    }
    return { version: 2, sessions };
  } catch {
    return emptyStore();
  }
}

function draftHasMeaningfulContent(draft: ProposalDraftForm): boolean {
  return Boolean(
    draft.title.trim() ||
      draft.summary.trim() ||
      draft.what.trim() ||
      draft.why.trim() ||
      draft.how.trim() ||
      draft.chamberId.trim() ||
      draft.initiativeId ||
      draft.resubmitsProposalId ||
      draft.metaGovernance,
  );
}

export function createProposalWizardSessionRepository(
  storage: StorageLike,
  options: SessionRepositoryOptions = {},
) {
  const createId = options.createId ?? fallbackId;
  const now = options.now ?? (() => new Date().toISOString());

  function writeStore(store: SessionStoreV2) {
    storage.setItem(SESSION_STORE_KEY, JSON.stringify(store));
  }

  function create(input?: {
    draftId?: string;
    form?: ProposalDraftForm;
    legacyRecovery?: boolean;
    presetId?: string;
    resubmitsProposalId?: string;
    templateId?: "project" | "system";
  }): ProposalWizardSessionV2 {
    const store = parseStore(storage);
    const sessionId = createId();
    const form = normalizeSessionDraft(input?.form);
    const resubmitsProposalId =
      input?.resubmitsProposalId ?? form.resubmitsProposalId;
    if (resubmitsProposalId) form.resubmitsProposalId = resubmitsProposalId;
    const templateId =
      input?.templateId ?? (form.metaGovernance ? "system" : "project");
    const session: ProposalWizardSessionV2 = {
      version: 2,
      sessionId,
      ...(input?.draftId ? { draftId: input.draftId } : {}),
      ...(resubmitsProposalId ? { resubmitsProposalId } : {}),
      templateId,
      presetId: input?.presetId ?? "",
      pathId: pathIdForDraft(form, templateId),
      lastVisitedStep: "intent",
      form,
      ...(input?.legacyRecovery ? { legacyRecovery: true } : {}),
      localRevision: 0,
      updatedAt: now(),
    };
    store.sessions[sessionId] = session;
    writeStore(store);
    return session;
  }

  function get(sessionId: string): ProposalWizardSessionV2 | null {
    return parseStore(storage).sessions[sessionId] ?? null;
  }

  function findByDraftId(draftId: string): ProposalWizardSessionV2 | null {
    return (
      Object.values(parseStore(storage).sessions).find(
        (session) => session.draftId === draftId,
      ) ?? null
    );
  }

  function save(session: ProposalWizardSessionV2): ProposalWizardSessionV2 {
    const store = parseStore(storage);
    const next: ProposalWizardSessionV2 = {
      ...session,
      version: 2,
      form: normalizeSessionDraft(session.form),
      pathId: pathIdForDraft(session.form, session.templateId),
      localRevision: session.localRevision + 1,
      updatedAt: now(),
    };
    store.sessions[next.sessionId] = next;
    writeStore(store);
    return next;
  }

  function remove(sessionId: string) {
    const store = parseStore(storage);
    delete store.sessions[sessionId];
    writeStore(store);
  }

  function listRecoverable(
    exceptSessionId?: string,
  ): ProposalWizardSessionV2[] {
    return Object.values(parseStore(storage).sessions)
      .filter(
        (session) =>
          session.sessionId !== exceptSessionId &&
          (Boolean(session.draftId) || draftHasMeaningfulContent(session.form)),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  function migrateLegacy(): ProposalWizardSessionV2 | null {
    if (storage.getItem(MIGRATION_RECEIPT_KEY)) return null;
    storage.setItem(MIGRATION_RECEIPT_KEY, now());
    try {
      const rawDraft = storage.getItem(LEGACY_DRAFT_KEY);
      if (!rawDraft) return null;
      const form = normalizeSessionDraft(
        JSON.parse(rawDraft) as Partial<ProposalDraftForm>,
      );
      const draftId =
        storage.getItem(LEGACY_SERVER_DRAFT_ID_KEY)?.trim() || undefined;
      if (!draftId && !draftHasMeaningfulContent(form)) return null;
      const storedTemplate = storage.getItem(LEGACY_TEMPLATE_KEY);
      const templateId =
        storedTemplate === "system" || form.metaGovernance
          ? "system"
          : "project";
      const inferredPresetId = inferPresetIdFromDraft(form);
      const storedPreset = storage.getItem(LEGACY_PRESET_KEY)?.trim();
      const presetId =
        storedPreset &&
        getProposalPreset(storedPreset).templateId === templateId
          ? storedPreset
          : inferredPresetId;
      const session = create({
        ...(draftId ? { draftId } : {}),
        form,
        legacyRecovery: true,
        presetId,
        resubmitsProposalId: form.resubmitsProposalId,
        templateId,
      });
      return save({
        ...session,
        lastVisitedStep: firstIncompleteWizardStep(session.pathId, {
          draft: session.form,
          presetId: session.presetId,
          tierBlocked: false,
        }),
      });
    } catch {
      return null;
    }
  }

  function clearLegacy() {
    storage.removeItem(LEGACY_DRAFT_KEY);
    storage.removeItem("vortex:proposalCreation:step");
    storage.removeItem(LEGACY_TEMPLATE_KEY);
    storage.removeItem(LEGACY_PRESET_KEY);
    storage.removeItem(LEGACY_SERVER_DRAFT_ID_KEY);
  }

  return {
    create,
    clearLegacy,
    findByDraftId,
    get,
    listRecoverable,
    migrateLegacy,
    remove,
    save,
  };
}

export type ProposalWizardSessionRepository = ReturnType<
  typeof createProposalWizardSessionRepository
>;
