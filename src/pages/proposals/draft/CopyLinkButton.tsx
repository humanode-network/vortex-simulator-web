import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/primitives/button";

type CopyLinkButtonProps = {
  value: string;
  onError?: (message: string) => void;
};

export function CopyLinkButton({ value, onError }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    setCopied(false);
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, [value]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        new URL(value, window.location.origin).toString(),
      );
      setCopied(true);
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      onError?.("Could not copy the public draft link.");
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="min-w-[5.5rem]"
      onClick={() => void copy()}
    >
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
