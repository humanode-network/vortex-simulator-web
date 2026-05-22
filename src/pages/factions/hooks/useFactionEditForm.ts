import { useEffect, useState } from "react";

import type { FactionDto } from "@/types/api";

type FactionVisibility = "public" | "private";

export type FactionEditPayload = {
  description: string;
  focus: string;
  goals: string[];
  name: string;
  tags: string[];
  visibility: FactionVisibility;
};

export function useFactionEditForm(faction: FactionDto | null) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [focus, setFocus] = useState("");
  const [visibility, setVisibility] = useState<FactionVisibility>("public");
  const [goalsText, setGoalsText] = useState("");
  const [tagsText, setTagsText] = useState("");

  useEffect(() => {
    if (!faction) return;
    setName(faction.name);
    setDescription(faction.description);
    setFocus(faction.focus || "General");
    setVisibility(faction.visibility === "private" ? "private" : "public");
    setGoalsText((faction.goals ?? []).join("\n"));
    setTagsText((faction.tags ?? []).join(", "));
  }, [faction]);

  const toggleOpen = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

  const payload = (): FactionEditPayload => ({
    name: name.trim(),
    description: description.trim(),
    focus: focus.trim(),
    visibility,
    goals: goalsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    tags: tagsText
      .split(",")
      .map((line) => line.trim())
      .filter(Boolean),
  });

  return {
    close,
    description,
    focus,
    goalsText,
    name,
    open,
    payload,
    setDescription,
    setFocus,
    setGoalsText,
    setName,
    setTagsText,
    setVisibility,
    tagsText,
    toggleOpen,
    visibility,
  };
}
