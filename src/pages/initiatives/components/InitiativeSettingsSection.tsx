import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { GlassySection } from "@/components/GlassySection";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import { apiInitiativeUpdate } from "@/lib/apiClient";
import { initiativeStatusLabel, parseInitiativeTags } from "@/lib/initiativeUi";
import type { InitiativeDto, InitiativeStatusDto } from "@/types/api";

type InitiativeSettingsSectionProps = {
  initiative: InitiativeDto;
  onChanged: () => Promise<void> | void;
};

export function InitiativeSettingsSection({
  initiative,
  onChanged,
}: InitiativeSettingsSectionProps) {
  const [title, setTitle] = useState(initiative.title);
  const [summary, setSummary] = useState(initiative.summary);
  const [description, setDescription] = useState(initiative.description);
  const [tags, setTags] = useState(initiative.tags.join(", "));
  const [status, setStatus] = useState<InitiativeStatusDto>(initiative.status);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const archivedReadOnly =
    initiative.status === "archived" && status !== "active";

  const resetDraft = useCallback(() => {
    setTitle(initiative.title);
    setSummary(initiative.summary);
    setDescription(initiative.description);
    setTags(initiative.tags.join(", "));
    setStatus(initiative.status);
  }, [initiative]);

  useEffect(() => {
    resetDraft();
  }, [resetDraft]);

  function cancelEditing() {
    resetDraft();
    setError(null);
    setEditing(false);
  }

  async function updateInitiative(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !summary.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiInitiativeUpdate({
        initiativeId: initiative.id,
        title: title.trim(),
        summary: summary.trim(),
        description: description.trim(),
        tags: parseInitiativeTags(tags),
        status,
      });
      await onChanged();
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setEditing(true)}>
          Edit initiative
        </Button>
      </div>
    );
  }

  return (
    <GlassySection
      title="Settings"
      action={
        <Button type="button" size="sm" variant="ghost" onClick={cancelEditing}>
          Cancel
        </Button>
      }
    >
      <form className="grid gap-3" onSubmit={updateInitiative}>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            disabled={archivedReadOnly}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Initiative title"
            aria-label="Initiative title"
          />
          <Input
            disabled={archivedReadOnly}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Initiative summary"
            aria-label="Initiative summary"
          />
        </div>
        <Textarea
          disabled={archivedReadOnly}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Initiative description"
          aria-label="Initiative description"
        />
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_auto]">
          <Input
            disabled={archivedReadOnly}
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="Comma-separated tags"
            aria-label="Initiative tags"
          />
          <Select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as InitiativeStatusDto)
            }
            aria-label="Initiative status"
          >
            {Object.entries(initiativeStatusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Button
            type="submit"
            size="sm"
            disabled={
              submitting || archivedReadOnly || !title.trim() || !summary.trim()
            }
          >
            Save
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </GlassySection>
  );
}
