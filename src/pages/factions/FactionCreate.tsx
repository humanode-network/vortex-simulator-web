import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { Kicker } from "@/components/Kicker";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import { apiFactionCreate, getApiErrorPayload } from "@/lib/apiClient";

type FormState = {
  name: string;
  description: string;
  focus: string;
  visibility: "public" | "private";
  goalsText: string;
  tagsText: string;
  cofoundersText: string;
};

const FACTION_CREATE_DRAFT_KEY = "vortex:faction-create-draft:v1";

function loadFactionDraft(): { step: 1 | 2 | 3; form: FormState } | null {
  try {
    const raw = localStorage.getItem(FACTION_CREATE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<{
      step: 1 | 2 | 3;
      form: Partial<FormState>;
    }>;
    const step =
      parsed.step === 1 || parsed.step === 2 || parsed.step === 3
        ? parsed.step
        : 1;
    const form = parsed.form ?? {};
    return {
      step,
      form: {
        name: typeof form.name === "string" ? form.name : "",
        description:
          typeof form.description === "string" ? form.description : "",
        focus:
          typeof form.focus === "string" && form.focus.trim()
            ? form.focus
            : "General",
        visibility: form.visibility === "private" ? "private" : "public",
        goalsText: typeof form.goalsText === "string" ? form.goalsText : "",
        tagsText: typeof form.tagsText === "string" ? form.tagsText : "",
        cofoundersText:
          typeof form.cofoundersText === "string" ? form.cofoundersText : "",
      },
    };
  } catch {
    return null;
  }
}

function saveFactionDraft(payload: { step: 1 | 2 | 3; form: FormState }) {
  localStorage.setItem(FACTION_CREATE_DRAFT_KEY, JSON.stringify(payload));
}

function clearFactionDraft() {
  localStorage.removeItem(FACTION_CREATE_DRAFT_KEY);
}

const FactionCreate: React.FC = () => {
  const navigate = useNavigate();
  const initialDraft = loadFactionDraft();
  const [step, setStep] = useState<1 | 2 | 3>(initialDraft?.step ?? 1);
  const [saving, setSaving] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(
    initialDraft ? "Loaded saved draft." : null,
  );
  const [error, setError] = useState<string | null>(null);
  const createIdempotencyKeyRef = useRef<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: initialDraft?.form.name ?? "",
    description: initialDraft?.form.description ?? "",
    focus: initialDraft?.form.focus ?? "General",
    visibility: initialDraft?.form.visibility ?? "public",
    goalsText: initialDraft?.form.goalsText ?? "",
    tagsText: initialDraft?.form.tagsText ?? "",
    cofoundersText: initialDraft?.form.cofoundersText ?? "",
  });

  const goals = useMemo(
    () =>
      form.goalsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [form.goalsText],
  );

  const tags = useMemo(
    () =>
      form.tagsText
        .split(",")
        .map((line) => line.trim())
        .filter(Boolean),
    [form.tagsText],
  );

  const cofounders = useMemo(
    () =>
      form.cofoundersText
        .split(/[\n,]+/)
        .map((line) => line.trim())
        .filter(Boolean),
    [form.cofoundersText],
  );

  const validationError = useMemo(() => {
    const name = form.name.trim();
    const description = form.description.trim();
    const focus = form.focus.trim();
    if (name.length < 2) return "Name must be at least 2 characters.";
    if (name.length > 80) return "Name must be 80 characters or less.";
    if (description.length < 1) return "Description is required.";
    if (description.length > 280)
      return "Description must be 280 characters or less.";
    if (focus.length < 1) return "Focus is required.";
    if (focus.length > 80) return "Focus must be 80 characters or less.";
    if (goals.length > 12) return "Goals must contain at most 12 items.";
    if (goals.some((goal) => goal.length > 300))
      return "Each goal must be 300 characters or less.";
    if (tags.length > 12) return "Tags must contain at most 12 items.";
    if (tags.some((tag) => tag.length > 40))
      return "Each tag must be 40 characters or less.";
    if (cofounders.length > 16)
      return "Cofounders must contain at most 16 addresses.";
    return null;
  }, [cofounders.length, form.description, form.focus, form.name, goals, tags]);

  const canGoNextStep1 = !validationError;
  const canSubmit = !validationError;

  const onCreate = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (!createIdempotencyKeyRef.current) {
        createIdempotencyKeyRef.current = `faction-create:${Date.now()}:${Math.random().toString(36).slice(2)}`;
      }
      const response = await apiFactionCreate({
        name: form.name.trim(),
        description: form.description.trim(),
        focus: form.focus.trim(),
        visibility: form.visibility,
        goals,
        tags,
        cofounders,
        idempotencyKey: createIdempotencyKeyRef.current,
      });
      clearFactionDraft();
      navigate(`/app/factions/${response.faction.id}`);
    } catch (e) {
      const payload = getApiErrorPayload(e);
      const issues = Array.isArray(
        (payload as { error?: { issues?: unknown[] } } | null)?.error?.issues,
      )
        ? ((payload as { error?: { issues?: unknown[] } }).error?.issues ?? [])
        : [];
      const issue = (issues[0] ?? null) as {
        path?: unknown;
        message?: unknown;
      } | null;
      const issuePath =
        issue && Array.isArray(issue.path) && issue.path.length > 0
          ? issue.path.join(".")
          : null;
      const issueMessage =
        issuePath && typeof issue?.message === "string"
          ? `${issuePath}: ${issue.message}`
          : null;
      const message =
        issueMessage ??
        payload?.error?.message ??
        (e instanceof Error ? e.message : "Failed to create faction");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const onSaveDraft = () => {
    saveFactionDraft({ step, form });
    setDraftNotice("Draft saved locally.");
  };

  const onClearDraft = () => {
    clearFactionDraft();
    setDraftNotice("Draft cleared.");
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <Kicker>Phase 67</Kicker>
            <CardTitle>Create faction</CardTitle>
            <p className="text-sm text-muted">
              Factions coordinate members, initiatives, and discussion before
              formal governance actions.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/app/factions">Back</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { n: 1, label: "Identity" },
              { n: 2, label: "Access & goals" },
              { n: 3, label: "Review" },
            ].map((item) => (
              <div
                key={item.n}
                className={`rounded-md border px-3 py-2 text-sm ${
                  step === item.n
                    ? "border-primary text-primary"
                    : "border-border text-muted"
                }`}
              >
                {item.n}. {item.label}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <section className="space-y-4">
              <label className="block space-y-1">
                <span className="text-sm text-muted">Name</span>
                <Input
                  maxLength={80}
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="e.g. Signal Cohort"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm text-muted">Description</span>
                <textarea
                  maxLength={280}
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="What this faction is for and how it contributes."
                />
                <p className="text-xs text-muted">Minimum 2 characters.</p>
              </label>
              <label className="block space-y-1">
                <span className="text-sm text-muted">Focus</span>
                <Input
                  maxLength={80}
                  value={form.focus}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, focus: event.target.value }))
                  }
                  placeholder="Governance"
                />
              </label>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="space-y-4">
              <label className="block space-y-1">
                <span className="text-sm text-muted">Visibility</span>
                <Select
                  value={form.visibility}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      visibility: event.target.value as "public" | "private",
                    }))
                  }
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </Select>
              </label>
              <label className="block space-y-1">
                <span className="text-sm text-muted">Goals (one per line)</span>
                <textarea
                  value={form.goalsText}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      goalsText: event.target.value,
                    }))
                  }
                  rows={5}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={
                    "Align process quality\nPrepare chamber-ready initiatives"
                  }
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm text-muted">
                  Tags (comma separated)
                </span>
                <Input
                  value={form.tagsText}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      tagsText: event.target.value,
                    }))
                  }
                  placeholder="governance, process, ops"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm text-muted">
                  Cofounders (addresses, comma or newline separated)
                </span>
                <textarea
                  value={form.cofoundersText}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      cofoundersText: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={"hm...\nhm..."}
                />
              </label>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="space-y-3 text-sm">
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-muted">Name</p>
                <p className="font-semibold text-text">{form.name || "—"}</p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-muted">Description</p>
                <p className="text-text">{form.description || "—"}</p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-muted">Focus / Visibility</p>
                <p className="text-text">
                  {form.focus || "General"} / {form.visibility}
                </p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-muted">Goals</p>
                <p className="text-text">
                  {goals.length ? goals.join(" · ") : "None"}
                </p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-muted">Tags</p>
                <p className="text-text">
                  {tags.length ? tags.join(", ") : "None"}
                </p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-muted">Cofounders</p>
                <p className="text-text">
                  {cofounders.length ? cofounders.join(", ") : "None"}
                </p>
              </div>
            </section>
          ) : null}

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {!error && validationError ? (
            <div className="rounded-md border border-border bg-panel-alt px-3 py-2 text-sm text-muted">
              {validationError}
            </div>
          ) : null}
          {draftNotice ? (
            <div className="rounded-md border border-border bg-panel-alt px-3 py-2 text-sm text-muted">
              {draftNotice}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev))
              }
              disabled={step === 1 || saving}
            >
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onSaveDraft}
                disabled={saving}
              >
                Save draft
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onClearDraft}
                disabled={saving}
              >
                Clear draft
              </Button>
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep((prev) => (prev + 1) as 2 | 3)}
                  disabled={(step === 1 && !canGoNextStep1) || saving}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onCreate}
                  disabled={!canSubmit || saving}
                >
                  {saving ? "Creating..." : "Create faction"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FactionCreate;
