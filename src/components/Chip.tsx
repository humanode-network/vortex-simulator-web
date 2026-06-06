import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ChipProps = {
  children: ReactNode;
  className?: string;
};

export function Chip({ children, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3.5 py-1 text-xs leading-none font-semibold tracking-wide",
        className,
      )}
    >
      {children}
    </span>
  );
}
