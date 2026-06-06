import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";

type FactionEditCardProps = {
  description: string;
  focus: string;
  goalsText: string;
  mutating: boolean;
  name: string;
  onArchive: () => void;
  onDescriptionChange: (value: string) => void;
  onFocusChange: (value: string) => void;
  onGoalsTextChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSave: () => void;
  onTagsTextChange: (value: string) => void;
  onVisibilityChange: (value: "public" | "private") => void;
  tagsText: string;
  visibility: "public" | "private";
};

export function FactionEditCard({
  description,
  focus,
  goalsText,
  mutating,
  name,
  onArchive,
  onDescriptionChange,
  onFocusChange,
  onGoalsTextChange,
  onNameChange,
  onSave,
  onTagsTextChange,
  onVisibilityChange,
  tagsText,
  visibility,
}: FactionEditCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionHeader>Edit faction</SectionHeader>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Faction name"
        />
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Faction description"
        />
        <Input
          value={focus}
          onChange={(event) => onFocusChange(event.target.value)}
          placeholder="Focus"
        />
        <Select
          value={visibility}
          onChange={(event) =>
            onVisibilityChange(
              event.target.value === "private" ? "private" : "public",
            )
          }
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </Select>
        <textarea
          value={goalsText}
          onChange={(event) => onGoalsTextChange(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Goals, one per line"
        />
        <Input
          value={tagsText}
          onChange={(event) => onTagsTextChange(event.target.value)}
          placeholder="Tags, comma separated"
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={
              mutating ||
              name.trim().length < 2 ||
              description.trim().length < 2
            }
            onClick={onSave}
          >
            Save changes
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={mutating}
            onClick={onArchive}
          >
            Archive faction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
