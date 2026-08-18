import { lazy, Suspense } from "react";

import { safeExternalHref } from "@/lib/safeExternalHref";
import { cn } from "@/lib/utils";
import "./ProposalNarrative.css";

export type ProposalNarrativeValue = string | string[];

export type ProposalNarrativeEditorProps = {
  documentLabel?: string;
  id: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  value: string;
};

type NarrativeBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "ordered-list"; items: string[] }
  | { type: "unordered-list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "paragraph"; text: string };

function narrativeSource(value: ProposalNarrativeValue): string {
  return Array.isArray(value) ? value.join("\n\n") : value;
}

function cleanText(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

function parseNarrative(value: ProposalNarrativeValue): NarrativeBlock[] {
  const lines = cleanText(narrativeSource(value)).split("\n");
  const blocks: NarrativeBlock[] = [];
  let paragraph: string[] = [];
  let list: {
    type: "ordered-list" | "unordered-list";
    items: string[];
  } | null = null;

  const flushParagraph = () => {
    const text = paragraph.join(" ").replace(/\s+/g, " ").trim();
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = [];
  };
  const flushList = () => {
    if (list && list.items.length > 0) blocks.push(list);
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: heading[1].length >= 3 ? 3 : 2,
        text: heading[2],
      });
      continue;
    }

    const quote = /^>\s*(.+)$/.exec(line);
    if (quote) {
      flushParagraph();
      flushList();
      blocks.push({ type: "quote", text: quote[1] });
      continue;
    }

    const unordered = /^(?:[-*+])\s+(.+)$/.exec(line);
    const ordered = /^\d+[.)]\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      flushParagraph();
      const type = ordered ? "ordered-list" : "unordered-list";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((ordered ?? unordered)![1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export function safeNarrativeHref(rawHref: string): string | null {
  return safeExternalHref(rawHref);
}

function NarrativeInline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\[[^\]]+\]\([^\s)]+\))/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={`${part}-${index}`}
              className="rounded bg-[color:var(--control-glass-bg)] px-1 py-0.5 text-[0.9em] text-text"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        const link = /^\[([^\]]+)\]\(([^\s)]+)\)$/.exec(part);
        if (link) {
          const href = safeNarrativeHref(link[2]);
          return href ? (
            <a
              key={`${part}-${index}`}
              className="text-primary underline decoration-primary/50 underline-offset-2 hover:decoration-primary"
              href={href}
              rel="noreferrer"
              target="_blank"
            >
              {link[1]}
            </a>
          ) : (
            <span key={`${part}-${index}`}>{link[1]}</span>
          );
        }
        return part;
      })}
    </>
  );
}

export function ProposalNarrative({
  className,
  value,
}: {
  className?: string;
  value: ProposalNarrativeValue;
}) {
  const blocks = parseNarrative(value);
  if (blocks.length === 0) return null;

  return (
    <div className={cn("proposal-narrative", className)}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h3" : "h4";
          return (
            <Tag key={key} className="proposal-narrative__heading">
              <NarrativeInline text={block.text} />
            </Tag>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={key} className="proposal-narrative__quote">
              <NarrativeInline text={block.text} />
            </blockquote>
          );
        }
        if (block.type === "ordered-list" || block.type === "unordered-list") {
          const Tag = block.type === "ordered-list" ? "ol" : "ul";
          return (
            <Tag key={key} className="proposal-narrative__list">
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>
                  <NarrativeInline text={item} />
                </li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={key} className="proposal-narrative__paragraph">
            <NarrativeInline text={block.text} />
          </p>
        );
      })}
    </div>
  );
}

const TiptapNarrativeEditor = lazy(() => import("./ProposalNarrativeEditor"));

export function ProposalNarrativeEditor(props: ProposalNarrativeEditorProps) {
  return (
    <Suspense
      fallback={
        <div
          aria-label={`Preparing ${props.documentLabel?.toLowerCase() ?? "proposal"} editor`}
          className="proposal-narrative-editor proposal-narrative-editor--loading"
          role="status"
          style={{ minHeight: `calc(${props.rows ?? 7} * 1.6em + 5.5rem)` }}
        />
      }
    >
      <TiptapNarrativeEditor {...props} />
    </Suspense>
  );
}
