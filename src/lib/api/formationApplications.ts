import { apiGet } from "./http";
import { apiCommand } from "./command";

export type FormationApplication = {
  id: string;
  proposalId: string;
  applicantAddress: string;
  role: string | null;
  statement: string;
  status: "pending" | "accepted" | "declined" | "withdrawn" | "closed";
  revision: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedByAddress: string | null;
  resolutionReason: string | null;
};
export type FormationApplicationRow = {
  application: FormationApplication;
  proposalTitle: string;
  recruitmentBlock?: string | null;
};
export type FormationApplicationPage = {
  items: FormationApplicationRow[];
  nextCursor: string | null;
  pendingCount: number;
  limits: {
    statementMin: number;
    statementMax: number;
    reasonMax: number;
  };
};
export function apiFormationApplications(input: {
  proposalId?: string;
  scope?: "visible" | "review";
  status?: FormationApplication["status"];
  cursor?: string;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(input))
    if (value) query.set(key, value);
  return apiGet<FormationApplicationPage>(
    `/api/formation/applications?${query}`,
  );
}
export function apiFormationApplication(id: string) {
  return apiGet<FormationApplicationRow & { proposerAddress: string }>(
    `/api/formation/applications/${encodeURIComponent(id)}`,
  );
}
type ApplicationCommand =
  | {
      type: "formation.application.submit";
      payload: { proposalId: string; statement: string; role?: string };
    }
  | {
      type: "formation.application.review";
      payload: {
        applicationId: string;
        expectedRevision: number;
        decision: "accept" | "decline";
        reason?: string;
      };
    }
  | {
      type: "formation.application.withdraw";
      payload: { applicationId: string; expectedRevision: number };
    };
export function apiFormationApplicationCommand(
  command: ApplicationCommand,
  idempotencyKey: string,
) {
  return apiCommand<{ ok: true; application: FormationApplication }>({
    ...command,
    idempotencyKey,
  });
}
export type { ApplicationCommand };

export type FormationTeamMember = {
  membershipId: string;
  address: string;
  role: string | null;
  joinedAt: string;
  canLeave: boolean;
  canRemove: boolean;
};
export function apiFormationTeam(proposalId: string) {
  return apiGet<{ isProposer: boolean; members: FormationTeamMember[] }>(
    `/api/formation/applications/team/${encodeURIComponent(proposalId)}`,
  );
}
export function apiFormationTeamDeparture(
  input: {
    proposalId: string;
    membershipId: string;
    memberAddress: string;
    action: "leave" | "remove";
  },
  idempotencyKey: string,
) {
  return apiCommand<{
    ok: true;
    membershipId: string;
    status: "left" | "removed";
  }>({
    type:
      input.action === "leave"
        ? "formation.team.leave"
        : "formation.team.remove",
    payload: {
      proposalId: input.proposalId,
      membershipId: input.membershipId,
      ...(input.action === "remove"
        ? { memberAddress: input.memberAddress }
        : {}),
    },
    idempotencyKey,
  });
}
