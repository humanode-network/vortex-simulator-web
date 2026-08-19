import { useCallback, useState } from "react";

import type { CourtEvidenceInputV2 } from "@/lib/api/courtsV2";
import {
  courtEvidenceDraftIsEmpty,
  courtEvidenceDraftToInput,
  courtEvidenceFieldId,
  emptyCourtEvidenceDraft,
  type CourtEvidenceDraft,
  type CourtEvidenceDraftError,
} from "../forms/courtEvidence";
import { focusCourtField } from "../model/courtFocus";

type CourtEvidenceValidation =
  | { ok: true; value: CourtEvidenceInputV2 | null }
  | { ok: false; error: CourtEvidenceDraftError };

export function useCourtEvidenceDraft(
  idPrefix: string,
  autoDigestExternalUrl = false,
) {
  const [draft, setDraft] = useState(emptyCourtEvidenceDraft);
  const [error, setError] = useState<CourtEvidenceDraftError | null>(null);
  const isEmpty = courtEvidenceDraftIsEmpty(draft);

  const change = useCallback((next: CourtEvidenceDraft) => {
    setDraft(next);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setDraft(emptyCourtEvidenceDraft());
    setError(null);
  }, []);

  const reportError = useCallback(
    (next: CourtEvidenceDraftError) => {
      setError(next);
      focusCourtField(courtEvidenceFieldId(idPrefix, next.field));
    },
    [idPrefix],
  );

  const validate = useCallback(
    (provenance: string): CourtEvidenceValidation => {
      if (courtEvidenceDraftIsEmpty(draft)) return { ok: true, value: null };
      const result = courtEvidenceDraftToInput(draft, provenance, {
        autoDigestExternalUrl,
      });
      if (!result.ok) {
        reportError(result.error);
        return result;
      }
      setError(null);
      return { ok: true, value: result.value };
    },
    [autoDigestExternalUrl, draft, reportError],
  );

  return { change, draft, error, isEmpty, reportError, reset, validate };
}
