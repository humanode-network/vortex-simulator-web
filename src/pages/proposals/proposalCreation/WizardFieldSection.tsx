import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type WizardFieldSectionProps = {
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  title: ReactNode;
};

export function WizardFieldSection({
  children,
  className,
  description,
  title,
}: WizardFieldSectionProps) {
  return (
    <section className={cn("proposal-wizard__field-section", className)}>
      <header className="space-y-1">
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {description ? (
          <p className="text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </header>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
