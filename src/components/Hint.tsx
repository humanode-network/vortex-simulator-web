import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import { getVortexopediaTerm } from "@/data/vortexopediaLookup";
import "./Hint.css";

type OverlayPosition = { x: number; y: number };

const OVERLAY_WIDTH = 320;
const OVERLAY_HEIGHT = 240;
const OVERLAY_GAP = 10;
const VIEWPORT_MARGIN = 12;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getAnchorPosition(element: HTMLElement): OverlayPosition {
  const rect = element.getBoundingClientRect();
  const maxLeft = window.innerWidth - OVERLAY_WIDTH - VIEWPORT_MARGIN;
  const maxTop = window.innerHeight - OVERLAY_HEIGHT - VIEWPORT_MARGIN;

  return {
    x: clamp(
      rect.left + rect.width / 2 - OVERLAY_WIDTH / 2,
      VIEWPORT_MARGIN,
      Math.max(VIEWPORT_MARGIN, maxLeft),
    ),
    y: clamp(
      rect.bottom + OVERLAY_GAP,
      VIEWPORT_MARGIN,
      Math.max(VIEWPORT_MARGIN, maxTop),
    ),
  };
}

// Headless hover logic: track position, visibility, and “stable” state after dwell.
const useHoverOverlay = (dwellMs: number) => {
  const [visible, setVisible] = useState(false);
  const [stable, setStable] = useState(false);
  const [position, setPosition] = useState<OverlayPosition>({ x: 0, y: 0 });
  const hoverTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const hoveringRef = useRef(false);

  const clearTimers = () => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const showAt = (pos: OverlayPosition) => {
    setPosition(pos);
    setVisible(true);
    setStable(false);
    clearTimers();
    hoverTimer.current = window.setTimeout(() => setStable(true), dwellMs);
  };

  const hide = (force = false) => {
    if (!stable || force) {
      clearTimers();
      setVisible(false);
      setStable(false);
      return;
    }
    hideTimer.current = window.setTimeout(() => {
      if (!hoveringRef.current) {
        setVisible(false);
        setStable(false);
      }
    }, 180);
  };

  useEffect(() => () => clearTimers(), []);

  return {
    visible,
    stable,
    position,
    setHovering: (on: boolean) => {
      hoveringRef.current = on;
      if (!on && stable) {
        hide();
      }
    },
    showAt,
    hide,
  };
};

type OverlayPortalProps = {
  interactive: boolean;
  visible: boolean;
  position: OverlayPosition;
  children: React.ReactNode;
};

// Thin portal that positions content near the hovered term while escaping
// clipping and stacking contexts created by page surfaces.
const OverlayPortal: React.FC<OverlayPortalProps> = ({
  interactive,
  visible,
  position,
  children,
}) => {
  if (!visible || typeof document === "undefined") return null;
  const overlay = (
    <div
      className="fixed z-[100] max-w-[360px] min-w-[260px] animate-in zoom-in-95 fade-in"
      style={{
        top: position.y,
        left: position.x,
        pointerEvents: interactive ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
  return createPortal(overlay, document.body);
};

type HintSurfaceProps = {
  title: string;
  description: string;
  stable: boolean;
  onNavigate?: () => void;
};

// UI surface: renders the styled card for any hint content.
const HintSurface: React.FC<HintSurfaceProps> = ({
  title,
  description,
  stable,
  onNavigate,
}) => {
  return (
    <Card className={cn("hint-card", stable && "stable")}>
      <CardHeader className="px-4 pt-3 pb-2">
        <CardTitle className="text-sm font-semibold text-text">
          {title}
        </CardTitle>
        <p className="hint-desc text-sm leading-relaxed text-muted">
          {description}
        </p>
      </CardHeader>
      <CardContent className="hint-actions flex justify-center px-4 pt-1 pb-3">
        <Button
          size="sm"
          variant="primary"
          className="text-xs"
          onClick={onNavigate}
        >
          Vortexopedia
        </Button>
      </CardContent>
    </Card>
  );
};

type HintProps = {
  termId: string;
  children: React.ReactNode;
  dwellMs?: number;
  noUnderline?: boolean;
};

/**
 * Hint wraps inline text with an underlined hover-triggered tooltip that pulls
 * definitions from the Vortexopedia data set. It uses a headless hover hook,
 * a styled surface, and a data-binding layer for clarity.
 */
export const Hint: React.FC<HintProps> = ({
  termId,
  dwellMs = 2200,
  children,
  noUnderline,
}) => {
  const term = useMemo(() => getVortexopediaTerm(termId), [termId]);
  const navigate = useNavigate();
  const overlay = useHoverOverlay(dwellMs);

  if (!term) {
    return <span>{children}</span>;
  }

  return (
    <span className="relative inline-flex items-center align-baseline">
      <span
        className={cn(
          "hint-trigger tracking-normal whitespace-pre-wrap normal-case",
          noUnderline && "no-underline",
        )}
        onMouseEnter={(e) => overlay.showAt(getAnchorPosition(e.currentTarget))}
        onMouseLeave={() => {
          overlay.setHovering(false);
          overlay.hide();
        }}
      >
        {children}
      </span>
      <OverlayPortal
        interactive={overlay.stable}
        visible={overlay.visible}
        position={overlay.position}
      >
        <div
          onMouseEnter={() => overlay.setHovering(true)}
          onMouseLeave={() => {
            overlay.setHovering(false);
            overlay.hide();
          }}
        >
          <HintSurface
            title={term.name}
            description={term.short}
            stable={overlay.stable}
            onNavigate={() => navigate(`/app/vortexopedia?term=${term.id}`)}
          />
        </div>
      </OverlayPortal>
    </span>
  );
};

type HintLabelProps = {
  termId: string;
  prefix?: string;
  termText?: string;
  children?: React.ReactNode;
  suffix?: string;
  underline?: boolean;
  className?: string;
};

/**
 * HintLabel helps when only a portion of a label should be underlined/linked to a hint.
 */
export const HintLabel: React.FC<HintLabelProps> = ({
  termId,
  prefix,
  termText,
  children,
  suffix,
  underline = true,
  className,
}) => {
  const content = children ?? termText ?? "";
  return (
    <Hint termId={termId} noUnderline>
      <span
        className={cn(
          "inline-flex items-center space-x-1 align-baseline text-inherit",
          className,
        )}
      >
        {prefix && <span className="font-normal">{prefix}</span>}
        <span
          className={cn(
            "font-semibold text-inherit",
            underline && "hint-underline",
          )}
        >
          {content}
        </span>
        {suffix && <span className="font-normal">{suffix}</span>}
      </span>
    </Hint>
  );
};
