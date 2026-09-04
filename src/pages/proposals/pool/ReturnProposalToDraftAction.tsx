import { useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Modal } from "@/components/Modal";
import { Surface } from "@/components/Surface";
import { Button } from "@/components/primitives/button";
import { apiProposalReturnToDraft, getApiErrorPayload } from "@/lib/apiClient";
import { formatProposalActionError } from "@/lib/proposalSubmitErrors";

type ReturnProposalToDraftActionProps = {
  proposalId: string;
  onStageChanged: () => Promise<boolean>;
};

export function ReturnProposalToDraftAction({
  proposalId,
  onStageChanged,
}: ReturnProposalToDraftActionProps) {
  const navigate = useNavigate();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (submitting) return;
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiProposalReturnToDraft({
        proposalId,
        idempotencyKey: crypto.randomUUID(),
      });
      navigate(result.draftRoute);
    } catch (cause) {
      if (
        getApiErrorPayload(cause)?.error?.code ===
        "proposal_return_stage_invalid"
      ) {
        const redirected = await onStageChanged();
        if (redirected) return;
      }
      setError(
        formatProposalActionError(
          cause,
          "The proposal could not be returned to drafts.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Return to drafts
      </Button>

      <Modal
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) setOpen(true);
          else close();
        }}
        ariaLabel="Return proposal to drafts"
        contentClassName="max-w-xl"
      >
        <Surface
          variant="panel"
          radius="2xl"
          shadow="popover"
          className="space-y-5 p-6"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-text">
              Return to drafts?
            </h2>
            <p className="text-sm leading-6 text-muted">
              This Proposal Pool entry will close and a private editable draft
              will be added to My Drafts.
            </p>
          </div>
          <ul className="space-y-2 text-sm leading-6 text-muted">
            <li>Existing votes and proposal history remain visible.</li>
            <li>The returned draft stays private until you publish it.</li>
            <li>A revised submission starts again in Proposal Pool.</li>
          </ul>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={submitting}
              onClick={close}
            >
              Keep in pool
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? "Returning..." : "Return to drafts"}
            </Button>
          </div>
        </Surface>
      </Modal>
    </>
  );
}
