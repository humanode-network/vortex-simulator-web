import * as React from "react";
import { cn } from "@/lib/utils";

type SpanProps = {
  base?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

type GridProps = React.HTMLAttributes<HTMLDivElement> & {
  cols?: number;
  gap?: "2" | "3" | "4" | "5" | "6";
};

export function Grid({ className, cols = 12, gap = "4", children, ...rest }: GridProps) {
  // Defaults to single column on mobile, N columns on md+.
  const colClass = cols === 12 ? "grid-cols-1 md:grid-cols-12" : `grid-cols-1 md:grid-cols-${cols}`;
  return (
    <div className={cn("grid", colClass, `gap-${gap}`, className)} {...rest}>
      {children}
    </div>
  );
}

type ColProps = React.HTMLAttributes<HTMLDivElement> & {
  span?: SpanProps;
};

const spanClass = (prefix: string, value?: number) => {
  if (!value) return "";
  return `${prefix}col-span-${value}`;
};

export function Col({ className, children, span = { base: 12 }, ...rest }: ColProps) {
  const { base = 12, sm, md, lg, xl } = span;
  const classes = cn(
    spanClass("", base),
    spanClass("sm:", sm),
    spanClass("md:", md),
    spanClass("lg:", lg),
    spanClass("xl:", xl),
    className,
  );
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
