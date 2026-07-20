import { useEffect, useId, useRef, useState } from "react";

import type { Editor } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { Button } from "@/components/primitives/button";
import {
  safeNarrativeHref,
  type ProposalNarrativeEditorProps,
} from "./ProposalNarrative";

const narrativeExtensions = [
  StarterKit.configure({
    bold: false,
    codeBlock: false,
    heading: { levels: [2, 3] },
    horizontalRule: false,
    italic: false,
    strike: false,
  }),
  Link.configure({
    autolink: true,
    defaultProtocol: "https",
    linkOnPaste: true,
    openOnClick: false,
    protocols: ["http", "https", "mailto"],
    validate: (url) => safeNarrativeHref(url) !== null,
  }),
  Markdown,
];

const editorCommands = [
  {
    label: "Heading",
    run: (editor: Editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "List",
    run: (editor: Editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Numbered list",
    run: (editor: Editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "Quote",
    run: (editor: Editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    label: "Code",
    run: (editor: Editor) => editor.chain().focus().toggleCode().run(),
  },
];

export default function ProposalNarrativeEditor({
  id,
  onChange,
  placeholder,
  rows = 7,
  value,
}: ProposalNarrativeEditorProps) {
  const linkInputRef = useRef<HTMLInputElement>(null);
  const descriptionId = useId();
  const linkInputId = useId();
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const emittedValueRef = useRef(value);
  const editor = useEditor({
    content: value,
    contentType: "markdown",
    editorProps: {
      attributes: {
        "aria-describedby": descriptionId,
        "aria-label": placeholder,
        "aria-multiline": "true",
        class: "proposal-narrative-editor__input",
        "data-placeholder": placeholder,
        id,
        role: "textbox",
        style: `--proposal-narrative-editor-rows: ${rows}`,
      },
    },
    extensions: narrativeExtensions,
    immediatelyRender: false,
    onUpdate: ({ editor: updatedEditor }) => {
      const nextValue = updatedEditor.getMarkdown();
      emittedValueRef.current = nextValue;
      onChange(nextValue);
    },
  });

  useEffect(() => {
    if (!editor || value === emittedValueRef.current) return;
    editor.commands.setContent(value, {
      contentType: "markdown",
      emitUpdate: false,
    });
    emittedValueRef.current = value;
  }, [editor, value]);

  const saveLink = () => {
    if (!editor || !linkUrl) return;
    const href = safeNarrativeHref(linkUrl);
    if (!href) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkUrl(null);
  };

  useEffect(() => {
    if (linkUrl !== null) linkInputRef.current?.focus();
  }, [linkUrl]);

  return (
    <div className="proposal-narrative-editor">
      <div
        className="proposal-narrative-editor__toolbar"
        role="toolbar"
        aria-label="Proposal formatting"
      >
        {editorCommands.map(({ label, run }) => (
          <Button
            key={label}
            aria-label={label}
            aria-controls={id}
            size="sm"
            type="button"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor && run(editor)}
          >
            {label}
          </Button>
        ))}
        <Button
          aria-label="Link"
          aria-controls={id}
          size="sm"
          type="button"
          variant="ghost"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            editor &&
            setLinkUrl(editor.getAttributes("link").href ?? "https://")
          }
        >
          Link
        </Button>
      </div>
      <EditorContent editor={editor} />
      {linkUrl !== null ? (
        <form
          className="proposal-narrative-editor__link-form"
          onSubmit={(event) => {
            event.preventDefault();
            saveLink();
          }}
        >
          <label className="sr-only" htmlFor={linkInputId}>
            Link URL
          </label>
          <input
            ref={linkInputRef}
            id={linkInputId}
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://example.org"
          />
          <Button type="submit" size="sm" variant="outline">
            Apply link
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setLinkUrl(null);
              editor?.commands.focus();
            }}
          >
            Cancel
          </Button>
        </form>
      ) : null}
      <p id={descriptionId} className="proposal-narrative-editor__hint">
        Use the formatting controls or standard editor shortcuts to structure
        the proposal. The saved proposal remains portable Markdown.
      </p>
    </div>
  );
}
