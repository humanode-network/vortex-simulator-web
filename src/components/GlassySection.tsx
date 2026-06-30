import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/SectionHeader";
import { Surface } from "@/components/Surface";
import "./GlassySection.css";

type GlassySectionProps = {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  title: ReactNode;
};

type GlassyTileProps = {
  children: ReactNode;
  className?: string;
};

type GlassyMetricTileProps = {
  className?: string;
  label: ReactNode;
  value: ReactNode;
};

type GlassyCompactMetricProps = {
  className?: string;
  label: ReactNode;
  value: ReactNode;
};

type GlassyCompactGridProps = {
  children: ReactNode;
  className?: string;
};

type GlassyCompactRowProps = {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  title: ReactNode;
};

type GlassyKeyValueProps = {
  className?: string;
  label: ReactNode;
  value: ReactNode;
};

type GlassyTileHeadingProps = {
  children: ReactNode;
  className?: string;
};

type GlassyStatusChipProps = {
  children: ReactNode;
  className?: string;
  tone?: "danger" | "neutral" | "ok" | "primary" | "warn";
};

type GlassyProgressBarProps = {
  className?: string;
  value: number;
};

export function GlassySection({
  action,
  children,
  className,
  title,
}: GlassySectionProps) {
  return (
    <section className={cn("glassy-section", className)}>
      <div className="flex items-center justify-between gap-3">
        <SectionHeader className="glassy-section__title">{title}</SectionHeader>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function GlassyTile({ children, className }: GlassyTileProps) {
  return (
    <Surface
      variant="glass"
      radius="2xl"
      shadow="tile"
      className={cn("glassy-tile p-4", className)}
    >
      {children}
    </Surface>
  );
}

export function GlassyMetricTile({
  className,
  label,
  value,
}: GlassyMetricTileProps) {
  return (
    <GlassyTile
      className={cn(
        "glassy-metric-tile flex h-full flex-col items-center justify-center text-center",
        className,
      )}
    >
      <p className="glassy-metric-tile__label">{label}</p>
      <p className="glassy-metric-tile__value">{value}</p>
    </GlassyTile>
  );
}

export function GlassyCompactMetric({
  className,
  label,
  value,
}: GlassyCompactMetricProps) {
  return (
    <GlassyTile className={cn("glassy-compact-metric", className)}>
      <p className="glassy-compact-metric__label">{label}</p>
      <p className="glassy-compact-metric__value">{value}</p>
    </GlassyTile>
  );
}

export function GlassyCompactGrid({
  children,
  className,
}: GlassyCompactGridProps) {
  return <div className={cn("glassy-compact-grid", className)}>{children}</div>;
}

export function GlassyCompactRow({
  actions,
  children,
  className,
  title,
}: GlassyCompactRowProps) {
  return (
    <GlassyTile className={cn("glassy-compact-row", className)}>
      <div className="glassy-compact-row__header">
        <GlassyTileHeading>{title}</GlassyTileHeading>
        {actions ? (
          <div className="glassy-compact-row__actions">{actions}</div>
        ) : null}
      </div>
      <div className="glassy-compact-row__main">{children}</div>
    </GlassyTile>
  );
}

export function GlassyKeyValue({
  className,
  label,
  value,
}: GlassyKeyValueProps) {
  return (
    <span className={cn("glassy-key-value", className)}>
      <span className="glassy-key-value__label">{label}</span>
      <span className="glassy-key-value__value">{value}</span>
    </span>
  );
}

export function GlassyTileHeading({
  children,
  className,
}: GlassyTileHeadingProps) {
  return <p className={cn("glassy-tile-heading", className)}>{children}</p>;
}

export function GlassyStatusChip({
  children,
  className,
  tone = "neutral",
}: GlassyStatusChipProps) {
  return (
    <span
      className={cn(
        "glassy-status-chip",
        `glassy-status-chip--${tone}`,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function GlassyProgressBar({
  className,
  value,
}: GlassyProgressBarProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("glassy-progress", className)}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={normalizedValue}
      role="progressbar"
    >
      <span
        className="glassy-progress__bar"
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
}
