import { expect, test } from "@rstest/core";

import { DEFAULT_DRAFT } from "../../src/pages/proposals/proposalCreation/types";
import {
  createProposalWizardSessionRepository,
  mergeProposalWizardServerSave,
} from "../../src/pages/proposals/proposalCreation/sessionStorage";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function repository(storage = new MemoryStorage()) {
  let id = 0;
  let tick = 0;
  return {
    repository: createProposalWizardSessionRepository(storage, {
      createId: () => `session-${++id}`,
      now: () => `2026-07-02T00:00:0${tick++}.000Z`,
    }),
    storage,
  };
}

test("sessions isolate form, step, template, preset, and server identity", () => {
  const { repository: repo } = repository();
  const first = repo.create();
  const second = repo.create();
  repo.save({
    ...first,
    draftId: "draft-one",
    presetId: "project.policy",
    lastVisitedStep: "plan",
    form: { ...first.form, title: "First", formationEligible: false },
  });
  expect(repo.get(first.sessionId)?.form.title).toBe("First");
  expect(repo.get(second.sessionId)?.form.title).toBe("");
  expect(repo.get(second.sessionId)?.draftId).toBeUndefined();
});

test("legacy migration preserves content but ignores the legacy step", () => {
  const { repository: repo, storage } = repository();
  storage.setItem(
    "vortex:proposalCreation:draft",
    JSON.stringify({
      ...DEFAULT_DRAFT,
      title: "Recovered",
      formationEligible: false,
    }),
  );
  storage.setItem("vortex:proposalCreation:step", "review");
  storage.setItem("vortex:proposalCreation:preset", "project.policy");
  storage.setItem("vortex:proposalCreation:template", "project");
  const migrated = repo.migrateLegacy();
  expect(migrated?.form.title).toBe("Recovered");
  expect(migrated?.lastVisitedStep).toBe("essentials");
  expect(storage.getItem("vortex:proposalCreation:draft")).not.toBeNull();
  expect(repo.migrateLegacy()).toBeNull();
});

test("malformed stores fail closed without affecting new in-memory work", () => {
  const { repository: repo, storage } = repository();
  storage.setItem("vortex:proposalWizard:sessions:v2", "{bad json");
  const created = repo.create({ form: { ...DEFAULT_DRAFT, title: "Safe" } });
  expect(repo.get(created.sessionId)?.form.title).toBe("Safe");
});

test("recoverable sessions omit empty current sessions and sort newest first", () => {
  const { repository: repo } = repository();
  const current = repo.create();
  const older = repo.create({ form: { ...DEFAULT_DRAFT, title: "Older" } });
  const newer = repo.create({ form: { ...DEFAULT_DRAFT, title: "Newer" } });
  expect(
    repo.listRecoverable(current.sessionId).map((session) => session.sessionId),
  ).toEqual([newer.sessionId, older.sessionId]);
});

test("removing one session does not clear another", () => {
  const { repository: repo } = repository();
  const first = repo.create({ form: { ...DEFAULT_DRAFT, title: "First" } });
  const second = repo.create({ form: { ...DEFAULT_DRAFT, title: "Second" } });
  repo.remove(first.sessionId);
  expect(repo.get(first.sessionId)).toBeNull();
  expect(repo.get(second.sessionId)?.form.title).toBe("Second");
});

test("legacy data is removed only through explicit repository cleanup", () => {
  const { repository: repo, storage } = repository();
  storage.setItem(
    "vortex:proposalCreation:draft",
    JSON.stringify({ ...DEFAULT_DRAFT, title: "Legacy" }),
  );
  const migrated = repo.migrateLegacy();
  expect(migrated?.legacyRecovery).toBe(true);
  expect(storage.getItem("vortex:proposalCreation:draft")).not.toBeNull();
  repo.clearLegacy();
  expect(storage.getItem("vortex:proposalCreation:draft")).toBeNull();
});

test("server synchronization binds identity without replacing newer local work", () => {
  const { repository: repo } = repository();
  const requested = repo.create({
    form: { ...DEFAULT_DRAFT, title: "Requested" },
  });
  const latest = repo.save({
    ...requested,
    form: { ...requested.form, title: "Edited during synchronization" },
  });
  const merged = mergeProposalWizardServerSave({
    draftId: "draft-server",
    latest,
    requested,
    serverSavedAt: "2026-07-02T12:00:00.000Z",
  });
  expect(merged.changedDuringSync).toBe(true);
  expect(merged.session.draftId).toBe("draft-server");
  expect(merged.session.form.title).toBe("Edited during synchronization");
});

test("server synchronization cannot cross proposal sessions", () => {
  const { repository: repo } = repository();
  const requested = repo.create();
  const latest = repo.create();
  expect(() =>
    mergeProposalWizardServerSave({
      draftId: "draft-server",
      latest,
      requested,
      serverSavedAt: "2026-07-02T12:00:00.000Z",
    }),
  ).toThrow("another wizard session");
});
