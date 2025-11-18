import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function Tabs({ value, onValueChange, options, className, ...props }: TabsProps) {
  return (
    <div className={cn("inline-flex rounded-full border border-border bg-[color:var(--panel)] p-1", className)} {...props}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "min-w-[90px] rounded-full px-3 py-1.5 text-sm font-medium transition",
              active
                ? "bg-[color:var(--primary)] text-white shadow"
                : "text-(--text) hover:bg-[color:var(--panel-alt)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
