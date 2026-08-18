export const COURT_ACTION_CAPABILITIES = [
  "accept_jury_seat",
  "challenge_evidence",
  "file_appeal",
  "file_reopening",
  "propose_appellate_modification",
  "recuse_jury_seat",
  "respond_appellate_invitation",
  "respond_reopening_invitation",
  "submit_evidence",
  "submit_response",
  "vote_appeal",
  "vote_finding",
  "vote_reopening",
  "vote_sentence",
] as const;

export type CourtActionCapability = (typeof COURT_ACTION_CAPABILITIES)[number];
