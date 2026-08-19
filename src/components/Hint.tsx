import React, { useEffect, useId, useMemo, useRef, useState } from "react";
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

type OverlayPosition = {
  maxHeight: number;
  placement: "above" | "below";
  x: number;
  y: number;
};

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
  const roomBelow = Math.max(
    0,
    window.innerHeight - rect.bottom - OVERLAY_GAP - VIEWPORT_MARGIN,
  );
  const roomAbove = Math.max(0, rect.top - OVERLAY_GAP - VIEWPORT_MARGIN);
  const placement =
    roomBelow >= OVERLAY_HEIGHT || roomBelow >= roomAbove ? "below" : "above";

  return {
    maxHeight: Math.max(96, placement === "below" ? roomBelow : roomAbove),
    placement,
    x: clamp(
      rect.left + rect.width / 2 - OVERLAY_WIDTH / 2,
      VIEWPORT_MARGIN,
      Math.max(VIEWPORT_MARGIN, maxLeft),
    ),
    y:
      placement === "below"
        ? rect.bottom + OVERLAY_GAP
        : rect.top - OVERLAY_GAP,
  };
}

// Headless hover logic: track position, visibility, and “stable” state after dwell.
const useHoverOverlay = (dwellMs: number) => {
  const [visible, setVisible] = useState(false);
  const [stable, setStable] = useState(false);
  const [position, setPosition] = useState<OverlayPosition>({
    maxHeight: OVERLAY_HEIGHT,
    placement: "below",
    x: 0,
    y: 0,
  });
  const hoverTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const hoveringRef = useRef(false);

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const clearHideTimer = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const clearTimers = () => {
    clearHoverTimer();
    clearHideTimer();
  };

  const showAt = (pos: OverlayPosition, immediatelyStable = false) => {
    setPosition(pos);
    setVisible(true);
    clearTimers();
    setStable(immediatelyStable);
    if (!immediatelyStable) {
      hoverTimer.current = window.setTimeout(() => setStable(true), dwellMs);
    }
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
      if (on) {
        clearHideTimer();
        return;
      }
      if (!on && stable) {
        hide();
      }
    },
    showAt,
    hide,
  };
};

type OverlayPortalProps = {
  id: string;
  interactive: boolean;
  label: string;
  visible: boolean;
  position: OverlayPosition;
  children: React.ReactNode;
};

// Thin portal that positions content near the hovered term while escaping
// clipping and stacking contexts created by page surfaces.
const OverlayPortal: React.FC<OverlayPortalProps> = ({
  id,
  interactive,
  label,
  visible,
  position,
  children,
}) => {
  if (!visible || typeof document === "undefined") return null;
  const overlay = (
    <div
      id={id}
      aria-label={label}
      className="fixed z-[100] max-w-none min-w-0"
      role="dialog"
      style={{
        top: position.y,
        left: position.x,
        width: `min(${OVERLAY_WIDTH}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`,
        pointerEvents: interactive ? "auto" : "none",
        transform:
          position.placement === "above" ? "translateY(-100%)" : undefined,
      }}
    >
      <div
        className="animate-in overflow-y-auto zoom-in-95 fade-in"
        style={{ maxHeight: position.maxHeight }}
      >
        {children}
      </div>
    </div>
  );
  return createPortal(overlay, document.body);
};

type HintSurfaceProps = {
  actionLabel: string;
  title: string;
  description: string;
  stable: boolean;
  onNavigate?: () => void;
};

// UI surface: renders the styled card for any hint content.
const HintSurface: React.FC<HintSurfaceProps> = ({
  actionLabel,
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
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
};

type HintProps = {
  termId: string;
  children: React.ReactNode;
  dwellMs?: number;
  interactiveTrigger?: boolean;
  noUnderline?: boolean;
};

type ReferenceHintProps = {
  actionLabel: string;
  children: React.ReactNode;
  description: string;
  dwellMs?: number;
  href: string;
  interactiveTrigger?: boolean;
  noUnderline?: boolean;
  title: string;
};

/** Shared anchored reference hint used by Vortexopedia and policy sources. */
export const ReferenceHint: React.FC<ReferenceHintProps> = ({
  actionLabel,
  children,
  description,
  dwellMs = 2200,
  href,
  interactiveTrigger = true,
  noUnderline,
  title,
}) => {
  const navigate = useNavigate();
  const overlay = useHoverOverlay(dwellMs);
  const popupId = useId();
  const lastPointerType = useRef<string | null>(null);

  const showFrom = (element: HTMLElement, immediatelyStable = false) => {
    overlay.showAt(getAnchorPosition(element), immediatelyStable);
  };

  const openReference = () => navigate(href);

  return (
    <span className="relative inline-flex items-center align-baseline">
      <span
        aria-controls={
          interactiveTrigger && overlay.visible ? popupId : undefined
        }
        aria-expanded={interactiveTrigger ? overlay.visible : undefined}
        aria-haspopup={interactiveTrigger ? "dialog" : undefined}
        aria-label={
          interactiveTrigger ? `${title}. Open in ${actionLabel}.` : undefined
        }
        className={cn(
          "hint-trigger tracking-normal whitespace-pre-wrap normal-case",
          noUnderline && "no-underline",
        )}
        role={interactiveTrigger ? "link" : undefined}
        tabIndex={interactiveTrigger ? 0 : undefined}
        onFocus={
          interactiveTrigger
            ? (event) => {
                if (lastPointerType.current) return;
                showFrom(event.currentTarget, true);
              }
            : undefined
        }
        onBlur={
          interactiveTrigger
            ? () => {
                lastPointerType.current = null;
                overlay.setHovering(false);
                overlay.hide();
              }
            : undefined
        }
        onClick={
          interactiveTrigger
            ? (event) => {
                event.preventDefault();
                event.stopPropagation();
                const pointerType = lastPointerType.current;
                lastPointerType.current = null;
                if (pointerType === "touch") {
                  showFrom(event.currentTarget, true);
                  return;
                }
                openReference();
              }
            : undefined
        }
        onKeyDown={
          interactiveTrigger
            ? (event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  overlay.hide(true);
                  return;
                }
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  openReference();
                }
              }
            : undefined
        }
        onMouseEnter={(event) => showFrom(event.currentTarget)}
        onMouseLeave={() => {
          overlay.setHovering(false);
          overlay.hide();
        }}
        onPointerDown={
          interactiveTrigger
            ? (event) => {
                lastPointerType.current = event.pointerType;
              }
            : undefined
        }
        onPointerCancel={
          interactiveTrigger
            ? () => {
                lastPointerType.current = null;
              }
            : undefined
        }
      >
        {children}
      </span>
      <OverlayPortal
        id={popupId}
        interactive={overlay.stable}
        label={`${title} reference preview`}
        visible={overlay.visible}
        position={overlay.position}
      >
        <div
          onBlurCapture={(event) => {
            if (
              event.currentTarget.contains(event.relatedTarget as Node | null)
            )
              return;
            overlay.setHovering(false);
            overlay.hide();
          }}
          onFocusCapture={() => overlay.setHovering(true)}
          onMouseEnter={() => overlay.setHovering(true)}
          onMouseLeave={() => {
            overlay.setHovering(false);
            overlay.hide();
          }}
        >
          <HintSurface
            actionLabel={actionLabel}
            title={title}
            description={description}
            stable={overlay.stable}
            onNavigate={openReference}
          />
        </div>
      </OverlayPortal>
    </span>
  );
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
  interactiveTrigger,
  noUnderline,
}) => {
  const term = useMemo(() => getVortexopediaTerm(termId), [termId]);
  if (!term) {
    return <span>{children}</span>;
  }

  return (
    <ReferenceHint
      actionLabel="Vortexopedia"
      description={term.short}
      dwellMs={dwellMs}
      href={`/app/vortexopedia?term=${term.id}`}
      interactiveTrigger={interactiveTrigger}
      noUnderline={noUnderline}
      title={term.name}
    >
      {children}
    </ReferenceHint>
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
  interactiveTrigger?: boolean;
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
  interactiveTrigger,
}) => {
  const content = children ?? termText ?? "";
  return (
    <Hint termId={termId} interactiveTrigger={interactiveTrigger} noUnderline>
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
