import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { useAuth } from "@/app/auth/AuthContext";
import { PageHint } from "@/components/PageHint";
import { Button } from "@/components/primitives/button";
import { Surface } from "@/components/Surface";
import { addressesReferToSameIdentity } from "@/lib/addressIdentity";
import { apiProposalStatus, apiPublicProposalDraft } from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import type { ProposalDraftDetailDto } from "@/types/api";
import { DraftPublicationActions } from "./draft/DraftPublicationActions";
import { CopyLinkButton } from "./draft/CopyLinkButton";
import {
  editDraftRoute,
  proposalDraftRoutes,
  publicationRoute,
} from "./draft/draftUi";
import { ProposalDraftDetailsCard } from "./draft/ProposalDraftDetailsCard";
import { CourtReportButton } from "@/pages/courts/CourtReportButton";

const PublicDraft: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [draft, setDraft] = useState<ProposalDraftDetailDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void apiPublicProposalDraft(id)
      .then((response) => {
        if (!active) return;
        setDraft(response);
        setLoadError(null);
      })
      .catch((error) => {
        if (!active) return;
        setDraft(null);
        setLoadError(formatLoadError(error, "Public draft unavailable."));
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (!draft) {
    return (
      <div className="flex flex-col gap-6">
        <PageHint pageId="proposals" />
        <Button asChild size="sm" variant="outline" className="w-fit">
          <Link to={proposalDraftRoutes.public}>Public drafts</Link>
        </Button>
        <Surface
          variant="panelAlt"
          radius="2xl"
          className="px-5 py-6 text-center text-sm text-muted"
        >
          {loadError ?? "Loading public draft…"}
        </Surface>
      </div>
    );
  }

  const owner = addressesReferToSameIdentity(auth.address, draft.proposer);

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild size="sm" variant="outline" className="w-fit">
          <Link to={proposalDraftRoutes.public}>Public drafts</Link>
        </Button>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {draft.id ? (
            <CourtReportButton
              target={{ type: "public_proposal_draft", id: draft.id }}
            />
          ) : null}
          {!owner && draft.id ? (
            <CopyLinkButton
              value={publicationRoute(draft.id, draft.publication)}
            />
          ) : null}
          {owner && draft.id && draft.publication.status === "published" ? (
            <Button asChild size="sm" variant="outline">
              <Link to={editDraftRoute(draft.id)}>Continue editing</Link>
            </Button>
          ) : null}
          {owner && draft.id ? (
            <DraftPublicationActions
              draftId={draft.id}
              publication={draft.publication}
              onChanged={(publication) => {
                if (publication.status === "withdrawn") {
                  navigate(proposalDraftRoutes.public, { replace: true });
                  return;
                }
                setDraft((current) =>
                  current ? { ...current, publication } : current,
                );
              }}
            />
          ) : null}
          {draft.submittedProposalId ? (
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                if (draft.publication?.submittedProposalRoute) {
                  navigate(draft.publication.submittedProposalRoute);
                  return;
                }
                const status = await apiProposalStatus(
                  draft.submittedProposalId!,
                );
                navigate(status.canonicalRoute);
              }}
            >
              Open live proposal
            </Button>
          ) : null}
        </div>
      </div>

      <ProposalDraftDetailsCard draft={draft} />
    </div>
  );
};

export default PublicDraft;
