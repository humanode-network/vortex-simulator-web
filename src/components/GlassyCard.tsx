import type * as React from "react";

import { cn } from "@/lib/utils";
import { Surface } from "@/components/Surface";

type GlassyCardProps = React.HTMLAttributes<HTMLElement> & {
  as?: "article" | "div";
};

export function GlassyCard({
  as = "div",
  className,
  ...props
}: GlassyCardProps) {
  return (
    <Surface
      as={as}
      variant="glass"
      radius="2xl"
      shadow="card"
      className={cn("overflow-hidden", className)}
      {...props}
    />
  );
}
