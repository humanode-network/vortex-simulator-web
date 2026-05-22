import { useCallback, useEffect, useState } from "react";
import type { NavigateFunction } from "react-router";
import { useLocation, useNavigate } from "react-router";

import { apiProposalStatus } from "@/lib/apiClient";
import type { ProposalStatusDto } from "@/types/api";

const PROPOSAL_STAGE_SYNC_INTERVAL_MS = 7000;
const STAGE_NOTICE_STORAGE_KEY = "vortex:proposal-stage-transition-notice";

type ProposalStageTransitionNotice = {
  route: string;
  message: string;
};

type SyncToCanonicalStageInput = {
  proposalId: string;
  currentPath: string;
  currentSearch?: string;
  navigate: NavigateFunction;
  enforceVisibility?: boolean;
};

export function shouldNavigateToCanonicalRoute(
  currentPath: string,
  status: Pick<ProposalStatusDto, "canonicalRoute">,
): boolean {
  return Boolean(
    status.canonicalRoute && status.canonicalRoute !== currentPath,
  );
}

function isEmbeddedVetoRouteOverride(
  currentPath: string,
  status: Pick<ProposalStatusDto, "canonicalStage">,
): boolean {
  if (status.canonicalStage !== "vote") return false;
  return (
    currentPath.endsWith("/citizen-veto") ||
    currentPath.endsWith("/chamber-veto")
  );
}

function hasSnapshotRouteOverride(search?: string): boolean {
  if (!search) return false;
  const params = new URLSearchParams(search);
  const stage = params.get("snapshotStage");
  return (
    stage === "pool" ||
    stage === "vote" ||
    stage === "citizen_veto" ||
    stage === "chamber_veto" ||
    stage === "build"
  );
}

export function formatProposalStageTransitionMessage(
  status: Pick<
    ProposalStatusDto,
    "canonicalStage" | "redirectReason" | "pendingMilestoneIndex"
  >,
): string {
  if (status.redirectReason === "milestone_vote_open") {
    return typeof status.pendingMilestoneIndex === "number" &&
      status.pendingMilestoneIndex > 0
      ? `Milestone M${status.pendingMilestoneIndex} entered chamber vote.`
      : "Milestone entered chamber vote.";
  }
  if (status.redirectReason === "referendum_open") {
    return "Legitimacy referendum opened.";
  }
  if (status.redirectReason === "citizen_veto_opened") {
    return "Citizen veto opened.";
  }
  if (status.redirectReason === "chamber_veto_opened") {
    return "Chamber veto opened.";
  }
  if (status.redirectReason === "formation_completed") {
    return "Project finished and moved to Finished.";
  }
  if (status.redirectReason === "formation_canceled") {
    return "Project was canceled and moved to Finished.";
  }
  if (status.redirectReason === "veto_remanded") {
    return "Proposal was remanded for reconsideration.";
  }
  if (status.canonicalStage === "vote")
    return "Proposal moved to Chamber vote.";
  if (status.canonicalStage === "citizen_veto")
    return "Proposal moved to Citizen veto.";
  if (status.canonicalStage === "chamber_veto")
    return "Proposal moved to Chamber veto.";
  if (status.canonicalStage === "build") return "Proposal moved to Formation.";
  if (status.canonicalStage === "passed") return "Proposal moved to Passed.";
  if (status.canonicalStage === "failed") return "Proposal moved to Failed.";
  return "Proposal stage updated.";
}

function storeTransitionNotice(notice: ProposalStageTransitionNotice): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      STAGE_NOTICE_STORAGE_KEY,
      JSON.stringify(notice),
    );
  } catch {
    // noop
  }
}

function consumeTransitionNoticeForRoute(route: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STAGE_NOTICE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProposalStageTransitionNotice | null;
    window.sessionStorage.removeItem(STAGE_NOTICE_STORAGE_KEY);
    if (!parsed || parsed.route !== route || !parsed.message) return null;
    return parsed.message;
  } catch {
    return null;
  }
}

export function useProposalTransitionNotice(): string | null {
  const location = useLocation();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setNotice(consumeTransitionNoticeForRoute(location.pathname));
  }, [location.pathname]);

  return notice;
}

export async function syncToCanonicalProposalStage(
  input: SyncToCanonicalStageInput,
): Promise<boolean> {
  if (hasSnapshotRouteOverride(input.currentSearch)) return false;
  if (
    input.enforceVisibility &&
    typeof document !== "undefined" &&
    document.visibilityState !== "visible"
  ) {
    return false;
  }
  const status = await apiProposalStatus(input.proposalId);
  if (isEmbeddedVetoRouteOverride(input.currentPath, status)) return false;
  if (!shouldNavigateToCanonicalRoute(input.currentPath, status)) return false;
  storeTransitionNotice({
    route: status.canonicalRoute,
    message: formatProposalStageTransitionMessage(status),
  });
  input.navigate(status.canonicalRoute, { replace: true });
  return true;
}

export function useProposalStageSync(
  proposalId: string | undefined,
): () => Promise<boolean> {
  const location = useLocation();
  const navigate = useNavigate();

  const syncNow = useCallback(async (): Promise<boolean> => {
    if (!proposalId) return false;
    try {
      return await syncToCanonicalProposalStage({
        proposalId,
        currentPath: location.pathname,
        currentSearch: location.search,
        navigate,
        enforceVisibility: false,
      });
    } catch {
      return false;
    }
  }, [location.pathname, location.search, navigate, proposalId]);

  useEffect(() => {
    if (!proposalId) return;
    let active = true;

    const poll = async () => {
      if (!active) return;
      try {
        await syncToCanonicalProposalStage({
          proposalId,
          currentPath: location.pathname,
          currentSearch: location.search,
          navigate,
          enforceVisibility: true,
        });
      } catch {
        // Route-level loaders already surface user-facing errors.
      }
    };

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, PROPOSAL_STAGE_SYNC_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [location.pathname, location.search, navigate, proposalId]);

  return syncNow;
}
