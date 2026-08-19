import { useEffect } from "react";

const DEFAULT_MESSAGE = "Discard the unsaved Court report?";

export function useUnsavedChangesGuard(
  active: boolean,
  message = DEFAULT_MESSAGE,
) {
  useEffect(() => {
    if (!active) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const followLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const link = (event.target as Element | null)?.closest(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    let restoringHistory = false;
    const followHistory = () => {
      if (restoringHistory) {
        restoringHistory = false;
        return;
      }
      if (window.confirm(message)) return;
      restoringHistory = true;
      window.history.forward();
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", followHistory);
    document.addEventListener("click", followLink, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", followHistory);
      document.removeEventListener("click", followLink, true);
    };
  }, [active, message]);
}
