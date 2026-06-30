import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { GlassyCard } from "@/components/GlassyCard";
import { GlassySection } from "@/components/GlassySection";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHeader } from "@/components/PageHeader";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { apiInitiativeBoardCardCreate } from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import { canManageInitiative, initiativePath } from "@/lib/initiativeUi";
import { useInitiativePageData } from "./hooks/useInitiativePageData";

const InitiativeBoardCardCreate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { initiative, loadError } = useInitiativePageData(id);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submitCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!initiative || !title.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiInitiativeBoardCardCreate({
        initiativeId: initiative.id,
        title: title.trim(),
        body: body.trim(),
      });
      navigate(initiativePath(initiative));
    } catch (error) {
      setSubmitError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!id) {
    return <NoDataYetBar label="initiative id" />;
  }

  if (loadError) {
    return (
      <GlassyCard className="px-4 py-6 text-center text-sm text-destructive">
        Initiative unavailable: {formatLoadError(loadError)}
      </GlassyCard>
    );
  }

  if (!initiative) {
    return (
      <GlassyCard className="px-4 py-6 text-center text-sm text-muted">
        Loading initiative...
      </GlassyCard>
    );
  }

  const backHref = initiativePath(initiative);
  const canCreate = canManageInitiative(initiative);

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to={backHref}>Back to initiative</Link>
      </Button>

      <PageHeader
        eyebrow="Initiative board"
        title="Create card"
        description={`Add a work item to ${initiative.title}. New cards begin in Backlog.`}
        titleClassName="text-2xl"
      />

      {!canCreate ? (
        <NoDataYetBar
          label="board access"
          description="Only Initiative admins and stewards can create board cards."
        />
      ) : (
        <GlassySection title="Card details">
          <form className="grid max-w-3xl gap-4" onSubmit={submitCard}>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium text-text"
                htmlFor="card-title"
              >
                Title
              </label>
              <Input
                id="card-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Work item title"
                required
                maxLength={160}
              />
            </div>

            <div className="grid gap-2">
              <label
                className="text-sm font-medium text-text"
                htmlFor="card-body"
              >
                Work note
              </label>
              <Textarea
                id="card-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Context, expected outcome, or next action"
                maxLength={2000}
              />
            </div>

            {submitError ? (
              <p className="text-sm text-destructive">
                {formatLoadError(submitError)}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={submitting || !title.trim()}>
                Create card
              </Button>
              <Button asChild type="button" variant="outline">
                <Link to={backHref}>Cancel</Link>
              </Button>
            </div>
          </form>
        </GlassySection>
      )}
    </div>
  );
};

export default InitiativeBoardCardCreate;
