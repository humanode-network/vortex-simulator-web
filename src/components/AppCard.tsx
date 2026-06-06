import React from "react";
import { cn } from "@/lib/utils";
import { GlassyCard } from "@/components/GlassyCard";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";

type AppCardProps = {
  title: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  surface?: "panel" | "glass";
};

export const AppCard: React.FC<AppCardProps> = ({
  title,
  badge,
  children,
  footer,
  className,
  surface = "panel",
}) => {
  const Root = surface === "glass" ? GlassyCard : Card;

  return (
    <Root className={cn("h-full", className)}>
      <CardHeader className="relative pb-0">
        {badge ? (
          <div className="absolute top-4 right-4 z-10">{badge}</div>
        ) : null}
        <div className="flex min-h-16 items-center justify-center text-center">
          <CardTitle className="leading-tight">{title}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">{children}</CardContent>

      {footer ? <CardFooter className="pt-0">{footer}</CardFooter> : null}
    </Root>
  );
};

export default AppCard;
