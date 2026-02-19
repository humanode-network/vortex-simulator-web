import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { shortAddress } from "@/lib/profileUi";

type AddressInlineProps = {
  address: string;
  size?: number;
  className?: string;
  textClassName?: string;
  showCopy?: boolean;
};

export const AddressInline: React.FC<AddressInlineProps> = ({
  address,
  size = 4,
  className,
  textClassName,
  showCopy = true,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(address);
      setCopied(true);
    } catch {
      // Ignore clipboard errors; the UI still shows the formatted address.
    }
  };

  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1 ${className ?? ""}`.trim()}
    >
      <span
        title={address}
        className={`min-w-0 truncate font-mono text-xs ${textClassName ?? ""}`.trim()}
      >
        {shortAddress(address, size)}
      </span>
      {showCopy ? (
        <button
          type="button"
          className="hover:bg-surface-alt inline-flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:text-text"
          aria-label={copied ? "Copied" : "Copy address"}
          title={copied ? "Copied" : "Copy address"}
          onClick={() => void copy()}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      ) : null}
    </span>
  );
};
