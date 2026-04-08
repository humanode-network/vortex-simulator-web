import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { ProposalStageBar } from "@/components/ProposalStageBar";
import { Surface } from "@/components/Surface";
import { StatTile } from "@/components/StatTile";
import { PageHint } from "@/components/PageHint";
import { TierLabel } from "@/components/TierLabel";
import { AddressInline } from "@/components/AddressInline";
import { AttachmentList } from "@/components/AttachmentList";
import { TitledSurface } from "@/components/TitledSurface";
import { SIM_AUTH_ENABLED } from "@/lib/featureFlags";
import { useAuth } from "@/app/auth/AuthContext";
import { formatProposalSubmitError } from "@/lib/proposalSubmitErrors";
import {
  apiProposalDraft,
  apiProposalStatus,
  apiProposalSubmitToPool,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import type { ProposalDraftDetailDto } from "@/types/api";

function parseRatioPair(value: string): { left: number; right: number } {
  const matches = value.match(/\d+/g) ?? [];
  const leftRaw = matches[0];
  const rightRaw = matches[1];
  if (!leftRaw || !rightRaw) return { left: 0, right: 0 };
  const left = Number.parseInt(leftRaw, 10);
  const right = Number.parseInt(rightRaw, 10);
  return {
    left: Number.isFinite(left) ? left : 0,
    right: Number.isFinite(right) ? right : 0,
  };
}

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

      <Card>
        <CardHeader className="space-y-3 pb-3">
          <CardTitle className="text-2xl font-semibold text-text">
            {draftDetails.title}
          </CardTitle>
          <ProposalStageBar current="draft" />
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              label="Chamber"
              value={draftDetails.chamber}
              radius="2xl"
              className="px-4 py-4"
              labelClassName="text-[0.8rem]"
              valueClassName="text-lg"
            />
            <StatTile
              label="Proposer"
              value={
                <AddressInline
                  address={draftDetails.proposer}
                  className="justify-center"
                  textClassName="text-base"
                />
              }
              radius="2xl"
              className="px-4 py-4"
              labelClassName="text-[0.8rem]"
              valueClassName="text-lg"
            />
            <StatTile
              label="Tier"
              value={<TierLabel tier={draftDetails.tier} />}
              radius="2xl"
              className="px-4 py-4"
              labelClassName="text-[0.8rem]"
              valueClassName="text-lg"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Budget ask", value: draftDetails.budget },
              {
                label: "Formation",
                value: draftDetails.formationEligible ? "Yes" : "No",
              },
              {
                label: "Team slots",
                value: `${draftDetails.teamSlots} (open: ${openSlots})`,
              },
              {
                label: "Milestones",
                value: draftDetails.milestonesPlanned,
              },
            ].map((item) => (
              <StatTile
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>

          <Surface variant="panelAlt" className="space-y-4 px-4 py-4 text-text">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Summary</p>
              <p className="text-sm leading-relaxed text-muted">
                {draftDetails.summary}
              </p>
            </div>
            <TitledSurface
              variant="panel"
              radius="xl"
              shadow="control"
              title="Proposal overview"
              className="space-y-2 px-3 py-3"
            >
              <p className="text-sm leading-relaxed text-muted">
                {draftDetails.rationale}
              </p>
            </TitledSurface>
            <TitledSurface
              variant="panel"
              radius="xl"
              shadow="control"
              title="Execution plan"
              className="space-y-2 px-3 py-3"
            >
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {draftDetails.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </TitledSurface>
            <TitledSurface
              variant="panel"
              radius="xl"
              shadow="control"
              title="Budget &amp; scope"
              className="space-y-2 px-3 py-3"
            >
              <p className="text-sm text-muted">{draftDetails.budgetScope}</p>
            </TitledSurface>
          </Surface>

          <div className="grid gap-3 lg:grid-cols-2">
            <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
              <p className="text-sm font-semibold">Team (locked)</p>
              <ul className="space-y-2 text-sm text-muted">
                {draftDetails.teamLocked.map((member) => (
                  <Surface
                    key={member.name}
                    as="li"
                    variant="panel"
                    radius="xl"
                    shadow="control"
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <span className="font-semibold text-text">
                      {member.name}
                    </span>
                    <span className="text-xs text-muted">{member.role}</span>
                  </Surface>
                ))}
              </ul>
            </Surface>
            <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
              <p className="text-sm font-semibold">Open slots (positions)</p>
              <ul className="space-y-2 text-sm text-muted">
                {draftDetails.openSlotNeeds.map((slot) => (
                  <Surface
                    key={slot.title}
                    as="li"
                    variant="panel"
                    radius="xl"
                    shadow="control"
                    className="px-3 py-2"
                  >
                    <p className="font-semibold text-text">{slot.title}</p>
                    <p className="text-xs text-muted">{slot.desc}</p>
                  </Surface>
                ))}
              </ul>
            </Surface>
          </div>

          <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
            <p className="text-sm font-semibold">Milestones</p>
            <ul className="space-y-2 text-sm text-muted">
              {draftDetails.milestonesDetail.map((ms) => (
                <Surface
                  key={ms.title}
                  as="li"
                  variant="panel"
                  radius="xl"
                  shadow="control"
                  className="px-3 py-2"
                >
                  <p className="font-semibold text-text">{ms.title}</p>
                  <p className="text-xs text-muted">{ms.desc}</p>
                </Surface>
              ))}
            </ul>
          </Surface>

          <AttachmentList
            items={draftDetails.attachments.map((file) => ({
              id: file.title,
              title: file.title,
              href: file.href,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalDraft;
