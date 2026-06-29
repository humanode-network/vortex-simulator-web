import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const base =
  "flex min-h-28 w-full rounded-xl border border-[color:var(--surface-glass-border)] bg-[color:var(--control-glass-bg)] px-3 py-2 text-sm text-[var(--text)] shadow-[var(--shadow-control)] transition supports-[backdrop-filter]:backdrop-blur-md " +
  "placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-dim)] focus-visible:ring-offset-2 focus-visible:ring-offset-panel focus-visible:shadow-[var(--shadow-tile)] " +
  "hover:border-[color:var(--surface-glass-hover-border)] hover:bg-[color:var(--control-glass-hover-bg)] disabled:cursor-not-allowed disabled:opacity-60";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return <textarea className={cn(base, className)} ref={ref} {...props} />;
  },
);
Textarea.displayName = "Textarea";
