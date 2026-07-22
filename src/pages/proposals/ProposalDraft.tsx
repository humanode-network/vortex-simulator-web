import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "@/components/primitives/button";
import { Card } from "@/components/primitives/card";
import { PageHint } from "@/components/PageHint";
import { useAuth } from "@/app/auth/AuthContext";
import { parseRatioPair } from "@/lib/dtoParsers";
import {
  apiProposalDraft,
  apiProposalDraftDelete,
  apiProposalStatus,
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
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { left: filledSlots, right: totalSlots } = parseRatioPair(
    draftDetails?.teamSlots ?? "0 / 0",
  );
  const openSlots = Math.max((totalSlots || 0) - (filledSlots || 0), 0);
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
                <Link to={`/app/proposals/new?draftId=${id}`}>
                  Continue editing
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
            <>
              <Button asChild size="sm" variant="outline">
                <Link to={`/app/proposals/new?draftId=${id}`}>
                  Continue editing
                </Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={deleting}
                onClick={async () => {
                  if (
                    !window.confirm(
                      "Delete this server draft? This cannot be undone.",
                    )
                  ) {
                    return;
                  }
                  setDeleteError(null);
                  setDeleting(true);
                  try {
                    await apiProposalDraftDelete({ draftId: id });
                    navigate("/app/proposals/drafts", { replace: true });
                  } catch (error) {
                    setDeleteError((error as Error).message);
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? "Deleting" : "Delete draft"}
              </Button>
            </>
          ) : null}
          <Button asChild size="sm" variant="ghost">
            <Link to="/app/proposals/new">New proposal</Link>
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
      {deleteError ? (
        <Card className="border-dashed px-4 py-4 text-center text-sm text-[var(--destructive)]">
          Delete failed: {formatLoadError(deleteError)}
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
