import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "muted";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-sm",
  };
  const variants = {
    default:
      "border border-[color:var(--surface-glass-hover-border)] bg-[color:var(--primary-dim)] text-[var(--primary)]",
    outline:
      "border border-[color:var(--surface-glass-border)] bg-[color:var(--control-glass-bg)] text-text supports-[backdrop-filter]:backdrop-blur-md",
    muted:
      "border border-[color:var(--surface-glass-border)] bg-[color:var(--control-glass-bg)] text-muted supports-[backdrop-filter]:backdrop-blur-md",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
