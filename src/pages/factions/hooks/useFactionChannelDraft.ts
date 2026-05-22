import { useState } from "react";

type FactionChannelScope = "stewards" | "members";

export function useFactionChannelDraft() {
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<FactionChannelScope>("members");

  return {
    payload: () => ({
      title: title.trim(),
      writeScope: scope,
    }),
    reset: () => setTitle(""),
    scope,
    setScope,
    setTitle,
    title,
  };
}
