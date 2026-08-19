export const HUMANODE_CODEX_VERSION = "court-codex-v1";
export const HUMANODE_CODEX_JURY_SIZE = 12;
export const HUMANODE_CODEX_SENTENCE_AUTHORIZATION = 8;

export type HumanodeCodexSeverity = "L0" | "L1" | "L2" | "L3" | "L4";

export type HumanodeCodexEvidenceStandard = "E0" | "E1" | "E2" | "E3";

export type HumanodeCodexClause = {
  ref: string;
  title: string;
  summary: string;
  points: readonly string[];
};

export type HumanodeCodexMeasureKind =
  | "correction"
  | "protective"
  | "governance"
  | "disposition"
  | "public_record"
  | "external";

export type HumanodeCodexMeasureStatus =
  | "active"
  | "defined"
  | "protective_control"
  | "reserved";

export type HumanodeCodexMeasure = {
  code: string;
  ref: string;
  title: string;
  kind: HumanodeCodexMeasureKind;
  status: HumanodeCodexMeasureStatus;
  description: string;
};

export type HumanodeCodexOffense = {
  code: string;
  ref: string;
  title: string;
  domain: string;
  definition: string;
  allowedSeverities: readonly Exclude<HumanodeCodexSeverity, "L0">[];
  evidenceStandards: readonly string[];
  immediateMeasures: readonly string[];
  corrections: readonly string[];
  minimumDisposition: "D-01" | "D-02";
  mandatoryMeasures: readonly string[];
  requiredOneOf: readonly (readonly string[])[];
  allowedMeasures: readonly string[];
};

export type HumanodeCodexExcludedMeasure = {
  ref: string;
  title: string;
  status: "prohibited" | "rejected";
  reason: string;
};

export type HumanodeCodexEvidenceRule = {
  code: HumanodeCodexEvidenceStandard;
  ref: string;
  title: string;
  description: string;
};

export const humanodeCodexClauses: readonly HumanodeCodexClause[] = [
  {
    ref: "HC-1.1",
    title: "Authority and scope",
    summary:
      "The Codex defines reportable conduct, Court procedure, evidence standards, remedies, and sanctions inside Vortex authority.",
    points: [
      "Protocol code controls when human-readable text and executable behavior disagree.",
      "The Codex creates no authority over assets, identities, devices, validators, or people that Vortex cannot lawfully or technically control.",
      "Every executable consequence requires a named authority, versioned policy, audit record, expiry or finality rule, and reversal path.",
    ],
  },
  {
    ref: "HC-1.2",
    title: "Allegations and findings",
    summary:
      "A report records an allegation. Conduct becomes an offense only after a final Court finding under the applicable evidence standard.",
    points: [
      "A protective control is not evidence of guilt.",
      "Correctable user error, system failure, victim events, and good-faith disagreement are not offenses.",
      "The UI must not describe a respondent as an offender before a final substantiated finding.",
    ],
  },
  {
    ref: "HC-2.1",
    title: "Reporting lanes",
    summary:
      "Each report routes deterministically to correction, scoped moderation, Court reporting, or a safety and protocol incident lane.",
    points: [
      "The selected reason and canonical target determine the lane; free-form text cannot create jurisdiction.",
      "Correction and moderation remain separate from punitive adjudication.",
      "Continuing safety risks may receive narrow, expiring protection without predetermining a Court finding.",
    ],
  },
  {
    ref: "HC-2.2",
    title: "Standing and case triggers",
    summary:
      "Cases may open through verified direct standing, objective proof, a proportional community trigger, or an authorized emergency referral.",
    points: [
      "Community reports count unique eligible Human Nodes with lawful access to the target.",
      "Direct standing is offense-specific and does not make an allegation true.",
      "Reporter identities and incomplete trigger counts remain protected from public disclosure.",
    ],
  },
  {
    ref: "HC-2.3",
    title: "Evidence and burden",
    summary:
      "Evidence must retain provenance, integrity metadata, access class, and a challenge path appropriate to the alleged offense.",
    points: [
      "E1 supports low-impact findings, E2 supports material or serious findings, and E3 is required for critical findings.",
      "Technical proof can establish a narrow event without automatically establishing intent, responsibility, or severity.",
      "Sealed evidence remains auditable by authorized parties without becoming public by default.",
    ],
  },
  {
    ref: "HC-2.4",
    title: "Court and decision rule",
    summary:
      "A Court consists of twelve eligible Governors. Ordinary findings and sentence components require eight votes; critical findings and permanence require ten.",
    points: [
      "All twelve effective ballots are required before deterministic calculation.",
      "The jury decides the finding before it considers a sentence.",
      "A substantiated finding can remain without a punitive sentence when fewer than eight jurors authorize punishment.",
    ],
  },
  {
    ref: "HC-2.5",
    title: "Proportionality and finality",
    summary:
      "The least restrictive sufficient measure applies within the frozen offense and severity envelope.",
    points: [
      "A sentence cannot exceed its allowed components, scope, duration, burden, jurisdiction, or executor authority.",
      "Punitive remedies stay automatically during a valid appeal.",
      "Final decisions retain policy, calculation, appeal, enforcement, expiry, and reversal records.",
    ],
  },
] as const;

export const humanodeCodexSeverityRules = Object.freeze({
  L0: {
    ref: "HC-4.L0",
    title: "No violation or correctable event",
    evidence: "E0",
    duration: "No punitive duration",
    componentLimit: 0,
  },
  L1: {
    ref: "HC-4.L1",
    title: "Low impact",
    evidence: "E1",
    duration: "1-2 eras",
    componentLimit: 1,
  },
  L2: {
    ref: "HC-4.L2",
    title: "Material",
    evidence: "E2",
    duration: "2-6 eras",
    componentLimit: 2,
  },
  L3: {
    ref: "HC-4.L3",
    title: "Serious",
    evidence: "E2",
    duration: "6-18 eras",
    componentLimit: 3,
  },
  L4: {
    ref: "HC-4.L4",
    title: "Critical",
    evidence: "E3",
    duration: "18-36 eras",
    componentLimit: 3,
  },
} as const satisfies Record<HumanodeCodexSeverity, unknown>);

export const humanodeCodexEvidenceRules: Readonly<
  Record<HumanodeCodexEvidenceStandard, HumanodeCodexEvidenceRule>
> = Object.freeze({
  E0: {
    code: "E0",
    ref: "HC-4.E0",
    title: "Objective correction",
    description:
      "A canonical record or registered verifier proves invalid state; no misconduct finding is made.",
  },
  E1: {
    code: "E1",
    ref: "HC-4.E1",
    title: "Balance of reliable evidence",
    description:
      "Eight jurors find the material fact more likely than not from disclosed, provenance-bearing evidence.",
  },
  E2: {
    code: "E2",
    ref: "HC-4.E2",
    title: "Clear and convincing",
    description:
      "Eight jurors find the event, actor, required intent, and impact highly persuasive; serious intent cannot rest on report volume or reputation.",
  },
  E3: {
    code: "E3",
    ref: "HC-4.E3",
    title: "Verified critical fact plus clear attribution",
    description:
      "A registered technical proof or two independent reliable sources establishes the critical event, with separate clear evidence of attribution and required intent.",
  },
});

const measure = (
  code: string,
  title: string,
  kind: HumanodeCodexMeasureKind,
  status: HumanodeCodexMeasureStatus,
  description: string,
): HumanodeCodexMeasure => ({
  code,
  ref: `HC-5.${code}`,
  title,
  kind,
  status,
  description,
});

export const humanodeCodexMeasures: readonly HumanodeCodexMeasure[] = [
  measure(
    "C-01",
    "Reject, reroute, or require correction",
    "correction",
    "active",
    "Stops an invalid submission without creating a Court offense.",
  ),
  measure(
    "C-02",
    "Quarantine or remove abusive content",
    "correction",
    "active",
    "Removes harmful or flooding content while retaining an audit record.",
  ),
  measure(
    "C-03",
    "Correct or retract false data",
    "correction",
    "active",
    "Restores the authoritative record and links the correction to its provenance.",
  ),
  measure(
    "C-04",
    "Revoke invalid delegation",
    "correction",
    "active",
    "Ends an invalid delegation and records when it stopped applying.",
  ),
  measure(
    "C-05",
    "Restore authorized external context",
    "correction",
    "active",
    "Restores the consented proposal context while preserving tampering evidence.",
  ),
  measure(
    "C-06",
    "Rate or connection limit",
    "correction",
    "active",
    "Contains floods and connection exhaustion without treating volume alone as guilt.",
  ),
  measure(
    "C-07",
    "Invalidate or recalculate tainted governance effect",
    "correction",
    "active",
    "Repairs an affected vote, weight, rating, or result only where governing rules authorize deterministic correction.",
  ),
  measure(
    "P-01",
    "Bioauth deauthentication",
    "protective",
    "protective_control",
    "Ends the current authenticated state or requires reauthentication without erasing identity history.",
  ),
  measure(
    "P-02",
    "Account transaction lock",
    "protective",
    "protective_control",
    "Requests narrow temporary transaction containment through a separately registered protocol executor.",
  ),
  measure(
    "P-03",
    "Anti-fraud alert",
    "protective",
    "active",
    "Flags an account for defined operator review with provenance and appeal state.",
  ),
  measure(
    "P-04",
    "Validator restriction",
    "protective",
    "active",
    "Disables validator activity when technical evidence or immediate network safety requires it.",
  ),
  measure(
    "P-05",
    "Liquid validator-set demotion",
    "protective",
    "active",
    "Reduces validator position or eligibility under an explicit operational or sanction rule.",
  ),
  measure(
    "P-06",
    "Fee-distribution exclusion",
    "protective",
    "active",
    "Excludes an identity from fee distribution for a defined period and reason.",
  ),
  measure(
    "P-07",
    "CVM biometric blacklist",
    "protective",
    "active",
    "Blocks a confirmed malicious biometric identity from CVM use under E3 evidence and an appeal path.",
  ),
  measure(
    "G-01",
    "Tainted CM offset",
    "governance",
    "active",
    "Offsets only CM proven to arise from adjudicated conduct and preserves unrelated CM history.",
  ),
  measure(
    "G-02",
    "Tainted Governor-credit offset",
    "governance",
    "active",
    "Offsets only Governor credit proven to arise from adjudicated conduct and preserves PoT and unrelated activity.",
  ),
  measure(
    "G-03",
    "Proposal restriction in one chamber",
    "governance",
    "active",
    "Restricts proposal creation in one named chamber.",
  ),
  measure(
    "G-04",
    "Proposal restriction in all chambers",
    "governance",
    "active",
    "Restricts proposal creation throughout Vortex.",
  ),
  measure(
    "G-05",
    "Voting restriction in one chamber",
    "governance",
    "active",
    "Restricts voting in one named chamber.",
  ),
  measure(
    "G-06",
    "Voting restriction in all chambers",
    "governance",
    "active",
    "Restricts voting throughout Vortex.",
  ),
  measure(
    "G-07",
    "Rating restriction in one chamber",
    "governance",
    "defined",
    "Restricts upvoting and downvoting in one named chamber.",
  ),
  measure(
    "G-08",
    "Rating restriction in all chambers",
    "governance",
    "defined",
    "Restricts upvoting and downvoting throughout Vortex.",
  ),
  measure(
    "G-09",
    "Formation restriction in one project",
    "governance",
    "defined",
    "Restricts participation in one named Formation project.",
  ),
  measure(
    "G-10",
    "Formation restriction in all projects",
    "governance",
    "defined",
    "Restricts participation in every Formation project.",
  ),
  measure(
    "G-11",
    "Interaction restriction for one proposal",
    "governance",
    "active",
    "Restricts explicitly listed actions on one named proposal.",
  ),
  measure(
    "G-12",
    "Full governance restriction",
    "governance",
    "active",
    "Restricts voting, rating, proposal creation, delegation, and Formation work while leaving identity and ordinary transactions separate.",
  ),
  measure(
    "G-13",
    "Reduced voting power",
    "governance",
    "reserved",
    "Reserved and inactive because punitive voting multipliers conflict with one-Human-one-vote.",
  ),
  measure(
    "D-01",
    "Admonition",
    "disposition",
    "active",
    "Records a formal warning attached to a final substantiated finding.",
  ),
  measure(
    "D-02",
    "Censure",
    "disposition",
    "active",
    "Records a formal public condemnation; operational restrictions still require their own approved components.",
  ),
  measure(
    "D-03",
    "Restitution",
    "disposition",
    "active",
    "Restores proven loss within protocol jurisdiction and the adjudicated amount.",
  ),
  measure(
    "R-01",
    "Public offense record",
    "public_record",
    "active",
    "Publishes the final finding, evidence summary, sentence, expiry, and appeal state without treating allegations as offenses.",
  ),
  measure(
    "E-01",
    "Off-chain legal referral",
    "external",
    "active",
    "Refers conduct to competent authorities without claiming that Vortex issued an external legal verdict.",
  ),
  measure(
    "E-02",
    "Funds confiscation or protocol slashing",
    "external",
    "reserved",
    "Requires explicit protocol jurisdiction and a pre-existing rule, final decision, or competent legal order; arbitrary wallet seizure is forbidden.",
  ),
] as const;

export const humanodeCodexExcludedMeasures: readonly HumanodeCodexExcludedMeasure[] =
  [
    {
      ref: "HC-6.X-01",
      title: "Automatic kill contract",
      status: "prohibited",
      reason:
        "Extrajudicial violence and automated physical harm are outside Vortex authority.",
    },
    {
      ref: "HC-6.X-02",
      title: "Forced labor",
      status: "prohibited",
      reason:
        "Coerced labor is not a lawful governance sanction; remediation must be voluntary.",
    },
    {
      ref: "HC-6.X-03",
      title: "Wall of shame",
      status: "rejected",
      reason:
        "A factual, appeal-aware public offense record provides accountability without ritual humiliation.",
    },
    {
      ref: "HC-6.X-04",
      title: "Punitive disclosure of secret governance actions",
      status: "prohibited",
      reason:
        "Punitive disclosure destroys ballot secrecy and can enable coercion.",
    },
  ] as const;

const offense = (
  input: Omit<HumanodeCodexOffense, "ref" | "evidenceStandards">,
): HumanodeCodexOffense => ({
  ...input,
  ref: `HC-3.${input.code}`,
  evidenceStandards: Array.from(
    new Set(
      input.allowedSeverities.map(
        (level) => humanodeCodexSeverityRules[level].evidence,
      ),
    ),
  ),
});

export const humanodeCodexOffenses: readonly HumanodeCodexOffense[] = [
  offense({
    code: "SEC-01",
    title: "GRANDPA equivocation",
    domain: "Security",
    definition:
      "A validator signs conflicting GRANDPA votes for the same round or target context. Technical proof must distinguish equivocation from display or indexing error.",
    allowedSeverities: ["L1", "L2", "L3", "L4"],
    immediateMeasures: ["P-04"],
    corrections: [],
    minimumDisposition: "D-01",
    mandatoryMeasures: [],
    requiredOneOf: [["P-05", "P-06"]],
    allowedMeasures: ["D-01", "D-02", "P-04", "P-05", "P-06", "G-12", "R-01"],
  }),
  offense({
    code: "SEC-02",
    title: "BABE equivocation",
    domain: "Security",
    definition:
      "A validator authors conflicting BABE blocks for the same slot. Technical proof must be chain-verifiable.",
    allowedSeverities: ["L1", "L2", "L3", "L4"],
    immediateMeasures: ["P-04"],
    corrections: [],
    minimumDisposition: "D-01",
    mandatoryMeasures: [],
    requiredOneOf: [["P-05", "P-06"]],
    allowedMeasures: ["D-01", "D-02", "P-04", "P-05", "P-06", "G-12", "R-01"],
  }),
  offense({
    code: "OPS-01",
    title: "Validator liveness failure",
    domain: "Operational",
    definition:
      "A validator fails a required block-production or availability duty. Ordinary downtime is operational; deliberate or repeated evasion can become misconduct.",
    allowedSeverities: ["L1", "L2", "L3"],
    immediateMeasures: ["P-05", "P-06"],
    corrections: [],
    minimumDisposition: "D-01",
    mandatoryMeasures: [],
    requiredOneOf: [["P-05", "P-06"]],
    allowedMeasures: ["D-01", "D-02", "P-04", "P-05", "P-06", "R-01"],
  }),
  offense({
    code: "IDN-01",
    title: "Same biometrics under different keys",
    domain: "Identity integrity",
    definition:
      "A biometric identity appears across multiple keys. Enrollment error, recovery, compromise, and intentional duplicate identity require separate findings.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["P-01", "P-02"],
    corrections: [],
    minimumDisposition: "D-01",
    mandatoryMeasures: [],
    requiredOneOf: [],
    allowedMeasures: ["D-01", "D-02", "P-03", "P-07", "G-12", "R-01"],
  }),
  offense({
    code: "IDN-02",
    title: "Different biometrics under one key",
    domain: "Identity integrity",
    definition:
      "One key is presented with inconsistent biometric identities. Shared-device error, compromise, recovery failure, and deliberate substitution require separate findings.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["P-01", "P-02"],
    corrections: [],
    minimumDisposition: "D-01",
    mandatoryMeasures: [],
    requiredOneOf: [],
    allowedMeasures: ["D-01", "D-02", "P-03", "P-07", "G-12", "R-01"],
  }),
  offense({
    code: "SEC-03",
    title: "Network protocol attack",
    domain: "Security",
    definition:
      "Deliberate exploitation or disruption of network communication protocols. Malformed traffic and compatibility failures are not automatically offenses.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["C-06", "P-02"],
    corrections: ["C-06"],
    minimumDisposition: "D-01",
    mandatoryMeasures: [],
    requiredOneOf: [["P-02", "P-03"]],
    allowedMeasures: [
      "D-01",
      "D-02",
      "P-02",
      "P-03",
      "P-04",
      "P-06",
      "G-12",
      "R-01",
      "E-01",
    ],
  }),
  offense({
    code: "SEC-04",
    title: "Mempool flooding",
    domain: "Security",
    definition:
      "Deliberate transaction volume intended to exhaust mempool capacity or deny service, distinguished from legitimate demand spikes.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["C-06", "P-02"],
    corrections: ["C-06"],
    minimumDisposition: "D-01",
    mandatoryMeasures: ["P-02"],
    requiredOneOf: [],
    allowedMeasures: ["D-01", "D-02", "P-02", "P-03", "R-01", "E-01"],
  }),
  offense({
    code: "SEC-05",
    title: "RPC connection exhaustion",
    domain: "Security",
    definition:
      "Deliberate exhaustion of RPC connections or service capacity, distinguished from faulty clients and organic load.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["C-06"],
    corrections: ["C-06"],
    minimumDisposition: "D-01",
    mandatoryMeasures: ["P-02"],
    requiredOneOf: [],
    allowedMeasures: ["D-01", "D-02", "P-02", "P-03", "R-01", "E-01"],
  }),
  offense({
    code: "SEC-06",
    title: "Physical attack or credible threat",
    domain: "Security / external",
    definition:
      "Violence, attempted violence, or a credible threat against project members or Human Nodes. Immediate safety and competent authorities take priority.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["P-02", "G-12"],
    corrections: [],
    minimumDisposition: "D-02",
    mandatoryMeasures: [],
    requiredOneOf: [["P-02", "G-05", "G-11", "G-12"]],
    allowedMeasures: ["D-02", "P-02", "G-05", "G-11", "G-12", "R-01", "E-01"],
  }),
  offense({
    code: "SEC-07",
    title: "End-user device attack",
    domain: "Security",
    definition:
      "Deliberate compromise, malware, credential theft, or unauthorized control of a participant device. The compromised account holder may be a victim.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["P-01", "P-02", "P-03"],
    corrections: [],
    minimumDisposition: "D-01",
    mandatoryMeasures: [],
    requiredOneOf: [["P-03", "G-05", "G-11", "G-12"]],
    allowedMeasures: [
      "D-01",
      "D-02",
      "P-03",
      "G-05",
      "G-11",
      "G-12",
      "R-01",
      "E-01",
    ],
  }),
  offense({
    code: "SEC-08",
    title: "CVM attack",
    domain: "Security",
    definition:
      "A deliberate attack against CVM integrity, availability, confidentiality, biometric processing, or trusted execution.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["P-01", "P-02", "P-04", "P-03"],
    corrections: [],
    minimumDisposition: "D-02",
    mandatoryMeasures: [],
    requiredOneOf: [["P-06", "P-07", "G-12"]],
    allowedMeasures: ["D-02", "P-06", "P-07", "G-12", "R-01", "E-01"],
  }),
  offense({
    code: "SEC-09",
    title: "Abusive legal coercion",
    domain: "Security / external",
    definition:
      "Knowingly abusive legal action intended to threaten, silence, extort, or disrupt. Good-faith legal claims and lawful defense are protected.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: [],
    corrections: [],
    minimumDisposition: "D-01",
    mandatoryMeasures: [],
    requiredOneOf: [["G-05", "G-11"]],
    allowedMeasures: ["D-01", "D-02", "G-05", "G-11", "G-12", "R-01", "E-01"],
  }),
  offense({
    code: "OPS-02",
    title: "Financial attack",
    domain: "Operational / security",
    definition:
      "Theft, manipulation, fraudulent extraction, or deliberate economic disruption affecting Vortex. Ordinary loss or disagreement is insufficient.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["P-02", "P-03"],
    corrections: [],
    minimumDisposition: "D-01",
    mandatoryMeasures: [],
    requiredOneOf: [["P-02", "G-12"]],
    allowedMeasures: [
      "D-01",
      "D-02",
      "D-03",
      "P-02",
      "P-06",
      "G-12",
      "R-01",
      "E-01",
    ],
  }),
  offense({
    code: "GOV-01",
    title: "Vote buying or selling",
    domain: "Governance integrity",
    definition:
      "Offering, requesting, accepting, or transferring value in exchange for a governance choice.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["C-07"],
    corrections: ["C-07"],
    minimumDisposition: "D-01",
    mandatoryMeasures: ["G-05"],
    requiredOneOf: [],
    allowedMeasures: [
      "D-01",
      "D-02",
      "G-01",
      "G-02",
      "G-05",
      "G-06",
      "G-12",
      "R-01",
      "E-01",
    ],
  }),
  offense({
    code: "CMP-01",
    title: "Unauthorized proposal-tier use",
    domain: "Vortex compliance",
    definition:
      "Deliberate evasion or repeated abuse of proposal-tier requirements. Normal validation failure is corrected without punishment.",
    allowedSeverities: ["L1", "L2", "L3"],
    immediateMeasures: ["C-01"],
    corrections: ["C-01"],
    minimumDisposition: "D-01",
    mandatoryMeasures: ["G-03"],
    requiredOneOf: [],
    allowedMeasures: ["D-01", "D-02", "G-03", "G-04", "R-01"],
  }),
  offense({
    code: "CMP-02",
    title: "Deliberate chamber or theme misrouting",
    domain: "Vortex compliance",
    definition:
      "Knowingly misrouting a proposal to evade rules or burden reviewers. Good-faith classification mistakes are corrected without punishment.",
    allowedSeverities: ["L1", "L2", "L3"],
    immediateMeasures: ["C-01"],
    corrections: ["C-01"],
    minimumDisposition: "D-01",
    mandatoryMeasures: ["G-03"],
    requiredOneOf: [],
    allowedMeasures: ["D-01", "D-02", "G-03", "G-04", "R-01"],
  }),
  offense({
    code: "GOV-02",
    title: "Invalid vote delegation",
    domain: "Governance integrity",
    definition:
      "Creating, inducing, or exploiting delegation that violates eligibility, chamber, identity, conflict, or other delegation rules.",
    allowedSeverities: ["L1", "L2", "L3", "L4"],
    immediateMeasures: ["C-04", "C-07"],
    corrections: ["C-04", "C-07"],
    minimumDisposition: "D-01",
    mandatoryMeasures: [],
    requiredOneOf: [["G-05", "G-12"]],
    allowedMeasures: [
      "D-01",
      "D-02",
      "G-01",
      "G-02",
      "G-05",
      "G-06",
      "G-12",
      "R-01",
    ],
  }),
  offense({
    code: "GOV-03",
    title: "Voter coercion",
    domain: "Governance integrity / external",
    definition:
      "Threats, retaliation, blackmail, intimidation, or abuse of power intended to control another person's governance action.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["G-05", "G-11"],
    corrections: [],
    minimumDisposition: "D-02",
    mandatoryMeasures: [],
    requiredOneOf: [["G-05", "G-06"]],
    allowedMeasures: [
      "D-02",
      "G-01",
      "G-02",
      "G-05",
      "G-06",
      "G-12",
      "R-01",
      "E-01",
    ],
  }),
  offense({
    code: "CMP-03",
    title: "Abusive generated-content flooding",
    domain: "Vortex compliance",
    definition:
      "Repetitive, deceptive, irrelevant, or negligently unreviewed generated content that materially burdens governance. AI use alone is not an offense.",
    allowedSeverities: ["L1", "L2", "L3"],
    immediateMeasures: ["C-02", "C-06"],
    corrections: ["C-02", "C-06"],
    minimumDisposition: "D-01",
    mandatoryMeasures: ["G-03"],
    requiredOneOf: [],
    allowedMeasures: ["D-01", "D-02", "G-03", "G-04", "R-01"],
  }),
  offense({
    code: "GOV-04",
    title: "Malicious proposal spam",
    domain: "Governance integrity",
    definition:
      "Repeated or coordinated proposal creation intended to obstruct, manipulate, exhaust attention, or bypass rate and eligibility rules.",
    allowedSeverities: ["L1", "L2", "L3", "L4"],
    immediateMeasures: ["C-02", "C-06", "G-03"],
    corrections: [],
    minimumDisposition: "D-01",
    mandatoryMeasures: [],
    requiredOneOf: [["G-03", "G-04"]],
    allowedMeasures: [
      "D-01",
      "D-02",
      "G-01",
      "G-02",
      "G-03",
      "G-04",
      "G-12",
      "R-01",
    ],
  }),
  offense({
    code: "SEC-10",
    title: "Oracle manipulation",
    domain: "Security",
    definition:
      "Deliberately corrupting, falsifying, withholding, or strategically influencing authoritative data used by Vortex or connected execution.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["C-03", "P-02", "P-03", "P-04"],
    corrections: ["C-03", "C-07"],
    minimumDisposition: "D-02",
    mandatoryMeasures: [],
    requiredOneOf: [["P-06", "G-12"]],
    allowedMeasures: ["D-02", "D-03", "P-06", "G-12", "R-01", "E-01"],
  }),
  offense({
    code: "SEC-11",
    title: "Smart-contract attack",
    domain: "Security",
    definition:
      "Exploitation intended to steal, corrupt state, bypass authority, or deny service. Good-faith disclosure follows a separate safe-harbor process.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["P-02", "P-03"],
    corrections: [],
    minimumDisposition: "D-02",
    mandatoryMeasures: [],
    requiredOneOf: [["P-02", "G-12"]],
    allowedMeasures: ["D-02", "P-02", "G-12", "R-01", "E-01"],
  }),
  offense({
    code: "SEC-12",
    title: "Sybil attack",
    domain: "Security / identity",
    definition:
      "Deliberately presenting controlled identities or surfaces as independent Humans to gain prohibited influence or access.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["P-01", "P-02"],
    corrections: [],
    minimumDisposition: "D-01",
    mandatoryMeasures: [],
    requiredOneOf: [["P-07", "G-12"]],
    allowedMeasures: [
      "D-01",
      "D-02",
      "P-03",
      "P-06",
      "P-07",
      "G-01",
      "G-02",
      "G-12",
      "R-01",
      "E-01",
    ],
  }),
  offense({
    code: "GOV-05",
    title: "Governance sockpuppeting",
    domain: "Governance integrity",
    definition:
      "Coordinated deceptive personas or accounts used to manufacture independent support, discussion, reports, or votes.",
    allowedSeverities: ["L1", "L2", "L3", "L4"],
    immediateMeasures: ["G-05", "G-11"],
    corrections: [],
    minimumDisposition: "D-01",
    mandatoryMeasures: [],
    requiredOneOf: [["G-03", "G-05"]],
    allowedMeasures: [
      "D-01",
      "D-02",
      "G-01",
      "G-02",
      "G-03",
      "G-05",
      "G-12",
      "R-01",
    ],
  }),
  offense({
    code: "GOV-06",
    title: "Unauthorized proposal-context tampering",
    domain: "Governance integrity",
    definition:
      "Changing external proposal context without the authorized author's consent in a way that alters interpretation or evidence.",
    allowedSeverities: ["L1", "L2", "L3", "L4"],
    immediateMeasures: ["C-05", "G-11"],
    corrections: ["C-05", "C-07"],
    minimumDisposition: "D-01",
    mandatoryMeasures: ["G-11"],
    requiredOneOf: [],
    allowedMeasures: ["D-01", "D-02", "G-04", "G-11", "G-12", "R-01"],
  }),
  offense({
    code: "GOV-07",
    title: "Material false-data submission",
    domain: "Governance integrity",
    definition:
      "Supplying materially false or fabricated information to governance. Mistake, uncertainty, negligence, and deliberate deception require distinct findings.",
    allowedSeverities: ["L1", "L2", "L3", "L4"],
    immediateMeasures: ["C-03", "G-11"],
    corrections: ["C-03"],
    minimumDisposition: "D-01",
    mandatoryMeasures: [],
    requiredOneOf: [["G-03", "G-11"]],
    allowedMeasures: [
      "D-01",
      "D-02",
      "G-01",
      "G-02",
      "G-03",
      "G-11",
      "G-12",
      "R-01",
      "E-01",
    ],
  }),
  offense({
    code: "GOV-08",
    title: "Fraud or material misrepresentation",
    domain: "Governance integrity / security",
    definition:
      "Intentional deception for governance, access, status, economic, or reputational gain.",
    allowedSeverities: ["L2", "L3", "L4"],
    immediateMeasures: ["P-02", "P-03", "C-03"],
    corrections: ["C-03", "C-07"],
    minimumDisposition: "D-02",
    mandatoryMeasures: ["G-12"],
    requiredOneOf: [],
    allowedMeasures: [
      "D-02",
      "D-03",
      "P-06",
      "G-01",
      "G-02",
      "G-12",
      "R-01",
      "E-01",
    ],
  }),
] as const;

export const humanodeCodexOffensesByCode = new Map(
  humanodeCodexOffenses.map((item) => [item.code, item]),
);

const humanodeCodexOffensesByReference = new Map(
  humanodeCodexOffenses.map((item) => [item.ref, item]),
);

export const humanodeCodexMeasuresByCode = new Map(
  humanodeCodexMeasures.map((item) => [item.code, item]),
);

const humanodeCodexMeasuresByReference = new Map(
  humanodeCodexMeasures.map((item) => [item.ref, item]),
);

const humanodeCodexExcludedMeasuresByReference = new Map(
  humanodeCodexExcludedMeasures.map((item) => [item.ref, item]),
);

const humanodeCodexSeverityByCode = new Map(
  Object.entries(humanodeCodexSeverityRules).map(([code, item]) => [
    code,
    item,
  ]),
);

const humanodeCodexEvidenceByCode = new Map<string, HumanodeCodexEvidenceRule>(
  Object.values(humanodeCodexEvidenceRules).map((item) => [item.code, item]),
);

const HUMANODE_CODEX_REFERENCE_ALIASES = new Map([
  [HUMANODE_CODEX_VERSION, "HC-1.1"],
]);

export const humanodeCodexReferenceTokens = Object.freeze(
  [
    HUMANODE_CODEX_VERSION,
    ...humanodeCodexClauses.flatMap((item) => [
      item.ref,
      ...item.points.map((_, index) => `${item.ref}.${index + 1}`),
    ]),
    ...humanodeCodexOffenses.flatMap((item) => [item.code, item.ref]),
    ...humanodeCodexMeasures.flatMap((item) => [item.code, item.ref]),
    ...humanodeCodexExcludedMeasures.map((item) => item.ref),
    ...Object.entries(humanodeCodexSeverityRules).flatMap(([code, item]) => [
      code,
      item.ref,
    ]),
    ...Object.values(humanodeCodexEvidenceRules).flatMap((item) => [
      item.code,
      item.ref,
    ]),
  ]
    .filter((value, index, values) => values.indexOf(value) === index)
    .sort((left, right) => right.length - left.length),
);

export function humanodeCodexHref(refOrCode: string): string {
  const ref =
    humanodeCodexOffensesByCode.get(refOrCode)?.ref ??
    humanodeCodexMeasuresByCode.get(refOrCode)?.ref ??
    humanodeCodexSeverityByCode.get(refOrCode)?.ref ??
    humanodeCodexEvidenceByCode.get(refOrCode)?.ref ??
    HUMANODE_CODEX_REFERENCE_ALIASES.get(refOrCode) ??
    refOrCode;
  return `/app/humanode-codex?clause=${encodeURIComponent(ref)}`;
}

export function humanodeCodexReference(
  refOrCode: string,
): { ref: string; title: string; description: string } | undefined {
  const offense =
    humanodeCodexOffensesByCode.get(refOrCode) ??
    humanodeCodexOffensesByReference.get(refOrCode);
  if (offense) {
    return {
      ref: offense.ref,
      title: offense.title,
      description: offense.definition,
    };
  }
  const measure =
    humanodeCodexMeasuresByCode.get(refOrCode) ??
    humanodeCodexMeasuresByReference.get(refOrCode);
  if (measure) {
    return {
      ref: measure.ref,
      title: measure.title,
      description: measure.description,
    };
  }
  const excludedMeasure =
    humanodeCodexExcludedMeasuresByReference.get(refOrCode);
  if (excludedMeasure) {
    return {
      ref: excludedMeasure.ref,
      title: excludedMeasure.title,
      description: excludedMeasure.reason,
    };
  }
  const clause = humanodeCodexClauses.find((item) => item.ref === refOrCode);
  if (clause) {
    return {
      ref: clause.ref,
      title: clause.title,
      description: clause.summary,
    };
  }
  for (const parent of humanodeCodexClauses) {
    const pointIndex = parent.points.findIndex(
      (_, index) => `${parent.ref}.${index + 1}` === refOrCode,
    );
    if (pointIndex >= 0) {
      return {
        ref: refOrCode,
        title: `${parent.title}, point ${pointIndex + 1}`,
        description: parent.points[pointIndex],
      };
    }
  }
  const evidence =
    humanodeCodexEvidenceByCode.get(refOrCode) ??
    Object.values(humanodeCodexEvidenceRules).find(
      (item) => item.ref === refOrCode,
    );
  if (evidence) {
    return {
      ref: evidence.ref,
      title: `${evidence.code} - ${evidence.title}`,
      description: evidence.description,
    };
  }
  const severity = [...humanodeCodexSeverityByCode.entries()].find(
    ([code, item]) => code === refOrCode || item.ref === refOrCode,
  );
  if (severity) {
    const [code, rule] = severity;
    return {
      ref: rule.ref,
      title: `${code} - ${rule.title}`,
      description: `${rule.evidence} standard; ${rule.duration}.`,
    };
  }
  const aliasedRef = HUMANODE_CODEX_REFERENCE_ALIASES.get(refOrCode);
  return aliasedRef ? humanodeCodexReference(aliasedRef) : undefined;
}
