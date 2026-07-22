import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";

import type { LinkItem } from "./types";

type EditableLinkListProps = {
  emptyMessage?: string;
  items: LinkItem[];
  labelPlaceholder: string;
  onChange: (id: string, field: "label" | "url", value: string) => void;
  onRemove: (id: string) => void;
  urlPlaceholder: string;
};

export function EditableLinkList({
  emptyMessage,
  items,
  labelPlaceholder,
  onChange,
  onRemove,
  urlPlaceholder,
}: EditableLinkListProps) {
  if (items.length === 0) {
    return emptyMessage ? (
      <p className="text-sm text-muted">{emptyMessage}</p>
    ) : null;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="proposal-wizard__collection-row grid gap-2 sm:grid-cols-[220px_1fr_auto]"
        >
          <Input
            value={item.label}
            onChange={(event) => onChange(item.id, "label", event.target.value)}
            placeholder={labelPlaceholder}
          />
          <Input
            value={item.url}
            onChange={(event) => onChange(item.id, "url", event.target.value)}
            placeholder={urlPlaceholder}
          />
          <Button
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => onRemove(item.id)}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}
