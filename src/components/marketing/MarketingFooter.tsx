import type * as React from "react";

import { cn } from "@/lib/utils";

type MarketingFooterProps = {
  children: React.ReactNode;
  className?: string;
  pinned?: boolean;
};

export function MarketingFooter({
  children,
  className,
  pinned = false,
}: MarketingFooterProps) {
  return (
    <footer
      className={cn(
        pinned ? "absolute right-0 bottom-0 left-0" : "",
        "px-6 pt-4 pb-6 text-center text-xs text-white/70",
        className,
      )}
    >
      {children}
    </footer>
  );
}
