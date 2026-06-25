import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import "./Surface.css";

type PolymorphicRef<C extends React.ElementType> =
  React.ComponentPropsWithRef<C>["ref"];

const surfaceVariants = cva(
  "vortex-surface border bg-cover bg-no-repeat ring-1 ring-inset transition-colors duration-150",
  {
    variants: {
      variant: {
        panel:
          "vortex-surface--glass border-[color:var(--surface-glass-border)] ring-[color:var(--surface-glass-ring)] hover:border-[color:var(--surface-glass-hover-border)] supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:backdrop-saturate-150",
        panelAlt:
          "vortex-surface--glass border-[color:var(--surface-glass-border)] ring-[color:var(--surface-glass-ring)] hover:border-[color:var(--surface-glass-hover-border)] supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:backdrop-saturate-150",
        glass:
          "vortex-surface--glass border-[color:var(--surface-glass-border)] ring-[color:var(--surface-glass-ring)] hover:border-[color:var(--surface-glass-hover-border)] supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:backdrop-saturate-150",
        transparent: "vortex-surface--transparent",
      },
      radius: {
        md: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
        full: "rounded-full",
      },
      shadow: {
        none: "",
        control: "shadow-[var(--shadow-control)]",
        tile: "shadow-[var(--shadow-tile)]",
        card: "shadow-[var(--shadow-card)]",
        popover: "shadow-[var(--shadow-popover)]",
        primary: "shadow-[var(--shadow-primary)]",
      },
      borderStyle: {
        solid: "",
        dashed: "border-dashed",
      },
    },
    defaultVariants: {
      variant: "panel",
      radius: "2xl",
      shadow: "tile",
      borderStyle: "solid",
    },
  },
);

type SurfaceOwnProps = VariantProps<typeof surfaceVariants> & {
  className?: string;
};

type SurfacePropKeys =
  | "variant"
  | "radius"
  | "shadow"
  | "borderStyle"
  | "className";

export type SurfaceProps<C extends React.ElementType = "div"> =
  SurfaceOwnProps & { as?: C } & Omit<
      React.ComponentPropsWithoutRef<C>,
      SurfacePropKeys | "as"
    >;

type SurfaceComponent = <C extends React.ElementType = "div">(
  props: SurfaceProps<C> & { ref?: PolymorphicRef<C> },
) => React.ReactElement | null;

type SurfacePropsAny = SurfaceProps<React.ElementType>;

const SurfaceImpl = React.forwardRef(function Surface(
  {
    as,
    className,
    onPointerLeave,
    onPointerMove,
    variant,
    radius,
    shadow,
    borderStyle,
    ...props
  }: SurfacePropsAny,
  ref: React.ForwardedRef<Element>,
) {
  const Comp = as ?? "div";
  const hasRipple = variant !== "transparent";

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<Element>) => {
      onPointerMove?.(event);
      if (!hasRipple) return;

      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      target.style.setProperty(
        "--surface-ripple-x",
        `${event.clientX - rect.left}px`,
      );
      target.style.setProperty(
        "--surface-ripple-y",
        `${event.clientY - rect.top}px`,
      );
    },
    [hasRipple, onPointerMove],
  );

  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent<Element>) => {
      onPointerLeave?.(event);
      if (!hasRipple) return;

      const target = event.currentTarget as HTMLElement;
      target.style.removeProperty("--surface-ripple-x");
      target.style.removeProperty("--surface-ripple-y");
    },
    [hasRipple, onPointerLeave],
  );

  return (
    <Comp
      ref={ref}
      className={cn(
        surfaceVariants({ variant, radius, shadow, borderStyle }),
        hasRipple && "vortex-surface--ripple",
        className,
      )}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      {...props}
    />
  );
});
SurfaceImpl.displayName = "Surface";

export const Surface = SurfaceImpl as SurfaceComponent;
