import type { ReactNode } from "react";

import { GlassyCard } from "@/components/GlassyCard";
import { Button } from "@/components/primitives/button";

type WorkspaceHeaderProps = {
  actions?: ReactNode;
  details?: string[];
  markers?: ReactNode;
  meta?: ReactNode;
  summary: ReactNode;
  title: ReactNode;
};

type WorkspaceHeaderActionProps = {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
};

export function WorkspaceHeader({
  actions,
  details = [],
  markers,
  meta,
  summary,
  title,
}: WorkspaceHeaderProps) {
  return (
    <GlassyCard as="article" className="p-5 sm:p-6">
      <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="max-w-4xl min-w-0 space-y-2">
          <h1 className="text-2xl leading-tight font-semibold text-text sm:text-3xl">
            {title}
          </h1>
          <div className="text-base leading-relaxed text-muted">{summary}</div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {actions}
          </div>
        ) : null}
      </header>

      {details.length > 0 ? (
        <div className="mt-5 max-w-4xl space-y-3 border-t border-[color:var(--surface-glass-border)] pt-5">
          {details.map((detail, index) => (
            <p
              key={`${index}-${detail}`}
              className="border-l-2 border-[color:var(--surface-glass-border)] pl-3 text-sm leading-7 text-text"
            >
              {detail}
            </p>
          ))}
        </div>
      ) : null}

      {markers || meta ? (
        <footer className="mt-5 flex flex-col gap-4 border-t border-[color:var(--surface-glass-border)] pt-4 lg:flex-row lg:items-center lg:justify-between">
          {markers ? (
            <div className="flex flex-wrap items-center gap-2">{markers}</div>
          ) : null}
          {meta ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
              {meta}
            </div>
          ) : null}
        </footer>
      ) : null}
    </GlassyCard>
  );
}

export function WorkspaceHeaderAction({
  children,
  disabled = false,
  onClick,
}: WorkspaceHeaderActionProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="w-36 text-sm font-semibold opacity-90 hover:opacity-100"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
