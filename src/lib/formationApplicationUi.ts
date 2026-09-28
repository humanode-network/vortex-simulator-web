import { getApiErrorPayload } from "./api/http";
import { formatLoadError } from "./errorFormatting";

const messages: Record<string, string> = {
  formation_membership_stale:
    "This membership changed. Refresh the team before trying again.",
  formation_role_unavailable:
    "Choose an open project role. This role may already have been filled; refresh to check.",
  formation_unavailable: "This project is not currently recruiting.",
  formation_recruitment_paused:
    "Recruitment is paused during suspension or milestone voting. The application remains pending.",
  formation_recruitment_closed: "This project has closed recruitment.",
  formation_team_full:
    "The team is full. Pending applications can still be declined or withdrawn.",
  formation_proposer_already_in_team:
    "The proposer is already part of this team.",
  formation_already_member: "This Human Node is already a team member.",
  formation_applicant_ineligible:
    "The applicant must be an active Human Node before joining. The application remains pending.",
  formation_applicant_restricted:
    "The applicant is currently restricted from joining this project.",
  formation_eligibility_unavailable:
    "Eligibility could not be verified. No decision was saved; please retry.",
  formation_application_not_found:
    "This application is unavailable to the connected wallet.",
  formation_application_forbidden:
    "The connected wallet cannot perform this action.",
  formation_application_stale:
    "This application changed. Refresh before deciding.",
  formation_application_resolved:
    "This application has already been resolved. Refresh to see the outcome.",
  formation_action_quota_exceeded:
    "The applicant has reached this era's Formation activity limit. The application remains pending.",
};

export function formationApplicationBlockMessage(code: string): string {
  return (
    messages[code] ??
    "Recruitment is unavailable. Refresh to check the project."
  );
}

export function formationApplicationError(error: unknown): string {
  const code = getApiErrorPayload(error)?.error?.code;
  return (
    (code && messages[code]) ||
    formatLoadError(
      error instanceof Error
        ? error.message
        : "Could not update the application.",
    )
  );
}
