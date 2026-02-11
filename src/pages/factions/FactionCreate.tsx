import { useMemo, useState } from "react";
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

const FactionCreate: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    focus: "General",
    visibility: "public",
    goalsText: "",
    tagsText: "",
    cofoundersText: "",
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

  const canGoNextStep1 =
    form.name.trim().length >= 2 &&
    form.description.trim().length >= 10 &&
    form.focus.trim().length > 0;
  const canSubmit = canGoNextStep1;

  const onCreate = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await apiFactionCreate({
        name: form.name.trim(),
        description: form.description.trim(),
        focus: form.focus.trim(),
        visibility: form.visibility,
        goals,
        tags,
        cofounders,
      });
      navigate(`/app/factions/${response.faction.id}`);
    } catch (e) {
      const payload = getApiErrorPayload(e);
      const message =
        payload?.error?.message ??
        (e instanceof Error ? e.message : "Failed to create faction");
      setError(message);
    } finally {
      setSaving(false);
    }
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
              </label>
              <label className="block space-y-1">
                <span className="text-sm text-muted">Focus</span>
                <Input
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
