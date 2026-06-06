import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { SIM_AUTH_ENABLED } from "@/lib/featureFlags";
import { useAuth } from "@/app/auth/AuthContext";

export type VoteButtonTone = "accent" | "destructive" | "neutral";
export type VoteButtonSize = "sm" | "lg";

type VoteButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  tone: VoteButtonTone;
  label: ReactNode;
  icon?: ReactNode;
  size?: VoteButtonSize;
  requiresEligibility?: boolean;
};

const baseClasses =
  "rounded-full border font-semibold shadow-[var(--shadow-control)] transition-colors supports-[backdrop-filter]:backdrop-blur-md disabled:cursor-not-allowed disabled:opacity-60";

const sizeClasses: Record<VoteButtonSize, string> = {
  sm: "min-w-[140px] px-6 py-2 text-sm",
  lg: "flex min-w-[220px] items-center justify-center gap-3 px-12 py-6 text-2xl leading-none",
};

const toneClasses: Record<VoteButtonTone, string> = {
  accent:
    "border-[var(--accent)] bg-[color:var(--control-glass-bg)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
  destructive:
    "border-[var(--destructive)] bg-[color:var(--control-glass-bg)] text-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)]",
  neutral:
    "border-[color:var(--surface-glass-border)] bg-[color:var(--control-glass-bg)] text-muted hover:border-[color:var(--surface-glass-hover-border)] hover:bg-[color:var(--control-glass-hover-bg)] hover:text-text",
};

export function VoteButton({
  tone,
  label,
  icon,
  size = "sm",
  className,
  requiresEligibility = true,
  disabled: disabledProp,
  title: titleProp,
  ...props
}: VoteButtonProps) {
  const auth = useAuth();
  const gated =
    SIM_AUTH_ENABLED &&
    requiresEligibility &&
    (!auth.authenticated || !auth.eligible);
  const disabled = Boolean(disabledProp) || gated;
  const title =
    titleProp ??
    (gated
      ? auth.loading
        ? "Checking wallet status…"
        : !auth.authenticated
          ? "Connect and verify to interact."
          : auth.gateReason
            ? `Not eligible: ${auth.gateReason}`
            : "Not eligible to interact."
      : undefined);

  return (
    <button
      type="button"
      className={cn(
        baseClasses,
        sizeClasses[size],
        toneClasses[tone],
        className,
      )}
      {...props}
      disabled={disabled}
      title={title}
    >
      {icon ? (
        <span className={size === "lg" ? "text-2xl leading-none" : ""}>
          {icon}
        </span>
      ) : null}
      <span className={size === "lg" ? "text-2xl leading-none" : ""}>
        {label}
      </span>
    </button>
  );
}
