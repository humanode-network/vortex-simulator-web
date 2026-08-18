import type { CourtEvidenceInputV2 } from "@/lib/api/courtsV2";
import type {
  CourtEvidenceAccessV2Dto,
  CourtTargetTypeV2Dto,
} from "@/types/api";

export const COURT_EVIDENCE_KINDS = Object.freeze([
  "vortex_reference",
  "external_url",
  "protocol_proof",
] as const);

export const COURT_REPORT_EVIDENCE_ACCESS = Object.freeze([
  "public",
  "parties_and_jury",
  "jury_only_pending_summary",
  "security_sealed",
] as const satisfies readonly CourtEvidenceAccessV2Dto[]);

export const COURT_REPORTABLE_TARGET_TYPES = Object.freeze([
  "human_identity",
  "protocol_action",
  "public_proposal_draft",
  "proposal",
  "proposal_thread",
  "proposal_message",
  "chamber",
  "chamber_thread",
  "chamber_message",
  "faction",
  "faction_thread",
  "faction_message",
  "faction_work_item",
  "initiative",
  "initiative_board_card",
  "initiative_thread",
  "initiative_message",
  "membership_transition",
  "formation_project",
  "formation_action",
  "delegation",
  "governance_action",
  "cm_record",
  "proof_or_status_event",
  "external_incident",
] as const satisfies readonly CourtTargetTypeV2Dto[]);

export type CourtEvidenceDraft = {
  kind: (typeof COURT_EVIDENCE_KINDS)[number];
  access: (typeof COURT_REPORT_EVIDENCE_ACCESS)[number];
  digest: string;
  url: string;
  targetType: CourtTargetTypeV2Dto;
  targetId: string;
  targetRevision: string;
  proofType: string;
  verifierId: string;
  verifierVersion: string;
};

export type CourtEvidenceDraftError = {
  field:
    | "digest"
    | "url"
    | "targetType"
    | "targetId"
    | "proofType"
    | "verifierId"
    | "verifierVersion";
  message: string;
};

export function emptyCourtEvidenceDraft(): CourtEvidenceDraft {
  return {
    kind: "external_url",
    access: "parties_and_jury",
    digest: "",
    url: "",
    targetType: "proposal",
    targetId: "",
    targetRevision: "",
    proofType: "",
    verifierId: "",
    verifierVersion: "",
  };
}

export function courtEvidenceDraftIsEmpty(draft: CourtEvidenceDraft): boolean {
  return ![
    draft.digest,
    draft.url,
    draft.targetId,
    draft.targetRevision,
    draft.proofType,
    draft.verifierId,
    draft.verifierVersion,
  ].some((value) => value.trim());
}

function validExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function courtEvidenceDraftToInput(
  draft: CourtEvidenceDraft,
  provenance: string,
):
  | { ok: true; value: CourtEvidenceInputV2 }
  | { ok: false; error: CourtEvidenceDraftError } {
  const digest = draft.digest.trim();
  if (!/^sha256:[0-9a-f]{64}$/.test(digest)) {
    return {
      ok: false,
      error: {
        field: "digest",
        message:
          "Enter a SHA-256 digest as sha256: followed by 64 lowercase hexadecimal characters.",
      },
    };
  }
  if (draft.kind === "external_url") {
    const url = draft.url.trim();
    if (!validExternalUrl(url)) {
      return {
        ok: false,
        error: {
          field: "url",
          message: "Enter a public HTTP or HTTPS evidence URL.",
        },
      };
    }
    return {
      ok: true,
      value: {
        kind: draft.kind,
        url,
        digest,
        provenance,
        access: draft.access,
      },
    };
  }
  if (draft.kind === "vortex_reference") {
    const targetId = draft.targetId.trim();
    if (!targetId) {
      return {
        ok: false,
        error: {
          field: "targetId",
          message: "Enter the exact Vortex record id.",
        },
      };
    }
    return {
      ok: true,
      value: {
        kind: draft.kind,
        target: {
          type: draft.targetType,
          id: targetId,
          ...(draft.targetRevision.trim()
            ? { revision: draft.targetRevision.trim() }
            : {}),
        },
        digest,
        provenance,
        access: draft.access,
      },
    };
  }
  const proofType = draft.proofType.trim();
  const verifierId = draft.verifierId.trim();
  const verifierVersion = draft.verifierVersion.trim();
  if (!proofType) {
    return {
      ok: false,
      error: {
        field: "proofType",
        message: "Enter the registered proof type.",
      },
    };
  }
  if (!verifierId) {
    return {
      ok: false,
      error: {
        field: "verifierId",
        message: "Enter the registered verifier id.",
      },
    };
  }
  if (!verifierVersion) {
    return {
      ok: false,
      error: {
        field: "verifierVersion",
        message: "Enter the verifier version.",
      },
    };
  }
  return {
    ok: true,
    value: {
      kind: draft.kind,
      proofType,
      verifierId,
      verifierVersion,
      digest,
      provenance,
      access: draft.access,
    },
  };
}
