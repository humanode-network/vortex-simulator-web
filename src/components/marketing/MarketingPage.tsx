import type * as React from "react";

import { cn } from "@/lib/utils";

type MarketingPageProps = {
  children: React.ReactNode;
  className?: string;
  background?: React.ReactNode;
  padded?: boolean;
};

export function MarketingPage({
  children,
  className,
  background,
  padded = true,
}: MarketingPageProps) {
  return (
    <div
      className={cn(
        "relative min-h-svh overflow-hidden",
        padded && "px-6 py-10",
        className,
      )}
    >
      {background}
      <div className="relative">{children}</div>
    </div>
  );
}
