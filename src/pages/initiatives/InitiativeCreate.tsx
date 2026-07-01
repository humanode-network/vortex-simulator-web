import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { useAuth } from "@/app/auth/AuthContext";
import { GlassyCard } from "@/components/GlassyCard";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import { apiInitiativeCreate } from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import { initiativePath, parseInitiativeTags } from "@/lib/initiativeUi";
import type { InitiativeVisibilityDto } from "@/types/api";

const InitiativeCreate: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] =
    useState<InitiativeVisibilityDto>("public");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submitInitiative(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedSummary = summary.trim();
    if (!trimmedTitle || !trimmedSummary) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await apiInitiativeCreate({
        title: trimmedTitle,
        summary: trimmedSummary,
        description: description.trim(),
        tags: parseInitiativeTags(tags),
        visibility,
      });
      navigate(initiativePath(res.initiative));
    } catch (error) {
      setSubmitError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const canCreate = auth.authenticated && auth.eligible;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-start">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/initiatives">Back to initiatives</Link>
        </Button>
      </div>

      {!auth.loading && !canCreate ? (
        <NoDataYetBar
          label="initiative access"
          description="Only active Human Nodes can create initiatives."
        />
      ) : null}

      {auth.loading ? (
        <GlassyCard className="px-4 py-6 text-center text-sm text-muted">
          Checking Initiative access...
        </GlassyCard>
      ) : canCreate ? (
        <GlassyCard as="article" className="p-5">
          <form className="grid gap-4" onSubmit={submitInitiative}>
            <div className="grid gap-2">
              <label
                className="text-sm font-semibold text-text"
                htmlFor="initiative-title"
              >
                Title
              </label>
              <Input
                id="initiative-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Initiative title"
                required
              />
            </div>

            <div className="grid gap-2">
              <label
                className="text-sm font-semibold text-text"
                htmlFor="initiative-visibility"
              >
                Access
              </label>
              <Select
                id="initiative-visibility"
                value={visibility}
                onChange={(event) =>
                  setVisibility(event.target.value as InitiativeVisibilityDto)
                }
              >
                <option value="public">
                  Public - active Human Nodes join immediately
                </option>
                <option value="private">
                  Private - admins or stewards approve requests
                </option>
              </Select>
            </div>

            <div className="grid gap-2">
              <label
                className="text-sm font-semibold text-text"
                htmlFor="initiative-summary"
              >
                Summary
              </label>
              <Input
                id="initiative-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="One sentence that explains the work"
                required
              />
            </div>

            <div className="grid gap-2">
              <label
                className="text-sm font-semibold text-text"
                htmlFor="initiative-description"
              >
                Description
              </label>
              <Textarea
                id="initiative-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Scope, context, and expected outcomes"
              />
            </div>

            <div className="grid gap-2">
              <label
                className="text-sm font-semibold text-text"
                htmlFor="initiative-tags"
              >
                Tags
              </label>
              <Input
                id="initiative-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Comma-separated tags"
              />
            </div>

            {submitError ? (
              <p className="text-sm text-destructive">
                {formatLoadError(submitError)}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting || !title.trim() || !summary.trim()}
              >
                Create initiative
              </Button>
            </div>
          </form>
        </GlassyCard>
      ) : null}
    </div>
  );
};

export default InitiativeCreate;
