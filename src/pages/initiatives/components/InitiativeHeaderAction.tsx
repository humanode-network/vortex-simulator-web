import type { ReactNode } from "react";

import { Button } from "@/components/primitives/button";

type InitiativeHeaderActionProps = {
  children: ReactNode;
  onClick: () => void;
};

export function InitiativeHeaderAction({
  children,
  onClick,
}: InitiativeHeaderActionProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="w-36 text-sm font-semibold opacity-90 hover:opacity-100"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
