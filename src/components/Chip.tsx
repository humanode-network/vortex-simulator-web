import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ChipProps = {
  children: ReactNode;
  className?: string;
  title?: string;
};

export function Chip({ children, className, title }: ChipProps) {
  const resolvedTitle =
    title ?? (typeof children === "string" ? children : undefined);

  return (
    <span
      title={resolvedTitle}
      className={cn(
        "inline-flex min-h-7 max-w-full min-w-0 items-center justify-center rounded-full px-3.5 py-1 text-xs leading-none font-semibold tracking-wide",
        className,
      )}
    >
      <span className="block max-w-full min-w-0 whitespace-nowrap">
        {children}
      </span>
    </span>
  );
}
