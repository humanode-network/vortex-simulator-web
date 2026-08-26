import * as React from "react";
import { ReferenceHint } from "@/components/Hint";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/Surface";
import { Kicker } from "@/components/Kicker";

type StatusPillProps = {
  label: string;
  value: string;
  active?: boolean;
  className?: string;
  hint?: {
    description: string;
    href: string;
    title: string;
  };
  widthClassName?: string;
};

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  value,
  active,
  className,
  hint,
  widthClassName = "w-48",
}) => {
  return (
    <Surface
      variant="glass"
      radius="full"
      shadow="control"
      className={cn(
        "inline-flex items-center justify-between px-4 py-2",
        widthClassName,
        className,
      )}
    >
      <Kicker as="span">
        {hint ? (
          <ReferenceHint
            actionLabel="Vortexopedia"
            description={hint.description}
            href={hint.href}
            noUnderline
            title={hint.title}
          >
            {label}
          </ReferenceHint>
        ) : (
          label
        )}
      </Kicker>
      <span
        className={cn(
          "font-semibold",
          active === true
            ? "text-primary"
            : active === false
              ? "text-muted"
              : "",
        )}
      >
        {value}
      </span>
    </Surface>
  );
};
