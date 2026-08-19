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

const COURT_EVIDENCE_ACCESS_LABELS: Readonly<
  Record<CourtEvidenceAccessV2Dto, string>
> = Object.freeze({
  public: "Public after finality",
  parties_and_jury: "Parties and seated jury",
  jury_only_pending_summary: "Jury only pending summary",
  security_sealed: "Authorized safety reviewers",
  enforcement_only: "Protocol or external enforcement only",
});

export function courtEvidenceAccessLabel(
  access: CourtEvidenceAccessV2Dto,
): string {
  return COURT_EVIDENCE_ACCESS_LABELS[access];
}

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

const COURT_EVIDENCE_FIELD_SUFFIX: Readonly<
  Record<CourtEvidenceDraftError["field"], string>
> = Object.freeze({
  digest: "digest",
  proofType: "proof-type",
  targetId: "target-id",
  targetType: "target-type",
  url: "url",
  verifierId: "verifier-id",
  verifierVersion: "verifier-version",
});

export function courtEvidenceFieldId(
  idPrefix: string,
  field: CourtEvidenceDraftError["field"],
): string {
  return `${idPrefix}-${COURT_EVIDENCE_FIELD_SUFFIX[field]}`;
}

export function courtEvidenceFieldIds(
  idPrefix: string,
): Readonly<Record<CourtEvidenceDraftError["field"], string>> {
  return Object.freeze(
    Object.fromEntries(
      Object.keys(COURT_EVIDENCE_FIELD_SUFFIX).map((field) => [
        field,
        courtEvidenceFieldId(
          idPrefix,
          field as CourtEvidenceDraftError["field"],
        ),
      ]),
    ) as Record<CourtEvidenceDraftError["field"], string>,
  );
}

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
  options: { autoDigestExternalUrl?: boolean } = {},
):
  | { ok: true; value: CourtEvidenceInputV2 }
  | { ok: false; error: CourtEvidenceDraftError } {
  const digest = draft.digest.trim();
  const digestRequired =
    draft.kind !== "external_url" || options.autoDigestExternalUrl !== true;
  if (digestRequired && !/^sha256:[0-9a-f]{64}$/.test(digest)) {
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
        ...(digest ? { digest } : {}),
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
