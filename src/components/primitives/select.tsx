import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const base =
  "h-10 w-full rounded-xl border border-[color:var(--surface-glass-border)] bg-[color:var(--control-glass-bg)] px-3 text-sm text-text shadow-[var(--shadow-control)] transition supports-[backdrop-filter]:backdrop-blur-md hover:border-[color:var(--surface-glass-hover-border)] hover:bg-[color:var(--control-glass-hover-bg)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-dim)] focus-visible:ring-offset-2 focus-visible:ring-offset-panel " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select className={cn(base, className)} ref={ref} {...props}>
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";
