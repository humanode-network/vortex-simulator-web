import type { PropsWithChildren } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarMedallion({
  Icon,
  className,
  children,
}: PropsWithChildren<{ Icon: LucideIcon; className?: string }>) {
  return (
    <span className={cn("sidebar__medallion", className)} aria-hidden="true">
      <Icon className="sidebar__icon" />
      {children}
    </span>
  );
}
