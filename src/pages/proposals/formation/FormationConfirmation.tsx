import type { ReactNode } from "react";
import { Button } from "@/components/primitives/button";

export function FormationConfirmation({
  label,
  children,
  confirmLabel,
  busy,
  disabled,
  onConfirm,
  onCancel,
}: {
  label: string;
  children: ReactNode;
  confirmLabel: string;
  busy: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div role="group" aria-label={label} className="space-y-3">
      <p className="text-sm">{children}</p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy || disabled} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="outline" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
