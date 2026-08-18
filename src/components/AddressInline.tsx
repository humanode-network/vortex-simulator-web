import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Check, Copy } from "lucide-react";
import { shortAddress } from "@/lib/profileUi";

type AddressInlineProps = {
  address?: string | null;
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
  const normalizedAddress = address?.trim() ?? "";

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    if (!normalizedAddress) return;
    try {
      await navigator.clipboard?.writeText(normalizedAddress);
      setCopied(true);
    } catch {
      // Ignore clipboard errors; the UI still shows the formatted address.
    }
  };

  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1 ${className ?? ""}`.trim()}
    >
      {normalizedAddress ? (
        <Link
          to={`/app/human-nodes/${encodeURIComponent(normalizedAddress)}`}
          title={normalizedAddress}
          className={`min-w-0 truncate font-mono text-xs text-text hover:underline ${textClassName ?? ""}`.trim()}
        >
          {shortAddress(normalizedAddress, size)}
        </Link>
      ) : (
        <span
          className={`min-w-0 truncate text-xs text-muted ${textClassName ?? ""}`.trim()}
        >
          Unknown address
        </span>
      )}
      {showCopy && normalizedAddress ? (
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
