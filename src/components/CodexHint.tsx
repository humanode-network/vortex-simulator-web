import type { ReactNode } from "react";

import { ReferenceHint } from "@/components/Hint";
import {
  humanodeCodexHref,
  humanodeCodexReference,
} from "@/data/humanodeCodex";
import { cn } from "@/lib/utils";

type CodexHintProps = {
  children: ReactNode;
  className?: string;
  reference: string;
  underline?: boolean;
};

type TypedCodexHintProps = Omit<CodexHintProps, "reference"> & {
  code: string;
};

const CODEX_REFERENCE_PATTERN =
  /\b(?:court-codex-v1|HC-\d+(?:\.[A-Z0-9-]+)+|(?:SEC|OPS|IDN|GOV|CMP)-\d{2}|[CPGDRE]-\d{2}|L[0-4]|E[0-3])\b/g;

export function CodexHint({
  children,
  className,
  reference,
  underline = true,
}: CodexHintProps) {
  const entry = humanodeCodexReference(reference);
  if (!entry) return <>{children}</>;

  return (
    <ReferenceHint
      actionLabel="Humanode Codex"
      description={entry.description}
      href={humanodeCodexHref(entry.ref)}
      noUnderline
      title={`${entry.ref} · ${entry.title}`}
    >
      <span
        className={cn(
          "font-semibold text-inherit",
          underline && "hint-underline",
          className,
        )}
      >
        {children}
      </span>
    </ReferenceHint>
  );
}

export function CodexOffenseHint({ code, ...props }: TypedCodexHintProps) {
  return <CodexHint {...props} reference={code} />;
}

export function CodexMeasureHint({ code, ...props }: TypedCodexHintProps) {
  return <CodexHint {...props} reference={code} />;
}

export function CodexSeverityHint({ code, ...props }: TypedCodexHintProps) {
  return <CodexHint {...props} reference={code} />;
}

export function CodexEvidenceHint({ code, ...props }: TypedCodexHintProps) {
  return <CodexHint {...props} reference={code} />;
}

export function CodexPolicyHint({
  children,
  ...props
}: Omit<CodexHintProps, "reference">) {
  return (
    <CodexHint {...props} reference="court-codex-v1">
      {children}
    </CodexHint>
  );
}

export function CodexProcedureHint({
  children,
  clause,
  ...props
}: Omit<CodexHintProps, "reference"> & { clause: `HC-2.${number}` }) {
  return (
    <CodexHint {...props} reference={clause}>
      {children}
    </CodexHint>
  );
}

export function CodexReferencedText({
  className,
  text,
}: {
  className?: string;
  text: string;
}) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(CODEX_REFERENCE_PATTERN)) {
    const index = match.index;
    const reference = match[0];
    if (index > cursor) parts.push(text.slice(cursor, index));
    parts.push(
      <CodexHint
        key={`${index}-${reference}`}
        className={className}
        reference={reference}
      >
        {reference}
      </CodexHint>,
    );
    cursor = index + reference.length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts.length ? parts : text}</>;
}
