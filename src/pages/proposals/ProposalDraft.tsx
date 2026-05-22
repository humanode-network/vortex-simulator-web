import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "@/components/primitives/button";
import { Card } from "@/components/primitives/card";
import { PageHint } from "@/components/PageHint";
import { SIM_AUTH_ENABLED } from "@/lib/featureFlags";
import { useAuth } from "@/app/auth/AuthContext";
import { formatProposalSubmitError } from "@/lib/proposalSubmitErrors";
import { parseRatioPair } from "@/lib/dtoParsers";
import {
  apiProposalDraft,
  apiProposalStatus,
  apiProposalSubmitToPool,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import type { ProposalDraftDetailDto } from "@/types/api";
import { ProposalDraftDetailsCard } from "./draft/ProposalDraftDetailsCard";

const ProposalDraft: React.FC = () => {
  const auth = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [draftDetails, setDraftDetails] =
    useState<ProposalDraftDetailDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { left: filledSlots, right: totalSlots } = parseRatioPair(
    draftDetails?.teamSlots ?? "0 / 0",
  );
  const openSlots = Math.max((totalSlots || 0) - (filledSlots || 0), 0);
  const canAct = !SIM_AUTH_ENABLED || (auth.authenticated && auth.eligible);
  const submittedDraft = Boolean(draftDetails?.submittedProposalId);

  useEffect(() => {
    if (auth.enabled && auth.loading) {
      return;
    }
    if (auth.enabled && !auth.authenticated) {
      setDraftDetails(null);
      setLoadError(null);
      return;
    }
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const res = await apiProposalDraft(id);
        if (!active) return;
        setDraftDetails(res);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setDraftDetails(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [auth.authenticated, auth.enabled, auth.loading, id]);

  if (!draftDetails) {
    return (
      <div className="flex flex-col gap-6">
        <PageHint pageId="proposals" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/app/proposals/drafts">Back to drafts</Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {id ? (
              <Button asChild size="sm" variant="outline">
                <Link to={`/app/proposals/new?draftId=${id}&step=essentials`}>
                  Edit draft
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="ghost">
              <Link to="/app/proposals/new">New proposal</Link>
            </Button>
          </div>
        </div>

        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          {auth.enabled && auth.loading
            ? "Loading draft…"
            : auth.enabled && !auth.authenticated
              ? "Connect a wallet to view this draft."
              : loadError
                ? `Draft unavailable: ${formatLoadError(loadError, "Failed to load draft.")}`
                : "Loading draft…"}
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/app/proposals/drafts">Back to drafts</Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {id && !submittedDraft ? (
            <Button asChild size="sm" variant="outline">
              <Link to={`/app/proposals/new?draftId=${id}&step=essentials`}>
                Edit draft
              </Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="ghost">
            <Link to="/app/proposals/new">New proposal</Link>
          </Button>
          <Button
            size="sm"
            disabled={!canAct || submitting || submittedDraft}
            title={
              submittedDraft
                ? "This draft was already submitted."
                : SIM_AUTH_ENABLED && !canAct
                  ? "Connect and verify as an eligible human node to submit."
                  : undefined
            }
            onClick={async () => {
              if (!id || !canAct || submittedDraft) return;
              setSubmitError(null);
              setSubmitting(true);
              try {
                const res = await apiProposalSubmitToPool({ draftId: id });
                navigate(`/app/proposals/${res.proposalId}/pp`, {
                  replace: true,
                });
              } catch (error) {
                setSubmitError(formatProposalSubmitError(error));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Submitting…" : "Submit to pool"}
          </Button>
          {draftDetails.submittedProposalId ? (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const proposalId = draftDetails.submittedProposalId;
                if (!proposalId) return;
                try {
                  const status = await apiProposalStatus(proposalId);
                  navigate(status.canonicalRoute);
                } catch {
                  navigate(`/app/proposals/${proposalId}/pp`);
                }
              }}
            >
              Open proposal
            </Button>
          ) : null}
        </div>
      </div>
      {submitError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-[var(--destructive)]">
          Submit failed: {formatLoadError(submitError)}
        </Card>
      ) : null}
      {draftDetails.submittedProposalId ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          This draft was already submitted and now lives as proposal{" "}
          {draftDetails.submittedProposalId}.
        </Card>
      ) : null}

      <ProposalDraftDetailsCard draft={draftDetails} openSlots={openSlots} />
    </div>
  );
};

export default ProposalDraft;
