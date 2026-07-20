import { useRef } from "react";

import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import "./ProposalNarrative.css";

export type ProposalNarrativeValue = string | string[];

type NarrativeBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "ordered-list"; items: string[] }
  | { type: "unordered-list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "paragraph"; text: string };

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

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

function safeHref(rawHref: string): string | null {
  try {
    const href = new URL(rawHref, "https://vortex.local");
    return SAFE_LINK_PROTOCOLS.has(href.protocol) ? href.href : null;
  } catch {
    return null;
  }
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
          const href = safeHref(link[2]);
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

type NarrativeCommand =
  | "heading"
  | "ordered-list"
  | "unordered-list"
  | "quote"
  | "code"
  | "link";

const editorCommands: Array<{ command: NarrativeCommand; label: string }> = [
  { command: "heading", label: "Heading" },
  { command: "unordered-list", label: "List" },
  { command: "ordered-list", label: "Numbered list" },
  { command: "quote", label: "Quote" },
  { command: "link", label: "Link" },
  { command: "code", label: "Code" },
];

function commandText(command: NarrativeCommand, selection: string): string {
  const content = selection || "Text";
  switch (command) {
    case "heading":
      return `## ${content}`;
    case "unordered-list":
      return `- ${content}`;
    case "ordered-list":
      return `1. ${content}`;
    case "quote":
      return `> ${content}`;
    case "code":
      return `\`${content}\``;
    case "link":
      return `[${content}](https://)`;
  }
}

export function ProposalNarrativeEditor({
  id,
  onChange,
  placeholder,
  rows = 7,
  value,
}: {
  id: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  value: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyCommand = (command: NarrativeCommand) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const inserted = commandText(command, value.slice(start, end));
    const next = `${value.slice(0, start)}${inserted}${value.slice(end)}`;
    onChange(next);
    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + inserted.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="proposal-narrative-editor">
      <div
        className="proposal-narrative-editor__toolbar"
        role="toolbar"
        aria-label="Proposal formatting"
      >
        {editorCommands.map(({ command, label }) => (
          <Button
            key={command}
            aria-label={label}
            aria-controls={id}
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => applyCommand(command)}
          >
            {label}
          </Button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        rows={rows}
        className="proposal-narrative-editor__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <p className="proposal-narrative-editor__hint">
        Use the controls to structure the proposal. Plain text stays a
        paragraph, and only explicit lists become bullets.
      </p>
    </div>
  );
}
