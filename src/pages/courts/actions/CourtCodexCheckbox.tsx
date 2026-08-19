import { CodexHint } from "@/components/CodexHint";

export function CourtCodexCheckbox({
  checked,
  disabled,
  label,
  onChange,
  prefix,
  reference,
  suffix,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  prefix?: string;
  reference: string;
  suffix?: string;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text">
      <label className="flex min-w-0 items-center gap-2 font-medium">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>
          {prefix}
          {label}
          {suffix}
        </span>
      </label>
      <CodexHint reference={reference} underline={false}>
        <span className="text-xs text-primary">Codex definition</span>
      </CodexHint>
    </div>
  );
}
