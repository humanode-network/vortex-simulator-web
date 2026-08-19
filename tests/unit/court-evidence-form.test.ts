import { describe, expect, test } from "@rstest/core";

import {
  courtEvidenceDraftIsEmpty,
  courtEvidenceDraftToInput,
  emptyCourtEvidenceDraft,
} from "@/pages/courts/forms/courtEvidence";

const digest = `sha256:${"a".repeat(64)}`;

describe("Court evidence form model", () => {
  test("treats the untouched draft as empty", () => {
    expect(courtEvidenceDraftIsEmpty(emptyCourtEvidenceDraft())).toBe(true);
  });

  test("builds each supported evidence record without losing access or provenance", () => {
    expect(
      courtEvidenceDraftToInput(
        {
          ...emptyCourtEvidenceDraft(),
          digest,
          url: "https://evidence.example/record",
          access: "public",
        },
        "reporter_submission",
      ),
    ).toEqual({
      ok: true,
      value: {
        kind: "external_url",
        url: "https://evidence.example/record",
        digest,
        provenance: "reporter_submission",
        access: "public",
      },
    });

    expect(
      courtEvidenceDraftToInput(
        {
          ...emptyCourtEvidenceDraft(),
          kind: "vortex_reference",
          digest,
          targetType: "proposal_message",
          targetId: "message-7",
          targetRevision: "revision-2",
        },
        "reporter_submission",
      ),
    ).toMatchObject({
      ok: true,
      value: {
        kind: "vortex_reference",
        target: {
          type: "proposal_message",
          id: "message-7",
          revision: "revision-2",
        },
      },
    });

    expect(
      courtEvidenceDraftToInput(
        {
          ...emptyCourtEvidenceDraft(),
          kind: "protocol_proof",
          digest,
          proofType: "validator-equivocation",
          verifierId: "consensus-proof-verifier",
          verifierVersion: "1",
        },
        "reporter_submission",
      ),
    ).toMatchObject({
      ok: true,
      value: {
        kind: "protocol_proof",
        proofType: "validator-equivocation",
        verifierId: "consensus-proof-verifier",
        verifierVersion: "1",
      },
    });
  });

  test("rejects incomplete and non-canonical evidence", () => {
    expect(
      courtEvidenceDraftToInput(
        { ...emptyCourtEvidenceDraft(), digest: "sha256:ABC" },
        "reporter_submission",
      ),
    ).toMatchObject({ ok: false, error: { field: "digest" } });

    expect(
      courtEvidenceDraftToInput(
        {
          ...emptyCourtEvidenceDraft(),
          digest,
          url: "https://user:password@evidence.example/record",
        },
        "reporter_submission",
      ),
    ).toMatchObject({ ok: false, error: { field: "url" } });

    expect(
      courtEvidenceDraftToInput(
        {
          ...emptyCourtEvidenceDraft(),
          kind: "vortex_reference",
          digest,
        },
        "reporter_submission",
      ),
    ).toMatchObject({ ok: false, error: { field: "targetId" } });
  });
});
