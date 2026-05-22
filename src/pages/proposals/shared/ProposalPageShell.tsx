import type { ReactNode } from "react";

import { PageHint } from "@/components/PageHint";
import { Surface } from "@/components/Surface";

type ProposalPageShellProps = {
  children: ReactNode;
  transitionNotice?: string | null;
};

export function ProposalPageShell({
  children,
  transitionNotice,
}: ProposalPageShellProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      {transitionNotice ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          {transitionNotice}
        </Surface>
      ) : null}
      {children}
    </div>
  );
}
