import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  children: ReactNode;
  className?: string;
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  children,
  className,
}) => (
  <h3 className={cn("text-2xl font-semibold tracking-tight text-muted", className)}>
    {children}
  </h3>
);
