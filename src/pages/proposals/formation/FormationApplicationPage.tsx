import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "@/app/auth/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/primitives/button";
import { apiFormationApplication } from "@/lib/api/formationApplications";
import { formationApplicationError } from "@/lib/formationApplicationUi";
import { viewerIsProposalAuthor } from "@/lib/proposalUi";
import { FormationApplications } from "./FormationApplications";

export default function FormationApplicationPage() {
  const { applicationId } = useParams();
  const auth = useAuth();
  if (!auth.authenticated || !auth.address)
    return (
      <p className="text-sm text-muted">
        Connect your wallet to read this application.
      </p>
    );
  if (!applicationId) return null;
  return (
    <ApplicationDetail
      key={`${auth.address}:${applicationId}`}
      id={applicationId}
      address={auth.address}
    />
  );
}

function ApplicationDetail({ id, address }: { id: string; address: string }) {
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof apiFormationApplication>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void apiFormationApplication(id)
      .then((value) => {
        if (active) setDetail(value);
      })
      .catch((cause) => {
        if (active) setError(formationApplicationError(cause));
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  if (!detail)
    return (
      <p role="status" className="text-sm text-muted">
        Loading application...
      </p>
    );
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title={detail.proposalTitle}
        className="flex-wrap"
        titleClassName="[overflow-wrap:anywhere]"
        right={
          <Button asChild variant="outline">
            <Link
              to={`/app/proposals/${encodeURIComponent(detail.application.proposalId)}/formation`}
            >
              Open project
            </Link>
          </Button>
        }
      />
      <FormationApplications
        proposalId={detail.application.proposalId}
        initialApplication={detail.application}
        initialRecruitmentBlock={detail.recruitmentBlock}
        isProposer={viewerIsProposalAuthor(address, detail.proposerAddress)}
      />
    </div>
  );
}
