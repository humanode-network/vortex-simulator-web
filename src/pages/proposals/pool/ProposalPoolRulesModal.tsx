import { Modal } from "@/components/Modal";
import { Surface } from "@/components/Surface";
import { formatLoadError } from "@/lib/errorFormatting";

export type PoolVoteAction = "upvote" | "downvote";

type ProposalPoolRulesModalProps = {
  checked: boolean;
  error: string | null;
  onCheckedChange: (checked: boolean) => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pendingAction: PoolVoteAction | null;
  rules: string[];
  submitting: boolean;
};

export const ProposalPoolRulesModal: React.FC<
  ProposalPoolRulesModalProps
> = ({
  checked,
  error,
  onCheckedChange,
  onConfirm,
  onOpenChange,
  open,
  pendingAction,
  rules,
  submitting,
}) => {
  const confirmDisabled = !checked || submitting || !pendingAction;
  const confirmingDownvote = pendingAction === "downvote";
  const confirmLabel = confirmingDownvote
    ? submitting
      ? "Submitting..."
      : "Confirm downvote"
    : submitting
      ? "Submitting..."
      : "Confirm upvote";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="Pool rules"
      contentClassName="max-w-xl"
    >
      <Surface
        variant="panel"
        radius="2xl"
        shadow="popover"
        className="p-6 text-text"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-semibold">Pool rules</p>
          <button
            type="button"
            className="text-sm text-muted hover:text-text"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>
        <div className="space-y-2 text-sm text-muted">
          <ul className="list-disc space-y-1 pl-4">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
        <Surface
          variant="panelAlt"
          radius="xl"
          shadow="control"
          className="mt-4 flex items-center gap-2 px-3 py-2"
        >
          <input
            id="rules-confirm"
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={checked}
            onChange={(event) => onCheckedChange(event.target.checked)}
          />
          <label htmlFor="rules-confirm" className="text-sm text-text">
            I read the proposal and know the rules
          </label>
        </Surface>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-text hover:bg-panel-alt"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              confirmDisabled
                ? "cursor-not-allowed bg-muted text-primary-foreground opacity-60"
                : confirmingDownvote
                  ? "border-2 border-destructive bg-destructive text-destructive-foreground hover:opacity-95"
                  : "border-2 border-accent bg-accent text-accent-foreground hover:opacity-95"
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-destructive">
            {formatLoadError(error)}
          </p>
        ) : null}
      </Surface>
    </Modal>
  );
};
