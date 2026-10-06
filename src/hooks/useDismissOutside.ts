import { useEffect, type RefObject } from "react";

export function useDismissOutside(
  active: boolean,
  container: RefObject<HTMLElement | null>,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!active) return;
    let pointerActive = false;
    const pointerDown = () => {
      pointerActive = true;
    };
    const pointerEnd = () => {
      pointerActive = false;
    };
    const dismiss = (event: Event) => {
      if (
        container.current &&
        !event.composedPath().includes(container.current)
      )
        onDismiss();
    };
    // Dismissing mid-click can move the clicked control as the page shrinks.
    const focusOutside = (event: Event) => {
      if (!pointerActive) dismiss(event);
    };
    document.addEventListener("pointerdown", pointerDown);
    document.addEventListener("pointerup", pointerEnd);
    document.addEventListener("pointercancel", pointerEnd);
    document.addEventListener("click", dismiss);
    document.addEventListener("focusin", focusOutside);
    return () => {
      document.removeEventListener("pointerdown", pointerDown);
      document.removeEventListener("pointerup", pointerEnd);
      document.removeEventListener("pointercancel", pointerEnd);
      document.removeEventListener("click", dismiss);
      document.removeEventListener("focusin", focusOutside);
    };
  }, [active, container, onDismiss]);
}
