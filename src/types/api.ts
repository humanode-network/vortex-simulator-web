// API DTO types for the off-chain Vortex simulation backend.
// These are JSON-safe (no ReactNode), and are frozen by docs/simulation/vortex-simulation-api-contract.md.

import type { FeedStage } from "./stages";

export type ProposalStageDto =
  | "pool"
  | "vote"
  | "citizen_veto"
  | "chamber_veto"
  | "build"
  | "passed"
  | "failed";
export type FeedStageDto = FeedStage;
export type ProposalResolutionKindDto =
  | "ordinary_failed_pool"
  | "ordinary_failed_vote"
  | "citizen_veto_remand"
  | "chamber_veto_remand"
  | "chamber_veto_void"
  | "formation_completed"
  | "formation_canceled";

export type ToneDto = "ok" | "warn";

export type ChamberPipelineDto = { pool: number; vote: number; build: number };
export type ChamberMetaDto = {
  id: string;
  title: string;
  status: "active" | "dissolved";
  multiplier: number;
  createdAt: string;
  dissolvedAt: string | null;
  createdByProposalId: string | null;
  dissolvedByProposalId: string | null;
};
export type ChamberStatsDto = {
  governors: string;
  acm: string;
  mcm: string;
  lcm: string;
};
export type CmTotalsDto = {
  lcm: number;
  mcm: number;
  acm: number;
};
export type CmHistoryItemDto = {
  proposalId: string;
  title: string;
  chamberId: string;
  avgScore: number | null;
  lcm: number;
  mcm: number;
  multiplier: number;
  awardedAt: string;
};
export type CmChamberBreakdownDto = {
  chamberId: string;
  chamberTitle: string;
  multiplier: number;
  lcm: number;
  mcm: number;
  acm: number;
};
export type ChamberDto = {
  id: string;
  name: string;
  multiplier: number;
  stats: ChamberStatsDto;
  pipeline: ChamberPipelineDto;
};
export type GetChambersResponse = { items: ChamberDto[] };

export type FactionRosterTagDto =
  | { kind: "acm"; value: number }
  | { kind: "mm"; value: number }
  | { kind: "text"; value: string };
export type FactionRosterMemberDto = {
  humanNodeId: string;
  role: string;
  tag: FactionRosterTagDto;
};
export type FactionDto = {
  id: string;
  name: string;
  description: string;
  visibility: "public" | "private";
  members: number;
  acm: string;
  focus: string;
  goals: string[];
  tags: string[];
  initiatives: string[];
  roster: FactionRosterMemberDto[];
  channels?: Array<{
    id: string;
    slug: string;
    title: string;
    writeScope: "stewards" | "members";
    isLocked: boolean;
    threadCount: number;
  }>;
  threads?: Array<{
    id: string;
    channelId: string;
    channelTitle: string;
    title: string;
    body: string;
    status: "open" | "resolved" | "locked";
    authorAddress: string;
    replies: number;
    createdAt: string;
    updatedAt: string;
    messages?: Array<{
      id: string;
      authorAddress: string;
      body: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
  initiativesDetailed?: Array<{
    id: string;
    title: string;
    intent: string;
    ownerAddress: string;
    status: "draft" | "active" | "blocked" | "done" | "archived";
    checklist: string[];
    links: string[];
    updatedAt: string;
  }>;
  memberships?: Array<{
    address: string;
    role: "founder" | "steward" | "member";
    isActive: boolean;
    joinedAt: string;
  }>;
  cofounderInvitations?: Array<{
    address: string;
    invitedBy: string;
    status: "pending" | "accepted" | "declined" | "canceled";
    invitedAt: string;
    respondedAt: string | null;
  }>;
  joinRequests?: Array<{
    address: string;
    status: "pending" | "accepted" | "declined" | "canceled";
    requestedAt: string;
    respondedAt: string | null;
    respondedBy: string | null;
  }>;
  viewerJoinRequest?: {
    address: string;
    status: "pending" | "accepted" | "declined" | "canceled";
    requestedAt: string;
    respondedAt: string | null;
    respondedBy: string | null;
  } | null;
};
export type GetFactionsResponse = {
  items: FactionDto[];
  totals?: {
    totalFactions: number;
    totalMemberships: number;
    uniqueMembers: number;
    totalAcm: number;
  };
};

export type ChamberProposalStageDto = "upcoming" | "live" | "ended";
export type ChamberProposalDto = {
  id: string;
  title: string;
  meta: string;
  summary: string;
  lead: string;
  nextStep: string;
  timing: string;
  stage: ChamberProposalStageDto;
  href?: string;
  activeGovernors?: number;
};
export type ChamberGovernorDto = {
  id: string;
  name: string;
  tier: string;
  focus: string;
  acm: number;
  lcm: number;
  mcm: number;
  delegatedWeight: number;
  effectiveVotingPower: number;
  delegateeAddress: string | null;
  inboundDelegators: string[];
};
export type ChamberThreadDto = {
  id: string;
  title: string;
  author: string;
  replies: number;
  updated: string;
};
export type ChamberThreadMessageDto = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};
export type ChamberThreadDetailDto = {
  thread: {
    id: string;
    title: string;
    author: string;
    body: string;
    createdAt: string;
    updatedAt: string;
  };
  messages: ChamberThreadMessageDto[];
};

export type ProposalThreadCategoryDto =
  | "question"
  | "concern"
  | "amendment"
  | "support"
  | "execution"
  | "general";
export type ProposalThreadStatusDto = "open" | "resolved" | "locked";
export type ProposalThreadPermissionsDto = {
  canReply: boolean;
  canTransition: boolean;
  canDelete: boolean;
};
export type ProposalThreadDto = {
  id: string;
  proposalId: string;
  decisionRootProposalId: string;
  category: ProposalThreadCategoryDto;
  status: ProposalThreadStatusDto;
  title: string;
  body: string;
  authorAddress: string;
  replies: number;
  createdAt: string;
  updatedAt: string;
  permissions: ProposalThreadPermissionsDto;
};
export type ProposalThreadMessageDto = {
  id: string;
  proposalId: string;
  threadId: string;
  authorAddress: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  permissions: {
    canDelete: boolean;
  };
};
export type ProposalThreadListDto = {
  proposalId: string;
  permissions: {
    canCreate: boolean;
  };
  items: ProposalThreadDto[];
};
export type ProposalThreadDetailDto = {
  proposalId: string;
  thread: ProposalThreadDto;
  messages: ProposalThreadMessageDto[];
};
export type ChamberChatMessageDto = {
  id: string;
  author: string;
  message: string;
};
export type ChamberChatSignalDto = {
  id: string;
  chamberId: string;
  fromPeerId: string;
  toPeerId: string | null;
  kind: "offer" | "answer" | "candidate";
  payload: Record<string, unknown>;
  createdAt: string;
};
export type ChamberChatPeerDto = {
  peerId: string;
  lastSeenAt: string;
};
export type ChamberStageOptionDto = {
  value: ChamberProposalStageDto;
  label: string;
};
export type GetChamberResponse = {
  chamber: ChamberMetaDto;
  pipeline: ChamberPipelineDto;
  proposals: ChamberProposalDto[];
  governors: ChamberGovernorDto[];
  threads: ChamberThreadDto[];
  chatLog: ChamberChatMessageDto[];
  stageOptions: ChamberStageOptionDto[];
};

export type CmSummaryDto = {
  address: string;
  totals: CmTotalsDto;
  chambers: CmChamberBreakdownDto[];
  history: CmHistoryItemDto[];
};

export type ChamberCmDto = {
  chamberId: string;
  title: string;
  multiplier: number;
  avgMultiplier: number | null;
  totals: CmTotalsDto;
  topContributors: Array<{
    address: string;
    lcm: number;
    mcm: number;
    acm: number;
  }>;
  submissions: Array<{
    address: string;
    multiplier: number;
    submittedAt: string;
  }>;
  history: CmHistoryItemDto[];
};

export type FormationMetricDto = {
  label: string;
  value: string;
  dataAttr: string;
};
export type FormationCategoryDto =
  | "all"
  | "research"
  | "development"
  | "social";
export type FormationStageDto = "live" | "gathering" | "completed";
export type FormationProjectDto = {
  id: string;
  title: string;
  focus: string;
  proposer: string;
  summary: string;
  category: FormationCategoryDto;
  stage: FormationStageDto;
  budget: string;
  milestones: string;
  teamSlots: string;
};
export type GetFormationResponse = {
  metrics: FormationMetricDto[];
  projects: FormationProjectDto[];
};

export type InvisionGovernanceMetricDto = { label: string; value: string };
export type InvisionGovernanceStateDto = {
  label: string;
  metrics: InvisionGovernanceMetricDto[];
};
export type InvisionStabilityComponentDto = {
  label: string;
  score: number;
  detail: string;
  tone: "positive" | "watch" | "critical";
};
export type InvisionStabilityDto = {
  score: number;
  band: "Stable" | "Watch" | "Unstable";
  confidence: number;
  confidenceBand: "Low" | "Medium" | "High";
  windowLabel: string;
  capsApplied: string[];
  components: InvisionStabilityComponentDto[];
};
export type InvisionDecentralizationComponentDto =
  InvisionStabilityComponentDto;
export type InvisionDecentralizationDto = {
  score: number;
  band: "Broad" | "Mixed" | "Concentrated";
  confidence: number;
  confidenceBand: "Low" | "Medium" | "High";
  windowLabel: string;
  capsApplied: string[];
  components: InvisionDecentralizationComponentDto[];
};
export type InvisionEconomicIndicatorDto = {
  label: string;
  value: string;
  detail: string;
};
export type InvisionRiskSignalDto = {
  title: string;
  status: string;
  detail: string;
};
export type InvisionChamberProposalDto = {
  title: string;
  effect: string;
  sponsors: string;
};
export type GetInvisionResponse = {
  governanceState: InvisionGovernanceStateDto;
  decentralization: InvisionDecentralizationDto;
  stability: InvisionStabilityDto;
  economicIndicators: InvisionEconomicIndicatorDto[];
  riskSignals: InvisionRiskSignalDto[];
  chamberProposals: InvisionChamberProposalDto[];
};

export type MyGovernanceEraActionDto = {
  label: string;
  done: number;
  required: number;
};
export type MyGovernanceEraActivityDto = {
  era: string;
  required: number;
  completed: number;
  actions: MyGovernanceEraActionDto[];
  timeLeft: string;
};
export type TierProgressDto = {
  tier: string;
  nextTier: string | null;
  metrics: {
    governorEras: number;
    activeEras: number;
    acceptedProposals: number;
    formationParticipation: number;
  };
  requirements: {
    governorEras?: number;
    activeEras?: number;
    acceptedProposals?: number;
    formationParticipation?: number;
  } | null;
};
export type DelegationGovernanceItemDto = {
  chamberId: string;
  delegateeAddress: string | null;
  inboundWeight: number;
};
export type GetMyGovernanceResponse = {
  eraActivity: MyGovernanceEraActivityDto;
  myChamberIds: string[];
  delegation: {
    chambers: DelegationGovernanceItemDto[];
  };
  legitimacy: {
    percent: number;
    objecting: boolean;
    objectingHumanNodes: number;
    eligibleHumanNodes: number;
    referendumTriggered: boolean;
    triggerThresholdPercent: number;
  };
  tier?: TierProgressDto;
  rollup?: {
    era: number;
    rolledAt: string;
    status: "Ahead" | "Stable" | "Falling behind" | "At risk" | "Losing status";
    requiredTotal: number;
    completedTotal: number;
    isActiveNextEra: boolean;
    activeGovernorsNextEra: number;
  };
};

export type GetClockResponse = {
  currentEra: number;
  updatedAt: string;
  eraSeconds: number;
  nextEraAt: string;
  activeGovernors: number;
  activeGovernorSource?: "prior_rollup" | "snapshot" | "fallback";
  activeGovernorSourceEra?: number | null;
};

export type ProposalStageDatumDto = {
  title: string;
  description: string;
  value: string;
  tone?: ToneDto;
};
export type ProposalStatDto = { label: string; value: string };
export type ProposalListItemDto = {
  id: string;
  title: string;
  meta: string;
  stage: ProposalStageDto;
  summaryPill: string;
  summary: string;
  stageData: ProposalStageDatumDto[];
  stats: ProposalStatDto[];
  proposer: string;
  proposerId: string;
  chamber: string;
  tier: "Nominee" | "Ecclesiast" | "Legate" | "Consul" | "Citizen";
  proofFocus: "pot" | "pod" | "pog";
  tags: string[];
  keywords: string[];
  date: string;
  votes: number;
  activityScore: number;
  href?: string;
  ctaPrimary: string;
  ctaSecondary: string;
};
export type GetProposalsResponse = { items: ProposalListItemDto[] };

export type ProposalTimelineEventTypeDto = string;

export type ProposalTimelineItemDto = {
  id: string;
  type: ProposalTimelineEventTypeDto;
  title: string;
  detail?: string;
  actor?: string;
  timestamp: string;
  snapshot?: {
    fromStage: "pool" | "vote" | "citizen_veto" | "chamber_veto" | "build";
    toStage:
      | "vote"
      | "citizen_veto"
      | "chamber_veto"
      | "build"
      | "passed"
      | "failed";
    reason?: string;
    milestoneIndex?: number | null;
    metrics: Array<{ label: string; value: string }>;
  };
};

export type GetProposalTimelineResponse = { items: ProposalTimelineItemDto[] };

export type ProposalStatusDto = {
  proposalId: string;
  canonicalStage: ProposalStageDto;
  canonicalRoute: string;
  redirectReason?: string;
  formationProjectState?:
    | "active"
    | "awaiting_milestone_vote"
    | "canceled"
    | "ready_to_finish"
    | "completed";
  pendingMilestoneIndex?: number | null;
  updatedAt: string;
};

export type ProposalDraftListItemDto = {
  id: string;
  title: string;
  chamber: string;
  tier: string;
  summary: string;
  updated: string;
};
export type GetProposalDraftsResponse = { items: ProposalDraftListItemDto[] };

export type ProposalDraftEditableFormDto = {
  templateId?: "project" | "system";
  presetId?: string;
  resubmitsProposalId?: string;
  formationEligible?: boolean;
  title: string;
  chamberId: string;
  summary: string;
  what: string;
  why: string;
  how: string;
  proposalType?:
    | "basic"
    | "fee"
    | "monetary"
    | "core"
    | "administrative"
    | "dao-core";
  metaGovernance?: {
    action:
      | "chamber.create"
      | "chamber.rename"
      | "chamber.dissolve"
      | "chamber.censure"
      | "governor.censure";
    chamberId?: string;
    targetAddress?: string;
    title?: string;
    multiplier?: number;
    genesisMembers?: string[];
  };
  timeline: {
    id: string;
    title: string;
    timeframe: string;
    budgetHmnd?: string;
  }[];
  outputs: { id: string; label: string; url: string }[];
  openSlotNeeds: { id: string; title: string; desc: string }[];
  budgetItems: { id: string; description: string; amount: string }[];
  aboutMe: string;
  attachments: { id: string; label: string; url: string }[];
  agreeRules: boolean;
  confirmBudget: boolean;
};

export type ProposalDraftDetailDto = {
  id?: string;
  submittedAt?: string | null;
  submittedProposalId?: string | null;
  title: string;
  proposer: string;
  chamber: string;
  focus: string;
  tier: string;
  budget: string;
  formationEligible: boolean;
  teamSlots: string;
  milestonesPlanned: string;
  summary: string;
  rationale: string;
  budgetScope: string;
  checklist: string[];
  milestones: string[];
  teamLocked: { name: string; role: string }[];
  openSlotNeeds: { title: string; desc: string }[];
  milestonesDetail: { title: string; desc: string }[];
  attachments: { title: string; href?: string }[];
  editableForm?: ProposalDraftEditableFormDto;
};

export type PoolProposalPageDto = {
  title: string;
  proposer: string;
  proposerId: string;
  chamber: string;
  focus: string;
  tier: string;
  budget: string;
  cooldown: string;
  formationEligible: boolean;
  timeLeft: string;
  teamSlots: string;
  milestones: string;
  upvotes: number;
  downvotes: number;
  attentionQuorum: number;
  activeGovernors: number;
  upvoteFloor: number;
  rules: string[];
  attachments: { id: string; title: string; href?: string }[];
  teamLocked: { name: string; role: string }[];
  openSlotNeeds: { title: string; desc: string }[];
  milestonesDetail: { title: string; desc: string }[];
  summary: string;
  overview: string;
  executionPlan: string[];
  budgetScope: string;
  thresholdContext?: {
    activityThreshold: {
      categories: string[];
      qualificationEra: number | null;
      activationEra: number | null;
    };
    quorumThreshold: {
      stage: "pool";
      denominator: number;
      source: "snapshot" | "fallback";
      snapshotEra: number | null;
      snapshotCapturedAt: string | null;
      attentionQuorumFraction: number;
      upvoteFloorFraction: number;
    };
  };
};

export type ChamberProposalPageDto = {
  title: string;
  proposer: string;
  proposerId: string;
  chamber: string;
  voteKind: "chamber" | "milestone" | "referendum";
  voterLabel: "Governors" | "Human nodes";
  scoreLabel: "CM" | "MM" | null;
  scoreEnabled: boolean;
  milestoneIndex: number | null;
  budget: string;
  formationEligible: boolean;
  teamSlots: string;
  milestones: string;
  timeLeft: string;
  timeContextLabel: string;
  ordinaryVoteClosed: boolean;
  votePassedAt: string | null;
  voteFinalizesAt: string | null;
  votes: { yes: number; no: number; abstain: number };
  attentionQuorum: number;
  quorumNeeded: number;
  passingRule: string;
  engagedGovernors: number;
  activeGovernors: number;
  engagedVoters: number;
  eligibleVoters: number;
  attachments: { id: string; title: string; href?: string }[];
  teamLocked: { name: string; role: string }[];
  openSlotNeeds: { title: string; desc: string }[];
  milestonesDetail: { title: string; desc: string }[];
  summary: string;
  overview: string;
  executionPlan: string[];
  budgetScope: string;
  viewerVote: null | {
    choice: "yes" | "no" | "abstain";
    score: number | null;
    updatedAt: string;
  };
  delegation: null | {
    source: "snapshot" | "live";
    snapshotCapturedAt: string | null;
    activeDelegations: number;
    activeDelegatees: number;
    viewer: null | {
      address: string;
      delegateeAddress: string | null;
      inboundDelegatedWeight: number;
      effectiveVotingWeight: number;
      hasDirectVote: boolean;
      directVoteOverrideApplies: boolean;
    };
  };
  citizenVeto: {
    available: boolean;
    attemptsUsed: number;
    attemptsRemaining: number;
    eligibleCitizens: number;
    quorumNeeded: number;
    vetoNeeded: number;
    votes: { veto: number; keep: number };
    viewer: {
      eligible: boolean;
      currentVote: "veto" | "keep" | null;
    };
  };
  chamberVeto: {
    activeChambers: number;
    chamberThreshold: number;
    vetoingChambers: number;
    chambers: Array<{
      chamberId: string;
      chamberTitle: string;
      eligibleVoters: number;
      quorumNeeded: number;
      votes: { veto: number; keep: number; abstain: number };
      countsAsVetoing: boolean;
      delegation: {
        source: "snapshot" | "live";
        snapshotCapturedAt: string | null;
      };
      viewer: {
        eligible: boolean;
        currentVote: "veto" | "keep" | "abstain" | null;
      };
    }>;
  };
  thresholdContext?: {
    activityThreshold: {
      categories: string[];
      qualificationEra: number | null;
      activationEra: number | null;
    };
    quorumThreshold: {
      stage: "vote";
      denominator: number;
      source: "snapshot" | "fallback";
      snapshotEra: number | null;
      snapshotCapturedAt: string | null;
      quorumFraction: number;
      passingFraction: number;
    };
  };
};

export type CitizenVetoProposalPageDto = {
  title: string;
  proposer: string;
  proposerId: string;
  chamber: string;
  voteRoute: string;
  budget: string;
  timeLeft: string;
  formationEligible: boolean;
  summary: string;
  overview: string;
  executionPlan: string[];
  budgetScope: string;
  attachments: { id: string; title: string; href?: string }[];
  stageData: ProposalStageDatumDto[];
  stats: { label: string; value: string }[];
  attemptsUsed: number;
  attemptsRemaining: number;
  eligibleCitizens: number;
  quorumNeeded: number;
  vetoNeeded: number;
  votes: { veto: number; keep: number };
  viewer: {
    eligible: boolean;
    currentVote: "veto" | "keep" | null;
  };
};

export type ChamberVetoProposalPageDto = {
  title: string;
  proposer: string;
  proposerId: string;
  chamber: string;
  voteRoute: string;
  budget: string;
  timeLeft: string;
  formationEligible: boolean;
  summary: string;
  overview: string;
  executionPlan: string[];
  budgetScope: string;
  attachments: { id: string; title: string; href?: string }[];
  stageData: ProposalStageDatumDto[];
  stats: { label: string; value: string }[];
  activeChambers: number;
  chamberThreshold: number;
  vetoingChambers: number;
  chambers: Array<{
    chamberId: string;
    chamberTitle: string;
    eligibleVoters: number;
    quorumNeeded: number;
    vetoNeeded: number;
    votes: { veto: number; keep: number; abstain: number };
    countsAsVetoing: boolean;
    delegation: {
      source: "snapshot" | "live";
      snapshotCapturedAt: string | null;
    };
    viewer: {
      eligible: boolean;
      currentVote: "veto" | "keep" | "abstain" | null;
    };
  }>;
};

export type FormationProposalPageDto = {
  title: string;
  chamber: string;
  proposer: string;
  proposerId: string;
  projectState?:
    | "active"
    | "awaiting_milestone_vote"
    | "canceled"
    | "ready_to_finish"
    | "completed";
  pendingMilestoneIndex?: number | null;
  nextMilestoneIndex?: number | null;
  budget: string;
  timeLeft: string;
  teamSlots: string;
  milestones: string;
  progress: string;
  stageData: { title: string; description: string; value: string }[];
  stats: { label: string; value: string }[];
  lockedTeam: { name: string; role: string }[];
  openSlots: { title: string; desc: string }[];
  milestonesDetail: { title: string; desc: string }[];
  attachments: { id: string; title: string; href?: string }[];
  summary: string;
  overview: string;
  executionPlan: string[];
  budgetScope: string;
};

export type ProposalFinishedPageDto = {
  title: string;
  chamber: string;
  proposer: string;
  proposerId: string;
  terminalStage: "passed" | "failed";
  resolutionKind: ProposalResolutionKindDto | null;
  terminalLabel: string;
  terminalSummary: string;
  decisionRootProposalId: string;
  canReconsider: boolean;
  reconsiderationDraftId: string | null;
  formationEligible: boolean;
  budget: string;
  timeLeft: string;
  stageData: { title: string; description: string; value: string }[];
  stats: { label: string; value: string }[];
  lockedTeam: { name: string; role: string }[];
  openSlots: { title: string; desc: string }[];
  milestonesDetail: { title: string; desc: string }[];
  attachments: { id: string; title: string; href?: string }[];
  summary: string;
  overview: string;
  executionPlan: string[];
  budgetScope: string;
};

export type CourtCaseStatusDto = "jury" | "live" | "ended";
export type CourtCaseDto = {
  id: string;
  title: string;
  subject: string;
  triggeredBy: string;
  status: CourtCaseStatusDto;
  reports: number;
  juryIds: string[];
  opened: string | null;
};
export type CourtCaseDetailDto = CourtCaseDto & {
  parties: { role: string; humanId: string; note?: string }[];
  proceedings: { claim: string; evidence: string[]; nextSteps: string[] };
};
export type GetCourtsResponse = { items: CourtCaseDto[] };

export type HumanTierDto =
  | "nominee"
  | "ecclesiast"
  | "legate"
  | "consul"
  | "citizen";
export type HumanNodeDto = {
  id: string;
  name: string;
  role: string;
  chamber: string;
  factionId: string;
  tier: HumanTierDto;
  acm: number;
  mm: number;
  memberSince: string;
  formationCapable?: boolean;
  active: {
    governorActive: boolean;
    humanNodeActive: boolean;
  };
  formationProjectIds?: string[];
  tags: string[];
  cmTotals?: CmTotalsDto;
  tierProgress?: TierProgressDto;
};
export type GetHumansResponse = { items: HumanNodeDto[] };

export type ProofKeyDto = "time" | "devotion" | "governance";
export type ProofSectionDto = {
  title: string;
  items: { label: string; value: string }[];
};
export type HeroStatDto = { label: string; value: string };
export type QuickDetailDto = { label: string; value: string };
export type GovernanceActionDto = {
  title: string;
  action: string;
  context: string;
  detail: string;
  href?: string | null;
  timestamp: string;
};
export type HistoryItemDto = {
  title: string;
  action: string;
  context: string;
  detail: string;
  date: string;
  href?: string | null;
};
export type ProjectCardDto = {
  title: string;
  status: string;
  summary: string;
  chips: string[];
};
export type HumanDelegationChamberDto = {
  chamberId: string;
  delegateeAddress: string | null;
  inboundWeight: number;
  inboundDelegators: string[];
};
export type HumanNodeProfileDto = {
  id: string;
  name: string;
  governorActive: boolean;
  humanNodeActive: boolean;
  governanceSummary: string;
  heroStats: HeroStatDto[];
  quickDetails: QuickDetailDto[];
  proofSections: Record<ProofKeyDto, ProofSectionDto>;
  governanceActions: GovernanceActionDto[];
  delegation: {
    chambers: HumanDelegationChamberDto[];
  };
  delegationEligibleChambers: string[];
  projects: ProjectCardDto[];
  activity: HistoryItemDto[];
  history: string[];
  cmHistory?: CmHistoryItemDto[];
  cmChambers?: CmChamberBreakdownDto[];
  tierProgress?: TierProgressDto;
};

export type FeedStageDatumDto = {
  title: string;
  description: string;
  value: string;
  tone?: ToneDto;
};
export type FeedStatDto = { label: string; value: string };
export type FeedItemDto = {
  id: string;
  title: string;
  meta: string;
  stage: FeedStageDto;
  summaryPill: string;
  summary: string;
  actionable?: boolean;
  stageData?: FeedStageDatumDto[];
  stats?: FeedStatDto[];
  proposer?: string;
  proposerId?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  href?: string;
  timestamp: string;
};
export type GetFeedResponse = { items: FeedItemDto[]; nextCursor?: string };
